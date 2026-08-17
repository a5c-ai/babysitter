# Release recovery runbook — candidate publish, published-consumer validation, channel promotion

Status: Wave 5 / Wave 6 operating procedure for the remediation program (`fix/remediation-program`)
Audience: the release owner (Yossi Elkrief) and package owners executing the recovery release
Incident context: [docs/release-incident-2026-08-13.md](./release-incident-2026-08-13.md)
Release model reference: [docs/release-pipeline.md](./release-pipeline.md)

> **Every command in the "recovery sequence" sections below mutates external
> registry state or a git remote and therefore requires explicit release-owner
> approval before it is run.** None of them has been executed. The Wave 5
> rehearsal recorded in the appendix ran only the local, read-only gates.

## 0. What this runbook encodes

The 2026-08-13 incident left 37 of 43 public packages with a stale `latest=6.0.0`
while 6.0.3 artifacts existed untagged, one package (`@a5c-ai/hooks-adapter-genty`)
unpublished, and two known-broken artifacts on the registry
(`@a5c-ai/tasks-adapter@6.0.0`, `@a5c-ai/extensions-adapter@6.0.0`).

The remediation program closed the code path that caused it. Recovery is now a
fixed, tool-enforced sequence:

```
resolve ONE immutable version
  -> synchronize every manifest to it
  -> local gates (fast checks + packed-artifact matrix)
  -> publish dependency-ordered candidates under candidate-<version> ONLY
  -> published-consumer validation of that EXACT version from npm
  -> promote the channel tag (the only dist-tag mutation)
  -> assert every public package's channel tag equals that version
  -> create the immutable release tag
  -> (separate approval) npm deprecate notices for the known-broken artifacts
```

Publication no longer promotes: `scripts/publish-package-from-tag.mjs` writes only
`candidate-<version>` and refuses to touch `latest` / `staging` / `develop`
(FIX-010). `scripts/release-promotion.cjs promote` is the single dist-tag
mutation in the pipeline, and it refuses to run without machine-readable
validation evidence naming that exact version with every required check
successful.

## 1. Preconditions (must all be true before step 2)

- [ ] The remediation branch is merged (or the release is cut from a ref that
      contains commits `25c8a959f..1eab5d4ad`, FIX-001..FIX-016).
- [ ] The registry snapshot in `docs/release-incident-2026-08-13.md` has been
      **refreshed** — npm state is time-sensitive.
- [ ] A release version is chosen that is unused across **all 43** public
      packages (6.0.4 or later; verify against the refreshed snapshot).
- [ ] `NPM_TOKEN` for the publishing account is available to the workflows, and
      the release owner has approved the registry mutations in this document.

Refresh the snapshot and prove the candidate version is unused (read-only):

```bash
# Authoritative inventory — 43 public packages, derived from tracked manifests.
npm run inventory:packages

# The package name list every loop below iterates (43 lines).
npm run --silent inventory:packages | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>JSON.parse(s).forEach(p=>console.log(p.name)))' > /tmp/public-packages.txt
wc -l < /tmp/public-packages.txt   # must be 43

# Refresh dist-tags/versions for every public package (read-only `npm view`).
mkdir -p artifacts
while read -r pkg; do
  echo "== $pkg"
  npm view "$pkg" dist-tags versions time.modified --json
done < /tmp/public-packages.txt | tee "artifacts/registry-snapshot-$(date -u +%Y%m%dT%H%M%SZ).txt"

# Prove the selected version is unused everywhere (must print no ALREADY PUBLISHED line).
RELEASE_VERSION=6.0.4
while read -r pkg; do
  npm view "$pkg@$RELEASE_VERSION" version >/dev/null 2>&1 && echo "ALREADY PUBLISHED: $pkg@$RELEASE_VERSION"
done < /tmp/public-packages.txt
```

## 2. Local pre-flight gates (safe to run; run them all)

These are the gates the Wave 5 rehearsal executed (appendix). Run them on the
exact ref that will be released.

