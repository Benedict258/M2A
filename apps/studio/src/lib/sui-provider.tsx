import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface ZkLoginContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  authMethod: 'zklogin' | null;
  startZkLogin: () => void;
  disconnect: () => void;
  zkLoginSession: any;
}

const ZkLoginContext = createContext<ZkLoginContextType>(null!);

export function useSui() { return useContext(ZkLoginContext); }

const ZKL_SERVICE = 'https://zklservicest3rdwl.up.railway.app';
const ZKL_API_KEY = (import.meta as any).env?.VITE_ZKL_API_KEY || '';

export function SuiProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [authMethod] = useState<'zklogin' | null>('zklogin');
  const [zkLoginSession, setZkLoginSession] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('zklogin_user');
    if (saved) {
      const session = JSON.parse(saved);
      setZkLoginSession(session);
      setAddress(session.address);
      setIsConnected(true);
    }
  }, []);

  const startZkLogin = useCallback(async () => {
    setIsConnecting(true);
    const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');
    const { generateNonce, generateRandomness } = await import('@mysten/sui/zklogin');

    const keypair = new Ed25519Keypair();
    const randomness = generateRandomness();
    const epochRes = await fetch(`${ZKL_SERVICE}/v1/epoch`);
    const { epoch } = await epochRes.json();
    const maxEpoch = Number(epoch) + 20;
    const nonce = generateNonce(keypair.getPublicKey(), maxEpoch, randomness);

    localStorage.setItem('zklogin_ephemeral', JSON.stringify({
      secretKey: Array.from(keypair.getSecretKey()),
      randomness,
      maxEpoch,
    }));

    const redirect = encodeURIComponent(`${window.location.origin}/zklogin-callback`);
    window.location.href = `${ZKL_SERVICE}/auth/google?nonce=${encodeURIComponent(nonce)}&api_key=${ZKL_API_KEY}&redirect=${redirect}`;
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem('zklogin_user');
    setZkLoginSession(null);
    setAddress(null);
    setIsConnected(false);
  }, []);

  return (
    <ZkLoginContext.Provider value={{ address, isConnected, isConnecting, authMethod, startZkLogin, disconnect, zkLoginSession }}>
      {children}
    </ZkLoginContext.Provider>
  );
}
