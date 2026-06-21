import { WorkflowNode } from '@m2a/sdk';


import { suiQuery } from './tools/SuiTools.js';
import { aftermathService } from './services/defi/AftermathService.js';
import { naviService } from './services/defi/NaviService.js';
import { suilendService } from './services/defi/SuilendService.js';
import { haedalService } from './services/defi/HaedalService.js';
import { voloService } from './services/defi/VoloService.js';
import { bucketService } from './services/defi/BucketService.js';
import { wormholeService } from './services/bridge/WormholeService.js';
import { suiBridgeService } from './services/bridge/SuiBridgeService.js';
import { alphaFiService } from './services/defi/AlphaFiService.js';
import { bluefinService } from './services/defi/BluefinService.js';
import { pythService } from './services/PythService.js';
import { switchboardService } from './services/SwitchboardService.js';
import { tradeportService } from './services/nft/TradePortService.js';
import { eventTriggerService } from './services/EventTriggerService.js';
import { storeToWalrus, fetchFromWalrus } from './tools/WalrusTools.js';
import { deepBookService } from './services/defi/DeepBookService.js';
import { cetusService } from './services/defi/CetusService.js';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64, fromHex } from '@mysten/sui/utils';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { createSuiClient } from '../config.js';

const execClient = createSuiClient();

async function trySubmitTx(txBytes: string, delegateKey: string): Promise<{ digest?: string; error?: string }> {
  try {
    let secretKeyBytes: Uint8Array;
    if (delegateKey.startsWith('suiprivkey')) {
      secretKeyBytes = decodeSuiPrivateKey(delegateKey).secretKey;
    } else if (/^[0-9a-fA-F]{64}$/.test(delegateKey)) {
      secretKeyBytes = fromHex(delegateKey);
    } else {
      return { error: 'delegate key is not a private key' };
    }
    const keypair = Ed25519Keypair.fromSecretKey(secretKeyBytes);
    const { signature } = await keypair.signTransaction(fromBase64(txBytes));
    const result = await execClient.executeTransaction({
      transaction: fromBase64(txBytes),
      signatures: [signature],
      include: { effects: true, events: true },
    });
    if (result.$kind !== 'Transaction') {
      return { error: 'Transaction execution failed', digest: result.FailedTransaction.digest };
    }
    return { digest: result.Transaction.digest };
  } catch (e: any) {
    return { error: e.message };
  }
}

export interface NodeHandlerResult {
  output: string;
  metadata?: Record<string, unknown>;
}

export interface NodeHandler {
  canHandle(node: WorkflowNode): boolean;
  execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult>;
}

export class InputNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return node.type === 'input';
  }

  async execute(_node: WorkflowNode, inputs: string[], _context: any): Promise<NodeHandlerResult> {
    return { output: inputs.join('\n') };
  }
}

export class OutputNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return node.type === 'output';
  }

  async execute(_node: WorkflowNode, inputs: string[], _context: any): Promise<NodeHandlerResult> {
    const formatted = inputs.map((inp, i) => `[${i + 1}] ${inp}`).join('\n\n');
    return { output: `Output Summary:\n${formatted}` };
  }
}

