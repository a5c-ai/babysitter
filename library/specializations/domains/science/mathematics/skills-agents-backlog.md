# Mathematics: Skills and Agents Backlog

This document catalogs specialized skills and agents that could enhance the processes in the Mathematics specialization beyond general-purpose capabilities.

## Overview

**Specialization:** mathematics
**Phase:** 4 - Skills and Agents Identification
**Total Processes:** 24
**Categories:** Proof and Theorem Development, Numerical Analysis and Computation, Statistical Analysis, Optimization, Mathematical Modeling, Symbolic Computation, Research and Documentation, Computational Reproducibility

---

## Specialized Skills

### 1. Theorem Proving and Formal Verification Skills

#### SK-MATH-001: lean-proof-assistant
- **Type:** Skill
- **Purpose:** Interface with Lean 4 proof assistant for formal theorem verification
- **Capabilities:**
  - Parse informal proofs into Lean 4 syntax
  - Generate tactic-based proof scripts
  - Access Mathlib4 library for standard results
  - Automated term rewriting and simplification
  - Generate proof outlines with sorry placeholders
  - Extract executable code from proofs
- **Enhances Processes:** theorem-proof-verification, proof-writing-assistance
- **Priority:** High
- **Integration:** Lean 4, Mathlib4, Lake build system

#### SK-MATH-002: coq-proof-assistant
- **Type:** Skill
- **Purpose:** Interface with Coq proof assistant for formal verification
- **Capabilities:**
  - Ltac and Ltac2 tactic generation
  - SSReflect/MathComp library integration
  - Proof by reflection techniques
  - Extraction to OCaml/Haskell
  - Proof documentation generation
- **Enhances Processes:** theorem-proof-verification, proof-writing-assistance
- **Priority:** High
- **Integration:** Coq, SSReflect, MathComp

#### SK-MATH-003: isabelle-hol-interface
- **Type:** Skill
- **Purpose:** Interface with Isabelle/HOL for classical mathematics formalization
- **Capabilities:**
  - Isar structured proof generation
  - Sledgehammer automated theorem proving
  - Archive of Formal Proofs access
  - Locales and type classes
  - Code generation to SML/Haskell
- **Enhances Processes:** theorem-proof-verification, proof-writing-assistance
- **Priority:** Medium
- **Integration:** Isabelle, AFP (Archive of Formal Proofs)

#### SK-MATH-004: counterexample-generator
- **Type:** Skill
- **Purpose:** Automated search for counterexamples to mathematical conjectures
- **Capabilities:**
  - Random testing with intelligent sampling
  - SMT-based counterexample search
  - Quickcheck-style property testing
  - Boundary case enumeration
  - Finite model finding (Nitpick, Quickcheck)
- **Enhances Processes:** conjecture-exploration, theorem-proof-verification
- **Priority:** High
- **Integration:** Z3, CVC5, Quickcheck, Nitpick

#### SK-MATH-005: proof-structure-analyzer
- **Type:** Skill
- **Purpose:** Analyze and restructure mathematical proofs for clarity and completeness
- **Capabilities:**
  - Proof strategy identification (induction, contradiction, etc.)
  - Dependency graph construction
  - Gap detection in reasoning chains
  - Proof outline generation
  - Lemma extraction suggestions
- **Enhances Processes:** proof-writing-assistance, theorem-proof-verification
- **Priority:** High
- **Integration:** Natural language parsing, formal logic representation

---

### 2. Symbolic Computation Skills

#### SK-MATH-006: sympy-computer-algebra
- **Type:** Skill
- **Purpose:** Symbolic computation using SymPy for Python-based mathematical analysis
- **Capabilities:**
  - Symbolic differentiation and integration
  - Equation solving (algebraic, differential)
  - Series expansion and limits
  - Matrix algebra and linear algebra
  - Pattern matching and simplification
  - Code generation (NumPy, C, Fortran)
- **Enhances Processes:** symbolic-simplification, symbolic-integration-differentiation
- **Priority:** High
- **Integration:** SymPy, NumPy, mpmath

#### SK-MATH-007: mathematica-wolfram-interface
- **Type:** Skill
- **Purpose:** Interface with Mathematica/Wolfram Language for advanced symbolic computation
- **Capabilities:**
  - Wolfram Language evaluation
  - Symbolic and numerical computation
  - Special functions library access
  - Pattern matching and rule-based transformation
  - Visualization generation
  - Wolfram Alpha natural language queries
- **Enhances Processes:** symbolic-simplification, symbolic-integration-differentiation, pde-solver-selection
- **Priority:** High
- **Integration:** Wolfram Kernel, Wolfram Alpha API

#### SK-MATH-008: maxima-cas-interface
- **Type:** Skill
- **Purpose:** Open-source computer algebra system for symbolic computation
- **Capabilities:**
  - Symbolic manipulation and simplification
  - Calculus operations (differentiation, integration)
  - Tensor and differential geometry
  - Polynomial factorization
  - Laplace/Fourier transforms
- **Enhances Processes:** symbolic-simplification, symbolic-integration-differentiation
- **Priority:** Medium
- **Integration:** Maxima, wxMaxima

#### SK-MATH-009: sage-math-interface
- **Type:** Skill
- **Purpose:** SageMath for comprehensive mathematical computation
- **Capabilities:**
  - Unified interface to multiple CAS systems
  - Number theory computations
  - Algebraic geometry calculations
  - Combinatorics and graph theory
  - Cryptographic functions
  - Notebook interface generation
- **Enhances Processes:** symbolic-simplification, conjecture-exploration, algorithm-complexity-analysis
- **Priority:** Medium
- **Integration:** SageMath, GAP, Singular, PARI/GP

#### SK-MATH-010: special-functions-library
- **Type:** Skill
- **Purpose:** Comprehensive special functions evaluation and manipulation
- **Capabilities:**
  - Bessel, hypergeometric, elliptic functions
  - Orthogonal polynomials (Legendre, Chebyshev, Hermite)
  - Gamma, beta, zeta functions
  - Asymptotic expansions
  - Connection formulas and identities
