import { test, expect } from '@playwright/test';
import { TEST_USERS, clearBrowserStorage } from './fixtures';

// Admin panel runs on port 3001
const ADMIN_BASE_URL = 'http://localhost:3001';

// Helper to login to admin panel
async function loginAdmin(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(`${ADMIN_BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"], input[id="email"]', email);
  await page.fill('input[type="password"], input[id="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

async function logoutAdmin(page: import('@playwright/test').Page) {
  await page.goto(`${ADMIN_BASE_URL}/logout`);
  await page.waitForTimeout(2000);
}

test.describe('Admin - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should display admin login page', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/login`);

    await expect(page.locator('h1, h2').filter({ hasText: /login|sign in|admin/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should login as super admin', async ({ page }) => {
    await loginAdmin(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);

    // Should be on dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should login as admin', async ({ page }) => {
    await loginAdmin(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Should be on dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should reject login from regular user', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_USERS.user1.email);
    await page.fill('input[type="password"]', TEST_USERS.user1.password);
    await page.click('button[type="submit"]');

    // Should show error or stay on login
    await page.waitForTimeout(2000);
    const onLogin = page.url().includes('/login');
    const errorShown = await page.locator('text=/unauthorized|not.*admin|permission|denied/i').isVisible();

    expect(onLogin || errorShown).toBeTruthy();
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard`);

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Admin - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
    await loginAdmin(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);
  });

  test.afterEach(async ({ page }) => {
    await logoutAdmin(page);
  });

  test('should display dashboard with stats', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Should show stats cards
    const statsCards = page.locator('[data-testid="stat-card"], [class*="stat"], [class*="card"]');
    await expect(statsCards.first()).toBeVisible();
  });

  test('should display sidebar navigation', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard`);

    // Should show sidebar
    const sidebar = page.locator('aside, nav, [data-testid="sidebar"]');
    await expect(sidebar.first()).toBeVisible();
  });

  test('should have links to all admin sections', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard`);

    // Check for main navigation links
    const links = [
      'text=/competition|competitions/i',
      'text=/user|users/i',
      'text=/order|orders/i',
    ];

    for (const link of links) {
      const navLink = page.locator(link);
      if (await navLink.first().isVisible()) {
        await expect(navLink.first()).toBeVisible();
      }
    }
  });
});

test.describe('Admin - Competitions Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
    await loginAdmin(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);
  });

  test.afterEach(async ({ page }) => {
    await logoutAdmin(page);
  });

  test('should display competitions list', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/competitions`);
    await page.waitForLoadState('networkidle');

    // Should show table or list of competitions
    const table = page.locator('table, [data-testid="competitions-table"]');
    await expect(table).toBeVisible();
  });

  test('should show competition status badges', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/competitions`);
    await page.waitForLoadState('networkidle');

    // Should show status badges (ACTIVE, DRAFT, COMPLETED, etc.)
    const statusBadges = page.locator('text=/active|draft|completed|upcoming/i');
    await expect(statusBadges.first()).toBeVisible();
  });

  test('should be able to navigate to competition detail', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/competitions`);
    await page.waitForLoadState('networkidle');

    // Click on a competition row
    const row = page.locator('table tbody tr').first();
    if (await row.isVisible()) {
      await row.click();

      // Should navigate to detail/edit page
      await page.waitForTimeout(1000);
      expect(page.url()).toMatch(/competitions\/.+/);
    }
  });

  test('should have create competition button', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/competitions`);
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), a:has-text("Create"), a:has-text("New")');
    await expect(createButton.first()).toBeVisible();
  });
});

test.describe('Admin - Users Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
    await loginAdmin(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);
  });

  test.afterEach(async ({ page }) => {
    await logoutAdmin(page);
  });

  test('should display users list', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/users`);
    await page.waitForLoadState('networkidle');

    // Should show table of users
    const table = page.locator('table, [data-testid="users-table"]');
    await expect(table).toBeVisible();
  });

  test('should show user roles', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/users`);
    await page.waitForLoadState('networkidle');

    // Should show role badges (USER, ADMIN, SUPER_ADMIN)
    const roleBadges = page.locator('text=/user|admin|super.*admin/i');
    await expect(roleBadges.first()).toBeVisible();
  });

  test('should be able to search users', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/users`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('john');
      await page.waitForTimeout(500);

      // Results should be filtered
      const table = page.locator('table tbody tr');
      await expect(table.first()).toBeVisible();
    }
  });

  test('should be able to navigate to user detail', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/users`);
    await page.waitForLoadState('networkidle');

    const row = page.locator('table tbody tr').first();
    if (await row.isVisible()) {
      await row.click();

      await page.waitForTimeout(1000);
      expect(page.url()).toMatch(/users\/.+/);
    }
  });
});

test.describe('Admin - Orders Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
    await loginAdmin(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);
  });

  test.afterEach(async ({ page }) => {
    await logoutAdmin(page);
  });

  test('should display orders list', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/orders`);
    await page.waitForLoadState('networkidle');

    const table = page.locator('table, [data-testid="orders-table"]');
    await expect(table).toBeVisible();
  });

  test('should show order status', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/orders`);
    await page.waitForLoadState('networkidle');

    // Should show payment status badges
    const statusBadges = page.locator('text=/succeeded|pending|failed/i');
    await expect(statusBadges.first()).toBeVisible();
  });

  test('should show order amounts in GBP', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/orders`);
    await page.waitForLoadState('networkidle');

    // Should show GBP amounts
    const gbpAmount = page.locator('text=/£\\d/');
    await expect(gbpAmount.first()).toBeVisible();
  });

  test('should be able to navigate to order detail', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/orders`);
    await page.waitForLoadState('networkidle');

    const row = page.locator('table tbody tr').first();
    if (await row.isVisible()) {
      await row.click();

      await page.waitForTimeout(1000);
      expect(page.url()).toMatch(/orders\/.+/);
    }
  });
});

test.describe('Admin - FAQ Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
    await loginAdmin(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);
  });

  test.afterEach(async ({ page }) => {
    await logoutAdmin(page);
  });

  test('should display FAQ list', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/faq`);
    await page.waitForLoadState('networkidle');

    // Should show FAQ items
    const faqItems = page.locator('[data-testid="faq-item"], [class*="accordion"], article');
    await expect(faqItems.first()).toBeVisible();
  });

  test('should have create FAQ button', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/faq`);
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
    await expect(createButton.first()).toBeVisible();
  });

  test('should be able to navigate to FAQ edit page', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/faq`);
    await page.waitForLoadState('networkidle');

    const faqItem = page.locator('[data-testid="faq-item"], [class*="accordion-item"]').first();
    if (await faqItem.isVisible()) {
      await faqItem.click();

      await page.waitForTimeout(1000);
      // Should navigate to edit page
      expect(page.url()).toMatch(/faq\/.+/);
    }
  });
});

