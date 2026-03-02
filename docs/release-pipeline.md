# Continuous Release Pipeline

## Workflow Overview
- `.github/workflows/release.yml` triggers on every push to `main` plus manual `workflow_dispatch`, guarded by the `release-main` concurrency group so only one run executes at a time.
- `validate` job reruns the entire quality stack (lint, metadata, build, unit, integration, packaging) and uploads logs.
- `version_and_release` bumps package.json/package-lock.json/CHANGELOG.md, commits with `[skip release]` (preventing recursive runs), rebuilds the SDK, publishes to npm using `NPM_TOKEN`, tags `vX.Y.Z`, and publishes a GitHub Release using the release notes extracted from the changelog.

## Secrets & Permissions
- The workflow-level permissions block sets `contents: write` and `id-token: write`; `validate` reduces its scope to `contents: read`.
- `GITHUB_TOKEN` **must** retain `contents: write` on `main` to push version bump commits and tags. If branch protection blocks the Actions bot, create a scoped PAT and store it as `RELEASE_BOT_TOKEN`, then replace usages in the workflow.
- `NPM_TOKEN` authenticates `npm publish`; it must correspond to an account with publish rights to `@a5c-ai/babysitter-sdk` and should be rotated every 90 days.

## Guardrails
- All GitHub Actions are pinned to immutable SHAs.
- Release commits include [skip release] so the follow-up push does not re-trigger the workflow.

## Rollback
- Use scripts/rollback-release.sh vX.Y.Z to delete the GitHub Release and remote tag. The script assumes gh CLI authentication (GH_TOKEN or gh auth login).
- After running the script, revert the release commit on main (to restore changelog/package versions) and re-open any reverted changelog entries under ## [Unreleased].
- Document rollback actions in the incident ticket so the GO/NO-GO log stays auditable.

## Operational Checklist
1. Ensure release-notes.md matches the changelog section before approving the release.
2. Tabletop the rollback script quarterly (Release Eng + Security) to confirm tag deletion + changelog revert steps are still valid.