- **Enhances Processes:** symbolic-simplification, symbolic-integration-differentiation, pde-solver-selection
- **Priority:** Medium
- **Integration:** DLMF (Digital Library of Mathematical Functions), mpmath, scipy.special

---

### 3. Numerical Analysis Skills

#### SK-MATH-011: numerical-linear-algebra-toolkit
- **Type:** Skill
- **Purpose:** High-performance numerical linear algebra operations
- **Capabilities:**
  - Matrix decompositions (LU, QR, SVD, Cholesky, Schur)
  - Eigenvalue/eigenvector computation
  - Sparse matrix operations
  - Iterative solvers (CG, GMRES, BiCGSTAB)
  - Condition number estimation
  - Error analysis and bounds
- **Enhances Processes:** matrix-computation-optimization, numerical-stability-analysis
- **Priority:** High
- **Integration:** LAPACK, BLAS, SuiteSparse, Eigen

#### SK-MATH-012: pde-solver-library
- **Type:** Skill
- **Purpose:** Numerical methods for partial differential equations
- **Capabilities:**
  - Finite difference schemes (explicit, implicit, Crank-Nicolson)
  - Finite element methods (FEM)
  - Finite volume methods
  - Spectral methods
  - Mesh generation and adaptation
  - Stability and convergence analysis
- **Enhances Processes:** pde-solver-selection, numerical-stability-analysis
- **Priority:** High
- **Integration:** FEniCS, deal.II, PETSc, Firedrake

#### SK-MATH-013: ode-solver-library
- **Type:** Skill
- **Purpose:** Numerical methods for ordinary differential equations
- **Capabilities:**
  - Runge-Kutta methods (explicit and implicit)
  - Multistep methods (Adams-Bashforth, BDF)
  - Stiff equation handling
  - Adaptive step size control
  - Event detection and root finding
  - Sensitivity analysis
- **Enhances Processes:** numerical-stability-analysis, model-formulation-workflow
- **Priority:** High
- **Integration:** SUNDIALS, scipy.integrate, DifferentialEquations.jl

#### SK-MATH-014: floating-point-analysis
- **Type:** Skill
- **Purpose:** Rigorous floating-point error analysis
- **Capabilities:**
  - IEEE 754 arithmetic modeling
  - Roundoff error accumulation tracking
  - Interval arithmetic computation
  - Arbitrary precision arithmetic
  - Numerical condition number computation
  - Error bound derivation
- **Enhances Processes:** numerical-stability-analysis, benchmark-validation
- **Priority:** High
- **Integration:** MPFR, Arb, Herbie, FPBench

#### SK-MATH-015: interpolation-approximation
- **Type:** Skill
- **Purpose:** Function interpolation and approximation methods
- **Capabilities:**
  - Polynomial interpolation (Lagrange, Newton, Chebyshev)
  - Spline interpolation (cubic, B-spline)
  - Rational approximation (Pade)
  - Least squares fitting
  - Minimax approximation (Remez algorithm)
  - Approximation error bounds
- **Enhances Processes:** numerical-stability-analysis, model-validation-framework
- **Priority:** Medium
- **Integration:** Chebfun, scipy.interpolate

---

### 4. Optimization Skills

#### SK-MATH-016: convex-optimization-solver
- **Type:** Skill
- **Purpose:** Solve convex optimization problems efficiently
- **Capabilities:**
  - Linear programming (LP)
  - Quadratic programming (QP)
  - Second-order cone programming (SOCP)
  - Semidefinite programming (SDP)
  - Conic optimization
  - Duality analysis
- **Enhances Processes:** optimization-problem-formulation, convex-analysis-verification
- **Priority:** High
- **Integration:** CVXPY, Gurobi, MOSEK, SCS, ECOS

#### SK-MATH-017: nonlinear-optimization-solver
- **Type:** Skill
- **Purpose:** Solve general nonlinear optimization problems
- **Capabilities:**
  - Gradient-based methods (BFGS, L-BFGS, CG)
  - Newton and quasi-Newton methods
  - Interior point methods
  - Sequential quadratic programming (SQP)
  - Global optimization (basin-hopping, differential evolution)
  - Constraint handling
- **Enhances Processes:** optimization-problem-formulation, sensitivity-analysis-optimization
- **Priority:** High
- **Integration:** IPOPT, KNITRO, NLopt, scipy.optimize

#### SK-MATH-018: mixed-integer-optimization
- **Type:** Skill
- **Purpose:** Mixed-integer linear and nonlinear programming
- **Capabilities:**
  - Branch and bound/cut algorithms
  - MIP formulation techniques
  - Indicator constraints
  - Big-M reformulations
  - Lazy constraints
  - Solution pool generation
- **Enhances Processes:** optimization-problem-formulation
- **Priority:** High
- **Integration:** Gurobi, CPLEX, SCIP, CBC

#### SK-MATH-019: sensitivity-analysis-toolkit
- **Type:** Skill
- **Purpose:** Comprehensive sensitivity analysis for optimization
- **Capabilities:**
  - Dual variable computation and interpretation
  - Shadow price analysis
  - Parametric programming
  - Binding constraint analysis
  - Post-optimality analysis
  - Robust optimization formulations
- **Enhances Processes:** sensitivity-analysis-optimization, optimization-problem-formulation
- **Priority:** Medium
- **Integration:** Pyomo, JuMP, AMPL

#### SK-MATH-020: derivative-free-optimization
- **Type:** Skill
- **Purpose:** Optimization without gradient information
- **Capabilities:**
  - Nelder-Mead simplex method
  - Powell's method
  - Surrogate-based optimization
  - Bayesian optimization
  - Pattern search methods
  - Trust region methods
