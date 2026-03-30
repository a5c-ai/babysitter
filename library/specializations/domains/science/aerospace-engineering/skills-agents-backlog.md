# Aerospace Engineering - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Aerospace Engineering processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, simulation integration capabilities, and specialized knowledge for aircraft, spacecraft, and propulsion system development.

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
All 25 processes defined in the processes-backlog.md for this specialization require specialized aerospace engineering knowledge across multiple disciplines including aerodynamics, propulsion, structures, flight dynamics, space systems, systems engineering, certification, and testing. While generic engineering agents can provide basic support, specialized skills and agents with deep aerospace domain knowledge would significantly enhance process quality and efficiency.

### Goals
- Provide deep expertise in CFD, FEA, and other aerospace simulation tools
- Enable integration with industry-standard aerospace software (ANSYS, NASTRAN, STK, MATLAB/Simulink)
- Reduce context-switching overhead for complex multi-physics analysis tasks
- Improve accuracy for safety-critical and certification-driven processes
- Support compliance with aerospace standards (FAR/EASA, DO-178C, ARP4754A, ARP4761)
- Enable automated analysis-test correlation and validation workflows

---

## Skills Backlog

### SK-001: CFD Analysis Skill
**Slug**: `cfd-analysis`
**Category**: Aerodynamics

**Description**: Deep integration with computational fluid dynamics tools for aerodynamic analysis across all flight regimes.

**Capabilities**:
- ANSYS Fluent, OpenFOAM, Star-CCM+ workflow automation
- Mesh generation and quality assessment
- Turbulence model selection and configuration
- Boundary condition specification for various flow regimes
- Post-processing and force/moment extraction
- Mesh independence study automation
- Flow visualization and contour generation
- Convergence monitoring and criteria definition

**Process Integration**:
- AE-001: CFD Analysis Workflow
- AE-002: Wind Tunnel Test Correlation
- AE-003: Aerodynamic Database Generation

**Dependencies**: ANSYS Fluent, OpenFOAM, Star-CCM+, ParaView, Tecplot

---

### SK-002: Wind Tunnel Data Correlation Skill
**Slug**: `wind-tunnel-correlation`
**Category**: Aerodynamics

**Description**: Specialized skill for correlating CFD predictions with experimental wind tunnel data.

**Capabilities**:
- Data normalization and scaling procedures
- Reynolds number and Mach number corrections
- Wall interference and blockage corrections
- Uncertainty quantification methods
- Model calibration techniques
- Statistical analysis and regression
- Data quality assessment
- Correlation report generation

**Process Integration**:
- AE-002: Wind Tunnel Test Correlation
- AE-003: Aerodynamic Database Generation

**Dependencies**: MATLAB, Python scipy/numpy, test data formats

---

### SK-003: Aerodynamic Database Generation Skill
**Slug**: `aero-database`
**Category**: Aerodynamics

**Description**: Systematic generation and management of aerodynamic coefficient databases.

**Capabilities**:
- Multi-dimensional parameter sweep configuration
- Automated CFD job submission and monitoring
- Force and moment coefficient extraction
- Database interpolation and extrapolation
- Format conversion for flight simulation
- Database validation and consistency checks
- Version control and change tracking
- Documentation and metadata management

**Process Integration**:
- AE-003: Aerodynamic Database Generation
- AE-013: Flight Simulation Model Development

**Dependencies**: Database tools, HPC job schedulers, MATLAB

---

### SK-004: Gas Turbine Cycle Analysis Skill
**Slug**: `gas-turbine-cycle`
**Category**: Propulsion

**Description**: Expert skill for gas turbine engine thermodynamic cycle analysis and optimization.

**Capabilities**:
- NPSS and GasTurb model setup and execution
- Component matching and off-design analysis
- Turbofan, turbojet, turboprop configuration
- Performance map generation and interpolation
- Bleed and power extraction modeling
- Transient performance analysis
- SFC optimization studies
- Engine inlet and nozzle integration

**Process Integration**:
- AE-004: Gas Turbine Cycle Analysis

**Dependencies**: NPSS, GasTurb, MATLAB

---

### SK-005: Rocket Propulsion Analysis Skill
**Slug**: `rocket-propulsion`
**Category**: Propulsion

**Description**: Comprehensive skill for rocket engine design and performance analysis.

**Capabilities**:
- CEA combustion analysis integration
- Nozzle design and optimization (bell, aerospike)
- Propellant selection and performance comparison
- Chamber pressure and mixture ratio optimization
- Regenerative cooling analysis
- Injector design considerations
- Thrust vectoring system analysis
- Rocket Propulsion Analysis (RPA) integration

**Process Integration**:
- AE-005: Rocket Propulsion Design

