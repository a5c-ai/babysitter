# Portable Hook Authoring Guide

How to write hook handlers that work across all supported harnesses using the normalized event model.

---

## Core Principle

Portable hooks receive a `UnifiedHookEvent` and return a `UnifiedHookResult`. They never interact directly with harness-native payloads or output formats. The adapter handles all translation.

---

## Handler Function Signature

A hook handler is a function that receives a normalized event and returns a result:

```typescript
import type { UnifiedHookEvent, UnifiedHookResult } from '@a5c-ai/hooks-mux-core';

export async function handler(event: UnifiedHookEvent): Promise<UnifiedHookResult> {
  // Your hook logic here
  return { decision: 'noop' };
}
```

---

## The Normalized Event (`UnifiedHookEvent`)

Every hook invocation receives the same event shape regardless of which harness triggered it:

```typescript
interface UnifiedHookEvent {
  version: 'a5c.hooks.v1';
  adapter: string;               // 'claude', 'codex', 'gemini', etc.
  phase: string;                  // Canonical phase: 'session.start', 'tool.before', etc.
  rawEventName: string;           // Original harness event name
  supportLevel: 'native' | 'emulated' | 'lossy' | 'unsupported';
  execution: {
    sessionId: string | null;
    adapter: string;
    cwd?: string | null;
    nativeEventName: string;
    persistedEnv: Record<string, string>;
    contextVars: Record<string, string>;
    toolName?: string | null;
    toolCallId?: string | null;
    // ... more context fields
    metadata: Record<string, unknown>;
  };
  payload: Record<string, unknown>;  // Normalized payload data
  env: {
    input: Record<string, string>;    // Environment at invocation time
    persisted: Record<string, string>; // Previously persisted env
  };
  raw: unknown;                       // Raw harness payload (avoid depending on this)
}
```

### Key Fields

- **`phase`**: Use this to determine what lifecycle event triggered the hook. Always a canonical phase name like `session.start`, `tool.before`, `tool.after`, `turn.stop`.
- **`execution.sessionId`**: The resolved session ID. May be null if no session context is available.
- **`execution.persistedEnv`**: Environment variables persisted from previous hook executions in this session.
- **`execution.contextVars`**: Structured context variables from the session store.
- **`payload`**: Normalized event data. For tool events, includes tool name, input, etc.

---

## The Result (`UnifiedHookResult`)

Return a result object describing what should happen:

```typescript
interface UnifiedHookResult {
  // Decision about the current action
  decision?: 'allow' | 'deny' | 'ask' | 'continue' | 'noop';
  reason?: string;

  // Context injection
  systemMessage?: string;
  additionalContext?: string;
  followUpMessage?: string;

  // Session control
  continueSession?: boolean;
  stopReason?: string;
  suppressOutput?: boolean;

  // Tool mutation (single writer only)
  toolMutation?: {
    mode: 'replace' | 'patch';
    value: unknown;
  };

  // Context propagation
  persistEnv?: Record<string, string>;
  unsetEnv?: string[];
  contextVars?: Record<string, string>;

  // Custom metadata
  metadata?: Record<string, unknown>;
}
```

### Decision Values

| Decision | Meaning |
|----------|---------|
| `noop` | No action; pass through (default) |
| `allow` | Explicitly allow the action |
| `ask` | Ask the user for approval |
| `deny` | Block the action |
| `continue` | Continue processing |

Decisions follow a **most-restrictive-wins** rule when multiple handlers run: `deny` > `ask` > `allow` > `continue` > `noop`.

---

## Writing Phase-Specific Handlers

### Session Start Handler

Runs when a new session begins. Use for initialization and context setup.

```typescript
export async function handler(event: UnifiedHookEvent): Promise<UnifiedHookResult> {
  if (event.phase !== 'session.start') return { decision: 'noop' };

  return {
    decision: 'noop',
    persistEnv: {
      MY_PLUGIN_INITIALIZED: 'true',
      MY_PLUGIN_SESSION_START: new Date().toISOString(),
    },
    contextVars: {
      'my-plugin.version': '1.0.0',
    },
    additionalContext: 'My plugin is active and monitoring tool usage.',
  };
}
```

### Tool Guard Handler

Runs before tool execution. Use for policy enforcement.

```typescript
export async function handler(event: UnifiedHookEvent): Promise<UnifiedHookResult> {
  if (event.phase !== 'tool.before') return { decision: 'noop' };

  const toolName = event.execution.toolName;

  // Block dangerous tools
  if (toolName === 'Bash' && isDangerousCommand(event.payload)) {
    return {
      decision: 'deny',
      reason: 'Command blocked by security policy',
    };
  }

  return { decision: 'allow' };
}

function isDangerousCommand(payload: Record<string, unknown>): boolean {
  const command = String(payload['command'] ?? '');
  return command.includes('rm -rf /') || command.includes('format c:');
}
```

### Post-Tool Observer

Runs after tool execution. Use for logging, metrics, or context updates.

```typescript
export async function handler(event: UnifiedHookEvent): Promise<UnifiedHookResult> {
  if (event.phase !== 'tool.after') return { decision: 'noop' };

  const toolName = event.execution.toolName ?? 'unknown';
  const callCount = parseInt(event.execution.contextVars['tool-counter'] ?? '0', 10);

  return {
    decision: 'noop',
    contextVars: {
      'tool-counter': String(callCount + 1),
      'last-tool': toolName,
    },
  };
}
```

---

## Registering Handlers

### Via CLI Arguments

```bash
a5c-hooks-mux invoke --adapter claude --native-event PreToolUse --handler ./my-handler.js:handler
```

### Via Handler Registry

Create `.a5c/hooks-registry.json`:

```json
[
  {
    "id": "security-guard",
    "pluginId": "my-security-plugin",
    "phase": "tool.before",
    "priority": 10,
    "handler": {
      "source": "./hooks/security-guard.js",
      "handler": "handler"
    }
  },
  {
    "id": "context-setup",
    "pluginId": "my-context-plugin",
    "phase": "session.start",
    "priority": 100,
    "handler": {
      "source": "./hooks/context-setup.js",
      "handler": "handler"
    }
  }
]
```

### Via Programmatic API

```typescript
import { registerHandler } from '@a5c-ai/hooks-mux-core';

registerHandler({
  id: 'my-handler',
  pluginId: 'my-plugin',
  phase: 'session.start',
  priority: 100,
  handler: { source: './my-handler', handler: 'onStart' },
});
```

---

## Programmatic Usage (In-Process Harnesses)

For in-process harnesses (Pi, Oh-My-Pi, OpenCode, OpenClaw), the hooks-mux provides a programmatic engine that runs handlers in-process without spawning shell subprocesses.

### Creating an Engine

Each programmatic adapter exports a `createConfiguredEngine()` factory that pre-wires the adapter's capabilities and phase mappings:

```typescript
// Pi
import { createConfiguredEngine } from '@a5c-ai/hooks-mux-adapter-pi';
const engine = createConfiguredEngine();

// Oh-My-Pi
import { createConfiguredEngine } from '@a5c-ai/hooks-mux-adapter-oh-my-pi';
const engine = createConfiguredEngine();

// OpenCode
import { createConfiguredEngine } from '@a5c-ai/hooks-mux-adapter-opencode';
const engine = createConfiguredEngine();

// OpenClaw
import { createConfiguredEngine } from '@a5c-ai/hooks-mux-adapter-openclaw';
const engine = createConfiguredEngine();
```

Or create an engine directly from core:

```typescript
import { createHooksEngine } from '@a5c-ai/hooks-mux-core';

const engine = createHooksEngine({
  adapter: 'my-adapter',
  capabilities: myAdapterCapabilities,
  phaseMappings: myPhaseMappings,
  sessionDir: '/custom/session/dir', // optional
});
```

### Registering Handlers

Register portable handler functions directly -- no shell commands needed:

```typescript
engine.registerHandler({
  id: 'security-guard',
  pluginId: 'my-security-plugin',
  phase: 'tool.before',
  priority: 10,
  handler: async (event) => {
    const toolName = event.execution.toolName;
    if (toolName === 'Bash' && isDangerousCommand(event.payload)) {
      return { decision: 'deny', reason: 'Blocked by policy' };
    }
    return { decision: 'allow' };
  },
  when: { 'execution.adapter': 'pi' }, // optional condition
  timeoutMs: 5000, // optional per-handler timeout
});
```

### Processing Events

When the harness fires a native event, pass it to the engine:

```typescript
// Pi fires session_start:
const result = await engine.processEvent({
  nativeEventName: 'session_start',
  payload: { sessionId: 'abc', cwd: '/project' },
  sessionId: 'abc', // optional explicit session ID
});

console.log(result.mergedResult.decision);     // 'allow' | 'deny' | etc.
console.log(result.mergedResult.persistEnv);   // env vars to persist
console.log(result.handlersExecuted);          // ['security-guard', ...]
console.log(result.diagnostics.executionTimeMs);
```

For pre-normalized events (skip adapter normalization):

```typescript
const result = await engine.processNormalizedEvent(normalizedEvent);
```

### Adding Middleware

Middleware wraps the handler execution pipeline (Express/Koa-style):

```typescript
import type { HookMiddleware } from '@a5c-ai/hooks-mux-core';

const loggingMiddleware: HookMiddleware = async (event, next) => {
  console.log(`[${event.phase}] Processing...`);
  const result = await next();
  console.log(`[${event.phase}] Decision: ${result.decision}`);
  return result;
};

engine.use(loggingMiddleware);
```

### Comparison: CLI vs Programmatic

| Feature | CLI (`a5c-hooks-mux invoke`) | Programmatic (`createHooksEngine`) |
|---------|------|-------------|
| Handler type | Shell commands (child processes) | In-process functions |
| Input format | stdin JSON | Direct function arguments |
| Output format | stdout JSON | Return values |
| Session persistence | Automatic | Automatic |
| Error handling | Per-phase error policies | Fail-open (default) |
| Middleware | Not available | Express/Koa-style chain |
| Best for | Shell-hook harnesses (Claude, Codex, Gemini) | In-process harnesses (Pi, OpenCode, OpenClaw) |

---

## Portability Guidelines

1. **Never depend on `event.raw`** -- it contains the harness-native payload and differs per adapter. Use `event.payload` for normalized data.

2. **Check `event.supportLevel`** -- if it is `'lossy'` or `'unsupported'`, some normalized fields may be missing or approximate.

3. **Use `event.phase`** -- always dispatch on the canonical phase, never on `event.rawEventName`.

4. **Namespace your env keys** -- use a prefix like `MYPLUGIN_` for persisted env to avoid conflicts with other handlers.

5. **Namespace your context vars** -- use dotted prefixes like `my-plugin.key` for context variables.

6. **Handle missing session gracefully** -- `event.execution.sessionId` may be null on adapters with synthetic or no session support.

7. **Keep handlers idempotent** -- handlers may be re-executed during session resume or replay scenarios.

8. **Return `noop` for unhandled phases** -- always return `{ decision: 'noop' }` for phases your handler does not care about.

9. **Avoid side effects in observer handlers** -- if your handler is read-only, declare it as such and avoid writing to persistEnv or contextVars unnecessarily.

10. **Test across adapters** -- use the doctor command to verify your handler's requirements match the adapter's capabilities.
