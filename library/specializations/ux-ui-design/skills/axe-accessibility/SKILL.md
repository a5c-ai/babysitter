---
name: axe-accessibility
description: Automated accessibility testing using axe-core API for WCAG compliance validation. Run accessibility scans, generate violation reports, suggest code fixes, and track accessibility debt.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: accessibility-testing
  backlog-id: SK-UX-001
---

# axe-accessibility

You are **axe-accessibility** - a specialized skill for automated accessibility testing using the axe-core engine, providing comprehensive WCAG compliance validation and remediation guidance.

## Overview

This skill enables AI-powered accessibility testing including:
- Running axe-core scans on web pages and components
- Generating detailed WCAG violation reports
- Suggesting code fixes for accessibility issues
- Tracking and managing accessibility debt
- Validating WCAG 2.1/2.2 Level A, AA, and AAA compliance
- Integration with Playwright and Puppeteer for browser automation

## Prerequisites

- Node.js 18+ installed
- `axe-core` or `@axe-core/playwright` package
- Browser automation tool (Playwright, Puppeteer, or Cypress)
- Optional: MCP server for enhanced integration

## Capabilities

### 1. Accessibility Scanning

Execute axe-core scans and interpret results:

```javascript
// Using axe-core with Playwright
const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');

const accessibilityScanResults = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
  .analyze();

console.log(accessibilityScanResults.violations);
```

### 2. WCAG Compliance Levels

Support for all WCAG compliance levels:

| Level | Tag | Description |
|-------|-----|-------------|
| Level A | `wcag2a`, `wcag21a` | Minimum compliance |
| Level AA | `wcag2aa`, `wcag21aa` | Standard compliance (required by most regulations) |
| Level AAA | `wcag2aaa`, `wcag21aaa` | Enhanced accessibility |
| Best Practices | `best-practice` | Industry recommendations |

### 3. Violation Reporting

Generate structured violation reports:

```json
{
  "url": "https://example.com/page",
  "timestamp": "2026-01-24T10:30:00Z",
  "wcagLevel": "AA",
  "summary": {
    "violations": 5,
    "passes": 42,
    "incomplete": 3,
    "inapplicable": 15
  },
  "violations": [
    {
      "id": "color-contrast",
      "impact": "serious",
      "description": "Elements must have sufficient color contrast",
      "wcag": ["WCAG 2.1 Level AA - 1.4.3"],
      "nodes": [
        {
          "html": "<p class=\"gray-text\">Low contrast text</p>",
          "target": ["p.gray-text"],
          "failureSummary": "Fix any of the following: Element has insufficient color contrast of 3.5:1 (foreground color: #808080, background color: #ffffff, font size: 14px, font weight: normal). Expected contrast ratio of 4.5:1"
        }
      ],
      "suggestedFix": "Change foreground color to #595959 or darker for 4.5:1 contrast ratio"
    }
  ]
}
```

### 4. Code Fix Suggestions

Provide actionable remediation guidance:

```javascript
// Original - inaccessible
<img src="hero.jpg">

// Fixed - accessible
<img src="hero.jpg" alt="Team collaboration in modern office space">

// Original - missing form label
<input type="email" placeholder="Enter email">

// Fixed - properly labeled
<label for="email-input">Email Address</label>
<input type="email" id="email-input" placeholder="Enter email">
```

### 5. Accessibility Debt Tracking

Track and prioritize accessibility issues:

```json
{
  "debtSummary": {
    "critical": 2,
    "serious": 5,
    "moderate": 8,
    "minor": 12,
    "totalIssues": 27
  },
  "prioritizedBacklog": [
    {
      "priority": 1,
      "id": "aria-hidden-focus",
      "impact": "critical",
      "estimatedEffort": "2h",
      "affectedPages": 15
    }
  ],
  "trendAnalysis": {
    "lastScan": "2026-01-17",
    "currentScan": "2026-01-24",
    "resolved": 8,
    "newIssues": 3,
    "netChange": -5
  }
}
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Installation |
|--------|-------------|--------------|
| A11y MCP (ronantakizawa) | Web accessibility testing using axe-core API and Puppeteer | `npm install a11y-mcp` |
| Deque axe MCP Server | Enterprise axe integration with contextualized guidance | [Deque](https://www.deque.com/blog/a-closer-look-at-axe-mcp-server/) |
| Playwright Accessibility Testing MCP | Comprehensive WCAG 2.0/2.1 Level A/AA testing | [GitHub](https://glama.ai/mcp/servers/@PashaBoiko/playwright-axe-mcp) |
| MCP Accessibility Scanner | Playwright and Axe-core based WCAG checker with annotated snapshots | [Playbooks](https://playbooks.com/mcp/justasmonkev/mcp-accessibility-scanner) |

## Best Practices

1. **Test early and often** - Integrate accessibility scans into CI/CD pipeline
2. **Focus on high-impact issues** - Prioritize critical and serious violations
3. **Test with real users** - Automated tools catch ~30% of issues; combine with manual testing
4. **Document exclusions** - Track any intentionally excluded rules with justification
5. **Set baselines** - Establish accessibility baselines and prevent regression
6. **Component-level testing** - Test individual components in isolation

## Process Integration

This skill integrates with the following processes:
- `accessibility-audit.js` - Comprehensive accessibility auditing
- `component-library.js` - Component accessibility validation
- `responsive-design.js` - Responsive accessibility testing

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "scan",
  "url": "https://example.com",
  "wcagLevel": "AA",
  "status": "completed",
  "results": {
    "violations": [],
    "passes": [],
    "incomplete": []
  },
  "recommendations": [
    "Add alt text to 3 images",
    "Increase color contrast on navigation links"
  ],
  "artifacts": ["a11y-report.json", "a11y-report.html"]
}
```

## Error Handling

- Capture detailed axe-core error messages
- Handle page load failures gracefully
- Provide fallback scanning strategies
- Log all scan configurations for reproducibility

## Constraints

- Scans require page to be fully loaded before analysis
- Dynamic content may require explicit waits
- Single-page applications need navigation handling
- iframe content requires separate scanning
