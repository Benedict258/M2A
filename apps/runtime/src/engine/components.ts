import { MemoryRouter as CoreMemoryRouter, createPoolClient, createUserClient, resolve, hostedRelayerUrl, currentNetwork } from '@m2a/client';
import { MemoryRouter } from './MemoryRouter.js';
import { AgentRunner } from './AgentRunner.js';
import { WorkflowParser } from './WorkflowParser.js';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';

const memwalMode = process.env.MEMWAL_MODE || 'self';
const network = currentNetwork();

const modeSuffix = memwalMode === 'hosted' ? 'hosted' : 'self';
const relayerUrl = process.env.MEMWAL_RELAYER_URL
  || process.env[`MEMWAL_RELAYER_URL_${modeSuffix}`]
  || (memwalMode === 'hosted' ? hostedRelayerUrl() : 'http://localhost:8000');

const platformAccountId = resolve('MEMWAL_PLATFORM_ACCOUNT_ID');
let platformDelegateKey = process.env.SERVER_SUI_PRIVATE_KEY || '';

if (platformDelegateKey.startsWith('suiprivkey1')) {
  try {
    const decoded = decodeSuiPrivateKey(platformDelegateKey);
    platformDelegateKey = Buffer.from(decoded.secretKey).toString('hex');
  } catch (e) {
    console.error('❌ Failed to decode SERVER_SUI_PRIVATE_KEY as Bech32:', e);
  }
}

const poolClient = createPoolClient({
  relayerUrl,
  platformAccountId,
  platformDelegateKey,
});

const coreRouter = new CoreMemoryRouter(
  poolClient,
  (delegateKey, accountId) => createUserClient({ relayerUrl, userDelegateKey: delegateKey, userAccountId: accountId })
);

export const memoryRouter = new MemoryRouter(coreRouter);
export const agentRunner = new AgentRunner(memoryRouter);
export const workflowParser = new WorkflowParser(agentRunner);
export { platformAccountId, platformDelegateKey };
