# Complexity Analyst Agent

A theoretical computer science expert for rigorous algorithm complexity analysis.

## Overview

The Complexity Analyst agent provides formal, mathematically rigorous analysis of algorithm time and space complexity. It specializes in derivations, recurrence solving, amortized analysis, and complexity verification with educational explanations.

## Quick Start

### Analyze Code Complexity

```
User: Analyze the complexity of this code:

def find_pairs(arr, target):
    result = []
    n = len(arr)
    for i in range(n):
        for j in range(i+1, n):
            if arr[i] + arr[j] == target:
                result.append((i, j))
    return result

Analyst:
## Complexity Analysis: find_pairs

### Time Complexity

**Derivation:**
1. Outer loop runs from i=0 to n-1: n iterations
2. Inner loop runs from j=i+1 to n-1
   - When i=0: n-1 iterations
   - When i=1: n-2 iterations
   - When i=n-1: 0 iterations
3. Total iterations = (n-1) + (n-2) + ... + 1 + 0
                    = n(n-1)/2
                    = O(n^2)

**Result:** O(n^2)

### Space Complexity

**Derivation:**
1. result array: O(k) where k = number of matching pairs
2. Worst case: k = n(n-1)/2 = O(n^2) if all pairs match
3. Variables i, j: O(1)

**Result:** O(k) where k = matches, worst case O(n^2)

### Optimization Note
Can be reduced to O(n) time using a hash table approach.
```

## Features

### Rigorous Derivations

The agent provides step-by-step mathematical derivations:

```
Example: Binary Search

T(n) = T(n/2) + O(1)

Using Master Theorem:
- a = 1 (one recursive call)
- b = 2 (problem size halved)
- f(n) = O(1)

log_b(a) = log_2(1) = 0

Since f(n) = O(n^0) = O(1), we have c = 0 = log_b(a)
This is Case 2 of Master Theorem.

T(n) = O(n^0 * log n) = O(log n)
```

### Multiple Analysis Methods

| Method | Best For | Example |
|--------|----------|---------|
| **Substitution** | Verifying guesses | T(n) = T(n-1) + n |
| **Recursion Tree** | Visual intuition | Merge sort |
| **Master Theorem** | Divide-and-conquer | T(n) = aT(n/b) + f(n) |
| **Amortized** | Data structures | Dynamic array |
| **Aggregate** | Total cost analysis | Union-Find |

### Case Analysis

```
User: What's the complexity of quicksort?

Analyst:
## QuickSort Complexity Analysis

### Best Case: O(n log n)
Pivot always divides array in half.
T(n) = 2T(n/2) + O(n)
Master theorem: O(n log n)

### Average Case: O(n log n)
Pivot creates reasonably balanced partitions on average.
Rigorous analysis shows expected O(n log n).

### Worst Case: O(n^2)
Pivot always smallest or largest element.
T(n) = T(n-1) + O(n)
= O(n) + O(n-1) + ... + O(1) = O(n^2)

Occurs with: already sorted array, all equal elements

### Space Complexity
- Best/Average: O(log n) for recursion stack
- Worst: O(n) for recursion stack

### Practical Note
Randomized pivot selection gives O(n log n) expected time.
```

## Use Cases

### Verify Solution Complexity

```
User: I claim my solution is O(n). Can you verify?

def solution(arr):
    stack = []
    result = [0] * len(arr)
    for i in range(len(arr)):
        while stack and arr[stack[-1]] < arr[i]:
            idx = stack.pop()
            result[idx] = i - idx
        stack.append(i)
    return result

Analyst:
## Verification Analysis

Your claim of O(n) is **correct**.

**Reasoning:**
1. Each element is pushed onto stack exactly once: n pushes
2. Each element is popped from stack at most once: at most n pops
3. Total operations: O(n) + O(n) = O(n)

This is a monotonic stack pattern. Despite the while loop inside
the for loop, the amortized analysis shows O(n) total.

**Key Insight:**
Don't be fooled by nested loops! The inner while loop's total
iterations across all i is bounded by n (each element popped once).
```

### Compare Approaches

```
User: Compare O(n^2) DP vs O(n log n) for LIS

Analyst:
## LIS Complexity Comparison

### Approach 1: Standard DP - O(n^2)

```python
for i in range(n):
    for j in range(i):
        if arr[j] < arr[i]:
            dp[i] = max(dp[i], dp[j] + 1)
```

Time: O(n^2), Space: O(n)

### Approach 2: Binary Search - O(n log n)

```python
for num in arr:
    idx = bisect_left(tails, num)
    if idx == len(tails):
        tails.append(num)
    else:
        tails[idx] = num
