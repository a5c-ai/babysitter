# Automotive Engineering - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Automotive Engineering processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, automotive standards knowledge, and integration with specialized automotive development tools.

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
All 25 processes in this specialization currently use generic agent names for task execution (e.g., `automotive-engineer`, `safety-engineer`, `software-developer`). While functional, this approach lacks domain-specific optimizations that specialized skills and agents with deep automotive engineering knowledge could provide.

### Goals
- Provide deep expertise in automotive safety standards (ISO 26262, SOTIF, ISO/SAE 21434)
- Enable automated validation with automotive simulation and CAE tools
- Reduce context-switching overhead for vehicle systems integration tasks
- Improve accuracy and efficiency of ADAS/AD development and validation
- Support automotive-specific protocols (CAN/CAN-FD, LIN, FlexRay, Ethernet)
- Enhance powertrain development for EV, hybrid, and ICE systems

---

## Skills Backlog

### SK-001: Vehicle Dynamics Simulation Skill
**Slug**: `vehicle-dynamics-sim`
**Category**: Simulation & Analysis

**Description**: Deep integration with vehicle dynamics simulation tools for handling, ride, and stability analysis.

**Capabilities**:
- Adams/Car, CarSim, IPG CarMaker model setup
- Suspension kinematics and compliance (K&C) analysis
- Tire model configuration (MF-Tyre, FTire, CDTire)
- Handling metrics calculation (understeer gradient, yaw gain)
- Ride comfort analysis (ISO 2631 comfort metrics)
- Stability control system simulation
- Driver model configuration and tuning
- Maneuver library execution (ISO lane change, steady-state cornering)

**Process Integration**:
- VDC-001: Suspension System Development
- VDC-002: Steering System Development
- VDC-003: Brake System Development
- TVL-001: Vehicle-Level Validation Testing

**Dependencies**: Adams/Car, CarSim, IPG CarMaker, dSPACE ASM

---

### SK-002: Crashworthiness CAE Skill
**Slug**: `crash-simulation`
**Category**: Structural Analysis

**Description**: Crash simulation setup and analysis for occupant protection and regulatory compliance.

**Capabilities**:
- LS-DYNA, Radioss, PAM-CRASH model preparation
- Crash barrier and dummy model setup
- Material card calibration (metals, plastics, foams)
- Energy absorption optimization
- Intrusion measurement and tracking
- Occupant injury criteria calculation (HIC, chest G, femur load)
- NCAP and FMVSS regulation test setup
- Pedestrian protection simulation

**Process Integration**:
- SAF-003: Crashworthiness Development
- TVL-001: Vehicle-Level Validation Testing
- TVL-003: Homologation and Type Approval

**Dependencies**: LS-DYNA, Radioss, PAM-CRASH, ANSA/META pre/post

---

### SK-003: Battery Management System Skill
**Slug**: `bms-development`
**Category**: Electrification

**Description**: Battery system design, BMS algorithm development, and validation expertise.

**Capabilities**:
- Cell characterization data analysis (HPPC, capacity, OCV)
- State-of-Charge (SoC) estimation algorithms
- State-of-Health (SoH) estimation methods
- Cell balancing strategy implementation
- Thermal management system sizing
- Battery pack electrical design
- Fault detection and diagnostics
- Abuse testing scenario definition

**Process Integration**:
- PTE-001: Battery System Design and Validation
- PTE-004: Powertrain Calibration and Optimization
- SAF-001: Functional Safety Development (ISO 26262)

**Dependencies**: GT-SUITE, AVL CRUISE M, MATLAB/Simulink, Battery testing equipment

---

### SK-004: Electric Motor Design Skill
**Slug**: `electric-motor-design`
**Category**: Electrification

**Description**: Electric motor and drive unit design and optimization expertise.

**Capabilities**:
- Motor topology selection (PMSM, induction, SRM)
- Electromagnetic FEA simulation (JMAG, Motor-CAD, ANSYS Maxwell)
- Efficiency map generation and analysis
- Thermal modeling and cooling design
- NVH analysis for electric motors
- Demagnetization analysis
- Inverter sizing and selection
- Field-oriented control (FOC) algorithm development

**Process Integration**:
- PTE-002: Electric Drive Unit Development
- PTE-003: Hybrid Powertrain Integration
- PTE-004: Powertrain Calibration and Optimization

**Dependencies**: JMAG, Motor-CAD, ANSYS Maxwell, MATLAB/Simulink

---

### SK-005: AUTOSAR Configuration Skill
**Slug**: `autosar-config`
**Category**: Automotive Software

**Description**: AUTOSAR Classic and Adaptive Platform configuration and implementation expertise.

**Capabilities**:
- Software component (SWC) design and modeling
- RTE configuration and code generation
- Basic Software (BSW) module configuration
- AUTOSAR COM stack setup
- Memory stack configuration (NvM, Fee, Ea)
- Diagnostic stack configuration (Dcm, Dem)
- AUTOSAR Adaptive Platform services
- ARXML file generation and validation

