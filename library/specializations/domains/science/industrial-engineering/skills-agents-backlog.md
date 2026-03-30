# Industrial Engineering - Skills and Agents Backlog (Phase 4)

## Overview

This backlog identifies specialized skills and agents that could enhance the Industrial Engineering processes beyond general-purpose capabilities. Each skill or agent is designed to provide domain-specific tooling, validation, or automation for industrial engineering workflows including operations research, lean manufacturing, quality engineering, ergonomics, supply chain management, and production planning.

## Summary Statistics

- **Total Skills Identified**: 42
- **Total Agents Identified**: 28
- **Shared Candidates (Cross-Specialization)**: 15
- **Categories**: 8 (Operations Research, Simulation and Queuing, Lean Manufacturing, Quality Engineering, Ergonomics and Human Factors, Supply Chain and Logistics, Production Planning, Decision Analysis)

---

## Skills

### Operations Research and Optimization Skills

#### 1. linear-program-modeler
**Description**: Mathematical programming skill for formulating and solving linear programming models for resource allocation, production planning, and capacity optimization.

**Capabilities**:
- Decision variable identification and definition
- Objective function formulation (minimize/maximize)
- Constraint modeling (equality and inequality)
- Model validation and feasibility checking
- Sensitivity analysis and shadow price interpretation
- Dual problem generation
- Model documentation in standard LP format

**Used By Processes**:
- Linear Programming Model Development
- Capacity Planning Analysis
- Production Scheduling Optimization

**Tools/Libraries**: PuLP, Pyomo, Google OR-Tools, CPLEX API, Gurobi API

---

#### 2. integer-program-solver
**Description**: Integer and mixed-integer programming skill for combinatorial optimization problems with discrete decision variables.

**Capabilities**:
- Binary and integer variable modeling
- Big-M constraint formulation
- Logical constraint linearization
- Branch and bound solution tracking
- MIP gap analysis and convergence monitoring
- Warm start solution injection
- Solution pool generation

**Used By Processes**:
- Linear Programming Model Development
- Transportation Route Optimization
- Warehouse Layout and Slotting Optimization

**Tools/Libraries**: Google OR-Tools, Gurobi, CPLEX, SCIP

---

#### 3. network-optimizer
**Description**: Network optimization skill for transportation, assignment, and flow problems on graph structures.

**Capabilities**:
- Shortest path algorithm selection (Dijkstra, Bellman-Ford, Floyd-Warshall)
- Minimum spanning tree generation
- Maximum flow / minimum cut analysis
- Minimum cost network flow modeling
- Assignment problem solving (Hungarian algorithm)
- Network simplex implementation
- Multi-commodity flow modeling

**Used By Processes**:
- Transportation Route Optimization
- Warehouse Layout and Slotting Optimization
- Capacity Planning Analysis

**Tools/Libraries**: NetworkX, Google OR-Tools, igraph

---

#### 4. vehicle-routing-solver
**Description**: Vehicle routing problem solver for logistics optimization with time windows, capacity constraints, and multiple depots.

**Capabilities**:
- CVRP (Capacitated VRP) modeling
- VRPTW (VRP with Time Windows) handling
- Multi-depot routing optimization
- Pickup and delivery problem solving
- Route visualization and mapping
- Real-time route adjustment
- Driver assignment optimization

**Used By Processes**:
- Transportation Route Optimization
- Warehouse Layout and Slotting Optimization

**Tools/Libraries**: Google OR-Tools, VROOM, OpenRouteService

---

### Simulation and Queuing Theory Skills

#### 5. discrete-event-simulator
**Description**: Discrete event simulation skill for modeling and analyzing complex systems with stochastic processes.

**Capabilities**:
- Process flow modeling with SimPy
- Entity generation with statistical distributions
- Resource capacity modeling
- Queue discipline implementation (FIFO, priority, etc.)
- Simulation warm-up period detection
- Output statistics with confidence intervals
- Animation and visualization generation

**Used By Processes**:
- Discrete Event Simulation Modeling
- Queuing System Analysis
- Capacity Planning Analysis

**Tools/Libraries**: SimPy, Ciw, salabim, custom Python simulation

---

#### 6. distribution-fitter
**Description**: Statistical distribution fitting skill for input modeling in simulation and analysis.

**Capabilities**:
- Goodness-of-fit testing (Chi-square, K-S, Anderson-Darling)
- Maximum likelihood estimation
- Distribution parameter estimation
- Inter-arrival time analysis
- Service time distribution fitting
- Empirical distribution construction
- Distribution comparison and selection

**Used By Processes**:
- Discrete Event Simulation Modeling
- Queuing System Analysis
- Demand Forecasting Model Development

**Tools/Libraries**: SciPy, fitter, statsmodels, R fitdistrplus

---

#### 7. queuing-analyzer
**Description**: Queuing theory analysis skill for analytical evaluation of waiting line systems.

**Capabilities**:
- M/M/1, M/M/c, M/G/1 model calculations
- Steady-state performance measure computation (Lq, Wq, L, W)
- Server utilization analysis
- Probability calculations (wait time > threshold)
- Erlang C for call center staffing
- Finite population models
- Network of queues analysis

**Used By Processes**:
- Queuing System Analysis
- Capacity Planning Analysis
- Discrete Event Simulation Modeling

**Tools/Libraries**: queueing (Python), queuecomputer (R), custom analytical tools

---

#### 8. simulation-experiment-designer
**Description**: Simulation experimental design skill for efficient scenario analysis and optimization.

**Capabilities**:
- Factorial experiment design for simulation
- Latin hypercube sampling
- Variance reduction techniques (common random numbers, antithetic variates)
- Ranking and selection procedures
- Metamodel fitting (response surface)
- OptQuest-style simulation optimization
- Scenario comparison with statistical tests

**Used By Processes**:
- Discrete Event Simulation Modeling
- Design of Experiments Execution
- Capacity Planning Analysis

**Tools/Libraries**: pyDOE2, SALib, scipy.stats

---

### Lean Manufacturing Skills

