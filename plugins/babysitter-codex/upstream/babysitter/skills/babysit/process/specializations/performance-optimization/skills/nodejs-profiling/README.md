# Node.js Profiling Skill

## Overview

The `nodejs-profiling` skill provides expert capabilities for Node.js runtime profiling and optimization. It enables AI-powered performance analysis including V8 profiling, heap snapshot analysis, clinic.js tooling, event loop monitoring, and V8 JIT optimization.

## Quick Start

### Prerequisites

1. **Node.js 16+** - Recommended 18+ or 20+ LTS
2. **clinic.js** - `npm install -g clinic`
3. **Optional** - 0x, v8-profiler-next, heapdump

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

Install profiling tools:

```bash
# Install clinic.js suite
npm install -g clinic

# Install 0x for flame graphs
npm install -g 0x

# Project dependencies for programmatic profiling
npm install v8-profiler-next heapdump @airbnb/node-memwatch
```

## Usage

### Basic Operations

```bash
# Run CPU profile
/skill nodejs-profiling profile-cpu --script app.js --duration 30s

# Generate flame graph
/skill nodejs-profiling flame-graph --script server.js

# Monitor event loop
/skill nodejs-profiling monitor-event-loop --script app.js
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(nodejsProfilingTask, {
  operation: 'full-analysis',
  script: './server.js',
  duration: '60s',
  tools: ['doctor', 'flame', 'bubbleprof']
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **V8 CPU Profiling** | Identify hot functions and call trees |
| **Heap Analysis** | Memory snapshots and leak detection |
| **Clinic.js** | Doctor, Flame, Bubbleprof analysis |
| **Event Loop** | Blocking detection and delay monitoring |
| **Async Profiling** | Async operation timing with async_hooks |
| **V8 Optimization** | JIT analysis, deoptimization tracking |

## Examples

### Example 1: Quick Health Check

```bash
# Run clinic doctor for overall health
/skill nodejs-profiling health-check --script server.js --load-test
```

Output:
```
Health Analysis Complete
========================
CPU: Healthy (no sustained CPU spikes)
Memory: Warning (heap growing over time)
Event Loop: Healthy (p99 delay < 10ms)
I/O: Healthy (no I/O bottlenecks)

Recommendations:
1. Investigate memory growth - potential leak in request handlers
2. Consider --max-old-space-size=4096 for production
```

### Example 2: CPU Flame Graph

```bash
# Generate CPU flame graph
/skill nodejs-profiling flame-graph \
  --script server.js \
  --autocannon "/api/users -c 10 -d 30" \
  --output flame.html
```

### Example 3: Memory Analysis

```bash
# Capture and analyze heap snapshots
/skill nodejs-profiling memory-analysis \
  --script app.js \
  --snapshots 3 \
  --interval 60s
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_OPTIONS` | Node.js runtime options | - |
| `UV_THREADPOOL_SIZE` | libuv thread pool size | `4` |
| `NODE_HEAPDUMP_OPTIONS` | Heapdump configuration | - |

### Skill Configuration

```yaml
# .babysitter/skills/nodejs-profiling.yaml
nodejs-profiling:
  node:
    version: "20"
    heapSize: 4096
    exposeGC: true
  profiling:
    defaultDuration: 30s
    sampleInterval: 1000
  thresholds:
    eventLoopDelayP99: 50
    heapGrowthPercent: 20
  tools:
    clinic: true
    0x: true
```

## Clinic.js Tools Reference

### Clinic Doctor

Overall health diagnosis:

```bash
clinic doctor -- node server.js

# With load testing
clinic doctor --autocannon [ /api -c 10 -d 30 ] -- node server.js
```

**Diagnoses:**
- Event loop blocking
- Excessive GC
- Uneven event loop
- Memory issues

### Clinic Flame

CPU flame graphs:

```bash
clinic flame -- node app.js

