# babysitter-codex

Babysitter integration package for [OpenAI Codex CLI](https://github.com/openai/codex). It provides Codex-facing skills, config templates, an external orchestration supervisor flow, and the full upstream Babysitter process library.

This project was created by Babysitter already running on Codex.

## What You Get

- Codex skills and instruction assets for babysitter workflows
- External orchestration loop (`run:create` -> `run:iterate` -> `task:post`)
- Optional Codex session binding when a stable session/thread ID is available
- Notify-based post-turn observability
- Compatibility mode for SDK builds that expose only core run/task commands
- Deterministic per-run trace log at `<runDir>/run-trace.jsonl`

## Integration Model

Babysitter on Codex uses the surfaces Codex actually provides:

- installed skills
- `AGENTS.md`
- project `.codex/config.toml`
- optional `notify`

Codex does **not** provide Claude-style blocking `SessionStart` or `Stop`
hooks. Deterministic continuation after yielding to the user is handled by the
external supervisor, not by Codex itself.

## Latest Version

- Current release: `0.1.5` (2026-03-11)
- Key additions in `0.1.5`:
  - team-pinned install flow (`babysitter:team-install`)
  - lockfile (`babysitter.lock.json`)
  - layered rules resolver
  - process index cache
  - content integrity manifest + verification
  - mapping contract CI gates
  - install hardening: strip UTF-8 BOM from copied `SKILL.md` files to prevent Codex frontmatter parse failures

## Version Control Documentation

- See [CHANGELOG.md](./CHANGELOG.md) for versioned updates and latest release notes.
- See [docs/ROADMAP.md](./docs/ROADMAP.md) for planned feature milestones and rollout order.
- See [docs/MAINTAINER_RUNBOOK.md](./docs/MAINTAINER_RUNBOOK.md) for maintainer operations.
- See [docs/UPSTREAM_SYNC.md](./docs/UPSTREAM_SYNC.md) for process/skill sync from upstream Babysitter.
- See [docs/DOWNSTREAM_STAGING_SYNC.md](./docs/DOWNSTREAM_STAGING_SYNC.md) for automatic PR sync from this repo into `a5c-ai/babysitter:staging`.
- See [docs/COMPATIBILITY_MATRIX.md](./docs/COMPATIBILITY_MATRIX.md) for version support policy.
- See [docs/REAL_WORLD_VALIDATION.md](./docs/REAL_WORLD_VALIDATION.md) for release validation scenarios.
- See [docs/FEATURES_1_10.md](./docs/FEATURES_1_10.md) for implementation notes of the prioritized feature set.
- See [docs/CODEX_MAPPING.md](./docs/CODEX_MAPPING.md) for upstream-to-codex command/process mapping.
- See [docs/ARCHITECTURE_UPGRADES_1_8.md](./docs/ARCHITECTURE_UPGRADES_1_8.md) for lock/install/rules/index/integrity architecture.
- See [commands/README.md](./commands/README.md) for per-command reference docs (upstream-style structure adapted for Codex).

## Full Test Scenarios

- Core scenario runner: `npm run test:scenario`
- Long-session strict scenario: `npm run test:long-scenario`
- Scenario runbook: [test/FULL_SESSION_SCENARIO.md](./test/FULL_SESSION_SCENARIO.md)

The long-session scenario validates:
- 3+ interview breakpoints
- at least one breakpoint with 4 questions
- generated artifact reflects selected interview choices (colors/text)
- simulated 60-minute AI workload
- strict `100/100` score gate

## Bundled Upstream Library

`babysitter-codex` now bundles upstream Babysitter assets under:

- `upstream/babysitter/skills/babysit/process` (full process library)
- `upstream/babysitter/skills/babysit/reference` (reference docs)
- `upstream/babysitter/commands` (upstream command docs)

Default process-library root for Codex mapping:
- `upstream/babysitter/skills/babysit/process`

Override with:
- `BABYSITTER_PROCESS_LIBRARY_ROOT=<path>`

## Important: Use Command Phrases (Not Slash Commands)

Codex does not execute custom plugin commands from `/...` input. If you type
`/babysitter:call`, Codex will reject it as an unrecognized built-in command.

Use babysitter command phrases in chat instead:

- `babysitter call ...`
- `babysitter yolo ...`
- `babysitter resume ...`
- `babysitter doctor ...`
- `babysitter help`

## Requirements

- Node.js 18+
- npm 9+
- OpenAI Codex CLI (installed and usable from terminal)

`babysitter-codex` installs the Babysitter SDK dependency automatically. Users do not need a separate manual SDK install for normal usage.

## npm Package Name

Install from the scoped package:

- `@yaniv-tg/babysitter-codex`

The unscoped `babysitter-codex` name is currently a security placeholder on npm and is not used for this project.

### npm Status (2026-03-12)

- Published and installable from npm as:
  - `@yaniv-tg/babysitter-codex@0.1.5`
- Recommended install command:
  - `npm install -g @yaniv-tg/babysitter-codex`

## Installation (Windows)

### 1. Verify prerequisites (PowerShell)

```powershell
node -v
npm -v
codex --version
```

### 2. Install globally from npm

```powershell
npm.cmd install -g @yaniv-tg/babysitter-codex
```

### 3. Or install from local repo clone

```powershell
cd C:\path\to\babysitter-codex
npm.cmd install -g .
```

### 4. Verify install

```powershell
npm.cmd ls -g @yaniv-tg/babysitter-codex --depth=0
```

### 5. Restart Codex

After install, restart Codex so it loads the updated skill files.

### Windows notes

- If PowerShell blocks `npx`, use `npx.cmd`.
- If global npm install fails with permissions, run terminal as Administrator.

## Installation (macOS)

### 1. Verify prerequisites

```bash
node -v
npm -v
codex --version
```

### 2. Install globally from npm

```bash
npm install -g @yaniv-tg/babysitter-codex
```

### 3. Or install from local repo clone

```bash
cd /path/to/babysitter-codex
npm install -g .
```

### 4. Verify install

```bash
npm ls -g @yaniv-tg/babysitter-codex --depth=0
ls -l ~/.codex/skills/babysitter-codex/.codex/hooks/*.sh
```

### 5. Restart Codex

After install, restart Codex so it loads the updated skill files.

### macOS notes

- If shell scripts lose executable bits, rerun install or apply:
  `chmod +x ~/.codex/skills/babysitter-codex/.codex/hooks/*.sh`
- If `npx` is not on PATH inside Codex, install Node via `nvm` and relaunch shell.

## Installation (Linux)

### 1. Verify prerequisites

```bash
node -v
npm -v
codex --version
```

### 2. Install globally from npm

```bash
npm install -g @yaniv-tg/babysitter-codex
```

### 3. Or install from local repo clone

```bash
cd /path/to/babysitter-codex
npm install -g .
```

### 4. Verify install

```bash
npm ls -g @yaniv-tg/babysitter-codex --depth=0
```

### 5. Restart Codex

After install, restart Codex so it loads the updated skill files.

### Linux notes

- If global install needs elevated rights, use `sudo npm install -g @yaniv-tg/babysitter-codex`.
- Prefer using `nvm` or user-owned Node install to avoid `sudo` where possible.
- The installer now sanitizes UTF-8 BOM in `SKILL.md` during copy, preventing
  `missing YAML frontmatter delimited by ---` warnings from Codex skill loading.

## Uninstall

### Windows

```powershell
npm.cmd uninstall -g @yaniv-tg/babysitter-codex
```

### Linux

```bash
npm uninstall -g @yaniv-tg/babysitter-codex
```

### macOS

```bash
npm uninstall -g @yaniv-tg/babysitter-codex
```

## Quick Start (How To Actually Run It)

In Codex chat, use prompts like:

```text
babysitter help
babysitter call implement authentication with tests
babysitter yolo fix lint and failing tests
babysitter resume latest incomplete run
babysitter doctor current run
```

You can also run the SDK CLI directly in terminal:

```bash
babysitter run:create --process-id <id> --entry <path>#<export> --inputs <file> --json
babysitter run:iterate <runDir> --json --iteration 1
babysitter task:list <runDir> --pending --json
babysitter task:post <runDir> <effectId> --status ok --value tasks/<effectId>/output.json --json
```

## All Modes And How To Activate Them

| Mode | Example prompt to activate | What it does |
|------|----------------------------|--------------|
| call | `babysitter call build auth with tests` | Start an orchestration run (interactive) |
| yolo | `babysitter yolo fix failing tests end-to-end` | Fully autonomous, no breakpoints |
| resume | `babysitter resume latest run` | Resume an existing run |
| plan | `babysitter plan migration workflow` | Plan a workflow without executing |
| forever | `babysitter forever monitor build health every hour` | Never-ending periodic run |
| doctor | `babysitter doctor run 01ABC...` | Diagnose run health |
| observe | `babysitter observe current workspace` | Launch observer dashboard |
| retrospect | `babysitter retrospect latest run` | Analyze a run and propose process improvements |
| model | `babysitter model set execute=gpt-5` | Set or view model routing policy |
| issue | `babysitter issue 123 --repo owner/repo` | Start workflow from a GitHub issue |
| help | `babysitter help` | Help and documentation |
| project-install | `babysitter project-install this repo` | Set up a project for babysitting |
| team-install | `babysitter team-install` | Install team-pinned runtime/content setup |
| user-install | `babysitter user-install for backend workflows` | Set up your user profile |
| assimilate | `babysitter assimilate https://github.com/org/method` | Assimilate external methodology |

## Codex Compatibility Modes

`babysitter-codex` supports two runtime modes automatically:

- `full` mode: SDK exposes advanced commands (`session:*`, `profile:*`, `skill:*`, `health`)
- `compat-core` mode: SDK exposes core orchestration commands only (`run:*`, `task:*`, `version`)

In `compat-core`, orchestration continues and unavailable advanced commands are skipped gracefully.

## Feature Flags

Advanced capabilities (event streaming, policy engine, model routing, telemetry, etc.) are gated by feature flags.

- File-based flags: `.a5c/config/features.json`
- Env-based overrides: `BABYSITTER_FEATURE_<FLAG_NAME>`
- Defaults: `.codex/feature-flags.js`

## Requested Features (1-10) Status

The top requested Codex harness features are now implemented in runtime:

1. Session management UX: alias/tag/search resume selectors (`recent`, `tag:<x>`, `search:<q>`, `list`, `name <alias>`, `tag +/-<x>`).
2. First-class notifications + event stream: stable `v1` JSON events with `id`, `seq`, `runId`, webhook/slack/desktop/file sinks.
3. Long-task autonomous mode + approvals: staged approval policy, strict allowlists, retry backoff+jitter.
4. Multi-repo orchestration: alias/scope-based workspace routing from `.a5c/workspace/repos.json`.
5. Mid-session model switching: persisted `.a5c/config/model-policy.json` + per-step phase routing.
6. Plan/Act hardening: immutable plan-mode execution blocks for mutating task kinds.
7. Richer hooks lifecycle: `on-tool-error`, `on-policy-block`, `on-retry` + configurable payload transforms.
8. MCP reliability toolkit: `doctor mcp` diagnostics for transport/auth/path/config readiness.
9. Native GitHub issue/PR workflow: issue fetch + comments + optional apply mode + PR comment/create helpers.
10. Cost/token telemetry + budgets: per-iteration telemetry history, soft/hard budget phases, adaptive prompt shrinking.

### New Config Files

- `.a5c/config/model-policy.json`
- `.a5c/config/policies.json`
- `.a5c/config/hook-transforms.json`
- `.a5c/workspace/repos.json`

## SDK Contracts (Codex-Suitable)

- Core required commands:
  - `run:create`
  - `run:iterate <runDir>`
  - `run:status <runDir>`
  - `task:list <runDir>`
  - `task:post <runDir> <effectId>`
- Optional advanced commands:
  - `session:*`
  - `profile:*`
  - `skill:*`
  - `health`

If advanced commands are unavailable, the harness degrades to `compat-core` and continues orchestration with core run/task operations.

## Troubleshooting

- `task:post` path errors:
  - Use run-relative references like `tasks/<effectId>/output.json`.
- Missing advanced SDK commands:
  - Expected in `compat-core`; orchestration still works with core run/task commands.

## Blame Beni

```
CRITICAL: BENI_EXCEPTION_UNHANDLED (0xB3N1-v0.1.5)
Message: "we should keep it simple" emitted 12 milliseconds before adding lockfiles, process indexes, and 7,798 upstream assets.

Stack trace:
  at Beni.Init("tiny patch")
  at Beni.Upgrade("runtime/content split")
  at Beni.Upgrade("team install")
  at Beni.Upgrade("integrity + signatures")
  at Beni.Upgrade("15 modes")
  at PagerDuty.Trigger("prod confidence increased, sleep decreased")

Incident response:
- Severity: SEV-BENI
- Blast radius: every repository Beni can spell
- Mitigation status: containment failed, architecture improved

Repro:
1. Ask Beni for one small codex integration tweak.
2. Go make coffee.
3. Return to find lockfiles, CI contract checks, team installers, and a manifesto.

If anything breaks, open an issue and always blame Beni.
This policy is deterministic, backward-compatible, and thoroughly validated.
```

## License

MIT