**Dependencies**: CEA (Chemical Equilibrium with Applications), RPA, MATLAB

---

### SK-006: Propulsion Test Data Analysis Skill
**Slug**: `propulsion-test-analysis`
**Category**: Propulsion

**Description**: Skill for propulsion system ground test data acquisition and analysis.

**Capabilities**:
- Test cell instrumentation configuration
- Data acquisition system setup
- Real-time performance calculation
- Test-to-prediction correlation
- Thrust stand calibration verification
- Measurement uncertainty analysis
- Test matrix optimization
- Health monitoring parameter tracking

**Process Integration**:
- AE-006: Propulsion System Testing

**Dependencies**: LabVIEW, MATLAB, data acquisition systems

---

### SK-007: Finite Element Analysis Skill
**Slug**: `fea-structural`
**Category**: Structural Analysis

**Description**: Expert FEA skill for aerospace structural analysis workflows.

**Capabilities**:
- NASTRAN, ABAQUS, ANSYS model setup
- Mesh generation and quality metrics
- Element type selection and justification
- Load case definition and combination
- Boundary condition specification
- Static stress analysis execution
- Buckling and stability analysis
- Results post-processing and margin calculation

**Process Integration**:
- AE-007: Finite Element Analysis Workflow
- AE-008: Fatigue and Damage Tolerance
- AE-009: Composite Structure Design

**Dependencies**: MSC NASTRAN, ABAQUS, ANSYS, HyperMesh, Femap

---

### SK-008: Fatigue and Damage Tolerance Skill
**Slug**: `fatigue-dt`
**Category**: Structural Analysis

**Description**: Specialized skill for fatigue life prediction and damage tolerance assessment.

**Capabilities**:
- S-N and strain-life analysis
- Crack growth analysis (NASGRO, AFGROW)
- Inspection interval determination
- Damage tolerance substantiation
- Spectrum loading analysis
- Mean stress correction methods
- Multi-site damage assessment
- Certification evidence generation

**Process Integration**:
- AE-008: Fatigue and Damage Tolerance
- AE-021: Certification Planning

**Dependencies**: NASGRO, AFGROW, Fe-Safe, nCode DesignLife

---

### SK-009: Composite Structures Skill
**Slug**: `composite-structures`
**Category**: Structural Analysis

**Description**: Expert skill for composite aerospace structure design and analysis.

**Capabilities**:
- Laminate analysis and optimization
- Classical laminate theory (CLT) calculations
- Ply failure criteria (Tsai-Wu, Hashin, LaRC)
- Stacking sequence optimization
- Manufacturing constraint consideration
- Repair analysis and substantiation
- Allowables database management
- Impact damage assessment

**Process Integration**:
- AE-009: Composite Structure Design

**Dependencies**: HyperSizer, ESACOMP, Laminate tools, NASTRAN

---

### SK-010: Aeroelastic Analysis Skill
**Slug**: `aeroelastic-analysis`
**Category**: Structural Analysis

**Description**: Skill for flutter, divergence, and aeroelastic response analysis.

**Capabilities**:
- Flutter analysis (p-k, PKNL methods)
- Divergence speed determination
- Control reversal analysis
- Gust response analysis
- Ground vibration test correlation
- Aeroelastic tailoring assessment
- Structural coupling analysis
- Flight envelope clearance documentation

**Process Integration**:
- AE-010: Aeroelastic Analysis

**Dependencies**: MSC NASTRAN (SOL 144/145/146), ZAERO, FlightLoads

---

### SK-011: Flight Control Law Design Skill
**Slug**: `control-law-design`
**Category**: Flight Dynamics and Control

**Description**: Expert skill for flight control law development and tuning.

**Capabilities**:
- MATLAB/Simulink control law implementation
- Classical control design (PID, lead-lag)
- Modern control methods (LQR, H-infinity)
- Gain scheduling implementation
- Stability margin analysis
- Robustness analysis
- Nonlinear simulation
- Pilot-in-the-loop simulation support

**Process Integration**:
- AE-011: Flight Control Law Development
- AE-012: Handling Qualities Assessment

**Dependencies**: MATLAB/Simulink, Control System Toolbox, Robust Control Toolbox

---

### SK-012: Handling Qualities Assessment Skill
**Slug**: `handling-qualities`
**Category**: Flight Dynamics and Control

**Description**: Specialized skill for aircraft handling qualities evaluation.

**Capabilities**:
- MIL-STD-1797 compliance checking
- Cooper-Harper rating prediction
- Time response criteria evaluation
- Frequency response requirements
- PIO susceptibility analysis
- Category/Phase/Level determination
- Pilot opinion correlation
- Flying qualities demonstration planning

