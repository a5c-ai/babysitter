# TDD Quality Convergence Process

Advanced TDD workflow with iterative quality convergence, agent-based planning and scoring, parallel execution, and human-in-the-loop breakpoints.

## Key Features

This process demonstrates ALL advanced babysitter patterns:

### 1. Agent-Based Planning (kind: "agent")
- Uses LLM to generate detailed implementation plan
- Structured prompt with role, task, context, instructions
- Schema-validated JSON output
- No helper scripts needed

### 2. Test-Driven Development (TDD)
- Write tests first
- Implement to pass tests
- Refactor and iterate
- Red-Green-Refactor cycle

### 3. Quality Convergence Loop
- Iterative improvement with quality scoring
- Continues until target quality reached or max iterations
- Agent-based scoring across multiple dimensions
- Actionable feedback for each iteration

### 4. Parallel Execution
- Runs quality checks concurrently (coverage, lint, types, security)
- Runs final verification checks in parallel
- Uses `ctx.parallel.all()` for efficiency

### 5. Human-in-the-Loop Breakpoints
- Plan review before implementation
- Iteration review with quality reports
- Final approval for merge
- Context files for informed decisions

### 6. Comprehensive Quality Checks
- Test coverage analysis
- Linting
- Type checking
- Security scanning
- Integration testing

## Process Flow

```
START
  ↓
┌─────────────────────────┐
│ PHASE 1: PLANNING       │
├─────────────────────────┤
│ • Agent generates plan  │
│ • Breakpoint: Review    │
└─────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ PHASE 2: TDD CONVERGENCE LOOP           │
│ (Iterate until quality target reached)  │
├─────────────────────────────────────────┤
│ For each iteration:                     │
│   1. Write/update tests                 │
│   2. Run tests (expect fail initially)  │
│   3. Implement/refine code              │
│   4. Run tests (should pass)            │
│   5. Parallel quality checks:           │
│      ├─ Coverage                        │
│      ├─ Lint                            │
│      ├─ Types                           │
│      └─ Security                        │
│   6. Agent quality scoring              │
│   7. Check convergence                  │
│   8. Breakpoint: Review iteration       │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────┐
│ PHASE 3: FINAL REVIEW   │
├─────────────────────────┤
│ • Parallel final checks │
│ • Integration tests     │
│ • Agent final review    │
│ • Breakpoint: Approve   │
└─────────────────────────┘
  ↓
END (merged or rejected)
```

## Inputs

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| feature | string | `'User authentication'` | Feature to implement |
| targetQuality | number | `85` | Target quality score (0-100) |
| maxIterations | number | `5` | Maximum convergence iterations |
| requirements | string[] | `[]` | Additional requirements |
| constraints | string[] | `[]` | Implementation constraints |

## Outputs

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether quality target was reached |
| feature | string | Feature name |
| iterations | number | Number of iterations executed |
| finalQuality | number | Final quality score achieved |
| targetQuality | number | Target quality score |
| converged | boolean | Whether convergence was successful |
| iterationResults | array | Detailed results for each iteration |
| finalReview | object | Agent's final review and verdict |
| artifacts | object | Paths to generated artifacts |

## Agent Tasks

### Planning Agent

**Purpose:** Generate detailed implementation plan using TDD principles

**Prompt structure:**
```javascript
{
  role: 'senior software architect and technical lead',
  task: 'Generate detailed implementation plan for feature using TDD',
  context: {
    feature: '...',
    requirements: [...],
    constraints: [...],
    methodology: 'TDD'
  },
  instructions: [
    'Analyze requirements and constraints',
    'Break down into testable units',
    'Define test cases',
    'Outline TDD approach',
    'Identify quality concerns',
    'Generate acceptance criteria',
    'Provide complexity assessment'
  ]
}
```

**Output schema:**
- `approach` (string)
- `testCases` (array of test case objects)
- `implementationSteps` (array of strings)
- `qualityConcerns` (array of strings)
- `acceptanceCriteria` (array of strings)
- `complexity` (low/medium/high)
- `risks` (array of strings)

