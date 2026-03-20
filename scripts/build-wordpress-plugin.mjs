import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const pluginDir = path.join(repoRoot, 'docs/wordpress/plugin');
const sourceSnapshotDir = path.join(pluginDir, 'source/sdk');
const sourceSnapshotFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.build.json',
  'tsconfig.node.json',
  'scripts/build-widget-css.mjs',
  'scripts/widget-tailwind-input.css',
  'src',
];
const watch = process.argv.includes('--watch');
const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

run(['sync:frontend-widget']);
run(['build:widget-css']);
syncWordPressSourceSnapshot();

const args = ['exec', 'vite', 'build', '--mode', 'embed'];
if (watch) {
  args.push('--watch');
}

const child = spawn(pnpmCmd, args, {
  cwd: repoRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    BELLO_EMBED_OUT_DIR: path.join(
      repoRoot,
      'docs/wordpress/plugin/assets/sdk'
    ),
    BELLO_EMBED_FORMATS: 'iife',
    BELLO_EMBED_EMPTY_OUT_DIR: 'true',
    BELLO_DISABLE_PUBLIC_DIR: 'true',
    BELLO_EMBED_SOURCEMAP: 'false',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

function run(args) {
  const result = spawnSync(pnpmCmd, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function syncWordPressSourceSnapshot() {
  fs.rmSync(sourceSnapshotDir, { recursive: true, force: true });

  for (const relativePath of sourceSnapshotFiles) {
    const from = path.join(repoRoot, relativePath);
    const to = path.join(sourceSnapshotDir, relativePath);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.cpSync(from, to, { recursive: true });
  }
}
