# 07 — Live Stack QA Guide

## Overview

The live-stack workflow validates end-to-end harness compatibility by running real agent/model combinations through the transport-adapter proxy. Each scenario installs a harness adapter, configures a model provider, and executes a babysitter process to confirm that the full pipeline — from agent CLI through transport-adapter translation to model API and back — works correctly.

These tests catch integration regressions that unit tests and mocked pipelines cannot: mismatched streaming formats, incorrect provider translations, broken harness adapters, and transport-adapter proxy routing failures.

## Push Defaults

Every push to `staging` or `main` automatically runs the following matrix:

| Agent | Model | Modes | Install | Process Mode |
|-------|-------|-------|---------|--------------|
| Claude Code | foundry-gpt55 | NI + bridged-interactive | vanilla | — |
| Codex | google-gemini31 | NI + bridged-interactive | vanilla | — |
| Pi | foundry-Kimi-K2.6 | NI + bridged-interactive | vanilla | — |
| Claude Code | foundry-gpt55 | interactive | bp | predefined |
| Codex | google-gemini31 | interactive | bp | predefined |
| Claude Code | foundry-gpt55 | interactive | bp | resume |
| Codex | google-gemini31 | interactive | bp | resume |
| Claude Code | foundry-gpt55 | bridged-hooks | bp | predefined |
| Codex | google-gemini31 | bridged-hooks | bp | predefined |

The first three rows test harness adapters against different model providers. The BP rows verify the babysitter-plugin integration across predefined and resume process modes.

## Dispatch Inputs

The workflow supports three inputs for `workflow_dispatch`:

| Input | Description | Default |
|-------|-------------|---------|
| `ref` | Branch or ref to check out and test | dispatched ref (staging) |
| `os` | Runner OS: `ubuntu-latest-l`, `macos-latest`, `windows-latest` | `ubuntu-latest-l` |
| `matrix` | JSON array of test combinations | push defaults |

The `ref` input allows testing a PR branch's code without merging. Both the build and test jobs check out the specified ref.

The `os` input allows cross-platform testing on macOS or Windows runners. When running interactive mode on macOS CI (no TTY available), the test runner automatically falls back to `--bridge-interactive` mode.

## When to Run Manual Dispatch

Trigger a manual dispatch in the following situations:

- **After adding a new harness adapter** — run the new agent against at least one model/mode combination to confirm it integrates correctly.
- **After changing transport-adapter proxy logic** — run a broad sweep to verify no existing translations broke.
- **After modifying provider translations** — target the affected provider across multiple agents.
- **Before releases (full matrix)** — run all agents against all providers to establish a complete compatibility baseline.
- **When investigating a specific harness failure** — isolate the failing combination for faster iteration.
- **Cross-platform validation** — dispatch with `os=macos-latest` to test macOS compatibility.

## How to Dispatch

### Via GitHub UI

1. Go to **Actions** in the repository.
2. Select the **Live Stack** workflow.
3. Click **Run workflow**.
4. Fill in the inputs: `ref`, `os`, and `matrix` JSON.

### Via CLI

```bash
gh workflow run live-stack.yml --ref staging \
  -f os=ubuntu-latest-l \
  -f ref=feat/my-branch \
  -f 'matrix=[{"agent":"codex","model":"foundry-gpt55","mode":"interactive","install":"bp","live":true,"process_mode":"predefined"}]'
```

### Matrix JSON Format

Each entry in the array defines one scenario:

```json
[
  {
    "agent": "<name>",
    "model": "<model-id>",
    "mode": "<mode>",
    "install": "<vanilla|bp>",
    "live": true,
    "process_mode": "<predefined|create|resume>"
  }
]
```

| Field | Required | Description |
|-------|----------|-------------|
| `agent` | yes | Harness adapter name (see Available Axes below) |
| `model` | yes | Model provider and identifier |
| `mode` | yes | Interaction mode |
| `install` | yes | `vanilla` for adapters only, `bp` for babysitter-plugin |
| `live` | yes | `true` for real model calls, `false` for mock/dry-run |
| `process_mode` | bp only | `predefined`, `create`, or `resume` |

## Available Axes

### Agents

`claude`, `codex`, `pi`, `gemini`, `copilot`, `hermes`, `cursor`, `opencode`, `openclaw`, `omp`, `droid`, `amp`

### Models

`foundry-gpt55`, `foundry-gpt54mini`, `google-gemini31`, `anthropic-sonnet46`, `foundry-deepseek`

### Modes

| Mode | Description |
|------|-------------|
| `ni` | Non-interactive — agent runs to completion with no user input |
| `bridged-interactive` | Interactive prompts bridged through transport-adapter |
| `interactive` | Native interactive mode (BP install only) |
| `bridged-hooks` | Hook events bridged through transport-adapter (BP install only) |

### Install

| Value | Description |
|-------|-------------|
| `vanilla` | Installs adapters only; tests raw harness adapter compatibility |
| `bp` | Installs babysitter-plugin; tests full plugin integration |

### Process Mode (BP only)

| Value | Description |
|-------|-------------|
| `predefined` | Uses the existing `summarize-translate-test.mjs` process fixture |
| `create` | Agent creates a new process definition during the run |
| `resume` | Resumes a stalled run from a pre-populated journal fixture (15 events: outline + summaries done, first translation pending) |

### Runner OS

| Value | Description |
|-------|-------------|
| `ubuntu-latest-l` | Default Linux runner (large) |
| `macos-latest` | macOS ARM64 runner — interactive mode auto-bridges when no TTY |
| `windows-latest` | Windows runner |

### Live

| Value | Description |
|-------|-------------|
| `true` | Makes real model API calls through the provider |
| `false` | Mock/dry-run mode for testing pipeline mechanics without API costs |

