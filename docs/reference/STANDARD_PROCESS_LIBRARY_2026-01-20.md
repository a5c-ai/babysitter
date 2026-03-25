# Standard Process Library Implementation

**Date:** 2026-01-20
**Task:** Todo #6 - Create the standard library of processes (core, per roles, per methodology)
**Status:** ✅ Foundation Complete

---

## Summary

Created the foundation for a standard library of reusable babysitter processes organized by category (core, roles, methodologies). Implemented 4 foundational processes demonstrating different workflow patterns, and created comprehensive documentation.

---

## Directory Structure Created

```
.a5c/processes/
├── README.md                          # Standard library documentation
├── core/                              # Core fundamental processes
│   └── build-and-test.js             # Simple build and test
├── roles/                             # Role-specific processes
│   ├── development/                   # (empty, ready for processes)
│   ├── qa/                           # (empty, ready for processes)
│   ├── devops/                       # (empty, ready for processes)
│   └── architect/                    # (empty, ready for processes)
└── methodologies/                     # Methodology-specific processes
    ├── plan-and-execute.js           # Plan then execute workflow
    ├── ralph.js                      # Iterative loop until DONE
    └── devin.js                      # Plan → Code → Debug → Deploy
```

---

## Processes Implemented

### 1. Core: Build and Test

**File:** `.a5c/processes/core/build-and-test.js`

**Description:** Simple build and test workflow with quality gates

**Pattern:** Sequential execution with quality gate

```javascript
Build → Test → Coverage Check → [Breakpoint if below threshold] → Result
```

**Features:**
- Configurable build and test commands
- Coverage threshold checking
- Breakpoint for approval if coverage below threshold
- Clean success/failure reporting

**Inputs:**
```json
{
  "buildCommand": "npm run build",
  "testCommand": "npm test",
  "minCoverage": 80
}
```

**Usage:**
```bash
$CLI run:create \
  --process-id core/build-and-test \
  --entry .a5c/processes/core/build-and-test.js#process \
  --inputs inputs.json
```

---

### 2. Methodology: Plan-and-Execute

**File:** `.a5c/processes/methodologies/plan-and-execute.js`

**Description:** Plan-and-execute methodology with agent planning and step-by-step execution

**Pattern:** Agent planning → Approval → Sequential execution

```javascript
Agent Planning → [Breakpoint: Review Plan]
  → For each step:
      Execute Step → Check Success → [Breakpoint if fail]
  → Verification
```

**Features:**
- Agent-based planning with structured prompt
- Step-by-step execution with progress tracking
- Approval gate before execution
- Error handling with breakpoints
- Execution summary

**Inputs:**
```json
{
  "task": "Implement user authentication",
  "approvalRequired": true,
  "context": {}
}
```

**Agent Planning Task:**
- Role: "senior project planner and technical lead"
- Generates: steps, complexity, risks, success criteria
- Output schema validated

**Phases:**
1. **Planning** - Agent generates detailed plan
2. **Execution** - Execute each step sequentially
3. **Verification** - Check all steps completed

---

### 3. Methodology: Ralph Loop

**File:** `.a5c/processes/methodologies/ralph.js`

**Description:** Simple iterative execution until DONE signal (Ralph Wiggum Loop)

**Pattern:** Iterative execution with DONE check

```javascript
Iteration 1: Execute → Check DONE → Continue if not done
Iteration 2: Execute → Check DONE → Continue if not done
...
Iteration N: Execute → Check DONE → Complete if done
```

**Features:**
- Simple persistent loop
- Continues until `{ done: true }` or `{ status: "DONE" }`
- Max iteration safety
- Optional per-iteration review
- Two variants: node-based and agent-based

**Inputs:**
```json
{
  "task": "Fix all linting errors",
  "maxIterations": 10,
  "reviewEachIteration": false
}
```

**How it works:**
1. Execute task
2. Check if result contains DONE signal
3. If not done, iterate again
4. Continue until DONE or max iterations

**Variants:**
- `executeTask` - Node script execution
- `agentExecuteTask` - Agent decides when done

**Named after:** Ralph Wiggum from The Simpsons - simple and persistent!

---

### 4. Methodology: Devin

**File:** `.a5c/processes/methodologies/devin.js`

**Description:** Autonomous software engineering workflow (Plan → Code → Debug → Deploy)

