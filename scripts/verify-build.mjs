import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function verifyBuild(directory = 'dist/client', basePath = '') {
  const root = resolve(directory);
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
    .map((m) => m[1])
    .filter((p) => p.startsWith('/') && !p.startsWith('//'));
  if (!html.includes('Luma Tide') || !assets.some((p) => p.endsWith('.js')))
    throw new Error('The production entry point is incomplete.');
  for (const asset of assets) {
    if (basePath && !asset.startsWith(basePath + '/'))
      throw new Error('Asset escapes the GitHub Pages project path: ' + asset);
    const path = asset.split('?')[0].slice(basePath.length);
    if (!existsSync(resolve(root, '.' + path)))
      throw new Error('Missing production asset: ' + asset);
  }
  process.stdout.write(
    `Production entry and ${assets.length} local asset references verified at ${basePath || '/'}.\n`,
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  verifyBuild(process.argv[2], process.argv[3]);
