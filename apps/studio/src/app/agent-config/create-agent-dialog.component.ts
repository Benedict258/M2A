import { Component, output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { AuthStore } from '../stores/auth.store';
import { AgentStore } from '../stores/agent.store';
import { SuiContractService } from '../shared/contract.service';
import { ZkLoginService } from '../shared/zklogin.service';

@Component({
  selector: 'app-create-agent-dialog',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" (click)="close.emit()">
      <div class="w-full max-w-lg animate-slide-up rounded-2xl border border-harbor-border bg-harbor-card-bg shadow-2xl" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-harbor-border px-6 py-4">
          <h2 class="text-lg font-semibold text-harbor-text-heading">Create Agent</h2>
          <button (click)="close.emit()" class="text-harbor-text-muted hover:text-harbor-text-heading">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="p-6 space-y-4">
          @if (step() === 'form') {
            <div>
              <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Agent Name</label>
              <input
                [(ngModel)]="name"
                placeholder="My Trading Agent"
                class="w-full rounded-lg border border-harbor-border-input bg-harbor-surface px-3 py-2.5 text-sm text-harbor-text-heading outline-none placeholder:text-harbor-text-muted focus:border-walrus-400"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Budget Cap (SUI)</label>
              <input
                type="number"
                [(ngModel)]="budgetCap"
                placeholder="100"
                class="w-full rounded-lg border border-harbor-border-input bg-harbor-surface px-3 py-2.5 text-sm text-harbor-text-heading outline-none placeholder:text-harbor-text-muted focus:border-walrus-400"
              />
              <p class="mt-1 text-xs text-harbor-text-muted">On-chain spending limit tracked by the policy.</p>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Initial Fund (SUI)</label>
              <input
                type="number"
                [(ngModel)]="initialFund"
                placeholder="10"
                class="w-full rounded-lg border border-harbor-border-input bg-harbor-surface px-3 py-2.5 text-sm text-harbor-text-heading outline-none placeholder:text-harbor-text-muted focus:border-walrus-400"
              />
              <p class="mt-1 text-xs text-harbor-text-muted">SUI sent to agent wallet for gas. Policy carries no funds.</p>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Allowed Protocols</label>
              <div class="flex flex-wrap gap-2">
                @for (proto of protocolOptions; track proto.key) {
                  <span
                    [ngClass]="{
                      'border-walrus-400 bg-walrus-500/10': selectedProtocols().includes(proto.key),
                      'border-harbor-border bg-harbor-surface': !selectedProtocols().includes(proto.key)
                    }"
                    class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors select-none"
                    (click)="toggleProtocol(proto.key)"
                  >{{ proto.label }}</span>
                }
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Allowed Tools</label>
              <div class="flex flex-wrap gap-2">
                @for (tool of toolOptions; track tool.key) {
                  <span
                    [ngClass]="{
                      'border-walrus-400 bg-walrus-500/10': selectedTools().includes(tool.key),
                      'border-harbor-border bg-harbor-surface': !selectedTools().includes(tool.key)
                    }"
                    class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors select-none"
                    (click)="toggleTool(tool.key)"
                  >{{ tool.label }}</span>
                }
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Expiry Epoch</label>
              <input
                type="number"
                [(ngModel)]="expiryEpoch"
                placeholder="Leave empty for no expiry"
                class="w-full rounded-lg border border-harbor-border-input bg-harbor-surface px-3 py-2.5 text-sm text-harbor-text-heading outline-none placeholder:text-harbor-text-muted focus:border-walrus-400"
              />
              <p class="mt-1 text-xs text-harbor-text-muted">Current epoch: {{ currentEpoch() }}</p>
            </div>

            <div class="rounded-lg border border-harbor-border bg-harbor-surface p-3 text-xs text-harbor-text-secondary">
              @if (auth.authMethod() === 'zklogin') {
                Agent wallet: <span class="font-mono text-harbor-text-heading">{{ auth.address() }}</span>
                (same as your Google-authenticated address)
              } @else {
                You'll authenticate with Google to create the agent wallet address.
              }
            </div>

            <button
              (click)="createAgent()"
              class="w-full rounded-lg bg-walrus-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-walrus-600 disabled:opacity-50"
            >
              @if (auth.authMethod() === 'zklogin') {
                Confirm & Create Agent
              } @else {
                Sign with Google & Create Agent
              }
            </button>
          }

          @if (step() === 'auth') {
            <div class="text-center py-12">
              <div class="animate-spin w-8 h-8 border-2 border-[#8b5cf6] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p class="text-harbor-text-heading font-medium">Google Authentication</p>
              <p class="text-sm text-harbor-text-muted mt-1">Complete Google sign-in in the popup to create your agent wallet...</p>
              <button (click)="cancelAuth()" class="mt-6 text-sm text-harbor-text-muted hover:text-harbor-text-heading underline">Cancel</button>
            </div>
          }

          @if (step() === 'signing') {
            <div class="text-center py-12">
              <div class="animate-spin w-8 h-8 border-2 border-[#8b5cf6] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p class="text-harbor-text-heading font-medium">Creating Agent On-Chain</p>
              <p class="text-sm text-harbor-text-muted mt-1">Sign the transaction in your wallet...</p>
              @if (txError()) {
                <p class="mt-4 text-sm text-red-400">{{ txError() }}</p>
                <button (click)="step.set('form')" class="mt-4 rounded-lg bg-harbor-surface px-4 py-2 text-sm text-harbor-text-heading border border-harbor-border">Go Back</button>
              }
            </div>
          }

          @if (step() === 'done') {
            <div class="text-center py-12">
              <div class="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p class="text-harbor-text-heading font-medium">Agent Created!</p>
              <p class="text-sm text-harbor-text-muted mt-1">{{ name }}</p>
              <p class="text-xs text-harbor-text-muted mt-1 font-mono">Wallet: {{ agentWalletAddress() }}</p>
              @if (txDigest()) {
                <a
                  [href]="'https://suiscan.xyz/testnet/tx/' + txDigest()"
                  target="_blank"
                  class="mt-3 inline-block text-xs text-walrus-400 hover:text-walrus-300 underline"
                >
                  View Transaction →
                </a>
              }
              <button (click)="close.emit()" class="mt-6 rounded-lg bg-walrus-500 px-6 py-2 text-sm text-white hover:bg-walrus-600">Done</button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class CreateAgentDialogComponent {
  close = output();

  auth = inject(AuthStore);
  agentStore = inject(AgentStore);
  contract = inject(SuiContractService);
  zkLogin = inject(ZkLoginService);

  step = signal<'form' | 'auth' | 'signing' | 'done'>('form');
  txError = signal<string | null>(null);
  txDigest = signal<string>('');
  currentEpoch = signal(0);
  agentWalletAddress = signal('');

  name = '';
  budgetCap = 100;
  initialFund = 10;
  expiryEpoch: number | null = null;

  protocolOptions = [
    { key: 'deepbook', label: 'DeepBook' },
    { key: 'cetus', label: 'Cetus' },
    { key: 'walrus', label: 'Walrus' },
    { key: 'sui_rpc', label: 'Sui RPC' },
  ];
  toolOptions = [
    { key: 'swap', label: 'Swap' },
    { key: 'lend', label: 'Lend' },
    { key: 'borrow', label: 'Borrow' },
    { key: 'query', label: 'Query' },
  ];

  selectedProtocols = signal<string[]>([]);
  selectedTools = signal<string[]>([]);

  constructor() {
    this.contract.getCurrentEpoch().then(e => this.currentEpoch.set(e));
  }

  toggleProtocol(key: string) {
    this.selectedProtocols.update(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]);
  }
  toggleTool(key: string) {
    this.selectedTools.update(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]);
  }
  cancelAuth() { this.step.set('form'); }

  async createAgent() {
    if (!this.auth.isConnected()) {
      alert('Please connect your wallet first');
      return;
    }

    this.txError.set(null);

    try {
      let agentWalletAddress: string;
      let storedSecretKey: string | null = null;
      let storedProofPoints: any = null;
      let storedIssBase64: any = null;
      let storedHeaderBase64: string | null = null;
      let storedSalt: string | null = null;
      let storedMaxEpoch = 0;
      let storedToken: string | null = null;

      // Case 1: User is already zkLogin — reuse their session for agent wallet
      if (this.auth.authMethod() === 'zklogin') {
        const session = this.auth.zkLoginSession();
        if (!session) throw new Error('No zkLogin session');
        agentWalletAddress = session.address;
        storedSecretKey = session.secretKey;
        storedProofPoints = session.proofPoints;
        storedIssBase64 = session.issBase64Details;
        storedHeaderBase64 = session.headerBase64;
        storedSalt = session.salt;
        storedMaxEpoch = session.maxEpoch;
        storedToken = session.token;
      }
      // Case 2: Wallet connect user — popup Google OAuth for agent wallet
      else {
        this.step.set('auth');
        const agentData = await this.zkLogin.openAgentWalletAuth();
        agentWalletAddress = agentData.walletAddress;
        storedSecretKey = agentData.keypair.getSecretKey();
        storedProofPoints = agentData.proofPoints;
        storedIssBase64 = agentData.issBase64Details;
        storedHeaderBase64 = agentData.headerBase64;
        storedSalt = agentData.salt;
        storedMaxEpoch = agentData.maxEpoch;
        storedToken = agentData.token;
      }

      this.agentWalletAddress.set(agentWalletAddress);
      this.step.set('signing');

      const expiry = this.expiryEpoch && this.expiryEpoch > 0
        ? this.expiryEpoch
        : this.currentEpoch() + 100_000;

      const budgetMist = this.budgetCap * 1_000_000_000;
      const fundMist = this.initialFund * 1_000_000_000;

      const tx = this.contract.buildCreateAgentTx(
        agentWalletAddress,
        budgetMist,
        this.selectedProtocols(),
        this.selectedTools(),
        expiry,
        fundMist > 0 ? fundMist : undefined,
      );

      this.txDigest.set(await this.contract.executeTx(tx));

      // Store agent wallet key material for runtime
      localStorage.setItem(`agent_wallet_${agentWalletAddress}`, JSON.stringify({
        address: agentWalletAddress,
        secretKey: storedSecretKey,
        proofPoints: storedProofPoints,
        issBase64Details: storedIssBase64,
        headerBase64: storedHeaderBase64,
        salt: storedSalt,
        maxEpoch: storedMaxEpoch,
        token: storedToken,
      }));

      // Register with backend
      try {
        await fetch(`${(import.meta as any).env?.VITE_RUNTIME_URL || 'http://localhost:3001'}/api/v1/agents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: agentWalletAddress,
            name: this.name || `Agent 0x${agentWalletAddress.slice(0, 8)}`,
            walletAddress: agentWalletAddress,
            ownerAddress: this.auth.address(),
            budgetCap: this.budgetCap,
            protocols: this.selectedProtocols(),
            tools: this.selectedTools(),
          }),
        });
      } catch { /* optional */ }

      this.agentStore.addAgentToStore({
        id: agentWalletAddress,
        name: this.name || `Agent 0x${agentWalletAddress.slice(0, 8)}`,
        policyId: '',
        walletAddress: agentWalletAddress,
        ownerAddress: this.auth.address(),
        status: 'active',
        budgetCap: this.budgetCap,
        budgetUsed: 0,
        createdAt: new Date().toISOString(),
        lastRunAt: null,
        activityLog: [],
        protocols: this.selectedProtocols(),
        tools: this.selectedTools(),
      });

      this.step.set('done');
    } catch (err: any) {
      console.error('Agent creation failed:', err);
      this.txError.set(err.message || 'Failed to create agent');
      this.step.set('signing');
    }
  }
}
