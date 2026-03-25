---
name: electron-main-preload-generator
description: Generate secure main process and preload script boilerplate with proper context isolation, IPC patterns, and security best practices for Electron applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [electron, desktop, security, ipc, preload]
---

# electron-main-preload-generator

Generate secure Electron main process and preload scripts with proper context isolation, secure IPC patterns, and comprehensive security best practices. This skill creates production-ready boilerplate that follows Electron security guidelines.

## Capabilities

- Generate secure main process (`main.js`/`main.ts`) with proper window configuration
- Create preload scripts with context-isolated IPC bridge
- Implement secure IPC patterns with channel whitelisting
- Configure Content Security Policy (CSP) headers
- Set up secure BrowserWindow options with sandbox enabled
- Generate TypeScript type definitions for IPC channels
- Implement permission handlers for sensitive APIs

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Electron project root"
    },
    "language": {
      "enum": ["javascript", "typescript"],
      "default": "typescript"
    },
    "features": {
      "type": "array",
      "items": {
        "enum": [
          "contextIsolation",
          "sandbox",
          "csp",
          "ipcChannels",
          "permissionHandler",
          "protocolHandler",
          "deepLinking",
          "autoUpdater",
          "tray",
          "multiWindow"
        ]
      },
      "default": ["contextIsolation", "sandbox", "csp", "ipcChannels"]
    },
    "ipcChannels": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "direction": { "enum": ["toMain", "toRenderer", "bidirectional"] },
          "description": { "type": "string" },
          "requestSchema": { "type": "object" },
          "responseSchema": { "type": "object" }
        },
        "required": ["name", "direction"]
      },
      "description": "Define IPC channels for the application"
    },
    "windowConfig": {
      "type": "object",
      "properties": {
        "width": { "type": "number", "default": 1200 },
        "height": { "type": "number", "default": 800 },
        "minWidth": { "type": "number" },
        "minHeight": { "type": "number" },
        "frame": { "type": "boolean", "default": true },
        "transparent": { "type": "boolean", "default": false },
        "titleBarStyle": { "enum": ["default", "hidden", "hiddenInset", "customButtonsOnHover"] }
      }
    },
    "cspPolicy": {
      "type": "object",
      "properties": {
        "defaultSrc": { "type": "array", "items": { "type": "string" } },
        "scriptSrc": { "type": "array", "items": { "type": "string" } },
        "styleSrc": { "type": "array", "items": { "type": "string" } },
        "imgSrc": { "type": "array", "items": { "type": "string" } },
        "connectSrc": { "type": "array", "items": { "type": "string" } }
      }
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
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "type": { "enum": ["main", "preload", "types", "utils"] },
          "description": { "type": "string" }
        }
      }
    },
    "securityChecklist": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "check": { "type": "string" },
          "status": { "enum": ["implemented", "recommended", "optional"] },
          "details": { "type": "string" }
        }
      }
    },
    "warnings": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["success", "files"]
}
```

## Usage Instructions

1. **Analyze existing project**: Check for existing main/preload files and framework usage
2. **Determine security requirements**: Based on application features and data sensitivity
3. **Generate main process**: Create secure BrowserWindow configuration
4. **Generate preload script**: Implement context-isolated IPC bridge
5. **Generate type definitions**: If TypeScript, create IPC channel types
6. **Validate security**: Run security checklist

## Generated File Structure

```
src/
  main/
    main.ts              # Main process entry point
    ipc-handlers.ts      # IPC handler implementations
    window-manager.ts    # Multi-window management (optional)
    protocol-handler.ts  # Custom protocol registration (optional)
    permission-handler.ts # Permission request handling
  preload/
    preload.ts           # Preload script with contextBridge
    api.ts               # Exposed API definitions
  shared/
    ipc-channels.ts      # IPC channel definitions
    types.ts             # Shared TypeScript types
```

## Code Templates

### Secure Main Process

```typescript
import { app, BrowserWindow, session, ipcMain } from 'electron';
import path from 'path';

