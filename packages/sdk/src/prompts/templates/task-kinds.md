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
| `shell` | Shell command | Local shell process | Only for running existing CLI tools, test suites, git, linters, builds. The orchestrating agent must execute it intentionally and post the result |
| `agent` | LLM agent | Agent runtime | **Default for all tasks** -- planning, implementation, analysis, verification, scoring, debugging, code writing, research |
| `skill` | {{skillSystemLabel}} | Skill system | When a matching installed skill exists (preferred over agent when available) |
| `breakpoint` | Human approval | UI/CLI | Decision gates requiring user input |
| `sleep` | Time gate | Scheduler | Time-based pauses |

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
