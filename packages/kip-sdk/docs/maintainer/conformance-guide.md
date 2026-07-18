# kip-sdk conformance suite (maintainer's guide)

How the **shippable conformance suite** works, how it guards itself against drift, and the exact
step-by-step for adding a new invariant test. The normative catalog is
[`../60-conformance-and-testability.md`](../60-conformance-and-testability.md) (referred to below as
"docs/60"); the runnable artifact lives under `src/__tests__/conformance/`.

**Companion maintainer docs:** [`architecture.md`](./architecture.md) (the module map + the invariants
each INV pins) and [`contributing.md`](./contributing.md) (the TDD/adversarial-review workflow and the
build/test gates this suite runs under).

---

## 1. The shape

docs/60 §8.4 requires the invariant catalog to **ship as a runnable, self-describing artifact** — "so a
future missing INV fails CI". That artifact is two files plus a directory of per-invariant tests:

- **`src/__tests__/conformance/suite.ts`** — the manifest. A single `CONFORMANCE_SUITE` array that
  enumerates **every** invariant id, its §8.4 title, the docs/60 section it lives under, and the
  conformance `*.test.ts` file(s) that prove it. It is **not** a test (no `.test.ts` suffix, so vitest's
  include glob skips it) — it is the importable index the completeness guard folds over.
- **`src/__tests__/conformance/suite-completeness.test.ts`** — the executable guard that keeps the
  manifest in exact lockstep with docs/60 and with the files on disk.
- **`src/__tests__/conformance/inv-*.test.ts`** — one file per invariant (some split into a base +
  `-m2-surface` / `-m3-surface` / `-m7-surface` companion), each carrying a canonical
  `describe("INV-<id>: …")` block.

The manifest enumerates all **40** invariant ids: the core parents `INV-1..INV-19`, their milestone
sub-invariants (`INV-2a`, `INV-4a`, `INV-6a`, `INV-7a`, `INV-13a`, `INV-14a`, `INV-14b`), and the
active-knowledge set `INV-A1..INV-A14`. `CONFORMANCE_SUITE` also exports the derived
`CONFORMANCE_INVARIANT_IDS`, a hand-maintained `DOCS60_INVARIANT_IDS` mirror, and the
`testFilesFor(id)` lookup.

Every entry also carries a `coverage` disposition (`"covered"` | `"tracked-gap"`, default `"covered"`).
Today **every** entry is fully `"covered"` — no invariant is a tracked gap. The value is retained so a
future genuinely-incomplete half can be catalogued honestly rather than silently dropped.

---

## 2. The doc-anchored completeness guard

`suite-completeness.test.ts` reads **no implementation module** and asserts nothing about the
invariants' own pass/fail — only about their **registration**. It parses docs/60 at test time and
enforces:

