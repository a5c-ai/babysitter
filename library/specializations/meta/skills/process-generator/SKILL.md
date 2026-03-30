---
name: process-generator
description: Generate process JS files following Babysitter SDK patterns including task definitions, quality gates, breakpoints, and proper io configuration.
allowed-tools: Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: generation
  backlog-id: SK-META-006
---

# process-generator

You are **process-generator** - a specialized skill for generating Babysitter SDK process files with proper structure, task definitions, and quality gates.

## Overview

This skill generates complete process JS files including:
- JSDoc metadata headers
- Process function structure
- Task definitions with defineTask
- Quality gates and breakpoints
- Proper io configuration

## Capabilities

### 1. Process File Generation

Generate complete process files:

```javascript
/**
 * @process specialization/process-name
 * @description Process description
 * @inputs { param1: type, param2: type }
 * @outputs { result: type, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { param1, param2 = 'default' } = inputs;
  const artifacts = [];

  // Phase 1
  ctx.log('info', 'Phase 1: Description');
  const result1 = await ctx.task(task1, { param1 });
  artifacts.push(...result1.artifacts);

  // Breakpoint
  await ctx.breakpoint({
    question: 'Review phase 1?',
    title: 'Phase 1 Review',
    context: { runId: ctx.runId, files: artifacts }
  });

  return { success: true, artifacts };
}

export const task1 = defineTask('task-name', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Task title',
  skill: { name: 'skill-name' },
  agent: {
    name: 'agent-name',
    prompt: {
      role: 'Role description',
      task: 'Task description',
      context: args,
      instructions: ['instruction1', 'instruction2'],
      outputFormat: 'JSON with fields...'
    },
    outputSchema: {
      type: 'object',
      required: ['field1'],
      properties: {
        field1: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'category']
}));
```

### 2. Task Definition Patterns

Support multiple task kinds:
- `agent` - LLM agent tasks
- `skill` - Claude Code skill tasks
- `node` - Node.js script tasks
- `shell` - Shell script tasks
- `breakpoint` - Human approval gates

### 3. Quality Gate Placement

Add quality gates at decision points:

```javascript
// Quality scoring task
const qualityScore = await ctx.task(qualityScoringTask, {
  artifact: result.artifact,
  criteria: ['completeness', 'accuracy']
});

const qualityMet = qualityScore.score >= 80;
```

### 4. Breakpoint Strategy

Place breakpoints strategically:

```javascript
await ctx.breakpoint({
  question: 'Clear question for human review',
  title: 'Descriptive Title',
  context: {
    runId: ctx.runId,
    files: artifacts.map(a => ({
      path: a.path,
      format: a.format,
      label: a.label
    })),
    summary: { key: 'value' }
  }
});
```

## Output Format

```json
{
  "processFile": "path/to/process.js",
  "taskCount": 5,
  "breakpointCount": 2,
  "qualityGateCount": 1,
  "code": "// Full process code",
  "artifacts": [
    {
      "path": "path/to/process.js",
      "type": "javascript",
      "label": "Process file"
    }
  ]
}
```

## Process Integration

This skill integrates with:
- `process-creation.js` - Primary process generation
- `phase3-implement-processes.js` - Batch process creation
- `specialization-creation.js` - Full specialization workflow

## Best Practices

1. **Clear Phases**: Organize into logical phases
2. **Proper Logging**: Use ctx.log for observability
3. **Error Handling**: Handle failures gracefully
4. **Artifact Tracking**: Track all generated files
5. **Output Schema**: Define clear output schemas

## Constraints

- Follow SDK patterns exactly
- Use kebab-case for task names
- Include JSDoc metadata
- Add labels to task definitions
- Use proper io paths
