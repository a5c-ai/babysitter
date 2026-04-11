# Paperclip AI Integration Guide

This guide covers integrating Babysitter's deterministic orchestration with
Paperclip AI, including the delegating adapter architecture that distinguishes
Paperclip from other supported harnesses.

## Prerequisites

- Node.js >= 18
- Babysitter SDK CLI installed globally (`npm install -g @a5c-ai/babysitter-sdk`)
- Paperclip AI platform with plugin support (Plugin SDK >= 0.1.0)
- At least one underlying AI harness CLI available (Claude Code, Codex, Gemini
  CLI, Cursor, etc.)

## How Paperclip Differs from Other Harnesses

Most babysitter harness integrations (Claude Code, Codex, Gemini CLI) are
**direct adapters** -- they integrate with a single AI CLI and communicate
through that CLI's native hook/skill/extension surface.

Paperclip is a **meta-harness**. It wraps multiple AI harnesses behind a
unified agent management platform. A single Paperclip workspace may run agents
backed by Claude Code, Codex, Gemini CLI, or Cursor simultaneously. This
creates a unique challenge: the babysitter plugin must detect which underlying
harness each agent uses and delegate adapter operations accordingly.

### Direct Adapter (e.g., Claude Code)

```
User -> Claude Code -> babysitter hooks/skills -> babysitter CLI
```

### Delegating Adapter (Paperclip)

```
User -> Paperclip -> Agent (adapterType: claude_local) -> Plugin worker
                                                              |
                                                              v
                                                      detectHarness()
                                                              |
                                                              v
                                                      babysitter CLI
                                                    (as claude-code adapter)
```

## Delegating Adapter Architecture

The delegating adapter (`src/delegating-adapter.ts`) resolves the underlying
harness through three tiers, evaluated in order:

### Tier 1: Agent Metadata (High Confidence)

Reads the `adapterType` field from the Paperclip agent configuration and maps
it to a babysitter harness name:

| Paperclip `adapterType` | Babysitter Harness |
|--------------------------|--------------------|
| `claude_local` | `claude-code` |
| `codex_local` | `codex` |
| `gemini_local` | `gemini-cli` |
| `cursor_local` | `cursor` |
| `github_copilot` | `github-copilot` |
| `opencode_local` | `opencode` |
| `pi_local` | `pi` |
| `omp_local` | `oh-my-pi` |

This tier requires no runtime probing and provides deterministic mapping.

### Tier 2: Environment Variable Probing (Medium Confidence)

When agent metadata is unavailable or the `adapterType` is not in the known
map, the adapter checks environment variables for harness signatures:

- `CLAUDE_CODE_SESSION` or `CLAUDE_CODE_ENTRYPOINT` -> `claude-code`
- `CODEX_SESSION` or `CODEX_HOME` -> `codex`
- `GEMINI_CLI_SESSION` or `GOOGLE_GENAI_API_KEY` -> `gemini-cli`
- `CURSOR_SESSION` -> `cursor`

### Tier 3: Plugin Config Fallback (Medium Confidence)

Falls back to the `defaultHarness` plugin setting. If no setting is configured,
defaults to `claude-code` with low confidence.

The detection result includes `harnessName`, `detectionTier`, and `confidence`
fields, which are logged and stored in plugin state for diagnostics.

## Step-by-Step Setup

### 1. Install the Babysitter SDK

```bash
npm install -g @a5c-ai/babysitter-sdk
babysitter version
```

### 2. Build the Plugin

From the monorepo root:

```bash
npm install
npm run build --workspace=@a5c-ai/babysitter-paperclip
```

### 3. Register in Paperclip

Add the plugin to your Paperclip workspace configuration. The exact mechanism
depends on your Paperclip deployment, but typically involves pointing to the
plugin's `dist/` directory or publishing the package.

### 4. Configure Settings

Through Paperclip's plugin settings UI, configure:

- **runsDir** -- Where babysitter stores run data (default: `.a5c/runs`)
- **autoIterate** -- Whether to automatically iterate after breakpoint
  resolution (default: `true`)
- **maxIterations** -- Safety limit on orchestration iterations (default: `256`)
- **breakpointTimeout** -- How long to wait for breakpoint approval (default:
  1 hour)

### 5. Verify

Check that the plugin loads correctly:

1. Open the Paperclip dashboard -- the "Babysitter Runs" widget should appear
2. Start an agent run -- the worker should log harness detection results
3. If a process requests a breakpoint, the approval form should appear in the
   Run Detail tab

## UI Slot Reference

The plugin registers three UI components through Paperclip's slot system:

### Dashboard Widget: `babysitter-dashboard`

- **Component**: `BabysitterDashboard`
- **Location**: Main dashboard
- **Shows**: List of active runs, pending breakpoint badge count, total run
  count
- **Data source**: `runs-overview` data handler

### Detail Tab: `babysitter-run-detail`

- **Component**: `RunDetailTab`
- **Location**: Agent detail view (scoped to `agent` entity type)
- **Shows**: Journal event timeline, pending effects list, breakpoint
  approval/rejection forms
- **Data source**: `run-detail` data handler
- **Actions**: `approve-breakpoint`, `reject-breakpoint`

### Sidebar Panel: `babysitter-sidebar`

- **Component**: `BabysitterSidebar`
- **Location**: Global sidebar
- **Shows**: Compact status summary of active runs and pending breakpoints

## Known Limitations

1. **CLI process boundary** -- All babysitter operations shell out to the
   `babysitter` CLI rather than importing SDK functions directly. This provides
   clean isolation but adds per-operation overhead (~50-200ms per CLI call).

2. **Single-workspace scoping** -- The plugin operates within one `runsDir` at
   a time. Multi-workspace setups require separate plugin instances or a shared
   runs directory.

3. **Environment probing race conditions** -- Tier 2 detection reads
   environment variables at the time `agent.run.started` fires. If the harness
   CLI sets its environment variables after the agent starts, detection may
   fall through to Tier 3.

4. **No direct harness hook integration** -- Unlike the native Claude Code or
   Codex plugins, the Paperclip plugin does not install hooks into the
   underlying harness CLI. It relies on Paperclip's event bus for lifecycle
   management. This means harness-specific hook features (e.g., Claude Code's
   `PreToolUse` hooks) are not available through this integration.

5. **Breakpoint timeout is plugin-side only** -- The `breakpointTimeout`
   setting controls the UI timeout. The underlying babysitter run does not
   enforce this timeout; the run will remain in a waiting state indefinitely
   until the effect is resolved or the run is manually failed.

6. **Stream reconnection** -- The `subscribe-run-events` stream does not
   automatically reconnect if the Paperclip platform restarts. Clients must
   re-subscribe to resume event streaming.
