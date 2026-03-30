# Logistics and Operations - Skills and Agents Backlog (Phase 4)

## Overview

This backlog identifies specialized skills and agents that could enhance the Logistics and Operations processes beyond general-purpose capabilities. Each skill or agent is designed to provide domain-specific tooling, validation, or automation for logistics workflows including transportation, warehousing, inventory management, distribution, fleet management, and reverse logistics.

## Summary Statistics

- **Total Skills Identified**: 32
- **Total Agents Identified**: 24
- **Shared Candidates (Cross-Specialization)**: 11
- **Categories**: 6 (Transportation, Warehouse, Inventory, Distribution, Fleet Management, Returns/Reverse Logistics)

---

## Skills

### Transportation Skills

#### 1. route-optimization-engine
**Description**: AI-powered route planning and optimization skill using advanced algorithms (VRP, TSP) to minimize transportation costs, reduce delivery times, and maximize vehicle utilization.

**Capabilities**:
- Vehicle routing problem (VRP) solving
- Time window constraint handling
- Multi-stop route optimization
- Real-time traffic integration
- Fuel consumption optimization
- Driver hours of service compliance
- Dynamic re-routing for exceptions

**Used By Processes**:
- Route Optimization
- Load Planning and Consolidation
- Last-Mile Delivery Optimization

**Tools/Libraries**: Google OR-Tools, VROOM, OSRM, GraphHopper, HERE API

---

#### 2. carrier-selection-optimizer
**Description**: Automated carrier evaluation and selection skill using multi-criteria decision analysis for optimal freight procurement.

**Capabilities**:
- Carrier performance scoring
- Rate comparison and analysis
- Capacity availability checking
- Service level matching
- Historical performance benchmarking
- Contract compliance validation
- Spot rate negotiation support

**Used By Processes**:
- Carrier Selection and Procurement
- Freight Audit and Payment
- Shipment Tracking and Visibility

**Tools/Libraries**: TMS APIs, carrier rating databases, procurement analytics platforms

---

#### 3. freight-audit-validator
**Description**: Automated freight bill validation skill with discrepancy detection and payment processing automation.

**Capabilities**:
- Invoice data extraction (OCR)
- Contract rate validation
- Accessorial charge verification
- Weight and dimension validation
- Duplicate invoice detection
- Discrepancy classification
- Claim generation automation

**Used By Processes**:
- Freight Audit and Payment
- Carrier Selection and Procurement

**Tools/Libraries**: OCR engines, EDI parsers, freight audit platforms

---

#### 4. load-optimization-calculator
**Description**: AI-powered load building and consolidation skill to maximize trailer utilization and reduce transportation costs.

**Capabilities**:
- 3D bin packing algorithms
- Weight distribution optimization
- Stackability and compatibility rules
- Multi-stop load sequencing
- Trailer cube utilization maximization
- Mixed freight consolidation
- Pool distribution planning

**Used By Processes**:
- Load Planning and Consolidation
- Route Optimization
- Cross-Docking Operations

**Tools/Libraries**: 3D packing libraries, optimization solvers, TMS integration

---

#### 5. shipment-visibility-tracker
**Description**: Real-time shipment monitoring and exception management skill with proactive alerting and customer communication.

**Capabilities**:
- Multi-carrier tracking integration
- ETA prediction with ML models
- Exception detection and alerting
- Proof of delivery capture
- Milestone event tracking
- Customer notification automation
- Performance analytics dashboards

**Used By Processes**:
- Shipment Tracking and Visibility
- Last-Mile Delivery Optimization
- Carrier Selection and Procurement

**Tools/Libraries**: Tracking APIs (Project44, FourKites), GPS/telematics, visibility platforms

---

### Warehouse Skills

#### 6. slotting-optimization-engine
**Description**: AI-driven warehouse slotting skill to optimize product placement based on velocity, pick frequency, and operational efficiency.

**Capabilities**:
- Velocity-based slot assignment
- Travel distance minimization
- Ergonomic zone optimization
- Pick path efficiency analysis
- Seasonal demand adjustment
- Product affinity clustering
- Golden zone placement

**Used By Processes**:
- Slotting Optimization
- Pick-Pack-Ship Operations
- Receiving and Putaway Optimization

**Tools/Libraries**: WMS APIs, slotting optimization algorithms, heuristic solvers

---

#### 7. wave-planning-optimizer
**Description**: Automated wave planning and pick path optimization skill to maximize warehouse throughput and order accuracy.

**Capabilities**:
- Wave release optimization
- Batch picking strategies
- Pick path sequencing
- Carrier cutoff coordination
- Resource capacity balancing
- Zone picking orchestration
- Pick density optimization

**Used By Processes**:
- Pick-Pack-Ship Operations
- Receiving and Putaway Optimization
- Warehouse Labor Management

**Tools/Libraries**: WMS systems, optimization algorithms, scheduling tools