**Process Integration**:
- AE-012: Handling Qualities Assessment
- AE-011: Flight Control Law Development

**Dependencies**: MATLAB, flying qualities tools, simulation interfaces

---

### SK-013: Flight Simulation Model Skill
**Slug**: `flight-sim-model`
**Category**: Flight Dynamics and Control

**Description**: Skill for creating and validating flight dynamics models.

**Capabilities**:
- Six-DOF equation of motion implementation
- Aerodynamic database integration
- Propulsion model integration
- Landing gear and ground dynamics
- Atmospheric modeling (ISA, GRAM)
- Sensor and actuator modeling
- Model validation against flight data
- Real-time simulation interface

**Process Integration**:
- AE-013: Flight Simulation Model Development
- AE-024: Flight Test Planning

**Dependencies**: MATLAB/Simulink, JSBSim, FlightGear, X-Plane

---

### SK-014: Mission Design and Trajectory Skill
**Slug**: `mission-trajectory`
**Category**: Space Systems

**Description**: Expert skill for space mission design and trajectory analysis.

**Capabilities**:
- Orbital mechanics calculations
- Launch window analysis
- Delta-V budgeting and optimization
- Transfer trajectory design
- Maneuver planning and sequencing
- Rendezvous and proximity operations
- Entry, descent, and landing analysis
- STK and GMAT integration

**Process Integration**:
- AE-014: Mission Design and Analysis

**Dependencies**: STK (Systems Tool Kit), GMAT, MATLAB Aerospace Toolbox

---

### SK-015: Spacecraft Thermal Analysis Skill
**Slug**: `spacecraft-thermal`
**Category**: Space Systems

**Description**: Skill for spacecraft thermal control system design and analysis.

**Capabilities**:
- Thermal Desktop and SINDA modeling
- Orbital environment definition
- Radiator sizing and placement
- Heater control logic design
- Thermal balance verification
- Hot/cold case analysis
- Component temperature prediction
- MLI and coating specification

**Process Integration**:
- AE-015: Spacecraft Thermal Analysis

**Dependencies**: Thermal Desktop, SINDA/FLUINT, ESATAN

---

### SK-016: Spacecraft Power Analysis Skill
**Slug**: `spacecraft-power`
**Category**: Space Systems

**Description**: Skill for spacecraft power system sizing and analysis.

**Capabilities**:
- Power budget development
- Solar array sizing and configuration
- Battery sizing and selection
- Eclipse and sunlight power analysis
- Power regulation topology selection
- Worst-case power analysis
- End-of-life degradation modeling
- Load scheduling optimization

**Process Integration**:
- AE-016: Spacecraft Power Budget Analysis

**Dependencies**: MATLAB, power system modeling tools

---

### SK-017: Orbital Debris Assessment Skill
**Slug**: `orbital-debris`
**Category**: Space Systems

**Description**: Skill for orbital debris risk assessment and mitigation planning.

**Capabilities**:
- Collision probability calculation
- Debris environment modeling (ORDEM, MASTER)
- Conjunction assessment
- Collision avoidance maneuver planning
- Post-mission disposal planning
- Debris mitigation guideline compliance
- Shielding assessment
- Long-term orbit evolution

**Process Integration**:
- AE-017: Orbital Debris Assessment

**Dependencies**: DAS (Debris Assessment Software), ORDEM, STK

---

### SK-018: Requirements Verification Skill
**Slug**: `requirements-verification`
**Category**: Systems Engineering

**Description**: Skill for aerospace requirements verification and validation matrix management.

**Capabilities**:
- Requirements traceability matrix creation
- Verification method assignment (T/A/I/D)
- Compliance matrix generation
- Requirements coverage analysis
- Verification status tracking
- Evidence linking and management
- Change impact assessment
- DOORS/Jama integration

**Process Integration**:
- AE-018: Requirements Verification Matrix
- AE-021: Certification Planning

**Dependencies**: IBM DOORS, Jama Connect, requirements management tools

---

### SK-019: Interface Control Document Skill
**Slug**: `interface-control`
**Category**: Systems Engineering

**Description**: Skill for aerospace interface definition and management.

**Capabilities**:
- ICD template generation
- Interface parameter documentation
- Physical interface specification
- Electrical interface definition
- Data interface specification
- Interface verification matrix
- Change management procedures
- Cross-reference management

**Process Integration**:
- AE-019: Interface Control Documentation

**Dependencies**: Document management systems, CAD integration

---

### SK-020: Trade Study Methodology Skill
**Slug**: `trade-study`
**Category**: Systems Engineering

**Description**: Structured skill for conducting engineering trade studies.

