import { Transaction } from '@mysten/sui/transactions';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { getZkLoginSignature } from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import type { ZkLoginSession, SignedTransactionResult } from './types.js';

export async function executeWithZkLogin(
  tx: Transaction,
  session: ZkLoginSession,
  network?: string,
  baseUrl?: string,
): Promise<SignedTransactionResult> {
  const suiClient = new SuiGrpcClient({
    network: (network as any) || 'testnet',
    baseUrl: baseUrl || 'https://fullnode.testnet.sui.io:443',
  });

  const bytes = await tx.build({ client: suiClient });

  const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(new Uint8Array(session.secretKey));
  const proofPoints = JSON.parse(session.proofPoints);
  const issBase64Details = JSON.parse(session.issBase64Details);
  const rawUserSignature = await ephemeralKeyPair.sign(bytes);

  const zkLoginSignature = getZkLoginSignature({
    inputs: {
      ...proofPoints,
      issBase64Details,
      headerBase64: session.headerBase64,
    },
    maxEpoch: Number(session.maxEpoch),
    userSignature: rawUserSignature,
  });

  const result = await (suiClient as any).executeTransaction({
    transaction: bytes,
    signatures: [zkLoginSignature],
  });

  return {
    digest: result.digest,
    status: result.effects?.status?.status === 'success' ? 'success' : 'failed',
    effects: result.effects,
  };
}

export async function executeMoveCall(
  target: string,
  args: any[],
  session: ZkLoginSession,
  typeArgs?: string[],
  network?: string,
  baseUrl?: string,
): Promise<SignedTransactionResult> {
  const tx = new Transaction();
  tx.moveCall({ target, arguments: args, typeArguments: typeArgs });
  return executeWithZkLogin(tx, session, network, baseUrl);
}

export async function transferSui(
  recipient: string,
  amount: bigint,
  session: ZkLoginSession,
  network?: string,
  baseUrl?: string,
): Promise<SignedTransactionResult> {
  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
  tx.transferObjects([coin], tx.pure.address(recipient));
  return executeWithZkLogin(tx, session, network, baseUrl);
}
