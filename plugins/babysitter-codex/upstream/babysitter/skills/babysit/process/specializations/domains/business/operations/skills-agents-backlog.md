# Operations Management - Skills and Agents Backlog (Phase 4)

## Overview

This backlog identifies specialized skills and agents that could enhance the Operations Management processes beyond general-purpose capabilities. Each skill or agent is designed to provide domain-specific tooling, validation, or automation for operational workflows including Lean, Six Sigma, Theory of Constraints, capacity planning, and quality management.

## Summary Statistics

- **Total Skills Identified**: 35
- **Total Agents Identified**: 24
- **Shared Candidates (Cross-Specialization)**: 12
- **Categories**: 8 (Lean Operations, Six Sigma/SPC, Theory of Constraints, Capacity Planning, Quality Management, Continuous Improvement, Operational Analytics, Workflow Automation)

---

## Skills

### Lean Operations Skills

#### 1. value-stream-mapper
**Description**: Value stream mapping skill for current state analysis, waste identification, and future state design with implementation roadmaps.

**Capabilities**:
- Current state process flow mapping
- Material and information flow visualization
- Lead time and cycle time calculation
- Value-added vs. non-value-added time analysis
- Seven wastes (TIMWOODS) identification
- Future state design with improvement targets
- Implementation roadmap generation

**Used By Processes**:
- LEAN-001: Value Stream Mapping
- LEAN-003: Kaizen Event Facilitation
- CI-001: Operational Excellence Program Design

**Tools/Libraries**: Process mining tools, Visio/Lucidchart APIs, VSM templates

---

#### 2. five-s-auditor
**Description**: 5S workplace organization audit skill with scoring, photo documentation, and sustainability tracking.

**Capabilities**:
- Sort (Seiri) red tag analysis
- Set in Order (Seiton) layout optimization
- Shine (Seiso) cleanliness standards
- Standardize (Seiketsu) visual management
- Sustain (Shitsuke) audit scheduling
- Audit scoring with trend analysis
- Action item tracking

**Used By Processes**:
- LEAN-002: 5S Implementation
- QMS-003: Quality Audit Management
- CI-001: Operational Excellence Program Design

**Tools/Libraries**: Mobile audit apps, photo analysis, checklist generators

---

#### 3. kaizen-event-facilitator
**Description**: Rapid improvement workshop planning and execution skill with team coordination, metrics tracking, and follow-up management.

**Capabilities**:
- Event charter development
- Cross-functional team assembly
- Problem statement formulation
- Root cause analysis facilitation
- Countermeasure prioritization
- Implementation action tracking
- 30-60-90 day follow-up scheduling

**Used By Processes**:
- LEAN-003: Kaizen Event Facilitation
- CI-002: A3 Problem Solving
- SIX-005: Root Cause Analysis

**Tools/Libraries**: Collaboration platforms, project tracking, video conferencing APIs

---

#### 4. kanban-system-designer
**Description**: Pull-based production control system design skill with WIP limits, replenishment triggers, and visual management boards.

**Capabilities**:
- Kanban sizing calculation
- WIP limit determination
- Supermarket design
- Signal mechanism configuration
- Pull system simulation
- Heijunka box design
- Electronic kanban (e-kanban) configuration

**Used By Processes**:
- LEAN-004: Kanban System Design
- TOC-002: Drum-Buffer-Rope Scheduling
- CAP-002: Production Scheduling Optimization

**Tools/Libraries**: Kanban software APIs, inventory management systems, simulation tools

---

#### 5. standard-work-documenter
**Description**: Standardized work procedure documentation skill with time observations, work sequence analysis, and visual work instructions.

**Capabilities**:
- Time observation and measurement
- Takt time calculation
- Work element breakdown
- Standard work combination sheet
- Work sequence documentation
- Standard WIP calculation
- Visual work instruction creation

**Used By Processes**:
- LEAN-005: Standard Work Documentation
- LEAN-002: 5S Implementation
- QMS-001: ISO 9001 Implementation

**Tools/Libraries**: Time study software, video analysis, document management systems

---

### Six Sigma and Statistical Process Control Skills

#### 6. dmaic-project-manager
**Description**: DMAIC methodology execution skill with tollgate reviews, documentation templates, and project tracking.

**Capabilities**:
- Project charter development
- SIPOC diagram generation
- CTQ (Critical to Quality) tree construction
- Tollgate review facilitation
- Phase documentation management
- Deliverable tracking
- Benefit quantification

**Used By Processes**:
- SIX-001: DMAIC Project Execution
- CI-001: Operational Excellence Program Design
- SIX-005: Root Cause Analysis

**Tools/Libraries**: Project management platforms, Six Sigma templates, tracking tools

---

#### 7. control-chart-analyzer
**Description**: Statistical process control chart creation and analysis skill with control limit calculation and special cause detection.

**Capabilities**:
- X-bar and R chart creation
- Individual and Moving Range (I-MR) charts
- p-chart and np-chart generation
- c-chart and u-chart analysis
- Control limit calculation
- Nelson rules application
- Western Electric rules detection
- Out-of-control signal alerting

**Used By Processes**:
- SIX-002: Statistical Process Control Implementation
- SIX-003: Process Capability Analysis
- QMS-003: Quality Audit Management

**Tools/Libraries**: Minitab API, JMP, Python scipy/statsmodels, R quality packages

