# electron-builder-config

Generate and validate electron-builder configuration for multi-platform desktop builds.

## Overview

This skill automates the creation and validation of electron-builder configurations for Electron applications. It handles the complexity of cross-platform builds, code signing, auto-update channels, and platform-specific packaging formats.

## Quick Start

### Basic Usage

```javascript
// Example skill invocation
const result = await invokeSkill('electron-builder-config', {
  projectPath: '/path/to/electron-app',
  appInfo: {
    appId: 'com.mycompany.myapp',
    productName: 'My Application',
    copyright: 'Copyright 2026 My Company'
  },
  platforms: ['windows', 'macos', 'linux'],
  targets: {
    windows: ['nsis'],
    macos: ['dmg'],
    linux: ['AppImage', 'deb']
  }
});
```

### With Code Signing

```javascript
const result = await invokeSkill('electron-builder-config', {
  projectPath: '/path/to/electron-app',
  appInfo: {
    appId: 'com.mycompany.myapp',
    productName: 'My Application'
  },
  platforms: ['windows', 'macos'],
  codeSigning: {
    windows: {
      enabled: true,
      certificateSubjectName: 'My Company',
      timestampServer: 'http://timestamp.digicert.com'
    },
    macos: {
      enabled: true,
      identity: 'Developer ID Application: My Company (TEAMID)',
      hardenedRuntime: true,
      notarize: true
    }
  },
  autoUpdate: {
    enabled: true,
    provider: 'github',
    channel: 'latest'
  }
});
```

## Features

### Platform Support

| Platform | Supported Targets |
|----------|-------------------|
| Windows | NSIS, NSIS-Web, Portable, AppX, MSI, Squirrel |
| macOS | DMG, PKG, MAS, ZIP |
| Linux | AppImage, DEB, RPM, Snap, Flatpak, tar.gz |

### Code Signing

- **Windows**: Authenticode signing with EV certificates, timestamp servers
- **macOS**: Developer ID signing, hardened runtime, notarization
- **Linux**: GPG signing for package repositories

### Auto-Update

Supports multiple update providers:
- GitHub Releases
- Amazon S3 / DigitalOcean Spaces
- Generic HTTP server
- Keygen.sh

### CI/CD Integration

Generate build workflows for:
- GitHub Actions
- Azure DevOps
- CircleCI
- GitLab CI

## Output Files

The skill generates:

1. **electron-builder.yml** - Main configuration file
2. **build/** directory structure with:
   - Icon files (ICO, ICNS, PNG)
   - Entitlements files (macOS)
   - NSIS scripts (Windows)
3. **CI scripts** (if requested):
   - `.github/workflows/build.yml`
   - `azure-pipelines.yml`
   - `.circleci/config.yml`

## Configuration Options

### Build Optimization

```yaml
# Recommended settings for production builds
compression: maximum
asar: true
asarUnpack:
  - "**/*.node"
  - "**/node_modules/sharp/**"
npmRebuild: true
buildDependenciesFromSource: false
```

### File Patterns

```yaml
files:
  - "**/*"
  - "!**/*.{md,txt,map}"
  - "!**/node_modules/*/{test,tests,__tests__}/**"
  - "!**/node_modules/.bin/**"
  - "!**/*.{ts,tsx}"
extraResources:
  - from: "assets/"
    to: "assets/"
    filter: ["**/*"]
```

### NSIS Configuration (Windows)

```yaml
nsis:
  oneClick: false
  perMachine: true
  allowElevation: true
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  menuCategory: true
  installerIcon: build/installerIcon.ico
  uninstallerIcon: build/uninstallerIcon.ico
  license: LICENSE.txt
```

### DMG Configuration (macOS)

```yaml
dmg:
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
  window:
    width: 540
    height: 380
  backgroundColor: "#FFFFFF"
```

## Validation Checks

The skill validates:

1. **Required fields** - appId, productName, version
2. **Icon files** - Correct formats and sizes for each platform
3. **Entitlements** - macOS sandbox and hardened runtime requirements
4. **Code signing** - Certificate availability and configuration
5. **Auto-update** - Provider configuration and publish settings
6. **File patterns** - Ensures necessary files are included

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| macOS build fails notarization | Enable `hardenedRuntime: true` and sign with `--options runtime` |
| Windows SmartScreen warning | Use EV code signing certificate |
| Large bundle size | Configure `files` patterns to exclude dev dependencies |
| Native modules fail | Add to `asarUnpack` and ensure `npmRebuild: true` |

### Debug Mode

```bash
# Enable verbose logging
DEBUG=electron-builder npm run build
```

## Examples

See the `examples/` directory for complete project configurations:

- `basic-app/` - Simple single-platform build
- `multi-platform/` - Cross-platform with all targets
- `enterprise/` - Code signing, notarization, auto-update
- `ci-cd/` - Complete CI/CD pipeline examples

## References

- [electron-builder Official Documentation](https://www.electron.build/)
- [Electron Forge](https://www.electronforge.io/) - Alternative build tool
- [Code Signing Best Practices](https://www.electron.build/code-signing)
- [Auto Update Setup](https://www.electron.build/auto-update)

## Related Skills

- `electron-main-preload-generator`
- `electron-auto-updater-setup`
- `windows-authenticode-signer`
- `macos-codesign-workflow`

## Version History

- **1.0.0** - Initial release with core electron-builder configuration
- **1.1.0** - Added CI/CD script generation
- **1.2.0** - Added validation and recommendations engine
