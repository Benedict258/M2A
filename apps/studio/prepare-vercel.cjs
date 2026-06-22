const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'api');
const serverFile = path.join(__dirname, 'dist', 'server', 'server.js');

if (!fs.existsSync(serverFile)) {
  console.error('dist/server/server.js not found. Run build first.');
  process.exit(1);
}

if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });
fs.copyFileSync(serverFile, path.join(apiDir, 'server.js'));
console.log('Copied dist/server/server.js → api/server.js');
