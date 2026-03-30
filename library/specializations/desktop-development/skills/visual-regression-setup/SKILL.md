---
name: visual-regression-setup
description: Configure visual regression testing with Percy, Chromatic, or custom screenshot comparison
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [testing, visual-regression, screenshots, ui-testing, desktop]
---

# visual-regression-setup

Configure visual regression testing for desktop applications to catch unintended UI changes.

## Capabilities

- Configure Percy integration
- Set up Chromatic for Storybook
- Custom screenshot comparison
- Configure threshold settings
- Handle dynamic content masking
- Set up CI/CD integration

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "provider": { "enum": ["percy", "chromatic", "reg-suit", "custom"] },
    "framework": { "enum": ["playwright", "cypress", "puppeteer"] }
  },
  "required": ["projectPath"]
}
```

## Percy Integration

```javascript
// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    screenshot: 'only-on-failure'
  }
});

// test.spec.js
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test('visual test', async ({ page }) => {
  await page.goto('/');
  await percySnapshot(page, 'Home page');
});
```

## Custom Comparison

```javascript
const { toMatchImageSnapshot } = require('jest-image-snapshot');
expect.extend({ toMatchImageSnapshot });

test('matches screenshot', async () => {
  const screenshot = await page.screenshot();
  expect(screenshot).toMatchImageSnapshot({
    failureThreshold: 0.01,
    failureThresholdType: 'percent'
  });
});
```

## Related Skills

- `playwright-electron-config`
- `desktop-ui-testing` process
