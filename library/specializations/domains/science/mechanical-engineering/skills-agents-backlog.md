# Mechanical Engineering - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Mechanical Engineering processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, simulation integration capabilities, and specialized knowledge for mechanical system design, analysis, manufacturing, and validation.

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
All 25 processes defined in the processes-backlog.md for this specialization require specialized mechanical engineering knowledge across multiple disciplines including structural analysis, thermal management, fluid dynamics, materials science, manufacturing processes, and design documentation. While generic engineering agents can provide basic support, specialized skills and agents with deep mechanical engineering domain knowledge would significantly enhance process quality and efficiency.

### Goals
- Provide deep expertise in FEA, CFD, and other mechanical simulation tools
- Enable integration with industry-standard software (ANSYS, SolidWorks, CATIA, NX, Abaqus)
- Reduce context-switching overhead for complex multi-physics analysis tasks
- Improve accuracy for safety-critical and code-compliance processes
- Support compliance with mechanical engineering standards (ASME, ASTM, AWS, ISO)
- Enable automated design verification and manufacturing process optimization

---

## Skills Backlog

### SK-001: Finite Element Analysis Skill
**Slug**: `fea-structural`
**Category**: Structural Analysis

**Description**: Deep integration with finite element analysis tools for structural simulation across static, dynamic, and nonlinear domains.

**Capabilities**:
- ANSYS Mechanical, Abaqus, NASTRAN model setup and execution
- Mesh generation strategies and quality assessment
- Element type selection and convergence studies
- Boundary condition specification and load case management
- Linear and nonlinear static analysis configuration
- Results post-processing and margin of safety calculation
- Mesh independence and sensitivity studies
- Report generation with stress/deflection contours

**Process Integration**:
- ME-006: Finite Element Analysis (FEA) Setup and Execution
- ME-007: Stress and Deflection Analysis
- ME-009: Nonlinear Structural Analysis

**Dependencies**: ANSYS Mechanical, Abaqus, MSC NASTRAN, HyperMesh, Femap

---

### SK-002: Fatigue Life Prediction Skill
**Slug**: `fatigue-analysis`
**Category**: Structural Analysis

**Description**: Specialized skill for fatigue life assessment and durability prediction under cyclic loading conditions.

**Capabilities**:
- Stress-life (S-N) curve application and analysis
- Strain-life (epsilon-N) methodology implementation
- Fracture mechanics crack growth prediction (NASGRO, AFGROW)
- Load spectrum development and cycle counting (rainflow)
- Damage accumulation using Miner's rule
- Mean stress correction methods (Goodman, Gerber, Soderberg)
- Multiaxial fatigue assessment
- Fatigue report generation with life predictions

**Process Integration**:
- ME-008: Fatigue Life Prediction

**Dependencies**: nCode DesignLife, Fe-Safe, NASGRO, AFGROW, MATLAB

---

### SK-003: Dynamics and Vibration Analysis Skill
**Slug**: `vibration-analysis`
**Category**: Structural Analysis

**Description**: Expert skill for modal analysis, frequency response, and vibration characterization of mechanical systems.

**Capabilities**:
- Natural frequency and mode shape extraction
- Modal participation factor analysis
- Harmonic response analysis configuration
- Random vibration (PSD) analysis
- Transient dynamic response simulation
- Shock response spectrum (SRS) analysis
- Damping estimation and modeling
- Vibration test correlation and model updating

**Process Integration**:
- ME-009: Dynamics and Vibration Analysis

**Dependencies**: ANSYS Mechanical, MSC NASTRAN, LMS Test.Lab, MATLAB

---

### SK-004: CFD Analysis Skill
**Slug**: `cfd-fluids`
**Category**: Thermal and Fluid Analysis

**Description**: Deep integration with computational fluid dynamics tools for internal and external flow analysis.

**Capabilities**:
- ANSYS Fluent, CFX, OpenFOAM workflow automation
- Mesh generation for complex geometries (structured, unstructured)
- Turbulence model selection (k-epsilon, k-omega, SST, LES)
- Boundary condition specification (inlet, outlet, wall, symmetry)
- Steady-state and transient flow simulations
- Post-processing for pressure, velocity, and flow visualization
- Mesh independence studies and validation
- Pressure drop and flow coefficient calculations

**Process Integration**:
- ME-010: Computational Fluid Dynamics (CFD) Analysis

**Dependencies**: ANSYS Fluent, ANSYS CFX, OpenFOAM, Star-CCM+, ParaView

---

### SK-005: Thermal Analysis Skill
**Slug**: `thermal-analysis`
**Category**: Thermal and Fluid Analysis

**Description**: Skill for thermal management design and heat transfer analysis across conduction, convection, and radiation.

