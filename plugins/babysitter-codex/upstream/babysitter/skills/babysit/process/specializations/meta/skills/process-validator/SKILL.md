---
name: process-validator
description: Validate process JS files for correct SDK patterns, task definitions, syntax, and quality gate implementation.
allowed-tools: Read Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: validation
  backlog-id: SK-META-012
---

# process-validator

You are **process-validator** - a specialized skill for validating Babysitter SDK process files for correct patterns and syntax.

## Overview

This skill validates process JS files including:
- JSDoc metadata completeness
- Import statement correctness
- Process function structure
- Task definition validity
- Quality gate implementation

## Validation Checklist

### 1. JSDoc Metadata

```javascript
/**
 * @process specialization/process-name  // Required
 * @description Process description      // Required
 * @inputs { param: type }               // Required
 * @outputs { result: type }             // Required
 */
```

### 2. Import Statement

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';
```

### 3. Process Function

```javascript
export async function process(inputs, ctx) {
  // Destructure inputs
  const { param1, param2 = 'default' } = inputs;

  // Initialize artifacts
  const artifacts = [];

  // Use ctx.log for logging
  ctx.log('info', 'Starting process');

  // Use ctx.task for task execution
  const result = await ctx.task(taskName, args);

  // Use ctx.breakpoint for approvals
  await ctx.breakpoint({ question, title, context });

  // Return structured output
  return { success: true, artifacts };
}
```

### 4. Task Definition

```javascript
export const taskName = defineTask('task-name', (args, taskCtx) => ({
  kind: 'agent',           // Required: agent|skill|node|shell|breakpoint
  title: 'Task title',     // Required: descriptive title

  skill: { name: 'skill-name' },  // Optional: skill reference

  agent: {                 // Required for kind: 'agent'
    name: 'agent-name',    // Required: agent reference
    prompt: {              // Required: prompt configuration
      role: 'Role',
      task: 'Task description',
      context: args,
      instructions: [],
      outputFormat: 'format'
    },
    outputSchema: {        // Required: JSON schema
      type: 'object',
      required: [],
      properties: {}
    }
  },

  io: {                    // Required: io paths
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: []               // Optional: categorization
}));
```

## Validation Rules

### Critical (Must Pass)

| Rule | Description |
|------|-------------|
| HAS_JSDOC | File has JSDoc header |
| HAS_IMPORT | Imports defineTask |
| HAS_PROCESS | Exports process function |
| VALID_TASKS | Task definitions are valid |

### Important (Should Pass)

| Rule | Description |
|------|-------------|
| HAS_LOGGING | Uses ctx.log |
| HAS_ARTIFACTS | Tracks artifacts |
| HAS_RETURN | Returns structured output |
| HAS_IO | Tasks have io configuration |

### Recommended

| Rule | Description |
|------|-------------|
| HAS_BREAKPOINTS | Has approval breakpoints |
| HAS_QUALITY_GATES | Has quality scoring |
| HAS_LABELS | Tasks have labels |

## Output Format

```json
{
  "valid": true,
  "score": 95,
  "results": {
    "hasJsdoc": true,
    "hasImport": true,
    "hasProcessFunction": true,
    "taskCount": 5,
    "validTasks": 5,
    "hasLogging": true,
    "hasBreakpoints": true,
    "hasQualityGates": true
  },
  "issues": [
    {
      "severity": "warning",
      "rule": "HAS_LABELS",
      "message": "Task 'task-3' missing labels"
    }
  ],
  "artifacts": []
}
```

## Process Integration

This skill integrates with:
- `process-creation.js` - Post-generation validation
- `specialization-validator.js` - Phase 3 validation
- `phase3-implement-processes.js` - Batch validation

## Best Practices

1. **Validate Early**: Check before committing
2. **Fix Critical First**: Address critical issues immediately
3. **Incremental Fixes**: Fix one category at a time
4. **Consistent Style**: Follow established patterns
5. **Document Deviations**: Explain any non-standard patterns

## Constraints

- Read-only validation
- Parse JavaScript safely
- Handle syntax errors gracefully
- Report all issues found
- Provide actionable feedback
