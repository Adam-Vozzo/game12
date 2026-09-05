import { fileURLToPath } from 'node:url';
const cli = new URL('./cli.js', import.meta.resolve('vinext'));
process.argv = [
  process.execPath,
  fileURLToPath(cli),
  'build',
  ...process.argv.slice(2),
];

// Vinext calls process.exit(0) immediately after printing the build report.
// On Windows this races the native bundler's worker-handle teardown. Successful
// builds should drain the event loop normally; errors retain their exit status.
const exit = process.exit.bind(process);
if (process.platform === 'win32')
  process.exit = (code = 0) => {
    if (Number(code) !== 0) return exit(code);
    process.exitCode = 0;
  };
await import(cli.href);