**Capabilities**:
- Steady-state and transient thermal analysis setup
- Conduction path modeling and optimization
- Natural and forced convection coefficient estimation
- Radiation view factor and enclosure analysis
- Heat sink sizing and optimization
- Thermal interface material selection
- Electronic cooling analysis (Icepak, FloTHERM)
- Thermal resistance network modeling

**Process Integration**:
- ME-011: Thermal Management Design

**Dependencies**: ANSYS Mechanical (thermal), ANSYS Icepak, FloTHERM, Thermal Desktop

---

### SK-006: Heat Exchanger Design Skill
**Slug**: `heat-exchanger-design`
**Category**: Thermal and Fluid Analysis

**Description**: Specialized skill for heat exchanger sizing, rating, and optimization per TEMA standards.

**Capabilities**:
- Shell-and-tube heat exchanger design and rating
- Plate heat exchanger sizing
- Air-cooled heat exchanger configuration
- LMTD and effectiveness-NTU methods
- Fouling factor consideration
- Pressure drop calculations
- HTRI Xchanger Suite integration
- Thermal-hydraulic optimization

**Process Integration**:
- ME-012: Heat Exchanger Design and Rating

**Dependencies**: HTRI Xchanger Suite, Aspen Exchanger Design and Rating

---

### SK-007: HVAC System Design Skill
**Slug**: `hvac-design`
**Category**: Thermal and Fluid Analysis

**Description**: Skill for HVAC system design and analysis per ASHRAE standards.

**Capabilities**:
- Heating and cooling load calculations
- Psychrometric analysis and chart calculations
- Equipment selection (AHU, chillers, boilers)
- Duct and piping system sizing
- Energy efficiency analysis (ASHRAE 90.1)
- Indoor air quality assessment (ASHRAE 62.1)
- System simulation and optimization
- Control system specification

**Process Integration**:
- ME-013: HVAC System Design

**Dependencies**: Carrier HAP, Trane TRACE, EnergyPlus, eQUEST

---

### SK-008: 3D CAD Modeling Skill
**Slug**: `cad-modeling`
**Category**: Design and Development

**Description**: Expert skill for parametric 3D CAD model development with design intent and configuration management.

**Capabilities**:
- SolidWorks, CATIA, NX, Creo workflow automation
- Parametric feature-based modeling best practices
- Assembly design and constraint management
- Design table and configuration creation
- Top-down and bottom-up assembly strategies
- Part family and library component creation
- Model validation and quality checking
- CAD data exchange and translation

**Process Integration**:
- ME-003: 3D CAD Model Development

**Dependencies**: SolidWorks, CATIA, Siemens NX, PTC Creo, Autodesk Inventor

---

### SK-009: GD&T and Drawing Creation Skill
**Slug**: `gdt-drawing`
**Category**: Design and Development

**Description**: Specialized skill for geometric dimensioning and tolerancing specification per ASME Y14.5 and ISO 1101.

**Capabilities**:
- ASME Y14.5-2018 interpretation and application
- Datum feature selection and reference frame establishment
- Geometric tolerance specification and symbol usage
- Tolerance stack-up analysis (worst-case and statistical)
- Drawing view creation and annotation
- Bill of materials generation
- Revision control and ECO documentation
- Drawing checker automation

**Process Integration**:
- ME-004: GD&T Specification and Drawing Creation

**Dependencies**: SolidWorks Drawings, CATIA Drafting, NX Drafting, CETOL 6 Sigma, 3DCS

---

### SK-010: Material Selection Skill
**Slug**: `material-selection`
**Category**: Materials and Testing

**Description**: Systematic material selection using Ashby methodology and performance indices.

**Capabilities**:
- Ashby chart generation and interpretation
- Performance index derivation for design requirements
- Material property database access (MatWeb, CES)
- Environmental compatibility assessment
- Manufacturing process compatibility evaluation
- Cost and availability analysis
- Equivalent material identification
- Material specification documentation

**Process Integration**:
- ME-014: Material Selection Methodology

**Dependencies**: Granta CES EduPack, MatWeb, Total Materia, MMPDS

---

### SK-011: Material Testing Planning Skill
**Slug**: `material-testing`
**Category**: Materials and Testing

**Description**: Skill for planning and specifying mechanical material tests per ASTM standards.

**Capabilities**:
- Tensile testing specification (ASTM E8)
- Hardness testing methods (Rockwell, Brinell, Vickers)
- Impact testing (Charpy, Izod) per ASTM E23
- Fatigue testing (ASTM E466, E606)
- Test specimen design and preparation
- Test matrix development and optimization
- Data analysis and property determination
- Test report generation

**Process Integration**:
- ME-015: Material Testing and Characterization

**Dependencies**: Instron, MTS, universal testing machine interfaces, ASTM standards

---

### SK-012: Failure Analysis Skill
**Slug**: `failure-analysis`
**Category**: Materials and Testing

**Description**: Systematic failure analysis methodology for mechanical component failures.

