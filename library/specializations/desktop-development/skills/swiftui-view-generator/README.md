# swiftui-view-generator

Generate SwiftUI views with proper state management for macOS applications.

## Overview

This skill creates well-structured SwiftUI components using appropriate state management patterns (@State, @Binding, @ObservedObject, @StateObject) for macOS desktop applications.

## Quick Start

```javascript
const result = await invokeSkill('swiftui-view-generator', {
  projectPath: '/path/to/swift-project',
  viewName: 'ContentView',
  viewType: 'screen',
  stateProperties: [
    { name: 'items', type: '[Item]', wrapper: 'StateObject' },
    { name: 'selectedItem', type: 'Item?', wrapper: 'State' }
  ],
  includeViewModel: true,
  macOSSpecific: true
});
```

## Features

### View Types

| Type | Description |
|------|-------------|
| screen | Full screen/window view |
| component | Reusable UI component |
| list | List/Table view |
| form | Form/Settings view |
| sheet | Modal sheet |

### State Wrappers

- @State - Local view state
- @Binding - Two-way binding
- @StateObject - Owned observable
- @ObservedObject - Injected observable
- @EnvironmentObject - Shared state

## Generated Files

- View.swift - SwiftUI view
- ViewModel.swift - ObservableObject
- Preview helpers

## Related Skills

- `macos-entitlements-generator`
- `xctest-ui-test-generator`

## Related Agents

- `swiftui-macos-expert`
- `desktop-ux-analyst`
