# Tasks-Adapter as Unified Task Routing Hub

## Motivation

Instead of the SDK talking to adapters directly, **tasks-adapter** becomes the single routing layer for all task dispatch — human responders, adapters adapters, and external issue trackers. The SDK only needs to know about tasks-adapter.

This is better because:
- One routing system for all task types (human, agent, external)
- Cross-cutting concerns (priorities, dependencies, tracking, SLA) apply uniformly
- tasks-adapter already has backend abstraction, responder matching, lifecycle management
- Adapters becomes a "responder type" in tasks-adapter, not a separate integration surface
- External issue trackers are also responder types — same abstraction

## Architecture

```
SDK process: ctx.task(myTask)
  ↓ creates effect (journaled)
  ↓
tasks-adapter routes by responder type:
  ├─ type: "internal"  → agent-core session (direct API call)
  ├─ type: "human"     → breakpoint → human responder (existing)
  ├─ type: "agent"     → adapters adapter (claude-code, codex, etc.)
  ├─ type: "tracker"   → external issue tracker (Jira, Linear, GitHub Issues)
  └─ type: "auto"      → tasks-adapter picks best available responder
```

## Design Changes

### 1. tasks-adapter: Responder Types

Current responders are human-only. Extend to support agent responders:

```typescript
// packages/tasks-adapter/src/types.ts

type ResponderType = "human" | "agent" | "tracker" | "internal";

interface Responder {
  id: string;
  type: ResponderType;
  name: string;
  capabilities: string[];
  // Agent-specific:
  adapter?: string;        // adapters adapter name
  model?: string;          // default model
  provider?: string;       // default provider
  // Tracker-specific:
  trackerBackend?: string; // "github-issues" | "jira" | "linear"
  trackerConfig?: Record<string, unknown>;
}
```

### 2. tasks-adapter: Agent Responder Backend

New backend that wraps adapters:

```typescript
// packages/tasks-adapter/src/backends/adapters.ts

class AgentMuxResponderBackend implements BreakpointBackend {
  async submitBreakpoint(params: SubmitBreakpointParams): Promise<Breakpoint> {
    // Route to adapters adapter
    const adapterClient = await getAmuxClient();
    const handle = await adapterClient.run({
      agent: params.routing.targetAdapter,
      prompt: params.question,
      model: params.routing.model,
      nonInteractive: true,
      timeout: params.routing.timeout ?? 300_000,
    });
    
    // Collect result
    const result = await handle.result;
    
    // Return as answered breakpoint
    return {
      ...breakpoint,
      status: "answered",
      answer: { text: result.output, responderId: params.routing.targetAdapter },
    };
  }
  
  // waitForAnswer is immediate — agent responds synchronously
  async waitForAnswer(id: string): Promise<BreakpointAnswer> {
    return this.answers.get(id)!;
  }
}
```

### 3. SDK: Task Definition Routes Through tasks-adapter

Replace direct adapters references with tasks-adapter routing:

```javascript
// Process definition — routes through tasks-adapter
const reviewTask = defineTask("review", (args) => ({
  kind: "agent",
  title: "Code review",
  agent: {
    prompt: "Review the changes...",
    // Routing handled by tasks-adapter, not SDK:
    responderType: "agent",     // tasks-adapter routes to adapters
    adapter: "claude-code",     // hint for tasks-adapter routing
    fallbackType: "internal",   // if adapters unavailable, use internal
  },
}));

// Human review task — same routing system
const approvalTask = defineTask("approval", (args) => ({
  kind: "breakpoint",
  title: "Approve deployment",
  breakpoint: {
    question: "Approve deployment to production?",
    responderType: "human",     // tasks-adapter routes to human
    // Or sync to external tracker:
    responderType: "tracker",
    trackerBackend: "jira",
  },
}));

// Auto-routing — tasks-adapter picks best responder
const flexibleTask = defineTask("flexible", (args) => ({
  kind: "agent",
  title: "Implement feature",
  agent: {
    prompt: "Implement the feature...",
    responderType: "auto",      // tasks-adapter picks based on availability + capabilities
  },
}));
```

### 4. tasks-adapter: Routing Logic

