import { Transaction } from '@mysten/sui/transactions';
import {
  DeepBookClient,
  testnetPackageIds, testnetCoins, testnetPools,
  mainnetPackageIds, mainnetCoins, mainnetPools,
} from '@mysten/deepbook-v3';
import { SkillDefinition, SkillResult, SkillParams, ExecutionContext } from '../SkillDefinition.js';
import { skillRegistry } from '../SkillRegistry.js';
import { createSuiClient, deepBookPackageId } from '../../../config.js';

const suiClient = createSuiClient();

export const deepBookTradeSkill: SkillDefinition = {
  id: 'defi-deepbook-trade',
  name: 'DeepBook Trade',
  description: 'Execute a swap or order on DeepBook DEX',
  category: 'defi',
  subcategory: 'trading',
  protocols: ['deepbook'],
  requiredTools: ['sui-tx'],
  requiredServices: ['deepbook', 'sui-rpc'],
  requiresFunds: true,
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['swap', 'limit_order', 'cancel_order'], description: 'Trade action' },
      pool: { type: 'string', description: 'Pool key (e.g. SUI_DBUSDC, DEEP_SUI)' },
      amount: { type: 'number', description: 'Amount in MIST' },
      side: { type: 'string', enum: ['buy', 'sell'], description: 'Trade side' },
      minOut: { type: 'number', description: 'Minimum output amount (slippage)' },
      price: { type: 'number', description: 'Limit price (for limit orders)' },
      orderId: { type: 'string', description: 'Order ID to cancel' },
      balanceManagerKey: { type: 'string', description: 'Balance manager key for order ops' },
    },
    required: ['action'],
  },
  async execute(params: SkillParams, context: ExecutionContext): Promise<SkillResult> {
    try {
      const { action, pool: poolKey, amount, side, minOut, price, orderId, balanceManagerKey } = params;

      const network = context.network === 'mainnet' ? 'mainnet' : 'testnet';
      const basePackageIds = network === 'mainnet' ? mainnetPackageIds : testnetPackageIds;
      const coins = network === 'mainnet' ? mainnetCoins : testnetCoins;
      const pools = network === 'mainnet' ? mainnetPools : testnetPools;
      const overridePkg = deepBookPackageId();
      const packageIds = overridePkg ? { ...basePackageIds, deepBook: overridePkg } : basePackageIds;

      const dbClient = new DeepBookClient({
        client: suiClient,
        address: context.agentWallet.address,
        network,
        packageIds,
        coins,
        pools,
      });

      const tx = new Transaction();

      switch (action) {
        case 'swap': {
          if (!poolKey || !amount || !side) {
            return { success: false, error: 'pool, amount, and side are required for swap' };
          }
          const isBaseToCoin = side === 'sell';
          const deepAmount = Math.floor(Number(amount) * 0.001);
          const minOutValue = minOut ?? Math.floor(Number(amount) * 0.98);

          dbClient.deepBook.swapExactQuantity({
            poolKey,
            amount: Number(amount),
            deepAmount,
            minOut: minOutValue,
            isBaseToCoin,
          })(tx);
          break;
        }
        case 'limit_order': {
          if (!poolKey || !amount || !price || !side || !balanceManagerKey) {
            return { success: false, error: 'pool, amount, price, side, and balanceManagerKey required for limit_order' };
          }
          dbClient.deepBook.placeLimitOrder({
            poolKey,
            balanceManagerKey,
            clientOrderId: Date.now().toString(),
            price: Number(price),
            quantity: Number(amount),
            isBid: side === 'buy',
          })(tx);
          break;
        }
        case 'cancel_order': {
          if (!poolKey || !orderId || !balanceManagerKey) {
            return { success: false, error: 'pool, orderId, and balanceManagerKey required for cancel_order' };
          }
          dbClient.deepBook.cancelOrder(poolKey, balanceManagerKey, orderId)(tx);
          break;
        }
        default:
          return { success: false, error: `Unknown action: ${action}` };
      }

      tx.setSender(context.agentWallet.address);
      const txBytes = await tx.build({ client: suiClient });
      const result = await suiClient.simulateTransaction({ transaction: txBytes, include: { effects: true } });

      if (result.$kind !== 'Transaction') {
        return { success: false, error: 'Transaction simulation failed', data: { digest: result.FailedTransaction.digest } };
      }

      const txResult = result.Transaction;
      return {
        success: txResult.status.success === true,
        data: {
          action,
          pool: poolKey,
          txDigest: txResult.digest,
          transaction: tx.serialize(),
          effects: txResult.effects,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

skillRegistry.register(deepBookTradeSkill);
