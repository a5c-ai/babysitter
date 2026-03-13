# GSD Workflows - Implementation Summary

This document summarizes the GSD-adapted workflows created for the Babysitter SDK.

## Research Completed

### 1. Babysitter SDK Process Patterns
Analyzed existing process methodologies:
- **TDD Quality Convergence** (`tdd-quality-convergence.js`) - Iterative quality improvement with agent scoring
- **Devin Methodology** (`devin.js`) - Plan → Code → Debug → Deploy workflow
- **Ralph Loop** (`ralph.js`) - Simple persistent iteration until done
- **Plan-and-Execute** (`plan-and-execute.js`) - Detailed planning followed by step execution

### 2. Get Shit Done (GSD) Workflow Analysis
Key findings from https://github.com/glittercowboy/get-shit-done:

**Core Philosophy:**
- Systematic context engineering to prevent "context rot"
- Multi-agent orchestration with fresh contexts
- Atomic git commits for bisect-ability
- Quality gates at every phase

**Main Workflow:**
1. **Initialization** - Vision capture → Parallel research → Requirements → Roadmap
2. **Discussion** - Capture implementation preferences before planning
3. **Planning** - Research → Plan → Verify → Iterate until verified
4. **Execution** - Parallel waves with fresh contexts and atomic commits
5. **Verification** - UAT → Diagnosis → Fix → Re-verify

**Key Patterns:**
- 4 parallel research agents (stack, features, architecture, pitfalls)
- Plan verification loops until requirements satisfied
- XML-structured task plans with `<task><action><verify><done>`
- Fresh 200k context per executor
- Automated diagnosis of failures

## Created Workflows

### Core GSD Workflows

#### 1. `new-project.js` - Project Initialization
**Purpose:** Systematic project setup with vision, research, requirements, and roadmap

**Process Flow:**
1. **Vision Capture** - Agent-guided questioning to clarify vision
2. **Parallel Research** - 4 agents research stack, features, architecture, pitfalls
3. **Requirements Scoping** - v1 MVP and v2 enhancements separation
4. **Roadmap Creation** - Phased milestones with dependencies

**Outputs:** PROJECT.md, REQUIREMENTS.md, ROADMAP.md, research artifacts

**Key Features:**
- Breakpoints for vision and requirements approval
- Parallel research for efficiency
- Traceability from vision to requirements to roadmap

---

#### 2. `discuss-phase.js` - Phase Discussion
**Purpose:** Capture implementation preferences BEFORE planning to reduce back-and-forth

**Process Flow:**
1. **Identify Decision Points** - Analyze requirements for gray areas
2. **Capture Preferences** - Interactive preference gathering
3. **Generate Context** - Create {phase}-CONTEXT.md with guidelines

**Decision Categories:**
- Layout and UI patterns
- API patterns and conventions
- Content structure
- Organization (folders, naming)
- Technology choices
- Testing strategies

**Outputs:** {phase}-CONTEXT.md with decisions and rationale

---

#### 3. `plan-phase.js` - Phase Planning with Verification
**Purpose:** Create atomic task plans verified against requirements

**Process Flow:**
1. **Targeted Research** - Implementation approaches informed by context
2. **Iterative Planning Loop:**
   - Generate 2-3 atomic task plans
   - Verify plans satisfy requirements
   - If not verified, get feedback and iterate
   - Repeat until verified or max iterations

**Plan Structure:** XML format with:
- `<name>` - Task name
- `<files>` - Files to modify
- `<action>` - Detailed steps
- `<verify>` - Verification command
- `<done>` - Success criteria

**Outputs:** {phase}-PLAN.md, {phase}-RESEARCH.md

**Key Features:**
- Plan verification agent checks requirement coverage
- Feedback loop until quality gate passed
- Breakpoint for plan approval

---

#### 4. `execute-phase.js` - Parallel Execution
**Purpose:** Execute task plans with fresh contexts and atomic commits

**Process Flow:**
1. **Organize into Waves** - Group tasks by dependencies
2. **Execute Waves in Parallel:**
   - Each task gets fresh agent context
   - Execute task actions
   - Verify task completion
   - Create atomic git commit
3. **Phase Verification** - Final check against requirements

**Outputs:** Task summaries, git commits, {phase}-VERIFICATION.md

**Key Features:**
- Parallel execution where possible
- Atomic commits per task (git bisect-able)
- Fresh agent context prevents degradation
- Verification gates at task and phase level

---

#### 5. `verify-work.js` - UAT and Fix Loop
**Purpose:** User acceptance testing with automated diagnosis

**Process Flow:**
1. **Prepare Checklist** - Generate UAT testing steps
2. **User Acceptance Testing** - Human verification breakpoint
3. **Automated Diagnosis** - Agent identifies root causes
4. **Fix Planning** - Create fix plans for issues
5. **Execute Fixes** - Apply fixes with atomic commits
6. **Re-verification** - Confirm fixes resolved issues

**Outputs:** UAT checklist, diagnosis report, fix plans

