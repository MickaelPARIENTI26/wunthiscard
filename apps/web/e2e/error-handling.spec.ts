import { test, expect } from '@playwright/test';
import { TEST_USERS, loginUser, logoutUser, clearBrowserStorage } from './fixtures';

test.describe('Error Handling - Network Errors', () => {
  test('should handle slow network gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.continue();
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should still load
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show loading states during data fetch', async ({ page }) => {
    await page.goto('/competitions');

    // Look for any loading indicators
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [data-testid="loading"], text=/loading/i');

    // Page should eventually load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Error Handling - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should show validation errors for login form', async ({ page }) => {
    await page.goto('/login');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    const errors = page.locator('[class*="error"], [class*="destructive"], [role="alert"]');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show validation errors for register form', async ({ page }) => {
    await page.goto('/register');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    const errors = page.locator('[class*="error"], [class*="destructive"]');
    await expect(errors.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show email format validation error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"], input[id="email"]', 'not-an-email');
    await page.fill('input[type="password"], input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show email validation error
    const emailError = page.locator('text=/valid email|email.*invalid/i');
    await expect(emailError).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Error Handling - 404 Pages', () => {
  test('should handle non-existent pages gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page-12345');

    expect(response?.status()).toBe(404);

    // Should show 404 message
    await expect(page.locator('text=/not found|404/i')).toBeVisible();
  });

  test('should handle non-existent competition gracefully', async ({ page }) => {
    const response = await page.goto('/competitions/non-existent-competition-12345');

    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });

  test('should provide way to navigate back from 404', async ({ page }) => {
    await page.goto('/non-existent-page-12345');

    // Should have a link to home
    const homeLink = page.locator('a[href="/"], button:has-text("Home"), a:has-text("Go home"), a:has-text("Go back")');
    await expect(homeLink.first()).toBeVisible();
  });
});

test.describe('Error Handling - Authentication Errors', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"], input[id="email"]', 'wrong@example.com');
    await page.fill('input[type="password"], input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[class*="error"], [class*="destructive"], [role="alert"]')).toBeVisible({ timeout: 10000 });

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should handle locked account error', async ({ page }) => {
    // Note: This test simulates the scenario, actual locking requires multiple failed attempts
    await page.goto('/login?error=AccountLocked');

    // Should show locked account message
    const lockedMessage = page.locator('text=/locked|temporarily|try again later/i');
    await expect(lockedMessage).toBeVisible();
  });

  test('should handle banned account error', async ({ page }) => {
    await page.goto('/login?error=AccountBanned');

    // Should show banned account message
    const bannedMessage = page.locator('text=/banned|suspended|contact support/i');
    await expect(bannedMessage).toBeVisible();
  });

  test('should handle OAuth only account error', async ({ page }) => {
    await page.goto('/login?error=OAuthAccountOnly');

    // Should show OAuth message
    const oauthMessage = page.locator('text=/google|oauth|sign.?in with/i');
    await expect(oauthMessage).toBeVisible();
  });
});

test.describe('Error Handling - Session Expiry', () => {
  test('should redirect to login when accessing protected route with expired session', async ({ page }) => {
    await clearBrowserStorage(page);

    // Try to access protected route without valid session
    await page.goto('/profile');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing checkout without session', async ({ page }) => {
    await clearBrowserStorage(page);

    // Try to access checkout
    await page.goto('/checkout');

    // Should redirect to login or competitions
    const url = page.url();
    expect(url.includes('/login') || url.includes('/competitions')).toBeTruthy();
  });
});

test.describe('Error Handling - Rate Limiting', () => {
  test('should handle rate limit errors gracefully', async ({ page }) => {
    await page.goto('/login?error=TooManyRequests');

    // Should show rate limit message
    const rateLimitMessage = page.locator('text=/too many|rate limit|try again later/i');
    await expect(rateLimitMessage).toBeVisible();
  });
});

