---
name: atcoder-client
description: Interface with AtCoder for Japanese competitive programming contests
allowed-tools:
  - WebFetch
  - Bash
  - Read
  - Write
  - Grep
  - Glob
graph:
  domains: [domain:computer-science]
  specializations: [specialization:algorithms-optimization]
  skillAreas: [skill-area:dynamic-programming, skill-area:graph-algorithms]
  roles: [role:backend-engineer, role:computational-scientist]
  workflows: [workflow:competitive-analysis]
---

# AtCoder Client Skill

## Purpose

Interface with AtCoder platform for accessing Japanese competitive programming contests, problems, and submissions.

## Capabilities

- Fetch contest problems with translations
- Submit solutions and track results
- Access AtCoder Problems difficulty ratings
- Virtual contest participation
- Retrieve user submission history
- Access editorial content

## Target Processes

- atcoder-contest
- progress-tracking
- skill-gap-analysis

## Integration

Uses AtCoder web interface and AtCoder Problems API for difficulty ratings and problem metadata.

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["getContestProblems", "getProblem", "getSubmissions", "getDifficulty", "getUserStats"]
    },
    "contestId": { "type": "string" },
    "problemId": { "type": "string" },
    "username": { "type": "string" }
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
  "contestId": "abc300"
}
```
