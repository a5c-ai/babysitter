---
name: unity-profiler
description: Unity Profiler skill for performance analysis, frame debugging, memory profiling, and optimization workflows.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Unity Profiler Skill

Performance profiling and optimization using Unity Profiler tools.

## Overview

This skill provides capabilities for analyzing and optimizing Unity game performance using the Profiler, Frame Debugger, and Memory Profiler.

## Capabilities

### CPU Profiling
- Analyze frame timing
- Identify bottlenecks
- Profile custom code markers
- Handle deep profiling

### GPU Profiling
- Analyze render passes
- Profile shader performance
- Identify overdraw
- Debug draw calls

### Memory Profiling
- Track allocations
- Identify memory leaks
- Analyze texture memory
- Profile managed heap

### Automated Analysis
- Create profiler scripts
- Set up performance tests
- Generate reports
- Monitor regressions

## Prerequisites

- Unity 2021.3+
- Profiler module (built-in)
- Memory Profiler package (optional)

## Usage Patterns

### Custom Profiler Markers

```csharp
using Unity.Profiling;

public class OptimizedSystem : MonoBehaviour
{
    static readonly ProfilerMarker s_UpdateMarker =
        new ProfilerMarker("MySystem.Update");

    void Update()
    {
        using (s_UpdateMarker.Auto())
        {
            // Code to profile
            ProcessEntities();
        }
    }
}
```

### Performance Test

```csharp
[Test, Performance]
public void TestSpawnPerformance()
{
    Measure.Method(() =>
    {
        for (int i = 0; i < 1000; i++)
        {
            SpawnEnemy();
        }
    })
    .WarmupCount(3)
    .MeasurementCount(10)
    .Run();
}
```

## Best Practices

1. Profile on target hardware
2. Use profiler markers
3. Test with realistic data
4. Monitor frame budget
5. Track memory over time

## References

- [Profiler Documentation](https://docs.unity3d.com/Manual/Profiler.html)
