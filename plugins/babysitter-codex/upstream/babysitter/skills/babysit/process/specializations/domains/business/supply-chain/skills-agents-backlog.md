# Supply Chain Management - Skills and Agents Backlog (Phase 6 Complete)

## Overview

This backlog identifies specialized skills and agents (subagents) that could enhance the Supply Chain Management processes beyond general-purpose capabilities. Each skill or agent is designed to provide domain-specific tooling, validation, automation, and integration with supply chain systems and methodologies.

## Summary Statistics

- **Total Skills Identified**: 32
- **Total Agents Identified**: 24
- **Skills Implemented**: 32 (100%)
- **Agents Implemented**: 24 (100%)
- **Shared Candidates (Cross-Specialization)**: 11
- **Categories**: 8 (Demand Forecasting, Procurement, Inventory, Supplier Management, Risk Management, Analytics, Logistics, Sustainability)

## Phase 6 Status: COMPLETE

All skills and agents have been implemented with SKILL.md and AGENT.md files:
- Skills location: `./skills/<skill-name>/SKILL.md`
- Agents location: `./agents/<agent-name>/AGENT.md`

---

## Skills

### Demand Forecasting Skills

#### 1. demand-forecasting-engine
**Description**: Statistical demand forecasting skill using multiple algorithms with automatic model selection and accuracy tracking.

**Capabilities**:
- Time series forecasting (ARIMA, exponential smoothing, Holt-Winters)
- Machine learning demand models (XGBoost, LSTM neural networks)
- Causal factor integration (promotions, seasonality, trends)
- Demand sensing with short-term signal incorporation
- Forecast accuracy metrics (MAPE, WMAPE, bias)
- Automatic model selection and ensemble averaging
- Confidence interval generation
- Forecast value-add (FVA) analysis

**Used By Processes**:
- Demand Forecasting and Planning
- Sales and Operations Planning (S&OP)
- Forecast Accuracy Analysis and Improvement

**Tools/Libraries**: Prophet, statsmodels, scikit-learn, TensorFlow/PyTorch, pandas

---

#### 2. demand-sensing-integrator
**Description**: Real-time demand signal integration from POS, channel data, and external signals for short-term forecast enhancement.

**Capabilities**:
- POS data ingestion and cleansing
- Channel inventory visibility integration
- Weather impact correlation
- Social media sentiment analysis
- Economic indicator integration
- Market intelligence feeds
- Near-term demand adjustment
- Signal-to-noise filtering

**Used By Processes**:
- Demand Forecasting and Planning
- Sales and Operations Planning (S&OP)
- Supply Chain Disruption Response

**Tools/Libraries**: Apache Kafka, real-time data pipelines, external APIs

---

#### 3. sop-scenario-modeler
**Description**: S&OP scenario modeling skill for demand-supply-financial plan alignment with what-if analysis.

**Capabilities**:
- Multi-scenario demand plan creation
- Supply constraint modeling
- Financial impact calculation (revenue, margin, cost)
- Capacity utilization optimization
- Inventory investment modeling
- Gap analysis and reconciliation
- Executive summary generation
- Consensus plan tracking

**Used By Processes**:
- Sales and Operations Planning (S&OP)
- Demand Forecasting and Planning
- Capacity Planning and Constraint Management

**Tools/Libraries**: o9 Solutions, Kinaxis, SAP IBP connectors

---

### Procurement Skills

#### 4. strategic-sourcing-analyzer
**Description**: End-to-end strategic sourcing analysis skill with spend analysis, market assessment, and strategy development.

**Capabilities**:
- Spend cube analysis (supplier, category, business unit)
- Pareto and ABC spend classification
- Market structure analysis
- Porter's Five Forces for category assessment
- Sourcing strategy recommendations
- Wave planning and prioritization
- Savings opportunity identification
- Make vs. buy analysis

**Used By Processes**:
- Strategic Sourcing Initiative
- Category Management
- Spend Analysis and Savings Identification

**Tools/Libraries**: Spend analytics platforms, market research APIs

---

#### 5. rfx-document-generator
**Description**: Automated RFI/RFP/RFQ document creation skill with template management and evaluation criteria.

**Capabilities**:
- RFI/RFP/RFQ template generation
- Scope of work structuring
- Evaluation criteria weighting
- Terms and conditions library
- Supplier question management
- Response collection and parsing
- Side-by-side comparison matrices
- Award recommendation scoring

**Used By Processes**:
- RFx Process Management
- Strategic Sourcing Initiative
- Supplier Evaluation and Selection

**Tools/Libraries**: Ariba, Coupa, Jaggaer integration

---

#### 6. tco-calculator
**Description**: Total Cost of Ownership calculation skill for comprehensive supplier and sourcing decision analysis.

**Capabilities**:
- Acquisition cost modeling (price, shipping, duties)
- Operating cost estimation (maintenance, quality, support)
- Risk cost quantification (disruption, inventory, obsolescence)
- Quality cost analysis (defects, returns, rework)
- Lifecycle cost projection
- Supplier comparison matrices
- Sensitivity analysis on cost drivers
- TCO reporting and visualization

**Used By Processes**:
- Supplier Evaluation and Selection
- Strategic Sourcing Initiative
- Category Management

**Tools/Libraries**: Financial modeling libraries, cost modeling templates

---

#### 7. contract-analyzer
**Description**: Contract analysis and negotiation support skill with clause extraction and risk identification.

