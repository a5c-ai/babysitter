# Scientific Discovery and Problem Solving - Processes Backlog (Phase 2)

## Overview

This backlog contains key processes for the Scientific Discovery and Problem Solving specialization, organized by category. These processes cover the systematic approaches, thinking patterns, and methodologies used to investigate phenomena, solve complex problems, and generate new knowledge.

---
## 0. Modes of Reasoning and Thinking Patterns

*Extracted from [modes_of_reasoning.md](https://github.com/Dicklesworthstone/ntm/blob/main/modes_of_reasoning.md) and [scientific_thinking_patterns_catalog.md](./scientific_thinking_patterns_catalog.md)*

### 0.1 Formal and Mathematical Reasoning

- [ ] **Deductive Reasoning** - Truth-preserving inference where valid conclusions must follow from premises; outputs proofs and derivations.
- [ ] **Mathematical/Proof-Theoretic Reasoning** - Deduction emphasizing proof structure and derivability; outputs formal, often machine-checkable proofs.
- [ ] **Constructive (Intuitionistic) Reasoning** - Proofs must provide explicit witnesses or constructions; "proofs as programs" linking proof to computation.
- [ ] **Equational/Algebraic Reasoning** - Transform expressions using equalities and rewrite rules; useful for refactoring and optimization proofs.
- [ ] **Model-Theoretic/Semantic Reasoning** - Reason by constructing models satisfying theories; identifies consistency and generates counterexamples.
- [ ] **Constraint/Satisfiability Reasoning** - Encode requirements as constraints and solve for satisfying assignments (SAT/SMT/CSP).
- [ ] **Type-Theoretic Reasoning** - Use types including dependent types to enforce invariants; "propositions as types" for correctness-by-construction.
- [ ] **Counterexample-Guided Reasoning (CEGAR)** - Iterative loop of abstraction, checking, and refinement guided by counterexamples.

### 0.2 Ampliative Reasoning (Conclusions Beyond Premises)

- [ ] **Inductive Reasoning** - Infer general patterns from observations; not truth-preserving but essential for learning and law discovery.
- [ ] **Statistical Reasoning** - Population inference from samples using estimators, confidence intervals, and hypothesis tests with error rates.
- [ ] **Bayesian Probabilistic Reasoning** - Represent beliefs as probabilities and update them via Bayes' rule; manages coherent credence.
- [ ] **Likelihood-Based Reasoning** - Compare hypotheses by how well they predict data; separates data support from prior beliefs.
- [ ] **Abductive Reasoning / Inference to Best Explanation** - Infer hidden mechanisms/causes from observations; pick explanations that best explain data with minimal assumptions.
- [ ] **Analogical Reasoning** - Transfer relational structure from known domains to novel ones; seeds hypothesis generation.
- [ ] **Case-Based Reasoning** - Retrieve similar past cases and adapt solutions; emphasizes precedent and operational applicability.
- [ ] **Explanation-Based Learning** - Generalize reusable rules from expert solutions guided by deductive explanation.
- [ ] **Simplicity/Compression Reasoning (Occam's Razor)** - Prefer simpler hypotheses balancing fit against complexity (MDL principles).
- [ ] **Reference-Class/"Outside View" Reasoning** - Predict using base-rate distributions from similar past projects; counters planning fallacy.
- [ ] **Fermi/Order-of-Magnitude Reasoning** - Rough quantitative estimates via decomposition and bounding for feasibility and scale checks.

### 0.3 Reasoning Under Uncertainty and Incomplete Knowledge

- [ ] **Probabilistic Logic** - Blend logical structure with probabilistic uncertainty; relational prediction under uncertainty.
- [ ] **Imprecise Probability/Interval Probability** - Represent uncertainty with probability ranges when precision isn't justified.
- [ ] **Evidential Reasoning (Dempster-Shafer)** - Allocate mass to possibility sets; combine evidence into belief/plausibility intervals.
- [ ] **Maximum-Entropy/Information-Theoretic Reasoning** - Choose distributions satisfying known constraints while minimizing assumptions.
- [ ] **Qualitative Probability/Ranking-Function Reasoning** - Use ordinal disbelief ranks instead of numeric probabilities; tracks ordering only.

### 0.4 Reasoning Under Vagueness and Borderline Concepts

- [ ] **Fuzzy Reasoning/Fuzzy Logic** - Truth as degree (0-1) because predicates have blurred boundaries; distinct from probability.
- [ ] **Many-Valued and Partial Logics** - More than two truth values; explicitly represent "unknown" or "undefined."
- [ ] **Rough Set Reasoning** - Approximate concepts via lower/upper bounds given limited features; membership from observational granularity.
- [ ] **Prototype/Similarity-Based Category Reasoning** - Categorize by similarity to prototypes rather than necessary-sufficient definitions.
- [ ] **Qualitative Reasoning** - Reason with qualitative states like "increasing/decreasing" instead of exact numbers for robustness.

### 0.5 Reasoning With Inconsistency, Defaults, and Changing Information

- [ ] **Non-Monotonic Reasoning** - Adding information can retract previous conclusions; handles "normally" rules with exceptions.
- [ ] **Default/Typicality Reasoning** - Use "typically" rules overridden by more specific information; categorical rather than numeric.
- [ ] **Defeasible Reasoning** - Conclusions defeated by counterevidence or stronger rules; explicitly tracks priorities.
- [ ] **Belief Revision and Belief Update** - Revise accepted beliefs with inconsistent new information using minimal-change principles.
- [ ] **Paraconsistent Reasoning** - Tolerate contradictions without deriving everything; contains inconsistency instead of resolving it.
- [ ] **Argumentation Theory** - Evaluate competing arguments and counterarguments via attack/defense relations.
- [ ] **Assurance-Case/Safety-Case Reasoning** - Structured arguments for system safety/security supported by evidence and traceability.

### 0.6 Causal, Counterfactual, Explanatory, and Dynamic Reasoning

- [ ] **Causal Inference** - Identify causal relations and predict intervention effects; distinguishes observation from intervention.
- [ ] **Causal Discovery** - Infer causal graph structure from data plus assumptions; outputs candidate structures.
- [ ] **Counterfactual Reasoning** - Evaluate alternate histories given a causal model; supports postmortems and accountability.
- [ ] **Mechanistic Reasoning** - Explain by identifying internal parts and interactions; actionable intervention points.
- [ ] **Diagnostic Reasoning** - Infer hidden causes from symptoms using fault models and uncertainty; ranks probable causes.
- [ ] **Model-Based/Simulation Reasoning** - Run internal models to predict scenario consequences; generative prediction from specifications.
- [ ] **Systems Thinking** - Reason about feedback loops, delays, and emergence; multi-level dynamic analysis.

### 0.7 Practical Reasoning (Choosing Actions Under Constraints)

- [ ] **Means-End/Instrumental Reasoning** - Derive necessary or helpful actions/subgoals from goals; feeds planning.
- [ ] **Decision-Theoretic Reasoning** - Combine beliefs with utilities to choose actions (expected utility); explicit tradeoffs.
- [ ] **Multi-Criteria Decision Analysis (MCDA)/Pareto Reasoning** - Decide with multiple objectives using weights or Pareto frontiers.
- [ ] **Planning/Policy Reasoning** - Compute action sequences or policies achieving goals under constraints and dynamics.
- [ ] **Optimization Reasoning** - Choose best feasible solutions relative to objectives subject to constraints.
- [ ] **Robust/Worst-Case Reasoning** - Choose actions performing acceptably under worst plausible conditions (minimax, safety margins).
- [ ] **Minimax Regret Reasoning** - Minimize worst-case regret rather than utility; useful under deep uncertainty.
- [ ] **Satisficing** - Seek "good enough" solutions given resource limits rather than global optimality.
- [ ] **Value-of-Information Reasoning** - Prioritize which measurements/experiments reduce uncertainty most per cost to improve decisions.
- [ ] **Heuristic Reasoning** - Use simple rules that often work; fast but biased; requires pairing with checks.
- [ ] **Search-Based/Algorithmic Reasoning** - Systematically explore possibilities with heuristics and pruning (tree search, dynamic programming).

### 0.8 Strategic and Social Reasoning

- [ ] **Game-Theoretic/Strategic Reasoning** - Reason when outcomes depend on others' choices; incentive and equilibrium analysis.
- [ ] **Theory-of-Mind/Mental-State Reasoning** - Infer beliefs, intentions, knowledge states of others; nested belief reasoning.
- [ ] **Negotiation and Coalition Reasoning** - Reason about acceptable agreements and coalition formation under constraints.
- [ ] **Mechanism Design/Incentive Engineering** - Design rules so self-interested behavior achieves desired outcomes; align incentives.

### 0.9 Dialectical, Rhetorical, and Interpretive Reasoning

- [ ] **Dialectical Reasoning** - Advance understanding through structured opposition, refining concepts and integrating perspectives.
- [ ] **Rhetorical Reasoning** - Persuasion-oriented reasoning considering audience, framing, and ethos/pathos/logos for adoption.
- [ ] **Hermeneutic/Interpretive Reasoning** - Infer meaning and intent from language and artifacts using context and interpretive canons.
- [ ] **Narrative Reasoning/Causal Storytelling** - Build coherent time-ordered explanations connecting events and causes into supportive stories.
- [ ] **Sensemaking/Frame-Building Reasoning** - Decide "what kind of situation is this?"; build frames organizing signals and priorities.

### 0.10 Modal, Temporal, Spatial, and Normative Reasoning

- [ ] **Modal Reasoning** - Reason with necessity/possibility and epistemic/dynamic operators about possibility spaces.
- [ ] **Deontic Reasoning** - Reason about permission, obligation, and prohibition; handles norm conflicts and exceptions.
- [ ] **Temporal Reasoning** - Reason about ordering, duration, persistence, and change over time.
- [ ] **Spatial and Diagrammatic Reasoning** - Use geometry/topology and diagrams for containment, adjacency, and flow inferences.

### 0.11 Domain-Specific Reasoning Styles

- [ ] **Scientific Reasoning** - Integrated workflow: abduce hypotheses, deduce predictions, test statistically, revise beliefs.
- [ ] **Experimental Design Reasoning** - Choose interventions and measurements to identify effects reliably (randomization, controls).
- [ ] **Engineering Design Reasoning** - Iterate from requirements to architectures with tradeoffs, constraints, and failure analyses.
- [ ] **Legal Reasoning** - Apply rules to facts, interpret texts, reason from precedents using burdens/standards of proof.
- [ ] **Moral/Ethical Reasoning** - Reason about right/wrong and value tradeoffs (consequentialist, deontological, virtue, etc.).
- [ ] **Historical/Investigative Reasoning** - Reconstruct events from incomplete sources; triangulate evidence under uncertainty.
- [ ] **Clinical/Operational Troubleshooting** - Blend pattern recognition, mechanistic models, tests, and triage under time pressure.

### 0.12 Meta-Level and Reflective Modes

- [ ] **Meta-Reasoning** - Decide how to reason: which mode to use, effort allocation, and stopping rules.
- [ ] **Calibration and Epistemic Humility** - Track how reliable beliefs are; measure forecast accuracy and adjust confidence.
- [ ] **Reflective Equilibrium** - Iteratively adjust principles and case judgments until they cohere.
- [ ] **Transcendental Reasoning** - Infer necessary preconditions from accepted facts; reason from possibility to enabling conditions.
- [ ] **Adversarial/Red-Team Reasoning** - Assume attacker role to break arguments and identify failure modes.
- [ ] **Debiasing/Epistemic Hygiene** - Structured checks reducing predictable errors (base rates, disconfirmation, premortems).

### 0.13 Canonical Cross-Disciplinary Thinking Patterns

- [ ] **Hypothetico-Deductive Reasoning** - Propose hypothesis → deduce predictions → test against observations; design experiments, falsify models.
- [ ] **Reductionist & Compositional Thinking** - Break systems into parts, understand parts, recombine to explain whole.
- [ ] **Modeling, Idealization & Approximation** - Build simplified models capturing essential features, then refine as needed.
- [ ] **Dimensional Analysis & Scaling** - Use units and dimensionless combinations to constrain equations and detect nonsense.
- [ ] **Limiting-Case Reasoning** - Examine extreme parameter values (very large/small, zero/infinite) to stress-test models.
- [ ] **Thought Experiments** - Imagined experiments to explore consequences and contradictions of theories.
- [ ] **Multiple Working Hypotheses & Robustness Checks** - Develop several plausible hypotheses in parallel and test competitively.
- [ ] **Failure-Mode & Edge-Case Analysis** - Proactively ask "how can this break?" and analyze worst-case scenarios.

### 0.14 Field-Specific Thinking Patterns

- [ ] **Symmetry & Conservation Thinking (Physics)** - Use symmetries to infer conserved quantities; broken symmetries indicate new physics.
- [ ] **Frame-of-Reference Reasoning (Physics)** - Choose coordinates or frames that make equations or interpretation simpler.
- [ ] **Perturbation & Linearization (Physics/Eng)** - Treat system as small deviation from known solution; expand in small parameter.
- [ ] **Renormalization & Scale Separation (Physics)** - Separate behaviors at different scales; understand how parameters flow across scales.
- [ ] **Functional-Group Thinking (Chemistry)** - Reason in terms of reactive motifs rather than whole molecules.
- [ ] **Electron-Bookkeeping / Orbital Reasoning (Chemistry)** - Track electrons, charges, and orbitals to predict feasible reactions.
- [ ] **Reaction Mechanism Chains (Chemistry)** - Decompose reactions into elementary mechanistic steps.
- [ ] **Equilibrium & Le Châtelier Thinking (Chemistry)** - Systems at equilibrium shift to counteract disturbances.
- [ ] **Retrosynthesis (Chemistry)** - Work backwards from target molecule to simpler precursors.
- [ ] **Evolutionary Thinking (Biology)** - Explain features via historical selection pressures and fitness trade-offs.
- [ ] **Structure-Function Reasoning (Biology)** - Infer function from structure and vice versa.
- [ ] **Levels-of-Organization Thinking (Biology)** - Navigate hierarchies (genes → proteins → cells → tissues → organisms → populations → ecosystems).
- [ ] **Network/Pathway Reasoning (Biology/Ecology)** - Represent interactions as graphs and analyze topology.
- [ ] **Homeostasis & Feedback (Biology/Control)** - Understand stability and regulation via negative/positive feedback loops.
- [ ] **Uniformitarianism (Earth Sciences)** - Use present-day processes to interpret geological past.
- [ ] **Deep-Time Thinking (Earth Sciences)** - Reason over very long timescales; small rates integrated over millions of years.
- [ ] **Proxy Reasoning (Paleoclimate/Geology)** - Infer past conditions from indirect measurements (isotopes, ice cores, tree rings).
- [ ] **Inverse-Problem Reasoning (Physics/Geoscience)** - Given observed outputs, reconstruct inputs or governing processes.
- [ ] **Operationalization (Psych/Social)** - Turn abstract concepts (stress, intelligence) into measurable variables.
- [ ] **Latent-Variable Thinking (Psych/Stats)** - Treat observed measurements as manifestations of hidden constructs.
- [ ] **Within- vs Between-Subject Reasoning (Psych/Experiments)** - Differentiate effects within individuals vs differences across individuals.
- [ ] **Signal-Detection & Threshold Reasoning (Psych/Diagnostics)** - Model hits, misses, false alarms, and decision thresholds explicitly.
- [ ] **Abstraction-Layer Thinking (CS/Systems)** - Separate concerns across layers (hardware, OS, middleware, app, API).
- [ ] **Reduction to Known Problems (CS/Theory)** - Show new problem is equivalent to known one, inheriting difficulty/solutions.
- [ ] **Invariant-Based Reasoning (CS)** - Identify properties that must remain true at each step (loop invariants, safety conditions).
- [ ] **Complexity Analysis – Worst/Average/Amortized (CS)** - Evaluate performance under different notions of cost and typicality.
- [ ] **Model-vs-Reality Thinking (Statistics)** - Treat models as approximations; ask what data shows that model does not.
- [ ] **Bias-Variance Trade-off (Statistics/ML)** - Balance simplicity and flexibility to avoid underfitting and overfitting.
- [ ] **Residual & Diagnostic Thinking (Statistics)** - Study residuals and diagnostics to see where model fails.
- [ ] **Missing-Data & Measurement-Error Thinking (Statistics)** - Treat missingness and noise as structured parts of the problem.

### 0.15 Meta-Patterns of Scientific Practice

- [ ] **Exploratory Cycle** - Cycle: explore → model → predict → test → refine.
- [ ] **Triangulation** - Use multiple independent methods or data sources to converge on a result.
- [ ] **Representation Shifts** - Switch between equations, diagrams, simulations, and verbal narratives.
- [ ] **Scale-Zooming** - Move between micro and macro scales; local and global views.
- [ ] **Tool-as-Lens** - Treat each instrument or method as a lens that reveals and hides certain aspects.

### 0.16 Speculative / Emerging Thinking Patterns

- [ ] **Metaphoric World Simulation** - Build full "toy universe" from a metaphor (markets, ecosystems), simulate it, transfer structural insights back.
- [ ] **Constraint Sculpting** - Start from impossibly over-constrained ideal, gradually relax constraints; path reveals trade-offs and sweet spots.
- [ ] **Degenerate-Mechanism Mining** - Intentionally search for multiple distinct mechanisms producing same observable behavior.
- [ ] **Adversarial Co-Design of Explanations** - Pair "Builder" proposing models with "Breaker" generating adversarial cases and counterexamples.
- [ ] **Inverted-Goal Thinking** - Temporarily optimize for opposite of actual goal to map design space and understand constraints.
- [ ] **Role-Swap Reasoning** - Systematically swap roles of components (sender/receiver, controller/controlled) to discover plausible reassignments.
- [ ] **Execution-Order Scrambling** - Treat process steps as partially orderable; explore alternative valid orderings.
- [ ] **Latent-Space Transfer Thinking** - Map different domains into shared latent space, transfer operations there, not on raw surface details.
- [ ] **Counter-Signal Mining** - Treat outliers, failures, and "noise" as primary data to mine for hidden regimes or new variables.
- [ ] **Self-Describing Mechanism Design** - Design mechanisms encoding readable explanations of themselves in outputs or structure.
- [ ] **Iterative World-Shard Integration** - Keep separate partial models with own ontologies; design explicit interfaces rather than forcing unification.
- [ ] **Experiment-as-Compiler Thinking** - See experiments as compilers from "hypothesis language" to "data language"; maximize discrimination.
- [ ] **Symmetry-Breaking Search** - Start with maximal symmetry; introduce specific breaks to see which generate realistic structure/behavior.
- [ ] **"Foreign Policy" Pattern** - Treat interacting subsystems as countries with policies, treaties, alliances, sanctions.
- [ ] **Failure-Trace Harvesting** - Intentionally design processes to fail in informative ways leaving rich logs and artifacts.
- [ ] **Scale Invariance Reasoning** - Seek laws/patterns invariant under scale changes; treat deviations as signals of new regimes.
- [ ] **Domain Generic Logic** - Reason within domain-agnostic formal logic of structures, interpret concrete domains as instances.
- [ ] **Metaphor-Based Reasoning (Formalized)** - Explicitly map problems into metaphor domain with rich structure, perform reasoning there, map back.

### 0.17 Thinking Protocols (Chained Patterns)

- [ ] **Fast Theory Sketching Protocol** - Observe → Generate multiple hypotheses → Inject constraints → Adversarial stress-test → Design discriminating experiments → Iterate with Bayesian updating.
- [ ] **Mechanism Discovery Protocol (Complex Networks)** - Map local network → Metaphoric simulation → Degenerate-mechanism mining → Constraint sculpting → Counter-signal mining → Prioritize for testing.
- [ ] **Robust Multi-Agent System Design Protocol** - Abstract in domain generic logic → Constraint sculpting → Inverted-goal/failure-trace design → Adversarial co-design/role swap → Scale invariance check → Self-describing mechanism layer.
- [ ] **Cross-Domain Innovation Protocol (Latent-Space Transfer)** - Abstract both domains to shared latent space → Identify scale-invariant structures → Metaphor-based world simulation → Transfer operations not labels → Hypothesize, test, iterate.

---

## 1. Scientific Method and Research Design

- [ ] **Hypothesis Formulation and Testing** - Develop testable hypotheses from observations and design experiments to evaluate predictions systematically. [Reference](https://press.princeton.edu/books/paperback/9780691164076/how-to-solve-it)

- [ ] **Experimental Design and Controls** - Create rigorous experimental protocols with appropriate controls, randomization, and blinding to ensure valid results. [Reference](https://www.wiley.com/en-us/Design+and+Analysis+of+Experiments%2C+10th+Edition-p-9781119492443)

- [ ] **Literature Review and Synthesis** - Systematically search, evaluate, and synthesize existing research to identify gaps and build on prior knowledge. [Reference](https://press.uchicago.edu/ucp/books/book/chicago/C/bo23521678.html)

- [ ] **Pre-registration and Registered Reports** - Pre-register hypotheses and analysis plans before data collection to enhance transparency and reduce bias. [Reference](https://www.cos.io/initiatives/registered-reports)

---

## 2. Root Cause Analysis and Diagnostic Reasoning

- [ ] **Five Whys Analysis** - Apply iterative questioning technique to drill down from symptoms to fundamental root causes of problems. [Reference](https://asq.org/quality-resources)

- [ ] **Fishbone Diagram (Ishikawa) Analysis** - Categorize and visualize potential causes of problems using cause-and-effect diagrams for systematic diagnosis. [Reference](https://www.routledge.com/Root-Cause-Analysis-Handbook/ABS-Consulting/p/book/9781931332514)

- [ ] **Failure Mode and Effects Analysis (FMEA)** - Systematically identify potential failure modes, assess their severity and likelihood, and prioritize preventive actions. [Reference](https://www.routledge.com/The-Basics-of-FMEA/McDermott-Mikulak-Beauregard/p/book/9781563273773)

- [ ] **Fault Tree Analysis** - Construct logic trees to analyze combinations of events that lead to system failures or undesired outcomes. [Reference](https://www.routledge.com/Root-Cause-Analysis-Handbook/ABS-Consulting/p/book/9781931332514)

---

## 3. Creative Problem Solving and Innovation

- [ ] **TRIZ Contradiction Resolution** - Apply TRIZ inventive principles and contradiction matrix to resolve technical and physical contradictions systematically. [Reference](https://www.amazon.com/Suddenly-Inventor-Appeared-Inventive-Problem/dp/0964074028)

- [ ] **Design Thinking Sprint** - Facilitate rapid innovation cycles through empathize, define, ideate, prototype, and test phases to solve user-centered problems. [Reference](https://dschool.stanford.edu/resources)

- [ ] **Lateral Thinking and Idea Generation** - Apply divergent thinking techniques to generate novel solutions by challenging assumptions and exploring unconventional approaches. [Reference](https://www.penguinrandomhouse.com/books/297665/lateral-thinking-by-edward-de-bono/)

- [ ] **Analogical Reasoning and Cross-Domain Transfer** - Identify and apply solutions from analogous problems in other domains to generate breakthrough innovations. [Reference](https://www.harpercollins.com/products/creativity-mihaly-csikszentmihalyi)

---

## 4. Systems Thinking and Modeling

- [ ] **Causal Loop Diagram Development** - Map feedback loops and circular causality in complex systems to understand system behavior and leverage points. [Reference](https://www.chelseagreen.com/product/thinking-in-systems/)

- [ ] **System Dynamics Modeling** - Build stock-and-flow models to simulate system behavior over time and test intervention strategies. [Reference](https://www.mhprofessional.com/9780072389159-usa-business-dynamics-systems-thinking-and-modeling-for-a-complex-world-group)

- [ ] **System Archetype Analysis** - Identify common system patterns (shifting the burden, limits to growth, etc.) to diagnose systemic issues and design effective interventions. [Reference](https://www.penguinrandomhouse.com/books/163984/the-fifth-discipline-by-peter-m-senge/)

---

## 5. Structured Analytic Techniques

- [ ] **Analysis of Competing Hypotheses (ACH)** - Systematically evaluate multiple hypotheses against evidence to reduce cognitive biases and improve analytical rigor. [Reference](https://www.cia.gov/static/9a5f1162fd0932c29bfed1c030edf4ae/Pyschology-of-Intelligence-Analysis.pdf)

- [ ] **Premortem and Red Team Analysis** - Anticipate failure modes by imagining project failure and challenging assumptions through adversarial thinking. [Reference](https://www.cqpress.com/product/Structured-Analytic-Techniques-for-Intelligence/157)

- [ ] **Key Assumptions Check** - Explicitly identify, document, and challenge underlying assumptions to improve decision quality and reduce blind spots. [Reference](https://www.cqpress.com/product/Critical-Thinking-for-Strategic-Intelligence/177)

---

## 6. Data-Driven Discovery

- [ ] **Exploratory Data Analysis and Pattern Discovery** - Apply statistical and visualization techniques to discover unexpected patterns, anomalies, and relationships in data. [Reference](https://wesmckinney.com/book/)

- [ ] **Causal Inference from Observational Data** - Apply quasi-experimental methods and causal graphs to establish causal relationships from non-experimental data. [Reference](https://www.cambridge.org/core/books/causality/B0046844FAE10CBF274D4ACBDAEB5F5B)

- [ ] **Reproducible Research Pipeline** - Establish version-controlled, documented workflows that enable independent verification and replication of research findings. [Reference](https://www.practicereproducibleresearch.org/)

---

## 7. Decision Analysis and Forecasting

- [ ] **Multi-Criteria Decision Analysis** - Structure complex decisions with multiple objectives and stakeholders using systematic evaluation frameworks. [Reference](https://www.hbs.edu/faculty/Pages/item.aspx?num=10588)

- [ ] **Probabilistic Forecasting and Calibration** - Generate well-calibrated probability estimates for uncertain outcomes and track forecasting accuracy over time. [Reference](https://www.penguinrandomhouse.com/books/227815/superforecasting-by-philip-e-tetlock-and-dan-gardner/)

- [ ] **Cognitive Bias Mitigation** - Apply structured techniques to identify and counteract cognitive biases that distort judgment and analysis. [Reference](https://us.macmillan.com/books/9780374533557/thinkingfastandslow)

---

## Summary Statistics

**Total Processes**: 145

**By Category**:
- **0. Modes of Reasoning and Thinking Patterns**: 120
  - 0.1 Formal and Mathematical Reasoning: 8
  - 0.2 Ampliative Reasoning: 11
  - 0.3 Reasoning Under Uncertainty: 5
  - 0.4 Reasoning Under Vagueness: 5
  - 0.5 Reasoning With Inconsistency/Defaults: 7
  - 0.6 Causal and Dynamic Reasoning: 7
  - 0.7 Practical Reasoning: 11
  - 0.8 Strategic and Social Reasoning: 4
  - 0.9 Dialectical and Interpretive Reasoning: 5
  - 0.10 Modal, Temporal, Spatial Reasoning: 4
  - 0.11 Domain-Specific Reasoning Styles: 7
  - 0.12 Meta-Level and Reflective Modes: 6
  - 0.13 Canonical Cross-Disciplinary Patterns: 8
  - 0.14 Field-Specific Thinking Patterns: 30
  - 0.15 Meta-Patterns of Scientific Practice: 5
  - 0.16 Speculative/Emerging Patterns: 18
  - 0.17 Thinking Protocols: 4
- **1. Scientific Method and Research Design**: 4
- **2. Root Cause Analysis and Diagnostic Reasoning**: 4
- **3. Creative Problem Solving and Innovation**: 4
- **4. Systems Thinking and Modeling**: 3
- **5. Structured Analytic Techniques**: 3
- **6. Data-Driven Discovery**: 3
- **7. Decision Analysis and Forecasting**: 4

**Key Focus Areas**:
- Comprehensive modes of reasoning (80+ from formal to meta-cognitive)
- Scientific thinking patterns (canonical, field-specific, speculative)
- Rigorous scientific methodology and experimental design
- Systematic root cause analysis and diagnostic reasoning
- Creative problem-solving frameworks (TRIZ, Design Thinking)
- Systems thinking and dynamic modeling
- Evidence-based analysis and cognitive bias mitigation
- Reproducible research and data-driven discovery
- Chained thinking protocols for complex discovery workflows
