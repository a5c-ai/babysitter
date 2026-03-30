---
name: macos-sparkle-config
description: Configure Sparkle framework for macOS auto-updates with appcast, delta updates, and code signing
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [macos, sparkle, autoupdate, distribution, swift]
---

# macos-sparkle-config

Configure Sparkle framework for macOS auto-updates. This skill sets up appcast feeds, delta updates, EdDSA signing, and update UI customization.

## Capabilities

- Integrate Sparkle 2.x framework
- Generate appcast.xml feeds
- Configure EdDSA signing for updates
- Set up delta updates
- Customize update UI
- Configure update check intervals
- Generate release publishing scripts
- Configure sandboxed app support (XPC)

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "appcastUrl": { "type": "string" },
    "signUpdates": { "type": "boolean", "default": true },
    "deltaUpdates": { "type": "boolean", "default": true },
    "checkInterval": { "type": "number", "default": 86400 }
  },
  "required": ["projectPath", "appcastUrl"]
}
```

## Configuration

```swift
// In App Delegate or SwiftUI App
import Sparkle

class AppDelegate: NSObject, NSApplicationDelegate {
    let updaterController = SPUStandardUpdaterController(
        startingUpdater: true,
        updaterDelegate: nil,
        userDriverDelegate: nil
    )
}

// Info.plist
// SUFeedURL: https://yourserver.com/appcast.xml
// SUPublicEDKey: your-public-ed25519-key
```

## Appcast Generation

```bash
# Generate appcast
./bin/generate_appcast ./releases/

# Sign update
./bin/sign_update MyApp-1.0.0.zip
```

## Related Skills

- `macos-notarization-workflow`
- `auto-update-system` process
