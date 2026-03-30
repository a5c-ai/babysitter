# Screenshot Comparison Skill

## Overview

The `screenshot-comparison` skill provides visual regression testing through screenshot capture and pixel-level comparison. It enables automated detection of unintended UI changes, supporting responsive testing across viewports and generating detailed diff reports.

## Quick Start

### Prerequisites

1. **Node.js** - Version 18 or higher
2. **Browser Automation** - Playwright (recommended) or Puppeteer
3. **Image Processing** - pixelmatch, pngjs

### Installation

The skill is included in the babysitter-sdk. Install dependencies:

```bash
# Install Playwright
npm install @playwright/test

# Install image comparison libraries
npm install pixelmatch pngjs

# Optional: Percy for cloud-based testing
npm install @percy/cli @percy/playwright
```

## Usage

### Basic Operations

```bash
# Capture screenshots
/skill screenshot-comparison capture --url https://example.com --viewports mobile,desktop

# Compare against baselines
/skill screenshot-comparison compare --baseline ./baselines --current ./current

# Generate diff report
/skill screenshot-comparison report --input ./diffs --output report.html

# Update baselines
/skill screenshot-comparison update-baseline --test header-mobile
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(screenshotComparisonTask, {
  operation: 'compare',
  baselineDir: './baselines',
  currentDir: './screenshots',
  threshold: 0.1,
  viewports: ['mobile', 'tablet', 'desktop'],
  generateReport: true
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Screenshot Capture** | Full page and element screenshots |
| **Pixel Comparison** | Configurable threshold diff analysis |
| **Responsive Testing** | Multiple viewport support |
| **Diff Visualization** | Highlighted difference images |
| **Baseline Management** | Approval workflow integration |
| **CI/CD Integration** | Automated regression testing |

## Examples

### Example 1: Basic Visual Regression Test

```bash
# Capture baseline
/skill screenshot-comparison capture \
  --url https://example.com \
  --output ./baselines \
  --viewports mobile,desktop

# After changes, capture current state
/skill screenshot-comparison capture \
  --url https://example.com \
  --output ./current \
  --viewports mobile,desktop

# Compare and generate report
/skill screenshot-comparison compare \
  --baseline ./baselines \
  --current ./current \
  --threshold 0.1 \
  --output-report report.html
```

### Example 2: Component Testing with Storybook

```javascript
// Test all Storybook components
const storybookUrl = 'http://localhost:6006';

const result = await ctx.task(screenshotComparisonTask, {
  operation: 'storybook-test',
  storybookUrl,
  baselineDir: './baselines/components',
  threshold: 0.05,
  viewports: [
    { name: 'default', width: 800, height: 600 }
  ],
  ignorePatterns: [
    '[data-testid="loading-spinner"]',
    '.timestamp'
  ]
});
```

### Example 3: CI/CD Integration

```yaml
# GitHub Actions workflow
jobs:
  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci && npx playwright install

      - name: Start app
        run: npm start &

      - name: Wait for app
        run: npx wait-on http://localhost:3000

      - name: Run visual regression tests
        run: |
          /skill screenshot-comparison compare \
            --baseline ./baselines \
            --url http://localhost:3000 \
            --threshold 0.1 \
            --fail-on-diff

      - name: Upload diff artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diffs
          path: ./diffs
```

### Example 4: Percy Cloud Integration

```javascript
// Percy visual testing
const { percySnapshot } = require('@percy/playwright');

test('homepage visual test', async ({ page }) => {
  await page.goto('https://example.com');

  // Percy handles responsive testing automatically
  await percySnapshot(page, 'Homepage', {
    widths: [375, 768, 1440],
    minHeight: 1024
  });
});

// CLI integration
/skill screenshot-comparison percy \
  --url https://example.com \
  --token $PERCY_TOKEN
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SCREENSHOT_THRESHOLD` | Diff threshold (0-1) | `0.1` |
| `SCREENSHOT_OUTPUT_DIR` | Output directory | `./screenshots` |
| `PERCY_TOKEN` | Percy API token | Optional |

### Skill Configuration

```yaml
# .babysitter/skills/screenshot-comparison.yaml
screenshot-comparison:
  threshold: 0.1
  viewports:
    mobile:
      width: 375
      height: 667
    tablet:
      width: 768
      height: 1024
    desktop:
      width: 1440
      height: 900
  ignorePatterns:
    - '[data-testid="dynamic"]'
    - '.timestamp'
    - '.ad-container'
  waitForSelector: '[data-ready="true"]'
  fullPage: true
  baselineDir: ./baselines
  diffDir: ./diffs
  reportFormat: html
```

## Process Integration

### Processes Using This Skill

1. **component-library.js** - Component visual regression
2. **responsive-design.js** - Responsive visual testing
3. **hifi-prototyping.js** - Design-to-implementation comparison

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const visualRegressionTask = defineTask({
  name: 'visual-regression',
  description: 'Run visual regression tests',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'Visual Regression Testing',
      skill: {
        name: 'screenshot-comparison',
        context: {
          operation: 'compare',
          url: inputs.url,
          baselineDir: inputs.baselineDir || './baselines',
          threshold: inputs.threshold || 0.1,
          viewports: inputs.viewports || ['mobile', 'desktop'],
          generateReport: true
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

### Percy via BrowserStack MCP

Cloud-based visual testing with cross-browser support.

**Features:**
- Cross-browser screenshots
- Responsive widths
- Team review workflow
- CI/CD integration

**Reference:** https://www.browserstack.com/docs/browserstack-mcp-server/tools/percy

### Playwright MCP Server

Browser automation with screenshot capabilities.

**Features:**
- Full page screenshots
- Element screenshots
- Video recording
- Trace files

**GitHub:** https://github.com/executeautomation/mcp-playwright

## Viewport Presets

| Preset | Width | Height | Device Example |
|--------|-------|--------|----------------|
| `mobile-sm` | 320 | 568 | iPhone SE |
| `mobile` | 375 | 667 | iPhone 8 |
| `mobile-lg` | 414 | 896 | iPhone 11 |
| `tablet` | 768 | 1024 | iPad |
| `desktop` | 1280 | 720 | Laptop |
| `desktop-lg` | 1440 | 900 | Desktop |
| `wide` | 1920 | 1080 | Full HD |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Flaky diffs` | Increase threshold or wait for animations |
| `Font differences` | Use web fonts or consistent OS |
| `Dynamic content` | Hide with CSS or wait states |
| `Baseline mismatch` | Verify browser/viewport consistency |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
SCREENSHOT_DEBUG=true /skill screenshot-comparison compare \
  --baseline ./baselines \
  --current ./current
```

## Related Skills

- **lighthouse** - Performance and accessibility testing
- **axe-accessibility** - Accessibility validation
- **figma-api** - Design comparison source

## References

- [Playwright Screenshots](https://playwright.dev/docs/screenshots)
- [pixelmatch](https://github.com/mapbox/pixelmatch)
- [Percy Documentation](https://docs.percy.io/)
- [Chromatic](https://www.chromatic.com/docs/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-UX-005
**Category:** Visual Testing
**Status:** Active
