# agent-mux ← babysitter-harness Adapter Spec

## 1. Overview

agent-mux adds a `babysitter` adapter that allows agent-mux users to target babysitter-harness as an agent. When someone runs `amux run --agent babysitter --prompt "..."`, agent-mux spawns the babysitter CLI as a subprocess, streams its output as normalized `AgentEvent`s, and handles interaction (approvals, input).

This is the **reverse direction** of the babysitter-harness integration — where babysitter-harness consumes agent-mux as a library, the babysitter adapter lets agent-mux consume babysitter as a target.

---

## 2. Why

- Users of agent-mux who want babysitter orchestration capabilities can target `babysitter` as an agent
- agent-mux TUI can display babysitter runs alongside other agents
- agent-mux session management can track babysitter sessions
- Remote invocation (Docker/SSH/K8s) of babysitter becomes possible via agent-mux's invocation modes

---

## 3. Adapter Implementation

### 3.1 File Location

```
packages/adapters/src/babysitter-adapter.ts
```

### 3.2 Adapter Class

```typescript
import { BaseAdapter } from './base-adapter';
import type { SpawnArgs, AgentCapabilities, ModelCapabilities, AgentConfig } from '@agent-mux/core';

export class BabysitterAdapter extends BaseAdapter {
  readonly agent = 'babysitter' as const;
  readonly displayName = 'Babysitter';
  readonly adapterType = 'subprocess' as const;

  readonly capabilities: AgentCapabilities = {
    agent: 'babysitter',
    canResume: true,
    canFork: false,
    supportsMultiTurn: true,
    sessionPersistence: 'file',
    supportsTextStreaming: true,
    supportsToolCallStreaming: false,
    supportsThinkingStreaming: false,
    supportsNativeTools: false,
    supportsMCP: true,
    supportsParallelToolCalls: false,
    requiresToolApproval: true,
    approvalModes: ['yolo', 'prompt'],
    runtimeHooks: { preToolUse: false, userPromptSubmit: false, notification: false },
    supportsThinking: false,
    thinkingEffortLevels: [],
    supportsThinkingBudgetTokens: false,
    supportsJsonMode: true,
    supportsStructuredOutput: false,
    structuredSessionTransport: 'persistent',
    sessionControlPlane: 'self-managed',
    supportsSkills: true,
    supportsAgentsMd: false,
    skillsFormat: 'directory',
    supportsSubagentDispatch: true,
    supportsParallelExecution: true,
    maxParallelTasks: 4,
    supportsInteractiveMode: true,
    supportsStdinInjection: true,
    supportsImageInput: false,
    supportsImageOutput: false,
    supportsFileAttachments: false,
    supportsPlugins: true,
    pluginFormats: ['directory'],
    pluginInstallCmd: 'babysitter plugin:install',
    pluginListCmd: 'babysitter plugin:list-installed',
    pluginUninstallCmd: 'babysitter plugin:uninstall',
    pluginMarketplaceUrl: undefined,
    pluginSearchCmd: undefined,
    pluginRegistries: [],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: ['api-key'],
    authFiles: [],
    installMethods: ['npm'],
  };

  readonly models: ModelCapabilities[] = [];
  // Babysitter delegates model selection to the underlying harness
  // Models are determined by the harness babysitter invokes, not babysitter itself

  readonly configSchema = {
    fields: [
      { key: 'defaultHarness', label: 'Default harness', type: 'string' as const, default: 'claude-code' },
      { key: 'maxIterations', label: 'Max iterations', type: 'number' as const, default: 256 },
      { key: 'runsDir', label: 'Runs directory', type: 'string' as const, default: '.a5c/runs' },
    ],
  };

  readonly hostEnvSignals = ['BABYSITTER_SESSION_ID', 'AGENT_SESSION_ID'] as const;
}
```

### 3.3 CLI Detection

```typescript
async detectInstallation(): Promise<InstallationInfo> {
  return this.probeCliVersion('babysitter', '--version');
}
```

### 3.4 Spawn Args

