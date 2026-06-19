import { Transaction } from '@mysten/sui/transactions';
import { SkillDefinition, SkillResult, SkillParams, ExecutionContext } from '../../SkillDefinition.js';
import { skillRegistry } from '../../SkillRegistry.js';
import { createSuiClient, cetusIntegratePackage, cetusGlobalConfigId, SUI_CLOCK } from '../../../../config.js';

const client = createSuiClient();

const MAX_SQRT_PRICE = '79226673515401279992447579055';
const MIN_SQRT_PRICE = '4295048016';

export const cetusLendSkill: SkillDefinition = {
  id: 'cetus-lend',
  name: 'Cetus Lending',
  description: 'Deposit, withdraw, borrow, and repay on Cetus protocol',
  category: 'defi',
  subcategory: 'lending',
  protocols: ['cetus'],
  requiredTools: ['sui-tx'],
  requiredServices: ['cetus', 'sui-rpc'],
  requiresFunds: true,
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['deposit', 'withdraw', 'borrow', 'repay'],
        description: 'Lending action',
      },
      amount: { type: 'string', description: 'Amount in MIST (as string for precision)' },
      poolId: { type: 'string', description: 'Cetus pool ID' },
      coinTypeA: { type: 'string', description: 'Coin type A (e.g., 0x2::sui::SUI)' },
      coinTypeB: { type: 'string', description: 'Coin type B' },
      positionId: { type: 'string', description: 'Position NFT ID (required for withdraw)' },
      tickLower: { type: 'number', description: 'Lower tick index', default: -443636 },
      tickUpper: { type: 'number', description: 'Upper tick index', default: 443636 },
    },
    required: ['action', 'amount', 'poolId', 'coinTypeA', 'coinTypeB'],
  },
  async execute(params: SkillParams, context: ExecutionContext): Promise<SkillResult> {
    try {
      const { action, amount, poolId, coinTypeA, coinTypeB, positionId, tickLower = -443636, tickUpper = 443636 } = params;

      if (!['deposit', 'withdraw', 'borrow', 'repay'].includes(action)) {
        return { success: false, error: `Unknown action: ${action}` };
      }

      if (action === 'borrow' || action === 'repay') {
        return {
          success: true,
          data: {
            protocol: 'cetus',
            action,
            note: 'Cetus is a CLMM DEX - borrow/repay operations are not natively supported. Use deposit/withdraw for liquidity provision on Cetus, or use a dedicated lending protocol (NAVI, Suilend, DeepBook).',
            poolId,
            amount,
            simulated: true,
          },
        };
      }

      const amountVal = BigInt(amount);
      const tx = new Transaction();

      if (action === 'deposit') {
        const inputCoin = tx.splitCoins(tx.gas, [tx.pure.u64(amountVal)]);
        const coinVector = tx.makeMoveVec({ elements: [inputCoin] });
        const emptyVector = tx.makeMoveVec({ type: `0x2::coin::Coin<${coinTypeB}>`, elements: [] });

        tx.moveCall({
          target: `${cetusIntegratePackage()}::pool_script_v2::open_position_with_liquidity`,
          typeArguments: [coinTypeA, coinTypeB],
          arguments: [
            tx.object(cetusGlobalConfigId()),
            tx.object(poolId),
            tx.pure.u32(tickLower),
            tx.pure.u32(tickUpper),
            coinVector,
            emptyVector,
            tx.pure.u64(amountVal),
            tx.pure.u64(0n),
            tx.pure.u128(1n),
            tx.object(SUI_CLOCK),
          ],
        });
      } else if (action === 'withdraw') {
        if (!positionId) {
          return { success: false, error: 'positionId is required for withdraw' };
        }
        tx.moveCall({
          target: `${cetusIntegratePackage()}::pool_script::close_position`,
          typeArguments: [coinTypeA, coinTypeB],
          arguments: [
            tx.object(cetusGlobalConfigId()),
            tx.object(poolId),
            tx.object(positionId),
            tx.pure.u64(0n),
            tx.pure.u64(0n),
            tx.object(SUI_CLOCK),
          ],
        });
      }

      tx.setSender(context.agentWallet.address);

      const txBytes = await tx.build({ client });
      const result = await client.simulateTransaction({ transaction: txBytes, include: { effects: true } });

      if (result.$kind !== 'Transaction') {
        return { success: false, error: 'Transaction simulation failed', data: { digest: result.FailedTransaction.digest } };
      }

      const txResult = result.Transaction;
      const success = txResult.status.success === true;

      return {
        success,
        data: {
          protocol: 'cetus',
          action,
          poolId,
          amount: amountVal.toString(),
          coinTypeA,
          coinTypeB,
          positionId,
          txDigest: txResult.digest,
          transaction: tx.serialize(),
        },
        error: success ? undefined : (txResult.status.error?.message ?? `${action} failed`),
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

skillRegistry.register(cetusLendSkill);
