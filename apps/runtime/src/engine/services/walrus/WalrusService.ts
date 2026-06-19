import { ServiceDefinition } from '../ServiceDefinition.js';
import { walrusPublisherUrl, walrusAggregatorUrl, suiNetwork, createWalrusClient } from '../../../config.js';

const PUBLISHER_URL = walrusPublisherUrl();
const AGGREGATOR_URL = walrusAggregatorUrl();

async function storeBlobTestnet(content: string, contentType: string, epochs: number) {
  const url = new URL(`${PUBLISHER_URL}/v1/blobs`);
  url.searchParams.set('epochs', String(epochs));
  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: content,
  });
  if (!response.ok) {
    throw new Error(`Walrus store failed: ${response.statusText}`);
  }
  return response.json();
}

async function storeBlobMainnet(content: string, owner: string) {
  const client = createWalrusClient();
  const blob = new TextEncoder().encode(content);
  const flow = client.writeBlobFlow({ blob });
  const { blobId } = await flow.encode();
  const tx = flow.register({ epochs: 200, deletable: false, owner });
  return { blobId, txBytes: tx.serialize() };
}

export const walrusService: ServiceDefinition = {
  id: 'walrus',
  name: 'Walrus Storage Service',
  description: 'Store and retrieve blobs on Walrus decentralized storage',
  category: 'storage',
  requiresAuth: false,
  requiresFunds: true,
  methods: ['storeBlob', 'readBlob', 'readByObjectId', 'deleteBlob'],
  async execute(method, params, _context) {
    switch (method) {
      case 'storeBlob': {
        const { content, contentType = 'application/octet-stream', epochs = 1, owner } = params;
        if (suiNetwork() === 'mainnet') {
          return await storeBlobMainnet(content, owner || '');
        }
        return await storeBlobTestnet(content, contentType, epochs);
      }
      case 'readBlob': {
        const { blobId } = params;
        const response = await fetch(`${AGGREGATOR_URL}/v1/blobs/${blobId}`);
        if (!response.ok) {
          throw new Error(`Walrus read failed: ${response.statusText}`);
        }
        const content = await response.text();
        return { blobId, content };
      }
      case 'readByObjectId': {
        const { objectId } = params;
        const response = await fetch(`${AGGREGATOR_URL}/v1/blobs/by-object-id/${objectId}`);
        if (!response.ok) {
          throw new Error(`Walrus read by object ID failed: ${response.statusText}`);
        }
        const content = await response.text();
        return { objectId, content };
      }
      case 'deleteBlob': {
        const { blobId, objectId } = params;
        const id = blobId || objectId;
        if (!id) throw new Error('Either blobId or objectId is required');
        const response = await fetch(`${PUBLISHER_URL}/v1/blobs/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Walrus delete failed: ${response.statusText}`);
        }
        const result = await response.json();
        return result;
      }
      default:
        throw new Error(`Method '${method}' not found on walrus service`);
    }
  },
};
