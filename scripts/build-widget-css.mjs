#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const inputCss = path.join(rootDir, 'scripts', 'widget-tailwind-input.css');
const outCss = path.join(rootDir, 'src', 'generated', 'frontend-widget.css');
const passthroughArgs = process.argv.slice(2);

fs.mkdirSync(path.dirname(outCss), { recursive: true });

const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const result = spawnSync(
  cmd,
  [
    'exec',
    'tailwindcss',
    '-i',
    inputCss,
    '-o',
    outCss,
    '--minify',
    ...passthroughArgs,
  ],
  {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`[bello-sdk] Built widget css: ${path.relative(rootDir, outCss)}`);
