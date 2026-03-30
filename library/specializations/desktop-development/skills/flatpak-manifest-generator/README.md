# flatpak-manifest-generator

Generate Flatpak manifests for Linux.

## Quick Start

```javascript
const result = await invokeSkill('flatpak-manifest-generator', {
  projectPath: '/path/to/project',
  appId: 'com.example.MyApp',
  runtime: 'org.freedesktop.Platform',
  permissions: ['x11', 'wayland', 'network', 'home']
});
```

## Features

- Sandbox permissions
- Runtime configuration
- Flathub compatibility
- Build modules

## Related Skills

- `snap-yaml-generator`
- `appimage-builder`