---

#### 8. process-capability-calculator
**Description**: Process capability analysis skill with Cp, Cpk, Pp, Ppk calculations and specification compliance assessment.

**Capabilities**:
- Capability index calculation (Cp, Cpk, Pp, Ppk)
- Specification limit analysis
- Process performance metrics
- Normality testing
- Non-normal data transformation
- Capability histogram generation
- PPM defect rate estimation

**Used By Processes**:
- SIX-003: Process Capability Analysis
- SIX-002: Statistical Process Control Implementation
- QMS-004: Cost of Quality Analysis

**Tools/Libraries**: Statistical software APIs, quality analysis libraries

---

#### 9. gage-rr-analyzer
**Description**: Measurement System Analysis (MSA) skill for Gage R&R studies with variance component analysis and measurement adequacy assessment.

**Capabilities**:
- Gage R&R study design
- ANOVA variance decomposition
- Repeatability analysis
- Reproducibility analysis
- %GRR calculation
- Number of distinct categories
- Measurement bias and linearity
- Acceptance criteria evaluation

**Used By Processes**:
- SIX-004: Measurement System Analysis
- SIX-002: Statistical Process Control Implementation
- QMS-003: Quality Audit Management

**Tools/Libraries**: Minitab API, statistical analysis packages

---

#### 10. root-cause-analyzer
**Description**: Systematic root cause identification skill with 5 Whys, fishbone diagrams, fault tree analysis, and hypothesis testing.

**Capabilities**:
- 5 Whys facilitation
- Ishikawa (fishbone) diagram creation
- Fault tree analysis (FTA)
- Hypothesis formulation
- Chi-square testing
- Correlation analysis
- Pareto chart generation
- Root cause verification

**Used By Processes**:
- SIX-005: Root Cause Analysis
- QMS-005: FMEA Facilitation
- CI-002: A3 Problem Solving

**Tools/Libraries**: Cause analysis tools, statistical testing libraries

---

### Theory of Constraints Skills

#### 11. constraint-identifier
**Description**: System bottleneck identification and exploitation skill with throughput analysis and five focusing steps implementation.

**Capabilities**:
- Bottleneck identification algorithms
- Throughput rate analysis
- Constraint exploitation strategies
- Subordination planning
- Buffer sizing calculation
- Constraint elevation options
- Drum identification

**Used By Processes**:
- TOC-001: Constraint Identification and Exploitation
- TOC-002: Drum-Buffer-Rope Scheduling
- CAP-001: Capacity Requirements Planning

**Tools/Libraries**: Simulation software, throughput analysis tools

---

#### 12. dbr-scheduler
**Description**: Drum-Buffer-Rope scheduling skill for constraint-based production pacing with buffer management.

**Capabilities**:
- Drum schedule generation
- Time buffer calculation
- Shipping buffer management
- Constraint buffer monitoring
- Rope release scheduling
- Buffer penetration tracking
- Schedule synchronization

**Used By Processes**:
- TOC-002: Drum-Buffer-Rope Scheduling
- CAP-002: Production Scheduling Optimization
- TOC-001: Constraint Identification and Exploitation

**Tools/Libraries**: Production scheduling systems, ERP integration APIs

---

#### 13. throughput-accountant
**Description**: TOC financial metrics skill for throughput, inventory, and operating expense analysis with decision support.

**Capabilities**:
- Throughput calculation (T)
- Inventory valuation (I)
- Operating expense tracking (OE)
- Net profit computation
- ROI analysis
- Product mix optimization
- Make vs. buy decisions
- Investment justification

**Used By Processes**:
- TOC-003: Throughput Accounting Analysis
- TOC-001: Constraint Identification and Exploitation
- CAP-001: Capacity Requirements Planning

**Tools/Libraries**: Financial analysis tools, ERP integration

---

#### 14. critical-chain-scheduler
**Description**: Critical Chain Project Management (CCPM) skill with buffer management and resource leveling.

**Capabilities**:
- Critical chain identification
- Project buffer sizing
- Feeding buffer calculation
- Resource buffer placement
- Multi-project buffer management
- Buffer consumption tracking
- Relay runner behavior monitoring

**Used By Processes**:
- TOC-004: Critical Chain Project Management
- CAP-002: Production Scheduling Optimization

**Tools/Libraries**: Project management APIs, scheduling optimization tools

---

### Capacity Planning and Scheduling Skills

#### 15. capacity-planner
**Description**: Capacity requirements planning skill with demand-capacity gap analysis and capacity strategy recommendations.

**Capabilities**:
- Capacity requirements calculation
- Demand forecast integration
- Gap analysis visualization
- Lead, lag, match strategy modeling
- Resource loading analysis
- Rough-cut capacity planning
- What-if scenario analysis
- Capacity investment justification

**Used By Processes**:
- CAP-001: Capacity Requirements Planning
- CAP-003: Sales and Operations Planning
- CAP-002: Production Scheduling Optimization

**Tools/Libraries**: ERP/MRP systems, capacity planning software

---

#### 16. production-scheduler
**Description**: Production scheduling optimization skill with constraint handling, changeover minimization, and due date management.

**Capabilities**:
- Finite capacity scheduling
- Changeover sequence optimization
- Due date prioritization
- Machine assignment optimization
- Setup time reduction
- Order splitting strategies
- Schedule compression techniques
- Real-time rescheduling

