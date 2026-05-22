# babysitter-agent ← agent-mux Integration Spec

## 1. Overview

babysitter-agent replaces its custom harness invocation layer (`invoker.ts`, `HARNESS_CLI_MAP`, per-harness subprocess management) with `@agent-mux/core` as a **programmatic library dependency**. agent-mux handles subprocess spawning, event parsing, and session management for all external harnesses. babysitter-agent keeps its orchestration, governance, Pi wrapper, session history, and webhooks.

### What changes

| Current | After |
|---------|-------|
| `invoker.ts` spawns CLIs directly via child_process | Calls `agentMuxClient.run()` programmatically |
| `HARNESS_CLI_MAP` maps harness names to CLI flags | agent-mux adapters handle per-harness differences |
| Custom stdout/stderr chunk parsing per harness | Receives normalized `AgentEvent` stream from agent-mux |
| `processControl.ts` tracks child processes | agent-mux `ProcessTracker` handles lifecycle |
| `dashboard/` renders TUI with custom Ink components | Delegates to agent-mux-tui (babysitter provides plugins) |
| `LaunchSpec` building for different platforms | agent-mux `SpawnArgs` + `InvocationMode` (local/docker/ssh/k8s) |

### What stays

| Module | Reason |
|--------|--------|
| `piWrapper/` + `piSecureSandbox` | Programmatic Pi — not a subprocess model |
| `governance/` | Babysitter-specific permission/sandbox system |
| `session/` (history, decisions, cost) | Babysitter orchestration state |
| `observability/webhooks.ts` | Babysitter-specific event forwarding |
| `interaction/` | Babysitter-specific approval UX (wraps agent-mux interaction channel) |
| `agentic-tools/` | SDK-level features, not harness concern |
| `tasks/` | SDK-level task orchestration |
| `cost/` | Babysitter-specific cost journaling (consumes agent-mux cost events) |
| `api/` | Babysitter HTTP API for runs/effects/breakpoints |

---

## 2. Dependency

```json
{
  "dependencies": {
    "@agent-mux/core": "^1.0.0",
    "@agent-mux/adapters": "^1.0.0"
  }
}
```

babysitter-agent imports agent-mux as a library. No CLI subprocess.

---

## 3. Integration Surface

### 3.1 Client Initialization

```typescript
import { AgentMuxClient } from '@agent-mux/core';

// In babysitter-agent startup:
const amuxClient = new AgentMuxClient({
  defaultAgent: undefined,  // babysitter chooses per invocation
  approvalMode: 'prompt',   // babysitter governance wraps this
  stream: true,             // always stream events
  debug: false,
});
```

The client is created once and reused across invocations. babysitter-agent owns the lifecycle.

### 3.2 Harness Invocation (replaces invoker.ts)

**Current:**
```typescript
// invoker.ts
const result = await invokeHarness('claude-code', {
  prompt: 'Fix the bug',
  model: 'claude-opus-4-6',
  workspace: '/project',
  timeout: 120000,
});
```

**After:**
```typescript
// harness/amuxBridge.ts
import { AgentMuxClient, RunHandle, AgentEvent } from '@agent-mux/core';

export async function invokeViaAgentMux(
  client: AgentMuxClient,
  harness: string,
  options: BabysitterInvokeOptions,
): Promise<BabysitterInvokeResult> {
  const handle: RunHandle = client.run({
    agent: mapHarnessToAdapter(harness),  // 'claude-code' → 'claude'
    prompt: options.prompt,
    model: options.model,
    cwd: options.workspace,
    timeout: options.timeout,
    sessionId: options.sessionId,
    approvalMode: options.nonInteractive ? 'yolo' : 'prompt',
    stream: true,
    env: {
      AGENT_SESSION_ID: options.sessionId,
      ...options.env,
    },
    hooks: options.hooks,
    skills: options.skills,
    nonInteractive: options.nonInteractive,
  });

  // Consume event stream
  const events: AgentEvent[] = [];
  let lastMessage = '';
  let totalCost = 0;

  for await (const event of handle.events) {
    events.push(event);

    // Babysitter-specific event processing
    switch (event.type) {
      case 'text_delta':
        lastMessage += event.text;
        break;
      case 'cost':
        totalCost += event.totalCost;
        babysitterCostJournal.record(event);
        break;
      case 'tool_call_start':
        babysitterGovernance.checkPermission(event);
        break;
      case 'approval_request':
        // Delegate to babysitter governance
        const decision = await babysitterGovernance.evaluate(event);
        await handle.interactions.respond(event.interactionId, decision);
        break;
      case 'error':
      case 'crash':
        babysitterWebhooks.emit('harness-error', event);
        break;
    }

    // Forward to babysitter session history
    babysitterSessionHistory.appendEvent(event);

    // Forward to webhooks
    babysitterWebhooks.emitIfConfigured(event);
  }

  return {
    success: handle.exitCode === 0,
    lastMessage,
    events,
    cost: totalCost,
    sessionId: handle.sessionId,
  };
}
```

### 3.3 Harness Name Mapping

