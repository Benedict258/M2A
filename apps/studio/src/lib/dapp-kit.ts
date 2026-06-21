import { createNetworkConfig } from "@mysten/dapp-kit";
import { createDAppKit } from "@mysten/dapp-kit-react";

const { networkConfig } = createNetworkConfig({
  testnet: { url: "https://fullnode.testnet.sui.io:443" },
  mainnet: { url: "https://fullnode.mainnet.sui.io:443" },
});

const dAppKit = createDAppKit({
  networks: networkConfig,
  defaultNetwork: "testnet",
});

export { dAppKit, networkConfig };
