---
name: Debug Adapter Protocol
description: Expert skill for implementing Debug Adapter Protocol for debugger integration
category: Tooling
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Debug Adapter Protocol Skill

## Overview

Expert skill for implementing Debug Adapter Protocol for debugger integration.

## Capabilities

- Implement DAP message handling
- Implement breakpoint management (line, conditional, function)
- Implement stepping (step in/out/over, continue)
- Implement stack trace retrieval
- Implement variable inspection and watch expressions
- Implement expression evaluation in debug context
- Handle launch vs attach configurations
- Implement exception breakpoints
- Support multi-threaded debugging

## Target Processes

- debugger-adapter-development.js
- lsp-server-implementation.js
- interpreter-implementation.js
- bytecode-vm-implementation.js

## Dependencies

- DAP specification
- vscode-debugadapter libraries

## Usage Guidelines

1. **Message Handling**: Implement robust JSON message parsing and validation
2. **Breakpoints**: Support line, conditional, and function breakpoints
3. **Stepping**: Implement all stepping modes with correct semantics
4. **Variables**: Implement lazy variable expansion for performance
5. **Evaluation**: Support expression evaluation in stopped state

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "capabilities": {
      "type": "array",
      "items": { "type": "string" }
    },
    "breakpointTypes": {
      "type": "array",
      "items": { "type": "string" }
    },
    "launchModes": {
      "type": "array",
      "items": { "type": "string" }
    },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