---

#### 8. cycle-count-scheduler
**Description**: AI-driven cycle counting schedule and variance analysis skill to maintain inventory accuracy with minimal operational disruption.

**Capabilities**:
- ABC-based count frequency determination
- Statistical sampling design
- Count schedule optimization
- Variance threshold alerting
- Root cause analysis automation
- Perpetual vs. physical reconciliation
- Audit trail documentation

**Used By Processes**:
- Cycle Counting Program
- ABC-XYZ Analysis
- FIFO-LIFO Inventory Control

**Tools/Libraries**: WMS APIs, statistical sampling libraries, inventory audit tools

---

#### 9. dock-scheduling-coordinator
**Description**: Automated dock appointment scheduling skill with inbound flow optimization and receiving efficiency management.

**Capabilities**:
- Appointment slot optimization
- Carrier compliance tracking
- Dock door assignment
- Unloading time estimation
- ASN processing automation
- Yard management integration
- Late arrival prediction

**Used By Processes**:
- Receiving and Putaway Optimization
- Cross-Docking Operations
- Shipment Tracking and Visibility

**Tools/Libraries**: Dock scheduling systems, YMS APIs, carrier portals

---

#### 10. labor-productivity-optimizer
**Description**: AI-powered workforce planning and task assignment skill to maximize warehouse labor efficiency.

**Capabilities**:
- Engineered labor standards
- Task interleaving optimization
- Real-time workload balancing
- Productivity tracking and reporting
- Incentive program calculation
- Absenteeism prediction
- Training needs identification

**Used By Processes**:
- Warehouse Labor Management
- Pick-Pack-Ship Operations
- Receiving and Putaway Optimization

**Tools/Libraries**: LMS APIs, time and motion analysis tools, workforce management platforms

---

### Inventory Skills

#### 11. abc-xyz-classifier
**Description**: Multi-dimensional inventory classification skill combining value (ABC) and demand variability (XYZ) analysis for differentiated policies.

**Capabilities**:
- Pareto analysis automation
- Demand pattern classification
- Inventory policy recommendation
- Service level differentiation
- Review frequency optimization
- Stocking strategy suggestions
- Cross-docking candidacy identification

**Used By Processes**:
- ABC-XYZ Analysis
- Reorder Point Calculation
- Dead Stock and Excess Inventory Management

**Tools/Libraries**: Statistical analysis libraries, pandas, inventory optimization models

---

#### 12. safety-stock-calculator
**Description**: Dynamic safety stock and reorder point optimization skill based on demand variability, lead times, and service level targets.

**Capabilities**:
- Service level to safety stock conversion
- Lead time variability modeling
- Demand variability analysis
- Reorder point calculation
- Order quantity optimization (EOQ)
- Min/max parameter setting
- Multi-echelon inventory optimization

**Used By Processes**:
- Reorder Point Calculation
- Demand Forecasting
- ABC-XYZ Analysis

**Tools/Libraries**: Inventory optimization libraries, scipy, pyomo

---

#### 13. fifo-lifo-controller
**Description**: Automated inventory rotation management skill ensuring proper product flow based on expiration, production, or receipt dates.

**Capabilities**:
- FIFO enforcement at pick time
- FEFO (First Expired First Out) management
- Lot and batch tracking
- Expiration date alerting
- Shelf life calculation
- Product hold management
- Compliance documentation

**Used By Processes**:
- FIFO-LIFO Inventory Control
- Cycle Counting Program
- Receiving and Putaway Optimization

**Tools/Libraries**: WMS APIs, lot tracking systems, shelf life databases

---

#### 14. demand-forecasting-engine
**Description**: AI-powered demand prediction skill using historical data, market signals, and external factors for improved forecast accuracy.

**Capabilities**:
- Time series forecasting (ARIMA, Prophet, etc.)
- Machine learning demand models
- Promotional lift modeling
- External factor integration (weather, events)
- Forecast accuracy measurement
- Demand sensing with POS data
- New product forecasting

**Used By Processes**:
- Demand Forecasting
- Reorder Point Calculation
- ABC-XYZ Analysis

**Tools/Libraries**: Prophet, statsmodels, scikit-learn, demand planning platforms

---

#### 15. dead-stock-identifier
**Description**: Slow-moving and obsolete inventory identification skill with disposition planning and working capital optimization.

**Capabilities**:
- Velocity analysis and aging
- Obsolescence risk scoring
- Disposition strategy recommendation
- Markdown optimization
- Liquidation channel matching
- Write-off impact analysis
- SKU rationalization support

**Used By Processes**:
- Dead Stock and Excess Inventory Management
- ABC-XYZ Analysis
- Cycle Counting Program

**Tools/Libraries**: Inventory analytics, markdown optimization tools, liquidation platforms

---

### Distribution Skills

