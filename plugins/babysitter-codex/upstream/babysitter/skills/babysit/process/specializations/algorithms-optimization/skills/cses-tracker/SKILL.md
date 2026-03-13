---
name: cses-tracker
description: Track progress through CSES Problem Set with structured learning
allowed-tools:
  - WebFetch
  - Bash
  - Read
  - Write
  - Grep
  - Glob
---

# CSES Tracker Skill

## Purpose

Track progress through the CSES Problem Set with structured learning paths mapped to the Competitive Programmer's Handbook.

## Capabilities

- Track solved problems by category
- Suggest next problems based on difficulty progression
- Generate progress reports
- Map problems to CP Handbook chapters
- Identify knowledge gaps based on unsolved problems
- Create personalized learning paths

## Target Processes

- cses-learning-path
- skill-gap-analysis
- topic-mastery-certification
- progress-tracking

## Integration

Interfaces with CSES platform (https://cses.fi) and maps problems to the Competitive Programmer's Handbook by Antti Laaksonen.

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["getProgress", "suggestNext", "getByCategory", "mapToHandbook", "generateReport"]
    },
    "category": { "type": "string" },
    "solvedProblems": { "type": "array", "items": { "type": "string" } },
    "targetCategory": { "type": "string" }
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
    "progress": { "type": "object" },
    "suggestions": { "type": "array" },
    "report": { "type": "string" }
  },
  "required": ["success"]
}
```

## CSES Categories

- Introductory Problems
- Sorting and Searching
- Dynamic Programming
- Graph Algorithms
- Range Queries
- Tree Algorithms
- Mathematics
- String Algorithms
- Geometry
- Advanced Techniques
