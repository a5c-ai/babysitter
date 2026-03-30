---
name: number-theory-toolkit
description: Provide number theory algorithm implementations and guidance
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - Edit
---

# Number Theory Toolkit Skill

## Purpose

Provide implementations and guidance for number theory algorithms commonly used in competitive programming.

## Capabilities

- Modular arithmetic operations
- Extended Euclidean algorithm
- Chinese Remainder Theorem
- Modular inverse and exponentiation
- FFT/NTT for polynomial multiplication
- Linear sieve implementations

## Target Processes

- number-theory-algorithms
- prime-algorithms
- combinatorics-counting

## Algorithm Catalog

### Modular Arithmetic
- Modular exponentiation (binary exp)
- Modular inverse (Fermat/Extended GCD)
- Modular square root (Tonelli-Shanks)

### GCD and Extensions
- Euclidean algorithm
- Extended Euclidean algorithm
- Linear Diophantine equations

### Chinese Remainder Theorem
- CRT for coprime moduli
- General CRT

### FFT/NTT
- Fast Fourier Transform
- Number Theoretic Transform
- Polynomial multiplication

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "algorithm": { "type": "string" },
    "parameters": { "type": "object" },
    "language": {
      "type": "string",
      "enum": ["cpp", "python", "java"]
    },
    "modulo": { "type": "integer" }
  },
  "required": ["algorithm"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "code": { "type": "string" },
    "explanation": { "type": "string" },
    "complexity": { "type": "string" }
  },
  "required": ["success"]
}
```
