# Interview Problem Bank

A curated bank of coding interview problems organized by company, pattern, and difficulty for FAANG interview preparation.

## Overview

The Interview Problem Bank skill provides a comprehensive collection of coding interview problems with company-specific organization, pattern-based categorization, progress tracking, and personalized recommendations. It supports structured preparation for technical interviews at top tech companies.

## Quick Start

### Get Started

```bash
# Initialize progress tracking
interview-problem-bank init --user myname

# Get recommended problems
interview-problem-bank recommend

# Start the Blind 75 list
interview-problem-bank start --list blind75
```

### Daily Practice

```bash
# Get today's practice problems
interview-problem-bank daily --count 3

# Mark problem as complete
interview-problem-bank complete --problem "two-sum" --time 12

# View progress
interview-problem-bank progress
```

## Features

### Problem Lists

| List | Problems | Best For |
|------|----------|----------|
| **Blind 75** | 75 | Time-constrained prep (1-2 weeks) |
| **NeetCode 150** | 150 | Comprehensive prep (1-2 months) |
| **LeetCode Top 100** | 100 | General practice |
| **Company-Specific** | Varies | Targeted company prep |

### Pattern Categories

1. **Arrays & Hashing** - Frequency counting, hash maps
2. **Two Pointers** - Sorted arrays, linked lists
3. **Sliding Window** - Substrings, subarrays
4. **Stack** - Monotonic stacks, parentheses
5. **Binary Search** - Sorted arrays, search space
6. **Linked List** - Reversal, fast/slow pointers
7. **Trees** - DFS, BFS, construction
8. **Tries** - Prefix matching, autocomplete
9. **Heap/Priority Queue** - Top K, merge sorted
10. **Backtracking** - Combinations, permutations
11. **Graphs** - BFS, DFS, topological sort
12. **Dynamic Programming** - Optimization, counting
13. **Greedy** - Local optimal choices
14. **Intervals** - Merge, overlap
15. **Math & Geometry** - Matrix operations
16. **Bit Manipulation** - XOR tricks, counting bits

## Use Cases

### 2-Week Sprint

```bash
# Generate intensive 2-week plan
interview-problem-bank plan --duration 14 --intensity high

# Week 1: Fundamentals
# - Day 1-2: Arrays (10 problems)
# - Day 3-4: Trees & Graphs (10 problems)
# - Day 5-7: DP & Backtracking (10 problems)

# Week 2: Advanced + Review
# - Day 1-3: Hard problems (10 problems)
# - Day 4-5: Weak area practice
# - Day 6-7: Mock interviews
```

### Company-Specific Prep

```bash
# Get Google's most frequent problems
interview-problem-bank company --name google --count 50

# Output:
# 1. Number of Islands (Graphs, 95% frequency)
# 2. Word Ladder (BFS, 92% frequency)
# 3. Merge K Sorted Lists (Heap, 90% frequency)
# ...
```

### Pattern Mastery

```bash
# Focus on a specific pattern
interview-problem-bank pattern --name "sliding-window" --progression

# Output:
# Sliding Window Pattern (6 problems)
#
# Beginner:
# 1. Best Time to Buy and Sell Stock (Easy)
# 2. Longest Substring Without Repeating (Medium)
#
# Intermediate:
# 3. Minimum Window Substring (Hard)
# 4. Sliding Window Maximum (Hard)
#
# Advanced:
# 5. Minimum Number of K Consecutive Bit Flips (Hard)
# 6. Substring with Concatenation of All Words (Hard)
```

## Problem Database

### Sample Entry

```yaml
two-sum:
  title: Two Sum
  difficulty: Easy
  patterns: [Arrays, Hash Table]
  companies: [Google, Amazon, Meta, Apple, Microsoft]
  frequency: 95
  timeTarget: 10  # minutes
  description: |
    Given an array of integers nums and an integer target,
    return indices of the two numbers that add up to target.
  hints:
    - Consider using a hash table for O(1) lookup
    - Store complement as key, index as value
  approaches:
    - name: Brute Force
      time: O(n^2)
      space: O(1)
    - name: Hash Table
      time: O(n)
      space: O(n)
  related: [3sum, 4sum, two-sum-ii-input-array-is-sorted]
```

### Problem Statistics

