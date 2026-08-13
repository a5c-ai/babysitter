---
title: Continuous Release Pipeline
description: Release ownership, workflow contracts, and guardrails for the Babysitter monorepo publish pipeline.
last_updated: 2026-05-01
---

# Continuous Release Pipeline

## Single authoritative release version (FIX-001)

The branch release workflow (`.github/workflows/publish.yml`) is the **sole owner** of npm
publication and channel promotion. One immutable release version flows through the whole
pipeline; nothing downstream re-derives it.

| Stage | Where the version comes from |
| --- | --- |
| Resolution | `node scripts/release-version.cjs resolve --branch <b> --sha <short-sha>` in `prepare_staging_publish`, exactly once. `main` releases `X.Y.Z` from the root manifest; `staging`/`develop` release `X.Y.(Z+1)-<branch>.<short-sha>`. Any other branch is a hard error. |
| Publication workspace | The resolved plan is written to `release-version.json` and bundled into the publish-source tarball, so every publish job publishes the same version. |
| Manifest synchronization | `scripts/sync-workspace-versions.mjs --version <releaseVersion>`, immediately verified by `release-version.cjs verify-manifests`. |
| Publication | `scripts/publish-package-from-tag.mjs` fails unless the workspace manifest version, the release plan / `RELEASE_VERSION` / `--release-version`, and the tag version all agree. It publishes under the candidate dist-tag (see FIX-010 below), never a channel. |
| Publication order | Derived from the package dependency graph: `scripts/release-matrix.cjs --group all-publishable --format waves`. |
| Channel assertion | `release-version.cjs assert-channel-tags` runs `preflight` before publishing (no backward channel movement) and `final` after promotion (every one of the public packages resolves the release version). |
| Tagging | `.github/workflows/release-tags.yml` **accepts** the version as an input and validates it against the resolver. The tag is `babysitter/<branch>/v<releaseVersion>` — the name contains the exact published version and nothing else — annotated with `babysitter-release-*` provenance. |
| External sync | `sync-external-plugins.yml` / `sync-atlas-plugins.yml` take `release_version` as a required input. |

`.github/workflows/publish-packages-from-tag.yml` is a **manual/recovery path only**. It derives
the exact version from the tag, refuses to run for a tag the publish workflow already published
from (no second dist-tag mutation), synchronizes every manifest to that version on every channel,
publishes in dependency order, and asserts the channel tags at the end.

Re-running a completed release is idempotent: nothing is re-published, the tag is not moved, and
the channel assertion passes unchanged. See `docs/release-incident-2026-08-13.md` for the incident
this model prevents.

## Candidate publication and validated promotion (FIX-010)

Publishing a package is **not** releasing it. Publication writes a non-production candidate
dist-tag; a release channel moves only after the exact version has been installed from npm and
exercised.

| Stage | Contract |
| --- | --- |
| Candidate dist-tag | `node scripts/release-promotion.cjs candidate-tag --version <v>` → `candidate-<v>`. `scripts/publish-package-from-tag.mjs` publishes every package under it and never writes `latest`, `staging` or `develop`. |
| Published-consumer validation | `publish_staging_metapackage` → `published_consumer_validation`, which calls `.github/workflows/live-stack-published.yml` with the EXACT release version. Mutable inputs (dist-tags, ranges, partial versions) are rejected by `release-promotion.cjs assert-exact-version`. |
| Clean-consumer checks | `scripts/verify-published-release.mjs --version <v>` installs every public package at `@<v>` into a throwaway project, imports every root and exported runtime subpath, and smokes every declared bin. Consumer surfaces come from `scripts/lib/package-surface.cjs`, shared with the pre-publication FIX-011 gate. |
| Live-stack execution | The representative published live-stack lanes install the same exact version globally and assert it with `release-promotion.cjs assert-installed`. |
| Evidence | `release-promotion.cjs record-validation` writes `validation.json` (required checks: `package-install`, `root-import`, `subpath-import`, `bin-smoke`, `live-stack`) and uploads it as the `published-consumer-validation` artifact — on failure too, for incident review. |
| Promotion | `promote_release_channel` runs only when the validation job succeeded, and `release-promotion.cjs promote` independently refuses without evidence naming this exact version with every required check successful. It moves every public package's channel tag and re-asserts the channel. |
| Failure behaviour | No channel tag is touched. The candidate stays installable as `<pkg>@<version>` and under `candidate-<version>` for diagnosis. |
| Recovery | `workflow_dispatch` on `live-stack-published.yml` takes the same exact-version input; `.github/workflows/publish-packages-from-tag.yml` follows the identical candidate → validate → promote sequence. |

The operator-facing command sequence for a recovery release — version selection, local pre-flight
gates, candidate publication, published-consumer validation, promotion, full-inventory channel
assertion, and the separately approved `npm deprecate` notices — is
[docs/release-recovery-runbook.md](./release-recovery-runbook.md).

## Workflow Overview
- `.github/workflows/release.yml` owns production npm releases from `main`, guarded by the `release-main` concurrency group so only one run executes at a time.
- `.github/workflows/staging-publish.yml` owns prerelease npm publishing from `staging`, guarded by the `staging-publish` concurrency group.
- `@a5c-ai/babysitter-observer-dashboard` is part of those central workflows. The former standalone `.github/workflows/observer-dashboard-publish.yml` path is retired, so observer-dashboard no longer has a separate `main` release workflow.
- `@a5c-ai/atlas/catalog` ships from the atlas package as the public catalog dependency surface for SDK, hooks-adapter, adapters, and extensions-adapter consumers.
- `@a5c-ai/genty-core` and `@a5c-ai/genty-platform` are part of those central publish workflows. `genty-core` publishes before `agent-platform` so the runtime CLI can be installed from npm without workspace-only dependencies.
- `@a5c-ai/transport-adapter` is part of the public adapters runtime chain. It must publish before the downstream adapters CLI/root packages so `@a5c-ai/genty-platform` remains globally installable through its adapters dependency chain.
- Both central workflows validate, build, and publish observer-dashboard alongside the other public workspaces they own.

## Ownership Matrix
- `release.yml` on `main`: validates the monorepo, bumps versions through `scripts/bump-version.mjs`, packs release artifacts, publishes public npm packages including `@a5c-ai/atlas`, tags `vX.Y.Z`, and creates the GitHub Release.
- `staging-publish.yml` on `staging`: validates the monorepo, writes prerelease versions into the publishable package manifests, and publishes the same centrally-owned npm packages with the `staging` dist-tag.
- `scripts/bump-version.mjs`: production version source of truth for the centrally versioned workspace packages, including `packages/atlas/package.json` and `packages/observer-dashboard/package.json`.
- `packages/observer-dashboard/README.md`: user-facing install guidance for the published package; it should describe the same central release ownership as this document.

## Secrets & Permissions
- The workflow-level permissions block sets `contents: write` and `id-token: write`; `validate` reduces its scope to `contents: read`.
- `GITHUB_TOKEN` **must** retain `contents: write` on `main` to push version bump commits and tags. If branch protection blocks the Actions bot, create a scoped PAT and store it as `RELEASE_BOT_TOKEN`, then replace usages in the workflow.
- `NPM_TOKEN` authenticates `npm publish`; it must correspond to an account with publish rights to `@a5c-ai/babysitter-sdk`, `@a5c-ai/atlas`, and the rest of the centrally published packages, and should be rotated every 90 days.

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
