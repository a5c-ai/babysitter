# Mathematics - Skills and Agents References (Phase 5)

## Overview

This document provides reference materials, resources, and cross-specialization links for implementing the skills and agents identified in the Mathematics skills-agents-backlog.md. It covers GitHub repositories, MCP servers, community resources, API documentation, and applicable skills from other specializations.

---

## GitHub Repositories

### Theorem Proving and Formal Verification

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [Lean 4](https://github.com/leanprover/lean4) | Modern proof assistant | lean-proof-assistant |
| [Mathlib4](https://github.com/leanprover-community/mathlib4) | Lean mathematics library | lean-proof-assistant |
| [Coq](https://github.com/coq/coq) | Proof assistant | coq-proof-assistant |
| [MathComp](https://github.com/math-comp/math-comp) | Mathematical Components | coq-proof-assistant |
| [SSReflect](https://github.com/coq/coq/tree/master/plugins/ssr) | Coq extension | coq-proof-assistant |
| [Isabelle](https://github.com/isabelle-prover/mirror-isabelle) | HOL proof assistant | isabelle-hol-interface |
| [Archive of Formal Proofs](https://github.com/isabelle-prover/mirror-afp) | Isabelle library | isabelle-hol-interface |
| [Agda](https://github.com/agda/agda) | Dependently typed | Multiple proof skills |
| [Nitpick](https://isabelle.in.tum.de/dist/Isabelle/doc/nitpick.pdf) | Counterexample finder | counterexample-generator |
| [QuickCheck](https://github.com/nick8325/quickcheck) | Property testing | counterexample-generator |

### Computer Algebra Systems

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [SymPy](https://github.com/sympy/sympy) | Python symbolic math | sympy-computer-algebra |
| [SageMath](https://github.com/sagemath/sage) | Comprehensive CAS | sage-math-interface |
| [Maxima](https://github.com/andrejv/maxima) | Open source CAS | maxima-cas-interface |
| [GAP](https://github.com/gap-system/gap) | Computational algebra | sage-math-interface, algebraist |
| [Singular](https://github.com/Singular/Singular) | Polynomial computations | sage-math-interface |
| [PARI/GP](https://github.com/pari/pari) | Number theory | sage-math-interface |
| [mpmath](https://github.com/mpmath/mpmath) | Arbitrary precision | special-functions-library |
| [Flint](https://github.com/flintlib/flint) | Fast number theory | sage-math-interface |

### Numerical Analysis

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [NumPy](https://github.com/numpy/numpy) | Numerical arrays | numerical-linear-algebra-toolkit |
| [SciPy](https://github.com/scipy/scipy) | Scientific Python | numerical-linear-algebra-toolkit, ode-solver-library |
| [LAPACK](https://github.com/Reference-LAPACK/lapack) | Linear algebra | numerical-linear-algebra-toolkit |
| [SuiteSparse](https://github.com/DrTimothyAldenDavis/SuiteSparse) | Sparse matrices | numerical-linear-algebra-toolkit |
| [Eigen](https://gitlab.com/libeigen/eigen) | C++ linear algebra | numerical-linear-algebra-toolkit |
| [FEniCS](https://github.com/FEniCS/dolfinx) | Finite elements | pde-solver-library |
| [deal.II](https://github.com/dealii/dealii) | FEM library | pde-solver-library |
| [PETSc](https://github.com/petsc/petsc) | Parallel scientific | pde-solver-library |
| [Firedrake](https://github.com/firedrakeproject/firedrake) | FEM framework | pde-solver-library |
| [SUNDIALS](https://github.com/LLNL/sundials) | ODE/DAE solvers | ode-solver-library |
| [DifferentialEquations.jl](https://github.com/SciML/DifferentialEquations.jl) | Julia DE suite | ode-solver-library |
| [MPFR](https://www.mpfr.org/) | Multiprecision floats | floating-point-analysis |
| [Arb](https://github.com/fredrik-johansson/arb) | Ball arithmetic | floating-point-analysis |
| [Herbie](https://github.com/uwplse/herbie) | FP accuracy | floating-point-analysis |
| [Chebfun](https://github.com/chebfun/chebfun) | Function approximation | interpolation-approximation |

### Optimization

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [CVXPY](https://github.com/cvxpy/cvxpy) | Convex optimization | convex-optimization-solver |
| [Pyomo](https://github.com/Pyomo/pyomo) | Optimization modeling | convex-optimization-solver, sensitivity-analysis-toolkit |
| [JuMP](https://github.com/jump-dev/JuMP.jl) | Julia optimization | convex-optimization-solver |
| [SCIP](https://github.com/scipopt/scip) | MIP solver | mixed-integer-optimization |
| [HiGHS](https://github.com/ERGO-Code/HiGHS) | LP/MIP solver | convex-optimization-solver |
| [IPOPT](https://github.com/coin-or/Ipopt) | Nonlinear optimization | nonlinear-optimization-solver |
| [NLopt](https://github.com/stevengj/nlopt) | Nonlinear optimization | nonlinear-optimization-solver |
| [Optuna](https://github.com/optuna/optuna) | Hyperparameter | derivative-free-optimization |
| [GPyOpt](https://github.com/SheffieldML/GPyOpt) | Bayesian optimization | derivative-free-optimization |

### Statistical Computing

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [Stan](https://github.com/stan-dev/stan) | Probabilistic programming | stan-bayesian-modeling |
| [CmdStan](https://github.com/stan-dev/cmdstan) | Stan command line | stan-bayesian-modeling |
| [PyStan](https://github.com/stan-dev/pystan) | Python interface | stan-bayesian-modeling |
| [PyMC](https://github.com/pymc-devs/pymc) | Bayesian modeling | pymc-probabilistic-programming |
| [ArviZ](https://github.com/arviz-devs/arviz) | Bayesian visualization | mcmc-diagnostics |
| [NumPyro](https://github.com/pyro-ppl/numpyro) | JAX-based PPL | pymc-probabilistic-programming |
| [statsmodels](https://github.com/statsmodels/statsmodels) | Statistical models | power-sample-size-calculator, multiple-testing-correction |
| [pingouin](https://github.com/raphaelvallat/pingouin) | Statistics | power-sample-size-calculator |
| [lifelines](https://github.com/CamDavidsonPilon/lifelines) | Survival analysis | Statistical modeling |

### Graph Theory and Combinatorics

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [NetworkX](https://github.com/networkx/networkx) | Graph library | graph-algorithm-library |
| [igraph](https://github.com/igraph/python-igraph) | Graph analysis | graph-algorithm-library |
| [graph-tool](https://github.com/count0/graph-tool) | Fast graphs | graph-algorithm-library |
| [nauty](https://github.com/pdobsan/pynauty) | Graph isomorphism | graph-algorithm-library |
| [OEIS](https://oeis.org/) | Integer sequences | combinatorial-enumeration |

### Uncertainty Quantification

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [SALib](https://github.com/SALib/SALib) | Sensitivity analysis | sensitivity-analysis-uq |
| [OpenTURNS](https://github.com/openturns/openturns) | UQ toolkit | polynomial-chaos-expansion |
| [Chaospy](https://github.com/jonathf/chaospy) | Polynomial chaos | polynomial-chaos-expansion |
| [UQpy](https://github.com/SURGroup/UQpy) | UQ in Python | monte-carlo-simulation |
| [PyApprox](https://github.com/sandialabs/pyapprox) | Approximation theory | polynomial-chaos-expansion |

### LaTeX and Documentation

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [LaTeX](https://github.com/latex3/latex2e) | Document system | latex-math-formatter |
| [TikZ](https://github.com/pgf-tikz/pgf) | Graphics | diagram-generator |
| [PGFPlots](https://github.com/pgf-tikz/pgfplots) | Plotting | diagram-generator |
| [Asymptote](https://github.com/vectorgraphics/asymptote) | Vector graphics | diagram-generator |
| [matplotlib](https://github.com/matplotlib/matplotlib) | Python plotting | diagram-generator |

---

## MCP Server References

### Relevant MCP Servers for Mathematics

| MCP Server | Description | Applicable Skills |
|------------|-------------|-------------------|
| **filesystem** | File system operations | All skills with file I/O |
| **github** | Version control | Proof script versioning |
| **fetch** | Web access | Literature search, OEIS queries |
| **postgres/sqlite** | Database operations | Benchmark results storage |
| **memory** | Persistent context | Long proof development sessions |

### Potential Custom MCP Servers

| Server Concept | Purpose | Skills Enabled |
|---------------|---------|----------------|
| **mcp-lean** | Lean 4 proof interface | lean-proof-assistant |
| **mcp-coq** | Coq SerAPI interface | coq-proof-assistant |
| **mcp-isabelle** | Isabelle interface | isabelle-hol-interface |
| **mcp-sympy** | SymPy computation | sympy-computer-algebra |
| **mcp-sage** | SageMath interface | sage-math-interface |
| **mcp-wolfram** | Wolfram Engine interface | mathematica-wolfram-interface |
| **mcp-arxiv** | arXiv API interface | arxiv-search-interface |
| **mcp-mathscinet** | MathSciNet interface | mathscinet-interface |
| **mcp-latex** | LaTeX compilation | latex-math-formatter |

---

## Community Resources

### Forums and Discussion

| Resource | URL | Topics |
|----------|-----|--------|
| Mathematics Stack Exchange | https://math.stackexchange.com/ | General mathematics |
| MathOverflow | https://mathoverflow.net/ | Research mathematics |
| Lean Zulip | https://leanprover.zulipchat.com/ | Lean 4, Mathlib |
| Coq Discourse | https://coq.discourse.group/ | Coq usage |
| SageMath Discourse | https://ask.sagemath.org/ | SageMath usage |
| Stan Discourse | https://discourse.mc-stan.org/ | Bayesian modeling |
| Cross Validated | https://stats.stackexchange.com/ | Statistics |
| Computational Science SE | https://scicomp.stackexchange.com/ | Numerical methods |

### Documentation and Tutorials

| Resource | URL | Relevance |
|----------|-----|-----------|
| Mathlib Docs | https://leanprover-community.github.io/mathlib4_docs/ | Lean mathematics |
| Coq Documentation | https://coq.inria.fr/refman/ | Coq reference |
| Software Foundations | https://softwarefoundations.cis.upenn.edu/ | Coq learning |
| SymPy Documentation | https://docs.sympy.org/ | Symbolic computation |
| Stan User's Guide | https://mc-stan.org/users/documentation/ | Bayesian modeling |
| FEniCS Documentation | https://fenicsproject.org/documentation/ | FEM |
| DLMF | https://dlmf.nist.gov/ | Special functions |
| NIST Statistics Handbook | https://www.itl.nist.gov/div898/handbook/ | Statistics |

### Best Practices

| Resource | Description | Applicable Areas |
|----------|-------------|------------------|
| [Mathlib Conventions](https://leanprover-community.github.io/contribute/style.html) | Lean style guide | lean-proof-assistant |
| [AMS Style Guide](https://www.ams.org/publications/authors/AMS-StyleGuide-online.pdf) | Math writing | latex-math-formatter |
| [FAIR Data](https://www.go-fair.org/fair-principles/) | Data management | reproducible-computation-setup |
| [Numerical Recipes](http://numerical.recipes/) | Numerical methods | Multiple numerical skills |

---

## API Documentation

### Computation Services

| API | Documentation URL | Purpose |
|-----|-------------------|---------|
| Wolfram Alpha API | https://products.wolframalpha.com/api | Computational queries |
| Wolfram Cloud | https://www.wolfram.com/cloud/ | Wolfram Language |
| SageMath Cell | https://sagecell.sagemath.org/ | SageMath computation |
| OEIS API | https://oeis.org/wiki/JSON | Sequence lookup |
| arXiv API | https://arxiv.org/help/api | Paper search |
| MathSciNet API | https://mathscinet.ams.org/mathscinet/freeTools.html | Citation data |
| zbMATH Open | https://api.zbmath.org/ | Open math database |
| Semantic Scholar | https://api.semanticscholar.org/ | Citation analysis |

### Data Format Standards

| Standard | Documentation | Tools |
|----------|--------------|-------|
| LaTeX | https://www.latex-project.org/help/documentation/ | texlive, MiKTeX |
| BibTeX | http://www.bibtex.org/Format/ | Bibliography |
| MathML | https://www.w3.org/Math/ | Math markup |
| OpenMath | https://openmath.org/ | Math representation |
| SMT-LIB | https://smtlib.cs.uiowa.edu/ | Logical formulas |
| HDF5 | https://www.hdfgroup.org/ | Large datasets |
| NetCDF | https://www.unidata.ucar.edu/software/netcdf/ | Scientific data |

---

## Applicable Skills from Other Specializations

### From Computer Science Specialization

| Skill | Application to Mathematics |
|-------|---------------------------|
| **theorem-prover-interface** | Algorithm correctness proofs |
| **smt-solver-interface** | Automated reasoning |
| **formal-logic-reasoner** | Logic foundations |
| **algorithm-complexity-analyzer** | Algorithm analysis |
| **benchmark-suite-manager** | Computational experiments |

### From Physics Specialization

| Skill | Application to Mathematics |
|-------|---------------------------|
| **scipy-optimization-toolkit** | Numerical optimization |
| **tensorflow-physics-ml** | Mathematical ML |
| **monte-carlo-physics-simulator** | Stochastic methods |
| **paraview-scientific-visualizer** | 3D visualization |

### From Data Science Specialization

| Skill | Application to Mathematics |
|-------|---------------------------|
| **pandas-data-wrangler** | Data manipulation |
| **sklearn-ml-toolkit** | Statistical learning |
| **visualization-toolkit** | Data visualization |
| **hypothesis-testing-framework** | Statistical analysis |

### From Scientific Discovery Specialization

| Skill | Application to Mathematics |
|-------|---------------------------|
| **hypothesis-generator** | Conjecture formulation |
| **statistical-test-selector** | Statistical inference |
| **latex-document-compiler** | Paper writing |
| **reproducibility-guardian** | Reproducible research |
| **meta-analysis-engine** | Literature synthesis |

### From Quantum Computing Specialization

| Skill | Application to Mathematics |
|-------|---------------------------|
| **tensor-network-simulator** | Tensor computations |
| **quantum-kernel-estimator** | Kernel methods |
| **resource-estimator** | Complexity analysis |

---

## Cross-Specialization Agent Collaboration

### Agents from Other Specializations Useful for Mathematics

| Agent | Source Specialization | Mathematics Application |
|-------|----------------------|------------------------|
| **complexity-theorist** | Computer Science | Computational complexity |
| **algorithm-analyst** | Computer Science | Algorithm analysis |
| **physics-ml-developer** | Physics | Mathematical ML |
| **statistical-consultant** | Scientific Discovery | Statistical analysis |
| **data-pipeline-architect** | Data Engineering | Data processing |
| **reproducibility-guardian** | Scientific Discovery | Reproducible research |

### Mathematics Agents Useful for Other Specializations

| Agent | Target Specialization | Application |
|-------|----------------------|-------------|
| **theorem-prover-expert** | Computer Science, Security | Formal verification |
| **numerical-analyst** | Physics, Engineering | Numerical methods |
| **optimization-expert** | Operations Research, ML | Optimization |
| **bayesian-statistician** | Data Science, Healthcare | Bayesian inference |
| **symbolic-computation-expert** | Physics, Chemistry | Symbolic manipulation |
| **pde-expert** | Physics, Engineering | PDE solving |

---

## Implementation Recommendations

### Tool Selection Priority

1. **Open Source First**: Prioritize Lean, SymPy, SageMath over commercial tools
2. **Active Communities**: Choose tools with active development (Lean 4 over Lean 3)
3. **Python Integration**: Ensure Python APIs for workflow integration
4. **Interoperability**: Support standard formats (LaTeX, BibTeX, SMT-LIB)

### Integration Patterns

1. **CAS Abstraction**: Create abstraction layer for multiple CAS systems
2. **Proof Assistant Integration**: Standardized interface to Lean/Coq/Isabelle
3. **Solver Pipeline**: Chain symbolic and numerical solvers
4. **Document Generation**: Automated LaTeX generation from computations

### Testing Strategies

1. **Known Results**: Test against established theorems and identities
2. **Symbolic Verification**: Cross-check between CAS systems
3. **Numerical Validation**: Compare numerical to analytical solutions
4. **Regression Testing**: Track outputs across library versions

### Mathematical Workflow Integration

| Phase | Tools | Skills |
|-------|-------|--------|
| Literature Review | arXiv, MathSciNet | arxiv-search-interface |
| Exploration | SymPy, SageMath | sympy-computer-algebra |
| Proof Development | Lean, Coq | lean-proof-assistant |
| Computation | NumPy, SciPy | numerical-linear-algebra-toolkit |
| Writing | LaTeX | latex-math-formatter |
| Publication | Overleaf, arXiv | latex-math-formatter |

---

## Specialized Libraries by Mathematical Domain

### Algebra

| Library | Purpose | Repository |
|---------|---------|------------|
| GAP | Computational group theory | https://github.com/gap-system/gap |
| Singular | Commutative algebra | https://github.com/Singular/Singular |
| Macaulay2 | Algebraic geometry | https://github.com/Macaulay2/M2 |
| OSCAR | Computer algebra | https://github.com/oscar-system/Oscar.jl |

### Number Theory

| Library | Purpose | Repository |
|---------|---------|------------|
| PARI/GP | Number theory | https://pari.math.u-bordeaux.fr/ |
| FLINT | Fast arithmetic | https://github.com/flintlib/flint |
| Magma | Computational algebra | Commercial |
| SageMath NT | Number fields | Part of SageMath |

### Analysis

| Library | Purpose | Repository |
|---------|---------|------------|
| mpmath | Arbitrary precision | https://github.com/mpmath/mpmath |
| Arb | Ball arithmetic | https://github.com/fredrik-johansson/arb |
| SymPy | Symbolic analysis | https://github.com/sympy/sympy |
| Chebfun | Function approximation | https://github.com/chebfun/chebfun |

### Topology and Geometry

| Library | Purpose | Repository |
|---------|---------|------------|
| CGAL | Computational geometry | https://github.com/CGAL/cgal |
| Polymake | Polyhedral computations | https://github.com/polymake/polymake |
| Regina | 3-manifold topology | https://github.com/regina-normal/regina |
| Gudhi | Topological data analysis | https://github.com/GUDHI/gudhi-devel |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-25 | Babysitter AI | Initial references document creation |
