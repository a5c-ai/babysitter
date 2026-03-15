---
name: electron-memory-profiler
description: Profile Electron app memory usage, detect leaks, analyze renderer process memory, and optimize memory consumption
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [electron, performance, memory, profiling, optimization]
---

# electron-memory-profiler

Profile Electron application memory usage, detect memory leaks, and analyze renderer process memory consumption. This skill provides tools and techniques for identifying memory issues and optimizing memory usage in Electron applications.

## Capabilities

- Profile main process and renderer process memory usage
- Detect memory leaks through heap snapshots
- Analyze garbage collection patterns
- Monitor V8 heap statistics
- Track DOM node and event listener counts
- Generate memory usage reports over time
- Identify common memory leak patterns
- Provide optimization recommendations

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Electron project root"
    },
    "profilingMode": {
      "enum": ["snapshot", "timeline", "leak-detection", "comparison"],
      "default": "snapshot"
    },
    "targetProcess": {
      "enum": ["main", "renderer", "all"],
      "default": "all"
    },
    "duration": {
      "type": "number",
      "description": "Duration in seconds for timeline profiling",
      "default": 60
    },
    "snapshotInterval": {
      "type": "number",
      "description": "Interval between snapshots in milliseconds",
      "default": 5000
    },
    "generateReport": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["projectPath"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "memoryProfile": {
      "type": "object",
      "properties": {
        "mainProcess": {
          "type": "object",
          "properties": {
            "heapUsed": { "type": "number" },
            "heapTotal": { "type": "number" },
            "external": { "type": "number" },
            "rss": { "type": "number" }
          }
        },
        "rendererProcesses": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "pid": { "type": "number" },
              "heapUsed": { "type": "number" },
              "domNodes": { "type": "number" },
              "eventListeners": { "type": "number" }
            }
          }
        }
      }
    },
    "leaks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "location": { "type": "string" },
          "retainedSize": { "type": "number" },
          "count": { "type": "number" }
        }
      }
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["success"]
}
```

## Profiling Techniques

### Heap Snapshot Analysis

```javascript
// Generate heap snapshot in main process
const v8 = require('v8');
const fs = require('fs');

function takeHeapSnapshot(filename) {
  const snapshotPath = `${filename}.heapsnapshot`;
  const snapshotStream = v8.writeHeapSnapshot(snapshotPath);
  console.log(`Heap snapshot written to: ${snapshotStream}`);
  return snapshotStream;
}
```

### Memory Monitoring

```javascript
// Monitor memory in main process
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
    rss: Math.round(usage.rss / 1024 / 1024)
  };
}

// Monitor renderer memory via IPC
ipcMain.handle('memory:get-usage', (event) => {
  const webContents = event.sender;
  return webContents.executeJavaScript(`
    ({
      jsHeapSizeLimit: performance.memory?.jsHeapSizeLimit,
      totalJSHeapSize: performance.memory?.totalJSHeapSize,
      usedJSHeapSize: performance.memory?.usedJSHeapSize
    })
  `);
});
```

### Renderer Memory Analysis

```javascript
// In preload script
const memoryAnalysis = {
  getDOMNodeCount: () => document.getElementsByTagName('*').length,
  getEventListenerCount: () => {
    // Approximate - requires instrumentation
    return window.__eventListenerCount || 0;
  },
  getDetachedNodes: () => {
    // Requires DevTools Protocol
    return [];
  }
};
```

## Common Memory Leak Patterns

### 1. Event Listener Leaks

```javascript
// BAD: Listener not removed
window.addEventListener('resize', handleResize);
// Component unmounts but listener remains

// GOOD: Proper cleanup
const controller = new AbortController();
window.addEventListener('resize', handleResize, { signal: controller.signal });
// On cleanup:
controller.abort();
```

### 2. IPC Channel Leaks

```javascript
// BAD: Accumulating listeners
ipcRenderer.on('data-update', (event, data) => {
  updateUI(data);
});

// GOOD: Remove listeners on cleanup
const handler = (event, data) => updateUI(data);
ipcRenderer.on('data-update', handler);
// On cleanup:
ipcRenderer.removeListener('data-update', handler);
```

### 3. Closure Leaks

```javascript
// BAD: Large object retained in closure
function createHandler(largeData) {
  return () => {
    console.log(largeData.someProperty); // largeData retained
  };
}

// GOOD: Extract only needed data
function createHandler(largeData) {
  const property = largeData.someProperty;
  return () => {
    console.log(property); // Only property retained
  };
}
```

### 4. BrowserWindow Leaks

```javascript
// BAD: Window reference retained
let windows = [];
function createWindow() {
  const win = new BrowserWindow({...});
  windows.push(win);
}

// GOOD: Clean up on close
function createWindow() {
  const win = new BrowserWindow({...});
  windows.push(win);
  win.on('closed', () => {
    windows = windows.filter(w => w !== win);
  });
}
```

## Memory Benchmarks

| Process | Idle Target | Warning | Critical |
|---------|-------------|---------|----------|
| Main Process | < 50MB | 100MB | 200MB |
| Renderer (simple) | < 100MB | 200MB | 400MB |
| Renderer (complex) | < 200MB | 400MB | 800MB |

## DevTools Integration

### Chrome DevTools Memory Panel

```javascript
// Enable remote debugging
app.commandLine.appendSwitch('remote-debugging-port', '9222');

// Access via chrome://inspect or DevTools Memory panel
```

### Programmatic DevTools Protocol

```javascript
const { debugger } = webContents;
debugger.attach('1.3');

// Take heap snapshot
debugger.sendCommand('HeapProfiler.takeHeapSnapshot');

// Track allocations
debugger.sendCommand('HeapProfiler.startTrackingHeapObjects');
```

## Best Practices

1. **Regular heap snapshots**: Take snapshots before and after operations
2. **Monitor RSS growth**: Track resident set size over time
3. **Clean up listeners**: Always remove event listeners on component unmount
4. **Weak references**: Use WeakMap/WeakSet for caches
5. **Limit window instances**: Pool and reuse BrowserWindows when possible
6. **Profile in production mode**: Development mode has different memory characteristics

## Related Skills

- `electron-ipc-security-audit` - Check for IPC listener leaks
- `electron-builder-config` - Optimize bundle for memory
- `startup-time-profiler` - Related performance optimization

## Related Agents

- `electron-architect` - Architecture guidance for memory efficiency
- `performance-test-engineer` - Comprehensive performance testing
