# Scientific Discovery and Problem Solving - Skills and Agents Backlog (Phase 4)

## Overview

This backlog identifies specialized skills and agents that could enhance the Scientific Discovery and Problem Solving processes beyond general-purpose capabilities. Each skill or agent is designed to provide domain-specific tooling, validation, or automation for scientific research workflows, reasoning processes, and discovery pipelines.

## Summary Statistics

- **Total Skills Identified**: 32
- **Total Agents Identified**: 24
- **Shared Candidates (Cross-Specialization)**: 12
- **Categories**: 8 (Literature & Knowledge, Hypothesis & Reasoning, Experimental Design, Statistical Analysis, Data Visualization, Reproducibility & Documentation, Scientific Writing, Peer Review & Validation)

---

## Skills

### Literature & Knowledge Management Skills

#### 1. semantic-scholar-search
**Description**: Academic literature search skill using Semantic Scholar API for citation-aware paper discovery, author analysis, and research trend identification.

**Capabilities**:
- Keyword and semantic search across papers
- Citation network analysis
- Author influence scoring
- Research trend identification
- Paper recommendation based on reading history
- TLDR summary extraction

**Used By Processes**:
- Literature Review and Synthesis
- Hypothesis Formulation and Testing
- Triangulation (meta-pattern)

**Tools/Libraries**: Semantic Scholar API, NetworkX, sentence-transformers

---

#### 2. pubmed-literature-miner
**Description**: Biomedical literature mining skill using PubMed/MEDLINE for systematic review support, MeSH term extraction, and PICO framework analysis.

**Capabilities**:
- MeSH term-based search
- PICO element extraction
- Abstract screening automation
- Citation deduplication
- PRISMA flow diagram data generation
- Full-text retrieval coordination

**Used By Processes**:
- Literature Review and Synthesis
- Hypothesis Formulation and Testing
- Evidence Triangulation

**Tools/Libraries**: Biopython, PyMed, NCBI E-utilities

---

#### 3. connected-papers-mapper
**Description**: Citation graph exploration skill for discovering related work through visual graph traversal and temporal evolution analysis.

**Capabilities**:
- Citation graph generation
- Seminal paper identification
- Research front detection
- Temporal citation analysis
- Field bridge identification
- Export to reference managers

**Used By Processes**:
- Literature Review and Synthesis
- Exploratory Cycle (meta-pattern)
- Gap Identification

**Tools/Libraries**: Connected Papers API, NetworkX, pyvis

---

#### 4. elicit-research-assistant
**Description**: AI-assisted literature review skill for question-answering over papers, claim extraction, and evidence synthesis.

**Capabilities**:
- Question-answering over research papers
- Claim extraction and verification
- Evidence strength assessment
- Methodology comparison
- Finding synthesis across papers
- Research gap identification

**Used By Processes**:
- Literature Review and Synthesis
- Analysis of Competing Hypotheses (ACH)
- Multiple Working Hypotheses

**Tools/Libraries**: Elicit API, LangChain, vector databases

---

#### 5. zotero-reference-manager
**Description**: Reference management skill for bibliography organization, annotation sync, and citation formatting.

**Capabilities**:
- Reference import from multiple sources
- Annotation and note management
- Citation style formatting (CSL)
- Group library collaboration
- PDF attachment management
- BibTeX/RIS export

**Used By Processes**:
- Literature Review and Synthesis
- Pre-registration and Registered Reports
- Scientific Writing

**Tools/Libraries**: Pyzotero, Zotero API

---

### Hypothesis & Reasoning Skills

#### 6. hypothesis-generator
**Description**: Automated hypothesis generation skill using abductive reasoning, analogy detection, and knowledge graph traversal.

**Capabilities**:
- Pattern-based hypothesis generation
- Cross-domain analogy detection
- Contradiction identification
- Hypothesis ranking by novelty/parsimony
- Null hypothesis formulation
- Falsifiability assessment

**Used By Processes**:
- Hypothesis Formulation and Testing
- Abductive Reasoning / Inference to Best Explanation
- Multiple Working Hypotheses

**Tools/Libraries**: Knowledge graphs, LLM chains, symbolic reasoners

---

#### 7. causal-inference-engine
**Description**: Causal reasoning skill implementing DAG construction, do-calculus, and intervention effect estimation.

**Capabilities**:
- Causal DAG construction and validation
- Backdoor/frontdoor criterion checking
- Average treatment effect estimation
- Instrumental variable analysis
- Mediation analysis
- Sensitivity analysis for unmeasured confounding

**Used By Processes**:
- Causal Inference
- Causal Discovery
- Counterfactual Reasoning
- Causal Inference from Observational Data

**Tools/Libraries**: DoWhy, CausalNex, pgmpy, EconML

---

#### 8. bayesian-inference-engine
**Description**: Bayesian probabilistic reasoning skill for prior specification, posterior computation, and belief updating.

**Capabilities**:
- Prior elicitation support
- MCMC sampling (NUTS, HMC)
- Variational inference
- Model comparison (Bayes factors, LOO-CV)
- Posterior predictive checking
- Sequential belief updating

**Used By Processes**:
- Bayesian Probabilistic Reasoning
- Likelihood-Based Reasoning
- Probabilistic Forecasting and Calibration

**Tools/Libraries**: PyMC, Stan (PyStan), ArviZ, NumPyro

---

#### 9. formal-logic-reasoner
**Description**: Formal deductive reasoning skill for propositional and first-order logic, proof verification, and consistency checking.

**Capabilities**:
- Propositional logic satisfiability
- First-order theorem proving
- Proof step verification
- Consistency checking
- Counterexample generation
- Natural language to logic translation

**Used By Processes**:
- Deductive Reasoning
- Mathematical/Proof-Theoretic Reasoning
- Constraint/Satisfiability Reasoning
- Type-Theoretic Reasoning

**Tools/Libraries**: Z3, Prover9, Lean, Coq bindings

---

