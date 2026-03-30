# Process Examples with Agent/Skill Invocation

**Date:** 2026-01-20
**Task:** Create advanced process example demonstrating agent/skill invocation, quality convergence, TDD, parallelization, and breakpoints
**Status:** ✅ Complete

---

## Summary

Created comprehensive advanced process example (`tdd-quality-convergence.js`) demonstrating ALL babysitter advanced patterns in a single realistic workflow. Removed old simplified examples in favor of one comprehensive example.

---

## Key Corrections Made

### ❌ INCORRECT Pattern (Removed)

```javascript
// WRONG: Using args field for skill invocation
export const skillTask = {
  kind: 'skill',
  skill: {
    name: 'codebase-analyzer',
    args: `--scope ${args.scope}`,  // ❌ args field not valid
    context: {
      analysisType: args.type
      // ❌ Missing instructions
    }
  }
};
```

### ✅ CORRECT Pattern (Now Used)

```javascript
// CORRECT: No args field, instructions in context
export const skillTask = defineTask('analyzer-skill', (args, taskCtx) => ({
  kind: 'skill',

  skill: {
    name: 'codebase-analyzer',
    context: {
      scope: args.scope,
      depth: args.depth,
      analysisType: args.type,
      criteria: [...],
      instructions: [  // ✅ Instructions in context
        'Scan specified paths',
        'Check consistency',
        'Generate report'
      ]
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

**No helper scripts needed** - orchestrator handles dispatch.

---

## Deliverable: TDD Quality Convergence Process

### Overview

**File:** `.claude/skills/babysit/process/tdd-quality-convergence.js` (700+ lines)

**Demonstrates:**
1. ✅ Agent-based planning (`kind: "agent"`)
2. ✅ Test-Driven Development workflow
3. ✅ Quality convergence with iterative feedback
4. ✅ Parallel quality checks
5. ✅ Human-in-the-loop breakpoints
6. ✅ Agent-based quality scoring
7. ✅ Comprehensive final review

### Process Structure

```
PHASE 1: PLANNING
├─ Agent planning task (kind: "agent")
└─ Breakpoint: Plan review

PHASE 2: TDD CONVERGENCE LOOP (iterate until quality target reached)
├─ Write/update tests
├─ Run tests (expect failures initially)
├─ Implement/refine code
├─ Run tests again (should pass)
├─ Parallel quality checks:
│  ├─ Coverage
│  ├─ Lint
│  ├─ Type checking
│  └─ Security scan
├─ Agent quality scoring (kind: "agent")
├─ Check convergence
└─ Breakpoint: Iteration review

