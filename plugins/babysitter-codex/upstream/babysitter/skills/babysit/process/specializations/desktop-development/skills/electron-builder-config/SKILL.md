---
name: electron-builder-config
description: Generate and validate electron-builder configuration for multi-platform desktop builds with code signing, auto-update, and platform-specific packaging
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [electron, desktop, build, packaging, cross-platform]
---

# electron-builder-config

Generate and validate electron-builder configuration for multi-platform desktop builds. This skill handles the complete configuration for building Electron applications across Windows, macOS, and Linux with proper code signing, auto-update channels, and platform-specific installers.

## Capabilities

- Generate complete `electron-builder.yml` or `electron-builder.json5` configuration
- Configure platform-specific build targets (NSIS, DMG, AppImage, DEB, RPM, Snap, Flatpak)
- Set up code signing for Windows (Authenticode) and macOS (Developer ID)
- Configure auto-update settings with electron-updater
- Optimize build artifacts with compression and deduplication
- Validate existing configurations for common issues
- Generate CI/CD build scripts for GitHub Actions, Azure DevOps, CircleCI

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Electron project root"
    },
    "appInfo": {
      "type": "object",
      "properties": {
        "appId": { "type": "string", "description": "Application bundle ID (com.company.app)" },
        "productName": { "type": "string" },
        "copyright": { "type": "string" }
      },
      "required": ["appId", "productName"]
    },
    "platforms": {
      "type": "array",
      "items": { "enum": ["windows", "macos", "linux"] },
      "description": "Target platforms to build for"
    },
    "targets": {
      "type": "object",
      "properties": {
        "windows": { "type": "array", "items": { "enum": ["nsis", "nsis-web", "portable", "appx", "msi", "squirrel"] } },
        "macos": { "type": "array", "items": { "enum": ["dmg", "pkg", "mas", "mas-dev", "zip"] } },
        "linux": { "type": "array", "items": { "enum": ["AppImage", "deb", "rpm", "snap", "flatpak", "tar.gz"] } }
      }
    },
    "codeSigning": {
      "type": "object",
      "properties": {
        "windows": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean" },
            "certificateSubjectName": { "type": "string" },
            "timestampServer": { "type": "string" }
          }
        },
        "macos": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean" },
            "identity": { "type": "string" },
            "hardenedRuntime": { "type": "boolean", "default": true },
            "notarize": { "type": "boolean" }
          }
        }
      }
    },
    "autoUpdate": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "provider": { "enum": ["github", "s3", "generic", "spaces", "keygen"] },
        "channel": { "enum": ["latest", "beta", "alpha"] }
      }
    },
    "generateCIScripts": {
      "type": "boolean",
      "description": "Generate CI/CD build scripts"
    }
  },
  "required": ["projectPath", "appInfo", "platforms"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "configPath": { "type": "string", "description": "Path to generated config file" },
    "config": { "type": "object", "description": "Generated electron-builder configuration" },
    "ciScripts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    },
    "warnings": { "type": "array", "items": { "type": "string" } },
    "recommendations": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["success"]
}
```

## Usage Instructions

1. **Analyze project structure**: Examine package.json, existing build configs, and project layout
2. **Determine build requirements**: Based on target platforms and distribution needs
3. **Generate configuration**: Create electron-builder.yml with all necessary settings
4. **Validate configuration**: Check for common issues and missing dependencies
5. **Generate CI scripts**: If requested, create GitHub Actions or other CI workflows

## Configuration Templates

### Basic Multi-Platform Build

```yaml
appId: com.example.myapp
productName: MyApp
directories:
  buildResources: build
  output: dist
files:
  - "**/*"
  - "!**/*.{md,txt}"
  - "!**/node_modules/*/{CHANGELOG.md,README.md,readme.md}"
win:
  target:
    - target: nsis
      arch: [x64, ia32]
  icon: build/icon.ico
mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: build/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
linux:
  target:
    - target: AppImage
      arch: [x64]
    - target: deb
      arch: [x64]
  icon: build/icons
  category: Utility
```

### With Code Signing and Notarization

```yaml
win:
  sign: ./scripts/sign.js
  signingHashAlgorithms: [sha256]
  signDlls: true
mac:
  identity: "Developer ID Application: Company Name (TEAMID)"
  hardenedRuntime: true
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
afterSign: scripts/notarize.js
```

### With Auto-Update

```yaml
publish:
  provider: github
  owner: your-org
  repo: your-repo
  releaseType: release
nsis:
  oneClick: false
  perMachine: true
  allowToChangeInstallationDirectory: true
  differentialPackage: true
```

## Best Practices

1. **Always use `hardenedRuntime: true`** for macOS to pass notarization
2. **Enable `signingHashAlgorithms: [sha256]`** for modern Windows compatibility
3. **Use `differentialPackage: true`** for efficient auto-updates
4. **Configure `files` patterns** to exclude unnecessary files and reduce bundle size
5. **Set up separate channels** (latest, beta, alpha) for staged rollouts
6. **Store signing credentials** in CI secrets, never in config files

## Community References

- [electron-builder Documentation](https://www.electron.build/)
- [Electron Code Signing Guide](https://www.electronjs.org/docs/latest/tutorial/code-signing)
- [electron-scaffold skill](https://claude-plugins.dev/skills/@chrisvoncsefalvay/claude-skills/electron-scaffold)
- [Electron Distribution & Auto-Update](https://mcpmarket.com/tools/skills/electron-distribution-auto-update)

## Related Skills

- `electron-main-preload-generator` - Generate secure main process and preload scripts
- `electron-auto-updater-setup` - Configure electron-updater with advanced features
- `windows-authenticode-signer` - Windows code signing with signtool
- `macos-codesign-workflow` - macOS code signing and notarization

## Related Agents

- `electron-architect` - Expert in Electron architecture and best practices
- `desktop-ci-architect` - CI/CD pipeline design for desktop builds
