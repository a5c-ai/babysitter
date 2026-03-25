---
name: proof-assistant
description: Assist in constructing algorithm correctness proofs
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
---

# Proof Assistant Skill

## Purpose

Assist in constructing formal correctness proofs for algorithms using standard proof techniques.

## Capabilities

- Proof structure templates (induction, contradiction, etc.)
- Step-by-step proof guidance
- Termination argument generation
- Proof review and validation
- Identify proof gaps

## Target Processes

- correctness-proof-testing
- algorithm-implementation

## Proof Techniques

### Mathematical Induction
- Base case identification
- Inductive hypothesis formulation
- Inductive step construction

### Proof by Contradiction
- Assumption negation
- Logical derivation
- Contradiction identification

### Loop Invariant Proofs
- Invariant specification
- Three-part proof (init, maintenance, termination)

### Structural Induction
- For recursive data structures
- Base case (leaf/empty)
- Inductive case (composite)

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "algorithm": { "type": "string" },
    "code": { "type": "string" },
    "proofType": {
      "type": "string",
      "enum": ["induction", "contradiction", "invariant", "structural"]
    },
    "claim": { "type": "string" },
    "partialProof": { "type": "string" }
  },
  "required": ["algorithm", "claim"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "proof": { "type": "string" },
    "structure": { "type": "array" },
    "gaps": { "type": "array" },
    "suggestions": { "type": "array" }
  },
  "required": ["success"]
}
```
