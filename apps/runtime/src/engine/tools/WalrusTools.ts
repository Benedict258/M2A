import { M2ATool, toolRegistry } from './ToolRegistry.js';
import { walrusSidecarUrl, walrusAggregatorUrl, walrusPublisherUrl, suiNetwork, createWalrusClient } from '../../config.js';

const SIDECAR_URL = walrusSidecarUrl();

export const storeToWalrus: M2ATool = {
  name: 'store_to_walrus',
  description: 'Stores a blob of text or data to Walrus decentralized storage. Returns the blobId.',
  parameters: {
    type: 'object',
    properties: {
      content: { type: 'string', description: 'The text content to store' },
      contentType: { type: 'string', description: 'MIME type of the content', default: 'text/plain' },
      owner: { type: 'string', description: 'Owner address (required on mainnet for signing)' },
    },
    required: ['content']
  },
  execute: async ({ content, contentType = 'text/plain', owner }: any) => {
    console.log('[Tools] Storing to Walrus...');
    try {
      if (suiNetwork() === 'mainnet') {
        const client = createWalrusClient();
        const blob = new TextEncoder().encode(content);
        const flow = client.writeBlobFlow({ blob });
        const encoded = await flow.encode();
        const tx = flow.register({ epochs: 200, deletable: false, owner: owner || '' });
        return {
          blobId: encoded.blobId,
          txBytes: Array.from(tx.serialize()),
          note: 'Sign and submit txBytes to complete blob registration, then call certify_blob',
        };
      }
      const response = await fetch(`${SIDECAR_URL}/store`, {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body: content
      });

      if (!response.ok) throw new Error(`Walrus store failed: ${response.statusText}`);

      const result = await response.json();
      return {
        blobId: result.blobId,
        url: `${walrusAggregatorUrl()}/v1/${result.blobId}`
      };
    } catch (e: any) {
      return { error: e.message };
    }
  }
};

export const fetchFromWalrus: M2ATool = {
  name: 'fetch_from_walrus',
  description: 'Retrieves a blob from Walrus decentralized storage by its blobId.',
  parameters: {
    type: 'object',
    properties: {
      blobId: { type: 'string', description: 'The unique identifier of the blob to fetch' }
    },
    required: ['blobId']
  },
  execute: async ({ blobId }) => {
    console.log(`[Tools] Fetching from Walrus: ${blobId}`);
    try {
      const response = await fetch(`${walrusAggregatorUrl()}/v1/${blobId}`);
      if (!response.ok) throw new Error(`Walrus fetch failed: ${response.statusText}`);

      const content = await response.text();
      return { content };
    } catch (e: any) {
      return { error: e.message };
    }
  }
};

export const deleteFromWalrus: M2ATool = {
  name: 'delete_from_walrus',
  description: 'Deletes a blob from Walrus decentralized storage by its blobId or objectId.',
  parameters: {
    type: 'object',
    properties: {
      blobId: { type: 'string', description: 'The blobId to delete' },
      objectId: { type: 'string', description: 'The objectId to delete' }
    },
    required: []
  },
  execute: async ({ blobId, objectId }) => {
    console.log('[Tools] Deleting from Walrus...');
    try {
      const id = blobId || objectId;
      if (!id) return { error: 'Either blobId or objectId is required' };
      const response = await fetch(`${walrusPublisherUrl()}/v1/blobs/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Walrus delete failed: ${response.statusText}`);
      const result = await response.json();
      return result;
    } catch (e: any) {
      return { error: e.message };
    }
  }
};

toolRegistry.registerTool(storeToWalrus);
toolRegistry.registerTool(fetchFromWalrus);
toolRegistry.registerTool(deleteFromWalrus);
