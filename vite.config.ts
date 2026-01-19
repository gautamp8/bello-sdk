import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => {
  const isEmbed = mode === 'embed';
  const isReact = mode === 'react';
  const isProd = mode === 'production' || isEmbed;

  const shared: UserConfig = {
    plugins: [react()],
    define: {
      __DEV__: !isProd,
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
        formats: ['iife', 'umd', 'es'],
        fileName: (fmt) =>
          fmt === 'iife'
            ? 'bello-embed.iife.js'
            : fmt === 'umd'
            ? 'bello-embed.umd.cjs'
            : 'bello-embed.es.js',
      },
      target: 'es2019',
      sourcemap: true,
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        external: [],
        output: { inlineDynamicImports: true },
      },
    },
  };
});
