# swift-package-manager-config

Configure Swift Package Manager for macOS applications.

## Overview

This skill generates Package.swift configurations with platform-specific dependencies, targets, and build settings.

## Quick Start

```javascript
const result = await invokeSkill('swift-package-manager-config', {
  projectPath: '/path/to/project',
  packageName: 'MyPackage',
  platforms: ['macos', 'ios'],
  dependencies: [
    { url: 'https://github.com/apple/swift-collections', version: '1.1.0' }
  ]
});
```

## Features

- Multiple platforms
- Library and executable products
- External dependencies
- Test targets
- Binary targets/XCFrameworks

## Related Skills

- `swiftui-view-generator`
- `xctest-ui-test-generator`
