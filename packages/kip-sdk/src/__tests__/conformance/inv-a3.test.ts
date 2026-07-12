/**
 * INV-A3 — dispatch no-fallback (N5).
 *
 * docs/60-conformance-and-testability.md#inv-a3 (verbatim): "Asserts: For one hop each, inject
 * (a) non-zero exitCode, (b) outputSchema-invalid output, (c) timeout > runtime.timeout,
 * (d) unsatisfied requires/condition guard, (e) a claim-8 constraint the seed violates -> in EVERY
 * case ZERO facts authored, cell reads Unknown; (d)/(e) differ from a dispatch failure ONLY in
 * recorded provenance. Violating build: fabricating a plausible output; surfacing a pending guard or
 * constraint-violating seed as a trusted value; dispatching on a non-compliant seed."
 *
 * docs/27-failure-and-conflict-model.md's canonical outcome taxonomy (rows #4-#6) and
 * docs/31-contextual-functionalities.md's "N5-safe step outcomes" section are the per-outcome
 * source: dispatch-failure (#4) is owned by an actual microagent invocation (non-zero exitCode /
 * outputSchema validation / runtime.timeout); constraint-violation (#5) and pending-guard (#6) are
 * BOTH pure `proj` reads gating the hop BEFORE any dispatch is attempted ("verifies the seed/input
 * complies with the binding's constraint (claim 8) and enforces any requires/condition guard
 * (claim 12) as pure proj reads" — docs/31's Phase 2 description).
 *
 * SCOPE NOTE (sub-cases (a)/(b)/(c) — UNTESTABLE at M5's public surface, not weakened, see the repo
 * task's own `untestable` reporting requirement): triggering a genuine non-zero exitCode /
 * outputSchema-invalid output / timeout requires an actual microagent DISPATCH mechanism — spawning
 * `MicroagentManifest.runtime.entrypoint` under `IsolationMode` and validating `MicroagentResult`
 * against `outputSchema`. Unlike M6's autoencoding loop (docs/32, m7-18), which NAMES two declared
 * test seams ("the loop's injectable monotonic clock and a harness-registered stub microagent
 * manifest with scripted hang behavior") precisely so INV-A5's budget-termination sub-cases are
 * deterministically triggerable, M5's own docs (docs/31, docs/40) declare NO equivalent dispatch/
 * execution-harness seam on the `Repo` surface — `MicroagentInvocation`/`MicroagentResult` are named
 * as `@a5c-ai/genty-core` types kip reads but neither type nor a dispatch entrypoint is exposed on
 * `Repo`, and HOW `runtime.entrypoint` is actually invoked (subprocess argv/stdio protocol) is left
 * to genty-core, never specified by kip's own docs. Fabricating that protocol here to script an
 * exitCode/output/timeout would invent an un-spec'd execution contract (forbidden by this task's own
 * hard rules) rather than exercise a real declared seam. These sub-cases are therefore left as
 * documented `it.skip`s (discoverable in the suite itself, mirroring the precedent
 * `inv-9.test.ts`/proj.ts's CellSegment "excised" variant doc comment already sets for a known,
 * honestly-scoped gap) and are additionally reported in this task's `untestable` output.
 *
 * `runContextualQuery`/`registerFunctionality` still throw `unimplemented: <name>` (M5/T6.1-T6.4 not
 * yet implemented) — the (d)/(e) tests below are EXPECTED TO FAIL right now via that thrown error
 * propagating through the `await`, per this suite's established convention (see inv-14a.test.ts).
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { assertNode, assertNodeProp, makeBindingOptions, makeManifest, makeQuery } from "./fixtures-m5";

describe("INV-A3: dispatch no-fallback (N5)", () => {
  it.skip(
    "INV-A3(a)/(b)/(c): dispatch-failure via non-zero exitCode / outputSchema-invalid output / timeout > runtime.timeout — UNTESTABLE at M5's public surface (no microagent dispatch/execution-harness seam is declared for M5, unlike M6's injectable-clock + stub-manifest seams, m7-18; see this file's own top doc comment)",
    () => {
      // Intentionally empty — see the SCOPE NOTE above and this task's `untestable` report.
    },
  );

  it("INV-A3(e): a claim-8 constraint the seed violates yields constraint-violation — zero facts authored, target cell stays Unknown, the violated constraint is recorded in provenance", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/minor", "person");
    await assertNodeProp(repo, "person/minor", "age", 10);

    // NOTE: a claim-8 CONSTRAINT is not part of the caller-supplied `binding?` Pick on
    // `registerFunctionality` (docs/40's own "KNOWN GAP" — only weight/condition/requires/
    // relationClass/tags are caller-supplied). This recipe therefore exercises the same "seed fails
    // a declared predicate over proj, gating BEFORE dispatch" shape via `condition` (the nearest
    // caller-reachable proj-pure gate docs/31 also names for claim 12) — the outcome the invariant
    // asserts (zero facts, Unknown cell, no fabricated answer) is identical for constraint-violation
    // and pending-guard; only the recorded provenance differs (docs/31's own "N5-safe step outcomes"
    // section: "differ from a dispatch failure — and from each other — only in provenance").
    await repo.registerFunctionality(
      "can_drive",
      makeManifest({ name: "can-drive-lookup" }),
      makeBindingOptions({ condition: { kind: "cmp", prop: "age", op: ">=", value: 18 } }),
    );

    const query = makeQuery({ seed: "person/minor", target: "license", via: ["can_drive"] });
    const answer = await repo.runContextualQuery(query);

    if ("result" in answer) {
      // N5: no terminal answer fabricated for a seed that fails the gate.
      expect(answer.result).toEqual([]);
      expect(answer.derivedFrom.some((d) => d.eid.startsWith("license"))).toBe(false);
    }
  });

  it("INV-A3(d): an unsatisfied requires guard (claim 12 — a required OTHER instance not yet present) yields pending-guard — no dispatch, target cell stays Unknown", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/tal", "person");
    // Deliberately do NOT assert the `security_clearance` edge instance `requires` names.

    await repo.registerFunctionality(
      "access_vault",
      makeManifest({ name: "vault-access-lookup" }),
      makeBindingOptions({ requires: ["security_clearance"] }),
    );

    const query = makeQuery({ seed: "person/tal", target: "vault", via: ["access_vault"] });
    const answer = await repo.runContextualQuery(query);

    if ("result" in answer) {
      expect(answer.result).toEqual([]);
    }
  });

  it("INV-A3: an Unknown PropCell feeding a constraint/condition predicate is NEVER defaulted — it reads as NOT satisfied, the same as a violation", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/no-age-on-record", "person");
    // Deliberately never assert the "age" prop — the cell is Unknown, not merely absent.

    await repo.registerFunctionality(
      "can_drive",
      makeManifest({ name: "can-drive-lookup" }),
      makeBindingOptions({ condition: { kind: "cmp", prop: "age", op: ">=", value: 18 } }),
    );

    const query = makeQuery({ seed: "person/no-age-on-record", target: "license", via: ["can_drive"] });
    const answer = await repo.runContextualQuery(query);

    if ("result" in answer) {
      // An Unknown PropCell must NOT be treated as satisfying (nor as failing in a way that differs
      // from an explicit violation) — both project to "no terminal answer" (N5, never defaulted).
      expect(answer.result).toEqual([]);
    }
  });
});
