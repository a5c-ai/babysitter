---
name: interview-problem-bank
description: Curated bank of interview problems organized by company, pattern, and difficulty. Provides problem recommendations, coverage tracking, weak area identification, and premium problem alternatives for FAANG interview preparation.
allowed-tools: Bash, Read, Write, Grep, Glob, WebSearch, WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0"
  category: algorithms-optimization
  skill-id: SK-ALGO-024
  priority: high
---

# interview-problem-bank

A specialized skill for curating, organizing, and recommending coding interview problems, with support for company-specific preparation, pattern-based practice, and progress tracking.

## Purpose

Provide a comprehensive interview problem bank with:
- Problems organized by FAANG company and difficulty
- Pattern-based categorization (Blind 75, NeetCode 150, etc.)
- Difficulty progression recommendations
- Coverage tracking and weak area identification
- Premium problem alternatives

## Capabilities

### Core Features

1. **Problem Organization**
   - By company (Google, Meta, Amazon, Apple, Microsoft, etc.)
   - By pattern (Two Pointers, Sliding Window, DP, etc.)
   - By difficulty (Easy, Medium, Hard)
   - By topic (Arrays, Trees, Graphs, etc.)
   - By frequency (most asked in interviews)

2. **Curated Problem Lists**
   - Blind 75 (essential problems)
   - NeetCode 150 (expanded essential list)
   - LeetCode Top Interview Questions
   - Company-specific top questions
   - Pattern-specific problem sets

3. **Progress Tracking**
   - Problems solved by category
   - Weak area identification
   - Time spent per problem type
   - Success rate tracking
   - Spaced repetition for review

4. **Recommendations**
   - Next problem based on progress
   - Problems to strengthen weak areas
   - Company-specific practice plans
   - Time-based study schedules

## Problem Lists

### Blind 75

The essential 75 problems covering all major patterns:

| Category | Count | Topics |
|----------|-------|--------|
| Arrays & Hashing | 9 | Two Sum, Group Anagrams, Top K Frequent |
| Two Pointers | 5 | Valid Palindrome, 3Sum, Container with Water |
| Sliding Window | 6 | Best Time to Buy Stock, Longest Substring |
| Stack | 7 | Valid Parentheses, Min Stack, Daily Temperatures |
| Binary Search | 7 | Search Rotated Array, Find Minimum |
| Linked List | 11 | Reverse LL, Merge Lists, Detect Cycle |
| Trees | 15 | Invert Tree, Max Depth, Level Order |
| Tries | 3 | Implement Trie, Word Search II |
| Heap/Priority Queue | 7 | Merge K Lists, Top K Frequent |
| Backtracking | 9 | Subsets, Permutations, Combination Sum |
| Graphs | 13 | Number of Islands, Clone Graph |
| Dynamic Programming | 12 | Climbing Stairs, House Robber, Coin Change |
| Greedy | 8 | Maximum Subarray, Jump Game |
| Intervals | 6 | Merge Intervals, Meeting Rooms |
| Math & Geometry | 8 | Rotate Image, Set Matrix Zeros |
| Bit Manipulation | 7 | Single Number, Number of 1 Bits |

### NeetCode 150

Extended list with 150 problems for comprehensive preparation:
- All 75 Blind 75 problems
- 75 additional problems for deeper coverage
- More advanced problems per category

### Company-Specific Lists

| Company | Focus Areas | Top Patterns |
|---------|-------------|--------------|
| **Google** | Problem solving, optimization | Arrays, DP, Graphs |
| **Meta** | Arrays, Trees, System Design | Binary Trees, Arrays |
| **Amazon** | OOP, System Design, Leadership | Trees, BFS/DFS |
| **Apple** | iOS/macOS, algorithms | Arrays, Trees |
| **Microsoft** | Coding, System Design | DP, Arrays, Graphs |
| **Netflix** | Distributed Systems | Graphs, DP |

## Usage

### Get Recommended Problems

```bash
# Get next problem based on progress
interview-problem-bank recommend --user progress.json

# Get problems for specific pattern
interview-problem-bank list --pattern "dynamic-programming" --difficulty medium

# Get company-specific problems
interview-problem-bank company --name google --count 50
```

### Track Progress

```bash
# Mark problem as solved
interview-problem-bank solve --problem "two-sum" --time 15 --attempts 1

# Get progress report
interview-problem-bank progress --user progress.json

# Identify weak areas
interview-problem-bank analyze --user progress.json
```

### Generate Study Plan

```bash
# Generate 4-week study plan
interview-problem-bank plan --weeks 4 --target google --level intermediate

# Generate daily practice set
interview-problem-bank daily --count 3 --user progress.json
```

## Output Schema

### Problem Entry

```json
{
  "id": "two-sum",
  "title": "Two Sum",
  "difficulty": "Easy",
  "patterns": ["Arrays", "Hash Table"],
  "companies": ["Google", "Amazon", "Meta", "Apple", "Microsoft"],
  "frequency": 95,
  "url": "https://leetcode.com/problems/two-sum/",
  "premiumAlternative": null,
  "hints": [
    "Use a hash table for O(1) lookup",
    "Store complement as key, index as value"
  ],
  "timeToSolve": {
    "target": 10,
    "beginner": 20,
    "expert": 5
  },
  "relatedProblems": ["3sum", "4sum", "two-sum-ii"]
}
```

### Progress Report