1. **Manifest ≡ docs/60 anchors (both directions).** It scans docs/60 for its own
   `<a id="inv-…">` anchors and asserts the manifest's id set equals the parsed anchor set exactly. A
   new `INV` added to the doc with no manifest entry — or a manifest entry with no doc anchor — **fails
   CI here**, naming the offending id. (It also sanity-checks that it parsed `> 30` anchors, so a broken
   path can't make the guard vacuously pass.)
2. **Mirror ≡ docs/60 anchors.** The hand-maintained `DOCS60_INVARIANT_IDS` array is *also* diffed
   against the parsed anchors, so drift between the doc and the mirror fails too.
3. **Every named `testFiles` entry exists on disk** and **carries the canonical `describe` title.** The
   title regex (`hasCanonicalDescribeTitle`) requires a boundary char after the id (`:`, space, or `(`),
   so `INV-1` never matches inside `INV-14`, and `INV-14` never matches inside `INV-14a`. A rename that
   silently drops an invariant's canonical block is caught.
4. **No orphans.** Every `inv-*.test.ts` physically present in the directory is claimed by exactly one
   manifest entry (`suite.ts` and `suite-completeness.test.ts` are the only exempt non-invariant files).
5. **No stealth tracked-gaps.** Every entry's `coverage` must be `"covered"`; a regression that
   re-brands any invariant `"tracked-gap"` fails here. As a belt-and-braces check it also asserts
   `inv-14b.test.ts` contains **no** `it.fails` (its A-1 attested-hole half became a real passing `it`
   in M9).

The upshot: **coverage is complete exactly when this guard passes**, and any future gap — a new docs/60
INV with no test, or a deleted test file — makes it fail, naming the offender.

Run just this guard:

```bash
npm run test --workspace=@a5c-ai/kip-sdk -- suite-completeness
```

---

## 3. The INV test naming convention

Each invariant's test file must carry a canonical top-level block titled with the exact id followed by a
boundary character:

```ts
describe("INV-1: proj determinism + replica-local-input independence", () => { /* … */ });
describe("INV-A1: microagents-are-clients — no active-layer path mutates state except by appending a signed fact", () => { /* … */ });
describe("INV-14b: excised chain slot is an attested hole, not a gap (A-1, excision×seq)", () => { /* … */ });
```

Rules the completeness guard enforces on the title:

- The `describe` string must **start** with `INV-<id>` and the next character must be `:`, a space, or
  `(` — this is what keeps `INV-1` from matching inside `INV-14`.
- The `<id>` is upper-cased with the segment after the first hyphen keeping case as written in docs/60's
  anchor: `inv-14b` → `INV-14b`, `inv-a7` → `INV-A7`.
- File basenames are lower-case `inv-<id>.test.ts`; a milestone-surface companion adds a suffix, e.g.
  `inv-2a-m3-surface.test.ts`, and **both** basenames go in that invariant's `testFiles` array.

---

## 4. How to add a new INV test

Say docs/60 gains `INV-20`. Do all of the following, in order:

1. **Add the anchor to docs/60.** In `../60-conformance-and-testability.md`, catalog the new invariant
   under its section with an anchor exactly matching the id, e.g. `<a id="inv-20">`. The completeness
   guard parses this anchor — it is the source of truth.
2. **Write the test file.** Create `src/__tests__/conformance/inv-20.test.ts` with a canonical block:

   ```ts
   import { describe, expect, it } from "vitest";
   import { KipRepo } from "../../index";

   describe("INV-20: <the §8.4 headline for this invariant>", () => {
     it("<the property it proves>", async () => {
       // exercise the real surface; assert the invariant holds.
     });
   });
   ```

3. **Register it in the manifest.** Add an entry to `CONFORMANCE_SUITE` in
   `src/__tests__/conformance/suite.ts`, in doc order:

   ```ts
   { id: "INV-20", title: "<verbatim §8.4 title>", section: "<n>", testFiles: ["inv-20.test.ts"] },
   ```

4. **Update the hand-maintained mirror.** Add `"INV-20"` to `DOCS60_INVARIANT_IDS` in the same file
   (the guard fails if the mirror drifts from the parsed anchors).
5. **Run the guard.** It confirms the manifest, the mirror, and the on-disk file all agree:

   ```bash
   npm run test --workspace=@a5c-ai/kip-sdk -- suite-completeness
   ```

6. **Run your new test** in isolation, then the full suite before committing (see §6). The vitest
   positional filter takes the **bare invariant id** — the same mechanism §6 uses for
   `suite-completeness` — so `-- inv-20` runs just your new `inv-20.test.ts`. Substitute your id; the
   example below runs the existing `INV-12` file to show the shape:

   ```bash
   # run a single INV file by its bare id (substitute your new invariant's id)
   npm run test --workspace=@a5c-ai/kip-sdk -- inv-12
   ```

If you *remove* an invariant, do the inverse: delete the anchor, the test file, the manifest entry, and
the mirror entry — the guard fails if any of the four survives without the others.

> The manifest's `requiredParents` check also asserts every `INV-1..INV-19` and every `INV-A1..INV-A14`
> stays registered, so you cannot drop a parent invariant even if you forget to touch the anchors.

---

## 5. The other suite-hardening guards

Two more self-checks ship alongside the conformance suite (work item `suite-hardening`, DEBTS D-38):

- **No-silent-skips** (`src/__tests__/no-silent-skips.test.ts`). Recursively scans **every** test file
  under `src/__tests__/` for static `it.skip(` / `test.skip(` / `describe.skip(` markers and fails if
  any skip lacks a documented justification — either an inline `// SKIP-REASON: <tracked ref>` tag
  within the match window, or a `DOCUMENTED_SKIP_REGISTRY` entry (empty today). This converts a "silent
  skip" into a "tracked gap"; a new undocumented skip fails CI naming its file:line. Runtime conditional
  skips (`ctx.skip(reason)`, e.g. the live-probe gate in `graph-qa-live.test.ts`) are out of scope — they
  report a reason at runtime and are not static markers.
- **Temp-dir hygiene** (`src/__tests__/temp-dir-hygiene.test.ts`). D-38 regression proofs: `KipRepo.close()`
  must delete every `Substrate.createTemp()`-provisioned temp dir (the disk-exhaustion leak that twice
  filled the host `C:` drive), `writeJsonAtomic()` must leave no orphaned `.tmp-*` on a rename failure,
  and the side-file stores (`KeyRegistryStore`, `SelfWitnessedExcisionStore`) must surface a **typed**
  `ERR_*` error on a torn file, never a raw `SyntaxError`. It is paired with a suite-level sweep
  (`src/__tests__/setup/temp-dir-sweep.ts`, wired via `test.setupFiles` in `vitest.config.ts`) that
  `rmSync`s any still-present tracked `kip-sdk-*` dir after every test, keeping the shared `os.tmpdir()`
  population bounded under parallel load.

```bash
npm run test --workspace=@a5c-ai/kip-sdk -- no-silent-skips temp-dir-hygiene
```

A third guard, `src/__tests__/temp-dir-sweep-invariant.test.ts`, protects the sweep's own safety
precondition: it statically scans every `*.test.ts` and fails if any `beforeAll`/`beforeEach` hook
constructs a **bare** `new KipRepo()` (one with no explicit `dir:`), whose memoized `createTemp()`
substrate dir the `afterEach` sweep would delete out from under a repo shared across `it()`s. It turns
the previously comment-only "no bare-repo reuse across `it()`s" assumption into a harness-checked
constraint.

There is also `test-timeout-config.test.ts`, which pins `vitest.config.ts`'s `testTimeout` at `>= 15000`
(it is set to `20000`) so the git-heavy conformance files can never silently regress to the flaky
implicit-5000ms default that caused the D-38 item-4 flake.

---

## 6. Running the suite + the cross-OS CI job

The full package suite (which includes `src/__tests__/conformance/**`):

```bash
npm run test:kip
```

`vitest.config.ts` defines two projects: a `unit` project running everything in parallel (with a
fork-concurrency cap `min(4, cpus)` to tame fs contention), and an `e2e-dist-serial` project that runs
the three `dist`-mutating / binary-spawning files (`e2e-cli`, `e2e-mcp`, `graph-qa-live`) **one at a
time** (`fileParallelism: false`) so their shared `dist/` builds and subprocess spawns never overlap.

**Cross-OS CI** is `.github/workflows/kip-conformance-cross-os.yml`. On every push to `main`/`staging`
and on PRs touching `packages/kip-sdk/**`, it runs a `windows-latest` × `ubuntu-latest` matrix that
builds kip-sdk (`npm run build:kip`) and then runs the **entire** package suite
(`npm run test --workspace=@a5c-ai/kip-sdk`) on each OS — so any cross-OS divergence (path separators,
line endings, TZ/locale, temp-dir handling) fails on whichever OS produces the different result. It
carries a documented workaround step that `npm install --no-save`s the Linux optional native deps
(`@esbuild/linux-x64`, `@rollup/rollup-linux-x64-gnu`) because `npm ci` on a Windows-generated lockfile
can miss them. (The narrower `kip-inv12-golden-digest.yml` predates it and covers only the single
golden-digest file cross-OS.)