**Capabilities**:
- Contract clause extraction and parsing
- Risk clause identification
- Terms comparison across suppliers
- Price escalation analysis
- SLA and KPI extraction
- Renewal date tracking
- Compliance requirement mapping
- Negotiation leverage identification

**Used By Processes**:
- Contract Negotiation and Management
- Strategic Sourcing Initiative
- Supplier Onboarding and Qualification

**Tools/Libraries**: NLP contract analysis, legal AI tools

---

#### 8. category-strategy-builder
**Description**: Category management strategy development using Kraljic Matrix and portfolio optimization.

**Capabilities**:
- Kraljic Matrix categorization
- Supply market complexity assessment
- Business impact evaluation
- Category strategy recommendations
- Supplier rationalization analysis
- Demand aggregation opportunities
- Risk mitigation strategies by category
- Category roadmap generation

**Used By Processes**:
- Category Management
- Strategic Sourcing Initiative
- Supplier Evaluation and Selection

**Tools/Libraries**: Category management templates, portfolio optimization

---

### Inventory Skills

#### 9. inventory-optimizer
**Description**: Multi-echelon inventory optimization skill with ABC/XYZ segmentation and service level targeting.

**Capabilities**:
- ABC/XYZ inventory classification
- Service level to inventory tradeoff modeling
- Multi-echelon inventory optimization
- Safety stock calculation (demand/lead time variability)
- Reorder point and EOQ optimization
- Slow-moving/obsolete identification
- Inventory investment optimization
- Network inventory rebalancing

**Used By Processes**:
- Inventory Optimization and Segmentation
- Safety Stock Calculation and Optimization
- Demand-Driven Material Requirements Planning (DDMRP)

**Tools/Libraries**: scipy optimization, inventory management algorithms

---

#### 10. safety-stock-calculator
**Description**: Statistical safety stock calculation skill with service level targeting and variability analysis.

**Capabilities**:
- Demand variability analysis (coefficient of variation)
- Lead time variability assessment
- Service level conversion (fill rate, cycle service level)
- Safety stock formula application (standard, periodic review)
- Simulation-based safety stock
- Dynamic safety stock adjustment
- Safety stock reporting by segment
- Working capital impact analysis

**Used By Processes**:
- Safety Stock Calculation and Optimization
- Inventory Optimization and Segmentation
- Supply Chain Disruption Response

**Tools/Libraries**: Statistical libraries, Monte Carlo simulation

---

#### 11. ddmrp-buffer-manager
**Description**: Demand-Driven MRP buffer positioning and management skill with dynamic adjustment.

**Capabilities**:
- Strategic decoupling point identification
- Buffer profile assignment
- Buffer level calculation (green, yellow, red zones)
- Dynamic adjustment factor application
- Net flow position calculation
- Execution visibility and prioritization
- Buffer health monitoring
- Lead time compression analysis

**Used By Processes**:
- Demand-Driven Material Requirements Planning (DDMRP)
- Inventory Optimization and Segmentation
- Safety Stock Calculation and Optimization

**Tools/Libraries**: DDMRP algorithms, Demand Driven Technologies

---

### Supplier Management Skills

#### 12. supplier-scorecard-engine
**Description**: Automated supplier performance scorecard generation with KPI tracking and trend analysis.

**Capabilities**:
- OTIF (On-Time In-Full) calculation
- Quality metrics aggregation (PPM, defect rate)
- Cost performance tracking (price variance, savings)
- Responsiveness scoring
- Sustainability/ESG metrics
- Weighted composite scoring
- Trend and benchmark analysis
- Action plan tracking

**Used By Processes**:
- Supplier Performance Scorecard
- Quarterly Business Review (QBR) Facilitation
- Supplier Development Program

**Tools/Libraries**: Scorecard templates, BI integration

---

#### 13. vendor-risk-scorer
**Description**: Comprehensive supplier risk scoring skill with multi-dimensional risk assessment.

**Capabilities**:
- Financial risk assessment (D&B, credit ratings)
- Operational risk evaluation (capacity, quality systems)
- Geopolitical risk scoring (country risk, sanctions)
- Compliance risk assessment (regulatory, ESG)
- Cyber security risk evaluation
- Concentration risk analysis
- Weighted risk score calculation
- Risk rating assignment and trending

**Used By Processes**:
- Supply Chain Risk Assessment
- Supplier Risk Monitoring and Early Warning
- Supplier Evaluation and Selection

**Tools/Libraries**: Risk data providers (D&B, Resilinc, EcoVadis)

---

#### 14. supplier-development-planner
**Description**: Supplier capability development and improvement planning skill.

**Capabilities**:
- Supplier capability gap assessment
- Improvement program design
- Joint process improvement planning
- Technology adoption roadmaps
- Performance target setting
- Milestone tracking
- Resource requirement planning
- ROI calculation for development investment

**Used By Processes**:
- Supplier Development Program
- Quarterly Business Review (QBR) Facilitation
- Supplier Performance Scorecard

**Tools/Libraries**: Improvement planning templates, project management

---

#### 15. qbr-preparation-assistant
**Description**: Quarterly Business Review preparation and facilitation skill with agenda and materials generation.

**Capabilities**:
- QBR agenda generation
- Performance summary compilation
- Trend analysis visualization
- Issue and action log aggregation
- Innovation pipeline tracking
- Forecast alignment review
- Discussion guide creation
- Follow-up action tracking

