import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('work/test-build', { recursive: true });
const compiled = spawnSync(
  process.execPath,
  [
    'node_modules/typescript/bin/tsc',
    'game/engine.ts',
    'game/data.ts',
    '--target',
    'ES2022',
    '--module',
    'commonjs',
    '--moduleResolution',
    'node',
    '--skipLibCheck',
    '--outDir',
    'work/test-build',
    '--noEmit',
    'false',
  ],
  { stdio: 'inherit' },
);
if (compiled.status !== 0) process.exit(compiled.status || 1);
writeFileSync(
  'work/test-build/package.json',
  JSON.stringify({ type: 'commonjs' }),
);
const result = spawnSync(process.execPath, ['--test', 'tests/game.test.cjs'], {
  stdio: 'inherit',
});
process.exit(result.status || 0);
