---
title: Continuous Release Pipeline
description: Release ownership, workflow contracts, package inventory, dependency ownership, and guardrails for the Babysitter monorepo publish pipeline.
last_updated: 2026-08-13
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
`docs/release-recovery-runbook.md`.

## Package inventory and release matrices

There is **one** authoritative answer to "which packages does this repository
publish", and every build, test, version, and publish matrix derives from it.
Hand-maintained package lists are what let `@a5c-ai/hooks-adapter-genty` sit
unpublished and unbuilt for an entire release line (FIX-005), so they are no
longer permitted in release surfaces.

| Layer | File | Contract |
| --- | --- | --- |
| Inventory | `scripts/lib/publishable-packages.cjs` | `listPublishablePackages(repoRoot)` returns every **workspace member** manifest — resolved from the root `package.json` `workspaces` globs, the same declaration npm itself publishes from — where `private !== true` **and** `publishConfig.access === "public"`, sorted by package name. It throws on a duplicate name or directory, an unreadable workspace manifest, or an unsupported glob shape — the inventory never silently drops a package. **It must never use `git ls-files`:** `publish.yml` bundles the release tree with `tar --exclude=.git` and every publish job extracts that tarball with no checkout, so a VCS-derived inventory exits 128 there (it crashed `npm run build:hooks-adapter` in `publish_staging_hooks_cli` on every branch release). `scripts/__tests__/publishable-packages.test.mjs` pins both halves: equality with the git-tracked derivation inside the repository, and a successful derivation in a `.git`-less copy. Run it directly (`node scripts/lib/publishable-packages.cjs`) to print the inventory as JSON. |
| Groups | `scripts/lib/release-matrix.cjs` | Named selectors over the inventory. `all-publishable` selects everything; `hooks-leaves` selects `packages/adapters/hooks/adapter-*`. `node scripts/release-matrix.cjs --list-groups` prints them with their descriptions. A group that resolves to zero packages is a hard error. |
| CLI | `scripts/release-matrix.cjs` | `--group <id> [--format matrix\|workspaces\|json\|waves]`. `matrix` (default) emits a one-line JSON array of `{name, workspace}` for `strategy.matrix.include: ${{ fromJson(...) }}`; `workspaces` emits one package name per line for shell loops; `waves` emits dependency-ordered publication waves (one wave per line, space-separated) and is valid only for `all-publishable`. The CLI is read-only: it never builds, publishes, or contacts the registry. |
| Enforcement | `scripts/check-package-metadata.cjs` (`npm run verify:metadata`) | Compares the inventory against `docs/generated/package-plugin-docs-coverage.json`, against `.github/workflows/publish.yml` and `.github/workflows/publish-packages-from-tag.yml`, and against each package's declared direct runtime dependencies. |

### How a new public package joins the matrices

1. Add the workspace under a directory matched by the root `workspaces` globs, with `private` unset (or `false`) and `publishConfig.access: "public"`, and `git add` the manifest. It is now in the inventory — nothing else declares it.
2. Declare every bare runtime import in the package's own `dependencies` / `optionalDependencies` / peer contract. `verify:metadata` fails on an undeclared direct runtime dependency; relying on a hoisted transitive is what broke `@a5c-ai/tasks-adapter@6.0.0` (FIX-002) and the hooks leaves' Atlas access (FIX-006).
3. Give the package a docs home and regenerate `docs/generated/package-plugin-docs-coverage.json`; `verify:metadata` fails when the inventory and that coverage file disagree in either direction.
4. Make both release surfaces cover it. Coverage is satisfied either by naming the package explicitly in the workflow **or**, preferably, by belonging to a release-matrix group the workflow already derives (`scripts/release-matrix.cjs --group <id>`). Derived coverage is what makes a hand-maintained omission impossible, so prefer extending or reusing a group over adding a name.
5. Add the package to a build step (or to a build loop that consumes a group). Publication order needs no manual edit: it comes from `--format waves` over the dependency graph.
6. Run `npm run verify:metadata && npm run guard:packages`. A tracked, temporarily accepted gap goes in `scripts/known-package-defects.json` with its `FIX-NNN` id; entries are rejected once stale, and the enforced end-state of that allowlist is empty.

### Dependency ownership model

A public package **owns** every module it imports at runtime. `scripts/lib/dependency-ownership.cjs`, run by `verify:metadata`, enforces exactly this rule:

