---
name: Grammar Design
description: Expert skill for formal grammar design including disambiguation, precedence, and validation
category: Language Design
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Grammar Design Skill

## Overview

Expert skill for formal grammar design including disambiguation, precedence, and validation.

## Capabilities

- Write EBNF/BNF grammar specifications
- Design unambiguous grammars
- Handle operator precedence and associativity
- Analyze grammar conflicts
- Design grammar for specific parser classes (LL, LR, PEG)
- Document grammar with examples
- Design syntax for common language constructs
- Handle grammar evolution and backwards compatibility

## Target Processes

- language-grammar-design.js
- lexer-implementation.js
- parser-development.js

## Dependencies

Parsing theory literature (Dragon Book, Parsing Techniques)

## Usage Guidelines

1. **Notation**: Use standard EBNF notation for grammar specifications
2. **Disambiguation**: Make grammars unambiguous or document precedence rules
3. **Parser Class**: Design grammar to fit target parser class (LL(k), LALR, PEG)
4. **Examples**: Include examples for all grammar rules
5. **Evolution**: Plan for backwards-compatible grammar evolution

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "notation": {
      "type": "string",
      "enum": ["ebnf", "bnf", "peg", "antlr"]
    },
    "parserClass": {
      "type": "string",
      "enum": ["ll1", "llk", "lalr", "glr", "peg"]
    },
    "productionCount": { "type": "integer" },
    "conflicts": {
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