**Process Integration**:
- ASD-001: AUTOSAR Architecture Implementation
- ASD-002: ECU Software Development and Testing
- ASD-003: Diagnostic Implementation (UDS/OBD)

**Dependencies**: Vector DaVinci, ETAS ISOLAR, EB tresos, Artop

---

### SK-006: Sensor Fusion Skill
**Slug**: `sensor-fusion`
**Category**: ADAS/Autonomous Driving

**Description**: Multi-sensor fusion algorithms for perception in autonomous driving.

**Capabilities**:
- Camera, radar, lidar data preprocessing
- Object detection fusion algorithms
- Tracking filter implementation (Kalman, EKF, UKF)
- Association algorithms (Hungarian, GNN, JPDA)
- Occupancy grid fusion
- Confidence estimation and sensor weighting
- Time synchronization handling
- Ground truth comparison and metrics

**Process Integration**:
- ADA-001: Perception System Development
- ADA-002: Path Planning and Motion Control
- ADA-003: ADAS Feature Development
- ADA-004: Simulation and Virtual Validation

**Dependencies**: ROS/ROS2, TensorFlow, PyTorch, NVIDIA DriveWorks

---

### SK-007: ISO 26262 Compliance Skill
**Slug**: `iso-26262-compliance`
**Category**: Functional Safety

**Description**: Functional safety process and analysis support per ISO 26262.

**Capabilities**:
- Hazard Analysis and Risk Assessment (HARA) templates
- ASIL determination and decomposition
- Safety goal and requirement derivation
- Functional Safety Concept (FSC) development
- Technical Safety Concept (TSC) templates
- FMEA and FTA analysis support
- DFA (Dependent Failure Analysis) guidance
- Safety case structure generation

**Process Integration**:
- SAF-001: Functional Safety Development (ISO 26262)
- SAF-002: SOTIF Analysis and Validation
- SAF-004: Cybersecurity Engineering (ISO/SAE 21434)
- ASD-002: ECU Software Development and Testing

**Dependencies**: Medini Analyze, Enterprise Architect, DOORS, PTC Integrity

---

### SK-008: CAN/CAN-FD Communication Skill
**Slug**: `can-communication`
**Category**: Vehicle Networks

**Description**: CAN bus design, analysis, and diagnostics expertise.

**Capabilities**:
- DBC file creation and parsing
- CAN message scheduling and bus load analysis
- CAN-FD configuration and migration
- J1939 and CANopen protocol support
- Network topology design
- Gateway routing configuration
- Error frame analysis and bus-off handling
- XCP/CCP calibration protocol

**Process Integration**:
- ASD-001: AUTOSAR Architecture Implementation
- ASD-002: ECU Software Development and Testing
- ASD-003: Diagnostic Implementation (UDS/OBD)
- TVL-002: Hardware-in-the-Loop Testing

**Dependencies**: Vector CANoe, CANalyzer, PEAK PCAN tools, DBC editors

---

### SK-009: Automotive Ethernet Skill
**Slug**: `automotive-ethernet`
**Category**: Vehicle Networks

**Description**: Automotive Ethernet implementation and validation expertise.

**Capabilities**:
- 100BASE-T1/1000BASE-T1 configuration
- SOME/IP service design and implementation
- DoIP (Diagnostics over IP) configuration
- AVB/TSN time-sensitive networking
- Ethernet switch configuration
- VLAN and QoS setup
- PDU routing and gateway design
- Network intrusion detection

**Process Integration**:
- ASD-001: AUTOSAR Architecture Implementation
- ASD-004: Over-the-Air (OTA) Update Implementation
- SAF-004: Cybersecurity Engineering (ISO/SAE 21434)

**Dependencies**: Vector CANoe, Wireshark, Automotive Ethernet test tools

---

### SK-010: Path Planning Algorithm Skill
**Slug**: `path-planning`
**Category**: ADAS/Autonomous Driving

**Description**: Trajectory planning and motion control algorithm development.

**Capabilities**:
- Behavior planning state machine design
- Trajectory optimization (polynomial, spline-based)
- Model Predictive Control (MPC) implementation
- Lattice planner implementation
- Collision checking algorithms
- Comfort and safety constraint handling
- Emergency maneuver planning
- Parking trajectory generation

**Process Integration**:
- ADA-002: Path Planning and Motion Control
- ADA-003: ADAS Feature Development
- ADA-004: Simulation and Virtual Validation

**Dependencies**: ROS/ROS2, Apollo, Autoware, MATLAB/Simulink

---

### SK-011: HIL Test Automation Skill
**Slug**: `hil-test-automation`
**Category**: Testing & Validation

**Description**: Hardware-in-the-loop test development and automation expertise.

**Capabilities**:
- dSPACE ControlDesk/AutomationDesk scripting
- NI TestStand/LabVIEW integration
- Plant model integration (ASM, CarSim, GT-SUITE)
- Test case generation from requirements
- Fault injection test design
- Signal manipulation and residual bus simulation
- Regression test automation
- Test report generation