**Capabilities**:
- Fractography interpretation (SEM, optical)
- Metallographic examination guidance
- Root cause analysis frameworks (5-Why, Fishbone)
- Failure mode identification (fatigue, corrosion, overload)
- Stress analysis correlation to failure location
- Chemical analysis interpretation
- Corrective action development
- Failure analysis report generation

**Process Integration**:
- ME-016: Failure Analysis Investigation

**Dependencies**: SEM/EDS analysis tools, metallographic equipment, NDT methods

---

### SK-013: CNC Programming Skill
**Slug**: `cnc-programming`
**Category**: Manufacturing

**Description**: Expert skill for CNC programming and toolpath optimization using CAM software.

**Capabilities**:
- Mastercam, NX CAM, Fusion 360 workflow automation
- Toolpath strategy selection (roughing, finishing)
- Cutting parameter optimization (feeds, speeds)
- Tool selection and library management
- Work holding and fixture consideration
- Toolpath simulation and verification
- G-code generation and post-processing
- Cycle time estimation and optimization

**Process Integration**:
- ME-018: CNC Programming and Verification

**Dependencies**: Mastercam, Siemens NX CAM, Fusion 360 Manufacturing, GibbsCAM

---

### SK-014: Additive Manufacturing Skill
**Slug**: `additive-manufacturing`
**Category**: Manufacturing

**Description**: Skill for additive manufacturing process selection, design optimization, and build preparation.

**Capabilities**:
- AM technology selection (SLS, DMLS, FDM, SLA)
- Design for additive manufacturing (DfAM)
- Build orientation optimization
- Support structure design and minimization
- Part nesting and build volume optimization
- Post-processing procedure specification
- Surface finish and tolerance expectations
- AM-specific material properties and considerations

**Process Integration**:
- ME-019: Additive Manufacturing Process Development

**Dependencies**: Materialise Magics, Netfabb, nTopology, Autodesk Fusion 360

---

### SK-015: Welding Procedure Qualification Skill
**Slug**: `welding-qualification`
**Category**: Manufacturing

**Description**: Skill for welding procedure development and qualification per AWS and ASME codes.

**Capabilities**:
- WPS (Welding Procedure Specification) development
- PQR (Procedure Qualification Record) documentation
- Essential variable identification and ranges
- Welder qualification requirements
- Filler metal and consumable selection
- Preheat and interpass temperature specification
- NDT requirement specification
- Code compliance verification (AWS D1.1, ASME IX)

**Process Integration**:
- ME-020: Welding Procedure Qualification

**Dependencies**: AWS D1.1, ASME Section IX, welding calculators

---

### SK-016: Manufacturing Process Planning Skill
**Slug**: `process-planning`
**Category**: Manufacturing

**Description**: Skill for manufacturing process planning including operation sequencing and work instructions.

**Capabilities**:
- Operation sequence development
- Machine and tooling selection
- Cycle time estimation
- Inspection point specification
- Work instruction creation
- Process FMEA development
- Control plan generation
- Cost estimation and optimization

**Process Integration**:
- ME-017: Manufacturing Process Planning

**Dependencies**: PLM systems, MES interfaces, process planning tools

---

### SK-017: Test Plan Development Skill
**Slug**: `test-planning`
**Category**: Testing and Validation

**Description**: Skill for comprehensive mechanical test plan development and execution support.

**Capabilities**:
- Test objective and success criteria definition
- Test configuration specification
- Instrumentation and data acquisition planning
- Load and environmental condition specification
- Safety analysis and risk assessment
- Test procedure development
- Data analysis plan creation
- Test report template generation

**Process Integration**:
- ME-021: Test Plan Development

**Dependencies**: LabVIEW, NI DAQ systems, test management tools

---

### SK-018: Test Correlation Skill
**Slug**: `test-correlation`
**Category**: Testing and Validation

**Description**: Skill for correlating test results with analytical predictions and model validation.

**Capabilities**:
- Test data processing and analysis
- Prediction-to-test comparison
- Model calibration techniques
- Uncertainty quantification
- Statistical analysis and regression
- Correlation report generation
- Model updating recommendations
- Validation criteria assessment

**Process Integration**:
- ME-022: Prototype Testing and Correlation

**Dependencies**: MATLAB, Python scipy, test data formats, FEA/CFD tools

---

### SK-019: First Article Inspection Skill
**Slug**: `fai-inspection`
**Category**: Testing and Validation

**Description**: Skill for first article inspection planning and execution per AS9102.

**Capabilities**:
- FAI plan development per AS9102
- Balloon drawing preparation
- Measurement method specification
- CMM programming guidance
- Characteristic accountability matrix
- Partial FAI and delta FAI management
- FAI report generation (Forms 1, 2, 3)
- Non-conformance disposition

**Process Integration**:
- ME-023: First Article Inspection (FAI)

**Dependencies**: CMM software, QMS systems, AS9102 templates

---

