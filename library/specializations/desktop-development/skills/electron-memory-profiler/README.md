# electron-memory-profiler

Profile Electron app memory usage, detect leaks, and optimize memory consumption.

## Overview

This skill provides comprehensive memory profiling capabilities for Electron applications. It helps identify memory leaks, analyze heap usage, and optimize memory consumption in both main and renderer processes.

## Quick Start

```javascript
const result = await invokeSkill('electron-memory-profiler', {
  projectPath: '/path/to/electron-app',
  profilingMode: 'leak-detection',
  targetProcess: 'all',
  duration: 60
});
```

## Features

### Profiling Modes

| Mode | Description |
|------|-------------|
| snapshot | Single point-in-time memory analysis |
| timeline | Memory usage over time |
| leak-detection | Identify growing memory patterns |
| comparison | Compare before/after snapshots |

### Metrics Captured

- Heap size (used/total)
- RSS (Resident Set Size)
- External memory
- DOM node count
- Event listener count
- V8 heap statistics

## Output

```json
{
  "success": true,
  "memoryProfile": {
    "mainProcess": {
      "heapUsed": 45,
      "heapTotal": 67,
      "external": 12,
      "rss": 120
    },
    "rendererProcesses": [
      {
        "pid": 12345,
        "heapUsed": 85,
        "domNodes": 1250,
        "eventListeners": 45
      }
    ]
  },
  "leaks": [
    {
      "type": "EventListener",
      "location": "src/renderer/components/DataGrid.js",
      "retainedSize": 5242880,
      "count": 150
    }
  ],
  "recommendations": [
    "Remove event listeners in component cleanup",
    "Use WeakMap for caching DOM references"
  ]
}
```

## Common Leak Patterns

1. **Event listeners** - Not removed on component unmount
2. **IPC handlers** - Accumulating channel listeners
3. **Closures** - Large objects retained in callback closures
4. **BrowserWindow references** - Not cleaned on window close

## Related Skills

- `electron-ipc-security-audit`
- `startup-time-profiler`

## Related Agents

- `electron-architect`
- `performance-test-engineer`
