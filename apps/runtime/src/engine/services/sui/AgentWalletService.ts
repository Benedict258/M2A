import { Transaction } from '@mysten/sui/transactions';
import { createSuiClient } from '../../../config.js';

export interface AgentWalletSession {
  address: string;
  ephemeralKeypair: any;
  maxEpoch: number;
  proofData?: any;
}

export class AgentWalletService {
  private sessions: Map<string, AgentWalletSession> = new Map();
  private client = createSuiClient();

  registerSession(agentId: string, session: AgentWalletSession) {
    this.sessions.set(agentId, session);
  }

  getSession(agentId: string): AgentWalletSession | undefined {
    return this.sessions.get(agentId);
  }

  async transferFunds(fromAddress: string, toAddress: string, amount: number): Promise<string> {
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(amount))]);
    tx.transferObjects([coin], tx.pure.address(toAddress));

    return JSON.stringify({ transaction: tx.serialize(), from: fromAddress, to: toAddress, amount });
  }

  async getBalance(address: string): Promise<number> {
    const balances = await this.client.core.listBalances({ owner: address });
    const suiBalance = balances.balances.find((b) => b.coinType === '0x2::sui::SUI');
    return suiBalance ? Number(suiBalance.balance) : 0;
  }

  async executeWithAgentWallet(
    session: AgentWalletSession,
    txBytes: Uint8Array,
    signature: string,
  ): Promise<{ digest: string; status: string }> {
    const result = await this.client.core.executeTransaction({
      transaction: txBytes,
      signatures: [signature],
      include: { effects: true },
    });

    const transaction = result.$kind === 'Transaction' ? result.Transaction : result.FailedTransaction;

    await this.client.waitForTransaction({ digest: transaction.digest });

    return {
      digest: transaction.digest,
      status: result.$kind === 'FailedTransaction' ? 'failed' : 'success',
    };
  }
}

export const agentWalletService = new AgentWalletService();
