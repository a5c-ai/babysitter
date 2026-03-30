# screen-capture-api

Cross-platform screen and window capture.

## Quick Start

```javascript
const result = await invokeSkill('screen-capture-api', {
  projectPath: '/path/to/project',
  framework: 'electron',
  captureTypes: ['screen', 'window', 'region']
});
```

## Features

- Screen screenshots
- Window capture
- Region selection
- Multi-display support

## Related Skills

- `power-management-monitor`
- `system-services-integration` process