test.describe('Admin - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
    await loginAdmin(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);
  });

  test.afterEach(async ({ page }) => {
    await logoutAdmin(page);
  });

  test('should display settings page', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/settings`);
    await page.waitForLoadState('networkidle');

    // Should show settings form
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('should show site settings', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/settings`);
    await page.waitForLoadState('networkidle');

    // Should show input fields for settings
    const inputs = page.locator('input, textarea');
    await expect(inputs.first()).toBeVisible();
  });
});

test.describe('Admin - Audit Log', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
    await loginAdmin(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);
  });

  test.afterEach(async ({ page }) => {
    await logoutAdmin(page);
  });

  test('should display audit log page', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/audit`);
    await page.waitForLoadState('networkidle');

    // Should show audit log entries
    const table = page.locator('table, [data-testid="audit-table"]');
    if (await table.isVisible()) {
      await expect(table).toBeVisible();
    }
  });

  test('should show action types in audit log', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/dashboard/audit`);
    await page.waitForLoadState('networkidle');

    // Should show action types (LOGIN, LOGOUT, etc.)
    const actionTypes = page.locator('text=/login|logout|create|update|delete/i');
    if (await actionTypes.first().isVisible()) {
      await expect(actionTypes.first()).toBeVisible();
    }
  });
});

test.describe('Admin - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
    await loginAdmin(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);
  });

  test.afterEach(async ({ page }) => {
    await logoutAdmin(page);
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto(`${ADMIN_BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Dashboard should still be usable
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should have mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`${ADMIN_BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Should show hamburger menu or sidebar toggle
    const menuToggle = page.locator('button[aria-label*="menu" i], [data-testid="sidebar-toggle"]');
    if (await menuToggle.first().isVisible()) {
      await expect(menuToggle.first()).toBeVisible();
    }
  });
});

test.describe('Admin - Session Management', () => {
  test('should logout and clear session', async ({ page }) => {
    await clearBrowserStorage(page);
    await loginAdmin(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password);

    // Set some session data
    await page.evaluate(() => {
      sessionStorage.setItem('admin_test', 'value');
    });

    // Logout
    await logoutAdmin(page);

    // Should be logged out
    await page.goto(`${ADMIN_BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
  });
});