#### 10. analogy-mapper
**Description**: Analogical reasoning skill for structure mapping between domains, analogy quality assessment, and transfer suggestions.

**Capabilities**:
- Structure mapping theory implementation
- Analogy quality scoring
- Source-target alignment
- Candidate inference generation
- Cross-domain transfer recommendations
- Analogy explanation generation

**Used By Processes**:
- Analogical Reasoning
- Case-Based Reasoning
- Latent-Space Transfer Thinking
- Cross-Domain Innovation

**Tools/Libraries**: SME (Structure Mapping Engine), custom NLP pipelines

---

#### 11. triz-contradiction-solver
**Description**: TRIZ inventive problem solving skill for contradiction identification, inventive principle application, and solution pattern matching.

**Capabilities**:
- Technical contradiction identification
- Physical contradiction resolution
- 40 inventive principles application
- Contradiction matrix lookup
- Ideal final result formulation
- Resource analysis (substance-field)

**Used By Processes**:
- TRIZ Contradiction Resolution
- Constraint Sculpting
- Inverted-Goal Thinking

**Tools/Libraries**: Custom TRIZ knowledge base, pattern matching

---

#### 12. systems-dynamics-modeler
**Description**: Systems thinking skill for causal loop diagram creation, stock-flow modeling, and system archetype identification.

**Capabilities**:
- Causal loop diagram generation
- Stock and flow model construction
- System archetype detection
- Feedback loop analysis
- Leverage point identification
- Scenario simulation

**Used By Processes**:
- Systems Thinking
- Causal Loop Diagram Development
- System Dynamics Modeling
- Homeostasis & Feedback Thinking

**Tools/Libraries**: PySD, BPTK-Py, NetworkX

---

### Experimental Design Skills

#### 13. power-analysis-calculator
**Description**: Statistical power analysis skill for sample size determination, effect size estimation, and sensitivity analysis.

**Capabilities**:
- A priori power analysis
- Post-hoc power calculation
- Sensitivity analysis (effect size)
- Multiple comparison adjustment
- Complex design power (factorial, repeated measures)
- Power curve visualization

**Used By Processes**:
- Experimental Design and Controls
- Hypothesis Formulation and Testing
- A/B Testing Framework

**Tools/Libraries**: statsmodels, pingouin, GPower (via API)

---

#### 14. randomization-generator
**Description**: Randomization protocol skill for allocation sequence generation, stratified randomization, and block randomization.

**Capabilities**:
- Simple randomization
- Block randomization (fixed/permuted)
- Stratified randomization
- Minimization/adaptive randomization
- Allocation concealment verification
- Randomization audit trail

**Used By Processes**:
- Experimental Design and Controls
- Pre-registration and Registered Reports

**Tools/Libraries**: scipy, random, custom protocols

---

#### 15. protocol-builder
**Description**: Research protocol construction skill for SPIRIT-compliant protocol generation and ethics submission preparation.

**Capabilities**:
- SPIRIT checklist compliance
- Protocol section generation
- Consent form templating
- Ethics submission formatting
- Protocol amendment tracking
- Registration preparation (ClinicalTrials.gov, OSF)

**Used By Processes**:
- Pre-registration and Registered Reports
- Experimental Design and Controls
- Hypothesis Formulation and Testing

**Tools/Libraries**: Document templates, regulatory databases

---

#### 16. doe-optimizer
**Description**: Design of Experiments optimization skill for factorial design, response surface methodology, and optimal design selection.

**Capabilities**:
- Full/fractional factorial design
- Response surface methodology (RSM)
- D-optimal/I-optimal design generation
- Taguchi orthogonal arrays
- Design evaluation metrics
- Confounding structure analysis

**Used By Processes**:
- Experimental Design and Controls
- Fermi/Order-of-Magnitude Reasoning
- Limiting-Case Reasoning

**Tools/Libraries**: pyDOE2, statsmodels, scipy.optimize

---

### Statistical Analysis Skills

#### 17. statistical-test-selector
**Description**: Automated statistical test selection skill based on data characteristics, research question, and assumption checking.

**Capabilities**:
- Data distribution assessment
- Assumption testing (normality, homoscedasticity)
- Test recommendation based on design
- Non-parametric alternative suggestions
- Multiple comparison correction guidance
- Effect size calculator integration

**Used By Processes**:
- Statistical Reasoning
- Hypothesis Formulation and Testing
- Model Evaluation and Validation

**Tools/Libraries**: scipy.stats, pingouin, statsmodels

---

#### 18. meta-analysis-engine
**Description**: Meta-analysis skill for effect size pooling, heterogeneity assessment, and publication bias detection.

**Capabilities**:
- Fixed/random effects meta-analysis
- Heterogeneity metrics (I-squared, tau-squared)
- Funnel plot generation
- Trim-and-fill analysis
- Subgroup analysis
- Meta-regression

**Used By Processes**:
- Literature Review and Synthesis
- Triangulation
- Evidence Synthesis

**Tools/Libraries**: metafor (R via rpy2), PythonMeta, forestplot

---

#### 19. regression-analyzer
**Description**: Comprehensive regression analysis skill for model fitting, diagnostics, and interpretation support.

**Capabilities**:
- Linear/logistic/Poisson regression
- Mixed effects models
- Assumption diagnostics
- Multicollinearity detection (VIF)
- Residual analysis
- Coefficient interpretation support

**Used By Processes**:
- Statistical Reasoning
- Causal Inference from Observational Data
- Bias-Variance Trade-off

**Tools/Libraries**: statsmodels, scikit-learn, linearmodels

---

#### 20. time-series-analyzer
**Description**: Time series analysis skill for trend detection, seasonality decomposition, and forecasting.

**Capabilities**:
- Stationarity testing (ADF, KPSS)
- Decomposition (STL, seasonal)
- ARIMA/SARIMA modeling
- Prophet/exponential smoothing
- Change point detection
- Forecast uncertainty quantification

