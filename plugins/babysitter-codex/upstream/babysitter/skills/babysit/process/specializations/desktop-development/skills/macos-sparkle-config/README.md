# macos-sparkle-config

Configure Sparkle framework for macOS auto-updates.

## Overview

This skill sets up Sparkle 2.x for macOS applications with appcast feeds, EdDSA signing, and delta updates.

## Quick Start

```javascript
const result = await invokeSkill('macos-sparkle-config', {
  projectPath: '/path/to/project',
  appcastUrl: 'https://yourserver.com/appcast.xml',
  signUpdates: true,
  deltaUpdates: true
});
```

## Features

- Sparkle 2.x integration
- EdDSA update signing
- Delta updates
- Custom update UI
- Sandboxed app support (XPC)

## Related Skills

- `macos-notarization-workflow`
- `auto-update-system` process
