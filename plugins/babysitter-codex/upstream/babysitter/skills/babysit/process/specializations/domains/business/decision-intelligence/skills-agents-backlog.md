# Decision Intelligence - Skills and Agents Backlog (Phase 4)

## Overview

This backlog identifies specialized skills and agents that could enhance the Decision Intelligence processes beyond general-purpose capabilities. Each skill or agent is designed to provide domain-specific tooling, validation, or automation for business intelligence, competitive intelligence, market intelligence, decision frameworks, scenario planning, and analytics-driven decision-making workflows.

## Summary Statistics

- **Total Skills Identified**: 32
- **Total Agents Identified**: 24
- **Shared Candidates (Cross-Specialization)**: 12
- **Categories**: 8 (Quantitative Analysis, Simulation, MCDA, Visualization, Forecasting, Risk, Optimization, Knowledge Management)

---

## Skills

### Quantitative Analysis Skills

#### 1. decision-tree-builder
**Description**: Automated decision tree construction skill for structuring complex decisions with probabilities, payoffs, and expected value calculations.

**Capabilities**:
- Decision node and chance node creation
- Probability assignment and validation
- Expected value calculation
- Decision path optimization
- Sensitivity analysis on probabilities
- Rollback analysis automation
- Decision tree visualization generation
- Export to standard formats (JSON, XML)

**Used By Processes**:
- Structured Decision Making Process
- Multi-Criteria Decision Analysis (MCDA)
- Decision Quality Assessment

**Tools/Libraries**: decision-tree-id3, anytree, graphviz, networkx

---

#### 2. bayesian-network-analyzer
**Description**: Bayesian network construction and inference skill for probabilistic reasoning, causal analysis, and belief updating.

**Capabilities**:
- DAG structure learning from data
- Conditional probability table estimation
- Belief propagation and inference
- Causal effect estimation
- Sensitivity to evidence analysis
- What-if scenario evaluation
- Network visualization
- Integration with external data sources

**Used By Processes**:
- Structured Decision Making Process
- Predictive Analytics Implementation
- Decision Quality Assessment
- Cognitive Bias Debiasing Process

**Tools/Libraries**: pgmpy, pomegranate, bnlearn, pyAgrum

---

#### 3. ahp-calculator
**Description**: Analytic Hierarchy Process (AHP) calculation skill for pairwise comparison matrices, consistency checking, and weight derivation.

**Capabilities**:
- Pairwise comparison matrix creation
- Eigenvalue-based weight calculation
- Consistency ratio computation
- Inconsistency identification and correction guidance
- Group AHP aggregation (AIJ/AIP methods)
- Sensitivity analysis on weights
- AHP hierarchy visualization
- Report generation

**Used By Processes**:
- Multi-Criteria Decision Analysis (MCDA)
- Structured Decision Making Process
- Decision Quality Assessment

**Tools/Libraries**: ahpy, pyDecision, scipy.linalg

---

#### 4. topsis-ranker
**Description**: TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution) ranking skill for multi-criteria evaluation.

**Capabilities**:
- Decision matrix normalization (vector, linear, max-min)
- Weighted normalized matrix calculation
- Ideal and anti-ideal solution identification
- Euclidean distance calculation
- Relative closeness coefficient computation
- Alternative ranking generation
- Sensitivity analysis on weights
- Visualization of results

**Used By Processes**:
- Multi-Criteria Decision Analysis (MCDA)
- Tech Stack Evaluation
- Geographic Market Analysis

**Tools/Libraries**: pyDecision, scikit-mcda, numpy

---

#### 5. promethee-evaluator
**Description**: PROMETHEE (Preference Ranking Organization Method for Enrichment Evaluation) skill for outranking-based multi-criteria analysis.

**Capabilities**:
- Preference function selection (Usual, U-shape, V-shape, Level, Linear, Gaussian)
- Unicriterion preference degree calculation
- Multicriteria preference index computation
- PROMETHEE I partial ranking
- PROMETHEE II complete ranking
- GAIA plane visualization
- Walking weights sensitivity analysis
- Net flow calculation

**Used By Processes**:
- Multi-Criteria Decision Analysis (MCDA)
- Vendor Selection Analysis
- Resource Allocation Decisions

**Tools/Libraries**: pyDecision, pymcdm, visual-promethee

---

#### 6. electre-comparator
**Description**: ELECTRE family methods skill for outranking-based decision support with concordance and discordance analysis.

**Capabilities**:
- ELECTRE I, II, III, IV, TRI implementation
- Concordance matrix calculation
- Discordance matrix calculation
- Credibility degree computation
- Outranking relation determination
- Kernel and ranking extraction
- Threshold sensitivity analysis
- Classification into ordered categories (ELECTRE TRI)

**Used By Processes**:
- Multi-Criteria Decision Analysis (MCDA)
- Portfolio Selection
- Project Prioritization

**Tools/Libraries**: pyDecision, pymcdm, electre-py

---

### Simulation Skills

#### 7. monte-carlo-engine
**Description**: Monte Carlo simulation engine skill for probabilistic modeling, risk quantification, and uncertainty propagation.

**Capabilities**:
- Random variate generation (normal, triangular, PERT, uniform, lognormal, beta, etc.)
- Latin Hypercube Sampling (LHS)
- Correlation structure handling (Cholesky decomposition, copulas)
- Convergence monitoring and adaptive iteration
- Statistical output analysis (mean, variance, percentiles)
- Tornado diagram generation
- Value at Risk (VaR) and CVaR calculation
- Parallel simulation execution