### Quality Scoring Agent

**Purpose:** Assess implementation quality across multiple dimensions

**Scoring dimensions:**
1. **Test quality (25%)** - Coverage, edge cases, assertions
2. **Implementation quality (30%)** - Correctness, readability, maintainability
3. **Code quality (20%)** - Lint, types, complexity
4. **Security (15%)** - Vulnerabilities, validation, error handling
5. **Alignment (10%)** - Following plan and TDD principles

**Output schema:**
- `overallScore` (0-100)
- `scores` (object with dimension scores)
- `summary` (string)
- `recommendations` (array of actionable items)
- `criticalIssues` (array of blocking issues)
- `progress` (assessment string)

### Final Review Agent

**Purpose:** Comprehensive final assessment and merge recommendation

**Output schema:**
- `verdict` (string summary)
- `approved` (boolean)
- `confidence` (0-100)
- `strengths` (array)
- `concerns` (array)
- `blockingIssues` (array)
- `followUpTasks` (array)

## Parallel Execution

The process uses `ctx.parallel.all()` in two places:

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

## Breakpoints

### 1. Plan Review
- **When:** After agent generates plan
- **Question:** "Review the implementation plan and approve to proceed?"
- **Context:** Plan markdown file

### 2. Iteration Review
- **When:** After each iteration (if quality not reached)
- **Question:** "Iteration N complete. Quality: X/Y. Continue iteration N+1?"
- **Context:** Iteration report, quality score JSON

### 3. Final Approval
- **When:** After final verification
- **Question:** "Implementation complete. Quality: X/Y. Approve for merge?"
- **Context:** Final report, coverage report, quality history

## Example Input

```json
{
  "feature": "User authentication with JWT",
  "targetQuality": 90,
  "maxIterations": 5,
  "requirements": [
    "Support email/password login",
    "JWT token generation",
    "Token refresh mechanism",
    "Secure password hashing"
  ],
  "constraints": [
    "Use bcrypt for hashing",
    "Tokens expire in 1 hour",
    "Refresh tokens expire in 7 days"
  ]
}
```

## Usage

```bash
CLI="npx -y @a5c-ai/babysitter-sdk"

# Create run
$CLI run:create \
  --process-id babysitter/tdd-quality-convergence \
  --entry .claude/skills/babysit/process/tdd-quality-convergence.js#process \
  --inputs inputs.json

# Run orchestration
$CLI run:continue .a5c/runs/<runId> --auto-node-tasks --auto-node-max 10
```

## Convergence Example

**Iteration 1:**
- Tests written: 12
- Tests passing: 0 (TDD red phase)
- Implementation: Initial code
- Quality checks: Pass
- Quality score: 45/90
- Agent feedback: "Improve error handling, add input validation"

**Iteration 2:**
- Tests updated: 15 (added edge cases)
- Tests passing: 12 (3 new failures from edge cases)
- Implementation: Added error handling
- Quality checks: Pass
- Quality score: 68/90
- Agent feedback: "Add integration tests, improve test coverage"

**Iteration 3:**
- Tests updated: 18 (integration tests added)
- Tests passing: 18
- Implementation: Refactored for better maintainability
- Quality checks: Pass
- Quality score: 82/90
- Agent feedback: "Add security tests, document edge cases"

**Iteration 4:**
- Tests updated: 22 (security tests added)
- Tests passing: 22
- Implementation: Security hardening
- Quality checks: Pass
- Quality score: 91/90 ✓
- **Converged!**

## See Also

- `plugins/babysitter/skills/babysit/SKILL.md` - Core orchestration workflow
- `plugins/babysitter/skills/babysit/reference/ADVANCED_PATTERNS.md` - Pattern 5 (Agent), Pattern 6 (Skill), Pattern 7 (Iterative Convergence)
- `packages/sdk/sdk.md` - SDK API reference