**Used By Processes**:
- Quarterly Business Review (QBR) Facilitation
- Supplier Performance Scorecard
- Supplier Development Program

**Tools/Libraries**: Presentation templates, data aggregation

---

#### 16. supplier-onboarding-orchestrator
**Description**: Supplier onboarding workflow orchestration with documentation collection and system setup.

**Capabilities**:
- Onboarding checklist management
- Document collection and validation
- Capability questionnaire scoring
- Compliance verification workflow
- System master data setup
- Banking and payment setup
- Quality agreement tracking
- Onboarding status dashboard

**Used By Processes**:
- Supplier Onboarding and Qualification
- Strategic Sourcing Initiative
- Supplier Evaluation and Selection

**Tools/Libraries**: Workflow automation, document management

---

### Risk Management Skills

#### 17. supply-chain-risk-assessor
**Description**: Comprehensive supply chain risk identification and assessment skill with heat mapping.

**Capabilities**:
- Risk category taxonomy (financial, operational, geopolitical, compliance)
- Probability and impact assessment
- Risk score calculation and ranking
- Heat map visualization
- Root cause analysis integration
- Risk appetite alignment
- Control effectiveness evaluation
- Risk register maintenance

**Used By Processes**:
- Supply Chain Risk Assessment
- Supplier Risk Monitoring and Early Warning
- Business Continuity and Contingency Planning

**Tools/Libraries**: Risk frameworks, FMEA templates

---

#### 18. early-warning-monitor
**Description**: Continuous supplier and supply chain risk monitoring with automated alerts.

**Capabilities**:
- Financial indicator monitoring (credit, payment behavior)
- News and media sentiment tracking
- Regulatory change detection
- Natural disaster monitoring
- Geopolitical event tracking
- Quality alert aggregation
- Custom threshold alerting
- Early warning dashboard

**Used By Processes**:
- Supplier Risk Monitoring and Early Warning
- Supply Chain Disruption Response
- Supply Chain Risk Assessment

**Tools/Libraries**: News APIs, risk monitoring platforms (Resilinc, Riskpulse)

---

#### 19. contingency-plan-builder
**Description**: Business continuity and contingency plan development skill for supply chain resilience.

**Capabilities**:
- Critical supplier identification
- Alternative source mapping
- Buffer stock policy design
- Qualification timeline modeling
- Recovery procedure documentation
- Communication protocol design
- Scenario testing frameworks
- Plan maintenance scheduling

**Used By Processes**:
- Business Continuity and Contingency Planning
- Supply Chain Disruption Response
- Supply Chain Risk Assessment

**Tools/Libraries**: BCP templates, scenario planning frameworks

---

#### 20. disruption-response-coordinator
**Description**: Supply chain disruption rapid response skill with impact assessment and mitigation activation.

**Capabilities**:
- Incident classification and escalation
- Impact assessment (supply, demand, financial)
- War room coordination
- Mitigation option activation
- Stakeholder communication
- Recovery tracking
- Lessons learned capture
- Post-incident analysis

**Used By Processes**:
- Supply Chain Disruption Response
- Business Continuity and Contingency Planning
- Supplier Risk Monitoring and Early Warning

**Tools/Libraries**: Incident management, communication platforms

---

### Analytics Skills

#### 21. scor-kpi-dashboard-builder
**Description**: SCOR-aligned supply chain KPI dashboard design and implementation skill.

**Capabilities**:
- SCOR metric taxonomy mapping
- Plan/Source/Make/Deliver/Return KPI selection
- Data source identification and mapping
- Dashboard layout design
- Drill-down hierarchy creation
- Target and threshold setting
- Benchmarking integration
- Executive summary generation

**Used By Processes**:
- Supply Chain KPI Dashboard Development
- Supply Chain Cost-to-Serve Analysis
- Forecast Accuracy Analysis and Improvement

**Tools/Libraries**: Power BI, Tableau, SCOR templates

---

#### 22. spend-analytics-engine
**Description**: Procurement spend analysis skill with classification, consolidation, and savings identification.

**Capabilities**:
- Spend data cleansing and normalization
- UNSPSC/commodity classification
- Supplier consolidation analysis
- Price variance identification
- Maverick spend detection
- Contract compliance analysis
- Savings opportunity quantification
- Spend trend visualization

**Used By Processes**:
- Spend Analysis and Savings Identification
- Category Management
- Strategic Sourcing Initiative

**Tools/Libraries**: Spend analytics platforms, classification algorithms

---

#### 23. cost-to-serve-analyzer
**Description**: Supply chain cost-to-serve analysis skill by customer, product, or channel.

**Capabilities**:
- Activity-based costing allocation
- Procurement cost assignment
- Inventory carrying cost calculation
- Logistics and transportation costing
- Service cost attribution
- Profitability analysis by segment
- Cost driver identification
- Optimization recommendations

**Used By Processes**:
- Supply Chain Cost-to-Serve Analysis
- Supply Chain KPI Dashboard Development
- Supply Chain Network Design

**Tools/Libraries**: ABC costing models, profitability analysis

---

#### 24. forecast-accuracy-analyzer
**Description**: Forecast accuracy measurement and improvement skill with error decomposition.