#### 16. network-optimization-modeler
**Description**: Strategic distribution network modeling skill to optimize facility locations, capacity allocation, and inventory positioning.

**Capabilities**:
- Facility location optimization
- Network cost-to-serve modeling
- Capacity planning and allocation
- Scenario analysis (greenfield, brownfield)
- Service level impact assessment
- Carbon footprint modeling
- Risk and resilience analysis

**Used By Processes**:
- Distribution Network Optimization
- Cross-Docking Operations
- Multi-Channel Fulfillment

**Tools/Libraries**: Network optimization solvers (Llamasoft, AIMMS), simulation tools

---

#### 17. cross-dock-orchestrator
**Description**: Flow-through logistics process coordination skill to minimize storage time and accelerate product movement.

**Capabilities**:
- Inbound-outbound timing synchronization
- Floor staging optimization
- Door-to-door mapping
- Sort and segregation planning
- Flow-through capacity management
- Break-bulk coordination
- Pre-distribution processing

**Used By Processes**:
- Cross-Docking Operations
- Distribution Network Optimization
- Load Planning and Consolidation

**Tools/Libraries**: WMS cross-dock modules, sorting system APIs, flow optimization

---

#### 18. omnichannel-fulfillment-allocator
**Description**: Integrated fulfillment allocation skill for unified inventory across channels with intelligent order routing.

**Capabilities**:
- Distributed order management
- Store-fulfillment capability scoring
- Inventory promise/ATP calculation
- Ship-from-store optimization
- BOPIS order orchestration
- Split shipment optimization
- Channel priority balancing

**Used By Processes**:
- Multi-Channel Fulfillment
- Distribution Network Optimization
- Last-Mile Delivery Optimization

**Tools/Libraries**: OMS APIs, inventory visibility platforms, order routing engines

---

#### 19. last-mile-delivery-optimizer
**Description**: Final delivery leg optimization skill including dynamic scheduling, time-window management, and delivery confirmation.

**Capabilities**:
- Delivery density optimization
- Time window scheduling
- Driver dispatch optimization
- Proof of delivery automation
- Failed delivery management
- Customer communication integration
- Crowdsourced delivery coordination

**Used By Processes**:
- Last-Mile Delivery Optimization
- Route Optimization
- Multi-Channel Fulfillment

**Tools/Libraries**: Routing APIs, last-mile platforms, driver apps, customer notification systems

---

### Fleet Management Skills

#### 20. predictive-maintenance-scheduler
**Description**: Predictive maintenance scheduling skill using telematics data and historical patterns to maximize fleet uptime.

**Capabilities**:
- Failure prediction modeling
- Maintenance schedule optimization
- Parts inventory forecasting
- Cost vs. risk analysis
- Warranty tracking integration
- Downtime minimization
- Compliance inspection scheduling

**Used By Processes**:
- Vehicle Maintenance Planning
- Fleet Performance Analytics
- Driver Scheduling and Compliance

**Tools/Libraries**: Telematics APIs, ML libraries, CMMS integration

---

#### 21. driver-scheduling-optimizer
**Description**: Automated driver assignment and hours of service compliance skill ensuring regulatory compliance and operational efficiency.

**Capabilities**:
- HOS compliance monitoring
- Driver-load matching
- Qualification verification
- Fatigue risk assessment
- Break and rest planning
- ELD data integration
- Violation prevention alerting

**Used By Processes**:
- Driver Scheduling and Compliance
- Route Optimization
- Fleet Performance Analytics

**Tools/Libraries**: ELD APIs, FMCSA compliance databases, scheduling optimization

---

#### 22. fleet-analytics-dashboard
**Description**: Comprehensive fleet performance analytics skill tracking KPIs across fuel, utilization, maintenance, and driver performance.

**Capabilities**:
- Fuel efficiency analysis
- Utilization rate tracking
- Cost per mile calculation
- Driver scorecard generation
- Idle time monitoring
- Benchmark comparison
- Trend analysis and alerting

**Used By Processes**:
- Fleet Performance Analytics
- Vehicle Maintenance Planning
- Driver Scheduling and Compliance

**Tools/Libraries**: Telematics platforms, BI tools, fuel card integration

---

### Returns and Reverse Logistics Skills

#### 23. returns-authorization-processor
**Description**: Automated return authorization and routing skill optimizing return paths and customer experience.

**Capabilities**:
- Return eligibility validation
- Return reason classification
- Return method selection (carrier, store, drop-off)
- Label generation automation
- Return tracking provision
- Refund timing estimation
- Fraud detection screening

**Used By Processes**:
- Reverse Logistics Management
- Returns Processing and Disposition
- Warranty Claims Processing

**Tools/Libraries**: OMS APIs, return label generation, fraud detection tools

---

#### 24. returns-disposition-optimizer
**Description**: AI-powered returns inspection and disposition decision skill maximizing value recovery.

