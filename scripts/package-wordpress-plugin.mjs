import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const pluginSourceDir = path.join(repoRoot, 'docs/wordpress/plugin');
const distDir = path.join(repoRoot, 'docs/wordpress/dist');
const stagingDir = path.join(distDir, 'bello-widget');
const zipPath = path.join(distDir, 'bello-widget.zip');
const sdkPath = path.join(
  pluginSourceDir,
  'assets/sdk/bello-embed.iife.js'
);

if (!(await exists(sdkPath))) {
  throw new Error(
    'Missing WordPress SDK asset. Run `pnpm wordpress:build` first.'
  );
}

await fs.rm(stagingDir, { recursive: true, force: true });
await fs.rm(zipPath, { force: true });
await fs.mkdir(distDir, { recursive: true });
await fs.cp(pluginSourceDir, stagingDir, { recursive: true });

const zip = spawnSync(
  'zip',
  ['-rq', zipPath, 'bello-widget', '-x', '*.DS_Store'],
  {
    cwd: distDir,
    stdio: 'inherit',
  }
);

await fs.rm(stagingDir, { recursive: true, force: true });

if (zip.status !== 0) {
  process.exit(zip.status ?? 1);
}

console.log(`Created ${path.relative(repoRoot, zipPath)}`);

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}
