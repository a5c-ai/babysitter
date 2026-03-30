# dotnet-clickonce-config

Configure ClickOnce deployment with auto-update for .NET applications.

## Overview

This skill sets up ClickOnce deployment with automatic updates, prerequisites, and publish settings for WPF and Windows Forms applications.

## Quick Start

```javascript
const result = await invokeSkill('dotnet-clickonce-config', {
  projectPath: '/path/to/dotnet-project',
  publishSettings: {
    publishUrl: 'https://myserver.com/myapp/',
    updateMode: 'foreground',
    updateInterval: 7,
    minimumVersion: '1.0.0'
  },
  prerequisites: ['.NETFramework,Version=v4.8'],
  signing: {
    certificatePath: 'cert.pfx',
    timestampUrl: 'http://timestamp.digicert.com'
  }
});
```

## Features

### Update Modes

| Mode | Description |
|------|-------------|
| Foreground | Check before app starts |
| Background | Check while app runs |

### Configuration

- Publish URL and install URL
- Update checking interval
- Minimum required version
- Desktop/Start Menu shortcuts
- File associations

## Commands

```bash
# Publish
dotnet publish -p:PublishProfile=ClickOnce

# Sign
mage -sign MyApp.application -CertFile cert.pfx
```

## Related Skills

- `windows-authenticode-signer`
- `auto-update-system` process

## Related Agents

- `wpf-dotnet-expert`
- `release-manager`
