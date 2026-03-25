# axe-core Accessibility Skill

## Overview

The `axe-accessibility` skill provides deep integration with axe-core for automated accessibility testing. It enables AI-powered WCAG compliance validation including violation detection, impact analysis, compliance reporting, and integration with Playwright/Cypress test frameworks.

## Quick Start

### Prerequisites

1. **Node.js** - v18 or later
2. **Test Framework** - Playwright, Cypress, or similar
3. **axe-core packages** - Framework-specific axe integration

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

Install axe packages:

```bash
# For Playwright
npm install @axe-core/playwright

# For Cypress
npm install cypress-axe

# Standalone
npm install axe-core
```

## Usage

### Basic Operations

```bash
# Run accessibility scan
/skill axe-accessibility scan --url https://example.com

# Scan with WCAG level
/skill axe-accessibility scan --url https://example.com --level AA

# Generate compliance report
/skill axe-accessibility report --url https://example.com --format html

# Check specific element
/skill axe-accessibility scan --url https://example.com --selector "#main-content"
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(axeAccessibilityTask, {
  operation: 'scan',
  url: 'https://example.com',
  wcagLevel: 'AA',
  reportFormat: 'html'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **WCAG Scanning** | Test against WCAG 2.0, 2.1, 2.2 criteria |
| **Impact Analysis** | Categorize violations by severity |
| **Playwright Integration** | Seamless integration with Playwright tests |
| **Cypress Integration** | cy.checkA11y() commands |
| **Compliance Reports** | HTML, JSON, CSV reports |
| **Rule Configuration** | Include/exclude specific rules |
| **Element Targeting** | Test specific page sections |

## Examples

### Example 1: Playwright Test

```javascript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('page has no accessibility violations', async ({ page }) => {
  await page.goto('https://example.com');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### Example 2: Cypress Test

```javascript
describe('Accessibility', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('has no critical violations', () => {
    cy.checkA11y(null, {
      includedImpacts: ['critical', 'serious']
    });
  });
});
```

### Example 3: CI Pipeline

```yaml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:a11y
      - uses: actions/upload-artifact@v4
        with:
          name: a11y-report
          path: accessibility-report.html
```

### Example 4: Generate Report

```bash
# Generate HTML accessibility report
/skill axe-accessibility report \
  --url https://example.com \
  --pages "/" "/about" "/contact" \
  --format html \
  --output a11y-report.html
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AXE_WCAG_LEVEL` | Default WCAG level (A, AA, AAA) | `AA` |
| `AXE_FAIL_ON_VIOLATIONS` | Fail tests on violations | `true` |
| `AXE_REPORT_DIR` | Report output directory | `./a11y-reports` |

### Skill Configuration

```yaml
# .babysitter/skills/axe-accessibility.yaml
axe-accessibility:
  wcagLevel: AA
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
  failOnImpacts: ['critical', 'serious']
  reportFormat: html
  excludeRules:
    - region  # If single-page app
  timeout: 30000
```

## WCAG Level Reference

| Level | Coverage | Use Case |
|-------|----------|----------|
| **A** | Basic accessibility | Minimum compliance |
| **AA** | Standard compliance | Most regulations (ADA, Section 508) |
| **AAA** | Enhanced accessibility | Maximum accessibility |

## Impact Levels

| Impact | Priority | Examples |
|--------|----------|----------|
| **Critical** | P1 | Missing form labels, no alt text |
| **Serious** | P2 | Low color contrast, missing landmarks |
| **Moderate** | P3 | Heading order, skip links |
| **Minor** | P4 | Best practices, redundant ARIA |

## Process Integration

### Processes Using This Skill

1. **accessibility-testing.js** - All phases of a11y testing
2. **e2e-test-suite.js** - A11y integration in E2E tests
3. **quality-gates.js** - A11y compliance gates
4. **continuous-testing.js** - CI/CD a11y integration

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const accessibilityScanTask = defineTask({
  name: 'accessibility-scan',
  description: 'Run axe-core accessibility scan',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `A11y Scan: ${inputs.url}`,
      skill: {
        name: 'axe-accessibility',
        context: {
          operation: 'scan',
          url: inputs.url,
          wcagLevel: inputs.wcagLevel || 'AA',
          reportFormat: 'html',
          failOnViolations: inputs.failOnViolations ?? true
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Reference

### ronantakizawa/a11ymcp

Verified MCP Server for Web Accessibility Testing (~5000+ downloads).

**Features:**
- Full axe-core integration
- Multiple page scanning
- Detailed violation reports

**GitHub:** https://github.com/ronantakizawa/a11ymcp

### priyankark/a11y-mcp

MCP server for accessibility audits using axe-core.

**Features:**
- Programmatic accessibility testing
- Custom rule configuration
- JSON/HTML reports

**GitHub:** https://github.com/priyankark/a11y-mcp

## Common Violations Quick Reference

| Rule | Issue | Quick Fix |
|------|-------|-----------|
| `color-contrast` | Low contrast | Increase contrast ratio to 4.5:1 |
| `image-alt` | Missing alt | Add `alt=""` or descriptive text |
| `label` | No form label | Add `<label for="">` |
| `link-name` | Empty link | Add link text or `aria-label` |
| `button-name` | Empty button | Add button text or `aria-label` |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Page timeout` | Increase timeout, check page load |
| `No violations found` | Verify axe injection, check selectors |
| `False positives` | Exclude rule or element, document |
| `Dynamic content missed` | Wait for content, use MutationObserver |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
DEBUG=axe /skill axe-accessibility scan --url https://example.com
```

## Related Skills

- **playwright-e2e** - E2E testing with accessibility
- **cypress-e2e** - Cypress accessibility integration
- **quality-gates** - Accessibility quality gates

## References

- [axe-core Documentation](https://www.deque.com/axe/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [cypress-axe](https://github.com/component-driven/cypress-axe)
- [ronantakizawa/a11ymcp](https://github.com/ronantakizawa/a11ymcp)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-011
**Category:** Accessibility Testing
**Status:** Active
