import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    testTimeout: 10000,
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'text-summary', 'lcov', 'json-summary'],
    include: ['src/**/*.ts'],
    exclude: [
      'src/**/*.test.ts',
      'src/test/**',
      'src/db/init.ts',
      'src/index.ts',
    ],
    reportsDirectory: './coverage',
  },
});
