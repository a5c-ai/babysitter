---
name: screenshot-comparison
description: Visual regression testing through screenshot capture and comparison. Pixel-diff analysis, responsive screenshot capture across viewports, and visual change reporting with highlighted differences.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: visual-testing
  backlog-id: SK-UX-005
---

# screenshot-comparison

You are **screenshot-comparison** - a specialized skill for visual regression testing through screenshot capture and pixel-level comparison, ensuring UI consistency across changes.

## Overview

This skill enables AI-powered visual regression testing including:
- Capturing component and page screenshots
- Pixel-diff comparison with configurable thresholds
- Responsive screenshot capture across breakpoints
- Visual change reporting with highlighted differences
- Baseline management and approval workflows
- Integration with CI/CD pipelines

## Prerequisites

- Node.js 18+ installed
- Browser automation tool (Playwright, Puppeteer)
- `pixelmatch` or similar diff library
- Optional: Percy, Chromatic for cloud-based testing

## Capabilities

### 1. Screenshot Capture

Capture screenshots with various configurations:

```javascript
// Full page screenshot
const screenshot = await page.screenshot({
  fullPage: true,
  path: 'screenshots/home-full.png'
});

// Element screenshot
const element = await page.locator('.hero-section');
await element.screenshot({ path: 'screenshots/hero.png' });

// Viewport-specific screenshot
await page.setViewportSize({ width: 375, height: 667 });
await page.screenshot({ path: 'screenshots/home-mobile.png' });

// Hide dynamic elements
await page.evaluate(() => {
  document.querySelectorAll('[data-testid="timestamp"]')
    .forEach(el => el.style.visibility = 'hidden');
});
await page.screenshot({ path: 'screenshots/home-stable.png' });
```

### 2. Pixel-Diff Comparison

Compare screenshots and generate diff images:

```javascript
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');
const fs = require('fs');

const baseline = PNG.sync.read(fs.readFileSync('baseline.png'));
const current = PNG.sync.read(fs.readFileSync('current.png'));
const { width, height } = baseline;

const diff = new PNG({ width, height });

const numDiffPixels = pixelmatch(
  baseline.data,
  current.data,
  diff.data,
  width,
  height,
  {
    threshold: 0.1,           // Sensitivity (0-1)
    includeAA: false,         // Ignore antialiasing
    diffColor: [255, 0, 0],   // Diff highlight color
    diffColorAlt: [0, 255, 0] // Alt color for anti-aliased
  }
);

fs.writeFileSync('diff.png', PNG.sync.write(diff));

const diffPercentage = (numDiffPixels / (width * height)) * 100;
console.log(`Diff: ${diffPercentage.toFixed(2)}%`);
```

### 3. Responsive Testing

Capture screenshots across multiple viewports:

```javascript
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 }
];

const results = [];

for (const viewport of viewports) {
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height
  });

  await page.screenshot({
    path: `screenshots/${pageName}-${viewport.name}.png`,
    fullPage: true
  });

  results.push({
    viewport: viewport.name,
    path: `screenshots/${pageName}-${viewport.name}.png`
  });
}
```

### 4. Visual Change Report

Generate comprehensive diff reports:

```json
{
  "testRun": {
    "id": "vr-2026-01-24-001",
    "timestamp": "2026-01-24T10:30:00Z",
    "branch": "feature/new-header",
    "commit": "abc123"
  },
  "summary": {
    "total": 25,
    "passed": 22,
    "failed": 2,
    "new": 1,
    "passRate": "88%"
  },
  "comparisons": [
    {
      "name": "homepage-desktop",
      "status": "passed",
      "diffPercentage": 0.01,
      "threshold": 0.1,
      "baseline": "baseline/homepage-desktop.png",
      "current": "current/homepage-desktop.png"
    },
    {
      "name": "header-mobile",
      "status": "failed",
      "diffPercentage": 5.2,
      "threshold": 0.1,
      "baseline": "baseline/header-mobile.png",
      "current": "current/header-mobile.png",
      "diff": "diffs/header-mobile-diff.png",
      "changedRegions": [
        { "x": 10, "y": 5, "width": 200, "height": 50, "description": "Logo area" }
      ]
    },
    {
      "name": "new-feature-banner",
      "status": "new",
      "current": "current/new-feature-banner.png",
      "requiresApproval": true
    }
  ]
}
```

### 5. Baseline Management

Manage screenshot baselines:

```bash
# Update baseline for specific test
/skill screenshot-comparison update-baseline \
  --test header-mobile \
  --approve

# Update all failed baselines
/skill screenshot-comparison update-baseline \
  --all-failed \
  --approve

# Review pending approvals
/skill screenshot-comparison review \
  --status pending
```

### 6. Component-Level Testing

Test individual components in isolation:

```javascript
// Storybook integration
const stories = await getStorybookStories();

for (const story of stories) {
  // Navigate to story
  await page.goto(`${storybookUrl}/iframe.html?id=${story.id}`);

  // Wait for component
  await page.waitForSelector('#storybook-root > *');

  // Capture component screenshot
  const component = await page.locator('#storybook-root > *');
  await component.screenshot({
    path: `screenshots/components/${story.id}.png`
  });
}
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| Percy via BrowserStack MCP | Cloud-based visual testing | [BrowserStack](https://www.browserstack.com/docs/browserstack-mcp-server/tools/percy) |
| Playwright MCP Server | Browser automation with screenshots | [GitHub](https://github.com/executeautomation/mcp-playwright) |

## Best Practices

1. **Ignore dynamic content** - Hide timestamps, ads, animations before capture
2. **Use consistent environments** - Same browser version, OS, fonts
3. **Set appropriate thresholds** - Balance sensitivity vs false positives
4. **Organize baselines** - Clear naming convention and version control
5. **Review before approve** - Always review diffs before accepting
6. **Test critical paths** - Focus on high-impact user journeys

## Process Integration

This skill integrates with the following processes:
- `component-library.js` - Component visual regression
- `responsive-design.js` - Responsive visual testing
- `hifi-prototyping.js` - Design-to-implementation comparison

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "compare",
  "status": "completed",
  "summary": {
    "total": 10,
    "passed": 9,
    "failed": 1
  },
  "results": [
    {
      "name": "header-desktop",
      "status": "passed",
      "diffPercentage": 0.02
    }
  ],
  "artifacts": [
    "report.html",
    "diffs/header-mobile-diff.png"
  ]
}
```

## Error Handling

- Handle page load failures gracefully
- Report element not found errors
- Manage baseline not found scenarios
- Provide clear diff visualization

## Constraints

- Screenshots may vary across browsers/OS
- Animations and transitions cause false positives
- Large pages may require chunked capture
- Font rendering differences require tolerance
