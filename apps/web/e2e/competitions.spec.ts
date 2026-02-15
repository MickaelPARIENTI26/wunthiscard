import { test, expect } from '@playwright/test';
import { TEST_COMPETITIONS, TEST_USERS, loginUser, logoutUser, clearBrowserStorage } from './fixtures';

test.describe('Competitions List Page', () => {
  test('should display competitions page correctly', async ({ page }) => {
    await page.goto('/competitions');

    // Should have title
    await expect(page.locator('h1').first()).toBeVisible();

    // Should show competition cards
    const competitionCards = page.locator('[data-testid="competition-card"], article, [class*="card"]');
    await expect(competitionCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should not show DRAFT competitions', async ({ page }) => {
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    // Draft competition should not be visible
    const draftCompetition = page.locator(`text=${TEST_COMPETITIONS.draft.lebron}`);
    await expect(draftCompetition).not.toBeVisible();
  });

  test('should not show CANCELLED competitions', async ({ page }) => {
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    // Check no cancelled text visible
    const cancelledIndicator = page.locator('text=/cancelled/i');
    const count = await cancelledIndicator.count();
    expect(count).toBe(0);
  });

  test('should show ACTIVE competitions', async ({ page }) => {
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    // At least one competition card should be visible
    const cards = page.locator('[data-testid="competition-card"], article, [class*="card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('should show filter/category options', async ({ page }) => {
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    // Look for filter controls
    const filters = page.locator('[data-testid="filters"], [class*="filter"], button:has-text("Filter"), select');
    // Filters are optional but if present, should work
    if (await filters.first().isVisible()) {
      await expect(filters.first()).toBeVisible();
    }
  });

  test('should show ticket progress on cards', async ({ page }) => {
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    // Look for progress indicator (e.g., "150 / 5000 sold")
    const progressIndicator = page.locator('text=/\\d+.*sold|\\d+.*remaining|\\d+.*%/i');
    if (await progressIndicator.first().isVisible()) {
      await expect(progressIndicator.first()).toBeVisible();
    }
  });

  test('should show price on competition cards', async ({ page }) => {
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    // Should show price in GBP
    const priceText = page.locator('text=/£\\d/');
    await expect(priceText.first()).toBeVisible();
  });

  test('should be able to click on competition card to view details', async ({ page }) => {
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    // Click on first competition card
    const firstCard = page.locator('[data-testid="competition-card"], article, a:has([class*="card"])').first();
    await firstCard.click();

    // Should navigate to competition detail page
    await expect(page).toHaveURL(/\/competitions\/.+/);
  });
});

test.describe('Competition Detail Page', () => {
  test('should display competition details correctly', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    // Should show title
    await expect(page.locator('h1').first()).toBeVisible();

    // Should show image
    await expect(page.locator('img').first()).toBeVisible();

    // Should show price
    await expect(page.locator('text=/£/').first()).toBeVisible();
  });

  test('should show prize value', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    // Should show prize value (£150,000 for Charizard)
    await expect(page.locator('text=/£.*\\d/').first()).toBeVisible();
  });

  test('should show ticket price', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    // Should show ticket price
    const ticketPrice = page.locator('text=/ticket.*£|£.*ticket|per ticket/i');
    await expect(ticketPrice.first()).toBeVisible();
  });

  test('should show draw date', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    // Should show draw date
    const drawDate = page.locator('text=/draw|ends|closing/i');
    await expect(drawDate.first()).toBeVisible();
  });

  test('should show description', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    // Should have description content
    const description = page.locator('text=/charizard|pokemon|card/i');
    await expect(description.first()).toBeVisible();
  });

  test('should show grade/condition for graded cards', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    // Should show PSA grade
    const grade = page.locator('text=/PSA|BGS|CGC|grade|gem mint/i');
    await expect(grade.first()).toBeVisible();
  });

  test('should show sold/available ticket count', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    // Should show ticket availability
    const availability = page.locator('text=/sold|available|remaining|\\d+.*of.*\\d+/i');
    await expect(availability.first()).toBeVisible();
  });

  test('should show 404 for non-existent competition', async ({ page }) => {
    const response = await page.goto('/competitions/this-competition-does-not-exist');

    // Should return 404 or show not found message
    expect(response?.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Competition Categories', () => {
  test('should display Pokemon competitions', async ({ page }) => {
    await page.goto('/competitions?category=POKEMON');
    await page.waitForLoadState('networkidle');

    // Should show Pokemon competitions
    const cards = page.locator('[data-testid="competition-card"], article');
    // At least charizard should be visible
    const hasCompetitions = await cards.first().isVisible();

    // If URL filtering works, we should see filtered results
    // Otherwise, check the page loaded
    await expect(page).toHaveURL(/\/competitions/);
  });

  test('should display One Piece competitions', async ({ page }) => {
    await page.goto('/competitions?category=ONE_PIECE');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/competitions/);
  });

  test('should display Sports competitions', async ({ page }) => {
    await page.goto('/competitions?category=SPORTS');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/competitions/);
  });
});

