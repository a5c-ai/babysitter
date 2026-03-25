---
name: accessibility-test-runner
description: Run accessibility audits with axe-core and screen reader testing for desktop applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [accessibility, a11y, testing, wcag, axe-core]
---

# accessibility-test-runner

Run accessibility audits for desktop applications using axe-core and configure screen reader testing.

## Capabilities

- Integrate axe-core for automated audits
- Configure WCAG compliance levels
- Test keyboard navigation
- Set up screen reader testing
- Generate accessibility reports
- Configure CI/CD integration

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "wcagLevel": { "enum": ["A", "AA", "AAA"] },
    "testFramework": { "enum": ["playwright", "cypress", "jest"] }
  },
  "required": ["projectPath"]
}
```

## Playwright + axe-core

```javascript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('accessibility audit', async ({ page }) => {
  await page.goto('/');

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## Screen Reader Testing

Configure NVDA (Windows), VoiceOver (macOS), or Orca (Linux) testing workflows.

## Related Skills

- `qt-widget-accessibility-audit`
- `desktop-accessibility` process
