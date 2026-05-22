---
name: bundle-optimization
description: Bundle analysis, code splitting, tree shaking, and size optimization.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:web-performance, skill-area:asset-pipeline]
  roles: [role:frontend-engineer]
  topics: [topic:tree-shaking, topic:code-splitting]

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
