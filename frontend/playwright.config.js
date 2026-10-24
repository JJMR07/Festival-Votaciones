import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const localPython = fileURLToPath(new URL(process.platform === 'win32' ? '../.venv/Scripts/python.exe' : '../.venv/bin/python', import.meta.url));
const python = process.env.E2E_PYTHON || (existsSync(localPython) ? localPython : 'python');
const server = fileURLToPath(new URL('../scripts/e2e_server.py', import.meta.url));

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:8011', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: `"${python}" "${server}"`,
    env: { E2E_EMAIL_PATH: fileURLToPath(new URL('./test-results/mail', import.meta.url)) },
    url: 'http://127.0.0.1:8011',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
