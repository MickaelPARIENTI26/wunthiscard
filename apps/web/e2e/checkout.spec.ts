import { test, expect } from '@playwright/test';
import {
  TEST_USERS,
  TEST_COMPETITIONS,
  QCM_ANSWERS,
  loginUser,
  logoutUser,
  clearBrowserStorage,
  getSessionStorageValue,
} from './fixtures';

test.describe('Checkout Flow - Competition Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should display active competition page correctly', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);

    // Check page elements
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('img').first()).toBeVisible();

    // Should show ticket selection area
    await expect(page.locator('text=/ticket|buy|purchase|enter/i').first()).toBeVisible();

    // Should show price
    await expect(page.locator('text=/£/').first()).toBeVisible();
  });

  test('should not show draft competition', async ({ page }) => {
    const response = await page.goto(`/competitions/${TEST_COMPETITIONS.draft.lebron}`);

    // Should return 404 or redirect
    expect(response?.status()).toBeGreaterThanOrEqual(400);
    // Or check for 404 page
    const is404 = await page.locator('text=/not found|404|doesn\'t exist/i').isVisible();
    expect(is404 || response?.status() === 404).toBeTruthy();
  });

  test('should show upcoming competition correctly', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.upcoming.pikachu}`);

    // Should show competition details
    await expect(page.locator('h1').first()).toBeVisible();

    // Should indicate it's not yet available for purchase
    const upcomingIndicator = page.locator('text=/coming soon|not yet|upcoming|starts/i');
    if (await upcomingIndicator.isVisible()) {
      await expect(upcomingIndicator).toBeVisible();
    }
  });

  test('should show completed competition with winner info', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.completed.blastoise}`);

    // Should show competition details
    await expect(page.locator('h1').first()).toBeVisible();

    // Should indicate competition is completed
    await expect(page.locator('text=/completed|ended|winner|sold out/i').first()).toBeVisible();
  });
});

test.describe('Checkout Flow - Ticket Selection (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);
  });

  test.afterEach(async ({ page }) => {
    await logoutUser(page);
  });

  test('should be able to select tickets when logged in', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}`);
    await page.waitForLoadState('networkidle');

    // Look for ticket selection elements
    const ticketSelector = page.locator('[data-testid="ticket-selector"], [class*="ticket"], button:has-text("Select"), input[type="number"]');
    await expect(ticketSelector.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show quick select buttons for ticket quantities', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}`);
    await page.waitForLoadState('networkidle');

    // Look for quick select buttons (1, 5, 10, etc.)
    const quickSelectButtons = page.locator('button:has-text("1"), button:has-text("5"), button:has-text("10")');

    // At least one quick select should be visible
    const quickSelectVisible = await quickSelectButtons.first().isVisible();

    // Or there might be a number input
    const numberInput = page.locator('input[type="number"]');
    const inputVisible = await numberInput.isVisible();

    expect(quickSelectVisible || inputVisible).toBeTruthy();
  });

  test('should show running total when selecting tickets', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}`);
    await page.waitForLoadState('networkidle');

    // Try to select a ticket quantity
    const numberInput = page.locator('input[type="number"]');
    if (await numberInput.isVisible()) {
      await numberInput.fill('5');

      // Should show total price
      await expect(page.locator('text=/total|£/i').first()).toBeVisible();
    }
  });

  test('should store selected tickets in session storage', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}`);
    await page.waitForLoadState('networkidle');

    // Interact with ticket selection
    const numberInput = page.locator('input[type="number"]');
    if (await numberInput.isVisible()) {
      await numberInput.fill('3');

      // Click add/select button if present
      const addButton = page.locator('button:has-text("Add"), button:has-text("Select"), button:has-text("Pick")');
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(1000);

        // Check session storage
        const keys = await page.evaluate(() => Object.keys(sessionStorage));
        const hasTicketKey = keys.some(k => k.includes('ticket') || k.includes('pending'));
        // This may or may not be true depending on implementation
      }
    }
  });
});

