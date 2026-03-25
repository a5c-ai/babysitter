# bundle-size-analyzer

Analyze and optimize application bundle size.

## Quick Start

```javascript
const result = await invokeSkill('bundle-size-analyzer', {
  projectPath: '/path/to/project',
  bundler: 'webpack',
  generateReport: true
});
```

## Features

- Bundle composition analysis
- Large dependency detection
- Duplicate package finder
- Optimization suggestions

## Related Skills

- `startup-time-profiler`
- `electron-builder-config`