```bash
# Fast repository checks
npm run verify:metadata
npm run guard:packages
npm run test:binary-renames
npm run test:release-tooling

# Full packed-artifact matrix over all 43 public packages (slow; the release gate).
# Per-package: build -> npm pack --ignore-scripts -> surface inventory -> shebangs
#              -> clean temp-consumer install -> root+subpath imports -> consumer
#              typecheck -> bin smoke -> the package's own verify:release gate.
npm run verify:release-artifacts
# One package at a time (what the rehearsal used):
node scripts/verify-release-artifacts.mjs --package @a5c-ai/tasks-adapter

# Wave-5 named behaviors
npm run test:packaged-surface-parity --workspace=@a5c-ai/tasks-adapter        # tasks root + MCP subpath imports
npm run test:packaged-surface-parity --workspace=@a5c-ai/extensions-adapter   # both extensions bins
node --test scripts/__tests__/hooks-atlas-ownership.test.mjs                  # hooks leaves/CLI isolated Atlas resolution
node --test scripts/__tests__/hooks-adapter-genty-packed.test.mjs             # the previously unpublished hooks leaf
npm run test:babysitter-metapackage                                          # babysitter CLI exit-code propagation
npm run test:node-engine-floor --workspace=@a5c-ai/adapters-gateway          # gateway Node engine floor
npm exec --yes --package=vitest -- vitest run --config packages/adapters/core/vitest.config.ts \
  packages/adapters/core/tests/pty.test.ts packages/adapters/core/tests/pty-consumer.packaged.test.ts
```

The publication waves the release will follow are derived, never hand-written:

```bash
node scripts/release-matrix.cjs --group all-publishable --format waves
node scripts/release-matrix.cjs --group hooks-leaves --format workspaces
```

`@a5c-ai/hooks-adapter-genty` must publish before `@a5c-ai/hooks-adapter-cli`;
the derived waves already encode that order.

## 3. Recovery sequence — APPROVAL REQUIRED FROM HERE ON

### 3.1 Resolve and record the one release version

```bash
RELEASE_BRANCH=main            # or staging / develop
SHORT_SHA=$(git rev-parse --short=12 HEAD)

# THE authoritative release identity, resolved exactly once. The JSON payload
# carries branch, releaseVersion, distTag, releaseTag and shortSha.
node scripts/release-version.cjs resolve \
  --branch "$RELEASE_BRANCH" \
  --sha "$SHORT_SHA" \
  --commit "$(git rev-parse HEAD)" \
  --write release-version.json

RELEASE_VERSION="$(node scripts/release-version.cjs resolve \
  --branch "$RELEASE_BRANCH" --sha "$SHORT_SHA" --print releaseVersion)"
RELEASE_BRANCH_DIST_TAG="$(node scripts/release-version.cjs resolve \
  --branch "$RELEASE_BRANCH" --sha "$SHORT_SHA" --print distTag)"   # latest | staging | develop

# Validate an explicitly chosen version against the resolver instead of
# trusting a manifest.
node scripts/release-version.cjs verify \
  --branch "$RELEASE_BRANCH" --sha "$SHORT_SHA" --version "$RELEASE_VERSION"

# The non-production dist-tag every candidate publishes under.
CANDIDATE_DIST_TAG="$(node scripts/release-promotion.cjs candidate-tag --version "$RELEASE_VERSION")"
echo "$CANDIDATE_DIST_TAG"   # -> candidate-6.0.4
```

The resolver derives the release version from the **root** `package.json` plus the
branch channel, so bumping to the approved recovery version means bumping the
root manifest first (`node scripts/bump-version.mjs` / an approved version-bump
PR) and re-running `resolve`. `--root-version <v>` overrides it for a rehearsal.

### 3.2 Synchronize every manifest, then prove it

```bash
node scripts/sync-workspace-versions.mjs --version "$RELEASE_VERSION"
# Hard-fails unless EVERY manifest version and every internal dependency pin
# is exactly $RELEASE_VERSION. This is the check the incident lacked.
node scripts/release-version.cjs verify-manifests --version "$RELEASE_VERSION"

# Refuses a release that would move any channel tag backward (read-only).
node scripts/release-version.cjs assert-channel-tags \
  --version "$RELEASE_VERSION" \
  --dist-tag "$RELEASE_BRANCH_DIST_TAG" \
  --mode preflight
```

`$RELEASE_BRANCH_DIST_TAG` (resolved in 3.1) is `latest` for `main`, `staging`
for `staging`, `develop` for `develop`.

### 3.3 Publish dependency-ordered candidates (registry mutation #1)

**Preferred path — let the workflow do it.** Pushing the release branch runs
`.github/workflows/publish.yml`, which performs 3.1–3.6 in order. The manual
equivalent below exists for recovery only.

**Recovery path — from an immutable release tag.** Create and push the tag, then
`.github/workflows/publish-packages-from-tag.yml` derives the exact version from
the tag name, re-synchronizes every manifest, and publishes the derived waves:

```bash
# Idempotent local annotated tag carrying release provenance. Never moves an
# existing release tag, never pushes.
node scripts/release-version.cjs ensure-tag \
  --version "$RELEASE_VERSION" \
  --branch "$RELEASE_BRANCH" \
  --commit "$(git rev-parse HEAD)" \
  --source manual

# APPROVAL REQUIRED: pushing the tag starts the recovery publication.
git push origin "babysitter/$RELEASE_BRANCH/v$RELEASE_VERSION"

# Or dispatch the recovery workflow against an existing tag:
gh workflow run publish-packages-from-tag.yml \
  -f tag="babysitter/$RELEASE_BRANCH/v$RELEASE_VERSION"
```

Manual per-package publication (only if the workflow is unavailable; run the
waves in the derived order, never ad hoc):

```bash
npm ci --force
npm run build   # the publish helper is invoked with --skip-build

node scripts/release-matrix.cjs --group all-publishable --format waves | while read -r wave; do
  for workspace in $wave; do
    # APPROVAL REQUIRED: this is `npm publish --tag candidate-<version>`.
    node scripts/publish-package-from-tag.mjs \
      --workspace="$workspace" \
      --release-version="$RELEASE_VERSION" \
      --skip-build
  done
done
```

`publish-package-from-tag.mjs` hard-fails when the workspace manifest version,
the tag version and the requested version disagree; it runs each package's
`verify:release` gate before `npm publish --ignore-scripts`; it publishes under
`candidate-<version>` and **never** writes a channel tag.

After this step: every public package is installable at the exact version and
under `candidate-<version>`. No channel has moved. `latest` still resolves to the
previous (stale) release — that is intended.

### 3.4 Published-consumer validation of the exact version (read-only against npm)

```bash
# Workflow path (what publish.yml / publish-packages-from-tag.yml call):
gh workflow run live-stack-published.yml \
  -f release_version="$RELEASE_VERSION" \
  -f candidate_dist_tag="$CANDIDATE_DIST_TAG" \
  -f ref="babysitter/$RELEASE_BRANCH/v$RELEASE_VERSION"
# `channel` is deliberately left empty pre-promotion: the channel still resolves
# the PREVIOUS release until 3.5.

# Local equivalent of the published_consumer job (installs all 43 packages at the
# exact version into a clean consumer, imports every root + exported runtime
# subpath, smokes every declared bin):
node scripts/verify-published-release.mjs --version "$RELEASE_VERSION"
```

Gate the promotion on the evidence artifact, not on a green checkmark:

```bash
gh run download <run-id> --name published-consumer-validation --dir artifacts/published-consumer

# Proves the exact version passed every REQUIRED check (no registry access).
node scripts/release-promotion.cjs assert-validated \
  --version "$RELEASE_VERSION" \
  --dist-tag "$RELEASE_BRANCH_DIST_TAG" \
  --evidence artifacts/published-consumer/validation.json
```

If validation fails, **stop**. The candidate stays installable by exact version
and under `candidate-<version>` for diagnosis; the channel is untouched. Fix
forward with a new patch version — never overwrite, never unpublish.

### 3.5 Promote the channel (registry mutation #2 — the only dist-tag write)

```bash
# Rehearse first: prints the per-package dist-tag plan and mutates nothing.
node scripts/release-promotion.cjs promote \
  --version "$RELEASE_VERSION" \
  --dist-tag "$RELEASE_BRANCH_DIST_TAG" \
  --evidence artifacts/published-consumer/validation.json \
  --dry-run

# APPROVAL REQUIRED: moves every public package's channel tag to the validated
# version and re-asserts it.
node scripts/release-promotion.cjs promote \
  --version "$RELEASE_VERSION" \
  --dist-tag "$RELEASE_BRANCH_DIST_TAG" \
  --evidence artifacts/published-consumer/validation.json
```

This is the step that repairs the incident: it moves all 37 stale `latest` tags
(and the 5 already-current ones, idempotently) to one tested version.

### 3.6 Assert the registry end state over the FULL inventory

```bash
node scripts/release-version.cjs assert-channel-tags \
  --version "$RELEASE_VERSION" \
  --dist-tag "$RELEASE_BRANCH_DIST_TAG"
```

The release is not complete until this passes for **all 43** packages — never a
sample. Re-running it is the idempotency check: a repeated release passes and
moves nothing.

### 3.7 Create the immutable release tag (if not already created in 3.3)

