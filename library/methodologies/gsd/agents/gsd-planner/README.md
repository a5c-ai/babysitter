# GSD Planner Agent

## Overview

The `gsd-planner` agent creates executable phase plans with XML task structure, dependency analysis, and wave assignments for parallel execution. It breaks a phase goal into 2-3 focused PLAN.md files that the gsd-executor agent can process.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Technical Lead |
| **Specialty** | Task decomposition and dependency analysis |
| **Philosophy** | "Atomic tasks, executable plans, 100% coverage" |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Context Analysis** | Load PROJECT, ROADMAP, REQUIREMENTS, CONTEXT, RESEARCH |
| **Task Decomposition** | Break phase goal into atomic XML tasks |
| **Dependency Analysis** | Wave assignment, cross-plan dependency declaration |
| **Plan Frontmatter** | wave, depends_on, files_modified, gap_closure |
| **Quick Mode** | Single plan with minimal ceremony |
| **Gap Closure** | Targeted plans for audit-identified gaps |

## Usage

### Within Babysitter Processes

```javascript
const result = await ctx.task(plannerTask, {
  agentName: 'gsd-planner',
  prompt: {
    role: 'Senior Technical Lead',
    task: 'Create executable phase plans with XML task structure',
    context: {
      phase: 3,
      projectFile: '.planning/PROJECT.md',
      roadmapFile: '.planning/ROADMAP.md',
      requirementsFile: '.planning/REQUIREMENTS.md',
      contextFile: '.planning/phases/03-CONTEXT.md',
      researchFile: '.planning/phases/03-RESEARCH.md'
    },
    instructions: [
      'Break phase into 2-3 focused plans',
      'Each task is XML with acceptance criteria',
      'Assign waves for parallel execution'
    ],
    outputFormat: 'PLAN.md files'
  }
});
```

### Direct Invocation

```bash
# Plan a phase
/agent gsd-planner plan-phase \
  --phase 3 \
  --project ".planning/PROJECT.md" \
  --roadmap ".planning/ROADMAP.md"

# Quick mode (single plan)
/agent gsd-planner quick \
  --task "Add rate limiting to API endpoints"

# Gap closure mode
/agent gsd-planner gap-closure \
  --verification ".planning/phases/03-VERIFICATION.md"
```

## Common Tasks

### 1. Standard Phase Planning

- Read all context files
- Decompose phase goal into 2-3 plans
- Assign waves for parallelization
- Declare file scope per plan

### 2. Quick Task Planning

- Single plan with 1-5 tasks
- Minimal frontmatter
- No wave assignment needed

### 3. Gap Closure Planning

- Read VERIFICATION.md for failed sub-goals
- Create targeted plans per gap
- Scope strictly limited to gap resolution

## Process Integration

| Process | Agent Role |
|---------|------------|
| `plan-phase.js` | Primary planning workflow |
| `quick.js` | Ad-hoc task planning (quick mode) |

## Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const createPlanTask = defineTask({
  name: 'create-phase-plan',
  description: 'Create executable phase plans',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Plan Phase ${inputs.phase}`,
      agent: {
        name: 'gsd-planner',
        prompt: {
          role: 'Senior Technical Lead',
          task: 'Create executable phase plans with XML task structure',
          context: {
            phase: inputs.phase,
            projectContext: inputs.projectFile,
            roadmap: inputs.roadmapFile,
            requirements: inputs.requirementsFile
          },
          instructions: [
            'Read all context files before planning',
            'Break phase into 2-3 focused plans',
            'Each task is XML with clear acceptance criteria',
            'Tasks must be atomic (one commit each)',
            'Assign waves for parallel execution'
          ],
          outputFormat: 'PLAN.md files with frontmatter + XML tasks'
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

## Plan Structure Reference

### Frontmatter Schema

| Field | Type | Description |
|-------|------|-------------|
| `phase` | number | Phase number |
| `plan` | number | Plan number within phase |
| `title` | string | Descriptive plan title |
| `wave` | number | Wave for parallel execution |
| `depends_on` | array | Plan IDs this plan depends on |
| `files_modified` | array | Files this plan will touch |
| `gap_closure` | boolean | True if gap closure plan |

### XML Task Format

```xml
<task id="1">
  <title>Concise task title</title>
  <description>Detailed implementation guidance</description>
  <acceptance_criteria>
    - Specific, testable criterion
  </acceptance_criteria>
  <files>src/file1.ts, src/file2.ts</files>
</task>
```

## Related Resources

- [gsd-executor agent](../gsd-executor/) -- Executes the plans this agent creates
- [gsd-plan-checker agent](../gsd-plan-checker/) -- Validates plans before execution
- [gsd-phase-researcher agent](../gsd-phase-researcher/) -- Researches before planning

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial release |

---

**Backlog ID:** AG-GSD-002
**Category:** Planning
**Status:** Active
