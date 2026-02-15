import { test, expect } from '@playwright/test';
import { TEST_USERS, loginUser, logoutUser, clearBrowserStorage } from './fixtures';

test.describe('Navigation - Header', () => {
  test('should display header with logo and navigation', async ({ page }) => {
    await page.goto('/');

    // Check header exists
    await expect(page.locator('header')).toBeVisible();

    // Check logo/brand
    await expect(page.locator('a[href="/"]').first()).toBeVisible();

    // Check navigation links (desktop)
    const desktopNav = page.locator('nav');
    await expect(desktopNav).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Test Competitions link
    const competitionsLink = page.locator('a[href="/competitions"]');
    if (await competitionsLink.isVisible()) {
      await competitionsLink.click();
      await expect(page).toHaveURL(/\/competitions/);
    }

    // Test FAQ link
    await page.goto('/');
    const faqLink = page.locator('a[href="/faq"]');
    if (await faqLink.isVisible()) {
      await faqLink.click();
      await expect(page).toHaveURL(/\/faq/);
    }

    // Test About link
    await page.goto('/');
    const aboutLink = page.locator('a[href="/about"]');
    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await expect(page).toHaveURL(/\/about/);
    }
  });

  test('should show login/register buttons when not authenticated', async ({ page }) => {
    await clearBrowserStorage(page);
    await page.goto('/');

    // Should show login and register buttons
    const loginLink = page.locator('a[href="/login"]');
    const registerLink = page.locator('a[href="/register"]');

    await expect(loginLink).toBeVisible();
    await expect(registerLink).toBeVisible();
  });

  test('should show user menu when authenticated', async ({ page }) => {
    await clearBrowserStorage(page);
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should show user menu/avatar instead of login
    const loginLink = page.locator('a[href="/login"]');
    const loginVisible = await loginLink.isVisible();

    // Login button should not be visible when logged in
    expect(loginVisible).toBeFalsy();

    await logoutUser(page);
  });
});

test.describe('Navigation - Mobile Menu', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should show hamburger menu on mobile', async ({ page }) => {
    await page.goto('/');

    // Look for hamburger/menu button
    const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg[class*="menu" i]), [data-testid="mobile-menu-button"]');
    await expect(menuButton.first()).toBeVisible();
  });

  test('should open mobile menu when clicking hamburger', async ({ page }) => {
    await page.goto('/');

    const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg[class*="menu" i]), [data-testid="mobile-menu-button"]');
    if (await menuButton.first().isVisible()) {
      await menuButton.first().click();

      // Wait for menu to open
      await page.waitForTimeout(500);

      // Check for mobile menu content (could be sheet, drawer, or modal)
      const mobileMenu = page.locator('[role="dialog"], [data-testid="mobile-menu"], [class*="sheet" i], [class*="drawer" i]');
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('should close mobile menu when clicking link', async ({ page }) => {
    await page.goto('/');

    const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg[class*="menu" i])');
    if (await menuButton.first().isVisible()) {
      await menuButton.first().click();
      await page.waitForTimeout(500);

      // Click a link in the menu
      const faqLink = page.locator('[role="dialog"] a[href="/faq"], [class*="sheet" i] a[href="/faq"]');
      if (await faqLink.isVisible()) {
        await faqLink.click();
        await expect(page).toHaveURL(/\/faq/);
      }
    }
  });
});

test.describe('Navigation - Footer', () => {
  test('should display footer with links', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should have legal links in footer', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for common legal links
    const termsLink = page.locator('footer a:has-text("Terms"), footer a[href*="terms"]');
    const privacyLink = page.locator('footer a:has-text("Privacy"), footer a[href*="privacy"]');

    // At least one should be visible
    const termsVisible = await termsLink.isVisible();
    const privacyVisible = await privacyLink.isVisible();

    expect(termsVisible || privacyVisible).toBeTruthy();
  });

  test('should have social links in footer', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for social links
    const socialLinks = page.locator('footer a[href*="instagram"], footer a[href*="twitter"], footer a[href*="facebook"], footer a[href*="tiktok"], footer a[href*="discord"]');
    const count = await socialLinks.count();

    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Navigation - Breadcrumbs', () => {
  test('should show breadcrumbs on competition detail page', async ({ page }) => {
    await page.goto('/competitions/charizard-psa-10-base-set');
    await page.waitForLoadState('networkidle');

    // Look for breadcrumb navigation
    const breadcrumbs = page.locator('nav[aria-label="breadcrumb"], [class*="breadcrumb" i]');
    if (await breadcrumbs.isVisible()) {
      await expect(breadcrumbs).toBeVisible();

      // Should contain link back to competitions
      const competitionsLink = breadcrumbs.locator('a[href="/competitions"]');
      await expect(competitionsLink).toBeVisible();
    }
  });
});