export class WalrusNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return node.type === 'walrus';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'store';

    if (action === 'fetch') {
      const blobId = (data?.blobId as string) || inputs[0] || '';
      return { output: `Walrus fetch: route through MemoryRouter recall for production use. Blob ID: ${blobId}` };
    }

    const content = inputs.join('\n') || (data?.content as string) || '';
    const sidecarUrl = process.env.WALRUS_SIDECAR_URL || 'http://localhost:9000';
    try {
      const res = await fetch(`${sidecarUrl}/walrus/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: Buffer.from(content).toString('base64'),
          keyIndex: 0,
          namespace: 'walrus_node',
          epochs: 1,
          deferTransfer: false,
        }),
      });
      if (!res.ok) throw new Error(`Sidecar upload failed: ${res.status}`);
      const result = await res.json();
      return { output: JSON.stringify(result) };
    } catch (err: any) {
      return { output: `Walrus store stub — sidecar unavailable: ${err.message}` };
    }
  }
}

export class SuiNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return node.type === 'sui';
  }

  async execute(node: WorkflowNode, _inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'get_object';
    const objectId = (data?.objectId as string) || '';
    if (!objectId) {
      return { output: JSON.stringify({ note: 'Configure an Object ID or address to query on-chain data', network: process.env.SUI_NETWORK || 'testnet' }) };
    }
    let method = 'getObject';
    let params: any = { id: objectId };
    if (action === 'get_balance') {
      method = 'getBalance';
      params = { owner: objectId };
    }
    const result = await suiQuery.execute({ method, params }, context);
    return { output: typeof result === 'string' ? result : JSON.stringify(result) };
  }
}

export class LoopNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'loop';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const maxIterations = (data?.maxIterations as number) || 100;

    let items: any[] = [];
    try {
      const parsed = JSON.parse(inputs[0] || '[]');
      items = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      items = (inputs[0] || '').split('\n').filter(Boolean);
    }

    if (items.length === 0) {
      return { output: 'Loop: No items to iterate', metadata: { itemCount: 0 } };
    }

    const limited = items.slice(0, maxIterations);
    const results: string[] = [];

    for (let i = 0; i < limited.length; i++) {
      const item = limited[i];
      const itemStr = typeof item === 'string' ? item : JSON.stringify(item);
      results.push(`[${i + 1}/${limited.length}] ${itemStr.slice(0, 200)}`);
    }

    return {
      output: results.join('\n'),
      metadata: { itemCount: items.length, processedCount: results.length, maxIterations },
    };
  }
}

export class CodeNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'code';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const code = (data?.code as string) || '';
    const language = (data?.language as string) || 'javascript';

    if (!code.trim()) {
      return { output: 'No code provided' };
    }

    try {
      let output: any;

      if (language === 'javascript') {
        const fn = new Function('input', 'inputs', 'context', `
          return (async () => {
            ${code}
          })();
        `);
        output = await fn(inputs[0] || '', inputs, context);
      } else {
        const stripped = code
          .replace(/:\s*\w+(\[\])?\s*(?==|\)|\{|,)/g, '')
          .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
          .replace(/type\s+\w+\s*=\s*[^;\n]+/g, '');

        const fn = new Function('input', 'inputs', 'context', `
          return (async () => {
            ${stripped}
          })();
        `);
        output = await fn(inputs[0] || '', inputs, context);
      }

      const resultStr = typeof output === 'string' ? output : JSON.stringify(output);
      return {
        output: resultStr,
        metadata: { language, codeLength: code.length },
      };
    } catch (err: any) {
      return { output: `Code execution error: ${err.message}` };
    }
  }
}

export class HttpNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'http' || (node as any).nodeType === 'http';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const method = (data?.method as string) || 'GET';
    const url = (data?.url as string) || inputs[0] || '';
    const headers = (data?.headers as Record<string, string>) || {};
    const body = (data?.body as string) || inputs[1] || '';

    if (!url) {
      return { output: 'Error: No URL provided for HTTP request' };
    }

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
      };
      if (method !== 'GET' && body) {
        fetchOptions.body = body;
      }

      const response = await fetch(url, fetchOptions);
      const text = await response.text();

      return {
        output: `HTTP ${method} ${url} → ${response.status}\n${text.slice(0, 2000)}`,
        metadata: { status: response.status, url, method },
      };
    } catch (err: any) {
      return { output: `HTTP Error: ${err.message}` };
    }
  }
}

export class ConditionalNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'conditional' || (node as any).nodeType === 'conditional';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const condition = (data?.condition as string) || 'true';
    const inputText = inputs[0] || '';
    const trueOutput = (data?.trueOutput as string) || 'Condition met';
    const falseOutput = (data?.falseOutput as string) || 'Condition not met';

    const isTrue = inputText.toLowerCase().includes(condition.toLowerCase()) || condition === 'true';

    const decision = {
      condition,
      input: inputText.slice(0, 200),
      result: isTrue,
      timestamp: Date.now(),
    };

    return {
      output: isTrue ? trueOutput : falseOutput,
      metadata: { decision, branch: isTrue ? 'true' : 'false' },
    };
  }
}

export class FileNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'file' || (node as any).nodeType === 'file';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'store';
    const normalizedAction = action === 'read' ? 'fetch' : action === 'write' ? 'store' : action;
    const content = inputs[0] || '';
    const blobId = (data?.blobId as string) || inputs[1] || '';

    try {
      if (normalizedAction === 'store') {
        const result = await storeToWalrus.execute({ content, contentType: 'application/json' }, context);
        return {
          output: `Stored to Walrus. Blob ID: ${result.blobId}`,
          metadata: { blobId: result.blobId },
        };
      } else if (normalizedAction === 'fetch') {
        if (!blobId) {
          return { output: 'Error: No blob ID provided for fetch' };
        }
        const result = await fetchFromWalrus.execute({ blobId }, context);
        return {
          output: typeof result === 'string' ? result : JSON.stringify(result),
          metadata: { blobId },
        };
      }

      return { output: `Unknown file action: ${action}` };
    } catch (err: any) {
      if (normalizedAction === 'store') {
        const fakeId = `blob_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        return { output: `[Stub] Stored. ID: ${fakeId}`, metadata: { blobId: fakeId } };
      }
      return { output: `[Stub] File ${normalizedAction} — Walrus unavailable: ${err.message}` };
    }

    return { output: `Unknown file action: ${action}` };
  }
}

export class AgentSpawnNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'agent_spawn' || (node as any).nodeType === 'agent_spawn';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const subAgentRole = (data?.role as string) || 'Sub-agent assistant';
    const subAgentModel = (data?.model as string) || 'llama-3.3-70b-versatile';
    const instructions = inputs[0] || 'Complete the assigned task with the provided context.';

    const subAgentNode = {
      id: `${node.id}_spawned_${Date.now()}`,
      type: 'agent',
      data: {
        label: `Sub: ${data?.label || 'Agent'}`,
        role: subAgentRole,
        model: subAgentModel,
        tools: (data?.tools as string[]) || [],
        directives: `${subAgentRole}\n\nContext from parent: ${inputs.join('\n')}`,
      },
      memory_tier: {
        read: (node as any).memory_tier?.read || [],
        write: (node as any).memory_tier?.write || [],
      },
    } as any;

    try {
      const { agentRunner } = await import('./components.js');
      const result = await (agentRunner as any).runStep(
        subAgentNode,
        instructions,
        context
      );

      return {
        output: result,
        metadata: { subAgentId: subAgentNode.id, spawned: true },
      };
    } catch (err: any) {
      return { output: `[Stub] Spawned agent executed: ${instructions.slice(0, 100)}...\n(Actual agent runner unavailable: ${err.message})` };
    }
  }
}

export class WebhookTriggerNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'webhook_trigger';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const webhookId = (data?.webhookId as string) || node.id;
    return {
      output: `Webhook endpoint ready: POST /api/v1/webhook/${webhookId}`,
      metadata: { webhookId },
    };
  }
}

export class ScheduleTriggerNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'schedule_trigger';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const cronExpression = (data?.cron as string) || '*/5 * * * *';
    const intervalMs = parseCronToMs(cronExpression) || 5 * 60 * 1000;
    return {
      output: `Scheduled: ${cronExpression} (every ${intervalMs / 1000}s)`,
      metadata: { cronExpression, intervalMs },
    };
  }
}

function parseCronToMs(cron: string): number | null {
  const parts = cron.split(' ');
  if (parts.length >= 1 && parts[0].startsWith('*/')) {
    const minutes = parseInt(parts[0].slice(2), 10);
    if (!isNaN(minutes)) return minutes * 60 * 1000;
  }
  return null;
}

export class MergeNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'merge';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const strategy = (data?.strategy as string) || 'concat';

    let output = '';
    switch (strategy) {
      case 'first':
        output = inputs[0] || '';
        break;
      case 'last':
        output = inputs[inputs.length - 1] || '';
        break;
      case 'json_array':
        output = JSON.stringify(inputs.filter(Boolean));
        break;
      case 'concat':
      default:
        output = inputs
          .filter(Boolean)
          .map((s, i) => `[Branch ${i + 1}]: ${s}`)
          .join('\n\n---\n\n');
    }

    return { output, metadata: { branchCount: inputs.length, strategy } };
  }
}