**Process Integration**:
- TVL-002: Hardware-in-the-Loop Testing
- ADA-004: Simulation and Virtual Validation
- SAF-001: Functional Safety Development (ISO 26262)

**Dependencies**: dSPACE HIL, NI PXI/VeriStand, Vector VT System

---

### SK-012: Emissions Calibration Skill
**Slug**: `emissions-calibration`
**Category**: Powertrain

**Description**: Engine emissions calibration and aftertreatment optimization expertise.

**Capabilities**:
- Engine map optimization (torque, spark, AFR)
- Catalyst light-off calibration
- SCR system calibration (urea dosing)
- GPF/DPF regeneration strategy
- RDE (Real Driving Emissions) compliance
- WLTP/FTP cycle optimization
- Cold start emissions reduction
- OBD-II monitor calibration

**Process Integration**:
- PTE-003: Hybrid Powertrain Integration
- PTE-004: Powertrain Calibration and Optimization
- TVL-003: Homologation and Type Approval

**Dependencies**: ETAS INCA, AVL CAMEO, ATI Vision, Emission test cells

---

### SK-013: Requirements Engineering Skill
**Slug**: `requirements-engineering`
**Category**: Systems Engineering

**Description**: Automotive requirements management and traceability expertise.

**Capabilities**:
- DOORS/DOORS Next configuration
- Requirements decomposition methodology
- Traceability matrix generation
- Change impact analysis
- Requirements quality checking (INCOSE guidelines)
- V&V matrix generation
- Compliance matrix for regulations
- Requirements interchange (ReqIF)

**Process Integration**:
- VSE-001: Vehicle Architecture Definition
- VSE-002: Requirements Engineering and Management
- VSE-003: Systems Integration and Verification

**Dependencies**: IBM DOORS, PTC Integrity, Jama Connect, Polarion

---

### SK-014: SOTIF Analysis Skill
**Slug**: `sotif-analysis`
**Category**: Safety

**Description**: Safety of the Intended Functionality (ISO 21448) analysis support.

**Capabilities**:
- Triggering condition identification
- Functional insufficiency analysis
- Known/unknown hazard scenario cataloging
- Sensor limitation analysis
- Algorithm edge case identification
- Validation strategy design for residual risk
- SOTIF argumentation structure
- Scenario coverage metrics

**Process Integration**:
- SAF-002: SOTIF Analysis and Validation
- ADA-001: Perception System Development
- ADA-002: Path Planning and Motion Control
- ADA-003: ADAS Feature Development

**Dependencies**: SOTIF analysis tools, scenario databases

---

### SK-015: Automotive Cybersecurity Skill
**Slug**: `automotive-cybersecurity`
**Category**: Security

**Description**: Vehicle cybersecurity engineering per ISO/SAE 21434.

**Capabilities**:
- Threat Analysis and Risk Assessment (TARA)
- Attack tree generation
- Security control selection
- Secure communication design (SecOC, TLS)
- Key management system design
- Penetration testing guidance
- Intrusion detection system design
- Incident response planning

**Process Integration**:
- SAF-004: Cybersecurity Engineering (ISO/SAE 21434)
- ASD-004: Over-the-Air (OTA) Update Implementation
- ASD-001: AUTOSAR Architecture Implementation

**Dependencies**: Cybersecurity analysis tools, AUTOSAR SecOC, HSM integration

---

### SK-016: UDS Diagnostics Skill
**Slug**: `uds-diagnostics`
**Category**: Automotive Software

**Description**: Unified Diagnostic Services implementation and validation expertise.

**Capabilities**:
- UDS service implementation (ISO 14229)
- DTC configuration and memory management
- ODX/PDX file generation
- Security access implementation
- Routine control design
- Data identifier (DID) configuration
- OBD-II legislated service implementation
- Diagnostic session management

**Process Integration**:
- ASD-003: Diagnostic Implementation (UDS/OBD)
- ASD-001: AUTOSAR Architecture Implementation
- TVL-003: Homologation and Type Approval

**Dependencies**: Vector CANoe/CANdela, ODX Studio, diagnostic testers

---

### SK-017: Driving Scenario Simulation Skill
**Slug**: `scenario-simulation`
**Category**: ADAS/Autonomous Driving

**Description**: Scenario-based simulation for ADAS/AD validation.

**Capabilities**:
- OpenSCENARIO/OpenDRIVE file creation
- Scenario database management
- Critical scenario generation
- Sensor model configuration
- Weather and lighting simulation
- Traffic participant modeling
- Scenario coverage analysis
- Regression test suite management

**Process Integration**:
- ADA-004: Simulation and Virtual Validation
- SAF-002: SOTIF Analysis and Validation
- ADA-003: ADAS Feature Development

**Dependencies**: CARLA, dSPACE ASM, IPG CarMaker, VTD, Foretellix