**Used By Processes**:
- Statistical Reasoning
- Deep-Time Thinking
- Proxy Reasoning

**Tools/Libraries**: statsmodels, Prophet, pmdarima

---

### Data Visualization Skills

#### 21. scientific-figure-generator
**Description**: Publication-quality figure generation skill with journal style compliance and accessibility considerations.

**Capabilities**:
- Journal style template application
- Multi-panel figure composition
- Statistical annotation (significance stars)
- Color-blind friendly palettes
- Vector format export (SVG, PDF)
- Figure legend generation

**Used By Processes**:
- Exploratory Data Analysis and Pattern Discovery
- Literature Review and Synthesis (PRISMA diagrams)
- Representation Shifts (meta-pattern)

**Tools/Libraries**: matplotlib, seaborn, plotly, altair

---

#### 22. network-visualizer
**Description**: Network and graph visualization skill for citation networks, causal diagrams, and system maps.

**Capabilities**:
- Force-directed layouts
- Hierarchical layouts
- Community detection visualization
- Interactive exploration
- Edge bundling for large networks
- Temporal network animation

**Used By Processes**:
- Network/Pathway Reasoning
- Systems Thinking
- Literature Review (citation networks)

**Tools/Libraries**: NetworkX, pyvis, Gephi (via API), D3.js

---

#### 23. interactive-dashboard-builder
**Description**: Research dashboard construction skill for data exploration, hypothesis testing, and result communication.

**Capabilities**:
- Widget-based filtering
- Linked brushing across plots
- Parameter sensitivity exploration
- Real-time data updates
- Sharing and embedding
- Export to static reports

**Used By Processes**:
- Exploratory Data Analysis and Pattern Discovery
- Scale-Zooming (meta-pattern)
- Tool-as-Lens (meta-pattern)

**Tools/Libraries**: Streamlit, Panel, Dash, Voila

---

### Reproducibility & Documentation Skills

#### 24. jupyter-reproducibility-checker
**Description**: Notebook reproducibility validation skill for dependency tracking, execution order verification, and environment capture.

**Capabilities**:
- Cell execution order validation
- Hidden state detection
- Dependency extraction (pipreqs)
- Environment capture (pip freeze, conda)
- Notebook linting
- Reproducibility scoring

**Used By Processes**:
- Reproducible Research Pipeline
- Exploratory Data Analysis

**Tools/Libraries**: nbQA, papermill, pipreqs, nbstripout

---

#### 25. data-versioning-manager
**Description**: Research data versioning skill for dataset tracking, provenance documentation, and sharing preparation.

**Capabilities**:
- Dataset version control
- Data provenance tracking
- Metadata schema enforcement
- Data citation generation
- Repository preparation (Zenodo, Figshare)
- FAIR compliance checking

**Used By Processes**:
- Reproducible Research Pipeline
- Pre-registration and Registered Reports

**Tools/Libraries**: DVC, Git LFS, datacite

---

#### 26. osf-workflow-integrator
**Description**: Open Science Framework integration skill for pre-registration, data/code sharing, and project management.

**Capabilities**:
- Pre-registration submission
- Project structure creation
- File synchronization
- DOI generation
- Access control management
- Collaboration coordination

**Used By Processes**:
- Pre-registration and Registered Reports
- Reproducible Research Pipeline
- Literature Review and Synthesis

**Tools/Libraries**: osf-client, OSF API

---

### Scientific Writing Skills

#### 27. academic-writing-assistant
**Description**: Scientific writing support skill for structure guidance, clarity improvement, and discipline-specific conventions.

**Capabilities**:
- IMRaD structure enforcement
- Hedging language suggestions
- Discipline-specific terminology
- Passive/active voice balance
- Transition phrase suggestions
- Abstract optimization

**Used By Processes**:
- Literature Review and Synthesis (PRISMA reporting)
- Hypothesis Formulation and Testing (documentation)
- Narrative Reasoning/Causal Storytelling

**Tools/Libraries**: LanguageTool, custom NLP models, style guides

---

#### 28. latex-document-compiler
**Description**: LaTeX document preparation skill for manuscript formatting, bibliography management, and journal submission.

**Capabilities**:
- Journal template application
- BibTeX/BibLaTeX integration
- Figure/table formatting
- Cross-reference management
- PDF compilation
- Submission package preparation

**Used By Processes**:
- Literature Review and Synthesis
- Pre-registration documentation
- All scientific writing outputs

**Tools/Libraries**: latexmk, biber, pandoc

---

#### 29. statistical-reporting-formatter
**Description**: APA/AMA-compliant statistical result formatting skill for tables, figures, and in-text reporting.

**Capabilities**:
- APA 7th edition formatting
- Statistical table generation
- Effect size reporting
- Confidence interval formatting
- p-value formatting conventions
- Automated result text generation

**Used By Processes**:
- Statistical Reasoning
- Hypothesis Formulation and Testing
- Model Evaluation and Validation

**Tools/Libraries**: pandas, statsmodels, custom formatters

---

### Peer Review & Validation Skills

#### 30. checklist-validator
**Description**: Reporting guideline compliance skill for CONSORT, PRISMA, STROBE, and other checklist validation.

**Capabilities**:
- CONSORT checklist validation
- PRISMA compliance checking
- STROBE item verification
- ARRIVE guidelines (animal research)
- Checklist item location tracking
- Compliance gap reporting

**Used By Processes**:
- Literature Review and Synthesis
- Experimental Design and Controls
- Rigor Assessment

**Tools/Libraries**: Custom rule engines, NLP extractors

---

#### 31. peer-review-simulator
**Description**: Pre-submission review simulation skill for methodology critique, statistical review, and clarity assessment.

**Capabilities**:
- Methodology critique generation
- Statistical analysis review
- Clarity and readability assessment
- Common reviewer concern identification
- Strength/limitation analysis
- Revision suggestion generation

