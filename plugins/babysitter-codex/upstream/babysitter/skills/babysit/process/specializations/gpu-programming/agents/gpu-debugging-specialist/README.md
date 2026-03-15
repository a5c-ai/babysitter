# GPU Debugging Specialist Agent

## Overview

The `gpu-debugging-specialist` agent embodies the expertise of a GPU Quality Assurance Engineer. It provides expert guidance on debugging, validation, and correctness verification for CUDA and GPU parallel programs.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | GPU Quality Assurance Engineer |
| **Experience** | 6+ years in GPU debugging and validation |
| **Background** | Testing and validation for parallel computing |
| **Philosophy** | "Correctness before performance" |

## Core Principles

1. **Systematic Debugging** - Follow structured methodologies
2. **Reproducibility** - Create minimal test cases
3. **Root Cause Analysis** - Don't just fix symptoms
4. **Validation First** - Verify before optimizing
5. **Documentation** - Document all findings
6. **Prevention** - Design for debuggability

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Compute-Sanitizer** | memcheck, racecheck, initcheck, synccheck |
| **Race Detection** | Shared memory races, WAR/WAW/RAW hazards |
| **Memory Errors** | Out-of-bounds, leaks, misalignment |
| **Numerical Validation** | CPU reference, floating-point issues |
| **Synchronization** | Missing barriers, divergent sync |
| **Parallel Debugging** | Strategies for massively parallel code |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(gpuDebuggingTask, {
  agentName: 'gpu-debugging-specialist',
  prompt: {
    role: 'GPU QA Engineer',
    task: 'Debug incorrect reduction results',
    context: {
      symptom: 'Intermittent wrong results',
      kernelCode: kernelSource,
      launchConfig: {blocks: 256, threads: 256}
    },
    instructions: [
      'Identify potential race conditions',
      'Recommend debugging approach',
      'Provide fix and verification plan'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Debug memory errors
/agent gpu-debugging-specialist debug-memory \
  --program ./cuda_app \
  --tool memcheck

# Analyze race conditions
/agent gpu-debugging-specialist analyze-races \
  --kernel reduction.cu \
  --report race_report.nvsanreport

# Validate numerical correctness
/agent gpu-debugging-specialist validate \
  --program ./cuda_app \
  --reference ./cpu_reference
```

## Common Tasks

### 1. Memory Error Investigation

```bash
/agent gpu-debugging-specialist investigate-memory \
  --program ./cuda_app \
  --error "Invalid __global__ read of size 4" \
  --address 0x7f1234567890
```

Provides:
- Error classification
- Root cause analysis
- Fix recommendation
- Prevention strategy

### 2. Race Condition Analysis

```bash
/agent gpu-debugging-specialist analyze-race \
  --kernel reduction_kernel \
  --racecheck-report races.nvsanreport
```

Provides:
- Hazard type identification
- Thread interleaving analysis
- Synchronization fix
- Verification approach

### 3. Numerical Validation Design

```bash
/agent gpu-debugging-specialist design-validation \
  --kernel matrix_multiply \
  --precision float \
  --tolerance 1e-5
```

Provides:
- CPU reference implementation
- Tolerance recommendations
- Test case design
- Error reporting format

### 4. Debugging Strategy

```bash
/agent gpu-debugging-specialist create-debug-plan \
  --symptom "Kernel produces NaN values" \
  --kernel forward_pass.cu
```

Provides:
- Systematic debugging steps
- Tool recommendations
- Instrumentation suggestions
- Verification checklist

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `gpu-debugging-techniques.js` | All debugging phases |
| `gpu-performance-regression-testing.js` | Correctness verification |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const debugKernelTask = defineTask({
  name: 'debug-kernel',
  description: 'Debug a CUDA kernel with systematic approach',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Debug ${inputs.kernelName}`,
      agent: {
        name: 'gpu-debugging-specialist',
        prompt: {
          role: 'GPU Quality Assurance Engineer',
          task: 'Diagnose and fix kernel issue',
          context: {
            kernel: inputs.kernelName,
            symptom: inputs.symptom,
            code: inputs.kernelSource,
            launchConfig: inputs.launchConfig,
            sanitizerOutput: inputs.sanitizerReport
          },
          instructions: [
            'Analyze the reported symptom',
            'Identify potential root causes',
            'Recommend debugging tools and approach',
            'Provide specific fix recommendations',
            'Design verification test'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['diagnosis', 'fix', 'verification'],
          properties: {
            diagnosis: { type: 'object' },
            fix: { type: 'object' },
            verification: { type: 'object' }
          }
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

## Debugging Reference

### Compute-Sanitizer Tools

| Tool | Purpose | Use When |
|------|---------|----------|
| `memcheck` | Memory errors, leaks | First-line debugging |
| `racecheck` | Shared memory races | Intermittent results |
| `initcheck` | Uninitialized reads | Data corruption |
| `synccheck` | Sync violations | Hangs, crashes |

### Common Error Types

| Error | Typical Cause | Fix Approach |
|-------|--------------|--------------|
| Out-of-bounds | Bad indexing | Add bounds check |
| Race condition | Missing sync | Add `__syncthreads()` |
| Memory leak | Missing free | Track allocations |
| NaN propagation | Invalid math | Validate inputs |

### Debugging Workflow

```
1. Reproduce -> 2. Isolate -> 3. Instrument -> 4. Analyze -> 5. Fix -> 6. Verify
```

## Interaction Guidelines

### What to Expect

- **Systematic approach** to debugging
- **Root cause focus** not just symptom fixes
- **Verification plans** for all fixes
- **Prevention strategies** for future issues

### Best Practices

1. Provide complete symptom description
2. Include kernel source code
3. Share launch configuration
4. Mention reproduction rate (always/intermittent)
5. Include any sanitizer output

## Related Resources

- [cuda-debugging skill](../skills/cuda-debugging/) - Tool expertise
- [gpu-benchmarking skill](../skills/gpu-benchmarking/) - Regression detection
- [cuda-toolkit skill](../skills/cuda-toolkit/) - Kernel development

## References

- [NVIDIA Compute Sanitizer](https://docs.nvidia.com/compute-sanitizer/ComputeSanitizer/index.html)
- [CUDA-GDB User Guide](https://docs.nvidia.com/cuda/cuda-gdb/index.html)
- [Debugging CUDA Applications](https://developer.nvidia.com/blog/cuda-debugging-tips/)
- [Claude Debugs For You MCP](https://github.com/jasonjmcghee/claude-debugs-for-you)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-010
**Category:** Debugging
**Status:** Active
