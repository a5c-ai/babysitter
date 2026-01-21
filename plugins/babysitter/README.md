# Babysitter Plugin for Claude Code

> **Orchestrate complex, multi-step workflows with event-sourced state management, hook-based extensibility, and human-in-the-loop approval.**

The Babysitter plugin enables Claude Code to manage sophisticated development workflows through deterministic, resumable orchestration. Built on the `@a5c-ai/babysitter-sdk`, it provides event-sourced state management, native hooks, and composable process definitions.

---

## 🎯 What is Babysitter?

Babysitter orchestrates `.a5c/runs/<runId>/` directories through iterative execution:

- **Event-sourced state** - All changes recorded as immutable events in `journal.jsonl`
- **Resumable workflows** - Pause and resume at any point
- **Hook-driven architecture** - Extensible lifecycle hooks at every step
- **Human-in-the-loop** - Approval gates via breakpoints
- **Multi-task orchestration** - Node scripts, LLM agents, Claude skills, breakpoints, sleep gates
- **Parallel execution** - Run independent tasks concurrently

**Use cases:**
- TDD workflows with quality convergence
- Multi-phase build/test/deploy pipelines
- Code review with agent scoring
- Iterative refinement until quality targets met
- Complex planning → execution → verification workflows

---

## 🚀 Quick Start

### 1. Installation

#### Prerequisites

- **Claude Code CLI** installed and configured
- **Node.js** v18+ and npm (for SDK CLI)
- Git (for cloning plugin repositories)

#### Install the Plugin

**Option A: Via Claude Code Marketplace (Recommended)**

Install from the marketplace:

```bash
# Add the plugin repository to marketplace
/plugin marketplace add a5c-ai/babysitter

# Install the plugin
/plugin install babysitter@a5c.ai
```

Then:
1. Restart Claude Code if prompted
2. Verify installation with `/skills` - you should see "babysitter" in the list

**Option B: Manual Installation**

```bash
# Clone the plugin repository
git clone https://github.com/a5c-ai/babysitter.git ~/.claude/plugins/babysitter

# Or if you already have it in your project
cp -r plugins/babysitter ~/.claude/plugins/

# Verify installation
ls ~/.claude/plugins/babysitter/
```

**Option C: Project-Local Installation**

For project-specific plugin usage:

```bash
# Create plugin directory in your project
mkdir -p .claude/plugins

# Copy or clone the plugin
git clone https://github.com/a5c-ai/babysitter.git .claude/plugins/babysitter

# Claude Code will automatically detect plugins in .claude/plugins/
```

#### Install the SDK CLI

The Babysitter SDK CLI is used for orchestration:

```bash
# Install globally (recommended)
npm install -g @a5c-ai/babysitter-sdk

# Or use npx (no installation required)
npx -y @a5c-ai/babysitter-sdk --version

# Set up CLI alias for convenience
echo 'alias babysitter="npx -y @a5c-ai/babysitter-sdk"' >> ~/.bashrc
source ~/.bashrc
```

#### Verify Installation

```bash
# Verify plugin is loaded
# In Claude Code, type:
/skills

# You should see "babysitter" in the list

# Verify SDK CLI
npx -y @a5c-ai/babysitter-sdk --version

# Test the babysitter skill
# In Claude Code, ask:
# "Use the babysitter skill to show me the available commands"
```

#### Configuration (Optional)

**Claude Code Settings**

Configure plugin behavior in `.claude/settings.json` or `.claude/settings.local.json`:

```json
{
  "plugins": {
    "babysitter": {
      "enabled": true,
      "defaultRunsDir": ".a5c/runs",
      "autoNodeMaxTasks": 10
    }
  }
}
```

**Environment Variables**

```bash
# Default runs directory
export BABYSITTER_RUNS_DIR=".a5c/runs"

# Enable verbose logging
export BABYSITTER_LOG_LEVEL="debug"

# Allow secret logs (use with caution)
export BABYSITTER_ALLOW_SECRET_LOGS="false"
```

