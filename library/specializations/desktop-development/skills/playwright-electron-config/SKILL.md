---
name: playwright-electron-config
description: Configure Playwright for comprehensive Electron application testing including E2E tests, visual regression, accessibility audits, and cross-platform test matrices
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [electron, testing, playwright, e2e, automation]
---

# playwright-electron-config

Configure Playwright for comprehensive Electron application testing. This skill sets up the complete testing infrastructure including E2E tests, visual regression testing, accessibility audits, and cross-platform test matrices with CI/CD integration.

## Capabilities

- Configure Playwright for Electron with `_electron` fixture
- Generate page object models for Electron windows
- Set up visual regression testing with snapshots
- Configure accessibility testing with axe-core
- Create cross-platform test matrices for CI
- Mock Electron APIs (dialog, shell, clipboard)
- Test IPC communication between main and renderer
- Generate test coverage reports

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Electron project root"
    },
    "testDir": {
      "type": "string",
      "default": "tests/e2e"
    },
    "features": {
      "type": "array",
      "items": {
        "enum": [
          "visualRegression",
          "accessibility",
          "coverage",
          "performance",
          "ipcTesting",
          "multiWindow",
          "systemDialogMocks"
        ]
      },
      "default": ["visualRegression", "accessibility", "ipcTesting"]
    },
    "platforms": {
      "type": "array",
      "items": { "enum": ["windows", "macos", "linux"] },
      "default": ["windows", "macos", "linux"]
    },
    "pageObjects": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "selectors": { "type": "object" }
        }
      },
      "description": "Page objects to generate"
    },
    "ciIntegration": {
      "type": "object",
      "properties": {
        "provider": { "enum": ["github-actions", "azure-devops", "circleci", "gitlab"] },
        "parallelization": { "type": "boolean", "default": true },
        "sharding": { "type": "number", "description": "Number of shards" }
      }
    }
  },
  "required": ["projectPath"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "type": { "enum": ["config", "fixture", "pageObject", "test", "helper", "ci"] }
        }
      }
    },
    "commands": {
      "type": "object",
      "properties": {
        "runTests": { "type": "string" },
        "updateSnapshots": { "type": "string" },
        "showReport": { "type": "string" }
      }
    },
    "ciWorkflow": {
      "type": "string",
      "description": "Path to generated CI workflow file"
    }
  },
  "required": ["success", "files"]
}
```

## Generated File Structure

```
tests/
  e2e/
    playwright.config.ts     # Main Playwright config
    fixtures/
      electron-app.ts        # Electron fixture
      test-utils.ts          # Test utilities
    page-objects/
      MainWindow.ts          # Page object models
      SettingsDialog.ts
    specs/
      app.spec.ts            # Application tests
      ipc.spec.ts            # IPC tests
      visual.spec.ts         # Visual regression
      a11y.spec.ts           # Accessibility tests
    mocks/
      electron-api-mocks.ts  # Electron API mocks
      ipc-mocks.ts           # IPC mocks
    snapshots/               # Visual snapshots
    reports/                 # Test reports
```

## Code Templates

### Playwright Configuration for Electron

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'tests/e2e/reports' }],
    ['json', { outputFile: 'tests/e2e/reports/results.json' }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'electron',
      testMatch: '**/*.spec.ts',
    },
  ],
});
```

### Electron Test Fixture

```typescript
// fixtures/electron-app.ts
import { test as base, ElectronApplication, Page } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

export type TestFixtures = {
  electronApp: ElectronApplication;
  mainWindow: Page;
};

export const test = base.extend<TestFixtures>({
  electronApp: async ({}, use) => {
    // Launch Electron app
    const electronApp = await electron.launch({
      args: [path.join(__dirname, '../../dist/main/main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    // Use the app in tests
    await use(electronApp);

    // Cleanup
    await electronApp.close();
  },

  mainWindow: async ({ electronApp }, use) => {
    // Wait for first window
    const window = await electronApp.firstWindow();

    // Wait for app to be ready
    await window.waitForLoadState('domcontentloaded');

    await use(window);
  },
});

export { expect } from '@playwright/test';
```

### Page Object Model

```typescript
// page-objects/MainWindow.ts
import { Page, Locator } from '@playwright/test';

export class MainWindow {
  readonly page: Page;
  readonly titleBar: Locator;
  readonly sidebar: Locator;
  readonly mainContent: Locator;
  readonly statusBar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleBar = page.locator('[data-testid="title-bar"]');
    this.sidebar = page.locator('[data-testid="sidebar"]');
    this.mainContent = page.locator('[data-testid="main-content"]');
    this.statusBar = page.locator('[data-testid="status-bar"]');
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async openSettings(): Promise<void> {
    await this.page.click('[data-testid="settings-button"]');
    await this.page.waitForSelector('[data-testid="settings-dialog"]');
  }

  async navigateTo(section: string): Promise<void> {
    await this.sidebar.locator(`[data-section="${section}"]`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async screenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({ path: `tests/e2e/snapshots/${name}.png` });
  }
}
```

### IPC Testing

