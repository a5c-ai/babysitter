# Effect Resolution Pipeline Changes

## Summary

When a process dispatches an `agent` task with `external: true`, the effect resolution pipeline must route through agent-mux instead of the internal agent-core session. Most of the infrastructure already exists in agent-platform's amuxBridge.

## Current Pipeline

```
Process calls ctx.task(externalTask)
  → SDK throws EffectRequestedError (journaled)
  → orchestrateIteration returns status="waiting"
  → run:iterate returns nextActions with the effect
  → Orchestrator resolves effect:
     CLI path: resolveAndPostEffect() in orchestration/index.ts
     Internal path: resolveEffect() in orchestration/effects.ts → invokePromptEffect()
  → Result posted back via task:post
  → Next iteration: process resumes with result
```

## Changes Needed

### 1. Effect Kind Detection

In `packages/tula/platform/src/harness/internal/createRun/orchestration/effects.ts`:

```typescript
// In resolveEffect(), add external agent detection:
if (action.kind === "agent" && action.taskDef?.agent?.external) {
  return resolveExternalAgentEffect(action, args);
}
```

### 2. New: `resolveExternalAgentEffect()`

```typescript
// packages/tula/platform/src/harness/internal/createRun/orchestration/externalAgentEffect.ts

async function resolveExternalAgentEffect(
  action: EffectAction,
  args: ResolveEffectArgs,
): Promise<EffectResult> {
  const agentDef = action.taskDef?.agent as AgentTaskOptions;
  const adapter = agentDef.adapter;
  const prompt = typeof agentDef.prompt === "string"
    ? agentDef.prompt
    : agentDef.prompt?.instructions?.join("\n") ?? action.taskDef?.title ?? "";

  // Check agent-mux availability
  const amuxClient = await getAmuxClient();
  if (!amuxClient) {
    if (agentDef.fallbackToInternal) {
      process.stderr.write(`[babysitter] agent-mux not available, falling back to internal for ${adapter}\n`);
      return resolveInternalAgentEffect(action, args);
    }
    return { status: "error", error: `agent-mux not available — cannot dispatch to ${adapter}` };
  }

  // Dispatch via amuxBridge (already exists)
  const result = await invokeViaAgentMux(amuxClient, adapter, {
    prompt,
    model: agentDef.model ?? args.model,
    workspace: args.workspace,
    timeout: agentDef.timeout ?? 300_000,
    approvalMode: agentDef.approvalMode ?? "yolo",
    maxTurns: agentDef.maxTurns ?? 10,
    nonInteractive: true,
  });

  // Journal cost event
  if (result.totalCost > 0) {
    await appendEvent({
      runDir: args.runDir,
      eventType: "COST",
      event: {
        source: `external-agent:${adapter}`,
        cost: result.totalCost,
        effectId: action.effectId,
      },
    });
  }

  return {
    status: result.success ? "ok" : "error",
    value: result.output ?? result.lastMessage,
    error: result.success ? undefined : result.lastMessage,
  };
}
```

### 3. CLI Orchestration Path

In `packages/tula/platform/src/harness/internal/createRun/orchestration/index.ts`, `resolveAndPostEffect()`:

```typescript
if (action.kind === "agent" && action.taskDef?.agent?.external) {
  // Route through agent-mux instead of internal agent-core session
  const agentDef = action.taskDef.agent;
  const adapter = agentDef.adapter ?? agentDef.name;
  const prompt = typeof agentDef.prompt === "string" ? agentDef.prompt : /* ... */;

  // Use adapters launch CLI
  const launchResult = execFileSync("adapters", [
    "launch", adapter, agentDef.provider ?? "foundry",
    "--model", agentDef.model ?? model ?? "gpt-5.5",
    "--prompt", prompt,
    "--non-interactive",
    "--json",
    "--max-turns", String(agentDef.maxTurns ?? 10),
  ], { cwd: workspace, encoding: "utf8", timeout: agentDef.timeout ?? 300_000 });

  value = JSON.stringify(launchResult);
}
```

## Files to Create/Modify

### New Files
- `packages/tula/platform/src/harness/internal/createRun/orchestration/externalAgentEffect.ts`
- `packages/tula/platform/src/harness/internal/createRun/orchestration/__tests__/externalAgentEffect.test.ts`

### Modified Files
- `packages/tula/platform/src/harness/internal/createRun/orchestration/effects.ts` — add external agent routing
- `packages/tula/platform/src/harness/internal/createRun/orchestration/index.ts` — add external agent handling in CLI path
- `packages/tula/platform/src/harness/adapters/amuxBridge.ts` — may need minor adjustments for SDK-driven dispatch

## Existing Infrastructure Reused

The amuxBridge in agent-platform already handles:
- Harness → adapter name mapping (`amuxHarnessMap.ts`)
- Agent-mux client lifecycle (`amuxClientFactory.ts`)
- Event streaming and mapping (`amuxEventMapper.ts`)
- Cost tracking from agent-mux events
- Session ID management

This means ~80% of the effect resolution code is already written. The new code is primarily routing logic to detect external tasks and call the existing bridge.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| agent-mux not installed | If `fallbackToInternal: true`, use agent-core. Otherwise, return error result. |
| Adapter not installed | Return error with message: "adapter X not installed. Run `adapters install X`" |
| Adapter not authenticated | Return error with message: "adapter X not authenticated. Run `adapters auth X`" |
| Agent times out | Return error with timeout details. Partial output included if available. |
| Agent crashes | Return error with stderr. Exit code included. |
