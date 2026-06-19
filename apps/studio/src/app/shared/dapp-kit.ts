import { createDAppKit } from '@mysten/dapp-kit-core';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { environment } from '../../environments/environment';

const GRPC_URLS: Record<string, string> = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
};

const network = environment.suiNetwork === 'mainnet' ? 'mainnet' : 'testnet';

export const dAppKit = createDAppKit({
  networks: ['testnet', 'mainnet'],
  defaultNetwork: network,
  slushWalletConfig: null,
  createClient: (net) =>
    new SuiGrpcClient({ network: net, baseUrl: GRPC_URLS[net] }),
});