> Every non-type runtime import in a public package's shipped sources must be satisfied by that package's **own** `dependencies`, `optionalDependencies`, or declared peer contract.

- **Scope.** Shipped runtime sources only — `src/`, `bin/`, `lib/`. Test suites, fixtures, examples, docs, dev scripts, `*.test.*`, `*.config.*`, and `*.d.ts` are excluded, because they do not run in a consumer installation.
- **`devDependencies` do not satisfy runtime ownership.** Inside the monorepo, workspace hoisting silently supplies an undeclared package, so the workspace build passes while the published tarball is broken. That is precisely the FIX-002 (tasks adapter → `@modelcontextprotocol/sdk`) and FIX-006 (hooks leaves → `@a5c-ai/atlas`) failure mode.
- **Type-only imports are not runtime dependencies** and are deliberately not conflated with them. `ms` and `express` in the tasks adapter are `import type` only and were not turned into runtime dependencies by FIX-002; declaration closure is validated separately by the packed-artifact typecheck.
- **Optional native capabilities use exactly one ownership model: an optional peer dependency, with an explicit tested contract.** `node-pty` in `@a5c-ai/comm-adapter` is the reference case: declared as `peerDependencies` + `peerDependenciesMeta.optional`, loaded ESM-safely through `createRequire(import.meta.url)`, and governed by `RunOptions.ptyMode`. An **absent** optional peer is the only condition that may degrade a run, it degrades only under `ptyMode: 'preferred'`, and it always emits an observable `PTY_NOT_AVAILABLE` diagnostic first. An installed-but-unusable native binding is an environment defect and fails loudly in both modes — required behavior never degrades silently. See `packages/adapters/core/README.md` (section "Interactive PTY (node-pty, optional peer dependency)") and `docs/adapters/reference/03-run-handle-and-interaction.md` § 7.3.
- **Internal workspace dependencies pin the exact release version** and are rewritten by `sync-workspace-versions.mjs`, which is why publication order must come from the dependency graph.

## Workflow Overview

- `.github/workflows/publish.yml` is the **only** branch publication workflow. It runs on pushes to `main`, `staging`, and `develop`, is guarded by the `publish-<branch>` concurrency group, and owns validation, build, candidate publication, published-consumer validation, and channel promotion for every package in the inventory.
- `.github/workflows/release-tags.yml` creates the immutable release tag from the version `publish.yml` hands it. It never derives a version of its own.
- `.github/workflows/publish-packages-from-tag.yml` is a manual/recovery path only (see the FIX-001 section above).
- `.github/workflows/live-stack-published.yml` is the published-consumer validation lane, called with the exact release version before any channel moves.
- Branch → channel mapping is fixed in `scripts/lib/release-version.cjs`: `main` → `latest`, `staging` → `staging`, `develop` → `develop`. Any other branch is a hard error; inventing a dist-tag for an unknown branch is how stale artifacts reach production channels.
- `@a5c-ai/babysitter-observer-dashboard` is part of this central workflow. The former standalone `.github/workflows/observer-dashboard-publish.yml` path is retired, so observer-dashboard has no separate `main` release workflow.
- `@a5c-ai/atlas/catalog` ships from the atlas package as the public catalog dependency surface for SDK, hooks-adapter, adapters, and extensions-adapter consumers.
- Ordering constraints such as `genty-core` before `genty-platform`, `transport-adapter` before the downstream adapters CLI/root packages, and `hooks-adapter-genty` before `hooks-adapter-cli` are no longer maintained by hand: they fall out of the dependency-graph waves emitted by `scripts/release-matrix.cjs --group all-publishable --format waves`.

## Ownership Matrix

- `.github/workflows/publish.yml`: validates the monorepo, resolves the one release version, synchronizes and verifies every manifest, builds, publishes every public package under the candidate dist-tag in dependency-graph order, validates the exact published version from a clean consumer, and only then promotes the channel.
- `scripts/release-version.cjs` / `scripts/lib/release-version.cjs`: the release version source of truth. It replaces the previous practice of each release surface re-reading the checked-in root manifest.
- `scripts/sync-workspace-versions.mjs --version <releaseVersion>`: writes that one version into every workspace manifest; `release-version.cjs verify-manifests` proves it landed.
- `scripts/publish-package-from-tag.mjs`: the only `npm publish` caller. It runs each package's `verify:release` gate, hard-fails on any version disagreement, and cannot write a channel dist-tag.
- `scripts/release-promotion.cjs`: the only channel dist-tag mutation in the pipeline, gated on recorded validation evidence for that exact version.
- `scripts/bump-version.mjs` and `scripts/rollback-release.sh` are legacy helpers retained for manual use. **No workflow invokes them**, and neither is a version source of truth for a release.
- `packages/observer-dashboard/README.md`: user-facing install guidance for the published package; it should describe the same central release ownership as this document.

