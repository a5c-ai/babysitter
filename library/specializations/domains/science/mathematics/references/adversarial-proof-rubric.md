# Adversarial proof rubric

## Categories (100 points)

| Category | Maximum | Lens primarily responsible |
|---|---:|---|
| Core mathematical validity | 35 | reconstruction/counterexample |
| Lemma and use-site closure | 15 | dependency/use-site |
| Domain and boundary completeness | 20 | boundary/exact-complexity |
| Exact reduction and complexity | 15 | boundary/exact-complexity |
| Exposition and ambiguity | 5 | ambiguity/reference |
| Deterministic artifact semantics | 10 | shell gates; ambiguity/reference classifies only |

Every lens reports all categories it can evidence, but it may not award deterministic points when a required shell gate failed or was unavailable.

## Isolated lens contracts

1. **Dependency/use-site:** reconstruct the obligation DAG; check hypotheses before use, exact substitutions, comparator feasibility, path tuples, and stale evidence. Do not edit.
2. **Reconstruction/counterexample:** ignore the author's proof outline initially; derive critical claims from definitions, search small/boundary counterexamples, and compare afterward. Do not trust cited lemma names without checking statements.
3. **Boundary/exact complexity:** instantiate the boundary matrix; challenge empty/nonempty domains, endpoints, convergence, oracle transformations, rational scaling, magnitude/bit bounds, call counts, exact comparisons, soundness, completeness, and candidate completeness.
4. **Ambiguity/reference:** check whether every symbol/path/theorem has one definition, prose and displays agree, theorem labels are numbered and semantically compatible, and no notation makes an invalid proof appear valid.

### Reviewer diversity and independence

Lens isolation means no pre-submission access to another lens report. It does not by itself make correlated reviewers independent. For high-stakes external use, retain an artifact-hash-bound reviewer manifest recording each reviewer's provider/model or human identity class, model/version when available, prompt-template version, tool access, and prior-report exposure. Prefer a qualified human or a different model family/provider for reconstruction/counterexample review. If only the same family is available, use a fresh context and blind review, disclose the fallback, and call the result an isolated additional review rather than independent verification. No reviewer-diversity arrangement guarantees truth.

### Formal-tool evidence policy

Formal and computational tools provide claim-scoped evidence only. A retained evidence record identifies the exact claim, formal statement/encoding, assumptions and trusted axioms, tool/version, reproducible command/configuration, input/output hashes, result, and residual translation gap between prose and encoding. Proof-assistant kernels, SMT solvers, computer algebra, exhaustive finite checks, and custom scripts must not be presented as whole-proof verification unless the whole theorem and every dependency are actually formalized and checked under the recorded trust base.

### External verification checklist

Before publication or another consequential decision, an external reviewer not involved in authoring should bind the checklist to the artifact hash and record: identity/competence class; conflict and prior-exposure disclosure; reconstruction of critical claims from definitions; hypothesis/use-site inspection; boundary and counterexample attempts; reproduction of deterministic and formal-tool evidence; sample comparison of formalization to prose; disagreement disposition; unresolved items; date and signature/attestation. An absent or incomplete checklist is disclosed as unperformed external verification and cannot strengthen the package's internal perfect score.

## Finding contract

```json
{
  "id": "F-ROUND1-PATH-01",
  "obligationIds": ["OB-PATH-TUPLE"],
  "category": "lemmaUseSiteClosure",
  "severity": "blocker",
  "location": {"path":"proof.tex","locator":"paragraph before (12)"},
  "failureScenario": "Substituting the prose formula gives a lower endpoint different from the displayed vector.",
  "deduction": 4,
  "repair": "Define one path with domain and endpoints, then reuse its name in the FTC step."
}
```

No location, obligation ID, concrete failure, or repair means the finding is invalid and the grade gate fails.

## Arithmetic and consistency

- `score = sum(categoryScores) = 100 - sum(deductions)`.
- Scores are integers within category maxima.
- Finding IDs are unique; each positive deduction maps to one root finding.
- All reports name the exact current artifact SHA-256 and round ID.
- `perfectScoreDefensible=true` requires score 100, no findings, no blockers, no open/failed/stale required obligations, no uncovered required edge rows, no failed required gate, and no unresolved material disagreement.
- A repair is not closed until a fresh artifact hash is independently regraded and all deterministic gates rerun.
- Waivers record owner, reason, scope, expiration, and affected gate/obligation; an unexpired waiver is reported, never silently converted to pass.

## Disagreement

A disagreement is material when lenses assert opposite truth values for a claim that affects correctness, feasibility, convergence, or complexity, or differ on blocker status. It triggers the evidence breakpoint. Rejection records the owner's evidence/reason, opens a focused obligation, refines the draft or registry, and requires fresh review. Majority vote does not settle mathematics.

## Convergence

Final convergence is publication-strict regardless of input score or strictness: all four lenses score exactly 100 and defend perfection, all current hashes and required gates pass, and open/failed/stale/waived required obligations, required ledger records, blockers, material disagreements, and open boundaries are all zero. Reaching the revision bound without this closure returns `success:false` with unresolved blockers.