import { MemWal } from '@mysten-incubation/memwal';

export interface PoolClientConfig {
  relayerUrl: string;
  platformDelegateKey: string | Uint8Array;
  platformAccountId: string;
}

export interface UserClientConfig {
  relayerUrl: string;
  userDelegateKey: string | Uint8Array;
  userAccountId: string;
}

/**
 * Initializes the singleton Pool Client used by the platform to write to global namespaces.
 */
export function createPoolClient(config: PoolClientConfig): MemWal {
  return MemWal.create({
    serverUrl: config.relayerUrl,
    key: config.platformDelegateKey,
    accountId: config.platformAccountId,
  });
}

/**
 * Initializes a User Client dynamically for executing operations scoped to a specific user's delegate key.
 */
export function createUserClient(config: UserClientConfig): MemWal {
  return MemWal.create({
    serverUrl: config.relayerUrl,
    key: config.userDelegateKey,
    accountId: config.userAccountId,
  });
}
