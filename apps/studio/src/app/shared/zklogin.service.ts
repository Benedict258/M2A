import { Injectable } from '@angular/core';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiContractService } from '../shared/contract.service';

export interface AgentZkLoginData {
  address: string;
  walletAddress: string;
  keypair: Ed25519Keypair;
  proofPoints: any;
  issBase64Details: any;
  headerBase64: string;
  salt: string;
  maxEpoch: number;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class ZkLoginService {
  private popupWindow: Window | null = null;
  private popupCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private contract: SuiContractService) {}

  /** Open a popup for Google OAuth to create an agent wallet */
  async openAgentWalletAuth(): Promise<AgentZkLoginData> {
    // Generate ephemeral keypair
    const keypair = Ed25519Keypair.generate();
    const publicKey = keypair.getPublicKey();

    // Get current epoch for nonce
    const epoch = await this.contract.getCurrentEpoch();
    const maxEpoch = epoch + 100;
    const nonce = `${epoch}:${maxEpoch}:${publicKey.toBase64()}`;

    // Store ephemeral key for the popup callback
    const stateId = crypto.randomUUID();
    sessionStorage.setItem(`zklogin_agent_${stateId}`, JSON.stringify({
      secretKey: keypair.getSecretKey(),
      publicKey: publicKey.toBase64(),
      nonce,
      epoch,
      maxEpoch,
    }));

    const apiKey = (import.meta as any).env?.VITE_ZKL_API_KEY || '';
    const redirect = encodeURIComponent(`${window.location.origin}/agent-callback`);

    // Open popup
    const url = `https://zklservicest3rdwl.up.railway.app/auth/google?nonce=${encodeURIComponent(nonce)}&api_key=${apiKey}&redirect=${redirect}&state=${stateId}`;

    return new Promise((resolve, reject) => {
      this.popupWindow = window.open(url, 'zklogin_agent', 'width=600,height=700');
      if (!this.popupWindow) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      // Poll for the popup to complete
      this.popupCheckInterval = setInterval(async () => {
        try {
          if (this.popupWindow?.closed) {
            this.cleanup();
            // Check if we got callback data in sessionStorage
            const result = sessionStorage.getItem(`zklogin_agent_result_${stateId}`);
            if (result) {
              sessionStorage.removeItem(`zklogin_agent_result_${stateId}`);
              const params = JSON.parse(result);
              const agentData = await this.completeZkLogin(stateId, params);
              resolve(agentData);
            } else {
              reject(new Error('Popup closed without completing authentication'));
            }
          }
        } catch {
          // popup might be on different origin, ignore
        }
      }, 500);

      // Timeout after 5 minutes
      setTimeout(() => {
        this.cleanup();
        this.popupWindow?.close();
        reject(new Error('Authentication timed out'));
      }, 300_000);
    });
  }

  /** Complete the zkLogin flow after popup callback */
  async completeZkLogin(stateId: string, params: { token: string; salt: string; address: string }): Promise<AgentZkLoginData> {
    const stored = sessionStorage.getItem(`zklogin_agent_${stateId}`);
    if (!stored) throw new Error('No ephemeral key found');
    const ephemeralData = JSON.parse(stored);
    const keypair = Ed25519Keypair.fromSecretKey(ephemeralData.secretKey);
    sessionStorage.removeItem(`zklogin_agent_${stateId}`);

    // Get the zkLogin proof from the service
    const resp = await fetch(`https://zklservicest3rdwl.up.railway.app/prove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: params.token,
        salt: params.salt,
        key_claim_name: 'sub',
      }),
    });
    if (!resp.ok) throw new Error('Failed to get zk proof');
    const proofResult = await resp.json();

    return {
      address: params.address,
      walletAddress: params.address,
      keypair,
      proofPoints: proofResult.proof_points,
      issBase64Details: proofResult.iss_base64_details,
      headerBase64: proofResult.header_base64,
      salt: params.salt,
      maxEpoch: ephemeralData.maxEpoch,
      token: params.token,
    };
  }

  private cleanup() {
    if (this.popupCheckInterval) {
      clearInterval(this.popupCheckInterval);
      this.popupCheckInterval = null;
    }
    this.popupWindow = null;
  }
}
