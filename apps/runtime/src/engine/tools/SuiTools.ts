import { M2ATool, toolRegistry } from './ToolRegistry.js';
import { createSuiClient } from '../../config.js';

const client = createSuiClient();

export const suiQuery: M2ATool = {
  name: 'sui_query',
  description: 'Queries the Sui blockchain for object details, transaction info, or account balances.',
  parameters: {
    type: 'object',
    properties: {
      method: { 
        type: 'string', 
        description: 'Sui RPC method to call', 
        enum: ['getObject', 'getTransactionBlock', 'getCoins', 'getBalance', 'getOwnedObjects']
      },
      params: { type: 'object', description: 'Arguments for the RPC method' }
    },
    required: ['method', 'params']
  },
  execute: async ({ method, params }) => {
    console.log(`[Tools] Sui Query: ${method}`);
    try {
      let result;
      switch (method) {
        case 'getObject':
          result = await client.getObject({ objectId: params.id, include: { content: true, display: true } });
          break;
        case 'getTransactionBlock':
          result = await client.getTransaction({ digest: params.digest, include: { effects: true, events: true } });
          break;
        case 'getCoins':
          result = await client.listCoins({ owner: params.owner, coinType: params.coinType });
          break;
        case 'getBalance':
          result = await client.getBalance({ owner: params.owner, coinType: params.coinType });
          break;
        case 'getOwnedObjects':
          result = await client.listOwnedObjects({ owner: params.owner });
          break;
        default:
          throw new Error(`Unsupported Sui RPC method: ${method}`);
      }
      return { result };
    } catch (e: any) {
      return { error: e.message };
    }
  }
};

toolRegistry.registerTool(suiQuery);
