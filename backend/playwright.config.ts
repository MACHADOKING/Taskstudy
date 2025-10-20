import { defineConfig, devices } from '@playwright/test';

/// <reference types="node" />

// Helper to safely access environment variables
const isCI = (): boolean => {
  try {
    // Check if running in Node.js environment
    if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
      const nodeProcess = (globalThis as { process?: { env?: Record<string, string> } }).process;
      return !!nodeProcess?.env?.CI;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: isCI(),
  /* Retry on CI only */
  retries: isCI() ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: isCI() ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot only when test fails */
    screenshot: 'only-on-failure',
    /* Record video only when test fails */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      // Backend API server
      command: 'npm run dev',
      url: 'http://localhost:5000/api/health',
      reuseExistingServer: !isCI(),
      cwd: '.',
      timeout: 120 * 1000,
      env: {
        NODE_ENV: 'test',
        DATABASE_URL: 'file:./test.db',
        JWT_SECRET: 'test-jwt-secret'
      }
    },
    {
      // Frontend Vite dev server
      command: 'npm run dev -- --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !isCI(),
      cwd: '../frontend',
      timeout: 120 * 1000,
    },
  ],
});