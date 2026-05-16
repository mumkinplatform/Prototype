import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/env.setup.ts', 'tests/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    // Test files share a single MySQL database (mumkin_test). Running them in
    // parallel causes resetDb in one file to collide with seeded rows from
    // another. Force serial file execution so each file gets a clean slate.
    fileParallelism: false,
  },
});
