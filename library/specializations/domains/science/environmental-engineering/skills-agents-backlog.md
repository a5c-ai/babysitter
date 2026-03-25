# Environmental Engineering - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Environmental Engineering processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, simulation integration capabilities, and specialized knowledge for water treatment, air quality management, site remediation, solid waste management, and sustainability engineering.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills Backlog](#skills-backlog)
3. [Agents Backlog](#agents-backlog)
4. [Process-to-Skill/Agent Mapping](#process-to-skillagent-mapping)
5. [Shared Candidates](#shared-candidates)
6. [Implementation Priority](#implementation-priority)

---

## Overview

### Current State
All 24 processes defined in the processes-backlog.md for this specialization require specialized environmental engineering knowledge across multiple disciplines including water/wastewater treatment, air quality management, site remediation, solid waste management, and sustainability. While generic engineering agents can provide basic support, specialized skills and agents with deep environmental domain knowledge would significantly enhance process quality and efficiency.

### Goals
- Provide deep expertise in environmental modeling and simulation tools (EPANET, SWMM, AERMOD, MODFLOW)
- Enable integration with regulatory compliance databases and frameworks
- Reduce context-switching overhead for complex multi-media environmental analysis tasks
- Improve accuracy for regulatory compliance and risk assessment processes
- Support compliance with environmental regulations (CWA, CAA, RCRA, CERCLA, SDWA)
- Enable automated monitoring data analysis and compliance reporting workflows
- Integrate life cycle assessment and sustainability analysis capabilities

---

## Skills Backlog

### SK-001: Water Treatment Process Design Skill
**Slug**: `water-treatment-design`
**Category**: Water and Wastewater Treatment

**Description**: Deep integration with water treatment design tools and methodologies for municipal and industrial applications.

**Capabilities**:
- Treatment process train selection and optimization
- Coagulation/flocculation design calculations
- Filtration system sizing (rapid sand, membrane)
- Disinfection system design (chlorine, UV, ozone)
- Chemical feed system specification
- Hydraulic profile development
- Residuals handling and disposal planning
- EPANET modeling integration

**Process Integration**:
- WW-001: Water Treatment Plant Design
- WW-005: Water Reuse System Implementation

**Dependencies**: EPANET, WaterGEMS, process design software

---

### SK-002: Wastewater Treatment Optimization Skill
**Slug**: `wastewater-optimization`
**Category**: Water and Wastewater Treatment

**Description**: Specialized skill for biological and physical-chemical wastewater treatment process optimization.

**Capabilities**:
- Activated sludge process modeling (ASM1, ASM2d, ASM3)
- BioWin and GPS-X simulation integration
- Nutrient removal optimization (BNR, EBPR)
- Aeration efficiency analysis
- Sludge age and F/M ratio optimization
- Energy consumption minimization
- Chemical dosing optimization
- Secondary clarifier modeling

**Process Integration**:
- WW-002: Wastewater Process Optimization
- WW-001: Water Treatment Plant Design

**Dependencies**: BioWin, GPS-X, SUMO, STOAT

---

### SK-003: Membrane System Design Skill
**Slug**: `membrane-system-design`
**Category**: Water and Wastewater Treatment

**Description**: Expert skill for membrane filtration and separation system design.

**Capabilities**:
- Membrane process selection (MF, UF, NF, RO)
- Flux and recovery rate calculations
- Pretreatment requirements assessment
- Fouling analysis and mitigation strategies
- Concentrate management planning
- CIP system design
- Energy recovery device selection
- Membrane pilot testing protocols

**Process Integration**:
- WW-003: Membrane Treatment System Design
- WW-005: Water Reuse System Implementation

**Dependencies**: ROSA, IMSDesign, membrane manufacturer tools

---

### SK-004: Stormwater Management Skill
**Slug**: `stormwater-management`
**Category**: Water and Wastewater Treatment

**Description**: Skill for integrated stormwater management and green infrastructure design.

**Capabilities**:
- SWMM modeling and simulation
- Hydrologic analysis (TR-55, HEC-HMS)
- Green infrastructure sizing (bioretention, permeable pavement)
- Detention/retention pond design
- Water quality BMP selection
- Pollutant load modeling
- Low impact development (LID) integration
- MS4 permit compliance analysis

**Process Integration**:
- WW-004: Stormwater Management Planning

**Dependencies**: EPA SWMM, HEC-HMS, HEC-RAS, StormCAD

---

### SK-005: Water Reuse Assessment Skill
**Slug**: `water-reuse-assessment`
**Category**: Water and Wastewater Treatment

**Description**: Comprehensive skill for water recycling and reuse system planning.

**Capabilities**:
- Fit-for-purpose water quality assessment
- Potable reuse risk evaluation (DPR, IPR)
- Microbial risk assessment (QMRA)
- Advanced treatment train design
- Regulatory compliance mapping
- Public health protection measures
- Monitoring and validation protocols
- Community engagement planning

**Process Integration**:
- WW-005: Water Reuse System Implementation

**Dependencies**: QMRA tools, water quality models

---

### SK-006: Air Dispersion Modeling Skill
**Slug**: `air-dispersion-modeling`
**Category**: Air Quality Management

**Description**: Expert skill for air quality dispersion modeling and impact assessment.

**Capabilities**:
- AERMOD model setup and execution
- CALPUFF long-range transport modeling
- Meteorological data processing (AERMET, AERSURFACE)
- Source characterization and emission rates
- Receptor grid configuration
- Building downwash analysis (BPIP)
- Good Engineering Practice (GEP) stack height
- Cumulative impact assessment

**Process Integration**:
- AQ-001: Air Permit Application Development
- AQ-003: Emission Inventory Development

**Dependencies**: AERMOD, CALPUFF, AERMET, AERMAP, Lakes Environmental software

---

### SK-007: Air Pollution Control Design Skill
**Slug**: `air-pollution-control`
**Category**: Air Quality Management

**Description**: Specialized skill for air pollution control equipment selection and design.

**Capabilities**:
- Scrubber design (wet, dry, packed tower)
- Baghouse and fabric filter sizing
- Electrostatic precipitator design
- Thermal and catalytic oxidizer specification
- Carbon adsorption system design
- Control efficiency calculations
- Pressure drop and energy analysis
- BACT/LAER/MACT determination

**Process Integration**:
- AQ-002: Air Pollution Control System Design
- AQ-001: Air Permit Application Development

**Dependencies**: Control equipment sizing tools, vendor software

---

### SK-008: Emission Inventory Skill
**Slug**: `emission-inventory`
**Category**: Air Quality Management

**Description**: Systematic skill for emission source identification and quantification.

**Capabilities**:
- Emission factor application (AP-42)
- Stack testing data analysis
- Fugitive emission estimation
- Mobile source emission calculations (MOVES)
- Area source characterization
- HAP/VOC speciation
- GHG emission quantification
- Emission inventory database management

**Process Integration**:
- AQ-003: Emission Inventory Development
- AQ-005: Greenhouse Gas Reduction Strategy

**Dependencies**: EPA AP-42, MOVES, emission calculation tools

---

### SK-009: CEMS Implementation Skill
**Slug**: `cems-implementation`
**Category**: Air Quality Management

**Description**: Skill for continuous emission monitoring system design and QA/QC.

**Capabilities**:
- CEMS/COMS specification and selection
- Sampling system design
- Data acquisition system configuration
- QA/QC procedure development (Part 75, Part 60)
- RATA and CGA planning
- Calibration drift analysis
- Missing data substitution procedures
- CEMS reporting compliance

**Process Integration**:
- AQ-004: Continuous Emission Monitoring Implementation

**Dependencies**: CEMS software, EPA ECMPS

---

### SK-010: GHG Reduction Planning Skill
**Slug**: `ghg-reduction`
**Category**: Air Quality Management

**Description**: Expert skill for greenhouse gas assessment and reduction strategy development.

**Capabilities**:
- GHG Protocol scope 1/2/3 calculation
- Carbon footprint baseline development
- Emission reduction opportunity identification
- Marginal abatement cost curve (MACC) analysis
- Science-based target setting
- Carbon offset evaluation
- Verification and validation protocols
- Climate disclosure reporting (TCFD, CDP)

**Process Integration**:
- AQ-005: Greenhouse Gas Reduction Strategy
- SUS-003: Carbon Footprint Assessment

**Dependencies**: GHG Protocol tools, EPA GHG reporting

---

### SK-011: Environmental Site Assessment Skill
**Slug**: `site-assessment`
**Category**: Site Remediation

**Description**: Comprehensive skill for contaminated site investigation methodologies.

**Capabilities**:
- Phase I ESA report preparation (ASTM E1527)
- Phase II sampling design and execution
- Recognized Environmental Condition (REC) identification
- Historical records research
- Geophysical survey interpretation
- Soil and groundwater sampling protocols
- Data quality assessment
- Conceptual Site Model (CSM) development

**Process Integration**:
- REM-001: Environmental Site Assessment
- REM-005: Brownfield Redevelopment Planning

**Dependencies**: EDR database, ASTM standards, GIS tools

---

### SK-012: Human Health Risk Assessment Skill
**Slug**: `health-risk-assessment`
**Category**: Site Remediation

**Description**: Expert skill for quantitative human health risk evaluation.

**Capabilities**:
- Exposure pathway analysis
- Receptor characterization
- Toxicity value selection (IRIS, PPRTV)
- Cancer risk calculation
- Non-cancer hazard quotient/index
- Probabilistic risk assessment (Monte Carlo)
- Risk-based screening level derivation
- Uncertainty and sensitivity analysis

**Process Integration**:
- REM-002: Human Health Risk Assessment
- REM-003: Remediation Technology Selection

**Dependencies**: EPA RSL calculator, IRIS database, ProUCL

---

### SK-013: Remediation Technology Selection Skill
**Slug**: `remediation-technology`
**Category**: Site Remediation

**Description**: Systematic skill for evaluating and selecting remediation technologies.

**Capabilities**:
- Technology screening matrix development
- Treatability study design
- In-situ vs ex-situ evaluation
- Cost-benefit analysis
- Remediation timeframe estimation
- Technology compatibility assessment
- Performance criteria development
- Pilot test planning

**Process Integration**:
- REM-003: Remediation Technology Selection
- REM-004: Groundwater Remediation Design

**Dependencies**: FRTR database, technology guides

---

### SK-014: Groundwater Modeling Skill
**Slug**: `groundwater-modeling`
**Category**: Site Remediation

**Description**: Advanced skill for groundwater flow and contaminant transport modeling.

**Capabilities**:
- MODFLOW model development
- MT3DMS contaminant transport simulation
- Model calibration and validation
- Pumping test analysis
- Capture zone delineation
- Fate and transport analysis
- Natural attenuation modeling (BIOCHLOR, BIOSCREEN)
- Uncertainty quantification

**Process Integration**:
- REM-004: Groundwater Remediation Design
- REM-001: Environmental Site Assessment

**Dependencies**: MODFLOW, MT3DMS, GMS, Visual MODFLOW

---

### SK-015: Brownfield Redevelopment Skill
**Slug**: `brownfield-redevelopment`
**Category**: Site Remediation

**Description**: Integrated skill for contaminated property assessment and reuse planning.

**Capabilities**:
- Brownfield site prioritization
- Institutional control design
- Engineering control specification
- Land use restriction evaluation
- Liability protection mechanisms
- Financial incentive identification
- Stakeholder engagement planning
- Cleanup-to-reuse integration

**Process Integration**:
- REM-005: Brownfield Redevelopment Planning

**Dependencies**: State brownfield program databases, GIS

---

### SK-016: Landfill Design Skill
**Slug**: `landfill-design`
**Category**: Solid and Hazardous Waste Management

**Description**: Comprehensive skill for municipal solid waste landfill engineering.

**Capabilities**:
- Liner system design (composite, GCL)
- Leachate collection system sizing
- Landfill gas collection and control design
- Final cover system specification
- Stability and settlement analysis
- Groundwater monitoring system design
- Closure and post-closure planning
- HELP model simulation

**Process Integration**:
- SW-001: Landfill Design and Permitting

**Dependencies**: HELP model, GeoStudio, landfill design tools

---

### SK-017: Waste Characterization Skill
**Slug**: `waste-characterization`
**Category**: Solid and Hazardous Waste Management

**Description**: Systematic skill for waste sampling, analysis, and classification.

**Capabilities**:
- Waste sampling plan development
- RCRA hazardous waste determination
- TCLP and characteristic testing interpretation
- Listed waste identification
- Mixture and derived-from rule application
- Universal waste classification
- DOT shipping classification
- Waste profile development

**Process Integration**:
- SW-002: Waste Characterization and Classification
- SW-004: Hazardous Waste Management Program

**Dependencies**: RCRA regulations, EPA SW-846

---

### SK-018: Waste-to-Energy Planning Skill
**Slug**: `waste-to-energy`
**Category**: Solid and Hazardous Waste Management

**Description**: Skill for thermal treatment and energy recovery facility planning.

**Capabilities**:
- Waste heating value analysis
- Combustion system selection (mass burn, RDF)
- Air pollution control train design
- Energy recovery optimization
- Ash management planning
- Regulatory pathway assessment
- Community engagement strategies
- Economic feasibility analysis

**Process Integration**:
- SW-003: Waste-to-Energy Facility Planning

**Dependencies**: Process simulation tools, economic models

---

### SK-019: Hazardous Waste Compliance Skill
**Slug**: `hazardous-waste-compliance`
**Category**: Solid and Hazardous Waste Management

**Description**: Expert skill for RCRA hazardous waste management program development.

**Capabilities**:
- Generator status determination
- Satellite accumulation requirements
- Container and tank storage compliance
- Contingency plan development
- Personnel training program design
- Manifest and recordkeeping systems
- Biennial report preparation
- Corrective action planning

**Process Integration**:
- SW-004: Hazardous Waste Management Program

**Dependencies**: RCRA regulations, EPA RCRAInfo

---

### SK-020: Life Cycle Assessment Skill
**Slug**: `lca-assessment`
**Category**: Sustainability and Climate

**Description**: Expert skill for ISO 14040/14044 compliant life cycle assessment.

**Capabilities**:
- Goal and scope definition
- Life cycle inventory (LCI) development
- Impact assessment method selection (TRACI, ReCiPe)
- openLCA and SimaPro integration
- Allocation procedure application
- Sensitivity and uncertainty analysis
- Critical review preparation
- LCA report generation

**Process Integration**:
- SUS-001: Life Cycle Assessment Methodology
- SUS-003: Carbon Footprint Assessment

**Dependencies**: openLCA, SimaPro, GaBi, ecoinvent database

---

### SK-021: Corporate Sustainability Program Skill
**Slug**: `corporate-sustainability`
**Category**: Sustainability and Climate

**Description**: Comprehensive skill for sustainability program design and implementation.

**Capabilities**:
- Materiality assessment methodology
- Sustainability goal and target setting
- Implementation roadmap development
- Performance indicator design
- Stakeholder engagement planning
- ESG reporting framework alignment (GRI, SASB)
- Sustainability communication strategy
- Program monitoring and evaluation

**Process Integration**:
- SUS-002: Corporate Sustainability Program Development

**Dependencies**: GRI Standards, SASB, sustainability software

---

### SK-022: Carbon Footprint Analysis Skill
**Slug**: `carbon-footprint`
**Category**: Sustainability and Climate

**Description**: Skill for organizational and product carbon footprint quantification.

**Capabilities**:
- GHG Protocol methodology application
- Scope 1, 2, 3 emission calculation
- Emission factor database management
- Activity data collection protocols
- Carbon intensity metrics development
- Verification and assurance preparation
- Carbon disclosure reporting (CDP)
- Net-zero pathway analysis

**Process Integration**:
- SUS-003: Carbon Footprint Assessment
- AQ-005: Greenhouse Gas Reduction Strategy

**Dependencies**: GHG Protocol, emission factor databases

---

### SK-023: Climate Vulnerability Assessment Skill
**Slug**: `climate-vulnerability`
**Category**: Sustainability and Climate

**Description**: Expert skill for infrastructure climate change vulnerability evaluation.

**Capabilities**:
- Climate projection data analysis (CMIP6)
- Asset exposure assessment
- Sensitivity and adaptive capacity evaluation
- Risk prioritization methodology
- Adaptation option identification
- Cost-benefit analysis of adaptation
- Climate resilience planning
- Monitoring and evaluation framework

**Process Integration**:
- SUS-004: Climate Vulnerability Assessment

**Dependencies**: Climate data portals, GIS, risk assessment tools

---

### SK-024: Environmental Management System Skill
**Slug**: `ems-implementation`
**Category**: Sustainability and Climate

**Description**: Skill for ISO 14001 environmental management system development.

**Capabilities**:
- Gap analysis and planning
- Environmental aspect/impact identification
- Legal compliance register development
- Objectives and targets setting
- Operational control procedures
- Emergency preparedness planning
- Internal audit program design
- Management review facilitation

**Process Integration**:
- SUS-005: Environmental Management System Implementation

**Dependencies**: ISO 14001 standard, EMS software

---

### SK-025: Ecological Risk Assessment Skill
**Slug**: `ecological-risk`
**Category**: Cross-Cutting

**Description**: Specialized skill for ecological risk evaluation and ecosystem protection.

**Capabilities**:
- Ecological receptor identification
- Exposure pathway development
- Toxicity reference value selection
- Bioaccumulation factor analysis
- Hazard quotient calculation
- Population-level risk assessment
- Screening-level ecological risk assessment (SLERA)
- Baseline ecological risk assessment (BERA)

**Process Integration**:
- REM-002: Human Health Risk Assessment
- REM-003: Remediation Technology Selection

**Dependencies**: EPA Eco-SSL, ecological databases

---

### SK-026: Regulatory Compliance Tracking Skill
**Slug**: `regulatory-compliance`
**Category**: Cross-Cutting

**Description**: Comprehensive skill for environmental regulatory compliance management.

**Capabilities**:
- Permit tracking and calendar management
- Regulatory applicability determination
- Compliance audit planning
- Deviation and exceedance management
- Corrective action tracking
- Regulatory change monitoring
- Inspection preparation
- Compliance reporting automation

**Process Integration**:
- All processes (cross-cutting)

**Dependencies**: Regulatory databases, compliance software

---

### SK-027: Environmental Monitoring Data Analysis Skill
**Slug**: `monitoring-data-analysis`
**Category**: Cross-Cutting

**Description**: Advanced skill for environmental monitoring data management and analysis.

**Capabilities**:
- Data validation and verification
- Statistical trend analysis
- Outlier detection and handling
- Data quality indicator calculation
- Spatial analysis and contouring
- Regulatory comparison reporting
- ProUCL statistical analysis
- Data visualization and dashboarding

**Process Integration**:
- All monitoring-related processes

**Dependencies**: ProUCL, R/Python, GIS, database systems

---

### SK-028: Environmental GIS Analysis Skill
**Slug**: `environmental-gis`
**Category**: Cross-Cutting

**Description**: Skill for spatial analysis and mapping in environmental applications.

**Capabilities**:
- Environmental data georeferencing
- Watershed delineation and analysis
- Plume mapping and visualization
- Buffer and proximity analysis
- Land use and land cover analysis
- Sensitive receptor identification
- Environmental justice screening
- Map production and reporting

**Process Integration**:
- All processes requiring spatial analysis

**Dependencies**: ArcGIS, QGIS, spatial databases

---

---

## Agents Backlog

### AG-001: Water Treatment Specialist Agent
**Slug**: `water-treatment-specialist`
**Category**: Water and Wastewater Treatment

**Description**: Senior water treatment engineer for treatment system design and optimization.

**Expertise Areas**:
- Municipal and industrial water treatment
- Biological and physical-chemical processes
- Membrane technology applications
- Disinfection systems
- Water reuse and recycling
- Process optimization and troubleshooting
- Pilot testing methodology
- Regulatory compliance (SDWA, CWA)

**Persona**:
- Role: Principal Water Treatment Engineer
- Experience: 15+ years water treatment design
- Background: Municipal utilities, industrial water, consulting engineering

**Process Integration**:
- WW-001: Water Treatment Plant Design (all phases)
- WW-002: Wastewater Process Optimization (all phases)
- WW-003: Membrane Treatment System Design (all phases)
- WW-005: Water Reuse System Implementation (all phases)

---

### AG-002: Stormwater Management Specialist Agent
**Slug**: `stormwater-specialist`
**Category**: Water and Wastewater Treatment

**Description**: Expert in stormwater management, green infrastructure, and MS4 compliance.

**Expertise Areas**:
- Stormwater modeling and analysis
- Green infrastructure design
- Low impact development (LID)
- Flood mitigation planning
- MS4 permit compliance
- Erosion and sediment control
- Water quality BMP design
- Climate resilience for stormwater

**Persona**:
- Role: Senior Stormwater Engineer
- Experience: 12+ years stormwater management
- Background: Municipal stormwater, land development, green infrastructure

**Process Integration**:
- WW-004: Stormwater Management Planning (all phases)

---

### AG-003: Air Quality Specialist Agent
**Slug**: `air-quality-specialist`
**Category**: Air Quality Management

**Description**: Senior air quality engineer for permitting, modeling, and compliance.

**Expertise Areas**:
- Air dispersion modeling (AERMOD, CALPUFF)
- Air permitting (Title V, NSR, PSD)
- Emission inventory development
- Air pollution control technology
- NAAQS compliance demonstration
- HAP and VOC management
- Greenhouse gas reporting
- Stack testing and source sampling

**Persona**:
- Role: Principal Air Quality Engineer
- Experience: 15+ years air quality management
- Background: Industrial facilities, permitting, air quality consulting

**Process Integration**:
- AQ-001: Air Permit Application Development (all phases)
- AQ-002: Air Pollution Control System Design (all phases)
- AQ-003: Emission Inventory Development (all phases)
- AQ-004: Continuous Emission Monitoring Implementation (all phases)

---

### AG-004: GHG and Sustainability Specialist Agent
**Slug**: `ghg-sustainability-specialist`
**Category**: Air Quality Management / Sustainability

**Description**: Expert in greenhouse gas management and sustainability strategy.

**Expertise Areas**:
- GHG Protocol application
- Carbon footprint assessment
- Science-based target setting
- Climate risk disclosure (TCFD)
- Corporate sustainability programs
- Life cycle assessment
- Carbon offset evaluation
- Net-zero pathway development

**Persona**:
- Role: Director of Sustainability
- Experience: 12+ years sustainability and climate
- Background: Corporate sustainability, consulting, climate strategy

**Process Integration**:
- AQ-005: Greenhouse Gas Reduction Strategy (all phases)
- SUS-002: Corporate Sustainability Program Development (all phases)
- SUS-003: Carbon Footprint Assessment (all phases)

---

### AG-005: Remediation Specialist Agent
**Slug**: `remediation-specialist`
**Category**: Site Remediation

**Description**: Senior remediation engineer for contaminated site assessment and cleanup.

**Expertise Areas**:
- Site characterization methodology
- Remediation technology selection
- Groundwater treatment systems
- Soil remediation techniques
- In-situ treatment technologies
- Monitored natural attenuation
- Long-term monitoring programs
- CERCLA and RCRA corrective action

**Persona**:
- Role: Principal Remediation Engineer
- Experience: 18+ years site remediation
- Background: Superfund sites, RCRA facilities, brownfield redevelopment

**Process Integration**:
- REM-001: Environmental Site Assessment (all phases)
- REM-003: Remediation Technology Selection (all phases)
- REM-004: Groundwater Remediation Design (all phases)
- REM-005: Brownfield Redevelopment Planning (all phases)

---

### AG-006: Risk Assessment Specialist Agent
**Slug**: `risk-assessment-specialist`
**Category**: Site Remediation

**Description**: Expert in human health and ecological risk assessment.

**Expertise Areas**:
- Human health risk assessment (HHRA)
- Ecological risk assessment
- Exposure pathway analysis
- Toxicity assessment
- Risk-based corrective action
- Probabilistic risk assessment
- Risk communication
- Risk-based decision making

**Persona**:
- Role: Principal Risk Assessor
- Experience: 15+ years risk assessment
- Background: Consulting, regulatory agency, toxicology

**Process Integration**:
- REM-002: Human Health Risk Assessment (all phases)
- REM-003: Remediation Technology Selection (risk aspects)

---

### AG-007: Hydrogeology Specialist Agent
**Slug**: `hydrogeology-specialist`
**Category**: Site Remediation

**Description**: Expert hydrogeologist for groundwater characterization and modeling.

**Expertise Areas**:
- Aquifer characterization
- Groundwater flow modeling (MODFLOW)
- Contaminant transport modeling
- Pumping test analysis
- Well design and installation
- Capture zone analysis
- Natural attenuation assessment
- Groundwater monitoring network design

**Persona**:
- Role: Principal Hydrogeologist
- Experience: 15+ years hydrogeology
- Background: Consulting, mining, water resources

**Process Integration**:
- REM-001: Environmental Site Assessment (hydrogeology aspects)
- REM-004: Groundwater Remediation Design (all phases)

---

### AG-008: Solid Waste Management Specialist Agent
**Slug**: `solid-waste-specialist`
**Category**: Solid and Hazardous Waste Management

**Description**: Senior engineer for solid waste management systems.

**Expertise Areas**:
- Landfill design and engineering
- Materials recovery facility design
- Composting and organics processing
- Waste-to-energy systems
- Recycling program development
- Integrated solid waste management
- Closure and post-closure care
- Solid waste planning

**Persona**:
- Role: Principal Solid Waste Engineer
- Experience: 15+ years solid waste management
- Background: Municipal utilities, consulting, waste industry

**Process Integration**:
- SW-001: Landfill Design and Permitting (all phases)
- SW-003: Waste-to-Energy Facility Planning (all phases)

---

### AG-009: Hazardous Waste Specialist Agent
**Slug**: `hazardous-waste-specialist`
**Category**: Solid and Hazardous Waste Management

**Description**: Expert in hazardous waste regulations and management programs.

**Expertise Areas**:
- RCRA Subtitle C compliance
- Hazardous waste characterization
- Treatment, storage, disposal facility (TSDF) requirements
- Generator compliance programs
- Manifest and recordkeeping systems
- Land disposal restrictions (LDR)
- Corrective action requirements
- Mixed waste management

**Persona**:
- Role: Senior Hazardous Waste Manager
- Experience: 12+ years hazardous waste compliance
- Background: Manufacturing, consulting, regulatory agency

**Process Integration**:
- SW-002: Waste Characterization and Classification (all phases)
- SW-004: Hazardous Waste Management Program (all phases)

---

### AG-010: LCA Specialist Agent
**Slug**: `lca-specialist`
**Category**: Sustainability and Climate

**Description**: Expert in life cycle assessment methodology and application.

**Expertise Areas**:
- ISO 14040/14044 methodology
- Life cycle inventory development
- Impact assessment methods
- LCA software (openLCA, SimaPro)
- Critical review processes
- Product environmental footprint
- Comparative assertions
- LCA communication and reporting

**Persona**:
- Role: Principal LCA Practitioner
- Experience: 12+ years life cycle assessment
- Background: Consulting, academia, product development

**Process Integration**:
- SUS-001: Life Cycle Assessment Methodology (all phases)
- SUS-003: Carbon Footprint Assessment (LCA aspects)

---

### AG-011: Climate Resilience Specialist Agent
**Slug**: `climate-resilience-specialist`
**Category**: Sustainability and Climate

**Description**: Expert in climate change vulnerability assessment and adaptation planning.

**Expertise Areas**:
- Climate projection analysis
- Vulnerability assessment methodology
- Adaptation planning and implementation
- Infrastructure resilience
- Flood risk management
- Drought planning
- Sea level rise adaptation
- Climate risk disclosure

**Persona**:
- Role: Climate Resilience Director
- Experience: 12+ years climate adaptation
- Background: Water utilities, consulting, municipal planning

**Process Integration**:
- SUS-004: Climate Vulnerability Assessment (all phases)
- WW-004: Stormwater Management Planning (climate aspects)

---

### AG-012: Environmental Compliance Specialist Agent
**Slug**: `environmental-compliance-specialist`
**Category**: Cross-Cutting

**Description**: Expert in environmental regulatory compliance across all media.

**Expertise Areas**:
- Multi-media regulatory compliance
- Environmental permitting
- Compliance audit methodology
- Enforcement defense
- Regulatory change tracking
- Environmental management systems
- Corporate environmental programs
- Inspection preparation and response

**Persona**:
- Role: Environmental Compliance Director
- Experience: 18+ years environmental compliance
- Background: Manufacturing, consulting, regulatory agency

**Process Integration**:
- All processes (compliance aspects)

---

### AG-013: Environmental Data Scientist Agent
**Slug**: `environmental-data-scientist`
**Category**: Cross-Cutting

**Description**: Expert in environmental data analysis, statistics, and visualization.

**Expertise Areas**:
- Environmental statistics
- Monitoring data analysis
- Spatial data analysis and GIS
- Data quality assessment
- Trend analysis and forecasting
- Machine learning for environmental applications
- Data visualization and dashboarding
- Database design and management

**Persona**:
- Role: Senior Environmental Data Scientist
- Experience: 10+ years environmental data analysis
- Background: Data science, environmental consulting, research

**Process Integration**:
- All processes (data analysis aspects)

---

### AG-014: EHS Integration Specialist Agent
**Slug**: `ehs-integration-specialist`
**Category**: Cross-Cutting

**Description**: Expert in integrated environmental, health, and safety management.

**Expertise Areas**:
- EHS management systems
- ISO 14001 and ISO 45001 integration
- EHS audit programs
- Incident investigation and root cause
- EHS training program development
- Contractor management
- Sustainability integration
- EHS metrics and reporting

**Persona**:
- Role: EHS Director
- Experience: 15+ years EHS management
- Background: Manufacturing, consulting, corporate EHS

**Process Integration**:
- SUS-005: Environmental Management System Implementation (all phases)
- SW-004: Hazardous Waste Management Program (EHS aspects)

---

### AG-015: NEPA/Environmental Review Specialist Agent
**Slug**: `nepa-specialist`
**Category**: Cross-Cutting

**Description**: Expert in environmental impact assessment and NEPA compliance.

**Expertise Areas**:
- NEPA documentation (EIS, EA, CE)
- Environmental impact assessment
- Alternatives analysis
- Public involvement processes
- Agency coordination
- Mitigation measure development
- Cumulative impact analysis
- Section 106 and Section 7 consultation

**Persona**:
- Role: NEPA Program Manager
- Experience: 15+ years environmental review
- Background: Federal agencies, consulting, infrastructure projects

**Process Integration**:
- REM-005: Brownfield Redevelopment Planning (NEPA aspects)
- All major project processes

---

---

## Process-to-Skill/Agent Mapping

| Process ID | Process Name | Primary Skills | Primary Agents | Integrated |
|-----------|--------------|----------------|----------------|------------|
| WW-001 | Water Treatment Plant Design | SK-001, SK-002 | AG-001 | :white_check_mark: |
| WW-002 | Wastewater Process Optimization | SK-002 | AG-001 | :white_check_mark: |
| WW-003 | Membrane Treatment System Design | SK-003 | AG-001 | :white_check_mark: |
| WW-004 | Stormwater Management Planning | SK-004, SK-028 | AG-002, AG-011 | :white_check_mark: |
| WW-005 | Water Reuse System Implementation | SK-001, SK-003, SK-005 | AG-001 | :white_check_mark: |
| AQ-001 | Air Permit Application Development | SK-006, SK-007, SK-008 | AG-003 | :white_check_mark: |
| AQ-002 | Air Pollution Control System Design | SK-007 | AG-003 | :white_check_mark: |
| AQ-003 | Emission Inventory Development | SK-008, SK-006 | AG-003 | :white_check_mark: |
| AQ-004 | Continuous Emission Monitoring Implementation | SK-009 | AG-003 | :white_check_mark: |
| AQ-005 | Greenhouse Gas Reduction Strategy | SK-010, SK-022 | AG-004 | :white_check_mark: |
| REM-001 | Environmental Site Assessment | SK-011, SK-014 | AG-005, AG-007 | :white_check_mark: |
| REM-002 | Human Health Risk Assessment | SK-012, SK-025 | AG-006 | :white_check_mark: |
| REM-003 | Remediation Technology Selection | SK-013, SK-012 | AG-005, AG-006 | :white_check_mark: |
| REM-004 | Groundwater Remediation Design | SK-014, SK-013 | AG-005, AG-007 | :white_check_mark: |
| REM-005 | Brownfield Redevelopment Planning | SK-011, SK-015 | AG-005, AG-015 | :white_check_mark: |
| SW-001 | Landfill Design and Permitting | SK-016 | AG-008 | :white_check_mark: |
| SW-002 | Waste Characterization and Classification | SK-017 | AG-009 | :white_check_mark: |
| SW-003 | Waste-to-Energy Facility Planning | SK-018, SK-007 | AG-008 | :white_check_mark: |
| SW-004 | Hazardous Waste Management Program | SK-017, SK-019 | AG-009, AG-014 | :white_check_mark: |
| SUS-001 | Life Cycle Assessment Methodology | SK-020 | AG-010 | :white_check_mark: |
| SUS-002 | Corporate Sustainability Program Development | SK-021, SK-022 | AG-004 | :white_check_mark: |
| SUS-003 | Carbon Footprint Assessment | SK-022, SK-020 | AG-004, AG-010 | :white_check_mark: |
| SUS-004 | Climate Vulnerability Assessment | SK-023 | AG-011 | :white_check_mark: |
| SUS-005 | Environmental Management System Implementation | SK-024, SK-026 | AG-014, AG-012 | :white_check_mark: |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-020 | Life Cycle Assessment | Product Development, Manufacturing, Packaging Design |
| SK-022 | Carbon Footprint Analysis | Corporate Sustainability, Supply Chain, Manufacturing |
| SK-023 | Climate Vulnerability Assessment | Civil Engineering, Urban Planning, Infrastructure |
| SK-024 | Environmental Management System | All Engineering Domains, Manufacturing, Facilities |
| SK-026 | Regulatory Compliance Tracking | All Regulated Industries, Healthcare, Manufacturing |
| SK-027 | Environmental Monitoring Data Analysis | Water Resources, Mining, Industrial Operations |
| SK-028 | Environmental GIS Analysis | Civil Engineering, Urban Planning, Natural Resources |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-004 | GHG and Sustainability Specialist | Corporate Strategy, Supply Chain, Manufacturing |
| AG-010 | LCA Specialist | Product Development, Packaging, Manufacturing |
| AG-011 | Climate Resilience Specialist | Civil Engineering, Urban Planning, Water Resources |
| AG-013 | Environmental Data Scientist | Data Science, Analytics, Research |
| AG-014 | EHS Integration Specialist | Safety Engineering, Industrial Hygiene, Manufacturing |

---

## Implementation Priority

### Phase 1: Core Water and Air Skills (High Impact)
1. **SK-001**: Water Treatment Process Design - Foundation for water treatment
2. **SK-006**: Air Dispersion Modeling - Foundation for air permitting
3. **SK-011**: Environmental Site Assessment - Foundation for remediation
4. **SK-026**: Regulatory Compliance Tracking - Cross-cutting enabler

### Phase 2: Core Domain Agents (High Impact)
1. **AG-001**: Water Treatment Specialist - Water/wastewater leadership
2. **AG-003**: Air Quality Specialist - Air quality leadership
3. **AG-005**: Remediation Specialist - Site cleanup leadership
4. **AG-012**: Environmental Compliance Specialist - Compliance oversight

### Phase 3: Risk and Remediation
1. **SK-012**: Human Health Risk Assessment
2. **SK-013**: Remediation Technology Selection
3. **SK-014**: Groundwater Modeling
4. **AG-006**: Risk Assessment Specialist
5. **AG-007**: Hydrogeology Specialist

### Phase 4: Waste Management
1. **SK-016**: Landfill Design
2. **SK-017**: Waste Characterization
3. **SK-019**: Hazardous Waste Compliance
4. **AG-008**: Solid Waste Management Specialist
5. **AG-009**: Hazardous Waste Specialist

### Phase 5: Sustainability and Climate
1. **SK-020**: Life Cycle Assessment
2. **SK-022**: Carbon Footprint Analysis
3. **SK-023**: Climate Vulnerability Assessment
4. **AG-004**: GHG and Sustainability Specialist
5. **AG-010**: LCA Specialist
6. **AG-011**: Climate Resilience Specialist

### Phase 6: Treatment Process Optimization
1. **SK-002**: Wastewater Treatment Optimization
2. **SK-003**: Membrane System Design
3. **SK-007**: Air Pollution Control Design
4. **SK-004**: Stormwater Management

### Phase 7: Monitoring and Data
1. **SK-009**: CEMS Implementation
2. **SK-027**: Environmental Monitoring Data Analysis
3. **SK-028**: Environmental GIS Analysis
4. **AG-013**: Environmental Data Scientist

### Phase 8: Specialized Capabilities
1. **SK-005**: Water Reuse Assessment
2. **SK-008**: Emission Inventory
3. **SK-010**: GHG Reduction Planning
4. **SK-015**: Brownfield Redevelopment
5. **SK-018**: Waste-to-Energy Planning
6. **SK-021**: Corporate Sustainability Program
7. **SK-024**: Environmental Management System
8. **SK-025**: Ecological Risk Assessment
9. **AG-002**: Stormwater Management Specialist
10. **AG-014**: EHS Integration Specialist
11. **AG-015**: NEPA/Environmental Review Specialist

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 28 |
| Agents Identified | 15 |
| Shared Skill Candidates | 7 |
| Shared Agent Candidates | 5 |
| Total Processes Covered | 24 |

---

**Created**: 2026-01-24
**Updated**: 2026-01-25
**Version**: 1.1.0
**Status**: Phase 7 Complete - Skills and Agents Integrated into Process Files
**Next Step**: Phase 8 - Implement specialized skills and agents (actual skill/agent code)