export class HaedalNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'haedal';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'stake';

    if (action === 'stake') {
      const amount = (data?.amount as string) || inputs[0] || '1';
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0) return { output: JSON.stringify({ error: `Invalid amount: ${amount}`, protocol: 'haedal' }) };
      const amountMist = (BigInt(Math.floor(parsed * 1_000_000_000))).toString();
      return { output: JSON.stringify({ protocol: 'haedal', action: 'stake', amount: `${amount} SUI` }), metadata: {} };
    }

    if (action === 'unstake') {
      const amount = (data?.amount as string) || inputs[0] || '1';
      const tx = haedalService.buildUnstakeTx({ haSuiAmount: amount, walletAddress: context.accountId });
      return { output: JSON.stringify({ protocol: 'haedal', action: 'unstake', amount: `${amount} haSUI` }), metadata: { tx } };
    }

    if (action === 'info') {
      const info = await haedalService.getStakingInfo();
      return { output: JSON.stringify(info), metadata: { protocol: 'haedal', action: 'info' } };
    }

    return { output: `Unknown Haedal action: ${action}` };
  }
}

export class VoloNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'volo';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'stake';

    if (action === 'stake') {
      const amount = (data?.amount as string) || inputs[0] || '1';
      const amountMist = (BigInt(Math.floor(parseFloat(amount) * 1_000_000_000))).toString();
      const tx = voloService.buildStakeTx({ amountMist, walletAddress: context.accountId });
      return { output: JSON.stringify({ protocol: 'volo', action: 'stake', amount: `${amount} SUI` }), metadata: { tx } };
    }

    if (action === 'unstake') {
      const amount = (data?.amount as string) || inputs[0] || '1';
      const tx = voloService.buildUnstakeTx({ vSuiAmount: amount, walletAddress: context.accountId });
      return { output: JSON.stringify({ protocol: 'volo', action: 'unstake', amount: `${amount} vSUI` }), metadata: { tx } };
    }

    if (action === 'apr') {
      const apr = await voloService.getAPR();
      return { output: JSON.stringify(apr), metadata: { protocol: 'volo', action: 'apr' } };
    }

    return { output: `Unknown Volo action: ${action}` };
  }
}

export class BucketNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'bucket';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'mint';

    if (action === 'mint') {
      const amount = (data?.amount as string) || inputs[0] || '1';
      const amountMist = (BigInt(Math.floor(parseFloat(amount) * 1_000_000_000))).toString();
      const tx = bucketService.buildMintTx({ collateralAmount: amountMist, walletAddress: context.accountId });
      return { output: JSON.stringify({ protocol: 'bucket', action: 'mint', collateral: `${amount} SUI` }), metadata: { tx } };
    }

    if (action === 'redeem') {
      const amount = (data?.amount as string) || inputs[0] || '1';
      const tx = bucketService.buildRedeemTx({ buckAmount: amount, walletAddress: context.accountId });
      return { output: JSON.stringify({ protocol: 'bucket', action: 'redeem', amount: `${amount} BUCK` }), metadata: { tx } };
    }

    if (action === 'ratio') {
      const ratio = await bucketService.getCollateralRatio();
      return { output: JSON.stringify(ratio), metadata: { protocol: 'bucket', action: 'ratio' } };
    }

    return { output: `Unknown Bucket action: ${action}` };
  }
}

export class AftermathNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'aftermath';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'swap';

    if (action === 'swap') {
      try {
        const coinInType = (data?.coinInType as string) || '0x2::sui::SUI';
        const coinOutType = (data?.coinOutType as string) || '';
        const amountIn = (data?.amountIn as string) || inputs[0] || '1000000000';
        const slippage = (data?.slippage as number) || 0.01;

        const result = await aftermathService.execute('swap', {
          coinInType, coinOutType, amountIn, slippage,
          walletAddress: context.accountId || context.agentWallet?.address || '',
        }, context);

        return { output: JSON.stringify(result), metadata: { protocol: 'aftermath', action: 'swap' } };
      } catch (err: any) {
        return { output: JSON.stringify({ error: err.message, protocol: 'aftermath' }) };
      }
    }

    if (action === 'quote') {
      const coinInType = (data?.coinInType as string) || '0x2::sui::SUI';
      const coinOutType = (data?.coinOutType as string) || '';
      const amountIn = (data?.amountIn as string) || '1000000000';

      const result = await aftermathService.execute('getQuote', {
        coinInType, coinOutType, amountIn,
      }, context);

      return { output: JSON.stringify(result), metadata: { protocol: 'aftermath', action: 'quote' } };
    }

    return { output: `Unknown Aftermath action: ${action}` };
  }
}

export class NaviNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'navi';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'supply';
    const assetType = (data?.assetType as string) || '0x2::sui::SUI';
    const amount = (data?.amount as string) || inputs[0] || '1000000000';
    const walletAddress = context.accountId || context.agentWallet?.address || '';

    if (action === 'getPosition') {
      const result = await naviService.execute('getPosition', { walletAddress }, context);
      return { output: JSON.stringify(result), metadata: { protocol: 'navi', action: 'getPosition' } };
    }

    try {
      const result = await naviService.execute(action, {
        assetType, amount, walletAddress,
      }, context);
      return { output: JSON.stringify(result), metadata: { protocol: 'navi', action } };
    } catch (err: any) {
      return { output: JSON.stringify({ error: err.message, protocol: 'navi' }) };
    }
  }
}

export class SuilendNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'suilend';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'lend';
    const assetType = (data?.assetType as string) || '0x2::sui::SUI';
    const amount = (data?.amount as string) || inputs[0] || '1000000000';
    const walletAddress = context.accountId || context.agentWallet?.address || '';

    if (action === 'getPosition') {
      const result = await suilendService.execute('getPosition', { walletAddress }, context);
      return { output: JSON.stringify(result), metadata: { protocol: 'suilend', action: 'getPosition' } };
    }

    try {
      const result = await suilendService.execute(action, {
        assetType, amount, walletAddress,
      }, context);
      return { output: JSON.stringify(result), metadata: { protocol: 'suilend', action } };
    } catch (err: any) {
      return { output: JSON.stringify({ error: err.message, protocol: 'suilend' }) };
    }
  }
}