**Capabilities**:
- Condition grading automation
- Disposition path optimization (restock, refurbish, liquidate)
- Value recovery maximization
- Refurbishment cost-benefit analysis
- Secondary market matching
- Recycling and disposal routing
- Disposition analytics

**Used By Processes**:
- Returns Processing and Disposition
- Reverse Logistics Management
- Dead Stock and Excess Inventory Management

**Tools/Libraries**: Inspection automation, liquidation platforms, grading systems

---

#### 25. warranty-claims-processor
**Description**: Streamlined warranty claim validation and processing skill improving customer satisfaction and reducing processing time.

**Capabilities**:
- Warranty coverage verification
- Claim validity assessment
- Parts return coordination
- Replacement/credit processing
- Supplier recovery tracking
- Warranty cost analysis
- Fraud pattern detection

**Used By Processes**:
- Warranty Claims Processing
- Returns Processing and Disposition
- Reverse Logistics Management

**Tools/Libraries**: Warranty management systems, supplier portals, claims processing

---

### Advanced Analytics Skills

#### 26. supply-chain-visibility-platform
**Description**: End-to-end supply chain visibility skill providing real-time tracking and control tower capabilities.

**Capabilities**:
- Multi-tier supplier visibility
- In-transit inventory tracking
- Exception management and alerting
- Predictive ETA modeling
- Risk event monitoring
- Performance dashboards
- Collaboration portal

**Used By Processes**:
- Shipment Tracking and Visibility
- Distribution Network Optimization
- Demand Forecasting

**Tools/Libraries**: Visibility platforms (Project44, FourKites), IoT integration, event streaming

---

#### 27. transportation-spend-analyzer
**Description**: Freight spend analysis and benchmarking skill for cost optimization and carrier negotiation support.

**Capabilities**:
- Spend cube analysis
- Lane-level rate benchmarking
- Accessorial cost breakdown
- Mode optimization opportunity identification
- Contract vs. spot analysis
- Carrier performance cost correlation
- Savings opportunity quantification

**Used By Processes**:
- Carrier Selection and Procurement
- Freight Audit and Payment
- Route Optimization

**Tools/Libraries**: Spend analysis tools, benchmarking databases, TMS analytics

---

#### 28. carbon-footprint-calculator
**Description**: Logistics carbon emission tracking and reduction planning skill supporting sustainability initiatives.

**Capabilities**:
- Scope 1, 2, 3 emission calculation
- Mode-specific carbon factors
- Route carbon optimization
- Carrier sustainability scoring
- Reduction target tracking
- Offset program integration
- Sustainability reporting

**Used By Processes**:
- Route Optimization
- Distribution Network Optimization
- Carrier Selection and Procurement

**Tools/Libraries**: Carbon calculation APIs, emission factor databases, ESG reporting tools

---

#### 29. demand-sensing-integrator
**Description**: Real-time demand sensing skill integrating POS data, market signals, and external factors for responsive planning.

**Capabilities**:
- POS data integration
- Social media signal processing
- Weather impact modeling
- Event-driven demand adjustment
- Short-term forecast refinement
- Inventory repositioning triggers
- Promotional response tracking

**Used By Processes**:
- Demand Forecasting
- Reorder Point Calculation
- Multi-Channel Fulfillment

**Tools/Libraries**: POS integration, social listening APIs, weather APIs, ML models

---

#### 30. logistics-kpi-tracker
**Description**: Comprehensive logistics performance measurement skill with KPI tracking, benchmarking, and improvement recommendations.

**Capabilities**:
- OTIF (On-Time In-Full) tracking
- Perfect order rate calculation
- Fill rate analysis
- Order cycle time measurement
- Cost per order/unit tracking
- Benchmark comparison
- Improvement opportunity identification

**Used By Processes**:
- All logistics processes (cross-cutting)

**Tools/Libraries**: BI platforms, data warehousing, logistics dashboards

---

#### 31. incoterms-compliance-checker
**Description**: International shipping terms validation and documentation skill ensuring trade compliance.

**Capabilities**:
- Incoterms 2020 validation
- Risk transfer point identification
- Cost responsibility allocation
- Document requirement generation
- Customs compliance checking
- Trade agreement validation
- Landed cost calculation

**Used By Processes**:
- Carrier Selection and Procurement
- Freight Audit and Payment
- Distribution Network Optimization

**Tools/Libraries**: Trade compliance databases, customs APIs, landed cost calculators

---

#### 32. warehouse-simulation-modeler
**Description**: Discrete event simulation skill for warehouse design validation and capacity planning.

**Capabilities**:
- Process flow simulation
- Bottleneck identification
- Capacity scenario modeling
- Equipment utilization analysis
- Labor requirement forecasting
- Layout optimization testing
- ROI calculation for automation

**Used By Processes**:
- Slotting Optimization
- Warehouse Labor Management
- Pick-Pack-Ship Operations