**Used By Processes**:
- CAP-002: Production Scheduling Optimization
- TOC-002: Drum-Buffer-Rope Scheduling
- LEAN-004: Kanban System Design

**Tools/Libraries**: Scheduling algorithms, optimization solvers (Gurobi, CPLEX, OR-Tools)

---

#### 17. sop-facilitator
**Description**: Sales and Operations Planning process facilitation skill with demand-supply balancing and cross-functional alignment.

**Capabilities**:
- Demand plan aggregation
- Supply plan development
- Gap reconciliation
- Executive S&OP meeting facilitation
- Scenario planning
- Financial impact analysis
- Consensus forecasting
- Performance tracking

**Used By Processes**:
- CAP-003: Sales and Operations Planning
- CAP-001: Capacity Requirements Planning
- CAP-004: Demand Forecasting and Analysis

**Tools/Libraries**: S&OP platforms (Kinaxis, o9), collaboration tools

---

#### 18. demand-forecaster
**Description**: Demand forecasting skill with quantitative and qualitative methods, accuracy measurement, and bias correction.

**Capabilities**:
- Time series forecasting (ARIMA, exponential smoothing)
- Causal modeling
- Machine learning forecasts
- Forecast accuracy metrics (MAPE, MAE, bias)
- Collaborative forecasting
- Demand sensing
- Seasonality adjustment
- New product forecasting

**Used By Processes**:
- CAP-004: Demand Forecasting and Analysis
- CAP-003: Sales and Operations Planning
- CAP-001: Capacity Requirements Planning

**Tools/Libraries**: Python statsmodels, Prophet, ML libraries, demand planning systems

---

### Quality Management Skills

#### 19. iso-implementation-guide
**Description**: ISO 9001:2015 Quality Management System implementation skill with gap assessment and documentation templates.

**Capabilities**:
- Gap assessment against ISO 9001:2015
- QMS documentation generation
- Process procedure templates
- Context of organization analysis
- Risk-based thinking integration
- Document control setup
- Management review facilitation
- Certification readiness assessment

**Used By Processes**:
- QMS-001: ISO 9001 Implementation
- QMS-003: Quality Audit Management
- CI-001: Operational Excellence Program Design

**Tools/Libraries**: QMS software, document management systems

---

#### 20. tqm-program-designer
**Description**: Total Quality Management program development skill with culture assessment and deployment planning.

**Capabilities**:
- TQM maturity assessment
- Quality culture survey design
- Employee involvement programs
- Customer focus initiatives
- Process approach mapping
- Continuous improvement integration
- Quality council establishment
- Recognition program design

**Used By Processes**:
- QMS-002: TQM Program Development
- CI-001: Operational Excellence Program Design
- QMS-001: ISO 9001 Implementation

**Tools/Libraries**: Survey tools, culture assessment frameworks

---

#### 21. quality-auditor
**Description**: Internal quality audit skill with planning, execution, findings documentation, and corrective action tracking.

**Capabilities**:
- Audit program planning
- Audit checklist generation
- Finding classification (major/minor/observation)
- Nonconformance documentation
- Corrective action request (CAR) creation
- Root cause requirement
- Effectiveness verification
- Audit report generation

**Used By Processes**:
- QMS-003: Quality Audit Management
- QMS-001: ISO 9001 Implementation
- LEAN-002: 5S Implementation

**Tools/Libraries**: Audit management software, QMS platforms

---

#### 22. cost-of-quality-analyzer
**Description**: Cost of Quality analysis skill with prevention, appraisal, internal failure, and external failure cost tracking.

**Capabilities**:
- Prevention cost identification
- Appraisal cost tracking
- Internal failure cost calculation
- External failure cost estimation
- COQ ratio analysis
- Hidden factory costs
- Quality investment ROI
- Improvement prioritization

**Used By Processes**:
- QMS-004: Cost of Quality Analysis
- QMS-002: TQM Program Development
- CI-001: Operational Excellence Program Design

**Tools/Libraries**: Cost accounting systems, quality cost databases

---

#### 23. fmea-facilitator
**Description**: Failure Mode and Effects Analysis facilitation skill for products and processes with risk prioritization and control implementation.

**Capabilities**:
- DFMEA (Design) facilitation
- PFMEA (Process) facilitation
- Severity/Occurrence/Detection scoring
- RPN (Risk Priority Number) calculation
- Action priority determination
- Control plan integration
- Recommended action tracking
- FMEA revision management

**Used By Processes**:
- QMS-005: FMEA Facilitation
- SIX-005: Root Cause Analysis
- QMS-001: ISO 9001 Implementation

**Tools/Libraries**: FMEA software, AIAG templates, risk management tools

---

### Continuous Improvement Skills

#### 24. opex-program-designer
**Description**: Operational Excellence program design skill with governance structure, methodology deployment, and capability building.

**Capabilities**:
- OpEx vision and strategy development
- Governance model design
- Methodology selection and integration
- Capability maturity assessment
- Training curriculum development
- Certification pathway design
- Deployment roadmap creation
- Sustainability mechanisms

**Used By Processes**:
- CI-001: Operational Excellence Program Design
- QMS-002: TQM Program Development
- LEAN-001: Value Stream Mapping

**Tools/Libraries**: Maturity assessment frameworks, training management systems

---