---

### SK-018: Electric Power Steering Skill
**Slug**: `eps-calibration`
**Category**: Chassis Systems

**Description**: Electric power steering calibration and control development.

**Capabilities**:
- Steering torque map calibration
- Return-to-center tuning
- On-center feel optimization
- Active return function design
- Lane keeping assist integration
- Steering angle sensor calibration
- Rack force estimation
- Steer-by-wire control design

**Process Integration**:
- VDC-002: Steering System Development
- ADA-003: ADAS Feature Development
- PTE-004: Powertrain Calibration and Optimization

**Dependencies**: Steering test equipment, CANape, INCA

---

### SK-019: Regenerative Braking Skill
**Slug**: `regen-braking`
**Category**: Electrification

**Description**: Regenerative braking system design and blending expertise.

**Capabilities**:
- Brake blending strategy design
- One-pedal driving implementation
- Regeneration limit management
- Brake-by-wire integration
- Wheel slip control during regen
- Energy recovery optimization
- Pedal feel calibration
- Coast regen tuning

**Process Integration**:
- VDC-003: Brake System Development
- PTE-001: Battery System Design and Validation
- PTE-002: Electric Drive Unit Development

**Dependencies**: Brake system simulation tools, dSPACE HIL

---

### SK-020: Thermal Management Skill
**Slug**: `thermal-management`
**Category**: Systems Engineering

**Description**: Vehicle and powertrain thermal management system design.

**Capabilities**:
- 1D thermal system modeling (GT-SUITE, Amesim)
- Heat exchanger sizing
- Coolant circuit design
- HVAC system integration
- Battery thermal management
- Waste heat recovery analysis
- Thermal preconditioning strategy
- Cabin comfort optimization

**Process Integration**:
- PTE-001: Battery System Design and Validation
- PTE-002: Electric Drive Unit Development
- PTE-003: Hybrid Powertrain Integration

**Dependencies**: GT-SUITE, Amesim, STAR-CCM+, CFD tools

---

### SK-021: Aerodynamics CFD Skill
**Slug**: `aero-cfd`
**Category**: Vehicle Design

**Description**: Vehicle aerodynamics simulation and optimization expertise.

**Capabilities**:
- Full vehicle CFD simulation (Star-CCM+, Fluent)
- Drag and lift coefficient analysis
- Underbody flow optimization
- Cooling airflow management
- Wind noise prediction
- Soiling and water management
- Rotating wheel modeling
- Active aerodynamics simulation

**Process Integration**:
- VSE-001: Vehicle Architecture Definition
- TVL-001: Vehicle-Level Validation Testing

**Dependencies**: Star-CCM+, ANSYS Fluent, PowerFLOW, ANSA

---

### SK-022: OTA Update Skill
**Slug**: `ota-update`
**Category**: Automotive Software

**Description**: Over-the-air software update system design and implementation.

**Capabilities**:
- SOTA/FOTA architecture design
- Delta update generation
- Update orchestration logic
- Rollback mechanism implementation
- Vehicle state management during update
- Update campaign management
- Multi-ECU update sequencing
- Secure download implementation

**Process Integration**:
- ASD-004: Over-the-Air (OTA) Update Implementation
- SAF-004: Cybersecurity Engineering (ISO/SAE 21434)
- ASD-001: AUTOSAR Architecture Implementation

**Dependencies**: Uptane framework, AWS IoT, Azure IoT, OEM backend systems

---

### SK-023: NVH Analysis Skill
**Slug**: `nvh-analysis`
**Category**: Testing & Validation

**Description**: Noise, vibration, and harshness analysis and optimization expertise.

**Capabilities**:
- Modal analysis and transfer path analysis
- Order tracking and Campbell diagrams
- Source-path-receiver analysis
- Panel contribution analysis
- Acoustic simulation (SEA, BEM, FEM)
- Sound quality metrics
- EV/HEV-specific NVH (inverter whine, motor noise)
- Pass-by noise simulation

**Process Integration**:
- PTE-002: Electric Drive Unit Development
- VDC-001: Suspension System Development
- TVL-001: Vehicle-Level Validation Testing

**Dependencies**: Siemens LMS Test.Lab, HEAD acoustics, MATLAB

---

### SK-024: MISRA C/C++ Compliance Skill
**Slug**: `misra-compliance`
**Category**: Code Quality

**Description**: MISRA C/C++ static analysis and compliance checking.

**Capabilities**:
- MISRA C:2012/C++:2008 rule checking
- Polyspace/PRQA/Klocwork integration
- Violation categorization and reporting
- Deviation record management
- AUTOSAR C++14 guidelines
- CERT C compliance checking
- Custom rule configuration
- CI/CD integration for static analysis

**Process Integration**:
- ASD-002: ECU Software Development and Testing
- SAF-001: Functional Safety Development (ISO 26262)
- ASD-001: AUTOSAR Architecture Implementation

