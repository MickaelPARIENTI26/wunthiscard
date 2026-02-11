import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', '.next', 'dist', '**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
  resolve: {
    alias: {
      '@winthiscard/shared': path.resolve(__dirname, './packages/shared/src'),
      '@winthiscard/database': path.resolve(__dirname, './packages/database'),
    },
  },
});
