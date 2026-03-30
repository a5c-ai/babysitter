# macos-codesign-workflow

Execute macOS code signing with Developer ID.

## Quick Start

```javascript
const result = await invokeSkill('macos-codesign-workflow', {
  appPath: 'MyApp.app',
  identity: 'Developer ID Application: Company (TEAMID)',
  entitlements: 'MyApp.entitlements',
  hardenedRuntime: true
});
```

## Features

- Developer ID signing
- Hardened runtime
- Entitlements configuration
- Nested binary signing

## Related Skills

- `macos-notarization-workflow`
- `macos-entitlements-generator`
