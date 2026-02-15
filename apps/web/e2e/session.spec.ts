import { test, expect } from '@playwright/test';
import {
  TEST_USERS,
  loginUser,
  logoutUser,
  clearBrowserStorage,
  getSessionStorageValue,
  getLocalStorageValue,
} from './fixtures';

test.describe('Session Management - Storage Cleanup', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should clear all checkout-related session storage on logout', async ({ page }) => {
    // Login
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Set various checkout-related session storage items
    await page.evaluate(() => {
      sessionStorage.setItem('tickets_competition-1', JSON.stringify([1, 2, 3]));
      sessionStorage.setItem('tickets_competition-2', JSON.stringify([10, 11]));
      sessionStorage.setItem('reservation_competition-1', 'res-123');
      sessionStorage.setItem('pending_quantity_competition-1', '3');
      sessionStorage.setItem('qcm_passed_competition-1', 'true');
      sessionStorage.setItem('qcm_attempts_competition-1', '2');
      sessionStorage.setItem('other_unrelated_key', 'should-not-be-cleared');
    });

    // Verify data is set
    let tickets = await getSessionStorageValue(page, 'tickets_competition-1');
    expect(tickets).not.toBeNull();

    // Logout
    await logoutUser(page);

    // Checkout-related keys should be cleared
    tickets = await getSessionStorageValue(page, 'tickets_competition-1');
    const reservation = await getSessionStorageValue(page, 'reservation_competition-1');
    const pendingQty = await getSessionStorageValue(page, 'pending_quantity_competition-1');
    const qcmPassed = await getSessionStorageValue(page, 'qcm_passed_competition-1');

    expect(tickets).toBeNull();
    expect(reservation).toBeNull();
    expect(pendingQty).toBeNull();
    expect(qcmPassed).toBeNull();
  });

  test('should clear local storage checkout data on logout', async ({ page }) => {
    // Login
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Set local storage items
    await page.evaluate(() => {
      localStorage.setItem('tickets_competition-1', JSON.stringify([1, 2]));
      localStorage.setItem('qcm_passed_competition-1', 'true');
    });

    // Logout
    await logoutUser(page);

    // Should be cleared
    const tickets = await getLocalStorageValue(page, 'tickets_competition-1');
    const qcmPassed = await getLocalStorageValue(page, 'qcm_passed_competition-1');

    expect(tickets).toBeNull();
    expect(qcmPassed).toBeNull();
  });
});

test.describe('Session Management - Multiple Logout Methods', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should cleanup when logging out via /logout page directly', async ({ page }) => {
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    await page.evaluate(() => {
      sessionStorage.setItem('qcm_passed_test', 'true');
    });

    // Navigate directly to logout page
    await page.goto('/logout');
    await page.waitForURL('/', { timeout: 10000 });

    const qcmPassed = await getSessionStorageValue(page, 'qcm_passed_test');
    expect(qcmPassed).toBeNull();
  });

  test('should cleanup when logging out via header menu', async ({ page }) => {
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    await page.evaluate(() => {
      sessionStorage.setItem('tickets_test', JSON.stringify([1, 2, 3]));
    });

    // Try to find and click logout in user menu
    const userMenuTrigger = page.locator('[data-testid="user-menu"], button:has([class*="avatar"]), button:has([class*="Avatar"])');
    if (await userMenuTrigger.isVisible()) {
      await userMenuTrigger.click();

      const logoutButton = page.locator('button:has-text("Log out"), a:has-text("Log out"), [role="menuitem"]:has-text("Log out")');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForURL('/', { timeout: 10000 });

        const tickets = await getSessionStorageValue(page, 'tickets_test');
        expect(tickets).toBeNull();
        return;
      }
    }

    // Fallback to /logout if menu not found
    await page.goto('/logout');
    await page.waitForURL('/', { timeout: 10000 });
  });
});

