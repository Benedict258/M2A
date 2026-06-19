import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { AuthStore } from '../stores/auth.store';
import { dAppKit } from '../shared/dapp-kit';

@Component({
  selector: 'app-connect-wallet',
  standalone: true,
  template: `
    <div class="relative" #walletDropdown>
      @if (!auth.isConnected()) {
        <div class="flex items-center gap-1">
          <button
            (click)="showWalletPicker.set(true)"
            class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-harbor-border bg-harbor-card-bg px-3 text-sm text-harbor-text-body transition-colors hover:bg-harbor-control-hover"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Connect Wallet
          </button>
          <button
            (click)="auth.startZkLogin()"
            class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-harbor-border bg-harbor-card-bg px-3 text-sm text-harbor-text-body transition-colors hover:bg-harbor-control-hover"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google
          </button>
        </div>
      } @else {
        <button
          (click)="showMenu.set(!showMenu())"
          class="inline-flex h-8 items-center gap-2 rounded-lg border border-harbor-border bg-harbor-card-bg px-3 text-sm text-harbor-text-body transition-colors hover:bg-harbor-control-hover"
        >
          <span class="flex h-2 w-2 rounded-full bg-green-500"></span>
          @if (auth.authMethod() === 'zklogin') {
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#4285F4"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          }
          {{ auth.address().slice(0, 6) }}...{{ auth.address().slice(-4) }}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      }

      <!-- Connected menu dropdown -->
      @if (showMenu() && auth.isConnected()) {
        <div
          class="absolute right-0 top-full z-50 mt-1 w-64 origin-top-right animate-fade-in rounded-xl border border-harbor-border bg-harbor-card-bg p-1.5 shadow-2xl"
        >
          <div class="px-3 py-2 text-xs text-harbor-text-muted">
            @if (auth.authMethod() === 'zklogin') {
              Signed in with Google
            } @else {
              Connected via Sui Wallet
            }
          </div>
          <div class="px-3 py-1 text-sm text-harbor-text-heading font-mono break-all text-xs">
            {{ auth.address() }}
          </div>
          @if (auth.balance(); as b) {
            <div class="px-3 py-1 text-xs text-harbor-text-secondary">
              Balance: {{ b }} SUI
            </div>
          }
          <div class="context-menu-divider"></div>
          <button (click)="disconnect()" class="context-menu-item w-full text-harbor-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Disconnect
          </button>
        </div>
      }

      <!-- Wallet picker modal -->
      @if (showWalletPicker()) {
        <div
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          (click)="showWalletPicker.set(false)"
        >
          <div class="w-full max-w-sm animate-slide-up rounded-2xl border border-harbor-border bg-harbor-card-bg shadow-2xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between border-b border-harbor-border px-5 py-3">
              <h2 class="text-sm font-semibold text-harbor-text-heading">Connect a Wallet</h2>
              <button (click)="showWalletPicker.set(false)" class="text-harbor-text-muted hover:text-harbor-text-heading">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="p-4 space-y-2 max-h-80 overflow-y-auto">
              @if (availableWallets().length === 0) {
                <div class="py-6 text-center">
                  <div class="mx-auto mb-3 w-12 h-12 rounded-xl bg-harbor-surface flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  </div>
                  <p class="text-sm text-harbor-text-heading font-medium mb-1">No wallet detected</p>
                  <p class="text-xs text-harbor-text-muted">Install a Sui wallet like Sui Wallet or Martian Wallet to continue.</p>
                  <div class="mt-4 flex flex-col gap-2">
                    <a
                      href="https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil"
                      target="_blank"
                      class="rounded-lg bg-harbor-surface px-4 py-2 text-xs text-harbor-text-heading border border-harbor-border hover:bg-harbor-control-hover"
                    >
                      Get Sui Wallet
                    </a>
                    <button
                      (click)="showWalletPicker.set(false); auth.startZkLogin()"
                      class="rounded-lg bg-walrus-500 px-4 py-2 text-xs text-white hover:bg-walrus-600"
                    >
                      Sign in with Google instead
                    </button>
                  </div>
                </div>
              }
              @for (wallet of availableWallets(); track wallet.name) {
                <button
                  (click)="connectWallet(wallet)"
                  class="flex w-full items-center gap-3 rounded-xl border border-harbor-border bg-harbor-surface p-3 text-left transition-colors hover:border-walrus-400/30 hover:bg-walrus-500/5"
                >
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-harbor-card-bg overflow-hidden">
                    @if (wallet.icon) {
                      <img [src]="wallet.icon" [alt]="wallet.name" class="h-7 w-7 object-contain" />
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-harbor-text-heading">{{ wallet.name }}</div>
                    <div class="text-xs text-harbor-text-muted">{{ wallet.accounts?.length || 0 }} account(s)</div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              }
            </div>
            <div class="border-t border-harbor-border p-3 text-center">
              <button
                (click)="showWalletPicker.set(false); auth.startZkLogin()"
                class="inline-flex items-center gap-2 text-xs text-harbor-text-muted hover:text-harbor-text-heading"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ConnectWalletComponent implements OnInit, OnDestroy {
  auth = inject(AuthStore);
  showMenu = signal(false);
  showWalletPicker = signal(false);
  availableWallets = signal<Array<{ name: string; icon?: string; accounts?: string[] }>>([]);

  private unsub: (() => void) | null = null;

  ngOnInit() {
    this.unsub = dAppKit.stores.$wallets.subscribe((wallets: any) => {
      const raw = Array.isArray(wallets) ? wallets : [];
      console.log('[ConnectWallet] Detected wallets:', raw.map((w: any) => ({ name: w.name, icon: !!w.icon, accounts: w.accounts?.length })));
      this.availableWallets.set(
        raw
          .filter((w: any) => w.name !== 'Slush')
          .map((w: any) => ({
            name: w.name || 'Unknown',
            icon: w.icon,
            accounts: w.accounts?.map((a: any) => a.address) || [],
          }))
      );
    });
  }

  ngOnDestroy() {
    this.unsub?.();
  }

  async connectWallet(wallet: { name: string }) {
    try {
      await dAppKit.connectWallet({ wallet } as any);
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
    }
    this.showWalletPicker.set(false);
  }

  disconnect() {
    this.auth.disconnect();
    this.showMenu.set(false);
  }
}
