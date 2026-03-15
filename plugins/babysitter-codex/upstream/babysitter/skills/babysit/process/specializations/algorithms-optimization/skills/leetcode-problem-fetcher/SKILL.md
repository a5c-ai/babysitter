---
name: leetcode-problem-fetcher
description: Fetch and parse LeetCode problems with metadata, constraints, examples, hints, difficulty ratings, and related problems. Integrates with LeetCode API for comprehensive problem data retrieval.
allowed-tools: Bash, Read, Write, WebFetch, WebSearch
metadata:
  author: babysitter-sdk
  version: "1.0"
  category: algorithms-optimization
  skill-id: SK-ALGO-001
  priority: high
---

# leetcode-problem-fetcher

A specialized skill for fetching and parsing LeetCode problems with complete metadata, suitable for competitive programming practice, interview preparation, and algorithm learning workflows.

## Purpose

Extract comprehensive problem data from LeetCode including:
- Problem statements and descriptions
- Input/output constraints and formats
- Test cases and hidden constraints
- Problem difficulty, tags, and acceptance rate
- Related problems and pattern tags
- Hints and solution approaches

## Capabilities

### Core Features

1. **Problem Retrieval**
   - Fetch problems by title slug (URL-friendly name)
   - Retrieve daily challenge problems
   - Search problems by category, tags, difficulty, or keywords
   - Access premium problem alternatives when available

2. **Metadata Extraction**
   - Difficulty level (Easy, Medium, Hard)
   - Acceptance rate and submission statistics
   - Problem tags and categories
   - Related problems and similar questions
   - Company tags (when available)

3. **Content Parsing**
   - Problem description in markdown format
   - Input/output examples with explanations
   - Constraints and edge cases
   - Follow-up questions and optimizations
   - Code templates for multiple languages

4. **User Data Access**
   - User profile and statistics
   - Contest ranking and history
   - Submission history and solutions
   - Progress tracking across problem sets

## Integration Options

### MCP Server (Recommended)

```bash
# Install LeetCode MCP Server by jinzcdev
claude mcp add-json "leetcode" '{"type":"stdio","command":"npx","args":["-y","@jinzcdev/leetcode-mcp-server","--site","global"]}'
```

**Available MCP Tools:**
- `get_daily_challenge` - Fetch daily LeetCode challenge
- `get_problem` - Retrieve problem by titleSlug
- `search_problems` - Filter by category, tags, difficulty, keywords
- `get_user_profile` - Access user data
- `get_user_contest_ranking` - Track contest performance

### Direct API Integration

```javascript
// GraphQL endpoint for LeetCode
const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

// Query for problem details
const problemQuery = `
  query getProblem($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      titleSlug
      content
      difficulty
      topicTags { name slug }
      hints
      sampleTestCase
      codeSnippets { lang code }
      stats
    }
  }
`;
```

### Browser Extension

**Competitive Companion** - Parses problems from LeetCode and 115+ other online judges:
- Chrome: [competitive-companion](https://chrome.google.com/webstore/detail/competitive-companion)
- Firefox: [competitive-companion](https://addons.mozilla.org/en-US/firefox/addon/competitive-companion)

## Usage

### Fetch a Problem

```bash
# Using MCP Server
leetcode get_problem --titleSlug "two-sum"

# Output includes:
# - Problem title and description
# - Difficulty and acceptance rate
# - Topic tags
# - Examples and constraints
# - Code templates
```

### Search Problems

```bash
# Search by difficulty and tags
leetcode search_problems --difficulty MEDIUM --tags "dynamic-programming,array"

# Search by keyword
leetcode search_problems --keyword "substring"
```

### Get Daily Challenge

```bash
# Fetch today's daily challenge
leetcode get_daily_challenge
```

## Output Schema

```json
{
  "problem": {
    "id": "string",
    "title": "string",
    "titleSlug": "string",
    "difficulty": "Easy|Medium|Hard",
    "acceptanceRate": "number",
    "description": "string (markdown)",
    "constraints": ["string"],
    "examples": [
      {
        "input": "string",
        "output": "string",
        "explanation": "string"
      }
    ],
    "hints": ["string"],
    "topicTags": ["string"],
    "similarQuestions": ["string"],
    "codeTemplates": {
      "python3": "string",
      "cpp": "string",
      "java": "string"
    }
  },
  "metadata": {
    "fetchedAt": "ISO8601 timestamp",
    "source": "leetcode.com|leetcode.cn"
  }
}
```

## Integration with Processes

This skill enhances the following processes:
- `leetcode-problem-solving` - Core problem-solving workflow
- `pattern-recognition` - Identifying algorithmic patterns
- `faang-interview-prep` - FAANG interview preparation

## References

- [LeetCode MCP Server (jinzcdev)](https://github.com/jinzcdev/leetcode-mcp-server)
- [LeetCode MCP Server (doggybee)](https://github.com/doggybee/mcp-server-leetcode)
- [Competitive Companion](https://github.com/jmerle/competitive-companion)
- [Competitive Programming Helper (CPH)](https://github.com/agrawal-d/cph)

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `PROBLEM_NOT_FOUND` | Invalid titleSlug | Verify problem URL or slug |
| `RATE_LIMITED` | Too many requests | Implement exponential backoff |
| `AUTH_REQUIRED` | Premium problem | Use alternative or authenticate |
| `NETWORK_ERROR` | Connection failed | Check network, retry with backoff |

## Best Practices

1. **Caching**: Cache problem data to reduce API calls
2. **Rate Limiting**: Respect LeetCode's rate limits (use delays between requests)
3. **Error Handling**: Gracefully handle premium/locked problems
4. **Offline Mode**: Store fetched problems for offline practice
5. **Data Freshness**: Re-fetch periodically for updated statistics
