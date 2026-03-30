---
name: Language Server Protocol
description: Expert skill for implementing Language Server Protocol servers with full IDE feature support
category: Tooling
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Language Server Protocol Skill

## Overview

Expert skill for implementing Language Server Protocol servers with full IDE feature support.

## Capabilities

- Implement JSON-RPC transport layer
- Handle document synchronization (full and incremental)
- Implement semantic tokens for syntax highlighting
- Implement completion with resolve
- Implement hover information with type signatures
- Implement go-to-definition/references/implementations
- Implement document symbols and workspace symbols
- Implement rename with cross-file support
- Implement code actions and quick fixes
- Implement signature help

## Target Processes

- lsp-server-implementation.js
- debugger-adapter-development.js
- error-message-enhancement.js
- semantic-analysis.js

## Dependencies

- LSP specification
- vscode-languageserver libraries
- tower-lsp (Rust)

## Usage Guidelines

1. **Transport**: Start with stdio transport, add TCP/websocket as needed
2. **Incremental Sync**: Implement incremental document sync for performance
3. **Caching**: Cache analysis results and invalidate on document changes
4. **Error Tolerance**: Handle malformed documents gracefully
5. **Progress**: Report progress for long-running operations

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "capabilities": {
      "type": "array",
      "items": { "type": "string" }
    },
    "transportType": {
      "type": "string",
      "enum": ["stdio", "tcp", "websocket"]
    },
    "documentSync": {
      "type": "string",
      "enum": ["full", "incremental"]
    },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