**Capabilities**:
- Trade study framework setup
- Weighted criteria definition
- Alternatives generation support
- Quantitative scoring methods
- Sensitivity analysis execution
- Pugh matrix implementation
- Decision documentation
- Stakeholder input integration

**Process Integration**:
- AE-020: Trade Study Methodology

**Dependencies**: Decision analysis tools, spreadsheets

---

### SK-021: Certification Planning Skill
**Slug**: `certification-planning`
**Category**: Certification and Compliance

**Description**: Expert skill for aerospace certification planning aligned with regulatory requirements.

**Capabilities**:
- FAR/EASA certification basis definition
- Means of compliance identification
- Certification plan development
- Type certificate data sheet preparation
- Compliance document tracking
- DER/DAR coordination support
- Issue paper management
- Equivalent safety finding support

**Process Integration**:
- AE-021: Certification Planning

**Dependencies**: FAR/CS requirements databases, certification tracking tools

---

### SK-022: Safety Assessment (ARP4761) Skill
**Slug**: `safety-assessment`
**Category**: Certification and Compliance

**Description**: Skill for structured safety assessment following ARP4761 guidelines.

**Capabilities**:
- Functional Hazard Assessment (FHA)
- Preliminary System Safety Assessment (PSSA)
- System Safety Assessment (SSA)
- Fault Tree Analysis (FTA) construction
- FMEA/FMECA development
- Common Cause Analysis (CCA)
- Particular risk analysis
- Safety case documentation

**Process Integration**:
- AE-022: Safety Assessment (ARP4761)
- AE-021: Certification Planning

**Dependencies**: Isograph, ReliaSoft, safety assessment tools

---

### SK-023: DO-178C Compliance Skill
**Slug**: `do-178c-compliance`
**Category**: Certification and Compliance

**Description**: Skill for planning and executing DO-178C software certification activities.

**Capabilities**:
- Software level determination
- Plan for Software Aspects of Certification (PSAC)
- Software Development Plan (SDP) generation
- Software requirements analysis
- Traceability matrix management
- Structural coverage analysis (MC/DC)
- Tool qualification planning
- Deviation and issue management

**Process Integration**:
- AE-023: DO-178C Compliance Planning

**Dependencies**: LDRA, VectorCAST, coverage analysis tools

---

### SK-024: Flight Test Planning Skill
**Slug**: `flight-test-planning`
**Category**: Test and Validation

**Description**: Skill for comprehensive flight test planning and execution support.

**Capabilities**:
- Test point definition and prioritization
- Test card generation
- Instrumentation requirements specification
- Safety of flight analysis
- Flight test technique selection
- Data analysis planning
- Risk assessment and mitigation
- Test schedule optimization

**Process Integration**:
- AE-024: Flight Test Planning

**Dependencies**: Flight test management tools, data analysis systems

---

### SK-025: Environmental Testing Skill
**Slug**: `environmental-testing`
**Category**: Test and Validation

**Description**: Skill for environmental test campaign planning and execution.

**Capabilities**:
- Vibration test specification (sine, random, shock)
- Thermal vacuum test planning
- EMI/EMC test requirements
- Acoustic testing specification
- Test sequence optimization
- Test-to-analysis correlation
- Qualification vs acceptance criteria
- Test data analysis and reporting

**Process Integration**:
- AE-025: Environmental Testing Sequence

**Dependencies**: Vibration control systems, test data analysis tools

---

### SK-026: Hypersonic Aerothermodynamics Skill
**Slug**: `hypersonic-aerothermo`
**Category**: Advanced Aerodynamics

**Description**: Specialized skill for hypersonic vehicle aerodynamic and thermal analysis.

**Capabilities**:
- High-temperature gas dynamics
- Real gas effects modeling
- Aerodynamic heating prediction
- Thermal protection system sizing
- Shock-boundary layer interaction
- Ablation modeling
- Transition prediction (hypersonic)
- Chemically reacting flow analysis

**Process Integration**:
- AE-001: CFD Analysis Workflow (hypersonic regime)
- Advanced hypersonic vehicle design processes

**Dependencies**: High-fidelity CFD codes, real-gas models

---

### SK-027: Avionics System Integration Skill
**Slug**: `avionics-integration`
**Category**: Avionics

**Description**: Skill for avionics architecture design and system integration.

**Capabilities**:
- Avionics architecture definition
- ARINC 429/664 bus specification
- Federated vs IMA architecture
- Redundancy management design
- Data loading requirements
- Built-in test (BIT) requirements
- Human-machine interface specification
- Crew alerting system design

**Process Integration**:
- Systems integration processes
- Avionics certification planning

**Dependencies**: Avionics specification tools, bus analysis tools

---

### SK-028: GNC Simulation Skill
**Slug**: `gnc-simulation`
**Category**: Flight Dynamics and Control

