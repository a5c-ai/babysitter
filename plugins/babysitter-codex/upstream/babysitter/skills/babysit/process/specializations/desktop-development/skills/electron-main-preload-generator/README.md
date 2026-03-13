# electron-main-preload-generator

Generate secure Electron main process and preload scripts with proper context isolation and IPC patterns.

## Overview

This skill creates production-ready Electron main process and preload script boilerplate that follows security best practices. It handles context isolation, IPC channel whitelisting, permission handling, and Content Security Policy configuration.

## Quick Start

### Basic Usage

```javascript
const result = await invokeSkill('electron-main-preload-generator', {
  projectPath: '/path/to/electron-app',
  language: 'typescript',
  features: ['contextIsolation', 'sandbox', 'csp', 'ipcChannels']
});
```

### With Custom IPC Channels

```javascript
const result = await invokeSkill('electron-main-preload-generator', {
  projectPath: '/path/to/electron-app',
  language: 'typescript',
  ipcChannels: [
    {
      name: 'save-document',
      direction: 'toMain',
      description: 'Save document to filesystem',
      requestSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          content: { type: 'string' }
        }
      },
      responseSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          path: { type: 'string' }
        }
      }
    },
    {
      name: 'file-changed',
      direction: 'toRenderer',
      description: 'Notify renderer of file system changes'
    }
  ],
  windowConfig: {
    width: 1400,
    height: 900,
    titleBarStyle: 'hiddenInset'
  }
});
```

## Features

### Security Features

| Feature | Description | Default |
|---------|-------------|---------|
| Context Isolation | Isolate preload from renderer | Enabled |
| Sandbox | Enable Chromium sandbox | Enabled |
| CSP | Content Security Policy headers | Enabled |
| IPC Whitelisting | Only allow defined channels | Enabled |
| Permission Handler | Control API permissions | Enabled |
| Navigation Guard | Restrict navigation | Enabled |

### Generated Files

```
src/
  main/
    main.ts                 # Main process entry
    ipc-handlers.ts         # IPC handler implementations
    permission-handler.ts   # Permission request handling
    csp.ts                  # CSP configuration
  preload/
    preload.ts              # Secure preload script
    api.ts                  # Exposed API surface
  shared/
    ipc-channels.ts         # Channel definitions
    types.ts                # TypeScript types
```

## IPC Patterns

### Request/Response (invoke/handle)

```typescript
// Main process
ipcMain.handle('get-user-data', async (event, userId: string) => {
  // Validate input
  if (typeof userId !== 'string' || !userId.match(/^[a-z0-9-]+$/)) {
    throw new Error('Invalid user ID');
  }

  return await getUserFromDatabase(userId);
});

// Renderer (via preload)
const userData = await window.electronAPI.invoke('get-user-data', userId);
```

### One-Way (send/on)

```typescript
// Main process
mainWindow.webContents.send('update-progress', { percent: 50 });

// Renderer (via preload)
window.electronAPI.on('update-progress', (data) => {
  updateProgressBar(data.percent);
});
```

### Bidirectional with Subscription

```typescript
// Renderer subscribes
const unsubscribe = window.electronAPI.on('file-changes', (changes) => {
  handleFileChanges(changes);
});

// Later, unsubscribe
unsubscribe();
```

## Configuration Options

### Window Configuration

```javascript
windowConfig: {
  width: 1200,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  frame: true,              // Set false for frameless
  transparent: false,       // For custom window shapes
  titleBarStyle: 'default', // macOS: hidden, hiddenInset
  vibrancy: 'sidebar'       // macOS vibrancy effect
}
```

### CSP Policy

```javascript
cspPolicy: {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],  // Required for some UI frameworks
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: ["'self'", 'https://api.example.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  mediaSrc: ["'self'"],
  objectSrc: ["'none'"],
  frameSrc: ["'none'"]
}
```

## Security Best Practices

### DO

- Use `contextBridge.exposeInMainWorld()` for all renderer API
- Whitelist IPC channels explicitly
- Validate all IPC data in main process
- Use `invoke`/`handle` for request/response patterns
- Implement permission handlers for sensitive APIs
- Set strict CSP headers

### DON'T

- Enable `nodeIntegration` in production
- Disable `contextIsolation`
- Expose `ipcRenderer` directly to renderer
- Use `remote` module (deprecated)
- Trust renderer process data without validation
- Allow navigation to arbitrary URLs

## Common Use Cases

### File System Access

```typescript
// Preload - expose safe file operations
contextBridge.exposeInMainWorld('fileAPI', {
  readFile: (path: string) => ipcRenderer.invoke('fs:read', path),
  writeFile: (path: string, content: string) =>
    ipcRenderer.invoke('fs:write', { path, content }),
  selectFile: () => ipcRenderer.invoke('dialog:open-file'),
});

// Main - validate and execute
ipcMain.handle('fs:read', async (event, filePath) => {
  // Validate path is within allowed directories
  if (!isPathAllowed(filePath)) {
    throw new Error('Access denied');
  }
  return fs.promises.readFile(filePath, 'utf-8');
});
```

### System Tray Integration

```typescript
// Generated with tray feature enabled
import { Tray, Menu, nativeImage } from 'electron';

let tray: Tray | null = null;

function createTray(mainWindow: BrowserWindow) {
  const icon = nativeImage.createFromPath('assets/tray-icon.png');
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setToolTip('My Application');
  tray.setContextMenu(contextMenu);
}
```

### Deep Linking

```typescript
// Generated with deepLinking feature enabled
const PROTOCOL = 'myapp';

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
      path.resolve(process.argv[1])
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});
```

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `window.electronAPI` undefined | Preload not loading | Check preload path in webPreferences |
| CSP blocking scripts | Strict CSP | Add hashes or adjust policy |
| IPC not working | Channel not whitelisted | Add channel to VALID_CHANNELS |
| Permissions denied | Permission handler blocking | Update permission handler logic |

### Debug Mode

```typescript
// Enable dev tools in development
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
}

// Log IPC messages
ipcMain.on('*', (event, ...args) => {
  console.log('IPC:', event.type, args);
});
```

## Examples

See `examples/` directory:

- `basic/` - Minimal secure setup
- `with-filesystem/` - File system operations
- `multi-window/` - Window management
- `deep-linking/` - Custom protocol handling

## References

- [Electron Security Documentation](https://www.electronjs.org/docs/latest/tutorial/security)
- [Context Isolation Explained](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [IPC Communication](https://www.electronjs.org/docs/latest/tutorial/ipc)

## Related Skills

- `electron-builder-config`
- `electron-ipc-security-audit`
- `electron-auto-updater-setup`

## Version History

- **1.0.0** - Initial release with core security features
- **1.1.0** - Added TypeScript support and IPC types generation
- **1.2.0** - Added multi-window and deep linking support
