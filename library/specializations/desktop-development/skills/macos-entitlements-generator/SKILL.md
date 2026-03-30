---
name: macos-entitlements-generator
description: Generate entitlements.plist with appropriate sandbox capabilities for macOS applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [macos, entitlements, sandbox, security, apple]
---

# macos-entitlements-generator

Generate entitlements.plist with appropriate sandbox capabilities for macOS applications. This skill configures the App Sandbox, hardened runtime, and specific entitlements required for app functionality.

## Capabilities

- Generate entitlements.plist configuration
- Configure App Sandbox entitlements
- Set up hardened runtime entitlements
- Configure file access permissions
- Enable network access
- Configure hardware access (camera, microphone)
- Set up inter-app communication
- Generate both development and distribution entitlements

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Xcode project"
    },
    "appFeatures": {
      "type": "array",
      "items": {
        "enum": [
          "network-client", "network-server",
          "file-read", "file-write",
          "downloads-read", "downloads-write",
          "pictures-read", "pictures-write",
          "music-read", "music-write",
          "movies-read", "movies-write",
          "user-selected-files",
          "camera", "microphone",
          "usb", "bluetooth",
          "print", "calendar", "contacts",
          "location", "apple-events",
          "jit", "unsigned-memory"
        ]
      }
    },
    "appGroups": {
      "type": "array",
      "items": { "type": "string" },
      "description": "App group identifiers"
    },
    "keychainGroups": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Keychain access groups"
    },
    "disableSandbox": {
      "type": "boolean",
      "default": false,
      "description": "Disable sandbox (not recommended)"
    },
    "isMASApp": {
      "type": "boolean",
      "default": false,
      "description": "Target Mac App Store"
    }
  },
  "required": ["projectPath", "appFeatures"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "type": { "enum": ["entitlements", "info-plist-additions"] }
        }
      }
    },
    "warnings": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["success"]
}
```

## Entitlements.plist Examples

### Basic App with Network Access

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- App Sandbox -->
    <key>com.apple.security.app-sandbox</key>
    <true/>

    <!-- Network access -->
    <key>com.apple.security.network.client</key>
    <true/>

    <!-- User-selected files (via Open/Save panels) -->
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>
```

### Media App with Camera/Microphone

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>

    <!-- Camera access -->
    <key>com.apple.security.device.camera</key>
    <true/>

    <!-- Microphone access -->
    <key>com.apple.security.device.microphone</key>
    <true/>

    <!-- Network for streaming -->
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>

    <!-- Save recordings -->
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.files.movies.read-write</key>
    <true/>
</dict>
</plist>
```

### Developer Tool with JIT

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>

    <!-- JIT compilation (NOT allowed in Mac App Store) -->
    <key>com.apple.security.cs.allow-jit</key>
    <true/>

    <!-- Disable library validation for plugins -->
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>

    <!-- File access -->
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>

    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>
```

### App with Hardened Runtime (Direct Distribution)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Hardened runtime (required for notarization) -->
    <key>com.apple.security.cs.allow-jit</key>
    <false/>

    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <false/>

    <key>com.apple.security.cs.disable-library-validation</key>
    <false/>

    <!-- App-specific needs -->
    <key>com.apple.security.automation.apple-events</key>
    <true/>

    <key>com.apple.security.device.audio-input</key>
    <true/>
</dict>
</plist>
```

### App Groups and Keychain

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>

    <!-- App Groups for sharing data with extensions -->
    <key>com.apple.security.application-groups</key>
    <array>
        <string>$(TeamIdentifierPrefix)com.mycompany.myapp</string>
    </array>

    <!-- Keychain access groups -->
    <key>keychain-access-groups</key>
    <array>
        <string>$(AppIdentifierPrefix)com.mycompany.myapp</string>
    </array>

    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>
```

## Common Entitlement Keys

### File System

| Key | Description |
|-----|-------------|
| `files.user-selected.read-only` | Read user-selected files |
| `files.user-selected.read-write` | Read/write user-selected files |
| `files.downloads.read-only` | Read Downloads folder |
| `files.downloads.read-write` | Read/write Downloads folder |
| `files.pictures.read-only` | Read Pictures folder |
| `files.music.read-only` | Read Music folder |
| `files.movies.read-only` | Read Movies folder |

### Network

| Key | Description |
|-----|-------------|
| `network.client` | Outgoing connections |
| `network.server` | Incoming connections |

### Hardware

| Key | Description |
|-----|-------------|
| `device.camera` | Camera access |
| `device.microphone` | Microphone access |
| `device.usb` | USB device access |
| `device.bluetooth` | Bluetooth access |
| `print` | Printing |

### Hardened Runtime

| Key | Description |
|-----|-------------|
| `cs.allow-jit` | Allow JIT compilation |
| `cs.allow-unsigned-executable-memory` | Allow unsigned executable memory |
| `cs.disable-library-validation` | Load arbitrary plugins |
| `cs.disable-executable-page-protection` | Disable W^X |

## Privacy Keys (Info.plist)

When using certain entitlements, add corresponding privacy descriptions:

```xml
<!-- Info.plist additions -->
<key>NSCameraUsageDescription</key>
<string>This app needs camera access for video calls.</string>

<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for audio recording.</string>

<key>NSAppleEventsUsageDescription</key>
<string>This app needs to control other applications for automation.</string>

<key>NSLocationUsageDescription</key>
<string>This app needs your location for local weather.</string>
```

## Best Practices

1. **Request minimum permissions**: Only what the app needs
2. **Use user-selected files**: Prefer over broad folder access
3. **Document entitlement usage**: Explain to Apple reviewers
4. **Test in sandbox**: Always test sandboxed behavior
5. **Separate dev/prod entitlements**: Different needs for each
6. **Check MAS restrictions**: Some entitlements are prohibited

## Related Skills

- `macos-notarization-workflow` - Code signing and notarization
- `macos-codesign-workflow` - Code signing
- `security-hardening` process - Security audit

## Related Agents

- `swiftui-macos-expert` - macOS development
- `desktop-security-auditor` - Security review
