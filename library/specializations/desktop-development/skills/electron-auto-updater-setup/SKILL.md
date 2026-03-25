---
name: electron-auto-updater-setup
description: Configure electron-updater with code signing verification, delta updates, staged rollouts, and multiple update channels for Electron applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [electron, desktop, auto-update, deployment, releases]
---

# electron-auto-updater-setup

Configure electron-updater for Electron applications with advanced features including code signing verification, delta updates, staged rollouts, and multiple release channels. This skill creates a complete auto-update infrastructure.

## Capabilities

- Configure electron-updater with multiple providers (GitHub, S3, Generic, Spaces)
- Set up staged rollouts with percentage-based distribution
- Configure delta (differential) updates for efficient bandwidth usage
- Implement multiple release channels (stable, beta, alpha)
- Set up code signing verification for update packages
- Create update notification UI components
- Configure silent updates vs. interactive updates
- Implement rollback mechanisms

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Electron project root"
    },
    "provider": {
      "type": "object",
      "properties": {
        "type": { "enum": ["github", "s3", "generic", "spaces", "keygen"] },
        "config": {
          "type": "object",
          "description": "Provider-specific configuration"
        }
      },
      "required": ["type"]
    },
    "channels": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "default": { "type": "boolean" },
          "allowDowngrade": { "type": "boolean" }
        }
      },
      "default": [{ "name": "latest", "default": true }]
    },
    "features": {
      "type": "object",
      "properties": {
        "deltaUpdates": { "type": "boolean", "default": true },
        "stagedRollout": { "type": "boolean", "default": false },
        "silentUpdate": { "type": "boolean", "default": false },
        "autoInstallOnQuit": { "type": "boolean", "default": true },
        "forceDevUpdateConfig": { "type": "boolean", "default": false }
      }
    },
    "stagedRollout": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "initialPercentage": { "type": "number", "default": 10 },
        "incrementStep": { "type": "number", "default": 20 },
        "incrementInterval": { "type": "string", "default": "24h" }
      }
    },
    "ui": {
      "type": "object",
      "properties": {
        "generateComponents": { "type": "boolean", "default": true },
        "framework": { "enum": ["react", "vue", "svelte", "vanilla"] },
        "notifications": { "type": "boolean", "default": true }
      }
    }
  },
  "required": ["projectPath", "provider"]
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
          "type": { "enum": ["config", "main", "ui", "ipc", "utils"] }
        }
      }
    },
    "electronBuilderConfig": {
      "type": "object",
      "description": "electron-builder publish configuration to merge"
    },
    "envVariables": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "description": { "type": "string" },
          "required": { "type": "boolean" }
        }
      }
    },
    "testCommands": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["success", "files"]
}
```

## Generated File Structure

```
src/
  main/
    updater/
      auto-updater.ts      # Main updater logic
      update-channels.ts   # Channel management
      staged-rollout.ts    # Staged rollout logic
      delta-updates.ts     # Delta update handling
  preload/
    updater-api.ts         # Exposed updater API
  renderer/
    components/
      UpdateNotification/  # UI components
        UpdateNotification.tsx
        UpdateProgress.tsx
        ReleaseNotes.tsx
  shared/
    update-types.ts        # TypeScript types
```

## Code Templates

### Main Auto-Updater Module

```typescript
import { autoUpdater, UpdateInfo } from 'electron-updater';
import { app, BrowserWindow, ipcMain } from 'electron';
import log from 'electron-log';

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Disable auto download - we control the flow
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

export class AppUpdater {
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupEventHandlers();
    this.setupIpcHandlers();
  }

  private setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      this.sendToRenderer('update-status', { status: 'checking' });
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.sendToRenderer('update-status', {
        status: 'available',
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate,
      });
    });

    autoUpdater.on('update-not-available', () => {
      this.sendToRenderer('update-status', { status: 'not-available' });
    });

    autoUpdater.on('download-progress', (progress) => {
      this.sendToRenderer('update-progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      });
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.sendToRenderer('update-status', {
        status: 'downloaded',
        version: info.version,
      });
    });

    autoUpdater.on('error', (error) => {
      this.sendToRenderer('update-status', {
        status: 'error',
        error: error.message,
      });
    });
  }

  private setupIpcHandlers() {
    ipcMain.handle('updater:check', async () => {
      return autoUpdater.checkForUpdates();
    });

    ipcMain.handle('updater:download', async () => {
      return autoUpdater.downloadUpdate();
    });

    ipcMain.handle('updater:install', () => {
      autoUpdater.quitAndInstall(false, true);
    });

    ipcMain.handle('updater:set-channel', async (_, channel: string) => {
      autoUpdater.channel = channel;
      return autoUpdater.checkForUpdates();
    });
  }

  private sendToRenderer(channel: string, data: unknown) {
    this.mainWindow?.webContents.send(channel, data);
  }

  async checkForUpdates() {
    return autoUpdater.checkForUpdates();
  }
}
```

### Staged Rollout Implementation

```typescript
import { machineIdSync } from 'node-machine-id';
import crypto from 'crypto';

export class StagedRollout {
  private machineId: string;
  private rolloutPercentage: number;

  constructor() {
    this.machineId = machineIdSync();
    this.rolloutPercentage = 100; // Full rollout by default
  }

