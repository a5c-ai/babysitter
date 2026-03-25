# DP Pattern Library

A skill for recognizing and applying dynamic programming patterns, with template code generation and optimization guidance.

## Overview

The DP Pattern Library skill helps identify which dynamic programming pattern applies to a given problem, generates template code, and provides optimization recommendations. It covers 50+ classic DP patterns organized by category.

## Quick Start

### Pattern Matching

```bash
# Identify DP pattern from problem description
dp-pattern-library match --problem "Find the minimum cost to climb stairs where each step has a cost"

# Output:
# Pattern: Linear DP - Min Cost Path
# State: dp[i] = minimum cost to reach step i
# Time: O(n), Space: O(n) -> O(1) optimized
```

### Template Generation

```bash
# Generate template for a pattern
dp-pattern-library template --pattern "knapsack-01" --language cpp
```

### List All Patterns

```bash
# View all available patterns
dp-pattern-library list --category all
```

## Pattern Categories

### 1. Linear DP

Problems with 1D state space, typically iterating through an array.

```python
# Template: Linear DP
def solve(arr):
    n = len(arr)
    dp = [0] * n
    dp[0] = base_case(arr[0])

    for i in range(1, n):
        dp[i] = transition(dp, arr, i)

    return dp[n-1]  # or max(dp)
```

**Common Problems:**
- Climbing Stairs (dp[i] = dp[i-1] + dp[i-2])
- House Robber (dp[i] = max(dp[i-1], dp[i-2] + nums[i]))
- Maximum Subarray (dp[i] = max(nums[i], dp[i-1] + nums[i]))
- Coin Change (dp[i] = min(dp[i-coin] + 1))

### 2. Grid DP

Problems on 2D grids with path-based transitions.

```python
# Template: Grid DP
def solve(grid):
    m, n = len(grid), len(grid[0])
    dp = [[0] * n for _ in range(m)]
    dp[0][0] = grid[0][0]

    # Fill first row and column
    for i in range(1, m):
        dp[i][0] = dp[i-1][0] + grid[i][0]
    for j in range(1, n):
        dp[0][j] = dp[0][j-1] + grid[0][j]

    # Fill rest
    for i in range(1, m):
        for j in range(1, n):
            dp[i][j] = transition(dp[i-1][j], dp[i][j-1], grid[i][j])

    return dp[m-1][n-1]
```

**Common Problems:**
- Unique Paths (counting)
- Minimum Path Sum (optimization)
- Dungeon Game (reverse DP)
- Cherry Pickup (multi-path)

### 3. String DP

Problems involving string comparison or transformation.

```python
# Template: String DP (two strings)
def solve(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0] * (n+1) for _ in range(m+1)]

    # Base cases
    for i in range(m+1):
        dp[i][0] = base_row(i)
    for j in range(n+1):
        dp[0][j] = base_col(j)

    # Fill table
    for i in range(1, m+1):
        for j in range(1, n+1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1] + match_value
            else:
                dp[i][j] = transition(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])

    return dp[m][n]
```

**Common Problems:**
- Longest Common Subsequence
- Edit Distance (Levenshtein)
- Longest Palindromic Subsequence
- Regular Expression Matching

### 4. Knapsack DP

Problems with item selection and capacity constraints.

```python
# Template: 0/1 Knapsack
def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity+1) for _ in range(n+1)]

    for i in range(1, n+1):
        for w in range(capacity+1):
            # Don't take item i
            dp[i][w] = dp[i-1][w]
            # Take item i (if possible)
            if weights[i-1] <= w:
                dp[i][w] = max(dp[i][w],
                               dp[i-1][w-weights[i-1]] + values[i-1])

    return dp[n][capacity]

# Space optimized (rolling array)
def knapsack_optimized(weights, values, capacity):
    dp = [0] * (capacity+1)
    for i in range(len(weights)):
        for w in range(capacity, weights[i]-1, -1):  # Reverse order!
            dp[w] = max(dp[w], dp[w-weights[i]] + values[i])
    return dp[capacity]
```

**Variants:**
- 0/1 Knapsack (each item once)
- Unbounded Knapsack (unlimited items)
- Bounded Knapsack (limited count)
- Subset Sum (boolean version)
- Partition Equal Subset Sum

### 5. Interval DP

Problems on ranges/intervals with merging operations.

```python
# Template: Interval DP
def solve(arr):
    n = len(arr)
    dp = [[0] * n for _ in range(n)]

    # Base case: single elements
    for i in range(n):
        dp[i][i] = base_value(arr[i])

    # Fill by increasing interval length
    for length in range(2, n+1):
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = initial_value
            for k in range(i, j):  # Split point
                dp[i][j] = combine(dp[i][j], dp[i][k], dp[k+1][j], cost(i,j,k))

    return dp[0][n-1]
```