**Hook Configuration**

Enable custom hooks by creating hook directories:

```bash
# Per-project hooks
mkdir -p .a5c/hooks/on-run-start
mkdir -p .a5c/hooks/on-breakpoint

# Per-user hooks
mkdir -p ~/.config/babysitter/hooks/on-run-start
mkdir -p ~/.config/babysitter/hooks/on-breakpoint
```

### 2. Create Your First Run

```bash
# Create a run with example process
$CLI run:create \
  --process-id babysitter/tdd-quality-convergence \
  --entry .claude/skills/babysit/process/tdd-quality-convergence.js#process \
  --inputs .claude/skills/babysit/process/examples/tdd-quality-convergence-example.json
```

### 3. Drive Orchestration

```bash
# Run a single iteration (repeat in a loop)
$CLI run:iterate .a5c/runs/<runId> --json --iteration 1
```

### 4. Use with Claude Code

**Via Skills (Recommended)**

Just ask Claude to use the babysitter skill:

```
Use the babysitter skill to implement user authentication with TDD,
targeting 90% quality score with iterative refinement.
```

Claude will:
1. Analyze your request
2. Create a process definition
3. Request approval via breakpoint
4. Orchestrate execution step-by-step
5. Handle quality convergence automatically

**Via Commands**

Use Claude Code commands for specific actions:

```bash
# Create a new babysitter run
/babysitter:babysit "Implement user authentication"

# Resume an existing run
/babysitter:babysit resume run-20260120-auth
```

**Check Available Skills**

```bash
# List all loaded skills
/skills

# Should show:
# - babysitter
# - babysitter-breakpoint (deprecated, now integrated)
# - babysitter-score
```

**Example Prompts**

- "Use babysitter to implement feature X with TDD and quality gates"
- "Create a babysitter run for a multi-phase deployment pipeline"
- "Resume babysitter run run-20260120-xyz and continue execution"
- "Use babysitter to set up an iterative code review workflow"

---

## 📚 Core Concepts

### Runs

A **run** is a directory under `.a5c/runs/<runId>/` containing:

```
.a5c/runs/<runId>/
├── run.json           # Run metadata
├── inputs.json        # Process inputs
├── journal.jsonl      # Event log (append-only)
├── state.json         # Current state cache
├── code/              # Process implementation
│   └── main.js        # Process entry point
├── tasks/             # Task execution artifacts
│   └── <effectId>/
│       ├── input.json
│       ├── result.json
│       ├── stdout.log
│       └── stderr.log
└── artifacts/         # Human-readable outputs
    └── *.md
```

### Processes

A **process** is a JavaScript function that orchestrates tasks:

```javascript
export async function process(inputs, ctx) {
  // Phase 1: Build
  const buildResult = await ctx.task(buildTask, { command: 'npm run build' });

  // Phase 2: Test (with parallel checks)
  const [testResult, lintResult] = await ctx.parallel.all([
    () => ctx.task(testTask, { command: 'npm test' }),
    () => ctx.task(lintTask, { command: 'npm run lint' })
  ]);

  // Phase 3: Approve
  await ctx.breakpoint({
    question: 'Build and tests passed. Deploy to production?',
    context: { runId: ctx.runId }
  });

  return { success: true, buildResult, testResult, lintResult };
}
```

### Tasks

**Tasks** are the atomic units of work. Types:

| Kind | Description | Example |
|------|-------------|---------|
| `node` | Node.js script | Run tests, build code |
| `agent` | LLM agent | Planning, scoring, review |
| `skill` | Claude Code skill | Code analysis, refactoring |
| `breakpoint` | Human approval | Review and approve |
| `sleep` | Time gate | Wait until specific time |

**Task definition:**

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

