# Proof-obligation registry reference

## Contract

A registry is a persistent proof state, not an agent summary. Import an earlier registry by stable ID, preserve history, and reopen evidence whenever its source hash or an upstream dependency changes.

Each registry has `contractVersion`, `profileId`, `profileVersion`, `artifactSha256`, and the ledgers below.

## Obligation lifecycle

`open -> supported -> verified`

Any state may move to `failed`; source or dependency change moves it to `stale`. A `waived` required obligation needs owner, reason, scope, and expiration and prevents unqualified publication readiness.

An obligation record contains:

```json
{
  "id": "OB-DR-ANTITONE",
  "templateId": "OB-DR-ANTITONE",
  "kind": "lemma",
  "required": true,
  "statement": "Coordinate partials are antitone on the cube.",
  "hypothesisIds": ["H-FINITE-GROUND", "H-SUBMODULAR"],
  "dependencyIds": ["OB-MIXED-PARTIAL"],
  "useSiteIds": ["USE-POSITIVE-PART"],
  "boundaryIds": ["EDGE-CUBE-FACES"],
  "evidence": [{"type":"artifact-location","path":"proof.tex","locator":"lem:dr"}],
  "verificationMethod": "independent-reconstruction",
  "status": "verified",
  "history": [{"event":"verified","at":"round-2","actor":"independent-reconstruction","reason":"fresh reconstruction"}]
}
```

## Required ledgers

### Hypothesis ledger

Every hypothesis records a quantified statement, provenance (`problem`, `definition`, `derived`, or `external theorem`), use sites, discharge status, and evidence. Common hidden hypotheses include finiteness, normalization, monotonicity, nonnegative increments, comparator feasibility, oracle integrality, and binary rational encoding.

### Use-site audit

A use site records the invoked obligation/theorem, exact substitutions, side conditions, object domains, inequality direction, and status. For a path argument, include domain, formula, endpoints, ambient-domain membership, derivative, and FTC bounds. Definition/use mismatches are blockers even if the intended mathematics is recoverable.

### Boundary matrix

Rows span theorem-statement, proof-object, reduction, and document-semantic boundaries. Each row has expected behavior, affected use sites, evidence, and `covered|failed|not-applicable`; N/A requires a reason.

### Random-distribution ledger

For every random-set expectation record sample space, support, coordinate inclusion probabilities, excluded coordinates, independence or coupling, conditioning identity, integrability, and any expectation/sum/integral interchange theorem with checked hypotheses.

### Convergence checklist

For every improper integral or limiting endpoint record truncation parameter, proper finite-stage identity, uniform/local bound, endpoint limit, convergence theorem, and hypotheses. Never silently insert `f(empty)=0`; derive it or state it as a sourced hypothesis.

### Exact arithmetic and bit-complexity ledger

For oracle reductions record input encoding, rational numerator/denominator bit lengths, integer scaling, oracle contract, number and size of calls, output magnitude, signed bit length, exact comparison method, candidate count/size, soundness, completeness, and domain enforcement.

### Theorem-reference ledger

Record theorem/definition labels, declaration kind, numbered status, every reference use, expected target kind, and resolution. A numeric reference to a starred theorem-like declaration fails.

## Coverage arithmetic

`requiredTotal = verified + supported + open + failed + stale + waived` over required obligations. Publication always requires `open=failed=stale=waived=0` across required obligations and required ledger records, independent of caller score or strictness. For each selected module, every ledger named by `profile.requiredLedgers` must contain a record linked to an applicable module obligation and that record must be closed. Every required boundary row must be covered, and every reference from any ledger must resolve.

## Merge rules

1. Match by stable ID, never display order.
2. Retain old history and source hashes.
3. A changed statement or source hash invalidates prior evidence.
4. Removing a required record triggers an evidence breakpoint.
5. New inferred hypotheses start `open`; an agent may not mark its own inference `verified` without independent or deterministic evidence.
6. Rejection at a breakpoint appends history, reopens affected records, and refines extraction; it does not delete the rejected evidence.