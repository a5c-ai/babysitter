# Garbage Collection Skill

Expert skill for garbage collector design and implementation including various collection algorithms.

## Quick Reference

- **Category**: Memory Management
- **ID**: SK-008

## Key Capabilities

- Mark-sweep collection implementation
- Copying/semi-space collector implementation
- Generational collection with write barriers
- Concurrent/incremental marking (tri-color)
- Object header layout and type info design
- Precise vs conservative root scanning
- Card table and remembered set implementations
- Finalizer and weak reference handling

## When to Use

Use this skill when implementing:
- Automatic memory management for language runtimes
- Generational garbage collectors
- Concurrent collectors for low-latency requirements
- Memory profiling and leak detection

## Related Skills

- memory-allocator (SK-009)
- bytecode-vm (SK-010)
- concurrency-primitives (SK-020)
