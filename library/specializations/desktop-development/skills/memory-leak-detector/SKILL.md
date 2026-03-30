---
name: memory-leak-detector
description: Detect memory leaks in desktop applications through heap analysis and object tracking
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [performance, memory, leaks, debugging, profiling]
---

# memory-leak-detector

Detect memory leaks in desktop applications through heap snapshot analysis, object tracking, and growth pattern detection.

## Capabilities

- Capture and compare heap snapshots
- Track object allocation growth
- Identify retained objects
- Detect common leak patterns
- Generate leak reports
- Suggest fixes

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "framework": { "enum": ["electron", "native", "qt"] },
    "duration": { "type": "number", "default": 60 }
  },
  "required": ["projectPath"]
}
```

## Detection Approach

```javascript
// Heap snapshot comparison
const v8 = require('v8');

function detectLeaks(iterations = 3, intervalMs = 10000) {
  const snapshots = [];

  const interval = setInterval(() => {
    global.gc(); // Requires --expose-gc
    const snapshot = v8.getHeapStatistics();
    snapshots.push(snapshot);

    if (snapshots.length >= iterations) {
      clearInterval(interval);
      analyzeGrowth(snapshots);
    }
  }, intervalMs);
}

function analyzeGrowth(snapshots) {
  const growth = snapshots[snapshots.length - 1].used_heap_size -
                 snapshots[0].used_heap_size;
  console.log(`Heap growth: ${growth / 1024 / 1024} MB`);
}
```

## Common Leak Patterns

1. Event listeners not removed
2. Closures holding references
3. Global variable accumulation
4. Timer/interval not cleared
5. DOM node detachment

## Related Skills

- `electron-memory-profiler`
- `startup-time-profiler`