```bash
gh workflow run release-tags.yml \
  -f release_version="$RELEASE_VERSION" \
  -f branch="$RELEASE_BRANCH"
```

`release-tags.yml` accepts the version rather than re-deriving it, and records
provenance in the annotated tag body
(`node scripts/release-version.cjs tag-message ...`).

### 3.8 Pin the newly published Genty hooks leaf in the hooks CLI — REQUIRED FOLLOW-UP

`@a5c-ai/hooks-adapter-genty` has never existed on npm, so
`packages/adapters/hooks/cli/package.json` deliberately does **not** pin it: an
exact pin on a version that is not in the registry fails both clean-consumer
verification and the exact-internal-dependency registry gate in
`scripts/publish-package-from-tag.mjs`. The deferral is recorded in the manifest
itself under the `//deferred-dependency` key.

The moment 3.4 publishes the Genty leaf, that constraint disappears and the pin
must be added — otherwise `@a5c-ai/hooks-adapter-cli` keeps resolving the Genty
adapter only through workspace hoisting, which is the FIX-006 defect class:

```bash
# AFTER @a5c-ai/hooks-adapter-genty@$RELEASE_VERSION exists on the registry:
npm view "@a5c-ai/hooks-adapter-genty@$RELEASE_VERSION" version   # must succeed

# 1. Add the exact pin next to the other eleven leaves and delete the
#    "//deferred-dependency" key from packages/adapters/hooks/cli/package.json.
# 2. Regenerate the lockfile from the repository root (Node 22 toolchain):
npm install --package-lock-only --ignore-scripts

# 3. Re-run the gates that now cover it:
node --test scripts/__tests__/publish-package-from-tag.test.mjs
node --test scripts/__tests__/release-matrix.test.mjs
node --test scripts/__tests__/dependency-ownership.test.mjs
node scripts/verify-release-artifacts.mjs --package @a5c-ai/hooks-adapter-cli
```

Once the pin is in place, the publish helper's exact-internal-dependency
registry check covers the Genty leaf for the CLI on every subsequent release,
which is what FIX-005's remaining two acceptance criteria ask for. Record the
commit that adds the pin in the release issue.

## 4. Deprecation notices — SEPARATE, EXPLICIT APPROVAL

These are **not** part of the recovery release. Each requires its own
release-owner decision, recorded with command, actor, timestamp and result in
`docs/release-incident-2026-08-13.md` or the recovery release issue. Do **not**
unpublish anything as ordinary remediation.

```bash
# FIX-002 — tasks adapter 6.0.0 omits its MCP SDK runtime dependency.
npm deprecate @a5c-ai/tasks-adapter@6.0.0 \
  "6.0.0 is missing its @modelcontextprotocol/sdk runtime dependency and fails on import from a clean consumer (FIX-002). Upgrade to 6.0.4 or later."

# FIX-004 — extensions adapter 6.0.0 tarball is missing its declared bin target.
npm deprecate @a5c-ai/extensions-adapter@6.0.0 \
  "6.0.0 ships without the declared dist/extension-adapter.js bin target; both binaries are unusable (FIX-004). Upgrade to 6.0.4 or later."

# Verify (read-only):
npm view @a5c-ai/tasks-adapter@6.0.0 deprecated
npm view @a5c-ai/extensions-adapter@6.0.0 deprecated

# Undo, if a notice was applied in error:
npm deprecate @a5c-ai/tasks-adapter@6.0.0 ""
```

Deprecation is advisory: it does not remove the version and does not change any
dist-tag. Apply it only **after** 3.6 succeeds, so the replacement the message
names actually resolves.

## 5. Evidence to record in the release issue

- The refreshed pre-release registry snapshot (section 1).
- Local gate results (section 2), including the `artifacts/release-verifier/`
  per-package reports and `summary.json`.
- The publish workflow run URL and the derived publication waves.
- The `published-consumer-validation` artifact (`validation.json`) for the exact
  version.
- The `release-promotion.cjs promote` output and the
  `release-promotion-evidence` artifact.
- The final `assert-channel-tags` output over all 43 packages.
- Tarball checksums for the released artifacts (`shasum -a 512` of each
  `npm pack` output, or the registry `dist.integrity` values).
- Any deprecation decisions with approver and timestamp.

## Appendix — Wave 5 local candidate rehearsal (2026-08-13)

Executed on `fix/remediation-program` at `1eab5d4ad`. **No registry state was
mutated**: nothing was published, deprecated, dist-tagged or unpublished, and
nothing was pushed. This rehearsal proves the artifacts a candidate publication
*would* upload are usable from a clean consumer.