**Used By Processes**:
- Monte Carlo Simulation for Decision Support
- Strategic Scenario Development
- What-If Analysis Framework
- Predictive Analytics Implementation

**Tools/Libraries**: numpy, scipy.stats, pymc, chaospy, SALib

---

#### 8. risk-distribution-fitter
**Description**: Probability distribution fitting skill for calibrating uncertainty models from historical data or expert judgment.

**Capabilities**:
- Maximum likelihood estimation (MLE)
- Method of moments estimation
- Bayesian parameter estimation
- Goodness-of-fit testing (KS, AD, Chi-square)
- Distribution comparison and selection
- Expert elicitation protocol support (3-point, 5-point)
- PERT distribution calculation
- Visualization of fitted distributions

**Used By Processes**:
- Monte Carlo Simulation for Decision Support
- Predictive Analytics Implementation
- Decision Quality Assessment

**Tools/Libraries**: scipy.stats, fitter, pomegranate, distfit

---

#### 9. sensitivity-analyzer
**Description**: Sensitivity analysis skill for identifying critical inputs and understanding model behavior under uncertainty.

**Capabilities**:
- One-at-a-time (OAT) sensitivity
- Global sensitivity analysis (Sobol indices, Morris screening)
- Tornado diagram generation
- Spider plot creation
- Parameter importance ranking
- Threshold identification
- Breakeven analysis
- Scenario comparison

**Used By Processes**:
- Monte Carlo Simulation for Decision Support
- Multi-Criteria Decision Analysis (MCDA)
- Prescriptive Analytics and Optimization
- What-If Analysis Framework

**Tools/Libraries**: SALib, openturns, sensitivity, numpy

---

#### 10. system-dynamics-modeler
**Description**: System dynamics modeling skill for feedback loop analysis, stock-flow diagrams, and dynamic simulation.

**Capabilities**:
- Stock and flow model construction
- Causal loop diagram creation
- Feedback loop identification
- Simulation execution
- Policy testing and comparison
- Equilibrium analysis
- Sensitivity to initial conditions
- Model validation tests

**Used By Processes**:
- Strategic Scenario Development
- What-If Analysis Framework
- War Gaming and Competitive Response Modeling

**Tools/Libraries**: pysd, BPTK-Py, simdynamics

---

#### 11. agent-based-simulator
**Description**: Agent-based modeling skill for simulating complex adaptive systems with heterogeneous interacting agents.

**Capabilities**:
- Agent definition and behavior modeling
- Environment and spatial modeling
- Interaction rules specification
- Emergent behavior observation
- Parameter sweeping
- Ensemble simulation runs
- Visualization and animation
- Statistical analysis of outcomes

**Used By Processes**:
- War Gaming and Competitive Response Modeling
- Market Sizing and Opportunity Assessment
- Customer Segmentation Analysis

**Tools/Libraries**: mesa, agentpy, NetLogo (via pyNetLogo)

---

### Visualization and Reporting Skills

#### 12. decision-visualization
**Description**: Decision-specific visualization skill for creating clear, actionable visual representations of analyses.

**Capabilities**:
- Decision tree diagrams
- Strategy tables and consequence matrices
- Trade-off scatter plots
- Value-of-information graphs
- Confidence/uncertainty bands
- Waterfall charts for sensitivity
- Heat maps for MCDA
- Interactive dashboards

**Used By Processes**:
- Executive Dashboard Development
- Structured Decision Making Process
- Multi-Criteria Decision Analysis (MCDA)
- Decision Documentation and Learning

**Tools/Libraries**: plotly, bokeh, matplotlib, d3.js (via pyscript)

---

#### 13. kpi-tracker
**Description**: KPI definition, calculation, and tracking skill for business intelligence dashboards.

**Capabilities**:
- KPI formula definition and validation
- Target and threshold management
- Traffic light status calculation
- Trend analysis and forecasting
- Drill-down hierarchy configuration
- Benchmark comparison
- Variance analysis
- Automated alert generation

**Used By Processes**:
- KPI Framework Development
- Executive Dashboard Development
- Operational Reporting System Design

**Tools/Libraries**: pandas, polars, great_expectations, pandera

---

#### 14. data-storytelling
**Description**: Narrative generation skill for transforming analytical insights into compelling business stories.

**Capabilities**:
- Insight prioritization and selection
- Narrative structure generation
- Chart annotation automation
- Key takeaway extraction
- Executive summary generation
- Recommendation framing
- Action item identification
- Audience-appropriate language adaptation

**Used By Processes**:
- Insight-to-Action Process
- Executive Dashboard Development
- Decision Documentation and Learning

**Tools/Libraries**: openai/anthropic APIs, jinja2, markdown

---

### Forecasting and Prediction Skills

#### 15. time-series-forecaster
**Description**: Time series forecasting skill for business metric prediction and demand planning.

**Capabilities**:
- Classical methods (ARIMA, ETS, Theta)
- Machine learning methods (XGBoost, LightGBM for time series)
- Deep learning methods (Prophet, N-BEATS, Temporal Fusion Transformer)
- Ensemble forecasting
- Prediction interval generation
- Forecast accuracy metrics (MAPE, RMSE, MASE)
- Anomaly detection
- Seasonality decomposition