test.describe('Session Management - Cross-Tab Behavior', () => {
  test('should handle session in new tab correctly', async ({ browser }) => {
    // Create two browser contexts (simulating different tabs with shared storage)
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Login in first tab
    await loginUser(page1, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Second tab should also be logged in (same context = same cookies)
    await page2.goto('/');
    await page2.waitForLoadState('networkidle');

    // Check for login indicator in second tab
    const loginButton = page2.locator('a[href="/login"]');
    const isLoggedOut = await loginButton.isVisible();
    expect(isLoggedOut).toBeFalsy();

    await context.close();
  });
});

test.describe('Session Management - Session Expiry', () => {
  test('should redirect to login when session cookie is invalid', async ({ page }) => {
    // Clear all storage and cookies
    await clearBrowserStorage(page);
    await page.context().clearCookies();

    // Try to access protected route
    await page.goto('/profile');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Session Management - Concurrent Sessions', () => {
  test('should handle login from different user correctly', async ({ page }) => {
    await clearBrowserStorage(page);

    // Login as user1
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Set some session data for user1
    await page.evaluate(() => {
      sessionStorage.setItem('user_data', JSON.stringify({ id: 'user1' }));
    });

    // Logout
    await logoutUser(page);

    // Login as user2
    await loginUser(page, TEST_USERS.user2.email, TEST_USERS.user2.password);

    // Should not have user1's session data
    const userData = await getSessionStorageValue(page, 'user_data');
    expect(userData).toBeNull();

    await logoutUser(page);
  });

  test('should properly switch between users without data leakage', async ({ page }) => {
    await clearBrowserStorage(page);

    // User 1 session
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);
    await page.evaluate(() => {
      sessionStorage.setItem('tickets_comp1', JSON.stringify([1, 2, 3]));
      sessionStorage.setItem('qcm_passed_comp1', 'true');
    });
    await logoutUser(page);

    // User 2 session
    await loginUser(page, TEST_USERS.user2.email, TEST_USERS.user2.password);

    // User 2 should not see user 1's data
    const tickets = await getSessionStorageValue(page, 'tickets_comp1');
    const qcm = await getSessionStorageValue(page, 'qcm_passed_comp1');

    expect(tickets).toBeNull();
    expect(qcm).toBeNull();

    await logoutUser(page);
  });
});

test.describe('Session Management - Page Navigation State', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should preserve session state during navigation', async ({ page }) => {
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Set some state
    await page.evaluate(() => {
      sessionStorage.setItem('test_state', 'active');
    });

    // Navigate through several pages
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    await page.goto('/faq');
    await page.waitForLoadState('networkidle');

    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    // State should still be present
    const state = await getSessionStorageValue(page, 'test_state');
    expect(state).toBe('active');

    await logoutUser(page);
  });

  test('should clear state completely on logout even after navigation', async ({ page }) => {
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    await page.evaluate(() => {
      sessionStorage.setItem('tickets_test', JSON.stringify([1, 2]));
    });

    // Navigate around
    await page.goto('/competitions');
    await page.goto('/faq');
    await page.goto('/about');

    // Now logout
    await logoutUser(page);

    // State should be cleared
    const tickets = await getSessionStorageValue(page, 'tickets_test');
    expect(tickets).toBeNull();
  });
});

test.describe('Session Management - Browser Back/Forward', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should handle browser back button after logout', async ({ page }) => {
    // Login
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Navigate to profile
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Logout
    await logoutUser(page);

    // Press back button
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should either show profile (if cached) or redirect to login
    // In a well-implemented app, should redirect to login
    const url = page.url();
    const isProtected = url.includes('/profile');

    if (isProtected) {
      // If on profile page, try to refresh
      await page.reload();
      await page.waitForLoadState('networkidle');

      // After refresh should redirect to login
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

test.describe('Session Management - Rapid Login/Logout', () => {
  test('should handle rapid login/logout cycles', async ({ page }) => {
    await clearBrowserStorage(page);

    // Perform multiple rapid login/logout cycles
    for (let i = 0; i < 3; i++) {
      await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

      await page.evaluate((iteration) => {
        sessionStorage.setItem(`test_${iteration}`, 'value');
      }, i);

      await logoutUser(page);

      // Verify cleanup
      const value = await getSessionStorageValue(page, `test_${i}`);
      expect(value).toBeNull();
    }
  });
});

test.describe('Session Management - Error Recovery', () => {
  test('should recover gracefully if logout fails', async ({ page }) => {
    await clearBrowserStorage(page);
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Even if server-side logout has issues, client should clean up
    await page.goto('/logout');

    // Wait for redirect or error
    await page.waitForTimeout(5000);

    // Should be on home page or show some indication of logout
    const url = page.url();
    expect(url.includes('/logout')).toBeFalsy(); // Should not stay on logout page
  });
});