**Dependencies**: Polyspace, PRQA QAC, Klocwork, Coverity

---

### SK-025: Homologation Documentation Skill
**Slug**: `homologation-docs`
**Category**: Regulatory Compliance

**Description**: Type approval documentation and certification management.

**Capabilities**:
- WVTA/FMVSS/China GB requirements tracking
- Technical documentation preparation
- Test report generation
- Approval certificate management
- CoP (Conformity of Production) documentation
- Market-specific requirement mapping
- Regulation change monitoring
- E-mark and certification tracking

**Process Integration**:
- TVL-003: Homologation and Type Approval
- SAF-003: Crashworthiness Development
- PTE-004: Powertrain Calibration and Optimization

**Dependencies**: Regulatory databases, document management systems

---

---

## Agents Backlog

### AG-001: Vehicle Systems Architect Agent
**Slug**: `vehicle-systems-architect`
**Category**: Architecture

**Description**: Senior architect for vehicle system architecture and integration decisions.

**Expertise Areas**:
- Vehicle architecture patterns and platforms
- E/E architecture design (zonal, domain-based, central)
- Requirements decomposition methodology
- Interface control document development
- MBSE (Model-Based Systems Engineering)
- Trade-off analysis (weight, cost, performance)
- Platform commonality strategies
- Technology roadmap alignment

**Persona**:
- Role: Chief Vehicle Architect
- Experience: 15+ years automotive systems
- Background: OEM vehicle programs, platform development

**Process Integration**:
- VSE-001: Vehicle Architecture Definition (all phases)
- VSE-002: Requirements Engineering and Management (all phases)
- VSE-003: Systems Integration and Verification (architecture phases)

---

### AG-002: Functional Safety Expert Agent
**Slug**: `functional-safety-expert`
**Category**: Safety

**Description**: ISO 26262 functional safety expert for safety-critical development.

**Expertise Areas**:
- ISO 26262 lifecycle management
- HARA methodology and ASIL determination
- Safety concept development (FSC, TSC, HSI)
- Dependent failure analysis
- Safety validation and confirmation measures
- Safety case argumentation
- Freedom from interference analysis
- Safety manager responsibilities

**Persona**:
- Role: Functional Safety Manager
- Experience: 12+ years safety-critical automotive
- Background: ASIL-D systems, safety assessments, regulatory compliance

**Process Integration**:
- SAF-001: Functional Safety Development (all phases)
- SAF-002: SOTIF Analysis and Validation (safety phases)
- SAF-004: Cybersecurity Engineering (safety coordination)

---

### AG-003: ADAS/AD Development Expert Agent
**Slug**: `adas-ad-expert`
**Category**: Autonomous Driving

**Description**: Expert in ADAS and autonomous driving system development.

**Expertise Areas**:
- Perception system architecture
- Sensor selection and placement optimization
- Fusion algorithm design
- Path planning algorithm selection
- Motion control strategies
- ODD (Operational Design Domain) definition
- V&V methodology for AD systems
- SAE J3016 autonomy levels

**Persona**:
- Role: ADAS/AD Technical Lead
- Experience: 10+ years ADAS/AD development
- Background: L2+ production systems, robotaxi development

**Process Integration**:
- ADA-001: Perception System Development (all phases)
- ADA-002: Path Planning and Motion Control (all phases)
- ADA-003: ADAS Feature Development (all phases)
- ADA-004: Simulation and Virtual Validation (all phases)

---

### AG-004: Powertrain Calibration Expert Agent
**Slug**: `powertrain-calibration-expert`
**Category**: Powertrain

**Description**: Expert in powertrain systems calibration and optimization.

**Expertise Areas**:
- Engine calibration methodology
- Electric motor control calibration
- Hybrid energy management strategy
- Emissions compliance calibration
- Drivability tuning
- NVH optimization
- Thermal management calibration
- Transmission shift calibration

**Persona**:
- Role: Senior Calibration Engineer
- Experience: 12+ years powertrain calibration
- Background: ICE, hybrid, and BEV programs, emissions certification

**Process Integration**:
- PTE-004: Powertrain Calibration and Optimization (all phases)
- PTE-002: Electric Drive Unit Development (calibration phases)
- PTE-003: Hybrid Powertrain Integration (all phases)

---

### AG-005: Battery Systems Engineer Agent
**Slug**: `battery-systems-engineer`
**Category**: Electrification

**Description**: Expert in automotive battery system design and validation.

**Expertise Areas**:
- Cell chemistry selection and characterization
- Pack architecture and design
- BMS algorithm development
- Thermal management system design
- Abuse testing and safety validation
- Battery aging and lifetime prediction
- Second-life and recycling considerations
- Fast charging strategy

**Persona**:
- Role: Battery Systems Engineering Lead
- Experience: 10+ years EV battery systems
- Background: OEM battery development, cell supplier experience

**Process Integration**:
- PTE-001: Battery System Design and Validation (all phases)
- SAF-001: Functional Safety Development (battery safety)
- PTE-003: Hybrid Powertrain Integration (battery aspects)

