# electron-native-addon-builder

Build and bundle native Node.js addons for Electron with proper ABI compatibility.

## Overview

This skill manages the complexity of native module compilation for Electron applications. It handles electron-rebuild configuration, cross-platform compilation, and N-API module setup.

## Quick Start

```javascript
const result = await invokeSkill('electron-native-addon-builder', {
  projectPath: '/path/to/electron-app',
  nativeModules: [
    { name: 'better-sqlite3', version: '^9.0.0', source: 'npm' },
    { name: 'sharp', version: '^0.33.0', source: 'npm' }
  ],
  electronVersion: '28.0.0',
  targetPlatforms: ['win32', 'darwin', 'linux'],
  targetArchitectures: ['x64', 'arm64'],
  useNAPI: true
});
```

## Features

### Build Methods

| Method | Use Case |
|--------|----------|
| electron-rebuild | Standard rebuilding for Electron |
| node-gyp | Direct compilation control |
| prebuild | Binary distribution |
| N-API | Version-independent modules |

### Platform Support

- Windows (x64, ia32)
- macOS (x64, arm64)
- Linux (x64, arm64)

## Generated Configuration

```json
{
  "scripts": {
    "postinstall": "electron-rebuild",
    "rebuild": "electron-rebuild -f"
  },
  "devDependencies": {
    "@electron/rebuild": "^3.6.0"
  }
}
```

## Common Issues

| Issue | Solution |
|-------|----------|
| ABI mismatch | Rebuild with correct Electron version |
| Missing build tools | Install platform-specific tools |
| Python errors | Set python path in npm config |

## Related Skills

- `electron-builder-config`
- `cross-platform-test-matrix`

## Related Agents

- `electron-architect`
- `desktop-ci-architect`
