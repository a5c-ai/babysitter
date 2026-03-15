# sandbox-entitlements-auditor

Audit and recommend minimal sandbox entitlements.

## Quick Start

```javascript
const result = await invokeSkill('sandbox-entitlements-auditor', {
  projectPath: '/path/to/project',
  entitlementsPath: 'MyApp.entitlements',
  targetDistribution: 'mas'
});
```

## Features

- Permission analysis
- Over-permission detection
- MAS compliance checking
- Security recommendations

## Related Skills

- `macos-entitlements-generator`
- `security-hardening` process