  /**
   * Deterministically decide if this machine should receive the update
   * based on a hash of the machine ID
   */
  shouldReceiveUpdate(version: string, rolloutPercentage: number): boolean {
    const hash = crypto
      .createHash('sha256')
      .update(`${this.machineId}:${version}`)
      .digest('hex');

    // Convert first 8 hex chars to number (0 to 4294967295)
    const hashNumber = parseInt(hash.substring(0, 8), 16);

    // Normalize to 0-100
    const bucket = (hashNumber / 0xffffffff) * 100;

    return bucket < rolloutPercentage;
  }

  async fetchRolloutConfig(updateServerUrl: string, version: string) {
    try {
      const response = await fetch(
        `${updateServerUrl}/rollout/${version}`
      );
      const config = await response.json();
      return config.percentage || 100;
    } catch {
      return 100; // Default to full rollout on error
    }
  }
}
```

### Multi-Channel Support

```typescript
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';

const store = new Store();

export const UPDATE_CHANNELS = ['stable', 'beta', 'alpha'] as const;
export type UpdateChannel = typeof UPDATE_CHANNELS[number];

export function getUpdateChannel(): UpdateChannel {
  return store.get('updateChannel', 'stable') as UpdateChannel;
}

export function setUpdateChannel(channel: UpdateChannel) {
  if (!UPDATE_CHANNELS.includes(channel)) {
    throw new Error(`Invalid channel: ${channel}`);
  }

  store.set('updateChannel', channel);
  autoUpdater.channel = channel;

  // Optionally check for updates immediately
  autoUpdater.checkForUpdates();
}

export function initializeUpdateChannel() {
  const channel = getUpdateChannel();
  autoUpdater.channel = channel;

  // For beta/alpha, allow downgrade if switching channels
  autoUpdater.allowDowngrade = channel !== 'stable';
}
```

### Update UI Component (React)

```tsx
import React, { useEffect, useState } from 'react';

interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseNotes?: string;
  error?: string;
}

interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export function UpdateNotification() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);

  useEffect(() => {
    const unsubStatus = window.electronAPI.on('update-status', setStatus);
    const unsubProgress = window.electronAPI.on('update-progress', setProgress);

    return () => {
      unsubStatus();
      unsubProgress();
    };
  }, []);

  const handleDownload = () => {
    window.electronAPI.invoke('updater:download');
  };

  const handleInstall = () => {
    window.electronAPI.invoke('updater:install');
  };

  if (!status || status.status === 'not-available') return null;

  return (
    <div className="update-notification">
      {status.status === 'available' && (
        <div className="update-available">
          <p>Version {status.version} is available!</p>
          <button onClick={handleDownload}>Download</button>
        </div>
      )}

      {status.status === 'downloading' && progress && (
        <div className="update-progress">
          <p>Downloading update...</p>
          <progress value={progress.percent} max={100} />
          <span>{Math.round(progress.percent)}%</span>
        </div>
      )}

      {status.status === 'downloaded' && (
        <div className="update-ready">
          <p>Update ready to install!</p>
          <button onClick={handleInstall}>Restart & Install</button>
        </div>
      )}

      {status.status === 'error' && (
        <div className="update-error">
          <p>Update error: {status.error}</p>
        </div>
      )}
    </div>
  );
}
```

## Provider Configurations

### GitHub Releases

```yaml
# electron-builder.yml
publish:
  provider: github
  owner: your-org
  repo: your-repo
  releaseType: release  # or 'draft', 'prerelease'
  private: false
```

### Amazon S3

```yaml
publish:
  provider: s3
  bucket: your-bucket
  region: us-east-1
  acl: public-read
  path: /releases/${os}/${arch}
```

### Generic Server

```yaml
publish:
  provider: generic
  url: https://updates.example.com/releases
  channel: latest
```

### DigitalOcean Spaces

```yaml
publish:
  provider: spaces
  name: your-space
  region: nyc3
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GH_TOKEN` | GitHub personal access token | For GitHub provider |
| `AWS_ACCESS_KEY_ID` | AWS access key | For S3 provider |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | For S3 provider |
| `DO_SPACES_KEY` | DigitalOcean Spaces key | For Spaces provider |
| `DO_SPACES_SECRET` | DigitalOcean Spaces secret | For Spaces provider |

## Testing Auto-Updates

```bash
# Test update flow locally
DEBUG=electron-updater npm run dev

# Force update check in development
ELECTRON_FORCE_DEV_UPDATE_CONFIG=true npm run dev

# Simulate specific version
npm run build -- --publish never
```

## Best Practices

1. **Always sign updates** - Verify code signatures before installing
2. **Use delta updates** - Reduce bandwidth for large applications
3. **Implement staged rollouts** - Catch issues before full deployment
4. **Provide release notes** - Users appreciate knowing what changed
5. **Test rollback scenarios** - Ensure users can recover from bad updates
6. **Monitor update analytics** - Track adoption rates and failures

## Community References

- [Electron Distribution & Auto-Update Skill](https://mcpmarket.com/tools/skills/electron-distribution-auto-update)
- [electron-updater Documentation](https://www.electron.build/auto-update)
- [electron-scaffold Skill](https://claude-plugins.dev/skills/@chrisvoncsefalvay/claude-skills/electron-scaffold)

## Related Skills

- `electron-builder-config` - Build configuration
- `electron-main-preload-generator` - Main/preload scripts
- `sentry-desktop-setup` - Crash reporting for update issues

## Related Agents

- `electron-architect` - Electron best practices
- `release-manager` - Release coordination
