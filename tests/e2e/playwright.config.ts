import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

if (!baseURL || baseURL.trim() === '') {
  throw new Error('E2E_BASE_URL must be set to a valid URL');
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: baseURL.trim(),
    trace: 'on-first-retry',
  },
  timeout: 30000,
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: baseURL.trim(),
      },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'cd web && npm run dev',
    url: baseURL.trim(),
    reuseExistingServer: true,
  },
});