```json
{
  "user": "user123",
  "totalSolved": 150,
  "byDifficulty": {
    "Easy": 50,
    "Medium": 80,
    "Hard": 20
  },
  "byPattern": {
    "Arrays": { "solved": 25, "total": 30 },
    "DP": { "solved": 15, "total": 25 },
    "Graphs": { "solved": 10, "total": 20 }
  },
  "weakAreas": ["Graphs", "Advanced DP", "Tries"],
  "recommendations": [
    { "problem": "course-schedule", "reason": "Strengthen Graphs" },
    { "problem": "word-break", "reason": "Practice DP" }
  ],
  "streak": 15,
  "lastPracticed": "2025-01-24"
}
```

### Study Plan

```json
{
  "duration": "4 weeks",
  "target": "Google",
  "level": "intermediate",
  "schedule": [
    {
      "week": 1,
      "focus": ["Arrays", "Strings", "Two Pointers"],
      "problems": [
        { "day": 1, "problems": ["two-sum", "valid-anagram", "contains-duplicate"] },
        { "day": 2, "problems": ["best-time-to-buy", "max-subarray", "product-except-self"] }
      ]
    },
    {
      "week": 2,
      "focus": ["Sliding Window", "Stack", "Binary Search"],
      "problems": [...]
    }
  ]
}
```

## Pattern-Based Organization

### Array Patterns

| Pattern | Key Problems | Technique |
|---------|--------------|-----------|
| Two Pointers | 3Sum, Container with Water | Converging pointers |
| Sliding Window | Longest Substring, Min Window | Expand/contract window |
| Prefix Sum | Subarray Sum Equals K | Cumulative sum |
| Kadane's | Maximum Subarray | Track max ending at i |

### Tree Patterns

| Pattern | Key Problems | Technique |
|---------|--------------|-----------|
| DFS Recursive | Max Depth, Path Sum | Recursion |
| BFS Level Order | Level Order Traversal | Queue |
| Construct Tree | Build from Preorder/Inorder | Divide and conquer |

### Graph Patterns

| Pattern | Key Problems | Technique |
|---------|--------------|-----------|
| BFS Shortest Path | Word Ladder | Level-by-level |
| DFS Connected Components | Number of Islands | Visit all nodes |
| Topological Sort | Course Schedule | Kahn's algorithm |
| Union Find | Number of Connected | DSU |

### DP Patterns

| Pattern | Key Problems | Technique |
|---------|--------------|-----------|
| 1D Linear | House Robber, Climbing Stairs | dp[i] depends on dp[i-1], dp[i-2] |
| 2D Grid | Unique Paths, Min Path Sum | dp[i][j] from neighbors |
| String DP | Edit Distance, LCS | dp[i][j] for substrings |
| Knapsack | Coin Change, Partition | Include/exclude item |

## Integration Options

### MCP Server

**InterviewReady MCP Server**:
```bash
# Access curated interview content
npm install -g interviewready-mcp-server
```

### External Resources

- [Tech Interview Handbook](https://github.com/yangshun/tech-interview-handbook)
- [Coding Interview University](https://github.com/jwasham/coding-interview-university)
- [FAANG Coding Interview Questions](https://github.com/ombharatiya/FAANG-Coding-Interview-Questions)
- [neerazz/FAANG](https://github.com/neerazz/FAANG)
- [Interviews (kdn251)](https://github.com/kdn251/interviews)

## Integration with Processes

This skill enhances:
- `faang-interview-prep` - Structured FAANG preparation
- `mock-coding-interview` - Problem selection for mocks
- `interview-problem-explanation` - Explaining solutions
- `skill-gap-analysis` - Identifying weak areas

## Interview Preparation Timeline

### 1 Week Preparation

Focus on high-frequency problems:
- Day 1-2: Arrays and Strings (15 problems)
- Day 3-4: Trees and Graphs (10 problems)
- Day 5-6: DP and Backtracking (10 problems)
- Day 7: Review and mock interview

### 1 Month Preparation

Comprehensive coverage:
- Week 1: Fundamentals (Arrays, Strings, Hash Tables)
- Week 2: Data Structures (Trees, Graphs, Heaps)
- Week 3: Algorithms (DP, Backtracking, Greedy)
- Week 4: Review, mock interviews, weak areas

### 3 Month Preparation

Deep mastery:
- Month 1: All Easy + Medium fundamentals
- Month 2: Advanced Medium + Hard problems
- Month 3: Company-specific + mock interviews

## References

- [Blind 75 List](https://www.teamblind.com/post/New-Year-Gift---Curated-List-of-Top-75-LeetCode-Questions-to-Save-Your-Time-OaM1orEU)
- [NeetCode](https://neetcode.io/)
- [Sean Prashad's LeetCode Patterns](https://seanprashad.com/leetcode-patterns/)
- [Tech Interview Handbook](https://github.com/yangshun/tech-interview-handbook)
- [InterviewReady MCP](https://github.com/InterviewReady/mcp-server)

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `PROBLEM_NOT_FOUND` | Problem not in database | Search by alternate name |
| `PREMIUM_LOCKED` | LeetCode premium required | Use alternative problem |
| `INVALID_COMPANY` | Company not recognized | Check supported companies |
| `PROGRESS_LOAD_FAILED` | Cannot load progress file | Initialize new progress |

## Best Practices

1. **Quality over quantity** - Understand solutions deeply
2. **Pattern recognition** - Group problems by pattern
3. **Time yourself** - Practice under interview conditions
4. **Review regularly** - Spaced repetition helps retention
5. **Mock interviews** - Practice explaining solutions
6. **Company research** - Focus on company-specific patterns