**Capabilities**:
- MAPE, WMAPE, bias calculation
- Forecast error decomposition
- SKU-level accuracy tracking
- Forecast value-add (FVA) analysis
- Root cause categorization
- Model performance comparison
- Improvement recommendation generation
- Accuracy trend monitoring

**Used By Processes**:
- Forecast Accuracy Analysis and Improvement
- Demand Forecasting and Planning
- Sales and Operations Planning (S&OP)

**Tools/Libraries**: Statistical analysis, visualization libraries

---

### Logistics Skills

#### 25. network-optimization-modeler
**Description**: Supply chain network design and optimization skill using mathematical modeling.

**Capabilities**:
- Center of gravity analysis
- Mixed-integer linear programming
- Facility location optimization
- Transportation lane optimization
- Inventory positioning by node
- Cost-service tradeoff analysis
- Scenario modeling and comparison
- Network visualization

**Used By Processes**:
- Supply Chain Network Design
- Supply Chain Cost-to-Serve Analysis
- Capacity Planning and Constraint Management

**Tools/Libraries**: AIMMS, Llamasoft, CPLEX, Gurobi

---

#### 26. capacity-constraint-analyzer
**Description**: Production capacity analysis skill using Theory of Constraints principles.

**Capabilities**:
- Capacity utilization calculation
- Bottleneck identification
- Constraint exploitation strategies
- Capacity adjustment modeling
- Lead time impact analysis
- Rough-cut capacity planning
- Finite capacity scheduling support
- Capacity investment analysis

**Used By Processes**:
- Capacity Planning and Constraint Management
- Sales and Operations Planning (S&OP)
- Supply Chain Network Design

**Tools/Libraries**: Theory of Constraints frameworks, scheduling algorithms

---

### Sustainability Skills

#### 27. sustainable-procurement-assessor
**Description**: Sustainability assessment skill for procurement practices and supplier evaluation.

**Capabilities**:
- Environmental impact scoring (carbon, water, waste)
- Social responsibility assessment
- Ethical sourcing verification
- Circular economy evaluation
- ESG questionnaire scoring
- Certification tracking (ISO 14001, SA8000)
- Sustainability improvement planning
- Reporting framework alignment (GRI, CDP, SASB)

**Used By Processes**:
- Sustainable Procurement Assessment
- Supplier Evaluation and Selection
- Supplier Performance Scorecard

**Tools/Libraries**: ESG frameworks, EcoVadis, sustainability databases

---

### Cross-Functional Skills

#### 28. supply-chain-visibility-integrator
**Description**: End-to-end supply chain visibility integration skill connecting systems and data sources.

**Capabilities**:
- Multi-tier supplier visibility
- Shipment tracking integration
- Inventory visibility aggregation
- Order status consolidation
- Exception alerting
- Control tower dashboard support
- API connectivity management
- Data quality monitoring

**Used By Processes**:
- Supply Chain KPI Dashboard Development
- Supplier Risk Monitoring and Early Warning
- Supply Chain Disruption Response

**Tools/Libraries**: EDI, API integration, tracking platforms

---

#### 29. procurement-automation-orchestrator
**Description**: Procurement process automation skill for P2P workflow optimization.

**Capabilities**:
- Requisition workflow automation
- Catalog management
- Approval routing optimization
- PO generation automation
- Invoice matching automation
- Supplier portal integration
- RPA bot coordination
- Exception handling workflow

**Used By Processes**:
- RFx Process Management
- Supplier Onboarding and Qualification
- Contract Negotiation and Management

**Tools/Libraries**: RPA platforms, procurement system APIs

---

#### 30. supply-chain-simulation-engine
**Description**: Supply chain discrete-event simulation for scenario testing and optimization.

**Capabilities**:
- End-to-end supply chain simulation
- What-if scenario testing
- Disruption impact modeling
- Policy optimization testing
- Monte Carlo integration
- Sensitivity analysis
- Animation and visualization
- Performance metric tracking

**Used By Processes**:
- Supply Chain Network Design
- Business Continuity and Contingency Planning
- Capacity Planning and Constraint Management

**Tools/Libraries**: AnyLogic, Simul8, SimPy

---

#### 31. master-data-quality-manager
**Description**: Supply chain master data quality monitoring and improvement skill.

**Capabilities**:
- Item master data validation
- Supplier master data cleansing
- Location/plant data verification
- BOM accuracy checking
- Lead time validation
- Data completeness scoring
- Duplicate detection
- Data quality trending

**Used By Processes**:
- All supply chain processes (cross-cutting)
- Demand Forecasting and Planning
- Inventory Optimization and Segmentation

**Tools/Libraries**: Data quality frameworks, MDM platforms

---

#### 32. supply-chain-digital-twin
**Description**: Digital twin representation of supply chain for real-time monitoring and simulation.

**Capabilities**:
- Real-time supply chain state representation
- Predictive analytics integration
- Scenario simulation
- Anomaly detection
- Optimization recommendation
- What-if analysis
- Performance prediction
- Continuous learning integration

**Used By Processes**:
- Supply Chain Network Design
- Supply Chain Disruption Response
- Supply Chain KPI Dashboard Development

**Tools/Libraries**: Digital twin platforms, IoT integration, ML models

---

## Agents

### Planning Agents

#### 1. demand-planner
**Description**: Agent specialized in demand forecasting, demand planning, and forecast accuracy improvement.

