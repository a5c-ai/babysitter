# playwright-electron-config

Configure Playwright for comprehensive Electron application testing.

## Overview

This skill sets up the complete Playwright testing infrastructure for Electron applications, including E2E tests, visual regression testing, accessibility audits, IPC testing, and cross-platform CI integration.

## Quick Start

### Basic Setup

```javascript
const result = await invokeSkill('playwright-electron-config', {
  projectPath: '/path/to/electron-app',
  testDir: 'tests/e2e',
  features: ['visualRegression', 'accessibility', 'ipcTesting']
});
```

### Full Configuration with CI

```javascript
const result = await invokeSkill('playwright-electron-config', {
  projectPath: '/path/to/electron-app',
  features: [
    'visualRegression',
    'accessibility',
    'coverage',
    'ipcTesting',
    'multiWindow',
    'systemDialogMocks'
  ],
  platforms: ['windows', 'macos', 'linux'],
  pageObjects: [
    {
      name: 'MainWindow',
      selectors: {
        titleBar: '[data-testid="title-bar"]',
        sidebar: '[data-testid="sidebar"]',
        mainContent: '[data-testid="main-content"]'
      }
    },
    {
      name: 'SettingsDialog',
      selectors: {
        dialog: '[data-testid="settings-dialog"]',
        saveButton: '[data-testid="save-settings"]'
      }
    }
  ],
  ciIntegration: {
    provider: 'github-actions',
    parallelization: true,
    sharding: 4
  }
});
```

## Features

### Testing Capabilities

| Feature | Description |
|---------|-------------|
| E2E Testing | Full application flow testing |
| Visual Regression | Screenshot comparison testing |
| Accessibility | WCAG compliance with axe-core |
| IPC Testing | Main/renderer communication testing |
| Multi-Window | Testing multiple windows |
| Dialog Mocks | Mock system dialogs |
| Coverage | Code coverage reports |

### Platform Support

- Windows (x64, arm64)
- macOS (Intel, Apple Silicon)
- Linux (x64)

## Generated Files

```
tests/e2e/
  playwright.config.ts        # Configuration
  fixtures/
    electron-app.ts           # App fixture
    test-utils.ts             # Utilities
  page-objects/
    MainWindow.ts             # Page objects
  specs/
    app.spec.ts               # App tests
    ipc.spec.ts               # IPC tests
    visual.spec.ts            # Visual tests
    a11y.spec.ts              # Accessibility
  mocks/
    electron-api-mocks.ts     # API mocks
```

## Usage

### Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/specs/app.spec.ts

# Run with UI mode
npx playwright test --ui

# Update visual snapshots
npx playwright test --update-snapshots

# Generate report
npx playwright show-report
```

### Writing Tests

```typescript
import { test, expect } from '../fixtures/electron-app';
import { MainWindow } from '../page-objects/MainWindow';

test.describe('Application', () => {
  test('should display main window', async ({ mainWindow }) => {
    const page = new MainWindow(mainWindow);

    await expect(page.titleBar).toBeVisible();
    await expect(await page.getTitle()).toBe('My Application');
  });

  test('should navigate between sections', async ({ mainWindow }) => {
    const page = new MainWindow(mainWindow);

    await page.navigateTo('settings');
    await expect(mainWindow).toHaveURL(/settings/);
  });
});
```

### Testing IPC

```typescript
test('should handle IPC invoke', async ({ electronApp, mainWindow }) => {
  // Mock main process response
  await electronApp.evaluate(async ({ ipcMain }) => {
    ipcMain.handle('test-invoke', () => ({ success: true }));
  });

  // Call from renderer
  const result = await mainWindow.evaluate(async () => {
    return window.electronAPI.invoke('test-invoke');
  });

  expect(result).toEqual({ success: true });
});
```

### Visual Regression

```typescript
test('matches visual snapshot', async ({ mainWindow }) => {
  // Allow small differences for CI environments
  await expect(mainWindow).toHaveScreenshot('main-window.png', {
    maxDiffPixels: 100,
    threshold: 0.2,
  });
});
```

### Accessibility Testing

```typescript
import AxeBuilder from '@axe-core/playwright';

test('has no accessibility violations', async ({ mainWindow }) => {
  const results = await new AxeBuilder({ page: mainWindow })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

## Mocking Electron APIs

### Dialog Mocks

```typescript
import { mockDialog } from '../mocks/electron-api-mocks';

test('should handle file open dialog', async ({ electronApp, mainWindow }) => {
  await mockDialog(electronApp, {
    filePaths: ['/path/to/file.txt'],
    canceled: false
  });

  await mainWindow.click('[data-testid="open-file"]');
  // Dialog will return mocked response
});
```

### Clipboard Mocks

```typescript
import { mockClipboard } from '../mocks/electron-api-mocks';

test('should paste from clipboard', async ({ electronApp, mainWindow }) => {
  await mockClipboard(electronApp, 'Hello, World!');

  await mainWindow.click('[data-testid="paste-button"]');

  const content = await mainWindow.locator('[data-testid="editor"]').textContent();
  expect(content).toContain('Hello, World!');
});
```

## CI/CD Integration

### GitHub Actions

The skill generates a workflow that:
- Runs tests on Windows, macOS, and Linux
- Shards tests for parallel execution
- Uploads test reports and snapshots
- Merges reports from all platforms

### Environment Variables

```bash
# For GitHub Actions
CI=true

# For local development
DEBUG=pw:api

# Headless mode
PLAYWRIGHT_HEADLESS=true
```

## Configuration Options

### playwright.config.ts

```typescript
export default defineConfig({
  // Test timeout
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },

  // Retries
  retries: process.env.CI ? 2 : 0,

  // Workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html'],
    ['json', { outputFile: 'results.json' }],
    ['junit', { outputFile: 'junit.xml' }],
  ],
});
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| App not launching | Wrong main path | Check `args` in fixture |
| Window not found | App not ready | Add `waitForLoadState` |
| IPC not working | Context isolation | Use `electronAPI` bridge |
| Snapshots differ | Platform differences | Increase `maxDiffPixels` |
| Tests hang | Modal blocking | Mock dialogs |

## Best Practices

1. **Use Page Objects** - Encapsulate selectors and actions
2. **Add data-testid** - Stable selectors in your app
3. **Mock External APIs** - Dialogs, network, clipboard
4. **Isolate Tests** - Fresh app instance when needed
5. **Visual Thresholds** - Allow for platform differences
6. **Parallel Execution** - Use sharding for speed

## References

- [Playwright Electron Documentation](https://playwright.dev/docs/api/class-electron)
- [Electron Testing Best Practices](https://www.electronjs.org/docs/latest/tutorial/testing)
- [@axe-core/playwright](https://www.npmjs.com/package/@axe-core/playwright)

## Related Skills

- `electron-mock-factory`
- `visual-regression-setup`
- `accessibility-test-runner`
- `cross-platform-test-matrix`

## Version History

- **1.0.0** - Initial release with E2E and IPC testing
- **1.1.0** - Added visual regression support
- **1.2.0** - Added accessibility testing with axe-core
- **1.3.0** - Added CI workflow generation
