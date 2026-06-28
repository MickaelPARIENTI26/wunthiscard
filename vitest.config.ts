import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    // Exclude git worktrees under .claude/ — they mirror the same test files and
    // would otherwise be double-counted in the run total.
    exclude: ['node_modules', '.next', 'dist', '**/e2e/**', '.claude/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', '.next', 'dist', '**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
  resolve: {
    alias: {
      '@winucard/shared': path.resolve(__dirname, './packages/shared/src'),
      '@winucard/database': path.resolve(__dirname, './packages/database'),
      // Lets unit tests import apps/web modules (their deps are vi.mock'd).
      '@': path.resolve(__dirname, './apps/web/src'),
    },
  },
});