#### 25. a3-problem-solver
**Description**: A3 problem-solving and status reporting skill with structured thinking and coaching support.

**Capabilities**:
- A3 template facilitation
- Problem statement crafting
- Current condition analysis
- Target condition definition
- Gap analysis
- Root cause investigation
- Countermeasure development
- Follow-up tracking

**Used By Processes**:
- CI-002: A3 Problem Solving
- LEAN-003: Kaizen Event Facilitation
- SIX-005: Root Cause Analysis

**Tools/Libraries**: A3 templates, coaching frameworks

---

#### 26. benchmarking-analyst
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
- CI-003: Benchmarking Program
- CI-001: Operational Excellence Program Design
- QMS-002: TQM Program Development

**Tools/Libraries**: APQC benchmarking database, industry consortiums, survey tools

---

### Operational Analytics Skills

#### 27. oee-calculator
**Description**: Overall Equipment Effectiveness calculation and analysis skill with availability, performance, and quality tracking.

**Capabilities**:
- Availability calculation
- Performance rate tracking
- Quality rate measurement
- OEE trending and dashboards
- Six big loss categorization
- Pareto of losses
- Improvement target setting
- World-class benchmarking

**Used By Processes**:
- LEAN-001: Value Stream Mapping
- SIX-002: Statistical Process Control Implementation
- CI-003: Benchmarking Program

**Tools/Libraries**: MES integration, OEE software, real-time dashboards

---

#### 28. cycle-time-analyzer
**Description**: Cycle time analysis and reduction skill with process timing, bottleneck identification, and flow improvement.

**Capabilities**:
- Time and motion study
- Cycle time distribution analysis
- Takt time comparison
- Line balancing analysis
- Bottleneck visualization
- Queue time identification
- Value stream cycle efficiency
- Improvement simulation

**Used By Processes**:
- LEAN-001: Value Stream Mapping
- LEAN-005: Standard Work Documentation
- TOC-001: Constraint Identification and Exploitation

**Tools/Libraries**: Time study software, process mining tools

---

#### 29. process-simulation-modeler
**Description**: Discrete event simulation skill for process modeling, scenario testing, and optimization.

**Capabilities**:
- Process flow modeling
- Resource allocation simulation
- Queue behavior analysis
- Scenario comparison
- What-if analysis
- Capacity optimization
- Layout simulation
- Monte Carlo simulation

**Used By Processes**:
- LEAN-004: Kanban System Design
- CAP-001: Capacity Requirements Planning
- TOC-002: Drum-Buffer-Rope Scheduling

**Tools/Libraries**: AnyLogic, FlexSim, Simio, SimPy

---

#### 30. operational-dashboard-generator
**Description**: Real-time operational performance dashboard skill with KPI visualization and alerting.

**Capabilities**:
- KPI definition and calculation
- Real-time data integration
- Visual management displays
- Trend analysis
- Alert threshold configuration
- Drill-down reporting
- Mobile dashboard access
- Executive summary generation

**Used By Processes**:
- CI-001: Operational Excellence Program Design
- SIX-002: Statistical Process Control Implementation
- QMS-003: Quality Audit Management

**Tools/Libraries**: Power BI, Tableau, Grafana, real-time data platforms

---

### Workflow Automation Skills

#### 31. resource-scheduler
**Description**: Resource scheduling and assignment optimization skill for personnel and equipment allocation.

**Capabilities**:
- Skill-based assignment
- Shift scheduling
- Overtime optimization
- Cross-training utilization
- Equipment allocation
- Maintenance window scheduling
- Conflict resolution
- Schedule publication

**Used By Processes**:
- CAP-002: Production Scheduling Optimization
- CAP-001: Capacity Requirements Planning
- TOC-002: Drum-Buffer-Rope Scheduling

**Tools/Libraries**: Workforce management systems, scheduling optimization

---

#### 32. workflow-automator
**Description**: Operational workflow automation skill with task sequencing, approval routing, and exception handling.

**Capabilities**:
- Workflow design
- Task sequencing
- Approval routing configuration
- Notification automation
- Exception handling rules
- Escalation pathways
- Audit trail generation
- Integration with operational systems

**Used By Processes**:
- LEAN-005: Standard Work Documentation
- QMS-001: ISO 9001 Implementation
- CI-001: Operational Excellence Program Design

**Tools/Libraries**: Workflow platforms, RPA tools, business process management

---

#### 33. changeover-optimizer
**Description**: Setup and changeover time reduction skill with SMED methodology and sequence optimization.

**Capabilities**:
- Internal/external setup separation
- Changeover video analysis
- Parallel task identification
- Standardization opportunities
- Quick-release mechanisms
- Sequence optimization
- Changeover matrix
- Time reduction tracking

**Used By Processes**:
- LEAN-004: Kanban System Design
- CAP-002: Production Scheduling Optimization
- LEAN-003: Kaizen Event Facilitation

**Tools/Libraries**: Video analysis tools, SMED templates

---

#### 34. inventory-optimizer
**Description**: Inventory management optimization skill with safety stock calculation, reorder point determination, and ABC analysis.

**Capabilities**:
- ABC/XYZ classification
- Safety stock calculation
- Reorder point optimization
- EOQ calculation
- Inventory turn analysis
- Dead stock identification
- Carrying cost analysis
- Service level optimization

**Used By Processes**:
- LEAN-004: Kanban System Design
- CAP-003: Sales and Operations Planning
- TOC-001: Constraint Identification and Exploitation

