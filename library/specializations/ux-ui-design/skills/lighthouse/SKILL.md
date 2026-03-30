---
name: lighthouse
description: Performance and accessibility auditing using Google Lighthouse. Measure Core Web Vitals, accessibility scores, SEO, and best practices. Generate reports and track performance budgets.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: performance-auditing
  backlog-id: SK-UX-004
---

# lighthouse

You are **lighthouse** - a specialized skill for comprehensive web auditing using Google Lighthouse, providing performance, accessibility, SEO, and best practices analysis.

## Overview

This skill enables AI-powered web auditing including:
- Core Web Vitals measurement (LCP, FID/INP, CLS)
- Accessibility scoring and WCAG compliance
- SEO analysis and recommendations
- Best practices validation
- Performance budget tracking
- PWA (Progressive Web App) auditing

## Prerequisites

- Node.js 18+ installed
- Google Chrome or Chromium browser
- `lighthouse` CLI or npm package
- Optional: MCP server for enhanced integration

## Capabilities

### 1. Core Web Vitals Measurement

Measure and analyze Core Web Vitals:

```json
{
  "coreWebVitals": {
    "LCP": {
      "value": 2.1,
      "unit": "s",
      "rating": "good",
      "threshold": { "good": 2.5, "poor": 4.0 },
      "description": "Largest Contentful Paint"
    },
    "INP": {
      "value": 150,
      "unit": "ms",
      "rating": "good",
      "threshold": { "good": 200, "poor": 500 },
      "description": "Interaction to Next Paint"
    },
    "CLS": {
      "value": 0.05,
      "unit": "",
      "rating": "good",
      "threshold": { "good": 0.1, "poor": 0.25 },
      "description": "Cumulative Layout Shift"
    },
    "FCP": {
      "value": 1.2,
      "unit": "s",
      "rating": "good",
      "description": "First Contentful Paint"
    },
    "TTFB": {
      "value": 0.3,
      "unit": "s",
      "rating": "good",
      "description": "Time to First Byte"
    }
  }
}
```

### 2. Category Scores

Generate scores across all Lighthouse categories:

```json
{
  "scores": {
    "performance": {
      "score": 92,
      "displayValue": "92",
      "color": "green"
    },
    "accessibility": {
      "score": 98,
      "displayValue": "98",
      "color": "green"
    },
    "bestPractices": {
      "score": 95,
      "displayValue": "95",
      "color": "green"
    },
    "seo": {
      "score": 100,
      "displayValue": "100",
      "color": "green"
    },
    "pwa": {
      "score": 85,
      "displayValue": "85",
      "color": "orange"
    }
  }
}
```

### 3. Performance Analysis

Detailed performance breakdown:

```json
{
  "performanceMetrics": {
    "firstContentfulPaint": 1200,
    "largestContentfulPaint": 2100,
    "totalBlockingTime": 150,
    "cumulativeLayoutShift": 0.05,
    "speedIndex": 1800,
    "timeToInteractive": 2500
  },
  "opportunities": [
    {
      "id": "unused-css-rules",
      "title": "Remove unused CSS",
      "description": "Remove dead rules from stylesheets",
      "savings": "120 KiB",
      "estimatedSavings": 800
    },
    {
      "id": "render-blocking-resources",
      "title": "Eliminate render-blocking resources",
      "resources": [
        { "url": "/styles/main.css", "transferSize": 45000 }
      ],
      "estimatedSavings": 500
    }
  ],
  "diagnostics": [
    {
      "id": "dom-size",
      "title": "Avoid an excessive DOM size",
      "description": "Browser engineers recommend pages contain fewer than ~1,500 DOM nodes",
      "value": 1823,
      "rating": "warning"
    }
  ]
}
```

### 4. Accessibility Auditing

Comprehensive accessibility analysis:

