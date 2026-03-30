---
name: Parser Generator
description: Expert skill for parser generation and implementation using LL, LR, LALR, PEG, and Pratt parsing techniques
category: Compiler Frontend
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Parser Generator Skill

## Overview

Expert skill for parser generation and implementation using LL, LR, LALR, PEG, and Pratt parsing techniques.

## Capabilities

- Generate parsers from grammar specifications (ANTLR, Bison, tree-sitter)
- Implement recursive descent parsers with predictive parsing
- Implement Pratt parsers for expression handling
- Generate LALR/GLR parse tables
- Implement PEG parsers with packrat memoization
- Handle grammar conflicts (shift-reduce, reduce-reduce)
- Generate concrete syntax trees (CST) and AST transformations
- Implement operator precedence parsing

## Target Processes

- parser-development.js
- language-grammar-design.js
- ast-design.js
- lsp-server-implementation.js

## Dependencies

- ANTLR4
- tree-sitter
- Bison/Yacc

## Usage Guidelines

1. **Grammar Analysis**: Analyze grammar class requirements (LL(k), LALR, etc.) before selecting parser type
2. **Conflict Resolution**: Document and resolve all shift-reduce/reduce-reduce conflicts explicitly
3. **Error Recovery**: Implement synchronization points for robust error recovery
4. **AST Construction**: Design AST node types before implementing production actions
5. **Expression Parsing**: Use Pratt parsing for complex expression precedence handling

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "parserType": {
      "type": "string",
      "enum": ["recursive-descent", "pratt", "lalr", "glr", "peg", "ll"]
    },
    "grammarClass": { "type": "string" },
    "conflicts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "resolution": { "type": "string" }
        }
      }
    },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
