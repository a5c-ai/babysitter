---
name: interview-simulator
description: Simulate realistic coding interview experience
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
---

# Interview Simulator Skill

## Purpose

Simulate a realistic coding interview experience with time constraints, hints, follow-ups, and evaluation.

## Capabilities

- Time-boxed problem presentation
- Hint system with escalation
- Follow-up question generation
- Communication evaluation prompts
- Realistic interviewer responses
- Performance tracking

## Target Processes

- mock-coding-interview
- behavioral-interview-prep
- faang-interview-prep

## Interview Simulation Flow

1. **Problem Presentation**: Present problem with constraints
2. **Clarification Phase**: Answer clarifying questions
3. **Approach Discussion**: Evaluate proposed approach
4. **Implementation Phase**: Monitor coding progress
5. **Testing Phase**: Discuss test cases
6. **Optimization Phase**: Explore improvements
7. **Follow-up Questions**: Present variations

## Hint Escalation System

- Level 1: Direction hint (no algorithm reveal)
- Level 2: Approach hint (mention technique)
- Level 3: Algorithm hint (name the approach)
- Level 4: Implementation hint (key insight)

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "problemId": { "type": "string" },
    "difficulty": { "type": "string", "enum": ["easy", "medium", "hard"] },
    "timeLimit": { "type": "integer", "default": 45 },
    "includeFollowups": { "type": "boolean", "default": true },
    "companyStyle": { "type": "string" }
  },
  "required": ["difficulty"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "problem": { "type": "object" },
    "hints": { "type": "array" },
    "followups": { "type": "array" },
    "evaluation": { "type": "object" }
  },
  "required": ["success"]
}
```