export class BluefinNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'bluefin';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'markets';

    if (action === 'markets') {
      const markets = await bluefinService.getMarkets();
      return { output: JSON.stringify(markets), metadata: { protocol: 'bluefin', action: 'markets' } };
    }

    if (action === 'open_position') {
      const market = (data?.market as string) || '';
      const side = (data?.side as string) || 'long';
      const marginAmount = (data?.marginAmount as string) || inputs[0] || '1000000000';
      const leverage = (data?.leverage as number) || 5;
      const tx = bluefinService.buildOpenPositionTx({
        market, side: side as 'long' | 'short', marginAmount, leverage, walletAddress: context.accountId,
      });
      return { output: JSON.stringify({ protocol: 'bluefin', action: 'open_position', market, side, leverage }), metadata: { tx } };
    }

    if (action === 'close_position') {
      const positionId = (data?.positionId as string) || inputs[0] || '';
      const tx = bluefinService.buildClosePositionTx({ positionId, walletAddress: context.accountId });
      return { output: JSON.stringify({ protocol: 'bluefin', action: 'close_position', positionId }), metadata: { tx } };
    }

    return { output: `Unknown Bluefin action: ${action}` };
  }
}

export class CetusTradeNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'cetus_trade';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'swap';
    const poolId = (data?.poolId as string) || inputs[0] || '';
    const coinIn = (data?.coinIn as string) || '0x2::sui::SUI';
    const coinOut = (data?.coinOut as string) || '';
    const amount = (data?.amount as string) || '1000000000';
    const slippage = (data?.slippage as number) || 0.5;
    const walletAddress = context.accountId || context.agentWallet?.address || '';

    try {
      switch (action) {
        case 'get_pool_info': {
          const result = await cetusService.execute('getPoolInfo', { poolId }, context);
          return { output: JSON.stringify(result), metadata: { protocol: 'cetus', action } };
        }
        case 'estimate_swap': {
          const result = await cetusService.execute('estimateSwap', { poolId, amount, side: coinIn }, context);
          return { output: JSON.stringify(result), metadata: { protocol: 'cetus', action } };
        }
        case 'swap':
        default: {
          const result = await cetusService.execute('buildSwapTx', {
            poolId, amount, side: coinIn, minOutput: String(Math.floor(Number(amount) * (1 - slippage / 100))), wallet: { address: walletAddress },
          }, context);
          return { output: JSON.stringify(result), metadata: { protocol: 'cetus', action } };
        }
      }
    } catch (err: any) {
      return { output: JSON.stringify({ error: err.message, protocol: 'cetus' }) };
    }
  }
}

export class CetusLendNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'cetus_lend';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'supply';
    const amount = (data?.amount as string) || inputs[0] || '1000000000';

    if (action === 'borrow' || action === 'repay') {
      return {
        output: JSON.stringify({ protocol: 'cetus', action, note: 'Use NAVI or Suilend for lending. Cetus is a DEX, not a lending protocol.' }),
        metadata: { protocol: 'cetus' },
      };
    }

    const poolId = (data?.poolId as string) || '';
    const coinTypeA = (data?.coinTypeA as string) || '0x2::sui::SUI';
    const coinTypeB = (data?.coinTypeB as string) || '';
    const positionId = (data?.positionId as string) || '';

    const amountMist = String(BigInt(Math.floor(parseFloat(amount) * 1_000_000_000)));

    return {
      output: JSON.stringify({
        protocol: 'cetus',
        action,
        amount: `${amount} ${coinTypeA}`,
        poolId,
        note: 'Cetus deposits use add-liquidity via the Cetus CLMM. In the canvas, this builds a transaction for simulation/signing.',
        simulatedTx: true,
      }),
      metadata: { protocol: 'cetus', action },
    };
  }
}

export class DeepBookTradeNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'deepbook_trade';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'get_pool_info';
    const poolId = (data?.pool as string) || inputs[0] || '';
    const amount = (data?.amount as string) || '1000000000';
    const side = (data?.side as string) || 'bid';
    const price = (data?.price as string) || '';

    switch (action) {
      case 'get_pool_info': {
        if (!poolId) return { output: JSON.stringify({ error: 'pool ID required' }) };
        const result = await deepBookService.execute('getPoolInfo', { poolId }, context);
        return { output: JSON.stringify(result), metadata: { protocol: 'deepbook', action: 'get_pool_info' } };
      }
      case 'get_pools': {
        const result = await deepBookService.execute('getPools', {}, context);
        return { output: JSON.stringify(result), metadata: { protocol: 'deepbook', action: 'get_pools' } };
      }
      case 'get_order_book': {
        if (!poolId) return { output: JSON.stringify({ error: 'pool ID required' }) };
        const result = await deepBookService.execute('getOrderBook', { poolId }, context);
        return { output: JSON.stringify(result), metadata: { protocol: 'deepbook', action: 'get_order_book' } };
      }
      case 'estimate_swap': {
        if (!poolId) return { output: JSON.stringify({ error: 'pool ID required' }) };
        const result = await deepBookService.execute('estimateSwap', { poolId, amount, side }, context);
        return { output: JSON.stringify(result), metadata: { protocol: 'deepbook', action: 'estimate_swap' } };
      }
      case 'swap': {
        if (!poolId) return { output: JSON.stringify({ error: 'pool ID required' }) };
        const minOutput = data?.minOutput as string || Math.floor(Number(amount) * 0.98).toString();
        const result = await deepBookService.execute('buildSwapTx', {
          poolId, amount, side, minOutput, wallet: { address: context.accountId || '' },
        }, context);
        return { output: JSON.stringify(result), metadata: { protocol: 'deepbook', action: 'swap' } };
      }
      case 'swap_and_submit': {
        if (!poolId) return { output: JSON.stringify({ error: 'pool ID required' }) };
        const minOutput = data?.minOutput as string || Math.floor(Number(amount) * 0.98).toString();
        const result = await deepBookService.execute('buildSwapTx', {
          poolId, amount, side, minOutput, wallet: { address: context.accountId || '' },
        }, context);
        const txBytes = (result as any)?.txBytes;
        if (!txBytes) return { output: JSON.stringify({ ...result, error: 'no tx bytes to submit' }) };

        // Try server-side signing with delegateKey (platform key)
        const submitResult = await trySubmitTx(txBytes, context.delegateKey || '');
        // If delegateKey was a private key, submission already happened
        const signed = !submitResult.error;

        return {
          output: JSON.stringify({
            ...result,
            submission: signed
              ? { digest: submitResult.digest, status: 'submitted' }
              : { note: 'Transaction built. Sign via frontend with zkLogin key.' },
          }),
          metadata: {
            protocol: 'deepbook',
            action: 'swap_and_submit',
            txBytes,          // always pass txBytes for frontend auto-sign
            ...(signed ? {} : { needsSigning: true }),
          },
        };
      }
      case 'limit_order':
        return { output: JSON.stringify({ error: 'limit_order requires skill execution', action: 'limit_order', pool: poolId, amount, price }) };
      case 'cancel_order':
        return { output: JSON.stringify({ error: 'cancel_order requires skill execution', action: 'cancel_order', pool: poolId }) };
      default:
        return { output: JSON.stringify({ error: `Unknown DeepBook trade action: ${action}` }) };
    }
  }
}

