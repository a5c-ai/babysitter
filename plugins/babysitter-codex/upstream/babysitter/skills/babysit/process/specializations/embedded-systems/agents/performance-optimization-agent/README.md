# Performance Optimization Expert Agent

## Overview

The Performance Optimization Expert agent provides specialized guidance for analyzing and optimizing embedded system performance. With deep expertise in code profiling, assembly optimization, and real-time systems, this agent helps identify bottlenecks and implement efficient solutions.

## Quick Start

### Basic Consultation

```javascript
// In a babysitter process
const analysis = await ctx.task(performanceConsult, {
  context: {
    application: 'Audio processing pipeline',
    mcu: 'STM32H750',
    sampleRate: 48000,
    deadline: '20.8us per sample'
  },
  questions: [
    'Where are the performance bottlenecks?',
    'How can I meet the real-time deadline?',
    'Should I use DMA or CPU for data transfer?'
  ]
});
```

## Expertise Areas

### Code Optimization

- **Profiling**: Hot spot identification, call graphs
- **Algorithms**: Complexity reduction, lookup tables
- **Assembly**: Hand-tuned critical sections
- **SIMD**: NEON/DSP instruction utilization

### Memory Optimization

- **Cache**: Cache-friendly data structures
- **DMA**: Zero-copy data transfer
- **Placement**: TCM, cache, external memory
- **Alignment**: Data structure padding

### Real-Time Analysis

- **WCET**: Worst-case timing analysis
- **Jitter**: Interrupt latency measurement
- **Scheduling**: Priority analysis
- **Deadlines**: Timing margin calculation

## Use Cases

### 1. Profile and Optimize Hot Spots

Identify and optimize performance bottlenecks:

```javascript
const result = await ctx.task(profileAndOptimize, {
  targetFunction: 'audio_process',
  deadline_us: 20.8,
  constraints: {
    codeSize: 'moderate',  // Allow some size increase
    maintainability: 'high'
  }
});

// Output includes:
// - Cycle counts per function
// - Hot spot identification
// - Optimization recommendations
// - Expected improvement
```

### 2. DMA Configuration

Optimize DMA for maximum throughput:

```javascript
const result = await ctx.task(optimizeDMA, {
  peripheral: 'ADC',
  sampleRate: 100000,
  bufferSize: 256,
  requirements: {
    latency: 'low',
    cpuOverhead: 'minimal'
  }
});

// Output:
// - DMA configuration code
// - Buffer sizing recommendations
// - Double-buffer implementation
```

### 3. WCET Analysis

Analyze worst-case execution time:

```javascript
const result = await ctx.task(analyzeWCET, {
  function: 'motor_control_isr',
  deadline_us: 50,
  mcu: 'STM32F407',
  clockMHz: 168
});

// Output:
// - Static WCET estimate
// - Path analysis
// - Timing margin
// - Risk assessment
```

### 4. Cache Optimization

Optimize cache utilization:

```javascript
const result = await ctx.task(optimizeCache, {
  dataStructures: [
    { name: 'lookupTable', size: 4096, accessPattern: 'random' },
    { name: 'sampleBuffer', size: 1024, accessPattern: 'sequential' }
  ],
  mcuCache: {
    iCache: 16384,
    dCache: 16384,
    lineSize: 32
  }
});
```

## Interaction Patterns

### Performance Review Request

```json
{
  "agent": "perf-optimization-expert",
  "prompt": {
    "role": "Performance Engineer",
    "task": "Analyze and optimize critical path performance",
    "context": {
      "function": "fir_filter",
      "currentCycles": 2850,
      "targetCycles": 1000,
      "mcu": "STM32F407",
      "clockMHz": 168
    },
    "instructions": [
      "Profile current implementation",
      "Identify optimization opportunities",
      "Recommend specific changes",
      "Estimate achievable performance"
    ]
  }
}
```

### Response Format

```json
{
  "analysis": {
    "currentCycles": 2850,
    "targetCycles": 1000,
    "gap": 1850
  },
  "hotSpots": [
    {
      "location": "inner loop multiply",
      "cycles": 1600,
      "percentage": 56,
      "cause": "using float multiply instead of fixed-point"
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "change": "Use CMSIS-DSP arm_fir_q15",
      "expectedCycles": 650,
      "effort": "low"
    }
  ],
  "achievablePerformance": {
    "optimizedCycles": 650,
    "improvement": "4.4x",
    "meetsTarget": true
  }
}
```

## Optimization Techniques

### Quick Wins (Low Effort, Good Gains)

| Technique | Typical Gain | Example |
|-----------|--------------|---------|
| Compiler flags | 20-50% | `-O2 -flto` |
| Vendor libraries | 2-10x | CMSIS-DSP |
| DMA transfers | 10-50x | Replace polling |
| Lookup tables | 5-20x | Replace sin() |

### Medium Effort

| Technique | Typical Gain | Example |
|-----------|--------------|---------|
| Algorithm change | 2-100x | O(n^2) to O(n) |
| Cache optimization | 2-10x | Data layout |
| Loop unrolling | 1.5-3x | Manual unroll |
| Fixed-point math | 2-5x | Q15 instead of float |

### High Effort

| Technique | Typical Gain | Example |
|-----------|--------------|---------|
| Assembly optimization | 2-5x | Hand-tuned DSP |
| SIMD utilization | 2-8x | NEON intrinsics |
| Custom accelerator | 10-100x | Hardware offload |

## Decision Guidance

### When to Use Assembly

Use assembly when:
- Profile shows clear hot spot (>20% time)
- Algorithm is already optimal
- Measurable deadline pressure
- Function is stable (won't change often)

Avoid assembly when:
- Code is still evolving
- Portability is required
- Compiler generates good code
- Maintainability is priority

### DMA vs CPU Transfer

| Factor | Use DMA | Use CPU |
|--------|---------|---------|
| Data size | Large (>32 bytes) | Small (<32 bytes) |
| Frequency | Continuous/periodic | Sporadic |
| CPU load | High utilization | Low utilization |
| Latency | Tolerant | Critical |

## Best Practices

### Profiling
- Always profile before optimizing
- Use multiple profiling methods (cycle counter, sampling)
- Profile on target hardware, not simulator
- Profile with realistic data

### Optimization
- Start with algorithm improvements
- Use vendor-optimized libraries
- Measure after each change
- Document optimization rationale

### Maintenance
- Keep original code for reference
- Add performance regression tests
- Re-evaluate after toolchain updates
- Monitor production performance

## Integration

### Process Integration

The Performance Optimization Expert integrates with:

- `execution-speed-profiling.js` - Profiling workflow
- `code-size-optimization.js` - Size/speed tradeoffs
- `dma-optimization.js` - DMA configuration

### Agent Integration

Works with:
- `power-optimization-expert` - Power/performance balance
- `firmware-architect` - Architecture decisions

## References

- ARM Cortex-M Optimization Guides
- CMSIS-DSP Library Documentation
- Compiler Optimization Manuals (GCC, ARM)
- "Embedded Systems Architecture" by Tammy Noergaard

## See Also

- [AGENT.md](./AGENT.md) - Full agent definition
- [Execution Speed Profiling Process](../../execution-speed-profiling.js)
- [DMA Optimization Process](../../dma-optimization.js)
