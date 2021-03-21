/**
 * An internal script to fix a typechain bug which generated `index.ts` with duplicate lines.
 */
const fs = require('fs');
const path = require('path');

function main() {
  const indexFile = path.join(__dirname, 'src/types/index.ts');

  const indexTs = fs.readFileSync(indexFile, 'utf-8');

  const lines = indexTs.split('\n');

  const fixed = Array.from(new Set(lines)).join('\n');

  fs.writeFileSync(indexFile, fixed, {encoding: 'utf-8'});
}

if (require.main === module) {
  main();
}
