# rpm-spec-generator

Generate RPM spec files for Fedora/RHEL.

## Quick Start

```javascript
const result = await invokeSkill('rpm-spec-generator', {
  projectPath: '/path/to/project',
  packageName: 'myapp',
  version: '1.0.0',
  requires: ['glibc', 'gtk3']
});
```

## Features

- Spec file generation
- Build requirements
- Scriptlets
- Changelog management

## Related Skills

- `deb-package-builder`
- `linux-gpg-signing`
