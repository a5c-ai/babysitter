# desktop-test-architect

Expert agent for designing comprehensive testing strategies for desktop applications.

## Overview

The desktop-test-architect agent specializes in testing strategy design and implementation for desktop applications. It provides guidance on E2E testing, visual regression, accessibility compliance, performance testing, and cross-platform test automation.

## Quick Start

### Design Test Strategy

```javascript
const result = await invokeAgent('desktop-test-architect', {
  task: 'Design a comprehensive testing strategy',
  context: {
    framework: 'electron',
    platforms: ['windows', 'macos', 'linux'],
    uiFramework: 'react',
    testingGoals: ['high-coverage', 'visual-regression', 'accessibility']
  }
});
```

### Implement E2E Tests

```javascript
const result = await invokeAgent('desktop-test-architect', {
  task: 'Set up E2E testing with Playwright',
  context: {
    framework: 'electron',
    existingTests: false,
    testingGoals: ['critical-paths', 'cross-platform']
  }
});
```

## Expertise Areas

### Test Strategy

- Test pyramid design
- Coverage goals
- Risk-based testing
- Test data management

### E2E Testing

- Playwright for Electron
- Page object models
- Cross-platform execution
- Parallel test running

### Visual Testing

- Screenshot comparison
- Platform-specific baselines
- Theme testing
- Responsive layouts

### Accessibility

- WCAG compliance
- Screen reader testing
- Keyboard navigation
- Color contrast

### Performance

- Startup benchmarks
- Memory profiling
- IPC latency
- Render performance

## Test Pyramid

```
          ┌────────┐
          │  E2E   │  10%
          │        │  Critical user flows
          ├────────┴─────┐
          │ Integration  │  30%
          │              │  IPC, services, APIs
          ├──────────────┴─────┐
          │    Unit Tests      │  60%
          │                    │  Components, logic
          └────────────────────┘
```

## Common Tasks

### Create Test Suite

```javascript
const result = await invokeAgent('desktop-test-architect', {
  task: 'Create test suite for file management feature',
  context: {
    feature: {
      name: 'File Manager',
      operations: ['create', 'read', 'update', 'delete'],
      dialogs: ['open', 'save', 'saveAs']
    }
  }
});
```

### Setup Visual Testing

```javascript
const result = await invokeAgent('desktop-test-architect', {
  task: 'Configure visual regression testing',
  context: {
    platforms: ['windows', 'macos', 'linux'],
    themes: ['light', 'dark'],
    ciIntegration: 'github-actions'
  }
});
```

### Accessibility Audit

```javascript
const result = await invokeAgent('desktop-test-architect', {
  task: 'Design accessibility test suite',
  context: {
    compliance: 'WCAG 2.1 AA',
    features: ['keyboard-navigation', 'screen-reader', 'color-contrast']
  }
});
```

## Test Structure

```
tests/
  unit/
    main/               # Main process
    renderer/           # Renderer logic
    components/         # UI components
  integration/
    ipc/                # IPC handlers
    services/           # Service tests
  e2e/
    fixtures/           # Test fixtures
    page-objects/       # Page models
    specs/              # Test specs
    snapshots/          # Baselines
  a11y/                 # Accessibility
  performance/          # Performance
```

## Coverage Goals

| Layer | Target | Critical |
|-------|--------|----------|
| Main Process | 80% | 90% |
| Renderer | 75% | 85% |
| Components | 70% | 80% |
| Integration | 60% | 70% |
| E2E | Critical paths | All flows |

## E2E Test Example

```typescript
import { test, expect } from '../fixtures/electron-app';
import { MainWindow } from '../page-objects/MainWindow';

test.describe('File Operations', () => {
  test('should open file', async ({ mainWindow }) => {
    const window = new MainWindow(mainWindow);

    // Open file dialog
    await window.openFile('/path/to/test.txt');

    // Verify content loaded
    await expect(window.editor).toContainText('Hello, World!');
  });

  test('should save file', async ({ mainWindow }) => {
    const window = new MainWindow(mainWindow);

    await window.editor.fill('New content');
    await window.save();

    await expect(window.saveIndicator).toHaveText('Saved');
  });
});
```

## Visual Test Example

```typescript
test('matches visual baseline', async ({ mainWindow }) => {
  await expect(mainWindow).toHaveScreenshot('main-window.png', {
    maxDiffPixels: 100,
    threshold: 0.2
  });
});

test('dark mode matches baseline', async ({ mainWindow }) => {
  await mainWindow.evaluate(() => {
    window.electronAPI.invoke('set-theme', 'dark');
  });

  await expect(mainWindow).toHaveScreenshot('main-window-dark.png');
});
```

## Accessibility Test Example

```typescript
import AxeBuilder from '@axe-core/playwright';

test('passes WCAG 2.1 AA', async ({ mainWindow }) => {
  const results = await new AxeBuilder({ page: mainWindow })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('keyboard navigable', async ({ mainWindow }) => {
  await mainWindow.keyboard.press('Tab');
  const focused = mainWindow.locator(':focus');
  await expect(focused).toBeVisible();
});
```

## Performance Test Example

```typescript
test('startup under 3 seconds', async () => {
  const start = Date.now();

  const app = await electron.launch({
    args: ['./dist/main/main.js']
  });

  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  expect(Date.now() - start).toBeLessThan(3000);
  await app.close();
});

test('memory under 200MB idle', async ({ electronApp }) => {
  await new Promise(r => setTimeout(r, 5000));

  const metrics = await electronApp.evaluate(() => {
    return process.memoryUsage();
  });

  expect(metrics.heapUsed / 1024 / 1024).toBeLessThan(200);
});
```

## CI Integration

### Test Matrix

```yaml
jobs:
  e2e:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    runs-on: ${{ matrix.os }}
    steps:
      - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

### Parallel Execution

- Shard tests across multiple runners
- Run platform builds concurrently
- Parallelize visual comparisons
- Distribute load by test duration

## Tool Recommendations

| Type | Tools |
|------|-------|
| Unit | Jest, Vitest |
| E2E | Playwright |
| Visual | Playwright, Percy |
| A11y | axe-core, Playwright |
| Performance | Custom, Playwright |

## Best Practices

### Test Design

1. Test behavior, not implementation
2. Use descriptive test names
3. Keep tests independent
4. Mock external dependencies
5. Use page objects

### Cross-Platform

1. Test on all targets
2. Handle platform differences
3. Use agnostic selectors
4. Account for timing
5. Manage separate baselines

### Maintenance

1. Remove flaky tests
2. Review coverage regularly
3. Update baselines intentionally
4. Document patterns
5. Keep tests fast

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Flaky tests | Timing issues | Add proper waits |
| Visual diff | Platform changes | Update baseline |
| A11y failures | Missing ARIA | Add accessibility attributes |
| Slow tests | No parallelization | Enable sharding |
| Missing coverage | Untested paths | Add integration tests |

## References

- [Playwright Electron](https://playwright.dev/docs/api/class-electron)
- [axe-core](https://www.deque.com/axe/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Related Skills

- `playwright-electron-config`
- `electron-mock-factory`
- `visual-regression-setup`
- `accessibility-test-runner`

## Related Agents

- `electron-architect`
- `desktop-ci-architect`
- `ui-automation-specialist`
- `accessibility-compliance-auditor`

## Version History

- **1.0.0** - Initial release with E2E testing
- **1.1.0** - Added visual regression
- **1.2.0** - Added accessibility testing
- **1.3.0** - Added performance testing