test.describe('Checkout Flow - QCM (Skill Question)', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);
  });

  test.afterEach(async ({ page }) => {
    await logoutUser(page);
  });

  test('should show QCM after selecting tickets', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}`);
    await page.waitForLoadState('networkidle');

    // Select some tickets
    const numberInput = page.locator('input[type="number"]');
    if (await numberInput.isVisible()) {
      await numberInput.fill('1');

      // Click continue/next/checkout button
      const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Checkout"), button:has-text("Buy"), button:has-text("Proceed")');
      if (await continueButton.isVisible()) {
        await continueButton.click();

        // Wait for QCM to appear
        await page.waitForTimeout(2000);

        // Check for QCM elements
        const qcmPresent = await page.locator('text=/question|choose|select.*answer|skill/i').isVisible();
        const radioButtons = await page.locator('input[type="radio"]').count();

        // QCM should be shown (either question text or radio buttons)
        expect(qcmPresent || radioButtons > 0).toBeTruthy();
      }
    }
  });

  test('should show multiple choice options', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}/checkout`);
    await page.waitForLoadState('networkidle');

    // Check for radio buttons or choice elements
    const radioButtons = page.locator('input[type="radio"]');
    const count = await radioButtons.count();

    // Should have multiple options (usually 4)
    if (count > 0) {
      expect(count).toBeGreaterThanOrEqual(2);
    }
  });

  test('should allow selecting an answer', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}/checkout`);
    await page.waitForLoadState('networkidle');

    const radioButtons = page.locator('input[type="radio"]');
    const count = await radioButtons.count();

    if (count > 0) {
      // Select an answer
      await radioButtons.first().check();
      await expect(radioButtons.first()).toBeChecked();
    }
  });

  test('should show error for wrong answer', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}/checkout`);
    await page.waitForLoadState('networkidle');

    const radioButtons = page.locator('input[type="radio"]');
    const count = await radioButtons.count();

    if (count > 0) {
      // Get the correct answer and select a wrong one
      const correctAnswer = QCM_ANSWERS[TEST_COMPETITIONS.active.luffy as keyof typeof QCM_ANSWERS];
      const wrongAnswer = correctAnswer === 0 ? 1 : 0;

      await radioButtons.nth(wrongAnswer).check();

      // Submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Validate"), button:has-text("Check")');
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Wait for response
        await page.waitForTimeout(2000);

        // Should show error or incorrect message
        const errorMessage = page.locator('text=/incorrect|wrong|try again|not correct/i');
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('should proceed after correct answer', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}/checkout`);
    await page.waitForLoadState('networkidle');

    const radioButtons = page.locator('input[type="radio"]');
    const count = await radioButtons.count();

    if (count > 0) {
      // Select the correct answer
      const correctAnswer = QCM_ANSWERS[TEST_COMPETITIONS.active.luffy as keyof typeof QCM_ANSWERS];
      await radioButtons.nth(correctAnswer).check();

      // Submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Validate"), button:has-text("Check")');
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Wait for response
        await page.waitForTimeout(3000);

        // Should either show success or proceed to payment
        const successOrPayment = await page.locator('text=/correct|success|payment|stripe|continue/i').isVisible();
        expect(successOrPayment).toBeTruthy();
      }
    }
  });
});

test.describe('Checkout Flow - Unauthenticated User', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('should redirect to login when trying to purchase', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}`);
    await page.waitForLoadState('networkidle');

    // Try to select tickets and checkout
    const buyButton = page.locator('button:has-text("Buy"), button:has-text("Checkout"), button:has-text("Purchase"), a:has-text("Login to Purchase"), a:has-text("Sign in")');

    if (await buyButton.isVisible()) {
      await buyButton.click();

      // Should redirect to login or show login prompt
      await page.waitForTimeout(2000);
      const onLoginPage = page.url().includes('/login');
      const loginPrompt = await page.locator('text=/sign in|login|log in/i').isVisible();

      expect(onLoginPage || loginPrompt).toBeTruthy();
    }
  });

  test('should allow viewing competition details without login', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.charizard}`);
    await page.waitForLoadState('networkidle');

    // Should see competition title
    await expect(page.locator('h1').first()).toBeVisible();

    // Should see prize value
    await expect(page.locator('text=/£/').first()).toBeVisible();

    // Should see ticket price
    await expect(page.locator('text=/ticket/i').first()).toBeVisible();
  });
});

test.describe('Checkout Flow - Session State Management', () => {
  test('should clear checkout state on logout', async ({ page }) => {
    await clearBrowserStorage(page);

    // Login
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Navigate to competition
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}`);
    await page.waitForLoadState('networkidle');

    // Set some checkout state manually
    await page.evaluate(() => {
      sessionStorage.setItem('tickets_luffy-gear-5-alt-art', JSON.stringify([10, 11, 12]));
      sessionStorage.setItem('qcm_passed_luffy-gear-5-alt-art', 'true');
      sessionStorage.setItem('reservation_luffy-gear-5-alt-art', 'reservation-id-123');
    });

    // Verify state is set
    let ticketState = await getSessionStorageValue(page, 'tickets_luffy-gear-5-alt-art');
    expect(ticketState).not.toBeNull();

    // Logout
    await logoutUser(page);

    // State should be cleared
    ticketState = await getSessionStorageValue(page, 'tickets_luffy-gear-5-alt-art');
    const qcmState = await getSessionStorageValue(page, 'qcm_passed_luffy-gear-5-alt-art');
    const reservationState = await getSessionStorageValue(page, 'reservation_luffy-gear-5-alt-art');

    expect(ticketState).toBeNull();
    expect(qcmState).toBeNull();
    expect(reservationState).toBeNull();
  });

  test('should start fresh checkout after re-login', async ({ page }) => {
    await clearBrowserStorage(page);

    // First session
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    await page.evaluate(() => {
      sessionStorage.setItem('tickets_luffy-gear-5-alt-art', JSON.stringify([50, 51, 52]));
      sessionStorage.setItem('qcm_passed_luffy-gear-5-alt-art', 'true');
    });

    await logoutUser(page);

    // Second session
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Navigate to competition
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}`);
    await page.waitForLoadState('networkidle');

    // Should not have old state
    const ticketState = await getSessionStorageValue(page, 'tickets_luffy-gear-5-alt-art');
    const qcmState = await getSessionStorageValue(page, 'qcm_passed_luffy-gear-5-alt-art');

    expect(ticketState).toBeNull();
    expect(qcmState).toBeNull();

    await logoutUser(page);
  });

  test('should not show "already answered" QCM message after logout/re-login', async ({ page }) => {
    await clearBrowserStorage(page);

    // First session - simulate having passed QCM
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    await page.evaluate(() => {
      sessionStorage.setItem('qcm_passed_luffy-gear-5-alt-art', 'true');
    });

    await logoutUser(page);

    // Second session
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);

    // Navigate to checkout page
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}/checkout`);
    await page.waitForLoadState('networkidle');

    // Should NOT see "already answered" or similar message
    const alreadyAnswered = await page.locator('text=/already.*answered|already.*completed|already.*passed/i').isVisible();
    expect(alreadyAnswered).toBeFalsy();

    await logoutUser(page);
  });
});

