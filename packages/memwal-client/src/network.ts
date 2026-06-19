export function currentNetwork(): string {
  return process.env.SUI_NETWORK || 'testnet';
}

export function hostedRelayerUrl(): string {
  return currentNetwork() === 'mainnet'
    ? 'https://relayer.memory.walrus.xyz'
    : 'https://relayer-staging.memory.walrus.xyz';
}

export function hostedAccountUrl(): string {
  return currentNetwork() === 'mainnet'
    ? 'https://memory.walrus.xyz'
    : 'https://staging.memory.walrus.xyz';
}

export function resolve(name: string): string {
  return process.env[`${name}_${currentNetwork()}`] || '';
}