**Used By Processes**:
- Adversarial Co-Design of Explanations
- Premortem and Red Team Analysis
- Key Assumptions Check

**Tools/Libraries**: LLM chains, custom rubrics

---

#### 32. replication-feasibility-assessor
**Description**: Replication study feasibility skill for protocol completeness, resource estimation, and deviation impact analysis.

**Capabilities**:
- Protocol completeness scoring
- Resource requirement estimation
- Critical detail identification
- Deviation impact analysis
- Replication difficulty rating
- Missing information flagging

**Used By Processes**:
- Reproducible Research Pipeline
- Literature Review quality assessment
- Rigor Assessment

**Tools/Libraries**: Custom assessment frameworks, NLP extractors

---

## Agents

### Research Planning Agents

#### 1. research-question-formulator
**Description**: Agent specialized in transforming broad research interests into specific, answerable research questions using PICO/FINER frameworks.

**Responsibilities**:
- Broad interest refinement
- PICO element identification
- FINER criteria validation
- Scope calibration
- Literature gap alignment
- Question prioritization

**Used By Processes**:
- Literature Review and Synthesis
- Hypothesis Formulation and Testing
- Exploratory Cycle (meta-pattern)

**Required Skills**: semantic-scholar-search, elicit-research-assistant

---

#### 2. hypothesis-architect
**Description**: Agent specialized in hypothesis formulation, falsifiability assessment, and prediction derivation.

**Responsibilities**:
- Hypothesis statement crafting
- Falsifiability criterion checking
- Prediction derivation
- Alternative hypothesis generation
- Null hypothesis specification
- Assumption documentation

**Used By Processes**:
- Hypothesis Formulation and Testing
- Multiple Working Hypotheses
- Hypothetico-Deductive Reasoning

**Required Skills**: hypothesis-generator, formal-logic-reasoner, causal-inference-engine

---

#### 3. systematic-review-coordinator
**Description**: Agent specialized in systematic review workflow orchestration, from protocol to synthesis.

**Responsibilities**:
- Protocol development guidance
- Search strategy optimization
- Screening workflow management
- Quality assessment coordination
- Data extraction oversight
- Synthesis method selection

**Used By Processes**:
- Literature Review and Synthesis
- Triangulation
- Evidence synthesis

**Required Skills**: semantic-scholar-search, pubmed-literature-miner, meta-analysis-engine, checklist-validator

---

#### 4. experiment-designer
**Description**: Agent specialized in experimental design optimization, control structure, and validity threat mitigation.

**Responsibilities**:
- Design type selection
- Control group specification
- Randomization planning
- Blinding protocol design
- Power analysis coordination
- Validity threat assessment

**Used By Processes**:
- Experimental Design and Controls
- Pre-registration and Registered Reports
- Experiment-as-Compiler Thinking

**Required Skills**: power-analysis-calculator, randomization-generator, protocol-builder, doe-optimizer

---

#### 5. preregistration-specialist
**Description**: Agent specialized in pre-registration preparation, including analysis plan specification and contingency planning.

**Responsibilities**:
- Pre-registration template selection
- Hypothesis specification verification
- Analysis plan completeness checking
- Contingency plan development
- Registration submission coordination
- Amendment documentation

**Used By Processes**:
- Pre-registration and Registered Reports
- Hypothesis Formulation and Testing

**Required Skills**: osf-workflow-integrator, protocol-builder, statistical-test-selector

---

### Reasoning & Analysis Agents

#### 6. causal-reasoning-analyst
**Description**: Agent specialized in causal inference, counterfactual analysis, and mechanism identification.

**Responsibilities**:
- Causal model construction
- Confounder identification
- Effect estimation strategy
- Sensitivity analysis coordination
- Counterfactual question answering
- Mechanism pathway analysis

**Used By Processes**:
- Causal Inference
- Causal Discovery
- Counterfactual Reasoning
- Mechanistic Reasoning

**Required Skills**: causal-inference-engine, bayesian-inference-engine, systems-dynamics-modeler

---

#### 7. bayesian-analyst
**Description**: Agent specialized in Bayesian analysis workflow, from prior elicitation to posterior interpretation.

**Responsibilities**:
- Prior elicitation facilitation
- Model specification guidance
- Convergence diagnosis
- Model comparison coordination
- Result interpretation support
- Sensitivity analysis

**Used By Processes**:
- Bayesian Probabilistic Reasoning
- Likelihood-Based Reasoning
- Maximum-Entropy Reasoning

**Required Skills**: bayesian-inference-engine, statistical-test-selector, scientific-figure-generator

---

#### 8. statistical-consultant
**Description**: Agent specialized in statistical method selection, assumption checking, and result interpretation guidance.

**Responsibilities**:
- Analysis method recommendation
- Assumption verification
- Power analysis guidance
- Multiple testing correction
- Effect size interpretation
- Limitation acknowledgment

**Used By Processes**:
- Statistical Reasoning
- Hypothesis Formulation and Testing
- Model Evaluation and Validation

**Required Skills**: statistical-test-selector, regression-analyzer, meta-analysis-engine, statistical-reporting-formatter

---

#### 9. systems-thinker
**Description**: Agent specialized in systems analysis, feedback loop identification, and leverage point discovery.

**Responsibilities**:
- System boundary definition
- Feedback loop mapping
- Archetype pattern matching
- Leverage point identification
- Intervention strategy analysis
- Unintended consequence anticipation

**Used By Processes**:
- Systems Thinking
- Causal Loop Diagram Development
- System Dynamics Modeling
- Homeostasis & Feedback Thinking

**Required Skills**: systems-dynamics-modeler, network-visualizer, causal-inference-engine

---

#### 10. analogical-reasoner
**Description**: Agent specialized in cross-domain analogy identification, structure mapping, and knowledge transfer.

**Responsibilities**:
- Source domain identification
- Structure mapping analysis
- Analogy quality assessment
- Transfer candidate generation
- Limitation identification
- Novel connection discovery

