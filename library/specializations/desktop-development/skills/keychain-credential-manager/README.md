# keychain-credential-manager

Manage credentials in OS keychains cross-platform.

## Quick Start

```javascript
const result = await invokeSkill('keychain-credential-manager', {
  projectPath: '/path/to/project',
  serviceName: 'MyApp',
  framework: 'electron'
});
```

## Features

- Windows Credential Manager
- macOS Keychain
- Linux libsecret
- Electron keytar integration

## Related Skills

- `security-hardening` process
- `electron-ipc-security-audit`