**Responsibilities**:
- Generate statistical demand forecasts
- Incorporate market intelligence and demand signals
- Collaborate with sales and marketing on demand inputs
- Track and improve forecast accuracy
- Manage demand review process
- Support S&OP demand planning

**Used By Processes**:
- Demand Forecasting and Planning
- Sales and Operations Planning (S&OP)
- Forecast Accuracy Analysis and Improvement

**Required Skills**: demand-forecasting-engine, demand-sensing-integrator, forecast-accuracy-analyzer

---

#### 2. sop-coordinator
**Description**: Agent specialized in S&OP process facilitation and demand-supply-financial plan alignment.

**Responsibilities**:
- Coordinate monthly S&OP cycle
- Facilitate demand review meetings
- Lead supply review sessions
- Prepare pre-S&OP materials
- Support executive S&OP decision-making
- Track plan execution and deviations

**Used By Processes**:
- Sales and Operations Planning (S&OP)
- Demand Forecasting and Planning
- Capacity Planning and Constraint Management

**Required Skills**: sop-scenario-modeler, demand-forecasting-engine, capacity-constraint-analyzer

---

#### 3. supply-chain-network-designer
**Description**: Agent specialized in supply chain network design, optimization, and transformation.

**Responsibilities**:
- Model and optimize distribution networks
- Analyze facility location decisions
- Optimize transportation lanes
- Balance cost and service tradeoffs
- Develop network transformation roadmaps
- Support make vs. buy decisions

**Used By Processes**:
- Supply Chain Network Design
- Supply Chain Cost-to-Serve Analysis
- Capacity Planning and Constraint Management

**Required Skills**: network-optimization-modeler, cost-to-serve-analyzer, supply-chain-simulation-engine

---

#### 4. capacity-planner
**Description**: Agent specialized in capacity planning, constraint management, and production scheduling support.

**Responsibilities**:
- Analyze capacity against demand requirements
- Identify production bottlenecks
- Develop capacity adjustment strategies
- Support rough-cut capacity planning
- Model capacity investment scenarios
- Apply Theory of Constraints principles

**Used By Processes**:
- Capacity Planning and Constraint Management
- Sales and Operations Planning (S&OP)
- Supply Chain Network Design

**Required Skills**: capacity-constraint-analyzer, sop-scenario-modeler, supply-chain-simulation-engine

---

### Procurement Agents

#### 5. strategic-sourcing-manager
**Description**: Agent specialized in strategic sourcing, category strategy, and supplier selection.

**Responsibilities**:
- Lead end-to-end sourcing projects
- Conduct spend analysis
- Develop category strategies
- Manage RFx processes
- Evaluate and select suppliers
- Negotiate contracts and terms

**Used By Processes**:
- Strategic Sourcing Initiative
- Category Management
- Supplier Evaluation and Selection

**Required Skills**: strategic-sourcing-analyzer, rfx-document-generator, tco-calculator, category-strategy-builder

---

#### 6. procurement-analyst
**Description**: Agent specialized in spend analysis, savings tracking, and procurement performance monitoring.

**Responsibilities**:
- Analyze procurement spend patterns
- Identify savings opportunities
- Track realized savings
- Monitor contract compliance
- Report on procurement KPIs
- Support category management

**Used By Processes**:
- Spend Analysis and Savings Identification
- Category Management
- Supply Chain KPI Dashboard Development

**Required Skills**: spend-analytics-engine, scor-kpi-dashboard-builder, tco-calculator

---

#### 7. contract-manager
**Description**: Agent specialized in contract lifecycle management, negotiation support, and compliance.

**Responsibilities**:
- Develop negotiation strategies
- Analyze contract terms and risks
- Manage contract lifecycle
- Track renewal dates and amendments
- Ensure contract compliance
- Support dispute resolution

**Used By Processes**:
- Contract Negotiation and Management
- Strategic Sourcing Initiative
- Supplier Onboarding and Qualification

**Required Skills**: contract-analyzer, rfx-document-generator, vendor-risk-scorer

---

#### 8. category-manager
**Description**: Agent specialized in category management strategy development and execution.

**Responsibilities**:
- Develop category strategies using Kraljic Matrix
- Manage supplier portfolio by category
- Drive category cost optimization
- Identify consolidation opportunities
- Track category performance
- Build category expertise

**Used By Processes**:
- Category Management
- Strategic Sourcing Initiative
- Spend Analysis and Savings Identification

**Required Skills**: category-strategy-builder, strategic-sourcing-analyzer, spend-analytics-engine

---

### Inventory Agents

#### 9. inventory-optimizer-agent
**Description**: Agent specialized in inventory optimization, segmentation, and working capital management.

**Responsibilities**:
- Segment inventory using ABC/XYZ classification
- Optimize stocking levels by segment
- Calculate safety stock requirements
- Identify slow-moving and obsolete inventory
- Model inventory investment tradeoffs
- Track inventory performance metrics

**Used By Processes**:
- Inventory Optimization and Segmentation
- Safety Stock Calculation and Optimization
- Demand-Driven Material Requirements Planning (DDMRP)

**Required Skills**: inventory-optimizer, safety-stock-calculator, ddmrp-buffer-manager

---

#### 10. ddmrp-practitioner
**Description**: Agent specialized in Demand-Driven MRP implementation and buffer management.

**Responsibilities**:
- Identify strategic decoupling points
- Design and position inventory buffers
- Manage dynamic buffer adjustments
- Execute demand-driven planning
- Monitor buffer health and performance
- Drive flow improvement

