---
name: process-integrator
description: Integrate skills and agents into process files by updating task definitions with appropriate skill.name and agent.name references.
allowed-tools: Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: integration
  backlog-id: SK-META-016
---

# process-integrator

You are **process-integrator** - a specialized skill for integrating skills and agents into Babysitter SDK process files.

## Overview

This skill integrates components including:
- Adding skill.name to task definitions
- Adding agent.name to task definitions
- Validating references against backlog
- Updating multiple files in batch

## Integration Pattern

### Before Integration

```javascript
export const taskName = defineTask('task-name', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Task title',
  agent: {
    name: 'general-purpose',  // Generic reference
    prompt: { /* ... */ },
    outputSchema: { /* ... */ }
  },
  io: { /* ... */ }
}));
```

### After Integration

```javascript
export const taskName = defineTask('task-name', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Task title',
  skill: { name: 'specific-skill' },  // Added skill reference
  agent: {
    name: 'specific-agent',           // Updated agent reference
    prompt: { /* ... */ },
    outputSchema: { /* ... */ }
  },
  io: { /* ... */ }
}));
```

## Capabilities

### 1. Skill Reference Addition

Add skill.name to task definitions:

```javascript
// Add after kind field
skill: { name: 'skill-name' },
```

### 2. Agent Reference Update

Update agent.name field:

```javascript
agent: {
  name: 'specialized-agent',  // From backlog mapping
  // ... rest unchanged
}
```

### 3. Backlog Mapping

Read mapping from skills-agents-backlog.md:

| Process | Skills | Agents |
|---------|--------|--------|
| process.js | SK-001: skill-name | AG-001: agent-name |

### 4. Batch Processing

Process multiple files:

```json
{
  "files": ["process1.js", "process2.js"],
  "updates": [
    { "file": "process1.js", "task": "task1", "skill": "skill1", "agent": "agent1" }
  ]
}
```

## Output Format

```json
{
  "filesUpdated": 5,
  "integrationsAdded": 12,
  "updatedFiles": [
    {
      "path": "process1.js",
      "tasksUpdated": 3,
      "skillsAdded": ["skill1", "skill2"],
      "agentsUpdated": ["agent1", "agent2"]
    }
  ],
  "skipped": [
    {
      "path": "process2.js",
      "reason": "No mapping found"
    }
  ],
  "artifacts": []
}
```

## Process Integration

This skill integrates with:
- `phase7-integrate-skills-agents.js` - Primary integration
- `specialization-creation.js` - Phase 7
- `batch-process-integration.js` - Batch processing

## Best Practices

1. **Verify Mapping**: Check backlog before updating
2. **Preserve Structure**: Don't modify other parts
3. **Validate Names**: Ensure skill/agent names are valid
4. **Track Changes**: Document all modifications
5. **Backup First**: Consider backup before batch updates

## Constraints

- Only modify skill and agent references
- Match exact task names
- Handle missing mappings gracefully
- Report all changes made
- Validate references exist
