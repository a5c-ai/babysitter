---
name: babysit
description: Orchestrate .a5c runs via @a5c-ai/babysitter-sdk CLI. Run iterations, get requested effects, perform effects, post results. use this skill when asked to babysit a run or orchestrate a complex workflow.
allowed-tools: Read, Grep, Write, Task, Bash, Edit, Grep, Glob
---

# babysit

Orchestrate `.a5c/runs/<runId>/` through iterative execution. Use the SDK CLI to drive the orchestration loop. 

IMPORTANT: Never build a wrapper, python or helper scripts to orchestrate the runs. Use the CLI to drive the orchestration loop and never loop programmatically.

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

### 0. Setup session:

**For new runs:**

1. Setup in-session loop:
```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/babysit/scripts/setup-babysitter-run.sh" --claude-session-id "${CLAUDE_SESSION_ID}" $PROMPT
```

2. Create the run:
```bash
$CLI run:create --process-id <id> --entry <path> --inputs <file> --json
```

3. Associate session with run:
```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/babysit/scripts/associate-session-with-run.sh" \
  --run-id <runId-from-step-2> \
  --claude-session-id "${CLAUDE_SESSION_ID}"
```

**For resuming existing runs:**

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/babysit/scripts/setup-babysitter-run-resume.sh" --claude-session-id "${CLAUDE_SESSION_ID}" --run-id RUN_ID"
```

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
  "completionSecret": "only-present-when-completed",
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

Run the effect externally to the SDK (by you, your hook, or another worker). After execution (by delegation to an agent or skill), post the outcome summary into the run by calling `task:post`, which:
- Writes the committed result to `tasks/<effectId>/result.json`
- Appends an `EFFECT_RESOLVED` event to the journal
- Updates the state cache

IMPORTANT:
- Delegate using the Task tool if possible. 
- Make sure the change was actually performed and not described or implied. (for example, if code files were mentioned as created in the summary, make sure they were actually created.)
- Include in the instructions to the agent or skill to perform the task in full and return the only the summary result in the requested schema.


if the effect is a breakpoint, you need to run the command:
```bash
npx @a5c-ai/babysitter-breakpoints breakpoint create --tag <tag> --question "<question>" --title "<title>" --run-id <runId> --file <file,format,language,label> --file <file,format,language,label> --file <file,format,language,label> ...
```

 to create the breakpoint and get the answer from the user. breakpoint are meant for human approval through the breakpoint tool. NEVER prompt directly and never release or approve a breakpoint yourself. put you may need to post the result of the breakpoint to the run by calling `task:post`

### 4. Results Posting

**IMPORTANT**: Do NOT write `result.json` directly. The SDK owns that file.

**Workflow:**

1. Write the result **value** to a separate file (e.g., `output.json` or `value.json`):
```json
{
  "score": 85,
  "details": { ... }
}
```

2. Post the result, passing the value file:
```bash
$CLI task:post .a5c/runs/<runId> <effectId> \
  --status ok \
  --value tasks/<effectId>/output.json \
  --json
```

The `task:post` command will:
- Read the value from your file
- Write the complete `result.json` (including schema, metadata, and your value)
- Append an `EFFECT_RESOLVED` event to the journal
- Update the state cache

**Available flags:**
- `--status <ok|error>` (required)
- `--value <file>` - Result value (for status=ok)
- `--error <file>` - Error payload (for status=error)
- `--stdout-file <file>` - Capture stdout
- `--stderr-file <file>` - Capture stderr
- `--started-at <iso8601>` - Task start time
- `--finished-at <iso8601>` - Task end time
- `--metadata <file>` - Additional metadata JSON

**Common mistake to avoid:**
```bash
# ❌ WRONG: Writing result.json directly
echo '{"result": {...}}' > tasks/<effectId>/result.json
$CLI task:post <runId> <effectId> --status ok

# ✅ CORRECT: Write value to separate file, let SDK create result.json
echo '{"score": 85}' > tasks/<effectId>/output.json
$CLI task:post <runId> <effectId> --status ok --value tasks/<effectId>/output.json
```

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

Important: Check which subagents and agents are actually available before assigning the name. if none, pass the general-purpose subagent.
when executing the agent task, use the Task tool.

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

When the run completes, `run:iterate` and `run:status` emit `completionSecret`. Use that exact value in a `<promise>...</promise>` tag to end the loop.

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

## Recovery from failure

If at any point the run fails due to SDK issues or corrupted state or journal. analyze the error and the journal events. recover the state to the state and journal to the last known good state and adapt and try to continue the run.

## See Also
- `process/tdd-quality-convergence.js` - TDD quality convergence example - read this before creating the code for a run (create the run using the CLI, then use this process as a reference)
- `reference/ADVANCED_PATTERNS.md` - Agent/skill patterns, iterative convergence
- `packages/sdk/sdk.md` - SDK API reference

## Critical Rule

CRITICAL RULE: The completion secret is emitted only when the run is completed. You may ONLY output `<promise>SECRET</promise>` when the run is completely and unequivocally DONE (completed status from the orchestration CLI). Do not output false promises to escape the run, and do not mention the secret to the user.

CRITICAL RULE: never approve breakpoints by yourself. only create them and wait for them. they will always be resolved externally.

CRITICAL RULE: if a breakpoint is still waiting. monitor it for approval until it is resolved. do not return prompt to the user. just wait for the breakpoint to be resolved.