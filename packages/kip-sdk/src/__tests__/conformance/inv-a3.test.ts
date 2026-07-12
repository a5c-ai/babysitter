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
 * ROUND 2 FIX (CRITICAL finding #1): sub-cases (a)/(b)/(c) are NO LONGER `it.skip`'d. Round 1's
 * `executeSegment` had NO real microagent-dispatch seam at all — it fabricated a deterministic
 * placeholder output unconditionally, so there was nothing to inject a failure INTO. This round adds
 * `KipRepo`'s own injectable `dispatchMicroagent` constructor option (see index.ts's
 * `DispatchMicroagentFn`/`MicroagentInvocation`/`MicroagentResult` doc comments) — a real, if
 * minimal, dispatch seam `executeSegment` actually calls for every step, validating
 * `MicroagentResult.exitCode`/`elapsedMs` (vs the registered manifest's `runtime.timeout`)/`output`
 * (vs the registered `outputSchema`) before authoring anything. These three sub-cases now construct a
 * `KipRepo` with their OWN `dispatchMicroagent` to make each outcome deterministically reachable —
 * genuinely exercising the dispatch-failure path, not scripting an un-spec'd subprocess protocol.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { materializedEidFor } from "../../contextual";
import { assertNode, assertNodeProp, makeBindingOptions, makeManifest, makeQuery } from "./fixtures-m5";

// ROUND 4 FIX (finding #5): the three sub-cases below are negative-existence checks (dispatch never
// happens, so no materialized EID should resolve) — the hardcoded `"derived:employed_by/person/tal"`
// literal they used never invalidated the assertion (`getNode` of ANY non-existent EID also returns
// null), but it stopped matching `executeSegment`'s real materialized-EID format even at round 2/3
// (missing the realizer-id segment), and round 4's separator-encoding fix changes the format again.
// Each site now computes the EXACT EID `executeSegment` would have minted for this scenario via the
// SAME `materializedEidFor` helper it actually calls, so the assertion stays honest about what
// non-existence is being verified instead of drifting further from the real construction rule.

describe("INV-A3: dispatch no-fallback (N5)", () => {
  it("INV-A3(a): a microagent dispatch returning a non-zero exitCode yields dispatch-failure — zero facts authored, target cell stays Unknown", async () => {
    const repo = new KipRepo({
      dispatchMicroagent: async () => ({ exitCode: 1, output: null }),
    });
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality("employed_by", makeManifest({ name: "employed-by-lookup" }), makeBindingOptions({}));

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"] });
    const answer = await repo.runContextualQuery(query);

    if ("result" in answer) {
      expect(answer.result).toEqual([]);
      expect(answer.intermediates).toEqual([]);
    } else {
      expect.fail("expected a single executed AnswerGraph (one realizer registered), not a multi-segment choice");
    }
    const materialized = await repo.getNode(materializedEidFor("employed_by", "person/tal", "employed-by-lookup", "1.0.0"));
    expect(materialized).toBeNull();
  });

  it("INV-A3(b): a microagent dispatch returning outputSchema-invalid output yields dispatch-failure — zero facts authored", async () => {
    const repo = new KipRepo({
      dispatchMicroagent: async () => ({ exitCode: 0, output: "not-an-object" }),
    });
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality(
      "employed_by",
      makeManifest({ name: "employed-by-lookup", outputSchema: { type: "object", required: ["org"] } }),
      makeBindingOptions({}),
    );

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"] });
    const answer = await repo.runContextualQuery(query);

    if ("result" in answer) {
      expect(answer.result).toEqual([]);
    } else {
      expect.fail("expected a single executed AnswerGraph (one realizer registered), not a multi-segment choice");
    }
    const materialized = await repo.getNode(materializedEidFor("employed_by", "person/tal", "employed-by-lookup", "1.0.0"));
    expect(materialized).toBeNull();
  });

  it("INV-A3(c): a microagent dispatch exceeding the registered manifest's runtime.timeout yields dispatch-failure — zero facts authored", async () => {
    const repo = new KipRepo({
      dispatchMicroagent: async () => ({ exitCode: 0, output: {}, elapsedMs: 999_999 }),
    });
    await assertNode(repo, "person/tal", "person");
    await repo.registerFunctionality(
      "employed_by",
      makeManifest({ name: "employed-by-lookup", runtime: { entrypoint: "kip-fixture-microagent", timeout: 10 } }),
      makeBindingOptions({}),
    );

    const query = makeQuery({ seed: "person/tal", target: "org", via: ["employed_by"] });
    const answer = await repo.runContextualQuery(query);

    if ("result" in answer) {
      expect(answer.result).toEqual([]);
    } else {
      expect.fail("expected a single executed AnswerGraph (one realizer registered), not a multi-segment choice");
    }
    const materialized = await repo.getNode(materializedEidFor("employed_by", "person/tal", "employed-by-lookup", "1.0.0"));
    expect(materialized).toBeNull();
  });

  it("INV-A3(e): a claim-8 constraint the seed violates yields constraint-violation — zero facts authored, target cell stays Unknown", async () => {
    const repo = new KipRepo();
    await assertNode(repo, "person/minor", "person");
    await assertNodeProp(repo, "person/minor", "age", 10);

    // ROUND 2 FIX (MAJOR finding #3): `constraint` is now a real, reachable field on
    // `registerFunctionality`'s own binding-options — round 1 could only exercise this outcome's
    // shape via `condition` (a mislabeled proxy) because `constraint` was structurally absent from
    // the caller-supplied options entirely. This now registers a REAL claim-8 `constraint`.
    await repo.registerFunctionality(
      "can_drive",
      makeManifest({ name: "can-drive-lookup" }),
      makeBindingOptions({ constraint: { kind: "cmp", prop: "age", op: ">=", value: 18 } }),
    );

    const query = makeQuery({ seed: "person/minor", target: "license", via: ["can_drive"] });
    const answer = await repo.runContextualQuery(query);

    if ("result" in answer) {
      // N5: no terminal answer fabricated for a seed that fails the gate.
      expect(answer.result).toEqual([]);
      expect(answer.derivedFrom.some((d) => d.eid.startsWith("license"))).toBe(false);
    } else {
      expect.fail("expected a single executed AnswerGraph (one realizer registered), not a multi-segment choice");
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
    } else {
      expect.fail("expected a single executed AnswerGraph (one realizer registered), not a multi-segment choice");
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
    } else {
      expect.fail("expected a single executed AnswerGraph (one realizer registered), not a multi-segment choice");
    }
  });
});
