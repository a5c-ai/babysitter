# Submodular-optimization proof obligations

This profile covers finite set functions, multilinear extensions, matroid-constrained monotone maximization, and density-style minimization reductions. Instantiate only relevant modules, but justify every N/A row.

## 1. Multilinear extension and diminishing returns

- **Product distribution:** define `R_x` on `2^V`; for derivative in `u`, define `R_x^{-u}` with `u` excluded and all other coordinates independent with marginals `x_v`.
- **First derivative:** derive `partial_u F(x) = E[f(R_x^{-u} union {u})-f(R_x^{-u})]` by conditioning.
- **Mixed derivative:** for `u != v`, derive it as an expected discrete second difference and use submodularity to prove nonpositivity.
- **Diagonal derivative:** state `partial^2_uu F=0` by multilinearity.
- **DR antitonicity:** for `x <= y`, prove `partial_u F(x) >= partial_u F(y)` with a coordinate path/coupling. Include cube-face polynomial-extension conventions.

### Path tuple

Every coordinate path must supply `(parameter domain, formula, lower endpoint, upper endpoint, cube membership, derivative identity, FTC bounds)`. A formula whose stated endpoints do not match is a blocker.

## 2. Positive-part and radial inequalities

For `w=x join y`, enumerate changed coordinates and define intermediate vectors. At each affine step verify the increment is nonnegative before multiplying a derivative inequality. Target:

`F(y) <= F(x) + sum_u (y_u-x_u)^+ partial_u F(x)`.

For `phi(s)=F(sx)`, state differentiability, chain rule, `sx <= x`, and `x_u >= 0`. Integrate with named endpoints. Target:

`<x, grad F(x)> <= F(x)-F(0)`.

If the rightmost inequality to `F(x)` is used, separately justify `F(0)>=0` or normalization.

## 3. Origin normalization and convergence

- Do not assume `f(empty)=0` unless sourced.
- Define every improper integral as `lim_{epsilon downarrow 0} integral_epsilon^1`.
- If finiteness forces normalization, prove logarithmic divergence when `f(empty)>0`.
- Establish a uniform origin bound, e.g. `F(rx) <= r M_f sum_u x_u`, with finiteness and nonnegativity hypotheses.
- Name finite-sum interchange, dominated convergence, monotone convergence, or another theorem and record every hypothesis.

## 4. Matroid monotone maximization

- Define the matroid and its polytope; record monotonicity/nonnegativity/normalization used.
- Before local-optimum substitution, prove comparator feasibility: `S* in I` implies `1_{S*} in P(M)`.
- State the local-optimum inequality with its quantified comparator domain.
- Audit derivative signs and every inequality direction.
- For integrated/telescoping arguments, record the sequence: pointwise inequality, positive weighting, integral-gradient identity, local optimality, exact product/chain derivative, endpoints, and normalization.
- State whether the conclusion is fractional, randomized, or rounded; if rounding appears, add feasibility and expectation-preservation obligations.

## 5. Minimization reductions

- Prove modular addition preserves submodularity.
- Prove contraction `h_C(T)=h(T union C)` is submodular on the reduced ground set.
- State the value-oracle model and evaluation transformation.
- Prove soundness and completeness separately.
- Never rely on unconstrained minimization when `empty` creates a false witness.

### Nonempty enforcement

For every `v in V`, minimize the contracted objective over sets containing `v`. Prove returned sets are nonempty and every nonempty witness is represented by choosing an element it contains. Include singleton witnesses (`T=empty`) and state behavior for `V=empty`.

## 6. Exact rational arithmetic and bit complexity

For `lambda=p/q` in binary, scale to an integer-valued oracle. Record:

- reduced or unreduced representation policy and denominator sign;
- bit lengths of `p,q`;
- magnitude bound on each objective value and its signed bit length;
- number of submodular-minimization calls and each reduced ground-set size;
- oracle evaluation operations and exact integer arithmetic cost;
- exact fraction comparisons by cross multiplication and product bit lengths;
- candidate set count and candidate bit lengths;
- downward/upward closure of the decision predicate as appropriate;
- candidate completeness and selection rule.

“Polynomially many candidates” without arithmetic-size bounds is incomplete.

## 7. Boundary matrix minimum rows

`x=0`, `x=1`, individual cube faces, zero coordinate increment, empty ground set, singleton witness, all-zero objective, zero/negative rational threshold where allowed, improper endpoint, loop/parallel-element convention if graphical, and every `not-applicable` rationale.

## 8. Document semantics

Use numbered theorem-like environments for numeric references. Require unique labels, defined references/citations, compatible target kinds, balanced environments, and a fresh deterministic check after every repair.

## Module exit criteria

A module closes only when statements, hypotheses, proof evidence, use-site substitutions, boundaries, and deterministic checks are all linked in the registry. Confidence alone is not evidence.