export const buildTask = defineTask('build', (args, taskCtx) => ({
  kind: 'node',
  title: 'Build project',
  node: {
    entry: './scripts/build.js',
    args: ['--output', 'dist/']
  },
  io: {
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

### Hooks

**Hooks** are shell scripts that execute at lifecycle events:

```bash
# plugins/babysitter/hooks/on-run-start/notify.sh
#!/bin/bash
PAYLOAD=$(cat)  # Read JSON payload from stdin

RUN_ID=$(echo "$PAYLOAD" | jq -r '.runId')
echo "🚀 Run started: $RUN_ID"

# Send notification, update dashboard, etc.
```

**Hook types:**
- `on-run-start` - Run begins
- `on-run-complete` - Run succeeds
- `on-run-fail` - Run fails
- `on-task-start` - Task begins
- `on-breakpoint` - Breakpoint reached
- Custom hooks via `ctx.hook()`

**Hook search order:**
1. Per-repo: `.a5c/hooks/<hook-name>/*.sh`
2. Per-user: `~/.config/babysitter/hooks/<hook-name>/*.sh`
3. Plugin: `plugins/babysitter/hooks/<hook-name>/*.sh`

---

## 🏗️ Directory Structure

```
plugins/babysitter/
├── README.md                          # This file
├── BABYSITTER_PLUGIN_SPECIFICATION.md # Complete specification
├── HOOKS.md                           # Hook system guide
├── todos.md                           # Development roadmap
│
├── commands/                          # Claude Code commands
│   ├── babysitter-run.md
│   ├── babysitter-resume.md
│   └── setup-babysitter-run-resume.sh
│
├── hooks/                             # Plugin hooks
│   ├── hook-dispatcher.sh             # Main dispatcher
│   ├── on-breakpoint-dispatcher.sh    # Breakpoint hooks
│   ├── on-run-start/
│   ├── on-run-complete/
│   ├── on-run-fail/
│   ├── on-task-start/
│   └── on-breakpoint/
│       └── breakpoint-cli.sh          # Default breakpoint handler
│
└── skills/                            # Claude Code skills
    └── babysitter/
        ├── SKILL.md                   # Main orchestration skill
        ├── reference/
        │   └── ADVANCED_PATTERNS.md   # Advanced patterns guide
        └── process/                   # Packaged processes
            ├── tdd-quality-convergence.js
            ├── tdd-quality-convergence.md
            └── examples/
                └── *.json
```

---

## 💡 Usage Examples

### Example 1: Simple Build and Test

```javascript
export async function process(inputs, ctx) {
  const buildResult = await ctx.task(buildTask, {
    command: 'npm run build'
  });

  if (!buildResult.success) {
    throw new Error('Build failed');
  }

  const testResult = await ctx.task(testTask, {
    command: 'npm test'
  });

  return { success: testResult.success };
}
```

### Example 2: Agent-Based Quality Scoring

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

export const agentScoringTask = defineTask('agent-scorer', (args, taskCtx) => ({
  kind: 'agent',

  agent: {
    name: 'quality-scorer',
    prompt: {
      role: 'senior QA engineer',
      task: 'Analyze test results and provide quality score 0-100',
      context: {
        testResults: args.testResults,
        coverage: args.coverage
      },
      instructions: [
        'Review test pass rate',
        'Assess code coverage',
        'Calculate overall score',
        'Provide recommendations'
      ],
      outputFormat: 'JSON with score, analysis, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'analysis'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        analysis: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export async function process(inputs, ctx) {
  const testResult = await ctx.task(testTask, {});

  const qualityScore = await ctx.task(agentScoringTask, {
    testResults: testResult,
    coverage: testResult.coverage
  });

  ctx.log(`Quality score: ${qualityScore.score}/100`);

  return { score: qualityScore.score };
}
```

### Example 3: Parallel Execution

```javascript
export async function process(inputs, ctx) {
  // Run quality checks in parallel
  const [coverage, lint, typeCheck, security] = await ctx.parallel.all([
    () => ctx.task(coverageTask, {}),
    () => ctx.task(lintTask, {}),
    () => ctx.task(typeCheckTask, {}),
    () => ctx.task(securityTask, {})
  ]);

  return { coverage, lint, typeCheck, security };
}
```

### Example 4: Iterative Convergence

```javascript
export async function process(inputs, ctx) {
  const targetQuality = inputs.targetQuality || 85;
  const maxIterations = inputs.maxIterations || 5;
  let iteration = 0;
  let currentQuality = 0;

  while (iteration < maxIterations && currentQuality < targetQuality) {
    iteration++;

    // Implement and test
    const impl = await ctx.task(implementTask, { iteration });
    const test = await ctx.task(testTask, {});

    // Agent scores quality
    const score = await ctx.task(agentScoringTask, {
      implementation: impl,
      tests: test
    });

    currentQuality = score.overallScore;

    ctx.log(`Iteration ${iteration}: Quality ${currentQuality}/${targetQuality}`);

    if (currentQuality < targetQuality) {
      // Breakpoint for review
      await ctx.breakpoint({
        question: `Quality ${currentQuality}/${targetQuality}. Continue?`,
        context: { iteration, score }
      });
    }
  }

  return { converged: currentQuality >= targetQuality, iterations: iteration };
}
```

### Example 5: Skill Invocation

```javascript
export const skillTask = defineTask('analyzer', (args, taskCtx) => ({
  kind: 'skill',

  skill: {
    name: 'codebase-analyzer',
    context: {
      scope: args.scope,
      analysisType: 'consistency',
      criteria: ['Naming conventions', 'Error handling'],
      instructions: [
        'Scan specified paths',
        'Check consistency',
        'Analyze patterns',
        'Generate report'
      ]
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export async function process(inputs, ctx) {
  const analysis = await ctx.task(skillTask, { scope: 'src/' });
  return { analysis };
}
```

---

## 🎓 Core Workflow

Babysitter uses a **4-step iteration loop**:

### 1. Run Iteration

```bash
$CLI run:iterate .a5c/runs/<runId> --json --iteration <n>
```

**Output:**
```json
{
  "iteration": 1,
  "status": "executed|waiting|completed|failed|none",
  "action": "executed-tasks|waiting|none",
  "count": 3
}
```

**Status values:**
- `executed` - Tasks executed, continue looping
- `waiting` - Breakpoint/sleep, pause until released
- `completed` - Run finished successfully
- `failed` - Run failed with error
- `none` - No pending effects

### 2. Get Effects

```bash
$CLI task:list .a5c/runs/<runId> --pending --json
```

**Output:**
```json
{
  "tasks": [
    {
      "effectId": "effect-abc123",
      "kind": "node|agent|skill|breakpoint",
      "label": "auto",
      "status": "requested"
    }
  ]
}
```

### 3. Perform Effects

```bash
$CLI task:post .a5c/runs/<runId> <effectId> --status <ok|error> --json
```

**Output:**
```json
{
  "status": "ok|error",
  "committed": {
    "resultRef": "tasks/effect-abc123/result.json",
    "stdoutRef": "tasks/effect-abc123/stdout.log",
    "stderrRef": "tasks/effect-abc123/stderr.log"
  },
  "stdoutRef": "tasks/effect-abc123/stdout.log",
  "stderrRef": "tasks/effect-abc123/stderr.log",
  "resultRef": "tasks/effect-abc123/result.json"
}
```

### 4. Results Posted

After executing the effect externally (or inside a hook), `task:post`:
- Writes result to `tasks/<effectId>/result.json`
- Appends event to `journal.jsonl`
- Updates `state.json` cache

---

## 🔧 CLI Quick Reference

```bash
CLI="npx -y @a5c-ai/babysitter-sdk"

# Create run
$CLI run:create \
  --process-id <id> \
  --entry <path>#<export> \
  --inputs <path>

# Check status
$CLI run:status <runId> --json

# View events
$CLI run:events <runId> --limit 20 --reverse

# Iterate once
$CLI run:iterate <runId> --json --iteration 1

# List tasks
$CLI task:list <runId> --pending --json

# Post task result
$CLI task:post <runId> <effectId> --status <ok|error> --json
```

---

## 🚦 Advanced Features

### Agent Tasks

Use LLMs for planning, scoring, and review:

```javascript
{
  kind: 'agent',
  agent: {
    name: 'feature-planner',
    prompt: {
      role: 'senior architect',
      task: 'Generate implementation plan',
      context: { feature: '...' },
      instructions: ['Analyze', 'Plan', 'Recommend'],
      outputFormat: 'JSON with approach, steps, risks'
    },
    outputSchema: { /* JSON schema */ }
  },
  io: { /* ... */ }
}
```

### Skill Tasks

Invoke Claude Code skills as tasks:

```javascript
{
  kind: 'skill',
  skill: {
    name: 'codebase-analyzer',
    context: {
      scope: 'src/',
      instructions: ['Scan', 'Analyze', 'Report']
    }
  },
  io: { /* ... */ }
}
```

### Breakpoints

Request human approval:

```javascript
await ctx.breakpoint({
  question: 'Approve deployment to production?',
  title: 'Production Deployment',
  context: {
    runId: ctx.runId,
    files: [
      { path: 'artifacts/deploy-plan.md', format: 'markdown' }
    ]
  }
});
```

### Custom Hooks

Add custom lifecycle hooks:

```javascript
// In process
await ctx.hook('pre-commit', {
  files: ['src/feature.ts'],
  message: 'feat: add new feature'
});
```

```bash
# .a5c/hooks/pre-commit/lint-check.sh
#!/bin/bash
PAYLOAD=$(cat)
FILES=$(echo "$PAYLOAD" | jq -r '.files[]')

# Run linter on changed files
npx eslint $FILES
```

### Parallel Execution

Run independent tasks concurrently:

```javascript
const results = await ctx.parallel.all([
  () => ctx.task(task1, { ... }),
  () => ctx.task(task2, { ... }),
  () => ctx.task(task3, { ... })
]);
```

### Quality Convergence

Iterate until quality target met:

```javascript
let quality = 0;
while (quality < targetQuality && iteration < maxIterations) {
  // Implement, test, score
  const score = await ctx.task(agentScoringTask, { ... });
  quality = score.overallScore;
  iteration++;
}
```

---

## 📖 Documentation

### Core Documentation

- **[BABYSITTER_PLUGIN_SPECIFICATION.md](./BABYSITTER_PLUGIN_SPECIFICATION.md)** - Complete specification (architecture, components, API)
- **[HOOKS.md](./HOOKS.md)** - Hook system guide (types, development, examples)
- **[skills/babysit/SKILL.md](./skills/babysit/SKILL.md)** - Main orchestration skill instructions
- **[skills/babysit/reference/ADVANCED_PATTERNS.md](./skills/babysit/reference/ADVANCED_PATTERNS.md)** - Advanced patterns (agents, skills, convergence)

### Process Documentation

- **[tdd-quality-convergence.md](./.claude/skills/babysit/process/tdd-quality-convergence.md)** - Comprehensive TDD example with agent scoring
- **[PACKAGING_PROCESSES_WITH_SKILLS.md](./PACKAGING_PROCESSES_WITH_SKILLS.md)** - How to package processes with skills

### SDK Documentation

- **[packages/sdk/sdk.md](../../packages/sdk/sdk.md)** - Babysitter SDK API reference

---

## 🎯 Example Processes

### TDD Quality Convergence

**Location:** `.claude/skills/babysit/process/tdd-quality-convergence.js`

Demonstrates:
- Agent-based planning
- TDD red-green-refactor cycle
- Quality convergence with iterative feedback
- Parallel quality checks
- Human-in-the-loop breakpoints
- Agent-based quality scoring
- Final review and approval

**Usage:**
```bash
$CLI run:create \
  --process-id babysitter/tdd-quality-convergence \
  --entry .claude/skills/babysit/process/tdd-quality-convergence.js#process \
  --inputs .claude/skills/babysit/process/examples/tdd-quality-convergence-example.json
```

---

## 🔍 Troubleshooting

### CLI not found

```bash
# Install globally (optional)
npm install -g @a5c-ai/babysitter-sdk

# Or use npx
npx -y @a5c-ai/babysitter-sdk --version
```

### Run stuck in "waiting"

Check for breakpoints:

```bash
$CLI run:status .a5c/runs/<runId>
# Look for "Awaiting input" or breakpoint in pending tasks
```

Release breakpoint via hooks or CLI (depending on setup).

### Journal corruption

```bash
# Verify journal integrity
$CLI run:events .a5c/runs/<runId> --json

# If corrupted, restore from backup or rebuild state
```

### Task fails silently

Check task logs:

```bash
# View task stdout/stderr
cat .a5c/runs/<runId>/tasks/<effectId>/stdout.log
cat .a5c/runs/<runId>/tasks/<effectId>/stderr.log

# View task with verbose output
$CLI task:show .a5c/runs/<runId> <effectId> --json
```

### Hook not executing

Verify hook permissions and search order:

```bash
# Make hook executable
chmod +x .a5c/hooks/on-run-start/my-hook.sh

# Test hook manually
echo '{"runId":"test"}' | .a5c/hooks/on-run-start/my-hook.sh
```

### Need alternate runs directory

```bash
# Specify custom runs directory
$CLI run:create --runs-dir /path/to/runs ...
$CLI run:status /path/to/runs/<runId>
```

---

## 🤝 Contributing

### Adding Custom Hooks

1. Create hook script in `.a5c/hooks/<hook-name>/`
2. Make it executable: `chmod +x <script>.sh`
3. Read JSON payload from stdin
4. Exit 0 for success, non-zero for failure

### Creating Processes

1. Create process file: `.a5c/processes/<category>/<name>.js`
2. Export `process` function
3. Define tasks with `defineTask`
4. Test with `run:create`

### Packaging Processes with Skills

1. Create process in `.claude/skills/<skill-name>/process/`
2. Add documentation: `<process-name>.md`
3. Add example inputs: `examples/<process-name>-example.json`
4. Reference in skill's `SKILL.md`

See [PACKAGING_PROCESSES_WITH_SKILLS.md](./PACKAGING_PROCESSES_WITH_SKILLS.md) for details.

---

## 📋 Key Features Summary

✅ **Event-sourced orchestration** - Deterministic, reproducible workflows
✅ **Resumable execution** - Pause and resume at any point
✅ **Hook-driven extensibility** - Customize behavior at every lifecycle event
✅ **Human-in-the-loop** - Breakpoints for approval and review
✅ **Multi-task types** - Node scripts, LLM agents, Claude skills, breakpoints, sleep gates
✅ **Parallel execution** - Run independent tasks concurrently
✅ **Quality convergence** - Iterate until quality targets met
✅ **Agent-based scoring** - LLM assessment of quality and progress
✅ **CLI-driven** - Complete control via `@a5c-ai/babysitter-sdk` CLI
✅ **Skill integration** - Package processes with Claude Code skills

---

## 📝 License

See main project LICENSE.

---

## 🔗 Quick Links

- [Plugin Specification](./BABYSITTER_PLUGIN_SPECIFICATION.md)
- [Hooks Guide](./HOOKS.md)
- [Advanced Patterns](./skills/babysit/reference/ADVANCED_PATTERNS.md)
- [SDK API Reference](../../packages/sdk/sdk.md)
- [TDD Example Process](./.claude/skills/babysit/process/tdd-quality-convergence.js)
- [Process Packaging Guide](./PACKAGING_PROCESSES_WITH_SKILLS.md)

---

**Get started:** Ask Claude to "use the babysitter skill" for your next complex workflow!
