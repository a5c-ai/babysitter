# xctest-ui-test-generator

Generate XCTest UI tests for macOS applications.

## Overview

This skill creates XCUITest test classes with page object patterns and accessibility identifiers for macOS app testing.

## Quick Start

```javascript
const result = await invokeSkill('xctest-ui-test-generator', {
  projectPath: '/path/to/xcode-project',
  targetViews: ['MainView', 'SettingsView'],
  usePageObjects: true,
  generateAccessibilityIds: true
});
```

## Features

- XCUITest test generation
- Page object pattern
- Accessibility identifiers
- Screenshot capture
- Performance testing

## Related Skills

- `swiftui-view-generator`
- `desktop-ui-testing` process
