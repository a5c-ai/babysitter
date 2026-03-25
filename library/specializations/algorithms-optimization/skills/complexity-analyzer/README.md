# Complexity Analyzer

A skill for automated Big-O complexity analysis of code and algorithms, providing detailed derivations, comparisons, and optimization recommendations.

## Overview

The Complexity Analyzer skill performs static analysis on code to determine time and space complexity. It analyzes loop structures, recursive patterns, and data structure operations to provide accurate Big-O notation with step-by-step derivations.

## Quick Start

### Basic Usage

```bash
# Analyze a single function
complexity-analyzer analyze --file solution.py --function merge_sort

# Compare multiple implementations
complexity-analyzer compare --files naive.py optimized.py

# Generate detailed report
complexity-analyzer report --file algorithm.cpp --output analysis.md
```

### Example

```python
# Input code
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
```

```
# Analysis output
Function: two_sum
Time Complexity: O(n)
  - Single pass through array: O(n)
  - Hash table operations: O(1) average

Space Complexity: O(n)
  - Hash table stores up to n elements
  - Auxiliary space: O(n)
```

## Features

### Analysis Types

| Type | Description |
|------|-------------|
| **Time Complexity** | Worst, average, best case analysis |
| **Space Complexity** | Auxiliary and total space requirements |
| **Amortized Analysis** | Average cost over sequence of operations |
| **Recurrence Solving** | Master theorem and substitution method |

### Loop Pattern Recognition

```python
# Pattern: Single loop - O(n)
for i in range(n):
    process(arr[i])

# Pattern: Nested independent - O(n*m)
for i in range(n):
    for j in range(m):
        process(i, j)

# Pattern: Nested dependent - O(n^2)
for i in range(n):
    for j in range(i):
        process(i, j)

# Pattern: Logarithmic - O(log n)
while n > 0:
    process(n)
    n //= 2
```

### Recursion Analysis

```python
# Linear recursion - O(n)
def factorial(n):
    if n <= 1: return 1
    return n * factorial(n-1)
# T(n) = T(n-1) + O(1) = O(n)

# Binary recursion - O(2^n)
def fibonacci(n):
    if n <= 1: return n
    return fibonacci(n-1) + fibonacci(n-2)
# T(n) = T(n-1) + T(n-2) + O(1) = O(2^n)

# Divide and conquer - O(n log n)
def merge_sort(arr):
    if len(arr) <= 1: return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)  # O(n)
# T(n) = 2T(n/2) + O(n) = O(n log n)
```

## Use Cases

### Code Review

```javascript
// Analyze PR for complexity regressions
const analysis = await analyzeComplexity({
  before: 'feature-branch~1:src/search.js',
  after: 'feature-branch:src/search.js'
});

if (analysis.degradation) {
  console.log(`Complexity increased from ${analysis.before} to ${analysis.after}`);
}
```

### Interview Preparation

```javascript
// Verify solution meets complexity requirements
const solution = await analyzeComplexity({
  code: candidateSolution,
  expectedTime: 'O(n)',
  expectedSpace: 'O(1)'
});

if (!solution.meetsExpectation) {
  console.log(`Solution is ${solution.actual}, expected ${solution.expected}`);
}
```

### Algorithm Comparison

```javascript
// Compare multiple approaches
const comparison = await compareComplexity({
  implementations: [
    { name: 'Brute Force', file: 'brute.py' },
    { name: 'Hash Table', file: 'hash.py' },
    { name: 'Two Pointers', file: 'twoptr.py' }
  ]
});

// Output:
// | Approach     | Time   | Space | Best For      |
// |--------------|--------|-------|---------------|
// | Brute Force  | O(n^2) | O(1)  | Small n       |
// | Hash Table   | O(n)   | O(n)  | General case  |
// | Two Pointers | O(n)   | O(1)  | Sorted input  |
```

## Output Formats

### JSON Report

```json
{
  "function": "find_pairs",
  "timeComplexity": {
    "notation": "O(n^2)",
    "worstCase": "O(n^2)",
    "bestCase": "O(1)",
    "averageCase": "O(n^2)"
  },
  "spaceComplexity": {
    "notation": "O(n)",
    "auxiliary": "O(n)"
  },
  "derivation": [
    "Loop 1: iterates n times",
    "Loop 2: iterates (n-i-1) times for each i",
    "Total iterations: n(n-1)/2 = O(n^2)"
  ],
  "recommendations": [
    "Consider hash table for O(n) time"
  ]
}
```

### Markdown Report

```markdown
## Complexity Analysis: find_pairs

### Time Complexity: O(n^2)

**Derivation:**
1. Outer loop runs `n` iterations
2. Inner loop runs `n-1, n-2, ..., 1` iterations
3. Total = n(n-1)/2 = O(n^2)

### Space Complexity: O(n)
- Result array: O(k) where k = matches found
- Worst case: O(n^2) if all pairs match

### Recommendations
- Use hash table approach for O(n) time complexity
```

## API Reference

### `analyze(options: AnalyzeOptions): Promise<Analysis>`

Analyzes a single function or file.

**Options:**
- `file`: Path to source file
- `function`: Function name to analyze (optional)
- `language`: Programming language (auto-detected)
- `verbose`: Include detailed derivation

### `compare(options: CompareOptions): Promise<Comparison>`

Compares complexity of multiple implementations.

**Options:**
- `files`: Array of file paths
- `functions`: Function names (same across files)

### `report(options: ReportOptions): Promise<string>`

Generates a comprehensive report.

**Options:**
- `file`: Source file path
- `format`: 'json' | 'markdown' | 'html'
- `output`: Output file path

## Integration

### With LeetCode Fetcher

```javascript
// Fetch problem and analyze solution
const problem = await fetchProblem('two-sum');
const analysis = await analyzeComplexity(mySolution);

// Check if solution meets constraints
const maxN = problem.constraints.maxN; // e.g., 10^4
const timeLimit = problem.timeLimit; // e.g., 1 second

if (analysis.timeComplexity === 'O(n^2)' && maxN > 10000) {
  console.log('Solution may TLE, consider optimization');
}
```

### With Test Case Generator

```javascript
// Generate test cases to empirically verify complexity
const testCases = await generateTestCases({
  sizes: [100, 1000, 10000, 100000],
  distribution: 'random'
});

const measurements = await benchmark(solution, testCases);
const empiricalComplexity = fitComplexityCurve(measurements);
```

## Common Patterns Reference

| Pattern | Time | Space | Example |
|---------|------|-------|---------|
| Hash table lookup | O(1) avg | O(n) | `dict[key]` |
| Binary search | O(log n) | O(1) | `bisect.bisect` |
| Single pass | O(n) | O(1) | Array sum |
| Sorting | O(n log n) | O(n) | `sorted()` |
| Nested loops | O(n^2) | O(1) | Bubble sort |
| All subsets | O(2^n) | O(n) | Backtracking |
| All permutations | O(n!) | O(n) | Permutations |

## Related Skills

- **leetcode-problem-fetcher**: Fetch problems with complexity hints
- **test-case-generator**: Empirical complexity verification
- **dp-pattern-library**: DP complexity patterns
- **interview-problem-bank**: Problems organized by complexity

## References

- [Introduction to Algorithms (CLRS)](https://mitpress.mit.edu/books/introduction-algorithms)
- [Master Theorem](https://en.wikipedia.org/wiki/Master_theorem)
- [Amortized Analysis](https://en.wikipedia.org/wiki/Amortized_analysis)
- [Big O Cheat Sheet](https://www.bigocheatsheet.com/)