**Tools/Libraries**: SimPy, AnyLogic, FlexSim, Arena

---

## Agents

### Transportation Agents

#### 1. transportation-planner
**Description**: Agent specialized in transportation planning, carrier management, and freight optimization across modes.

**Responsibilities**:
- Daily transportation planning
- Carrier performance monitoring
- Mode selection optimization
- Rate negotiation support
- Exception resolution
- Service level management

**Used By Processes**:
- Route Optimization
- Carrier Selection and Procurement
- Load Planning and Consolidation
- Freight Audit and Payment

**Required Skills**: route-optimization-engine, carrier-selection-optimizer, load-optimization-calculator, transportation-spend-analyzer

---

#### 2. freight-coordinator
**Description**: Agent specialized in shipment coordination, tracking, and customer communication.

**Responsibilities**:
- Shipment booking and scheduling
- Carrier coordination
- Tracking and visibility monitoring
- Exception management
- Customer status updates
- Delivery confirmation

**Used By Processes**:
- Shipment Tracking and Visibility
- Carrier Selection and Procurement
- Last-Mile Delivery Optimization

**Required Skills**: shipment-visibility-tracker, carrier-selection-optimizer, last-mile-delivery-optimizer

---

#### 3. route-optimization-analyst
**Description**: Agent specialized in route planning, optimization analysis, and continuous improvement.

**Responsibilities**:
- Route efficiency analysis
- Delivery density optimization
- Territory design
- Fleet capacity planning
- Fuel cost optimization
- Route compliance monitoring

**Used By Processes**:
- Route Optimization
- Last-Mile Delivery Optimization
- Driver Scheduling and Compliance

**Required Skills**: route-optimization-engine, last-mile-delivery-optimizer, fleet-analytics-dashboard, carbon-footprint-calculator

---

#### 4. freight-audit-specialist
**Description**: Agent specialized in freight bill validation, discrepancy resolution, and carrier payment processing.

**Responsibilities**:
- Invoice validation
- Rate verification
- Discrepancy investigation
- Claim processing
- Payment coordination
- Audit reporting

**Used By Processes**:
- Freight Audit and Payment
- Carrier Selection and Procurement

**Required Skills**: freight-audit-validator, transportation-spend-analyzer, carrier-selection-optimizer

---

### Warehouse Agents

#### 5. warehouse-operations-manager
**Description**: Agent specialized in daily warehouse operations coordination, performance optimization, and quality management.

**Responsibilities**:
- Daily operations planning
- Resource allocation
- Quality control oversight
- Performance monitoring
- Issue resolution
- Process improvement

**Used By Processes**:
- Pick-Pack-Ship Operations
- Receiving and Putaway Optimization
- Warehouse Labor Management
- Slotting Optimization

**Required Skills**: wave-planning-optimizer, slotting-optimization-engine, labor-productivity-optimizer, warehouse-simulation-modeler

---

#### 6. inventory-control-specialist
**Description**: Agent specialized in inventory accuracy, cycle counting, and inventory reconciliation.

**Responsibilities**:
- Cycle count coordination
- Variance investigation
- Inventory adjustment processing
- Accuracy reporting
- Root cause analysis
- Process compliance

**Used By Processes**:
- Cycle Counting Program
- FIFO-LIFO Inventory Control
- Slotting Optimization

**Required Skills**: cycle-count-scheduler, fifo-lifo-controller, abc-xyz-classifier

---

#### 7. receiving-coordinator
**Description**: Agent specialized in inbound operations, dock scheduling, and putaway optimization.

**Responsibilities**:
- Dock appointment management
- ASN processing
- Receipt verification
- Putaway coordination
- Vendor compliance tracking
- Receiving metrics reporting

**Used By Processes**:
- Receiving and Putaway Optimization
- Cross-Docking Operations
- Cycle Counting Program

**Required Skills**: dock-scheduling-coordinator, slotting-optimization-engine, cross-dock-orchestrator

---

#### 8. labor-planning-analyst
**Description**: Agent specialized in workforce planning, productivity analysis, and labor optimization.

**Responsibilities**:
- Labor forecasting
- Shift planning
- Productivity tracking
- Incentive program management
- Training coordination
- Performance reporting

**Used By Processes**:
- Warehouse Labor Management
- Pick-Pack-Ship Operations

**Required Skills**: labor-productivity-optimizer, wave-planning-optimizer, warehouse-simulation-modeler

---

### Inventory Agents

#### 9. demand-planner
**Description**: Agent specialized in demand forecasting, inventory planning, and replenishment optimization.

**Responsibilities**:
- Forecast generation and maintenance
- Forecast accuracy improvement
- Demand pattern analysis
- Promotional planning integration
- S&OP process support
- Forecast consensus building

**Used By Processes**:
- Demand Forecasting
- Reorder Point Calculation
- ABC-XYZ Analysis