**Used By Processes**:
- Demand-Driven Material Requirements Planning (DDMRP)
- Inventory Optimization and Segmentation
- Safety Stock Calculation and Optimization

**Required Skills**: ddmrp-buffer-manager, inventory-optimizer, demand-forecasting-engine

---

### Supplier Management Agents

#### 11. supplier-performance-manager
**Description**: Agent specialized in supplier performance monitoring, scorecard management, and improvement.

**Responsibilities**:
- Develop and maintain supplier scorecards
- Track OTIF, quality, and cost metrics
- Analyze performance trends
- Identify underperforming suppliers
- Coordinate improvement actions
- Report on supplier performance

**Used By Processes**:
- Supplier Performance Scorecard
- Quarterly Business Review (QBR) Facilitation
- Supplier Development Program

**Required Skills**: supplier-scorecard-engine, qbr-preparation-assistant, supplier-development-planner

---

#### 12. supplier-development-manager
**Description**: Agent specialized in supplier capability development and improvement programs.

**Responsibilities**:
- Assess supplier capabilities
- Design development programs
- Lead joint improvement initiatives
- Track milestone achievement
- Measure development ROI
- Build supplier partnerships

**Used By Processes**:
- Supplier Development Program
- Quarterly Business Review (QBR) Facilitation
- Supplier Performance Scorecard

**Required Skills**: supplier-development-planner, supplier-scorecard-engine, qbr-preparation-assistant

---

#### 13. supplier-relationship-manager
**Description**: Agent specialized in strategic supplier relationship management and partnership development.

**Responsibilities**:
- Manage relationships with strategic suppliers
- Conduct quarterly business reviews
- Drive continuous improvement
- Resolve escalated issues
- Identify innovation opportunities
- Build long-term partnerships

**Used By Processes**:
- Quarterly Business Review (QBR) Facilitation
- Supplier Development Program
- Supplier Performance Scorecard

**Required Skills**: qbr-preparation-assistant, supplier-scorecard-engine, supplier-development-planner

---

#### 14. supplier-onboarding-coordinator
**Description**: Agent specialized in supplier onboarding, qualification, and system setup.

**Responsibilities**:
- Execute supplier onboarding process
- Collect and validate documentation
- Assess supplier capabilities
- Verify compliance requirements
- Coordinate system setup
- Track onboarding progress

**Used By Processes**:
- Supplier Onboarding and Qualification
- Strategic Sourcing Initiative
- Supplier Evaluation and Selection

**Required Skills**: supplier-onboarding-orchestrator, vendor-risk-scorer, procurement-automation-orchestrator

---

### Risk Management Agents

#### 15. supply-chain-risk-manager
**Description**: Agent specialized in supply chain risk identification, assessment, and mitigation.

**Responsibilities**:
- Identify supply chain risks
- Assess probability and impact
- Prioritize risks for mitigation
- Develop mitigation strategies
- Track risk status and trends
- Report to leadership on risk posture

**Used By Processes**:
- Supply Chain Risk Assessment
- Supplier Risk Monitoring and Early Warning
- Business Continuity and Contingency Planning

**Required Skills**: supply-chain-risk-assessor, vendor-risk-scorer, early-warning-monitor

---

#### 16. supplier-risk-analyst
**Description**: Agent specialized in supplier risk monitoring, scoring, and early warning.

**Responsibilities**:
- Monitor supplier risk indicators
- Calculate and update risk scores
- Generate early warning alerts
- Investigate risk signals
- Recommend risk mitigation actions
- Track risk trends by supplier

**Used By Processes**:
- Supplier Risk Monitoring and Early Warning
- Supply Chain Risk Assessment
- Supplier Evaluation and Selection

**Required Skills**: vendor-risk-scorer, early-warning-monitor, supply-chain-risk-assessor

---

#### 17. business-continuity-planner
**Description**: Agent specialized in supply chain business continuity and contingency planning.

**Responsibilities**:
- Develop contingency plans for critical suppliers
- Map alternative sourcing options
- Design buffer stock policies
- Document recovery procedures
- Test contingency plans
- Maintain plan currency

**Used By Processes**:
- Business Continuity and Contingency Planning
- Supply Chain Disruption Response
- Supply Chain Risk Assessment

**Required Skills**: contingency-plan-builder, supply-chain-risk-assessor, supply-chain-simulation-engine

---

#### 18. disruption-response-manager
**Description**: Agent specialized in supply chain disruption response and crisis management.

**Responsibilities**:
- Classify and escalate incidents
- Assess disruption impact
- Activate mitigation plans
- Coordinate response teams
- Communicate with stakeholders
- Lead recovery efforts

**Used By Processes**:
- Supply Chain Disruption Response
- Business Continuity and Contingency Planning
- Supplier Risk Monitoring and Early Warning

**Required Skills**: disruption-response-coordinator, early-warning-monitor, contingency-plan-builder

---

### Analytics Agents

#### 19. supply-chain-analyst
**Description**: Agent specialized in supply chain analytics, KPI tracking, and performance reporting.

**Responsibilities**:
- Design and build supply chain dashboards
- Track SCOR-aligned metrics
- Analyze supply chain performance
- Identify improvement opportunities
- Support data-driven decision-making
- Generate management reports

