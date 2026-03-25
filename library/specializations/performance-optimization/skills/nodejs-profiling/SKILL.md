---
name: nodejs-profiling
description: Expert skill for Node.js-specific profiling and optimization. Use V8 CPU profiler, analyze heap snapshots, configure clinic.js tools (Doctor, Flame, Bubbleprof), debug event loop blocking, analyze async hooks performance, and optimize V8 JIT compilation.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: runtime-profiling
  backlog-id: SK-018
---

# nodejs-profiling

You are **nodejs-profiling** - a specialized skill for Node.js runtime profiling and optimization. This skill provides expert capabilities for analyzing Node.js application performance including CPU profiling, memory analysis, event loop debugging, and V8 optimization.

## Overview

This skill enables AI-powered Node.js profiling including:
- Using V8 CPU profiler for hot path identification
- Analyzing heap snapshots for memory leaks
- Configuring clinic.js tools (Doctor, Flame, Bubbleprof)
- Debugging event loop blocking and delays
- Profiling async operations with async_hooks
- Optimizing V8 JIT compilation
- Profiling native addons

## Prerequisites

- Node.js 16+ (18+ or 20+ recommended)
- npm/yarn for package management
- clinic.js: `npm install -g clinic`
- Optional: 0x for flame graphs, heapdump for snapshots

## Capabilities

### 1. V8 CPU Profiling

Profile CPU usage using V8's built-in profiler:

```javascript
// cpu-profile.js - Programmatic CPU profiling
const v8Profiler = require('v8-profiler-next');
const fs = require('fs');

// Start profiling
v8Profiler.setGenerateType(1); // Generate call tree
v8Profiler.startProfiling('cpu-profile', true);

// Run your workload
await runWorkload();

// Stop and save profile
const profile = v8Profiler.stopProfiling('cpu-profile');
const profileData = profile.export();

fs.writeFileSync('cpu-profile.cpuprofile', JSON.stringify(profileData));
profile.delete();

console.log('CPU profile saved to cpu-profile.cpuprofile');
```

```bash
# Using Node.js built-in profiler
node --prof app.js
node --prof-process isolate-0x*.log > processed.txt

# Generate V8 log for analysis
node --trace-opt --trace-deopt app.js 2>&1 | grep -E "(opt|deopt)"

# Run with inspector for Chrome DevTools profiling
node --inspect app.js
# Then open chrome://inspect in Chrome
```

### 2. Heap Snapshot Analysis

Capture and analyze heap snapshots:

```javascript
// heap-analysis.js
const v8 = require('v8');
const fs = require('fs');

// Take heap snapshot
function takeHeapSnapshot(filename) {
  const snapshotStream = v8.writeHeapSnapshot(filename);
  console.log(`Heap snapshot written to ${snapshotStream}`);
  return snapshotStream;
}

// Memory usage tracking
function trackMemory() {
  const usage = process.memoryUsage();
  return {
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    arrayBuffers: `${(usage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`
  };
}

// Heap statistics
function getHeapStats() {
  const stats = v8.getHeapStatistics();
  return {
    totalHeapSize: `${(stats.total_heap_size / 1024 / 1024).toFixed(2)} MB`,
    usedHeapSize: `${(stats.used_heap_size / 1024 / 1024).toFixed(2)} MB`,
    heapSizeLimit: `${(stats.heap_size_limit / 1024 / 1024).toFixed(2)} MB`,
    mallocedMemory: `${(stats.malloced_memory / 1024 / 1024).toFixed(2)} MB`,
    peakMallocedMemory: `${(stats.peak_malloced_memory / 1024 / 1024).toFixed(2)} MB`
  };
}

// Trigger garbage collection (requires --expose-gc flag)
function forceGC() {
  if (global.gc) {
    global.gc();
    console.log('Garbage collection triggered');
  } else {
    console.warn('Run with --expose-gc to enable manual GC');
  }
}
```

### 3. Clinic.js Tools

Use clinic.js suite for comprehensive analysis:

```bash
# Clinic Doctor - Overall health check
clinic doctor -- node app.js
# Generates: .clinic/xxx.clinic-doctor

# Clinic Flame - CPU flame graphs
clinic flame -- node app.js
# Generates: .clinic/xxx.clinic-flame

# Clinic Bubbleprof - Async operations visualization
clinic bubbleprof -- node app.js
# Generates: .clinic/xxx.clinic-bubbleprof

# Clinic Heap Profiler - Memory analysis
clinic heapprofiler -- node app.js
# Generates: .clinic/xxx.clinic-heapprofiler

# Run with specific workload
clinic flame --autocannon [ /api/users -- -c 10 -d 30 ] -- node app.js

# Analyze specific endpoint
clinic bubbleprof --autocannon [ /api/slow-endpoint -c 5 -d 60 ] -- node server.js
```

```javascript
// Using clinic programmatically
const ClinicDoctor = require('@clinic/doctor');
const doctor = new ClinicDoctor();

doctor.collect(['node', 'app.js'], (err, filepath) => {
  if (err) throw err;

  doctor.visualize(filepath, filepath + '.html', (err) => {
    if (err) throw err;
    console.log(`Report: ${filepath}.html`);
  });
});
```

### 4. Event Loop Analysis

Debug event loop blocking and delays:

```javascript
// event-loop-monitor.js
const { monitorEventLoopDelay } = require('perf_hooks');

// Create histogram for event loop delay
const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();

// Periodic reporting
setInterval(() => {
  console.log('Event Loop Delay:');
  console.log(`  Min: ${h.min / 1e6} ms`);
  console.log(`  Max: ${h.max / 1e6} ms`);
  console.log(`  Mean: ${h.mean / 1e6} ms`);
  console.log(`  P50: ${h.percentile(50) / 1e6} ms`);
  console.log(`  P99: ${h.percentile(99) / 1e6} ms`);
  h.reset();
}, 5000);

// Detect blocking operations
const blocked = require('blocked-at');
blocked((time, stack, { type, resource }) => {
  console.warn(`Event loop blocked for ${time}ms`);
  console.warn(`Type: ${type}`);
  console.warn(`Stack:\n${stack.join('\n')}`);
}, { threshold: 100, resourcesCap: 100 });
```

```javascript
// Async operation timing
const async_hooks = require('async_hooks');
const { performance, PerformanceObserver } = require('perf_hooks');

// Track async operation durations
const asyncTiming = new Map();

const hook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    asyncTiming.set(asyncId, {
      type,
      start: performance.now(),
      triggerAsyncId
    });
  },
  destroy(asyncId) {
    const timing = asyncTiming.get(asyncId);
    if (timing) {
      const duration = performance.now() - timing.start;
      if (duration > 100) { // Log slow operations
        console.log(`Slow async: ${timing.type} took ${duration.toFixed(2)}ms`);
      }
      asyncTiming.delete(asyncId);
    }
  }
});

hook.enable();
```

### 5. Flame Graph Generation

Generate flame graphs for CPU analysis:

```bash
# Using 0x
npm install -g 0x
0x -o app.js
# Opens flame graph in browser

# Using perf and FlameGraph (Linux)
perf record -F 99 -g -- node app.js
perf script | ./stackcollapse-perf.pl | ./flamegraph.pl > flame.svg

# Using node --perf-basic-prof
node --perf-basic-prof app.js &
perf record -F 99 -p $! -g -- sleep 30
perf script | ./stackcollapse-perf.pl | ./flamegraph.pl > flame.svg
```

### 6. V8 Optimization Analysis

Analyze V8 JIT optimization:

```bash
# Trace optimizations and deoptimizations
node --trace-opt --trace-deopt app.js 2>&1 | tee opt.log

# Analyze inline caches
node --trace-ic app.js 2>&1 | tee ic.log

# Check for hidden class transitions
node --allow-natives-syntax -e "
  function Point(x, y) { this.x = x; this.y = y; }
  const p = new Point(1, 2);
  %DebugPrint(p);
  %HaveSameMap(new Point(1,2), p);
"

# Detailed V8 flags
node --v8-options | grep -i "optimize"
```

```javascript
// Optimization hints (for debugging only)
function optimizedFunction(a, b) {
  // This function should be optimized
  return a + b;
}

// Check if function is optimized (requires --allow-natives-syntax)
// %OptimizeFunctionOnNextCall(optimizedFunction);
// optimizedFunction(1, 2);
// console.log(%GetOptimizationStatus(optimizedFunction));
```

### 7. Memory Leak Detection

Detect and diagnose memory leaks:

```javascript
// leak-detector.js
const memwatch = require('@airbnb/node-memwatch');

// Detect leak trends
memwatch.on('leak', (info) => {
  console.error('Memory leak detected:');
  console.error(JSON.stringify(info, null, 2));
});

// Track heap diffs
let lastHeapDiff = null;

memwatch.on('stats', (stats) => {
  console.log('GC occurred:');
  console.log(`  Heap used: ${(stats.used_heap_size / 1024 / 1024).toFixed(2)} MB`);

  if (lastHeapDiff) {
    const diff = new memwatch.HeapDiff();
    // ... run some code ...
    const changes = diff.end();
    console.log('Heap changes:', JSON.stringify(changes.change, null, 2));
  }
});

// Programmatic heap diff
function findLeaks() {
  const hd = new memwatch.HeapDiff();

  // Run suspected leaky code
  suspectedLeakyFunction();

  const diff = hd.end();
  return diff.change.details.filter(d =>
    d.size_bytes > 10000 && d['+'] > d['-']
  );
}
```

### 8. Performance Measurement API

Use built-in performance APIs:

```javascript
// performance-monitoring.js
const {
  performance,
  PerformanceObserver,
  createHistogram
} = require('perf_hooks');

// Measure specific operations
performance.mark('operation-start');
await performOperation();
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');

// Observe measurements
const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
  });
});
obs.observe({ entryTypes: ['measure', 'function'] });

// Create histogram for repeated measurements
const histogram = createHistogram();

function timedOperation() {
  const start = process.hrtime.bigint();
  // ... operation ...
  const duration = Number(process.hrtime.bigint() - start);
  histogram.record(duration);
}

// Report histogram
console.log({
  min: histogram.min,
  max: histogram.max,
  mean: histogram.mean,
  p50: histogram.percentile(50),
  p99: histogram.percentile(99)
});
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Use Case |
|--------|-------------|----------|
| clinic.js | Node.js profiling suite | Comprehensive analysis |
| Sentry MCP | Error tracking | Performance correlation |
| OpenTelemetry | Distributed tracing | Production profiling |

## Best Practices

### Profiling

1. **Profile in production-like environment** - Results vary by environment
2. **Warm up before measuring** - JIT needs time to optimize
3. **Multiple runs** - Take statistical significance into account
4. **Focus on hot paths** - Optimize what matters

### Memory

1. **Regular heap snapshots** - Compare over time
2. **Watch for trends** - Slow leaks are hard to spot
3. **Test with production data sizes** - Leaks scale with data
4. **Use weak references** - For caches and listeners

### Event Loop

1. **Avoid sync operations** - Use async alternatives
2. **Batch CPU work** - Use setImmediate to yield
3. **Worker threads** - For CPU-intensive work
4. **Monitor in production** - Use perf_hooks

## Process Integration

This skill integrates with the following processes:
- `cpu-profiling-investigation.js` - CPU profiling workflows
- `memory-profiling-analysis.js` - Memory analysis
- `memory-leak-detection.js` - Leak detection

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "profile-cpu",
  "status": "completed",
  "duration": "30s",
  "profile": {
    "samples": 15420,
    "topFunctions": [
      {
        "name": "processRequest",
        "selfTime": "2340ms",
        "totalTime": "8920ms",
        "percentage": "28.5%",
        "file": "handlers.js:45"
      },
      {
        "name": "serializeResponse",
        "selfTime": "1890ms",
        "totalTime": "2100ms",
        "percentage": "22.1%",
        "file": "serializer.js:12"
      }
    ],
    "eventLoopDelay": {
      "mean": "2.3ms",
      "p99": "15.8ms",
      "max": "45.2ms"
    }
  },
  "recommendations": [
    {
      "function": "processRequest",
      "issue": "High CPU time in JSON parsing",
      "suggestion": "Consider streaming JSON parser for large payloads"
    }
  ],
  "artifacts": ["cpu-profile.cpuprofile", "flame.svg"]
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `Cannot take heap snapshot` | OOM condition | Increase memory limit |
| `Profiler already started` | Multiple profile sessions | Stop existing profiler |
| `Event loop blocked` | Sync operation | Use async alternative |
| `High GC time` | Memory pressure | Reduce allocations, increase heap |

## Constraints

- Profiling adds overhead - avoid in production
- Heap snapshots pause the process
- Event loop monitoring has minimal overhead
- V8 flags are debug-only