export class DeepBookLendNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'deepbook_lend';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'deposit';
    const poolId = (data?.pool as string) || inputs[0] || '';
    const amount = (data?.amount as string) || '1000000000';
    const token = (data?.token as string) || (data?.assetType as string) || '0x2::sui::SUI';

    return {
      output: JSON.stringify({
        protocol: 'deepbook',
        action,
        pool: poolId,
        amount,
        token,
        note: 'DeepBook lending operations require skill-based execution with DeepBookClient. Use the Agent node with DeepBook lending tool for full execution, or submit the transaction directly.',
      }),
      metadata: { protocol: 'deepbook', action },
    };
  }
}

export class PythNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'pyth';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'get_price';
    const priceFeedId = (data?.priceFeedId as string) || inputs[0] || '';

    if (action === 'get_price') {
      const price = await pythService.getPrice({ priceFeedId });
      return { output: JSON.stringify(price), metadata: { protocol: 'pyth', action: 'get_price' } };
    }

    if (action === 'get_ema') {
      const ema = await pythService.getEMA({ priceFeedId });
      return { output: JSON.stringify(ema), metadata: { protocol: 'pyth', action: 'get_ema' } };
    }

    return { output: JSON.stringify(pythService.KNOWN_FEEDS), metadata: { protocol: 'pyth', action: 'list_feeds' } };
  }
}

export class SwitchboardNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'switchboard';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'get_feed';
    const normalizedAction = action === 'get_data' ? 'get_feed' : action;
    const feedAddress = (data?.feedAddress as string) || inputs[0] || '';

    if (normalizedAction === 'request_update') {
      const result = await switchboardService.requestUpdate({ feedAddress, walletAddress: context.accountId });
      return { output: JSON.stringify(result), metadata: { protocol: 'switchboard', action: 'request_update' } };
    }

    const feed = await switchboardService.getFeed({ feedAddress });
    return { output: JSON.stringify(feed), metadata: { protocol: 'switchboard', action: normalizedAction } };
  }
}

export class TradeportNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'tradeport';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'get_floor';
    const collectionSlug = (data?.collectionSlug as string) || inputs[0] || '';

    if (action === 'get_listings') {
      const limit = (data?.limit as number) || 20;
      const listings = await tradeportService.getListings({ collectionSlug, limit });
      return { output: JSON.stringify(listings), metadata: { protocol: 'tradeport', action: 'get_listings' } };
    }

    const floor = await tradeportService.getCollectionFloor({ collectionSlug });
    return { output: JSON.stringify(floor), metadata: { protocol: 'tradeport', action: 'get_floor' } };
  }
}

export class EventTriggerNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'event_trigger';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const eventType = (data?.eventType as string) || (data?.eventName as string) || '';
    const contractAddress = (data?.contractAddress as string) || (data?.packageId as string) || '';

    if (!eventType) {
      return { output: 'Event trigger: Missing event type' };
    }

    try {
      const { suiRpcUrl } = await import('../config.js');
      const rpcUrl = suiRpcUrl();
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getEvents',
          params: [{ MoveModule: { package: contractAddress, module: (data?.moduleName as string) || '' } }, null, 1],
        }),
      });
      const json = await res.json();
      return {
        output: `Monitoring ${eventType} events on ${contractAddress}`,
        metadata: { eventType, contractAddress, latestCursor: json.result?.nextCursor || null },
      };
    } catch (err: any) {
      return {
        output: `Monitoring ${eventType} events on ${contractAddress} (RPC unavailable: ${err.message})`,
        metadata: { eventType, contractAddress },
      };
    }
  }
}

