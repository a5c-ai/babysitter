# snap-yaml-generator

Generate snapcraft.yaml for Ubuntu Snap packages.

## Quick Start

```javascript
const result = await invokeSkill('snap-yaml-generator', {
  projectPath: '/path/to/project',
  snapName: 'myapp',
  confinement: 'strict',
  interfaces: ['desktop', 'home', 'network']
});
```

## Features

- Confinement levels
- Interface/plug configuration
- Desktop integration
- Auto-update support

## Related Skills

- `flatpak-manifest-generator`
- `deb-package-builder`