## Secrets & Permissions
- The workflow-level permissions block sets `contents: write`, `pages: write`, and `id-token: write`; read-only jobs such as `lint` reduce their scope to `contents: read`.
- `GITHUB_TOKEN` **must** retain `contents: write` so `release-tags.yml` can create the annotated release tag. The pipeline does **not** push a version-bump commit — manifest synchronization happens in the temporary publication workspace and is never committed back to the branch — so no PAT is needed for that. If branch protection blocks the Actions bot from creating tags, create a scoped PAT, store it as `RELEASE_BOT_TOKEN`, and replace usages in the workflow.
- `NPM_TOKEN` authenticates `npm publish` **and** the `npm dist-tag` calls in `release-promotion.cjs`; it must correspond to an account with publish rights to every package in the inventory, and should be rotated every 90 days.

## Guardrails
- All GitHub Actions are pinned to immutable SHAs.
- Because no version-bump commit is pushed back to the release branch, there is no recursive-run problem and no `[skip release]` / `[skip staging]` commit-message convention to honour. Nothing in `.github/workflows/` inspects those markers.
- Observer-dashboard release ownership must stay singular: if a future package-specific workflow is introduced, this document and the central workflow must be updated in the same change.
- A release version is never re-derived downstream, a channel dist-tag is never written by a publish step, and a channel never moves backward: `release-version.cjs assert-channel-tags preflight` refuses the run before anything is published.

## Rollback

Rolling back a *release* is not the same as rolling back a *channel*.

- **Channel rollback (npm).** Publication is immutable; the only reversible surface is the dist-tag. Move the channel back to a previously validated exact version with `scripts/release-promotion.cjs` and re-run `release-version.cjs assert-channel-tags final` over the whole inventory. This is an approved operational action, never an ordinary code-review step — the procedure and approval requirements are in `docs/release-recovery-runbook.md`. Never unpublish or republish an existing version; recover forward through a new patch version.
- **Git tag / GitHub Release rollback.** `scripts/rollback-release.sh vX.Y.Z` deletes the GitHub Release and remote tag (it assumes `gh` CLI authentication via `GH_TOKEN` or `gh auth login`). It is a manual helper, not part of any workflow, and it predates the `babysitter/<branch>/v<releaseVersion>` tag naming, so check the tag name before running it.
- Document every rollback action — command, actor, timestamp, result — in the incident ticket so the GO/NO-GO log stays auditable. The worked example is `docs/release-incident-2026-08-13.md`.

## Channel Behavior
- `main`, `staging`, and `develop` all publish through the same `publish.yml` contract and differ only in the resolved version shape and channel dist-tag: `main` publishes `X.Y.Z` to `latest`; `staging` and `develop` publish `X.Y.(Z+1)-<branch>.<short-sha>` to `staging` / `develop`.
- Every channel synchronizes **every** manifest to the release version before publishing. The pre-FIX-001 asymmetry — where only staging tags re-synchronized manifests, so a `main` tag published from stale checked-in manifests — is gone.
- Every channel publishes to the candidate dist-tag first and moves its channel tag only after published-consumer validation of that exact version succeeds.
- Every channel creates an immutable annotated tag through `release-tags.yml`, named for the exact published version.

## Operational Checklist
1. Ensure release-notes.md matches the changelog section before approving the release.
2. Tabletop the channel-rollback procedure in `docs/release-recovery-runbook.md` quarterly (Release Eng + Security) to confirm the dist-tag correction and channel-assertion steps are still valid.
3. When adding or removing a public package from the central release set, follow [How a new public package joins the matrices](#how-a-new-public-package-joins-the-matrices) — there is no longer a set of hand-maintained ownership lists to update in lockstep, and `npm run verify:metadata` is the check that proves coverage.
