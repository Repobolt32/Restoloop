import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const STORAGE_STATE = path.join(__dirname, 'storage-state.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  globalSetup: './global-setup',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.(spec)\.ts$/,
      grep: /@unauthenticated/,
    },
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      testMatch: /.*\.(spec)\.ts$/,
      grep: /@authenticated/,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev',
        cwd: '../web',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
