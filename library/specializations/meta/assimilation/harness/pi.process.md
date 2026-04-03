# oh-my-pi Harness Integration Process

## Overview

Integrates babysitter into oh-my-pi as a first-class harness, not a loose helper script. The process now starts with upstream research, adapts the canonical Claude Code babysit skill, installs or syncs the original process library into the Pi package at runtime, documents operator installation, and validates a real end-to-end run through the actual harness.

## Required Research

Before implementation, the process must research:

- How oh-my-pi packages, installs, enables, disables, upgrades, and removes plugins.
- How a Pi package should be distributed from GitHub or another upstream source.
- Which extension hooks and continuation APIs keep the orchestration loop alive after yielding to the user.
- How the canonical babysit skill and Claude Code harness contract map onto Pi's `agent_end` and `session.followUp()` model.

## Canonical Contract

The Pi adaptation must preserve these rules from the original babysit skill and Claude Code integration:

- Prefer `run:create --harness pi` as the primary binding path.
- Stop or yield after each `task:post`; the harness continuation path owns the next turn.
- Use `tasks/<effectId>/output.json` plus `task:post`. Never write `result.json` directly.
- Treat ambiguous breakpoint responses as not approved.
- Post breakpoint rejection with `--status ok` and `{"approved": false}`.
- Never emit `kind: "node"` in generated process assets.
- Only emit `<promise>PROOF</promise>` after the run is actually completed.

## Package Layout

```text
plugins/babysitter-pi/
  package.json
  extensions/babysitter/
    index.ts
    session-state.ts
    cli-wrapper.ts
    loop-driver.ts
    effect-executor.ts
    result-poster.ts
    guards.ts
  commands/
  skills/babysitter/
  scripts/
    postinstall.js
    preuninstall.js
    setup.sh
  docs/
  test/
  README.md
  AGENTS.md
```

## Runtime Install and Sync

The process must produce:

- A runtime install path that can install the Pi package from the upstream GitHub repo or official package source.
- A sync path that copies or refreshes the canonical babysit process library and key skill content into the Pi plugin.
- Install, upgrade, reinstall, disable, uninstall, and rollback documentation.

## Runtime Validation

The process is not complete until it validates:

- A real `run:create --harness pi` flow.
- A full orchestration run through `agent_end` and `session.followUp()`.
- Yield to the harness user and continuation back into the orchestration loop.
- Skill adaptation fidelity against the original Claude Code babysit skill.
- Edge cases: stale session state, re-entrant runs, lock conflicts, crash recovery, completion proof mismatch, breakpoint rejection, direct `result.json` misuse, and upgrade or reinstall behavior.

## Phases

1. Research: upstream packaging, hook points, continuation model, and operator flow.
2. Analyze: inspect oh-my-pi internals and current project state.
3. Scaffold: package structure and extension skeleton.
4. Assimilate: copy and adapt canonical babysit assets.
5. Core: session binding, harness adapter, and CLI wrapper.
6. Takeover: effect mapping, todo replacement, result posting, and guards.
7. TUI and UX: widgets, commands, AGENTS.md, skills, install scripts, and docs.
8. Test: package tests plus real harness runtime validation.
9. Verify and converge: score research fidelity, installability, runtime proof, docs, and edge-case coverage until the target quality is met.
