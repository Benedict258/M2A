import { skillRegistry } from './skills/SkillRegistry.js';
import { deepBookTradeSkill } from './skills/defi/DeepBookTrade.js';
import { cetusSwapSkill } from './skills/defi/CetusSwap.js';
import { defiBaseSkill } from './skills/defi/DeFiSkill.js';
import { nftSkill } from './skills/nft/NFTSkill.js';
import { deepBookLendSkill } from './skills/defi/lending/DeepBookLend.js';
import { cetusLendSkill } from './skills/defi/lending/CetusLend.js';

import { serviceRegistry } from './services/ServiceRegistry.js';
import { suiTxService } from './services/sui/SuiTxService.js';
import { suiQueryService } from './services/sui/SuiQueryService.js';
import { deepBookService } from './services/defi/DeepBookService.js';
import { cetusService } from './services/defi/CetusService.js';
import { walrusService } from './services/walrus/WalrusService.js';

import { integrationRegistry } from './integrations/IntegrationRegistry.js';
import { registerAllSkillsAsTools } from './tools/SkillTools.js';

// Trigger tool registrations (side effects from module imports)
import './tools/index.js';

export function bootstrapEngine() {
  // Register all skills
  skillRegistry.register(defiBaseSkill);
  skillRegistry.register(deepBookTradeSkill);
  skillRegistry.register(cetusSwapSkill);
  skillRegistry.register(deepBookLendSkill);
  skillRegistry.register(cetusLendSkill);
  skillRegistry.register(nftSkill);
  console.log(`✅ Registered ${skillRegistry.getAll().length} skills`);

  // Register skills as tools so AgentRunner can call them
  registerAllSkillsAsTools();

  // Register all services
  serviceRegistry.register(suiTxService);
  serviceRegistry.register(suiQueryService);
  serviceRegistry.register(deepBookService);
  serviceRegistry.register(cetusService);
  serviceRegistry.register(walrusService);
  console.log(`✅ Registered ${serviceRegistry.getAll().length} services`);

  // Integrations are created per-config (factory pattern)
  console.log(`✅ Integration registry ready (${integrationRegistry.getAll().length} pre-configured)`);
}