**Description**: Skill for guidance, navigation, and control system simulation and analysis.

**Capabilities**:
- Navigation filter design (EKF, UKF)
- Sensor error modeling (IMU, GPS, star tracker)
- Guidance law implementation
- Monte Carlo simulation execution
- Covariance analysis
- Hardware-in-the-loop support
- Trajectory dispersion analysis
- Performance verification

**Process Integration**:
- AE-011: Flight Control Law Development
- AE-014: Mission Design and Analysis

**Dependencies**: MATLAB/Simulink, GNC simulation frameworks

---

---

## Agents Backlog

### AG-001: Aerodynamics Specialist Agent
**Slug**: `aero-specialist`
**Category**: Aerodynamics

**Description**: Senior aerodynamicist for aerodynamic analysis and design decisions.

**Expertise Areas**:
- Subsonic through hypersonic flow regimes
- CFD methodology and best practices
- Wind tunnel test planning and correlation
- Aerodynamic design optimization
- Stability and control derivatives
- High-lift system design
- Flow control technologies
- Aerodynamic database generation

**Persona**:
- Role: Principal Aerodynamicist
- Experience: 15+ years aerodynamic analysis
- Background: Transport aircraft, fighter aircraft, launch vehicles

**Process Integration**:
- AE-001: CFD Analysis Workflow (all phases)
- AE-002: Wind Tunnel Test Correlation (all phases)
- AE-003: Aerodynamic Database Generation (all phases)

---

### AG-002: Propulsion Systems Specialist Agent
**Slug**: `propulsion-specialist`
**Category**: Propulsion

**Description**: Expert in gas turbine and rocket propulsion system design and analysis.

**Expertise Areas**:
- Gas turbine cycle design and optimization
- Rocket engine design and performance
- Combustion analysis and chemistry
- Turbomachinery aerodynamics
- Propulsion testing and validation
- Alternative propulsion systems
- Propulsion-airframe integration
- Performance and SFC optimization

**Persona**:
- Role: Senior Propulsion Engineer
- Experience: 12+ years propulsion systems
- Background: Turbofan engines, liquid rocket engines, spacecraft propulsion

**Process Integration**:
- AE-004: Gas Turbine Cycle Analysis (all phases)
- AE-005: Rocket Propulsion Design (all phases)
- AE-006: Propulsion System Testing (all phases)

---

### AG-003: Structural Analysis Specialist Agent
**Slug**: `structures-specialist`
**Category**: Structural Analysis

**Description**: Expert in aerospace structural analysis and design for metallic and composite structures.

**Expertise Areas**:
- Finite element analysis methodology
- Fatigue and damage tolerance
- Composite structure design
- Aeroelastic analysis
- Structural optimization
- Certification substantiation
- Structural testing correlation
- Repair design and analysis

**Persona**:
- Role: Principal Stress Engineer
- Experience: 15+ years aerospace structures
- Background: Commercial aircraft, military aircraft, spacecraft structures

**Process Integration**:
- AE-007: Finite Element Analysis Workflow (all phases)
- AE-008: Fatigue and Damage Tolerance (all phases)
- AE-009: Composite Structure Design (all phases)
- AE-010: Aeroelastic Analysis (all phases)

---

### AG-004: Flight Dynamics Specialist Agent
**Slug**: `flight-dynamics-specialist`
**Category**: Flight Dynamics and Control

**Description**: Expert in aircraft and spacecraft flight dynamics, control law design, and handling qualities.

**Expertise Areas**:
- Flight dynamics modeling
- Control law design and analysis
- Handling qualities assessment
- Flight simulation development
- Autopilot and autothrottle design
- Envelope protection systems
- Flight test support
- Pilot-vehicle interface

**Persona**:
- Role: Senior Flight Controls Engineer
- Experience: 12+ years flight dynamics
- Background: Fly-by-wire systems, autonomous aircraft, spacecraft GNC

**Process Integration**:
- AE-011: Flight Control Law Development (all phases)
- AE-012: Handling Qualities Assessment (all phases)
- AE-013: Flight Simulation Model Development (all phases)

---

### AG-005: Space Systems Specialist Agent
**Slug**: `space-systems-specialist`
**Category**: Space Systems

**Description**: Expert in spacecraft design, mission analysis, and space operations.

**Expertise Areas**:
- Mission design and trajectory optimization
- Spacecraft thermal control
- Spacecraft power systems
- Orbital mechanics and astrodynamics
- Space environment effects
- Spacecraft integration and test
- Mission operations planning
- Constellation design

**Persona**:
- Role: Principal Space Systems Engineer
- Experience: 15+ years space systems
- Background: GEO satellites, LEO constellations, interplanetary missions