Deliberately **not** executed (they require registry state that does not exist
yet, or release-owner approval): sections 3.3–3.7 and section 4, and
`scripts/verify-published-release.mjs`, which installs from the registry and can
only run after the candidate versions are published.

### Packed-artifact matrix (`node scripts/verify-release-artifacts.mjs --package <name>`)

Per-package steps: `build`, `pack`, `surfaces`, `shebangs`, `install`, `imports`,
`typecheck`, `bins`, and `verifyRelease` where the package declares one.

Command: `node scripts/verify-release-artifacts.mjs --package <name>` (12 packages
in one dependency-ordered invocation). Reports: `artifacts/release-verifier/`.

| Package | Result | Failing step |
| --- | --- | --- |
| `@a5c-ai/atlas` | PASS | — |
| `@a5c-ai/tasks-adapter` | PASS (FIX-002/FIX-012) | — |
| `@a5c-ai/extensions-adapter` | PASS (FIX-004) | — |
| `@a5c-ai/comm-adapter` | PASS (FIX-009) | — |
| `@a5c-ai/adapters-gateway` | PASS (FIX-008) | — |
| `@a5c-ai/hooks-adapter-genty` | PASS (FIX-005) | — |
| `@a5c-ai/hooks-adapter-claude` | PASS (FIX-006) | — |
| `@a5c-ai/hooks-adapter-codex` | PASS (FIX-006) | — |
| `@a5c-ai/hooks-adapter-gemini` | PASS (FIX-006) | — |
| `@a5c-ai/hooks-adapter-cli` | PASS (FIX-005/FIX-006) | — |
| `@a5c-ai/babysitter-sdk` | PASS | — |
| `@a5c-ai/babysitter` | PASS (FIX-007) — after the gate defect below was fixed | — |

Totals: 12 passed, 0 failed of 12.

#### Full 43-package matrix (2026-08-14)

Rerun after the release path stopped tolerating known packed-artifact failures
(`.github/workflows/publish.yml` now passes `allow_known_failures: 'false'`;
`scripts/known-package-defects.json` `packedArtifact` is empty and stays empty).

Command: `node scripts/verify-release-artifacts.mjs` (no `--package`, no
`--allow-known-failures`). Running the complete matrix for the first time
surfaced four consumer-facing defects that the 12-package rehearsal never
covered. All four are fixed at the source — none is allowlisted:

| Package | Defect found by the strict matrix | Fix |
| --- | --- | --- |
| `@a5c-ai/genty-platform` | published `./runtime` subpath resolved to a declaration file with no top-level export, so a consumer `import` failed to typecheck (TS2306) | `export {}` in the intentionally-empty barrel |
| `@a5c-ai/transport-adapter` | `adapters-transport-proxy --help` (and the deprecated `adapters-proxy`) answered "Error: Missing targetProvider" with exit 1 | real usage text on stdout, exit 0, pinned by `tests/bin-smoke.test.ts` |
| `@a5c-ai/channels-adapter` | `adapters-channels --help` was treated as the config path and answered "invalid config" with exit 1 | `--help`/`--version` handled before the config path, pinned by `src/__tests__/cli-bin-smoke.test.ts` |
| `@a5c-ai/kradle` | `kradle-server --help` started the HTTP server and hung until the gate timed it out | both flags answered before the server module is imported, pinned by `tests/bin-smoke.test.js` |

One gate correction, in the same class as the bin-only-metapackage correction
above: `@a5c-ai/genty-ui` is a React Native component library whose entrypoint
transitively evaluates react-native's Flow-typed `index.js`. No publishing
change makes that importable by bare Node. The package now declares its runtime
through the standard top-level `"react-native"` resolution field, and the
verifier skips exactly that one step for packages carrying that declaration —
`surfaces`, `install`, `typecheck`, `bins` and `verify:release` still run, and
direct-dependency ownership is audited separately for all 43 packages.

#### Release-gate defect found by this rehearsal, and fixed

The first pass failed `@a5c-ai/babysitter` at the `imports` step:

```
Error: Cannot find package '<consumer>/node_modules/@a5c-ai/babysitter/index.js'
  imported from <consumer>/fix011-import-check.mjs   (ERR_MODULE_NOT_FOUND)
```

`@a5c-ai/babysitter` is a **bin-only metapackage**: no `main`, no `module`, no
`exports`, `files` = `bin/` + `README.md`. Its `build`, `pack`, `surfaces`,
`shebangs` and `install` steps all passed — the failure was the gate asserting
something the package never promised.

