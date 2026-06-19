import { Transaction } from '@mysten/sui/transactions';
import { ServiceDefinition } from '../ServiceDefinition.js';
import { createSuiClient } from '../../../config.js';

const client = createSuiClient();

export const suiTxService: ServiceDefinition = {
  id: 'sui_tx',
  name: 'Sui Transaction Service',
  description: 'Build, simulate, and execute Sui transactions',
  category: 'sui',
  requiresAuth: true,
  requiresFunds: true,
  methods: ['buildTransferTx', 'buildMoveCallTx', 'simulateTx', 'estimateGas', 'executeTx'],
  async execute(method, params, _context) {
    switch (method) {
      case 'buildTransferTx': {
        const { to, amount, assetType } = params;
        const tx = new Transaction();
        if (assetType && assetType !== 'SUI') {
          const [coin] = tx.splitCoins(tx.gas, [amount]);
          tx.transferObjects([coin], to);
        } else {
          const [coin] = tx.splitCoins(tx.gas, [amount]);
          tx.transferObjects([coin], to);
        }
        return { txBytes: tx.serialize() };
      }
      case 'buildMoveCallTx': {
        const { target, args, typeArgs } = params;
        const tx = new Transaction();
        tx.moveCall({
          target: target as `${string}::${string}::${string}`,
          arguments: (args || []).map((a: any) => tx.object(a)),
          typeArguments: typeArgs || [],
        });
        return { txBytes: tx.serialize() };
      }
      case 'simulateTx': {
        const { txBytes, sender } = params;
        const result = await client.simulateTransaction({
          transaction: txBytes,
          include: { effects: true },
        });
        return { result, sender };
      }
      case 'estimateGas': {
        const { tx } = params;
        const result = await client.simulateTransaction({
          transaction: tx,
          include: { effects: true },
        });
        const effects = result.$kind === 'Transaction' ? result.Transaction.effects : result.FailedTransaction.effects;
        return {
          gasUsed: effects.gasUsed,
          computationCost: effects.gasUsed.computationCost,
          storageCost: effects.gasUsed.storageCost,
          storageRebate: effects.gasUsed.storageRebate,
        };
      }
      case 'executeTx': {
        const { txBytes, signatures, sender } = params;
        if (!txBytes || !signatures) {
          return { error: 'txBytes and signatures are required' };
        }
        const result = await client.executeTransaction({
          transaction: txBytes,
          signatures: Array.isArray(signatures) ? signatures : [signatures],
          include: { effects: true, events: true },
        });
        const txResult = result.$kind === 'Transaction' ? result.Transaction : result.FailedTransaction;
        if (result.$kind === 'Transaction') {
          await client.waitForTransaction({ digest: txResult.digest });
        }
        return {
          digest: txResult.digest,
          status: result.$kind === 'Transaction' ? 'success' : 'failed',
          effects: txResult.effects,
          events: result.$kind === 'Transaction' ? txResult.events : undefined,
          sender,
        };
      }
      default:
        throw new Error(`Method '${method}' not found on sui_tx service`);
    }
  },
};
