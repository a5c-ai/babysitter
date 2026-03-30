# Playwright Skill

Expert assistance for building comprehensive E2E test suites with Playwright, including page objects, fixtures, visual regression, and CI/CD integration.

## Overview

This skill provides specialized guidance for Playwright testing, covering end-to-end testing, visual regression, accessibility testing, and API testing. It helps create maintainable, reliable test suites that integrate with CI/CD pipelines.

## When to Use

- Setting up Playwright for a new project
- Creating page object models for tests
- Implementing visual regression testing
- Adding accessibility testing to your suite
- Configuring cross-browser testing
- Setting up CI/CD integration

## Quick Start

### Basic Setup

```json
{
  "projectType": "web",
  "framework": "react",
  "browsers": ["chromium", "firefox", "webkit"]
}
```

### Full Test Suite

```json
{
  "projectType": "web",
  "framework": "nextjs",
  "features": ["visual", "a11y", "api"],
  "ci": "github",
  "browsers": ["chromium", "firefox"],
  "baseUrl": "http://localhost:3000"
}
```

## Generated Structure

```
tests/
├── playwright.config.ts      # Configuration
├── fixtures/                 # Test fixtures
│   ├── base.ts
│   └── auth.ts
├── pages/                    # Page objects
│   ├── BasePage.ts
│   └── LoginPage.ts
├── e2e/                      # E2E tests
│   ├── auth/
│   └── dashboard/
├── visual/                   # Visual tests
├── a11y/                     # Accessibility tests
└── utils/                    # Utilities
```

## Features

### Page Object Model

```typescript
// tests/pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Custom Fixtures

```typescript
// tests/fixtures/base.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});
```

### Visual Regression

```typescript
test('homepage matches snapshot', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

### Accessibility Testing

```typescript
import AxeBuilder from '@axe-core/playwright';

test('page has no a11y violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### API Testing

```typescript
test('API returns user data', async ({ request }) => {
  const response = await request.get('/api/users/1');
  expect(response.ok()).toBeTruthy();
  const user = await response.json();
  expect(user.name).toBeDefined();
});
```

## Test Examples

### Basic E2E Test

```typescript
import { test, expect } from '../fixtures/base';

test.describe('Authentication', () => {
  test('user can login', async ({ loginPage, page }) => {
    await page.goto('/login');
    await loginPage.login('user@example.com', 'password');
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### Parameterized Tests

```typescript
const testCases = [
  { email: 'user1@test.com', expected: 'User 1' },
  { email: 'user2@test.com', expected: 'User 2' },
];

for (const { email, expected } of testCases) {
  test(`displays name for ${email}`, async ({ page }) => {
    await page.goto(`/users?email=${email}`);
    await expect(page.getByRole('heading')).toContainText(expected);
  });
}
```

### Mobile Testing

```typescript
import { devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test('mobile menu works', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('navigation')).toBeVisible();
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Integration with Processes

| Process | Integration |
|---------|-------------|
| e2e-testing-setup | Primary testing skill |
| visual-regression-testing | Screenshot comparison |
| accessibility-testing | WCAG compliance |
| api-testing | API endpoint testing |
| ci-cd-integration | Pipeline setup |

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| browsers | all | Browsers to test |
| retries | 0 | Retry count for flaky tests |
| workers | auto | Parallel workers |
| reporter | html | Report format |

## Best Practices

1. **Page Objects**: Encapsulate page interactions
2. **Fixtures**: Share setup across tests
3. **Locators**: Use accessible selectors (role, label)
4. **Assertions**: Use web-first assertions
5. **Isolation**: Each test should be independent

## References

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Visual Regression](https://playwright.dev/docs/test-snapshots)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [CI/CD Integration](https://playwright.dev/docs/ci)
