---
name: electron-tray-menu-builder
description: Generate system tray and context menu configurations with platform-specific icons, menu templates, and event handling
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [electron, tray, menu, system-tray, desktop]
---

# electron-tray-menu-builder

Generate system tray and context menu configurations for Electron applications. This skill handles platform-specific icon requirements, menu template creation, and tray event handling across Windows, macOS, and Linux.

## Capabilities

- Generate Tray class implementation with proper lifecycle
- Create platform-specific icon sets (ICO, ICNS, PNG)
- Build menu templates with submenus and separators
- Handle click events (single, double, right-click)
- Implement tooltip and balloon notifications
- Support dynamic menu updates
- Handle tray icon state changes (normal, active, highlighted)
- Generate TypeScript types for menu items

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Electron project root"
    },
    "menuStructure": {
      "type": "array",
      "description": "Menu item definitions",
      "items": {
        "type": "object",
        "properties": {
          "label": { "type": "string" },
          "type": { "enum": ["normal", "separator", "submenu", "checkbox", "radio"] },
          "accelerator": { "type": "string" },
          "enabled": { "type": "boolean" },
          "visible": { "type": "boolean" },
          "click": { "type": "string", "description": "Handler function name" },
          "submenu": { "type": "array" }
        }
      }
    },
    "iconPaths": {
      "type": "object",
      "properties": {
        "default": { "type": "string" },
        "pressed": { "type": "string" },
        "highlighted": { "type": "string" }
      }
    },
    "features": {
      "type": "array",
      "items": {
        "enum": ["tooltip", "balloon", "click-handler", "double-click", "context-menu", "dynamic-update"]
      }
    },
    "targetPlatforms": {
      "type": "array",
      "items": { "enum": ["win32", "darwin", "linux"] }
    }
  },
  "required": ["projectPath", "menuStructure"]
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
    "iconRequirements": {
      "type": "object",
      "description": "Required icon files per platform"
    },
    "warnings": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["success"]
}
```

## Platform Considerations

### Windows

- Icon format: ICO (16x16, 32x32, 48x48, 256x256)
- Supports balloon notifications
- Double-click shows main window (convention)
- Tray icon persists in system tray

### macOS

- Icon format: PNG (16x16, 32x32 @1x and @2x)
- Must be template images for dark/light mode
- Uses Menu Bar (not system tray)
- pressedImage for clicked state
- No balloon notifications (use Notification Center)

### Linux

- Icon format: PNG (various sizes)
- Behavior varies by desktop environment
- AppIndicator support recommended
- May require libappindicator

## Generated Code Example

```javascript
// tray-manager.js
const { app, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

class TrayManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.tray = null;
  }

  create() {
    const iconPath = this.getIconPath();
    this.tray = new Tray(iconPath);

    this.tray.setToolTip('My Application');
    this.tray.setContextMenu(this.buildMenu());

    // Platform-specific behavior
    if (process.platform === 'win32') {
      this.tray.on('double-click', () => this.showWindow());
    } else if (process.platform === 'darwin') {
      this.tray.on('click', () => this.toggleWindow());
    }
  }

  getIconPath() {
    const iconName = process.platform === 'win32'
      ? 'tray.ico'
      : process.platform === 'darwin'
        ? 'trayTemplate.png'  // Template image for macOS
        : 'tray.png';
    return path.join(__dirname, '../assets/icons', iconName);
  }

  buildMenu() {
    const template = [
      {
        label: 'Show App',
        click: () => this.showWindow()
      },
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
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => app.quit()
      }
    ];

    return Menu.buildFromTemplate(template);
  }

  showWindow() {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  toggleWindow() {
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showWindow();
    }
  }

  updateMenu(newTemplate) {
    this.tray.setContextMenu(Menu.buildFromTemplate(newTemplate));
  }

  setIcon(iconPath) {
    this.tray.setImage(iconPath);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = TrayManager;
```

## Icon Requirements

### Template Images (macOS)

```javascript
// For macOS dark/light mode support
const icon = nativeImage.createFromPath('trayTemplate.png');
icon.setTemplateImage(true);
```

### Multi-Resolution Icons

```
assets/icons/
├── tray.ico           # Windows (multi-resolution)
├── trayTemplate.png   # macOS @1x (16x16 or 22x22)
├── trayTemplate@2x.png # macOS @2x
├── tray.png           # Linux (24x24 or 22x22)
└── tray-active.png    # State variant
```

## Best Practices

1. **Use template images on macOS**: Automatically adapts to dark/light mode
2. **Provide multiple resolutions**: Support high DPI displays
3. **Handle tray destruction**: Clean up on app quit
4. **Minimize tray updates**: Batch menu updates to avoid flicker
5. **Follow platform conventions**: Double-click on Windows, single-click on macOS
6. **Test on all platforms**: Behavior varies significantly

## Related Skills

- `electron-builder-config` - Include tray icons in build
- `native-notification-builder` - Notifications from tray
- `appkit-menu-bar-builder` - macOS native menu bar apps

## Related Agents

- `electron-architect` - Architecture guidance
- `platform-convention-advisor` - Platform UI conventions