**Used By Processes**:
- Analogical Reasoning
- Case-Based Reasoning
- Latent-Space Transfer Thinking
- Metaphor-Based Reasoning

**Required Skills**: analogy-mapper, semantic-scholar-search, hypothesis-generator

---

#### 11. root-cause-analyst
**Description**: Agent specialized in diagnostic reasoning, failure analysis, and causal chain identification.

**Responsibilities**:
- Symptom categorization
- Five Whys facilitation
- Fishbone diagram construction
- Fault tree analysis
- Root cause prioritization
- Corrective action recommendation

**Used By Processes**:
- Five Whys Analysis
- Fishbone Diagram (Ishikawa) Analysis
- Failure Mode and Effects Analysis (FMEA)
- Fault Tree Analysis
- Diagnostic Reasoning

**Required Skills**: causal-inference-engine, systems-dynamics-modeler, triz-contradiction-solver

---

#### 12. innovation-facilitator
**Description**: Agent specialized in creative problem solving, TRIZ application, and design thinking orchestration.

**Responsibilities**:
- Problem reframing
- Contradiction identification
- Inventive principle application
- Design sprint facilitation
- Ideation method selection
- Solution evaluation

**Used By Processes**:
- TRIZ Contradiction Resolution
- Design Thinking Sprint
- Lateral Thinking and Idea Generation
- Constraint Sculpting

**Required Skills**: triz-contradiction-solver, analogy-mapper, hypothesis-generator

---

### Data & Computation Agents

#### 13. eda-investigator
**Description**: Agent specialized in exploratory data analysis, pattern discovery, and anomaly identification.

**Responsibilities**:
- Data profiling execution
- Distribution characterization
- Correlation discovery
- Outlier investigation
- Missing data analysis
- Feature relationship exploration

**Used By Processes**:
- Exploratory Data Analysis and Pattern Discovery
- Counter-Signal Mining
- Residual & Diagnostic Thinking

**Required Skills**: scientific-figure-generator, interactive-dashboard-builder, statistical-test-selector

---

#### 14. reproducibility-guardian
**Description**: Agent specialized in ensuring research reproducibility through workflow validation and environment management.

**Responsibilities**:
- Notebook execution validation
- Environment specification
- Dependency tracking
- Data versioning verification
- Analysis pipeline documentation
- Reproducibility report generation

**Used By Processes**:
- Reproducible Research Pipeline
- Pre-registration execution

**Required Skills**: jupyter-reproducibility-checker, data-versioning-manager, osf-workflow-integrator

---

#### 15. meta-analyst
**Description**: Agent specialized in systematic review data synthesis, heterogeneity analysis, and publication bias assessment.

**Responsibilities**:
- Effect size extraction
- Heterogeneity assessment
- Publication bias testing
- Subgroup analysis planning
- Sensitivity analysis execution
- Forest plot generation

**Used By Processes**:
- Literature Review and Synthesis
- Triangulation
- Evidence aggregation

**Required Skills**: meta-analysis-engine, scientific-figure-generator, statistical-reporting-formatter

---

### Documentation & Communication Agents

#### 16. scientific-writer
**Description**: Agent specialized in scientific manuscript drafting, revision, and journal submission preparation.

**Responsibilities**:
- IMRaD structure guidance
- Section drafting support
- Revision tracking
- Journal formatting
- Response to reviewers
- Submission coordination

**Used By Processes**:
- Literature Review and Synthesis (PRISMA reporting)
- All documentation outputs

**Required Skills**: academic-writing-assistant, latex-document-compiler, statistical-reporting-formatter

---

#### 17. visualization-designer
**Description**: Agent specialized in scientific figure design, accessibility compliance, and multi-format output.

**Responsibilities**:
- Figure type selection
- Visual encoding optimization
- Accessibility verification
- Multi-panel composition
- Caption drafting
- Format conversion

**Used By Processes**:
- All processes requiring visualizations
- Representation Shifts (meta-pattern)

**Required Skills**: scientific-figure-generator, network-visualizer, interactive-dashboard-builder

---

#### 18. methodology-documenter
**Description**: Agent specialized in detailed methods documentation for reproducibility and protocol registration.

**Responsibilities**:
- Protocol completeness verification
- Procedure detail specification
- Equipment/software documentation
- Parameter recording
- Deviation documentation
- Supplementary material organization

**Used By Processes**:
- Experimental Design and Controls
- Pre-registration and Registered Reports
- Reproducible Research Pipeline

**Required Skills**: protocol-builder, checklist-validator, data-versioning-manager

---

### Quality Assurance Agents

#### 19. rigor-assessor
**Description**: Agent specialized in research quality assessment, validity evaluation, and bias identification.

**Responsibilities**:
- Internal validity assessment
- External validity evaluation
- Construct validity checking
- Statistical conclusion validity
- Bias risk assessment
- Quality scoring

**Used By Processes**:
- Rigor Assessment
- Literature Review quality assessment
- Peer review support

**Required Skills**: checklist-validator, peer-review-simulator, statistical-test-selector

---

#### 20. assumption-auditor
**Description**: Agent specialized in identifying and evaluating explicit and implicit assumptions in research designs.

**Responsibilities**:
- Assumption identification
- Assumption documentation
- Sensitivity analysis planning
- Violation consequence assessment
- Alternative assumption exploration
- Key assumptions check

**Used By Processes**:
- Key Assumptions Check
- Hypothesis Formulation and Testing
- Statistical Reasoning

**Required Skills**: formal-logic-reasoner, bayesian-inference-engine, causal-inference-engine

---

#### 21. bias-detective
**Description**: Agent specialized in identifying cognitive biases, publication biases, and methodological biases.

**Responsibilities**:
- Cognitive bias detection
- Confirmation bias mitigation
- Publication bias assessment
- Selection bias identification
- Reporting bias detection
- Debiasing strategy recommendation

**Used By Processes**:
- Cognitive Bias Mitigation
- Premortem and Red Team Analysis
- Analysis of Competing Hypotheses (ACH)

