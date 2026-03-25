---
name: Percy Visual Testing
description: Percy visual testing platform integration for visual regression detection
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Percy Visual Testing Skill

## Overview

This skill provides expert-level capabilities for Percy-based visual testing, enabling snapshot capture, visual diff analysis, and seamless CI/CD integration.

## Capabilities

### Snapshot Capture
- Capture visual snapshots across viewports
- Configure responsive testing breakpoints
- Handle dynamic content masking
- Full-page and element snapshots

### Visual Diff Analysis
- Analyze visual diffs between builds
- Identify intentional vs unintentional changes
- Configure diff sensitivity

### Baseline Management
- Manage Percy baseline approvals
- Handle baseline branching
- Configure auto-approval rules

### CI/CD Integration
- Configure Percy with CI/CD pipelines
- GitHub/GitLab integration
- Pull request visual reviews

### Framework Integration
- Integrate with Playwright
- Integrate with Cypress
- Integrate with Selenium
- Storybook integration

## Target Processes

- `visual-regression.js` - Visual regression testing
- `e2e-test-suite.js` - E2E with visual validation
- `cross-browser-testing.js` - Cross-browser visual testing

## Dependencies

- `@percy/cli` - Percy CLI
- `@percy/playwright` / `@percy/cypress` - Framework SDKs
- Percy account and token

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'percy-visual',
    context: {
      action: 'capture-snapshots',
      testSuite: 'e2e',
      widths: [375, 768, 1280],
      branch: 'feature/new-design'
    }
  }
}
```

## Configuration

The skill requires a Percy token and can be configured to work with various testing frameworks.
