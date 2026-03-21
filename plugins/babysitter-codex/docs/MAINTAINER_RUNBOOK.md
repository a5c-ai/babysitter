# Maintainer Runbook

Operational checklist for maintainers and release managers.

## Docs Split
- User-facing README and install docs stay on installation, activation, `babysitter ...` commands, and troubleshooting.
- Raw Babysitter runtime details belong in command docs, skill docs, hook docs, and this runbook.
- If a README or install doc tells an end user to drive `run:create`, `run:iterate`, `task:list`, `task:post`, `session:init`, or `session:associate` directly even though the harness exposes a higher-level command surface, treat that as a documentation regression.

## Runtime Contract
- Codex owns the conversation one turn at a time; there is no real blocking stop-hook integration for this package.
- Treat this repository as a Codex skill bundle and integration package. Do not present it as a native Codex plugin unless OpenAI documents such a surface in the future.
- Internal helpers may create or resume runs with first-class Codex binding when a real session or thread ID exists, and only fall back to explicit association when that stronger path is unavailable.
- Successful task payloads are written to `tasks/<effectId>/output.json`; the runtime then posts them and lets the SDK own `result.json`.
- After each posted effect or answered breakpoint, the harness yields so the supervisor can drive the next turn.
- The canonical process library is active-use and layered; bundled content is fallback only.

## Daily/Per-PR
1. Run local checks:
   - `npm run check:compat`
   - `npm test`
2. Verify new features are behind feature flags when risky.
3. Update docs + changelog for user-visible behavior changes.

## Upstream Sync
Follow `docs/UPSTREAM_SYNC.md`.

## Downstream Staging PR Sync
Follow `docs/DOWNSTREAM_STAGING_SYNC.md` to auto-open/update the rolling PR from
`babysitter-codex` changes into `a5c-ai/babysitter:staging`.

## Release Flow
1. Ensure `main` is green in CI matrix.
2. Confirm compatibility policy is still valid.
3. Bump package version.
4. Update `CHANGELOG.md`.
5. Publish package.
6. Post release announcement in Babysitter community channels.

## Incident Handling
If production regressions appear:
1. Reproduce with `test:scenario` and `test:long-scenario`.
2. Disable offending feature via flags in `.a5c/config/features.json`.
3. Publish patch release with rollback notes.

## Ownership Areas
- Command-catalog compatibility metadata: `.codex/command-catalog.json`, `.codex/plugin.json`
- Hooks/runtime: `.codex/hooks`, `.codex/turn-controller.js`, `.codex/orchestrate.js`
- Command UX: `.codex/command-dispatcher.js`, `.codex/mode-handlers.js`
- Upstream sync tooling: `scripts/sync-from-upstream.js`, `scripts/check-upstream-parity.js`
- Policy/compat docs: `docs/COMPATIBILITY_MATRIX.md`, `config/compatibility-policy.json`