**Required Skills**: meta-analysis-engine, peer-review-simulator, checklist-validator

---

#### 22. red-team-analyst
**Description**: Agent specialized in adversarial analysis, critique generation, and robustness testing of research claims.

**Responsibilities**:
- Weakness identification
- Alternative explanation generation
- Counterargument formulation
- Stress testing of conclusions
- Edge case identification
- Robustness recommendation

**Used By Processes**:
- Premortem and Red Team Analysis
- Adversarial Co-Design of Explanations
- Multiple Working Hypotheses

**Required Skills**: peer-review-simulator, hypothesis-generator, formal-logic-reasoner

---

### Specialized Domain Agents

#### 23. dimensional-analyst
**Description**: Agent specialized in dimensional analysis, scaling laws, and unit consistency verification.

**Responsibilities**:
- Dimensional consistency checking
- Pi theorem application
- Scaling law derivation
- Order-of-magnitude estimation
- Unit conversion validation
- Dimensional homogeneity verification

**Used By Processes**:
- Dimensional Analysis & Scaling
- Fermi/Order-of-Magnitude Reasoning
- Limiting-Case Reasoning
- Scale-Zooming (meta-pattern)

**Required Skills**: formal-logic-reasoner, statistical-test-selector

---

#### 24. thought-experiment-facilitator
**Description**: Agent specialized in constructing and analyzing thought experiments for theory exploration.

**Responsibilities**:
- Scenario construction
- Assumption specification
- Logical consequence derivation
- Paradox identification
- Intuition pump creation
- Thought experiment documentation

**Used By Processes**:
- Thought Experiments
- Limiting-Case Reasoning
- Counterfactual Reasoning
- Constraint Sculpting

**Required Skills**: formal-logic-reasoner, hypothesis-generator, analogy-mapper

---

## Process to Skills/Agents Mapping

| Process Category | Key Processes | Recommended Skills | Recommended Agents |
|-----------------|---------------|-------------------|-------------------|
| Literature & Knowledge | Literature Review and Synthesis | semantic-scholar-search, pubmed-literature-miner, elicit-research-assistant, meta-analysis-engine | systematic-review-coordinator, meta-analyst |
| Hypothesis Development | Hypothesis Formulation and Testing | hypothesis-generator, causal-inference-engine, formal-logic-reasoner | hypothesis-architect, preregistration-specialist |
| Experimental Design | Experimental Design and Controls | power-analysis-calculator, randomization-generator, protocol-builder, doe-optimizer | experiment-designer, methodology-documenter |
| Statistical Analysis | Statistical Reasoning, Bayesian Reasoning | bayesian-inference-engine, statistical-test-selector, regression-analyzer | statistical-consultant, bayesian-analyst |
| Causal Reasoning | Causal Inference, Causal Discovery | causal-inference-engine, systems-dynamics-modeler | causal-reasoning-analyst, systems-thinker |
| Root Cause Analysis | Five Whys, Fishbone, FMEA | causal-inference-engine, systems-dynamics-modeler | root-cause-analyst |
| Creative Problem Solving | TRIZ, Design Thinking | triz-contradiction-solver, analogy-mapper | innovation-facilitator, analogical-reasoner |
| Reproducibility | Reproducible Research Pipeline | jupyter-reproducibility-checker, data-versioning-manager, osf-workflow-integrator | reproducibility-guardian |
| Scientific Writing | Documentation, Reporting | academic-writing-assistant, latex-document-compiler, statistical-reporting-formatter | scientific-writer, visualization-designer |
| Quality Assurance | Rigor Assessment, Bias Detection | checklist-validator, peer-review-simulator | rigor-assessor, bias-detective, red-team-analyst |

---

## Shared Candidates (Cross-Specialization)

These skills and agents could be shared with other specializations:

### Shared Skills

1. **causal-inference-engine** - Applicable to Data Science, Business Analytics, Healthcare
2. **bayesian-inference-engine** - Applicable to Data Science, ML, Decision Intelligence
3. **statistical-test-selector** - Applicable to QA Testing, Data Science, Healthcare
4. **meta-analysis-engine** - Applicable to Healthcare, Policy Analysis, Education
5. **systems-dynamics-modeler** - Applicable to Business Strategy, Operations, Environmental Science
6. **jupyter-reproducibility-checker** - Applicable to Data Science, ML
7. **data-versioning-manager** - Applicable to Data Engineering, ML
8. **checklist-validator** - Applicable to Healthcare, Quality Assurance, Regulatory

### Shared Agents

1. **statistical-consultant** - Core statistical expertise applicable to Data Science, Healthcare, Social Sciences
2. **systems-thinker** - Systems analysis applicable to Business Strategy, Operations, Environmental Science
3. **reproducibility-guardian** - Reproducibility expertise applicable to Data Science, ML
4. **bias-detective** - Bias detection applicable to ML Fairness, HR Analytics, Policy Analysis

---

## Implementation Priority

### High Priority (Core Scientific Workflows)
1. semantic-scholar-search
2. hypothesis-generator
3. statistical-test-selector
4. power-analysis-calculator
5. causal-inference-engine
6. hypothesis-architect (agent)
7. statistical-consultant (agent)
8. experiment-designer (agent)

### Medium Priority (Enhanced Capabilities)
1. bayesian-inference-engine
2. meta-analysis-engine
3. pubmed-literature-miner
4. protocol-builder
5. checklist-validator
6. systematic-review-coordinator (agent)
7. causal-reasoning-analyst (agent)
8. rigor-assessor (agent)

### Lower Priority (Specialized Use Cases)
1. triz-contradiction-solver
2. formal-logic-reasoner
3. analogy-mapper
4. peer-review-simulator
5. replication-feasibility-assessor
6. thought-experiment-facilitator (agent)
7. dimensional-analyst (agent)
8. innovation-facilitator (agent)

---

