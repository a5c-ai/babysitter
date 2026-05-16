# @a5c-ai/triggers

Trigger glue for running any coding agent from CI. Normalizes GitHub, GitLab, Bitbucket, and generic webhook payloads into one event shape, enriches GitHub events with changed files and optional diffs, and evaluates compact trigger queries before launching agent-mux.

## CLI

```bash
triggers evaluate --backend github --query "event:issue_comment text:@develop-this path:packages/agent-mux/**"
triggers enrich --backend github --include-diff --output event.json
```

## GitHub Action

The reusable action at `packages/triggers/action.yml` supports all harnesses, providers, and invocation modes.

### Quick Start

```yaml
- uses: a5c-ai/babysitter/packages/triggers@main
  with:
    harness: claude
    provider: foundry
    model: gpt-5.5
    prompt: Review this PR for bugs and style issues
  env:
    AZURE_API_KEY: ${{ secrets.AZURE_OPENAI_API_KEY }}
    AMUX_API_BASE: ${{ vars.AZURE_OPENAI_ENDPOINT }}
```

## Supported Harnesses

| Harness | `harness:` value | Provider examples | Notes |
|---------|-----------------|-------------------|-------|
| Claude Code | `claude` | foundry, google, anthropic | Full bridge support |
| Codex | `codex` | foundry | Native OpenAI support |
| Pi | `pi` | foundry | Proxy via models.json |
| Gemini CLI | `gemini` | google, foundry | Needs `GEMINI_CLI_TRUST_WORKSPACE` (auto-set) |
| Copilot CLI | `copilot` | foundry | Via `gh extension` |
| Cursor | `cursor` | foundry | Manual install |
| OpenCode | `opencode` | foundry, anthropic | Multiple install methods |
| Hermes | `hermes` | foundry | NousResearch agent |

## Invocation Modes

Set `interaction-mode` to control how the harness runs in CI:

| Mode | Flag | Description | Use case |
|------|------|-------------|----------|
| `non-interactive` | `--no-interactive` | Plain NI — harness runs with `-p` / `exec` | Simple one-shot tasks |
| `bridged-hooks` | `--no-interactive --bridge-hooks` | NI + emulated babysitter lifecycle hooks | Babysitter-plugin orchestrated tasks |
| `bridged-interactive` | `--no-interactive --bridge-interactive` | NI externally, interactive via PTY internally | Tool-heavy tasks needing full harness capabilities |

### When to use each mode

- **`non-interactive`** (default) — fastest, simplest. The harness gets a prompt, does the work, exits. Good for single-task automation.
- **`bridged-hooks`** — use with `babysitter-plugin: true`. The BridgeHookEmulator wraps the harness execution with session-start/stop/end hooks, enabling the babysitter orchestration lifecycle.
- **`bridged-interactive`** — spawns the harness via PTY for full interactive capabilities (tool use, multi-turn) while presenting structured NDJSON output externally. Use when the harness needs TTY features but you want machine-readable output.

## Babysitter Plugin

Set `babysitter-plugin: true` to install the babysitter plugin before running:

```yaml
- uses: a5c-ai/babysitter/packages/triggers@main
  with:
    harness: claude
    provider: foundry
    model: gpt-5.5
    interaction-mode: bridged-hooks
    babysitter-plugin: 'true'
    babysitter-prompt-prefix: '/babysitter:yolo'
    prompt: Implement the feature described in the issue
    process-file: .a5c/processes/feature-impl.mjs
```

The action will:
1. Install the harness CLI
2. Generate per-harness plugins (`npm run generate:plugins`)
3. Install the babysitter SDK globally
4. Install the babysitter plugin into the harness (`babysitter harness:install-plugin`)
5. Copy the process file to `.a5c/processes/` (if provided)
6. Launch with the appropriate bridge flags

### Babysitter prompt prefixes

Each harness uses a different prefix to invoke the babysitter skill:

