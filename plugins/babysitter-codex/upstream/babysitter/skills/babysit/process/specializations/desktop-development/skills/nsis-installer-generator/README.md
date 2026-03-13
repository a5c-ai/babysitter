# nsis-installer-generator

Generate NSIS installer scripts for Windows.

## Quick Start

```javascript
const result = await invokeSkill('nsis-installer-generator', {
  projectPath: '/path/to/project',
  appName: 'MyApp',
  version: '1.0.0',
  createShortcuts: true
});
```

## Features

- Custom installer UI
- Component selection
- File associations
- Shortcuts and registry

## Related Skills

- `wix-toolset-config`
- `windows-authenticode-signer`