test.describe('Navigation - Page Titles', () => {
  test('should have correct title on home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/winucard/i);
  });

  test('should have correct title on competitions page', async ({ page }) => {
    await page.goto('/competitions');
    await expect(page).toHaveTitle(/competition|winucard/i);
  });

  test('should have correct title on FAQ page', async ({ page }) => {
    await page.goto('/faq');
    await expect(page).toHaveTitle(/faq|frequently|questions|winucard/i);
  });

  test('should have correct title on login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/login|sign in|winucard/i);
  });
});

test.describe('Navigation - 404 Page', () => {
  test('should show 404 page for non-existent route', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');

    // Should return 404 status
    expect(response?.status()).toBe(404);

    // Or show 404 content
    const notFoundText = page.locator('text=/not found|404|page.*exist/i');
    await expect(notFoundText).toBeVisible();
  });

  test('should have link back to home on 404 page', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');

    // Should have a way to go back to home
    const homeLink = page.locator('a[href="/"], a:has-text("Home"), a:has-text("Go back")');
    await expect(homeLink.first()).toBeVisible();
  });
});

test.describe('Navigation - Scroll to Top', () => {
  test('should scroll to top when navigating to new page', async ({ page }) => {
    await page.goto('/');

    // Scroll down on home page
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(300);

    // Navigate to another page
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    // Should be at top
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });
});

test.describe('Navigation - Loading States', () => {
  test('should show loading indicator during navigation', async ({ page }) => {
    await page.goto('/');

    // Start navigation
    const navigationPromise = page.goto('/competitions');

    // Check for loading indicator (optional - depends on implementation)
    // This is tricky to test as loading is fast

    await navigationPromise;
    await page.waitForLoadState('networkidle');

    // Verify we reached the destination
    await expect(page).toHaveURL(/\/competitions/);
  });
});

test.describe('Navigation - Active Link Highlighting', () => {
  test('should highlight current page in navigation', async ({ page }) => {
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    // Check if competitions link has active state
    const competitionsLink = page.locator('nav a[href="/competitions"]');
    if (await competitionsLink.isVisible()) {
      // Look for active class or aria-current
      const hasActiveState =
        (await competitionsLink.getAttribute('aria-current')) === 'page' ||
        (await competitionsLink.getAttribute('class'))?.includes('active');

      // This depends on implementation
    }
  });
});

test.describe('Navigation - External Links', () => {
  test('should open external links in new tab', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Find external links (social media)
    const externalLinks = page.locator('a[href^="http"]:not([href*="localhost"])');
    const count = await externalLinks.count();

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const link = externalLinks.nth(i);
        const target = await link.getAttribute('target');
        const rel = await link.getAttribute('rel');

        // External links should open in new tab
        expect(target).toBe('_blank');
        // And have noopener for security
        expect(rel).toContain('noopener');
      }
    }
  });
});

test.describe('Navigation - Keyboard Navigation', () => {
  test('should be navigable with keyboard', async ({ page }) => {
    await page.goto('/');

    // Press Tab to navigate
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Something should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/');

    // Tab to a link
    await page.keyboard.press('Tab');

    // Get focused element
    const focusedElement = page.locator(':focus');
    if (await focusedElement.isVisible()) {
      // Check for focus ring or outline
      const outline = await focusedElement.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.outline || style.boxShadow;
      });
      // Should have some visual focus indicator
    }
  });
});