```json
{
  "accessibility": {
    "score": 98,
    "audits": {
      "passed": [
        "color-contrast",
        "document-title",
        "html-has-lang",
        "meta-viewport"
      ],
      "failed": [
        {
          "id": "image-alt",
          "title": "Image elements do not have [alt] attributes",
          "impact": "critical",
          "nodes": [
            {
              "html": "<img src=\"hero.jpg\">",
              "selector": ".hero-image > img"
            }
          ],
          "recommendation": "Add descriptive alt text to images"
        }
      ],
      "notApplicable": ["frame-title", "video-caption"]
    }
  }
}
```

### 5. SEO Analysis

SEO optimization recommendations:

```json
{
  "seo": {
    "score": 100,
    "audits": {
      "passed": [
        { "id": "document-title", "title": "Document has a <title> element" },
        { "id": "meta-description", "title": "Document has a meta description" },
        { "id": "http-status-code", "title": "Page has successful HTTP status code" },
        { "id": "is-crawlable", "title": "Page isn't blocked from indexing" }
      ],
      "opportunities": [
        {
          "id": "link-text",
          "title": "Links do not have descriptive text",
          "nodes": [
            { "html": "<a href=\"/more\">Click here</a>" }
          ]
        }
      ]
    }
  }
}
```

### 6. Performance Budget Tracking

Track against defined performance budgets:

```json
{
  "budget": {
    "resourceSizes": [
      {
        "resourceType": "script",
        "budget": 300000,
        "actual": 285000,
        "status": "pass"
      },
      {
        "resourceType": "stylesheet",
        "budget": 100000,
        "actual": 125000,
        "status": "fail",
        "overage": 25000
      },
      {
        "resourceType": "image",
        "budget": 500000,
        "actual": 450000,
        "status": "pass"
      }
    ],
    "timings": [
      {
        "metric": "largest-contentful-paint",
        "budget": 2500,
        "actual": 2100,
        "status": "pass"
      }
    ]
  }
}
```

## CLI Usage

```bash
# Basic audit
lighthouse https://example.com --output json --output-path report.json

# Desktop audit
lighthouse https://example.com --preset desktop

# Specific categories
lighthouse https://example.com --only-categories=performance,accessibility

# With performance budget
lighthouse https://example.com --budget-path=budget.json

# Multiple runs for accuracy
lighthouse https://example.com --chrome-flags="--headless" -n 3
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| Lighthouse MCP Server (danielsogl) | 13+ tools for comprehensive auditing | [GitHub](https://github.com/danielsogl/lighthouse-mcp-server) |
| Lighthouse MCP (priyankark) | Agentic optimization loops | [GitHub](https://github.com/priyankark/lighthouse-mcp) |

## Best Practices

1. **Test on slow connections** - Use throttling to simulate real user conditions
2. **Multiple runs** - Average 3-5 runs for accurate results
3. **Test mobile first** - Mobile scores often differ significantly from desktop
4. **Set budgets** - Define and track performance budgets
5. **CI integration** - Run Lighthouse in CI/CD pipelines
6. **Track over time** - Monitor scores and metrics trends

## Process Integration

This skill integrates with the following processes:
- `responsive-design.js` - Performance testing across viewports
- `accessibility-audit.js` - Accessibility scoring
- `component-library.js` - Component performance impact

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "audit",
  "url": "https://example.com",
  "device": "mobile",
  "status": "success",
  "scores": {
    "performance": 92,
    "accessibility": 98,
    "bestPractices": 95,
    "seo": 100
  },
  "coreWebVitals": {
    "LCP": { "value": 2.1, "rating": "good" },
    "INP": { "value": 150, "rating": "good" },
    "CLS": { "value": 0.05, "rating": "good" }
  },
  "artifacts": ["report.json", "report.html"]
}
```

## Error Handling

- Handle page load failures gracefully
- Retry on network errors
- Report Chrome/browser issues
- Provide helpful messages for common failures

## Constraints

- Requires Chrome/Chromium browser
- Dynamic content may need custom wait conditions
- Authentication requires additional configuration
- Some audits require HTTPS
