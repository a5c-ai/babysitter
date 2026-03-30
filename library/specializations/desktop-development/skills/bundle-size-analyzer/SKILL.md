---
name: bundle-size-analyzer
description: Analyze and optimize application bundle size for desktop applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [performance, bundle, optimization, webpack, desktop]
---

# bundle-size-analyzer

Analyze and optimize application bundle size to improve download times and memory usage.

## Capabilities

- Analyze bundle composition
- Identify large dependencies
- Detect duplicate packages
- Suggest tree-shaking opportunities
- Generate size reports
- Track size over time

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "bundler": { "enum": ["webpack", "vite", "rollup", "esbuild"] },
    "generateReport": { "type": "boolean", "default": true }
  },
  "required": ["projectPath"]
}
```

## Webpack Bundle Analyzer

```javascript
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html'
    })
  ]
};
```

## Optimization Techniques

1. Tree shaking
2. Code splitting
3. Dynamic imports
4. Replace heavy dependencies
5. Compress assets

## Size Targets

| App Type | Target | Acceptable | Too Large |
|----------|--------|------------|-----------|
| Simple utility | < 30MB | < 60MB | > 100MB |
| Standard app | < 80MB | < 150MB | > 250MB |
| Complex app | < 150MB | < 250MB | > 400MB |

## Related Skills

- `startup-time-profiler`
- `electron-builder-config`
