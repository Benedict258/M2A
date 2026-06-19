import { Transaction } from '@mysten/sui/transactions';
import {
  DeepBookClient,
  testnetPackageIds, testnetCoins, testnetPools, testnetMarginPools,
  mainnetPackageIds, mainnetCoins, mainnetPools, mainnetMarginPools,
} from '@mysten/deepbook-v3';
import { SkillDefinition, SkillResult, SkillParams, ExecutionContext } from '../../SkillDefinition.js';
import { skillRegistry } from '../../SkillRegistry.js';
import { createSuiClient, deepBookPackageId } from '../../../../config.js';

const suiClient = createSuiClient();

export const deepBookLendSkill: SkillDefinition = {
  id: 'defi-deepbook-lend',
  name: 'DeepBook Lending',
  description: 'Deposit, borrow, and repay on DeepBook margin pools',
  category: 'defi',
  subcategory: 'lending',
  protocols: ['deepbook'],
  requiredTools: ['sui-tx'],
  requiredServices: ['deepbook', 'sui-rpc'],
  requiresFunds: true,
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['deposit', 'withdraw', 'borrow', 'repay'], description: 'Lending action' },
      coinKey: { type: 'string', description: 'Coin key (e.g. SUI, DBUSDC, DEEP)' },
      amount: { type: 'number', description: 'Amount in MIST' },
      poolKey: { type: 'string', description: 'Pool key (e.g. SUI_DBUSDC) for margin manager ops' },
      assetType: { type: 'string', enum: ['base', 'quote'], description: 'Asset type for borrow/repay' },
      supplierCapId: { type: 'string', description: 'Supplier cap object ID (for deposit/withdraw)' },
      marginManagerKey: { type: 'string', description: 'Margin manager key (for borrow/repay)' },
    },
    required: ['action'],
  },
  async execute(params: SkillParams, context: ExecutionContext): Promise<SkillResult> {
    try {
      const { action, coinKey, amount, poolKey, assetType = 'base', supplierCapId, marginManagerKey } = params;

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
        case 'deposit': {
          if (!coinKey || !amount) {
            return { success: false, error: 'coinKey and amount required for deposit' };
          }
          let supplierCap;
          if (supplierCapId) {
            supplierCap = tx.object(supplierCapId);
          } else {
            supplierCap = dbClient.marginPool.mintSupplierCap()(tx);
          }
          dbClient.marginPool.supplyToMarginPool(coinKey, supplierCap, Number(amount))(tx);
          break;
        }
        case 'withdraw': {
          if (!coinKey || !supplierCapId) {
            return { success: false, error: 'coinKey and supplierCapId required for withdraw' };
          }
          const amountToWithdraw = amount ? Number(amount) : undefined;
          dbClient.marginPool.withdrawFromMarginPool(coinKey, tx.object(supplierCapId), amountToWithdraw)(tx);
          break;
        }
        case 'borrow': {
          if (!poolKey || !marginManagerKey || !amount) {
            return { success: false, error: 'poolKey, marginManagerKey, and amount required for borrow' };
          }
          if (assetType === 'base') {
            dbClient.marginManager.borrowBase(marginManagerKey, Number(amount))(tx);
          } else {
            dbClient.marginManager.borrowQuote(marginManagerKey, Number(amount))(tx);
          }
          break;
        }
        case 'repay': {
          if (!poolKey || !marginManagerKey) {
            return { success: false, error: 'poolKey and marginManagerKey required for repay' };
          }
          const repayAmount = amount ? Number(amount) : undefined;
          if (assetType === 'base') {
            dbClient.marginManager.repayBase(marginManagerKey, repayAmount)(tx);
          } else {
            dbClient.marginManager.repayQuote(marginManagerKey, repayAmount)(tx);
          }
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
          protocol: 'deepbook',
          action,
          coinKey: coinKey || poolKey,
          amount: amount ?? null,
          assetType,
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

skillRegistry.register(deepBookLendSkill);