- **Enhances Processes:** optimization-problem-formulation
- **Priority:** Medium
- **Integration:** scipy.optimize, Optuna, GPyOpt

---

### 5. Statistical Computing Skills

#### SK-MATH-021: stan-bayesian-modeling
- **Type:** Skill
- **Purpose:** Stan probabilistic programming for Bayesian inference
- **Capabilities:**
  - Stan model specification
  - MCMC sampling (NUTS, HMC)
  - Variational inference
  - Prior predictive checks
  - Posterior predictive checks
  - Model comparison (LOO-CV, WAIC)
- **Enhances Processes:** bayesian-inference-workflow, statistical-model-selection
- **Priority:** High
- **Integration:** Stan, CmdStan, RStan, PyStan

#### SK-MATH-022: pymc-probabilistic-programming
- **Type:** Skill
- **Purpose:** PyMC for flexible Bayesian modeling
- **Capabilities:**
  - Hierarchical model specification
  - Custom distributions
  - Gaussian processes
  - MCMC and variational inference
  - Model diagnostics
  - ArviZ integration for visualization
- **Enhances Processes:** bayesian-inference-workflow, statistical-model-selection
- **Priority:** High
- **Integration:** PyMC, ArviZ, Theano/PyTensor

#### SK-MATH-023: mcmc-diagnostics
- **Type:** Skill
- **Purpose:** MCMC convergence diagnostics and analysis
- **Capabilities:**
  - Rhat (potential scale reduction) computation
  - Effective sample size (ESS) calculation
  - Trace plot generation
  - Autocorrelation analysis
  - Divergence detection
  - Energy diagnostic (E-BFMI)
- **Enhances Processes:** bayesian-inference-workflow
- **Priority:** High
- **Integration:** ArviZ, CODA, MCMCpack

#### SK-MATH-024: power-sample-size-calculator
- **Type:** Skill
- **Purpose:** Statistical power analysis and sample size determination
- **Capabilities:**
  - Power analysis for common tests (t-test, ANOVA, chi-square)
  - Effect size calculation
  - Sample size estimation
  - Simulation-based power analysis
  - Multi-level model power analysis
  - Sequential analysis design
- **Enhances Processes:** experimental-design-planning, hypothesis-testing-framework
- **Priority:** High
- **Integration:** G*Power, pwr (R), statsmodels

#### SK-MATH-025: multiple-testing-correction
- **Type:** Skill
- **Purpose:** Multiple comparison correction methods
- **Capabilities:**
  - Bonferroni correction
  - Holm-Bonferroni method
  - Benjamini-Hochberg FDR control
  - Sidak correction
  - Permutation-based corrections
  - Family-wise error rate control
- **Enhances Processes:** hypothesis-testing-framework, experimental-design-planning
- **Priority:** Medium
- **Integration:** statsmodels, scipy.stats, R (multcomp, multtest)

#### SK-MATH-026: robust-statistics-toolkit
- **Type:** Skill
- **Purpose:** Robust statistical methods resistant to outliers
- **Capabilities:**
  - M-estimators (Huber, Tukey)
  - Trimmed and winsorized estimators
  - Robust regression (MM-estimation)
  - Breakdown point analysis
  - Influence function computation
  - Robust covariance estimation
- **Enhances Processes:** statistical-model-selection, model-validation-framework
- **Priority:** Medium
- **Integration:** robustbase (R), scikit-learn, statsmodels

---

### 6. Graph Theory and Combinatorics Skills

#### SK-MATH-027: graph-algorithm-library
- **Type:** Skill
- **Purpose:** Comprehensive graph algorithms implementation
- **Capabilities:**
  - Shortest path algorithms (Dijkstra, Bellman-Ford, Floyd-Warshall)
  - Network flow algorithms
  - Matching algorithms
  - Graph coloring
  - Planarity testing
  - Graph isomorphism
- **Enhances Processes:** algorithm-complexity-analysis, conjecture-exploration
- **Priority:** Medium
- **Integration:** NetworkX, igraph, LEMON, Boost Graph Library

#### SK-MATH-028: combinatorial-enumeration
- **Type:** Skill
- **Purpose:** Combinatorial object generation and counting
- **Capabilities:**
  - Permutation and combination generation
  - Partition enumeration
  - Generating function computation
  - OEIS sequence lookup
  - Polya enumeration
  - Species theory computations
- **Enhances Processes:** conjecture-exploration, algorithm-complexity-analysis
- **Priority:** Medium
- **Integration:** OEIS, SageMath combinat, SymPy combinatorics

---

### 7. Uncertainty Quantification Skills

#### SK-MATH-029: monte-carlo-simulation
- **Type:** Skill
- **Purpose:** Monte Carlo methods for uncertainty quantification
- **Capabilities:**
  - Standard Monte Carlo sampling
  - Importance sampling
  - Stratified sampling
  - Quasi-Monte Carlo (Sobol, Halton sequences)
  - Markov chain Monte Carlo
  - Convergence analysis
- **Enhances Processes:** uncertainty-quantification, model-validation-framework
- **Priority:** High
- **Integration:** NumPy, scipy.stats, SALib

#### SK-MATH-030: sensitivity-analysis-uq
- **Type:** Skill
- **Purpose:** Global sensitivity analysis methods
- **Capabilities:**
  - Sobol indices computation
  - Morris screening method
  - FAST (Fourier amplitude sensitivity test)
  - Correlation-based sensitivity
  - Derivative-based sensitivity (DGSM)
  - Variance-based decomposition
- **Enhances Processes:** uncertainty-quantification, sensitivity-analysis-optimization
- **Priority:** High
- **Integration:** SALib, OpenTURNS, UQLab

#### SK-MATH-031: polynomial-chaos-expansion
- **Type:** Skill
- **Purpose:** Polynomial chaos for uncertainty propagation
- **Capabilities:**
  - Generalized polynomial chaos bases
  - Sparse PCE construction
  - Adaptive basis selection
  - PCE-based sensitivity indices
  - Low-rank tensor approximation
  - Stochastic Galerkin projection
