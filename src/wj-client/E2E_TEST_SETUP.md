# Playwright E2E Test Setup Instructions

This document provides step-by-step instructions for setting up and running E2E tests with Playwright.

## Installation Steps

### 1. Install Playwright

Navigate to the wj-client directory and install Playwright:

```bash
cd src/wj-client
npm install -D @playwright/test @playwright/microsoft-edges
```

### 2. Update package.json Scripts

Add these test scripts to your `package.json` in the `scripts` section:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

### 3. Install Browser Binaries

```bash
npx playwright install
```

For a smaller installation, you can install only Chromium:

```bash
npx playwright install chromium
```

### 4. Verify Installation

Run a quick test to ensure everything is working:

```bash
npx playwright test --list
```

This should list all test files in the `tests/` directory.

## Configuration

### Environment Variables

Create a `.env.test` file for test-specific settings:

```env
# Base URL for tests
BASE_URL=http://localhost:3000

# Test user credentials (for authenticated tests)
TEST_USER_EMAIL=test@example.com
TEST_AUTH_TOKEN=your-test-jwt-token-here
```

### Playwright Config

The `playwright.config.ts` file is already set up with:
- Test directory: `./tests`
- Base URL: `http://localhost:3000` (configurable via BASE_URL)
- Auto-starting dev server before tests
- Screenshots and videos on failure
- HTML test reports

## Running Tests

### Quick Start

```bash
# Install and run
npm install -D @playwright/test
npx playwright install
npm run test:e2e
```

### Interactive Mode

```bash
npm run test:e2e:ui
```

This opens the Playwright UI where you can:
- Run tests interactively
- Inspect elements
- Debug tests
- View time travel execution

### Debug Mode

```bash
npm run test:e2e:debug
```

This opens the browser with Playwright Inspector for step-by-step debugging.

### Run Specific Tests

```bash
# Run all tests in a file
npx playwright test portfolio-calculations

# Run tests matching a pattern
npx playwright test --grep "should display"

# Run in specific browser
npx playwright test --project=chromium
```

## Current Test Suite

### Portfolio Calculations Test

Location: `tests/integration/portfolio-calculations.test.ts`

Tests verify:
1. Page loads without errors
2. Portfolio summary cards display correctly
3. Monetary values are properly formatted
4. PNL values have correct color coding (green/red)
5. Holdings table displays all columns
6. Investment rows show formatted values
7. PNL calculations are consistent across the page
8. Responsive layout works on mobile and desktop
9. Loading states display correctly
10. Empty states are handled properly

## Authentication Setup

### Current State

The tests currently navigate directly to `/dashboard/portfolio` without authentication.

### To Enable Authentication

You have three options:

**Option 1: Use Pre-set Token (Recommended for CI)**

1. Create a test user in your database
2. Generate a JWT token for that user
3. Set the token in `.env.test`:
   ```env
   TEST_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Update the test's `beforeEach` to set the token:
   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.goto('/');
     await page.evaluate((token) => {
       localStorage.setItem('token', token);
     }, process.env.TEST_AUTH_TOKEN);
     await page.goto('/dashboard/portfolio');
   });
   ```

**Option 2: Mock Google OAuth**

Use MSW (Mock Service Worker) to mock the OAuth flow. See `tests/integration/auth-setup.example.ts` for details.

**Option 3: Use Test-Only Authentication Endpoint**

Add a test-only endpoint to your backend that bypasses OAuth and returns a test token.

## Adding Data Testids

For more reliable tests, consider adding `data-testid` attributes to key elements:

```tsx
// In your React components
<div data-testid="portfolio-summary">
  <div data-testid="total-value">{formatCurrency(totalValue)}</div>
  <div data-testid="total-cost">{formatCurrency(totalCost)}</div>
  <div data-testid="total-pnl">{formatCurrency(totalPnl)}</div>
</div>
```

Then in tests:

```typescript
const totalValue = await page.textContent('[data-testid="total-value"]');
expect(totalValue).toMatch(/\$[\d,]+\.\d{2}/);
```

## Continuous Integration

### GitHub Actions

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

## Troubleshooting

### Tests Fail with "Token Not Found"

The tests need authentication. See the "Authentication Setup" section above.

### Tests Timeout

1. Ensure the backend is running
2. Check BASE_URL is correct
3. Increase timeout: `test.setTimeout(60000)`

### Browser Not Installed

```bash
npx playwright install
```

### Port Already in Use

The dev server might already be running. Stop it or change the port in `playwright.config.ts`.

## Next Steps

1. Install Playwright: `npm install -D @playwright/test`
2. Install browsers: `npx playwright install`
3. Set up test authentication (choose one of the options above)
4. Run tests: `npm run test:e2e`
5. Add more tests as needed

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Authentication](https://playwright.dev/docs/auth)
- [Test Generator](https://playwright.dev/docs/codegen)