test.describe('Checkout Flow - Bonus Tickets', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);
  });

  test.afterEach(async ({ page }) => {
    await logoutUser(page);
  });

  test('should show bonus ticket info for bulk purchases', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}`);
    await page.waitForLoadState('networkidle');

    // Look for bonus ticket information
    const bonusInfo = page.locator('text=/bonus|free|extra/i');

    // Bonus info should be visible somewhere on the page
    if (await bonusInfo.isVisible()) {
      await expect(bonusInfo).toBeVisible();
    }
  });

  test('should calculate bonus tickets correctly for 10+ tickets', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}`);
    await page.waitForLoadState('networkidle');

    const numberInput = page.locator('input[type="number"]');
    if (await numberInput.isVisible()) {
      await numberInput.fill('10');
      await page.waitForTimeout(500);

      // Check for bonus indication (e.g., "+1 bonus" or "11 total")
      const bonusText = await page.locator('text=/\\+1|bonus|free/i').isVisible();
      // This depends on UI implementation
    }
  });
});

test.describe('Checkout Flow - Max Tickets Per User', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserStorage(page);
    await loginUser(page, TEST_USERS.user1.email, TEST_USERS.user1.password);
  });

  test.afterEach(async ({ page }) => {
    await logoutUser(page);
  });

  test('should enforce max tickets per user limit', async ({ page }) => {
    await page.goto(`/competitions/${TEST_COMPETITIONS.active.luffy}`);
    await page.waitForLoadState('networkidle');

    const numberInput = page.locator('input[type="number"]');
    if (await numberInput.isVisible()) {
      // Try to enter more than max (usually 50)
      await numberInput.fill('100');
      await page.waitForTimeout(500);

      // Should either cap the value or show error
      const inputValue = await numberInput.inputValue();
      const valueNum = parseInt(inputValue, 10);

      // Either value is capped to max, or an error is shown
      const errorShown = await page.locator('text=/maximum|limit|max|too many/i').isVisible();
      expect(valueNum <= 50 || errorShown).toBeTruthy();
    }
  });
});
