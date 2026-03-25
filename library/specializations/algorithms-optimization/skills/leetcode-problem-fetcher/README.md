# LeetCode Problem Fetcher

A skill for fetching and parsing LeetCode problems with comprehensive metadata for competitive programming and interview preparation workflows.

## Overview

The LeetCode Problem Fetcher skill provides programmatic access to LeetCode's problem database, extracting problem statements, constraints, examples, difficulty ratings, and related metadata. This enables automated problem retrieval for practice sessions, interview preparation, and algorithm learning.

## Quick Start

### Installation

```bash
# Install the recommended MCP server
claude mcp add-json "leetcode" '{"type":"stdio","command":"npx","args":["-y","@jinzcdev/leetcode-mcp-server","--site","global"]}'
```

### Basic Usage

```bash
# Fetch a specific problem
leetcode get_problem --titleSlug "two-sum"

# Get today's daily challenge
leetcode get_daily_challenge

# Search for medium DP problems
leetcode search_problems --difficulty MEDIUM --tags "dynamic-programming"
```

## Features

### Problem Retrieval

| Feature | Description |
|---------|-------------|
| **By Slug** | Fetch problem using URL-friendly title slug |
| **Daily Challenge** | Get current daily challenge problem |
| **Search** | Filter by difficulty, tags, categories |
| **Batch Fetch** | Retrieve multiple problems in sequence |

### Metadata Extraction

- **Difficulty**: Easy, Medium, Hard classifications
- **Tags**: Algorithm patterns (DP, Greedy, Graph, etc.)
- **Statistics**: Acceptance rate, submission count
- **Companies**: Company tags for interview prep
- **Similar Questions**: Related problems for practice

### Content Parsing

- Markdown-formatted problem descriptions
- Input/output examples with explanations
- Constraints and complexity hints
- Multi-language code templates

## Use Cases

### Interview Preparation

```javascript
// Fetch FAANG-style problems by company tag
const problems = await fetchProblems({
  tags: ['google', 'medium'],
  limit: 50
});

// Generate practice set
const practiceSet = problems.map(p => ({
  title: p.title,
  difficulty: p.difficulty,
  pattern: p.topicTags[0]
}));
```

### Pattern Practice

```javascript
// Fetch all sliding window problems
const slidingWindow = await searchProblems({
  tags: ['sliding-window'],
  orderBy: 'difficulty'
});

// Create progression: Easy -> Medium -> Hard
const progression = groupByDifficulty(slidingWindow);
```

### Daily Practice

```javascript
// Get daily challenge and track completion
const daily = await getDailyChallenge();
console.log(`Today's challenge: ${daily.title} (${daily.difficulty})`);
```

## Integration Examples

### With Test Case Generator

```javascript
// Fetch problem, then generate additional test cases
const problem = await fetchProblem('two-sum');
const additionalTests = await generateTestCases(problem.constraints);
```

### With Pattern Library

```javascript
// Identify pattern from fetched problem
const problem = await fetchProblem('longest-palindromic-substring');
const pattern = await matchPattern(problem.topicTags);
// Returns: "Dynamic Programming - String"
```

### With Mock Interview

```javascript
// Random problem selection for mock interview
const problem = await getRandomProblem({
  difficulty: 'MEDIUM',
  tags: ['array', 'hash-table', 'two-pointers'],
  timeLimit: 30 // minutes
});
```

## Configuration

### Environment Variables

```bash
# Optional: LeetCode credentials for premium content
LEETCODE_SESSION=your_session_cookie
LEETCODE_CSRFTOKEN=your_csrf_token

# Site selection (global or cn)
LEETCODE_SITE=global
```

### Cache Settings

```javascript
const config = {
  cacheEnabled: true,
  cacheTTL: 86400, // 24 hours
  cacheDir: '.leetcode-cache'
};
```

## Error Handling

```javascript
try {
  const problem = await fetchProblem(slug);
} catch (error) {
  if (error.code === 'PREMIUM_REQUIRED') {
    // Suggest alternative free problem
    const alternative = await findAlternative(slug);
  } else if (error.code === 'RATE_LIMITED') {
    // Wait and retry
    await sleep(error.retryAfter);
    return fetchProblem(slug);
  }
}
```

## API Reference

### `fetchProblem(titleSlug: string): Promise<Problem>`

Fetches a single problem by its title slug.

### `getDailyChallenge(): Promise<Problem>`

Returns today's daily challenge problem.

### `searchProblems(filters: SearchFilters): Promise<Problem[]>`

Searches problems with optional filters:
- `difficulty`: 'EASY' | 'MEDIUM' | 'HARD'
- `tags`: string[]
- `category`: string
- `keyword`: string
- `limit`: number
- `offset`: number

### `getUserProfile(username: string): Promise<UserProfile>`

Retrieves user profile and statistics.

### `getContestRanking(username: string): Promise<ContestRanking>`

Gets user's contest ranking history.

## Related Skills

- **complexity-analyzer**: Analyze time/space complexity of solutions
- **test-case-generator**: Generate test cases from problem constraints
- **dp-pattern-library**: Match problems to DP patterns
- **interview-problem-bank**: Curated interview problems

## References

- [LeetCode GraphQL API](https://leetcode.com/graphql)
- [LeetCode MCP Server](https://github.com/jinzcdev/leetcode-mcp-server)
- [Competitive Companion](https://github.com/jmerle/competitive-companion)
- [LeetCode Patterns](https://seanprashad.com/leetcode-patterns/)
