---
name: electron-protocol-handler-setup
description: Register and handle custom URL protocols (deep linking) across platforms for Electron applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [electron, deep-linking, protocol-handler, url-scheme, desktop]
---

# electron-protocol-handler-setup

Register and handle custom URL protocols (deep linking) for Electron applications across Windows, macOS, and Linux. This skill enables apps to respond to custom URL schemes like `myapp://` for deep linking and inter-application communication.

## Capabilities

- Register custom protocol handlers at OS level
- Handle protocol URLs in running application
- Configure electron-builder for protocol registration
- Implement secure URL parsing and validation
- Handle protocol activation on app launch
- Support single-instance enforcement with protocol handling
- Generate platform-specific registration scripts
- Test protocol handling in development

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Electron project root"
    },
    "protocols": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "scheme": { "type": "string", "description": "Protocol scheme (e.g., 'myapp')" },
          "name": { "type": "string", "description": "Human-readable name" },
          "role": { "enum": ["Viewer", "Editor", "Shell", "None"], "default": "Viewer" }
        },
        "required": ["scheme", "name"]
      }
    },
    "singleInstance": {
      "type": "boolean",
      "description": "Enforce single instance with protocol relay",
      "default": true
    },
    "securityOptions": {
      "type": "object",
      "properties": {
        "validateUrls": { "type": "boolean", "default": true },
        "allowedHosts": { "type": "array", "items": { "type": "string" } },
        "sanitizeParams": { "type": "boolean", "default": true }
      }
    },
    "targetPlatforms": {
      "type": "array",
      "items": { "enum": ["win32", "darwin", "linux"] }
    }
  },
  "required": ["projectPath", "protocols"]
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
          "description": { "type": "string" }
        }
      }
    },
    "configuration": {
      "type": "object",
      "properties": {
        "electronBuilder": { "type": "object" },
        "packageJson": { "type": "object" }
      }
    },
    "testUrls": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["success"]
}
```

## Platform Registration

### macOS (Info.plist)

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>My App Protocol</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>myapp</string>
    </array>
  </dict>
</array>
```

### Windows (Registry)

```json
// electron-builder.yml
nsis:
  perMachine: true
  include: "installer.nsh"
```

```nsis
; installer.nsh
!macro customInstall
  WriteRegStr HKCU "Software\Classes\myapp" "" "URL:My App Protocol"
  WriteRegStr HKCU "Software\Classes\myapp" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\myapp\shell\open\command" "" '"$INSTDIR\MyApp.exe" "%1"'
!macroend
```

### Linux (Desktop Entry)

```ini
[Desktop Entry]
Name=My App
Exec=/opt/myapp/myapp %u
Type=Application
MimeType=x-scheme-handler/myapp;
```

## Implementation

### Protocol Handler Class

```javascript
// protocol-handler.js
const { app, shell } = require('electron');
const url = require('url');

class ProtocolHandler {
  constructor(mainWindow, options = {}) {
    this.mainWindow = mainWindow;
    this.scheme = options.scheme || 'myapp';
    this.allowedHosts = options.allowedHosts || [];
    this.handlers = new Map();
  }

  register() {
    // Set as default protocol client
    if (process.defaultApp) {
      // Development: register with path to electron
      app.setAsDefaultProtocolClient(this.scheme, process.execPath, [
        path.resolve(process.argv[1])
      ]);
    } else {
      // Production
      app.setAsDefaultProtocolClient(this.scheme);
    }
  }

  unregister() {
    app.removeAsDefaultProtocolClient(this.scheme);
  }

  handleUrl(protocolUrl) {
    if (!this.validateUrl(protocolUrl)) {
      console.error('Invalid protocol URL:', protocolUrl);
      return;
    }

    const parsed = url.parse(protocolUrl, true);
    const route = parsed.host || parsed.pathname?.slice(2);
    const params = parsed.query;

    // Dispatch to registered handler
    const handler = this.handlers.get(route);
    if (handler) {
      handler(params, parsed);
    } else {
      console.warn('No handler for route:', route);
    }

    // Focus window
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
    }
  }

  validateUrl(protocolUrl) {
    try {
      const parsed = url.parse(protocolUrl);

      // Check scheme
      if (parsed.protocol !== `${this.scheme}:`) {
        return false;
      }

      // Check allowed hosts if configured
      if (this.allowedHosts.length > 0 && parsed.host) {
        if (!this.allowedHosts.includes(parsed.host)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  on(route, handler) {
    this.handlers.set(route, handler);
  }
}

module.exports = ProtocolHandler;
```

### Main Process Integration

```javascript
// main.js
const { app } = require('electron');
const ProtocolHandler = require('./protocol-handler');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  let mainWindow;
  let protocolHandler;

  app.on('second-instance', (event, commandLine) => {
    // Someone tried to run a second instance
    // Handle protocol URL from command line (Windows)
    const url = commandLine.find(arg => arg.startsWith('myapp://'));
    if (url) {
      protocolHandler.handleUrl(url);
    }

    // Focus existing window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // macOS: Handle protocol URL
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (protocolHandler) {
      protocolHandler.handleUrl(url);
    }
  });

  app.whenReady().then(() => {
    mainWindow = createWindow();

    protocolHandler = new ProtocolHandler(mainWindow, {
      scheme: 'myapp',
      allowedHosts: ['open', 'auth', 'share']
    });

    protocolHandler.register();

    // Register route handlers
    protocolHandler.on('open', (params) => {
      mainWindow.webContents.send('protocol:open', params);
    });

    protocolHandler.on('auth', (params) => {
      handleOAuthCallback(params);
    });

    // Handle URL if app was launched with one
    const launchUrl = process.argv.find(arg => arg.startsWith('myapp://'));
    if (launchUrl) {
      protocolHandler.handleUrl(launchUrl);
    }
  });
}
```

### electron-builder Configuration

```yaml
# electron-builder.yml
protocols:
  - name: "My App Protocol"
    schemes:
      - myapp
    role: Viewer

# macOS
mac:
  extendInfo:
    CFBundleURLTypes:
      - CFBundleURLName: "My App Protocol"
        CFBundleURLSchemes:
          - myapp

# Linux
linux:
  mimeTypes:
    - x-scheme-handler/myapp
  desktop:
    MimeType: "x-scheme-handler/myapp;"
```

## Security Considerations

1. **Validate all URLs**: Never trust protocol URL content
2. **Whitelist routes**: Only handle known routes
3. **Sanitize parameters**: Clean query parameters before use
4. **Avoid code execution**: Never eval protocol URL content
5. **Log suspicious URLs**: Track invalid protocol attempts

```javascript
// Security example
validateParams(params) {
  const sanitized = {};
  const allowedParams = ['id', 'action', 'token'];

  for (const [key, value] of Object.entries(params)) {
    if (allowedParams.includes(key)) {
      // Sanitize value
      sanitized[key] = String(value).slice(0, 1000);
    }
  }

  return sanitized;
}
```

## Testing

```bash
# Test on macOS
open "myapp://open?file=test.txt"

# Test on Windows
start "" "myapp://open?file=test.txt"

# Test on Linux
xdg-open "myapp://open?file=test.txt"
```

## Related Skills

- `electron-ipc-security-audit` - Secure protocol handling
- `inter-app-communication` process - IPC patterns
- `electron-builder-config` - Package protocol handlers

## Related Agents

- `electron-architect` - Architecture guidance
- `desktop-security-auditor` - Security review