#### 9. value-stream-mapper
**Description**: Value stream mapping skill for current state analysis, waste identification, and future state design.

**Capabilities**:
- Current state map generation
- Process box data collection (C/T, C/O, uptime, etc.)
- Material flow visualization
- Information flow mapping
- Timeline calculation (lead time, process time)
- Seven wastes (TIMWOODS) identification
- Future state design with kaizen bursts
- Implementation roadmap generation

**Used By Processes**:
- Value Stream Mapping and Analysis
- Kaizen Event Facilitation
- Standard Work Development

**Tools/Libraries**: draw.io templates, Lucidchart, Visio, custom VSM generators

---

#### 10. takt-time-calculator
**Description**: Takt time and cycle time analysis skill for production line balancing and capacity planning.

**Capabilities**:
- Takt time calculation from demand and available time
- Cycle time measurement and analysis
- Operator cycle time tracking
- Takt time attainment monitoring
- Pitch calculation for paced withdrawal
- Planned cycle time with efficiency factors
- Overtime and shift adjustment calculations

**Used By Processes**:
- Standard Work Development
- Line Balancing Analysis
- Value Stream Mapping and Analysis

**Tools/Libraries**: Custom calculators, spreadsheet templates

---

#### 11. smed-analyzer
**Description**: Single Minute Exchange of Die analysis skill for changeover time reduction.

**Capabilities**:
- Changeover video analysis
- Internal vs external activity separation
- Activity timing and sequencing
- Conversion opportunity identification
- Parallel work assignment
- Quick-release mechanism suggestions
- Before/after comparison reports
- Standard changeover documentation

**Used By Processes**:
- Setup Time Reduction (SMED)
- Kaizen Event Facilitation
- OEE Improvement

**Tools/Libraries**: Video analysis tools, timing software

---

#### 12. five-s-auditor
**Description**: 5S workplace organization audit skill with scoring, photo documentation, and sustainability tracking.

**Capabilities**:
- Sort (Seiri) red tag analysis
- Set in Order (Seiton) layout optimization scoring
- Shine (Seiso) cleanliness inspection
- Standardize (Seiketsu) visual management assessment
- Sustain (Shitsuke) audit scheduling
- Photo documentation and comparison
- Scoring trend analysis
- Action item tracking

**Used By Processes**:
- 5S Workplace Organization Implementation
- Kaizen Event Facilitation
- Standard Work Development

**Tools/Libraries**: Mobile audit apps, photo management, checklist generators

---

#### 13. standard-work-documenter
**Description**: Standard work documentation skill for work instruction creation and maintenance.

**Capabilities**:
- Work element breakdown
- Time observation recording
- Standard work combination sheet generation
- Standard work layout diagram creation
- Job instruction breakdown sheet formatting
- Standard WIP calculation
- Visual work instruction creation
- Multi-format output (print, digital, video)

**Used By Processes**:
- Standard Work Development
- Line Balancing Analysis
- Kaizen Event Facilitation

**Tools/Libraries**: Document templates, diagram tools, video capture

---

### Quality Engineering Skills

#### 14. control-chart-analyzer
**Description**: Statistical process control chart creation and analysis skill with control limit calculation and special cause detection.

**Capabilities**:
- X-bar and R chart generation
- X-bar and S chart for large subgroups
- Individual and Moving Range (I-MR) charts
- p-chart and np-chart for attribute data
- c-chart and u-chart for defects
- Control limit calculation (3-sigma)
- Nelson rules detection
- Western Electric rules application
- Out-of-control pattern identification

**Used By Processes**:
- Statistical Process Control Implementation
- Root Cause Analysis Investigation
- OEE Improvement

**Tools/Libraries**: pyspc, qcc (R), Minitab API, custom SPC libraries

---

#### 15. process-capability-calculator
**Description**: Process capability analysis skill with Cp, Cpk, Pp, Ppk calculations and specification compliance assessment.

**Capabilities**:
- Capability index calculation (Cp, Cpk)
- Performance index calculation (Pp, Ppk)
- Specification limit analysis
- Normality testing (Shapiro-Wilk, Anderson-Darling)
- Non-normal capability analysis (Box-Cox transformation)
- PPM defect rate estimation
- Capability histogram with distribution overlay
- Six Sigma level calculation

**Used By Processes**:
- Statistical Process Control Implementation
- Design of Experiments Execution
- Root Cause Analysis Investigation

**Tools/Libraries**: scipy.stats, statsmodels, Minitab API

---

#### 16. gage-rr-analyzer
**Description**: Measurement System Analysis skill for Gage R&R studies with variance component analysis.

**Capabilities**:
- Gage R&R study design (crossed, nested)
- ANOVA variance decomposition
- Repeatability (equipment variation) calculation
- Reproducibility (appraiser variation) calculation
- Part-to-part variation analysis
- %GRR and %Contribution metrics
- Number of distinct categories (ndc)
- Measurement decision analysis
- Acceptance criteria evaluation (< 10%, 10-30%, > 30%)

**Used By Processes**:
- Statistical Process Control Implementation
- Design of Experiments Execution

**Tools/Libraries**: scipy.stats, pingouin, R MSA packages

---

#### 17. doe-designer
**Description**: Design of Experiments planning and analysis skill for factorial and response surface experiments.

**Capabilities**:
- Full factorial design generation
- Fractional factorial design with confounding analysis
- Response surface methodology (CCD, Box-Behnken)
- Screening design (Plackett-Burman, definitive screening)
- ANOVA analysis of experimental results
- Main effects and interaction plots
- Contour plots and surface plots
- Optimal factor level determination
- Confirmation run planning

**Used By Processes**:
- Design of Experiments Execution
- Root Cause Analysis Investigation
- Statistical Process Control Implementation

**Tools/Libraries**: pyDOE2, statsmodels, R DoE packages

---

#### 18. fmea-facilitator
**Description**: Failure Mode and Effects Analysis facilitation skill for risk identification and prioritization.

