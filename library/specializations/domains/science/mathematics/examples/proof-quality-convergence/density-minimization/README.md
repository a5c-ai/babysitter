# Example: maximum synergy-density threshold in a collaboration network

This original example demonstrates exact reduction obligations without reproducing an assignment. `input.json` is a runnable process input when launched from this directory after resolving `packageRoot`, `workspace`, `domainProfile`, and `sourceArtifacts` to absolute paths; this README is the declared source artifact.

Let `V` be researchers and let `b_{uv}` be nonnegative integer collaboration benefits encoded in binary. For nonempty `S`, define total internal synergy `B(S)=sum_{{u,v} subseteq S} b_{uv}` and density `rho(S)=B(S)/|S|`. To decide whether some nonempty group has `rho(S) >= lambda=p/q` (`q>0`), consider

`H_{p,q}(S)=p|S|-qB(S)`.

Because `-B(S)` is submodular for nonnegative pair weights and the cardinality term is modular, `H` is submodular. The decision is whether a **nonempty** `S` has `H(S)<=0` (or `<0`, depending on the chosen predicate; fix one and preserve it throughout).

## Nonempty enforcement

Unconstrained minimization always sees `H(empty)=0`, so it can produce a false witness for a strict predicate. For each `v in V`, minimize the contraction

`H^v(T)=H(T union {v})`, `T subseteq V\{v}`.

Soundness: every returned set contains `v`. Completeness: for any nonempty witness `S`, choose `v in S` and use `T=S\{v}`. A singleton witness is represented by `T=empty`. If `V=empty`, report no nonempty witness without making oracle calls.

## Exact-arithmetic ledger

```json
{
  "id":"ARITH-EX-SYNERGY",
  "required":true,
  "status":"verified",
  "inputEncoding":"p,q and all b_uv are signed/nonnegative binary integers; q>0",
  "integerScaling":"H(S)=p|S|-qB(S)",
  "oracleCalls":"|V| contractions; each on |V|-1 elements",
  "maximumMagnitude":"|H(S)| <= |p||V|+q sum_{u<v} b_uv",
  "signedBitLength":"one sign bit plus ceil(log2(bound+1))",
  "exactComparisons":"compare a/b and c/d by ad versus cb using integer products",
  "soundness":"contracted output is nonempty and H<=0 implies density threshold",
  "completeness":"choose v from every nonempty threshold witness",
  "candidateCompleteness":"every B(S)/|S| has numerator among attainable integer synergies and denominator 1..|V|",
  "obligationIds":["OB-MODULAR-CLOSURE","OB-NONEMPTY-ENFORCEMENT","OB-EXACT-BIT-COMPLEXITY","OB-CANDIDATE-COMPLETENESS"],
  "evidence":[{"type":"artifact-location","path":"density-proof.tex","locator":"sec:exact-complexity"}],
  "history":[{"event":"created"}]
}
```

If benefits are bounded by `W`, then `B(S)<=W |V|(|V|-1)/2`; state the resulting bit bound in terms of `log W`, `log |p|`, and `log q`, rather than calling it merely polynomial.

## Boundary matrix

| Boundary | Expected treatment |
|---|---|
| `V=empty` | No nonempty solution; zero contraction calls. |
| singleton witness | Captured by a contraction with empty remainder. |
| all benefits zero | Maximum density is zero; threshold sign determines answer. |
| `p=0` | Scaling remains exact; do not divide by `p`. |
| `q<=0` | Reject encoding (or normalize sign before the proof); denominator policy is explicit. |
| equality threshold | Choose `<=` versus `<` once; prove both directions using that exact relation. |
| large weights | Oracle magnitude and intermediate cross-products receive bit bounds. |

## Candidate ledger

For exact optimization, candidate ratios need not be enumerated as all subsets. A valid finite superset can use numerators `0..B(V)` only when `B(V)` is polynomially bounded in value; with binary weights that may be pseudo-polynomial. Prefer candidate numerators derived from attainable oracle breakpoints or state the representation-sensitive limitation. This is precisely why candidate count and bit complexity are separate obligations.

## Theorem references

The closure and contraction lemmas are numbered and cited by compatible labels. The deterministic validator checks document semantics; the adversarial lens checks that the invoked minimization theorem's oracle and numeric assumptions actually match.