# With specific workload
clinic flame --autocannon [ /heavy-endpoint -c 5 -d 60 ] -- node server.js
```

**Shows:**
- Hot code paths
- Function call hierarchy
- Time spent per function

### Clinic Bubbleprof

Async operations visualization:

```bash
clinic bubbleprof -- node server.js
```

**Shows:**
- Async operation flow
- Time in async boundaries
- Parallelism opportunities

### Clinic Heap Profiler

Memory allocation tracking:

```bash
clinic heapprofiler -- node app.js
```

**Shows:**
- Allocation sites
- Memory growth
- Object retention

## Event Loop Monitoring

### Built-in Monitoring

```javascript
const { monitorEventLoopDelay } = require('perf_hooks');

const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();

setInterval(() => {
  console.log({
    min: (h.min / 1e6).toFixed(2) + 'ms',
    max: (h.max / 1e6).toFixed(2) + 'ms',
    mean: (h.mean / 1e6).toFixed(2) + 'ms',
    p99: (h.percentile(99) / 1e6).toFixed(2) + 'ms'
  });
  h.reset();
}, 5000);
```

### Blocking Detection

```bash
# Install blocked-at
npm install blocked-at

# Use in code
const blocked = require('blocked-at');
blocked((time, stack) => {
  console.error(`Blocked for ${time}ms at:\n${stack.join('\n')}`);
});
```

## Process Integration

### Processes Using This Skill

1. **cpu-profiling-investigation.js** - CPU profiling workflows
2. **memory-profiling-analysis.js** - Memory analysis
3. **memory-leak-detection.js** - Leak detection

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const profileNodejsTask = defineTask({
  name: 'profile-nodejs-app',
  description: 'Profile Node.js application',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Profile: ${inputs.script}`,
      skill: {
        name: 'nodejs-profiling',
        context: {
          operation: 'full-profile',
          script: inputs.script,
          duration: inputs.duration || '30s',
          includeFlame: true,
          includeHeap: true
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## V8 Optimization Tips

### Enabling Optimizations

```javascript
// Monomorphic functions (single type)
function add(a, b) {
  return a + b;
}
// Call with consistent types
add(1, 2);    // Good
add(1, "2");  // Bad - causes deopt

// Avoid hidden class transitions
class Point {
  constructor(x, y) {
    this.x = x;  // Always initialize in same order
    this.y = y;
  }
}

// Avoid try-catch in hot paths
// V8 doesn't optimize functions with try-catch as well
```

### Checking Optimization Status

```bash
# Run with trace flags
node --trace-opt --trace-deopt app.js 2>&1 | grep -E "(OPTIM|DEOPTIM)"
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| High CPU usage | Run clinic flame, find hot paths |
| Memory growth | Take heap snapshots, compare |
| Event loop lag | Find blocking with blocked-at |
| Slow startup | Profile with --cpu-prof during init |
| High GC time | Reduce allocations, use object pools |

### Debug Commands

```bash
# CPU profile with built-in profiler
/skill nodejs-profiling cpu-profile --script app.js --output profile.cpuprofile

# Memory snapshot series
/skill nodejs-profiling heap-snapshots --script app.js --count 3 --interval 60

# Full diagnostic
/skill nodejs-profiling diagnose --script server.js --duration 120s
```

## Node.js Flags Reference

| Flag | Purpose |
|------|---------|
| `--inspect` | Enable inspector for DevTools |
| `--prof` | Generate V8 profiler output |
| `--cpu-prof` | Generate CPU profile |
| `--heap-prof` | Generate heap profile |
| `--expose-gc` | Allow manual GC |
| `--trace-opt` | Log V8 optimizations |
| `--trace-deopt` | Log V8 deoptimizations |
| `--max-old-space-size` | Set heap size limit |

## Related Skills

- **memlab-analysis** - Frontend JS memory analysis
- **flame-graph-generator** - General flame graphs
- **apm-instrumentation** - Production monitoring

## References

- [Node.js Diagnostics](https://nodejs.org/en/docs/guides/diagnostics/)
- [Clinic.js Documentation](https://clinicjs.org/)
- [V8 Profiler](https://v8.dev/docs/profile)
- [Node.js Performance Hooks](https://nodejs.org/api/perf_hooks.html)
- [0x Flame Graphs](https://github.com/davidmarkclements/0x)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-018
**Category:** Runtime Profiling
**Status:** Active