- **Enhances Processes:** uncertainty-quantification, model-formulation-workflow
- **Priority:** Medium
- **Integration:** Chaospy, UQLab, OpenTURNS

---

### 8. LaTeX and Documentation Skills

#### SK-MATH-032: latex-math-formatter
- **Type:** Skill
- **Purpose:** High-quality LaTeX mathematical typesetting
- **Capabilities:**
  - Equation formatting and alignment
  - Theorem environment generation
  - Proof environment structuring
  - AMS-LaTeX package utilization
  - Cross-referencing management
  - Bibliography generation (BibTeX)
- **Enhances Processes:** latex-document-generation, proof-writing-assistance, mathematical-notation-standardization
- **Priority:** High
- **Integration:** LaTeX, AMS packages, Overleaf API

#### SK-MATH-033: diagram-generator
- **Type:** Skill
- **Purpose:** Mathematical diagram and visualization generation
- **Capabilities:**
  - Commutative diagrams (tikz-cd)
  - Function plots (pgfplots)
  - Graph drawings (tikz)
  - 3D surface plots
  - Phase portraits
  - Geometric constructions
- **Enhances Processes:** latex-document-generation, proof-writing-assistance
- **Priority:** Medium
- **Integration:** TikZ, PGFPlots, Asymptote, matplotlib

#### SK-MATH-034: math-notation-validator
- **Type:** Skill
- **Purpose:** Validate and standardize mathematical notation
- **Capabilities:**
  - Notation consistency checking
  - Symbol definition tracking
  - Notation conflict detection
  - Style guide compliance
  - Glossary generation
  - Notation conversion between standards
- **Enhances Processes:** mathematical-notation-standardization, latex-document-generation
- **Priority:** Medium
- **Integration:** Custom parsers, LaTeX linters

---

### 9. Literature and Research Skills

#### SK-MATH-035: arxiv-search-interface
- **Type:** Skill
- **Purpose:** Search and analyze mathematical literature on arXiv
- **Capabilities:**
  - arXiv API queries
  - Mathematical subject classification filtering
  - Citation network analysis
  - Abstract summarization
  - Related paper recommendations
  - Version tracking
- **Enhances Processes:** mathematical-literature-review
- **Priority:** High
- **Integration:** arXiv API, Semantic Scholar

#### SK-MATH-036: mathscinet-interface
- **Type:** Skill
- **Purpose:** Interface with MathSciNet for mathematical reviews
- **Capabilities:**
  - MSC classification lookup
  - Author profile retrieval
  - Citation searching
  - Review text access
  - Related work discovery
  - Collaboration network analysis
- **Enhances Processes:** mathematical-literature-review
- **Priority:** Medium
- **Integration:** MathSciNet API

#### SK-MATH-037: zbmath-interface
- **Type:** Skill
- **Purpose:** Interface with zbMATH Open database
- **Capabilities:**
  - Open access mathematical literature search
  - Software reference linking
  - Classification browsing
  - Author disambiguation
  - Full-text linking
- **Enhances Processes:** mathematical-literature-review
- **Priority:** Medium
- **Integration:** zbMATH Open API

---

### 10. Reproducibility and Benchmarking Skills

#### SK-MATH-038: computational-environment-manager
- **Type:** Skill
- **Purpose:** Manage reproducible computational environments
- **Capabilities:**
  - Docker container configuration
  - Conda environment specification
  - Package version pinning
  - Random seed management
  - Platform independence verification
  - Execution trace logging
- **Enhances Processes:** reproducible-computation-setup, benchmark-validation
- **Priority:** High
- **Integration:** Docker, Conda, pip, Julia Pkg

#### SK-MATH-039: benchmark-suite-manager
- **Type:** Skill
- **Purpose:** Manage and execute mathematical benchmark suites
- **Capabilities:**
  - Standard benchmark access (Matrix Market, NIST, etc.)
  - Custom benchmark generation
  - Performance profiling
  - Accuracy validation
  - Comparison against reference solutions
  - Statistical analysis of results
- **Enhances Processes:** benchmark-validation, numerical-stability-analysis
- **Priority:** Medium
- **Integration:** Matrix Market, NIST Digital Library, SuiteSparse Matrix Collection

---

## Specialized Agents (Subagents)

### 1. Pure Mathematics Agents

#### AG-MATH-001: theorem-prover-expert
- **Type:** Agent
- **Role:** Expert in interactive theorem proving and formal verification
- **Capabilities:**
  - Proof strategy development
  - Tactic selection and automation
  - Library navigation (Mathlib, MathComp)
  - Formalization guidance
  - Proof gap identification
  - Extraction planning
- **Persona:** Formal methods researcher with Lean/Coq expertise and contributions to mathematical libraries
- **Enhances Processes:** theorem-proof-verification, proof-writing-assistance
- **Priority:** High

#### AG-MATH-002: proof-strategist
- **Type:** Agent
- **Role:** Expert in mathematical proof techniques and strategies
- **Capabilities:**
  - Proof method selection (direct, contradiction, induction, cases)
  - Assumption identification and validation
  - Logical structure analysis
  - Counter-argument anticipation
  - Proof simplification suggestions
  - Alternative proof path exploration
- **Persona:** Research mathematician with expertise across multiple areas of pure mathematics
- **Enhances Processes:** proof-writing-assistance, theorem-proof-verification, conjecture-exploration
- **Priority:** High

#### AG-MATH-003: conjecture-analyst
- **Type:** Agent
- **Role:** Expert in conjecture formulation and exploration
- **Capabilities:**
  - Pattern recognition from computational data
  - Conjecture refinement
  - Counterexample construction guidance
  - Relationship to known results
  - Generalization and specialization suggestions
  - Difficulty assessment
- **Persona:** Experimental mathematician combining computational exploration with theoretical insight
- **Enhances Processes:** conjecture-exploration
- **Priority:** Medium