---

### AG-006: Crashworthiness Expert Agent
**Slug**: `crashworthiness-expert`
**Category**: Safety

**Description**: Expert in vehicle crashworthiness and occupant protection.

**Expertise Areas**:
- Body structure load path design
- Frontal/side/rear impact optimization
- Pedestrian protection design
- Airbag system integration
- Seatbelt restraint optimization
- NCAP rating optimization
- FMVSS/ECE regulatory compliance
- CAE crash simulation methodology

**Persona**:
- Role: Crashworthiness Engineering Manager
- Experience: 15+ years vehicle safety
- Background: OEM body engineering, NCAP 5-star programs

**Process Integration**:
- SAF-003: Crashworthiness Development (all phases)
- TVL-001: Vehicle-Level Validation Testing (crash testing)
- TVL-003: Homologation and Type Approval (safety certification)

---

### AG-007: Automotive Software Architect Agent
**Slug**: `automotive-software-architect`
**Category**: Software

**Description**: Architect for automotive embedded software systems.

**Expertise Areas**:
- AUTOSAR Classic and Adaptive architecture
- E/E software integration patterns
- Service-oriented architecture for vehicles
- Software-defined vehicle concepts
- Middleware and communication design
- Software platform strategy
- ASPICE process implementation
- Software update architecture

**Persona**:
- Role: Automotive Software Architect
- Experience: 12+ years automotive software
- Background: ECU development, AUTOSAR, vehicle platforms

**Process Integration**:
- ASD-001: AUTOSAR Architecture Implementation (all phases)
- ASD-002: ECU Software Development and Testing (architecture phases)
- ASD-004: Over-the-Air Update Implementation (all phases)

---

### AG-008: Vehicle Dynamics Engineer Agent
**Slug**: `vehicle-dynamics-engineer`
**Category**: Chassis

**Description**: Expert in vehicle dynamics tuning and chassis development.

**Expertise Areas**:
- Suspension design and kinematics
- Handling balance and tuning
- Ride comfort optimization
- Steering feel calibration
- Tire selection and modeling
- Stability control calibration
- Brake system design
- Four-wheel steering systems

**Persona**:
- Role: Vehicle Dynamics Technical Specialist
- Experience: 10+ years chassis engineering
- Background: Performance vehicles, ride/handling development

**Process Integration**:
- VDC-001: Suspension System Development (all phases)
- VDC-002: Steering System Development (all phases)
- VDC-003: Brake System Development (all phases)

---

### AG-009: Cybersecurity Engineer Agent
**Slug**: `cybersecurity-engineer`
**Category**: Security

**Description**: Automotive cybersecurity specialist per ISO/SAE 21434.

**Expertise Areas**:
- Threat Analysis and Risk Assessment (TARA)
- Secure architecture design
- Cryptographic implementation
- Intrusion detection systems
- Secure boot and secure update
- Penetration testing methodology
- Incident response planning
- Regulatory compliance (UNECE WP.29)

**Persona**:
- Role: Automotive Cybersecurity Architect
- Experience: 8+ years automotive security
- Background: Embedded security, penetration testing, cryptography

**Process Integration**:
- SAF-004: Cybersecurity Engineering (all phases)
- ASD-004: Over-the-Air Update Implementation (security phases)
- ASD-001: AUTOSAR Architecture Implementation (security aspects)

---

### AG-010: HIL Test Engineer Agent
**Slug**: `hil-test-engineer`
**Category**: Testing

**Description**: Expert in hardware-in-the-loop test development and execution.

**Expertise Areas**:
- HIL system architecture and configuration
- Plant model development and integration
- Test automation framework design
- Fault injection test methodology
- Regression test suite management
- Real-time simulation optimization
- Signal conditioning and I/O configuration
- Test coverage analysis

**Persona**:
- Role: HIL Test Engineering Lead
- Experience: 8+ years HIL testing
- Background: dSPACE/NI platforms, automotive validation

**Process Integration**:
- TVL-002: Hardware-in-the-Loop Testing (all phases)
- ADA-004: Simulation and Virtual Validation (HIL phases)
- SAF-001: Functional Safety Development (HIL validation)

---

### AG-011: Diagnostics Expert Agent
**Slug**: `diagnostics-expert`
**Category**: Software

**Description**: Expert in automotive diagnostics and OBD implementation.

**Expertise Areas**:
- UDS protocol implementation (ISO 14229)
- OBD-II regulatory requirements
- DTC definition and management
- ODX file creation and management
- Flash bootloader development
- Security access implementation
- Diagnostic tool integration
- WWH-OBD/SAE J1979-2 compliance

**Persona**:
- Role: Diagnostics Engineering Specialist
- Experience: 10+ years diagnostic systems
- Background: ECU diagnostics, OBD certification, dealer tools

