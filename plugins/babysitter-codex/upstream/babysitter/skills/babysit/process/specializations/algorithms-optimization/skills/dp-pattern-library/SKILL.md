---
name: dp-pattern-library
description: Maintain and match against a library of classic dynamic programming patterns. Provides pattern matching, template code generation, variant detection, and problem-to-pattern mapping for DP problems.
allowed-tools: Bash, Read, Write, Grep, Glob, WebSearch
metadata:
  author: babysitter-sdk
  version: "1.0"
  category: algorithms-optimization
  skill-id: SK-ALGO-012
  priority: high
---

# dp-pattern-library

A specialized skill for dynamic programming pattern recognition, matching problems to known DP patterns, generating template code, and providing optimization guidance for DP solutions.

## Purpose

Assist with dynamic programming by:
- Matching problems to 50+ classic DP patterns
- Generating template code for matched patterns
- Detecting problem variants (knapsack variants, LCS variants, etc.)
- Providing state design recommendations
- Suggesting optimization techniques

## Capabilities

### Core Features

1. **Pattern Recognition**
   - Analyze problem statement for DP indicators
   - Match to known pattern categories
   - Identify problem variants and transformations
   - Suggest state representation

2. **Pattern Categories**
   - Linear DP (1D array)
   - Grid/Matrix DP (2D paths)
   - String DP (LCS, edit distance)
   - Interval DP (ranges, parenthesization)
   - Tree DP (subtree problems)
   - Bitmask DP (subset enumeration)
   - Digit DP (number counting)
   - Knapsack variants
   - DP with state machine

3. **Code Generation**
   - Template code for recognized patterns
   - Multiple language support (Python, C++, Java)
   - Comments explaining state and transitions
   - Space-optimized variants

4. **Optimization Guidance**
   - Rolling array technique
   - Convex hull trick
   - Divide and conquer optimization
   - Monotonic queue/stack optimization
   - Knuth optimization

## Pattern Library

### Linear DP Patterns

| Pattern | State | Transition | Example Problems |
|---------|-------|------------|------------------|
| **Fibonacci** | dp[i] = answer for position i | dp[i] = dp[i-1] + dp[i-2] | Climbing Stairs, House Robber |
| **Min/Max Path** | dp[i] = best answer ending at i | dp[i] = opt(dp[j]) + cost(j,i) | Minimum Path Sum |
| **Counting** | dp[i] = ways to reach state i | dp[i] = sum(dp[j]) | Unique Paths, Decode Ways |
| **LIS** | dp[i] = LIS ending at i | dp[i] = max(dp[j]) + 1 where j < i, a[j] < a[i] | Longest Increasing Subsequence |

### String DP Patterns

| Pattern | State | Example Problems |
|---------|-------|------------------|
| **Edit Distance** | dp[i][j] = distance for s1[0..i], s2[0..j] | Edit Distance, One Edit Distance |
| **LCS** | dp[i][j] = LCS of s1[0..i], s2[0..j] | Longest Common Subsequence |
| **Palindrome** | dp[i][j] = is s[i..j] palindrome | Longest Palindromic Substring |
| **Regex Match** | dp[i][j] = s[0..i] matches p[0..j] | Regular Expression Matching |

### Knapsack Patterns

| Variant | State | Transition |
|---------|-------|------------|
| **0/1 Knapsack** | dp[i][w] = max value with items 0..i, capacity w | dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i]) |
| **Unbounded** | dp[w] = max value with capacity w | dp[w] = max(dp[w], dp[w-wt[i]] + val[i]) |
| **Bounded** | dp[i][w] = max value with limited items | Use binary representation or deque |
| **Subset Sum** | dp[i][s] = can reach sum s with items 0..i | dp[i][s] = dp[i-1][s] or dp[i-1][s-a[i]] |

### Grid DP Patterns

| Pattern | State | Example Problems |
|---------|-------|------------------|
| **Path Count** | dp[i][j] = ways to reach (i,j) | Unique Paths, Unique Paths II |
| **Path Min/Max** | dp[i][j] = best path to (i,j) | Minimum Path Sum |
| **Multi-path** | dp[i][j][k][l] = two paths simultaneously | Cherry Pickup |

### Interval DP Patterns

| Pattern | State | Example Problems |
|---------|-------|------------------|
| **MCM** | dp[i][j] = cost for range [i,j] | Matrix Chain Multiplication |
| **Burst** | dp[i][j] = max coins from balloons[i..j] | Burst Balloons |
| **Merge** | dp[i][j] = cost to merge range [i,j] | Minimum Cost to Merge Stones |

### Tree DP Patterns

| Pattern | State | Example Problems |
|---------|-------|------------------|
| **Subtree** | dp[v] = answer for subtree rooted at v | Binary Tree Maximum Path Sum |
| **Rerooting** | dp[v] = answer when v is root | Sum of Distances in Tree |
| **Parent-Child** | dp[v][0/1] = answer with constraint | House Robber III |

