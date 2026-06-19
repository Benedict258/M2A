import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { generateNonce, generateRandomness } from '@mysten/sui/zklogin';
import type { CreateAgentWalletResult, AgentWalletConfig } from './types.js';

const DEFAULT_ZKL_URL = 'https://zklservicest3rdwl.up.railway.app';

export async function createAgentWallet(
  config: AgentWalletConfig = {},
): Promise<CreateAgentWalletResult> {
  const zklUrl = config.zklServiceUrl || DEFAULT_ZKL_URL;
  const apiKey = config.apiKey || process.env.ZKL_API_KEY || '';

  const ephemeralKeyPair = new Ed25519Keypair();
  const randomness = generateRandomness();

  const epochRes = await fetch(`${zklUrl}/v1/epoch`);
  const { epoch } = (await epochRes.json()) as { epoch: number };
  const maxEpoch = Number(epoch) + 20;
  const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);

  const oauthUrl = `${zklUrl}/auth/google?nonce=${nonce}${apiKey ? `&api_key=${apiKey}` : ''}`;

  return {
    ephemeralKeyPair,
    randomness,
    maxEpoch,
    nonce,
    oauthUrl,
  };
}

export function storeAgentSession(session: {
  secretKey: string;
  randomness: string;
  maxEpoch: number;
}): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('zklogin_agent_ephemeral', JSON.stringify({
      secretKey: Array.from(session.secretKey),
      randomness: session.randomness,
      maxEpoch: session.maxEpoch,
    }));
  }
}

export function restoreAgentSession(): {
  secretKey: number[];
  randomness: string;
  maxEpoch: number;
} | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem('zklogin_agent_ephemeral');
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function generateProof(
  jwt: string,
  ephemeralPublicKey: string,
  maxEpoch: number,
  randomness: string,
  salt: string,
  config: AgentWalletConfig = {},
): Promise<{
  proofPoints: any;
  issBase64Details: any;
  headerBase64: string;
}> {
  const zklUrl = config.zklServiceUrl || DEFAULT_ZKL_URL;

  const proveRes = await fetch(`${zklUrl}/auth/prove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jwt,
      extendedEphemeralPublicKey: ephemeralPublicKey,
      maxEpoch,
      jwtRandomness: randomness,
      salt,
      keyClaimName: 'sub',
    }),
  });

  if (!proveRes.ok) {
    const errBody = await proveRes.text();
    throw new Error(`zkLogin proof generation failed: ${proveRes.status} ${errBody}`);
  }

  return (await proveRes.json()) as {
    proofPoints: any;
    issBase64Details: any;
    headerBase64: string;
  };
}
