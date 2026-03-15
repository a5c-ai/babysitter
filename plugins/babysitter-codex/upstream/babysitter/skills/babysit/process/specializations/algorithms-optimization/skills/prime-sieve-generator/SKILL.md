---
name: prime-sieve-generator
description: Generate optimized prime sieves and factorization routines
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
  - Edit
---

# Prime Sieve Generator Skill

## Purpose

Generate optimized prime sieves and factorization routines for various competitive programming scenarios.

## Capabilities

- Sieve of Eratosthenes (segmented, linear)
- Smallest prime factor sieve
- Miller-Rabin primality testing
- Pollard's rho factorization
- Precompute prime-related values
- Generate primes in range

## Target Processes

- prime-algorithms
- number-theory-algorithms
- combinatorics-counting

## Sieve Variants

### Basic Sieves
- Sieve of Eratosthenes O(n log log n)
- Linear sieve O(n)
- Segmented sieve (for large ranges)

### Factorization Sieves
- Smallest prime factor (SPF) sieve
- Mobius function sieve
- Euler's totient sieve

### Primality Testing
- Miller-Rabin (deterministic for small n)
- Fermat test
- Trial division

### Factorization
- Trial division O(sqrt(n))
- Pollard's rho O(n^1/4)
- Using SPF sieve O(log n)

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["sieve", "primalityTest", "factorization", "spfSieve"]
    },
    "limit": { "type": "integer" },
    "optimizations": { "type": "array" },
    "language": {
      "type": "string",
      "enum": ["cpp", "python", "java"]
    }
  },
  "required": ["type"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "code": { "type": "string" },
    "complexity": { "type": "object" },
    "memoryUsage": { "type": "string" }
  },
  "required": ["success", "code"]
}
```
