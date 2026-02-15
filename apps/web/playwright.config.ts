import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for WinUCard
 *
 * Commands:
 *   npm run test:e2e          - Run all tests headless
 *   npm run test:e2e:ui       - Run tests in UI mode
 *   npm run test:e2e:headed   - Run tests with browser visible
 *   npm run test:e2e:debug    - Run tests in debug mode
 *   npm run test:e2e:report   - View test report
 *
 * Run specific tests:
 *   npx playwright test auth.spec.ts
 *   npx playwright test --grep "login"
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30 * 1000, // 30 seconds per test
  expect: {
    timeout: 5 * 1000, // 5 seconds for assertions
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10 * 1000, // 10 seconds for actions
  },

  // Output folder for test artifacts
  outputDir: 'test-results',

  projects: [
    // Setup project - runs before all tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Chromium tests (main tests)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    // Mobile Chrome tests (responsive tests)
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
      // Only run specific test files for mobile
      testMatch: ['**/navigation.spec.ts', '**/competitions.spec.ts'],
    },
  ],

  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
