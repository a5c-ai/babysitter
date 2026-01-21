---
name: babysitter
description: Orchestrate .a5c runs via @a5c-ai/babysitter-sdk CLI. Run iterations, get requested effects, perform effects, post results.
---

# babysitter

Orchestrate `.a5c/runs/<runId>/` through iterative execution. Use the SDK CLI to drive the orchestration loop.

make sure you have the latest version of the cli:

```bash
npm i -g @a5c-ai/babysitter @a5c-ai/babysitter-sdk @a5c-ai/babysitter-breakpoints
```

then use the CLI alias: CLI="babysitter"

**Alternatively, use the CLI alias:** `CLI="npx -y @a5c-ai/babysitter-sdk"`

---

## Core Iteration Workflow

The babysitter workflow has 4 steps:

1. **Run iteration** - Execute one orchestration step
2. **Get effects** - Check what tasks are requested
3. **Perform effects** - Execute the requested tasks
4. **Post results** - Tasks auto-record results to journal

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
  "reason": "auto-runnable-tasks|breakpoint-waiting|terminal-state",
  "count": 3,
  "metadata": { "runId": "...", "processId": "..." }
}
```

**Status values:**
- `"executed"` - Tasks executed, continue looping
- `"waiting"` - Breakpoint/sleep, pause until released
- `"completed"` - Run finished successfully
- `"failed"` - Run failed with error
- `"none"` - No pending effects

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

Run the effect externally (by you, your hook, or another worker). After execution, post the outcome into the run by calling `task:post`, which:
- Writes the committed result to `tasks/<effectId>/result.json`
- Appends an `EFFECT_RESOLVED` event to the journal
- Updates the state cache

if the effect is a breakpoint, you need to run the command:
```bash
npx @a5c-ai/babysitter-breakpoints breakpoint create --tag <tag> --question "<question>" --title "<title>" --run-id <runId> --file <file,format,language,label> --file <file,format,language,label> --file <file,format,language,label> ...
```

 to create the breakpoint and get the answer from the user

### 4. Results Posting


```bash
$CLI task:post .a5c/runs/<runId> <effectId> --status <ok|error> --json
```


Effects are executed **externally** (by you, your hook, or another worker). After execution, post the outcome into the run by calling `task:post`, which:
- Writes the committed result to `tasks/<effectId>/result.json`
- Appends an `EFFECT_RESOLVED` event to the journal
- Updates the state cache

---

### 5. repeat orchestration loop by calling run:iterate

## Task Kinds

| Kind | Description | Executor |
|------|-------------|----------|
| `node` | Node.js script | Local node process |
| `shell` | Shell script | Local shell process |
| `agent` | LLM agent | Agent runtime |
| `skill` | Claude Code skill | Skill system |
| `breakpoint` | Human approval | UI/CLI |
| `sleep` | Time gate | Scheduler |

### Agent Task Example

Important: Check which subagents and agents are actually available before assigning the name. if none, pass the generic agent name.

```javascript
export const agentTask = defineTask('agent-scorer', (args, taskCtx) => ({
  kind: 'agent',  // ← Use "agent" not "node"
  title: 'Agent scoring',
  agent: {
    name: 'quality-scorer',
    prompt: {
      role: 'QA engineer',
      task: 'Score results 0-100',
      context: { ...args },
      instructions: ['Review', 'Score', 'Recommend'],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['score']
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

### Skill Task Example

Important: Check which skills are actually available before assigning the name.

```javascript
export const skillTask = defineTask('analyzer-skill', (args, taskCtx) => ({
  kind: 'skill',  // ← Use "skill" not "node"
  title: 'Analyze codebase',

  skill: {
    name: 'codebase-analyzer',
    context: {
      scope: args.scope,
      depth: args.depth,
      analysisType: args.type,
      criteria: ['Code consistency', 'Naming conventions', 'Error handling'],
      instructions: [
        'Scan specified paths for code patterns',
        'Analyze consistency across the codebase',
        'Check naming conventions',
        'Review error handling patterns',
        'Generate structured analysis report'
      ]
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

---

## Packaged Processes

Skills and agents can package processes in `<skill-name>/process/`:

```
<skill-name>/
├── SKILL.md
└── process/
    ├── simple-build-and-test.js
    ├── build-test-with-agent-scoring.js
    ├── codebase-analysis-with-skill.js
    └── examples/
        └── *.json
```

**Usage:**
```bash
$CLI run:create \
  --process-id babysitter/build-test-with-agent-scoring \
  --entry <skill-dir>/process/build-test-with-agent-scoring.js#process \
  --inputs inputs.json
```

---

## Quick Commands Reference

**Create run:**
```bash
$CLI run:create --process-id <id> --entry <path>#<export> --inputs <path> --run-id <id>
```

**Check status:**
```bash
$CLI run:status <runId> --json
```

**View events:**
```bash
$CLI run:events <runId> --limit 20 --reverse
```

**List tasks:**
```bash
$CLI task:list <runId> --pending --json
```

**Post task result:**
```bash
$CLI task:post <runId> <effectId> --status <ok|error> --json
```

**Iterate:**
```bash
$CLI run:iterate <runId> --json --iteration <n>
```
---

## See Also
- `process/tdd-quality-convergence.js` - TDD quality convergence example - read this before creating the code for a run (create the run using the CLI, then use this process as a reference)
- `reference/ADVANCED_PATTERNS.md` - Agent/skill patterns, iterative convergence
- `packages/sdk/sdk.md` - SDK API reference
