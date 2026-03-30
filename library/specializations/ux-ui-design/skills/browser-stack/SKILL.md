---
name: browser-stack
description: Cross-browser and cross-device testing using BrowserStack or Sauce Labs
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebFetch
---

# Browser Stack Skill

## Purpose

Execute cross-browser and cross-device testing using cloud testing platforms like BrowserStack or Sauce Labs.

## Capabilities

- Run tests on real devices and browsers
- Capture screenshots across device/browser combinations
- Test on multiple browser versions
- Generate compatibility reports
- Visual regression testing across platforms
- Performance testing on real devices

## Target Processes

- responsive-design.js (crossDeviceTestingTask)
- accessibility-audit.js
- usability-testing.js

## Integration Points

- BrowserStack API
- Sauce Labs API
- Selenium WebDriver
- Playwright

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "platform": {
      "type": "string",
      "enum": ["browserstack", "saucelabs"],
      "default": "browserstack"
    },
    "testUrl": {
      "type": "string",
      "description": "URL to test"
    },
    "browsers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "browser": { "type": "string" },
          "version": { "type": "string" },
          "os": { "type": "string" }
        }
      }
    },
    "devices": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "device": { "type": "string" },
          "osVersion": { "type": "string" }
        }
      }
    },
    "testType": {
      "type": "string",
      "enum": ["screenshot", "functional", "visual-regression", "performance"],
      "default": "screenshot"
    },
    "viewports": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "width": { "type": "number" },
          "height": { "type": "number" }
        }
      }
    }
  },
  "required": ["testUrl"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "testResults": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "browser": { "type": "string" },
          "device": { "type": "string" },
          "status": { "type": "string" },
          "screenshotUrl": { "type": "string" }
        }
      }
    },
    "compatibilityMatrix": {
      "type": "object",
      "description": "Browser/device compatibility summary"
    },
    "issues": {
      "type": "array",
      "description": "Detected compatibility issues"
    },
    "reportUrl": {
      "type": "string",
      "description": "URL to full test report"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  platform: 'browserstack',
  testUrl: 'https://example.com',
  browsers: [
    { browser: 'chrome', version: 'latest', os: 'Windows 11' },
    { browser: 'safari', version: 'latest', os: 'OS X Sonoma' }
  ],
  devices: [
    { device: 'iPhone 15', osVersion: '17' },
    { device: 'Samsung Galaxy S24', osVersion: '14' }
  ],
  testType: 'screenshot'
});
```
