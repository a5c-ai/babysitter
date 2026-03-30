# macos-entitlements-generator

Generate entitlements.plist with appropriate sandbox capabilities for macOS applications.

## Overview

This skill configures App Sandbox, hardened runtime, and specific entitlements required for macOS app functionality and App Store submission.

## Quick Start

```javascript
const result = await invokeSkill('macos-entitlements-generator', {
  projectPath: '/path/to/xcode-project',
  appFeatures: ['network-client', 'file-read', 'file-write', 'camera'],
  appGroups: ['$(TeamIdentifierPrefix)com.mycompany.myapp'],
  isMASApp: true
});
```

## Features

### Common Entitlements

| Category | Entitlements |
|----------|-------------|
| Network | client, server |
| Files | user-selected, downloads, pictures, music, movies |
| Hardware | camera, microphone, usb, bluetooth |
| System | print, calendar, contacts, location |

### Distribution Types

- **Mac App Store**: Stricter entitlements, no JIT
- **Direct Distribution**: More flexibility, requires notarization

## Generated Files

- `MyApp.entitlements` - Main entitlements
- `MyAppDebug.entitlements` - Debug entitlements
- Info.plist privacy keys

## Related Skills

- `macos-notarization-workflow`
- `macos-codesign-workflow`

## Related Agents

- `swiftui-macos-expert`
- `desktop-security-auditor`
