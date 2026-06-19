import { Transaction } from '@mysten/sui/transactions';
import { SkillDefinition, SkillResult, SkillParams, ExecutionContext } from '../SkillDefinition.js';
import { skillRegistry } from '../SkillRegistry.js';
import { createSuiClient, cetusIntegratePackage, cetusGlobalConfigId, SUI_CLOCK } from '../../../config.js';

const client = createSuiClient();

const DEFAULT_SLIPPAGE = 0.005;
const MAX_SQRT_PRICE = '79226673515401279992447579055';

export const cetusSwapSkill: SkillDefinition = {
  id: 'cetus-swap',
  name: 'Cetus Swap',
  description: 'Execute a token swap on Cetus DEX',
  category: 'defi',
  subcategory: 'trading',
  protocols: ['cetus'],
  requiredTools: ['sui-tx'],
  requiredServices: ['cetus', 'sui-rpc'],
  requiresFunds: true,
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['swap'], description: 'Swap action' },
      fromCoin: { type: 'string', description: 'Input coin type (e.g., 0x2::sui::SUI)' },
      toCoin: { type: 'string', description: 'Output coin type' },
      amount: { type: 'string', description: 'Amount in MIST (as string for precision)' },
      slippage: { type: 'number', description: 'Slippage tolerance (e.g. 0.005 for 0.5%)' },
      poolId: { type: 'string', description: 'Cetus pool ID' },
      a2b: { type: 'boolean', description: 'true = swap fromCoin->toCoin, false = reverse' },
      byAmountIn: { type: 'boolean', description: 'true = exact input, false = exact output' },
    },
    required: ['action', 'fromCoin', 'toCoin', 'amount', 'poolId'],
  },
  async execute(params: SkillParams, context: ExecutionContext): Promise<SkillResult> {
    try {
      const { action, fromCoin, toCoin, amount, slippage, poolId, a2b = true, byAmountIn = true } = params;

      if (action !== 'swap') {
        return { success: false, error: `Unknown action: ${action}` };
      }

      const effectiveSlippage = slippage ?? DEFAULT_SLIPPAGE;
      const amountVal = BigInt(amount);
      const amountLimit = byAmountIn
        ? BigInt(Math.floor(Number(amountVal) * (1 - effectiveSlippage)))
        : BigInt(Math.ceil(Number(amountVal) * (1 + effectiveSlippage)));

      const tx = new Transaction();

      const coinA = fromCoin;
      const coinB = toCoin;
      const swapFn = a2b ? 'swap_a2b' : 'swap_b2a';

      const inputCoin = tx.splitCoins(tx.gas, [tx.pure.u64(amountVal)]);
      const coinVector = tx.makeMoveVec({ elements: [inputCoin] });
      const emptyVector = tx.makeMoveVec({ type: `0x2::coin::Coin<${a2b ? coinB : coinA}>`, elements: [] });

      tx.moveCall({
        target: `${cetusIntegratePackage()}::pool_script_v2::${swapFn}`,
        typeArguments: [coinA, coinB],
        arguments: [
          tx.object(cetusGlobalConfigId()),
          tx.object(poolId),
          a2b ? coinVector : emptyVector,
          a2b ? emptyVector : coinVector,
          tx.pure.bool(byAmountIn),
          tx.pure.u64(amountVal),
          tx.pure.u64(amountLimit),
          tx.pure.u128(MAX_SQRT_PRICE),
          tx.object(SUI_CLOCK),
        ],
      });

      tx.setSender(context.agentWallet.address);

      const txBytes = await tx.build({ client });
      const result = await client.simulateTransaction({ transaction: txBytes, include: { effects: true, balanceChanges: true } });

      if (result.$kind !== 'Transaction') {
        return { success: false, error: 'Transaction simulation failed', data: { digest: result.FailedTransaction.digest } };
      }

      const txResult = result.Transaction;
      const success = txResult.status.success === true;

      return {
        success,
        data: {
          action: 'swap',
          fromCoin,
          toCoin,
          amount: amountVal.toString(),
          poolId,
          a2b,
          slippage: effectiveSlippage,
          byAmountIn,
          amountLimit: amountLimit.toString(),
          txDigest: txResult.digest,
          transaction: tx.serialize(),
          balanceChanges: txResult.balanceChanges ?? [],
        },
        error: success ? undefined : (txResult.status.error?.message ?? 'Swap failed'),
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

skillRegistry.register(cetusSwapSkill);