```typescript
async buildSpawnArgs(options: RunOptions): Promise<SpawnArgs> {
  const args: string[] = [];

  // Core command: invoke for single-shot, call for orchestrated
  if (options.maxTurns && options.maxTurns > 1) {
    args.push('call');
  } else {
    args.push('invoke');
  }

  // Harness selection
  const harness = options.env?.BABYSITTER_HARNESS || 'claude-code';
  args.push('--harness', harness);

  // Prompt
  args.push('--prompt', Array.isArray(options.prompt) ? options.prompt.join('\n') : options.prompt);

  // Workspace
  if (options.cwd) {
    args.push('--workspace', options.cwd);
  }

  // Model
  if (options.model) {
    args.push('--model', options.model);
  }

  // Session
  if (options.sessionId) {
    args.push('--run-id', options.sessionId);
  }

  // Non-interactive
  if (options.nonInteractive || options.approvalMode === 'yolo') {
    args.push('--non-interactive');
  }

  // Max iterations
  if (options.maxTurns) {
    args.push('--max-iterations', String(options.maxTurns));
  }

  // JSON output for structured event parsing
  args.push('--json');

  // Timeout
  const timeout = options.timeout || 120000;

  return {
    command: 'babysitter-agent',
    args,
    env: {
      ...options.env,
      AGENT_SESSION_ID: options.sessionId || '',
      BABYSITTER_MAX_ITERATIONS: String(options.maxTurns || 256),
    },
    cwd: options.cwd || process.cwd(),
    usePty: false,
    timeout,
  };
}
```

### 3.5 Event Parsing

babysitter-harness must output events in agent-mux JSONL format. The adapter parses each line:

```typescript
parseEvent(line: string, context: ParseContext): AgentEvent | null {
  try {
    const data = JSON.parse(line);

    // babysitter outputs structured JSON with a 'type' field
    // matching agent-mux event types
    if (data.type && data.runId) {
      return data as AgentEvent;
    }

    // Legacy format: babysitter-agent invoke output
    if (data.status === 'completed') {
      return {
        type: 'session_end',
        runId: context.runId,
        agent: 'babysitter',
        timestamp: new Date().toISOString(),
        exitReason: 'completed',
        cost: data.cost,
      };
    }

    return null;
  } catch {
    // Not JSON — treat as text output
    return {
      type: 'text_delta',
      runId: context.runId,
      agent: 'babysitter',
      timestamp: new Date().toISOString(),
      text: line + '\n',
    };
  }
}
```

### 3.6 Session Support

```typescript
sessionDir(cwd?: string): string {
  return path.join(cwd || process.cwd(), '.a5c', 'runs');
}

async parseSessionFile(filePath: string): Promise<Session> {
  // Parse babysitter run.json + journal
  const runJson = JSON.parse(await fs.readFile(filePath, 'utf-8'));
  return {
    agent: 'babysitter',
    sessionId: runJson.runId,
    unifiedId: `babysitter:${runJson.runId}`,
    title: runJson.prompt?.slice(0, 80) || 'Babysitter run',
    createdAt: new Date(runJson.createdAt),
    updatedAt: new Date(runJson.createdAt),
    turnCount: 0,
    messageCount: 0,
    model: runJson.model,
    tags: [runJson.processId],
    cwd: path.dirname(path.dirname(filePath)),
    messages: [],
  };
}

async listSessionFiles(cwd?: string): Promise<string[]> {
  const runsDir = path.join(cwd || process.cwd(), '.a5c', 'runs');
  if (!existsSync(runsDir)) return [];
  const entries = await fs.readdir(runsDir);
  return entries
    .map(e => path.join(runsDir, e, 'run.json'))
    .filter(f => existsSync(f));
}
```

### 3.7 Auth

```typescript
async detectAuth(): Promise<AuthState> {
  // Babysitter itself doesn't need auth — the underlying harness does
  // Check if babysitter CLI is available
  try {
    execSync('babysitter --version', { stdio: 'pipe' });
    return { state: 'valid', agent: 'babysitter' };
  } catch {
    return { state: 'missing', agent: 'babysitter', reason: 'babysitter CLI not found' };
  }
}

getAuthGuidance(): AuthSetupGuidance {
  return {
    agent: 'babysitter',
    steps: [
      { instruction: 'Install babysitter SDK', command: 'npm i -g @a5c-ai/babysitter-sdk' },
      { instruction: 'Configure the underlying harness auth (e.g., Claude, Codex)', command: 'babysitter harness:discover' },
    ],
  };
}
```

---

## 4. babysitter-harness Output Format

For agent-mux to parse babysitter output, babysitter-harness must support outputting agent-mux compatible JSONL events.

### 4.1 Output Mode Flag

```bash
# Standard babysitter output (existing)
babysitter-agent invoke --harness claude-code --prompt "..." --json

# Agent-mux compatible output (new)
babysitter-agent invoke --harness claude-code --prompt "..." --json --output-format amux-events
```

When `--output-format amux-events` is set, babysitter-harness outputs one `AgentEvent` JSON per line to stdout:

```jsonl
{"type":"session_start","runId":"run-123","agent":"babysitter","timestamp":"2026-04-19T12:00:00Z","sessionId":"sess-abc"}
{"type":"text_delta","runId":"run-123","agent":"babysitter","timestamp":"2026-04-19T12:00:01Z","text":"Analyzing the codebase..."}
{"type":"tool_call_start","runId":"run-123","agent":"babysitter","timestamp":"2026-04-19T12:00:02Z","toolCallId":"tc-1","toolName":"Read","input":{"file_path":"src/index.ts"}}
{"type":"tool_result","runId":"run-123","agent":"babysitter","timestamp":"2026-04-19T12:00:02Z","toolCallId":"tc-1","output":"...file contents..."}
{"type":"cost","runId":"run-123","agent":"babysitter","timestamp":"2026-04-19T12:00:05Z","inputTokens":1500,"outputTokens":800,"totalCost":0.02}
{"type":"session_end","runId":"run-123","agent":"babysitter","timestamp":"2026-04-19T12:00:10Z","exitReason":"completed"}
```

### 4.2 Event Mapping

babysitter-harness maps its internal events to agent-mux event types:

| babysitter internal | AgentEvent type |
|--------------------|-----------------|
| Run started | `session_start` |
| Agent text output | `text_delta` |
| Tool use (Read/Write/Bash/etc.) | `tool_call_start` → `tool_result` |
| File edit | `file_patch` |
| Shell command | `shell_start` → `shell_exit` |
| Cost update | `cost` |
| Approval needed | `approval_request` |
| User input needed | `input_required` |
| Error | `error` |
| Crash | `crash` |
| Run complete | `session_end` |
| Iteration boundary | `turn_end` → `turn_start` |

### 4.3 Interactive Mode (stdin)

When running interactively, the adapter can send responses via stdin:

```jsonl
{"type":"approval_response","interactionId":"int-1","decision":"approve"}
{"type":"input_response","interactionId":"int-2","text":"Yes, proceed with the migration"}
```

babysitter-harness reads these from stdin and routes to its governance/interaction layer.

---

## 5. Registration

### 5.1 Adapter Registration

In `packages/adapters/src/index.ts`:

```typescript
export { BabysitterAdapter } from './babysitter-adapter';
```

In `packages/core/src/adapter-registry.ts`, add to default adapters:

```typescript
import { BabysitterAdapter } from '@agent-mux/adapters';

const DEFAULT_ADAPTERS = [
  // ... existing adapters
  new BabysitterAdapter(),
];
```

### 5.2 CLI Usage

```bash
# Run babysitter via agent-mux
amux run --agent babysitter --prompt "Fix all lint errors" --env BABYSITTER_HARNESS=claude-code

# List babysitter sessions
amux sessions --agent babysitter

# Resume a babysitter run
amux run --agent babysitter --session-id run-123

# Run babysitter in Docker
amux run --agent babysitter --prompt "..." --invocation docker --image babysitter:latest
```

### 5.3 TUI Integration

When running babysitter through agent-mux TUI:

```bash
amux tui --agent babysitter
```

The TUI displays babysitter events using the standard agent-mux event renderers. babysitter-specific information (iteration count, pending effects, governance decisions) can be displayed via babysitter TUI plugins if installed.

---

## 6. Gaps in agent-mux That Need Filling

### 6.1 Multi-Turn Orchestration Awareness

agent-mux's `maxTurns` is a simple counter. babysitter's orchestration model is richer (journal-based, effect-driven, quality-gated). The adapter should:

- Map `maxTurns` → `BABYSITTER_MAX_ITERATIONS`
- Emit `turn_start`/`turn_end` events at iteration boundaries
- Not interfere with babysitter's own stop-hook logic

### 6.2 Process Library / Skill Discovery

When targeting babysitter, agent-mux's skill discovery should delegate to babysitter:

```bash
amux skills --agent babysitter
# → calls: babysitter skill:discover --json
```

### 6.3 Run State Introspection

agent-mux sessions are message-based. babysitter runs are journal-based. The adapter's `parseSessionFile()` should:

- Read `run.json` for metadata
- Read journal events for message history
- Compute cost from journal entries
- Map to `SessionMessage[]` format

---

## 7. Testing

### 7.1 Unit Tests

```
packages/adapters/src/__tests__/babysitter-adapter.test.ts
```

- Test `buildSpawnArgs` with various RunOptions
- Test `parseEvent` with babysitter JSONL output
- Test `parseSessionFile` with real run.json
- Test `detectAuth` with/without babysitter CLI
- Test capability declaration

### 7.2 Integration Tests

- Spawn real babysitter CLI (if available)
- Verify event stream parses correctly
- Verify session listing works
- Verify interactive mode (approval/input)
