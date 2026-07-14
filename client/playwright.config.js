import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: [
    { command: 'node ../server/scripts/startE2eServer.js', url: 'http://127.0.0.1:5000/api/health', reuseExistingServer: false, timeout: 120000 },
    { command: 'npm run dev -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173/student/today', reuseExistingServer: false, timeout: 120000 },
  ],
});
