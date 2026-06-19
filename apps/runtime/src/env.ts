import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Find .env by checking common locations
const possiblePaths = [
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'apps/runtime', '.env'),
  path.join(process.cwd(), 'm2a/apps/runtime', '.env'),
];

let envPath = possiblePaths[0];
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    envPath = p;
    break;
  }
}

console.log(`🔍 Environment Booster: Loading from ${envPath}`);
dotenv.config({ path: envPath });
