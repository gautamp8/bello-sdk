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
  resolve({ extensions: ['.mjs', '.js', '.ts', '.tsx', '.json'] }),
  commonjs(),
  esbuild({
    jsx: 'automatic',
    target: 'es2020',
    tsconfig: 'tsconfig.app.json',
  }),
];

export default [
  {
    input,
    external,
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
