# electron-tray-menu-builder

Generate system tray and context menu configurations for Electron applications.

## Overview

This skill creates system tray implementations with platform-specific icons, menu templates, and event handling. It handles the differences between Windows, macOS, and Linux tray behaviors.

## Quick Start

```javascript
const result = await invokeSkill('electron-tray-menu-builder', {
  projectPath: '/path/to/electron-app',
  menuStructure: [
    { label: 'Show App', click: 'showWindow' },
    { type: 'separator' },
    { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: 'quit' }
  ],
  features: ['tooltip', 'click-handler', 'dynamic-update'],
  targetPlatforms: ['win32', 'darwin', 'linux']
});
```

## Features

### Platform Support

| Platform | Icon Format | Click Behavior | Special Features |
|----------|-------------|----------------|------------------|
| Windows | ICO | Double-click shows | Balloon notifications |
| macOS | PNG (template) | Single-click toggles | Dark/light mode |
| Linux | PNG | Click shows menu | AppIndicator |

### Generated Files

- `tray-manager.js` - Tray lifecycle management
- `menu-template.js` - Menu structure definition
- Icon assets in required formats

## Menu Structure

```javascript
const menuStructure = [
  { label: 'Show App', click: 'showWindow' },
  { type: 'separator' },
  {
    label: 'Status',
    submenu: [
      { label: 'Online', type: 'radio', checked: true },
      { label: 'Away', type: 'radio' },
      { label: 'Busy', type: 'radio' }
    ]
  },
  { type: 'separator' },
  { label: 'Quit', click: 'quit' }
];
```

## Icon Requirements

| Platform | Format | Sizes |
|----------|--------|-------|
| Windows | ICO | 16, 32, 48, 256 |
| macOS | PNG | 16@1x, 16@2x, 22@1x, 22@2x |
| Linux | PNG | 22, 24 |

## Related Skills

- `electron-builder-config`
- `native-notification-builder`

## Related Agents

- `electron-architect`
- `platform-convention-advisor`
