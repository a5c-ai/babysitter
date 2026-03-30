# Lighthouse Skill

## Overview

The `lighthouse` skill provides comprehensive web auditing using Google Lighthouse. It measures Core Web Vitals, accessibility scores, SEO optimization, and best practices compliance, generating detailed reports and tracking performance budgets.

## Quick Start

### Prerequisites

1. **Node.js** - Version 18 or higher
2. **Chrome/Chromium** - For running audits
3. **lighthouse CLI** - Google Lighthouse package

### Installation

The skill is included in the babysitter-sdk. Install dependencies:

```bash
# Install Lighthouse CLI globally
npm install -g lighthouse

# Or as a project dependency
npm install lighthouse
```

To add MCP server integration:

```bash
# Install Lighthouse MCP server
npm install @danielsogl/lighthouse-mcp

# Add to Claude
claude mcp add lighthouse -- npx @danielsogl/lighthouse-mcp
```

## Usage

### Basic Operations

```bash
# Run full audit
/skill lighthouse audit --url https://example.com

# Audit specific categories
/skill lighthouse audit --url https://example.com --categories performance,accessibility

# Desktop audit
/skill lighthouse audit --url https://example.com --device desktop

# Generate HTML report
/skill lighthouse audit --url https://example.com --format html --output report.html

# Check against budget
/skill lighthouse budget --url https://example.com --budget budget.json
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(lighthouseTask, {
  url: 'https://example.com',
  device: 'mobile',
  categories: ['performance', 'accessibility'],
  budget: {
    resourceSizes: [
      { resourceType: 'script', budget: 300000 }
    ]
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Core Web Vitals** | LCP, INP/FID, CLS measurement |
| **Performance** | Speed Index, TTI, TBT analysis |
| **Accessibility** | WCAG compliance scoring |
| **SEO** | Search optimization analysis |
| **Best Practices** | Security and modern web standards |
| **PWA** | Progressive Web App auditing |

## Examples

### Example 1: Full Performance Audit

```bash
# Comprehensive mobile audit
/skill lighthouse audit \
  --url https://example.com \
  --device mobile \
  --categories performance \
  --throttling simulated3G \
  --runs 3 \
  --format json,html
```

Output summary:
```json
{
  "performance": 85,
  "metrics": {
    "FCP": "1.2s",
    "LCP": "2.1s",
    "TBT": "150ms",
    "CLS": "0.05"
  },
  "opportunities": [
    "Remove unused CSS (120 KiB potential savings)",
    "Serve images in next-gen formats (300 KiB)",
    "Eliminate render-blocking resources"
  ]
}
```

### Example 2: Accessibility Audit

```bash
# Accessibility-focused audit
/skill lighthouse audit \
  --url https://example.com \
  --categories accessibility \
  --output a11y-report.html
```

Output:
```json
{
  "accessibility": 92,
  "issues": [
    {
      "id": "image-alt",
      "impact": "critical",
      "count": 3,
      "description": "Images missing alt text"
    },
    {
      "id": "color-contrast",
      "impact": "serious",
      "count": 5,
      "description": "Insufficient color contrast"
    }
  ]
}
```

### Example 3: CI/CD Performance Budget

```yaml
# GitHub Actions workflow
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Lighthouse
        run: |
          /skill lighthouse budget \
            --url http://localhost:3000 \
            --budget lighthouse-budget.json \
            --fail-on-budget-error

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-report
          path: lighthouse-report.html
```

Budget file (`lighthouse-budget.json`):
```json
{
  "resourceSizes": [
    { "resourceType": "script", "budget": 300000 },
    { "resourceType": "stylesheet", "budget": 100000 },
    { "resourceType": "image", "budget": 500000 }
  ],
  "timings": [
    { "metric": "largest-contentful-paint", "budget": 2500 },
    { "metric": "cumulative-layout-shift", "budget": 0.1 }
  ]
}
```

### Example 4: Multiple Page Audit

```javascript
// Audit multiple pages
const pages = [
  'https://example.com/',
  'https://example.com/products',
  'https://example.com/checkout'
];

const results = await Promise.all(
  pages.map(url => ctx.task(lighthouseTask, {
    url,
    device: 'mobile',
    categories: ['performance', 'accessibility']
  }))
);

// Generate comparison report
const comparison = results.map(r => ({
  url: r.url,
  performance: r.scores.performance,
  accessibility: r.scores.accessibility,
  LCP: r.metrics.largestContentfulPaint
}));
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LIGHTHOUSE_CHROME_PATH` | Path to Chrome executable | Auto-detect |
| `LIGHTHOUSE_THROTTLING` | Throttling preset | `mobileSlow4G` |
| `LIGHTHOUSE_RUNS` | Number of audit runs | `1` |

### Skill Configuration

```yaml
# .babysitter/skills/lighthouse.yaml
lighthouse:
  defaultDevice: mobile
  defaultCategories:
    - performance
    - accessibility
    - best-practices
    - seo
  throttling: mobileSlow4G
  runs: 3
  outputFormats:
    - json
    - html
  budget:
    enabled: true
    failOnBudgetError: false
  mcpServer:
    enabled: true
    provider: danielsogl
```

## Process Integration

### Processes Using This Skill

1. **responsive-design.js** - Responsive performance testing
2. **accessibility-audit.js** - Accessibility scoring
3. **component-library.js** - Component performance impact

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const performanceAuditTask = defineTask({
  name: 'performance-audit',
  description: 'Run Lighthouse performance audit',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Performance Audit: ${inputs.url}`,
      skill: {
        name: 'lighthouse',
        context: {
          url: inputs.url,
          device: inputs.device || 'mobile',
          categories: ['performance'],
          budget: inputs.budget,
          runs: 3
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

### Lighthouse MCP Server (danielsogl)

Comprehensive Lighthouse integration with 13+ tools.

**Features:**
- Full Lighthouse audits
- Performance budgets
- Trend tracking
- Multiple formats

**Installation:**
```bash
npm install @danielsogl/lighthouse-mcp
claude mcp add lighthouse -- npx @danielsogl/lighthouse-mcp
```

**GitHub:** https://github.com/danielsogl/lighthouse-mcp-server

## Core Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | <= 2.5s | 2.5s - 4s | > 4s |
| INP | <= 200ms | 200ms - 500ms | > 500ms |
| CLS | <= 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP | <= 1.8s | 1.8s - 3s | > 3s |
| TTFB | <= 0.8s | 0.8s - 1.8s | > 1.8s |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Chrome not found` | Set `LIGHTHOUSE_CHROME_PATH` |
| `Page load timeout` | Increase timeout or check URL |
| `Protocol error` | Update Chrome and Lighthouse |
| `Inconsistent scores` | Run multiple times and average |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
LIGHTHOUSE_DEBUG=true /skill lighthouse audit --url https://example.com
```

## Related Skills

- **axe-accessibility** - Detailed accessibility testing
- **screenshot-comparison** - Visual regression testing
- **responsive-design-validator** - Cross-device testing

## References

- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Performance Budgets](https://web.dev/performance-budgets-101/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-UX-004
**Category:** Performance Auditing
**Status:** Active
