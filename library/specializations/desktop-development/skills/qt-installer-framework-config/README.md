# qt-installer-framework-config

Configure Qt Installer Framework for cross-platform installers.

## Overview

This skill generates Qt Installer Framework (IFW) configurations for professional cross-platform installers with component management, online updates, and custom branding.

## Quick Start

```javascript
const result = await invokeSkill('qt-installer-framework-config', {
  projectPath: '/path/to/project',
  installerName: 'MyAppInstaller',
  appInfo: {
    name: 'My Application',
    version: '1.0.0',
    publisher: 'My Company',
    url: 'https://mycompany.com'
  },
  components: [
    { name: 'com.company.app', displayName: 'Core', required: true },
    { name: 'com.company.plugins', displayName: 'Plugins', required: false }
  ],
  onlineRepository: { enabled: true, url: 'https://updates.mycompany.com' }
});
```

## Features

### Installer Types

| Type | Description |
|------|-------------|
| Offline | Complete installer with all components |
| Online | Small installer, downloads components |
| Repository | Server-hosted update repository |

### Components

- Independent versioning
- Dependencies between components
- Optional/required flags
- Platform-specific data

## Build Commands

```bash
# Offline installer
binarycreator -c config/config.xml -p packages MyAppInstaller

# Online installer
binarycreator -c config/config.xml -p packages -n MyAppOnlineInstaller

# Update repository
repogen --update-new-components -p packages repository
```

## Related Skills

- `qt-cmake-project-generator`
- `windows-authenticode-signer`
- `macos-notarization-workflow`

## Related Agents

- `qt-cpp-specialist`
- `release-manager`