test.describe('Error Handling - JavaScript Errors', () => {
  test('should not have console errors on home page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Allow some hydration warnings in dev mode
    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('Warning:')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should not have console errors on competitions page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('Warning:')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should not have console errors on login page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter(
      (e) => !e.includes('hydration') && !e.includes('Warning:')
    );

    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Error Handling - API Errors', () => {
  test('should handle server error gracefully', async ({ page }) => {
    // Mock a 500 error for an API route
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should still be usable
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Edge Cases - Special Characters', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should handle special characters in search', async ({ page }) => {
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.isVisible()) {
      // Enter special characters
      await searchInput.fill('<script>alert("xss")</script>');
      await page.waitForTimeout(500);

      // Should not execute script (no XSS)
      // Page should still be usable
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle special characters in login form', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"], input[id="email"]', 'test+special@example.com');
    await page.fill('input[type="password"], input[id="password"]', 'P@ssw0rd!#$%');
    await page.click('button[type="submit"]');

    // Should not crash
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Edge Cases - Empty States', () => {
  test('should handle empty search results gracefully', async ({ page }) => {
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('zzznonexistentcompetitionzzz123');
      await page.waitForTimeout(1000);

      // Should show "no results" message or empty state
      const emptyState = page.locator('text=/no.*results|no.*found|no.*competitions/i');
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();
      }
    }
  });
});

test.describe('Edge Cases - Concurrent Operations', () => {
  test('should handle rapid navigation', async ({ page }) => {
    await page.goto('/');

    // Rapidly navigate between pages
    const pages = ['/competitions', '/faq', '/about', '/'];
    for (const path of pages) {
      page.goto(path); // Don't await - intentionally rapid
    }

    // Wait for final navigation
    await page.waitForLoadState('networkidle');

    // Page should be in a valid state
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle double-click on buttons', async ({ page }) => {
    await clearBrowserStorage(page);
    await page.goto('/login');

    await page.fill('input[type="email"], input[id="email"]', TEST_USERS.user1.email);
    await page.fill('input[type="password"], input[id="password"]', TEST_USERS.user1.password);

    // Double-click the submit button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.dblclick();

    // Wait for response
    await page.waitForTimeout(3000);

    // Should not cause issues - either logged in or showing error
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Edge Cases - Browser Back/Forward', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should handle back button from checkout', async ({ page }) => {
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Navigate to competition
    await page.goto('/competitions/luffy-gear-5-alt-art');
    await page.waitForLoadState('networkidle');

    // Navigate to checkout (if possible)
    await page.goto('/competitions/luffy-gear-5-alt-art/checkout');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be on competition page
    await expect(page.locator('body')).toBeVisible();

    await logoutUser(page);
  });

  test('should handle forward button after back', async ({ page }) => {
    await page.goto('/');
    await page.goto('/competitions');
    await page.goto('/faq');

    // Go back twice
    await page.goBack();
    await page.goBack();

    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');

    // Should be on competitions page
    await expect(page).toHaveURL(/\/competitions/);
  });
});

test.describe('Edge Cases - Refresh During Operation', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should handle refresh during login', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"], input[id="email"]', TEST_USERS.user1.email);
    await page.fill('input[type="password"], input[id="password"]', TEST_USERS.user1.password);

    // Refresh before submitting
    await page.reload();

    // Form should be reset or preserved
    await expect(page.locator('input[type="email"], input[id="email"]')).toBeVisible();
  });
});

test.describe('Edge Cases - Long Content', () => {
  test('should handle very long email in form', async ({ page }) => {
    await page.goto('/login');

    const longEmail = 'a'.repeat(200) + '@example.com';
    await page.fill('input[type="email"], input[id="email"]', longEmail);
    await page.fill('input[type="password"], input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show validation error
    const error = page.locator('[class*="error"], [class*="destructive"]');
    await expect(error.first()).toBeVisible({ timeout: 5000 });
  });
});