**Process Integration**:
- ASD-003: Diagnostic Implementation (all phases)
- ASD-002: ECU Software Development (diagnostics aspects)
- TVL-003: Homologation and Type Approval (OBD certification)

---

### AG-012: Homologation Specialist Agent
**Slug**: `homologation-specialist`
**Category**: Regulatory

**Description**: Expert in global automotive homologation and type approval.

**Expertise Areas**:
- FMVSS/CMVSS requirements
- ECE/EU type approval
- China CCC and GB standards
- NCAP protocols (Euro, US, China, etc.)
- Certification test planning
- Technical documentation requirements
- Authority interaction management
- CoP (Conformity of Production) audits

**Persona**:
- Role: Homologation Manager
- Experience: 12+ years regulatory compliance
- Background: Global vehicle programs, certification agencies

**Process Integration**:
- TVL-003: Homologation and Type Approval (all phases)
- SAF-003: Crashworthiness Development (regulatory phases)
- PTE-004: Powertrain Calibration (emissions certification)

---

### AG-013: SOTIF Expert Agent
**Slug**: `sotif-expert`
**Category**: Safety

**Description**: Safety of the Intended Functionality (ISO 21448) specialist.

**Expertise Areas**:
- SOTIF methodology and process
- Triggering condition analysis
- Functional insufficiency identification
- Known/unknown scenario analysis
- Sensor limitation assessment
- Verification and validation strategy
- Residual risk argumentation
- Human factors in SOTIF

**Persona**:
- Role: SOTIF Technical Lead
- Experience: 8+ years ADAS/AD safety
- Background: ISO 21448 development, perception systems

**Process Integration**:
- SAF-002: SOTIF Analysis and Validation (all phases)
- ADA-001: Perception System Development (safety aspects)
- ADA-002: Path Planning and Motion Control (safety aspects)

---

### AG-014: Simulation Validation Engineer Agent
**Slug**: `simulation-validation-engineer`
**Category**: Testing

**Description**: Expert in simulation-based validation for ADAS/AD systems.

**Expertise Areas**:
- Scenario-based testing methodology
- Simulation platform selection and setup
- Sensor model validation
- Vehicle dynamics model correlation
- Critical scenario identification
- Coverage metrics definition
- Simulation data management
- Virtual validation strategy

**Persona**:
- Role: Simulation Validation Lead
- Experience: 8+ years simulation engineering
- Background: Driving simulator, sensor simulation, ADAS validation

**Process Integration**:
- ADA-004: Simulation and Virtual Validation (all phases)
- SAF-002: SOTIF Analysis (scenario validation)
- TVL-002: Hardware-in-the-Loop Testing (model correlation)

---

### AG-015: Integration Test Engineer Agent
**Slug**: `integration-test-engineer`
**Category**: Testing

**Description**: Expert in vehicle-level systems integration and testing.

**Expertise Areas**:
- Integration test planning
- Interface verification methodology
- System-level test case design
- Issue tracking and resolution
- Build management for integration
- Pre-integration reviews
- Integration environment setup
- Cross-functional coordination

**Persona**:
- Role: Integration Test Lead
- Experience: 10+ years vehicle integration
- Background: OEM vehicle programs, systems engineering

