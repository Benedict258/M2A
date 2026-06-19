import { Injectable, signal, inject, NgZone, OnDestroy } from '@angular/core';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { generateNonce, generateRandomness } from '@mysten/sui/zklogin';
import { dAppKit } from '../shared/dapp-kit';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { environment } from '../../environments/environment';

export type AuthMethod = 'wallet' | 'zklogin' | null;

export interface ZkLoginSession {
  address: string;
  token: string;
  salt: string;
  sub: string;
  email: string;
  name: string;
  secretKey: string;
  proofPoints: any;
  issBase64Details: any;
  headerBase64: string;
  maxEpoch: number;
}

const ZKL_SERVICE = 'https://zklservicest3rdwl.up.railway.app';

@Injectable({ providedIn: 'root' })
export class AuthStore implements OnDestroy {
  private zone = inject(NgZone);

  address = signal<string>('');
  isConnected = signal(false);
  isConnecting = signal(false);
  balance = signal<number | null>(null);
  network = signal<string>('testnet');
  authMethod = signal<AuthMethod>(null);
  zkLoginSession = signal<ZkLoginSession | null>(null);

  private grpcClient: SuiGrpcClient;
  private unsubConnection: (() => void) | null = null;

  constructor() {
    const network = environment.suiNetwork === 'mainnet' ? 'mainnet' : 'testnet';
    this.grpcClient = new SuiGrpcClient({
      network,
      baseUrl: `https://fullnode.${network}.sui.io:443`,
    });

    try {
      this.unsubConnection = dAppKit.stores.$connection.subscribe((conn) => {
        this.zone.run(() => {
          if (conn.isConnected && this.authMethod() !== 'zklogin') {
            this.isConnected.set(true);
            this.isConnecting.set(conn.isConnecting);
            this.address.set(conn.account?.address || '');
            this.authMethod.set('wallet');
            this.refreshBalance();
          }
        });
      });
    } catch (err) {
      console.warn('Failed to subscribe to dApp Kit connection store:', err);
    }

    this.restoreZkLogin();
  }

  ngOnDestroy() {
    this.unsubConnection?.();
  }

  private restoreZkLogin() {
    try {
      const saved = localStorage.getItem('zklogin_user');
      if (saved) {
        const session = JSON.parse(saved) as ZkLoginSession;
        this.zkLoginSession.set(session);
        this.address.set(session.address);
        this.isConnected.set(true);
        this.authMethod.set('zklogin');
      }
    } catch { /* ignore */ }
  }

  /** Initiate zkLogin (Google OAuth redirect) */
  async startZkLogin() {
    this.isConnecting.set(true);

    const ephemeralKeyPair = new Ed25519Keypair();
    const ephemeralPublicKey = ephemeralKeyPair.getPublicKey();

    const resp = await fetch(`${ZKL_SERVICE}/v1/epoch`);
    const { epoch } = await resp.json();
    const maxEpoch = Number(epoch) + 20;

    const randomness = generateRandomness();
    const nonce = generateNonce(ephemeralPublicKey, maxEpoch, randomness);

    sessionStorage.setItem('zklogin_auth_ephemeral', JSON.stringify({
      secretKey: Array.from(ephemeralKeyPair.getSecretKey()),
      randomness,
      maxEpoch,
    }));

    const apiKey = (import.meta as any).env?.VITE_ZKL_API_KEY || '';
    const redirect = encodeURIComponent(window.location.origin);
    window.location.href = `${ZKL_SERVICE}/auth/google?nonce=${encodeURIComponent(nonce)}&api_key=${apiKey}&redirect=${redirect}`;
  }

  /** Complete zkLogin after OAuth callback */
  async completeZkLogin(params: { token: string; salt: string; address: string; sub?: string; email?: string; name?: string; maxEpoch?: string }) {
    const stored = sessionStorage.getItem('zklogin_auth_ephemeral');
    if (!stored) throw new Error('No ephemeral key found');
    const { secretKey, randomness, maxEpoch: storedMaxEpoch } = JSON.parse(stored);
    sessionStorage.removeItem('zklogin_auth_ephemeral');

    const maxEpoch = Number(params.maxEpoch) || storedMaxEpoch || 100;

    const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(new Uint8Array(secretKey));
    const ephemeralPublicKey = ephemeralKeyPair.getPublicKey();

    const proveResp = await fetch(`${ZKL_SERVICE}/auth/prove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jwt: params.token,
        extendedEphemeralPublicKey: ephemeralPublicKey.toSuiPublicKey(),
        maxEpoch,
        jwtRandomness: randomness,
        salt: params.salt,
        keyClaimName: 'sub',
      }),
    });
    if (!proveResp.ok) {
      const body = await proveResp.text();
      throw new Error(`Proof failed (${proveResp.status}): ${body}`);
    }
    const proof = await proveResp.json();

    const session: ZkLoginSession = {
      address: params.address,
      token: params.token,
      salt: params.salt,
      sub: params.sub || '',
      email: params.email || '',
      name: params.name || '',
      secretKey: JSON.stringify(Array.from(ephemeralKeyPair.getSecretKey())),
      proofPoints: proof.proofPoints,
      issBase64Details: proof.issBase64Details,
      headerBase64: proof.headerBase64,
      maxEpoch,
    };

    localStorage.setItem('zklogin_user', JSON.stringify(session));
    this.zkLoginSession.set(session);
    this.address.set(session.address);
    this.isConnected.set(true);
    this.authMethod.set('zklogin');
    this.isConnecting.set(false);
  }

  /** Disconnect */
  disconnect() {
    if (this.authMethod() === 'wallet') {
      dAppKit.disconnectWallet();
    } else {
      localStorage.removeItem('zklogin_user');
      this.zkLoginSession.set(null);
    }
    this.address.set('');
    this.isConnected.set(false);
    this.balance.set(null);
    this.authMethod.set(null);
  }

  async refreshBalance(): Promise<void> {
    const addr = this.address();
    if (!addr) return;
    try {
      const result = await this.grpcClient.listCoins({ owner: addr, coinType: '0x2::sui::SUI', limit: 100 });
      const total = (result.objects as any[]).reduce((sum: number, c: any) => {
        const balance = Number(c.balance);
        return sum + (isNaN(balance) ? 0 : balance);
      }, 0);
      this.balance.set(total / 1_000_000_000);
    } catch {
      this.balance.set(null);
    }
  }
}
