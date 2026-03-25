# file-dialog-abstraction

Cross-platform file dialog implementation.

## Quick Start

```javascript
const result = await invokeSkill('file-dialog-abstraction', {
  projectPath: '/path/to/project',
  framework: 'electron',
  dialogTypes: ['open', 'save', 'directory']
});
```

## Features

- Open/Save/Directory dialogs
- File type filters
- Multi-selection
- Cross-platform API

## Related Skills

- `file-watcher-setup`
- `file-system-integration` process
