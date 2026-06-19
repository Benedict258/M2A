export interface ZkLoginSession {
  address: string;
  jwt: string;
  salt: string;
  sub: string;
  provider: 'google' | 'apple';
  email?: string;
  name?: string;
  secretKey: number[];
  randomness: string;
  maxEpoch: number;
  proofPoints: string;
  issBase64Details: string;
  headerBase64: string;
}

export interface CreateAgentWalletResult {
  ephemeralKeyPair: Ed25519KeypairLike;
  randomness: string;
  maxEpoch: number;
  nonce: string;
  oauthUrl: string;
}

export interface Ed25519KeypairLike {
  getPublicKey: () => { toSuiPublicKey: () => string; toSuiAddress: () => string };
  getSecretKey: () => string;
  sign: (bytes: Uint8Array) => Promise<Uint8Array>;
  toSuiAddress: () => string;
}

export interface AgentWalletConfig {
  zklServiceUrl?: string;
  apiKey?: string;
  network?: 'testnet' | 'mainnet';
}

export interface SignedTransactionResult {
  digest: string;
  status: 'success' | 'failed';
  effects?: any;
}
