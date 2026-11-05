import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 30_000, fullyParallel: false,
  use: { baseURL: process.env.LIVE_URL || 'http://127.0.0.1:4399', headless: true, trace: 'retain-on-failure' },
  webServer: process.env.LIVE_URL ? undefined : { command: 'npm run preview -- --port 4399 --strictPort', url: 'http://127.0.0.1:4399', reuseExistingServer: false },
  reporter: [['list'], ['html', { open:'never' }]],
});
