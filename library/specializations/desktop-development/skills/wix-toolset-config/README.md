# wix-toolset-config

Configure WiX Toolset for Windows MSI installers.

## Quick Start

```javascript
const result = await invokeSkill('wix-toolset-config', {
  projectPath: '/path/to/project',
  productName: 'My Application',
  version: '1.0.0.0',
  manufacturer: 'My Company'
});
```

## Features

- MSI package generation
- Component/feature structure
- Upgrade handling
- Custom actions

## Related Skills

- `nsis-installer-generator`
- `msix-package-generator`
