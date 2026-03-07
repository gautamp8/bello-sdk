import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

run('wordpress:build');
run('wordpress:env:start');
run('wordpress:env:seed');

console.log(
  'WordPress is running at http://localhost:8888. Watching SDK changes for the plugin bundle.'
);
console.log(
  'Press Ctrl+C to stop the watcher. Containers keep running until `pnpm wordpress:env:stop`.'
);

const watch = spawn(pnpmCmd, ['wordpress:watch'], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: process.env,
});

watch.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

function run(scriptName) {
  const result = spawnSync(pnpmCmd, [scriptName], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
