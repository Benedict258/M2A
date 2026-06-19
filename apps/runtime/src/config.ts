import { SuiGrpcClient } from '@mysten/sui/grpc';
import type { SuiClientTypes } from '@mysten/sui/client';
import {
  WalrusClient,
  MAINNET_WALRUS_PACKAGE_CONFIG as WALRUS_PACKAGE_CONFIG_mainnet,
  TESTNET_WALRUS_PACKAGE_CONFIG as WALRUS_PACKAGE_CONFIG_testnet,
} from '@mysten/walrus';

export function suiNetwork(): string {
  return process.env.SUI_NETWORK || 'testnet';
}

export function resolveNetworkVar(name: string): string {
  return process.env[`${name}_${suiNetwork()}`] || '';
}

export function suiRpcUrl(): string {
  return resolveNetworkVar('SUI_RPC_URL') || 'https://fullnode.testnet.sui.io:443';
}

export function createSuiClient(): SuiGrpcClient {
  return new SuiGrpcClient({
    network: suiNetwork() as SuiClientTypes.Network,
    baseUrl: suiRpcUrl(),
  });
}

function walrusPackageConfig() {
  const net = suiNetwork() as 'mainnet' | 'testnet';
  return net === 'mainnet' ? WALRUS_PACKAGE_CONFIG_mainnet : WALRUS_PACKAGE_CONFIG_testnet;
}

export function createWalrusClient(): WalrusClient {
  return new WalrusClient({
    suiClient: createSuiClient(),
    network: suiNetwork() as 'mainnet' | 'testnet',
    packageConfig: walrusPackageConfig(),
  });
}

export function cetusIntegratePackage(): string {
  return resolveNetworkVar('CETUS_INTEGRATE_PACKAGE') || '0x19dd42e05fa6c9988a60d30686ee3feb776672b5547e328d6dab16563da65293';
}

export function cetusGlobalConfigId(): string {
  return resolveNetworkVar('CETUS_GLOBAL_CONFIG_ID') || '0x9774e359588ead122af1c7e7f64e14ade261cfeecdb5d0eb4a5b3b4c8ab8bd3e';
}

export function cetusPackageId(): string {
  return resolveNetworkVar('CETUS_PACKAGE_ID') || '0xcf2df388';
}

export function deepBookPackageId(): string {
  return resolveNetworkVar('DEEPBOOK_PACKAGE_ID') || '0xdee9';
}

export function walrusPublisherUrl(): string {
  return resolveNetworkVar('WALRUS_PUBLISHER_URL') || 'https://publisher.walrus-testnet.walrus.space';
}

export function walrusAggregatorUrl(): string {
  return resolveNetworkVar('WALRUS_AGGREGATOR_URL') || 'https://aggregator.walrus-testnet.walrus.site';
}

export function walrusSidecarUrl(): string {
  return process.env.WALRUS_SIDECAR_URL || 'http://localhost:9000';
}

export const SUI_CLOCK = '0x6';