**Capabilities**:
- FMEA scope and boundary definition
- Failure mode brainstorming facilitation
- Severity, Occurrence, Detection rating guidance
- RPN (Risk Priority Number) calculation
- AIAG-VDA Action Priority (AP) methodology
- Control plan integration
- Recommended action tracking
- FMEA revision and living document management

**Used By Processes**:
- Failure Mode and Effects Analysis
- Root Cause Analysis Investigation
- Statistical Process Control Implementation

**Tools/Libraries**: FMEA templates, risk management tools

---

#### 19. root-cause-analyzer
**Description**: Systematic root cause analysis skill with multiple investigation methodologies.

**Capabilities**:
- Is/Is Not analysis for problem definition
- 5 Whys facilitation and documentation
- Ishikawa (fishbone) diagram generation
- Fault tree analysis (FTA) construction
- Pareto chart generation
- Hypothesis testing for cause verification
- Corrective action development
- Effectiveness verification planning

**Used By Processes**:
- Root Cause Analysis Investigation
- Failure Mode and Effects Analysis
- Kaizen Event Facilitation

**Tools/Libraries**: Diagram tools, statistical testing, templates

---

### Ergonomics and Human Factors Skills

#### 20. niosh-lifting-calculator
**Description**: NIOSH Lifting Equation calculator for manual material handling risk assessment.

**Capabilities**:
- Recommended Weight Limit (RWL) calculation
- Lifting Index (LI) computation
- Multiplier factor analysis (HM, VM, DM, AM, FM, CM)
- Single-task and multi-task analysis
- Risk level classification
- Work redesign recommendations
- Comparison of job modifications

**Used By Processes**:
- Ergonomic Risk Assessment
- Workstation Design Optimization

**Tools/Libraries**: Custom calculators, NIOSH tools, ergonomic software

---

#### 21. rula-reba-assessor
**Description**: Rapid Upper Limb Assessment (RULA) and Rapid Entire Body Assessment (REBA) skill for posture evaluation.

**Capabilities**:
- RULA scoring for upper extremity tasks
- REBA scoring for whole body postures
- Body segment angle measurement guidance
- Risk level classification
- Action level determination
- Photo/video-based assessment
- Comparative assessment reports
- Improvement recommendation generation

**Used By Processes**:
- Ergonomic Risk Assessment
- Workstation Design Optimization

**Tools/Libraries**: Assessment templates, video analysis, angle measurement

---

#### 22. anthropometric-analyzer
**Description**: Anthropometric data analysis skill for workstation design and accommodation.

**Capabilities**:
- Percentile calculations for design decisions
- Reach zone determination
- Work surface height recommendations
- Clearance dimension calculations
- Adjustability range specification
- Population accommodation analysis
- Design for 5th to 95th percentile
- Multi-population considerations

**Used By Processes**:
- Workstation Design Optimization
- Ergonomic Risk Assessment

**Tools/Libraries**: Anthropometric databases, statistical calculations

---

#### 23. workstation-layout-designer
**Description**: Workstation and workspace layout design skill with ergonomic optimization.

**Capabilities**:
- Work zone layout (primary, secondary, tertiary)
- Tool and material placement optimization
- Visual field considerations
- Lighting and visibility analysis
- Work surface height recommendations
- Seated vs standing workstation design
- Adjustable workstation specification
- Layout drawing generation

**Used By Processes**:
- Workstation Design Optimization
- 5S Workplace Organization Implementation

**Tools/Libraries**: CAD integration, layout templates, 3D visualization

---

### Supply Chain and Logistics Skills

#### 24. demand-forecaster
**Description**: Demand forecasting skill with statistical and machine learning methods.

**Capabilities**:
- Time series decomposition (trend, seasonality, residual)
- Moving average and exponential smoothing
- ARIMA/SARIMA modeling
- Prophet forecasting for business time series
- Machine learning regression models
- Forecast accuracy metrics (MAPE, MAE, RMSE, bias)
- Demand sensing and adjustment
- New product forecasting with analogies

**Used By Processes**:
- Demand Forecasting Model Development
- Inventory Optimization Analysis
- Capacity Planning Analysis

**Tools/Libraries**: statsmodels, Prophet, scikit-learn, pmdarima

---

#### 25. inventory-optimizer
**Description**: Inventory optimization skill for safety stock, reorder point, and order quantity calculations.

**Capabilities**:
- ABC/XYZ classification
- Economic Order Quantity (EOQ) calculation
- Safety stock calculation by service level
- Reorder point determination
- Periodic review (R,S) policy optimization
- Continuous review (r,Q) policy optimization
- Multi-echelon inventory optimization
- Inventory investment analysis

**Used By Processes**:
- Inventory Optimization Analysis
- Demand Forecasting Model Development
- Warehouse Layout and Slotting Optimization

**Tools/Libraries**: Custom optimization, scipy.optimize, inventory libraries

---

#### 26. warehouse-slotting-optimizer
**Description**: Warehouse slotting and layout optimization skill for pick path minimization and space utilization.

**Capabilities**:
- Product velocity analysis (ABC by picks)
- Cube movement analysis
- Pick path optimization
- Zone design and assignment
- Forward pick area sizing
- Slot assignment algorithms
- Golden zone optimization
- Slotting performance metrics

**Used By Processes**:
- Warehouse Layout and Slotting Optimization
- Inventory Optimization Analysis

**Tools/Libraries**: Optimization algorithms, simulation, heuristics

---

#### 27. facility-layout-optimizer
**Description**: Facility layout optimization skill for material flow minimization and space utilization.

**Capabilities**:
- From-To chart analysis
- Activity relationship diagramming
- CRAFT and ALDEP algorithm implementation
- Block layout generation
- Aisle design and dimensioning
- Material flow visualization
- Space requirement calculation
- Layout alternative evaluation

**Used By Processes**:
- Warehouse Layout and Slotting Optimization
- Workstation Design Optimization

**Tools/Libraries**: Layout algorithms, optimization, visualization

---

### Production Planning Skills

#### 28. capacity-planner
**Description**: Capacity requirements planning skill with demand-capacity analysis and strategic capacity decisions.

