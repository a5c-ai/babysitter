---
name: startup-time-profiler
description: Profile and optimize application startup time for desktop applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [performance, profiling, startup, optimization, desktop]
---

# startup-time-profiler

Profile and optimize application startup time, identifying bottlenecks in initialization, module loading, and rendering.

## Capabilities

- Measure cold and warm start times
- Identify module loading bottlenecks
- Profile initialization phases
- Generate timeline visualizations
- Provide optimization recommendations
- Set up CI performance tracking

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "framework": { "enum": ["electron", "tauri", "native"] },
    "iterations": { "type": "number", "default": 5 }
  },
  "required": ["projectPath"]
}
```

## Electron Startup Profiling

```javascript
// Add to main.js
const startTime = Date.now();

app.on('ready', () => {
  console.log(`App ready: ${Date.now() - startTime}ms`);
});

// Enable tracing
app.commandLine.appendSwitch('trace-startup');
app.commandLine.appendSwitch('trace-startup-file', 'startup-trace.json');
```

## Optimization Techniques

1. Lazy load modules
2. Defer non-critical initialization
3. Optimize bundle size
4. Use V8 snapshots
5. Preload critical resources

## Benchmarks

| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| Cold start | < 2s | < 4s | > 6s |
| Warm start | < 1s | < 2s | > 3s |
| Window visible | < 1.5s | < 3s | > 5s |

## Related Skills

- `memory-leak-detector`
- `bundle-size-analyzer`
