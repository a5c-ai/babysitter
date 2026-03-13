# msix-package-generator

Generate MSIX packaging configuration for Windows applications.

## Overview

This skill creates MSIX package configuration including manifest, visual assets, and signing setup for Windows 10/11 applications.

## Quick Start

```javascript
const result = await invokeSkill('msix-package-generator', {
  projectPath: '/path/to/project',
  appInfo: {
    name: 'MyCompany.MyApp',
    displayName: 'My Application',
    publisher: 'CN=My Company',
    publisherDisplayName: 'My Company',
    version: '1.0.0.0',
    description: 'A wonderful application'
  },
  capabilities: ['internetClient'],
  distribution: 'sideload'
});
```

## Features

### Generated Files

| File | Description |
|------|-------------|
| Package.appxmanifest | Package manifest |
| Assets/*.png | Visual assets (all sizes) |
| priconfig.xml | Resource indexer config |

### Capabilities

- internetClient, privateNetworkClientServer
- File/media library access
- Device access (webcam, microphone)
- Location, contacts, appointments

## Build Commands

```powershell
# Build package
msbuild MyApp.wapproj /p:Configuration=Release

# Sign package
signtool sign /fd SHA256 /f cert.pfx MyApp.msix
```

## Related Skills

- `windows-authenticode-signer`
- `wpf-mvvm-scaffold`

## Related Agents

- `windows-platform-expert`
- `release-manager`