**Capabilities**:
- Capacity requirements calculation from demand
- Resource capacity documentation
- Capacity gap analysis
- Rough-cut capacity planning (RCCP)
- Detailed capacity requirements planning (CRP)
- Lead, lag, match strategy evaluation
- Make vs buy analysis
- Capacity investment justification

**Used By Processes**:
- Capacity Planning Analysis
- Production Scheduling Optimization
- Line Balancing Analysis

**Tools/Libraries**: Spreadsheet models, ERP integration, planning tools

---

#### 29. production-scheduler
**Description**: Production scheduling optimization skill with constraint handling and due date management.

**Capabilities**:
- Finite capacity scheduling
- Scheduling rule application (EDD, SPT, CR, etc.)
- Job shop scheduling algorithms
- Flow shop scheduling optimization
- Changeover sequence optimization
- Due date assignment and tracking
- Schedule visualization (Gantt charts)
- What-if scenario analysis

**Used By Processes**:
- Production Scheduling Optimization
- Capacity Planning Analysis
- Setup Time Reduction (SMED)

**Tools/Libraries**: Google OR-Tools, OptaPlanner, custom heuristics

---

#### 30. line-balancer
**Description**: Assembly line balancing skill for workload distribution and labor utilization optimization.

**Capabilities**:
- Work element time studies
- Precedence diagram construction
- Takt time-based balancing
- Ranked positional weight method
- Kilbridge and Wester method
- Balance efficiency calculation
- Balance delay analysis
- Multi-model line balancing
- U-line balancing

**Used By Processes**:
- Line Balancing Analysis
- Standard Work Development
- Capacity Planning Analysis

**Tools/Libraries**: Balancing algorithms, optimization, visualization

---

#### 31. oee-calculator
**Description**: Overall Equipment Effectiveness calculation and analysis skill.

**Capabilities**:
- OEE component calculation (Availability, Performance, Quality)
- Six big loss categorization
- Pareto analysis of losses
- OEE trending and dashboards
- World-class benchmarking
- Planned vs unplanned downtime tracking
- Speed loss and minor stoppage analysis
- Improvement target setting

**Used By Processes**:
- Overall Equipment Effectiveness Improvement
- Capacity Planning Analysis
- Setup Time Reduction (SMED)

**Tools/Libraries**: OEE calculators, dashboards, data visualization

---

### Decision Analysis Skills

#### 32. mcda-analyzer
**Description**: Multi-Criteria Decision Analysis skill for structured evaluation of alternatives.

**Capabilities**:
- Decision hierarchy construction
- AHP (Analytic Hierarchy Process) implementation
- Pairwise comparison facilitation
- Consistency ratio checking
- TOPSIS ranking methodology
- Weighted sum model
- Sensitivity analysis on criteria weights
- Decision documentation

**Used By Processes**:
- Multi-Criteria Decision Analysis
- Capacity Planning Analysis
- Warehouse Layout and Slotting Optimization

**Tools/Libraries**: AHPy, TOPSIS implementations, custom MCDA tools

---

#### 33. decision-tree-analyzer
**Description**: Decision tree analysis skill for sequential decision problems under uncertainty.

**Capabilities**:
- Decision tree construction
- Expected value calculation
- Expected value of perfect information (EVPI)
- Expected value of sample information (EVSI)
- Risk profile generation
- Sensitivity analysis
- Utility function incorporation
- Decision policy extraction

**Used By Processes**:
- Multi-Criteria Decision Analysis
- Capacity Planning Analysis

**Tools/Libraries**: Decision tree libraries, probability calculations

---

### Time Study and Work Measurement Skills

#### 34. time-study-analyzer
**Description**: Time study and work measurement skill for standard time determination.

**Capabilities**:
- Stopwatch time study recording
- Performance rating application
- Normal time calculation
- Allowance factor application
- Standard time determination
- Predetermined time systems (MOST, MTM) support
- Work sampling analysis
- Time study documentation

**Used By Processes**:
- Standard Work Development
- Line Balancing Analysis
- Ergonomic Risk Assessment

**Tools/Libraries**: Time study software, mobile apps, analysis tools

---

#### 35. work-sampling-analyzer
**Description**: Work sampling study skill for activity proportion estimation without continuous observation.

**Capabilities**:
- Sample size determination
- Random observation scheduling
- Activity category definition
- Proportion estimation with confidence intervals
- Control chart for work sampling
- Productive vs non-productive time analysis
- Allowance determination
- Study documentation

**Used By Processes**:
- Standard Work Development
- Capacity Planning Analysis

**Tools/Libraries**: Statistical calculations, scheduling tools

---

### Data Analytics and Visualization Skills

#### 36. process-mining-analyzer
**Description**: Process mining skill for discovering and analyzing actual process flows from event logs.

**Capabilities**:
- Event log preprocessing
- Process discovery (Alpha, Heuristics miner)
- Conformance checking
- Process enhancement and optimization
- Bottleneck identification
- Variant analysis
- Performance metrics extraction
- Process map visualization

**Used By Processes**:
- Value Stream Mapping and Analysis
- Root Cause Analysis Investigation
- Overall Equipment Effectiveness Improvement

**Tools/Libraries**: PM4Py, Celonis concepts, process mining algorithms

---

#### 37. operational-dashboard-generator
**Description**: Real-time operational performance dashboard skill with KPI visualization.

**Capabilities**:
- KPI definition and calculation
- Real-time data integration
- Trend visualization
- Exception alerting
- Drill-down capability
- Executive summary generation
- Mobile-responsive displays
- Automated report generation

**Used By Processes**:
- Overall Equipment Effectiveness Improvement
- Statistical Process Control Implementation
- Capacity Planning Analysis

**Tools/Libraries**: Plotly Dash, Streamlit, Grafana, Power BI

---

#### 38. pareto-analyzer
**Description**: Pareto analysis skill for prioritization and vital few identification.

