# appimage-builder

Build portable AppImage bundles for Linux.

## Quick Start

```javascript
const result = await invokeSkill('appimage-builder', {
  projectPath: '/path/to/project',
  appName: 'MyApp',
  executablePath: 'usr/bin/myapp',
  iconPath: 'myapp.png'
});
```

## Features

- Portable distribution
- Bundled dependencies
- Auto-update support
- Works on most distros

## Related Skills

- `deb-package-builder`
- `flatpak-manifest-generator`
