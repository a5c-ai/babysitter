# Example: sensor placement under a partition matroid

This original example demonstrates the ledgers without reproducing an assignment. `input.json` is a runnable process input when launched from this directory after resolving `packageRoot`, `workspace`, `domainProfile`, and `sourceArtifacts` to absolute paths; this README is the declared source artifact.

Let sites be partitioned by district, with at most two sensors per district. Scenarios `j` have weights `a_j >= 0`; site `u` detects scenario `j` with probability `p_{uj}` independently after placement. Define

`f(S)=sum_j a_j (1-product_{u in S}(1-p_{uj}))`.

The partition constraint defines a matroid. `f` is normalized, nonnegative, monotone, and submodular.

## Obligation sketch

- `OB-EX-PRODUCT`: define `R_x` with independent inclusion marginals.
- `OB-EX-DERIVATIVE`: condition on `R_x^{-u}` to derive the marginal-detection derivative.
- `OB-EX-DR`: couple `R_x^{-u} subseteq R_y^{-u}` for `x<=y`; a scenario still undetected under the larger set is no more likely, so the derivative is antitone.
- `OB-EX-PATH`: for one-coordinate movement define `gamma(s)=z+(s-z_u)e_u`, `s in [z_u,w_u]`; record both endpoints, cube membership, derivative, and FTC bounds.
- `OB-EX-COMPARATOR`: if `S*` respects district capacities, `1_{S*}` lies in the partition-matroid polytope before any local-optimum inequality is instantiated.
- `OB-EX-ROUNDING`: if a fractional result is rounded, separately prove matroid feasibility and expected objective preservation/approximation.

## Random-distribution ledger row

```json
{
  "id":"RAND-EX-SENSORS",
  "required":true,
  "status":"verified",
  "support":"subsets of sites, 2^V",
  "coordinateProbabilities":"Pr[u in R_x]=x_u; exclude u when conditioning for partial_u",
  "exclusions":"the differentiated coordinate u is omitted from R_x^{-u}",
  "couplingOrConditioning":"retained Bernoulli coordinates are independent; condition on R_x^{-u} and compare adding u",
  "interchangeJustification":"finite sums only",
  "obligationIds":["OB-PRODUCT-DISTRIBUTION","OB-FIRST-PARTIAL"],
  "evidence":[{"type":"artifact-location","path":"sensor-proof.tex","locator":"sec:distribution"}],
  "history":[{"event":"created"}]
}
```

## Boundary matrix

| Boundary | Expected treatment |
|---|---|
| `x_u=0` or `1` | Polynomial derivative identity extends to cube faces; path remains in cube. |
| `p_{uj}=0` | Site contributes zero for that scenario; no strictness assumed. |
| district capacity `0` | All sites in that district are loops of the constraint and cannot enter a feasible comparator. |
| empty scenario set | Objective is identically zero; approximation statement remains valid but trivial. |
| zero path increment | FTC integral is zero; do not divide by the increment. |

## Convergence checklist

The basic multilinear extension is a finite polynomial, so improper-integral rows are N/A **with this reason** unless an integrated potential is introduced. If a radial potential with a singular-looking coefficient is used later, reopen normalization/origin-bound/truncation obligations.

## Theorem references

Declare and number `Lemma (Detection DR property)` before using `\ref{lem:detection-dr}`. A starred lemma with a numeric reference is rejected by the artifact gate.
