# Maintainer Runbook

Operational checklist for maintainers and release managers.

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
- Hooks/runtime: `.codex/hooks`, `.codex/orchestrate.js`
- Command UX: `.codex/command-dispatcher.js`, `.codex/mode-handlers.js`
- Upstream sync tooling: `scripts/sync-from-upstream.js`, `scripts/check-upstream-parity.js`
- Policy/compat docs: `docs/COMPATIBILITY_MATRIX.md`, `config/compatibility-policy.json`
