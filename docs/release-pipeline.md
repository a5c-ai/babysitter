---
title: Continuous Release Pipeline
description: Release ownership, workflow contracts, and guardrails for the Babysitter monorepo publish pipeline.
last_updated: 2026-05-01
---

# Continuous Release Pipeline

## Workflow Overview
- `.github/workflows/release.yml` owns production npm releases from `main`, guarded by the `release-main` concurrency group so only one run executes at a time.
- `.github/workflows/staging-publish.yml` owns prerelease npm publishing from `staging`, guarded by the `staging-publish` concurrency group.
- `@a5c-ai/babysitter-observer-dashboard` is part of those central workflows. The former standalone `.github/workflows/observer-dashboard-publish.yml` path is retired, so observer-dashboard no longer has a separate `main` release workflow.
- `@a5c-ai/agent-catalog` is part of those central publish workflows. It ships as a public dependency surface for SDK, hooks-mux, agent-mux, and extension-mux consumers.
- `@a5c-ai/tula-core` and `@a5c-ai/agent-platform` are part of those central publish workflows. `tula-core` publishes before `agent-platform` so the runtime CLI can be installed from npm without workspace-only dependencies.
- `@a5c-ai/transport-mux` is part of the public agent-mux runtime chain. It must publish before the downstream agent-mux CLI/root packages so `@a5c-ai/agent-platform` remains globally installable through its agent-mux dependency chain.
- Both central workflows validate, build, and publish observer-dashboard alongside the other public workspaces they own.

## Ownership Matrix
- `release.yml` on `main`: validates the monorepo, bumps versions through `scripts/bump-version.mjs`, packs release artifacts, publishes public npm packages including `@a5c-ai/agent-catalog`, tags `vX.Y.Z`, and creates the GitHub Release.
- `staging-publish.yml` on `staging`: validates the monorepo, writes prerelease versions into the publishable package manifests, and publishes the same centrally-owned npm packages with the `staging` dist-tag.
- `scripts/bump-version.mjs`: production version source of truth for the centrally versioned workspace packages, including `packages/agent-catalog/package.json` and `packages/observer-dashboard/package.json`.
- `packages/observer-dashboard/README.md`: user-facing install guidance for the published package; it should describe the same central release ownership as this document.

## Secrets & Permissions
- The workflow-level permissions block sets `contents: write` and `id-token: write`; `validate` reduces its scope to `contents: read`.
- `GITHUB_TOKEN` **must** retain `contents: write` on `main` to push version bump commits and tags. If branch protection blocks the Actions bot, create a scoped PAT and store it as `RELEASE_BOT_TOKEN`, then replace usages in the workflow.
- `NPM_TOKEN` authenticates `npm publish`; it must correspond to an account with publish rights to `@a5c-ai/babysitter-sdk`, `@a5c-ai/agent-catalog`, and the rest of the centrally published packages, and should be rotated every 90 days.

## Guardrails
- All GitHub Actions are pinned to immutable SHAs.
- Release commits include [skip release] so the follow-up push does not re-trigger the production workflow.
- Staging automation uses [skip staging] on its follow-up commit to avoid recursive prerelease runs.
- Observer-dashboard release ownership must stay singular: if a future package-specific workflow is introduced, this document and the central workflows must be updated in the same change.

## Rollback
- Use scripts/rollback-release.sh vX.Y.Z to delete the GitHub Release and remote tag. The script assumes gh CLI authentication (GH_TOKEN or gh auth login).
- After running the script, revert the release commit on main (to restore changelog/package versions) and re-open any reverted changelog entries under ## [Unreleased].
- Document rollback actions in the incident ticket so the GO/NO-GO log stays auditable.

## Staging Behavior
- Staging publishes observer-dashboard to npm with the `staging` dist-tag through `staging-publish.yml`.
- The staging workflow writes the prerelease version directly into `packages/observer-dashboard/package.json` for the publish job, matching the way other centrally-owned public packages are staged.
- Staging does not create Git tags or GitHub Releases; it exists only to publish prerelease npm artifacts for validation.

## Operational Checklist
1. Ensure release-notes.md matches the changelog section before approving the release.
2. Tabletop the rollback script quarterly (Release Eng + Security) to confirm tag deletion + changelog revert steps are still valid.
3. When adding or removing a public package from the central release set, update all three ownership surfaces together: `release.yml`, `staging-publish.yml`, and `scripts/bump-version.mjs`.
