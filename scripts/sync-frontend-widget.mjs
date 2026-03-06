#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);
const sourceFromEnv = process.env.FRONTEND_WIDGET_SOURCE
  ? path.resolve(process.env.FRONTEND_WIDGET_SOURCE)
  : path.resolve(rootDir, '../bello-frontend');

const frontendSourceCandidates = [
  sourceFromEnv,
  path.resolve(sourceFromEnv, 'src'),
];
const frontendSource = frontendSourceCandidates.find((candidate) =>
  fs.existsSync(path.resolve(candidate, 'components/ui/bello-popup-view.tsx')),
);
const frontendRepoRoot = frontendSource
  ? path.resolve(frontendSource, '..')
  : path.resolve(sourceFromEnv, '..');
const outputRoot = path.resolve(rootDir, 'src/frontend-sync');

const entrypoints = [
  'components/ui/bello-popup-view.tsx',
  'components/ui/info-collection-modal.tsx',
  'components/agents-ui/agent-control-bar.tsx',
  'components/agents-ui/agent-chat-transcript.tsx',
  'components/agents-ui/agent-audio-visualizer-aura.tsx',
];

if (!frontendSource || !fs.existsSync(frontendSource)) {
  console.error(
    `[bello-sdk] FRONTEND_WIDGET_SOURCE not found or invalid: ${sourceFromEnv}`,
  );
  process.exit(1);
}

const fromImportRegex = /from\s*['"]([^'"\n]+)['"]/g;
const sideEffectImportRegex = /import\s*['"]([^'"\n]+)['"]/g;

const exts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

