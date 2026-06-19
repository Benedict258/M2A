import { ServiceDefinition } from '../ServiceDefinition.js';
import { createSuiClient } from '../../../config.js';

const client = createSuiClient();

export const suiQueryService: ServiceDefinition = {
  id: 'sui_query',
  name: 'Sui Query Service',
  description: 'Query the Sui blockchain for objects, transactions, balances',
  category: 'sui',
  requiresAuth: false,
  requiresFunds: false,
  methods: ['getObject', 'getTransaction', 'getBalance', 'listBalances', 'listOwnedObjects', 'getReferenceGasPrice', 'listCoins'],
  async execute(method, params, _context) {
    switch (method) {
      case 'getObject':
        return await client.getObject({ objectId: params.objectId, include: { content: true, display: true } });
      case 'getTransaction':
        return await client.getTransaction({ digest: params.digest, include: { effects: true, events: true } });
      case 'getBalance':
        return await client.getBalance({ owner: params.owner, coinType: params.coinType });
      case 'listBalances':
        return await client.listBalances({ owner: params.owner });
      case 'listOwnedObjects':
        return await client.listOwnedObjects({ owner: params.owner });
      case 'getReferenceGasPrice':
        return await client.getReferenceGasPrice();
      case 'listCoins':
        return await client.listCoins({ owner: params.owner, coinType: params.coinType, cursor: params.cursor, limit: params.limit });
      default:
        throw new Error(`Method '${method}' not found on sui_query service`);
    }
  },
};
