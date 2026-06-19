import { createPoolClient, resolve, currentNetwork } from '@m2a/client';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';

const REQUIRED_POOLS = ['pool::code-review', 'pool::research', 'pool::trading'];

export async function initializePlatform(): Promise<void> {
  const secretKey = process.env.SERVER_SUI_PRIVATE_KEY;
  const relayerUrl = process.env.MEMWAL_RELAYER_URL || 'http://localhost:8000';

  if (!secretKey) {
    console.warn('[init] SERVER_SUI_PRIVATE_KEY not set, skipping platform init');
    return;
  }

  const accountId = resolve('MEMWAL_PLATFORM_ACCOUNT_ID');
  if (!accountId) {
    console.warn('[init] MEMWAL_PLATFORM_ACCOUNT_ID not found, skipping platform init');
    return;
  }

  const decodedKey = decodeSuiPrivateKey(secretKey);

  const client = createPoolClient({
    relayerUrl,
    platformDelegateKey: decodedKey.secretKey,
    platformAccountId: accountId,
  });

  const network = currentNetwork();
  console.log(`[init] Initializing shared pool namespaces (${network})...`);

  let initialized = 0;
  for (const pool of REQUIRED_POOLS) {
    try {
      await client.remember(`System initialized: Shared pool [${pool}] is now active.`, pool);
      initialized++;
    } catch (e: any) {
      console.warn(`[init] Could not initialize [${pool}]: ${e.message}`);
    }
  }

  console.log(`[init] ${initialized}/${REQUIRED_POOLS.length} pool namespaces active`);
}
