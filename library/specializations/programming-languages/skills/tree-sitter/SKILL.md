---
name: Tree-sitter
description: Expert skill for creating tree-sitter grammars for incremental parsing and syntax highlighting
category: Tooling
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Tree-sitter Skill

## Overview

Expert skill for creating tree-sitter grammars for incremental parsing and syntax highlighting.

## Capabilities

- Write tree-sitter grammar.js files
- Handle tree-sitter external scanners
- Design queries for syntax highlighting
- Implement incremental parsing support
- Handle tree-sitter error recovery
- Generate bindings for various languages
- Integrate with editors (VS Code, Neovim, Helix)
- Test grammars with corpus files

## Target Processes

- language-grammar-design.js
- lexer-implementation.js
- parser-development.js
- lsp-server-implementation.js

## Dependencies

- tree-sitter CLI
- tree-sitter crates/npm packages

## Usage Guidelines

1. **Grammar.js**: Follow tree-sitter grammar.js conventions
2. **External Scanners**: Use external scanners for context-sensitive lexing
3. **Queries**: Write highlight.scm and other query files for editor integration
4. **Testing**: Build comprehensive corpus test files
5. **Error Recovery**: Design grammar with error recovery in mind

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "grammarName": { "type": "string" },
    "nodeTypes": {
      "type": "array",
      "items": { "type": "string" }
    },
    "queries": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["highlights", "injections", "locals", "tags", "folds"]
      }
    },
    "bindings": {
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