export class GoogleSheetsNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'google_sheets'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'append';
    const spreadsheetId = (data?.spreadsheetId as string) || '';
    const range = (data?.range as string) || 'Sheet1!A1';
    const apiKey = (data?.apiKey as string) || '';
    const values = inputs[0] || '';
    
    if (!spreadsheetId) return { output: 'Error: spreadsheetId required' };
    
    try {
      if (action === 'append') {
        const rows = values.split('\n').filter(Boolean).map(line => line.split(',').map(s => s.trim()));
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: rows }),
        });
        return { output: `Appended ${rows.length} rows to ${range}`, metadata: { spreadsheetId, range, rows: rows.length } };
      }
      if (action === 'read') {
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`);
        const data = await res.json();
        return { output: JSON.stringify(data.values || []), metadata: { spreadsheetId, range } };
      }
      return { output: `Unknown action: ${action}` };
    } catch (err: any) { return { output: `Google Sheets error: ${err.message}` }; }
  }
}

export class AirtableNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'airtable'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const baseId = (data?.baseId as string) || '';
    const tableName = (data?.tableName as string) || '';
    const apiKey = (data?.apiKey as string) || '';
    const action = (data?.action as string) || 'list';
    
    if (!baseId || !apiKey) return { output: 'Error: baseId and apiKey required' };
    
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
    try {
      const res = await fetch(url, {
        method: action === 'create' ? 'POST' : 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: action === 'create' ? JSON.stringify({ fields: JSON.parse(inputs[0] || '{}') }) : undefined,
      });
      const data = await res.json();
      return { output: JSON.stringify(data.records || data), metadata: { baseId, tableName, action } };
    } catch (err: any) { return { output: `Airtable error: ${err.message}` }; }
  }
}

export class NotionNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'notion'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const apiKey = (data?.apiKey as string) || '';
    const databaseId = (data?.databaseId as string) || '';
    const action = (data?.action as string) || 'query';
    const content = inputs[0] || '';
    
    if (!apiKey) return { output: 'Error: Notion API key required' };
    
    try {
      let url = 'https://api.notion.com/v1/';
      let method = 'POST';
      let body: any = {};
      
      if (action === 'query' && databaseId) {
        url += `databases/${databaseId}/query`;
        body = {};
      } else if (action === 'create_page' && databaseId) {
        url += 'pages';
        body = { parent: { database_id: databaseId }, properties: JSON.parse(content || '{}') };
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { output: JSON.stringify(data), metadata: { action } };
    } catch (err: any) { return { output: `Notion error: ${err.message}` }; }
  }
}

export class TwitterNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'twitter'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'post';
    const normalizedAction = action === 'post_tweet' ? 'post' : action;
    const bearerToken = (data?.bearerToken as string) || '';
    if (!bearerToken) return { output: 'Error: Twitter bearer token required' };

    try {
      if (normalizedAction === 'search') {
        const query = (data?.query as string) || inputs[0] || '';
        if (!query) return { output: 'Error: Search query required' };
        const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10`, {
          headers: { Authorization: `Bearer ${bearerToken}` },
        });
        const searchData = await res.json();
        return { output: JSON.stringify(searchData), metadata: { action: 'search', query } };
      }

      const text = inputs[0] || '';
      if (!text) return { output: 'Error: Tweet text required' };
      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 280) }),
      });
      const tweetData = await res.json();
      return { output: `Tweet posted: ${(tweetData as any).data?.id || 'unknown'}`, metadata: tweetData };
    } catch (err: any) { return { output: `Twitter error: ${err.message}` }; }
  }
}

export class RssReaderNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'rss_reader'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const feedUrl = (data?.feedUrl as string) || inputs[0] || '';
    const limit = Number(data?.limit) || 10;
    if (!feedUrl) return { output: 'Error: RSS feed URL required' };
    try {
      const res = await fetch(feedUrl);
      const xml = await res.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      const parsed = items.slice(0, limit).map(item => {
        const title = (item.match(/<title>(.*?)<\/title>/)?.[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '');
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
        return `${title}\n${link}\n${pubDate}`;
      });
      return { output: parsed.join('\n\n'), metadata: { feedUrl, itemCount: parsed.length } };
    } catch (err: any) { return { output: `RSS error: ${err.message}` }; }
  }
}

export class CsvParserNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'csv_parser'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const csv = inputs[0] || '';
    const delimiter = (data?.delimiter as string) || ',';
    const hasHeader = data?.hasHeader !== false;
    const lines = csv.trim().split('\n').filter(Boolean);
    if (lines.length === 0) return { output: 'No CSV data provided' };
    const headers = hasHeader ? lines[0].split(delimiter).map(h => h.trim()) : lines[0].split(delimiter).map((_, i) => `col_${i}`);
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const rows = dataLines.map(line => {
      const values = line.split(delimiter).map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ''; });
      return obj;
    });
    return { output: JSON.stringify(rows, null, 2), metadata: { rowCount: rows.length, columnCount: headers.length } };
  }
}

export class IpfsNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'ipfs'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const content = inputs[0] || '';
    const service = (data?.service as string) || 'pinata';
    const apiKey = (data?.apiKey as string) || '';
    const apiSecret = (data?.apiSecret as string) || '';
    
    try {
      if (service === 'pinata' && apiKey && apiSecret) {
        const formData = new FormData();
        formData.append('file', new Blob([content], { type: 'text/plain' }), 'buiry-data.json');
        const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: { 'pinata_api_key': apiKey, 'pinata_secret_api_key': apiSecret },
          body: formData,
        });
        const data = await res.json();
        return { output: `ipfs://${(data as any).IpfsHash}`, metadata: { cid: (data as any).IpfsHash, service: 'pinata' } };
      }
      if (service === 'web3_storage' && apiKey) {
        const res = await fetch('https://api.web3.storage/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}` },
          body: new Blob([content], { type: 'text/plain' }),
        });
        const data = await res.json();
        return { output: `ipfs://${(data as any).cid}`, metadata: { cid: (data as any).cid, service: 'web3.storage' } };
      }
      return { output: `IPFS upload configured. Content size: ${content.length} bytes. Set apiKey for Pinata or web3.storage.` };
    } catch (err: any) { return { output: `IPFS error: ${err.message}` }; }
  }
}

export class WormholeNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'wormhole';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'transfer';

    if (action === 'get_vaa') {
      const targetChain = (data?.targetChain as number) || 2;
      const targetAddress = (data?.targetAddress as string) || '';
      const sequence = (data?.amount as string) || inputs[0] || '1';
      const vaa = await wormholeService.getVAA({ emitterChain: targetChain, emitterAddress: targetAddress, sequence });
      return { output: JSON.stringify(vaa), metadata: { protocol: 'wormhole', action: 'get_vaa' } };
    }

    const tokenType = (data?.tokenType as string) || '0x2::sui::SUI';
    const amount = (data?.amount as string) || inputs[0] || '1000000000';
    const targetChain = (data?.targetChain as number) || 2;
    const targetAddress = (data?.targetAddress as string) || context.accountId || '';
    const tx = wormholeService.buildTransferTx({ tokenType, amount, targetChain, targetAddress, walletAddress: context.accountId });
    return { output: JSON.stringify({ protocol: 'wormhole', action: 'transfer', targetChain, amount }), metadata: { tx } };
  }
}

