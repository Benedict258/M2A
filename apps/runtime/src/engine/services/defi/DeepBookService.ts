import { Transaction } from '@mysten/sui/transactions';
import { ServiceDefinition } from '../ServiceDefinition.js';
import { createSuiClient, deepBookPackageId } from '../../../config.js';

const client = createSuiClient();

export const deepBookService: ServiceDefinition = {
  id: 'deepbook',
  name: 'DeepBook Service',
  description: 'Interact with the DeepBook order-book DEX on Sui',
  category: 'defi',
  requiresAuth: true,
  requiresFunds: true,
  methods: ['getPoolInfo', 'getOrderBook', 'estimateSwap', 'buildSwapTx'],
  async execute(method, params, _context) {
    switch (method) {
      case 'getPoolInfo': {
        const { poolId } = params;
        const result = await client.getObject({
          objectId: poolId,
          include: { json: true },
        });
        return { pool: result.object.json };
      }
      case 'getOrderBook': {
        const { poolId } = params;
        const result = await client.getObject({
          objectId: poolId,
          include: { json: true },
        });
        return { orderBook: result.object.json };
      }
      case 'estimateSwap': {
        const { poolId, amount, side } = params;
        const tx = new Transaction();
        tx.moveCall({
          target: `${deepBookPackageId()}::pool::estimate_swap`,
          arguments: [tx.object(poolId), tx.pure.u64(amount)],
          typeArguments: [],
        });
        const result = await client.simulateTransaction({
          transaction: tx,
          include: { commandResults: true },
        });
        return {
          estimatedOutput: result.commandResults?.[0]?.returnValues?.[0]?.bcs,
          poolId,
          amount,
          side,
        };
      }
      case 'buildSwapTx': {
        const { poolId, amount, side, minOutput, wallet } = params;
        const tx = new Transaction();
        const [coin] = tx.splitCoins(tx.gas, [amount]);
        tx.moveCall({
          target: `${deepBookPackageId()}::pool::swap`,
          arguments: [
            tx.object(poolId),
            coin,
            tx.pure.u64(minOutput),
          ],
          typeArguments: [],
        });
        tx.setSender(wallet?.address || '');
        return { txBytes: tx.serialize() };
      }
      default:
        throw new Error(`Method '${method}' not found on deepbook service`);
    }
  },
};