```typescript
// specs/ipc.spec.ts
import { test, expect } from '../fixtures/electron-app';

test.describe('IPC Communication', () => {
  test('should send message to main process', async ({ electronApp, mainWindow }) => {
    // Evaluate in main process
    const result = await electronApp.evaluate(async ({ ipcMain }) => {
      return new Promise((resolve) => {
        ipcMain.once('test-channel', (event, data) => {
          resolve(data);
        });
      });
    });

    // Send from renderer
    await mainWindow.evaluate(() => {
      window.electronAPI.send('test-channel', { message: 'hello' });
    });

    // Verify
    expect(result).toEqual({ message: 'hello' });
  });

  test('should receive response from main process', async ({ mainWindow }) => {
    const response = await mainWindow.evaluate(async () => {
      return window.electronAPI.invoke('get-app-version');
    });

    expect(response).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
```

### Visual Regression Testing

```typescript
// specs/visual.spec.ts
import { test, expect } from '../fixtures/electron-app';
import { MainWindow } from '../page-objects/MainWindow';

test.describe('Visual Regression', () => {
  test('main window matches snapshot', async ({ mainWindow }) => {
    const page = new MainWindow(mainWindow);

    // Wait for animations to complete
    await mainWindow.waitForTimeout(500);

    await expect(mainWindow).toHaveScreenshot('main-window.png', {
      maxDiffPixels: 100,
    });
  });

  test('dark mode matches snapshot', async ({ electronApp, mainWindow }) => {
    // Toggle dark mode via IPC
    await mainWindow.evaluate(() => {
      window.electronAPI.invoke('set-theme', 'dark');
    });

    await mainWindow.waitForTimeout(300);

    await expect(mainWindow).toHaveScreenshot('main-window-dark.png', {
      maxDiffPixels: 100,
    });
  });

  test('settings dialog matches snapshot', async ({ mainWindow }) => {
    const page = new MainWindow(mainWindow);
    await page.openSettings();

    const dialog = mainWindow.locator('[data-testid="settings-dialog"]');
    await expect(dialog).toHaveScreenshot('settings-dialog.png');
  });
});
```

### Accessibility Testing

```typescript
// specs/a11y.spec.ts
import { test, expect } from '../fixtures/electron-app';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('main window should have no accessibility violations', async ({ mainWindow }) => {
    const accessibilityScanResults = await new AxeBuilder({ page: mainWindow })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation should work', async ({ mainWindow }) => {
    // Tab through focusable elements
    await mainWindow.keyboard.press('Tab');
    const firstFocused = await mainWindow.evaluate(() =>
      document.activeElement?.getAttribute('data-testid')
    );
    expect(firstFocused).toBeTruthy();

    // Verify focus is visible
    const focusedElement = mainWindow.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('screen reader announcements should be correct', async ({ mainWindow }) => {
    // Check ARIA labels
    const button = mainWindow.locator('[data-testid="save-button"]');
    await expect(button).toHaveAttribute('aria-label');

    // Check live regions
    const liveRegion = mainWindow.locator('[aria-live="polite"]');
    await expect(liveRegion).toBeAttached();
  });
});
```

### Electron API Mocks

```typescript
// mocks/electron-api-mocks.ts
import { ElectronApplication } from '@playwright/test';

export async function mockDialog(
  electronApp: ElectronApplication,
  response: { filePaths?: string[]; canceled?: boolean }
) {
  await electronApp.evaluate(
    async ({ dialog }, response) => {
      dialog.showOpenDialog = async () => response;
      dialog.showSaveDialog = async () => ({
        filePath: response.filePaths?.[0],
        canceled: response.canceled ?? false,
      });
    },
    response
  );
}

export async function mockClipboard(
  electronApp: ElectronApplication,
  content: string
) {
  await electronApp.evaluate(
    async ({ clipboard }, content) => {
      clipboard.readText = () => content;
      clipboard.writeText = () => {};
    },
    content
  );
}

export async function mockShell(electronApp: ElectronApplication) {
  const openedUrls: string[] = [];

  await electronApp.evaluate(async ({ shell }) => {
    shell.openExternal = async (url) => {
      // Track in test
      return true;
    };
  });

  return { openedUrls };
}
```

### GitHub Actions CI Workflow

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build Electron app
        run: npm run build

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.os }}-${{ matrix.shardIndex }}
          path: tests/e2e/reports/

      - name: Upload snapshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: snapshots-${{ matrix.os }}-${{ matrix.shardIndex }}
          path: tests/e2e/snapshots/

  merge-reports:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          pattern: playwright-report-*
          merge-multiple: true
          path: merged-reports

      - name: Merge reports
        run: npx playwright merge-reports merged-reports --reporter html
```

## Best Practices

1. **Use data-testid attributes** - Stable selectors for test automation
2. **Wait for app ready state** - Use `waitForLoadState()` before interactions
3. **Mock external dependencies** - Dialog, shell, network calls
4. **Run tests in isolation** - Fresh app instance per test when needed
5. **Use visual snapshots carefully** - Allow pixel tolerance for CI variations
6. **Test on actual platforms** - Cross-platform matrix in CI

## Community References

- [Playwright MCP (Microsoft)](https://github.com/microsoft/playwright-mcp)
- [Playwright Skill](https://github.com/lackeyjb/playwright-skill)
- [BrowserStack MCP](https://github.com/browserstack/mcp-server)
- [Currents MCP](https://github.com/currents-dev/currents-mcp)

## Related Skills

- `electron-builder-config` - Build configuration
- `electron-mock-factory` - Mock Electron APIs
- `visual-regression-setup` - Visual testing setup
- `accessibility-test-runner` - Accessibility audits

## Related Agents

- `desktop-test-architect` - Testing strategy
- `ui-automation-specialist` - UI automation expertise
