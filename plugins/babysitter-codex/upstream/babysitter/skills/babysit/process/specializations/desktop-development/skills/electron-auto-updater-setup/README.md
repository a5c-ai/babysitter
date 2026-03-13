# electron-auto-updater-setup

Configure electron-updater for Electron applications with advanced update features.

## Overview

This skill sets up a complete auto-update infrastructure for Electron applications using electron-updater. It supports multiple update providers, staged rollouts, delta updates, and multiple release channels.

## Quick Start

### Basic GitHub Releases Setup

```javascript
const result = await invokeSkill('electron-auto-updater-setup', {
  projectPath: '/path/to/electron-app',
  provider: {
    type: 'github',
    config: {
      owner: 'my-org',
      repo: 'my-app'
    }
  }
});
```

### With Multiple Channels and Staged Rollout

```javascript
const result = await invokeSkill('electron-auto-updater-setup', {
  projectPath: '/path/to/electron-app',
  provider: {
    type: 'github',
    config: {
      owner: 'my-org',
      repo: 'my-app'
    }
  },
  channels: [
    { name: 'stable', default: true },
    { name: 'beta', allowDowngrade: true },
    { name: 'alpha', allowDowngrade: true }
  ],
  features: {
    deltaUpdates: true,
    stagedRollout: true,
    autoInstallOnQuit: true
  },
  stagedRollout: {
    enabled: true,
    initialPercentage: 10,
    incrementStep: 20,
    incrementInterval: '24h'
  },
  ui: {
    generateComponents: true,
    framework: 'react'
  }
});
```

## Features

### Update Providers

| Provider | Use Case | Configuration |
|----------|----------|---------------|
| GitHub | Open source, public repos | `GH_TOKEN` env variable |
| S3 | Self-hosted, private | AWS credentials |
| Generic | Custom server | Server URL |
| Spaces | DigitalOcean hosting | DO credentials |
| Keygen | License-gated updates | Keygen API key |

### Release Channels

Support multiple release channels for different user segments:

- **Stable** - Production releases for all users
- **Beta** - Pre-release testing with opt-in users
- **Alpha** - Early access for internal testers

```typescript
// Users can switch channels in settings
window.electronAPI.invoke('updater:set-channel', 'beta');
```

### Delta Updates

Reduce download size by only downloading changed files:

```yaml
# electron-builder.yml
nsis:
  differentialPackage: true
mac:
  target:
    - target: dmg
    - target: zip  # Required for delta updates
```

### Staged Rollouts

Gradually roll out updates to detect issues early:

```typescript
// Server-side rollout configuration
{
  version: "2.0.0",
  rolloutPercentage: 10,  // Start with 10%
  schedule: [
    { percentage: 25, after: "24h" },
    { percentage: 50, after: "48h" },
    { percentage: 100, after: "72h" }
  ]
}
```

## Generated Files

```
src/
  main/updater/
    auto-updater.ts       # Main updater class
    update-channels.ts    # Channel management
    staged-rollout.ts     # Rollout logic
  preload/
    updater-api.ts        # IPC bridge for updates
  renderer/components/
    UpdateNotification/   # React/Vue/Svelte components
```

## Update Flow

```
┌─────────────────┐
│ Check for Update│
└────────┬────────┘
         │
    ┌────▼────┐
    │ Update  │ No
    │Available├──────► Done
    └────┬────┘
         │ Yes
    ┌────▼────┐
    │ Show    │
    │ Dialog  │
    └────┬────┘
         │ User confirms
    ┌────▼────┐
    │Download │
    │ Update  │
    └────┬────┘
         │
    ┌────▼────┐
    │Verify   │
    │Signature│
    └────┬────┘
         │ Valid
    ┌────▼────┐
    │Install  │
    │On Quit  │
    └─────────┘
```

## UI Components

### React Component

```tsx
import { UpdateNotification } from './components/UpdateNotification';

function App() {
  return (
    <div>
      <UpdateNotification />
      {/* Rest of app */}
    </div>
  );
}
```

### Vue Component

```vue
<template>
  <update-notification v-if="updateAvailable" @install="installUpdate" />
</template>

<script setup>
import { useAutoUpdater } from '@/composables/useAutoUpdater';
const { updateAvailable, installUpdate } = useAutoUpdater();
</script>
```

## Configuration Options

### Silent Updates

```typescript
// Update silently in background
features: {
  silentUpdate: true,
  autoInstallOnQuit: true
}
```

### Custom Update Server

```javascript
provider: {
  type: 'generic',
  config: {
    url: 'https://updates.mycompany.com',
    useMultipleRangeRequest: true
  }
}
```

### Private GitHub Repo

```javascript
provider: {
  type: 'github',
  config: {
    owner: 'my-org',
    repo: 'my-private-app',
    private: true,
    token: process.env.GH_TOKEN
  }
}
```

## Testing Updates

### Local Development

```bash
# Enable dev update config
export ELECTRON_FORCE_DEV_UPDATE_CONFIG=true

# Run with debug logging
DEBUG=electron-updater npm run dev
```

### Test Update Flow

1. Build version 1.0.0 and install
2. Build version 1.0.1 and publish to provider
3. Run version 1.0.0 and trigger update check
4. Verify download, signature check, and installation

### Mock Update Server

```javascript
// test/mock-update-server.js
const express = require('express');
const app = express();

app.get('/latest.yml', (req, res) => {
  res.send(`
    version: 2.0.0
    files:
      - url: app-2.0.0.exe
        sha512: abc123...
    releaseDate: 2026-01-24
  `);
});

app.listen(5000);
```

## Security Considerations

### Code Signing Verification

electron-updater automatically verifies code signatures:

- **Windows**: Authenticode signature must match publisher
- **macOS**: Code signature must be valid and notarized
- **Linux**: Optional GPG signature verification

### Signature Bypass Prevention

```typescript
// NEVER do this in production
autoUpdater.requestHeaders = { 'Cache-Control': 'no-cache' };

// DO verify signatures
// electron-updater does this automatically when properly configured
```

### Update Server Security

- Use HTTPS only
- Implement rate limiting
- Validate authentication tokens
- Log all update requests

## Monitoring

### Analytics Events

```typescript
autoUpdater.on('update-downloaded', (info) => {
  analytics.track('update_downloaded', {
    fromVersion: app.getVersion(),
    toVersion: info.version,
    channel: autoUpdater.channel
  });
});
```

### Error Tracking

```typescript
autoUpdater.on('error', (error) => {
  Sentry.captureException(error, {
    tags: { component: 'auto-updater' }
  });
});
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Update not found | Wrong channel | Check `autoUpdater.channel` |
| Download fails | Network/server | Check URLs and connectivity |
| Signature invalid | Wrong certificate | Rebuild with correct signing |
| Install fails | Permission issues | Check installer privileges |
| Rollout not working | Hash mismatch | Verify machine ID generation |

## Environment Variables

```bash
# Required for GitHub private repos
GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Required for S3
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Optional: Force dev config for testing
ELECTRON_FORCE_DEV_UPDATE_CONFIG=true
```

## References

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [Code Signing Guide](https://www.electron.build/code-signing)
- [Publishing Configuration](https://www.electron.build/configuration/publish)

## Related Skills

- `electron-builder-config`
- `electron-main-preload-generator`
- `sentry-desktop-setup`

## Version History

- **1.0.0** - Initial release with basic auto-update
- **1.1.0** - Added staged rollout support
- **1.2.0** - Added UI component generation
- **1.3.0** - Added multi-channel support
