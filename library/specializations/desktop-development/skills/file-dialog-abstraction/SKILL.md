---
name: file-dialog-abstraction
description: Cross-platform file dialog implementation for open, save, and directory selection
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [files, dialogs, cross-platform, desktop, native]
---

# file-dialog-abstraction

Implement cross-platform file dialogs for open, save, and directory selection with consistent API across Windows, macOS, and Linux.

## Capabilities

- Open file dialogs
- Save file dialogs
- Directory selection dialogs
- Multiple file selection
- File type filters
- Default paths and names
- Recent locations support

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "framework": { "enum": ["electron", "tauri", "qt", "wpf"] },
    "dialogTypes": { "type": "array" }
  },
  "required": ["projectPath"]
}
```

## Electron Example

```javascript
const { dialog } = require('electron');

async function openFile() {
    const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Documents', extensions: ['pdf', 'docx'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    return result.filePaths;
}
```

## Related Skills

- `file-watcher-setup`
- `file-system-integration` process
