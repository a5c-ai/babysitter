# Logistics and Operations - Skills and Agents References (Phase 5)

## Overview

This document provides references to GitHub repositories, MCP (Model Context Protocol) servers, community resources, and commercial tools that can support the implementation of the skills and agents identified in the Logistics and Operations backlog. These references serve as starting points for building or integrating specialized logistics capabilities.

---

## Transportation Skills References

### 1. route-optimization-engine

**GitHub Repositories**:
- [google/or-tools](https://github.com/google/or-tools) - Google's Operations Research tools with vehicle routing problem (VRP) solvers
- [VROOM-Project/vroom](https://github.com/VROOM-Project/vroom) - Vehicle Routing Open-source Optimization Machine
- [Project-OSRM/osrm-backend](https://github.com/Project-OSRM/osrm-backend) - Open Source Routing Machine for shortest paths
- [graphhopper/graphhopper](https://github.com/graphhopper/graphhopper) - Fast and memory-efficient routing engine
- [jsprit/jsprit](https://github.com/jsprit/jsprit) - Java-based vehicle routing toolkit

**MCP Servers**:
- `@modelcontextprotocol/server-maps` - Maps and routing integration for LLMs
- Custom MCP server wrapping OR-Tools for VRP solving

**Community Resources**:
- [CVRPLIB](http://vrp.atd-lab.inf.puc-rio.br/index.php/en/) - Capacitated Vehicle Routing Problem Library
- [VRP-REP](http://www.vrp-rep.org/) - Vehicle Routing Problem Repository
- Google OR-Tools VRP documentation and examples

**Commercial APIs**:
- Google Maps Platform Directions API
- HERE Routing API
- Mapbox Directions API
- TomTom Routing API

---

### 2. carrier-selection-optimizer

**GitHub Repositories**:
- [scikit-criteria/scikit-criteria](https://github.com/scikit-criteria/scikit-criteria) - Multi-criteria decision making in Python
- [pymcdm/pymcdm](https://github.com/pymcdm/pymcdm) - Python library for MCDM methods
- [ahp-library](https://github.com/PhilipGrworking/ahp-library) - Analytic Hierarchy Process implementation

**MCP Servers**:
- Custom MCP server for carrier rate management
- Integration with TMS APIs via MCP

**Community Resources**:
- FreightWaves SONAR data (freight market intelligence)
- DAT Freight & Analytics benchmarks
- Carrier411 performance data

**Commercial APIs/Platforms**:
- Trimble TMS APIs
- project44 carrier connectivity
- MercuryGate TMS API
- Transplace Carrier Portal

---

### 3. freight-audit-validator

**GitHub Repositories**:
- [tesseract-ocr/tesseract](https://github.com/tesseract-ocr/tesseract) - OCR engine for invoice data extraction
- [Invoice2Data/invoice2data](https://github.com/Invoice2Data/invoice2data) - Extract data from PDF invoices
- [jsvine/pdfplumber](https://github.com/jsvine/pdfplumber) - PDF data extraction library
- [EDI-Standards/X12](https://github.com/topics/edi-x12) - EDI X12 parsing libraries

**MCP Servers**:
- `@anthropic/pdf-reader-mcp` - PDF document processing
- Custom MCP server for EDI 210 (freight invoice) parsing

**Community Resources**:
- X12 EDI Implementation Guides
- GS1 standards documentation
- IACC (International Accounting Standards Committee) freight audit guidelines

**Commercial Platforms**:
- Cass Information Systems
- CT Logistics
- nVision Global
- Freight Payment Services

---

### 4. load-optimization-calculator

**GitHub Repositories**:
- [enzoruiz/3dbinpacking](https://github.com/enzoruiz/3dbinpacking) - 3D bin packing algorithm
- [brenov/3d-bin-packing](https://github.com/brenov/3d-bin-packing) - 3D bin packing heuristics
- [PyCuPO/boxpacking](https://github.com/topics/bin-packing) - Container loading optimization
- [Packer3D/py3dbp](https://github.com/enzoruiz/3dbinpacking) - 3D bin packing problem solver

**MCP Servers**:
- Custom MCP server for load planning optimization

**Community Resources**:
- ESICUP (Euro Special Interest Group on Cutting and Packing)
- Container Loading Problem benchmarks
- Load planning best practices from SMC3

**Commercial Platforms**:
- MagicLogic LoadPlanner
- TOPS Engineering Cube-IQ
- CargoWiz load planning software

---

### 5. shipment-visibility-tracker

**GitHub Repositories**:
- [aftership/aftership-sdk-python](https://github.com/AfterShip/aftership-sdk-python) - Package tracking SDK
- [trackingmore/tracking-sdk](https://github.com/trackingmore/trackingmore-sdk-java) - Multi-carrier tracking
- [tracking-tools](https://github.com/topics/shipment-tracking) - Various shipment tracking utilities

**MCP Servers**:
- Custom MCP server integrating with carrier APIs
- `@modelcontextprotocol/server-fetch` - HTTP API calls for tracking

**Community Resources**:
- OpenTrack initiative
- Visibility Leadership Council resources
- AIAG supply chain visibility standards

**Commercial APIs/Platforms**:
- project44 Advanced Visibility Platform
- FourKites Real-Time Visibility
- MacroPoint carrier tracking
- Descartes GLN (Global Logistics Network)
- Shippeo visibility platform

---

## Warehouse Skills References

### 6. slotting-optimization-engine

**GitHub Repositories**:
- [scikit-learn/scikit-learn](https://github.com/scikit-learn/scikit-learn) - ML for product clustering
- [scipy/scipy](https://github.com/scipy/scipy) - Optimization algorithms
- [deap/deap](https://github.com/DEAP/deap) - Evolutionary algorithms for optimization

**MCP Servers**:
- Custom MCP server for WMS integration
- Slotting analytics MCP server

**Community Resources**:
- WERC (Warehousing Education and Research Council) best practices
- MHI slotting guidelines
- CSCMP warehouse optimization resources

**Commercial Platforms**:
- Manhattan Associates Slotting Optimization
- Blue Yonder Warehouse Management
- Oracle WMS Slotting Module
- Körber Supply Chain Slotting

---

### 7. wave-planning-optimizer

**GitHub Repositories**:
- [pyomo/pyomo](https://github.com/Pyomo/pyomo) - Mathematical optimization modeling
- [coin-or/pulp](https://github.com/coin-or/pulp) - Linear programming
- [optuna/optuna](https://github.com/optuna/optuna) - Hyperparameter optimization

**MCP Servers**:
- Custom MCP server for wave release optimization
- WMS integration MCP server

**Community Resources**:
- CSCMP warehouse picking strategies
- WERC wave planning best practices
- Supply Chain Digest resources

**Commercial Platforms**:
- Manhattan Active Warehouse Management
- SAP Extended Warehouse Management
- Blue Yonder WMS
- Softeon Wave Planning

---

### 8. cycle-count-scheduler

**GitHub Repositories**:
- [statsmodels/statsmodels](https://github.com/statsmodels/statsmodels) - Statistical sampling
- [sampling](https://github.com/topics/statistical-sampling) - Sampling methodologies
- [pandas-dev/pandas](https://github.com/pandas-dev/pandas) - Data analysis for variance tracking

**MCP Servers**:
- Custom MCP server for cycle count automation
- Inventory reconciliation MCP server

**Community Resources**:
- APICS inventory management guidelines
- IMA (Institute of Management Accountants) inventory count standards
- ASCM cycle counting best practices

**Commercial Platforms**:
- SAP WMS Cycle Count
- Oracle Inventory Count
- Manhattan Associates Cycle Count
- Fishbowl Inventory

---

### 9. dock-scheduling-coordinator

**GitHub Repositories**:
- [optaplanner/optaplanner](https://github.com/kiegroup/optaplanner) - Constraint satisfaction solver
- [timefold-solver/timefold-solver](https://github.com/TimefoldAI/timefold-solver) - Planning optimization
- [scheduling-tools](https://github.com/topics/scheduling-algorithm) - Various scheduling algorithms

**MCP Servers**:
- Custom MCP server for dock appointment management
- Carrier portal integration MCP server

**Community Resources**:
- WERC dock scheduling best practices
- MHI yard management guidelines
- Supply Chain Brain resources

**Commercial Platforms**:
- C3 Reservations
- Descartes Dock Appointment Scheduling
- Exotrac yard management
- FourKites Dynamic Yard
- OpenDock

---

### 10. labor-productivity-optimizer

**GitHub Repositories**:
- [prophet/prophet](https://github.com/facebook/prophet) - Forecasting for workload prediction
- [workforce-scheduling](https://github.com/topics/workforce-scheduling) - Scheduling algorithms
- [python-mip/python-mip](https://github.com/coin-or/python-mip) - Mixed integer programming

**MCP Servers**:
- Custom MCP server for LMS integration
- Workforce analytics MCP server

**Community Resources**:
- WERC labor management standards
- ProMat labor productivity resources
- Engineered labor standards guides (MOST, MTM)

**Commercial Platforms**:
- Manhattan Labor Management
- JDA Workforce Management
- Lucas Systems Voice-Directed Work
- Honeywell Intelligrated Labor Management

---

## Inventory Skills References

### 11. abc-xyz-classifier

**GitHub Repositories**:
- [pandas-dev/pandas](https://github.com/pandas-dev/pandas) - Data analysis for classification
- [numpy/numpy](https://github.com/numpy/numpy) - Numerical computing for Pareto analysis
- [inventory-classification](https://github.com/topics/inventory-management) - Inventory tools

**MCP Servers**:
- Custom MCP server for inventory analytics
- ERP integration MCP server

**Community Resources**:
- APICS inventory classification guidelines
- ASCM demand planning resources
- IBF (Institute of Business Forecasting) best practices

**Commercial Platforms**:
- SAP Integrated Business Planning
- Oracle Demand Management Cloud
- Kinaxis RapidResponse
- o9 Solutions

---

### 12. safety-stock-calculator

**GitHub Repositories**:
- [scipy/scipy](https://github.com/scipy/scipy) - Statistical calculations
- [inventorize](https://github.com/koaning/inventorize) - Inventory optimization
- [supplychainpy](https://github.com/KevinFas662/supplychainpy) - Supply chain analytics

**MCP Servers**:
- Custom MCP server for inventory optimization
- Demand variability analysis MCP server

**Community Resources**:
- APICS inventory planning resources
- MIT Center for Transportation & Logistics research
- ISM (Institute for Supply Management) guidelines

**Commercial Platforms**:
- SAP Inventory Optimization
- Oracle Inventory Optimization Cloud
- LLamasoft Supply Chain Guru
- ToolsGroup Service Optimizer

---

### 13. fifo-lifo-controller

**GitHub Repositories**:
- [wms-modules](https://github.com/topics/warehouse-management) - WMS components
- [lot-tracking](https://github.com/topics/lot-tracking) - Lot and batch tracking libraries

**MCP Servers**:
- Custom MCP server for inventory rotation management
- WMS integration MCP server for lot control

**Community Resources**:
- FDA 21 CFR Part 211 (pharmaceutical FIFO requirements)
- FSMA (Food Safety Modernization Act) traceability guidelines
- GS1 lot tracking standards

**Commercial Platforms**:
- SAP Batch Management
- Oracle Lot Control
- SYSPRO Lot Traceability
- Infor CloudSuite Industrial

---

### 14. demand-forecasting-engine

**GitHub Repositories**:
- [facebook/prophet](https://github.com/facebook/prophet) - Time series forecasting
- [unit8co/darts](https://github.com/unit8co/darts) - Time series library with multiple models
- [nixtla/statsforecast](https://github.com/Nixtla/statsforecast) - Statistical forecasting
- [amazon-science/chronos-forecasting](https://github.com/amazon-science/chronos-forecasting) - Foundation models for forecasting
- [awslabs/gluonts](https://github.com/awslabs/gluonts) - Probabilistic time series modeling
- [sktime/sktime](https://github.com/sktime/sktime) - ML toolbox for time series

**MCP Servers**:
- Custom MCP server for demand forecasting
- Time series analysis MCP server
- `@modelcontextprotocol/server-filesystem` - Data file access for training data

**Community Resources**:
- M5 Forecasting Competition resources
- Makridakis Forecasting Competition archives
- Forecasting Principles and Practice (online textbook)
- IBF demand planning community

**Commercial Platforms**:
- SAP Integrated Business Planning
- Blue Yonder Demand Planning
- o9 Solutions AI-Powered Demand Sensing
- Kinaxis RapidResponse
- Oracle Demand Management Cloud

---

### 15. dead-stock-identifier

**GitHub Repositories**:
- [pandas-dev/pandas](https://github.com/pandas-dev/pandas) - Aging analysis
- [inventory-analytics](https://github.com/topics/inventory-analytics) - Inventory analysis tools

**MCP Servers**:
- Custom MCP server for inventory aging analysis
- Disposition planning MCP server

**Community Resources**:
- APICS obsolete inventory management
- CSCMP excess inventory strategies
- Reverse Logistics Association resources

**Commercial Platforms**:
- B-Stock Solutions (liquidation)
- Liquidity Services
- Overstock.com B2B
- DirectLiquidation

---

## Distribution Skills References

### 16. network-optimization-modeler

**GitHub Repositories**:
- [pyomo/pyomo](https://github.com/Pyomo/pyomo) - Optimization modeling
- [scipy/scipy](https://github.com/scipy/scipy) - Optimization algorithms
- [SCIP-Interfaces/PySCIPOpt](https://github.com/scipopt/PySCIPOpt) - Mixed integer programming

**MCP Servers**:
- Custom MCP server for network modeling
- Facility location optimization MCP server

**Community Resources**:
- CSCMP network design resources
- MIT CTL supply chain network research
- Council of Supply Chain Management Professionals

**Commercial Platforms**:
- LLamasoft Supply Chain Guru (Coupa)
- AIMMS Network Design
- anyLogistix simulation and optimization
- ORTEC Network Planning

---

### 17. cross-dock-orchestrator

**GitHub Repositories**:
- [scheduling-algorithms](https://github.com/topics/scheduling) - Scheduling optimization
- [constraint-satisfaction](https://github.com/topics/constraint-satisfaction) - Constraint programming

**MCP Servers**:
- Custom MCP server for cross-dock coordination
- Inbound-outbound synchronization MCP server

**Community Resources**:
- WERC cross-docking best practices
- MHI cross-dock design guidelines
- CSCMP flow-through logistics resources

**Commercial Platforms**:
- Manhattan Cross-Dock Module
- SAP EWM Cross-Docking
- Blue Yonder Cross-Dock Planning
- Softeon Cross-Dock

---

### 18. omnichannel-fulfillment-allocator

**GitHub Repositories**:
- [google/or-tools](https://github.com/google/or-tools) - Allocation optimization
- [distributed-order-management](https://github.com/topics/order-management) - DOM components

**MCP Servers**:
- Custom MCP server for order allocation
- Inventory visibility MCP server across channels

**Community Resources**:
- NRF (National Retail Federation) omnichannel resources
- Retail Industry Leaders Association (RILA)
- Gartner Magic Quadrant for DOM

**Commercial Platforms**:
- Manhattan Active Omni
- Fluent Commerce Order Management
- IBM Sterling Order Management
- Radial (bpost) Order Management

---

### 19. last-mile-delivery-optimizer

**GitHub Repositories**:
- [VROOM-Project/vroom](https://github.com/VROOM-Project/vroom) - Route optimization
- [graphhopper/graphhopper](https://github.com/graphhopper/graphhopper) - Routing engine
- [delivery-optimization](https://github.com/topics/delivery-optimization) - Last-mile tools

**MCP Servers**:
- Custom MCP server for last-mile routing
- Customer notification MCP server

**Community Resources**:
- Capgemini Research Institute last-mile reports
- McKinsey last-mile delivery research
- World Economic Forum urban logistics resources

**Commercial Platforms**:
- Bringg delivery management
- Onfleet last-mile platform
- Locus dispatch management
- Circuit route planner
- Routific delivery optimization

---

## Fleet Management Skills References

### 20. predictive-maintenance-scheduler

**GitHub Repositories**:
- [scikit-learn/scikit-learn](https://github.com/scikit-learn/scikit-learn) - ML for prediction
- [PyRCA/pyrca](https://github.com/topics/predictive-maintenance) - Root cause analysis
- [tensorflow/tensorflow](https://github.com/tensorflow/tensorflow) - Deep learning for prediction
- [predictive-maintenance](https://github.com/topics/predictive-maintenance) - Various PdM tools

**MCP Servers**:
- Custom MCP server for telematics data analysis
- Maintenance scheduling MCP server

**Community Resources**:
- NACFE (North American Council for Freight Efficiency)
- American Trucking Associations (ATA) maintenance resources
- TMC Recommended Practices

**Commercial Platforms**:
- Samsara Fleet Management
- Geotab telematics
- Trimble Transportation Management
- Verizon Connect Fleet
- KeepTruckin (Motive)

---

### 21. driver-scheduling-optimizer

**GitHub Repositories**:
- [optaplanner/optaplanner](https://github.com/kiegroup/optaplanner) - Scheduling optimization
- [python-constraint](https://github.com/topics/constraint-programming) - Constraint satisfaction
- [scheduling-algorithms](https://github.com/topics/scheduling-algorithm) - Various schedulers

**MCP Servers**:
- Custom MCP server for HOS compliance
- ELD integration MCP server

**Community Resources**:
- FMCSA Hours of Service regulations
- ATA compliance resources
- OOIDA (Owner-Operator Independent Drivers Association) guides

**Commercial Platforms**:
- Omnitracs ELD and HOS
- PeopleNet ELD solutions
- KeepTruckin (Motive) compliance
- BigRoad ELD
- JJ Keller ELogs

---

### 22. fleet-analytics-dashboard

**GitHub Repositories**:
- [plotly/dash](https://github.com/plotly/dash) - Dashboard framework
- [grafana/grafana](https://github.com/grafana/grafana) - Analytics and monitoring
- [apache/superset](https://github.com/apache/superset) - BI platform

**MCP Servers**:
- Custom MCP server for fleet KPI calculation
- Telematics data aggregation MCP server

**Community Resources**:
- NACFE Trucking Efficiency resources
- ATRI (American Transportation Research Institute) benchmarks
- Fleet Owner magazine resources

**Commercial Platforms**:
- Samsara Dashboard
- Verizon Connect Reveal
- Geotab MyGeotab
- Trimble TMW Systems

---

## Returns and Reverse Logistics Skills References

### 23. returns-authorization-processor

**GitHub Repositories**:
- [returns-management](https://github.com/topics/returns-management) - Returns processing tools
- [fraud-detection](https://github.com/topics/fraud-detection) - Fraud screening libraries

**MCP Servers**:
- Custom MCP server for returns authorization
- Customer communication MCP server

**Community Resources**:
- Reverse Logistics Association (RLA)
- CSCMP reverse logistics resources
- NRF return rate benchmarks

**Commercial Platforms**:
- Narvar Returns
- Loop Returns
- Happy Returns
- Returnly
- AfterShip Returns Center

---

### 24. returns-disposition-optimizer

**GitHub Repositories**:
- [decision-trees](https://github.com/topics/decision-tree) - Disposition decision support
- [classification-algorithms](https://github.com/topics/classification) - Grading automation

**MCP Servers**:
- Custom MCP server for disposition optimization
- Value recovery analysis MCP server

**Community Resources**:
- RLA disposition best practices
- Sustainable Brands circular economy resources
- Ellen MacArthur Foundation circular supply chain

**Commercial Platforms**:
- goTRG returns processing
- Optoro returns optimization
- B-Stock liquidation
- FloorFound refurbishment

---

### 25. warranty-claims-processor

**GitHub Repositories**:
- [claims-processing](https://github.com/topics/claims-processing) - Claims automation
- [workflow-automation](https://github.com/topics/workflow-automation) - Process automation

**MCP Servers**:
- Custom MCP server for warranty validation
- Supplier recovery MCP server

**Community Resources**:
- NAWCR (National Association of Warranty Compliance Regulators)
- Warranty Week industry benchmarks
- ACWA (Association of Consumer Warranty Administrators)

**Commercial Platforms**:
- Pegasystems Claims Management
- SAP Service Cloud Warranty
- Oracle Field Service Warranty
- Tavant Warranty Management

---

## Advanced Analytics Skills References

### 26. supply-chain-visibility-platform

**GitHub Repositories**:
- [apache/kafka](https://github.com/apache/kafka) - Event streaming
- [event-driven-architecture](https://github.com/topics/event-driven) - Event processing

**MCP Servers**:
- Custom MCP server for visibility aggregation
- Multi-tier supplier integration MCP server

**Community Resources**:
- GS1 visibility standards (EPCIS)
- Visibility Leadership Council
- Supply Chain Risk Leadership Council

**Commercial Platforms**:
- project44 Movement
- FourKites Dynamic Yard
- Overhaul supply chain visibility
- Elementum supply chain orchestration

---

### 27. transportation-spend-analyzer

**GitHub Repositories**:
- [pandas-dev/pandas](https://github.com/pandas-dev/pandas) - Data analysis
- [spend-analytics](https://github.com/topics/spend-analysis) - Spend analysis tools

**MCP Servers**:
- Custom MCP server for freight spend analysis
- Rate benchmarking MCP server

**Community Resources**:
- FreightWaves SONAR benchmarks
- DAT Trendlines
- Chainalytics benchmarking

**Commercial Platforms**:
- Cass Transportation Cost IQ
- Enverus (formerly TranzAct) Bid Analysis
- SMC3 RateWare
- Trax Technologies spend management

---

### 28. carbon-footprint-calculator

**GitHub Repositories**:
- [ghgprotocol](https://github.com/topics/ghg-protocol) - GHG Protocol tools
- [carbon-footprint](https://github.com/topics/carbon-footprint) - Carbon calculation libraries
- [climatiq-api](https://github.com/topics/sustainability) - Carbon emission APIs

**MCP Servers**:
- Custom MCP server for carbon calculation
- Sustainability reporting MCP server

**Community Resources**:
- GHG Protocol Supply Chain Standard
- EPA SmartWay Program
- Global Logistics Emissions Council (GLEC)
- Science Based Targets initiative (SBTi)

**Commercial Platforms**:
- EcoTransIT World
- Climatiq API
- Sphera ESG
- Persefoni carbon management

---

### 29. demand-sensing-integrator

**GitHub Repositories**:
- [apache/kafka](https://github.com/apache/kafka) - Real-time data streaming
- [stream-processing](https://github.com/topics/stream-processing) - Stream processing

**MCP Servers**:
- Custom MCP server for POS data integration
- External signal processing MCP server

**Community Resources**:
- GS1 POS data standards
- VICS (Voluntary Interindustry Commerce Solutions)
- EDI X12 852 Product Activity Data

**Commercial Platforms**:
- Blue Yonder Luminate Demand Edge
- o9 Solutions Demand Sensing
- SAP Integrated Business Planning Demand
- Kinaxis Demand360

---

### 30. logistics-kpi-tracker

**GitHub Repositories**:
- [grafana/grafana](https://github.com/grafana/grafana) - Metrics dashboards
- [prometheus/prometheus](https://github.com/prometheus/prometheus) - Metrics collection
- [apache/superset](https://github.com/apache/superset) - BI platform

**MCP Servers**:
- Custom MCP server for KPI aggregation
- Cross-functional metrics MCP server

**Community Resources**:
- SCOR Model metrics (ASCM)
- APQC supply chain benchmarks
- Gartner Supply Chain Top 25 metrics

**Commercial Platforms**:
- SAP Analytics Cloud
- Tableau/Salesforce
- Microsoft Power BI
- ThoughtSpot logistics analytics

---

### 31. incoterms-compliance-checker

**GitHub Repositories**:
- [trade-compliance](https://github.com/topics/trade-compliance) - Compliance tools
- [customs-automation](https://github.com/topics/customs) - Customs processing

**MCP Servers**:
- Custom MCP server for Incoterms validation
- Trade compliance MCP server

**Community Resources**:
- ICC Incoterms 2020 official rules
- World Customs Organization (WCO) standards
- U.S. Customs and Border Protection resources

**Commercial Platforms**:
- Thomson Reuters ONESOURCE Global Trade
- Amber Road (E2open) Global Trade Management
- Descartes CustomsInfo
- SAP Global Trade Services

---

### 32. warehouse-simulation-modeler

**GitHub Repositories**:
- [simpy/simpy](https://github.com/simpy/simpy) - Discrete event simulation
- [ciw-project/ciw](https://github.com/CiwPython/Ciw) - Queuing network simulation
- [salabim/salabim](https://github.com/salabim/salabim) - DES in Python

**MCP Servers**:
- Custom MCP server for simulation modeling
- Scenario analysis MCP server

**Community Resources**:
- INFORMS simulation resources
- Winter Simulation Conference proceedings
- MHI automation ROI calculators

**Commercial Platforms**:
- AnyLogic simulation
- FlexSim warehouse simulation
- Simio simulation software
- AutoMod/Demo3D (Siemens)

---

## Agent Implementation References

### Transportation Agents

**Agent Frameworks**:
- [langchain-ai/langchain](https://github.com/langchain-ai/langchain) - LLM application framework
- [microsoft/autogen](https://github.com/microsoft/autogen) - Multi-agent conversation
- [anthropics/courses/anthropic-cookbook](https://github.com/anthropics/anthropic-cookbook) - Claude agent patterns
- [crewai/crewai](https://github.com/crewai-inc/crewai) - Multi-agent orchestration

**MCP Integration Patterns**:
- Use MCP servers as tool providers for agents
- Chain multiple MCP servers for complex workflows
- Implement agent memory via `@modelcontextprotocol/server-memory`

**Reference Architectures**:
- Transportation Management System (TMS) integration patterns
- Carrier connectivity hub architecture
- Real-time tracking event processing pipeline

---

### Warehouse Agents

**Agent Frameworks**:
- Same as Transportation Agents (langchain, autogen, crewai)
- Consider task-specific agents with specialized prompts

**MCP Integration Patterns**:
- WMS API wrapper MCP servers
- IoT device integration (RFID, barcode) via MCP
- Real-time inventory position tracking

**Reference Architectures**:
- Warehouse Execution System (WES) integration
- Pick-by-voice/light system connectivity
- Automated storage and retrieval system (ASRS) coordination

---

### Inventory Agents

**Agent Frameworks**:
- Same frameworks with focus on analytical capabilities
- Integration with forecasting models via MCP

**MCP Integration Patterns**:
- ERP inventory module integration
- Demand planning system connectivity
- Supplier portal integration for lead time data

**Reference Architectures**:
- Demand-supply balancing architecture
- Multi-echelon inventory optimization
- Sales and Operations Planning (S&OP) workflow

---

### Fleet Management Agents

**Agent Frameworks**:
- Real-time event processing focus
- Integration with telematics platforms

**MCP Integration Patterns**:
- Telematics data stream processing
- ELD compliance checking
- Maintenance scheduling integration

**Reference Architectures**:
- Fleet command center architecture
- Driver mobile app integration
- Predictive maintenance pipeline

---

### Returns and Reverse Logistics Agents

**Agent Frameworks**:
- Customer-facing agent capabilities
- Multi-step disposition workflow orchestration

**MCP Integration Patterns**:
- E-commerce platform integration
- Customer service system connectivity
- Secondary market platform APIs

**Reference Architectures**:
- Returns experience management
- Circular economy processing pipeline
- Value recovery optimization workflow

---

## MCP Server Development Resources

### Official MCP Documentation
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP Server Examples](https://github.com/modelcontextprotocol/servers)

### Logistics-Specific MCP Patterns

**Transportation MCP Servers**:
```
mcp-server-tms          # TMS integration wrapper
mcp-server-carrier      # Multi-carrier API aggregator
mcp-server-tracking     # Real-time shipment tracking
mcp-server-routing      # Route optimization services
```

**Warehouse MCP Servers**:
```
mcp-server-wms          # WMS integration wrapper
mcp-server-inventory    # Inventory position services
mcp-server-labor        # Labor management integration
mcp-server-automation   # Warehouse automation (ASRS, conveyors)
```

**Inventory MCP Servers**:
```
mcp-server-demand       # Demand forecasting services
mcp-server-replenishment # Replenishment planning
mcp-server-erp          # ERP inventory integration
```

**Fleet MCP Servers**:
```
mcp-server-telematics   # Telematics data aggregation
mcp-server-eld          # ELD compliance services
mcp-server-maintenance  # CMMS integration
```

---

## Integration Standards and Protocols

### EDI Standards
- X12 204 (Motor Carrier Load Tender)
- X12 210 (Motor Carrier Freight Invoice)
- X12 214 (Transportation Carrier Shipment Status)
- X12 856 (Advance Ship Notice)
- X12 940 (Warehouse Shipping Order)
- X12 945 (Warehouse Shipping Advice)

### API Standards
- GS1 EPCIS 2.0 for visibility events
- OpenAPI/Swagger for RESTful interfaces
- GraphQL for flexible data queries
- gRPC for high-performance services

### Data Formats
- GS1 Digital Link for product identification
- UN/CEFACT trade facilitation standards
- ISO 28000 supply chain security standards

---

## Community and Learning Resources

### Professional Organizations
- Council of Supply Chain Management Professionals (CSCMP)
- Association for Supply Chain Management (ASCM/APICS)
- Warehousing Education and Research Council (WERC)
- Material Handling Institute (MHI)
- Reverse Logistics Association (RLA)

### Research and Benchmarking
- Gartner Supply Chain Research
- MIT Center for Transportation & Logistics
- Georgia Tech Supply Chain & Logistics Institute
- APQC Supply Chain Benchmarks
- Chainalytics Benchmarking

### Online Learning
- MIT MicroMasters in Supply Chain Management (edX)
- APICS Certifications (CPIM, CSCP, CLTD)
- Coursera Supply Chain Specializations
- LinkedIn Learning Logistics courses

### Industry Publications
- Supply Chain Dive
- Logistics Management
- DC Velocity
- FreightWaves
- Fleet Owner

---

## Notes

- References are current as of January 2026 and should be verified for latest versions
- Open source projects should be evaluated for active maintenance and community support
- Commercial APIs may require licensing and should be evaluated for cost-benefit
- MCP server implementations should follow the official MCP specification
- Agent implementations should include appropriate guardrails for operational decisions
- Integration with operational systems should include proper error handling and fallback mechanisms
- Consider data privacy and security requirements when implementing tracking and visibility solutions
- Ensure compliance with industry regulations (DOT, FMCSA, FDA) where applicable

---

*Last Updated: January 2026*
