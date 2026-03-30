---
name: axe-accessibility
description: Deep integration with axe-core for automated accessibility testing. Execute accessibility scans, interpret WCAG violations, generate compliance reports, and integrate with Playwright/Cypress for comprehensive a11y testing.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: accessibility-testing
  backlog-id: SK-011
---

# axe-accessibility

You are **axe-accessibility** - a specialized skill for axe-core accessibility testing integration, providing comprehensive WCAG compliance validation capabilities.

## Overview

This skill enables AI-powered accessibility testing including:
- Executing axe-core accessibility scans
- Interpreting WCAG violations and impacts
- Generating accessibility compliance reports
- Configuring rule inclusion/exclusion
- Integrating with Playwright/Cypress for automated a11y testing
- Handling dynamic content scanning
- Mapping violations to WCAG criteria
- Providing remediation guidance

## Prerequisites

- Node.js environment for axe-core
- Test automation framework (Playwright, Cypress, or Selenium)
- Browser automation capability
- Optional: axe-playwright or axe-cypress packages

## Capabilities

### 1. Playwright Integration

Use axe-core with Playwright for accessibility testing:

```javascript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('homepage should have no violations', async ({ page }) => {
    await page.goto('https://example.com');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('homepage should have no critical violations', async ({ page }) => {
    await page.goto('https://example.com');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations
      .filter(v => v.impact === 'critical' || v.impact === 'serious');

    expect(criticalViolations).toEqual([]);
  });

  test('form page accessibility', async ({ page }) => {
    await page.goto('https://example.com/contact');

    // Wait for form to be fully loaded
    await page.waitForSelector('form');

    const results = await new AxeBuilder({ page })
      .include('form')
      .analyze();

    // Log violations for debugging
    if (results.violations.length > 0) {
      console.log('Violations found:', JSON.stringify(results.violations, null, 2));
    }

    expect(results.violations).toEqual([]);
  });
});
```

### 2. Cypress Integration

Use axe-core with Cypress:

```javascript
// cypress/support/commands.js
import 'cypress-axe';

// cypress/e2e/accessibility.cy.js
describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('has no detectable accessibility violations on load', () => {
    cy.checkA11y();
  });

  it('has no violations in main content', () => {
    cy.checkA11y('#main-content');
  });

  it('has no critical violations', () => {
    cy.checkA11y(null, {
      includedImpacts: ['critical', 'serious']
    });
  });

  it('logs violations for review', () => {
    cy.checkA11y(null, null, (violations) => {
      violations.forEach((violation) => {
        cy.log(`${violation.id}: ${violation.description}`);
        violation.nodes.forEach((node) => {
          cy.log(`  - ${node.target}`);
        });
      });
    }, true);
  });
});
```

### 3. Standalone axe-core Usage

Direct axe-core usage:

```javascript
import { chromium } from 'playwright';
import axe from 'axe-core';

async function runAccessibilityAudit(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Inject axe-core
  await page.addScriptTag({ path: require.resolve('axe-core') });

  // Run analysis
  const results = await page.evaluate(async () => {
    return await axe.run();
  });

  await browser.close();
  return results;
}

// Usage
const results = await runAccessibilityAudit('https://example.com');
console.log(`Found ${results.violations.length} violations`);
```

### 4. WCAG Compliance Configuration

Configure axe for specific WCAG standards:

```javascript
import AxeBuilder from '@axe-core/playwright';

// WCAG 2.1 Level AA compliance
const wcag21AAResults = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();

// WCAG 2.2 Level AA compliance
const wcag22AAResults = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
  .analyze();

// Section 508 compliance
const section508Results = await new AxeBuilder({ page })
  .withTags(['section508'])
  .analyze();

// Best practices (not strict compliance)
const bestPracticesResults = await new AxeBuilder({ page })
  .withTags(['best-practice'])
  .analyze();
```

### 5. Rule Configuration

Include/exclude specific rules:

```javascript
import AxeBuilder from '@axe-core/playwright';

const results = await new AxeBuilder({ page })
  // Include only specific rules
  .withRules(['color-contrast', 'image-alt', 'label', 'link-name'])
  .analyze();

// Or exclude rules
const resultsExcluding = await new AxeBuilder({ page })
  .disableRules(['region', 'landmark-one-main'])
  .analyze();

// Focus on specific element
const formResults = await new AxeBuilder({ page })
  .include('#contact-form')
  .analyze();

// Exclude problematic areas
const mainResults = await new AxeBuilder({ page })
  .exclude('#third-party-widget')
  .analyze();
```

### 6. Violation Analysis

Analyze and categorize violations:

```javascript
function analyzeViolations(results) {
  const summary = {
    total: results.violations.length,
    byImpact: {},
    byWCAG: {},
    criticalIssues: []
  };

  for (const violation of results.violations) {
    // Count by impact
    summary.byImpact[violation.impact] =
      (summary.byImpact[violation.impact] || 0) + violation.nodes.length;

    // Count by WCAG criteria
    for (const tag of violation.tags) {
      if (tag.startsWith('wcag')) {
        summary.byWCAG[tag] = (summary.byWCAG[tag] || 0) + 1;
      }
    }

    // Collect critical issues
    if (violation.impact === 'critical' || violation.impact === 'serious') {
      summary.criticalIssues.push({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        affectedElements: violation.nodes.length
      });
    }
  }

  return summary;
}
```

### 7. Report Generation

Generate accessibility reports:

