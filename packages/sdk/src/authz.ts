export type GatewayAuthzRequest = {
  agentId: string;
  action: string;
  namespace?: string;
  tool?: string;
  /** On-chain Sui address of the agent wallet (for on-chain policy lookup) */
  agentWallet?: string;
};

export type GatewayAuthzResponse = {
  allowed: boolean;
  reason?: string;
  policyVersion?: number;
  onChainCheck?: boolean;
  budgetRemaining?: number;
  isExpired?: boolean;
};