## Reasoning Pattern Support Matrix

| Reasoning Category | Patterns Supported | Primary Skills | Primary Agents |
|-------------------|-------------------|----------------|----------------|
| Formal & Mathematical | Deductive, Proof-Theoretic, Type-Theoretic | formal-logic-reasoner, bayesian-inference-engine | assumption-auditor |
| Ampliative | Inductive, Abductive, Analogical | hypothesis-generator, analogy-mapper | hypothesis-architect, analogical-reasoner |
| Uncertainty | Bayesian, Evidential, Maximum-Entropy | bayesian-inference-engine, statistical-test-selector | bayesian-analyst |
| Causal | Causal Inference, Counterfactual, Mechanistic | causal-inference-engine, systems-dynamics-modeler | causal-reasoning-analyst |
| Systems | Systems Thinking, Homeostasis, Network | systems-dynamics-modeler, network-visualizer | systems-thinker |
| Diagnostic | Five Whys, Fishbone, FMEA | causal-inference-engine | root-cause-analyst |
| Creative | TRIZ, Design Thinking, Lateral | triz-contradiction-solver, analogy-mapper | innovation-facilitator |
| Meta-Level | Calibration, Reflective, Adversarial | peer-review-simulator, checklist-validator | red-team-analyst, bias-detective |

---

## Notes

- All skills should implement standardized input/output schemas for composability with reasoning processes
- Skills should support both automated and human-in-the-loop execution modes
- Agents should provide detailed reasoning traces for scientific auditability
- Error handling should distinguish between methodological errors and data errors
- Logging should capture decision points for reproducibility documentation
- Skills should support domain-specific terminology and conventions
- Agents should be able to cite relevant methodological literature in their recommendations
- Integration with reference managers should be prioritized for academic workflows
- Support for multiple output formats (LaTeX, Word, HTML) should be standard
- Version control integration should be built into all documentation skills

---

## Phase 7: Process Integration Checklist

### Completed Process Files

#### Formal and Mathematical Reasoning
- [x] deductive-reasoning.js - Updated with assumption-auditor agent, formal-logic-reasoner, hypothesis-generator skills
- [x] mathematical-proof-reasoning.js - Updated with formal-logic-reasoner, hypothesis-generator skills
- [x] constructive-intuitionistic-reasoning.js - Updated with formal-logic-reasoner skills
- [x] equational-algebraic-reasoning.js - Updated with formal-logic-reasoner skills
- [x] model-theoretic-semantic-reasoning.js - Updated with formal-logic-reasoner skills
- [x] constraint-satisfiability-reasoning.js - Updated with formal-logic-reasoner skills
- [x] type-theoretic-reasoning.js - Updated with formal-logic-reasoner skills
- [x] counterexample-guided-reasoning.js - Updated with formal-logic-reasoner skills

#### Ampliative Reasoning
- [x] inductive-reasoning.js - Updated with hypothesis-architect agent, hypothesis-generator, statistical-test-selector skills
- [x] abductive-reasoning.js - Updated with hypothesis-architect agent, hypothesis-generator, causal-inference-engine, formal-logic-reasoner skills
- [x] analogical-reasoning.js - Updated with analogical-reasoner agent, analogy-mapper, semantic-scholar-search, hypothesis-generator skills
- [x] bayesian-probabilistic-reasoning.js - Updated with bayesian-analyst agent, bayesian-inference-engine, statistical-test-selector, scientific-figure-generator skills
- [x] statistical-reasoning.js - Updated with statistical-consultant agent, statistical-test-selector, regression-analyzer, power-analysis-calculator skills
- [x] likelihood-based-reasoning.js - Updated with bayesian-inference-engine skills
- [x] case-based-reasoning.js - Updated with analogy-mapper skills
- [x] explanation-based-learning.js - Updated with hypothesis-generator skills

#### Causal Reasoning
- [x] causal-inference.js - Updated with causal-reasoning-analyst agent, causal-inference-engine, statistical-test-selector, checklist-validator skills
- [x] causal-discovery.js - Updated with causal-inference-engine, bayesian-inference-engine skills
- [x] counterfactual-reasoning.js - Updated with causal-inference-engine, formal-logic-reasoner skills
- [x] causal-loop-diagram-development.js - Updated with systems-dynamics-modeler, causal-inference-engine skills
- [x] causal-inference-observational.js - Updated with causal-inference-engine, statistical-test-selector skills

#### Systems Thinking
- [x] systems-thinking.js - Updated with systems-thinker agent, systems-dynamics-modeler, causal-inference-engine, network-visualizer skills

#### Diagnostic and Root Cause Analysis
- [x] five-whys-analysis.js - Updated with root-cause-analyst agent, causal-inference-engine, systems-dynamics-modeler skills
- [x] diagnostic-reasoning.js - Updated with causal-inference-engine, bayesian-inference-engine skills

#### Hypothesis and Experimental Design
- [x] hypothesis-formulation-testing.js - Updated with hypothesis-architect agent, hypothesis-generator, power-analysis-calculator, protocol-builder skills

#### Creative Problem Solving
- [x] triz-contradiction-resolution.js - Updated with innovation-facilitator agent, triz-contradiction-solver, analogy-mapper skills
- [x] lateral-thinking-idea-generation.js - Updated with triz-contradiction-solver, analogy-mapper, hypothesis-generator skills
- [x] analogical-cross-domain-transfer.js - Updated with analogical-reasoner agent, analogy-mapper, hypothesis-generator, semantic-scholar-search skills

#### Decision and Game Theory
- [x] decision-theoretic-reasoning.js - Updated with decision-theorist agent, bayesian-inference-engine skills
- [x] multi-criteria-decision-analysis.js - Updated with decision-theorist agent, bayesian-inference-engine skills
- [x] game-theoretic-strategic-reasoning.js - Updated with bayesian-inference-engine, formal-logic-reasoner skills
- [x] negotiation-coalition-reasoning.js - Updated with bayesian-inference-engine skills
- [x] theory-of-mind-reasoning.js - Updated with bayesian-inference-engine skills

