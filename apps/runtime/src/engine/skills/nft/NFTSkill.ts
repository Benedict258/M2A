import { Transaction } from '@mysten/sui/transactions';
import { SkillDefinition, SkillResult, SkillParams, ExecutionContext } from '../SkillDefinition.js';
import { skillRegistry } from '../SkillRegistry.js';
import { createSuiClient } from '../../../config.js';

const client = createSuiClient();

export const nftSkill: SkillDefinition = {
  id: 'nft',
  name: 'NFT Operations',
  description: 'Mint and transfer NFTs on Sui blockchain',
  category: 'nft',
  subcategory: 'mint',
  protocols: ['sui'],
  requiredTools: ['sui-tx'],
  requiredServices: ['sui-rpc'],
  requiresFunds: true,
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['mint', 'transfer'], description: 'NFT action' },
      collection: { type: 'string', description: 'NFT collection package ID or contract address' },
      name: { type: 'string', description: 'NFT name' },
      description: { type: 'string', description: 'NFT description' },
      url: { type: 'string', description: 'NFT metadata URL / image URL' },
      recipient: { type: 'string', description: 'Recipient address (for transfer)' },
      nftId: { type: 'string', description: 'NFT object ID (for transfer)' },
    },
    required: ['action'],
  },
  async execute(params: SkillParams, context: ExecutionContext): Promise<SkillResult> {
    try {
      const { action, collection, name, description, url, recipient, nftId } = params;

      if (action === 'mint') {
        const tx = new Transaction();
        tx.moveCall({
          target: `${collection || '0x2::nft::mint'}` as `${string}::${string}::${string}`,
          arguments: [
            tx.pure.string(name || 'NFT'),
            tx.pure.string(description || ''),
            tx.pure.string(url || ''),
          ],
        });
        tx.setSender(context.agentWallet.address);

        const txBytes = await tx.build({ client });
        const result = await client.simulateTransaction({
          transaction: txBytes,
          include: { effects: true },
        });

        const txResult = result.$kind === 'Transaction' ? result.Transaction : result.FailedTransaction;

        return {
          success: result.$kind === 'Transaction' && txResult.effects?.status?.success === true,
          data: {
            action: 'mint',
            txDigest: txResult.digest,
            transaction: tx.serialize(),
            effects: txResult.effects,
          },
        };
      }

      if (action === 'transfer') {
        if (!nftId || !recipient) {
          return { success: false, error: 'nftId and recipient required for transfer' };
        }
        const tx = new Transaction();
        tx.transferObjects([tx.object(nftId)], tx.pure.address(recipient));
        tx.setSender(context.agentWallet.address);

        const txBytes = await tx.build({ client });
        const result = await client.simulateTransaction({
          transaction: txBytes,
          include: { effects: true },
        });

        const txResult = result.$kind === 'Transaction' ? result.Transaction : result.FailedTransaction;

        return {
          success: result.$kind === 'Transaction' && txResult.effects?.status?.success === true,
          data: {
            action: 'transfer',
            nftId,
            recipient,
            txDigest: txResult.digest,
            transaction: tx.serialize(),
            effects: txResult.effects,
          },
        };
      }

      return { success: false, error: `Unknown action: ${action}` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

skillRegistry.register(nftSkill);
