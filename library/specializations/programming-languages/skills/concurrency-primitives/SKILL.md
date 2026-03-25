---
name: Concurrency Primitives
description: Expert skill for implementing language-level concurrency support including threads, channels, and synchronization
category: Runtime
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Concurrency Primitives Skill

## Overview

Expert skill for implementing language-level concurrency support including threads, channels, and synchronization.

## Capabilities

- Design threading API and primitives
- Implement mutex and condition variables
- Implement channel-based message passing
- Design async/await and coroutine systems
- Implement work-stealing schedulers
- Handle thread-local storage
- Design memory model and ordering
- Implement green threads/goroutines

## Target Processes

- concurrency-primitives.js
- interpreter-implementation.js
- bytecode-vm-implementation.js
- garbage-collector-implementation.js

## Dependencies

Concurrency theory, Go scheduler references

## Usage Guidelines

1. **Model Choice**: Choose between shared memory and message passing based on language goals
2. **Memory Model**: Define memory ordering semantics clearly
3. **Scheduling**: Design scheduler with fairness and efficiency in mind
4. **Integration**: Ensure GC and concurrency work together correctly
5. **Testing**: Build concurrency stress tests from the start

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "model": {
      "type": "string",
      "enum": ["shared-memory", "message-passing", "actor", "csp"]
    },
    "primitives": {
      "type": "array",
      "items": { "type": "string" }
    },
    "schedulerType": {
      "type": "string",
      "enum": ["os-threads", "green-threads", "work-stealing", "cooperative"]
    },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