**Required Skills**: demand-forecasting-engine, demand-sensing-integrator, abc-xyz-classifier, safety-stock-calculator

---

#### 10. inventory-analyst
**Description**: Agent specialized in inventory analysis, policy optimization, and working capital improvement.

**Responsibilities**:
- Inventory classification
- Policy parameter setting
- Stock level optimization
- Excess inventory management
- Turn rate improvement
- Inventory health reporting

**Used By Processes**:
- ABC-XYZ Analysis
- Reorder Point Calculation
- Dead Stock and Excess Inventory Management

**Required Skills**: abc-xyz-classifier, safety-stock-calculator, dead-stock-identifier, logistics-kpi-tracker

---

#### 11. replenishment-planner
**Description**: Agent specialized in replenishment planning, order generation, and supply coordination.

**Responsibilities**:
- Replenishment order generation
- Supplier coordination
- Lead time management
- Exception handling
- Order expediting
- Replenishment performance tracking

**Used By Processes**:
- Reorder Point Calculation
- Demand Forecasting
- FIFO-LIFO Inventory Control

**Required Skills**: safety-stock-calculator, demand-forecasting-engine, fifo-lifo-controller

---

#### 12. inventory-disposition-specialist
**Description**: Agent specialized in slow-moving inventory management, disposition planning, and value recovery.

**Responsibilities**:
- Aging inventory analysis
- Disposition strategy development
- Markdown coordination
- Liquidation management
- Write-off processing
- Recovery maximization

**Used By Processes**:
- Dead Stock and Excess Inventory Management
- Returns Processing and Disposition
- ABC-XYZ Analysis

**Required Skills**: dead-stock-identifier, returns-disposition-optimizer, abc-xyz-classifier

---

### Distribution Agents

#### 13. network-planning-analyst
**Description**: Agent specialized in distribution network design, optimization, and strategic planning.

**Responsibilities**:
- Network modeling
- Facility analysis
- Capacity planning
- Cost-to-serve analysis
- Scenario evaluation
- Strategic recommendation

**Used By Processes**:
- Distribution Network Optimization
- Multi-Channel Fulfillment
- Cross-Docking Operations

**Required Skills**: network-optimization-modeler, omnichannel-fulfillment-allocator, carbon-footprint-calculator

---

#### 14. fulfillment-coordinator
**Description**: Agent specialized in order fulfillment orchestration across channels and fulfillment nodes.

**Responsibilities**:
- Order allocation
- Fulfillment node selection
- Split shipment management
- Customer promise management
- Fulfillment exception handling
- Channel coordination

**Used By Processes**:
- Multi-Channel Fulfillment
- Last-Mile Delivery Optimization
- Distribution Network Optimization

**Required Skills**: omnichannel-fulfillment-allocator, last-mile-delivery-optimizer, logistics-kpi-tracker

---

#### 15. cross-dock-coordinator
**Description**: Agent specialized in cross-docking operations, flow-through coordination, and timing synchronization.

**Responsibilities**:
- Inbound/outbound synchronization
- Floor staging management
- Carrier coordination
- Sort and segregation
- Flow optimization
- Performance tracking

**Used By Processes**:
- Cross-Docking Operations
- Receiving and Putaway Optimization
- Distribution Network Optimization

**Required Skills**: cross-dock-orchestrator, dock-scheduling-coordinator, load-optimization-calculator

---

#### 16. last-mile-coordinator
**Description**: Agent specialized in final-mile delivery coordination, customer scheduling, and delivery confirmation.

**Responsibilities**:
- Delivery scheduling
- Driver dispatch
- Customer communication
- Failed delivery management
- POD collection
- Performance monitoring

**Used By Processes**:
- Last-Mile Delivery Optimization
- Multi-Channel Fulfillment
- Shipment Tracking and Visibility

**Required Skills**: last-mile-delivery-optimizer, route-optimization-engine, shipment-visibility-tracker

---

### Fleet Management Agents

#### 17. fleet-manager
**Description**: Agent specialized in fleet operations, maintenance coordination, and performance optimization.

**Responsibilities**:
- Fleet capacity planning
- Maintenance scheduling
- Asset utilization optimization
- Cost management
- Compliance oversight
- Performance reporting

**Used By Processes**:
- Vehicle Maintenance Planning
- Fleet Performance Analytics
- Driver Scheduling and Compliance

**Required Skills**: predictive-maintenance-scheduler, fleet-analytics-dashboard, driver-scheduling-optimizer

---

#### 18. driver-operations-coordinator
**Description**: Agent specialized in driver scheduling, compliance monitoring, and performance management.

**Responsibilities**:
- Driver scheduling
- HOS compliance monitoring
- Safety program coordination
- Performance tracking
- Training coordination
- Violation management

**Used By Processes**:
- Driver Scheduling and Compliance
- Fleet Performance Analytics
- Route Optimization