```

Time: O(n log n), Space: O(n)

### Comparison

| n | O(n^2) ops | O(n log n) ops | Speedup |
|---|------------|----------------|---------|
| 10^3 | 10^6 | 10^4 | 100x |
| 10^4 | 10^8 | 1.3*10^5 | ~770x |
| 10^5 | 10^10 | 1.7*10^6 | ~6000x |

**Recommendation:**
- n < 1000: Either approach works
- n >= 1000: Use O(n log n) approach
- n >= 10^4: O(n log n) is necessary
```

### Amortized Analysis

```
User: Explain amortized analysis for dynamic array

Analyst:
## Dynamic Array Amortized Analysis

### Problem
Array doubles when full. Single resize costs O(n).
Why is insertion still O(1) amortized?

### Aggregate Method

Consider n insertions starting from empty array:
- Insertions: 1, 2, 3, ..., n (n total)
- Resizes at sizes: 1, 2, 4, 8, ..., 2^k where 2^k <= n
- Total resize cost: 1 + 2 + 4 + ... + 2^k < 2n

Total cost = n insertions + < 2n copy operations = O(3n) = O(n)
Amortized per operation = O(n) / n = O(1)

### Accounting Method

Charge $3 per insertion:
- $1 for the insertion itself
- $2 saved for future resize

When resize happens at size n:
- Need to copy n elements (cost $n)
- Have accumulated $2 per element = $2n from previous insertions
- $2n > $n, so we can afford the resize

Amortized cost: $3 = O(1) per operation

### Potential Method

Define Phi(D) = 2n - capacity where n = current size

For insertion without resize:
- Actual cost = 1
- Phi change = 2 (size increases by 1)
- Amortized = 1 + 2 = 3

For insertion with resize (capacity doubles):
- Actual cost = n + 1 (copy + insert)
- Old Phi = 2n - n = n
- New Phi = 2(n+1) - 2n = 2
- Phi change = 2 - n = -(n-2)
- Amortized = (n+1) + (2-n) = 3

**Conclusion:** O(1) amortized per insertion
```

## Analysis Templates

### Basic Template

```markdown
## Complexity Analysis: [Algorithm]

### Time Complexity
**Result:** O(f(n))

**Derivation:**
[Step-by-step]

### Space Complexity
**Result:** O(g(n))

**Derivation:**
[Step-by-step]
```

### Detailed Template

```markdown
## Complexity Analysis: [Algorithm]

### Summary
| Measure | Best | Average | Worst |
|---------|------|---------|-------|
| Time | O(...) | O(...) | O(...) |
| Space | O(...) | O(...) | O(...) |

### Detailed Time Analysis
[Full derivation]

### Detailed Space Analysis
[Full derivation]

### Assumptions
[Any assumptions made]

### Verification
[Empirical or formal verification]
```

## Integration

### With Complexity Analyzer Skill

```javascript
// Agent verifies automated analysis
const automated = await complexityAnalyzer.analyze(code);
const verified = await complexityAnalyst.verify(automated);

if (!verified.correct) {
  console.log(`Correction: ${verified.actual} not ${automated.result}`);
}
```

### With Technical Interviewer

```javascript
// Verify candidate's complexity claim
const claim = candidate.statedComplexity;
const actual = await complexityAnalyst.analyze(candidate.solution);

if (claim !== actual) {
  feedback.note("Complexity analysis was incorrect");
}
```

## API Reference

### `analyze(code: string): ComplexityAnalysis`

Full complexity analysis of provided code.

### `verify(claim: string, code: string): Verification`

Verify if claimed complexity is correct.

### `compare(approaches: Approach[]): Comparison`

Compare complexity of multiple approaches.

### `solve(recurrence: string): Solution`

Solve a recurrence relation.

### `amortized(operations: Operation[]): AmortizedAnalysis`

Perform amortized analysis on operation sequence.

## Related Agents

- **competitive-programmer**: Solution implementation
- **dp-specialist**: DP-specific analysis
- **algorithm-designer**: Algorithm selection

## References

- [CLRS Chapter 3: Growth of Functions](https://mitpress.mit.edu/books/introduction-algorithms)
- [CLRS Chapter 17: Amortized Analysis](https://mitpress.mit.edu/books/introduction-algorithms)
- [Master Theorem](https://en.wikipedia.org/wiki/Master_theorem)
- [Akra-Bazzi Method](https://en.wikipedia.org/wiki/Akra%E2%80%93Bazzi_method)
