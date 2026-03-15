---
name: playwright
description: Playwright E2E testing, page objects, fixtures, visual regression, accessibility testing, and CI integration patterns.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Playwright Skill

Expert assistance for building comprehensive E2E test suites with Playwright, including page objects, fixtures, visual regression, and CI/CD integration.

## Capabilities

- Generate Playwright test project structure
- Create page object models for maintainable tests
- Implement custom fixtures and test utilities
- Configure visual regression testing
- Set up accessibility testing with axe-core
- Integrate with CI/CD pipelines (GitHub Actions, etc.)
- Generate API testing alongside UI tests

## Usage

Invoke this skill when you need to:
- Set up Playwright testing for a web application
- Create page object patterns for test organization
- Implement visual regression testing
- Configure cross-browser testing
- Set up CI/CD test automation

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectType | string | No | web, api, component (default: web) |
| framework | string | No | react, nextjs, vue, angular |
| browsers | array | No | chromium, firefox, webkit (default: all) |
| features | array | No | visual, a11y, api, component |
| ci | string | No | github, gitlab, jenkins |

### Test Configuration

```json
{
  "projectType": "web",
  "framework": "nextjs",
  "browsers": ["chromium", "firefox"],
  "features": ["visual", "a11y", "api"],
  "ci": "github",
  "baseUrl": "http://localhost:3000"
}
```

## Output Structure

```
tests/
├── playwright.config.ts           # Playwright configuration
├── fixtures/
│   ├── base.ts                   # Base test fixture
│   ├── auth.ts                   # Authentication fixture
│   └── api.ts                    # API helper fixture
├── pages/
│   ├── BasePage.ts               # Base page object
│   ├── LoginPage.ts              # Login page object
│   └── DashboardPage.ts          # Dashboard page object
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── logout.spec.ts
│   ├── dashboard/
│   │   └── dashboard.spec.ts
│   └── api/
│       └── users.api.spec.ts
├── visual/
│   ├── homepage.visual.spec.ts
│   └── screenshots/              # Baseline screenshots
├── a11y/
│   └── accessibility.spec.ts
├── utils/
│   ├── helpers.ts
│   └── test-data.ts
└── .github/
    └── workflows/
        └── playwright.yml        # CI workflow
```

## Generated Code Patterns

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Base Page Object

```typescript
// tests/pages/BasePage.ts
import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly footer: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.footer = page.locator('footer');
    this.loadingSpinner = page.locator('[data-testid="loading"]');
  }

  abstract get url(): string;

  async goto() {
    await this.page.goto(this.url);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }

  async expectToBeVisible() {
    await expect(this.page).toHaveURL(new RegExp(this.url));
  }

  async getToastMessage(): Promise<string | null> {
    const toast = this.page.locator('[role="alert"]');
    if (await toast.isVisible()) {
      return toast.textContent();
    }
    return null;
  }
}
```

### Login Page Object

```typescript
// tests/pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.locator('[role="alert"]');
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
  }

  get url() {
    return '/login';
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }
}
```

### Custom Fixtures

```typescript
// tests/fixtures/base.ts
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

interface TestFixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
}

interface WorkerFixtures {
  authenticatedPage: void;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  authenticatedPage: [
    async ({ browser }, use) => {
      const context = await browser.newContext({
        storageState: 'tests/.auth/user.json',
      });
      await use();
      await context.close();
    },
    { scope: 'worker' },
  ],
});

export { expect };
```

### Authentication Setup

```typescript
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: authFile });
});
```

### E2E Test Example

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '../../fixtures/base';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should login with valid credentials', async ({ loginPage }) => {
    await loginPage.login('user@example.com', 'password123');
    await loginPage.expectLoginSuccess();
  });

  test('should show error with invalid credentials', async ({ loginPage }) => {
    await loginPage.login('invalid@example.com', 'wrongpassword');
    await loginPage.expectErrorMessage('Invalid email or password');
  });

  test('should show validation errors for empty fields', async ({ loginPage }) => {
    await loginPage.submitButton.click();
    await expect(loginPage.emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(loginPage.passwordInput).toHaveAttribute('aria-invalid', 'true');
  });
});
```

### Visual Regression Test

```typescript
// tests/visual/homepage.visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('homepage should match snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('login page should match snapshot', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('dashboard should match snapshot @authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveScreenshot('dashboard.png', {
      mask: [page.locator('[data-testid="user-avatar"]')],
    });
  });
});
```

### Accessibility Test

```typescript
// tests/a11y/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage should have no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login form should be keyboard accessible', async ({ page }) => {
    await page.goto('/login');

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Email')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
  });
});
```

### API Test

```typescript
// tests/e2e/api/users.api.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Users API', () => {
  test('should get user list', async ({ request }) => {
    const response = await request.get('/api/users');

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.users).toBeInstanceOf(Array);
    expect(body.users.length).toBeGreaterThan(0);
  });

  test('should create a new user', async ({ request }) => {
    const response = await request.post('/api/users', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    expect(response.status()).toBe(201);

    const user = await response.json();
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
  });
});
```

### GitHub Actions Workflow

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Dependencies

```json
{
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "@axe-core/playwright": "^4.10.0"
  }
}
```

## Workflow

1. **Setup configuration** - Create playwright.config.ts
2. **Create page objects** - Model application pages
3. **Define fixtures** - Set up test utilities
4. **Write tests** - E2E, visual, a11y tests
5. **Configure CI** - GitHub Actions workflow
6. **Generate reports** - HTML, JSON, JUnit

## Best Practices Applied

- Page Object Model for maintainability
- Custom fixtures for reusability
- Parallel test execution
- Cross-browser testing
- Visual regression baselines
- Accessibility testing integration
- Proper test isolation

## References

- Playwright Documentation: https://playwright.dev/docs/intro
- playwright-skill: https://github.com/lackeyjb/playwright-skill
- mcp-playwright: https://github.com/executeautomation/mcp-playwright
- Axe-core: https://www.deque.com/axe/

## Target Processes

- e2e-testing-setup
- visual-regression-testing
- accessibility-testing
- api-testing
- ci-cd-integration
