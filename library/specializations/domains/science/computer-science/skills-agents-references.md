# Computer Science - Skills and Agents References (Phase 5)

## Overview

This document provides reference materials, resources, and cross-specialization links for implementing the skills and agents identified in the Computer Science (Theoretical) skills-agents-backlog.md. It covers GitHub repositories, MCP servers, community resources, API documentation, and applicable skills from other specializations.

---

## GitHub Repositories

### Algorithm Analysis and Design

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [SymPy](https://github.com/sympy/sympy) | Symbolic mathematics | asymptotic-notation-calculator, recurrence-solver |
| [CLRS](https://github.com/walkccc/CLRS) | CLRS algorithm implementations | algorithm-analyst reference |
| [TheAlgorithms/Python](https://github.com/TheAlgorithms/Python) | Algorithm implementations | benchmark-suite-manager |
| [keon/algorithms](https://github.com/keon/algorithms) | Python algorithms | benchmark-suite-manager |
| [williamfiset/Algorithms](https://github.com/williamfiset/Algorithms) | Java implementations | benchmark-suite-manager |

### Complexity Theory and Computability

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [Complexity Zoo](https://complexityzoo.net/Complexity_Zoo) | Complexity class wiki | complexity-class-oracle |
| [Turing Machine Simulator](https://github.com/awmorp/turing) | TM simulation | turing-machine-simulator |
| [JFLAP](https://github.com/raxod502/jflap) | Automata tool | turing-machine-simulator |
| [Z3](https://github.com/Z3Prover/z3) | SMT solver | smt-solver-interface |
| [CVC5](https://github.com/cvc5/cvc5) | SMT solver | smt-solver-interface |

### Theorem Provers and Formal Verification

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [Coq](https://github.com/coq/coq) | Proof assistant | theorem-prover-interface |
| [Isabelle](https://github.com/isabelle-prover/mirror-isabelle) | Higher-order logic | theorem-prover-interface |
| [Lean 4](https://github.com/leanprover/lean4) | Modern proof assistant | theorem-prover-interface |
| [Mathlib4](https://github.com/leanprover-community/mathlib4) | Lean math library | theorem-prover-interface |
| [Agda](https://github.com/agda/agda) | Dependently typed | theorem-prover-interface |
| [Z3Prover](https://github.com/Z3Prover/z3) | SMT solver | smt-solver-interface |
| [Boolector](https://github.com/Boolector/boolector) | Bitvector SMT | smt-solver-interface |

### Model Checking

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [SPIN](https://github.com/nimble-code/Spin) | Promela model checker | model-checker-interface |
| [NuSMV](https://nusmv.fbk.eu/) | Symbolic model checker | model-checker-interface |
| [TLA+](https://github.com/tlaplus/tlaplus) | TLA+ toolbox | tla-plus-generator |
| [UPPAAL](https://uppaal.org/) | Timed automata | model-checker-interface |
| [Spot](https://gitlab.lrde.epita.fr/spot/spot) | LTL to automata | temporal-logic-translator |
| [Apalache](https://github.com/informalsystems/apalache) | TLA+ model checker | tla-plus-generator |

### Programming Language Theory

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [PLT Redex](https://github.com/racket/redex) | Semantics modeling | operational-semantics-builder |
| [K Framework](https://github.com/runtimeverification/k) | Language specification | operational-semantics-builder |
| [Ott](https://github.com/ott-lang/ott) | PL definition tool | typing-rule-generator |
| [ANTLR](https://github.com/antlr/antlr4) | Parser generator | dsl-compiler-generator |
| [Xtext](https://github.com/eclipse/xtext) | Language workbench | dsl-compiler-generator |
| [Spoofax](https://github.com/metaborg/spoofax) | Language workbench | dsl-compiler-generator |

### Compiler and Static Analysis

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [LLVM](https://github.com/llvm/llvm-project) | Compiler infrastructure | data-flow-analysis-framework, ssa-transformation-library |
| [GCC](https://github.com/gcc-mirror/gcc) | GNU Compiler | data-flow-analysis-framework |
| [Alive2](https://github.com/AliveToolkit/alive2) | LLVM verification | optimization-correctness-verifier |
| [CompCert](https://github.com/AbsInt/CompCert) | Verified compiler | optimization-correctness-verifier |
| [Frama-C](https://github.com/Frama-C/Frama-C-snapshot) | Static analysis | abstract-interpretation-analysis |
| [IKOS](https://github.com/NASA-SW-VnV/ikos) | Static analyzer | abstract-interpretation-analysis |
| [Apron](https://github.com/antoinemine/apron) | Abstract domains | abstract-domain-library |
| [ELINA](https://github.com/eth-sri/ELINA) | Fast abstract domains | abstract-domain-library |

### Concurrency and Distributed Systems

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [raft](https://github.com/hashicorp/raft) | Raft implementation | consensus-protocol-library |
| [etcd/raft](https://github.com/etcd-io/raft) | Raft implementation | consensus-protocol-library |
| [LibPaxos](https://github.com/fpaxos/libpaxos) | Paxos implementation | consensus-protocol-library |
| [LineUp](https://github.com/ahorn/linearizability) | Linearizability checker | linearizability-checker |
| [CDSChecker](https://plrg.ics.uci.edu/software/cdschecker/) | Memory model checker | memory-model-analyzer |
| [GenMC](https://github.com/MPI-SWS/genmc) | Memory model verifier | memory-model-analyzer |
| [Jepsen](https://github.com/jepsen-io/jepsen) | Distributed systems testing | consensus-protocol-library |

### Program Synthesis

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [SyGuS Solvers](https://sygus.org/comp/) | Synthesis competition | synthesis-specification-language |
| [Sketch](https://github.com/asolarlez/sketch-backend) | Sketch synthesizer | synthesis-specification-language |
| [CVC5 SyGuS](https://cvc5.github.io/docs/cvc5-1.0.0/theories/sygus.html) | SyGuS in CVC5 | synthesis-specification-language |
| [CPAchecker](https://github.com/sosy-lab/cpachecker) | Software verification | counterexample-guided-refinement |
| [SeaHorn](https://github.com/seahorn/seahorn) | Verification framework | counterexample-guided-refinement |

### Termination Analysis

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [AProVE](https://aprove.informatik.rwth-aachen.de/) | Termination prover | termination-analyzer |
| [T2](https://github.com/mmjb/T2) | Temporal prover | termination-analyzer |
| [Ultimate](https://github.com/ultimate-pa/ultimate) | Program analysis | termination-analyzer |

### Benchmarks and Databases

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [DIMACS](https://dimacs.rutgers.edu/programs/challenge/) | SAT benchmarks | benchmark-suite-manager |
| [TSPLIB](http://comopt.ifi.uni-heidelberg.de/software/TSPLIB95/) | TSP benchmarks | benchmark-suite-manager |
| [SV-COMP](https://sv-comp.sosy-lab.org/) | Verification competition | model-checker-interface |
| [SMT-LIB](https://smtlib.cs.uiowa.edu/) | SMT benchmarks | smt-solver-interface |

---

## MCP Server References

### Relevant MCP Servers for Computer Science

| MCP Server | Description | Applicable Skills |
|------------|-------------|-------------------|
| **filesystem** | File system operations | All skills with file I/O |
| **github** | Version control | Code versioning, benchmark access |
| **fetch** | Web access | Database queries, benchmark downloads |
| **postgres/sqlite** | Database operations | Benchmark results storage |
| **memory** | Persistent context | Long proof development sessions |

### Potential Custom MCP Servers

| Server Concept | Purpose | Skills Enabled |
|---------------|---------|----------------|
| **mcp-coq** | Coq proof assistant interface | theorem-prover-interface |
| **mcp-lean** | Lean 4 interface | theorem-prover-interface |
| **mcp-z3** | Z3 SMT solver interface | smt-solver-interface |
| **mcp-tlaplus** | TLA+ toolbox interface | tla-plus-generator |
| **mcp-spin** | SPIN model checker | model-checker-interface |
| **mcp-llvm** | LLVM analysis interface | data-flow-analysis-framework |
| **mcp-complexity-zoo** | Complexity class queries | complexity-class-oracle |

---

## Community Resources

### Forums and Discussion

| Resource | URL | Topics |
|----------|-----|--------|
| CS Theory Stack Exchange | https://cstheory.stackexchange.com/ | Research-level TCS |
| Computer Science Stack Exchange | https://cs.stackexchange.com/ | General CS |
| Coq Discourse | https://coq.discourse.group/ | Coq usage |
| Lean Zulip | https://leanprover.zulipchat.com/ | Lean 4, Mathlib |
| TLA+ Google Group | https://groups.google.com/g/tlaplus | TLA+ usage |
| PL Researchers Slack | Various | PL research community |
| SIGPLAN | https://www.sigplan.org/ | Programming languages |
| SIGACT | https://www.sigact.org/ | Theory of computing |

### Documentation and Tutorials

| Resource | URL | Relevance |
|----------|-----|-----------|
| CLRS Online | https://mitpress.mit.edu/9780262046305/ | Algorithm reference |
| Complexity Zoo | https://complexityzoo.net/ | Complexity classes |
| Arora-Barak Draft | https://theory.cs.princeton.edu/complexity/ | Complexity theory |
| TAPL Online | https://www.cis.upenn.edu/~bcpierce/tapl/ | Type theory |
| Software Foundations | https://softwarefoundations.cis.upenn.edu/ | Coq + PL |
| Logical Foundations | https://softwarefoundations.cis.upenn.edu/lf-current/ | Coq basics |
| Theorem Proving in Lean 4 | https://leanprover.github.io/theorem_proving_in_lean4/ | Lean tutorials |
| TLA+ Video Course | https://lamport.azurewebsites.net/video/videos.html | TLA+ learning |
| Learn TLA+ | https://learntla.com/ | TLA+ tutorials |

### Best Practices

| Resource | Description | Applicable Areas |
|----------|-------------|------------------|
| [Verified Software Toolchain](https://vst.cs.princeton.edu/) | Verification methodology | theorem-prover-interface |
| [Formal Methods Europe](https://www.fmeurope.org/) | FM community | Model checking, verification |
| [ACL2 Books](https://www.cs.utexas.edu/users/moore/acl2/current/doc/books-docs.html) | Verified reasoning | theorem-prover-interface |
| [CompCert Development Guide](https://compcert.org/doc/index.html) | Verified compiler dev | optimization-correctness-verifier |

---

## API Documentation

### Solver and Tool APIs

| API | Documentation URL | Purpose |
|-----|-------------------|---------|
| Z3 Python API | https://z3prover.github.io/api/html/namespacez3py.html | SMT solving |
| CVC5 Python | https://cvc5.github.io/docs/cvc5-1.0.0/api/python/pythonic/pythonic.html | SMT solving |
| Coq SerAPI | https://github.com/ejgallego/coq-serapi | Coq machine interface |
| Lean 4 Lake | https://github.com/leanprover/lake | Lean build system |
| SPIN API | https://spinroot.com/spin/Man/spin.html | Model checking |
| TLC Command Line | https://lamport.azurewebsites.net/tla/tlc-options.html | TLA+ checking |
| LLVM C++ API | https://llvm.org/doxygen/ | Compiler infrastructure |
| LLVM Python | https://pypi.org/project/llvmlite/ | LLVM bindings |

### Standard Formats

| Standard | Documentation | Tools |
|----------|--------------|-------|
| SMT-LIB 2 | https://smtlib.cs.uiowa.edu/papers/smt-lib-reference-v2.6-r2021-05-12.pdf | Z3, CVC5 |
| SyGuS | https://sygus.org/language/ | Synthesis solvers |
| DIMACS CNF | https://www.satcompetition.org/2009/format-benchmarks2009.html | SAT solvers |
| TLA+ Language | https://lamport.azurewebsites.net/tla/tla.html | TLA+ tools |
| Promela | https://spinroot.com/spin/Man/promela.html | SPIN |
| OpenQASM | https://openqasm.com/ | Quantum compilation |

---

## Applicable Skills from Other Specializations

### From Mathematics Specialization

| Skill | Application to Computer Science |
|-------|-------------------------------|
| **lean-proof-assistant** | Algorithm correctness proofs |
| **coq-proof-assistant** | Type soundness proofs |
| **sympy-computer-algebra** | Symbolic complexity analysis |
| **numerical-linear-algebra-toolkit** | Numerical algorithm analysis |
| **latex-math-formatter** | Paper preparation |
| **counterexample-generator** | Conjecture testing |

### From Quantum Computing Specialization

| Skill | Application to Computer Science |
|-------|-------------------------------|
| **circuit-optimizer** | Quantum algorithm complexity |
| **resource-estimator** | Quantum resource analysis |
| **statevector-simulator** | Quantum algorithm verification |

### From Physics Specialization

| Skill | Application to Computer Science |
|-------|-------------------------------|
| **scipy-optimization-toolkit** | Algorithm optimization |
| **tensorflow-physics-ml** | ML for algorithms |
| **monte-carlo-physics-simulator** | Randomized algorithm analysis |

### From Data Science Specialization

| Skill | Application to Computer Science |
|-------|-------------------------------|
| **data-preprocessing-pipeline** | Benchmark data preparation |
| **statistical-analysis-toolkit** | Algorithm performance statistics |
| **visualization-toolkit** | Algorithm visualization |

### From Scientific Discovery Specialization

| Skill | Application to Computer Science |
|-------|-------------------------------|
| **hypothesis-generator** | Research hypothesis formulation |
| **statistical-test-selector** | Experimental evaluation |
| **latex-document-compiler** | Paper writing |
| **reproducibility-guardian** | Reproducible experiments |

---

## Cross-Specialization Agent Collaboration

### Agents from Other Specializations Useful for Computer Science

| Agent | Source Specialization | CS Application |
|-------|----------------------|----------------|
| **theorem-prover-expert** | Mathematics | Algorithm correctness |
| **numerical-analyst** | Mathematics | Numerical algorithm analysis |
| **optimization-expert** | Mathematics | Algorithm optimization |
| **statistical-consultant** | Scientific Discovery | Experimental evaluation |
| **mathematics-writer** | Mathematics | Paper writing |
| **reproducibility-guardian** | Scientific Discovery | Experiment reproducibility |

### Computer Science Agents Useful for Other Specializations

| Agent | Target Specialization | Application |
|-------|----------------------|-------------|
| **algorithm-analyst** | Mathematics, Data Science | Algorithm design |
| **complexity-theorist** | Any computational field | Complexity analysis |
| **type-theorist** | Mathematics | Type-theoretic foundations |
| **compiler-architect** | Software Engineering | Compiler design |
| **distributed-systems-theorist** | Software Architecture | Distributed design |
| **model-checking-expert** | Software Architecture | System verification |

---

## Implementation Recommendations

### Tool Selection Priority

1. **Open Source Tools**: Prioritize Z3, Coq, Lean, SPIN over commercial alternatives
2. **Active Development**: Choose tools with active communities (Lean 4 over Lean 3)
3. **Language Bindings**: Ensure Python/API access for automation
4. **Interoperability**: Select tools with standard format support (SMT-LIB, etc.)

### Integration Patterns

1. **Solver Abstraction**: Create abstraction layer for SMT/SAT solvers
2. **Proof Script Generation**: Generate proof scripts in standard formats
3. **Verification Pipeline**: Chain tools (parse -> verify -> report)
4. **Result Caching**: Cache solver results for interactive use

### Testing Strategies

1. **Known Results**: Test against proven theorems/reductions
2. **Benchmark Suites**: Use standard benchmarks (DIMACS, SMT-COMP)
3. **Regression Testing**: Track performance across tool versions
4. **Property Testing**: Use QuickCheck-style testing for implementations

### Research Workflow Integration

| Phase | Tools | Skills |
|-------|-------|--------|
| Problem Formulation | Literature databases | related-work-analyzer |
| Theory Development | Proof assistants | theorem-prover-interface |
| Implementation | LLVM, DSL tools | dsl-compiler-generator |
| Evaluation | Benchmarks | benchmark-suite-manager |
| Writing | LaTeX | latex-proof-formatter |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-25 | Babysitter AI | Initial references document creation |
