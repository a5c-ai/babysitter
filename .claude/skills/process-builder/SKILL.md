---
name: process-builder
description: Scaffold new babysitter process definitions following SDK patterns, proper structure, and best practices. Guides the 3-phase workflow from research to implementation.
---

# Process Builder

Create new process definitions for the babysitter event-sourced orchestration framework.

## Quick Reference

```
Processes live in: library/
├── methodologies/          # Reusable development approaches (TDD, BDD, Scrum, etc.)
│   └── [name]/
│       ├── README.md       # Documentation
│       ├── [name].js       # Main process
│       └── examples/       # Sample inputs
│
└── specializations/        # Domain-specific processes
    ├── [category]/         # Engineering specializations (direct children)
    │   └── [process].js
    └── domains/
        └── [domain]/       # Business, Science, Social Sciences
            └── [spec]/
                ├── README.md
                ├── references.md
                ├── processes-backlog.md
                └── [process].js
```

## 3-Phase Workflow

### Phase 1: Research & Documentation

Create foundational documentation:

```bash
# Check existing specializations
ls library/specializations/

# Check methodologies
ls library/methodologies/
```

**Create:**
- `README.md` - Overview, roles, goals, use cases, common flows
- `references.md` - External references, best practices, links to sources

### Phase 2: Identify Processes

Create `processes-backlog.md` with identified processes:

```markdown
# Processes Backlog - [Specialization Name]

## Identified Processes

- [ ] **process-name** - Short description of what this process accomplishes
  - Reference: [Link to methodology or standard]
  - Inputs: list key inputs
  - Outputs: list key outputs

- [ ] **another-process** - Description
  ...
```

### Phase 3: Create Process Files

Create `.js` process files following SDK patterns (see below).

---

## Process File Structure

Every process file follows this pattern:

```javascript
/**
 * @process [category]/[process-name]
 * @description Clear description of what the process accomplishes end-to-end
 * @inputs { inputName: type, optionalInput?: type }
 * @outputs { success: boolean, outputName: type, artifacts: array }
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:your-skill-area]
 *   topics: [topic:your-topic]
 *   roles: [role:your-role]
 *   workflows: [workflow:your-workflow]
 *
 * @example
 * const result = await orchestrate('[category]/[process-name]', {
 *   inputName: 'value',
 *   optionalInput: 'optional-value'
 * });
 *
 * @references
 * - Book: "Relevant Book Title" by Author
 * - Article: [Title](https://link)
 * - Standard: ISO/IEEE reference
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * [Process Name] Process
 *
 * Methodology: Brief description of the approach
 *
 * Phases:
 * 1. Phase Name - What happens
 * 2. Phase Name - What happens
 * ...
 *
 * Benefits:
 * - Benefit 1
 * - Benefit 2
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.inputName - Description of input
 * @param {Object} ctx - Process context (see SDK)
 * @returns {Promise<Object>} Process result
 */
export async function process(inputs, ctx) {
  const {
    inputName,
    optionalInput = 'default-value',
    // ... destructure with defaults
  } = inputs;

  const artifacts = [];

  // ============================================================================
  // PHASE 1: [PHASE NAME]
  // ============================================================================

  ctx.log?.('info', 'Starting Phase 1...');

  const phase1Result = await ctx.task(someTask, {
    // task inputs
  });

  artifacts.push(...(phase1Result.artifacts || []));

  // Breakpoint for human review (when needed)
  await ctx.breakpoint({
    question: 'Review the results and approve to continue?',
    title: 'Phase 1 Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/output.md', format: 'markdown', label: 'Output' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: [PHASE NAME] - Parallel Execution Example
  // ============================================================================

  const [result1, result2, result3] = await ctx.parallel.all([
    () => ctx.task(task1, { /* args */ }),
    () => ctx.task(task2, { /* args */ }),
    () => ctx.task(task3, { /* args */ })
  ]);

  // ============================================================================
  // PHASE 3: [ITERATION EXAMPLE]
  // ============================================================================

  let iteration = 0;
  let targetMet = false;

  while (!targetMet && iteration < maxIterations) {
    iteration++;

    const iterResult = await ctx.task(iterativeTask, {
      iteration,
      previousResults: /* ... */
    });

    targetMet = iterResult.meetsTarget;

    if (!targetMet && iteration % 3 === 0) {
      // Periodic checkpoint
      await ctx.breakpoint({
        question: `Iteration ${iteration}: Target not met. Continue?`,
        title: 'Progress Checkpoint',
        context: { /* ... */ }
      });
    }
  }

  // ============================================================================
  // COMPLETION
  // ============================================================================

  return {
    success: targetMet,
    iterations: iteration,
    artifacts,
    // ... other outputs matching @outputs
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Task: [Task Name]
 * Purpose: What this task accomplishes
 */
const someTask = defineTask({
  name: 'task-name',
  description: 'What this task does',

  // Task definition - executed externally by orchestrator
  // This returns a TaskDef that describes HOW to run the task

  inputs: {
    inputName: { type: 'string', required: true },
    optionalInput: { type: 'number', default: 10 }
  },

  outputs: {
    result: { type: 'object' },
    artifacts: { type: 'array' }
  },

  async run(inputs, taskCtx) {
    const effectId = taskCtx.effectId;

    return {
      kind: 'node',  // or 'agent', 'skill', 'shell', 'breakpoint'
      title: `Task: ${inputs.inputName}`,
      node: {
        entry: 'scripts/task-runner.js',
        args: ['--input', inputs.inputName, '--effect-id', effectId]
      },
      io: {
        inputJsonPath: `tasks/${effectId}/input.json`,
        outputJsonPath: `tasks/${effectId}/result.json`
      },
      labels: ['category', 'subcategory']
    };
  }
});
```