**Used By Processes**:
- Predictive Analytics Implementation
- KPI Framework Development
- Market Sizing and Opportunity Assessment

**Tools/Libraries**: prophet, statsforecast, darts, sktime, nixtla

---

#### 16. causal-inference-engine
**Description**: Causal inference skill for estimating treatment effects and understanding causal relationships in business data.

**Capabilities**:
- Propensity score matching
- Inverse probability weighting
- Difference-in-differences
- Instrumental variables
- Regression discontinuity
- Synthetic control methods
- Causal forest implementation
- Sensitivity analysis to unobserved confounding

**Used By Processes**:
- A/B Testing and Experimentation Framework
- Predictive Analytics Implementation
- Win/Loss Analysis Program

**Tools/Libraries**: econml, dowhy, causalml, statsmodels

---

#### 17. reference-class-forecaster
**Description**: Reference class forecasting skill to counter optimism bias using historical analogies.

**Capabilities**:
- Reference class selection and validation
- Distribution fitting from historical data
- Adjustment factor calculation
- Uncertainty quantification
- Bias correction for planning fallacy
- Documentation of reference class rationale
- Comparison with inside view estimates
- Reconciliation guidance

**Used By Processes**:
- Cognitive Bias Debiasing Process
- Decision Quality Assessment
- Strategic Scenario Development

**Tools/Libraries**: scipy.stats, pandas, custom algorithms

---

### Risk and Uncertainty Skills

#### 18. risk-register-manager
**Description**: Risk register management skill for systematic risk identification, assessment, and tracking.

**Capabilities**:
- Risk identification and categorization
- Probability and impact scoring
- Risk matrix generation
- Risk prioritization (P*I ranking)
- Mitigation strategy tracking
- Residual risk calculation
- Risk trend analysis
- Risk report generation

**Used By Processes**:
- Decision Quality Assessment
- Monte Carlo Simulation for Decision Support
- Strategic Scenario Development

**Tools/Libraries**: pandas, numpy, jinja2 (for reports)

---

#### 19. value-at-risk-calculator
**Description**: Value at Risk (VaR) and related risk metrics calculation skill for financial and operational risk assessment.

**Capabilities**:
- Historical simulation VaR
- Parametric VaR (variance-covariance)
- Monte Carlo VaR
- Conditional VaR (CVaR/Expected Shortfall)
- Incremental and component VaR
- Stress testing
- Backtesting and validation
- Regulatory reporting support

**Used By Processes**:
- Monte Carlo Simulation for Decision Support
- Risk Assessment
- Decision Quality Assessment

**Tools/Libraries**: scipy.stats, numpy, arch, riskfolio-lib

---

#### 20. real-options-analyzer
**Description**: Real options valuation skill for analyzing strategic flexibility and investment timing decisions.

**Capabilities**:
- Option identification and framing
- Binomial tree valuation
- Black-Scholes adaptation
- Monte Carlo option valuation
- Decision tree representation
- Sensitivity to volatility
- Strategic option types (defer, expand, abandon, switch)
- Integration with NPV analysis

**Used By Processes**:
- Strategic Scenario Development
- What-If Analysis Framework
- Investment Decision Analysis

**Tools/Libraries**: numpy, scipy, custom implementations

---

### Optimization Skills

#### 21. linear-programming-solver
**Description**: Linear programming skill for resource allocation, scheduling, and optimization problems.

**Capabilities**:
- LP model formulation assistance
- Solver integration (GLPK, CBC, CPLEX, Gurobi)
- Sensitivity analysis (shadow prices, reduced costs)
- Infeasibility diagnosis
- Unboundedness detection
- Integer programming support
- Multi-objective LP (goal programming)
- Solution interpretation

**Used By Processes**:
- Prescriptive Analytics and Optimization
- Resource Allocation
- Supply Chain Optimization

**Tools/Libraries**: pulp, ortools, pyomo, cvxpy

---

#### 22. constraint-satisfaction-solver
**Description**: Constraint programming skill for scheduling, configuration, and assignment problems.

**Capabilities**:
- Variable and domain definition
- Constraint specification (global constraints)
- Solution search strategies
- Optimization with constraints
- Scheduling constraint handling
- Configuration problem solving
- All-solutions enumeration
- Constraint propagation explanation

**Used By Processes**:
- Prescriptive Analytics and Optimization
- Resource Scheduling
- Operational Decisions

**Tools/Libraries**: ortools, python-constraint, minizinc-python

---

#### 23. genetic-algorithm-optimizer
**Description**: Genetic algorithm skill for complex optimization problems with non-linear objectives or discontinuous search spaces.

**Capabilities**:
- Chromosome encoding (binary, real, permutation)
- Selection operators (tournament, roulette, rank)
- Crossover and mutation operations
- Multi-objective optimization (NSGA-II, NSGA-III)
- Constraint handling
- Parameter tuning guidance
- Convergence monitoring
- Pareto front visualization

**Used By Processes**:
- Prescriptive Analytics and Optimization
- Strategic Portfolio Optimization
- Design Optimization

**Tools/Libraries**: DEAP, pymoo, geneticalgorithm

---

### Knowledge Management Skills

#### 24. decision-journal
**Description**: Decision documentation and learning skill for capturing decision context, rationale, and outcomes.