---

### 2. Applied Mathematics Agents

#### AG-MATH-004: numerical-analyst
- **Type:** Agent
- **Role:** Expert in numerical analysis and scientific computing
- **Capabilities:**
  - Algorithm stability assessment
  - Error propagation analysis
  - Method selection guidance
  - Convergence analysis
  - Conditioning diagnosis
  - Performance optimization
- **Persona:** Numerical analyst with Higham/Trefethen-level expertise in accuracy and stability
- **Enhances Processes:** numerical-stability-analysis, matrix-computation-optimization, pde-solver-selection
- **Priority:** High

#### AG-MATH-005: pde-expert
- **Type:** Agent
- **Role:** Expert in partial differential equations (analytical and numerical)
- **Capabilities:**
  - PDE classification (elliptic, parabolic, hyperbolic)
  - Analytical solution techniques
  - Numerical method selection
  - Boundary condition handling
  - Stability and convergence analysis
  - Singularity treatment
- **Persona:** Applied mathematician with expertise in mathematical physics and computational PDEs
- **Enhances Processes:** pde-solver-selection, numerical-stability-analysis, model-formulation-workflow
- **Priority:** High

#### AG-MATH-006: mathematical-modeler
- **Type:** Agent
- **Role:** Expert in mathematical model development and validation
- **Capabilities:**
  - Model formulation from physical principles
  - Dimensional analysis
  - Parameter estimation
  - Model validation against data
  - Sensitivity assessment
  - Model selection criteria
- **Persona:** Applied mathematician with interdisciplinary modeling experience
- **Enhances Processes:** model-formulation-workflow, model-validation-framework, uncertainty-quantification
- **Priority:** High

---

### 3. Statistics Agents

#### AG-MATH-007: bayesian-statistician
- **Type:** Agent
- **Role:** Expert in Bayesian inference and probabilistic modeling
- **Capabilities:**
  - Prior elicitation guidance
  - Model specification
  - MCMC diagnostics interpretation
  - Posterior analysis
  - Model comparison (LOO, WAIC, Bayes factors)
  - Hierarchical model design
- **Persona:** Bayesian statistician with Gelman/McElreath-level expertise
- **Enhances Processes:** bayesian-inference-workflow, statistical-model-selection
- **Priority:** High

#### AG-MATH-008: experimental-design-expert
- **Type:** Agent
- **Role:** Expert in statistical experimental design
- **Capabilities:**
  - Design selection (factorial, fractional factorial, response surface)
  - Randomization scheme development
  - Power analysis and sample size calculation
  - Blocking and stratification
  - Sequential design
  - Optimal design construction
- **Persona:** Biostatistician with deep expertise in clinical and experimental design
- **Enhances Processes:** experimental-design-planning, hypothesis-testing-framework
- **Priority:** High

#### AG-MATH-009: statistical-modeler
- **Type:** Agent
- **Role:** Expert in statistical model selection and diagnostics
- **Capabilities:**
  - Model assumption checking
  - Goodness-of-fit assessment
  - Information criterion interpretation
  - Cross-validation design
  - Model comparison
  - Diagnostic interpretation
- **Persona:** Applied statistician with expertise in regression and GLMs
- **Enhances Processes:** statistical-model-selection, hypothesis-testing-framework
- **Priority:** High

---

### 4. Optimization Agents

#### AG-MATH-010: optimization-expert
- **Type:** Agent
- **Role:** Expert in mathematical optimization theory and practice
- **Capabilities:**
  - Problem formulation guidance
  - Convexity assessment
  - Solver selection
  - Reformulation techniques
  - Duality interpretation
  - Sensitivity analysis
- **Persona:** Operations researcher with Boyd/Vandenberghe-level convex optimization expertise
- **Enhances Processes:** optimization-problem-formulation, convex-analysis-verification, sensitivity-analysis-optimization
- **Priority:** High

#### AG-MATH-011: discrete-optimization-expert
- **Type:** Agent
- **Role:** Expert in combinatorial and integer optimization
- **Capabilities:**
  - MIP formulation techniques
  - Valid inequality generation
  - Branching strategies
  - Heuristic design
  - Problem decomposition
  - Approximation algorithm design
- **Persona:** Combinatorial optimization researcher with Wolsey-level integer programming expertise
- **Enhances Processes:** optimization-problem-formulation
- **Priority:** Medium

---

### 5. Symbolic Computation Agents

#### AG-MATH-012: symbolic-computation-expert
- **Type:** Agent
- **Role:** Expert in computer algebra and symbolic computation
- **Capabilities:**
  - Simplification strategy selection
  - Integration technique guidance
  - Series expansion analysis
  - Special function manipulation
  - Algebraic structure recognition
  - CAS system selection
- **Persona:** Computer algebraist with expertise in symbolic algorithms
- **Enhances Processes:** symbolic-simplification, symbolic-integration-differentiation
- **Priority:** High

#### AG-MATH-013: algebraist
- **Type:** Agent
- **Role:** Expert in abstract and computational algebra
- **Capabilities:**
  - Group theory computations
  - Ring and field operations
  - Polynomial system solving
  - Groebner basis computation
  - Galois theory applications
  - Algebraic number theory
- **Persona:** Algebraist with computational algebra expertise (GAP, Magma, Singular)
- **Enhances Processes:** symbolic-simplification, conjecture-exploration
- **Priority:** Medium

---

### 6. Research and Documentation Agents

#### AG-MATH-014: mathematics-writer
- **Type:** Agent
- **Role:** Expert in mathematical writing and exposition
- **Capabilities:**
  - Proof presentation structuring
  - Notation selection and consistency
  - Audience-appropriate exposition
  - LaTeX best practices
  - Mathematical style guide application
  - Abstract writing
- **Persona:** Mathematics author with experience writing textbooks and research papers
- **Enhances Processes:** latex-document-generation, proof-writing-assistance, mathematical-notation-standardization
- **Priority:** High