**Key Features:**
- One-at-a-time UAT (GSD pattern)
- Automated issue diagnosis
- Fix plans similar to task plans
- Re-verification loop

---

#### 6. `audit-milestone.js` - Milestone Audit
**Purpose:** Comprehensive milestone review against definition-of-done

**Process Flow:**
1. **Audit Milestone** - Check all completion criteria
2. **Review Audit** - Breakpoint for approval

**Outputs:** {milestone}-AUDIT.md

---

#### 7. `map-codebase.js` - Brownfield Analysis
**Purpose:** Understand existing codebase before new work

**Process Flow:**
1. **Parallel Analysis:**
   - Structure analysis (directory tree, modules)
   - Pattern analysis (conventions, design patterns)
   - Dependency analysis (coupling, circular deps)
   - Tech stack analysis (languages, frameworks, versions)
2. **Integration Planning** - Recommend integration approach

**Outputs:** CODEBASE-MAP.md, integration plan

---

#### 8. `iterative-convergence.js` - Quality Convergence
**Purpose:** Iterative development with quality scoring

**Process Flow:**
1. **Convergence Loop:**
   - Implement feature (with feedback from previous iteration)
   - Run tests
   - Agent quality scoring (0-100)
   - Check if target quality reached
   - If not, iterate with feedback

**Outputs:** Iteration reports, quality scores

**Key Features:**
- Agent-based quality assessment
- Feedback loop until target quality
- Progress tracking

---

## Examples

Created example input files demonstrating usage:

### `new-project-example.json`
TaskMaster Pro - A task management application with AI prioritization

### `phase-example.json`
Authentication & Authorization phase with requirements

### `milestone-example.json`
MVP milestone with definition-of-done

### `convergence-example.json`
Real-time WebSocket updates feature

## Key Adaptations from Original GSD

### 1. **SDK Native**
- Uses Babysitter SDK primitives (`defineTask`, `ctx.task`, `ctx.breakpoint`, `ctx.parallel`)
- No custom orchestration layer needed
- Leverages SDK's journal and state management

### 2. **Task-Based Architecture**
- Processes composed of reusable task definitions
- Agent tasks for reasoning (planning, scoring, diagnosis)
- Node tasks for execution
- Shell tasks for commands

### 3. **Modular and Composable**
- Each workflow is independent
- Can be imported and composed into larger processes
- Reusable task definitions

### 4. **Quality Gates**
- Breakpoints at key decision points
- Verification loops (planning, execution, UAT)
- Agent-based quality scoring

### 5. **Fresh Context Pattern**
- Each agent task gets clean context
- Parallel execution prevents context mixing
- Feedback passed explicitly between iterations

## Usage Examples

### Initialize New Project
```bash
babysitter run:create \
  --process-id gsd/new-project \
  --entry gsd/new-project.js#process \
  --inputs gsd/examples/new-project-example.json
```

### Plan a Phase
```bash
babysitter run:create \
  --process-id gsd/plan-phase \
  --entry gsd/plan-phase.js#process \
  --inputs gsd/examples/phase-example.json
```

### Execute Phase
```bash
babysitter run:create \
  --process-id gsd/execute-phase \
  --entry gsd/execute-phase.js#process \
  --inputs phase-execution-inputs.json
```

### Complete Workflow Chain
Can be composed into a master process that runs:
1. Discuss phase
2. Plan phase (with verification)
3. Execute phase (with commits)
4. Verify work (UAT + fixes)

## File Structure

```
gsd/
├── README.md                    # Documentation
├── SUMMARY.md                   # This file
├── new-project.js              # Project initialization
├── discuss-phase.js            # Phase discussion
├── plan-phase.js               # Phase planning with verification
├── execute-phase.js            # Parallel execution with commits
├── verify-work.js              # UAT and automated diagnosis
├── audit-milestone.js          # Milestone completion audit
├── map-codebase.js             # Brownfield codebase analysis
├── iterative-convergence.js    # Quality convergence loop
└── examples/                   # Example input files
    ├── new-project-example.json
    ├── phase-example.json
    ├── milestone-example.json
    └── convergence-example.json
```

## Integration Points

These workflows integrate with:
- **Existing methodologies** in `process/methodologies/` (devin, ralph, plan-and-execute)
- **TDD Quality Convergence** process for quality gates
- **Babysitter SDK** orchestration primitives
- **Git** for atomic commits and bisect-ability

## Next Steps

To use these workflows:

1. **Review and test** each workflow with example inputs
2. **Customize** task definitions for specific project needs
3. **Extend** with additional specialized tasks
4. **Compose** workflows into project-specific processes
5. **Document** project-specific conventions and patterns

## Benefits

- **Systematic approach** prevents ad-hoc development
- **Quality gates** ensure requirements satisfaction
- **Fresh contexts** prevent AI degradation
- **Atomic commits** enable precise debugging
- **Parallel execution** maximizes efficiency
- **Verification loops** catch issues early
- **Modular design** enables reuse and composition