**Pattern:** Multi-phase autonomous development

```javascript
PLAN: Agent Planning → [Breakpoint: Review]
  ↓
CODE: Implementation
  ↓
DEBUG: While tests failing and iterations < max:
  Run Tests → Agent Analyze Failures → Apply Fixes
  ↓
QUALITY: Agent Scoring → [Breakpoint if below threshold]
  ↓
DEPLOY: [Breakpoint: Approve] → Deploy → Result
```

**Features:**
- 4-phase autonomous workflow
- Agent planning and debugging
- Iterative test-fix-retest loop
- Quality scoring before deployment
- Multiple approval gates
- Production deployment

**Inputs:**
```json
{
  "feature": "User authentication",
  "targetQuality": 85,
  "maxDebugIterations": 3,
  "requirements": ["..."],
  "constraints": ["..."],
  "environment": "production"
}
```

**Phases:**

**PHASE 1: PLAN**
- Agent generates implementation plan
- Identifies risks and test strategy
- Breakpoint: Review plan

**PHASE 2: CODE**
- Write implementation code
- Create/modify files

**PHASE 3: DEBUG**
- Iterative debugging loop:
  1. Run tests
  2. If tests fail:
     - Agent analyzes failures
     - Agent suggests fixes
     - Apply fixes
     - Repeat
  3. Continue until all tests pass or max iterations
- Quality scoring with agent

**PHASE 4: DEPLOY**
- Breakpoint: Final approval
- Deploy to environment
- Report results

**Agent Tasks:**
- Planning agent (generates plan)
- Debugging agent (analyzes failures)
- Quality scoring agent (0-100 score)

**Inspired by:** Devin AI autonomous software engineering

---

## Documentation Created

### `.a5c/processes/README.md`

Comprehensive documentation including:

**Content:**
1. Organization structure
2. Core processes documentation
3. Methodology processes documentation
4. Usage examples
5. Process creation guide
6. Process status table
7. Planned processes from Todo #11
8. Contributing guidelines
9. Related documentation links

**Sections:**
- 📁 Organization
- 🔧 Core Processes
- 🎯 Methodology Processes
- 👥 Role-Based Processes (planned)
- 📋 Process Status
- 🚀 Usage
- 🏗️ Creating New Processes
- 📚 Related Documentation
- 🤝 Contributing

**Guidelines for creating processes:**
- JSDoc comments with metadata
- Input validation and defaults
- Progress logging
- Breakpoints for critical steps
- Error handling
- Metadata in results
- Documentation in README

---

## Process Comparison

| Process | Category | Complexity | Phases | Agent Tasks | Key Feature |
|---------|----------|------------|--------|-------------|-------------|
| build-and-test | Core | Low | 3 | 0 | Coverage gate |
| plan-and-execute | Methodology | Medium | 3 | 1 | Agent planning |
| ralph | Methodology | Low | 1 (loop) | 0-1 | Iterative until DONE |
| devin | Methodology | High | 4 | 3 | Autonomous engineering |

---

## Patterns Demonstrated

### 1. Sequential Execution
**Example:** build-and-test
- Execute tasks in order
- Check results after each task
- Gate based on metrics

### 2. Agent-Based Planning
**Example:** plan-and-execute, devin
- Agent generates structured plan
- Human approval of plan
- Execute plan step-by-step

### 3. Iterative Loops
**Example:** ralph
- Loop until condition met
- Max iteration safety
- Progress tracking

### 4. Multi-Phase Workflows
**Example:** devin
- Multiple distinct phases
- Phase-specific tasks
- Gates between phases

### 5. Quality Convergence
**Example:** devin (debug phase)
- Iterative improvement
- Quality measurement
- Convergence condition

---

## Task Kind Usage

**Node tasks:**
- Build execution
- Test execution
- Code implementation
- Fix application
- Deployment

**Agent tasks:**
- Planning (generating execution plans)
- Debugging analysis (root cause analysis)
- Quality scoring (0-100 assessment)
- Decision making (is task done?)

**Breakpoints:**
- Plan review
- Quality gate approval
- Error handling decisions
- Final deployment approval

---

## Integration with Existing Work

### Connections

1. **TDD Quality Convergence** (.claude/skills/babysit/process/)
   - Advanced example showing all patterns
   - Can be used as reference
   - Packaged with skill

