import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Prepare test database path
const TEST_DB_PATH = path.resolve(import.meta.dirname, '..', 'server', 'data', 'test-e2e.db');

// Remove old test database before starting
try { fs.unlinkSync(TEST_DB_PATH); } catch { /* ignore */ }
try { fs.unlinkSync(TEST_DB_PATH + '-wal'); } catch { /* ignore */ }
try { fs.unlinkSync(TEST_DB_PATH + '-shm'); } catch { /* ignore */ }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  timeout: 45000,
  expect: {
    timeout: 15000,
  },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Playwright manages server lifecycle automatically
  webServer: [
    {
      command: 'npx tsx src/index.ts',
      port: 3001,
      cwd: path.resolve(import.meta.dirname, '..', 'server'),
      reuseExistingServer: !process.env.CI,
      env: {
        TEST_DB_PATH: TEST_DB_PATH,
        PORT: '3001',
        NODE_ENV: 'test',
      },
      timeout: 30000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: `npx vite --port 5173 --strictPort`,
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