Root cause: `scripts/lib/package-surface.cjs` `runtimeImportSpecs()`
synthesized a root import specifier for any manifest without an `exports`
field, without first checking that the package declares an importable root, so
Node fell back to legacy main resolution and looked for an `index.js` this
package deliberately never ships.

Why it was release-blocking, not cosmetic: `scripts/verify-published-release.mjs`
(FIX-010, the post-publication gate whose evidence unlocks promotion) imports
the **same** `runtimeImportSpecs`, so the `published_consumer` job would have
failed on `@a5c-ai/babysitter` for the same reason and `promote_release_channel`
would never have run.

Fix (commit "fix(release-tooling): package-surface omits root import spec for
bin-only packages" on `fix/remediation-program`):

- `runtimeImportSpecs()` returns no root spec when the manifest declares no
  `main`, no `module` and no `exports`;
- a new shared `consumerSurfaceProblem()` keeps "nothing to check" from becoming
  a pass: a package with **neither** an importable root **nor** a bin now fails
  loudly in both gates (`surfaces` step pre-publication, `root-import` check
  post-publication);
- two fixtures under `scripts/__tests__/fixtures/fix011/`
  (`bin-only-metapackage`, `no-consumer-surface`) and four regression tests —
  two in `scripts/__tests__/verify-release-artifacts.test.mjs`, two in
  `scripts/__tests__/verify-published-release.test.mjs` — all proven RED against
  the pre-fix source and GREEN after.

After the fix `@a5c-ai/babysitter` passes with `imports` recorded as skipped
(`package declares no importable root or exported runtime subpath`) and its
`babysitter` bin smoked.

### Wave-5 named behaviors

Every behavior named in the Wave 5 checklist was confirmed by an executable
gate, not by inspection.

| Wave 5 behavior | Gate executed | Result |
| --- | --- | --- |
| Tasks root + MCP subpath imports | `npm run test:packaged-surface-parity --workspace=@a5c-ai/tasks-adapter` | PASS — packed tarball installs, every `exports` subpath imports and typechecks in a clean consumer, tarball matches the documented surface |
| Both extensions bins | `npm run test:packaged-surface-parity --workspace=@a5c-ai/extensions-adapter` | PASS — `adapters-extensions` and `extensions-adapter` both run from a clean install; the legacy bin emits its deprecation warning and returns the delegated exit code |
| All hooks leaves + hooks CLI resolution | `node --test scripts/__tests__/hooks-atlas-ownership.test.mjs` | PASS 6/6 — every Atlas-importing hooks package declares it directly; a leaf resolves Atlas through its OWN dependency in a **non-hoisted** consumer; the CLI installs, imports and runs from its tarball non-hoisted |
| Previously unpublished Genty hooks leaf | `node --test scripts/__tests__/hooks-adapter-genty-packed.test.mjs` | PASS 1/1 — installs and imports from its packed tarball in a clean consumer |
| Babysitter CLI exit behavior | `npm run test:babysitter-metapackage` | PASS 6/6 — packed shim is byte-identical to the workspace shim; exits 0 on resolve 0, **7 on resolve 7**, 1 with exactly one handled error on rejection |
| Gateway minimum Node | `npm run test:node-engine-floor --workspace=@a5c-ai/adapters-gateway` | PASS 5/5 — manifest floor == runtime constant == README == CI matrix; `node:sqlite` reached only via `dist/runtime/node-sqlite.js`; below-floor runtimes rejected with the actionable diagnostic |
| Interactive PTY behavior | `vitest run --config packages/adapters/core/vitest.config.ts tests/pty.test.ts tests/pty-consumer.packaged.test.ts` | PASS 16/16 — required vs. preferred contract holds; an installed-but-broken node-pty fails loudly in both modes instead of silently degrading to pipes |

### Rehearsal verdict

**Ready.** All 12 verified tarballs install, import, typecheck and expose their
bins from a clean consumer, and every Wave 5 behavior is green. The one gate
defect this rehearsal exposed (the bin-only-metapackage root-import false
positive, which would have blocked channel promotion in FIX-010) was fixed with
regression coverage in both gates. Repository gates re-run green afterwards:
`verify:metadata`, `guard:packages`, `test:binary-renames`, and
`test:release-tooling` (107/107).

Nothing on the registry has changed. Section 3 remains unexecuted and still
requires release-owner approval.