### SK-020: Design Review Management Skill
**Slug**: `design-review`
**Category**: Design Review and Documentation

**Description**: Skill for formal design review preparation and execution (PDR/CDR).

**Capabilities**:
- Design review agenda preparation
- Review criteria and checklist development
- Technical presentation guidance
- Action item tracking and management
- Review board coordination
- Design maturity assessment
- Gate criteria verification
- Review meeting facilitation

**Process Integration**:
- ME-024: Design Review Process (PDR/CDR)

**Dependencies**: PLM systems, requirements management tools, presentation tools

---

### SK-021: Engineering Change Management Skill
**Slug**: `change-management`
**Category**: Design Review and Documentation

**Description**: Skill for engineering change request and order processing through PLM systems.

**Capabilities**:
- ECR/ECO workflow initiation
- Impact assessment guidance
- Affected item identification
- Approval routing configuration
- Effectivity management
- Documentation update tracking
- Interchangeability analysis
- Configuration management

**Process Integration**:
- ME-025: Engineering Change Management

**Dependencies**: PTC Windchill, Siemens Teamcenter, Dassault ENOVIA

---

### SK-022: Requirements Flow-Down Skill
**Slug**: `requirements-flowdown`
**Category**: Design and Development

**Description**: Skill for systematic requirements capture, decomposition, and traceability.

**Capabilities**:
- Stakeholder requirements elicitation
- Functional requirements decomposition
- Performance requirements specification
- Design constraint identification
- Requirements traceability matrix
- Verification method assignment
- Requirements change management
- Code and standard flow-down

**Process Integration**:
- ME-001: Requirements Analysis and Flow-Down

**Dependencies**: IBM DOORS, Jama Connect, Polarion

---

### SK-023: Trade Study Skill
**Slug**: `trade-study`
**Category**: Design and Development

**Description**: Structured skill for conducting engineering trade studies and concept selection.

**Capabilities**:
- Trade study framework setup
- Evaluation criteria definition and weighting
- Concept generation support
- Pugh matrix implementation
- Quantitative scoring methods
- Sensitivity analysis
- Decision documentation
- Stakeholder consensus building

**Process Integration**:
- ME-002: Conceptual Design Trade Study

**Dependencies**: Decision analysis tools, MATLAB, spreadsheets

---

### SK-024: DFM Review Skill
**Slug**: `dfm-review`
**Category**: Design and Development

**Description**: Skill for design for manufacturing review and optimization.

**Capabilities**:
- Manufacturability assessment
- Process selection guidance
- Tooling feasibility analysis
- Cost driver identification
- Design modification recommendations
- Tolerance and surface finish review
- Material availability assessment
- Supplier capability consideration

**Process Integration**:
- ME-005: Design for Manufacturing (DFM) Review

**Dependencies**: CAD systems, manufacturing databases, cost estimation tools

---

### SK-025: Mechanism Design Skill
**Slug**: `mechanism-design`
**Category**: Mechanical Systems

**Description**: Skill for mechanism kinematics, dynamics, and motion analysis.

**Capabilities**:
- Linkage synthesis and analysis
- Cam profile design
- Gear train design and analysis
- Kinematic simulation
- Dynamic force analysis
- Motion optimization
- ADAMS/RecurDyn integration
- Mechanism specification documentation

**Process Integration**:
- Cross-cutting for mechanical system design processes

**Dependencies**: MSC ADAMS, RecurDyn, SolidWorks Motion, MATLAB

---

### SK-026: Pressure Vessel Design Skill
**Slug**: `pressure-vessel`
**Category**: Structural Analysis

**Description**: Skill for pressure vessel design and analysis per ASME BPVC.

**Capabilities**:
- ASME Section VIII Division 1/2 compliance
- Shell and head thickness calculations
- Nozzle reinforcement analysis
- Flange rating and selection
- Hydrostatic test specification
- MDMT (Minimum Design Metal Temperature) determination
- Stress classification and evaluation
- U-stamp documentation support

**Process Integration**:
- Related to structural analysis processes for pressure equipment

**Dependencies**: COMPRESS, PVElite, ANSYS, ASME BPVC

---

### SK-027: Piping Stress Analysis Skill
**Slug**: `piping-stress`
**Category**: Structural Analysis

**Description**: Skill for piping system stress analysis per ASME B31.

**Capabilities**:
- Piping flexibility analysis
- Thermal expansion stress calculation
- Support and restraint design
- Nozzle load verification
- Flange leakage assessment
- Code compliance verification (B31.1, B31.3)
- CAESAR II integration
- Piping isometric review

**Process Integration**:
- Related to structural analysis for piping systems

**Dependencies**: CAESAR II, AutoPIPE, Bentley STAAD

---

### SK-028: Tolerance Stack-Up Analysis Skill
**Slug**: `tolerance-stackup`
**Category**: Design and Development