export class SuiBridgeNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'sui_bridge';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'bridge_to_eth';

    if (action === 'status') {
      const status = await suiBridgeService.getBridgeStatus();
      return { output: JSON.stringify(status), metadata: { protocol: 'sui_bridge', action: 'status' } };
    }

    if (action === 'claim') {
      const txProof = (data?.txProof as string) || inputs[0] || '0x';
      const tx = suiBridgeService.buildBridgeFromEthTx({ suiDestination: context.accountId, txProof });
      return { output: JSON.stringify({ protocol: 'sui_bridge', action: 'claim' }), metadata: { tx } };
    }

    const amount = (data?.amount as string) || inputs[0] || '1000000000';
    const ethDestination = (data?.ethDestination as string) || '0x0000000000000000000000000000000000000000';
    const tx = suiBridgeService.buildBridgeToEthTx({ amountMist: amount, ethDestination, walletAddress: context.accountId });
    return { output: JSON.stringify({ protocol: 'sui_bridge', action: 'bridge_to_eth', amount, ethDestination }), metadata: { tx } };
  }
}

export class AlphaFiNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean {
    return (node.type as string) === 'alphafi';
  }

  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const action = (data?.action as string) || 'deposit';

    if (action === 'vaults') {
      const vaults = await alphaFiService.getVaults();
      return { output: JSON.stringify(vaults), metadata: { protocol: 'alphafi', action: 'vaults' } };
    }

    if (action === 'position') {
      const position = await alphaFiService.getPosition({ walletAddress: context.accountId });
      return { output: JSON.stringify(position), metadata: { protocol: 'alphafi', action: 'position' } };
    }

    if (action === 'withdraw') {
      const vaultType = (data?.vaultType as string) || inputs[0] || 'sui';
      const shares = (data?.amount as string) || inputs[1] || '1000000000';
      const tx = alphaFiService.buildWithdrawTx({ vaultType, shares, walletAddress: context.accountId });
      return { output: JSON.stringify({ protocol: 'alphafi', action: 'withdraw', vaultType, shares }), metadata: { tx } };
    }

    const tokenType = (data?.tokenType as string) || '0x2::sui::SUI';
    const amount = (data?.amount as string) || inputs[0] || '1000000000';
    const vaultType = (data?.vaultType as string) || 'sui';
    const tx = alphaFiService.buildDepositTx({ tokenType, amount, vaultType, walletAddress: context.accountId });
    return { output: JSON.stringify({ protocol: 'alphafi', action: 'deposit', vaultType, amount }), metadata: { tx } };
  }
}

export class FormTriggerNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'form_trigger'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const formToken = (data?.formToken as string) || `form_${node.id}_${Date.now()}`;
    const fields = (data?.fields as string[]) || ['name', 'email', 'message'];
    return {
      output: JSON.stringify({ formToken, url: `/api/v1/execute/trigger/${formToken}`, fields, method: 'POST' }),
      metadata: { formToken, fields, triggerType: 'form' },
    };
  }
}

export class DiscordTriggerNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'discord_trigger'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const botToken = (data?.botToken as string) || '';
    const channelId = (data?.channelId as string) || '';
    return {
      output: `Discord bot trigger configured. Bot: ${botToken ? 'set' : 'NOT SET'}, Channel: ${channelId || 'all'}`,
      metadata: { botToken: !!botToken, channelId, triggerType: 'discord_message' },
    };
  }
}

export class PriceAlertTriggerNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'price_alert'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const priceFeedId = (data?.priceFeedId as string) || '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744';
    const threshold = parseFloat((data?.threshold as string) || '0');
    const direction = (data?.direction as string) || 'above';
    const checkInterval = Number(data?.checkInterval) || 60000;
    
    try {
      const priceData = await pythService.getPrice({ priceFeedId });
      const price = parseFloat(priceData.price);
      
      const triggered = direction === 'above' ? price > threshold : price < threshold;
      
      return {
        output: JSON.stringify({ triggered, price, threshold, direction, priceFeedId }),
        metadata: { triggered, currentPrice: price, threshold, direction, checkInterval },
      };
    } catch {
      return { output: `Price alert: Unable to fetch price for ${priceFeedId}`, metadata: { priceFeedId } };
    }
  }
}

export class BalanceMonitorNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'balance_monitor'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const walletAddress = (data?.walletAddress as string) || inputs[0] || '';
    const threshold = parseFloat((data?.threshold as string) || '0');
    const direction = (data?.direction as string) || 'above';
    
    if (!walletAddress) return { output: 'Error: wallet address required' };
    
    try {
      const { createSuiClient } = await import('../config.js');
      const client = createSuiClient();
      const balance = await client.getBalance({ owner: walletAddress }) as any;
      const suiBalance = Number(balance.totalBalance) / 1_000_000_000;
      const triggered = direction === 'above' ? suiBalance > threshold : suiBalance < threshold;
      
      return {
        output: JSON.stringify({ triggered, balance: suiBalance, threshold, wallet: walletAddress }),
        metadata: { triggered, balance: suiBalance, threshold, walletAddress },
      };
    } catch (err: any) {
      return { output: `Balance check error: ${err.message}`, metadata: { walletAddress } };
    }
  }
}

export class NftFloorAlertNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'nft_floor_alert'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const collectionSlug = (data?.collectionSlug as string) || inputs[0] || '';
    const threshold = parseFloat((data?.threshold as string) || '0');
    
    if (!collectionSlug) return { output: 'Error: collection slug required' };
    
    try {
      const stats = await tradeportService.getCollectionFloor({ collectionSlug });
      const floor = parseFloat((stats as any).floor || '0');
      const triggered = floor <= threshold && threshold > 0;
      
      return {
        output: JSON.stringify({ collection: collectionSlug, floor, threshold, triggered }),
        metadata: { collectionSlug, floor, threshold, triggered },
      };
    } catch {
      return { output: `NFT floor alert: Unable to fetch for ${collectionSlug}`, metadata: { collectionSlug } };
    }
  }
}

const counters = new Map<string, number>();

export class CounterNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'counter'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const counterId = (data?.counterId as string) || node.id;
    const action = (data?.action as string) || 'increment';
    const resetValue = Number(data?.resetValue) || 0;
    
    let count = counters.get(counterId) || 0;
    
    if (action === 'increment') count++;
    else if (action === 'decrement') count--;
    else if (action === 'reset') count = resetValue;
    else if (action === 'get') { /* just read */ }
    
    counters.set(counterId, count);
    
    return {
      output: String(count),
      metadata: { counterId, count, action },
    };
  }
}

