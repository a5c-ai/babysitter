---
name: string-algorithm-matcher
description: Match string problems to appropriate algorithms
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
---

# String Algorithm Matcher Skill

## Purpose

Match string processing problems to the most appropriate algorithms based on requirements and constraints.

## Capabilities

- Pattern matching algorithm selection (KMP, Z, Rabin-Karp)
- Suffix structure selection (array vs tree vs automaton)
- Palindrome detection algorithm selection
- Rolling hash implementation guidance
- String DP technique matching

## Target Processes

- pattern-matching-algorithms
- trie-suffix-structures
- string-processing

## Algorithm Selection Guide

### Single Pattern Matching
| Scenario | Algorithm | Complexity |
|----------|-----------|------------|
| Single pattern | KMP | O(n+m) |
| Multiple patterns | Aho-Corasick | O(n+m+z) |
| Approximate match | Rolling Hash | O(n*m) average |

### Suffix Structures
| Need | Structure | Build Time |
|------|-----------|------------|
| Substring search | Suffix Array | O(n log n) |
| Multiple queries | Suffix Tree | O(n) |
| Subsequence counting | Suffix Automaton | O(n) |

### Palindromes
| Problem | Algorithm |
|---------|-----------|
| Longest palindromic substring | Manacher |
| Palindrome partitioning | DP + Manacher |
| Palindrome queries | Hashing |

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "problemDescription": { "type": "string" },
    "problemType": {
      "type": "string",
      "enum": ["patternMatch", "suffixQueries", "palindrome", "subsequence", "dp"]
    },
    "constraints": { "type": "object" }
  },
  "required": ["problemDescription"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "algorithm": { "type": "string" },
    "complexity": { "type": "string" },
    "alternatives": { "type": "array" },
    "implementation": { "type": "string" }
  },
  "required": ["success", "algorithm"]
}
```
