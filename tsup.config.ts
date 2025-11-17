import { defineConfig } from 'tsup';

const banner = {
  js: '/*! SoulState v1.0.0 | MIT License */',
};

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false, // Keep react exports in their own file
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'use-sync-external-store'],
  outDir: 'dist',
  banner,
});