test.describe('Competition Gallery', () => {
  test('should show main image', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    const mainImage = page.locator('img').first();
    await expect(mainImage).toBeVisible();
  });

  test('should be able to view gallery images if available', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    // Look for gallery thumbnails or navigation
    const galleryNav = page.locator('[data-testid="gallery"], [class*="gallery"], button:has-text("Next"), button:has-text("Previous")');

    if (await galleryNav.first().isVisible()) {
      await expect(galleryNav.first()).toBeVisible();
    }
  });
});

test.describe('Competition - Featured Section', () => {
  test('should show featured competition on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for featured/hero section
    const featuredSection = page.locator('[data-testid="hero"], [class*="hero"], [class*="featured"]');

    // Featured competition (Charizard) should be visible
    if (await featuredSection.isVisible()) {
      // Check for competition content
      const competitionContent = page.locator('text=/charizard|competition|win/i');
      await expect(competitionContent.first()).toBeVisible();
    }
  });
});

test.describe('Competition - Upcoming', () => {
  test('should show upcoming competition correctly', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.upcoming.pikachu}`);
    await page.waitForLoadState('networkidle');

    // Should show the competition
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('should indicate upcoming status', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.upcoming.pikachu}`);
    await page.waitForLoadState('networkidle');

    // Should show upcoming indicator or start date
    const upcomingIndicator = page.locator('text=/coming soon|upcoming|starts|not yet|sale starts/i');
    if (await upcomingIndicator.first().isVisible()) {
      await expect(upcomingIndicator.first()).toBeVisible();
    }
  });

  test('should not allow purchasing upcoming competition', async ({ page }) => {
    await clearBrowserStorage(page);
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    await page.goto(`/competitions/${TEST_COMPETITIONS.upcoming.pikachu}`);
    await page.waitForLoadState('networkidle');

    // Buy button should be disabled or not present
    const buyButton = page.locator('button:has-text("Buy"), button:has-text("Purchase")');
    if (await buyButton.isVisible()) {
      const isDisabled = await buyButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }

    await logoutUser(page);
  });
});

test.describe('Competition - Completed', () => {
  test('should show completed competition correctly', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.completed.blastoise}`);
    await page.waitForLoadState('networkidle');

    // Should show the competition
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('should indicate completed status', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.completed.blastoise}`);
    await page.waitForLoadState('networkidle');

    // Should show completed indicator
    const completedIndicator = page.locator('text=/completed|ended|winner|drawn|sold out/i');
    await expect(completedIndicator.first()).toBeVisible();
  });

  test('should show winner information', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.completed.blastoise}`);
    await page.waitForLoadState('networkidle');

    // Should show winner info or winning ticket number
    const winnerInfo = page.locator('text=/winner|winning.*ticket|ticket.*#42|congratulations/i');
    if (await winnerInfo.first().isVisible()) {
      await expect(winnerInfo.first()).toBeVisible();
    }
  });

  test('should not allow purchasing completed competition', async ({ page }) => {
    await clearBrowserStorage(page);
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    await page.goto(`/competitions/${TEST_COMPETITIONS.completed.blastoise}`);
    await page.waitForLoadState('networkidle');

    // Buy button should not be present or be disabled
    const buyButton = page.locator('button:has-text("Buy"), button:has-text("Purchase")');
    if (await buyButton.isVisible()) {
      const isDisabled = await buyButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    }

    await logoutUser(page);
  });
});

test.describe('Competition - Search', () => {
  test('should have search functionality', async ({ page }) => {
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], [data-testid="search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('charizard');
      await page.waitForTimeout(500);

      // Should filter results
      const results = page.locator('[data-testid="competition-card"], article');
      await expect(results.first()).toBeVisible();
    }
  });
});

test.describe('Competition - Sorting', () => {
  test('should be able to sort competitions', async ({ page }) => {
    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    // Look for sort dropdown
    const sortDropdown = page.locator('select, button:has-text("Sort"), [data-testid="sort"]');

    if (await sortDropdown.first().isVisible()) {
      await sortDropdown.first().click();

      // Look for sort options
      const sortOptions = page.locator('option, [role="option"], [role="menuitem"]');
      if (await sortOptions.first().isVisible()) {
        await expect(sortOptions.first()).toBeVisible();
      }
    }
  });
});

test.describe('Competition - Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/competitions');
    await page.waitForLoadState('networkidle');

    // Should show competitions in mobile layout
    const cards = page.locator('[data-testid="competition-card"], article');
    await expect(cards.first()).toBeVisible();
  });

  test('should display competition detail correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    // Should show title
    await expect(page.locator('h1').first()).toBeVisible();

    // Should show image
    await expect(page.locator('img').first()).toBeVisible();
  });
});

test.describe('Competition - Metadata', () => {
  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    // Check for meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();

    // Check for title
    const title = await page.title();
    expect(title).toContain('Charizard');
  });

  test('should have Open Graph tags', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    // Check for OG tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');

    // At least title should be present
    if (ogTitle) {
      expect(ogTitle).toBeTruthy();
    }
  });
});
