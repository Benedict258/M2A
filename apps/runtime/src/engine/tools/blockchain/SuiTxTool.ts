import { M2ATool, toolRegistry } from '../ToolRegistry.js';
import { Transaction } from '@mysten/sui/transactions';

export const suiTxTool: M2ATool = {
  name: 'sui_tx_tool',
  description: 'Builds Sui transactions for transfers and Move calls.',
  parameters: {
    type: 'object',
    properties: {
      method: {
        type: 'string',
        description: 'Transaction method to build',
        enum: ['buildTransferTx', 'buildMoveCallTx'],
      },
      params: { type: 'object', description: 'Arguments for the transaction builder' },
    },
    required: ['method', 'params'],
  },
  execute: async ({ method, params }) => {
    console.log(`[SuiTxTool] Method: ${method}`);
    try {
      const tx = new Transaction();
      let result;

      switch (method) {
        case 'buildTransferTx': {
          const { recipient, amount, coinType = '0x2::sui::SUI' } = params;
          const coin = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
          tx.transferObjects([coin], tx.pure.address(recipient));
          result = { txDigest: tx.getDigest(), transaction: tx.serialize() };
          break;
        }
        case 'buildMoveCallTx': {
          const { target, arguments: callArgs = [], typeArguments = [] } = params;
          tx.moveCall({ target, arguments: callArgs, typeArguments });
          result = { txDigest: tx.getDigest(), transaction: tx.serialize() };
          break;
        }
        default:
          throw new Error(`Unsupported transaction method: ${method}`);
      }

      return { result };
    } catch (e: any) {
      return { error: e.message };
    }
  },
};

toolRegistry.registerTool(suiTxTool);