**Process Integration**:
- AE-014: Mission Design and Analysis (all phases)
- AE-015: Spacecraft Thermal Analysis (all phases)
- AE-016: Spacecraft Power Budget Analysis (all phases)
- AE-017: Orbital Debris Assessment (all phases)

---

### AG-006: Systems Engineering Specialist Agent
**Slug**: `systems-engineering-specialist`
**Category**: Systems Engineering

**Description**: Expert in aerospace systems engineering processes and integration.

**Expertise Areas**:
- Requirements engineering and management
- System architecture development
- Interface control and integration
- Trade study methodology
- Risk management
- Configuration management
- Verification and validation planning
- Technical performance measures

**Persona**:
- Role: Chief Systems Engineer
- Experience: 18+ years systems engineering
- Background: Large aircraft programs, satellite constellations, launch vehicles

**Process Integration**:
- AE-018: Requirements Verification Matrix (all phases)
- AE-019: Interface Control Documentation (all phases)
- AE-020: Trade Study Methodology (all phases)

---

### AG-007: Certification Specialist Agent
**Slug**: `certification-specialist`
**Category**: Certification and Compliance

**Description**: Expert in aerospace certification and regulatory compliance.

**Expertise Areas**:
- FAR/EASA certification requirements
- Type certification process
- Means of compliance planning
- DER/DAR delegation
- Certification authority coordination
- Special conditions and exemptions
- Continued airworthiness
- Supplemental type certificates

**Persona**:
- Role: Chief Certification Engineer
- Experience: 20+ years certification
- Background: Type certification programs, STCs, military qualification

**Process Integration**:
- AE-021: Certification Planning (all phases)

---

### AG-008: Safety Assessment Specialist Agent
**Slug**: `safety-specialist`
**Category**: Certification and Compliance

**Description**: Expert in aerospace safety assessment and ARP4761/ARP4754A compliance.

**Expertise Areas**:
- Functional hazard assessment
- System safety assessment
- Fault tree analysis
- FMEA/FMECA methodology
- Common cause analysis
- Particular risk analysis
- Safety case development
- Safety requirements allocation

**Persona**:
- Role: Principal Safety Engineer
- Experience: 15+ years safety assessment
- Background: Commercial aviation, military aircraft, spacecraft safety

**Process Integration**:
- AE-022: Safety Assessment (ARP4761) (all phases)
- AE-021: Certification Planning (safety aspects)

---

### AG-009: Software Certification Specialist Agent
**Slug**: `do-178c-specialist`
**Category**: Certification and Compliance

**Description**: Expert in airborne software certification per DO-178C and DO-278A.

**Expertise Areas**:
- DO-178C objectives and guidance
- Software development processes
- Verification and testing methods
- Structural coverage analysis (MC/DC)
- Tool qualification (DO-330)
- Model-based development (DO-331)
- Object-oriented technology (DO-332)
- Formal methods (DO-333)

**Persona**:
- Role: Principal Software Certification Engineer
- Experience: 12+ years DO-178C
- Background: DAL A/B software, flight control software, display systems

**Process Integration**:
- AE-023: DO-178C Compliance Planning (all phases)

---

### AG-010: Flight Test Specialist Agent
**Slug**: `flight-test-specialist`
**Category**: Test and Validation

**Description**: Expert in flight test planning, execution, and data analysis.

**Expertise Areas**:
- Flight test planning and management
- Test point definition and prioritization
- Flight test techniques
- Data acquisition and telemetry
- Real-time monitoring and safety
- Flight test data analysis
- Test report documentation
- Certification flight testing

**Persona**:
- Role: Chief Flight Test Engineer
- Experience: 15+ years flight test
- Background: Transport aircraft certification, experimental flight test, envelope expansion

**Process Integration**:
- AE-024: Flight Test Planning (all phases)

---

### AG-011: Environmental Test Specialist Agent
**Slug**: `environmental-test-specialist`
**Category**: Test and Validation

**Description**: Expert in aerospace environmental testing and qualification.

**Expertise Areas**:
- Vibration and shock testing
- Thermal and thermal vacuum testing
- EMI/EMC testing and compliance
- Acoustic testing
- Altitude and humidity testing
- Combined environment testing
- Test-to-analysis correlation
- Qualification test management

**Persona**:
- Role: Senior Environmental Test Engineer
- Experience: 12+ years environmental testing
- Background: Spacecraft qualification, aircraft component testing, electronics qualification

**Process Integration**:
- AE-025: Environmental Testing Sequence (all phases)

---

### AG-012: Avionics Systems Specialist Agent
**Slug**: `avionics-specialist`
**Category**: Avionics

**Description**: Expert in avionics architecture, design, and integration.