#### Quality Assurance and Meta-Cognitive
- [x] cognitive-bias-mitigation.js - Updated with bias-detective agent, checklist-validator, peer-review-simulator skills
- [x] calibration-epistemic-humility.js - Updated with bayesian-inference-engine, statistical-test-selector skills
- [x] analysis-competing-hypotheses.js - Updated with hypothesis-architect agent, bayesian-inference-engine, formal-logic-reasoner skills
- [x] adversarial-red-team-reasoning.js - Updated with red-team-analyst agent, peer-review-simulator, hypothesis-generator skills
- [x] clinical-operational-troubleshooting.js - Updated with causal-inference-engine, bayesian-inference-engine skills

#### Additional Reasoning Processes (Batch 2)
- [x] fishbone-ishikawa-analysis.js - Updated with root-cause-analyst agent, causal-inference-engine, systems-dynamics-modeler skills
- [x] heuristic-reasoning.js - Updated with heuristic-analyst agent, hypothesis-generator, bayesian-inference-engine skills
- [x] hermeneutic-interpretive-reasoning.js - Updated with hermeneutic-analyst agent, hypothesis-generator, analogy-mapper skills
- [x] historical-investigative-reasoning.js - Updated with historical-analyst agent, causal-inference-engine, hypothesis-generator skills
- [x] key-assumptions-check.js - Updated with assumption-auditor agent, formal-logic-reasoner, hypothesis-generator skills

#### Additional Reasoning Processes (Batch 3)
- [x] mechanistic-reasoning.js - Updated with mechanistic-analyst agent, causal-inference-engine, hypothesis-generator skills
- [x] model-based-scientific-reasoning.js - Updated with model-builder agent, hypothesis-generator, statistical-test-selector skills
- [x] multi-model-ensemble-reasoning.js - Updated with ensemble-analyst agent, bayesian-inference-engine, statistical-test-selector skills
- [x] multiple-working-hypotheses.js - Updated with hypothesis-architect agent, hypothesis-generator, bayesian-inference-engine skills
- [x] narrative-causal-storytelling.js - Updated with narrative-analyst agent, causal-inference-engine, hypothesis-generator skills
- [x] network-pathway-reasoning.js - Updated with network-analyst agent, network-visualizer, causal-inference-engine skills
- [x] paradigm-shift-kuhnian-crisis.js - Updated with paradigm-analyst agent, hypothesis-generator, analogy-mapper skills
- [x] phenomenological-reasoning.js - Updated with phenomenological-analyst agent, hypothesis-generator, analogy-mapper skills
- [x] probabilistic-forecasting-calibration.js - Updated with probabilistic-forecaster agent, bayesian-inference-engine, statistical-test-selector skills
- [x] multi-criteria-decision-analysis-structured.js - Updated with decision-analyst agent, hypothesis-generator, bayesian-inference-engine skills

#### Additional Reasoning Processes (Batch 4)
- [x] reference-class-reasoning.js - Updated with reference-class-analyst agent, bayesian-inference-engine, statistical-test-selector skills
- [x] reflective-equilibrium.js - Updated with equilibrium-analyst agent, formal-logic-reasoner, hypothesis-generator skills
- [x] reproducible-research-pipeline.js - Updated with research-software-engineer agent, hypothesis-generator, statistical-test-selector skills
- [x] rhetorical-reasoning.js - Updated with rhetorical-analyst agent, hypothesis-generator, analogy-mapper skills
- [x] robust-worst-case-reasoning.js - Updated with robust-decision-analyst agent, bayesian-inference-engine, hypothesis-generator skills
- [x] satisficing-reasoning.js - Updated with satisficing-analyst agent, hypothesis-generator, bayesian-inference-engine skills
- [x] scientific-reasoning.js - Updated with scientific-method-analyst agent, hypothesis-generator, statistical-test-selector, causal-inference-engine skills
- [x] search-based-algorithmic-reasoning.js - Updated with search-algorithm-analyst agent, hypothesis-generator, formal-logic-reasoner skills

#### Additional Reasoning Processes (Batch 5)
- [x] transcendental-reasoning.js - Updated with transcendental-analyst agent, formal-logic-reasoner, hypothesis-generator skills
- [x] value-of-information-reasoning.js - Updated with voi-analyst agent, bayesian-inference-engine, statistical-test-selector skills
- [x] spatial-diagrammatic-reasoning.js - Updated with spatial-reasoning-analyst agent, formal-logic-reasoner, analogy-mapper skills
- [x] temporal-reasoning.js - Updated with temporal-logic-analyst agent, formal-logic-reasoner, causal-inference-engine skills
- [x] experimental-design-controls.js - Updated with experimental-design-methodologist agent, statistical-test-selector, hypothesis-generator skills
- [x] simplicity-compression-reasoning.js - Updated with complexity-analyst agent, hypothesis-generator, bayesian-inference-engine skills
- [x] sensemaking-frame-building.js - Updated with sensemaking-analyst agent, hypothesis-generator, analogy-mapper skills
- [x] system-archetype-analysis.js - Updated with systems-thinking-analyst agent, hypothesis-generator, causal-inference-engine skills
- [x] system-dynamics-modeling.js - Updated with system-dynamics-modeler agent, hypothesis-generator, causal-inference-engine skills
- [x] premortem-red-team-analysis.js - Updated with risk-analyst agent, hypothesis-generator, root-cause-analyzer skills

### Integration Notes
- All process files now use the standardized pattern with `skills: [...]` array inside agent objects
- Agent objects include domain-specific agent names (hypothesis-architect, causal-reasoning-analyst, statistical-consultant, systems-thinker, etc.)
- Agent objects include skills arrays for multi-skill capability
- Process-to-Skills/Agents mapping table used as reference for integration
- Old `skill: { name: '...' }` task-level pattern has been removed from all files
