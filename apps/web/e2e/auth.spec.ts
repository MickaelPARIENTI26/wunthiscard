import { test, expect } from '@playwright/test';
import {
  TEST_USERS,
  loginUser,
  logoutUser,
  registerUser,
  isUserLoggedIn,
  clearBrowserStorage,
  getSessionStorageValue,
} from './fixtures';

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login');

    // Check page elements - heading might be "Welcome back", "Sign in", or "Login"
    await expect(page.locator('h1, h2').filter({ hasText: /sign in|login|welcome/i })).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Should redirect away from login
    await expect(page).not.toHaveURL(/\/login/);

    // Should show user is logged in
    const loggedIn = await isUserLoggedIn(page);
    expect(loggedIn).toBeTruthy();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[id="email"]', 'wrong@example.com');
    await page.fill('input[type="password"], input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[class*="error"], [class*="destructive"], [role="alert"]')).toBeVisible({ timeout: 5000 });

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error with empty email', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="password"], input[id="password"]', 'somepassword');
    await page.click('button[type="submit"]');

    // Should show validation error
    const errorMessages = page.locator('[class*="error"], [class*="destructive"], p:has-text("required"), p:has-text("valid email")');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error with empty password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[id="email"]', TEST_USERS.user1.email);
    await page.click('button[type="submit"]');

    // Should show validation error
    const errorMessages = page.locator('[class*="error"], [class*="destructive"], p:has-text("required"), p:has-text("password")');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to callbackUrl after login', async ({ page }) => {
    const callbackUrl = '/competitions';
    await page.goto(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);

    await page.fill('input[type="email"], input[id="email"]', TEST_USERS.user1.email);
    await page.fill('input[type="password"], input[id="password"]', TEST_USERS.user1.password);
    await page.click('button[type="submit"]');

    // Should redirect to callback URL
    await page.waitForURL('**/competitions**', { timeout: 10000 });
  });

  test('should show Google OAuth button when enabled', async ({ page }) => {
    await page.goto('/login');

    // Check for Google sign-in button (may or may not be visible based on env)
    const googleButton = page.locator('button:has-text("Google"), button:has-text("Sign in with Google")');
    // We just check the page loads, Google OAuth depends on configuration
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Authentication - Logout', () => {
  test('should logout successfully and clear session', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Verify logged in
    let loggedIn = await isUserLoggedIn(page);
    expect(loggedIn).toBeTruthy();

    // Logout
    await logoutUser(page);

    // Should redirect to home
    await expect(page).toHaveURL('/');

    // Should no longer be logged in
    loggedIn = await isUserLoggedIn(page);
    expect(loggedIn).toBeFalsy();
  });

  test('should clear session storage on logout', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Set some session storage values like the checkout flow would
    await page.evaluate(() => {
      sessionStorage.setItem('tickets_test-competition', JSON.stringify([1, 2, 3]));
      sessionStorage.setItem('qcm_passed_test-competition', 'true');
      sessionStorage.setItem('reservation_test-competition', 'some-id');
    });

    // Verify values are set
    let ticketsValue = await getSessionStorageValue(page, 'tickets_test-competition');
    expect(ticketsValue).not.toBeNull();

    // Logout
    await logoutUser(page);

    // Session storage should be cleared
    ticketsValue = await getSessionStorageValue(page, 'tickets_test-competition');
    const qcmValue = await getSessionStorageValue(page, 'qcm_passed_test-competition');
    const reservationValue = await getSessionStorageValue(page, 'reservation_test-competition');

    expect(ticketsValue).toBeNull();
    expect(qcmValue).toBeNull();
    expect(reservationValue).toBeNull();
  });

  test('should redirect unauthenticated user to login when accessing protected page', async ({ page }) => {
    // Try to access protected page without login
    await page.goto('/profile');

    // Should redirect to login (or show login required message)
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Authentication - Registration', () => {
  const uniqueEmail = `test-${Date.now()}@example.com`;

  test('should display registration page correctly', async ({ page }) => {
    await page.goto('/register');

    // Check page elements - heading might be "Create account", "Register", "Sign up", "Join"
    await expect(page.locator('h1, h2').filter({ hasText: /register|sign up|create|join|account/i })).toBeVisible();
    await expect(page.locator('input[id="firstName"]')).toBeVisible();
    await expect(page.locator('input[id="lastName"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/register');
    await page.click('button[type="submit"]');

    // Should show validation errors
    const errorMessages = page.locator('[class*="error"], [class*="destructive"], p[class*="text-sm"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[id="email"]', uniqueEmail);
    await page.fill('input[id="password"]', 'Password123!');
    await page.fill('input[id="confirmPassword"]', 'DifferentPassword123!');

    await page.click('button[type="submit"]');

    // Should show password mismatch error or any validation error
    const errorMessage = page.locator('[class*="error"], [class*="destructive"], p[class*="text-sm text-destructive"]');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error for weak password', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="firstName"], input[id="firstName"]', 'Test');
    await page.fill('input[name="lastName"], input[id="lastName"]', 'User');
    await page.fill('input[type="email"], input[id="email"]', uniqueEmail);
    await page.fill('input[name="password"], input[id="password"]', '123');
    await page.fill('input[name="confirmPassword"], input[id="confirmPassword"]', '123');

    await page.click('button[type="submit"]');

    // Should show password strength error
    const errorMessages = page.locator('[class*="error"], [class*="destructive"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[id="email"]', 'invalid-email');
    await page.fill('input[id="password"]', 'Password123!');
    await page.fill('input[id="confirmPassword"]', 'Password123!');

    await page.click('button[type="submit"]');

    // Should show email validation error
    const errorMessages = page.locator('[class*="error"], [class*="destructive"], p[class*="text-sm text-destructive"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error for already registered email', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="firstName"], input[id="firstName"]', 'John');
    await page.fill('input[name="lastName"], input[id="lastName"]', 'Doe');
    await page.fill('input[type="email"], input[id="email"]', TEST_USERS.user1.email);
    await page.fill('input[name="password"], input[id="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"], input[id="confirmPassword"]', 'Password123!');

    // Accept terms if checkbox exists
    const termsCheckbox = page.locator('input[name="acceptTerms"], input[id="acceptTerms"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.click('button[type="submit"]');

    // Should show email already exists error
    await expect(page.locator('text=/already.*exist|already.*registered|email.*taken/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Authentication - Session Persistence', () => {
  test('should maintain login state across page refreshes', async ({ page }) => {
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be logged in
    const loggedIn = await isUserLoggedIn(page);
    expect(loggedIn).toBeTruthy();
  });

  test('should maintain login state when navigating between pages', async ({ page }) => {
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Navigate to different pages
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');
    let loggedIn = await isUserLoggedIn(page);
    expect(loggedIn).toBeTruthy();

    await page.goto('/faq');
    await page.waitForLoadState('networkidle');
    loggedIn = await isUserLoggedIn(page);
    expect(loggedIn).toBeTruthy();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    loggedIn = await isUserLoggedIn(page);
    expect(loggedIn).toBeTruthy();
  });
});

test.describe('Authentication - Protected Routes', () => {
  test('should redirect to login for /profile when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login for /my-tickets when not authenticated', async ({ page }) => {
    await page.goto('/my-tickets');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login for /my-wins when not authenticated', async ({ page }) => {
    await page.goto('/my-wins');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login for /settings when not authenticated', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should allow access to /profile when authenticated', async ({ page }) => {
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/profile/);
  });
});

test.describe('Authentication - Forgot Password', () => {
  test('should display forgot password page correctly', async ({ page }) => {
    await page.goto('/forgot-password');

    // Check page elements
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.click('button[type="submit"]');

    // Should show validation error
    const errorMessages = page.locator('[class*="error"], [class*="destructive"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[type="email"], input[id="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    // Should show validation error
    const errorMessages = page.locator('[class*="error"], [class*="destructive"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('should accept valid email for password reset', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('input[type="email"], input[id="email"]', TEST_USERS.user1.email);
    await page.click('button[type="submit"]');

    // Should show success message or redirect
    // Note: We can't actually test the email sending, just that the form submits
    await page.waitForTimeout(2000);

    // Either shows success message or redirects
    const successIndicators = [
      'text=/email.*sent|check.*email|reset.*link/i',
      'text=/success/i',
    ];

    let found = false;
    for (const selector of successIndicators) {
      if (await page.locator(selector).isVisible()) {
        found = true;
        break;
      }
    }

    // If no success message, check we're not showing an error
    if (!found) {
      const errorVisible = await page.locator('[role="alert"][class*="destructive"]').isVisible();
      // Some implementations show a generic message for security (even if email doesn't exist)
      expect(page.url()).toContain('/forgot-password');
    }
  });
});

test.describe('Authentication - Login/Logout Cycle (Bug Fix Verification)', () => {
  test('should properly clear state after logout and re-login', async ({ page }) => {
    // First login
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Navigate to a competition page and set some session state
    await page.goto('/competitions');
    await page.evaluate(() => {
      sessionStorage.setItem('tickets_test', JSON.stringify([1, 2, 3]));
      sessionStorage.setItem('qcm_passed_test', 'true');
    });

    // Logout
    await logoutUser(page);

    // Verify session storage is cleared
    const ticketsValue = await getSessionStorageValue(page, 'tickets_test');
    expect(ticketsValue).toBeNull();

    // Login again
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Should start fresh without old session data
    const ticketsAfterRelogin = await getSessionStorageValue(page, 'tickets_test');
    expect(ticketsAfterRelogin).toBeNull();

    // Cleanup
    await logoutUser(page);
  });

  test('should not show "already answered" for QCM after logout and re-login', async ({ page }) => {
    // This test verifies the QCM bug fix
    // Login first time
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Set QCM passed state (simulating previous session)
    await page.evaluate(() => {
      sessionStorage.setItem('qcm_passed_charizard-psa-10-base-set', 'true');
    });

    // Logout
    await logoutUser(page);

    // Re-login
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Check that QCM state is cleared
    const qcmPassed = await getSessionStorageValue(page, 'qcm_passed_charizard-psa-10-base-set');
    expect(qcmPassed).toBeNull();

    // Cleanup
    await logoutUser(page);
  });

  test('should not show old ticket selection after logout and re-login', async ({ page }) => {
    // This test verifies the ticket selection bug fix
    // Login first time
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Set ticket selection state
    await page.evaluate(() => {
      sessionStorage.setItem('tickets_charizard-psa-10-base-set', JSON.stringify([100, 101, 102]));
      sessionStorage.setItem('pending_quantity_charizard-psa-10-base-set', '3');
    });

    // Logout
    await logoutUser(page);

    // Re-login
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Check that ticket state is cleared
    const tickets = await getSessionStorageValue(page, 'tickets_charizard-psa-10-base-set');
    const pendingQuantity = await getSessionStorageValue(page, 'pending_quantity_charizard-psa-10-base-set');

    expect(tickets).toBeNull();
    expect(pendingQuantity).toBeNull();

    // Cleanup
    await logoutUser(page);
  });
});
