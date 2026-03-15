---
name: solution-explainer
description: Generate clear explanations of algorithm solutions
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
---

# Solution Explainer Skill

## Purpose

Generate clear, educational explanations of algorithm solutions suitable for interviews, learning, and documentation.

## Capabilities

- Step-by-step solution walkthrough
- Time/space complexity explanation
- Alternative approach comparison
- Common mistake highlights
- Visual aids generation
- Interview-style explanation formatting

## Target Processes

- interview-problem-explanation
- leetcode-problem-solving
- mock-coding-interview
- algorithm-implementation

## Explanation Framework

1. **Problem Understanding**: Restate the problem clearly
2. **Approach Overview**: High-level strategy
3. **Algorithm Details**: Step-by-step breakdown
4. **Complexity Analysis**: Time and space with justification
5. **Code Walkthrough**: Annotated implementation
6. **Edge Cases**: Special scenarios handled
7. **Alternatives**: Other valid approaches

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "problem": { "type": "string" },
    "solution": { "type": "string" },
    "language": { "type": "string" },
    "depth": {
      "type": "string",
      "enum": ["brief", "standard", "detailed"]
    },
    "includeVisuals": { "type": "boolean", "default": false },
    "interviewStyle": { "type": "boolean", "default": false }
  },
  "required": ["problem", "solution"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "explanation": { "type": "string" },
    "complexity": { "type": "object" },
    "commonMistakes": { "type": "array" },
    "alternatives": { "type": "array" },
    "visuals": { "type": "array" }
  },
  "required": ["success", "explanation"]
}
```
