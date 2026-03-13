---
name: web-performance
description: Core Web Vitals optimization, Lighthouse audits, and performance monitoring.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Web Performance Skill

Expert assistance for web performance optimization.

## Capabilities

- Optimize Core Web Vitals
- Run Lighthouse audits
- Implement performance monitoring
- Reduce bundle size
- Optimize loading strategies

## Core Web Vitals

```typescript
// Measure CWV
import { onLCP, onFID, onCLS } from 'web-vitals';

onLCP(console.log);
onFID(console.log);
onCLS(console.log);

// LCP Optimization
// - Preload critical resources
// - Optimize images
// - Use SSR/SSG

// CLS Prevention
// - Reserve space for images
// - Use aspect-ratio
// - Avoid layout shifts
```

## Target Processes

- performance-optimization
- lighthouse-audit
- cwv-improvement
