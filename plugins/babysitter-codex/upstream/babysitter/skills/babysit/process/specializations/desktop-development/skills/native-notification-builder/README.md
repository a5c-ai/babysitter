# native-notification-builder

Build native OS notifications across platforms.

## Quick Start

```javascript
const result = await invokeSkill('native-notification-builder', {
  projectPath: '/path/to/project',
  framework: 'electron',
  features: ['actions', 'images', 'progress']
});
```

## Features

- Action buttons
- Images and icons
- Progress indicators
- Platform-specific styling

## Related Skills

- `electron-tray-menu-builder`
- `system-services-integration` process
