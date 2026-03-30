# linux-gpg-signing

Sign Linux packages with GPG keys.

## Quick Start

```javascript
const result = await invokeSkill('linux-gpg-signing', {
  packagePath: 'myapp.deb',
  keyId: 'ABCD1234',
  packageType: 'deb'
});
```

## Features

- DEB/RPM signing
- AppImage signing
- Repository key management
- Key distribution

## Related Skills

- `deb-package-builder`
- `rpm-spec-generator`