**Capabilities**:
- Pareto chart generation
- 80/20 rule analysis
- Cumulative percentage calculation
- Category grouping and "other" handling
- Stratified Pareto analysis
- Before/after Pareto comparison
- Cost-weighted Pareto
- Interactive visualization

**Used By Processes**:
- Root Cause Analysis Investigation
- Overall Equipment Effectiveness Improvement
- Failure Mode and Effects Analysis

**Tools/Libraries**: matplotlib, plotly, custom visualization

---

### Continuous Improvement Skills

#### 39. kaizen-event-facilitator
**Description**: Rapid improvement event facilitation skill with team coordination and follow-up management.

**Capabilities**:
- Event charter development
- Pre-event data collection checklists
- Team selection guidance
- Workshop facilitation templates
- Countermeasure tracking
- Implementation action management
- 30-60-90 day follow-up scheduling
- Results documentation and celebration

**Used By Processes**:
- Kaizen Event Facilitation
- Value Stream Mapping and Analysis
- Setup Time Reduction (SMED)

**Tools/Libraries**: Collaboration platforms, project tracking

---

#### 40. a3-problem-solver
**Description**: A3 problem-solving and reporting skill with structured PDCA thinking.

**Capabilities**:
- A3 template facilitation
- Background and problem statement guidance
- Current condition analysis
- Target condition definition
- Root cause analysis integration
- Countermeasure development
- Implementation plan tracking
- Follow-up and learning capture

**Used By Processes**:
- Root Cause Analysis Investigation
- Kaizen Event Facilitation

**Tools/Libraries**: A3 templates, documentation tools

---

#### 41. pdca-tracker
**Description**: Plan-Do-Check-Act cycle tracking skill for continuous improvement management.

**Capabilities**:
- PDCA cycle documentation
- Plan phase milestone tracking
- Do phase implementation monitoring
- Check phase results verification
- Act phase standardization or adjustment
- Cycle iteration tracking
- Improvement portfolio management
- Lessons learned capture

**Used By Processes**:
- Kaizen Event Facilitation
- Root Cause Analysis Investigation
- Overall Equipment Effectiveness Improvement

**Tools/Libraries**: Project tracking, improvement management systems

---

#### 42. benchmarking-analyst
**Description**: Benchmarking study skill for internal, competitive, and best-in-class performance comparison.

**Capabilities**:
- Benchmark partner identification
- KPI selection and normalization
- Data collection methodology
- Performance gap analysis
- Best practice identification
- Adaptation planning
- Progress tracking
- Benchmarking database maintenance

**Used By Processes**:
- Capacity Planning Analysis
- Overall Equipment Effectiveness Improvement
- Value Stream Mapping and Analysis

**Tools/Libraries**: APQC benchmarking concepts, survey tools, analysis

---

## Agents (Subagents)

### Operations Research Agents

#### 1. operations-research-analyst
**Description**: Agent specialized in mathematical modeling and optimization for complex operational decisions.

**Responsibilities**:
- Problem formulation and model development
- Solver selection and configuration
- Solution interpretation and sensitivity analysis
- Model validation and verification
- Decision recommendation documentation
- Stakeholder communication of results

**Used By Processes**:
- Linear Programming Model Development
- Transportation Route Optimization
- Capacity Planning Analysis

**Required Skills**: linear-program-modeler, integer-program-solver, network-optimizer

---

#### 2. simulation-modeler
**Description**: Agent specialized in building and analyzing discrete event simulation models.

**Responsibilities**:
- Simulation scope and objective definition
- Input data collection and analysis
- Model development and validation
- Experiment design and execution
- Output analysis with statistical rigor
- Scenario comparison and recommendation

**Used By Processes**:
- Discrete Event Simulation Modeling
- Queuing System Analysis
- Capacity Planning Analysis

**Required Skills**: discrete-event-simulator, distribution-fitter, simulation-experiment-designer

---

#### 3. queuing-theory-specialist
**Description**: Agent specialized in queuing system analysis for capacity planning and service design.

**Responsibilities**:
- Queuing model selection and justification
- Analytical performance measure calculation
- Simulation for complex system validation
- Staffing recommendation development
- Service level tradeoff analysis
- Queue discipline optimization

**Used By Processes**:
- Queuing System Analysis
- Capacity Planning Analysis

**Required Skills**: queuing-analyzer, discrete-event-simulator, distribution-fitter

---

### Lean Manufacturing Agents

#### 4. lean-transformation-leader
**Description**: Agent specialized in leading lean transformations with value stream focus and culture development.

**Responsibilities**:
- Lean assessment and maturity evaluation
- Value stream selection and prioritization
- Transformation roadmap development
- Gemba walk facilitation
- Leader standard work implementation
- Lean culture development coaching

**Used By Processes**:
- Value Stream Mapping and Analysis
- Kaizen Event Facilitation
- 5S Workplace Organization Implementation

**Required Skills**: value-stream-mapper, kaizen-event-facilitator, five-s-auditor

---

#### 5. value-stream-analyst
**Description**: Agent specialized in value stream mapping, analysis, and improvement planning.

**Responsibilities**:
- Current state data collection coordination
- VSM creation and validation
- Waste identification and quantification
- Future state design facilitation
- Implementation roadmap development
- Value stream metrics tracking

**Used By Processes**:
- Value Stream Mapping and Analysis
- Standard Work Development
- Setup Time Reduction (SMED)

**Required Skills**: value-stream-mapper, takt-time-calculator, standard-work-documenter

---

#### 6. kaizen-facilitator
**Description**: Agent specialized in facilitating rapid improvement events with measurable results.

**Responsibilities**:
- Kaizen event planning and preparation
- Team selection and role assignment
- Workshop facilitation
- Countermeasure implementation oversight
- Results documentation and reporting
- Follow-up and sustainment monitoring

**Used By Processes**:
- Kaizen Event Facilitation
- 5S Workplace Organization Implementation
- Setup Time Reduction (SMED)

**Required Skills**: kaizen-event-facilitator, a3-problem-solver, smed-analyzer

---

#### 7. standard-work-developer
**Description**: Agent specialized in documenting and implementing standard work for consistency and improvement.