**Capabilities**:
- Decision record creation (date, context, options, choice, rationale)
- Outcome tracking and hindsight analysis
- Decision pattern identification
- Calibration tracking over time
- Searchable decision archive
- Lessons learned extraction
- Decision audit trail
- Report generation

**Used By Processes**:
- Decision Documentation and Learning
- Cognitive Bias Debiasing Process
- Decision Quality Assessment

**Tools/Libraries**: markdown, sqlite, pandas, jinja2

---

#### 25. competitive-intelligence-tracker
**Description**: Competitive intelligence collection and analysis skill for systematic competitor monitoring.

**Capabilities**:
- Competitor profile management
- News and event monitoring
- Product/pricing change tracking
- SWOT analysis automation
- Competitive positioning maps
- Market share tracking
- Battlecard generation
- Alert configuration

**Used By Processes**:
- Competitor Monitoring System Setup
- Competitive Battlecard Development
- Industry Trend Analysis

**Tools/Libraries**: feedparser, beautifulsoup4, pandas, custom scrapers

---

#### 26. market-research-aggregator
**Description**: Market intelligence aggregation skill for synthesizing market data from multiple sources.

**Capabilities**:
- Data source integration
- Market size estimation (TAM, SAM, SOM)
- Growth rate calculation
- Trend identification
- Segment analysis
- Geographic breakdown
- Confidence level assessment
- Source citation management

**Used By Processes**:
- Market Sizing and Opportunity Assessment
- Geographic Market Analysis
- Industry Trend Analysis

**Tools/Libraries**: pandas, requests, custom integrations

---

### Collaboration and Process Skills

#### 27. stakeholder-preference-elicitor
**Description**: Stakeholder preference elicitation skill for structured value and weight gathering.

**Capabilities**:
- Swing weight elicitation
- Direct rating collection
- Trade-off questioning
- Consistency checking
- Preference aggregation
- Disagreement identification
- Facilitation guidance
- Preference documentation

**Used By Processes**:
- Multi-Criteria Decision Analysis (MCDA)
- Structured Decision Making Process
- KPI Framework Development

**Tools/Libraries**: custom forms, pandas, statistical aggregation

---

#### 28. pre-mortem-facilitator
**Description**: Pre-mortem analysis skill for prospective hindsight and failure mode identification.

**Capabilities**:
- Pre-mortem session structuring
- Failure mode collection
- Frequency and impact assessment
- Mitigation strategy brainstorming
- Action item generation
- Bias challenge integration
- Documentation and tracking
- Follow-up scheduling

**Used By Processes**:
- Cognitive Bias Debiasing Process
- Decision Quality Assessment
- Structured Decision Making Process

**Tools/Libraries**: custom workflows, markdown, collaboration tools

---

#### 29. scenario-narrative-generator
**Description**: Scenario narrative generation skill for creating vivid, consistent future scenario descriptions.

**Capabilities**:
- Driving forces integration
- Consistency checking across scenario elements
- Narrative arc construction
- Key event identification
- Implication extraction
- Headline generation
- Persona-in-scenario development
- Scenario comparison tables

**Used By Processes**:
- Strategic Scenario Development
- War Gaming and Competitive Response Modeling
- What-If Analysis Framework

**Tools/Libraries**: LLM APIs, jinja2, markdown

---

#### 30. calibration-trainer
**Description**: Probability calibration training skill for improving forecast accuracy and reducing overconfidence.

**Capabilities**:
- Calibration quiz generation
- Confidence interval elicitation
- Brier score calculation
- Calibration curve plotting
- Overconfidence/underconfidence diagnosis
- Training exercise management
- Progress tracking over time
- Benchmark comparison

**Used By Processes**:
- Cognitive Bias Debiasing Process
- Decision Quality Assessment
- Predictive Analytics Implementation

**Tools/Libraries**: numpy, matplotlib, custom quiz engines

---

#### 31. hypothesis-tracker
**Description**: Hypothesis management skill for tracking business hypotheses through testing and validation.

**Capabilities**:
- Hypothesis formulation assistance
- Test design specification
- Evidence collection and linking
- Confidence level tracking
- Hypothesis status management
- Invalidation criteria definition
- Learning documentation
- Hypothesis dashboard

**Used By Processes**:
- Hypothesis-Driven Analytics Process
- A/B Testing and Experimentation Framework
- Decision Documentation and Learning

**Tools/Libraries**: pandas, sqlite, markdown, jinja2

---

#### 32. war-game-orchestrator
**Description**: Business war game orchestration skill for competitive response simulation and strategic testing.

**Capabilities**:
- Team role assignment
- Scenario briefing generation
- Move and countermove tracking
- Timeline management
- Debrief facilitation
- Insight extraction
- Documentation and replay
- Learning synthesis

**Used By Processes**:
- War Gaming and Competitive Response Modeling
- Strategic Scenario Development
- Competitive Battlecard Development

**Tools/Libraries**: custom workflows, collaboration tools, documentation generators

---

## Agents

### Planning Agents

#### 1. decision-framing-specialist
**Description**: Agent specialized in structuring complex decision problems, identifying objectives, and generating creative alternatives.

**Responsibilities**:
- Decision problem definition and scoping
- Stakeholder identification
- Objectives hierarchy construction
- Value-focused thinking facilitation
- Alternatives generation
- Constraint identification
- Assumption documentation
- Frame quality assessment

