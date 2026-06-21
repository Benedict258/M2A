import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

const ZKL_SERVICE = 'https://zklservicest3rdwl.up.railway.app';

export const Route = createFileRoute('/zklogin-callback')({
  component: ZkLoginCallback,
});

function ZkLoginCallback() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const salt = params.get('salt');
    const address = params.get('address');
    const urlMaxEpoch = params.get('maxEpoch');

    if (!token || !salt || !address) {
      setError('Missing authentication parameters.');
      return;
    }

    const stored = localStorage.getItem('zklogin_ephemeral');
    if (!stored) {
      setError('No ephemeral key found. Please try signing in again.');
      return;
    }
    const data = JSON.parse(stored);
    localStorage.removeItem('zklogin_ephemeral');

    (async () => {
      const { Ed25519Keypair } = await import('@mysten/sui/keypairs/ed25519');
      const keypair = Ed25519Keypair.fromSecretKey(new Uint8Array(data.secretKey));
      const pk = keypair.getPublicKey();

      const maxEpoch = urlMaxEpoch ? Number(urlMaxEpoch) : data.maxEpoch;

      const res = await fetch(`${ZKL_SERVICE}/auth/prove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jwt: token,
          extendedEphemeralPublicKey: pk.toSuiPublicKey(),
          maxEpoch,
          jwtRandomness: data.randomness,
          salt,
          keyClaimName: 'sub',
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        setError(`Proof generation failed (${res.status})${text ? ': ' + text : ''}`);
        return;
      }

      const proof = await res.json();
      const session = {
        address,
        token,
        salt,
        proofPoints: proof.proofPoints,
        issBase64Details: proof.issBase64Details,
        headerBase64: proof.headerBase64,
        maxEpoch,
        secretKey: data.secretKey,
      };
      localStorage.setItem('zklogin_user', JSON.stringify(session));

      navigate({ to: '/' });
    })();
  }, []);

  if (error) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-red-400">{error}</p></div>;
  }
  return <div className="flex min-h-screen items-center justify-center"><p className="text-white">Signing in...</p></div>;
}