**Responsibilities**:
- Time observation planning and execution
- Best method identification
- Standard work documentation creation
- Operator training facilitation
- Audit process establishment
- Continuous improvement integration

**Used By Processes**:
- Standard Work Development
- Line Balancing Analysis
- Kaizen Event Facilitation

**Required Skills**: standard-work-documenter, time-study-analyzer, takt-time-calculator

---

### Quality Engineering Agents

#### 8. six-sigma-black-belt
**Description**: Agent specialized in leading Six Sigma DMAIC projects with statistical rigor.

**Responsibilities**:
- Project selection and scoping
- DMAIC phase execution guidance
- Statistical tool selection and application
- Team facilitation and coaching
- Tollgate review preparation
- Green Belt mentoring

**Used By Processes**:
- Design of Experiments Execution
- Statistical Process Control Implementation
- Root Cause Analysis Investigation

**Required Skills**: doe-designer, control-chart-analyzer, process-capability-calculator

---

#### 9. spc-implementation-specialist
**Description**: Agent specialized in SPC system design and implementation.

**Responsibilities**:
- Critical characteristic identification
- Control chart type selection
- Control limit establishment
- Reaction plan development
- Operator training design
- SPC system sustainability

**Used By Processes**:
- Statistical Process Control Implementation
- Root Cause Analysis Investigation

**Required Skills**: control-chart-analyzer, process-capability-calculator, gage-rr-analyzer

---

#### 10. measurement-systems-analyst
**Description**: Agent specialized in measurement system analysis and validation.

**Responsibilities**:
- MSA study planning and design
- Gage R&R study execution guidance
- Results interpretation and reporting
- Measurement system improvement recommendations
- Calibration program oversight
- Measurement uncertainty analysis

**Used By Processes**:
- Statistical Process Control Implementation
- Design of Experiments Execution

**Required Skills**: gage-rr-analyzer, process-capability-calculator

---

#### 11. root-cause-investigator
**Description**: Agent specialized in systematic problem investigation and resolution.

**Responsibilities**:
- Problem definition and containment
- Data collection planning
- Root cause investigation facilitation
- Hypothesis development and testing
- Corrective action development
- Effectiveness verification

**Used By Processes**:
- Root Cause Analysis Investigation
- Failure Mode and Effects Analysis

**Required Skills**: root-cause-analyzer, fmea-facilitator, pareto-analyzer

---

#### 12. risk-management-specialist
**Description**: Agent specialized in operational risk management with FMEA and preventive approaches.

**Responsibilities**:
- Risk identification and assessment
- FMEA facilitation and documentation
- Risk prioritization (RPN, AP)
- Control plan development
- Risk mitigation tracking
- FMEA revision management

**Used By Processes**:
- Failure Mode and Effects Analysis
- Root Cause Analysis Investigation

**Required Skills**: fmea-facilitator, root-cause-analyzer, control-chart-analyzer

---

### Ergonomics Agents

#### 13. ergonomist
**Description**: Agent specialized in ergonomic assessment and workplace design for injury prevention.

**Responsibilities**:
- Ergonomic risk screening and prioritization
- Detailed assessment execution (NIOSH, RULA, REBA)
- Risk factor quantification
- Engineering control recommendations
- Administrative control suggestions
- Reassessment and follow-up

**Used By Processes**:
- Ergonomic Risk Assessment
- Workstation Design Optimization

**Required Skills**: niosh-lifting-calculator, rula-reba-assessor, anthropometric-analyzer

---

#### 14. workstation-designer
**Description**: Agent specialized in ergonomic workstation design and optimization.

**Responsibilities**:
- Task analysis and work content documentation
- Anthropometric requirements determination
- Workstation layout design
- Tool and material presentation design
- Prototype review coordination
- Design validation and documentation

**Used By Processes**:
- Workstation Design Optimization
- Ergonomic Risk Assessment

**Required Skills**: workstation-layout-designer, anthropometric-analyzer, rula-reba-assessor

---

### Supply Chain Agents

#### 15. demand-planning-analyst
**Description**: Agent specialized in demand forecasting and analysis for supply chain planning.

**Responsibilities**:
- Historical demand analysis
- Forecasting model selection and fitting
- Forecast accuracy tracking
- Bias identification and correction
- Demand review facilitation
- New product forecasting

**Used By Processes**:
- Demand Forecasting Model Development
- Inventory Optimization Analysis
- Capacity Planning Analysis

**Required Skills**: demand-forecaster, distribution-fitter, operational-dashboard-generator

---

#### 16. inventory-analyst
**Description**: Agent specialized in inventory policy optimization and investment management.

**Responsibilities**:
- ABC/XYZ classification execution
- Safety stock optimization
- Reorder point and order quantity setting
- Service level vs inventory tradeoff analysis
- Dead stock identification
- Inventory reduction recommendations

**Used By Processes**:
- Inventory Optimization Analysis
- Demand Forecasting Model Development

**Required Skills**: inventory-optimizer, demand-forecaster, pareto-analyzer

---

#### 17. warehouse-operations-analyst
**Description**: Agent specialized in warehouse layout and slotting optimization.

**Responsibilities**:
- Order profile analysis
- Product velocity analysis
- Slotting strategy development
- Layout optimization
- Pick path analysis
- Performance measurement

**Used By Processes**:
- Warehouse Layout and Slotting Optimization
- Inventory Optimization Analysis

**Required Skills**: warehouse-slotting-optimizer, facility-layout-optimizer, pareto-analyzer

---

#### 18. logistics-optimizer
**Description**: Agent specialized in transportation and distribution network optimization.

**Responsibilities**:
- Routing problem modeling
- Vehicle routing optimization
- Network design analysis
- Mode selection evaluation
- Cost and service tradeoff analysis
- Route implementation support

**Used By Processes**:
- Transportation Route Optimization
- Warehouse Layout and Slotting Optimization

**Required Skills**: vehicle-routing-solver, network-optimizer, operational-dashboard-generator

---

### Production Planning Agents

