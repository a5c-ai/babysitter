---
name: codeforces-api-client
description: Interface with Codeforces API for contest data, problem sets, and submissions
allowed-tools:
  - WebFetch
  - Bash
  - Read
  - Write
  - Grep
  - Glob
---

# Codeforces API Client Skill

## Purpose

Interface with the Codeforces API to fetch contest data, problem sets, submissions, and user statistics for competitive programming workflows.

## Capabilities

- Fetch contest problems and metadata
- Submit solutions and retrieve verdicts
- Access user standings and rating history
- Retrieve editorials and problem tags
- Virtual contest management
- Fetch recent submissions and status
- Access problemset by tags and difficulty

## Target Processes

- codeforces-contest
- progress-tracking
- skill-gap-analysis
- upsolving workflows

## Integration

Uses the official Codeforces API (https://codeforces.com/apiHelp) with proper rate limiting and authentication when required.

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["getContestProblems", "getUserSubmissions", "getProblemset", "getStandings", "getUserRating"]
    },
    "contestId": { "type": "integer" },
    "handle": { "type": "string" },
    "tags": { "type": "array", "items": { "type": "string" } },
    "count": { "type": "integer", "default": 10 }
  },
  "required": ["action"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "data": { "type": "object" },
    "error": { "type": "string" }
  },
  "required": ["success"]
}
```

## Usage Example

```javascript
{
  "action": "getContestProblems",
  "contestId": 1900
}
```