```javascript
function generateA11yReport(results, format = 'html') {
  const report = {
    timestamp: new Date().toISOString(),
    url: results.url,
    summary: {
      violations: results.violations.length,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      inapplicable: results.inapplicable.length
    },
    violations: results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      wcagCriteria: v.tags.filter(t => t.startsWith('wcag')),
      nodes: v.nodes.map(n => ({
        target: n.target,
        html: n.html,
        failureSummary: n.failureSummary
      }))
    }))
  };

  if (format === 'html') {
    return generateHtmlReport(report);
  }

  return JSON.stringify(report, null, 2);
}

function generateHtmlReport(report) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accessibility Report</title>
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .violation { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 4px; }
    .critical { border-left: 4px solid #d32f2f; }
    .serious { border-left: 4px solid #f57c00; }
    .moderate { border-left: 4px solid #fbc02d; }
    .minor { border-left: 4px solid #388e3c; }
    .impact { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    h1 { color: #333; }
    pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Accessibility Report</h1>
  <p>URL: ${report.url}</p>
  <p>Generated: ${report.timestamp}</p>

  <h2>Summary</h2>
  <ul>
    <li>Violations: ${report.summary.violations}</li>
    <li>Passes: ${report.summary.passes}</li>
    <li>Incomplete: ${report.summary.incomplete}</li>
  </ul>

  <h2>Violations (${report.violations.length})</h2>
  ${report.violations.map(v => `
    <div class="violation ${v.impact}">
      <h3>${v.id} <span class="impact">${v.impact}</span></h3>
      <p>${v.description}</p>
      <p><strong>How to fix:</strong> ${v.help}</p>
      <p><a href="${v.helpUrl}" target="_blank">Learn more</a></p>
      <p><strong>WCAG:</strong> ${v.wcagCriteria.join(', ')}</p>
      <p><strong>Affected elements (${v.nodes.length}):</strong></p>
      ${v.nodes.map(n => `
        <pre>${n.target.join(' > ')}</pre>
        <p>${n.failureSummary}</p>
      `).join('')}
    </div>
  `).join('')}
</body>
</html>
  `;
}
```

### 8. CI/CD Integration

Integrate accessibility testing into pipelines:

```yaml
# GitHub Actions
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run accessibility tests
        run: npm run test:a11y

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: accessibility-report
          path: accessibility-report.html
```

## WCAG Criteria Reference

| Impact | Examples | Priority |
|--------|----------|----------|
| **Critical** | Missing alt text, missing form labels | P1 - Fix immediately |
| **Serious** | Low color contrast, missing ARIA | P2 - Fix before release |
| **Moderate** | Skip link issues, heading order | P3 - Fix soon |
| **Minor** | Redundant ARIA, best practices | P4 - Backlog |

## Common Violations

| Rule ID | Issue | Fix |
|---------|-------|-----|
| `color-contrast` | Insufficient color contrast | Adjust foreground/background colors |
| `image-alt` | Missing image alt text | Add descriptive alt attribute |
| `label` | Form inputs without labels | Add associated label elements |
| `link-name` | Links without accessible names | Add link text or aria-label |
| `button-name` | Buttons without accessible names | Add button text or aria-label |
| `html-has-lang` | Missing lang attribute | Add lang to html element |
| `region` | Content not in landmark | Use semantic elements or ARIA |

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Installation |
|--------|-------------|--------------|
| ronantakizawa/a11ymcp | Verified A11y MCP Server | [GitHub](https://github.com/ronantakizawa/a11ymcp) |
| priyankark/a11y-mcp | axe-core MCP integration | [GitHub](https://github.com/priyankark/a11y-mcp) |
| PashaBoiko/playwright-axe-mcp | Playwright Accessibility MCP | [Glama](https://glama.ai/mcp/servers/@PashaBoiko/playwright-axe-mcp) |
| mcp-accessibility-scanner | Playwright + Axe-core scanner | [Playbooks](https://playbooks.com/mcp/justasmonkev/mcp-accessibility-scanner) |

## Best Practices

1. **Test early** - Include a11y tests in development workflow
2. **Automate continuously** - Run a11y tests in CI/CD
3. **Focus on impact** - Prioritize critical and serious issues
4. **Manual verification** - Complement automated tests with manual review
5. **Screen reader testing** - Test with actual assistive technology
6. **Keyboard navigation** - Verify full keyboard accessibility
7. **Document exceptions** - Track and justify any rule exclusions

## Process Integration

This skill integrates with the following processes:
- `accessibility-testing.js` - All phases of a11y testing
- `e2e-test-suite.js` - A11y integration in E2E tests
- `quality-gates.js` - A11y compliance gates
- `continuous-testing.js` - CI/CD a11y integration

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "scan",
  "url": "https://example.com",
  "wcagLevel": "AA",
  "status": "completed",
  "summary": {
    "violations": 5,
    "passes": 42,
    "incomplete": 2,
    "inapplicable": 15
  },
  "criticalIssues": [
    {
      "id": "color-contrast",
      "impact": "serious",
      "count": 3,
      "wcag": "wcag143"
    }
  ],
  "reportPath": "./accessibility-report.html",
  "compliance": {
    "wcag2a": true,
    "wcag2aa": false,
    "section508": true
  }
}
```

## Error Handling

- Handle page load failures gracefully
- Timeout handling for slow pages
- Retry logic for dynamic content
- Fallback for unsupported elements
- Clear error messages for configuration issues

## Constraints

- Automated tests cannot catch all accessibility issues
- Manual testing with assistive technology is essential
- Some issues require human judgment
- Document false positive handling
- Consider user testing for complete validation
