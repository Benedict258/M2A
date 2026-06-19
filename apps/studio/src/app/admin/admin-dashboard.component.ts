import { Component, output } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" (click)="close.emit()">
      <div class="h-[85vh] w-full max-w-4xl animate-slide-up rounded-2xl border border-harbor-border bg-harbor-card-bg shadow-2xl flex flex-col" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-harbor-border px-6 py-4">
          <h2 class="text-lg font-semibold text-harbor-text-heading">Admin Dashboard</h2>
          <button (click)="close.emit()" class="text-harbor-text-muted hover:text-harbor-text-heading">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <div class="mb-6 grid grid-cols-4 gap-4">
            @for (stat of stats; track stat.label) {
              <div class="rounded-xl border border-harbor-border bg-harbor-surface p-4">
                <div class="text-2xl font-bold text-harbor-text-heading">{{ stat.value }}</div>
                <div class="mt-1 text-xs text-harbor-text-muted">{{ stat.label }}</div>
              </div>
            }
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div>
              <h3 class="mb-3 text-sm font-semibold text-harbor-text-heading">Recent Activity</h3>
              <div class="space-y-2">
                @for (activity of recentActivity; track activity) {
                  <div class="rounded-lg border border-harbor-border bg-harbor-surface px-3 py-2 text-xs">
                    <div class="text-harbor-text-body">{{ activity }}</div>
                    <div class="mt-0.5 text-harbor-text-muted">Just now</div>
                  </div>
                } @empty {
                  <div class="py-8 text-center text-sm text-harbor-text-muted">No recent activity</div>
                }
              </div>
            </div>

            <div>
              <h3 class="mb-3 text-sm font-semibold text-harbor-text-heading">System Health</h3>
              <div class="space-y-2">
                @for (item of healthItems; track item.label) {
                  <div class="flex items-center justify-between rounded-lg border border-harbor-border bg-harbor-surface px-3 py-2 text-xs">
                    <span class="text-harbor-text-body">{{ item.label }}</span>
                    <span class="flex items-center gap-1.5" [class.text-green-400]="item.status === 'healthy'" [class.text-red-400]="item.status === 'error'">
                      <span class="h-1.5 w-1.5 rounded-full" [class.bg-green-400]="item.status === 'healthy'" [class.bg-red-400]="item.status === 'error'"></span>
                      {{ item.status }}
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent {
  close = output();

  stats = [
    { label: 'Total Agents', value: '0' },
    { label: 'Total Workflows', value: '0' },
    { label: 'Active Policies', value: '0' },
    { label: 'Memory Usage', value: '0 GB' },
  ];

  recentActivity: string[] = [];
  healthItems: Array<{ label: string; status: string }> = [
    { label: 'Relayer Connection', status: 'healthy' },
    { label: 'Sui RPC Endpoint', status: 'healthy' },
    { label: 'Memory Pool Service', status: 'healthy' },
    { label: 'Workflow Engine', status: 'healthy' },
  ];
}