**Description**: Skill for dimensional tolerance analysis and stack-up calculations.

**Capabilities**:
- Worst-case tolerance analysis
- Statistical (RSS) tolerance analysis
- Monte Carlo tolerance simulation
- GD&T-based stack-up analysis
- Assembly feasibility verification
- Tolerance allocation optimization
- CETOL/3DCS integration
- Stack-up report generation

**Process Integration**:
- ME-004: GD&T Specification and Drawing Creation

**Dependencies**: CETOL 6 Sigma, 3DCS, VSA, Excel

---

---

## Agents Backlog

### AG-001: Structural Analysis Specialist Agent
**Slug**: `structural-specialist`
**Category**: Structural Analysis

**Description**: Senior stress engineer for structural analysis and design verification decisions.

**Expertise Areas**:
- Finite element analysis methodology and best practices
- Static stress and deflection analysis
- Fatigue and fracture mechanics
- Dynamics and vibration analysis
- Nonlinear structural analysis
- Pressure vessel and piping design codes
- Structural optimization
- Test correlation and model validation

**Persona**:
- Role: Principal Stress Engineer
- Experience: 15+ years structural analysis
- Background: Industrial equipment, pressure vessels, aerospace structures

**Process Integration**:
- ME-006: Finite Element Analysis (FEA) Setup and Execution (all phases)
- ME-007: Stress and Deflection Analysis (all phases)
- ME-008: Fatigue Life Prediction (all phases)
- ME-009: Dynamics and Vibration Analysis (all phases)
- ME-010: Nonlinear Structural Analysis (all phases)

---

### AG-002: Thermal/Fluids Specialist Agent
**Slug**: `thermal-fluids-specialist`
**Category**: Thermal and Fluid Analysis

**Description**: Expert in thermal management, heat transfer, and fluid dynamics analysis.

**Expertise Areas**:
- Heat transfer analysis (conduction, convection, radiation)
- CFD methodology and turbulence modeling
- Heat exchanger design and optimization
- HVAC system design per ASHRAE
- Thermal management for electronics
- Fluid system design and optimization
- Pump and fan selection
- Energy efficiency analysis

**Persona**:
- Role: Senior Thermal/Fluids Engineer
- Experience: 12+ years thermal and fluids analysis
- Background: HVAC systems, industrial equipment, electronics cooling

**Process Integration**:
- ME-010: Computational Fluid Dynamics (CFD) Analysis (all phases)
- ME-011: Thermal Management Design (all phases)
- ME-012: Heat Exchanger Design and Rating (all phases)
- ME-013: HVAC System Design (all phases)

---

### AG-003: Mechanical Design Specialist Agent
**Slug**: `design-specialist`
**Category**: Design and Development

**Description**: Expert mechanical designer for product development and CAD/CAE integration.

**Expertise Areas**:
- Parametric CAD modeling best practices
- GD&T application per ASME Y14.5
- Design for manufacturing and assembly
- Tolerance analysis and stack-up
- Mechanism and motion design
- Design optimization
- Configuration management
- Design review leadership

**Persona**:
- Role: Principal Mechanical Design Engineer
- Experience: 15+ years mechanical design
- Background: Consumer products, industrial equipment, automotive components

**Process Integration**:
- ME-001: Requirements Analysis and Flow-Down (all phases)
- ME-002: Conceptual Design Trade Study (all phases)
- ME-003: 3D CAD Model Development (all phases)
- ME-004: GD&T Specification and Drawing Creation (all phases)
- ME-005: Design for Manufacturing (DFM) Review (all phases)

---

### AG-004: Materials Specialist Agent
**Slug**: `materials-specialist`
**Category**: Materials and Testing

**Description**: Expert in material selection, testing, and failure analysis for mechanical applications.

**Expertise Areas**:
- Metallic alloy properties and selection
- Polymer and composite material systems
- Material testing standards (ASTM)
- Failure analysis methodology
- Fractography and metallography
- Corrosion and environmental degradation
- Material specifications and equivalents
- Allowables development

**Persona**:
- Role: Principal Materials Engineer
- Experience: 15+ years materials engineering
- Background: Metals, polymers, composites, failure analysis

**Process Integration**:
- ME-014: Material Selection Methodology (all phases)
- ME-015: Material Testing and Characterization (all phases)
- ME-016: Failure Analysis Investigation (all phases)

---

### AG-005: Manufacturing Engineering Specialist Agent
**Slug**: `manufacturing-specialist`
**Category**: Manufacturing

**Description**: Expert in manufacturing processes, process planning, and production optimization.

**Expertise Areas**:
- Machining processes and CNC programming
- Additive manufacturing technologies
- Welding and joining processes
- Sheet metal fabrication
- Casting and forging processes
- Process planning and optimization
- Lean manufacturing principles
- Quality systems and SPC

