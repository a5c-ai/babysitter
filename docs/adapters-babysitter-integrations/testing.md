# Test Strategy — Agent-Mux Babysitter Integration

## Test Layers

### 1. SDK Unit Tests

**Discovery tests** (`packages/sdk/src/harness/__tests__/externalAgentDiscovery.test.ts`):
- Returns `{ available: false }` when adapters not importable
- Returns agent list when adapters module available (mock adapter-registry)
- Caches results for 60s, respects `force: true`
- Handles timeout gracefully (returns empty on timeout)
- Falls back to CLI (`adapters doctor --json`) when module import fails

**Task type tests** (`packages/sdk/src/tasks/__tests__/kinds.test.ts`, `defineTask.test.ts`, `serializer.test.ts`):
- `externalAgentTask()` helper produces correct TaskDef shape
- `agent.responderType: "agent"` metadata preserved through defineTask → build → TaskDef
- `adapter` field required when `agent.responderType` is `"agent"`
- `fallbackType: "internal"` flag preserved
- `humanTask()` emits `breakpoint.responderType: "human"`
- `autoTask()` emits `agent.responderType: "auto"`

Runtime effect-routing tests are part of the tasks-mux follow-up work. The SDK
unit tests only validate task definition shape, validation, and serialization.

### 2. Agent-Platform Unit Tests

**Effect resolution tests** (`packages/genty/platform/src/harness/internal/createRun/orchestration/__tests__/externalAgentEffect.test.ts`):
- External agent effect routes to amuxBridge
- Returns error when adapters not available and `fallbackType` is not set
- Falls back to internal when adapters not available and `fallbackType: "internal"` is set
- Adapter not installed → clear error message with install hint
- Adapter not authenticated → clear error message
- Agent timeout → error with partial output
- Cost events journaled on successful dispatch
- Result value is the agent's text output

**CLI orchestration tests** (`packages/genty/platform/src/harness/internal/createRun/orchestration/__tests__/index.test.ts`):
- `resolveAndPostEffect` routes external agent tasks correctly
- adapters CLI fallback when module not importable
- Timeout handling for slow external agents

**Validation tests** (`packages/genty/platform/src/harness/internal/createRun/planProcess/__tests__/validation.test.ts`):
- Processes with external agent tasks pass validation
- Warning (not error) when adapters not detected but process uses external tasks
- Conformance repair includes external agent task format

**Prompt tests** (`packages/genty/platform/src/harness/internal/createRun/planProcess/__tests__/phase.test.ts`):
- External agents section included in prompt when discovery returns agents
- External agents section absent when discovery returns empty
- Raw text session template includes external agent instructions

### 3. Integration Tests

**E2E with mock adapters** (`packages/genty/platform/src/harness/__tests__/e2e-external-agent.test.ts`):
- Process defines external agent task → dispatches → mock agent returns → process completes
- Process with `fallbackType: "internal"` → mock adapters unavailable → falls back to agent-core
- Cost tracking flows through journal

**Live-stack addition** (`.github/workflows/live-stack.yml`):
- Add genty scenario with external agent dispatch (genty calls claude-code for a subtask)
- Requires both genty and claude-code to be available in CI
- Validates journal has COST event from external dispatch

### 4. Process Library Tests

**Process template tests** (`library/__tests__/`):
- Processes using external agent tasks validate correctly
- Process conformance repair handles external agent format

## Test Fixtures

### Mock adapters adapter registry
```typescript
const mockRegistry = {
  list: () => [
    { name: "claude", displayName: "Claude Code", installed: true, authenticated: true },
    { name: "codex", displayName: "Codex", installed: true, authenticated: false },
  ],
  installed: () => ["claude"],
};
```

### Mock adapters client
```typescript
const mockAmuxClient = {
  run: (options) => ({
    events: (async function*() {
      yield { type: "text_delta", text: "Mock response" };
      yield { type: "done", cost: 0.01 };
    })(),
    result: Promise.resolve({ success: true, output: "Mock response" }),
  }),
};
```

## CI Configuration

- Unit tests: run on every PR (no external dependencies needed)
- Integration tests: run with `LIVE_STACK_EXTERNAL_AGENT=1` env var
- Live-stack: add external agent scenario to dispatch matrix when both genty and claude-code are available

## Coverage Targets

| Area | Target |
|------|--------|
| SDK discovery | 90% — all paths including fallback and timeout |
| Task types | 100% — type safety is critical |
| Effect resolution | 85% — mock amuxBridge, cover error paths |
| Validation | 80% — cover external task acceptance |
| E2E | 1 happy path + 1 fallback path |
