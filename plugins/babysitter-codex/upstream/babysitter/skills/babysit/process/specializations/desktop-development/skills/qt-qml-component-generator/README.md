# qt-qml-component-generator

Generate QML components with proper property bindings and signal/slot connections.

## Overview

This skill creates well-structured QML components following Qt Quick best practices, including property bindings, signals, and C++ backend integration.

## Quick Start

```javascript
const result = await invokeSkill('qt-qml-component-generator', {
  projectPath: '/path/to/qt-project',
  componentName: 'CustomButton',
  componentType: 'control',
  properties: [
    { name: 'text', type: 'string', defaultValue: '""' },
    { name: 'loading', type: 'bool', defaultValue: 'false' }
  ],
  signals: [
    { name: 'clicked', parameters: [] }
  ],
  cppBackend: true,
  useControls: 'basic'
});
```

## Features

### Component Types

| Type | Base | Use Case |
|------|------|----------|
| item | Item | Basic visual element |
| control | Control | Interactive widget |
| popup | Popup | Modal/overlay |
| view | ListView | List display |
| delegate | ItemDelegate | List item |
| singleton | QtObject | Shared state |

### Generated Files

- QML component file
- C++ backend class (optional)
- CMake module configuration
- qmldir module file

## Related Skills

- `qt-cmake-project-generator`
- `qt-translation-workflow`

## Related Agents

- `qt-cpp-specialist`
- `desktop-ux-analyst`
