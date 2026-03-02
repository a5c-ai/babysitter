# GSD Executor Agent

## Overview

The `gsd-executor` agent executes phase plans with atomic commits, deviation handling, and checkpoint protocols. It receives a single PLAN.md file and processes each XML task sequentially, producing one git commit per task and a SUMMARY.md upon completion.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Software Engineer |
| **Context** | Fresh 200k tokens per plan |
| **Philosophy** | "One task, one commit, no silent deviations" |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Plan Execution** | XML task parsing, sequential execution, acceptance criteria validation |
| **Atomic Commits** | Per-task git commits with structured messages |
| **Deviation Handling** | Detection, classification (minor/major/blocker), documentation |
| **Checkpoints** | human-verify, decision, action checkpoint types |
| **Summary Generation** | SUMMARY.md with accomplishments, commits, files, deviations |
| **State Tracking** | STATE.md position updates during execution |

## Usage

### Within Babysitter Processes

```javascript
const result = await ctx.task(executorTask, {
  agentName: 'gsd-executor',
  prompt: {
    role: 'Senior Software Engineer with fresh context',
    task: 'Execute plan tasks atomically with git commits',
    context: {
      planFile: '.planning/phases/01-1-PLAN.md',
      projectFile: '.planning/PROJECT.md',
      stateFile: '.planning/STATE.md'
    },
    instructions: [
      'Read plan file completely before starting',
      'Execute tasks in order, one at a time',
      'Create atomic git commit after each task',
      'Write SUMMARY.md when all tasks complete'
    ],
    outputFormat: 'SUMMARY.md'
  }
});
```

### Direct Invocation

```bash
# Execute a specific plan
/agent gsd-executor execute \
  --plan ".planning/phases/01-1-PLAN.md" \
  --project ".planning/PROJECT.md"

# Execute in gap-closure mode
/agent gsd-executor execute \
  --plan ".planning/phases/01-3-PLAN.md" \
  --gap-closure
```

## Common Tasks

### 1. Standard Plan Execution

Execute a plan from the execute-phase workflow:
- Read plan frontmatter (wave, depends_on, files_modified)
- Parse XML task blocks
- Execute sequentially with atomic commits
- Write SUMMARY.md

### 2. Quick Task Execution

Execute a minimal plan from the quick workflow:
- Single plan with less ceremony
- Still produces atomic commits
- Minimal SUMMARY.md

### 3. Fix Implementation

Execute a fix plan produced by the debug workflow:
- Targeted fix with specific scope
- Extra care around regression risk
- Verify fix resolves original issue

## Process Integration

| Process | Agent Role |
|---------|------------|
| `execute-phase.js` | Primary plan execution (per-plan in wave) |
| `quick.js` | Ad-hoc task execution |
| `debug.js` | Fix implementation after root cause found |
| `add-tests.js` | Test file writing |

## Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const executePlanTask = defineTask({
  name: 'execute-plan',
  description: 'Execute a GSD plan with atomic commits',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Execute Plan: ${inputs.planFile}`,
      agent: {
        name: 'gsd-executor',
        prompt: {
          role: 'Senior Software Engineer with fresh context',
          task: 'Execute plan tasks atomically with git commits',
          context: {
            planFile: inputs.planFile,
            projectContext: inputs.projectFile,
            currentState: inputs.stateFile
          },
          instructions: [
            'Read plan file completely before starting',
            'Execute tasks in order, one at a time',
            'Create atomic git commit after each task',
            'Handle checkpoints by pausing for human input',
            'Document any deviations from plan',
            'Write SUMMARY.md when all tasks complete'
          ],
          outputFormat: 'SUMMARY.md'
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Deviation Classification

| Level | Description | Action |
|-------|-------------|--------|
| **Minor** | Small adaptation preserving intent | Proceed, document in SUMMARY.md |
| **Major** | Cannot achieve goal as planned | Stop, checkpoint for human decision |
| **Blocker** | Cannot proceed at all | Stop, write partial summary, report |

## Related Resources

- [gsd-planner agent](../gsd-planner/) -- Creates the plans this agent executes
- [gsd-verifier agent](../gsd-verifier/) -- Verifies execution results
- [gsd-plan-checker agent](../gsd-plan-checker/) -- Validates plans before execution

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial release |

---

**Backlog ID:** AG-GSD-001
**Category:** Execution
**Status:** Active