function resolveModule(fromFile, spec) {
  const fromDir = path.dirname(fromFile);
  const base = spec.startsWith('@/')
    ? path.join(frontendSource, spec.slice(2))
    : path.resolve(fromDir, spec);

  const candidates = [];
  if (path.extname(base)) {
    candidates.push(base);
  } else {
    candidates.push(base);
    for (const ext of exts) candidates.push(`${base}${ext}`);
    for (const ext of exts) candidates.push(path.join(base, `index${ext}`));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function posixNoExt(importPath) {
  const normalized = importPath.split(path.sep).join('/');
  return normalized
    .replace(/\.(tsx?|jsx?|mjs|cjs)$/i, '')
    .replace(/\/index$/i, '');
}

function relImport(fromFile, toFile) {
  const rel = path.relative(path.dirname(fromFile), toFile);
  const posixRel = posixNoExt(rel);
  return posixRel.startsWith('.') ? posixRel : `./${posixRel}`;
}

function getAdapterTarget(absCurrent, spec, resolved) {
  const relCurrent = path
    .relative(frontendSource, absCurrent)
    .split(path.sep)
    .join('/');

  if (spec === '@/types') {
    return path.resolve(rootDir, 'src/frontend-adapter/agent-config.ts');
  }

  const embedWidgetAbs = path.join(
    frontendSource,
    'components/ui/bello-embed-widget.tsx',
  );

  if (
    spec === '@/components/ui/bello-embed-widget' ||
    spec === './bello-embed-widget' ||
    resolved === embedWidgetAbs
  ) {
    return path.resolve(rootDir, 'src/frontend-adapter/embed-types.ts');
  }

  if (relCurrent === 'components/ui/select.tsx' && spec === '@/lib/utils') {
    return null;
  }

  return null;
}

function transformSelectFile(content) {
  const importLine =
    "import { useShadowPortalContainer } from '../../../frontend-adapter/ShadowPortalContext';";

  let next = content;
  if (!next.includes('useShadowPortalContainer')) {
    next = next.replace(
      /import\s+\{\s*cn\s*\}\s+from\s+['"][^'"]+['"]\s*[\r]?\n/,
      (m) => `${m}${importLine}\n`,
    );
  }

  if (!next.includes('const portalContainer = useShadowPortalContainer();')) {
    next = next.replace(
      /function SelectContent\(([^)]*)\)\s*\{/,
      (m) => `${m}\n  const portalContainer = useShadowPortalContainer();`,
    );
  }

  next = next.replace(
    '<SelectPrimitive.Portal>',
    '<SelectPrimitive.Portal container={portalContainer ?? undefined}>',
  );

  return next;
}

function transformAgentChatTranscriptFile(content) {
  let next = content;
  next = next.replaceAll('ReceivedMessage', 'ReceivedChatMessage');
  return next;
}

function transformAuraHookFile(content) {
  return content.replace(
    'state: AgentState | undefined,',
    'state: AgentState | string | undefined,',
  );
}

function transformTooltipFile(content) {
  const importLine =
    "import { useShadowPortalContainer } from '../../../frontend-adapter/ShadowPortalContext';";
  let next = content;

  if (!next.includes('useShadowPortalContainer')) {
    next = next.replace(
      /import\s+\{\s*cn\s*\}\s+from\s+['"][^'"]+['"]\s*[\r]?\n/,
      (m) => `${m}${importLine}\n`,
    );
  }

  if (!next.includes('const portalContainer = useShadowPortalContainer();')) {
    next = next.replace(
      /function TooltipContent\(([^)]*)\)\s*\{/,
      (m) => `${m}\n  const portalContainer = useShadowPortalContainer();`,
    );
  }

  next = next.replace(
    '<TooltipPrimitive.Portal>',
    '<TooltipPrimitive.Portal container={portalContainer ?? undefined}>',
  );

  return next;
}

function stripUseClientDirective(content) {
  return content.replace(
    /^\s*['"]use client['"];?\s*[\r]?\n/,
    '',
  );
}

const pending = new Set(entrypoints);
const visited = new Set();
const fileMap = new Map();

while (pending.size > 0) {
  const [rel] = [...pending].sort();
  pending.delete(rel);

  const abs = path.resolve(frontendSource, rel);
  if (!fs.existsSync(abs)) {
    console.error(`[bello-sdk] Missing required source file: ${abs}`);
    process.exit(1);
  }

  const normalizedRel = rel.split(path.sep).join('/');
  if (visited.has(normalizedRel)) continue;
  visited.add(normalizedRel);

  const source = fs.readFileSync(abs, 'utf8');
  fileMap.set(normalizedRel, source);

  const specMatches = [
    ...source.matchAll(fromImportRegex),
    ...source.matchAll(sideEffectImportRegex),
  ];
  for (const match of specMatches) {
    const spec = match[1];
    if (!spec) continue;

    if (!spec.startsWith('./') && !spec.startsWith('../') && !spec.startsWith('@/')) {
      continue;
    }

    const resolved = resolveModule(abs, spec);
    const adapterTarget = getAdapterTarget(abs, spec, resolved);
    if (adapterTarget) {
      continue;
    }

    if (!resolved) {
      console.error(
        `[bello-sdk] Unresolved import in ${normalizedRel}: ${spec}`,
      );
      process.exit(1);
    }

    if (!resolved.startsWith(frontendSource)) {
      continue;
    }

    const depRel = path.relative(frontendSource, resolved).split(path.sep).join('/');

    if (depRel === 'components/ui/bello-embed-widget.tsx') {
      continue;
    }

    pending.add(depRel);
  }
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

const sortedFiles = [...fileMap.keys()].sort();

for (const rel of sortedFiles) {
  const srcAbs = path.resolve(frontendSource, rel);
  const destAbs = path.resolve(outputRoot, rel);
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });

  let transformed = fileMap.get(rel) ?? '';

  const allSpecs = [
    ...transformed.matchAll(fromImportRegex),
    ...transformed.matchAll(sideEffectImportRegex),
  ]
    .map((m) => m[1])
    .filter(Boolean);

  const replacements = new Map();
  for (const spec of allSpecs) {
    if (!spec.startsWith('./') && !spec.startsWith('../') && !spec.startsWith('@/')) {
      continue;
    }

    const resolved = resolveModule(srcAbs, spec);
    const adapterTarget = getAdapterTarget(srcAbs, spec, resolved);

    let nextSpec = spec;
    if (adapterTarget) {
      nextSpec = relImport(destAbs, adapterTarget);
    } else {
      if (!resolved) {
        throw new Error(`Unresolved import after traversal: ${rel} -> ${spec}`);
      }
      if (resolved.startsWith(frontendSource)) {
        const depRel = path.relative(frontendSource, resolved);
        const depDest = path.resolve(outputRoot, depRel);
        nextSpec = relImport(destAbs, depDest);
      }
    }

    replacements.set(spec, nextSpec);
  }

  for (const [fromSpec, toSpec] of replacements) {
    transformed = transformed
      .replaceAll(`'${fromSpec}'`, `'${toSpec}'`)
      .replaceAll(`"${fromSpec}"`, `"${toSpec}"`);
  }

  if (rel === 'components/ui/select.tsx') {
    transformed = transformSelectFile(transformed);
  }
  if (rel === 'components/agents-ui/agent-chat-transcript.tsx') {
    transformed = transformAgentChatTranscriptFile(transformed);
  }
  if (rel === 'hooks/agents-ui/use-agent-audio-visualizer-aura.ts') {
    transformed = transformAuraHookFile(transformed);
  }
  if (rel === 'components/ui/tooltip.tsx') {
    transformed = transformTooltipFile(transformed);
  }

  transformed = stripUseClientDirective(transformed);

  fs.writeFileSync(destAbs, transformed);
}

let frontendGitSha = 'unknown';
try {
  frontendGitSha = execSync('git rev-parse HEAD', {
    cwd: frontendRepoRoot,
    encoding: 'utf8',
  }).trim();
} catch {
  frontendGitSha = 'unknown';
}

const manifest = {
  sourceRoot: path.relative(rootDir, frontendSource).split(path.sep).join('/'),
  sourceGitSha: frontendGitSha,
  entrypoints,
  fileCount: sortedFiles.length,
  files: sortedFiles,
};

fs.writeFileSync(
  path.resolve(outputRoot, 'sync-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(
  `[bello-sdk] Synced frontend widget files: ${sortedFiles.length} (${frontendGitSha})`,
);