**Tools/Libraries**: Inventory management systems, optimization algorithms

---

#### 35. maintenance-scheduler
**Description**: Maintenance planning and scheduling skill with TPM integration and predictive maintenance support.

**Capabilities**:
- Preventive maintenance scheduling
- Autonomous maintenance checklists
- Predictive maintenance integration
- Spare parts planning
- Work order management
- MTBF/MTTR tracking
- Maintenance backlog management
- TPM pillar support

**Used By Processes**:
- LEAN-005: Standard Work Documentation
- CAP-002: Production Scheduling Optimization
- QMS-001: ISO 9001 Implementation

**Tools/Libraries**: CMMS systems (Maximo, SAP PM, Fiix), IoT sensors

---

## Agents

### Lean Operations Agents

#### 1. lean-transformation-leader
**Description**: Agent specialized in leading lean transformations with hoshin kanri deployment and culture change management.

**Responsibilities**:
- Lean assessment and roadmap development
- Hoshin kanri policy deployment
- Leader standard work implementation
- Gemba walk facilitation
- Lean culture development
- Transformation progress tracking

**Used By Processes**:
- LEAN-001: Value Stream Mapping
- CI-001: Operational Excellence Program Design
- LEAN-003: Kaizen Event Facilitation

**Required Skills**: value-stream-mapper, opex-program-designer, kaizen-event-facilitator

---

#### 2. value-stream-analyst
**Description**: Agent specialized in value stream mapping, analysis, and improvement planning.

**Responsibilities**:
- Current state mapping facilitation
- Waste identification and quantification
- Future state design
- Implementation roadmap creation
- Value stream performance tracking
- Cross-functional coordination

**Used By Processes**:
- LEAN-001: Value Stream Mapping
- LEAN-004: Kanban System Design
- TOC-001: Constraint Identification and Exploitation

**Required Skills**: value-stream-mapper, cycle-time-analyzer, constraint-identifier

---

#### 3. kaizen-facilitator
**Description**: Agent specialized in facilitating rapid improvement events with team coordination and results sustainability.

**Responsibilities**:
- Kaizen event planning
- Team selection and preparation
- Workshop facilitation
- Countermeasure implementation
- Results documentation
- 30-60-90 day follow-up

**Used By Processes**:
- LEAN-003: Kaizen Event Facilitation
- CI-002: A3 Problem Solving
- LEAN-002: 5S Implementation

**Required Skills**: kaizen-event-facilitator, a3-problem-solver, five-s-auditor

---

#### 4. flow-improvement-specialist
**Description**: Agent specialized in creating continuous flow through kanban, standard work, and visual management.

**Responsibilities**:
- Kanban system design
- Standard work development
- Line balancing
- Visual management implementation
- Flow interruption analysis
- Continuous flow kaizen

**Used By Processes**:
- LEAN-004: Kanban System Design
- LEAN-005: Standard Work Documentation
- LEAN-001: Value Stream Mapping

**Required Skills**: kanban-system-designer, standard-work-documenter, cycle-time-analyzer

---

### Six Sigma Agents

#### 5. six-sigma-black-belt
**Description**: Agent specialized in leading Six Sigma DMAIC projects with statistical analysis and team coaching.

**Responsibilities**:
- Project selection and scoping
- DMAIC phase execution
- Statistical analysis leadership
- Team facilitation
- Tollgate presentation
- Green belt coaching

**Used By Processes**:
- SIX-001: DMAIC Project Execution
- SIX-002: Statistical Process Control Implementation
- SIX-005: Root Cause Analysis

**Required Skills**: dmaic-project-manager, control-chart-analyzer, root-cause-analyzer

---

#### 6. spc-implementation-specialist
**Description**: Agent specialized in statistical process control implementation with control chart selection and training.

**Capabilities**:
- Control chart selection
- Control limit establishment
- Operator training
- Control plan development
- Reaction plan creation
- SPC software configuration

**Used By Processes**:
- SIX-002: Statistical Process Control Implementation
- SIX-003: Process Capability Analysis
- QMS-003: Quality Audit Management

**Required Skills**: control-chart-analyzer, process-capability-calculator, gage-rr-analyzer

---

#### 7. measurement-systems-analyst
**Description**: Agent specialized in measurement system analysis with Gage R&R studies and calibration management.

**Responsibilities**:
- MSA study planning
- Gage R&R execution
- Measurement system improvement
- Calibration program oversight
- Measurement uncertainty analysis
- Gage selection guidance

**Used By Processes**:
- SIX-004: Measurement System Analysis
- SIX-002: Statistical Process Control Implementation
- QMS-003: Quality Audit Management

**Required Skills**: gage-rr-analyzer, process-capability-calculator, control-chart-analyzer

---

#### 8. process-improvement-analyst
**Description**: Agent specialized in root cause analysis with systematic problem-solving and hypothesis testing.

**Responsibilities**:
- Problem definition
- Data collection planning
- Root cause investigation
- Hypothesis development and testing
- Solution recommendation
- Control implementation

**Used By Processes**:
- SIX-005: Root Cause Analysis
- CI-002: A3 Problem Solving
- QMS-005: FMEA Facilitation

**Required Skills**: root-cause-analyzer, a3-problem-solver, fmea-facilitator

---

### Theory of Constraints Agents