#### 19. capacity-planning-analyst
**Description**: Agent specialized in capacity requirements planning and strategic capacity decisions.

**Responsibilities**:
- Demand-capacity gap analysis
- Capacity requirements calculation
- Bottleneck identification
- Capacity strategy development
- Investment analysis and justification
- Scenario planning facilitation

**Used By Processes**:
- Capacity Planning Analysis
- Production Scheduling Optimization
- Discrete Event Simulation Modeling

**Required Skills**: capacity-planner, demand-forecaster, discrete-event-simulator

---

#### 20. master-scheduler
**Description**: Agent specialized in production scheduling and order promising.

**Responsibilities**:
- Master schedule development
- Finite capacity scheduling
- Order prioritization
- Schedule optimization
- Exception management
- Schedule performance tracking

**Used By Processes**:
- Production Scheduling Optimization
- Capacity Planning Analysis

**Required Skills**: production-scheduler, capacity-planner, oee-calculator

---

#### 21. line-balancing-specialist
**Description**: Agent specialized in assembly line balancing and workload optimization.

**Responsibilities**:
- Work element documentation
- Precedence relationship mapping
- Line balance calculation
- Alternative evaluation
- Implementation planning
- Balance efficiency tracking

**Used By Processes**:
- Line Balancing Analysis
- Standard Work Development
- Capacity Planning Analysis

**Required Skills**: line-balancer, time-study-analyzer, takt-time-calculator

---

#### 22. oee-improvement-specialist
**Description**: Agent specialized in OEE measurement and improvement.

**Responsibilities**:
- OEE measurement system establishment
- Loss categorization and tracking
- Pareto analysis of losses
- Focused improvement facilitation
- Autonomous maintenance support
- OEE trending and reporting

**Used By Processes**:
- Overall Equipment Effectiveness Improvement
- Capacity Planning Analysis
- Setup Time Reduction (SMED)

**Required Skills**: oee-calculator, pareto-analyzer, smed-analyzer

---

### Decision Analysis Agents

#### 23. decision-analyst
**Description**: Agent specialized in structured decision analysis for complex multi-criteria problems.

**Responsibilities**:
- Decision problem structuring
- Stakeholder preference elicitation
- Alternative evaluation facilitation
- Sensitivity analysis execution
- Decision recommendation development
- Documentation and communication

**Used By Processes**:
- Multi-Criteria Decision Analysis
- Capacity Planning Analysis

**Required Skills**: mcda-analyzer, decision-tree-analyzer

---

### Continuous Improvement Agents

#### 24. a3-coach
**Description**: Agent specialized in A3 problem-solving coaching and capability development.

**Responsibilities**:
- A3 thinking coaching
- Problem statement refinement guidance
- Root cause investigation coaching
- Countermeasure review
- PDCA cycle mentoring
- Organizational capability building

**Used By Processes**:
- Root Cause Analysis Investigation
- Kaizen Event Facilitation

**Required Skills**: a3-problem-solver, root-cause-analyzer, pdca-tracker

---

#### 25. operational-excellence-leader
**Description**: Agent specialized in operational excellence program design and deployment.

**Responsibilities**:
- OpEx strategy development
- Methodology integration (Lean, Six Sigma, TOC)
- Capability building program design
- Deployment roadmap creation
- Progress tracking and reporting
- Sustainability mechanisms

**Used By Processes**:
- Value Stream Mapping and Analysis
- Kaizen Event Facilitation
- Overall Equipment Effectiveness Improvement

**Required Skills**: value-stream-mapper, kaizen-event-facilitator, benchmarking-analyst

---

### Analytics Agents

#### 26. industrial-data-analyst
**Description**: Agent specialized in operational data analysis and visualization for industrial systems.

**Responsibilities**:
- Data collection and validation
- Statistical analysis execution
- Performance visualization development
- Trend identification and reporting
- Exception alerting configuration
- Decision support reporting

**Used By Processes**:
- Statistical Process Control Implementation
- Overall Equipment Effectiveness Improvement
- Capacity Planning Analysis

**Required Skills**: operational-dashboard-generator, pareto-analyzer, process-mining-analyzer

---

#### 27. process-mining-specialist
**Description**: Agent specialized in process mining for operational process discovery and improvement.

**Responsibilities**:
- Event log preparation
- Process discovery and mapping
- Conformance analysis
- Bottleneck identification
- Variant analysis
- Process improvement recommendations

**Used By Processes**:
- Value Stream Mapping and Analysis
- Root Cause Analysis Investigation

**Required Skills**: process-mining-analyzer, value-stream-mapper, operational-dashboard-generator

---

#### 28. work-measurement-analyst
**Description**: Agent specialized in work measurement and standards development.

**Responsibilities**:
- Time study planning and execution
- Work sampling study design
- Standard time calculation
- Allowance determination
- Standards documentation
- Standards maintenance program

**Used By Processes**:
- Standard Work Development
- Line Balancing Analysis
- Capacity Planning Analysis

**Required Skills**: time-study-analyzer, work-sampling-analyzer, standard-work-documenter

---