**Process Integration**:
- VSE-003: Systems Integration and Verification (all phases)
- TVL-001: Vehicle-Level Validation Testing (integration phases)
- TVL-002: Hardware-in-the-Loop Testing (integration aspects)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| VSE-001: Vehicle Architecture Definition | SK-013, SK-020, SK-021 | AG-001 |
| VSE-002: Requirements Engineering and Management | SK-013 | AG-001, AG-015 |
| VSE-003: Systems Integration and Verification | SK-011, SK-013 | AG-001, AG-015 |
| PTE-001: Battery System Design and Validation | SK-003, SK-020 | AG-005 |
| PTE-002: Electric Drive Unit Development | SK-004, SK-019, SK-023 | AG-004, AG-005 |
| PTE-003: Hybrid Powertrain Integration | SK-003, SK-004, SK-012, SK-020 | AG-004 |
| PTE-004: Powertrain Calibration and Optimization | SK-003, SK-012, SK-018 | AG-004, AG-012 |
| ADA-001: Perception System Development | SK-006, SK-014 | AG-003, AG-013 |
| ADA-002: Path Planning and Motion Control | SK-006, SK-010, SK-014 | AG-003, AG-013 |
| ADA-003: ADAS Feature Development | SK-006, SK-010, SK-018 | AG-003, AG-010 |
| ADA-004: Simulation and Virtual Validation | SK-001, SK-006, SK-011, SK-017 | AG-003, AG-014 |
| SAF-001: Functional Safety Development | SK-007, SK-024 | AG-002, AG-010 |
| SAF-002: SOTIF Analysis and Validation | SK-014, SK-017 | AG-002, AG-013 |
| SAF-003: Crashworthiness Development | SK-002, SK-025 | AG-006, AG-012 |
| SAF-004: Cybersecurity Engineering | SK-009, SK-015, SK-022 | AG-002, AG-009 |
| VDC-001: Suspension System Development | SK-001, SK-023 | AG-008 |
| VDC-002: Steering System Development | SK-001, SK-018 | AG-008, AG-003 |
| VDC-003: Brake System Development | SK-001, SK-019 | AG-008, AG-005 |
| ASD-001: AUTOSAR Architecture Implementation | SK-005, SK-008, SK-009, SK-015 | AG-007, AG-009 |
| ASD-002: ECU Software Development and Testing | SK-005, SK-007, SK-024 | AG-007, AG-002 |
| ASD-003: Diagnostic Implementation | SK-008, SK-016 | AG-011, AG-007 |
| ASD-004: Over-the-Air Update Implementation | SK-009, SK-015, SK-022 | AG-007, AG-009 |
| TVL-001: Vehicle-Level Validation Testing | SK-001, SK-002, SK-023 | AG-006, AG-015 |
| TVL-002: Hardware-in-the-Loop Testing | SK-008, SK-011, SK-017 | AG-010, AG-014 |
| TVL-003: Homologation and Type Approval | SK-002, SK-012, SK-025 | AG-012, AG-006 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-005 | AUTOSAR Configuration | Embedded Systems, Safety-Critical Systems |
| SK-007 | ISO 26262 Compliance | Embedded Systems, Medical Devices, Industrial Automation |
| SK-008 | CAN/CAN-FD Communication | Embedded Systems, Industrial Automation, Robotics |
| SK-013 | Requirements Engineering | Systems Engineering, Software Architecture |
| SK-015 | Automotive Cybersecurity | Security Engineering, IoT Development |
| SK-017 | Driving Scenario Simulation | Robotics Simulation, Testing Automation |
| SK-024 | MISRA C/C++ Compliance | Embedded Systems, Safety-Critical Software |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-002 | Functional Safety Expert | Embedded Systems, Medical Devices, Industrial Safety |
| AG-007 | Automotive Software Architect | Embedded Systems, Software Architecture |
| AG-009 | Cybersecurity Engineer | Security Engineering, IoT Security |
| AG-010 | HIL Test Engineer | Embedded Systems, Robotics, Test Automation |
| AG-015 | Integration Test Engineer | Systems Engineering, QA Testing Automation |

---

## Implementation Priority

### Phase 1: Critical Safety Skills (High Impact)
1. **SK-007**: ISO 26262 Compliance - Foundation for all safety-critical development
2. **SK-014**: SOTIF Analysis - Critical for ADAS/AD safety
3. **SK-002**: Crashworthiness CAE - Core safety requirement
4. **SK-015**: Automotive Cybersecurity - Regulatory requirement

### Phase 2: Critical Agents (High Impact)
1. **AG-002**: Functional Safety Expert - Highest safety impact
2. **AG-001**: Vehicle Systems Architect - Foundation for all programs
3. **AG-003**: ADAS/AD Development Expert - Key technology area
4. **AG-006**: Crashworthiness Expert - Safety compliance

### Phase 3: Powertrain & Electrification
1. **SK-003**: Battery Management System
2. **SK-004**: Electric Motor Design
3. **SK-012**: Emissions Calibration
4. **SK-020**: Thermal Management
5. **AG-004**: Powertrain Calibration Expert
6. **AG-005**: Battery Systems Engineer

### Phase 4: ADAS/AD Development
1. **SK-006**: Sensor Fusion
2. **SK-010**: Path Planning Algorithm
3. **SK-017**: Driving Scenario Simulation
4. **AG-013**: SOTIF Expert
5. **AG-014**: Simulation Validation Engineer

### Phase 5: Software & Networks
1. **SK-005**: AUTOSAR Configuration
2. **SK-008**: CAN/CAN-FD Communication
3. **SK-009**: Automotive Ethernet
4. **SK-016**: UDS Diagnostics
5. **SK-022**: OTA Update
6. **AG-007**: Automotive Software Architect
7. **AG-009**: Cybersecurity Engineer
8. **AG-011**: Diagnostics Expert

### Phase 6: Vehicle Dynamics & Testing
1. **SK-001**: Vehicle Dynamics Simulation
2. **SK-018**: Electric Power Steering
3. **SK-019**: Regenerative Braking
4. **SK-011**: HIL Test Automation
5. **SK-024**: MISRA C/C++ Compliance
6. **AG-008**: Vehicle Dynamics Engineer
7. **AG-010**: HIL Test Engineer

### Phase 7: Integration & Compliance
1. **SK-013**: Requirements Engineering
2. **SK-023**: NVH Analysis
3. **SK-025**: Homologation Documentation
4. **SK-021**: Aerodynamics CFD
5. **AG-012**: Homologation Specialist
6. **AG-015**: Integration Test Engineer

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 25 |
| Agents Identified | 15 |
| Shared Skill Candidates | 7 |
| Shared Agent Candidates | 5 |
| Total Processes Covered | 25 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
