# CUDA Debugging Skill

## Overview

The `cuda-debugging` skill provides expert capabilities for GPU debugging using NVIDIA's Compute Sanitizer and CUDA-GDB tools. It enables detection of memory errors, race conditions, synchronization issues, and provides actionable debugging recommendations.

## Quick Start

### Prerequisites

1. **CUDA Toolkit 11.0+** - With compute-sanitizer and cuda-gdb
2. **Debug Build** - Compile with `-G -lineinfo` flags
3. **Supported GPU** - Compute capability 3.5+

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

For enhanced debugging:

```bash
# Ensure compute-sanitizer is in PATH
which compute-sanitizer

# Verify cuda-gdb availability
which cuda-gdb
```

## Usage

### Basic Operations

```bash
# Run memory check
/skill cuda-debugging memcheck --program ./cuda_app

# Detect race conditions
/skill cuda-debugging racecheck --program ./cuda_app

# Check for uninitialized memory
/skill cuda-debugging initcheck --program ./cuda_app

# Generate comprehensive debug report
/skill cuda-debugging full-report --program ./cuda_app
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(cudaDebuggingTask, {
  operation: 'comprehensive-check',
  program: './cuda_program',
  tools: ['memcheck', 'racecheck', 'initcheck'],
  outputFile: 'debug_report.json'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Memcheck** | Detect memory access errors and leaks |
| **Racecheck** | Find shared memory race conditions |
| **Initcheck** | Detect uninitialized memory reads |
| **Synccheck** | Validate synchronization primitives |
| **CUDA-GDB** | Interactive kernel debugging |
| **Report Generation** | Create actionable debugging reports |

## Examples

### Example 1: Memory Error Detection

```bash
# Run memcheck with detailed reporting
/skill cuda-debugging memcheck \
  --program ./matrix_multiply \
  --log-file memcheck.log \
  --leak-check full \
  --verbose
```

Output:
```
========= CUDA-MEMCHECK
========= Invalid __global__ read of size 4
=========     at 0x00000148 in matrixMul(float*, float*, float*, int)
=========     by thread (256,0,0) in block (3,0,0)
=========     Address 0x7f2abc123400 is out of bounds
...
========= ERROR SUMMARY: 1 error
```

### Example 2: Race Condition Analysis

```bash
# Detect race conditions in reduction kernel
/skill cuda-debugging racecheck \
  --program ./parallel_reduction \
  --report all \
  --save racecheck.nvsanreport
```

### Example 3: Interactive Debugging Session

```bash
# Start CUDA-GDB session with breakpoint
/skill cuda-debugging gdb-session \
  --program ./cuda_app \
  --breakpoint myKernel \
  --enable-memcheck
```

### Example 4: Full Debug Report

```bash
# Generate comprehensive debug report
/skill cuda-debugging full-report \
  --program ./cuda_app \
  --output-format markdown \
  --include memcheck,racecheck,initcheck,synccheck
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CUDA_DEBUGGER_SOFTWARE_PREEMPTION` | Enable software preemption | `1` |
| `CUDA_VISIBLE_DEVICES` | Select GPU for debugging | `0` |
| `CUDA_LAUNCH_BLOCKING` | Synchronous kernel execution | `1` |

### Skill Configuration

```yaml
# .babysitter/skills/cuda-debugging.yaml
cuda-debugging:
  tools:
    compute-sanitizer:
      path: /usr/local/cuda/bin/compute-sanitizer
      default_options:
        - --show-backtrace=yes
        - --report-api-errors=all
    cuda-gdb:
      path: /usr/local/cuda/bin/cuda-gdb
  defaults:
    leak_check: full
    report_format: json
    save_reports: true
```

## Debugging Reference

### Build Flags

| Flag | Purpose |
|------|---------|
| `-G` | Generate debug information for device code |
| `-lineinfo` | Include line number information |
| `-Xcompiler -rdynamic` | Enable backtraces |
| `-O0` | Disable optimization for debugging |

### Compute Sanitizer Tools

| Tool | Purpose |
|------|---------|
| `memcheck` | Memory access errors and leaks |
| `racecheck` | Shared memory race conditions |
| `initcheck` | Uninitialized memory access |
| `synccheck` | Synchronization validation |

### Common CUDA-GDB Commands

| Command | Description |
|---------|-------------|
| `info cuda threads` | List GPU threads |
| `cuda thread (x,y,z) (a,b,c)` | Switch to thread |
| `cuda step` | Step one warp instruction |
| `print *d_ptr@N` | Print N elements of device array |

## Process Integration

### Processes Using This Skill

1. **gpu-debugging-techniques.js** - Comprehensive debugging workflows
2. **gpu-performance-regression-testing.js** - Correctness testing
3. **atomic-operations-synchronization.js** - Synchronization validation

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const debugKernelTask = defineTask({
  name: 'debug-kernel',
  description: 'Debug a CUDA kernel for memory and synchronization issues',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Debug ${inputs.kernelName}`,
      skill: {
        name: 'cuda-debugging',
        context: {
          operation: 'comprehensive-check',
          program: inputs.programPath,
          kernelName: inputs.kernelName,
          tools: ['memcheck', 'racecheck'],
          reportFormat: 'json'
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

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No debug info | Missing `-G` flag | Recompile with `-G -lineinfo` |
| Slow execution | Debug build overhead | Expected; use for debugging only |
| Cannot attach | GPU in use | Use `CUDA_VISIBLE_DEVICES` |
| Incomplete backtraces | Missing symbols | Add `-Xcompiler -rdynamic` |

### Debug Mode Setup

```bash
# Enable synchronous execution for debugging
export CUDA_LAUNCH_BLOCKING=1

# Enable software preemption
export CUDA_DEBUGGER_SOFTWARE_PREEMPTION=1

# Run with debugging
compute-sanitizer --tool memcheck ./cuda_program
```

## Related Skills

- **gpu-benchmarking** - Performance regression detection
- **nsight-profiler** - Performance profiling
- **cuda-toolkit** - Kernel development

## References

- [NVIDIA Compute Sanitizer Documentation](https://docs.nvidia.com/compute-sanitizer/ComputeSanitizer/index.html)
- [CUDA-GDB User Guide](https://docs.nvidia.com/cuda/cuda-gdb/index.html)
- [CUDA Debugging Best Practices](https://developer.nvidia.com/blog/cuda-debugging-tips/)
- [Claude Debugs For You MCP](https://github.com/jasonjmcghee/claude-debugs-for-you)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-010
**Category:** Debugging
**Status:** Active
