# electron-protocol-handler-setup

Register and handle custom URL protocols (deep linking) for Electron applications.

## Overview

This skill enables Electron applications to respond to custom URL schemes like `myapp://action?param=value`. It handles platform-specific registration and secure URL parsing.

## Quick Start

```javascript
const result = await invokeSkill('electron-protocol-handler-setup', {
  projectPath: '/path/to/electron-app',
  protocols: [
    { scheme: 'myapp', name: 'My App Protocol', role: 'Viewer' }
  ],
  singleInstance: true,
  securityOptions: {
    validateUrls: true,
    allowedHosts: ['open', 'auth', 'share']
  }
});
```

## Features

### Platform Support

| Platform | Registration Method |
|----------|-------------------|
| Windows | Registry entries via NSIS |
| macOS | Info.plist CFBundleURLTypes |
| Linux | .desktop file MimeType |

### Use Cases

- **Deep linking**: Open specific content `myapp://document/123`
- **OAuth callbacks**: Handle `myapp://auth/callback?code=xxx`
- **Inter-app communication**: Share data between apps
- **File associations**: Open file types with your app

## Generated Code

```javascript
// Register protocol
app.setAsDefaultProtocolClient('myapp');

// Handle URL
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleProtocolUrl(url);
});
```

## Security

- URL validation
- Route whitelisting
- Parameter sanitization
- No code execution from URLs

## Testing

```bash
# macOS
open "myapp://open?file=test.txt"

# Windows
start "" "myapp://open?file=test.txt"

# Linux
xdg-open "myapp://open?file=test.txt"
```

## Related Skills

- `electron-ipc-security-audit`
- `electron-builder-config`

## Related Agents

- `electron-architect`
- `desktop-security-auditor`
