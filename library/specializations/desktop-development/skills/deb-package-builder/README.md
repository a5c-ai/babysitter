# deb-package-builder

Build Debian packages for Linux distribution.

## Quick Start

```javascript
const result = await invokeSkill('deb-package-builder', {
  projectPath: '/path/to/project',
  packageName: 'myapp',
  version: '1.0.0',
  dependencies: ['libc6', 'libgtk-3-0'],
  architecture: 'amd64'
});
```

## Features

- DEBIAN/control generation
- Maintainer scripts
- Desktop file integration
- GPG signing

## Related Skills

- `rpm-spec-generator`
- `linux-gpg-signing`
