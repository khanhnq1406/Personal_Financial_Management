import { test as base } from '@playwright/test';

/**
 * Authentication Fixtures for Playwright Tests
 *
 * This file provides reusable authentication setup for tests.
 * Copy this pattern to your test files or use as a fixture.
 */

// Define test fixtures with authentication
export const test = base.extend<{
  authenticatedPage: any;
}>({
  authenticatedPage: async ({ page }, use) => {
    // Method 1: Set token directly in localStorage
    // This is fastest but requires knowing the token format
    await page.goto('/');

    // Check if we need to authenticate
    const needsAuth = await page.evaluate(() => {
      const token = localStorage.getItem('token');
      return !token;
    });

    if (needsAuth) {
      // For development, you might want to set a test token
      // In production, you'd log in via UI or API

      // Example: Set token from environment variable
      const testToken = process.env.TEST_AUTH_TOKEN;

      if (testToken) {
        await page.evaluate((token) => {
          localStorage.setItem('token', token);
        }, testToken);
      } else {
        // Fallback: Login via UI (slow but reliable)
        await page.goto('/auth/login');

        // This assumes Google OAuth - you'd need to mock this
        // or use a different auth method for testing

        // For now, skip auth in E2E tests and focus on logged-in state
      }
    }

    await use(page);
  },
});

/**
 * Example usage in test file:
 *
 * import { test } from './auth-setup.example';
 *
 * test('my authenticated test', async ({ authenticatedPage }) => {
 *   await authenticatedPage.goto('/dashboard/portfolio');
 *   // Test code here
 * });
 */

/**
 * Alternative: API-based authentication
 */
export async function authenticateViaAPI(page: any, email: string, password: string) {
  // Make API call to get token
  const response = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  const { token } = await response.json();

  // Set token in page context
  await page.goto('/');
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
  }, token);

  return token;
}

/**
 * Alternative: Seed test database with test user
 *
 * This would be done in a setup script or beforeAll hook
 */
export async function createTestUser() {
  // Implementation depends on your backend
  // Example:
  // await db.users.create({
  //   email: 'test@example.com',
  //   password: 'hashed_password',
  //   name: 'Test User',
  // });
}

/**
 * Mock Google OAuth for testing
 *
 * Since this app uses Google OAuth, you'll need to:
 * 1. Create a test user in the database
 * 2. Set a valid JWT token for that user
 * 3. Use that token in tests
 *
 * Or use a service like MSW (Mock Service Worker) to mock the OAuth flow
 */
export async function mockGoogleAuth(page: any) {
  // This would intercept the Google OAuth callback
  // and return a mock token

  await page.route('**/auth/google/callback', (route: any) => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        token: 'mock-jwt-token',
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
      }),
    });
  });
}

/**
 * Recommended approach for this app:
 *
 * 1. Create a test user in the database with known credentials
 * 2. Generate a valid JWT token for that user
 * 3. Store the token in environment variables
 * 4. Use the token directly in tests via localStorage
 *
 * This avoids the complexity of mocking Google OAuth
 */
