# qt-cmake-project-generator

Generate CMake-based Qt project with proper module dependencies and cross-compilation support.

## Overview

This skill creates modern CMake configurations for Qt6 projects, handling module discovery, build configurations, and cross-platform deployment.

## Quick Start

```javascript
const result = await invokeSkill('qt-cmake-project-generator', {
  projectPath: '/path/to/project',
  projectName: 'MyQtApp',
  qtVersion: '6.6',
  qtModules: ['Core', 'Gui', 'Widgets', 'Network'],
  appType: 'widgets',
  targetPlatforms: ['windows', 'macos', 'linux'],
  cppStandard: '17',
  generatePresets: true
});
```

## Features

### Qt Module Support

- Core, Gui, Widgets
- Quick, Qml
- Network, Sql
- Multimedia, WebEngine
- Charts, 3D

### Generated Files

| File | Description |
|------|-------------|
| CMakeLists.txt | Main build configuration |
| CMakePresets.json | Build presets for dev/CI |
| toolchains/ | Cross-compilation toolchains |

## Build Commands

```bash
# Configure
cmake --preset default

# Build
cmake --build --preset default

# Install
cmake --install build/default
```

## Related Skills

- `qt-qml-component-generator`
- `qt-installer-framework-config`

## Related Agents

- `qt-cpp-specialist`
- `desktop-ci-architect`