**Common Problems:**
- Matrix Chain Multiplication
- Burst Balloons
- Minimum Cost to Merge Stones
- Palindrome Partitioning

### 6. Tree DP

Problems on tree structures using DFS.

```python
# Template: Tree DP
def solve(root):
    result = [0]

    def dfs(node):
        if not node:
            return base_value

        left = dfs(node.left)
        right = dfs(node.right)

        # Update global result if needed
        result[0] = max(result[0], combine(left, right, node.val))

        # Return value for parent
        return transition(left, right, node.val)

    dfs(root)
    return result[0]
```

**Common Problems:**
- Binary Tree Maximum Path Sum
- House Robber III
- Diameter of Binary Tree
- Longest Univalue Path

### 7. Bitmask DP

Problems with subset enumeration (small n, typically n <= 20).

```python
# Template: Bitmask DP (TSP-style)
def solve(n, cost):
    INF = float('inf')
    dp = [[INF] * n for _ in range(1 << n)]
    dp[1][0] = 0  # Start at node 0

    for mask in range(1 << n):
        for last in range(n):
            if not (mask & (1 << last)):
                continue
            if dp[mask][last] == INF:
                continue

            for next_node in range(n):
                if mask & (1 << next_node):
                    continue
                new_mask = mask | (1 << next_node)
                dp[new_mask][next_node] = min(
                    dp[new_mask][next_node],
                    dp[mask][last] + cost[last][next_node]
                )

    # Return to start
    full_mask = (1 << n) - 1
    return min(dp[full_mask][i] + cost[i][0] for i in range(n))
```

**Common Problems:**
- Traveling Salesman Problem
- Minimum XOR Sum of Two Arrays
- Find the Shortest Superstring
- Parallel Courses II

## Optimization Techniques

### Space Optimization

```python
# 2D -> 1D (when only previous row needed)
# Before: O(n*m) space
dp = [[0] * m for _ in range(n)]
for i in range(n):
    for j in range(m):
        dp[i][j] = f(dp[i-1][j], dp[i][j-1])

# After: O(m) space
dp = [0] * m
for i in range(n):
    for j in range(m):
        dp[j] = f(dp[j], dp[j-1])  # dp[j] is "previous" dp[i-1][j]
```

### Knuth Optimization

For interval DP where optimal split point is monotonic:
- Time: O(n^3) -> O(n^2)
- Condition: opt[i][j-1] <= opt[i][j] <= opt[i+1][j]

### Convex Hull Trick

For DP with transitions of form: dp[i] = min(dp[j] + b[j] * a[i])
- Time: O(n^2) -> O(n) or O(n log n)
- Used in: Divide jobs, IOI problems

### Monotonic Queue Optimization

For sliding window maximum/minimum in DP transitions:
- Time: O(n*k) -> O(n)
- Used in: Constrained Subsequence Sum

## Use Cases

### Interview Preparation

```javascript
// Get pattern hints for a problem
const hints = await matchPattern({
  problem: "Given coins and amount, find min coins needed"
});
// Returns: "Unbounded Knapsack / Min Coin Change"

// Get template and explanation
const template = await generateTemplate({
  pattern: "coin-change",
  language: "python",
  withExplanation: true
});
```

### Problem Solving

```javascript
// Match problem to pattern
const match = await dpLibrary.match(problemDescription);
console.log(`Pattern: ${match.pattern}`);
console.log(`State: ${match.state}`);
console.log(`Transition: ${match.transition}`);

// Generate solution template
const code = await dpLibrary.template(match.pattern);
```

## API Reference

### `match(problem: string): PatternMatch`

Identifies the DP pattern from problem description.

### `template(pattern: string, options?: TemplateOptions): string`

Generates template code for a pattern.

### `optimize(pattern: string): OptimizationInfo`

Returns optimization techniques for a pattern.

### `list(category?: string): Pattern[]`

Lists all patterns or patterns in a category.

### `similar(pattern: string): string[]`

Returns similar patterns and related problems.

## Related Skills

- **leetcode-problem-fetcher**: Fetch DP problems
- **complexity-analyzer**: Analyze DP solution complexity
- **interview-problem-bank**: Curated DP problems
- **algorithm-visualizer**: Visualize DP tables

## References

- [LeetCode DP Patterns Discussion](https://leetcode.com/discuss/general-discussion/458695/)
- [AtCoder DP Contest](https://atcoder.jp/contests/dp)
- [CSES DP Section](https://cses.fi/problemset/)
- [Dynamic Programming Patterns GitHub](https://github.com/aatalyk/Dynamic-Programming-Patterns)
