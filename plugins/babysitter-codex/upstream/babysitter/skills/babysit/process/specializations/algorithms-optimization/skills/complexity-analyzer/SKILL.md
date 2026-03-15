---
name: complexity-analyzer
description: Automated Big-O complexity analysis of code and algorithms. Performs static analysis of loop structures, recursive call trees, space complexity estimation, and amortized analysis with detailed derivation documents.
allowed-tools: Bash, Read, Write, Grep, Glob
metadata:
  author: babysitter-sdk
  version: "1.0"
  category: algorithms-optimization
  skill-id: SK-ALGO-006
  priority: high
---

# complexity-analyzer

A specialized skill for automated analysis of algorithm time and space complexity, providing Big-O notation analysis, detailed derivations, and optimization recommendations.

## Purpose

Analyze code and algorithms to determine:
- Time complexity (Big-O, Big-Omega, Big-Theta)
- Space complexity (auxiliary and total)
- Amortized complexity for data structure operations
- Complexity derivation with step-by-step reasoning
- Optimization opportunities and bottleneck identification

## Capabilities

### Core Analysis Features

1. **Static Analysis**
   - Loop structure analysis (nested loops, dependent bounds)
   - Recursive call tree analysis
   - Function call graph traversal
   - Branch condition impact analysis

2. **Complexity Types**
   - **Time Complexity**: Worst, average, and best case analysis
   - **Space Complexity**: Stack space, heap allocations, auxiliary space
   - **Amortized Analysis**: Aggregate, accounting, and potential methods
   - **Recurrence Relations**: Master theorem, substitution method

3. **Output Formats**
   - Big-O notation with detailed derivation
   - Complexity comparison tables
   - Visual complexity graphs
   - Optimization recommendations

### Supported Languages

- Python (primary)
- C++ (full support)
- Java (full support)
- JavaScript/TypeScript (full support)
- Go, Rust, C (partial support)

## Integration Options

### MCP Servers

**AST MCP Server** - Advanced code structure analysis:
```bash
# Provides AST parsing and complexity analysis
npm install -g @angrysky56/ast-mcp-server
```

**Code Analysis MCP** - Natural language code exploration:
```bash
# Deep code understanding with data flow analysis
npm install -g code-analysis-mcp
```

### Web-Based Tools

