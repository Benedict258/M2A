import { Component, input, output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConnectWalletComponent } from '../auth/connect-wallet.component';
import { ClickOutsideDirective } from '../shared/click-outside.directive';
import { AgentStore } from '../stores/agent.store';
import type { Agent } from '../shared/types';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule, ConnectWalletComponent, ClickOutsideDirective],
  template: `
    <header
      class="flex h-14 items-center justify-between border-b border-harbor-border bg-harbor-surface px-4"
    >
      <div class="flex items-center gap-3">
        <button
          (click)="toggleSidebar.emit()"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-harbor-text-muted transition-colors hover:bg-harbor-control-hover hover:text-harbor-text-heading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold text-harbor-text-heading">M2A</span>
          <span class="rounded-md bg-walrus-500/20 px-1.5 py-0.5 text-[10px] font-medium text-walrus-400 uppercase tracking-wider">Studio</span>
        </div>

        <div class="mx-3 h-5 w-px bg-harbor-border"></div>

        <input
          [ngModel]="workflowName()"
          (ngModelChange)="workflowNameChange.emit($event)"
          class="h-8 rounded-lg border border-transparent bg-transparent px-2 text-sm text-harbor-text-heading outline-none transition-colors focus:border-harbor-border-input focus:bg-harbor-control-bg"
          placeholder="Workflow name..."
        />
      </div>

      <div class="flex items-center gap-2">
        <!-- Agent Selector -->
        @if (agentStore.agents().length > 0) {
          <div class="relative" #agentDropdown>
            <button
              (click)="agentOpen = !agentOpen"
              class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-harbor-border bg-harbor-card-bg px-3 text-xs font-medium text-harbor-text-body transition-colors hover:bg-harbor-control-hover"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              {{ selectedAgentName() }}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            @if (agentOpen) {
              <div
                class="absolute right-0 top-full z-50 mt-1 w-64 origin-top-right animate-fade-in rounded-xl border border-harbor-border bg-harbor-card-bg p-1.5 shadow-2xl"
                (clickOutside)="agentOpen = false"
              >
                @for (agent of agentStore.agents(); track agent.id) {
                  <button
                    (click)="agentStore.selectAgent(agent.id); agentOpen = false"
                    class="context-menu-item w-full"
                    [style.background]="agentStore.selectedAgentId() === agent.id ? 'rgba(139, 92, 246, 0.1)' : ''"
                  >
                    <div class="flex items-center gap-2">
                      <span class="flex h-2 w-2 rounded-full" [style.background]="agent.status === 'active' ? '#22c55e' : '#ef4444'"></span>
                      <span class="flex-1 text-left">{{ agent.name }}</span>
                      <span class="text-[10px] text-harbor-text-muted">{{ agent.budgetUsed }}/{{ agent.budgetCap }} SUI</span>
                    </div>
                  </button>
                }
                <div class="context-menu-divider"></div>
                <button (click)="openCreateAgent.emit(); agentOpen = false" class="context-menu-item w-full text-walrus-400">
                  + Create Agent
                </button>
              </div>
            }
          </div>
        }

        <!-- Create Agent Button (always visible if no agents) -->
        @if (agentStore.agents().length === 0) {
          <button
            (click)="openCreateAgent.emit()"
            class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-walrus-500/30 bg-walrus-500/10 px-3 text-xs font-medium text-walrus-400 transition-colors hover:bg-walrus-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Agent
          </button>
        }

        <!-- Top Up -->
        @if (selectedAgent(); as agent) {
          <button
            (click)="openTopUp.emit(agent)"
            class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-harbor-border bg-harbor-card-bg px-3 text-xs font-medium text-harbor-text-body transition-colors hover:bg-harbor-control-hover"
            title="Top up agent budget"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Top Up
          </button>
        }

        <!-- Run Button -->
        <button
          (click)="run.emit()"
          [disabled]="isExecuting()"
          class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-walrus-500 px-3 text-sm font-medium text-white transition-all hover:bg-walrus-600 active:translate-y-px disabled:opacity-50"
        >
          @if (isExecuting()) {
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          }
          {{ isExecuting() ? 'Running...' : 'Run' }}
        </button>

        <div class="relative" #dropdown>
          <button
            (click)="moreOpen = !moreOpen"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-harbor-text-muted transition-colors hover:bg-harbor-control-hover hover:text-harbor-text-heading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
          </button>

          @if (moreOpen) {
            <div
              class="absolute right-0 top-full z-50 mt-1 w-56 origin-top-right animate-fade-in rounded-xl border border-harbor-border bg-harbor-card-bg p-1.5 shadow-2xl"
              (clickOutside)="moreOpen = false"
            >
              <button (click)="openTemplates.emit(); moreOpen = false" class="context-menu-item w-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                Templates
              </button>
              <button (click)="exportMCP.emit(); moreOpen = false" class="context-menu-item w-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export MCP
              </button>
              <div class="context-menu-divider"></div>
              <button (click)="openAdmin.emit(); moreOpen = false" class="context-menu-item w-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Admin
              </button>
              <div class="context-menu-divider"></div>
              <button (click)="openCreateAgent.emit(); moreOpen = false" class="context-menu-item w-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                Create Agent
              </button>
            </div>
          }
        </div>

        <app-connect-wallet />
      </div>
    </header>
  `,
})
export class HeaderComponent {
  agentStore = inject(AgentStore);

  workflowName = input<string>('');
  isExecuting = input<boolean>(false);
  sidebarOpen = input<boolean>(true);
  toggleSidebar = output();
  workflowNameChange = output<string>();
  run = output();
  openTemplates = output();
  openAdmin = output();
  openCreateAgent = output();
  openTopUp = output<import('../shared/types').Agent>();
  exportMCP = output();
  moreOpen = false;
  agentOpen = false;

  selectedAgent = () => {
    const id = this.agentStore.selectedAgentId();
    return this.agentStore.agents().find(a => a.id === id) ?? null;
  };

  selectedAgentName = () => {
    const agent = this.selectedAgent();
    return agent ? agent.name : 'Select Agent';
  };
}