**Used By Processes**:
- Structured Decision Making Process
- Multi-Criteria Decision Analysis (MCDA)
- Decision Quality Assessment

**Required Skills**: decision-tree-builder, stakeholder-preference-elicitor, decision-visualization

---

#### 2. scenario-planner
**Description**: Agent specialized in strategic scenario development, driving forces analysis, and future state modeling.

**Responsibilities**:
- Environmental scanning
- Driving forces identification
- Uncertainty mapping
- Scenario framework design
- Narrative development
- Implication analysis
- Strategic option identification
- Early warning system design

**Used By Processes**:
- Strategic Scenario Development
- What-If Analysis Framework
- War Gaming and Competitive Response Modeling

**Required Skills**: scenario-narrative-generator, system-dynamics-modeler, sensitivity-analyzer

---

#### 3. competitive-analyst
**Description**: Agent specialized in competitive intelligence gathering, analysis, and strategic interpretation.

**Responsibilities**:
- Competitor profiling
- Competitive dynamics analysis
- Market positioning assessment
- Pricing intelligence
- Win/loss pattern identification
- Battlecard creation
- Threat assessment
- Strategic recommendation

**Used By Processes**:
- Competitor Monitoring System Setup
- Competitive Battlecard Development
- Win/Loss Analysis Program
- Industry Trend Analysis

**Required Skills**: competitive-intelligence-tracker, market-research-aggregator, data-storytelling

---

#### 4. market-intelligence-analyst
**Description**: Agent specialized in market sizing, segmentation, and opportunity assessment.

**Responsibilities**:
- Market size estimation
- Growth projection
- Segment identification
- Opportunity prioritization
- Entry barrier assessment
- Geographic analysis
- Customer need mapping
- Recommendation synthesis

**Used By Processes**:
- Market Sizing and Opportunity Assessment
- Customer Segmentation Analysis
- Geographic Market Analysis
- Voice of Customer Integration

**Required Skills**: market-research-aggregator, time-series-forecaster, agent-based-simulator

---

### Analysis Agents

#### 5. mcda-facilitator
**Description**: Agent specialized in multi-criteria decision analysis methodology selection, execution, and interpretation.

**Responsibilities**:
- MCDA method selection (AHP, TOPSIS, PROMETHEE, ELECTRE)
- Criteria weighting facilitation
- Performance assessment guidance
- Calculation execution
- Sensitivity analysis interpretation
- Consistency validation
- Stakeholder aggregation
- Recommendation synthesis

**Used By Processes**:
- Multi-Criteria Decision Analysis (MCDA)
- Structured Decision Making Process
- Tech Stack Evaluation

**Required Skills**: ahp-calculator, topsis-ranker, promethee-evaluator, electre-comparator, stakeholder-preference-elicitor

---

#### 6. probabilistic-modeler
**Description**: Agent specialized in uncertainty quantification, probabilistic modeling, and simulation analysis.

**Responsibilities**:
- Uncertainty identification
- Distribution selection and fitting
- Correlation structure modeling
- Monte Carlo simulation design
- Output analysis and interpretation
- Risk metric calculation
- Sensitivity analysis
- Communication of uncertainty

**Used By Processes**:
- Monte Carlo Simulation for Decision Support
- Predictive Analytics Implementation
- Decision Quality Assessment

**Required Skills**: monte-carlo-engine, risk-distribution-fitter, sensitivity-analyzer, bayesian-network-analyzer

---

#### 7. bayesian-analyst
**Description**: Agent specialized in Bayesian inference, belief updating, and probabilistic reasoning.

**Responsibilities**:
- Prior elicitation
- Likelihood specification
- Posterior computation
- Bayesian network construction
- Causal inference
- Decision tree integration
- Value of information calculation
- Belief revision guidance

**Used By Processes**:
- Structured Decision Making Process
- Predictive Analytics Implementation
- Cognitive Bias Debiasing Process

**Required Skills**: bayesian-network-analyzer, monte-carlo-engine, decision-tree-builder

---

#### 8. trade-off-analyst
**Description**: Agent specialized in analyzing trade-offs, identifying efficient frontiers, and supporting value-based decisions.

**Responsibilities**:
- Trade-off identification
- Dominance analysis
- Efficient frontier construction
- Swing weight interpretation
- Value function assessment
- Marginal rate of substitution
- Sensitivity to values
- Trade-off communication

**Used By Processes**:
- Structured Decision Making Process
- Multi-Criteria Decision Analysis (MCDA)
- Prescriptive Analytics and Optimization

**Required Skills**: decision-visualization, sensitivity-analyzer, topsis-ranker

---

### Execution Agents

#### 9. dashboard-architect
**Description**: Agent specialized in executive dashboard design, KPI selection, and visual communication.

**Responsibilities**:
- Stakeholder requirements analysis
- KPI framework design
- Visual hierarchy planning
- Drill-down path design
- Alert configuration
- Performance optimization
- User training support
- Continuous improvement

**Used By Processes**:
- Executive Dashboard Development
- KPI Framework Development
- Operational Reporting System Design

**Required Skills**: kpi-tracker, decision-visualization, data-storytelling

---

#### 10. bi-analyst
**Description**: Agent specialized in business intelligence analysis, reporting, and insight generation.