**Required Skills**: driver-scheduling-optimizer, fleet-analytics-dashboard, route-optimization-engine

---

#### 19. maintenance-planner
**Description**: Agent specialized in fleet maintenance planning, parts inventory, and downtime minimization.

**Responsibilities**:
- Maintenance scheduling
- Predictive maintenance coordination
- Parts procurement
- Vendor management
- Downtime tracking
- Cost analysis

**Used By Processes**:
- Vehicle Maintenance Planning
- Fleet Performance Analytics

**Required Skills**: predictive-maintenance-scheduler, fleet-analytics-dashboard

---

### Returns and Reverse Logistics Agents

#### 20. returns-manager
**Description**: Agent specialized in returns management, reverse logistics coordination, and customer experience optimization.

**Responsibilities**:
- Returns policy management
- Reverse logistics coordination
- Customer communication
- Return authorization processing
- Performance monitoring
- Process improvement

**Used By Processes**:
- Reverse Logistics Management
- Returns Processing and Disposition
- Warranty Claims Processing

**Required Skills**: returns-authorization-processor, returns-disposition-optimizer, warranty-claims-processor

---

#### 21. disposition-analyst
**Description**: Agent specialized in returns inspection, grading, and disposition optimization for value recovery.

**Responsibilities**:
- Inspection coordination
- Grading standardization
- Disposition decision support
- Value recovery tracking
- Secondary market coordination
- Disposition analytics

**Used By Processes**:
- Returns Processing and Disposition
- Reverse Logistics Management
- Dead Stock and Excess Inventory Management

**Required Skills**: returns-disposition-optimizer, dead-stock-identifier, logistics-kpi-tracker

---

#### 22. warranty-claims-coordinator
**Description**: Agent specialized in warranty claim processing, supplier recovery, and customer satisfaction.

**Responsibilities**:
- Claim validation
- Customer communication
- Parts return coordination
- Credit processing
- Supplier recovery
- Claims analysis

**Used By Processes**:
- Warranty Claims Processing
- Returns Processing and Disposition

**Required Skills**: warranty-claims-processor, returns-authorization-processor

---

### Analytics and Planning Agents

#### 23. logistics-analytics-specialist
**Description**: Agent specialized in logistics data analysis, KPI reporting, and performance optimization recommendations.

**Responsibilities**:
- KPI tracking and reporting
- Performance analysis
- Benchmarking
- Root cause analysis
- Improvement recommendations
- Dashboard development

**Used By Processes**:
- All logistics processes (cross-cutting analytics support)

**Required Skills**: logistics-kpi-tracker, transportation-spend-analyzer, fleet-analytics-dashboard, supply-chain-visibility-platform

---

#### 24. sustainability-coordinator
**Description**: Agent specialized in logistics sustainability, carbon footprint tracking, and green logistics initiatives.

**Responsibilities**:
- Carbon footprint tracking
- Sustainability target monitoring
- Green logistics initiative coordination
- Carrier sustainability assessment
- Reporting and compliance
- Improvement opportunity identification

**Used By Processes**:
- Route Optimization
- Carrier Selection and Procurement
- Distribution Network Optimization

**Required Skills**: carbon-footprint-calculator, route-optimization-engine, network-optimization-modeler

---

