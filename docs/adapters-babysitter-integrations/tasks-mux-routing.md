# Tasks-Mux as Unified Task Routing Hub

## Motivation

Instead of the SDK talking to agent-mux directly, **tasks-mux** becomes the single routing layer for all task dispatch — human responders, agent-mux adapters, and external issue trackers. The SDK only needs to know about tasks-mux.

This is better because:
- One routing system for all task types (human, agent, external)
- Cross-cutting concerns (priorities, dependencies, tracking, SLA) apply uniformly
- tasks-mux already has backend abstraction, responder matching, lifecycle management
- Agent-mux becomes a "responder type" in tasks-mux, not a separate integration surface
- External issue trackers are also responder types — same abstraction

## Architecture

```
SDK process: ctx.task(myTask)
  ↓ creates effect (journaled)
  ↓
tasks-mux routes by responder type:
  ├─ type: "internal"  → agent-core session (direct API call)
  ├─ type: "human"     → breakpoint → human responder (existing)
  ├─ type: "agent"     → agent-mux adapter (claude-code, codex, etc.)
  ├─ type: "tracker"   → external issue tracker (Jira, Linear, GitHub Issues)
  └─ type: "auto"      → tasks-mux picks best available responder
```

## Design Changes

### 1. tasks-mux: Responder Types

Current responders are human-only. Extend to support agent responders:

```typescript
// packages/tasks-mux/src/types.ts

type ResponderType = "human" | "agent" | "tracker" | "internal";

interface Responder {
  id: string;
  type: ResponderType;
  name: string;
  capabilities: string[];
  // Agent-specific:
  adapter?: string;        // agent-mux adapter name
  model?: string;          // default model
  provider?: string;       // default provider
  // Tracker-specific:
  trackerBackend?: string; // "github-issues" | "jira" | "linear"
  trackerConfig?: Record<string, unknown>;
}
```

### 2. tasks-mux: Agent Responder Backend

New backend that wraps agent-mux:

```typescript
// packages/tasks-mux/src/backends/agent-mux.ts

class AgentMuxResponderBackend implements BreakpointBackend {
  async submitBreakpoint(params: SubmitBreakpointParams): Promise<Breakpoint> {
    // Route to agent-mux adapter
    const amuxClient = await getAmuxClient();
    const handle = await amuxClient.run({
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

### 3. SDK: Task Definition Routes Through tasks-mux

Replace direct agent-mux references with tasks-mux routing:

```javascript
// Process definition — routes through tasks-mux
const reviewTask = defineTask("review", (args) => ({
  kind: "agent",
  title: "Code review",
  agent: {
    prompt: "Review the changes...",
    // Routing handled by tasks-mux, not SDK:
    responderType: "agent",     // tasks-mux routes to agent-mux
    adapter: "claude-code",     // hint for tasks-mux routing
    fallbackType: "internal",   // if agent-mux unavailable, use internal
  },
}));

// Human review task — same routing system
const approvalTask = defineTask("approval", (args) => ({
  kind: "breakpoint",
  title: "Approve deployment",
  breakpoint: {
    question: "Approve deployment to production?",
    responderType: "human",     // tasks-mux routes to human
    // Or sync to external tracker:
    responderType: "tracker",
    trackerBackend: "jira",
  },
}));

// Auto-routing — tasks-mux picks best responder
const flexibleTask = defineTask("flexible", (args) => ({
  kind: "agent",
  title: "Implement feature",
  agent: {
    prompt: "Implement the feature...",
    responderType: "auto",      // tasks-mux picks based on availability + capabilities
  },
}));
```

### 4. tasks-mux: Routing Logic

```typescript
// packages/tasks-mux/src/router.ts

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
    throw new Error("No agent responders available (agent-mux not installed)");
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

### 5. Effect Resolution via tasks-mux

Instead of the current direct dispatch, effects flow through tasks-mux:

```
Current:
  SDK effect → agent-platform resolveEffect → amuxBridge (direct)

New:
  SDK effect → tasks-mux.submitTask(effect) → tasks-mux.routeTask()
    → type=agent  → AgentMuxResponderBackend → amuxBridge
    → type=human  → BreakpointBackend (existing)
    → type=tracker → ExternalTrackerBackend (new)
    → type=internal → agent-core session (existing)
```

### 6. Plugin Mode Integration

In plugin mode (babysitter running inside claude-code), tasks-mux routing is the same:
- Internal tasks → delegated to host agent (via stop-hook)
- Agent tasks → resolved internally by tasks-mux → agent-mux → external agent
- Human tasks → routed to tasks-mux breakpoint system
- Tracker tasks → synced to external tracker

The stop-hook handler queries tasks-mux for task routing before deciding what to delegate to the host vs. resolve internally.

## Benefits Over Direct Integration

| Concern | Direct agent-mux | Through tasks-mux |
|---------|-----------------|-------------------|
| Task priorities | Not supported | Built-in (when added to tasks-mux) |
| Dependencies | Not supported | Built-in (when added) |
| SLA tracking | Not supported | Unified metrics across all responder types |
| Retry/escalation | Manual | tasks-mux handles escalation chains |
| Audit trail | Per-dispatch | Unified breakpoint lifecycle |
| Cost tracking | Per-dispatch | Aggregated across all tasks |
| Human fallback | Custom code | `responderType: "auto"` handles it |
| External tracking | Separate integration | Same backend abstraction |

## Migration Path

1. **Phase 1:** Add agent responder type to tasks-mux + AgentMuxResponderBackend
2. **Phase 2:** SDK routes through tasks-mux instead of direct agent-mux
3. **Phase 3:** Add tracker responder type for external issue trackers
4. **Phase 4:** Add "auto" routing with capability-based responder matching
5. **Phase 5:** Add priorities, dependencies, SLA across all responder types

## Files to Create

| File | Description |
|------|-------------|
| `packages/tasks-mux/src/backends/agent-mux.ts` | Agent-mux responder backend |
| `packages/tasks-mux/src/router.ts` | Task routing logic |
| `packages/tasks-mux/src/responders/types.ts` | Extended responder types |
| `packages/tasks-mux/src/backends/__tests__/agent-mux.test.ts` | Tests |

## Files to Modify

| File | Change |
|------|--------|
| `packages/tasks-mux/src/types.ts` | Add ResponderType, extend Responder |
| `packages/tasks-mux/src/backend.ts` | Support multiple backend types |
| `packages/sdk/src/runtime/intrinsics/task.ts` | Route through tasks-mux |
| `packages/tula/platform/src/harness/internal/createRun/orchestration/effects.ts` | Use tasks-mux routing |
| `packages/sdk/src/harness/hooks/stopHookHandler.ts` | Query tasks-mux for routing decisions |