#### AG-MATH-015: literature-reviewer
- **Type:** Agent
- **Role:** Expert in mathematical literature analysis
- **Capabilities:**
  - Related work identification
  - Result comparison and positioning
  - Gap identification
  - Citation network analysis
  - Historical context
  - Cross-field connection recognition
- **Persona:** Research mathematician with broad reading and bibliographic expertise
- **Enhances Processes:** mathematical-literature-review
- **Priority:** Medium

---

### 7. Uncertainty Quantification Agents

#### AG-MATH-016: uq-specialist
- **Type:** Agent
- **Role:** Expert in uncertainty quantification methodology
- **Capabilities:**
  - UQ method selection
  - Sensitivity analysis design
  - Surrogate model construction
  - Uncertainty propagation
  - Model calibration under uncertainty
  - Risk quantification
- **Persona:** UQ researcher with expertise in computational science applications
- **Enhances Processes:** uncertainty-quantification, model-validation-framework
- **Priority:** High

---

### 8. Computational Reproducibility Agents

#### AG-MATH-017: reproducibility-engineer
- **Type:** Agent
- **Role:** Expert in computational reproducibility practices
- **Capabilities:**
  - Environment configuration
  - Version control for computational research
  - Documentation standards
  - Testing for scientific code
  - Continuous integration for research
  - Data and code archiving
- **Persona:** Research software engineer with reproducibility and open science expertise
- **Enhances Processes:** reproducible-computation-setup, benchmark-validation
- **Priority:** Medium

---

## Shared/Cross-Cutting Candidates

These skills and agents could be shared with other specializations:

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-MATH-001 | lean-proof-assistant | computer-science, software-architecture |
| SK-MATH-006 | sympy-computer-algebra | data-science-ml, physics, engineering |
| SK-MATH-011 | numerical-linear-algebra-toolkit | data-science-ml, computer-science |
| SK-MATH-016 | convex-optimization-solver | data-science-ml, algorithms-optimization |
| SK-MATH-021 | stan-bayesian-modeling | data-science-ml, bioinformatics |
| SK-MATH-029 | monte-carlo-simulation | physics, finance, data-science-ml |
| SK-MATH-030 | sensitivity-analysis-uq | engineering, physics |
| SK-MATH-032 | latex-math-formatter | technical-documentation, physics |
| SK-MATH-035 | arxiv-search-interface | computer-science, physics |
| SK-MATH-038 | computational-environment-manager | data-science-ml, computer-science |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-MATH-001 | theorem-prover-expert | computer-science |
| AG-MATH-004 | numerical-analyst | physics, engineering |
| AG-MATH-007 | bayesian-statistician | data-science-ml, bioinformatics |
| AG-MATH-010 | optimization-expert | algorithms-optimization, data-science-ml |
| AG-MATH-014 | mathematics-writer | technical-documentation |
| AG-MATH-016 | uq-specialist | engineering, physics |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total Skills** | 39 |
| **Total Agents** | 17 |
| **Shared Candidates (Skills)** | 10 |
| **Shared Candidates (Agents)** | 6 |
| **High Priority Skills** | 21 |
| **High Priority Agents** | 11 |
| **Medium Priority Skills** | 18 |
| **Medium Priority Agents** | 6 |
| **Low Priority Skills** | 0 |
| **Low Priority Agents** | 0 |

---

## Process-to-Skills/Agents Mapping

### Proof and Theorem Development
| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| theorem-proof-verification | SK-MATH-001, SK-MATH-002, SK-MATH-003, SK-MATH-004, SK-MATH-005 | AG-MATH-001, AG-MATH-002 |
| conjecture-exploration | SK-MATH-004, SK-MATH-006, SK-MATH-009, SK-MATH-027, SK-MATH-028 | AG-MATH-002, AG-MATH-003 |
| proof-writing-assistance | SK-MATH-001, SK-MATH-002, SK-MATH-005, SK-MATH-032, SK-MATH-033 | AG-MATH-001, AG-MATH-002, AG-MATH-014 |

### Numerical Analysis and Computation
| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| numerical-stability-analysis | SK-MATH-011, SK-MATH-014, SK-MATH-015, SK-MATH-039 | AG-MATH-004 |
| algorithm-complexity-analysis | SK-MATH-006, SK-MATH-027, SK-MATH-028 | AG-MATH-004 |
| pde-solver-selection | SK-MATH-007, SK-MATH-010, SK-MATH-012 | AG-MATH-004, AG-MATH-005 |
| matrix-computation-optimization | SK-MATH-011 | AG-MATH-004 |

### Statistical Analysis
| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| experimental-design-planning | SK-MATH-024, SK-MATH-025 | AG-MATH-008 |
| statistical-model-selection | SK-MATH-021, SK-MATH-022, SK-MATH-026 | AG-MATH-007, AG-MATH-009 |
| bayesian-inference-workflow | SK-MATH-021, SK-MATH-022, SK-MATH-023 | AG-MATH-007 |
| hypothesis-testing-framework | SK-MATH-024, SK-MATH-025, SK-MATH-026 | AG-MATH-008, AG-MATH-009 |

### Optimization
| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| optimization-problem-formulation | SK-MATH-016, SK-MATH-017, SK-MATH-018, SK-MATH-019 | AG-MATH-010, AG-MATH-011 |
| convex-analysis-verification | SK-MATH-016, SK-MATH-017 | AG-MATH-010 |
| sensitivity-analysis-optimization | SK-MATH-019, SK-MATH-030 | AG-MATH-010 |

### Mathematical Modeling
| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| model-formulation-workflow | SK-MATH-006, SK-MATH-013, SK-MATH-031 | AG-MATH-005, AG-MATH-006 |
| uncertainty-quantification | SK-MATH-029, SK-MATH-030, SK-MATH-031 | AG-MATH-006, AG-MATH-016 |
| model-validation-framework | SK-MATH-015, SK-MATH-026, SK-MATH-029 | AG-MATH-006, AG-MATH-016 |

