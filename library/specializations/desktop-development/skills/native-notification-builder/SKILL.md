---
name: native-notification-builder
description: Build native OS notifications with actions, images, and progress indicators across platforms
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [notifications, cross-platform, native, desktop, ui]
---

# native-notification-builder

Build native OS notifications with actions, images, and progress indicators across Windows, macOS, and Linux platforms.

## Capabilities

- Create basic notifications
- Add action buttons
- Include images and app icons
- Show progress indicators
- Configure notification sounds
- Handle notification clicks
- Set notification priority
- Configure notification grouping

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "framework": { "enum": ["electron", "native", "tauri"] },
    "features": { "type": "array", "items": { "enum": ["actions", "images", "progress", "sounds"] } }
  },
  "required": ["projectPath"]
}
```

## Electron Example

```javascript
const { Notification } = require('electron');

const notification = new Notification({
    title: 'Download Complete',
    body: 'Your file has been downloaded.',
    icon: '/path/to/icon.png',
    actions: [
        { type: 'button', text: 'Open' },
        { type: 'button', text: 'Show in Folder' }
    ]
});

notification.on('action', (event, index) => {
    if (index === 0) openFile();
    else showInFolder();
});

notification.show();
```

## Related Skills

- `electron-tray-menu-builder`
- `system-services-integration` process
