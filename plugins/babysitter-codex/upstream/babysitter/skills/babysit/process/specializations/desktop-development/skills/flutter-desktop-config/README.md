# flutter-desktop-config

Configure Flutter for desktop platforms with platform channels.

## Quick Start

```javascript
const result = await invokeSkill('flutter-desktop-config', {
  projectPath: '/path/to/flutter-project',
  platforms: ['windows', 'macos', 'linux'],
  windowConfig: { width: 1200, height: 800 }
});
```

## Features

- Desktop platform enablement
- Platform channels
- Window management
- System tray integration
- Native packaging

## Related Skills

- `cross-platform-test-matrix`
- `desktop-build-pipeline` process