**Persona**:
- Role: Senior Manufacturing Engineer
- Experience: 12+ years manufacturing engineering
- Background: CNC machining, metal fabrication, additive manufacturing

**Process Integration**:
- ME-017: Manufacturing Process Planning (all phases)
- ME-018: CNC Programming and Verification (all phases)
- ME-019: Additive Manufacturing Process Development (all phases)
- ME-020: Welding Procedure Qualification (all phases)

---

### AG-006: Test and Validation Specialist Agent
**Slug**: `test-validation-specialist`
**Category**: Testing and Validation

**Description**: Expert in mechanical testing, instrumentation, and test-analysis correlation.

**Expertise Areas**:
- Mechanical test planning and execution
- Instrumentation and data acquisition
- Structural, thermal, and vibration testing
- Test-analysis correlation
- First article inspection
- Statistical analysis of test data
- Test fixture design
- Certification testing

**Persona**:
- Role: Senior Test Engineer
- Experience: 12+ years mechanical testing
- Background: Prototype testing, validation, certification

**Process Integration**:
- ME-021: Test Plan Development (all phases)
- ME-022: Prototype Testing and Correlation (all phases)
- ME-023: First Article Inspection (FAI) (all phases)

---

### AG-007: Systems Engineering Specialist Agent
**Slug**: `systems-engineering-specialist`
**Category**: Design Review and Documentation

**Description**: Expert in mechanical systems engineering, requirements management, and design reviews.

**Expertise Areas**:
- Requirements engineering and traceability
- System architecture development
- Design review process (PDR/CDR)
- Engineering change management
- Configuration management
- Risk management
- Technical performance measures
- Multi-disciplinary integration

**Persona**:
- Role: Chief Systems Engineer
- Experience: 18+ years systems engineering
- Background: Complex mechanical systems, program management

**Process Integration**:
- ME-024: Design Review Process (PDR/CDR) (all phases)
- ME-025: Engineering Change Management (all phases)

---

### AG-008: Welding and Joining Specialist Agent
**Slug**: `welding-specialist`
**Category**: Manufacturing

**Description**: Expert in welding processes, procedure qualification, and code compliance.

**Expertise Areas**:
- Arc welding processes (GMAW, GTAW, SMAW, FCAW)
- Resistance welding
- Brazing and soldering
- WPS/PQR development and qualification
- AWS D1.1 and ASME IX compliance
- Weld inspection and NDT
- Weld design and joint configuration
- Dissimilar metal joining

**Persona**:
- Role: Principal Welding Engineer (CWI)
- Experience: 15+ years welding engineering
- Background: Structural steel, pressure vessels, aerospace

**Process Integration**:
- ME-020: Welding Procedure Qualification (all phases)

---

### AG-009: Pressure Equipment Specialist Agent
**Slug**: `pressure-equipment-specialist`
**Category**: Structural Analysis

**Description**: Expert in pressure vessel and piping design per ASME codes.

**Expertise Areas**:
- ASME BPVC Section VIII design
- ASME B31 piping codes
- Pressure vessel stress analysis
- Piping flexibility analysis
- Flange and nozzle design
- Heat exchanger mechanical design
- MDMT and material selection
- Code compliance and documentation

**Persona**:
- Role: Senior Pressure Equipment Engineer
- Experience: 15+ years pressure equipment design
- Background: Pressure vessels, heat exchangers, process piping

**Process Integration**:
- Related to structural analysis for pressure equipment

---

### AG-010: Vibration and Dynamics Specialist Agent
**Slug**: `vibration-specialist`
**Category**: Structural Analysis

**Description**: Expert in structural dynamics, vibration analysis, and rotating machinery.

**Expertise Areas**:
- Modal analysis and natural frequency determination
- Vibration isolation and damping
- Rotating machinery dynamics
- Rotor dynamics and critical speeds
- Random vibration and shock analysis
- Vibration testing and measurement
- Structural health monitoring
- NVH (Noise, Vibration, Harshness)

**Persona**:
- Role: Principal Dynamics Engineer
- Experience: 12+ years dynamics and vibration
- Background: Rotating equipment, vehicle dynamics, aerospace structures

**Process Integration**:
- ME-009: Dynamics and Vibration Analysis (all phases)

---

### AG-011: Quality Engineering Specialist Agent
**Slug**: `quality-specialist`
**Category**: Testing and Validation

**Description**: Expert in quality engineering, inspection planning, and process control.

**Expertise Areas**:
- First article inspection per AS9102
- CMM programming and measurement
- GD&T interpretation for inspection
- Process FMEA and control plans
- Statistical process control (SPC)
- Measurement system analysis (MSA)
- Root cause analysis (8D, 5-Why)
- Quality management systems (ISO 9001, AS9100)

**Persona**:
- Role: Senior Quality Engineer
- Experience: 12+ years quality engineering
- Background: Manufacturing quality, inspection, process control

**Process Integration**:
- ME-023: First Article Inspection (FAI) (all phases)

