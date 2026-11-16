import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: 'study.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  use: { baseURL: 'http://127.0.0.1:3217', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit-ipad', use: { ...devices['iPad (gen 7)'] } },
  ],
  webServer: {
    command: 'npm run start -- --port 3217',
    url: 'http://127.0.0.1:3217',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