```typescript
const HARNESS_TO_ADAPTER: Record<string, string> = {
  'claude-code': 'claude',
  'codex': 'codex',
  'gemini-cli': 'gemini',
  'github-copilot': 'copilot',
  'cursor': 'cursor',
  'opencode': 'opencode',
  'openclaw': 'openclaw',
  'oh-my-pi': 'omp',
  // Pi is NOT here — uses piWrapper directly
};

function mapHarnessToAdapter(harness: string): string {
  if (harness === 'pi') throw new Error('Pi uses piWrapper, not agent-mux');
  return HARNESS_TO_ADAPTER[harness] || harness;
}
```

### 3.4 Event Stream Consumption

babysitter-agent subscribes to agent-mux's `AgentEvent` stream and maps events to its own concerns:

| AgentEvent type | babysitter-agent action |
|----------------|--------------------------|
| `session_start` | Initialize session history |
| `text_delta` | Accumulate assistant message for stop-hook |
| `thinking_delta` | Log (optional) |
| `tool_call_start` | Check governance permissions |
| `tool_result` | Record in session history |
| `cost` / `token_usage` | Update cost journal |
| `approval_request` | Route to governance engine |
| `input_required` | Route to babysitter interaction UI |
| `error` / `crash` | Emit webhook, log |
| `session_end` | Finalize session history, trigger stop-hook logic |
| `context_compacted` | Record compression event |

### 3.5 Interactive Mode

For interactive babysitter orchestration (the stop-hook loop):

```typescript
// babysitter stop-hook loop using agent-mux
async function runOrchestrationLoop(client: AgentMuxClient, runState: RunState) {
  while (runState.iteration < runState.maxIterations) {
    const handle = client.run({
      agent: mapHarnessToAdapter(runState.harness),
      prompt: buildContinuationPrompt(runState),
      sessionId: runState.sessionId,  // resume existing session
      stream: true,
    });

    for await (const event of handle.events) {
      // Process events as above
    }

    // Babysitter orchestration logic (unchanged)
    const shouldContinue = await evaluateRunState(runState);
    if (!shouldContinue) break;

    runState.iteration++;
  }
}
```

### 3.6 Non-Interactive Mode (YOLO)

```typescript
const handle = client.run({
  agent: 'claude',
  prompt: 'Fix all lint errors',
  approvalMode: 'yolo',
  nonInteractive: true,
  maxTurns: 10,
  timeout: 300000,
});
```

### 3.7 Discovery

```typescript
// Replace checkCliAvailable / discoverHarnesses
const adapters = client.adapters.list();
for (const adapter of adapters) {
  const installed = await client.adapters.detectInstallation(adapter.agent);
  const auth = await client.auth.check(adapter.agent);
  console.log(`${adapter.displayName}: installed=${installed}, auth=${auth.state}`);
}
```

---

## 4. TUI Migration

### 4.1 Current Dashboard

babysitter-agent has `dashboard/` with Ink components: StatusBadge, StatusLine, custom views.

### 4.2 After: agent-mux-tui Plugins

Create `@a5c-ai/babysitter-tui-plugins` package that provides agent-mux-tui plugins:

```typescript
// babysitter-tui-plugins/src/status-badge.ts
import { TuiPlugin } from '@agent-mux/tui';

export const babysitterStatusPlugin: TuiPlugin = {
  name: 'babysitter-status',
  views: [{
    id: 'babysitter-status',
    component: BabysitterStatusView,  // Ink component
    position: 'sidebar',
  }],
  eventRenderers: [{
    eventTypes: ['tool_call_start', 'tool_result'],
    render: (event) => babysitterGovernanceAnnotation(event),
  }],
};
```

### 4.3 Data Flow

```
agent-mux event stream
  → agent-mux-tui renders base UI
  → babysitter-tui-plugins add:
    - Governance status panel
    - Iteration counter
    - Cost tracker
    - Session decision history
    - Pending effects display
```

---

## 5. Files to Remove After Migration

```
src/harness/invoker.ts                    → replaced by amuxBridge.ts
src/harness/invoker/launch.ts             → replaced by agent-mux SpawnArgs
src/harness/invoker/processControl.ts     → replaced by agent-mux ProcessTracker
src/harness/types.ts (partial)            → HARNESS_CLI_MAP, HarnessInvokeOptions removed
src/dashboard/                            → replaced by agent-mux-tui plugins
```

## 6. Files to Create

```
src/harness/amuxBridge.ts                 → AgentMuxClient wrapper
src/harness/amuxEventMapper.ts            → AgentEvent → babysitter event mapping
src/harness/amuxInteractionBridge.ts      → InteractionChannel → governance bridge
```

## 7. Files Unchanged

```
src/harness/piWrapper/**                  → stays (programmatic Pi)
src/harness/piSecureSandbox.ts            → stays
src/governance/**                         → stays
src/session/**                            → stays (consumes agent-mux events)
src/cost/**                               → stays (consumes agent-mux cost events)
src/observability/webhooks.ts             → stays
src/interaction/**                        → stays (wraps agent-mux interaction)
src/api/**                                → stays
src/tasks/**                              → stays
src/agentic-tools/**                      → stays
```