### Symbolic Computation
| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| symbolic-simplification | SK-MATH-006, SK-MATH-007, SK-MATH-008, SK-MATH-009, SK-MATH-010 | AG-MATH-012, AG-MATH-013 |
| symbolic-integration-differentiation | SK-MATH-006, SK-MATH-007, SK-MATH-008, SK-MATH-010 | AG-MATH-012 |

### Research and Documentation
| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| mathematical-literature-review | SK-MATH-035, SK-MATH-036, SK-MATH-037 | AG-MATH-015 |
| latex-document-generation | SK-MATH-032, SK-MATH-033, SK-MATH-034 | AG-MATH-014 |
| mathematical-notation-standardization | SK-MATH-032, SK-MATH-034 | AG-MATH-014 |

### Computational Reproducibility
| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| reproducible-computation-setup | SK-MATH-038 | AG-MATH-017 |
| benchmark-validation | SK-MATH-038, SK-MATH-039 | AG-MATH-017 |

---

## Implementation Priority

### Phase 1 (High Priority - Core Mathematical Capabilities)
1. SK-MATH-001: lean-proof-assistant
2. SK-MATH-002: coq-proof-assistant
3. SK-MATH-004: counterexample-generator
4. SK-MATH-006: sympy-computer-algebra
5. SK-MATH-011: numerical-linear-algebra-toolkit
6. SK-MATH-014: floating-point-analysis
7. SK-MATH-016: convex-optimization-solver
8. SK-MATH-021: stan-bayesian-modeling
9. SK-MATH-032: latex-math-formatter
10. AG-MATH-001: theorem-prover-expert
11. AG-MATH-002: proof-strategist
12. AG-MATH-004: numerical-analyst
13. AG-MATH-007: bayesian-statistician
14. AG-MATH-010: optimization-expert

### Phase 2 (Medium Priority - Specialized Domains)
1. SK-MATH-005: proof-structure-analyzer
2. SK-MATH-007: mathematica-wolfram-interface
3. SK-MATH-012: pde-solver-library
4. SK-MATH-017: nonlinear-optimization-solver
5. SK-MATH-022: pymc-probabilistic-programming
6. SK-MATH-023: mcmc-diagnostics
7. SK-MATH-024: power-sample-size-calculator
8. SK-MATH-029: monte-carlo-simulation
9. SK-MATH-030: sensitivity-analysis-uq
10. SK-MATH-035: arxiv-search-interface
11. AG-MATH-005: pde-expert
12. AG-MATH-006: mathematical-modeler
13. AG-MATH-008: experimental-design-expert
14. AG-MATH-012: symbolic-computation-expert
15. AG-MATH-014: mathematics-writer

### Phase 3 (Lower Priority - Extended Capabilities)
1. SK-MATH-003: isabelle-hol-interface
2. SK-MATH-008: maxima-cas-interface
3. SK-MATH-009: sage-math-interface
4. SK-MATH-010: special-functions-library
5. SK-MATH-018: mixed-integer-optimization
6. SK-MATH-027: graph-algorithm-library
7. SK-MATH-028: combinatorial-enumeration
8. SK-MATH-036: mathscinet-interface
9. SK-MATH-037: zbmath-interface
10. AG-MATH-003: conjecture-analyst
11. AG-MATH-011: discrete-optimization-expert
12. AG-MATH-013: algebraist
13. AG-MATH-015: literature-reviewer
14. AG-MATH-016: uq-specialist
15. AG-MATH-017: reproducibility-engineer

---

## Tool and Integration Requirements

### Proof Assistants
- Lean 4 with Mathlib4 (modern type theory, mathematical library)
- Coq with MathComp/SSReflect (classical proofs)
- Isabelle/HOL with AFP (classical higher-order logic)
- Agda (dependent types)

### Computer Algebra Systems
- SymPy (Python-based, open source)
- Mathematica/Wolfram Language (comprehensive commercial)
- Maxima (open source, symbolic)
- SageMath (unified interface, open source)
- GAP (computational group theory)
- Singular (polynomial algebra)

### Numerical Computing
- NumPy/SciPy (Python numerical stack)
- Julia (high-performance scientific computing)
- MATLAB (commercial numerical environment)
- LAPACK/BLAS (linear algebra backends)
- PETSc (parallel scientific computing)
- SUNDIALS (differential equation solvers)

### Optimization Solvers
- Gurobi (commercial LP/MIP/QP)
- MOSEK (commercial conic)
- CPLEX (commercial MIP)
- SCIP (open source MIP)
- IPOPT (open source nonlinear)
- CVXPY (Python modeling)

### Statistical Software
- Stan (probabilistic programming)
- PyMC (Bayesian modeling)
- R (statistical computing)
- ArviZ (Bayesian visualization)
- statsmodels (Python statistics)

### Documentation Tools
- LaTeX with AMS packages
- Overleaf (collaborative LaTeX)
- TikZ/PGFPlots (mathematical graphics)
- Jupyter (computational notebooks)

### Literature Databases
- arXiv (preprints)
- MathSciNet (AMS reviews)
- zbMATH Open (open access)
- Semantic Scholar (citation analysis)

---

## Next Steps

1. **Validate** this backlog with mathematicians and computational scientists
2. **Prioritize** based on process usage frequency and research impact
3. **Prototype** high-priority skills (lean-proof-assistant, sympy-computer-algebra, stan-bayesian-modeling)
4. **Implement** core agents (theorem-prover-expert, numerical-analyst, bayesian-statistician)
5. **Integrate** skills into existing process definitions
6. **Test** with real mathematical research workflows
7. **Iterate** based on researcher feedback and verification success rates

---

## Appendix: External Tool References