PHASE 3: FINAL VERIFICATION
├─ Parallel final checks
├─ Integration tests
├─ Agent final review (kind: "agent")
└─ Breakpoint: Final approval
```

### Agent Tasks (3 Total)

#### 1. Planning Agent

**Purpose:** Generate detailed TDD implementation plan

```javascript
export const agentPlanningTask = defineTask('agent-planner', (args, taskCtx) => ({
  kind: 'agent',

  agent: {
    name: 'feature-planner',
    prompt: {
      role: 'senior software architect and technical lead',
      task: 'Generate detailed implementation plan for feature using TDD',
      context: {
        feature: args.feature,
        requirements: args.requirements,
        constraints: args.constraints,
        methodology: 'Test-Driven Development (TDD)'
      },
      instructions: [
        'Analyze requirements and constraints',
        'Break down into testable units',
        'Define test cases',
        'Outline TDD approach',
        'Identify quality concerns',
        'Generate acceptance criteria'
      ],
      outputFormat: 'JSON with approach, testCases, implementationSteps, etc.'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'testCases', 'implementationSteps'],
      properties: { /* ... */ }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

**Key features:**
- Structured prompt with role, task, context, instructions
- Schema-validated output
- No helper scripts

#### 2. Quality Scoring Agent

**Purpose:** Assess quality across multiple dimensions

**Scoring dimensions:**
- Test quality (25%)
- Implementation quality (30%)
- Code quality (20%)
- Security (15%)
- Alignment with plan (10%)

```javascript
export const agentQualityScoringTask = defineTask('agent-quality-scorer', (args, taskCtx) => ({
  kind: 'agent',

  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'senior QA engineer and code reviewer',
      task: 'Analyze quality and provide quantitative score with feedback',
      context: {
        feature: args.feature,
        tests: args.tests,
        implementation: args.implementation,
        qualityChecks: args.qualityChecks,
        targetQuality: args.targetQuality
      },
      instructions: [
        'Review test quality (25%)',
        'Review implementation quality (30%)',
        'Review code metrics (20%)',
        'Review security (15%)',
        'Review alignment (10%)',
        'Calculate weighted score',
        'Provide recommendations'
      ]
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'scores', 'recommendations'],
      properties: { /* ... */ }
    }
  }
}));
```

**Returns:**
- `overallScore` (0-100)
- `scores` (dimension breakdown)
- `recommendations` (actionable feedback)
- `criticalIssues` (blocking problems)

#### 3. Final Review Agent

**Purpose:** Comprehensive final assessment

```javascript
export const agentFinalReviewTask = defineTask('agent-final-reviewer', (args, taskCtx) => ({
  kind: 'agent',

  agent: {
    name: 'implementation-reviewer',
    prompt: {
      role: 'principal engineer and technical reviewer',
      task: 'Conduct final review and provide production readiness verdict',
      context: {
        feature: args.feature,
        iterations: args.iterations,
        finalQuality: args.finalQuality,
        converged: args.converged
      },
      instructions: [
        'Review convergence history',
        'Assess final quality',
        'Review test suite',
        'Assess production readiness',
        'Provide merge recommendation'
      ]
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'approved', 'confidence'],
      properties: { /* ... */ }
    }
  }
}));
```

**Returns:**
- `verdict` (summary)
- `approved` (boolean)
- `confidence` (0-100)
- `blockingIssues` (array)
- `followUpTasks` (array)

### Parallel Execution

**During each iteration:**
```javascript
const [coverage, lint, typeCheck, security] = await ctx.parallel.all([
  () => ctx.task(coverageCheckTask, { ... }),
  () => ctx.task(lintCheckTask, { ... }),
  () => ctx.task(typeCheckTask, { ... }),
  () => ctx.task(securityCheckTask, { ... })
]);
```

**Final verification:**
```javascript
const [finalTests, finalCoverage, integrationTests] = await ctx.parallel.all([
  () => ctx.task(runTestsTask, { ... }),
  () => ctx.task(coverageCheckTask, { ... }),
  () => ctx.task(integrationTestTask, { ... })
]);
```

### Breakpoints (3 Total)

1. **Plan Review** - After agent generates plan
2. **Iteration Review** - After each iteration (if not converged)
3. **Final Approval** - After final verification

Each breakpoint includes:
- Question for user
- Title
- Context with file references

### Quality Convergence Example

**Iteration 1:**
- Quality: 45/90
- Agent: "Improve error handling, add input validation"

**Iteration 2:**
- Quality: 68/90
- Agent: "Add integration tests, improve coverage"

**Iteration 3:**
- Quality: 82/90
- Agent: "Add security tests"

**Iteration 4:**
- Quality: 91/90 ✓ **Converged!**

---

## Files Created

1. `.claude/skills/babysit/process/tdd-quality-convergence.js` (700+ lines)
   - Complete advanced process implementation
   - 3 agent tasks
   - 8 node tasks (tests, implementation, quality checks)
   - Parallel execution
   - Quality convergence loop
   - Multiple breakpoints

2. `.claude/skills/babysit/process/tdd-quality-convergence.md` (320+ lines)
   - Comprehensive documentation
   - Process flow diagram
   - Agent task details
   - Convergence example
   - Usage instructions

3. `.claude/skills/babysit/process/examples/tdd-quality-convergence-example.json`
   - Example input with realistic feature requirements

---

## Files Deleted

Removed simplified examples in favor of comprehensive example:

1. `simple-build-and-test.js` + `.md`
2. `build-test-with-agent-scoring.js` + `.md`
3. `codebase-analysis-with-skill.js` + `.md`
4. All corresponding example JSON files

---

## Documentation Updates

### 1. SKILL.md (Updated)

Fixed skill task example to remove `args` field:

```javascript
// OLD (WRONG)
skill: {
  name: 'codebase-analyzer',
  args: `--scope ${args.scope}`,  // ❌
  context: { ... }
}

// NEW (CORRECT)
skill: {
  name: 'codebase-analyzer',
  context: {
    scope: args.scope,
    instructions: [...]  // ✅
  }
}
```

### 2. ADVANCED_PATTERNS.md (Updated)

Fixed Pattern 6 (Skill-Based Execution) to show correct structure:
- Removed `args` field
- Added `instructions` to context
- Added concrete values

---

## Task Kind Patterns

### Agent Task Pattern

```javascript
{
  kind: 'agent',

  agent: {
    name: 'sub-agent-name',
    prompt: {
      role: 'role description',
      task: 'task description',
      context: { /* structured data */ },
      instructions: [ /* step-by-step */ ],
      outputFormat: 'format description'
    },
    outputSchema: { /* JSON schema */ }
  },

  io: { /* I/O paths */ }
}
```

**Key points:**
- No helper scripts
- Structured prompt
- Schema validation
- Orchestrator handles dispatch

### Skill Task Pattern

```javascript
{
  kind: 'skill',

  skill: {
    name: 'skill-identifier',
    context: {
      // All parameters INCLUDING instructions
      scope: '...',
      analysisType: '...',
      criteria: [...],
      instructions: [  // ← Required
        'Step 1',
        'Step 2'
      ]
    }
  },

  io: { /* I/O paths */ }
}
```

**Key points:**
- NO `args` field
- `instructions` in context
- All parameters in context object
- Orchestrator handles dispatch

---

## Integration with Existing Documentation

### Cross-References

- **SKILL.md** → Core 4-step iteration workflow
- **ADVANCED_PATTERNS.md** → Pattern 5 (Agent), Pattern 6 (Skill), Pattern 7 (Iterative Convergence)
- **PACKAGING_PROCESSES_WITH_SKILLS.md** → Process packaging guide
- **packages/sdk/sdk.md** → SDK API reference

### Documentation Flow

1. **SKILL.md** - Quick reference for core workflow
2. **ADVANCED_PATTERNS.md** - Detailed patterns with examples
3. **tdd-quality-convergence.js** - Complete working implementation
4. **PACKAGING_PROCESSES_WITH_SKILLS.md** - How to package

---

## Usage

```bash
CLI="npx -y @a5c-ai/babysitter-sdk@latest"

# Create run
$CLI run:create \
  --process-id babysitter/tdd-quality-convergence \
  --entry .claude/skills/babysit/process/tdd-quality-convergence.js#process \
  --inputs .claude/skills/babysit/process/examples/tdd-quality-convergence-example.json

# Run orchestration
$CLI run:continue .a5c/runs/<runId> --auto-node-tasks --auto-node-max 10
```

---

## Key Takeaways

### For Process Authors

1. **Use correct task kinds:**
   - Agent tasks: `kind: "agent"` with `agent.prompt` structure
   - Skill tasks: `kind: "skill"` with `skill.context.instructions`
   - Regular tasks: `kind: "node"` with `node.entry`

2. **No helper scripts needed:**
   - Agent/skill dispatch handled by orchestrator
   - Just define the TaskDef correctly

3. **Skill invocation:**
   - NO `args` field
   - ALL parameters (including `instructions`) go in `context`
   - `instructions` should be an array of strings

4. **Parallel execution:**
   - Use `ctx.parallel.all()` for independent tasks
   - Returns array of results in order

5. **Quality convergence:**
   - Iterative loops with agent scoring
   - Check convergence condition
   - Breakpoints for review

### For Skill Users

1. **Advanced example shows:**
   - Complete TDD workflow
   - Quality convergence with feedback
   - Agent-based planning and scoring
   - Parallel quality checks
   - Multiple breakpoints

2. **All patterns in one example:**
   - No need for multiple simple examples
   - Shows how patterns compose
   - Realistic workflow

3. **Bundled with skill:**
   - Located in `.claude/skills/babysit/process/`
   - Packaged with skill
   - Ready to use

---

## Comparison: Before vs After

### Before (Incorrect)

- 3 separate simplified examples
- Used `args` field for skill invocation (WRONG)
- Missing `instructions` in skill context
- Examples didn't show composition

### After (Correct)

- 1 comprehensive advanced example
- NO `args` field for skill invocation
- `instructions` included in skill context
- Shows ALL patterns composed together:
  - Agent planning
  - TDD workflow
  - Quality convergence
  - Parallel execution
  - Breakpoints
  - Agent scoring

---

## Testing Checklist

- [x] Created advanced comprehensive process example
- [x] Removed old simplified examples
- [x] Fixed skill invocation pattern (no `args`, added `instructions`)
- [x] Updated SKILL.md to show correct pattern
- [x] Updated ADVANCED_PATTERNS.md to show correct pattern
- [x] Created documentation file with examples
- [x] Created example input JSON
- [x] Demonstrated all advanced patterns in one example
- [x] Cross-referenced with existing docs

---

## Conclusion

✅ Successfully created comprehensive advanced process example

✅ Fixed skill invocation pattern across all documentation

✅ Removed incorrect `args` field from skill tasks

✅ Added `instructions` to skill context

✅ Demonstrated ALL babysitter patterns in realistic workflow:
- Agent-based planning and scoring
- TDD red-green-refactor cycle
- Quality convergence with feedback loops
- Parallel quality checks
- Human-in-the-loop breakpoints

**Key Achievement:** Process authors now have ONE comprehensive, correct example showing how to build advanced workflows with proper agent/skill invocation, quality convergence, parallelization, and breakpoints.

---

**END OF SUMMARY**
