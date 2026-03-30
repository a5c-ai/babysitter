---
name: BackstopJS Visual Testing
description: BackstopJS visual regression testing for self-hosted visual comparison
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# BackstopJS Visual Testing Skill

## Overview

This skill provides expert-level capabilities for BackstopJS-based visual regression testing, enabling self-hosted visual comparison without external dependencies.

## Capabilities

### Scenario Configuration
- Configure BackstopJS scenarios
- Define viewport configurations
- Set up selectors for capture
- Configure scenario-specific settings

### Reference Management
- Execute reference runs
- Update reference images
- Handle reference versioning

### Visual Comparison
- Execute test runs against references
- Analyze visual diff reports
- Configure diff thresholds

### Interaction Handling
- Configure click and hover interactions
- Handle scroll positions
- Implement wait conditions
- Execute custom scripts before capture

### Report Generation
- Generate HTML comparison reports
- CI-friendly report formats
- History tracking

### Engine Configuration
- Configure Puppeteer engine settings
- Chrome launch options
- Network request handling

## Target Processes

- `visual-regression.js` - Visual regression testing
- `e2e-test-suite.js` - E2E with visual validation

## Dependencies

- `backstopjs` - Visual regression tool
- Puppeteer (bundled)
- Docker (optional, for consistent rendering)

## Usage Example

```javascript
{
  kind: 'skill',
  skill: {
    name: 'backstopjs-visual',
    context: {
      action: 'test',
      configPath: 'backstop.json',
      scenarios: ['homepage', 'dashboard'],
      viewports: ['phone', 'tablet', 'desktop']
    }
  }
}
```

## Configuration

The skill uses `backstop.json` for configuration and supports Docker-based execution for consistent results.
