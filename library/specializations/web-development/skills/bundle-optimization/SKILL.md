---
name: bundle-optimization
description: Bundle analysis, code splitting, tree shaking, and size optimization.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Bundle Optimization Skill

Expert assistance for JavaScript bundle optimization.

## Capabilities

- Analyze bundle size
- Implement code splitting
- Configure tree shaking
- Optimize dependencies
- Set up lazy loading

## Analysis

```bash
# webpack-bundle-analyzer
npx webpack-bundle-analyzer stats.json

# source-map-explorer
npx source-map-explorer dist/*.js
```

## Code Splitting

```typescript
// Route-based splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Library splitting
const { Chart } = await import('chart.js');
```

## Target Processes

- bundle-optimization
- performance-improvement
- build-optimization