```bash
# View statistics for a problem
interview-problem-bank info --problem "merge-intervals"

# Output:
# Merge Intervals
# ===============
# Difficulty: Medium
# Acceptance: 45%
# Companies: Google (30), Amazon (25), Meta (20)
# Patterns: Intervals, Sorting
# Time Complexity (optimal): O(n log n)
#
# Related Problems:
# - Insert Interval
# - Meeting Rooms
# - Meeting Rooms II
```

## Progress Tracking

### Track Completion

```javascript
const progress = {
  totalSolved: 85,
  byDifficulty: { Easy: 30, Medium: 45, Hard: 10 },
  byPattern: {
    "Arrays": { solved: 15, total: 20, percentage: 75 },
    "DP": { solved: 8, total: 15, percentage: 53 },
    "Graphs": { solved: 5, total: 12, percentage: 42 }
  },
  streak: 12,
  averageTime: { Easy: 8, Medium: 22, Hard: 45 }
};
```

### Weak Area Analysis

```bash
# Analyze weak areas
interview-problem-bank analyze

# Output:
# Weak Areas Identified:
# 1. Graphs (42% completion, below target 70%)
#    - Recommended: Course Schedule, Number of Islands
# 2. Dynamic Programming (53% completion)
#    - Recommended: Longest Increasing Subsequence, Coin Change
# 3. Tries (30% completion)
#    - Recommended: Implement Trie, Word Search II
```

### Spaced Repetition

```bash
# Get problems due for review
interview-problem-bank review --due today

# Output:
# Problems to Review:
# 1. "Merge K Sorted Lists" (last solved 7 days ago)
# 2. "Word Break" (last solved 14 days ago)
# 3. "Course Schedule" (last solved 21 days ago)
```

## Study Plans

### Beginner Plan (8 weeks)

```
Week 1-2: Arrays, Strings, Hash Tables
Week 3-4: Linked Lists, Stacks, Queues
Week 5-6: Trees, Binary Search
Week 7-8: Basic DP, Backtracking
```

### Intermediate Plan (4 weeks)

```
Week 1: Arrays, Strings, Two Pointers
Week 2: Trees, Graphs, BFS/DFS
Week 3: DP, Backtracking, Greedy
Week 4: Advanced topics, Mock interviews
```

### Advanced Plan (2 weeks)

```
Week 1: Hard problems, optimization
Week 2: Company-specific, mock interviews
```

## Integration Examples

### With LeetCode Fetcher

```javascript
// Fetch problem details for practice session
const problems = await getPracticeSet({ pattern: 'DP', count: 5 });
for (const p of problems) {
  const details = await leetcodeFetcher.getProblem(p.slug);
  console.log(`${details.title} - ${details.difficulty}`);
}
```

### With Mock Interview

```javascript
// Generate mock interview question set
const mockSet = await generateMockInterview({
  company: 'Google',
  duration: 45,
  difficulty: ['Medium', 'Hard']
});

// Returns 2 problems matching Google interview style
```

### With Progress Tracker

```javascript
// Update progress after solving
await updateProgress({
  problem: 'two-sum',
  timeMinutes: 8,
  attempts: 1,
  needsReview: false
});

// Get next recommended problem
const next = await getRecommendation();
```

## API Reference

### `recommend(options?: RecommendOptions): Problem[]`

Get personalized problem recommendations.

### `list(filters: ListFilters): Problem[]`

List problems with filters (pattern, difficulty, company).

### `progress(userId?: string): ProgressReport`

Get progress report for user.

### `plan(options: PlanOptions): StudyPlan`

Generate a study plan based on timeline and goals.

### `complete(problemId: string, stats: CompletionStats): void`

Mark a problem as completed with statistics.

### `analyze(userId?: string): WeakAreaAnalysis`

Analyze weak areas and get recommendations.

## Related Skills

- **leetcode-problem-fetcher**: Fetch problem details
- **mock-coding-interview**: Interview simulation
- **complexity-analyzer**: Verify solution complexity
- **solution-explainer**: Explain solutions

## References

- [Blind 75](https://www.teamblind.com/post/New-Year-Gift---Curated-List-of-Top-75-LeetCode-Questions-to-Save-Your-Time-OaM1orEU)
- [NeetCode Roadmap](https://neetcode.io/roadmap)
- [Tech Interview Handbook](https://www.techinterviewhandbook.org/)
- [LeetCode Patterns](https://seanprashad.com/leetcode-patterns/)
- [Grind 75](https://www.techinterviewhandbook.org/grind75)