### Bitmask DP Patterns

| Pattern | State | Example Problems |
|---------|-------|------------------|
| **TSP** | dp[mask][last] = min cost visiting mask cities ending at last | Traveling Salesman Problem |
| **Assignment** | dp[mask] = min cost assigning tasks to subset | Task Assignment |
| **SOS** | dp[mask] = sum over subsets | Subset Sum over Subsets |

## Usage

### Pattern Matching

```bash
# Match problem to DP pattern
dp-pattern-library match --problem "Given an array of integers, find the longest increasing subsequence"

# Output:
# Pattern: Linear DP - Longest Increasing Subsequence (LIS)
# State: dp[i] = length of LIS ending at index i
# Transition: dp[i] = max(dp[j] + 1) for all j < i where arr[j] < arr[i]
# Time: O(n^2) naive, O(n log n) with binary search
# Space: O(n)
```

### Template Generation

```bash
# Generate template code
dp-pattern-library template --pattern "lis" --language python

# Output:
def lengthOfLIS(nums):
    if not nums:
        return 0

    n = len(nums)
    # dp[i] = length of LIS ending at index i
    dp = [1] * n

    for i in range(1, n):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)

    return max(dp)
```

### Optimization Suggestions

```bash
# Get optimization recommendations
dp-pattern-library optimize --pattern "lis"

# Output:
# Current: O(n^2) time, O(n) space
# Optimizations:
# 1. Binary Search: O(n log n) time
#    - Maintain sorted list of smallest tail elements
#    - Binary search for insertion point
# 2. Segment Tree: O(n log n) time
#    - For coordinate compression + range max query
```

## Output Schema

```json
{
  "match": {
    "pattern": "Linear DP - LIS",
    "confidence": 0.95,
    "category": "linear",
    "variants": ["LIS", "LDS", "LNDS"]
  },
  "state": {
    "description": "dp[i] = length of LIS ending at index i",
    "dimensions": 1,
    "meaning": "LIS length ending at position i"
  },
  "transition": {
    "formula": "dp[i] = max(dp[j] + 1) for j < i, arr[j] < arr[i]",
    "baseCase": "dp[i] = 1 for all i",
    "order": "left to right"
  },
  "complexity": {
    "time": "O(n^2)",
    "space": "O(n)",
    "optimized": {
      "time": "O(n log n)",
      "technique": "binary search on patience sort"
    }
  },
  "template": {
    "python": "...",
    "cpp": "...",
    "java": "..."
  },
  "similarProblems": [
    "Longest Increasing Subsequence",
    "Number of Longest Increasing Subsequence",
    "Russian Doll Envelopes",
    "Maximum Length of Pair Chain"
  ]
}
```

## Integration with Processes

This skill enhances:
- `dp-pattern-matching` - Core pattern matching workflow
- `dp-state-optimization` - State space optimization
- `dp-transition-derivation` - Deriving transitions
- `leetcode-problem-solving` - DP problem identification
- `classic-dp-library` - Building a personal DP library

## Pattern Recognition Indicators

| Indicator | Likely Pattern |
|-----------|----------------|
| "maximum/minimum" + "subarray/subsequence" | Linear DP |
| "number of ways" | Counting DP |
| "can reach/achieve" | Boolean DP |
| "edit/transform string" | String DP |
| "merge/combine intervals" | Interval DP |
| "tree/subtree" | Tree DP |
| "select subset" + small n | Bitmask DP |
| "count numbers with property" | Digit DP |
| "items + capacity" | Knapsack |

## References

- [Dynamic Programming Patterns](https://github.com/aatalyk/Dynamic-Programming-Patterns)
- [DP Visualization Tools](https://dp.debkbanerji.com/)
- [LeetCode DP Patterns](https://leetcode.com/discuss/general-discussion/458695/dynamic-programming-patterns)
- [CP Algorithms - DP](https://cp-algorithms.com/dynamic_programming.html)
- [CSES DP Section](https://cses.fi/problemset/list/)

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `NO_PATTERN_MATCH` | Problem doesn't fit known patterns | Consider greedy or other approaches |
| `AMBIGUOUS_MATCH` | Multiple patterns could apply | Provide more problem details |
| `COMPLEX_STATE` | State too complex for templates | Manual state design needed |

## Best Practices

1. **Start with brute force** - Understand recurrence before optimizing
2. **Draw state diagram** - Visualize transitions
3. **Verify base cases** - Most DP bugs are in base cases
4. **Check state uniqueness** - Each state should be uniquely defined
5. **Consider space optimization** - Often can reduce dimension
6. **Test with small inputs** - Trace through by hand
