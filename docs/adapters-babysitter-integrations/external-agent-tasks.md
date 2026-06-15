# External Agent Tasks

## Summary

Extend the `agent` task kind with `responderType` routing metadata so tasks-adapter can route work to an internal responder, human, external agent, tracker, or automatic choice. This supersedes the older #603 `external: true` proposal.

## Task Definition API

### Current (internal only)
```javascript
const analyzeTask = defineTask("analyze", (args) => ({
  kind: "agent",
  title: "Analyze codebase",
  agent: { name: "Analyzer", prompt: "Analyze the code..." },
}));
```

### New (external via adapters)
```javascript
const reviewTask = defineTask("review", (args) => ({
  kind: "agent",
  title: "Code review via Claude Code",
  agent: {
    name: "Code Reviewer",
    prompt: "Review the changes in the working directory...",
    responderType: "agent",   // tasks-adapter routes to adapters
    adapter: "claude-code",   // NEW — which adapters adapter
    model: "claude-sonnet-4-6", // optional — model override
    provider: "anthropic",    // optional — provider override
    timeoutMs: 300_000,       // optional — per-task timeout
    approvalMode: "yolo",     // optional — auto-approve tool use
    maxTurns: 10,             // optional — conversation turn limit
  },
}));
```

### Fallback behavior
```javascript
const flexibleTask = defineTask("flexible-review", (args) => ({
  kind: "agent",
  title: "Code review",
  agent: {
    name: "Reviewer",
    prompt: "Review the code...",
    responderType: "agent",
    adapter: "claude-code",
    fallbackType: "internal",
  },
}));
```

## SDK Changes

### `packages/babysitter-sdk/src/tasks/types.ts`

```typescript
interface AgentTaskOptions {
  name: string;
  prompt: string | { instructions: string[] };
  outputSchema?: Record<string, unknown>;
  responderType?: "internal" | "human" | "agent" | "tracker" | "auto";
  adapter?: string;           // adapters adapter name
  fallbackType?: "internal" | "human" | "agent" | "tracker" | "auto";
  model?: string;             // model override
  provider?: string;          // provider override
  timeoutMs?: number;         // per-task timeout
  approvalMode?: "yolo" | "prompt";
  maxTurns?: number;
}

// Add to TaskDef
interface TaskDef {
  kind: TaskKind;
  agent?: AgentTaskOptions;   // existing field, extended
  // ...
}
```

### `packages/babysitter-sdk/src/tasks/kinds/index.ts`

Add helper function:

```typescript
const reviewTask = externalAgentTask("review", {
  adapter: "claude-code",
  prompt: "Review the changes in the working directory...",
  fallbackType: "internal",
});
```

### `packages/babysitter-sdk/src/tasks/defineTask.ts`

When the task kind is `"agent"` and `agent.responderType` is `"agent"`:
- Validate that `agent.adapter` is set
- Preserve valid routing metadata on the task definition
- Leave effect routing to the tasks-adapter work tracked by #630/#620

## Files to Modify

- `packages/babysitter-sdk/src/tasks/types.ts` — extend AgentTaskOptions with responder routing fields
- `packages/babysitter-sdk/src/tasks/kinds/index.ts` — export `externalAgentTask`, `humanTask`, and `autoTask` helpers
- `packages/babysitter-sdk/src/tasks/defineTask.ts` — validate agent adapter for `responderType: "agent"`
- `packages/babysitter-sdk/src/tasks/serializer.ts` — preserve typed agent routing metadata
- `packages/babysitter-sdk/src/tasks/__tests__/*.test.ts` — cover helpers, validation, serialization, and compatibility

## Validation Rules

In SDK task definition validation:
- Accept typed `agent.responderType`
- Validate `adapter` is a non-empty string when `agent.responderType === "agent"`
- Leave adapter availability checks to the tasks-adapter/runtime routing work

## Process Template Update

When external agents are available, the process definition template should mention:

```
You may use external agent tasks to delegate work to installed agents:
- defineTask("id", (args) => ({
    kind: "agent",
    agent: { name: "...", prompt: "...", responderType: "agent", adapter: "claude-code" }
  }))
Available adapters: claude-code, codex, gemini-cli, ...
```
