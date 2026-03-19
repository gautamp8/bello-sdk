import fs from 'node:fs';
import path from 'node:path';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';

const input = 'src/index.ts';
const pkg = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);
const deps = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]);
const external = (id) => {
  if (deps.has(id)) return true;
  for (const dep of deps) {
    if (id.startsWith(`${dep}/`)) return true;
  }
  return false;
};

const inlineCss = () => {
  const query = '?inline';
  return {
    name: 'inline-css',
    resolveId(source, importer) {
      if (!source.endsWith(query)) return null;
      if (!importer) return null;
      const cleaned = source.slice(0, -query.length);
      return (
        path.resolve(path.dirname(importer), cleaned) + query
      );
    },
    load(id) {
      if (!id.endsWith(query)) return null;
      const filename = id.slice(0, -query.length);
      const css = fs.readFileSync(filename, 'utf8');
      return `export default ${JSON.stringify(css)};`;
    },
  };
};

const basePlugins = [
  inlineCss(),
  replace({
    preventAssignment: true,
    values: {
      __BELLO_WIDGET_UI_MODE__: JSON.stringify(
        process.env.BELLO_WIDGET_UI_MODE || 'synced'
      ),
      __BELLO_API_URL__: JSON.stringify(
        process.env.BELLO_API_URL || 'https://www.heybello.dev/api'
      ),
    },
  }),
  resolve({ extensions: ['.mjs', '.js', '.ts', '.tsx', '.json'] }),
  commonjs(),
  esbuild({
    jsx: 'automatic',
    target: 'es2020',
    tsconfig: 'tsconfig.app.json',
  }),
];

function shouldIgnoreWarning(warning) {
  const message = warning?.message ?? '';

  if (
    warning?.code === 'MODULE_LEVEL_DIRECTIVE' &&
    typeof message === 'string' &&
    message.includes('"use client"')
  ) {
    return true;
  }

  if (
    warning?.code === 'SOURCEMAP_ERROR' &&
    typeof message === 'string' &&
    message.includes("Can't resolve original location of error")
  ) {
    return true;
  }

  if (warning?.code === 'UNUSED_EXTERNAL_IMPORT') {
    return true;
  }

  return false;
}

function onwarn(warning, warn) {
  if (shouldIgnoreWarning(warning)) return;
  warn(warning);
}

export default [
  {
    input,
    external,
    onwarn,
    plugins: basePlugins,
    output: {
      file: 'dist/react.es.js',
      format: 'es',
      sourcemap: true,
      banner: '"use client";',
    },
  },
  {
    input,
    external,
    onwarn,
    plugins: [
      ...basePlugins,
      replace({
        preventAssignment: true,
        values: {
          'import.meta': 'import_meta',
        },
      }),
    ],
    output: {
      file: 'dist/react.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
      banner: '"use client";\nconst import_meta = { env: {} };',
    },
  },
];
