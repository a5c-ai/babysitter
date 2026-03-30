# dmg-creator

Create macOS DMG installers with custom backgrounds.

## Quick Start

```javascript
const result = await invokeSkill('dmg-creator', {
  projectPath: '/path/to/project',
  appPath: 'MyApp.app',
  backgroundImage: 'background.png',
  windowSize: { width: 600, height: 400 }
});
```

## Features

- Custom backgrounds
- Icon positioning
- Volume icons
- License agreements

## Related Skills

- `macos-notarization-workflow`
- `macos-codesign-workflow`
