import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { getEnvironment } from './config/environments';

dotenv.config({ quiet: true });

const env = getEnvironment();
const isCI = !!process.env.CI;

/**
 * rbauction.com sits behind Akamai, which blocks headless browsers (HTTP 403).
 * Browser projects therefore run headed by default; CI provides a virtual display via xvfb-run.
 * Set HEADLESS=true to opt in where headless traffic is allowed.
 */
const headless = process.env.HEADLESS === 'true';

/** Firefox, WebKit and mobile are defined up front and enabled with ALL_BROWSERS=true. */
const allBrowsers = process.env.ALL_BROWSERS === 'true';

const e2eTests = ['e2e/**/*.spec.ts'];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // Keep load on the production site low
  workers: isCI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: [['list'], ['html', { open: 'never' }], ...(isCI ? [['github'] as const] : [])],

  use: {
    baseURL: env.baseURL,
    locale: env.locale,
    timezoneId: 'UTC',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api',
      testMatch: ['api/**/*.spec.ts'],
    },
    {
      name: 'chromium',
      testMatch: e2eTests,
      use: { ...devices['Desktop Chrome'], headless },
    },
    ...(allBrowsers
      ? [
          { name: 'firefox', testMatch: e2eTests, use: { ...devices['Desktop Firefox'], headless } },
          { name: 'webkit', testMatch: e2eTests, use: { ...devices['Desktop Safari'], headless } },
          { name: 'mobile-chrome', testMatch: e2eTests, use: { ...devices['Pixel 7'], headless } },
        ]
      : []),
  ],
});
