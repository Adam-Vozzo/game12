import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { verifyBuild } from './verify-build.mjs';

const basePath = process.argv[2] || '/game12';
if (!/^\/[a-zA-Z0-9_-]+$/.test(basePath))
  throw new Error('Use a single project path, for example /game12.');
const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
  stdio: 'inherit',
  env: { ...process.env, LUMA_BASE_PATH: basePath },
});
if (result.status !== 0) process.exit(result.status || 1);

// Vinext exports basePath routes and assets into the corresponding directory.
// GitHub supplies that mount point, so its contents belong directly in /docs.
const source = resolve('dist/client', basePath.slice(1));
verifyBuild(source, basePath);
const destination = resolve('docs');
const manifest = resolve(destination, '.pages-manifest.json');
mkdirSync(destination, { recursive: true });
function safeGeneratedPath(file) {
  const target = resolve(destination, file);
  if (
    !target.startsWith(destination + sep) ||
    !/^(_next\/|404\/|index\.(html|txt)$|404\.html$|favicon\.svg$|\.nojekyll$)/.test(
      file,
    )
  )
    throw new Error(
      'Refusing to replace a non-generated documentation file: ' + file,
    );
  return target;
}
if (existsSync(manifest)) {
  const old = JSON.parse(readFileSync(manifest, 'utf8'));
  if (old.generator !== 'luma-tide-pages' || !Array.isArray(old.files))
    throw new Error('Invalid Pages output manifest.');
  // Delete only individually recorded generated files, never the docs folder.
  for (const file of old.files)
    rmSync(safeGeneratedPath(file), { force: true });
}
const files = [];
function copyFolder(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const input = resolve(directory, entry.name);
    if (entry.isDirectory()) copyFolder(input);
    else if (entry.isFile()) {
      const name = relative(source, input).split(sep).join('/');
      const output = safeGeneratedPath(name);
      mkdirSync(resolve(output, '..'), { recursive: true });
      cpSync(input, output);
      files.push(name);
    }
  }
}
copyFolder(source);
writeFileSync(resolve(destination, '.nojekyll'), '');
files.push('.nojekyll');
const notFound = resolve(destination, '404/index.html');
if (existsSync(notFound)) {
  cpSync(notFound, resolve(destination, '404.html'));
  files.push('404.html');
}
writeFileSync(
  manifest,
  JSON.stringify({ generator: 'luma-tide-pages', basePath, files }, null, 2) +
    '\n',
);
verifyBuild(destination, basePath);
process.stdout.write(
  'GitHub Pages output is ready in docs/. Publish main → /docs.\n',
);