## Process to Skills/Agents Mapping

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| Route Optimization | route-optimization-engine, carbon-footprint-calculator | transportation-planner, route-optimization-analyst |
| Carrier Selection and Procurement | carrier-selection-optimizer, transportation-spend-analyzer, incoterms-compliance-checker | transportation-planner, freight-audit-specialist |
| Freight Audit and Payment | freight-audit-validator, transportation-spend-analyzer | freight-audit-specialist |
| Load Planning and Consolidation | load-optimization-calculator, route-optimization-engine | transportation-planner |
| Shipment Tracking and Visibility | shipment-visibility-tracker, supply-chain-visibility-platform | freight-coordinator, last-mile-coordinator |
| Slotting Optimization | slotting-optimization-engine, warehouse-simulation-modeler | warehouse-operations-manager |
| Pick-Pack-Ship Operations | wave-planning-optimizer, labor-productivity-optimizer | warehouse-operations-manager, labor-planning-analyst |
| Cycle Counting Program | cycle-count-scheduler, abc-xyz-classifier | inventory-control-specialist |
| Receiving and Putaway Optimization | dock-scheduling-coordinator, slotting-optimization-engine | receiving-coordinator |
| Warehouse Labor Management | labor-productivity-optimizer, warehouse-simulation-modeler | labor-planning-analyst |
| ABC-XYZ Analysis | abc-xyz-classifier, demand-forecasting-engine | inventory-analyst, demand-planner |
| Reorder Point Calculation | safety-stock-calculator, demand-forecasting-engine | replenishment-planner, demand-planner |
| FIFO-LIFO Inventory Control | fifo-lifo-controller, cycle-count-scheduler | inventory-control-specialist, replenishment-planner |
| Demand Forecasting | demand-forecasting-engine, demand-sensing-integrator | demand-planner |
| Dead Stock and Excess Inventory Management | dead-stock-identifier, returns-disposition-optimizer | inventory-disposition-specialist |
| Distribution Network Optimization | network-optimization-modeler, carbon-footprint-calculator | network-planning-analyst |
| Cross-Docking Operations | cross-dock-orchestrator, dock-scheduling-coordinator | cross-dock-coordinator |
| Multi-Channel Fulfillment | omnichannel-fulfillment-allocator, last-mile-delivery-optimizer | fulfillment-coordinator |
| Last-Mile Delivery Optimization | last-mile-delivery-optimizer, route-optimization-engine | last-mile-coordinator, route-optimization-analyst |
| Vehicle Maintenance Planning | predictive-maintenance-scheduler, fleet-analytics-dashboard | fleet-manager, maintenance-planner |
| Driver Scheduling and Compliance | driver-scheduling-optimizer, fleet-analytics-dashboard | driver-operations-coordinator |
| Fleet Performance Analytics | fleet-analytics-dashboard, predictive-maintenance-scheduler | fleet-manager, logistics-analytics-specialist |
| Reverse Logistics Management | returns-authorization-processor, supply-chain-visibility-platform | returns-manager |
| Returns Processing and Disposition | returns-disposition-optimizer, dead-stock-identifier | disposition-analyst, returns-manager |
| Warranty Claims Processing | warranty-claims-processor, returns-authorization-processor | warranty-claims-coordinator |

---

## Shared Candidates (Cross-Specialization)

These skills and agents could be shared with other specializations:

### Shared Skills

1. **demand-forecasting-engine** - Useful for Supply Chain Planning, Retail, Manufacturing, and Finance specializations
2. **carbon-footprint-calculator** - Applicable to Sustainability, ESG Reporting, and Manufacturing specializations
3. **route-optimization-engine** - Useful for Field Service, Sales Operations, and Delivery Services
4. **warehouse-simulation-modeler** - Applicable to Manufacturing, Process Engineering, and Operations Research
5. **logistics-kpi-tracker** - Useful for any operations-focused domain requiring performance measurement
6. **network-optimization-modeler** - Applicable to Supply Chain, Manufacturing Network, and Retail Location Planning
7. **incoterms-compliance-checker** - Useful for International Trade, Procurement, and Import/Export specializations

### Shared Agents

1. **demand-planner** - Demand planning expertise applicable to Supply Chain, Retail, Manufacturing specializations
2. **logistics-analytics-specialist** - Analytics expertise applicable to any operations-intensive domain
3. **sustainability-coordinator** - Sustainability expertise applicable to ESG, Corporate Responsibility specializations
4. **network-planning-analyst** - Network design applicable to Supply Chain, Retail, Manufacturing Network specializations

---

## Implementation Priority

### High Priority (Core Logistics Workflows)
1. route-optimization-engine
2. shipment-visibility-tracker
3. demand-forecasting-engine
4. wave-planning-optimizer
5. abc-xyz-classifier
6. safety-stock-calculator
7. transportation-planner (agent)
8. warehouse-operations-manager (agent)
9. demand-planner (agent)

### Medium Priority (Operational Efficiency)
1. carrier-selection-optimizer
2. load-optimization-calculator
3. slotting-optimization-engine
4. labor-productivity-optimizer
5. network-optimization-modeler
6. last-mile-delivery-optimizer
7. freight-coordinator (agent)
8. inventory-analyst (agent)
9. fulfillment-coordinator (agent)

### Lower Priority (Advanced Capabilities)
1. freight-audit-validator
2. predictive-maintenance-scheduler
3. returns-disposition-optimizer
4. warehouse-simulation-modeler
5. carbon-footprint-calculator
6. incoterms-compliance-checker
7. fleet-manager (agent)
8. returns-manager (agent)
9. sustainability-coordinator (agent)

---

## Notes

- All skills should integrate with common logistics systems (WMS, TMS, ERP) via standard APIs
- Skills should support real-time and batch processing for operational and planning use cases
- Agents should maintain audit trails for compliance with transportation and trade regulations
- Error handling should include exception escalation procedures appropriate for time-sensitive operations
- Skills should support multi-modal transportation including road, rail, air, and ocean
- Integration with IoT devices (telematics, RFID, GPS) should be prioritized for visibility skills
- All skills should handle multiple units of measure and currency conversions for international operations
- Agents should support regulatory compliance (DOT, FMCSA, FDA, OSHA) where applicable
- Time-sensitive processes should include deadline awareness and priority-based processing
- Skills should support both domestic and international logistics with appropriate documentation handling

---

*Last Updated: January 2026*
