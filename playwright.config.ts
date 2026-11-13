import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Read SN_INSTANCE_URL, SN_USERNAME and SN_PASSWORD from the .env file.
dotenv.config({ path: path.join(__dirname, '.env') });

for (const name of ['SN_INSTANCE_URL', 'SN_USERNAME', 'SN_PASSWORD']) {
  if (!process.env[name]) {
    throw new Error(`${name} is not set. Copy .env.example to .env and fill it in.`);
  }
}

/** Where the logged-in browser session is saved, so tests do not log in again. */
export const AUTH_FILE = path.join(__dirname, 'playwright', '.auth', 'user.json');

export default defineConfig({
  testDir: './tests',

  // One developer instance, shared data: run tests one at a time.
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  // A developer instance is slower than a local app.
  timeout: 90_000,
  expect: { timeout: 20_000 },

  use: {
    baseURL: process.env.SN_INSTANCE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Runs first: logs in once and saves the session.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    // Every other test starts already logged in, using the saved session.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
  ],
});