**Expertise Areas**:
- Avionics system architecture
- Data bus protocols (ARINC 429, AFDX, MIL-STD-1553)
- Integrated Modular Avionics (IMA)
- Flight management systems
- Display and crew alerting systems
- Communication and navigation systems
- Surveillance and ADS-B
- Human factors in avionics

**Persona**:
- Role: Principal Avionics Engineer
- Experience: 15+ years avionics systems
- Background: Flight deck systems, mission systems, military avionics

**Process Integration**:
- Avionics system design processes
- Systems integration processes

---

### AG-013: GNC Specialist Agent
**Slug**: `gnc-specialist`
**Category**: Flight Dynamics and Control

**Description**: Expert in guidance, navigation, and control systems for aircraft and spacecraft.

**Expertise Areas**:
- Navigation system design (INS, GPS, celestial)
- Kalman filtering and state estimation
- Guidance law design
- Autonomous rendezvous and docking
- Attitude determination and control
- Sensor fusion techniques
- Monte Carlo analysis
- GNC software development

**Persona**:
- Role: Principal GNC Engineer
- Experience: 14+ years GNC systems
- Background: Spacecraft GNC, autonomous aircraft, precision landing

**Process Integration**:
- AE-011: Flight Control Law Development (GNC aspects)
- AE-014: Mission Design and Analysis (trajectory guidance)
- GNC system design processes

---

### AG-014: Materials and Processes Specialist Agent
**Slug**: `materials-specialist`
**Category**: Structural Analysis

**Description**: Expert in aerospace materials selection and manufacturing processes.

**Expertise Areas**:
- Metallic alloy selection and properties
- Composite material systems
- Material allowables development
- Process specification development
- Corrosion protection
- Non-destructive testing methods
- Additive manufacturing
- Qualification and equivalency

**Persona**:
- Role: Principal Materials Engineer
- Experience: 15+ years aerospace materials
- Background: Metallic structures, composite manufacturing, space materials

**Process Integration**:
- AE-009: Composite Structure Design (materials aspects)
- AE-007: Finite Element Analysis Workflow (material properties)

---

### AG-015: Launch Vehicle Specialist Agent
**Slug**: `launch-vehicle-specialist`
**Category**: Space Systems

**Description**: Expert in launch vehicle design, integration, and operations.

**Expertise Areas**:
- Launch vehicle architecture
- Structural design for launch loads
- Propulsion system integration
- Payload integration
- Range safety requirements
- Launch operations planning
- Mission assurance
- Reusability engineering

**Persona**:
- Role: Senior Launch Vehicle Engineer
- Experience: 12+ years launch vehicles
- Background: Expendable launch vehicles, reusable systems, small launch vehicles

**Process Integration**:
- AE-005: Rocket Propulsion Design
- AE-014: Mission Design and Analysis (launch phases)
- Launch vehicle specific processes

---

---

## Process-to-Skill/Agent Mapping

| Process ID | Process Name | Primary Skills | Primary Agents |
|-----------|--------------|----------------|----------------|
| AE-001 | CFD Analysis Workflow | SK-001, SK-026 | AG-001 |
| AE-002 | Wind Tunnel Test Correlation | SK-001, SK-002 | AG-001 |
| AE-003 | Aerodynamic Database Generation | SK-001, SK-002, SK-003 | AG-001 |
| AE-004 | Gas Turbine Cycle Analysis | SK-004 | AG-002 |
| AE-005 | Rocket Propulsion Design | SK-005 | AG-002, AG-015 |
| AE-006 | Propulsion System Testing | SK-006 | AG-002 |
| AE-007 | Finite Element Analysis Workflow | SK-007 | AG-003 |
| AE-008 | Fatigue and Damage Tolerance | SK-007, SK-008 | AG-003 |
| AE-009 | Composite Structure Design | SK-007, SK-009 | AG-003, AG-014 |
| AE-010 | Aeroelastic Analysis | SK-007, SK-010 | AG-003, AG-004 |
| AE-011 | Flight Control Law Development | SK-011, SK-028 | AG-004, AG-013 |
| AE-012 | Handling Qualities Assessment | SK-011, SK-012 | AG-004 |
| AE-013 | Flight Simulation Model Development | SK-003, SK-013 | AG-004 |
| AE-014 | Mission Design and Analysis | SK-014 | AG-005, AG-013 |
| AE-015 | Spacecraft Thermal Analysis | SK-015 | AG-005 |
| AE-016 | Spacecraft Power Budget Analysis | SK-016 | AG-005 |
| AE-017 | Orbital Debris Assessment | SK-017 | AG-005 |
| AE-018 | Requirements Verification Matrix | SK-018 | AG-006 |
| AE-019 | Interface Control Documentation | SK-019 | AG-006 |
| AE-020 | Trade Study Methodology | SK-020 | AG-006 |
| AE-021 | Certification Planning | SK-018, SK-021, SK-022 | AG-007, AG-008 |
| AE-022 | Safety Assessment (ARP4761) | SK-022 | AG-008 |
| AE-023 | DO-178C Compliance Planning | SK-023 | AG-009 |
| AE-024 | Flight Test Planning | SK-013, SK-024 | AG-010, AG-004 |
| AE-025 | Environmental Testing Sequence | SK-025 | AG-011 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-007 | Finite Element Analysis | Mechanical Engineering, Civil Engineering, Automotive |
| SK-018 | Requirements Verification | Systems Engineering, Software Engineering, Embedded Systems |
| SK-019 | Interface Control Document | Systems Engineering, Hardware Development |
| SK-020 | Trade Study Methodology | Systems Engineering, Product Management, Engineering Management |
| SK-022 | Safety Assessment (ARP4761) | Automotive (ISO 26262), Medical Devices, Railway |
| SK-023 | DO-178C Compliance | Safety-Critical Software, Embedded Systems, Automotive |
| SK-025 | Environmental Testing | Electronics, Automotive, Defense |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-006 | Systems Engineering Specialist | All engineering domains, Software Development |
| AG-008 | Safety Assessment Specialist | Automotive, Medical Devices, Industrial Automation |
| AG-009 | Software Certification Specialist | Embedded Systems, Medical Device Software, Railway |
| AG-011 | Environmental Test Specialist | Electronics, Automotive, Consumer Products |
| AG-014 | Materials and Processes Specialist | Mechanical Engineering, Automotive, Manufacturing |

