---
name: Lexer Generator
description: Expert skill for generating and hand-writing lexers using DFA-based, table-driven, and recursive approaches
category: Compiler Frontend
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Lexer Generator Skill

## Overview

Expert skill for generating and hand-writing lexers using various approaches including DFA-based lexers, table-driven lexers, and hand-written recursive lexers.

## Capabilities

- Generate lexer from regular expression specifications
- Implement maximal munch tokenization
- Handle Unicode character classes and normalization
- Implement efficient keyword recognition (tries, perfect hashing)
- Support incremental/resumable lexing for IDE integration
- Generate lexer tables and state machines
- Handle lexer modes and contexts (e.g., string interpolation)
- Implement error recovery with skip-to-next strategies

## Target Processes

- lexer-implementation.js
- language-grammar-design.js
- lsp-server-implementation.js
- repl-development.js

## Dependencies

- Flex-like generators
- RE2/Hyperscan libraries

## Usage Guidelines

1. **Token Definition**: Start by defining the complete set of tokens with their regex patterns
2. **Maximal Munch**: Always implement maximal munch to handle ambiguous token boundaries
3. **Unicode Support**: Consider Unicode normalization forms and character classes from the start
4. **Error Recovery**: Implement skip-to-next-valid strategies for robust error handling
5. **Performance**: Use table-driven approaches for large token sets, hand-written for simple lexers

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "tokens": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "pattern": { "type": "string" },
          "priority": { "type": "integer" }
        }
      }
    },
    "lexerType": {
      "type": "string",
      "enum": ["dfa", "table-driven", "hand-written"]
    },
    "generatedFiles": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```
