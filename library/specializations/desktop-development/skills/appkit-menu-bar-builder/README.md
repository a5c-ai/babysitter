# appkit-menu-bar-builder

Generate NSMenu and NSStatusItem configurations for macOS menu bar applications.

## Overview

This skill creates macOS menu bar applications with NSStatusItem, NSMenu, and optional SwiftUI popover integration.

## Quick Start

```javascript
const result = await invokeSkill('appkit-menu-bar-builder', {
  projectPath: '/path/to/project',
  appType: 'popover',
  useSwiftUI: true
});
```

## Features

- Menu bar status items
- Dropdown menus
- SwiftUI popovers
- Dynamic icons (light/dark mode)
- Agent app configuration

## Related Skills

- `swiftui-view-generator`
- `macos-entitlements-generator`
