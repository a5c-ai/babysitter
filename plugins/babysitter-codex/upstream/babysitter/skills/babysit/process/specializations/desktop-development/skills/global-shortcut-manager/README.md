# global-shortcut-manager

Register and manage global keyboard shortcuts.

## Quick Start

```javascript
const result = await invokeSkill('global-shortcut-manager', {
  projectPath: '/path/to/project',
  framework: 'electron',
  shortcuts: [
    { accelerator: 'CommandOrControl+Shift+X', action: 'toggleWindow' }
  ]
});
```

## Features

- System-wide shortcuts
- Modifier combinations
- Conflict detection
- Platform key mapping

## Related Skills

- `clipboard-handler`
- `system-services-integration` process
