---
title: Harness And Plugin E2E
description: Separate SDK harness setup, agent-mux plugin/session E2E, and babysitter-agent runtime E2E boundaries.
last_updated: 2026-05-07
---

# Harness And Plugin E2E

This document covers harness setup and plugin-enabled sessions. It intentionally separates two different integration types:

1. **SDK harness/plugin setup integration** uses `babysitter harness:install` and `babysitter harness:install-plugin`.
2. **Agent-mux plugin/session E2E** starts an agent session through `agent-mux` and verifies plugin behavior inside that session.

`babysitter-agent` runtime E2E is a third path and is covered in [Agent Mux And Runtime E2E](./agent-mux-and-runtime-e2e.md). It must not require `harness:install` or `harness:install-plugin` steps.

## Path A: SDK Harness And Plugin Setup

This path tests the SDK install surfaces. It does not prove that `babysitter-agent` can run a process.

```bash
babysitter harness:install codex --workspace . --json
babysitter harness:install claude-code --workspace . --json
babysitter harness:install-plugin codex --workspace . --json
babysitter harness:install-plugin claude-code --workspace . --json
babysitter plugin:install babysitter --project --json
babysitter list --json
```

| Test | Expected proof |
| --- | --- |
| `list` includes known harnesses | JSON includes harness names and capability metadata |
| `harness:install --dry-run` for each target | Installation plan is valid and does not mutate the workspace |
| `harness:install-plugin --dry-run` for each target | Plugin installer package, target, and destination are resolved |
| Repeated plugin install | Manifest remains idempotent and contains no duplicate plugin entries |
| Generic `plugin:install babysitter` | Project plugin registry entry is present when that path is selected |

The SDK installer path may delegate harness CLI install to agent-mux adapter install support internally, but the public test claim remains installer coverage.

## Path B: Agent-Mux Plugin And Session E2E

This path tests a real or mocked agent session controlled by `agent-mux`. It should use `amux run <agent>` or `createClient().run({ agent })`, not `babysitter-agent call`.

| Phase | Required action | Required assertions |
| --- | --- | --- |
| Capability gate | Read adapter capabilities for the target agent | Plugin-manager tests run only when `supportsPlugins` is true; otherwise the job records a skip/capability error |
| Plugin precondition | Install or verify the Babysitter harness plugin with the correct native or SDK installer for that harness | Manifest or registry has the Babysitter plugin exactly once |
| Start agent-mux session | Run `amux run <agent> --prompt <fixture>` or equivalent SDK call | Event stream has `session_start`, content/tool/hook events as applicable, and `session_end` |
| Invoke Babysitter plugin command | Prompt issues `/babysitter:call` or the harness-equivalent Babysitter command inside the agent session | A Babysitter run ID is produced and can be inspected with SDK run commands |
| Verify process lifecycle | Inspect run status/events after the session returns | Process was created, ran, posted at least one result, and reached `completed` |
| Verify hook behavior | Inspect normalized hook logs or agent-mux runtime-hook events | Stop hook fired, continuation/stop decision was honored, and no plugin bypass path was used |

### Adapter-Specific Rules

| Target | Rule |
| --- | --- |
| Claude Code | Valid for agent-mux session, plugin-manager coverage where adapter supports it, and live stop-hook/plugin behavior |
| Codex | Valid for agent-mux session coverage, but plugin-manager install must be capability-gated because the current Codex adapter reports `supportsPlugins: false` |
| Gemini/Copilot/Cursor/OpenCode/OpenClaw/Oh-My-Pi | Include in setup smoke first; promote to plugin E2E only after adapter capability and plugin installer evidence exists |
| Pi/agent-core | Not an agent-mux external-harness plugin path |

## Path C: Babysitter-Agent Runtime E2E

This path validates `@a5c-ai/babysitter-agent` runtime behavior. It starts from preconditions, not installers.

Valid commands include:

```bash
babysitter-agent call --harness agent-core --workspace . --prompt "run the bounded runtime fixture" --json
babysitter-agent call --harness claude-code --workspace . --prompt "run the bounded runtime fixture" --json
babysitter-agent invoke codex --workspace . --prompt "return BABYSITTER_AGENT_BRIDGE_OK" --json
```

Required assertions:

- no `harness:install` or `harness:install-plugin` command is executed as part of the babysitter-agent runtime test,
- selected backend is recorded (`agent-core`, `pi`, or mapped external harness),
- run is created when the command is `call/create-run`,
- task effects are emitted and posted for process runs,
- run reaches a terminal state,
- agent-mux bridge events are present only when the selected external harness uses the bridge,
- artifacts are redacted and include run ID, session ID, backend/harness name, model/provider metadata, and command transcript.

## Failure Policy

- Missing credentials should skip model-backed jobs before any provider call begins.
- A selected setup job should fail if installer preconditions are unavailable.
- A selected babysitter-agent runtime job should fail if it tries to run installer commands.
- Use of the deprecated `babysitter harness:call` alias in new runtime tests should fail review; use `babysitter-agent call` for babysitter-agent runtime or `amux run` for agent-mux session E2E.
- Any log containing a raw secret must fail the job and block artifact upload until redaction is fixed.

## `install-plugins` Wrapper Acceptance Criteria

If the project adds an aggregate `install-plugins` command, test it only as setup-path coverage.

| Criterion | Required assertion |
| --- | --- |
| Equivalence | Wrapper output lists the same plugin destinations as the explicit setup commands it wraps |
| Idempotency | Running the wrapper twice does not duplicate plugin entries or corrupt manifests |
| Scope clarity | Output states whether installation is project-local, user-global, or harness-local |
| Failure isolation | Failure to install one harness plugin reports that harness without masking other completed installs |
| JSON evidence | Wrapper emits machine-readable installed/skipped/failed entries for CI artifacts |

Do not use the wrapper as a hidden prerequisite for babysitter-agent runtime E2E.
