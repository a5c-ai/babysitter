---
name: Type Theory
description: Expert skill in type theory foundations for implementing type systems including inference, checking, and subtyping
category: Type Systems
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Type Theory Skill

## Overview

Expert skill in type theory foundations for implementing type systems including inference, checking, and subtyping.

## Capabilities

- Implement Hindley-Milner type inference with Algorithm W
- Implement constraint-based type inference with unification
- Design and implement bidirectional type checking
- Implement structural and nominal subtyping
- Handle variance (covariant, contravariant, invariant)
- Implement row polymorphism and record types
- Design flow-sensitive type narrowing
- Implement type error message generation

## Target Processes

- type-system-implementation.js
- semantic-analysis.js
- generics-polymorphism.js
- effect-system-design.js

## Dependencies

Academic type theory literature (TAPL, ATTAPL)

## Usage Guidelines

1. **Algorithm Selection**: Choose between HM inference and bidirectional checking based on language features
2. **Constraint Generation**: Separate constraint generation from solving for cleaner implementation
3. **Error Localization**: Track constraint origins for accurate error location
4. **Variance**: Document variance rules explicitly for all generic positions
5. **Gradual Typing**: Consider gradual typing for mixed typed/untyped codebases

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "inferenceAlgorithm": {
      "type": "string",
      "enum": ["hindley-milner", "bidirectional", "constraint-based", "flow-sensitive"]
    },
    "subtypingKind": {
      "type": "string",
      "enum": ["structural", "nominal", "mixed"]
    },
    "features": {
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