---

### AG-012: CAM and Machining Specialist Agent
**Slug**: `cam-machining-specialist`
**Category**: Manufacturing

**Description**: Expert in CNC programming, machining processes, and toolpath optimization.

**Expertise Areas**:
- Multi-axis CNC programming
- Toolpath strategy optimization
- Cutting parameter selection
- Tool selection and management
- Fixture design considerations
- Post-processor customization
- Machining simulation and verification
- High-speed machining techniques

**Persona**:
- Role: Senior CNC Programmer / Manufacturing Engineer
- Experience: 12+ years CNC programming
- Background: Precision machining, mold/die, aerospace components

**Process Integration**:
- ME-018: CNC Programming and Verification (all phases)

---

### AG-013: Additive Manufacturing Specialist Agent
**Slug**: `additive-specialist`
**Category**: Manufacturing

**Description**: Expert in additive manufacturing technologies, DfAM, and build preparation.

**Expertise Areas**:
- Metal AM processes (DMLS, SLM, EBM, DED)
- Polymer AM processes (SLS, FDM, SLA)
- Design for additive manufacturing
- Topology optimization for AM
- Build preparation and orientation
- Support structure optimization
- Post-processing requirements
- AM material properties and testing

**Persona**:
- Role: Senior Additive Manufacturing Engineer
- Experience: 10+ years additive manufacturing
- Background: Metal and polymer AM, prototyping, production AM

**Process Integration**:
- ME-019: Additive Manufacturing Process Development (all phases)

---

### AG-014: GD&T and Tolerance Specialist Agent
**Slug**: `gdt-tolerance-specialist`
**Category**: Design and Development

**Description**: Expert in geometric dimensioning and tolerancing and tolerance analysis.

**Expertise Areas**:
- ASME Y14.5-2018 application
- ISO 1101 and GPS standards
- Datum feature selection and strategy
- Geometric tolerance specification
- Tolerance stack-up analysis (worst-case, statistical)
- Monte Carlo tolerance simulation
- Functional dimensioning
- Drawing review and checker training

**Persona**:
- Role: GD&T Expert / Senior Design Engineer
- Experience: 15+ years GD&T application
- Background: Precision assemblies, automotive, aerospace

**Process Integration**:
- ME-004: GD&T Specification and Drawing Creation (all phases)

---

### AG-015: HVAC Systems Specialist Agent
**Slug**: `hvac-specialist`
**Category**: Thermal and Fluid Analysis

**Description**: Expert in HVAC system design, energy analysis, and code compliance.

**Expertise Areas**:
- Commercial and industrial HVAC design
- Load calculations and equipment sizing
- Duct and piping system design
- ASHRAE standards compliance
- Energy modeling and optimization
- Building automation and controls
- Indoor air quality design
- Commissioning and TAB

**Persona**:
- Role: Senior HVAC Engineer (PE)
- Experience: 15+ years HVAC design
- Background: Commercial buildings, industrial facilities, data centers

**Process Integration**:
- ME-013: HVAC System Design (all phases)

---

---

## Process-to-Skill/Agent Mapping