---

## SDK Context API Reference

The `ctx` object provides these intrinsics:

| Method | Purpose | Behavior |
|--------|---------|----------|
| `ctx.task(taskDef, args, opts?)` | Execute a task | Returns result or throws typed exception |
| `ctx.breakpoint(payload)` | Human approval gate | Pauses until approved via human |
| `ctx.sleepUntil(isoOrEpochMs)` | Time-based gate | Pauses until specified time |
| `ctx.parallel.all([...thunks])` | Parallel execution | Runs independent tasks concurrently |
| `ctx.parallel.map(items, fn)` | Parallel map | Maps items through task function |
| `ctx.now()` | Deterministic time | Returns current Date (or provided time) |
| `ctx.log?.(level, msg, data?)` | Logging | Optional logging helper |
| `ctx.runId` | Run identifier | Current run's unique ID |

### Task Kinds

| Kind | Use Case | Executor |
|------|----------|----------|
| `node` | Scripts, builds, tests | Node.js process |
| `agent` | LLM-powered analysis, generation | Claude Code agent |
| `skill` | Claude Code skills | Skill invocation |
| `shell` | System commands | Shell execution |
| `breakpoint` | Human approval | Breakpoints UI/service |
| `sleep` | Time gates | Orchestrator scheduling |
| `orchestrator_task` | Internal orchestrator work | Self-routed |

---

## Breakpoint Patterns

### Basic Approval Gate

```javascript
await ctx.breakpoint({
  question: 'Approve to continue?',
  title: 'Checkpoint',
  context: { runId: ctx.runId }
});
```

### With File References (for UI display)

```javascript
await ctx.breakpoint({
  question: 'Review the generated specification. Does it meet requirements?',
  title: 'Specification Review',
  context: {
    runId: ctx.runId,
    files: [
      { path: 'artifacts/spec.md', format: 'markdown', label: 'Specification' },
      { path: 'artifacts/spec.json', format: 'json', label: 'JSON Schema' },
      { path: 'src/implementation.ts', format: 'code', language: 'typescript', label: 'Implementation' }
    ]
  }
});
```

### Conditional Breakpoint

```javascript
if (qualityScore < targetScore) {
  await ctx.breakpoint({
    question: `Quality score ${qualityScore} is below target ${targetScore}. Continue iterating or accept current result?`,
    title: 'Quality Gate',
    context: {
      runId: ctx.runId,
      data: { qualityScore, targetScore, iteration }
    }
  });
}
```

---

## Common Patterns

### Quality Convergence Loop