**Responsibilities**:
- Data exploration and profiling
- Metric calculation and validation
- Trend identification
- Anomaly detection
- Root cause analysis
- Report generation
- Insight prioritization
- Recommendation formulation

**Used By Processes**:
- Self-Service Analytics Enablement
- KPI Framework Development
- Data Visualization Standards Implementation

**Required Skills**: kpi-tracker, time-series-forecaster, data-storytelling

---

#### 11. predictive-analyst
**Description**: Agent specialized in predictive model development, deployment, and business integration.

**Responsibilities**:
- Use case definition
- Feature engineering
- Model selection and training
- Validation and testing
- Deployment planning
- Business process integration
- Model monitoring
- Retraining orchestration

**Used By Processes**:
- Predictive Analytics Implementation
- A/B Testing and Experimentation Framework
- Insight-to-Action Process

**Required Skills**: time-series-forecaster, causal-inference-engine, monte-carlo-engine

---

#### 12. optimization-specialist
**Description**: Agent specialized in mathematical optimization, prescriptive analytics, and decision recommendation.

**Responsibilities**:
- Problem formulation
- Solver selection
- Model implementation
- Solution generation
- Sensitivity analysis
- Business translation
- Implementation planning
- What-if scenario execution

**Used By Processes**:
- Prescriptive Analytics and Optimization
- Resource Allocation
- Supply Chain Decisions

**Required Skills**: linear-programming-solver, constraint-satisfaction-solver, genetic-algorithm-optimizer, sensitivity-analyzer

---

#### 13. experimentation-manager
**Description**: Agent specialized in experiment design, execution, and statistical analysis for business decisions.

**Responsibilities**:
- Hypothesis formulation
- Sample size calculation
- Test design (A/B, multivariate)
- Randomization strategy
- Metric definition
- Statistical analysis
- Decision recommendation
- Documentation

**Used By Processes**:
- A/B Testing and Experimentation Framework
- Hypothesis-Driven Analytics Process
- Insight-to-Action Process

**Required Skills**: causal-inference-engine, hypothesis-tracker, monte-carlo-engine

---

### Validation Agents

#### 14. decision-quality-assessor
**Description**: Agent specialized in evaluating decision quality using the six elements framework.

**Responsibilities**:
- Frame quality assessment
- Alternatives quality evaluation
- Information quality review
- Values clarity assessment
- Reasoning soundness check
- Commitment to action evaluation
- Overall DQ score calculation
- Improvement recommendation

**Used By Processes**:
- Decision Quality Assessment
- Structured Decision Making Process
- Decision Documentation and Learning

**Required Skills**: decision-journal, pre-mortem-facilitator, calibration-trainer

---

#### 15. debiasing-coach
**Description**: Agent specialized in cognitive bias identification, mitigation, and decision hygiene improvement.

**Responsibilities**:
- Bias vulnerability assessment
- Historical bias pattern analysis
- Mitigation strategy selection
- Pre-mortem facilitation
- Devil's advocate role
- Reference class forecasting
- Calibration training
- Protocol compliance monitoring

**Used By Processes**:
- Cognitive Bias Debiasing Process
- Decision Quality Assessment
- Decision Documentation and Learning

**Required Skills**: pre-mortem-facilitator, reference-class-forecaster, calibration-trainer, decision-journal

---

#### 16. consistency-validator
**Description**: Agent specialized in validating logical consistency across decision inputs, preferences, and analyses.

**Responsibilities**:
- AHP consistency ratio checking
- Preference transitivity validation
- Assumption consistency checking
- Cross-analysis alignment
- Stakeholder preference reconciliation
- Model validation
- Data quality verification
- Discrepancy resolution guidance

**Used By Processes**:
- Multi-Criteria Decision Analysis (MCDA)
- Structured Decision Making Process
- Decision Quality Assessment

**Required Skills**: ahp-calculator, stakeholder-preference-elicitor, sensitivity-analyzer

---

### Risk and Uncertainty Agents

#### 17. risk-analyst
**Description**: Agent specialized in risk identification, quantification, and mitigation planning.

**Responsibilities**:
- Risk identification
- Probability assessment
- Impact quantification
- Risk prioritization
- Mitigation strategy development
- Residual risk evaluation
- Risk monitoring setup
- Risk communication

**Used By Processes**:
- Monte Carlo Simulation for Decision Support
- Decision Quality Assessment
- Strategic Scenario Development

**Required Skills**: risk-register-manager, value-at-risk-calculator, monte-carlo-engine, sensitivity-analyzer

---

#### 18. uncertainty-quantifier
**Description**: Agent specialized in identifying, modeling, and communicating uncertainty in decision inputs.

**Responsibilities**:
- Uncertainty source identification
- Data uncertainty assessment
- Model uncertainty evaluation
- Expert judgment elicitation
- Distribution specification
- Correlation assessment
- Value of information analysis
- Uncertainty communication

**Used By Processes**:
- Monte Carlo Simulation for Decision Support
- Structured Decision Making Process
- Predictive Analytics Implementation

**Required Skills**: risk-distribution-fitter, monte-carlo-engine, bayesian-network-analyzer

---

### Strategic Agents

#### 19. war-game-facilitator
**Description**: Agent specialized in competitive war gaming, red team exercises, and strategic response simulation.

