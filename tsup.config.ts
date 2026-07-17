import { defineConfig } from 'tsup';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

const banner = {
  js: `/*! SoulState v${pkg.version} | MIT License */`,
};

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react/index.ts',
    middleware: 'src/middleware/index.ts',
    utils: 'src/utils/index.ts',
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