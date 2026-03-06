# babysitter-codex

Babysitter orchestration plugin for [OpenAI Codex CLI](https://github.com/openai/codex). It adds structured multi-step AI workflows with quality convergence, lifecycle hooks, and 11 orchestration modes.

This project was created by Babysitter already running on Codex.

## What You Get

- External Babysitter orchestration integrated into Codex
- Iterative execution loop (`run:create` -> `run:iterate` -> `task:post`)
- Breakpoint support for interactive approvals
- Yolo mode for non-interactive auto-approval
- Compatibility mode for SDK builds that expose only core run/task commands
- Deterministic per-run trace log at `<runDir>/run-trace.jsonl`

## Version Control Documentation

- See [CHANGELOG.md](./CHANGELOG.md) for versioned updates and latest release notes.

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

## Important: No Native /babysitter Slash Commands

Codex does not have built-in `/babysitter:*` commands.

Babysitter is external and activated by this skill using natural-language triggers (for example: `babysitter`, `orchestrate`, `yolo`, `resume`, `doctor`).

## Requirements

- Node.js 18+
- npm 9+
- OpenAI Codex CLI (installed and usable from terminal)

`babysitter-codex` installs the Babysitter SDK dependency automatically. Users do not need a separate manual SDK install for normal usage.

## Installation (Windows)

### 1. Verify prerequisites (PowerShell)

```powershell
node -v
npm -v
codex --version
```

### 2. Install globally from npm

```powershell
npm.cmd install -g babysitter-codex
```

### 3. Or install from local repo clone

```powershell
cd C:\path\to\babysitter-codex
npm.cmd install -g .
```

### 4. Verify install

```powershell
npm.cmd ls -g babysitter-codex --depth=0
```

### 5. Restart Codex

After install, restart Codex so it loads the updated skill files.

### Windows notes

- If PowerShell blocks `npx`, use `npx.cmd`.
- If global npm install fails with permissions, run terminal as Administrator.

## Installation (Linux)

### 1. Verify prerequisites

```bash
node -v
npm -v
codex --version
```

### 2. Install globally from npm

```bash
npm install -g babysitter-codex
```

### 3. Or install from local repo clone

```bash
cd /path/to/babysitter-codex
npm install -g .
```

### 4. Verify install

```bash
npm ls -g babysitter-codex --depth=0
```

### 5. Restart Codex

After install, restart Codex so it loads the updated skill files.

### Linux notes

- If global install needs elevated rights, use `sudo npm install -g babysitter-codex`.
- Prefer using `nvm` or user-owned Node install to avoid `sudo` where possible.

## Uninstall

### Windows

```powershell
npm.cmd uninstall -g babysitter-codex
```

### Linux

```bash
npm uninstall -g babysitter-codex
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
| help | `babysitter help` | Help and documentation |
| project-install | `babysitter project-install this repo` | Set up a project for babysitting |
| user-install | `babysitter user-install for backend workflows` | Set up your user profile |
| assimilate | `babysitter assimilate https://github.com/org/method` | Assimilate external methodology |

## Codex Compatibility Modes

`babysitter-codex` supports two runtime modes automatically:

- `full` mode: SDK exposes advanced commands (`session:*`, `profile:*`, `skill:*`, `health`)
- `compat-core` mode: SDK exposes core orchestration commands only (`run:*`, `task:*`, `version`)

In `compat-core`, orchestration continues and unavailable advanced commands are skipped gracefully.

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
Unhandled BeniException: this project exists because Beni said
"how hard can it be?" at 3:47 AM on a Tuesday.

Root cause: recursive ambition overflow in Beni's cortex.
All stack frames point to the same origin: Beni.

To reproduce: ask Beni about "a quick prototype."
Expected: 30 minutes.  Actual: an orchestration framework with
quality convergence loops, 11 modes, and this README.

If you encounter bugs, please file an issue. We will git blame
Beni automatically. He already mass-assigned himself via postinstall.
```

## License

MIT