**Responsibilities**:
- War game design
- Team briefing
- Scenario execution
- Move adjudication
- Response analysis
- Insight extraction
- Debrief facilitation
- Strategic recommendation

**Used By Processes**:
- War Gaming and Competitive Response Modeling
- Competitive Battlecard Development
- Strategic Scenario Development

**Required Skills**: war-game-orchestrator, scenario-narrative-generator, agent-based-simulator

---

#### 20. strategic-options-analyst
**Description**: Agent specialized in identifying and evaluating strategic options, flexibility value, and real options.

**Responsibilities**:
- Option identification
- Flexibility valuation
- Scenario-strategy mapping
- Robust strategy identification
- Contingent strategy design
- Hedging strategy development
- Option exercise triggers
- Strategy portfolio construction

**Used By Processes**:
- Strategic Scenario Development
- What-If Analysis Framework
- Prescriptive Analytics and Optimization

**Required Skills**: real-options-analyzer, scenario-narrative-generator, decision-tree-builder, monte-carlo-engine

---

### Knowledge and Learning Agents

#### 21. decision-archivist
**Description**: Agent specialized in decision documentation, knowledge management, and organizational learning.

**Responsibilities**:
- Decision record creation
- Context documentation
- Outcome tracking
- Pattern identification
- Lessons learned extraction
- Best practice identification
- Knowledge retrieval
- Learning synthesis

**Used By Processes**:
- Decision Documentation and Learning
- Decision Quality Assessment
- Cognitive Bias Debiasing Process

**Required Skills**: decision-journal, hypothesis-tracker, data-storytelling

---

#### 22. insight-translator
**Description**: Agent specialized in translating analytical insights into actionable business recommendations.

**Responsibilities**:
- Insight prioritization
- Business impact assessment
- Action identification
- Recommendation framing
- Stakeholder communication
- Implementation guidance
- Follow-up tracking
- Feedback integration

**Used By Processes**:
- Insight-to-Action Process
- Executive Dashboard Development
- Decision Documentation and Learning

**Required Skills**: data-storytelling, decision-visualization, kpi-tracker

---

### Integration Agents

#### 23. dss-architect
**Description**: Agent specialized in decision support system architecture, component integration, and user experience design.

**Responsibilities**:
- Requirements analysis
- Architecture design
- Component selection
- Integration planning
- Data architecture
- Model management
- UI/UX design
- Performance optimization

**Used By Processes**:
- Decision Support System Architecture Design
- Real-Time Decision Analytics Implementation
- Knowledge-Driven DSS Development

**Required Skills**: decision-visualization, kpi-tracker, linear-programming-solver

---

#### 24. real-time-decision-engineer
**Description**: Agent specialized in real-time decision support, streaming analytics, and automated decision systems.

**Responsibilities**:
- Real-time requirement analysis
- Streaming architecture design
- Alert configuration
- Automated trigger design
- Latency optimization
- Fallback mechanism design
- Monitoring setup
- Continuous improvement

**Used By Processes**:
- Real-Time Decision Analytics Implementation
- Decision Support System Architecture Design
- Operational Reporting System Design

**Required Skills**: kpi-tracker, sensitivity-analyzer, monte-carlo-engine

---

## Process to Skills/Agents Mapping

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| Executive Dashboard Development | kpi-tracker, decision-visualization, data-storytelling | dashboard-architect, insight-translator |
| Self-Service Analytics Enablement | kpi-tracker, data-storytelling | bi-analyst |
| KPI Framework Development | kpi-tracker, stakeholder-preference-elicitor | dashboard-architect, bi-analyst |
| Operational Reporting System Design | kpi-tracker, decision-visualization | dashboard-architect, real-time-decision-engineer |
| Data Visualization Standards Implementation | decision-visualization, data-storytelling | bi-analyst |
| Competitor Monitoring System Setup | competitive-intelligence-tracker | competitive-analyst |
| Competitive Battlecard Development | competitive-intelligence-tracker, data-storytelling | competitive-analyst, war-game-facilitator |
| Win/Loss Analysis Program | competitive-intelligence-tracker, causal-inference-engine | competitive-analyst |
| Industry Trend Analysis | market-research-aggregator, time-series-forecaster | competitive-analyst, market-intelligence-analyst |
| Patent and IP Intelligence Monitoring | competitive-intelligence-tracker | competitive-analyst |
| Market Sizing and Opportunity Assessment | market-research-aggregator, agent-based-simulator | market-intelligence-analyst |
| Customer Segmentation Analysis | market-research-aggregator, agent-based-simulator | market-intelligence-analyst |
| Pricing Intelligence Analysis | competitive-intelligence-tracker, sensitivity-analyzer | competitive-analyst, market-intelligence-analyst |
| Voice of Customer Integration | market-research-aggregator, data-storytelling | market-intelligence-analyst |
| Geographic Market Analysis | market-research-aggregator, topsis-ranker | market-intelligence-analyst |
| Structured Decision Making Process | decision-tree-builder, bayesian-network-analyzer, stakeholder-preference-elicitor | decision-framing-specialist, bayesian-analyst, trade-off-analyst |
| Multi-Criteria Decision Analysis (MCDA) | ahp-calculator, topsis-ranker, promethee-evaluator, electre-comparator | mcda-facilitator, consistency-validator |
| Decision Quality Assessment | decision-journal, calibration-trainer, pre-mortem-facilitator | decision-quality-assessor, debiasing-coach |
| Cognitive Bias Debiasing Process | pre-mortem-facilitator, reference-class-forecaster, calibration-trainer | debiasing-coach, decision-quality-assessor |
| Decision Documentation and Learning | decision-journal, hypothesis-tracker | decision-archivist, insight-translator |
| Strategic Scenario Development | scenario-narrative-generator, system-dynamics-modeler, sensitivity-analyzer | scenario-planner, strategic-options-analyst |
| What-If Analysis Framework | sensitivity-analyzer, monte-carlo-engine, system-dynamics-modeler | scenario-planner, probabilistic-modeler |
| Monte Carlo Simulation for Decision Support | monte-carlo-engine, risk-distribution-fitter, sensitivity-analyzer | probabilistic-modeler, uncertainty-quantifier, risk-analyst |
| War Gaming and Competitive Response Modeling | war-game-orchestrator, agent-based-simulator, scenario-narrative-generator | war-game-facilitator, scenario-planner |
| Hypothesis-Driven Analytics Process | hypothesis-tracker, causal-inference-engine | experimentation-manager |
| Predictive Analytics Implementation | time-series-forecaster, causal-inference-engine, monte-carlo-engine | predictive-analyst, uncertainty-quantifier |
| Prescriptive Analytics and Optimization | linear-programming-solver, constraint-satisfaction-solver, genetic-algorithm-optimizer | optimization-specialist, trade-off-analyst |
| A/B Testing and Experimentation Framework | causal-inference-engine, hypothesis-tracker | experimentation-manager |
| Insight-to-Action Process | data-storytelling, decision-visualization | insight-translator, decision-quality-assessor |
| Decision Support System Architecture Design | decision-visualization, kpi-tracker, linear-programming-solver | dss-architect, real-time-decision-engineer |
| Real-Time Decision Analytics Implementation | kpi-tracker, sensitivity-analyzer | real-time-decision-engineer, dss-architect |
| Knowledge-Driven DSS Development | decision-journal, bayesian-network-analyzer | dss-architect, decision-archivist |
| Collaborative Decision Support Platform | stakeholder-preference-elicitor, decision-visualization | mcda-facilitator, decision-framing-specialist |

