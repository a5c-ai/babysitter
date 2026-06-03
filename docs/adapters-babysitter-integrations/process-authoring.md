# Process Authoring Updates

## Summary

Update process creation prompts, templates, and validation to expose external agent capabilities when agent-mux is detected. The LLM authoring the process should know what agents are available and how to use them.

## Prompt Context Injection

### Where: `packages/tula/platform/src/harness/internal/createRun/planProcess/phase.ts`

When `discoverExternalAgents()` returns agents, inject into the plan process prompt:

```typescript
// After line 93 (workspaceAssessment):
const externalAgents = await discoverExternalAgents({ timeout: 5000 });

// Build agent availability section for prompt:
if (externalAgents.available && externalAgents.agents.some(a => a.installed)) {
  const agentList = externalAgents.agents
    .filter(a => a.installed)
    .map(a => `- ${a.name} (${a.authenticated ? 'authenticated' : 'not authenticated'})`)
    .join('\n');

  promptContext.externalAgentsSection = [
    '',
    'Available external agents (via agent-mux):',
    agentList,
    '',
    'You may delegate specialist work to these agents using external agent tasks:',
    '  defineTask("task-id", (args) => ({',
    '    kind: "agent",',
    '    agent: {',
    '      name: "Task Name",',
    '      prompt: "Instructions for the external agent...",',
    '      responderType: "agent",',
    '      adapter: "claude-code",  // or codex, gemini-cli, etc.',
    '    },',
    '  }))',
    '',
    'Use external agents when:',
    '- The task requires file editing, bash execution, or browser access (agent-core cannot do these)',
    '- A specific agent has better capabilities for the task (e.g., codex for code generation)',
    '- The task benefits from a separate workspace or conversation context',
    '',
    'Use internal agent tasks when:',
    '- The task is purely text generation (summarization, analysis, planning)',
    '- Low latency is important (internal is faster than spawning external agents)',
  ].join('\n');
}
```

### Raw Text Session Template (tula path)

In the `isRawTextSession` branch, append external agent info to the system prompt when available:

```typescript
if (externalAgents.available && externalAgents.agents.some(a => a.installed)) {
  processDefinitionSystemPrompt += '\n\n' + promptContext.externalAgentsSection;
}
```

## Validation Updates

### `packages/tula/platform/src/harness/internal/createRun/planProcess/validationSource.ts`

Current validation checks for `kind: "agent"` with `agent: { ... }` shape. Extend it to accept `agent.responderType: "agent"` routing metadata:

```typescript
// In getDefineTaskKindShapeMismatches():
// Accept agent tasks with responderType routing metadata
if (kind === "agent" && properties.has("agent")) {
  // Valid — both internal and external agent tasks have agent property
  continue;
}
```

### `packages/tula/platform/src/harness/internal/createRun/planProcess/validation.ts`

In `validateProcessExport()`, don't reject processes that reference external agents even if agent-mux is not installed at validation time (it may be available at execution time):

```typescript
// After existing validation:
// Warn (don't error) about external agent tasks when agent-mux not detected
if (hasExternalAgentTasks(source) && !externalAgentsAvailable) {
  console.warn('[babysitter] process uses external agent tasks but agent-mux is not detected');
}
```

## Conformance Repair Prompt

Update `packages/tula/platform/src/harness/internal/createRun/planProcess/phase.ts` conformance repair prompt to include external agent task format:

```
- External agent tasks must use kind: "agent" with agent: { responderType: "agent", adapter: "..." }
- The adapter field must be a valid agent-mux adapter name
```

## Files to Modify

| File | Change |
|------|--------|
| `packages/tula/platform/src/harness/internal/createRun/planProcess/phase.ts` | Inject external agents into prompt context |
| `packages/tula/platform/src/harness/internal/createRun/planProcess/prompts.ts` | Add externalAgentsSection to prompt builder |
| `packages/tula/platform/src/harness/internal/createRun/planProcess/validation.ts` | Accept external agent tasks |
| `packages/tula/platform/src/harness/internal/createRun/planProcess/validationSource.ts` | Update kind shape matching |
| `packages/sdk/src/harness/externalAgentDiscovery.ts` | New — discovery API |

## Documentation Updates

| File | Change |
|------|--------|
| `docs/agent-reference/process-authoring.md` | Add external agent task section |
| `docs/agent-reference/command-surfaces.md` | Document external agent dispatch |
| `docs/plugins.md` | Note agent-mux integration |