export class EmailNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'email'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const to = (data?.to as string) || '';
    const subject = (data?.subject as string) || 'Buiry Workflow';
    const body = inputs[0] || '';
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: (data?.smtpHost as string) || process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(data?.smtpPort) || 587,
        secure: false,
        auth: {
          user: (data?.smtpUser as string) || process.env.SMTP_USER || '',
          pass: (data?.smtpPass as string) || process.env.SMTP_PASS || '',
        },
      });
      await transporter.sendMail({ from: (data?.from as string) || 'noreply@buiry.xyz', to, subject, text: body });
      return { output: `Email sent to ${to}`, metadata: { to, subject } };
    } catch (err: any) { return { output: `Email failed: ${err.message}` }; }
  }
}

export class SlackNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'slack'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const webhookUrl = (data?.webhookUrl as string) || '';
    const message = inputs[0] || '';
    if (!webhookUrl) return { output: 'Error: Slack webhook URL required' };
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
      return { output: 'Slack message sent', metadata: { channel: 'webhook' } };
    } catch (err: any) { return { output: `Slack failed: ${err.message}` }; }
  }
}

export class DiscordNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'discord'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const webhookUrl = (data?.webhookUrl as string) || '';
    const message = inputs[0] || '';
    if (!webhookUrl) return { output: 'Error: Discord webhook URL required' };
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message.slice(0, 2000) }),
      });
      return { output: 'Discord message sent', metadata: {} };
    } catch (err: any) { return { output: `Discord failed: ${err.message}` }; }
  }
}

export class TelegramSendNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'telegram_send'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const botToken = (data?.botToken as string) || process.env.TELEGRAM_BOT_TOKEN || '';
    const chatId = (data?.chatId as string) || '';
    const message = inputs[0] || '';
    if (!botToken || !chatId) return { output: 'Error: bot token and chat ID required' };
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message.slice(0, 4096), parse_mode: 'Markdown' }),
      });
      return { output: `Telegram message sent to ${chatId}`, metadata: { chatId } };
    } catch (err: any) { return { output: `Telegram failed: ${err.message}` }; }
  }
}

export class WaitNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'wait'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const durationMs = Number(data?.durationMs) || 5000;
    await new Promise(r => setTimeout(r, durationMs));
    return { output: `Waited ${durationMs}ms`, metadata: { durationMs } };
  }
}

export class JsonParserNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'json_parser'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    try {
      const parsed = JSON.parse(inputs[0] || '{}');
      const path = (data?.extractPath as string) || '';
      let output = parsed;
      if (path) {
        const keys = path.split('.');
        output = keys.reduce((obj: any, key: string) => obj?.[key], parsed);
      }
      return { output: JSON.stringify(output, null, 2), metadata: { path } };
    } catch { return { output: `Invalid JSON: ${(inputs[0] || '').slice(0, 100)}` }; }
  }
}

export class SuiNSNodeHandler implements NodeHandler {
  canHandle(node: WorkflowNode): boolean { return (node.type as string) === 'suins'; }
  async execute(node: WorkflowNode, inputs: string[], context: any): Promise<NodeHandlerResult> {
    const data = node.data as Record<string, unknown> | undefined;
    const name = (data?.name as string) || inputs[0] || '';
    const action = (data?.action as string) || 'resolve';
    try {
      const { createSuiClient } = await import('../config.js');
      const client = createSuiClient();
      if (action === 'resolve') {
        const cleanName = name.replace('.sui', '');
        const result = await client.nameService.lookupName({ name: `${cleanName}.sui` });
        const address = result.response.record?.targetAddress || null;
        return { output: address || 'Name not found', metadata: { name: `${cleanName}.sui`, address } };
      }
      const result = await client.defaultNameServiceName({ address: name });
      const suinsName = result.data.name;
      return { output: suinsName || 'No name found', metadata: { address: name, name: suinsName } };
    } catch { return { output: `SuiNS lookup failed for: ${name}`, metadata: { name } }; }
  }
}

export const nodeHandlers: NodeHandler[] = [
  new InputNodeHandler(),
  new OutputNodeHandler(),
  new WalrusNodeHandler(),
  new SuiNodeHandler(),
  new LoopNodeHandler(),
  new CodeNodeHandler(),
  new HttpNodeHandler(),
  new ConditionalNodeHandler(),
  new FileNodeHandler(),
  new AgentSpawnNodeHandler(),
  new WebhookTriggerNodeHandler(),
  new ScheduleTriggerNodeHandler(),
  new MergeNodeHandler(),
  new AftermathNodeHandler(),
  new NaviNodeHandler(),
  new SuilendNodeHandler(),
  new HaedalNodeHandler(),
  new VoloNodeHandler(),
  new BucketNodeHandler(),
  new WormholeNodeHandler(),
  new SuiBridgeNodeHandler(),
  new AlphaFiNodeHandler(),
  new BluefinNodeHandler(),
  new DeepBookTradeNodeHandler(),
  new DeepBookLendNodeHandler(),
  new PythNodeHandler(),
  new SwitchboardNodeHandler(),
  new TradeportNodeHandler(),
  new EventTriggerNodeHandler(),
  new FormTriggerNodeHandler(),
  new DiscordTriggerNodeHandler(),
  new PriceAlertTriggerNodeHandler(),
  new BalanceMonitorNodeHandler(),
  new NftFloorAlertNodeHandler(),
  new CounterNodeHandler(),
  new GoogleSheetsNodeHandler(),
  new AirtableNodeHandler(),
  new NotionNodeHandler(),
  new TwitterNodeHandler(),
  new RssReaderNodeHandler(),
  new CsvParserNodeHandler(),
  new IpfsNodeHandler(),
  new EmailNodeHandler(),
  new SlackNodeHandler(),
  new DiscordNodeHandler(),
  new TelegramSendNodeHandler(),
  new WaitNodeHandler(),
  new JsonParserNodeHandler(),
  new SuiNSNodeHandler(),
];
