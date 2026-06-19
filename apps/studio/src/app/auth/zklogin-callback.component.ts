import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

@Component({
  selector: 'app-zklogin-callback',
  standalone: true,
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-harbor-surface p-6 text-center">
      @if (error()) {
        <div class="flex flex-col items-center gap-4">
          <p class="text-xs font-medium uppercase tracking-widest text-harbor-text-muted">Error</p>
          <h1 class="text-2xl font-semibold text-harbor-text-heading">Authentication Failed</h1>
          <p class="max-w-sm text-sm text-harbor-text-secondary">{{ error() }}</p>
          <button
            (click)="router.navigate(['/'])"
            class="mt-2 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-harbor-border bg-harbor-card-bg px-4 text-sm font-medium text-harbor-text-body transition-colors hover:bg-harbor-control-hover hover:text-harbor-text-heading"
          >
            Back to home
          </button>
        </div>
      } @else {
        <div class="flex flex-col items-center gap-4">
          <div class="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-walrus-400 border-t-transparent"></div>
          <h1 class="text-xl font-semibold text-harbor-text-heading">Signing in...</h1>
          <p class="text-sm text-harbor-text-secondary">Completing zkLogin authentication</p>
        </div>
      }
    </div>
  `,
})
export class ZkLoginCallbackComponent implements OnInit {
  private auth = inject(AuthStore);
  router = inject(Router);
  error = signal('');

  async ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const salt = params.get('salt');
    const address = params.get('address');
    const errorParam = params.get('error');

    if (errorParam) {
      this.error.set(errorParam);
      return;
    }

    if (!token || !salt || !address) {
      this.error.set('Missing authentication parameters.');
      return;
    }

    try {
      await this.auth.completeZkLogin({
        address,
        token,
        salt,
        sub: params.get('sub') || '',
        email: params.get('email') || '',
        name: params.get('name') || '',
        maxEpoch: params.get('maxEpoch') || undefined,
      });
      setTimeout(() => this.router.navigate(['/']), 1500);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to complete authentication.');
    }
  }
}