---

## Implementation Priority

### Phase 1: Core Analysis Skills (High Impact)
1. **SK-001**: CFD Analysis - Foundation for aerodynamic analysis
2. **SK-007**: Finite Element Analysis - Foundation for structural analysis
3. **SK-011**: Flight Control Law Design - Critical for vehicle stability
4. **SK-014**: Mission Design and Trajectory - Essential for space missions

### Phase 2: Core Analysis Agents (High Impact)
1. **AG-001**: Aerodynamics Specialist - Aerodynamic design leadership
2. **AG-003**: Structural Analysis Specialist - Structural design leadership
3. **AG-004**: Flight Dynamics Specialist - Vehicle dynamics leadership
4. **AG-005**: Space Systems Specialist - Spacecraft design leadership

### Phase 3: Certification and Safety
1. **SK-021**: Certification Planning
2. **SK-022**: Safety Assessment (ARP4761)
3. **SK-023**: DO-178C Compliance
4. **AG-007**: Certification Specialist
5. **AG-008**: Safety Assessment Specialist
6. **AG-009**: Software Certification Specialist

### Phase 4: Propulsion Systems
1. **SK-004**: Gas Turbine Cycle Analysis
2. **SK-005**: Rocket Propulsion Analysis
3. **SK-006**: Propulsion Test Data Analysis
4. **AG-002**: Propulsion Systems Specialist
5. **AG-015**: Launch Vehicle Specialist

### Phase 5: Advanced Analysis
1. **SK-008**: Fatigue and Damage Tolerance
2. **SK-009**: Composite Structures
3. **SK-010**: Aeroelastic Analysis
4. **SK-015**: Spacecraft Thermal Analysis
5. **SK-026**: Hypersonic Aerothermodynamics
6. **AG-014**: Materials and Processes Specialist

### Phase 6: Systems Engineering
1. **SK-018**: Requirements Verification
2. **SK-019**: Interface Control Document
3. **SK-020**: Trade Study Methodology
4. **AG-006**: Systems Engineering Specialist

### Phase 7: Test and Validation
1. **SK-002**: Wind Tunnel Data Correlation
2. **SK-024**: Flight Test Planning
3. **SK-025**: Environmental Testing
4. **AG-010**: Flight Test Specialist
5. **AG-011**: Environmental Test Specialist

### Phase 8: Specialized Capabilities
1. **SK-003**: Aerodynamic Database Generation
2. **SK-012**: Handling Qualities Assessment
3. **SK-013**: Flight Simulation Model
4. **SK-016**: Spacecraft Power Analysis
5. **SK-017**: Orbital Debris Assessment
6. **SK-027**: Avionics System Integration
7. **SK-028**: GNC Simulation
8. **AG-012**: Avionics Systems Specialist
9. **AG-013**: GNC Specialist

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 28 |
| Agents Identified | 15 |
| Shared Skill Candidates | 7 |
| Shared Agent Candidates | 5 |
| Total Processes Covered | 25 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