2. **Plugin Documentation**
   - Referenced in main README
   - Linked from specification
   - Usage examples provided

3. **SDK**
   - Uses `defineTask` from SDK
   - Follows SDK patterns
   - Compatible with CLI

### Cross-References

- Main README.md links to process library
- Process library README links back to plugin docs
- Specification mentions standard library
- Todo #11 tracks methodology implementations

---

## Remaining Work (Todo #11)

Still to implement:

- [ ] self-assessment.js
- [ ] state-machine-orchestration.js
- [ ] consensus-and-voting-mechanisms.js
- [ ] base44.js
- [ ] adversarial-spec-debates.js
- [ ] graph-of-thoughts.js
- [ ] evolutionary.js
- [ ] build-realtime-remediation.js
- [ ] agile.js
- [ ] top-down.js
- [ ] bottom-up.js

**Completed:**
- ✅ ralph.js
- ✅ plan-and-execute.js
- ✅ devin.js
- ✅ tdd.js (as tdd-quality-convergence.js)
- ✅ score-gated-iterative-convergence.js (integrated in tdd-quality-convergence.js)

---

## Usage Examples

### Using Core Process

```bash
CLI="npx -y @a5c-ai/babysitter-sdk@latest"

# Create run with build-and-test
$CLI run:create \
  --process-id core/build-and-test \
  --entry .a5c/processes/core/build-and-test.js#process \
  --inputs '{"minCoverage":90}'

# Run orchestration
$CLI run:continue .a5c/runs/<runId> --auto-node-tasks
```

### Using Methodology Process

```bash
# Plan and execute
$CLI run:create \
  --process-id methodologies/plan-and-execute \
  --entry .a5c/processes/methodologies/plan-and-execute.js#process \
  --inputs '{"task":"Add OAuth support"}'

# Ralph loop
$CLI run:create \
  --process-id methodologies/ralph \
  --entry .a5c/processes/methodologies/ralph.js#process \
  --inputs '{"task":"Fix type errors","maxIterations":5}'

# Devin workflow
$CLI run:create \
  --process-id methodologies/devin \
  --entry .a5c/processes/methodologies/devin.js#process \
  --inputs '{"feature":"Payment integration","targetQuality":90}'
```

### Via Claude Code

```
Use the babysitter skill with the plan-and-execute methodology
to implement user authentication.
```

```
Use babysitter with the ralph loop to fix all linting errors.
Maximum 5 iterations.
```

```
Use the devin process to implement a new API endpoint with
full testing and deployment.
```

---

## Files Created

1. `.a5c/processes/README.md` (400+ lines)
   - Comprehensive process library documentation
   - All process descriptions
   - Usage examples
   - Contributing guide

2. `.a5c/processes/core/build-and-test.js` (120 lines)
   - Simple build and test workflow
   - Coverage gate
   - 2 tasks (build, test)

3. `.a5c/processes/methodologies/plan-and-execute.js` (220 lines)
   - Agent planning
   - Step-by-step execution
   - 2 tasks (agent planner, execute step)

4. `.a5c/processes/methodologies/ralph.js` (240 lines)
   - Iterative loop
   - DONE signal checking
   - 2 task variants (node, agent)

5. `.a5c/processes/methodologies/devin.js` (370 lines)
   - 4-phase workflow
   - Iterative debugging
   - 7 tasks (planner, coder, tester, debugger, fixer, scorer, deployer)

6. `plugins/babysitter/STANDARD_PROCESS_LIBRARY_2026-01-20.md` (this file)
   - Implementation summary
   - Pattern documentation

---

## Key Achievements

✅ **Foundation established** - Directory structure and organization
✅ **Core workflows** - Build and test pattern
✅ **Planning patterns** - Agent-based planning
✅ **Iterative patterns** - Ralph loop for persistence
✅ **Complex workflows** - Devin multi-phase autonomous engineering
✅ **Documentation** - Comprehensive README with examples
✅ **Extensibility** - Clear patterns for adding more processes

---

## Next Steps

1. Implement remaining methodology processes from Todo #11
2. Add role-specific processes (development, QA, DevOps, architect)
3. Create example inputs for each process
4. Add process-specific documentation files
5. Test processes end-to-end
6. Add integration tests for process library

---

**END OF SUMMARY**
