import { M2ATool, toolRegistry } from '../ToolRegistry.js';
import { createSuiClient } from '../../../config.js';

const client = createSuiClient();

export const suiQueryTool: M2ATool = {
  name: 'sui_query_tool',
  description: 'Queries the Sui blockchain for object details, transaction info, or account balances.',
  parameters: {
    type: 'object',
    properties: {
      method: {
        type: 'string',
        description: 'Sui RPC method to call',
        enum: ['getObject', 'getTransaction', 'getBalance', 'listOwnedObjects'],
      },
      params: { type: 'object', description: 'Arguments for the RPC method' },
    },
    required: ['method', 'params'],
  },
  execute: async ({ method, params }) => {
    console.log(`[SuiQueryTool] Method: ${method}`);
    try {
      let result;
      switch (method) {
        case 'getObject':
          result = await client.getObject({ objectId: params.id, include: { content: true, display: true } });
          break;
        case 'getTransaction':
          result = await client.getTransaction({ digest: params.digest, include: { effects: true, events: true } });
          break;
        case 'getBalance':
          result = await client.getBalance({ owner: params.owner, coinType: params.coinType });
          break;
        case 'listOwnedObjects':
          result = await client.listOwnedObjects({ owner: params.owner });
          break;
        default:
          throw new Error(`Unsupported Sui RPC method: ${method}`);
      }
      return { result };
    } catch (e: any) {
      return { error: e.message };
    }
  },
};

toolRegistry.registerTool(suiQueryTool);