```typescript
// packages/tasks-adapter/src/router.ts

async function routeTask(task: TaskDef, context: RoutingContext): Promise<Responder> {
  const type = task.agent?.responderType ?? task.breakpoint?.responderType ?? "internal";
  
  switch (type) {
    case "internal":
      return { id: "agent-core", type: "internal", name: "Internal Agent", capabilities: ["text"] };
      
    case "human":
      return await matchHumanResponder(task, context);
      
    case "agent":
      return await matchAgentResponder(task, context);
      
    case "tracker":
      return await matchTrackerResponder(task, context);
      
    case "auto":
      // Try agent first (faster), fall back to human if no agent available
      const agent = await matchAgentResponder(task, context).catch(() => null);
      if (agent) return agent;
      return await matchHumanResponder(task, context);
      
    default:
      throw new Error(`Unknown responder type: ${type}`);
  }
}

async function matchAgentResponder(task: TaskDef, context: RoutingContext): Promise<Responder> {
  const discovery = await discoverExternalAgents();
  if (!discovery.available) {
    if (task.agent?.fallbackType === "internal") {
      return { id: "agent-core", type: "internal", name: "Internal (fallback)", capabilities: ["text"] };
    }
    throw new Error("No agent responders available (adapters not installed)");
  }
  
  const preferred = task.agent?.adapter;
  if (preferred) {
    const agent = discovery.agents.find(a => a.name === preferred && a.installed);
    if (agent) return { id: agent.name, type: "agent", name: agent.displayName, adapter: agent.name, capabilities: agent.capabilities };
    // Preferred not available — try any installed agent
  }
  
  const installed = discovery.agents.filter(a => a.installed && a.authenticated);
  if (installed.length === 0) throw new Error("No authenticated agent responders available");
  return { id: installed[0].name, type: "agent", name: installed[0].displayName, adapter: installed[0].name, capabilities: installed[0].capabilities };
}
```

### 5. Effect Resolution via tasks-adapter

Instead of the current direct dispatch, effects flow through tasks-adapter:

```
Current:
  SDK effect → agent-platform resolveEffect → adapterBridge (direct)

New:
  SDK effect → tasks-adapter.submitTask(effect) → tasks-adapter.routeTask()
    → type=agent  → AgentMuxResponderBackend → adapterBridge
    → type=human  → BreakpointBackend (existing)
    → type=tracker → ExternalTrackerBackend (new)
    → type=internal → agent-core session (existing)
```

### 6. Plugin Mode Integration

In plugin mode (babysitter running inside claude-code), tasks-adapter routing is the same:
- Internal tasks → delegated to host agent (via stop-hook)
- Agent tasks → resolved internally by tasks-adapter → adapters → external agent
- Human tasks → routed to tasks-adapter breakpoint system
- Tracker tasks → synced to external tracker

The stop-hook handler queries tasks-adapter for task routing before deciding what to delegate to the host vs. resolve internally.

## Benefits Over Direct Integration

| Concern | Direct adapters | Through tasks-adapter |
|---------|-----------------|-------------------|
| Task priorities | Not supported | Built-in (when added to tasks-adapter) |
| Dependencies | Not supported | Built-in (when added) |
| SLA tracking | Not supported | Unified metrics across all responder types |
| Retry/escalation | Manual | tasks-adapter handles escalation chains |
| Audit trail | Per-dispatch | Unified breakpoint lifecycle |
| Cost tracking | Per-dispatch | Aggregated across all tasks |
| Human fallback | Custom code | `responderType: "auto"` handles it |
| External tracking | Separate integration | Same backend abstraction |

## Migration Path

1. **Phase 1:** Add agent responder type to tasks-adapter + AgentMuxResponderBackend
2. **Phase 2:** SDK routes through tasks-adapter instead of direct adapters
3. **Phase 3:** Add tracker responder type for external issue trackers
4. **Phase 4:** Add "auto" routing with capability-based responder matching
5. **Phase 5:** Add priorities, dependencies, SLA across all responder types

## Files to Create

| File | Description |
|------|-------------|
| `packages/tasks-adapter/src/backends/adapters.ts` | Adapters responder backend |
| `packages/tasks-adapter/src/router.ts` | Task routing logic |
| `packages/tasks-adapter/src/responders/types.ts` | Extended responder types |
| `packages/tasks-adapter/src/backends/__tests__/adapters.test.ts` | Tests |

## Files to Modify

| File | Change |
|------|--------|
| `packages/tasks-adapter/src/types.ts` | Add ResponderType, extend Responder |
| `packages/tasks-adapter/src/backend.ts` | Support multiple backend types |
| `packages/babysitter-sdk/src/runtime/intrinsics/task.ts` | Route through tasks-adapter |
| `packages/genty/platform/src/harness/internal/createRun/orchestration/effects.ts` | Use tasks-adapter routing |
| `packages/babysitter-sdk/src/harness/hooks/stopHookHandler.ts` | Query tasks-adapter for routing decisions |