## Process to Skills/Agents Mapping

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| Linear Programming Model Development | linear-program-modeler, integer-program-solver | operations-research-analyst |
| Discrete Event Simulation Modeling | discrete-event-simulator, distribution-fitter, simulation-experiment-designer | simulation-modeler |
| Queuing System Analysis | queuing-analyzer, discrete-event-simulator, distribution-fitter | queuing-theory-specialist, simulation-modeler |
| Multi-Criteria Decision Analysis | mcda-analyzer, decision-tree-analyzer | decision-analyst |
| Value Stream Mapping and Analysis | value-stream-mapper, takt-time-calculator | lean-transformation-leader, value-stream-analyst |
| Kaizen Event Facilitation | kaizen-event-facilitator, a3-problem-solver | kaizen-facilitator, a3-coach |
| 5S Workplace Organization Implementation | five-s-auditor, standard-work-documenter | kaizen-facilitator, lean-transformation-leader |
| Standard Work Development | standard-work-documenter, time-study-analyzer, takt-time-calculator | standard-work-developer, work-measurement-analyst |
| Statistical Process Control Implementation | control-chart-analyzer, process-capability-calculator, gage-rr-analyzer | spc-implementation-specialist, measurement-systems-analyst |
| Design of Experiments Execution | doe-designer, process-capability-calculator | six-sigma-black-belt |
| Failure Mode and Effects Analysis | fmea-facilitator, root-cause-analyzer | risk-management-specialist, root-cause-investigator |
| Root Cause Analysis Investigation | root-cause-analyzer, pareto-analyzer, a3-problem-solver | root-cause-investigator, a3-coach |
| Ergonomic Risk Assessment | niosh-lifting-calculator, rula-reba-assessor, anthropometric-analyzer | ergonomist |
| Workstation Design Optimization | workstation-layout-designer, anthropometric-analyzer | workstation-designer, ergonomist |
| Demand Forecasting Model Development | demand-forecaster, distribution-fitter | demand-planning-analyst |
| Inventory Optimization Analysis | inventory-optimizer, demand-forecaster, pareto-analyzer | inventory-analyst, demand-planning-analyst |
| Warehouse Layout and Slotting Optimization | warehouse-slotting-optimizer, facility-layout-optimizer | warehouse-operations-analyst, logistics-optimizer |
| Transportation Route Optimization | vehicle-routing-solver, network-optimizer | logistics-optimizer, operations-research-analyst |
| Capacity Planning Analysis | capacity-planner, demand-forecaster, discrete-event-simulator | capacity-planning-analyst, demand-planning-analyst |
| Production Scheduling Optimization | production-scheduler, capacity-planner | master-scheduler, capacity-planning-analyst |
| Overall Equipment Effectiveness Improvement | oee-calculator, pareto-analyzer, smed-analyzer | oee-improvement-specialist |
| Line Balancing Analysis | line-balancer, time-study-analyzer, takt-time-calculator | line-balancing-specialist, standard-work-developer |
| Setup Time Reduction (SMED) | smed-analyzer, standard-work-documenter | kaizen-facilitator, oee-improvement-specialist |

---

## Shared Candidates (Cross-Specialization)

These skills and agents could be shared with other specializations:

### Shared Skills

1. **demand-forecaster** - Useful for Supply Chain, Finance, Marketing, and Sales domains
2. **discrete-event-simulator** - Applicable to Software Performance, Healthcare Operations, Service Operations
3. **vehicle-routing-solver** - Useful for Logistics, Field Service, and Delivery Operations domains
4. **control-chart-analyzer** - Applicable to Quality Assurance, Software Testing, and Process Control domains
5. **process-capability-calculator** - Useful for Quality Engineering, Manufacturing, and Compliance domains
6. **mcda-analyzer** - Applicable to Business Strategy, Product Management, and Investment Analysis
7. **operational-dashboard-generator** - Useful for any domain requiring KPI visualization
8. **root-cause-analyzer** - Applicable to IT Service Management, Software Debugging, and Quality domains
9. **pareto-analyzer** - Universal tool for prioritization across all domains
10. **benchmarking-analyst** - Useful for Strategy, Finance, and Competitive Analysis specializations

### Shared Agents

1. **simulation-modeler** - Process simulation applicable to Healthcare, Service Operations, Logistics
2. **decision-analyst** - Decision analysis applicable to Strategy, Finance, Product Management
3. **demand-planning-analyst** - Demand forecasting applicable to Supply Chain, Marketing, Finance
4. **industrial-data-analyst** - Operational analytics applicable to any data-driven domain
5. **a3-coach** - Problem-solving coaching applicable to Engineering, IT, Product Development

---

## Implementation Priority

### High Priority (Core Industrial Engineering Workflows)

1. linear-program-modeler
2. discrete-event-simulator
3. value-stream-mapper
4. control-chart-analyzer
5. doe-designer
6. demand-forecaster
7. production-scheduler
8. capacity-planner
9. root-cause-analyzer
10. operations-research-analyst (agent)
11. six-sigma-black-belt (agent)
12. lean-transformation-leader (agent)

### Medium Priority (Advanced Capabilities)

1. queuing-analyzer
2. distribution-fitter
3. vehicle-routing-solver
4. inventory-optimizer
5. line-balancer
6. oee-calculator
7. fmea-facilitator
8. niosh-lifting-calculator
9. mcda-analyzer
10. simulation-modeler (agent)
11. capacity-planning-analyst (agent)
12. ergonomist (agent)

### Lower Priority (Specialized Use Cases)

1. network-optimizer
2. smed-analyzer
3. warehouse-slotting-optimizer
4. anthropometric-analyzer
5. process-mining-analyzer
6. work-sampling-analyzer
7. decision-tree-analyzer
8. process-mining-specialist (agent)
9. work-measurement-analyst (agent)
10. logistics-optimizer (agent)

---

## Notes

- All skills should implement standardized input/output schemas for composability with industrial data formats
- Skills should support both real-time and batch processing modes for production and planning cycles
- Agents should maintain audit trails for all operational decisions and recommendations
- Error handling should include escalation procedures and notification mechanisms
- Skills should support integration with common ERP systems (SAP, Oracle, Microsoft Dynamics)
- Statistical skills should use industry-standard calculations consistent with ASQ, AIAG, and ISO standards
- Optimization skills should support multiple solvers with automatic solver selection
- Simulation skills should support both rapid prototyping and detailed production models
- Visualization outputs should support both digital dashboards and printable formats for shop floor use
- Skills should handle multiple units of measure and currency where applicable
- Agents should provide documented rationale for recommendations to support continuous learning
- Real-time skills should support event-driven triggers for immediate response to operational conditions
- Skills should be configurable to industry-specific requirements (automotive, aerospace, pharmaceutical, healthcare)
- Integration with Manufacturing Execution Systems (MES) and SCADA should be prioritized for real-time data
- Skills should support multi-site operations with appropriate data aggregation and comparison
- Lean skills should support both manufacturing and service/transactional environments

---

*Last Updated: January 2026*
