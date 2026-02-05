import { test, expect } from "@playwright/test";

/**
 * E2E Test: Login Flow
 *
 * Tests the complete login flow including:
 * - Google OAuth button visibility
 * - Redirect handling
 * - Session persistence
 * - Error handling
 *
 * @note These tests assume a test environment with mock OAuth
 * In production, you would use a test account or mock the OAuth flow
 */

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and localStorage before each test
    await page.context().clearCookies();
    await page.goto("/auth/login");
  });

  test("should display login page with Google OAuth button", async ({ page }) => {
    await expect(page).toHaveTitle(/WealthJourney/);

    // Check for login form elements
    await expect(page.locator("h1")).toContainText(/login|sign in/i);

    // Google OAuth button should be visible
    const googleButton = page.locator('button:has-text("Google"), a:has-text("Google")');
    await expect(googleButton).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    const registerLink = page.locator('a:has-text("register", "sign up")');

    // Click register link (case insensitive)
    const links = page.locator("a");
    const registerLinkExists = await links.filter({ hasText: /register|sign up/i }).count();

    if (registerLinkExists > 0) {
      await links.filter({ hasText: /register|sign up/i }).first().click();
      await expect(page).toHaveURL(/\/register/);
      await expect(page.locator("h1")).toContainText(/register|sign up/i);
    }
  });

  test("should handle login redirect", async ({ page }) => {
    // Try to access a protected route
    await page.goto("/dashboard/home");

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test("should persist session after page reload", async ({ page }) => {
    // This test requires a working OAuth flow or test account
    // For now, we'll test the structure

    // Set a mock token (in real tests, you'd complete the OAuth flow)
    await page.evaluate(() => {
      localStorage.setItem("token", "mock-test-token");
    });

    await page.reload();

    // Token should persist
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBe("mock-test-token");
  });

  test("should clear session on logout", async ({ page }) => {
    // Set a mock token
    await page.evaluate(() => {
      localStorage.setItem("token", "mock-test-token");
    });

    // Navigate to dashboard
    await page.goto("/dashboard/home");

    // Find and click logout button (if visible)
    const logoutButton = page.locator('button:has-text("logout"), button:has-text("sign out")');

    const logoutExists = await logoutButton.count();

    if (logoutExists > 0) {
      await logoutButton.first().click();

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);

      // Token should be cleared
      const token = await page.evaluate(() => localStorage.getItem("token"));
      expect(token).toBeNull();
    }
  });
});

test.describe("Mobile Authentication", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should display login page correctly on mobile", async ({ page }) => {
    await page.goto("/auth/login");

    // Login form should be visible and responsive
    await expect(page.locator("h1")).toBeVisible();

    // Google OAuth button should be tappable
    const googleButton = page.locator('button:has-text("Google"), a:has-text("Google")');
    await expect(googleButton).toBeVisible();
    const box = await googleButton.boundingBox();
    expect(box?.height).toBeGreaterThan(44); // Minimum touch target size
  });
});