#### 9. toc-practitioner
**Description**: Agent specialized in Theory of Constraints implementation with constraint management and thinking processes.

**Responsibilities**:
- System constraint identification
- Five focusing steps execution
- Thinking process facilitation
- Throughput improvement
- Buffer management
- Policy constraint resolution

**Used By Processes**:
- TOC-001: Constraint Identification and Exploitation
- TOC-002: Drum-Buffer-Rope Scheduling
- TOC-003: Throughput Accounting Analysis

**Required Skills**: constraint-identifier, dbr-scheduler, throughput-accountant

---

#### 10. production-flow-manager
**Description**: Agent specialized in production flow management using DBR scheduling and buffer monitoring.

**Responsibilities**:
- Drum schedule maintenance
- Buffer status monitoring
- Expediting decisions
- Flow disruption response
- WIP control
- Throughput optimization

**Used By Processes**:
- TOC-002: Drum-Buffer-Rope Scheduling
- TOC-001: Constraint Identification and Exploitation
- CAP-002: Production Scheduling Optimization

**Required Skills**: dbr-scheduler, constraint-identifier, production-scheduler

---

#### 11. critical-chain-project-manager
**Description**: Agent specialized in Critical Chain Project Management with multi-project buffer management.

**Responsibilities**:
- Critical chain identification
- Buffer sizing and monitoring
- Resource conflict resolution
- Project portfolio synchronization
- Execution discipline
- Performance reporting

**Used By Processes**:
- TOC-004: Critical Chain Project Management
- CAP-002: Production Scheduling Optimization

**Required Skills**: critical-chain-scheduler, resource-scheduler

---

### Capacity Planning Agents

#### 12. capacity-planning-analyst
**Description**: Agent specialized in capacity requirements planning with demand-supply balancing and investment analysis.

**Responsibilities**:
- Capacity assessment
- Demand-capacity gap analysis
- Capacity strategy development
- Investment justification
- Scenario modeling
- Capacity risk assessment

**Used By Processes**:
- CAP-001: Capacity Requirements Planning
- CAP-003: Sales and Operations Planning
- TOC-001: Constraint Identification and Exploitation

**Required Skills**: capacity-planner, demand-forecaster, process-simulation-modeler

---

#### 13. master-scheduler
**Description**: Agent specialized in production scheduling with finite capacity planning and order prioritization.

**Responsibilities**:
- Master production schedule development
- Finite capacity scheduling
- Order promising
- Schedule optimization
- Exception management
- Schedule performance tracking

**Used By Processes**:
- CAP-002: Production Scheduling Optimization
- LEAN-004: Kanban System Design
- TOC-002: Drum-Buffer-Rope Scheduling

**Required Skills**: production-scheduler, capacity-planner, kanban-system-designer

---

#### 14. sop-coordinator
**Description**: Agent specialized in Sales and Operations Planning process coordination with cross-functional alignment.

**Responsibilities**:
- S&OP calendar management
- Demand review facilitation
- Supply review coordination
- Pre-S&OP meeting facilitation
- Executive S&OP preparation
- Consensus building

**Used By Processes**:
- CAP-003: Sales and Operations Planning
- CAP-001: Capacity Requirements Planning
- CAP-004: Demand Forecasting and Analysis

**Required Skills**: sop-facilitator, demand-forecaster, capacity-planner

---

#### 15. demand-planning-analyst
**Description**: Agent specialized in demand forecasting and analysis with statistical and collaborative methods.

**Responsibilities**:
- Baseline forecast generation
- Demand signal analysis
- Forecast accuracy tracking
- Bias correction
- New product forecasting
- Demand sensing integration

**Used By Processes**:
- CAP-004: Demand Forecasting and Analysis
- CAP-003: Sales and Operations Planning
- CAP-001: Capacity Requirements Planning

**Required Skills**: demand-forecaster, sop-facilitator, operational-dashboard-generator

---

### Quality Management Agents

#### 16. qms-implementation-specialist
**Description**: Agent specialized in ISO 9001 and quality management system implementation with documentation and audit readiness.

**Responsibilities**:
- Gap assessment
- QMS documentation development
- Process procedure creation
- Internal audit program
- Management review facilitation
- Certification preparation

**Used By Processes**:
- QMS-001: ISO 9001 Implementation
- QMS-003: Quality Audit Management
- QMS-002: TQM Program Development

**Required Skills**: iso-implementation-guide, quality-auditor, workflow-automator

---

#### 17. tqm-coordinator
**Description**: Agent specialized in Total Quality Management program development and culture transformation.

**Responsibilities**:
- TQM maturity assessment
- Culture change planning
- Employee involvement programs
- Quality circle facilitation
- Recognition program management
- Continuous improvement culture

**Used By Processes**:
- QMS-002: TQM Program Development
- CI-001: Operational Excellence Program Design
- QMS-001: ISO 9001 Implementation

**Required Skills**: tqm-program-designer, opex-program-designer, benchmarking-analyst

---

#### 18. internal-quality-auditor
**Description**: Agent specialized in internal quality audits with audit planning, execution, and follow-up.

**Responsibilities**:
- Audit program planning
- Audit execution
- Finding documentation
- CAR initiation
- Effectiveness verification
- Audit reporting

**Used By Processes**:
- QMS-003: Quality Audit Management
- QMS-001: ISO 9001 Implementation
- LEAN-002: 5S Implementation

