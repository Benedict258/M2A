import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface SuiContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  authMethod: 'wallet' | 'zklogin' | null;
  connectWallet: () => Promise<void>;
  startZkLogin: () => void;
  disconnect: () => void;
  zkLoginSession: any;
}

const SuiContext = createContext<SuiContextType>(null!);

export function useSui() { return useContext(SuiContext); }

const ZKL_SERVICE = 'https://zklservicest3rdwl.up.railway.app';
const ZKL_API_KEY = (import.meta as any).env?.VITE_ZKL_API_KEY || '';

export function SuiProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [authMethod, setAuthMethod] = useState<'wallet' | 'zklogin' | null>(null);
  const [zkLoginSession, setZkLoginSession] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('zklogin_user');
    if (saved) {
      const session = JSON.parse(saved);
      setZkLoginSession(session);
      setAddress(session.address);
      setIsConnected(true);
      setAuthMethod('zklogin');
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      if (typeof window !== 'undefined' && (window as any).suiWallet) {
        const wallet = (window as any).suiWallet;
        const accounts = await wallet.requestAccounts();
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          setAuthMethod('wallet');
        }
      } else {
        window.open('https://chromewebstore.google.com/detail/sui-wallet', '_blank');
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setIsConnecting(false);
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

    sessionStorage.setItem('zklogin_ephemeral', JSON.stringify({
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
    setAuthMethod(null);
  }, []);

  return (
    <SuiContext.Provider value={{ address, isConnected, isConnecting, authMethod, connectWallet, startZkLogin, disconnect, zkLoginSession }}>
      {children}
    </SuiContext.Provider>
  );
}
