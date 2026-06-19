import { Component, input, output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Agent } from '../shared/types';
import { SuiContractService } from '../shared/contract.service';
import { AgentStore } from '../stores/agent.store';

@Component({
  selector: 'app-agent-top-up-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" (click)="close.emit()">
      <div class="w-full max-w-sm animate-slide-up rounded-2xl border border-harbor-border bg-harbor-card-bg shadow-2xl" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-harbor-border px-6 py-4">
          <h2 class="text-lg font-semibold text-harbor-text-heading">Top Up Agent</h2>
          <button (click)="close.emit()" class="text-harbor-text-muted hover:text-harbor-text-heading">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Agent</label>
            <div class="text-sm text-harbor-text-heading">{{ agent().name }}</div>
            <div class="text-xs text-harbor-text-muted font-mono">{{ agent().walletAddress.slice(0, 10) }}...</div>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Current Budget</label>
            <div class="text-sm text-harbor-text-heading">{{ agent().budgetCap }} SUI ({{ agent().budgetUsed }} used)</div>
          </div>

          <div>
            <label class="mb-1.5 block text-xs font-medium text-harbor-text-secondary">Top Up Amount (SUI)</label>
            <input
              type="number"
              [(ngModel)]="amount"
              placeholder="10"
              class="w-full rounded-lg border border-harbor-border-input bg-harbor-surface px-3 py-2.5 text-sm text-harbor-text-heading outline-none placeholder:text-harbor-text-muted focus:border-walrus-400"
            />
          </div>

          @if (error()) {
            <p class="text-sm text-red-400">{{ error() }}</p>
          }

          <button
            (click)="handleTopUp()"
            [disabled]="isLoading() || amount <= 0"
            class="w-full rounded-lg bg-walrus-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-walrus-600 disabled:opacity-50"
          >
            @if (isLoading()) {
              <span class="inline-flex items-center gap-2">
                <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Signing...
              </span>
            } @else {
              Sign & Top Up
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AgentTopUpDialogComponent {
  agent = input.required<Agent>();
  close = output();

  private contract = inject(SuiContractService);
  private agentStore = inject(AgentStore);

  amount = 10;
  isLoading = signal(false);
  error = signal<string | null>(null);

  async handleTopUp() {
    if (this.amount <= 0) return;
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const amountMist = this.amount * 1_000_000_000;
      const tx = this.contract.buildTopUpTx(this.agent().policyId, amountMist);
      const digest = await this.contract.executeTx(tx);

      this.agentStore.updateAgent(this.agent().id, {
        budgetCap: this.agent().budgetCap + this.amount,
      });

      this.close.emit();
    } catch (err: any) {
      this.error.set(err.message || 'Top up failed');
    } finally {
      this.isLoading.set(false);
    }
  }
}