**Required Skills**: quality-auditor, five-s-auditor, cost-of-quality-analyzer

---

#### 19. risk-management-specialist
**Description**: Agent specialized in operational risk management with FMEA facilitation and control implementation.

**Responsibilities**:
- Risk identification
- FMEA facilitation
- Risk prioritization
- Control plan development
- Risk mitigation tracking
- Preventive action implementation

**Used By Processes**:
- QMS-005: FMEA Facilitation
- QMS-001: ISO 9001 Implementation
- SIX-005: Root Cause Analysis

**Required Skills**: fmea-facilitator, root-cause-analyzer, quality-auditor

---

### Continuous Improvement Agents

#### 20. opex-program-manager
**Description**: Agent specialized in operational excellence program management with governance and methodology deployment.

**Responsibilities**:
- OpEx strategy development
- Governance establishment
- Methodology deployment
- Capability building
- Progress tracking
- Sustainability assurance

**Used By Processes**:
- CI-001: Operational Excellence Program Design
- QMS-002: TQM Program Development
- LEAN-001: Value Stream Mapping

**Required Skills**: opex-program-designer, benchmarking-analyst, operational-dashboard-generator

---

#### 21. a3-coach
**Description**: Agent specialized in A3 problem-solving coaching with structured thinking development.

**Responsibilities**:
- A3 coaching
- Problem statement refinement
- Root cause investigation guidance
- Countermeasure review
- PDCA cycle coaching
- Capability development

**Used By Processes**:
- CI-002: A3 Problem Solving
- LEAN-003: Kaizen Event Facilitation
- SIX-005: Root Cause Analysis

**Required Skills**: a3-problem-solver, kaizen-event-facilitator, root-cause-analyzer

---

#### 22. benchmarking-coordinator
**Description**: Agent specialized in benchmarking studies with partner identification and best practice adaptation.

**Responsibilities**:
- Benchmark scope definition
- Partner identification
- Study execution
- Gap analysis
- Best practice adaptation
- Implementation tracking

**Used By Processes**:
- CI-003: Benchmarking Program
- CI-001: Operational Excellence Program Design
- QMS-002: TQM Program Development

**Required Skills**: benchmarking-analyst, opex-program-designer, operational-dashboard-generator

---

### Operational Analytics Agents

#### 23. operations-analyst
**Description**: Agent specialized in operational performance analysis with KPI tracking and improvement recommendations.

**Responsibilities**:
- KPI definition and tracking
- Performance analysis
- Trend identification
- Root cause investigation
- Improvement recommendation
- Executive reporting

**Used By Processes**:
- CI-001: Operational Excellence Program Design
- SIX-002: Statistical Process Control Implementation
- CAP-001: Capacity Requirements Planning

**Required Skills**: operational-dashboard-generator, oee-calculator, cycle-time-analyzer

---

#### 24. simulation-analyst
**Description**: Agent specialized in process simulation and scenario analysis for operational decision support.

**Responsibilities**:
- Simulation model development
- Scenario design and execution
- Results analysis
- Optimization recommendations
- Investment justification
- Change impact assessment

**Used By Processes**:
- CAP-001: Capacity Requirements Planning
- LEAN-004: Kanban System Design
- TOC-002: Drum-Buffer-Rope Scheduling

**Required Skills**: process-simulation-modeler, capacity-planner, constraint-identifier

---