| Process ID | Process Name | Primary Skills | Primary Agents |
|-----------|--------------|----------------|----------------|
| ME-001 | Requirements Analysis and Flow-Down | SK-022 | AG-003, AG-007 |
| ME-002 | Conceptual Design Trade Study | SK-023 | AG-003, AG-007 |
| ME-003 | 3D CAD Model Development | SK-008 | AG-003 |
| ME-004 | GD&T Specification and Drawing Creation | SK-009, SK-028 | AG-003, AG-014 |
| ME-005 | Design for Manufacturing (DFM) Review | SK-024 | AG-003, AG-005 |
| ME-006 | Finite Element Analysis (FEA) Setup and Execution | SK-001 | AG-001 |
| ME-007 | Stress and Deflection Analysis | SK-001 | AG-001 |
| ME-008 | Fatigue Life Prediction | SK-002 | AG-001 |
| ME-009 | Dynamics and Vibration Analysis | SK-003 | AG-001, AG-010 |
| ME-010 | Nonlinear Structural Analysis | SK-001 | AG-001 |
| ME-011 | Computational Fluid Dynamics (CFD) Analysis | SK-004 | AG-002 |
| ME-012 | Thermal Management Design | SK-005 | AG-002 |
| ME-013 | Heat Exchanger Design and Rating | SK-006 | AG-002 |
| ME-014 | HVAC System Design | SK-007 | AG-002, AG-015 |
| ME-015 | Material Selection Methodology | SK-010 | AG-004 |
| ME-016 | Material Testing and Characterization | SK-011 | AG-004 |
| ME-017 | Failure Analysis Investigation | SK-012 | AG-004 |
| ME-018 | Manufacturing Process Planning | SK-016 | AG-005 |
| ME-019 | CNC Programming and Verification | SK-013 | AG-005, AG-012 |
| ME-020 | Additive Manufacturing Process Development | SK-014 | AG-005, AG-013 |
| ME-021 | Welding Procedure Qualification | SK-015 | AG-005, AG-008 |
| ME-022 | Test Plan Development | SK-017 | AG-006 |
| ME-023 | Prototype Testing and Correlation | SK-018 | AG-006 |
| ME-024 | First Article Inspection (FAI) | SK-019 | AG-006, AG-011 |
| ME-025 | Design Review Process (PDR/CDR) | SK-020 | AG-007 |
| ME-026 | Engineering Change Management | SK-021 | AG-007 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-001 | Finite Element Analysis | Aerospace Engineering, Civil Engineering, Automotive Engineering |
| SK-004 | CFD Analysis | Aerospace Engineering, Chemical Engineering, Automotive Engineering |
| SK-008 | 3D CAD Modeling | All engineering disciplines, Product Design |
| SK-009 | GD&T and Drawing Creation | Aerospace Engineering, Automotive Engineering, Manufacturing |
| SK-022 | Requirements Flow-Down | Systems Engineering, Aerospace Engineering, Software Engineering |
| SK-023 | Trade Study | Systems Engineering, Product Management, All Engineering |
| SK-020 | Design Review Management | All engineering disciplines, Program Management |
| SK-021 | Engineering Change Management | All engineering disciplines, Configuration Management |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-001 | Structural Analysis Specialist | Aerospace Engineering, Civil Engineering, Automotive |
| AG-004 | Materials Specialist | Aerospace Engineering, Chemical Engineering, Automotive |
| AG-007 | Systems Engineering Specialist | All engineering domains, Program Management |
| AG-011 | Quality Engineering Specialist | All manufacturing disciplines, Aerospace, Automotive |
| AG-014 | GD&T and Tolerance Specialist | Aerospace Engineering, Automotive, Precision Manufacturing |

---

## Implementation Priority

### Phase 1: Core Analysis Skills (High Impact)
1. **SK-001**: Finite Element Analysis - Foundation for structural design verification
2. **SK-004**: CFD Analysis - Foundation for thermal-fluid systems
3. **SK-008**: 3D CAD Modeling - Core design development capability
4. **SK-009**: GD&T and Drawing Creation - Essential for manufacturing documentation

### Phase 2: Core Specialist Agents (High Impact)
1. **AG-001**: Structural Analysis Specialist - Structural design leadership
2. **AG-002**: Thermal/Fluids Specialist - Thermal-fluid systems leadership
3. **AG-003**: Mechanical Design Specialist - Product design leadership
4. **AG-005**: Manufacturing Engineering Specialist - Manufacturing leadership

### Phase 3: Manufacturing and Materials
1. **SK-013**: CNC Programming
2. **SK-014**: Additive Manufacturing
3. **SK-015**: Welding Procedure Qualification
4. **SK-010**: Material Selection
5. **AG-004**: Materials Specialist
6. **AG-008**: Welding and Joining Specialist
7. **AG-012**: CAM and Machining Specialist

### Phase 4: Testing and Validation
1. **SK-017**: Test Plan Development
2. **SK-018**: Test Correlation
3. **SK-019**: First Article Inspection
4. **AG-006**: Test and Validation Specialist
5. **AG-011**: Quality Engineering Specialist

### Phase 5: Advanced Structural Analysis
1. **SK-002**: Fatigue Life Prediction
2. **SK-003**: Dynamics and Vibration Analysis
3. **SK-026**: Pressure Vessel Design
4. **SK-027**: Piping Stress Analysis
5. **AG-009**: Pressure Equipment Specialist
6. **AG-010**: Vibration and Dynamics Specialist

### Phase 6: Thermal-Fluid Specialties
1. **SK-005**: Thermal Analysis
2. **SK-006**: Heat Exchanger Design
3. **SK-007**: HVAC System Design
4. **AG-015**: HVAC Systems Specialist

### Phase 7: Design Systems and Documentation
1. **SK-020**: Design Review Management
2. **SK-021**: Engineering Change Management
3. **SK-022**: Requirements Flow-Down
4. **SK-023**: Trade Study
5. **SK-024**: DFM Review
6. **AG-007**: Systems Engineering Specialist

### Phase 8: Specialized Capabilities
1. **SK-011**: Material Testing Planning
2. **SK-012**: Failure Analysis
3. **SK-016**: Manufacturing Process Planning
4. **SK-025**: Mechanism Design
5. **SK-028**: Tolerance Stack-Up Analysis
6. **AG-013**: Additive Manufacturing Specialist
7. **AG-014**: GD&T and Tolerance Specialist

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 28 |
| Agents Identified | 15 |
| Shared Skill Candidates | 8 |
| Shared Agent Candidates | 5 |
| Total Processes Covered | 26 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