```javascript
let quality = 0;
let iteration = 0;
const targetQuality = inputs.targetQuality || 85;
const maxIterations = inputs.maxIterations || 10;

while (quality < targetQuality && iteration < maxIterations) {
  iteration++;
  ctx.log?.('info', `Iteration ${iteration}/${maxIterations}`);

  // Execute improvement tasks
  const improvement = await ctx.task(improveTask, { iteration });

  // Score quality (parallel checks)
  const [coverage, lint, security, tests] = await ctx.parallel.all([
    () => ctx.task(coverageTask, {}),
    () => ctx.task(lintTask, {}),
    () => ctx.task(securityTask, {}),
    () => ctx.task(runTestsTask, {})
  ]);

  // Agent scores overall quality
  const score = await ctx.task(agentScoringTask, {
    coverage, lint, security, tests, iteration
  });

  quality = score.overall;
  ctx.log?.('info', `Quality: ${quality}/${targetQuality}`);

  if (quality >= targetQuality) {
    ctx.log?.('info', 'Quality target achieved!');
    break;
  }
}

return {
  success: quality >= targetQuality,
  quality,
  iterations: iteration
};
```

### Phased Workflow with Reviews

```javascript
// Phase 1: Research
const research = await ctx.task(researchTask, { topic: inputs.topic });

await ctx.breakpoint({
  question: 'Review research findings before proceeding to planning.',
  title: 'Research Review',
  context: { runId: ctx.runId }
});

// Phase 2: Planning
const plan = await ctx.task(planningTask, { research });

await ctx.breakpoint({
  question: 'Review plan before implementation.',
  title: 'Plan Review',
  context: { runId: ctx.runId }
});

// Phase 3: Implementation
const implementation = await ctx.task(implementTask, { plan });

// Phase 4: Verification
const verification = await ctx.task(verifyTask, { implementation, plan });

await ctx.breakpoint({
  question: 'Final review before completion.',
  title: 'Final Approval',
  context: { runId: ctx.runId }
});

return { success: verification.passed, plan, implementation };
```

### Parallel Fan-out with Aggregation

```javascript
// Fan out to multiple parallel analyses
const analyses = await ctx.parallel.map(components, component =>
  ctx.task(analyzeTask, { component }, { label: `analyze:${component.name}` })
);

// Aggregate results
const aggregated = await ctx.task(aggregateTask, { analyses });

return { analyses, summary: aggregated.summary };
```

---

## Testing Processes

### CLI Commands

```bash
# Create a new run
babysitter run:create \
  --process-id methodologies/my-process \
  --entry ./library/methodologies/my-process.js#process \
  --inputs ./test-inputs.json \
  --json

# Iterate the run
babysitter run:iterate .a5c/runs/<runId> --json

# List pending tasks
babysitter task:list .a5c/runs/<runId> --pending --json

# Post a task result
babysitter task:post .a5c/runs/<runId> <effectId> \
  --status ok \
  --value ./result.json

# Check run status
babysitter run:status .a5c/runs/<runId>

# View events
babysitter run:events .a5c/runs/<runId> --limit 20 --reverse
```

### Sample Test Input File

```json
{
  "feature": "User authentication with JWT",
  "acceptanceCriteria": [
    "Users can register with email and password",
    "Users can login and receive a JWT token",
    "Invalid credentials are rejected"
  ],
  "testFramework": "jest",
  "targetQuality": 85,
  "maxIterations": 5
}
```

---

## Process Builder Workflow

### 1. Gather Requirements

Ask the user:

| Question | Purpose |
|----------|---------|
| **Domain/Category** | Determines directory location |
| **Process Name** | kebab-case identifier |
| **Goal** | What should the process accomplish? |
| **Inputs** | What data does the process need? |
| **Outputs** | What artifacts/results does it produce? |
| **Phases** | What are the major steps? |
| **Quality Gates** | Where should humans review? |
| **Iteration Strategy** | Fixed phases vs. convergence loop? |

### 2. Research Similar Processes

```bash
# Find similar processes
ls library/methodologies/
ls library/specializations/

# Read similar process for patterns
cat library/methodologies/atdd-tdd/atdd-tdd.js | head -200

# Check methodology README structure
cat library/methodologies/atdd-tdd/README.md
```

### 3. Check Methodologies Backlog

```bash
cat library/methodologies/backlog.md
```

### 4. Create the Process

**For Methodologies:**
1. Create `methodologies/[name]/README.md` (comprehensive documentation)
2. Create `methodologies/[name]/[name].js` (process implementation)
3. Create `methodologies/[name]/examples/` (sample inputs)

