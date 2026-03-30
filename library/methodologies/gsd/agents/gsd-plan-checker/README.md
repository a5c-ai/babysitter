# GSD Plan Checker Agent

## Overview

The `gsd-plan-checker` agent validates plans before execution begins. It exists as a separate agent from gsd-planner to prevent self-review bias, using goal-backward analysis to ensure plan coverage is complete and identifying gaps, scope creep, and dependency issues.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior QA Engineer -- Plan Review Specialist |
| **Independence** | Separate from planner to avoid bias |
| **Philosophy** | "A plan that cannot achieve its goal is worse than no plan" |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Goal Coverage** | Map capabilities to plan tasks, identify gaps |
| **Gap Detection** | Missing capabilities, partial coverage, integration gaps |
| **Dependency Checks** | Wave ordering, file conflicts, prerequisites |
| **Scope Creep** | Flag tasks beyond goal requirements |
| **Feedback** | Specific, actionable remediation guidance |

## Usage

### Within Babysitter Processes

```javascript
const result = await ctx.task(planCheckerTask, {
  agentName: 'gsd-plan-checker',
  prompt: {
    role: 'Senior QA Engineer - Plan Review Specialist',
    task: 'Verify plans will achieve phase goal before execution',
    context: {
      phase: 3,
      roadmapFile: '.planning/ROADMAP.md',
      requirementsFile: '.planning/REQUIREMENTS.md',
      planFiles: ['.planning/phases/03-1-PLAN.md', '.planning/phases/03-2-PLAN.md']
    },
    outputFormat: 'Pass/fail with feedback'
  }
});
```

### Direct Invocation

```bash
# Check plans for a phase
/agent gsd-plan-checker check \
  --phase 3 \
  --roadmap ".planning/ROADMAP.md" \
  --plans ".planning/phases/03-*-PLAN.md"
```

## Common Tasks

### 1. Pre-Execution Validation

Validate all plans for a phase before execute-phase runs.

### 2. Quick Plan Validation

Validate a single quick-mode plan in --full mode.

### 3. Revision Feedback

Provide specific feedback for planner revision (max 2 iterations).

## Process Integration

| Process | Agent Role |
|---------|------------|
| `plan-phase.js` | Plan validation loop |
| `quick.js` | Plan validation (--full mode) |

## Output Format

### Pass
```
PASS -- Plans achieve phase goal with complete coverage
```

### Fail
```
FAIL -- Plans do not fully achieve phase goal

## Gaps
1. Token refresh not addressed (add to Plan 1 or create Plan 3)
2. Error handling for invalid JWT missing from Task 3

## Scope Issues
1. Task 7 adds rate limiting (not in phase requirements, defer)

## Dependency Issues
1. Plan 2 wave 1 modifies auth.ts, conflicts with Plan 1 wave 1
```

## Related Resources

- [gsd-planner agent](../gsd-planner/) -- Creates plans this agent validates
- [gsd-verifier agent](../gsd-verifier/) -- Post-execution verification
- [gsd-executor agent](../gsd-executor/) -- Executes validated plans

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial release |

---

**Backlog ID:** AG-GSD-004
**Category:** Verification
**Status:** Active