| Harness | Prefix |
|---------|--------|
| Claude Code | `/babysitter:yolo` |
| Codex | `$babysitter:yolo` |
| Others | `Invoke the babysitter:yolo command to:` |

## Provider Configuration

The action uses `amux launch` which handles provider resolution and proxy setup automatically. Set credentials via environment variables:

### Azure Foundry (OpenAI)
```yaml
env:
  AZURE_API_KEY: ${{ secrets.AZURE_OPENAI_API_KEY }}
  AMUX_API_BASE: https://your-resource.services.ai.azure.com
```

### Google / Vertex AI
```yaml
env:
  GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
  GOOGLE_CLOUD_PROJECT: ${{ secrets.GOOGLE_CLOUD_PROJECT }}
  GOOGLE_GENAI_USE_VERTEXAI: 'true'
```

### Anthropic (direct)
```yaml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Trigger Queries

Filter which events trigger the agent using `trigger-query`:

```yaml
trigger-query: |
  event: pull_request
  action: [opened, synchronize]
  paths: src/**/*.ts
  labels: needs-review
```

### Query fields

| Field | Description | Example |
|-------|-------------|---------|
| `event` | GitHub event name | `push`, `pull_request`, `issues` |
| `action` | Event action | `opened`, `synchronize`, `created` |
| `text` | Match text in title/body | `@develop-this`, `fix:` |
| `diff` | Match text in diff patches | `TODO`, `FIXME` |
| `paths` | Match changed file paths | `src/**/*.ts`, `packages/sdk/**` |
| `branch` | Match target branch | `main`, `release/*` |
| `labels` | Match issue/PR labels | `bug`, `needs-review` |

## Inputs Reference

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `harness` | **yes** | — | Coding agent to use |
| `provider` | no | — | Model provider |
| `model` | no | — | Model name |
| `prompt` | no | — | Task prompt |
| `interaction-mode` | no | `non-interactive` | NI mode variant |
| `max-turns` | no | `15` | Max model turns |
| `with-proxy` | no | `true` | Start proxy if needed |
| `babysitter-plugin` | no | `false` | Install babysitter plugin |
| `process-file` | no | — | Babysitter process definition |
| `babysitter-prompt-prefix` | no | — | Skill invocation prefix |
| `trigger-backend` | no | `github` | Event backend |
| `trigger-query` | no | — | Event filter query |
| `include-diff` | no | `true` | Include diffs in enrichment |
| `github-token` | no | `${{ github.token }}` | GitHub API token |
| `pre-run` | no | — | Shell commands before agent |
| `post-run` | no | — | Shell commands after agent |
| `working-directory` | no | `${{ github.workspace }}` | Working directory |
| `node-version` | no | `22` | Node.js version |

## Example Workflows

See [`.github/workflows/`](./.github/workflows/) for complete examples:

- **[claude-code-pr-review.yml](./.github/workflows/claude-code-pr-review.yml)** — Claude Code + Foundry + babysitter-plugin + bridged-hooks for PR review
- **[codex-issue-triage.yml](./.github/workflows/codex-issue-triage.yml)** — Codex + Foundry + vanilla NI for issue classification
- **[gemini-scheduled-audit.yml](./.github/workflows/gemini-scheduled-audit.yml)** — Gemini CLI + Google/Vertex + scheduled docs audit
- **[multi-harness-quality-gates.yml](./.github/workflows/multi-harness-quality-gates.yml)** — Matrix of claude + codex + pi with babysitter-plugin
- **[copilot-webhook-dispatch.yml](./.github/workflows/copilot-webhook-dispatch.yml)** — Copilot CLI + bridged-interactive for repository_dispatch
- **[pi-comment-command.yml](./.github/workflows/pi-comment-command.yml)** — Pi + NI triggered by `/agent` comment commands

## Outputs

| Output | Description |
|--------|-------------|
| `matched` | Whether the trigger query matched (`true`/`false`) |
| `event` | Path to the enriched event JSON file |
| `exit-code` | Agent-mux exit code (empty if trigger didn't match) |