### Theorem Provers and Proof Assistants
- Lean Prover: https://leanprover.github.io/
- Mathlib4: https://github.com/leanprover-community/mathlib4
- Coq: https://coq.inria.fr/
- Mathematical Components: https://math-comp.github.io/
- Isabelle: https://isabelle.in.tum.de/
- Archive of Formal Proofs: https://www.isa-afp.org/

### Computer Algebra Systems
- SymPy: https://www.sympy.org/
- Wolfram Mathematica: https://www.wolfram.com/mathematica/
- SageMath: https://www.sagemath.org/
- Maxima: https://maxima.sourceforge.io/

### Numerical Libraries
- LAPACK: https://www.netlib.org/lapack/
- PETSc: https://petsc.org/
- SUNDIALS: https://computing.llnl.gov/projects/sundials
- FEniCS: https://fenicsproject.org/

### Optimization
- CVXPY: https://www.cvxpy.org/
- Gurobi: https://www.gurobi.com/
- MOSEK: https://www.mosek.com/
- IPOPT: https://coin-or.github.io/Ipopt/

### Statistical Computing
- Stan: https://mc-stan.org/
- PyMC: https://www.pymc.io/
- ArviZ: https://arviz-devs.github.io/arviz/

### Mathematical Literature
- arXiv math: https://arxiv.org/archive/math
- MathSciNet: https://mathscinet.ams.org/
- zbMATH Open: https://zbmath.org/

---

## Phase 7: Process Integration Checklist

### Completed Process Files

#### Proof and Theorem Development
- [x] theorem-proof-verification.js - Updated with theorem-prover-expert agent, lean-proof-assistant, coq-proof-assistant, counterexample-generator skills
- [x] conjecture-exploration.js - Updated with proof-strategist/conjecture-analyst agents, counterexample-generator, sympy-computer-algebra skills
- [x] proof-writing-assistance.js - Updated with proof-strategist/mathematics-writer agents, lean-proof-assistant, proof-structure-analyzer skills

#### Numerical Analysis and Computation
- [x] numerical-stability-analysis.js - Updated with numerical-analyst agent, numerical-linear-algebra-toolkit, floating-point-analysis skills
- [x] algorithm-complexity-analysis.js - Updated with numerical-analyst agent, sympy-computer-algebra, graph-algorithm-library skills
- [x] pde-solver-selection.js - Updated with numerical-analyst/pde-expert agents, pde-solver-library, mathematica-wolfram-interface skills
- [x] matrix-computation-optimization.js - Updated with numerical-analyst agent, numerical-linear-algebra-toolkit skills

#### Statistical Analysis
- [x] experimental-design-planning.js - Updated with experimental-design-expert agent, power-sample-size-calculator, multiple-testing-correction skills
- [x] statistical-model-selection.js - Updated with bayesian-statistician/statistical-modeler agents, stan-bayesian-modeling, pymc-probabilistic-programming skills
- [x] bayesian-inference-workflow.js - Updated with bayesian-statistician agent, stan-bayesian-modeling, pymc-probabilistic-programming, mcmc-diagnostics skills
- [x] hypothesis-testing-framework.js - Updated with experimental-design-expert/statistical-modeler agents, power-sample-size-calculator, multiple-testing-correction skills

#### Optimization
- [x] optimization-problem-formulation.js - Updated with optimization-expert agent, cvxpy-optimization-modeling, convex-optimization-solver, mixed-integer-optimization skills
- [x] convex-analysis-verification.js - Updated with optimization-expert agent, cvxpy-optimization-modeling, convex-optimization-solver, nonlinear-optimization-solver skills
- [x] sensitivity-analysis-optimization.js - Updated with optimization-expert agent, cvxpy-optimization-modeling, sensitivity-analysis-toolkit, convex-optimization-solver skills

#### Mathematical Modeling
- [x] model-formulation-workflow.js - Updated with applied-mathematician agent, sympy-computer-algebra, pde-solver-library, numerical-linear-algebra-toolkit skills
- [x] uncertainty-quantification.js - Updated with uq-specialist agent, monte-carlo-simulation, sensitivity-analysis-uq, polynomial-chaos-expansion skills
- [x] model-validation-framework.js - Updated with mathematical-modeler/uq-specialist agents, interpolation-approximation, robust-statistics-toolkit, monte-carlo-simulation skills

#### Symbolic Computation
- [x] symbolic-simplification.js - Updated with symbolic-computation-expert agent, sympy-computer-algebra, mathematica-wolfram-interface, sage-math-interface skills
- [x] symbolic-integration-differentiation.js - Updated with symbolic-computation-expert agent, sympy-computer-algebra, mathematica-wolfram-interface, special-functions-library skills

#### Research and Documentation
- [x] mathematical-literature-review.js - Updated with literature-reviewer agent, arxiv-search-interface, scientific-literature-search, bibtex-reference-manager skills
- [x] latex-document-generation.js - Updated with mathematics-writer agent, latex-math-formatter, sympy-computer-algebra, bibtex-reference-manager skills
- [x] mathematical-notation-standardization.js - Updated with mathematics-writer agent, latex-math-formatter, sympy-computer-algebra, special-functions-library skills

#### Computational Reproducibility
- [x] reproducible-computation-setup.js - Updated with scientific-computing-specialist agent, version-control-for-math, jupyter-notebook-interface, reproducible-research-tools skills
- [x] benchmark-validation.js - Updated with numerical-analyst agent, benchmark-suite-manager, numerical-linear-algebra-toolkit, floating-point-analysis skills

### Integration Notes
- All process files now use the standardized pattern with `skills: [...]` array inside agent objects
- Agent objects include domain-specific agent names (optimization-expert, uq-specialist, applied-mathematician, numerical-analyst, theorem-prover-expert, bayesian-statistician, etc.)
- Agent objects include skills arrays for multi-skill capability
- Process-to-Skills/Agents mapping table used as reference for integration
- Old `skill: { name: '...' }` task-level pattern has been removed from all files