**For Specializations:**
1. If domain-specific: `specializations/domains/[domain]/[spec]/`
2. If engineering: `specializations/[category]/[process].js`
3. Create README.md, references.md, processes-backlog.md first
4. Then create individual process.js files

### 5. Validate Structure

Checklist:
- [ ] JSDoc header with @process, @description, @inputs, @outputs, @example, @references
- [ ] `@graph` block with relevant atlas node IDs (at minimum one domain)
- [ ] Import from `@a5c-ai/babysitter-sdk`
- [ ] Main `export async function process(inputs, ctx)`
- [ ] Input destructuring with defaults
- [ ] Clear phase comments (`// === PHASE N: NAME ===`)
- [ ] Logging via `ctx.log?.('info', message)`
- [ ] Tasks via `ctx.task(taskDef, inputs)`
- [ ] Breakpoints at key decision points
- [ ] Artifact collection throughout
- [ ] Return object matches @outputs schema

---

## Examples by Type

### Methodology Process (atdd-tdd style)

```javascript
/**
 * @process methodologies/my-methodology
 * @description My development methodology with quality convergence
 * @inputs { feature: string, targetQuality?: number }
 * @outputs { success: boolean, quality: number, artifacts: array }
 */
export async function process(inputs, ctx) {
  const { feature, targetQuality = 85 } = inputs;
  // ... implementation
}
```

### Specialization Process (game-development style)

```javascript
/**
 * @process specializations/game-development/core-mechanics-prototyping
 * @description Prototype and validate core gameplay mechanics through iteration
 * @inputs { prototypeName: string, mechanicsToTest: array, engine?: string }
 * @outputs { success: boolean, mechanicsValidated: array, playtestResults: object }
 */
export async function process(inputs, ctx) {
  const { prototypeName, mechanicsToTest, engine = 'Unity' } = inputs;
  // ... implementation
}
```

### Domain Process (science/research style)

```javascript
/**
 * @process specializations/domains/science/bioinformatics/sequence-analysis
 * @description Analyze genomic sequences using standard bioinformatics workflows
 * @inputs { sequences: array, analysisType: string, referenceGenome?: string }
 * @outputs { success: boolean, alignments: array, variants: array, report: object }
 */
export async function process(inputs, ctx) {
  const { sequences, analysisType, referenceGenome = 'GRCh38' } = inputs;
  // ... implementation
}
```

---

## Atlas Graph Metadata

Every generated process file MUST include a `@graph` JSDoc block in its file header comment alongside the standard `@process`, `@description`, `@inputs`, and `@outputs` tags.

### Format

```javascript
/**
 * @process specializations/my-domain/my-process
 * @description ...
 * @inputs { ... }
 * @outputs { ... }
 *
 * @graph
 *   domains: [domain:software-engineering, domain:devops]
 *   skillAreas: [skill-area:caching-strategies]
 *   topics: [topic:microservices, topic:event-sourcing]
 *   roles: [role:backend-engineer, role:sre]
 *   workflows: [workflow:code-review]
 */
```

### How to choose node IDs

Read the atlas graph domain directory (`packages/atlas/graph/domain/`) to find valid node IDs. The directory contains YAML files grouped by category:

- `domains/` — high-level domain nodes (e.g. `domain:software-engineering`, `domain:devops`, `domain:data-engineering`)
- `skill-areas/` — specific skill area nodes
- `topics/` — granular topic nodes
- `roles/` — role nodes (engineers, practitioners, researchers)
- `workflows/` — workflow nodes

Pick **2–4 edges** that genuinely relate to the process. Do not guess IDs — read the actual YAML files to find valid ones. At minimum, **every process must reference at least one `domain:` node**.

### Why this matters

This metadata connects the process to the atlas knowledge graph. A pre-build generator script parses the `@graph` block and creates graph nodes and edges for discoverability. Processes without this block will not appear in graph-based search results or recommendations.

---

## Resources

- **SDK Reference**: `library/reference/sdk.md`
- **Methodology Backlog**: `library/methodologies/backlog.md`
- **Specializations Backlog**: `library/specializations/backlog.md`
- **Example: ATDD/TDD**: `library/methodologies/atdd-tdd/`
- **Example: Spec-Driven**: `library/methodologies/spec-driven-development.js`
- **README**: Root `README.md` for full framework documentation