**Used By Processes**:
- Supply Chain KPI Dashboard Development
- Supply Chain Cost-to-Serve Analysis
- Forecast Accuracy Analysis and Improvement

**Required Skills**: scor-kpi-dashboard-builder, cost-to-serve-analyzer, forecast-accuracy-analyzer

---

#### 20. cost-to-serve-analyst
**Description**: Agent specialized in supply chain cost analysis and profitability optimization.

**Responsibilities**:
- Calculate cost-to-serve by customer/product/channel
- Allocate supply chain costs accurately
- Identify cost drivers and optimization opportunities
- Support pricing and profitability decisions
- Model cost scenarios
- Report on cost performance

**Used By Processes**:
- Supply Chain Cost-to-Serve Analysis
- Supply Chain KPI Dashboard Development
- Supply Chain Network Design

**Required Skills**: cost-to-serve-analyzer, scor-kpi-dashboard-builder, network-optimization-modeler

---

### Logistics Agents

#### 21. logistics-optimization-manager
**Description**: Agent specialized in logistics network optimization and transportation management.

**Responsibilities**:
- Optimize transportation routes and modes
- Manage carrier relationships
- Negotiate freight rates
- Track logistics KPIs
- Drive logistics cost reduction
- Ensure delivery performance

**Used By Processes**:
- Supply Chain Network Design
- Supply Chain Cost-to-Serve Analysis

**Required Skills**: network-optimization-modeler, cost-to-serve-analyzer, supply-chain-visibility-integrator

---

### Sustainability Agents

#### 22. sustainability-procurement-manager
**Description**: Agent specialized in sustainable and ethical procurement practices.

**Responsibilities**:
- Assess supplier sustainability practices
- Track ESG metrics and certifications
- Drive sustainable sourcing initiatives
- Support circular economy programs
- Ensure ethical sourcing compliance
- Report on sustainability performance

**Used By Processes**:
- Sustainable Procurement Assessment
- Supplier Evaluation and Selection
- Supplier Performance Scorecard

**Required Skills**: sustainable-procurement-assessor, supplier-scorecard-engine, vendor-risk-scorer

---

### Digital and Transformation Agents

#### 23. supply-chain-digitalization-lead
**Description**: Agent specialized in supply chain digital transformation and technology adoption.

**Responsibilities**:
- Assess digital maturity
- Identify digitalization opportunities
- Evaluate supply chain technologies
- Drive digital transformation initiatives
- Manage technology implementations
- Measure digital transformation ROI

**Used By Processes**:
- All processes (cross-cutting digital enablement)
- Supply Chain KPI Dashboard Development
- Supply Chain Network Design

**Required Skills**: supply-chain-digital-twin, supply-chain-visibility-integrator, supply-chain-simulation-engine

---

#### 24. master-data-steward
**Description**: Agent specialized in supply chain master data governance and quality management.

**Responsibilities**:
- Monitor master data quality
- Define data standards and rules
- Cleanse and enrich data
- Resolve data issues
- Track data quality metrics
- Support data governance

**Used By Processes**:
- All supply chain processes (cross-cutting)
- Demand Forecasting and Planning
- Inventory Optimization and Segmentation

**Required Skills**: master-data-quality-manager, supply-chain-visibility-integrator

---

## Process to Skills/Agents Mapping

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| Demand Forecasting and Planning | demand-forecasting-engine, demand-sensing-integrator, forecast-accuracy-analyzer | demand-planner |
| Sales and Operations Planning (S&OP) | sop-scenario-modeler, demand-forecasting-engine, capacity-constraint-analyzer | sop-coordinator, demand-planner |
| Supply Chain Network Design | network-optimization-modeler, supply-chain-simulation-engine, cost-to-serve-analyzer | supply-chain-network-designer |
| Capacity Planning and Constraint Management | capacity-constraint-analyzer, sop-scenario-modeler | capacity-planner, sop-coordinator |
| Strategic Sourcing Initiative | strategic-sourcing-analyzer, rfx-document-generator, tco-calculator | strategic-sourcing-manager |
| Supplier Evaluation and Selection | tco-calculator, vendor-risk-scorer, sustainable-procurement-assessor | strategic-sourcing-manager, supplier-risk-analyst |
| RFx Process Management | rfx-document-generator, procurement-automation-orchestrator | strategic-sourcing-manager, contract-manager |
| Contract Negotiation and Management | contract-analyzer, rfx-document-generator | contract-manager |
| Category Management | category-strategy-builder, strategic-sourcing-analyzer, spend-analytics-engine | category-manager |
| Inventory Optimization and Segmentation | inventory-optimizer, safety-stock-calculator | inventory-optimizer-agent |
| Safety Stock Calculation and Optimization | safety-stock-calculator, inventory-optimizer | inventory-optimizer-agent |
| Demand-Driven Material Requirements Planning (DDMRP) | ddmrp-buffer-manager, inventory-optimizer | ddmrp-practitioner |
| Supplier Performance Scorecard | supplier-scorecard-engine, vendor-risk-scorer | supplier-performance-manager |
| Supplier Development Program | supplier-development-planner, supplier-scorecard-engine | supplier-development-manager |
| Quarterly Business Review (QBR) Facilitation | qbr-preparation-assistant, supplier-scorecard-engine | supplier-relationship-manager |
| Supplier Onboarding and Qualification | supplier-onboarding-orchestrator, vendor-risk-scorer | supplier-onboarding-coordinator |
| Supply Chain Risk Assessment | supply-chain-risk-assessor, vendor-risk-scorer | supply-chain-risk-manager |
| Supplier Risk Monitoring and Early Warning | early-warning-monitor, vendor-risk-scorer | supplier-risk-analyst |
| Business Continuity and Contingency Planning | contingency-plan-builder, supply-chain-simulation-engine | business-continuity-planner |
| Supply Chain Disruption Response | disruption-response-coordinator, early-warning-monitor | disruption-response-manager |
| Supply Chain KPI Dashboard Development | scor-kpi-dashboard-builder, cost-to-serve-analyzer | supply-chain-analyst |
| Spend Analysis and Savings Identification | spend-analytics-engine, strategic-sourcing-analyzer | procurement-analyst, category-manager |
| Supply Chain Cost-to-Serve Analysis | cost-to-serve-analyzer, scor-kpi-dashboard-builder | cost-to-serve-analyst |
| Forecast Accuracy Analysis and Improvement | forecast-accuracy-analyzer, demand-forecasting-engine | demand-planner, supply-chain-analyst |
| Sustainable Procurement Assessment | sustainable-procurement-assessor, supplier-scorecard-engine | sustainability-procurement-manager |

