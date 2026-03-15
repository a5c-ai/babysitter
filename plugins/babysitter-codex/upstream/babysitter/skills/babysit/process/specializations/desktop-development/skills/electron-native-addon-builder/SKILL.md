---
name: electron-native-addon-builder
description: Build and bundle native Node.js addons for Electron with proper ABI compatibility, cross-compilation support, and rebuild automation
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [electron, native-modules, node-addon, n-api, build]
---

# electron-native-addon-builder

Build and bundle native Node.js addons for Electron with proper ABI (Application Binary Interface) compatibility. This skill handles the complexity of native module compilation, cross-platform building, and ensuring modules work correctly with Electron's Node.js version.

## Capabilities

- Configure electron-rebuild for native module compilation
- Set up node-gyp with Electron headers
- Handle cross-platform compilation (Windows, macOS, Linux)
- Manage ABI compatibility between Electron and native modules
- Configure prebuild/prebuild-install for binary distribution
- Set up N-API modules for version-independent builds
- Handle architecture-specific builds (x64, arm64, ia32)
- Integrate with electron-builder for packaging

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Electron project root"
    },
    "nativeModules": {
      "type": "array",
      "description": "List of native modules to handle",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "version": { "type": "string" },
          "source": { "enum": ["npm", "local", "github"] }
        }
      }
    },
    "electronVersion": {
      "type": "string",
      "description": "Target Electron version"
    },
    "targetPlatforms": {
      "type": "array",
      "items": { "enum": ["win32", "darwin", "linux"] }
    },
    "targetArchitectures": {
      "type": "array",
      "items": { "enum": ["x64", "arm64", "ia32"] }
    },
    "useNAPI": {
      "type": "boolean",
      "description": "Use N-API for version-independent builds",
      "default": true
    },
    "prebuildConfig": {
      "type": "boolean",
      "description": "Generate prebuild configuration",
      "default": false
    }
  },
  "required": ["projectPath"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "configuration": {
      "type": "object",
      "properties": {
        "electronRebuild": { "type": "object" },
        "nodeGyp": { "type": "object" },
        "packageJson": { "type": "object" }
      }
    },
    "scripts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "command": { "type": "string" }
        }
      }
    },
    "warnings": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["success"]
}
```

## Configuration Methods

### electron-rebuild (Recommended)

```json
// package.json
{
  "scripts": {
    "postinstall": "electron-rebuild",
    "rebuild": "electron-rebuild -f -w native-module-name"
  },
  "devDependencies": {
    "@electron/rebuild": "^3.6.0"
  }
}
```

### node-gyp with Electron Headers

```bash
# Set Electron headers for node-gyp
export npm_config_target=28.0.0
export npm_config_arch=x64
export npm_config_target_arch=x64
export npm_config_disturl=https://electronjs.org/headers
export npm_config_runtime=electron
export npm_config_build_from_source=true

npm install native-module
```

### electron-builder Integration

```yaml
# electron-builder.yml
npmRebuild: true
buildDependenciesFromSource: true
nodeGypRebuild: false

asarUnpack:
  - "**/*.node"
  - "**/node_modules/native-module/**"
```

## N-API Configuration

N-API provides ABI stability across Node.js versions:

```javascript
// binding.gyp for N-API module
{
  "targets": [
    {
      "target_name": "native_module",
      "sources": ["src/native_module.cc"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": ["NAPI_VERSION=8", "NAPI_DISABLE_CPP_EXCEPTIONS"]
    }
  ]
}
```

## Prebuild Configuration

For distributing prebuilt binaries:

```json
// package.json
{
  "scripts": {
    "prebuild": "prebuild -t 28.0.0 -r electron -a x64 -a arm64",
    "prebuild-upload": "prebuild --upload-all $GITHUB_TOKEN"
  },
  "devDependencies": {
    "prebuild": "^12.1.0",
    "prebuild-install": "^7.1.1"
  }
}
```

## Cross-Compilation

### Windows from macOS/Linux

```bash
# Using electron-rebuild with wine
npx @electron/rebuild --platform=win32 --arch=x64

# Or with prebuild
prebuild -t 28.0.0 -r electron --platform=win32 --arch=x64
```

### macOS ARM64 from x64

```bash
# Requires Xcode and arm64 toolchain
npx @electron/rebuild --arch=arm64
```

### Linux from macOS/Windows

```bash
# Using Docker
docker run -v $(pwd):/project electron-builder-linux \
  npx @electron/rebuild --platform=linux --arch=x64
```

## Common Native Modules

| Module | Use Case | N-API Support |
|--------|----------|---------------|
| better-sqlite3 | SQLite database | Yes |
| sharp | Image processing | Yes |
| node-pty | Terminal emulation | Yes |
| serialport | Serial communication | Yes |
| robotjs | Desktop automation | Limited |
| node-hid | USB HID devices | Yes |

## Troubleshooting

### ABI Mismatch Error

```
Error: The module was compiled against a different Node.js version
```

**Solution**: Rebuild with correct Electron version:

```bash
npx @electron/rebuild -v 28.0.0
```

### Missing Build Tools

**Windows**: Install Visual Studio Build Tools

```bash
npm install -g windows-build-tools
```

**macOS**: Install Xcode Command Line Tools

```bash
xcode-select --install
```

**Linux**: Install build-essential

```bash
sudo apt-get install build-essential
```

### Python Version Issues

```bash
# Specify Python version for node-gyp
npm config set python /usr/bin/python3
```

## Best Practices

1. **Use N-API when possible**: Provides version-independent binaries
2. **Prebuild binaries**: Avoid compilation on user machines
3. **Test all platforms**: Native modules behave differently per OS
4. **Pin Electron version**: Ensure ABI compatibility
5. **Exclude from ASAR**: Native modules must be unpacked
6. **Use electron-rebuild**: Handles headers automatically

## Related Skills

- `electron-builder-config` - Package native modules correctly
- `electron-main-preload-generator` - Secure native module usage
- `cross-platform-test-matrix` - Test native modules across platforms

## Related Agents

- `electron-architect` - Architecture for native modules
- `desktop-ci-architect` - CI/CD for native module builds