- [TimeComplexity.ai](https://www.timecomplexity.ai/) - AI-powered runtime complexity
- [Big-O Calculator](https://github.com/DmelladoH/Big-O-Calculator) - Web-based analysis

## Usage

### Analyze Code Complexity

```bash
# Analyze a Python function
complexity-analyzer analyze --file solution.py --function two_sum

# Analyze C++ code with detailed derivation
complexity-analyzer analyze --file solution.cpp --verbose

# Compare multiple implementations
complexity-analyzer compare --files impl1.py impl2.py impl3.py
```

### Example Analysis

**Input Code:**
```python
def find_pairs(arr, target):
    n = len(arr)
    result = []
    for i in range(n):           # O(n)
        for j in range(i+1, n):  # O(n-i) iterations
            if arr[i] + arr[j] == target:
                result.append((i, j))
    return result
```

**Analysis Output:**
```
Time Complexity: O(n^2)
- Outer loop: n iterations
- Inner loop: (n-1) + (n-2) + ... + 1 = n(n-1)/2 iterations
- Total: O(n^2)

Space Complexity: O(k) where k = number of pairs found
- result array grows with matches
- Worst case: O(n^2) if all pairs match

Optimization Suggestion:
- Use hash table for O(n) time complexity
- Trade space for time: O(n) space
```

## Output Schema

```json
{
  "analysis": {
    "function": "string",
    "language": "string",
    "timeComplexity": {
      "notation": "O(n^2)",
      "bestCase": "O(1)",
      "averageCase": "O(n^2)",
      "worstCase": "O(n^2)",
      "derivation": [
        "Step 1: Outer loop runs n times",
        "Step 2: Inner loop runs (n-1), (n-2), ..., 1 times",
        "Step 3: Total = sum from 1 to n-1 = n(n-1)/2",
        "Step 4: Simplify to O(n^2)"
      ]
    },
    "spaceComplexity": {
      "notation": "O(n)",
      "auxiliary": "O(n)",
      "total": "O(n)",
      "breakdown": {
        "input": "O(n) - input array",
        "result": "O(k) - output pairs",
        "variables": "O(1) - loop counters"
      }
    },
    "recommendations": [
      {
        "type": "optimization",
        "description": "Use hash table approach",
        "newComplexity": "O(n) time, O(n) space",
        "tradeoff": "Space for time"
      }
    ]
  },
  "metadata": {
    "analyzedAt": "ISO8601 timestamp",
    "confidence": "high|medium|low"
  }
}
```

## Analysis Patterns

### Loop Analysis

| Pattern | Complexity | Example |
|---------|------------|---------|
| Single loop | O(n) | `for i in range(n)` |
| Nested independent | O(n*m) | `for i in n: for j in m` |
| Nested dependent | O(n^2) | `for i in n: for j in range(i)` |
| Logarithmic | O(log n) | `while n > 0: n //= 2` |
| Nested log | O(n log n) | `for i in n: j=1; while j<n: j*=2` |

### Recursion Analysis

| Pattern | Recurrence | Complexity |
|---------|------------|------------|
| Linear | T(n) = T(n-1) + O(1) | O(n) |
| Binary | T(n) = T(n/2) + O(1) | O(log n) |
| Divide & Conquer | T(n) = 2T(n/2) + O(n) | O(n log n) |
| Exponential | T(n) = 2T(n-1) + O(1) | O(2^n) |

### Master Theorem

For recurrence T(n) = aT(n/b) + f(n):

| Case | Condition | Complexity |
|------|-----------|------------|
| 1 | f(n) = O(n^c) where c < log_b(a) | O(n^(log_b(a))) |
| 2 | f(n) = O(n^c) where c = log_b(a) | O(n^c log n) |
| 3 | f(n) = O(n^c) where c > log_b(a) | O(f(n)) |

## Integration with Processes

This skill enhances:
- `complexity-optimization` - Identify and fix complexity bottlenecks
- `leetcode-problem-solving` - Verify solution complexity
- `algorithm-implementation` - Validate implementation efficiency
- `code-review` - Complexity-focused code review

## Common Complexity Classes

| Complexity | Name | Example |
|------------|------|---------|
| O(1) | Constant | Array access, hash lookup |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Array traversal |
| O(n log n) | Linearithmic | Merge sort, heap sort |
| O(n^2) | Quadratic | Nested loops, bubble sort |
| O(n^3) | Cubic | Matrix multiplication (naive) |
| O(2^n) | Exponential | Subsets, recursive fibonacci |
| O(n!) | Factorial | Permutations |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `PARSE_ERROR` | Invalid syntax | Check code syntax |
| `UNSUPPORTED_CONSTRUCT` | Complex control flow | Simplify or annotate |
| `RECURSIVE_DEPTH` | Deep recursion | Provide base case hints |
| `AMBIGUOUS_BOUNDS` | Dynamic loop bounds | Annotate with constraints |

## Best Practices

1. **Annotate Constraints**: Provide variable ranges for accurate analysis
2. **Isolate Functions**: Analyze one function at a time
3. **Consider Input Distribution**: Specify if average case differs from worst
4. **Review Derivations**: Verify step-by-step reasoning
5. **Test with Benchmarks**: Validate theoretical analysis empirically

## References

- [AST MCP Server](https://github.com/angrysky56/ast-mcp-server)
- [Code Analysis MCP](https://github.com/saiprashanths/code-analysis-mcp)
- [TimeComplexity.ai](https://www.timecomplexity.ai/)
- [Big-O Calculator](https://github.com/DmelladoH/Big-O-Calculator)
- [MCP Reasoner](https://github.com/Jacck/mcp-reasoner)
