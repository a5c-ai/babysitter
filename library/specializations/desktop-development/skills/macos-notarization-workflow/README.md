# macos-notarization-workflow

Automate Apple notarization with xcrun notarytool for macOS application distribution.

## Overview

This skill handles the complete notarization workflow including submission via notarytool, status monitoring, and stapling the notarization ticket.

## Quick Start

```javascript
const result = await invokeSkill('macos-notarization-workflow', {
  projectPath: '/path/to/project',
  appPath: '/path/to/MyApp.app',
  authMethod: 'app-store-connect-api',
  credentials: {
    keyId: 'XXXXXXXXXX',
    issuerId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    keyPath: '~/private_keys/AuthKey.p8'
  },
  waitForCompletion: true,
  staple: true
});
```

## Features

### Workflow Steps

1. Validate code signature
2. Submit to Apple notarization service
3. Wait for processing
4. Retrieve and analyze log
5. Staple ticket to app

### Authentication Methods

| Method | Use Case |
|--------|----------|
| app-store-connect-api | CI/CD (recommended) |
| apple-id | Manual workflows |
| keychain | Stored credentials |

## Commands

```bash
# Submit
xcrun notarytool submit MyApp.app --keychain-profile "Profile" --wait

# Check status
xcrun notarytool info <id> --keychain-profile "Profile"

# Staple
xcrun stapler staple MyApp.app
```

## Related Skills

- `macos-entitlements-generator`
- `macos-codesign-workflow`

## Related Agents

- `swiftui-macos-expert`
- `code-signing-specialist`
