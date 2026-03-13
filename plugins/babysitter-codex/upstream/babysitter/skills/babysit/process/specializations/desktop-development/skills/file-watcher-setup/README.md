# file-watcher-setup

Set up cross-platform file system watching.

## Quick Start

```javascript
const result = await invokeSkill('file-watcher-setup', {
  projectPath: '/path/to/project',
  watchLibrary: 'chokidar',
  debounceMs: 300
});
```

## Features

- Recursive watching
- Event debouncing
- File type filtering
- Cross-platform support

## Related Skills

- `file-dialog-abstraction`
- `file-system-integration` process
