import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve('dist/client');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
  .map((m) => m[1])
  .filter((p) => p.startsWith('/') && !p.startsWith('//'));
if (!html.includes('Luma Tide') || !assets.some((p) => p.endsWith('.js')))
  throw new Error('The production entry point is incomplete.');
for (const asset of assets) {
  const path = asset.split('?')[0];
  if (!existsSync(resolve(root, '.' + path)))
    throw new Error('Missing production asset: ' + asset);
}
process.stdout.write(
  `Production entry and ${assets.length} local asset references verified.\n`,
);