## Process to Skills/Agents Mapping

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| LEAN-001: Value Stream Mapping | value-stream-mapper, cycle-time-analyzer, oee-calculator | lean-transformation-leader, value-stream-analyst |
| LEAN-002: 5S Implementation | five-s-auditor, standard-work-documenter | kaizen-facilitator, internal-quality-auditor |
| LEAN-003: Kaizen Event Facilitation | kaizen-event-facilitator, a3-problem-solver, root-cause-analyzer | kaizen-facilitator, a3-coach |
| LEAN-004: Kanban System Design | kanban-system-designer, inventory-optimizer, process-simulation-modeler | flow-improvement-specialist, master-scheduler |
| LEAN-005: Standard Work Documentation | standard-work-documenter, cycle-time-analyzer, workflow-automator | flow-improvement-specialist |
| SIX-001: DMAIC Project Execution | dmaic-project-manager, control-chart-analyzer, root-cause-analyzer | six-sigma-black-belt |
| SIX-002: Statistical Process Control Implementation | control-chart-analyzer, process-capability-calculator, operational-dashboard-generator | spc-implementation-specialist |
| SIX-003: Process Capability Analysis | process-capability-calculator, control-chart-analyzer, gage-rr-analyzer | spc-implementation-specialist, measurement-systems-analyst |
| SIX-004: Measurement System Analysis | gage-rr-analyzer, process-capability-calculator | measurement-systems-analyst |
| SIX-005: Root Cause Analysis | root-cause-analyzer, a3-problem-solver, fmea-facilitator | process-improvement-analyst, a3-coach |
| TOC-001: Constraint Identification and Exploitation | constraint-identifier, throughput-accountant, cycle-time-analyzer | toc-practitioner, value-stream-analyst |
| TOC-002: Drum-Buffer-Rope Scheduling | dbr-scheduler, constraint-identifier, production-scheduler | production-flow-manager, master-scheduler |
| TOC-003: Throughput Accounting Analysis | throughput-accountant, constraint-identifier | toc-practitioner |
| TOC-004: Critical Chain Project Management | critical-chain-scheduler, resource-scheduler | critical-chain-project-manager |
| CAP-001: Capacity Requirements Planning | capacity-planner, demand-forecaster, process-simulation-modeler | capacity-planning-analyst, simulation-analyst |
| CAP-002: Production Scheduling Optimization | production-scheduler, capacity-planner, changeover-optimizer | master-scheduler, production-flow-manager |
| CAP-003: Sales and Operations Planning | sop-facilitator, demand-forecaster, capacity-planner | sop-coordinator, demand-planning-analyst |
| CAP-004: Demand Forecasting and Analysis | demand-forecaster, sop-facilitator, operational-dashboard-generator | demand-planning-analyst |
| QMS-001: ISO 9001 Implementation | iso-implementation-guide, workflow-automator, quality-auditor | qms-implementation-specialist |
| QMS-002: TQM Program Development | tqm-program-designer, opex-program-designer, benchmarking-analyst | tqm-coordinator, opex-program-manager |
| QMS-003: Quality Audit Management | quality-auditor, five-s-auditor, control-chart-analyzer | internal-quality-auditor |
| QMS-004: Cost of Quality Analysis | cost-of-quality-analyzer, benchmarking-analyst, operational-dashboard-generator | tqm-coordinator, operations-analyst |
| QMS-005: FMEA Facilitation | fmea-facilitator, root-cause-analyzer | risk-management-specialist, process-improvement-analyst |
| CI-001: Operational Excellence Program Design | opex-program-designer, benchmarking-analyst, operational-dashboard-generator | opex-program-manager, lean-transformation-leader |
| CI-002: A3 Problem Solving | a3-problem-solver, root-cause-analyzer, kaizen-event-facilitator | a3-coach, process-improvement-analyst |
| CI-003: Benchmarking Program | benchmarking-analyst, opex-program-designer, operational-dashboard-generator | benchmarking-coordinator |

---

## Shared Candidates (Cross-Specialization)

These skills and agents could be shared with other specializations:

### Shared Skills

1. **demand-forecaster** - Useful for Supply Chain, Sales Operations, and Financial Planning domains
2. **process-simulation-modeler** - Applicable to Engineering, Supply Chain, and Project Management specializations
3. **root-cause-analyzer** - Useful for Quality Assurance, Engineering, and IT Service Management domains
4. **operational-dashboard-generator** - Applicable to any domain requiring KPI visualization and executive reporting
5. **workflow-automator** - Useful for Business Process Management, IT Operations, and Administrative domains
6. **resource-scheduler** - Applicable to Project Management, Service Operations, and HR Workforce Planning
7. **benchmarking-analyst** - Useful for Strategy, Finance, and Business Development specializations

### Shared Agents

1. **simulation-analyst** - Process simulation expertise applicable to Engineering, Supply Chain, Healthcare specializations
2. **operations-analyst** - Performance analysis applicable to any business domain with operational metrics
3. **risk-management-specialist** - Risk identification applicable to Finance, Compliance, IT Security specializations
4. **a3-coach** - Problem-solving coaching applicable to Engineering, IT, and Product Development
5. **demand-planning-analyst** - Demand forecasting applicable to Supply Chain, Marketing, Finance specializations

---

## Implementation Priority

### High Priority (Core Operations Workflows)
1. value-stream-mapper
2. control-chart-analyzer
3. capacity-planner
4. production-scheduler
5. quality-auditor
6. root-cause-analyzer
7. lean-transformation-leader (agent)
8. six-sigma-black-belt (agent)
9. master-scheduler (agent)

### Medium Priority (Advanced Capabilities)
1. kanban-system-designer
2. dmaic-project-manager
3. constraint-identifier
4. demand-forecaster
5. fmea-facilitator
6. opex-program-designer
7. toc-practitioner (agent)
8. capacity-planning-analyst (agent)
9. qms-implementation-specialist (agent)

### Lower Priority (Specialized Use Cases)
1. dbr-scheduler
2. critical-chain-scheduler
3. throughput-accountant
4. changeover-optimizer
5. process-simulation-modeler
6. cost-of-quality-analyzer
7. critical-chain-project-manager (agent)
8. simulation-analyst (agent)
9. benchmarking-coordinator (agent)

---

## Notes

- All skills should implement standardized input/output schemas for composability with operational data formats
- Skills should support both real-time and batch processing modes for production and planning cycles
- Agents should maintain audit trails for all operational decisions and recommendations
- Error handling should include escalation procedures and notification mechanisms
- Skills should support integration with common ERP systems (SAP, Oracle, Microsoft Dynamics)
- Statistical skills should use industry-standard calculations consistent with ASQ, AIAG, and ISO standards
- Visualization outputs should support both digital dashboards and printable formats for shop floor use
- Skills should handle multiple units of measure and currency where applicable
- Agents should provide documented rationale for recommendations to support continuous learning
- Real-time skills should support event-driven triggers for immediate response to operational conditions
- Skills should be configurable to industry-specific requirements (automotive, aerospace, pharmaceutical, etc.)
- Integration with Manufacturing Execution Systems (MES) and SCADA should be prioritized for real-time data
- Skills should support multi-site operations with appropriate data aggregation and comparison

---

*Last Updated: January 2026*