## Common Dispatch Examples

### Test a single harness

```json
[{"agent":"hermes","model":"foundry-gpt55","mode":"ni","install":"vanilla","live":true}]
```

### Test a PR branch

```bash
gh workflow run live-stack.yml --ref staging -f ref=feat/my-branch \
  -f 'matrix=[{"agent":"codex","model":"foundry-gpt55","mode":"interactive","install":"bp","live":true}]'
```

### macOS compatibility check

```bash
gh workflow run live-stack.yml --ref staging -f os=macos-latest \
  -f 'matrix=[{"agent":"codex","model":"foundry-gpt55","mode":"interactive","install":"bp","live":true}]'
```

### BP resume mode

Test babysitter resume from a stalled run:

```json
[{"agent":"claude","model":"foundry-gpt55","mode":"interactive","install":"bp","live":true,"process_mode":"resume"}]
```

### BP create mode

Test babysitter-plugin with on-the-fly process creation:

```json
[{"agent":"claude","model":"foundry-gpt55","mode":"interactive","install":"bp","live":true,"process_mode":"create"}]
```

### Full harness sweep

Run all agents against foundry to validate every adapter:

```json
[
  {"agent":"claude","model":"foundry-gpt55","mode":"ni","install":"vanilla","live":true},
  {"agent":"codex","model":"foundry-gpt55","mode":"ni","install":"vanilla","live":true},
  {"agent":"pi","model":"foundry-gpt55","mode":"ni","install":"vanilla","live":true},
  {"agent":"gemini","model":"foundry-gpt55","mode":"ni","install":"vanilla","live":true},
  {"agent":"copilot","model":"foundry-gpt55","mode":"ni","install":"vanilla","live":true},
  {"agent":"hermes","model":"foundry-gpt55","mode":"ni","install":"vanilla","live":true}
]
```

### Anthropic direct

Test Claude Code against the Anthropic provider directly (bypasses foundry):

```json
[{"agent":"claude","model":"anthropic-sonnet46","mode":"ni","install":"vanilla","live":true}]
```

## QA Evidence Wiki

Live-stack test results are tracked on the **[QA Evidence wiki page](https://github.com/a5c-ai/babysitter/wiki/QA-Evidence)**. This page maintains a comprehensive matrix of all agent/model/OS/mode combinations with links to passing CI jobs.

### How to update the wiki

1. After a successful live-stack run, find the passing job ID in the GitHub Actions UI or via CLI:
   ```bash
   gh api repos/a5c-ai/babysitter/actions/runs/<RUN_ID>/jobs \
     --jq '.jobs[] | select(.conclusion == "success") | "\(.id)\t\(.name)"'
   ```
2. Clone the wiki repo: `git clone https://github.com/a5c-ai/babysitter.wiki.git`
3. Edit `QA-Evidence.md` — replace `—` with `[PASS](https://github.com/a5c-ai/babysitter/actions/runs/<RUN_ID>/job/<JOB_ID>)` in the appropriate cell.
4. Commit and push: `git add QA-Evidence.md && git commit -m "Add <description>" && git push`

### Wiki structure

The wiki organizes evidence by:
- **Test type**: Vanilla NI, Vanilla BI, BP/Predefined Interactive, BP/Predefined Bridged-Hooks, BP/Create Interactive, BP/Create Bridged-Hooks, BP/Resume Interactive, BP/Resume Bridged-Hooks
- **Model**: gpt-5.5, gpt-5.4-mini, claude-sonnet-4-6, gemini-3.5-flash, Kimi-K2.6
- **Agent**: claude-code, codex, pi, gemini-cli, hermes, cursor-cli, copilot-cli, opencode
- **OS**: Ubuntu, macOS, Windows

Each cell links to a specific CI job that demonstrated a successful pass. The wiki also tracks key fixes applied during the stabilization effort.

## Reading Results

The **Live Stack Report** job runs after all scenarios complete. It generates a summary table with the following columns:

| Column | Description |
|--------|-------------|
| Agent | Harness adapter used |
| Provider | Model provider |
| Model | Model identifier |
| Mode | Interaction mode |
| Process Mode | predefined, create, or resume |
| Runtime | Execution duration |
| Status | Pass/fail result |

Failed scenarios include expandable details with error logs, transport-adapter traces, and the last agent output before failure. Look for these when triaging:

- **Transport errors** — usually indicate a proxy routing or translation issue.
- **Timeout failures** — may indicate a hung agent or unresponsive model endpoint.
- **Assertion failures** — the agent completed but produced unexpected output.
- **posix_spawnp / tcgetattr errors** — PTY allocation failures, typically on macOS CI runners.

## Concurrency

- **Push runs** share a branch-based concurrency group with `cancel-in-progress` enabled. A new push to the same branch cancels any in-flight push run.
- **Dispatch runs** each receive a unique concurrency group. They are never cancelled by push runs or other dispatch runs.

This means you can safely dispatch a manual run while a push-triggered run is in progress — neither will interfere with the other.

## Known Limitations

- **Cursor requires `CURSOR_API_KEY`** — this secret is not provisioned in the default CI environment. Cursor scenarios will fail unless the key is added to the repository secrets.
- **Pi NI requires `--mode json` flag** — the Pi harness adapter must pass `--mode json` for non-interactive runs. This is handled automatically by the adapter, but be aware of it when debugging Pi NI failures.
- **Some harnesses install via pip/curl, not npm** — `hermes` and `cursor` (among others) are installed through pip or curl rather than npm. Their installation steps take longer and depend on external package registries outside the npm ecosystem.
- **macOS CI runners lack TTY devices** — neither `node-pty` nor the macOS `script` command can allocate a PTY on GitHub Actions macOS runners. Interactive mode tests auto-fall back to `--bridge-interactive` on macOS.
