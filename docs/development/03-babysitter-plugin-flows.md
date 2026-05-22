# Babysitter Plugin Architecture

How the babysitter orchestration system works across coding agent harnesses, from plugin generation through session lifecycle to run completion.

## Table of Contents

1. [System Overview](#system-overview)
2. [The Three Muxes](#the-three-muxes)
3. [Plugin Generation](#plugin-generation)
4. [Activation Modes](#activation-modes)
5. [Session Lifecycle](#session-lifecycle)
6. [Run Orchestration](#run-orchestration)
7. [Harness-Specific Flows](#harness-specific-flows)

---

## System Overview

The babysitter plugin installs into any supported coding agent (Claude Code, Codex, Pi, Gemini CLI, etc.) and provides orchestrated process execution. Three "mux" layers compensate for the differences between harnesses:

```mermaid
graph TB
    subgraph "User Layer"
        USER["Developer"]
        USER -->|"/babysitter:call task"| HARNESS
    end

    subgraph "Harness Layer"
        HARNESS["Coding Agent<br/>(Claude Code, Codex, Pi, ...)"]
        HARNESS -->|"native hooks"| HM["hooks-mux"]
        HARNESS -->|"API calls"| TM["transport-mux"]
        HARNESS -->|"skill invocation"| SDK["babysitter SDK"]
    end

    subgraph "Mux Layer"
        HM -->|"canonical events"| SDK
        TM -->|"normalized protocol"| UPSTREAM["Any Provider<br/>(Anthropic, OpenAI, Google, Azure)"]
        AM["agent-mux"] -->|"launch + proxy"| HARNESS
    end

    subgraph "Orchestration Layer"
        SDK -->|"run:iterate"| PROCESS["Process Definition"]
        PROCESS -->|"effects"| SDK
        SDK -->|"tasks"| HARNESS
    end
```

Each layer solves a specific interoperability problem:

| Mux | Problem | Solution |
|-----|---------|----------|
| **hooks-mux** | Each harness has different hook event names, payloads, output formats | Normalizes native events to canonical phases, runs unified handlers, renders results back to harness format |
| **transport-mux** | Harnesses speak different API protocols (Anthropic, OpenAI, Google) | HTTP proxy translates between the harness's native protocol and any upstream provider |
| **agent-mux** | Harnesses have different CLI surfaces, capabilities, plugin loading | Unified `amux launch` resolves provider config, starts proxy if needed, spawns harness with correct args |

---

## The Three Muxes

### hooks-mux: Hook Surface Normalization

Each harness fires lifecycle hooks differently. hooks-mux normalizes them into a canonical interface:

```mermaid
graph LR
    subgraph "Native Hook Surfaces"
        CC["Claude Code<br/>shell hooks via hooks.json"]
        CX["Codex<br/>shell hooks via config.toml"]
        PI["Pi<br/>in-process programmatic hooks"]
        GC["Gemini CLI<br/>shell hooks"]
    end

    subgraph "hooks-mux"
        AC["adapter-claude<br/>normalizer.ts"]
        AX["adapter-codex<br/>normalizer.ts"]
        AP["adapter-pi<br/>normalizer.ts"]
        AG["adapter-gemini<br/>normalizer.ts"]
        CORE["core engine<br/>normalize → run handlers → merge → propagate"]
    end

    CC --> AC --> CORE
    CX --> AX --> CORE
    PI --> AP --> CORE
    GC --> AG --> CORE

    CORE --> |"UnifiedHookEvent"| HANDLERS["babysitter hook handlers"]
```

**Adapter families:**
- **shell-hook** (Claude Code, Codex, Cursor, Gemini CLI): Hook handlers are shell scripts invoked via subprocess. stdin receives JSON event, stdout returns JSON result.
- **programmatic** (Pi, OpenCode): Hook handlers are in-process functions. No subprocess overhead.

**Canonical phases:** `sessionStart`, `stop`, `sessionEnd`, `preToolUse`, `postToolUse`, `userPromptSubmit`, `notification`, `preCompact`, `beforePromptBuild`

Each adapter maps native event names → canonical phases via `mappings.ts` sourced from the atlas graph.

### transport-mux: Provider Protocol Bridge

When a harness needs to talk to a provider it doesn't support natively, transport-mux runs as a local HTTP proxy:

```mermaid
graph LR
    subgraph "Harness speaks Anthropic"
        CC["Claude Code"]
    end

    subgraph "transport-mux proxy"
        SERVER["HTTP Server<br/>/v1/messages"]
        DECODE["Decode Anthropic request<br/>Extract messages, tools, rawContent"]
        ENGINE["Completion Engine"]
        ENCODE["Encode Anthropic response<br/>Render tool_use blocks, input_json_delta"]
    end

    subgraph "Upstream speaks OpenAI"
        FOUNDRY["Azure Foundry"]
    end

    CC -->|"POST /v1/messages<br/>(Anthropic format)"| SERVER
    SERVER --> DECODE
    DECODE -->|"CompletionRequest"| ENGINE
    ENGINE -->|"translateMessagesToOpenAi()"| FOUNDRY
    FOUNDRY -->|"SSE delta.tool_calls"| ENGINE
    ENGINE -->|"CompletionStreamEvent"| ENCODE
    ENCODE -->|"SSE content_block_start(tool_use)"| CC
```

**Engines:**
- `createOpenAICompletionEngine()` — Foundry/Azure path. Handles `input_schema → parameters` tool normalization, streaming `delta.tool_calls` accumulation, `tool_result → role:"tool"` message translation.
- `createGoogleCompletionEngine()` — Vertex/Gemini path. Handles `functionCall/functionResponse` translation, `thoughtSignature` server-side store for multi-turn preservation.

**When proxy is needed:** Determined by `translateForHarness()` — if the harness adapter declares `proxyRequired: true` for a given provider, transport-mux bridges the gap.

### agent-mux: Unified Launch Surface

`amux launch` resolves provider config, decides if a proxy is needed, prepares harness automation state, and spawns the harness:

```mermaid
sequenceDiagram
    participant U as User / CI
    participant AM as amux launch
    participant CAT as agent-catalog
    participant TM as transport-mux
    participant H as Harness

    U->>AM: amux launch claude foundry --model gpt-5.5
    AM->>AM: resolveProvider(foundry) → ProviderConfig
    AM->>AM: translateForHarness(claude, config) → proxyRequired=true
    AM->>CAT: getBridgeCapabilities(claude)
    AM->>TM: startTransportMuxRuntime({exposedTransport: anthropic})
    TM-->>AM: { url, authToken }
    AM->>AM: applyHarnessEnv() → ANTHROPIC_BASE_URL=proxy
    AM->>AM: prepareClaudeAutomationState() → pre-approve API key, onboarding
    AM->>H: spawn("claude", ["-p", prompt, "--max-turns", "15"])
```

---

## Plugin Generation

`npm run generate:plugins` compiles unified plugin source into harness-specific distributions via the `extension-mux` compiler:

```mermaid
graph TB
    UPF["Unified Plugin Source<br/>(skills, hooks, commands)"] --> COMPILER["extension-mux compiler"]

    COMPILER --> CC_OUT["artifacts/generated-plugins/claude-code/<br/>plugin.json + hooks.json + *.sh scripts"]
    COMPILER --> CX_OUT["artifacts/generated-plugins/codex/<br/>config + shell hooks"]
    COMPILER --> PI_OUT["artifacts/generated-plugins/pi/<br/>package.json + extensions"]
    COMPILER --> GC_OUT["artifacts/generated-plugins/gemini/<br/>hooks + config"]
```

**Per-harness output structure:**

| Harness | Plugin Format | Hook Mechanism |
|---------|---------------|----------------|
| Claude Code | `plugin.json` + `hooks/hooks.json` + shell scripts | Shell hooks: `babysitter-proxied-session-start.sh` → `a5c-hooks-mux invoke --adapter claude` |
| Codex | `config.toml` hooks section | Shell hooks via config registration |
| Pi | `package.json` with `pi.extensions` | In-process programmatic hooks |
| Gemini CLI | Gemini-native hook config | Shell hooks via adapter |

**Installation:**
- Claude Code: `claude plugin marketplace add a5c-ai/babysitter-claude && claude plugin install --scope project babysitter@a5c.ai`
- Others: `babysitter harness:install-plugin <harness> --workspace <cwd>`

---

## Activation Modes

The babysitter plugin activates differently depending on how the harness is launched:

### Hook-Driven (Interactive)

The harness runs interactively with native hook support. Hooks drive the orchestration loop — the stop hook decides whether to continue or yield.

```mermaid
sequenceDiagram
    participant U as User
    participant CC as Claude Code (interactive)
    participant HM as hooks-mux
    participant SDK as babysitter SDK

    U->>CC: /babysitter:call "build a REST API"
    Note over CC: Skill loads, calls instructions:babysit-skill
    CC->>SDK: babysitter instructions:babysit-skill --harness claude-code --interactive
    SDK-->>CC: Full orchestration instructions (hookDriven=true)

    Note over CC: Agent interviews user, builds process, calls run:create
    CC->>SDK: babysitter run:create --process-id my-api --entry process.mjs#process --harness claude-code
    SDK-->>CC: { runId, runDir }

    loop Orchestration loop (driven by stop hook)
        CC->>SDK: babysitter run:iterate <runDir>
        SDK-->>CC: { status: "waiting", effects: [{kind: "agent", prompt: "..."}] }
        CC->>CC: Execute effect (write code, run tests, etc.)
        CC->>SDK: babysitter task:post --effect-id <id> --result-file result.json

        Note over CC: Claude Code turn ends, fires Stop hook
        CC->>HM: Stop hook (native)
        HM->>SDK: Check run state, pending effects
        SDK-->>HM: { needsMoreIterations: true }
        HM-->>CC: { decision: "block", systemMessage: "Continue orchestration..." }
        Note over CC: Claude Code continues (doesn't yield to user)
    end

    CC->>SDK: run:iterate → { status: "completed", completionProof: "..." }
    CC->>HM: Stop hook
    HM-->>CC: { decision: "allow" }
    CC-->>U: "Run completed successfully"
```

**Key: `hookDriven=true`** — The stop hook controls the loop. When the agent finishes a turn, Claude Code fires the stop hook. The hook checks if the babysitter run needs more iterations and returns `decision: "block"` (continue) or `"allow"` (stop).

### Agent-Driven (Non-Interactive)

The harness runs headless with `-p` or `exec`. No native hooks fire. The agent drives the loop in-turn by calling `run:iterate` repeatedly.

```mermaid
sequenceDiagram
    participant AM as amux launch
    participant CC as Claude Code (-p mode)
    participant SDK as babysitter SDK

    AM->>CC: spawn("claude", ["-p", "/babysitter:yolo build a REST API"])
    Note over CC: Skill loads, calls instructions:babysit-skill
    CC->>SDK: babysitter instructions:babysit-skill --harness claude-code --no-interactive
    SDK-->>CC: Full orchestration instructions (hookDriven=false)

    Note over CC: Agent parses prompt, researches repo, builds process
    CC->>SDK: babysitter run:create --process-id my-api --entry process.mjs#process
    SDK-->>CC: { runId, runDir }

    loop Agent-driven loop (no hooks)
        CC->>SDK: babysitter run:iterate <runDir>
        SDK-->>CC: { status: "waiting", effects: [...] }
        CC->>CC: Execute effects
        CC->>SDK: babysitter task:post --effect-id <id> --result-file result.json
        Note over CC: Agent decides to continue (no stop hook)
    end

    CC->>SDK: run:iterate → { status: "completed", completionProof: "..." }
    CC-->>AM: exit 0
```

**Key: `hookDriven=false`** — The agent owns the loop. It calls `run:iterate`, executes effects, posts results, and loops until completion. No hooks needed.

### Bridge-Hooks (Emulated)

When the harness is non-interactive but the babysitter lifecycle needs hooks, `amux launch --bridge-hooks` emulates them via CLI calls:

```mermaid
sequenceDiagram
    participant AM as amux launch
    participant BHE as BridgeHookEmulator
    participant CC as Claude Code (-p mode)
    participant SDK as babysitter SDK

    AM->>BHE: emulateSessionStart()
    BHE->>SDK: babysitter hook:run --hook-type session-start
    SDK-->>BHE: Session initialized

    AM->>CC: spawn with prompt
    CC->>CC: Agent executes (run:iterate loop)
    CC-->>AM: exit

    AM->>BHE: emulateStop()
    BHE->>SDK: babysitter run:status <runDir>
    SDK-->>BHE: { shouldContinue: true, resumeId }

    AM->>CC: respawn with --resume <resumeId>
    CC-->>AM: exit

    AM->>BHE: emulateStop()
    BHE->>SDK: { shouldContinue: false }
    AM->>BHE: emulateSessionEnd()
```

### Bridge-Interactive (PTY Bridge)

The harness runs interactively via PTY but presents structured NDJSON output externally. Used when the harness needs TTY for tool use but the caller wants machine-readable output:

```mermaid
sequenceDiagram
    participant AM as amux launch
    participant PTY as node-pty
    participant CC as Claude Code (interactive, TTY)
    participant HM as hooks-mux (native)

    AM->>PTY: spawn("claude", ["--bare", ...])
    PTY-->>AM: onData: ANSI welcome screen
    AM->>AM: Auto-respond to onboarding prompts
    AM->>PTY: write(prompt + '\r')
    
    CC->>HM: SessionStart hook (native, from plugin)
    Note over CC: Full interactive session with native hooks
    
    PTY-->>AM: onData: ANSI output
    AM->>AM: Strip ANSI → feed to adapter.parseEvent()
    AM->>AM: Emit NDJSON bridge events to stdout
    
    Note over AM: Turn detection via message_stop/turn_end events
    
    CC-->>PTY: Process exits
    PTY-->>AM: onExit → flush final output event
```

---

## Session Lifecycle

### The `instructions:babysit-skill` Command

When the babysitter skill activates (via `/babysitter:call` or equivalent), it first calls `instructions:babysit-skill` to get orchestration guidance:

```mermaid
sequenceDiagram
    participant SKILL as babysitter:call skill
    participant SDK as babysitter CLI
    participant STATE as Session State
    participant GRAPH as atlas graph

    SKILL->>SDK: instructions:babysit-skill --harness claude-code --interactive
    SDK->>STATE: Check existing session/run state
    SDK->>GRAPH: Query library processes for active context
    SDK->>SDK: Compose prompt strata:<br/>1. Non-negotiables<br/>2. Dependencies<br/>3. Interview phase<br/>4. Process creation<br/>5. Run creation<br/>6. Iteration loop<br/>7. Effect execution<br/>8. Breakpoint handling<br/>9. Completion proof
    SDK-->>SKILL: Full orchestration instructions<br/>(hookDriven, existing runs, library suggestions)
```

**Context detection:**
- CI vs local, trigger type, repo info
- Existing session state from `~/.a5c/state/hooks/sessions/`
- Active run state from `.a5c/runs/`
- Library process suggestions matching active capabilities

### Stop Hook Decision Logic

The stop hook is the key control point in hook-driven mode:

```mermaid
flowchart TD
    STOP["Stop hook fires"] --> READ["Read session state<br/>~/.a5c/state/.../session.json"]
    READ --> ACTIVE{"session.active?"}
    ACTIVE -->|No| ALLOW["decision: allow<br/>(session not active)"]
    ACTIVE -->|Yes| MAXITER{"iteration >= maxIterations?"}
    MAXITER -->|Yes| ALLOW2["decision: allow<br/>(max iterations reached)"]
    MAXITER -->|No| RUNSTATE["Load run state from journal"]
    RUNSTATE --> COMPLETED{"run completed?"}
    COMPLETED -->|Yes| ALLOW3["decision: allow<br/>(run finished)"]
    COMPLETED -->|No| PENDING{"pending effects?"}
    PENDING -->|Yes| BLOCK["decision: block<br/>systemMessage: 'Continue with run:iterate'"]
    PENDING -->|No| BLOCK2["decision: block<br/>systemMessage: 'Call run:iterate to advance'"]
```

---

## Run Orchestration

### Run Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: run:create
    Created --> Iterating: run:iterate
    Iterating --> Waiting: effects requested
    Waiting --> Executing: agent executes effect
    Executing --> Resolved: task:post
    Resolved --> Iterating: run:iterate (next step)
    Iterating --> Completed: process returns output
    Iterating --> Failed: process throws error
    Completed --> [*]
    Failed --> [*]
```

### Effect Types

Processes emit effects via `ctx.task()`:

| Effect Kind | Executed By | Example |
|-------------|-------------|---------|
| `agent` | The coding agent (Claude Code, Codex, etc.) | "Write unit tests for the API module" |
| `skill` | A babysitter skill | "Run the TDD triplet skill" |
| `shell` | Direct shell command | "npm test", "git commit", "eslint --fix" |

### Journal Event Flow

Every state change is recorded in the run journal (`.a5c/runs/<runId>/journal/`):

```
RUN_CREATED → EFFECT_REQUESTED → EFFECT_RESOLVED → EFFECT_REQUESTED → EFFECT_RESOLVED → RUN_COMPLETED
```

The replay engine reconstructs state from journal events, enabling resumption after crashes or session switches.

---

## Harness-Specific Flows

### Claude Code

```mermaid
sequenceDiagram
    participant U as User
    participant CC as Claude Code
    participant PLUGIN as babysitter plugin (installed)
    participant HM as hooks-mux (claude adapter)
    participant SDK as babysitter CLI
    participant TM as transport-mux (if proxying)
    participant LLM as Upstream LLM

    U->>CC: /babysitter:call "implement user auth"
    CC->>SDK: instructions:babysit-skill --harness claude-code --interactive
    SDK-->>CC: Orchestration prompt (hookDriven=true)

    Note over CC: Interview → Process creation → run:create
    CC->>SDK: run:create --process-id auth-impl --harness claude-code
    SDK-->>CC: { runId }

    CC->>SDK: run:iterate <runDir>
    SDK-->>CC: { effects: [{kind: "agent", prompt: "Write auth middleware"}] }
    
    CC->>TM: API call (if provider needs proxy)
    TM->>LLM: Translated request
    LLM-->>TM: Response with tool_calls
    TM-->>CC: Translated response (tool_use blocks)
    
    CC->>CC: Execute: Write auth/middleware.ts
    CC->>SDK: task:post --effect-id <id>
    
    Note over CC: Turn ends
    CC->>PLUGIN: Stop hook fires (native)
    PLUGIN->>HM: a5c-hooks-mux invoke --adapter claude
    HM->>SDK: babysitter hook:run --hook-type stop
    SDK-->>HM: { decision: "block", systemMessage: "Continue..." }
    HM-->>PLUGIN: { block: true }
    PLUGIN-->>CC: Continue session

    CC->>SDK: run:iterate → { status: "completed" }
    CC->>PLUGIN: Stop hook
    HM-->>CC: { decision: "allow" }
    CC-->>U: "Auth implementation complete"
```

### Codex

```mermaid
sequenceDiagram
    participant AM as amux launch
    participant CX as Codex (exec mode)
    participant SDK as babysitter CLI
    participant TM as transport-mux (if proxying)

    AM->>CX: spawn("codex", ["exec", "$babysitter:yolo implement auth"])
    
    Note over CX: Skill loads, hookDriven=false (exec mode)
    CX->>SDK: instructions:babysit-skill --harness codex --no-interactive
    SDK-->>CX: Orchestration prompt (hookDriven=false)

    CX->>SDK: run:create --process-id auth-impl
    
    loop Agent-driven loop
        CX->>SDK: run:iterate
        SDK-->>CX: { effects }
        CX->>CX: Execute effects (tools)
        CX->>SDK: task:post
    end

    CX->>SDK: run:iterate → { completed, completionProof }
    CX-->>AM: exit 0
```

### Pi

```mermaid
sequenceDiagram
    participant AM as amux launch
    participant PI as Pi (--prompt mode)
    participant SDK as babysitter CLI
    participant TM as transport-mux proxy

    Note over AM: Pi needs proxy (doesn't speak Foundry natively)
    AM->>TM: startTransportMuxRuntime()
    AM->>AM: Write models.json to ~/.pi/agent/<br/>(Pi ignores env vars, reads config file)
    AM->>PI: spawn("pi", ["--prompt", "Invoke babysitter:yolo..."])

    PI->>TM: API calls (OpenAI format via models.json provider)
    TM->>TM: Translate OpenAI → upstream
    
    Note over PI: hookDriven=false, agent drives loop
    PI->>SDK: run:create, iterate, post loop
    
    PI-->>AM: (idle — Pi doesn't exit after task)
    Note over AM: Idle timeout (30s) kills process
```

---

## Provider Path Details

When a harness speaks a different protocol than the upstream provider, transport-mux bridges the gap:

```mermaid
graph TB
    subgraph "Harness Protocol"
        ANT["Anthropic<br/>(Claude Code)"]
        OAI["OpenAI<br/>(Codex)"]
        OAI2["OpenAI<br/>(Pi via models.json)"]
    end

    subgraph "transport-mux"
        P1["Proxy: Anthropic → OpenAI"]
        P2["Proxy: Anthropic → Google"]
        P3["Pass-through (no proxy needed)"]
    end

    subgraph "Upstream Provider"
        FOUNDRY["Azure Foundry<br/>(OpenAI protocol)"]
        VERTEX["Vertex AI<br/>(Google protocol)"]
    end

    ANT -->|"Claude + Foundry"| P1 --> FOUNDRY
    ANT -->|"Claude + Google"| P2 --> VERTEX
    OAI -->|"Codex + Foundry"| P3 --> FOUNDRY
    OAI2 -->|"Pi + Foundry"| P1 --> FOUNDRY
```

**Message translation details:**

| Direction | From | To | Key Translation |
|-----------|------|----|-----------------|
| Request | Anthropic `tool_use` | OpenAI `role:"assistant"` + `tool_calls` | `input` → `arguments`, `id` → `tool_call_id` |
| Request | Anthropic `tool_result` | OpenAI `role:"tool"` | `tool_use_id` → `tool_call_id`, `content` → `content` |
| Request | Anthropic `tool_use` | Google `functionCall` | `input` → `args`, `thoughtSignature` from server-side store |
| Request | Anthropic `tool_result` | Google `functionResponse` | `tool_use_id` → name lookup via `toolIdToName` map |
| Response | OpenAI `delta.tool_calls` | Anthropic `tool_use` stream | Accumulate chunks → `content_block_start` + `input_json_delta` |
| Response | Google `functionCall` | Anthropic `tool_use` stream | Extract `thoughtSignature` → store server-side |
