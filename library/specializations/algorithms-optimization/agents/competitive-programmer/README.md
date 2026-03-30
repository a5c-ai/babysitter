# Competitive Programmer Agent

An expert competitive programmer agent for solving algorithmic problems under time constraints.

## Overview

The Competitive Programmer agent embodies the mindset and skills of a high-rated competitive programmer. It excels at rapid problem analysis, pattern recognition, efficient implementation, and systematic debugging. The agent is designed for time-constrained scenarios like programming contests and technical interviews.

## Quick Start

### Solve a Problem

```
User: Solve this problem:
Given an array of integers, find two numbers that add up to a target.
Constraints: n <= 10^4, values in [-10^9, 10^9]

Agent:
## Analysis
- Input size n <= 10^4 allows O(n^2) but O(n) is better
- Need to find pair (i, j) where arr[i] + arr[j] = target

## Approach: Hash Table
- For each element, check if complement exists in hash table
- Time: O(n), Space: O(n)

## Solution
```python
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
```

## Complexity Analysis
- Time: O(n) - single pass through array
- Space: O(n) - hash table stores up to n elements

## Edge Cases Handled
- Empty array
- No solution exists
- Duplicate values
```

## Capabilities

### Rapid Problem Analysis

The agent quickly:
- Parses problem statements
- Identifies constraints and their implications
- Determines problem type
- Recognizes applicable patterns

### Pattern Recognition

Matches problems to patterns:
- Dynamic Programming variants
- Graph algorithm applications
- Two Pointer techniques
- Sliding Window problems
- Binary Search on answer
- Greedy with proof

### Time-Constrained Solving

Optimized for contests:
- Quick decision-making
- Efficient implementation
- Systematic debugging
- Strategic problem selection

## Use Cases

### Live Contest Assistance

```
User: I'm in a 2-hour contest with 6 problems. I've solved A and B.
C looks like DP, D is graph, E looks hard. What should I do?

Agent:
## Recommended Strategy

1. **Read C and D carefully** (5 min each)
   - Estimate difficulty and your confidence

2. **Attempt C (DP)** (20-25 min)
   - DP problems often have standard patterns
   - If stuck after 15 min, note your approach and move on

3. **Attempt D (Graph)** (20-25 min)
   - Identify if it's shortest path, MST, or traversal
   - Graph problems usually more straightforward once modeled

4. **Return to harder problem** (remaining time)
   - Either finish C/D if close
   - Or read E for partial progress

5. **Save 10 min for debugging**
   - Review submitted solutions
   - Generate edge cases
```

### Debugging Assistance

```
User: My solution works for samples but gets WA on test 3

Agent:
## Debugging Checklist

1. **Integer Overflow**
   - Are intermediate calculations exceeding int range?
   - Use `long long` for products and sums

2. **Edge Cases**
   - n=0, n=1
   - All same elements
   - Sorted/reverse sorted
   - Maximum constraint values

3. **Off-by-One**
   - Loop bounds: `< n` vs `<= n`
   - Array indexing: 0-based vs 1-based

4. **Let me generate test cases:**
   - [generates small cases]
   - [compares with brute force]

5. **Found likely issue**: [specific bug identified]
```

### Pattern Identification

```
User: How do I recognize this is a DP problem?

Agent:
## DP Recognition Signals

1. **Optimization Language**
   - "Minimum cost", "maximum value", "number of ways"
   - "Best", "optimal", "count"

2. **Problem Structure**
   - Choices at each step
   - Subproblems overlap
   - Can break into smaller similar problems

3. **Constraint Hints**
   - n * m <= 10^7 (suggests 2D DP)
   - n <= 20 with "subsets" (bitmask DP)
   - String problems with "subsequence"

4. **Common Phrases**
   - "Considering elements 1..i"
   - "Using capacity at most W"
   - "Longest/shortest satisfying property"

## This Problem
Based on [specific elements], this is likely [pattern].
```

## Contest Strategy Templates

### Codeforces Round (2 hours, 6 problems)

```
Time Allocation:
- A: 5-10 min (implementation)
- B: 10-15 min (ad-hoc/math)
- C: 15-20 min (standard algorithm)
- D: 20-30 min (harder algorithm)
- E-F: Remaining time (difficult)

Strategy:
1. Speed through A-B
2. Carefully read C-D
3. Implement C while D percolates
4. Attempt D with full focus
5. Partial attempts on E-F if time
```

### LeetCode Contest (1.5 hours, 4 problems)

```
Time Allocation:
- Q1: 5 min (easy)
- Q2: 15 min (easy-medium)
- Q3: 30 min (medium)
- Q4: 30 min (medium-hard)
- Buffer: 10 min

Strategy:
1. Solve Q1-Q2 quickly for points
2. Full focus on Q3-Q4
3. Don't over-optimize Q1-Q2
4. Save time to debug Q4
```

## Algorithmic Knowledge Base

### Complexity Guidelines

| n Range | Allowed Complexity | Techniques |
|---------|-------------------|------------|
| n <= 10 | O(n!) | Brute force, all permutations |
| n <= 20 | O(2^n) | Bitmask DP, subset enumeration |
| n <= 100 | O(n^3) | Floyd-Warshall, simple DP |
| n <= 1000 | O(n^2) | Quadratic DP, simple nested loops |
| n <= 10^5 | O(n log n) | Sorting, segment trees, binary search |
| n <= 10^6 | O(n) | Linear algorithms |
| n <= 10^8 | O(sqrt(n)) | Mathematical |

### Quick Pattern Reference

| Pattern | Indicators | Typical Solution |
|---------|------------|------------------|
| Two Pointers | Sorted array, find pair | Converge from ends |
| Sliding Window | Contiguous subarray, fixed k | Expand/shrink window |
| Binary Search | Monotonic property | Search on answer |
| BFS | Shortest path, unweighted | Level-by-level |
| DFS | Explore all paths, backtracking | Recursive traversal |
| Union-Find | Connectivity, components | DSU with path compression |
| DP | Optimal value, count ways | State + transition |
| Greedy | Local choice = global | Prove greedy choice |

## Integration

### With Skills

```javascript
// Use with leetcode-problem-fetcher
const problem = await leetcodeFetcher.getProblem(slug);
const solution = await competitiveProgrammer.solve(problem);

// Use with complexity-analyzer
const analysis = await complexityAnalyzer.analyze(solution.code);
assert(analysis.time === solution.expectedComplexity);

// Use with test-case-generator
const tests = await testGenerator.generate(problem.constraints);
const passed = await runTests(solution.code, tests);
```

### With Processes

- `codeforces-contest`: Live contest support
- `leetcode-problem-solving`: Practice sessions
- `upsolving`: Post-contest learning
- `mock-coding-interview`: Interview simulation

## Related Agents

- **dp-specialist**: Deep DP expertise
- **graph-specialist**: Graph algorithm focus
- **complexity-analyst**: Rigorous analysis
- **technical-interviewer**: Interview simulation

## References

- [Competitive Programmer's Handbook](https://cses.fi/book/book.pdf)
- [CP-Algorithms](https://cp-algorithms.com/)
- [Codeforces Blog](https://codeforces.com/blog/entry/13529)
- [AtCoder Educational DP Contest](https://atcoder.jp/contests/dp)
