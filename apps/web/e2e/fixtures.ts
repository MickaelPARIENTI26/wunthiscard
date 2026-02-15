import { test as base, expect, Page } from '@playwright/test';

/**
 * Test user credentials from seed data
 */
export const TEST_USERS = {
  superAdmin: {
    email: 'admin@winucard.com',
    password: 'Admin123!',
    name: 'Super Admin',
  },
  admin: {
    email: 'moderator@winucard.com',
    password: 'Admin123!',
    name: 'Mod Admin',
  },
  user1: {
    email: 'john@example.com',
    password: 'User123!',
    name: 'John Doe',
  },
  user2: {
    email: 'jane@example.com',
    password: 'User123!',
    name: 'Jane Smith',
  },
};

/**
 * Test competition slugs from seed data
 */
export const TEST_COMPETITIONS = {
  active: {
    charizard: 'charizard-psa-10-base-set',
    luffy: 'luffy-gear-5-alt-art',
    messi: 'signed-messi-jersey-2022',
    onePiece: 'signed-one-piece-manga',
  },
  upcoming: {
    pikachu: 'pikachu-illustrator-promo',
  },
  completed: {
    blastoise: 'blastoise-psa-9-completed',
  },
  draft: {
    lebron: 'lebron-rookie-card-draft',
  },
};

/**
 * QCM answers for competitions from seed data
 */
export const QCM_ANSWERS = {
  'charizard-psa-10-base-set': 0, // 1996
  'pikachu-illustrator-promo': 1, // 39
  'luffy-gear-5-alt-art': 1, // Gear 5
  'signed-messi-jersey-2022': 1, // 1
  'lebron-rookie-card-draft': 1, // 2003
  'blastoise-psa-9-completed': 1, // 36
  'signed-one-piece-manga': 2, // 1997
};

/**
 * Stripe test card numbers
 */
export const STRIPE_TEST_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  requiresAuth: '4000002500003155',
};

/**
 * Helper to login a user
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Wait for form to be visible
  await page.waitForSelector('input[id="email"], input[name="email"]', { timeout: 10000 });

  await page.fill('input[id="email"], input[name="email"]', email);
  await page.fill('input[id="password"], input[name="password"]', password);

  await page.click('button[type="submit"]');

  // Wait for either redirect or error message
  try {
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  } catch {
    // Check if there's an error message
    const errorVisible = await page.locator('[class*="error"], [class*="destructive"]').isVisible();
    if (errorVisible) {
      throw new Error('Login failed - error message displayed');
    }
    throw new Error('Login failed - timeout waiting for redirect');
  }
}

/**
 * Helper to logout a user
 */
export async function logoutUser(page: Page): Promise<void> {
  await page.goto('/logout');
  try {
    await page.waitForURL('/', { timeout: 15000 });
  } catch {
    // Logout page might redirect to a different URL
    await page.waitForLoadState('domcontentloaded');
  }
}

/**
 * Helper to register a new user
 */
export async function registerUser(
  page: Page,
  data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }
): Promise<void> {
  await page.goto('/register');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('input[name="firstName"], input[id="firstName"]', data.firstName);
  await page.fill('input[name="lastName"], input[id="lastName"]', data.lastName);
  await page.fill('input[name="email"], input[id="email"]', data.email);
  await page.fill('input[name="password"], input[id="password"]', data.password);
  await page.fill('input[name="confirmPassword"], input[id="confirmPassword"]', data.password);

  // Accept terms if checkbox exists
  const termsCheckbox = page.locator('input[name="acceptTerms"], input[id="acceptTerms"]');
  if (await termsCheckbox.isVisible()) {
    await termsCheckbox.check();
  }

  await page.click('button[type="submit"]');
}

/**
 * Helper to select tickets on competition page
 */
export async function selectTickets(
  page: Page,
  count: number
): Promise<void> {
  // Click the quick select button or manually pick tickets
  const quickSelectBtn = page.locator(`button:has-text("${count}")`);
  if (await quickSelectBtn.isVisible()) {
    await quickSelectBtn.click();
  } else {
    // Use random picker or manual selection
    const randomPickerBtn = page.locator('button:has-text("Random"), button:has-text("Pick Random")');
    if (await randomPickerBtn.isVisible()) {
      // Enter count in input
      const countInput = page.locator('input[type="number"]');
      if (await countInput.isVisible()) {
        await countInput.fill(count.toString());
      }
      await randomPickerBtn.click();
    }
  }
}

/**
 * Helper to answer QCM correctly
 */
export async function answerQcmCorrectly(
  page: Page,
  competitionSlug: string
): Promise<void> {
  const correctAnswer = QCM_ANSWERS[competitionSlug as keyof typeof QCM_ANSWERS];
  if (correctAnswer === undefined) {
    throw new Error(`No QCM answer found for competition: ${competitionSlug}`);
  }

  // Wait for QCM to be visible
  await page.waitForSelector('[data-testid="qcm-form"], form:has(input[type="radio"])', { timeout: 5000 });

  // Select the correct answer (0-indexed)
  const options = page.locator('input[type="radio"]');
  await options.nth(correctAnswer).check();

  // Submit the answer
  const submitBtn = page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Validate")');
  await submitBtn.click();
}

/**
 * Helper to check if user is logged in
 */
export async function isUserLoggedIn(page: Page): Promise<boolean> {
  // Check for user menu/avatar or profile link
  const userIndicators = [
    '[data-testid="user-menu"]',
    'button:has([data-testid="avatar"])',
    'a[href="/profile"]',
    'a[href="/my-tickets"]',
  ];

  for (const selector of userIndicators) {
    if (await page.locator(selector).isVisible()) {
      return true;
    }
  }

  // Check for login button (if visible, user is not logged in)
  const loginButton = page.locator('a[href="/login"]');
  return !(await loginButton.isVisible());
}

/**
 * Helper to clear browser storage
 * Must be called after navigating to a page (not on about:blank)
 */
export async function clearBrowserStorage(page: Page): Promise<void> {
  // First navigate to a page to avoid security errors
  const currentUrl = page.url();
  if (currentUrl === 'about:blank' || !currentUrl.startsWith('http')) {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  }

  try {
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch {
        // Ignore errors
      }
      try {
        sessionStorage.clear();
      } catch {
        // Ignore errors
      }
    });
  } catch {
    // Ignore security errors
  }

  // Clear cookies as well
  await page.context().clearCookies();
}

/**
 * Helper to get session storage value
 */
export async function getSessionStorageValue(
  page: Page,
  key: string
): Promise<string | null> {
  try {
    return await page.evaluate((k) => sessionStorage.getItem(k), key);
  } catch {
    return null;
  }
}

/**
 * Helper to get local storage value
 */
export async function getLocalStorageValue(
  page: Page,
  key: string
): Promise<string | null> {
  try {
    return await page.evaluate((k) => localStorage.getItem(k), key);
  } catch {
    return null;
  }
}

/**
 * Custom test fixture with authenticated user
 */
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);
    await use(page);
    await logoutUser(page);
  },
});

export { expect };
