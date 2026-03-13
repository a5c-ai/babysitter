# Upstream Sync Process

This document defines how `babysitter-codex` stays aligned with the main Babysitter (Claude Code oriented) process/skill library.

## Source of Truth
- Upstream repository: `a5c-ai/babysitter`
- Upstream branch: `staging`
- Mapping config: `config/upstream-sync.json`

## Sync Steps
1. Clone/update upstream repo locally.
2. Run:
   - `npm run sync:upstream -- --upstream-root <path-to-babysitter>`
3. Validate parity:
   - `npm run check:upstream -- --upstream-root <path-to-babysitter>`
4. Run test suite:
   - `npm test`
5. Review changed skills/agents and update codex-specific docs if needed.
6. Commit with message:
   - `chore(sync): update skills/agents from babysitter staging`

## Drift Control
- Any mismatch in mapped paths should fail parity checks.
- Intentional divergence must be documented in PR notes.

## Recommended Cadence
- At minimum weekly.
- Immediately after upstream releases that touch skill/process semantics.