---

## Shared Candidates (Cross-Specialization)

These skills and agents could be shared with other specializations:

### Shared Skills

1. **demand-forecasting-engine** - Useful for Finance/FP&A, Sales Operations, and Retail specializations
2. **tco-calculator** - Applicable to Finance, Project Management, and IT Procurement domains
3. **spend-analytics-engine** - Useful for Finance, Accounting, and Business Intelligence specializations
4. **vendor-risk-scorer** - Applicable to Finance, Compliance, and Third-Party Risk Management domains
5. **contract-analyzer** - Useful for Legal, Compliance, and Procurement specializations across industries
6. **supply-chain-simulation-engine** - Applicable to Operations Research, Manufacturing, and Logistics domains
7. **network-optimization-modeler** - Useful for Logistics, Distribution, and Operations specializations

### Shared Agents

1. **demand-planner** - Demand planning expertise applicable to Sales, Finance, and Retail specializations
2. **supply-chain-analyst** - Analytics expertise applicable to Operations, Manufacturing, and Business Intelligence
3. **contract-manager** - Contract expertise applicable to Legal and Compliance specializations
4. **business-continuity-planner** - BCP expertise applicable to IT, Operations, and Risk Management domains

---

## Implementation Priority

### High Priority (Phase 4A - Core Supply Chain Workflows)
1. demand-forecasting-engine
2. supplier-scorecard-engine
3. inventory-optimizer
4. spend-analytics-engine
5. supply-chain-risk-assessor
6. scor-kpi-dashboard-builder
7. demand-planner (agent)
8. supply-chain-analyst (agent)
9. supplier-performance-manager (agent)

### Medium Priority (Phase 4B - Strategic Capabilities)
1. strategic-sourcing-analyzer
2. tco-calculator
3. safety-stock-calculator
4. vendor-risk-scorer
5. sop-scenario-modeler
6. early-warning-monitor
7. strategic-sourcing-manager (agent)
8. inventory-optimizer-agent (agent)
9. supply-chain-risk-manager (agent)
10. sop-coordinator (agent)

### Standard Priority (Phase 4C - Advanced Analytics)
1. rfx-document-generator
2. category-strategy-builder
3. forecast-accuracy-analyzer
4. cost-to-serve-analyzer
5. contingency-plan-builder
6. supplier-development-planner
7. category-manager (agent)
8. procurement-analyst (agent)
9. business-continuity-planner (agent)

### Future Enhancement (Phase 4D - Digital Transformation)
1. network-optimization-modeler
2. capacity-constraint-analyzer
3. ddmrp-buffer-manager
4. supply-chain-digital-twin
5. supply-chain-simulation-engine
6. supply-chain-visibility-integrator
7. sustainable-procurement-assessor
8. contract-analyzer
9. master-data-quality-manager
10. procurement-automation-orchestrator
11. supply-chain-network-designer (agent)
12. ddmrp-practitioner (agent)
13. supply-chain-digitalization-lead (agent)
14. sustainability-procurement-manager (agent)
15. disruption-response-manager (agent)

---

## Notes

- All skills should implement standardized input/output schemas for composability with ERP and SCM systems
- Skills should support integration with major supply chain platforms (SAP, Oracle, Kinaxis, o9, Blue Yonder)
- Agents should maintain audit trails for compliance and traceability requirements
- Error handling should include appropriate escalation procedures for critical supply chain decisions
- Skills should support multi-currency and multi-unit of measure handling
- Real-time data integration should be prioritized for demand sensing and risk monitoring capabilities
- All numerical calculations should maintain precision appropriate for financial and operational reporting
- Skills should support configurable thresholds and business rules by category and segment
- Agents should provide detailed reasoning for their recommendations to support decision-making
- Time-sensitive processes (disruption response, S&OP cycle) should include deadline awareness and prioritization
- Integration with external data providers (D&B, EcoVadis, Resilinc) should be modular and configurable

---

*Last Updated: January 2026*
*Version: 2.0.0*
*Status: Phase 6 - Skills and Agents Implemented*
*Completion: All 32 skills and 24 agents have been implemented*
