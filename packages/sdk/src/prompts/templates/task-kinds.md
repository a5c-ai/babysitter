## Task Kinds

**CRITICAL RULE: NEVER use `node` kind effects in generated processes.** The
`node` kind executes inline Node.js scripts which bypasses the agent
orchestration model entirely. Every task that would be a `node` effect MUST be
converted to an `agent` or `skill` effect instead. The only acceptable
non-agent kinds are `shell` (for running existing test suites, git commands, or
build tools), `breakpoint` (human approval), and `sleep` (time gates).

| Kind | Description | Executor | When to use |
|------|-------------|----------|-------------|
| ~~`node`~~ | ~~Node.js script~~ | ~~Local node process~~ | **NEVER -- forbidden. Convert to `agent` or `skill`.** |
| `shell` | Shell command | Local shell process | **Deterministic verification** (compilation, linting, tests, grep, dependency checks, smoke tests) AND running existing CLI tools, git, builds. The orchestrating agent must execute it intentionally and post the result |
| `agent` | LLM agent | Agent runtime | **Default for reasoning tasks** -- planning, implementation, analysis, scoring, debugging, code writing, research. Also for **subjective verification** (code review, architecture assessment, UX evaluation) |
| `skill` | {{skillSystemLabel}} | Skill system | When a matching installed skill exists (preferred over agent when available) |
| `breakpoint` | Human approval | UI/CLI | Decision gates requiring user input |
| `sleep` | Time gate | Scheduler | Time-based pauses |

### Shell vs Agent for Verification Tasks

**CRITICAL:** Verification tasks that produce deterministic, binary pass/fail
results MUST use `kind: 'shell'` with `expectedExitCode`, NOT `kind: 'agent'`.
Agent-interpreted verification creates soft gates where an LLM subjectively
assesses pass/fail -- this is unreliable for objectively testable checks.

| Verification type | Correct kind | Why |
|-------------------|-------------|-----|
| Compilation (tsc, gcc) | `shell` | Exit code is deterministic pass/fail |
| Linting (eslint, ruff) | `shell` | Exit code is deterministic pass/fail |
| Test suites (vitest, jest) | `shell` | Exit code is deterministic pass/fail |
| Grep/pattern checks | `shell` | Pattern exists or it doesn't |
| Dependency availability | `shell` | `node -e "require('pkg')"` succeeds or fails |
| Runtime smoke tests | `shell` | Start, curl, check status code, stop |
| Code review / design quality | `agent` | Requires subjective judgment |
| Architecture assessment | `agent` | Requires reasoning about tradeoffs |
| UX evaluation | `agent` | Subjective quality assessment |

**Anti-pattern (wrong):**
```javascript
// BAD: agent-interpreted verification -- the agent can say "looks good" without running anything
const verifyTask = defineTask('verify-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify TypeScript compiles',
  agent: { prompt: { instructions: ['Run tsc and check it passes'] } }
}));
```

**Correct pattern:**
```javascript
// GOOD: deterministic shell gate -- exit code cannot be negotiated
const verifyTask = defineTask('verify-compilation', (args, taskCtx) => ({
  kind: 'shell',
  title: 'TypeScript compilation check',
  shell: { command: 'npx tsc --noEmit', expectedExitCode: 0, timeout: 120000 }
}));
```

Use `library/processes/shared/deterministic-quality-gate.js` for composable
preset gates (grep checks, compilation, test suites, runtime smoke tests).

### Effect Execution Hints

Tasks can include an `execution` field to express preferences about how the effect should be executed:

| Field | Description |
|-------|-------------|
| `execution.model` | Preferred model for the task (e.g., `'claude-opus-4-6'`). Used for subagent selection. |
{{#cap.harness-routing}}
| `execution.harness` | Preferred harness CLI for the task (internal-only). |
| `execution.permissions` | Permission list for the task (internal-only). |
{{/cap.harness-routing}}

Example:

```javascript
defineTask('my-task', (args, taskCtx) => ({
  kind: 'agent',
  title: 'My task',
  execution: {
    model: 'claude-opus-4-6',
{{#cap.harness-routing}}
    harness: 'pi',
    permissions: ['fs:read', 'fs:write'],
{{/cap.harness-routing}}
  },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Task executor',
      task: 'Perform the requested work',
      context: { ...args },
      instructions: ['Execute the task'],
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['result'] }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```
