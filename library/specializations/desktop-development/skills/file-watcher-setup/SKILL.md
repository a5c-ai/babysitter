---
name: file-watcher-setup
description: Set up cross-platform file system watching with debouncing and efficient change detection
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [files, watcher, cross-platform, filesystem, events]
---

# file-watcher-setup

Set up cross-platform file system watching with debouncing, efficient change detection, and proper resource management.

## Capabilities

- Watch files and directories
- Configure debouncing
- Handle recursive watching
- Filter file types
- Detect add/change/delete events
- Handle watcher errors
- Resource cleanup

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "watchLibrary": { "enum": ["chokidar", "native", "nsfw"] },
    "debounceMs": { "type": "number", "default": 300 }
  },
  "required": ["projectPath"]
}
```

## Chokidar Example

```javascript
const chokidar = require('chokidar');

const watcher = chokidar.watch('/path/to/watch', {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
    }
});

watcher
    .on('add', path => console.log(`Added: ${path}`))
    .on('change', path => console.log(`Changed: ${path}`))
    .on('unlink', path => console.log(`Removed: ${path}`));
```

## Related Skills

- `file-dialog-abstraction`
- `file-system-integration` process