// Security: Disable remote module (deprecated but check)
app.disableHardwareAcceleration(); // Optional: for headless environments

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Security settings
      nodeIntegration: false,        // Never enable in production
      contextIsolation: true,        // Always enable
      sandbox: true,                 // Enable sandbox
      webSecurity: true,             // Keep enabled
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        ]
      }
    });
  });

  // Permission handling
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['clipboard-read', 'notifications'];
    callback(allowedPermissions.includes(permission));
  });

  return mainWindow;
}
```

### Secure Preload Script

```typescript
import { contextBridge, ipcRenderer } from 'electron';

// Define allowed channels
const VALID_CHANNELS = {
  toMain: ['save-file', 'open-dialog', 'app-settings'],
  fromMain: ['file-saved', 'update-available', 'settings-changed'],
} as const;

type ToMainChannel = typeof VALID_CHANNELS.toMain[number];
type FromMainChannel = typeof VALID_CHANNELS.fromMain[number];

// Expose protected methods via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // Send to main process (one-way)
  send: (channel: ToMainChannel, data: unknown) => {
    if (VALID_CHANNELS.toMain.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Invoke main process and wait for response
  invoke: async <T>(channel: ToMainChannel, data?: unknown): Promise<T> => {
    if (VALID_CHANNELS.toMain.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    throw new Error(`Invalid channel: ${channel}`);
  },

  // Subscribe to main process events
  on: (channel: FromMainChannel, callback: (...args: unknown[]) => void) => {
    if (VALID_CHANNELS.fromMain.includes(channel)) {
      const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
        callback(...args);
      ipcRenderer.on(channel, subscription);

      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    return () => {};
  },

  // One-time listener
  once: (channel: FromMainChannel, callback: (...args: unknown[]) => void) => {
    if (VALID_CHANNELS.fromMain.includes(channel)) {
      ipcRenderer.once(channel, (_event, ...args) => callback(...args));
    }
  },
});
```

### TypeScript Type Definitions

```typescript
// types/electron-api.d.ts
export interface ElectronAPI {
  send: (channel: string, data: unknown) => void;
  invoke: <T>(channel: string, data?: unknown) => Promise<T>;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
  once: (channel: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

## Security Checklist

| Security Measure | Status | Details |
|-----------------|--------|---------|
| Context Isolation | Required | Always set `contextIsolation: true` |
| Node Integration | Required | Always set `nodeIntegration: false` |
| Sandbox | Recommended | Set `sandbox: true` for renderer |
| Web Security | Required | Never disable `webSecurity` |
| CSP Headers | Recommended | Strict Content Security Policy |
| Remote Module | Required | Ensure `enableRemoteModule: false` |
| IPC Validation | Required | Whitelist and validate all IPC channels |
| Protocol Handlers | Recommended | Register custom protocols securely |
| Permission Handler | Recommended | Control permission requests |
| Navigation Guard | Recommended | Restrict navigation to trusted origins |

## Best Practices

1. **Never expose `ipcRenderer` directly** - Always use channel whitelisting
2. **Validate all IPC data** - Sanitize inputs in main process handlers
3. **Use invoke/handle pattern** - For request/response communication
4. **Minimize exposed API surface** - Only expose what's necessary
5. **Audit preload scripts regularly** - Check for security vulnerabilities
6. **Keep Electron updated** - Security patches are frequent

## Community References

- [electron-scaffold skill](https://claude-plugins.dev/skills/@chrisvoncsefalvay/claude-skills/electron-scaffold)
- [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security)
- [Electron Official CLAUDE.md](https://github.com/electron/electron/blob/main/CLAUDE.md)
- [electron-pro subagent](https://github.com/VoltAgent/awesome-claude-code-subagents)

## Related Skills

- `electron-builder-config` - Build configuration
- `electron-ipc-security-audit` - Audit IPC implementations
- `electron-auto-updater-setup` - Auto-update configuration

## Related Agents

- `electron-architect` - Electron architecture expertise
- `desktop-security-auditor` - Security auditing
