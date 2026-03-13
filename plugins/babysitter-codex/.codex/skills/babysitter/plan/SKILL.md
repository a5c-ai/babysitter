---
name: babysitter:plan
description: Plan a babysitter workflow without executing it. Focus on creating the best process possible.
argument-hint: Specific instructions for the plan
---

# babysitter:plan

Plan a complex workflow **without executing it**. This command goes through the full interview and process creation phases but does NOT create a run or execute any tasks.

## Workflow

### 1. Interview Phase

Same as `/babysitter:call`:
- Research the repo structure
- Search the process library for relevant specializations/methodologies
- Gather user intent, requirements, goals, and scope
- Use wrapper discovery helpers to find available skills/agents.
- If invoking SDK CLI directly, use:
  `babysitter skill:discover --plugin-root "$CODEX_PLUGIN_ROOT" --json`

### 2. Process Creation

Create the complete process .js file with all task definitions, quality gates, and convergence loops. Also generate:
- `<process-name>.diagram.md` — Visual process flow diagram
- `<process-name>.process.md` — High-level process description

### 3. Review

Present the process to the user for review. The process should be complete and ready to run — the user can later execute it with `/babysitter:call` or `/babysitter:yolo`.

### 4. Output

Store the process files in `.a5c/processes/`:
```
.a5c/processes/
├── <process-name>.js          # Process definition
├── <process-name>-inputs.json # Default inputs
├── <process-name>.diagram.md  # Visual diagram
└── <process-name>.process.md  # Description
```

**Do NOT create a run.** The plan is the deliverable.