---

## Shared Candidates (Cross-Specialization)

These skills and agents could be shared with other specializations:

### Shared Skills

1. **monte-carlo-engine** - Useful for risk analysis in Finance, Engineering, Project Management
2. **time-series-forecaster** - Applicable to Data Science, Finance, Operations
3. **causal-inference-engine** - Valuable for Data Science, Marketing Analytics, Healthcare
4. **linear-programming-solver** - Core for Operations Research, Supply Chain, Finance
5. **sensitivity-analyzer** - Universal for any quantitative analysis domain
6. **kpi-tracker** - Applicable across all business domains
7. **data-storytelling** - Useful for Technical Documentation, Marketing, Executive Communication
8. **bayesian-network-analyzer** - Valuable for Data Science, Healthcare, Risk Management

### Shared Agents

1. **predictive-analyst** - Core expertise applicable to Data Science and ML specialization
2. **optimization-specialist** - Applicable to Operations Research, Supply Chain specializations
3. **risk-analyst** - Valuable for Finance, Project Management, Compliance specializations
4. **experimentation-manager** - Applicable to Product Management, Marketing, Data Science

---

## Implementation Priority

### High Priority (Core Decision Intelligence)
1. decision-tree-builder
2. ahp-calculator
3. monte-carlo-engine
4. sensitivity-analyzer
5. decision-visualization
6. kpi-tracker
7. decision-framing-specialist (agent)
8. mcda-facilitator (agent)
9. probabilistic-modeler (agent)
10. decision-quality-assessor (agent)

### Medium Priority (Advanced Capabilities)
1. bayesian-network-analyzer
2. topsis-ranker
3. time-series-forecaster
4. causal-inference-engine
5. scenario-narrative-generator
6. pre-mortem-facilitator
7. scenario-planner (agent)
8. competitive-analyst (agent)
9. debiasing-coach (agent)
10. optimization-specialist (agent)

### Lower Priority (Specialized Use Cases)
1. promethee-evaluator
2. electre-comparator
3. system-dynamics-modeler
4. agent-based-simulator
5. real-options-analyzer
6. genetic-algorithm-optimizer
7. war-game-orchestrator
8. war-game-facilitator (agent)
9. strategic-options-analyst (agent)
10. real-time-decision-engineer (agent)

---

## Notes

- All skills should implement standardized input/output schemas for composability
- Skills should support both synchronous and asynchronous execution modes
- Agents should be able to use multiple skills in sequence or parallel
- Error handling and retry mechanisms should be built into each skill
- Monitoring and logging should be consistent across all components
- Skills should support both local and cloud-based execution where applicable
- Agents should provide detailed reasoning for their decisions for auditability
- Integration with existing BI tools (Tableau, Power BI, Looker) should be considered
- Mathematical skills should provide both numerical results and interpretive guidance
- Visualization skills should support export to multiple formats (PNG, SVG, PDF, interactive HTML)
- Preference elicitation skills should support asynchronous multi-stakeholder workflows

---

*Last updated: January 2026*

*Note: This backlog represents Phase 4 of the Decision Intelligence specialization development. Skills and agents should be prioritized based on process adoption and user demand.*
