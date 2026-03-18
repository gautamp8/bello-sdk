import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

function getEmbedFormats(): Array<'iife' | 'umd' | 'es'> {
  const raw = process.env.BELLO_EMBED_FORMATS;
  if (!raw) return ['iife', 'umd', 'es'];

  const formats = raw
    .split(',')
    .map((value) => value.trim())
    .filter(
      (value): value is 'iife' | 'umd' | 'es' =>
        value === 'iife' || value === 'umd' || value === 'es'
    );

  return formats.length ? formats : ['iife', 'umd', 'es'];
}

export default defineConfig(({ mode }) => {
  const isEmbed = mode === 'embed';
  const isReact = mode === 'react';
  const isProd = mode === 'production' || isEmbed;
  const embedOutDir = process.env.BELLO_EMBED_OUT_DIR || 'dist';
  const embedEmptyOutDir =
    process.env.BELLO_EMBED_EMPTY_OUT_DIR != null
      ? process.env.BELLO_EMBED_EMPTY_OUT_DIR !== 'false'
      : embedOutDir === 'dist';
  const embedFormats = getEmbedFormats();
  const publicDir =
    process.env.BELLO_DISABLE_PUBLIC_DIR === 'true'
      ? false
      : undefined;
  const embedSourceMap =
    process.env.BELLO_EMBED_SOURCEMAP != null
      ? process.env.BELLO_EMBED_SOURCEMAP !== 'false'
      : true;

  const shared: UserConfig = {
    plugins: [react()],
    publicDir,
    define: {
      __DEV__: !isProd,
      __BELLO_WIDGET_UI_MODE__: JSON.stringify(
        process.env.BELLO_WIDGET_UI_MODE || 'synced'
      ),
      __BELLO_API_URL__: JSON.stringify(
        process.env.BELLO_API_URL || 'https://www.heybello.dev/api'
      ),
      'process.env.NODE_ENV': JSON.stringify(
        isProd ? 'production' : 'development'
      ),
      'process.env': '{}',
      global: 'globalThis',
    },
  };

  if (isReact) {
    return {
      ...shared,
      build: {
        lib: {
          entry: 'src/index.ts',
          name: 'BelloEmbedReact',
          formats: ['es', 'cjs'],
          fileName: (fmt) =>
            fmt === 'es' ? 'react.es.js' : 'react.cjs',
        },
        target: 'es2019',
        sourcemap: true,
        outDir: 'dist',
        emptyOutDir: false,
        rollupOptions: {
          external: ['react', 'react-dom'],
        },
      },
    };
  }

  return {
    ...shared,
    build: {
      lib: {
        entry: 'src/embed.tsx',
        name: 'BelloEmbed',
        formats: embedFormats,
        fileName: (fmt) =>
          fmt === 'iife'
            ? 'bello-embed.iife.js'
            : fmt === 'umd'
            ? 'bello-embed.umd.cjs'
            : 'bello-embed.es.js',
      },
      target: 'es2019',
      sourcemap: embedSourceMap,
      outDir: embedOutDir,
      emptyOutDir: embedEmptyOutDir,
      rollupOptions: {
        external: [],
        output: { inlineDynamicImports: true },
      },
    },
  };
});
