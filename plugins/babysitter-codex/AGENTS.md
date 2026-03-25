# Agent Instructions -- Babysitter for Codex CLI

This file governs agent behavior when the `babysitter-codex` skill bundle is
installed into Codex. Babysitter owns orchestration through the SDK runtime and
Codex lifecycle hooks. Do not replace that model with an external orchestrator
for the plugin path.

## 1. How Babysitter Integrates With Codex

Babysitter for Codex is made of:

- the installed Codex skill payload under `~/.codex/skills/babysitter-codex`
- workspace `.codex/hooks.json` registrations
- workspace `.codex/config.toml` feature flags
- the `.a5c/` runtime state directory
- the Babysitter SDK CLI for run creation, iteration, status, and result posting

The plugin path supports only the hooks model:

- `SessionStart` seeds session state needed by the runtime
- `UserPromptSubmit` can transform or enrich prompt-time context
- `Stop` is the continuation point that keeps Babysitter in the orchestration loop

Do not introduce an app-server loop, a polling wrapper, or a hidden supervisor
for normal Codex plugin operation.

## 2. User-Facing Activation

Prefer natural language command phrases inside Codex, for example:

- `babysitter call <goal>`
- `babysitter resume`
- `babysitter doctor`
- `babysitter team-install`
- `babysitter project-install`

Treat these as the Codex-facing entrypoints. Raw SDK CLI commands are runtime
plumbing and should stay behind the skill and hook flow unless the task
explicitly requires low-level diagnosis.

## 3. Runtime Contract

Babysitter orchestration is driven with the SDK CLI:

- `babysitter run:create`
- `babysitter run:iterate`
- `babysitter run:status`
- `babysitter task:list`
- `babysitter task:post`
- `babysitter process-library:active`

When a Codex session identifier is available, bind it honestly with
`--harness codex --session-id <id>`.

Never fabricate session IDs. Never write task `result.json` files directly.
Write the value payload to the task output location and post it through
`babysitter task:post`.

## 4. Process Library Model

The Codex package does not bundle the process library. Workspace onboarding must
use the SDK CLI to clone or update the upstream Babysitter repository and bind
the active process root for the current workspace.

Preferred lookup order:

1. project-local `.a5c/processes`
2. the active process-library binding from
   `babysitter process-library:active --state-dir .a5c --json`

Do not instruct users to copy process files out of the package payload.

## 5. Hook-Driven Loop Rules

During an active run:

1. create or resume the run
2. execute the current requested work
3. post the result back through the SDK
4. yield control so the `Stop` hook can decide the next continuation step

Do not manually spin a multi-iteration loop inside one Codex turn when the hook
model is active. The runtime must remain aligned with the lifecycle hooks.

## 6. Completion

Only when the run is actually completed should the final proof be emitted as:

`<promise>PROOF_VALUE</promise>`

Do not emit a promise tag early.
