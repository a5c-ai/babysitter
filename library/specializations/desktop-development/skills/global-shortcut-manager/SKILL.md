---
name: global-shortcut-manager
description: Register and manage global keyboard shortcuts across desktop platforms
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [keyboard, shortcuts, hotkeys, cross-platform, desktop]
graph:
  domains: [domain:software-engineering]
  specializations: [specialization:desktop-development]
  skillAreas: [skill-area:desktop-system-integration, skill-area:desktop-ui-frameworks]
  roles: [role:desktop-developer, role:fullstack-engineer]
  workflows: [workflow:feature-development, workflow:release-management]
---

# global-shortcut-manager

Register and manage global keyboard shortcuts that work even when the application is not focused.

## Capabilities

- Register global shortcuts
- Handle modifier combinations
- Manage shortcut conflicts
- Platform-specific key mapping
- Unregister shortcuts
- Check shortcut availability

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "framework": { "enum": ["electron", "tauri", "native"] },
    "shortcuts": { "type": "array" }
  },
  "required": ["projectPath"]
}
```

## Electron Example

```javascript
const { globalShortcut } = require('electron');

function registerShortcuts() {
    globalShortcut.register('CommandOrControl+Shift+X', () => {
        console.log('Global shortcut triggered');
    });
}

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
```

## Related Skills

- `clipboard-handler`
- `system-services-integration` process
