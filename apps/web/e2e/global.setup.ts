import { test as setup } from '@playwright/test';

/**
 * Global setup for all E2E tests.
 * This runs before all test files.
 */
setup('verify test environment', async ({ page }) => {
  setup.setTimeout(120000); // 2 minutes for setup

  // Verify the web app is running
  const response = await page.goto('http://localhost:3000', { timeout: 60000 });

  if (!response || response.status() >= 400) {
    throw new Error(
      'Web app is not running on port 3000. Please start the dev server with: npm run dev'
    );
  }

  console.log('Web app is running on port 3000');
});
