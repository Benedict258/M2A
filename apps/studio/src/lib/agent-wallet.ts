const ZKL_SERVICE = "https://zklservicest3rdwl.up.railway.app";
const ZKL_API_KEY = (import.meta as any).env?.VITE_ZKL_API_KEY || "";

export async function startAgentZkLogin() {
  const { Ed25519Keypair } = await import("@mysten/sui/keypairs/ed25519");
  const { generateNonce, generateRandomness } = await import("@mysten/sui/zklogin");

  const keypair = new Ed25519Keypair();
  const randomness = generateRandomness();
  const epochRes = await fetch(`${ZKL_SERVICE}/v1/epoch`);
  const { epoch } = await epochRes.json();
  const maxEpoch = Number(epoch) + 20;
  const nonce = generateNonce(keypair.getPublicKey(), maxEpoch, randomness);

  localStorage.setItem(
    "zklogin_ephemeral",
    JSON.stringify({
      secretKey: keypair.getSecretKey(),
      randomness,
      maxEpoch,
    }),
  );

  const redirect = encodeURIComponent(`${window.location.origin}/zklogin-callback`);
  window.location.href = `${ZKL_SERVICE}/auth/google?nonce=${encodeURIComponent(nonce)}&api_key=${ZKL_API_KEY}&redirect=${redirect}`;
}

export function getAgentWalletSession(): { address: string; secretKey: string } | null {
  const saved = localStorage.getItem("zklogin_user");
  if (!saved) return null;
  try {
    const session = JSON.parse(saved);
    if (session.address && session.secretKey) {
      return { address: session.address, secretKey: session.secretKey };
    }
  } catch {}
  return null;
}

export function clearAgentWalletSession() {
  localStorage.removeItem("zklogin_user");
  localStorage.removeItem("zklogin_ephemeral");
}
