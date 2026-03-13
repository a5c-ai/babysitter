# Automotive Engineering - Skills and Agents References (Phase 5)

This document provides reference materials, tools, libraries, and cross-specialization resources for implementing the skills and agents defined in the skills-agents-backlog.md.

---

## Table of Contents

1. [GitHub Repositories](#github-repositories)
2. [MCP Server References](#mcp-server-references)
3. [Community Resources](#community-resources)
4. [API Documentation](#api-documentation)
5. [Applicable Skills from Other Specializations](#applicable-skills-from-other-specializations)

---

## GitHub Repositories

### Vehicle Dynamics and Simulation

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OpenModelica](https://github.com/OpenModelica/OpenModelica) | Open-source Modelica-based modeling environment | SK-001: Vehicle Dynamics Sim |
| [CARLA](https://github.com/carla-simulator/carla) | Open-source autonomous driving simulator | SK-017: Scenario Simulation |
| [commonroad-io](https://github.com/CommonRoad/commonroad-io) | Traffic scenario tools | SK-017: Scenario Simulation |
| [drake](https://github.com/RobotLocomotion/drake) | Model-based design toolbox | SK-001: Vehicle Dynamics |
| [chrono](https://github.com/projectchrono/chrono) | Multi-physics simulation engine | SK-001: Vehicle Dynamics Sim |

### ADAS and Autonomous Driving

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Autoware](https://github.com/autowarefoundation/autoware) | Open-source autonomous driving platform | SK-006, SK-010: Sensor Fusion, Path Planning |
| [apollo](https://github.com/ApolloAuto/apollo) | Baidu autonomous driving platform | SK-006, SK-010: ADAS Development |
| [openpilot](https://github.com/commaai/openpilot) | Open-source driver assistance system | SK-006: Sensor Fusion |
| [lanelet2](https://github.com/fzi-forschungszentrum-informatik/Lanelet2) | HD map handling library | SK-010: Path Planning |
| [nuScenes-devkit](https://github.com/nutonomy/nuscenes-devkit) | Autonomous driving dataset tools | SK-006: Sensor Fusion |

### Perception and Computer Vision

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OpenCV](https://github.com/opencv/opencv) | Computer vision library | SK-006: Sensor Fusion |
| [pcl](https://github.com/PointCloudLibrary/pcl) | Point Cloud Library for lidar | SK-006: Sensor Fusion |
| [mmdetection3d](https://github.com/open-mmlab/mmdetection3d) | 3D object detection toolbox | SK-006: Sensor Fusion |
| [OpenPCDet](https://github.com/open-mmlab/OpenPCDet) | LiDAR-based 3D detection | SK-006: Sensor Fusion |
| [YOLO](https://github.com/ultralytics/ultralytics) | Real-time object detection | SK-006: Sensor Fusion |

### Automotive Software

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [ros2](https://github.com/ros2/ros2) | Robot Operating System 2 | SK-006, SK-010: ADAS |
| [autosar-classic-docs](https://www.autosar.org/standards/) | AUTOSAR standards | SK-005: AUTOSAR Config |
| [can-utils](https://github.com/linux-can/can-utils) | Linux CAN utilities | SK-008: CAN Communication |
| [python-can](https://github.com/hardbyte/python-can) | CAN interface for Python | SK-008: CAN Communication |
| [canmatrix](https://github.com/ebroecker/canmatrix) | CAN database conversion | SK-008: CAN/CAN-FD |

### Functional Safety and Security

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OpenFTA](https://github.com/open-fta/OpenFTA) | Fault tree analysis | SK-007: ISO 26262 |
| [pycryptodome](https://github.com/Legrandin/pycryptodome) | Cryptographic library | SK-015: Cybersecurity |
| [automotive-security](https://github.com/AICyberTeam/automotive-security-papers) | Security research papers | SK-015: Cybersecurity |

### Electrification

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [PyBaMM](https://github.com/pybamm-team/PyBaMM) | Battery modeling | SK-003: BMS Development |
| [NREL/fastsim](https://github.com/NREL/fastsim) | Fuel economy simulation | SK-003, SK-020: Thermal Management |
| [PyPSA](https://github.com/PyPSA/PyPSA) | Power system analysis | SK-003: BMS Development |
| [liionpack](https://github.com/pybamm-team/liionpack) | Battery pack modeling | SK-003: BMS Development |

### Crash and Safety

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OpenRadioss](https://github.com/OpenRadioss/OpenRadioss) | Explicit FEA solver | SK-002: Crashworthiness |
| [LS-DYNA examples](https://ftp.lstc.com/anonymous/outgoing/lsprepost/examples/) | Crash simulation examples | SK-002: Crashworthiness |

---

## MCP Server References

### Simulation and Analysis MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **filesystem** | Access CAD, simulation, and calibration files | All skills |
| **github** | Version control for ECU software and configs | SK-005, SK-024: AUTOSAR, MISRA |
| **postgres/sqlite** | Store test results and calibration data | SK-011, SK-012: HIL, Calibration |

### Potential Custom MCP Servers

| Server Concept | Description | Target Skills |
|----------------|-------------|---------------|
| **vector-canoe-mcp** | Control CANoe simulations | SK-008, SK-016: CAN, Diagnostics |
| **dspace-hil-mcp** | Interface with dSPACE HIL systems | SK-011: HIL Test Automation |
| **carla-mcp** | Control CARLA simulator | SK-017: Scenario Simulation |
| **matlab-simulink-mcp** | Run Simulink vehicle models | SK-001, SK-003: Dynamics, BMS |
| **etas-inca-mcp** | ECU calibration interface | SK-012: Emissions Calibration |
| **vector-vteststudio-mcp** | Test automation interface | SK-011: HIL Test |

### Automotive Protocol MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **can-interface-mcp** | Direct CAN bus communication | SK-008: CAN Communication |
| **xcp-mcp** | XCP/CCP calibration protocol | SK-012: Calibration |
| **uds-diagnostic-mcp** | UDS diagnostic services | SK-016: UDS Diagnostics |
| **doip-mcp** | Diagnostics over IP | SK-009: Automotive Ethernet |

---

## Community Resources

### Professional Organizations

| Organization | Resources | Relevant Areas |
|--------------|-----------|----------------|
| [SAE International](https://www.sae.org/) | J standards, conferences | All automotive |
| [ISO TC 22](https://www.iso.org/committee/46706.html) | Automotive standards | Safety, security |
| [AUTOSAR](https://www.autosar.org/) | Software architecture standards | SK-005: AUTOSAR |
| [ASAM](https://www.asam.net/) | Standards (XCP, ODX, OpenSCENARIO) | SK-008, SK-016, SK-017 |
| [IEEE ITSS](https://ieee-itss.org/) | Intelligent transportation | ADAS/AD systems |

### Forums and Communities

| Community | Focus Area | URL |
|-----------|------------|-----|
| Vector Support | CANoe, CANalyzer | https://support.vector.com/ |
| dSPACE User Forum | HIL testing | https://www.dspace.com/en/inc/home/support.cfm |
| r/AutomotiveEngineering | Reddit community | https://www.reddit.com/r/AutomotiveEngineering/ |
| Eng-Tips Automotive | General automotive | https://www.eng-tips.com/threadarea.cfm?lev2=178 |
| AUTOSAR Forums | AUTOSAR development | https://www.autosar.org/community/ |

### Educational Resources

| Resource | Description | Topics |
|----------|-------------|--------|
| [SAE MOBILUS](https://www.sae.org/publications/technical-papers) | Technical papers | All automotive |
| [ISO Standards](https://www.iso.org/) | Official standards | Safety, security |
| [Automotive SPICE](http://www.intacs.info/) | Process assessment | Software development |
| [Udacity Self-Driving Car](https://www.udacity.com/course/self-driving-car-engineer-nanodegree--nd0013) | ADAS/AD courses | Perception, planning |

### Documentation and Tutorials

| Resource | Description | Skills |
|----------|-------------|--------|
| [CARLA Documentation](https://carla.readthedocs.io/) | Simulation tutorials | SK-017: Scenario Simulation |
| [Autoware Documentation](https://autowarefoundation.github.io/autoware-documentation/) | AD platform docs | SK-006, SK-010: ADAS |
| [Vector Academy](https://academy.vector.com/) | Automotive tools training | SK-008, SK-016: CAN, UDS |
| [PyBaMM Tutorials](https://www.pybamm.org/tutorials) | Battery modeling | SK-003: BMS Development |

---

## API Documentation

### Commercial Software APIs

| Software | API Documentation | Integration Skills |
|----------|-------------------|-------------------|
| Vector CANoe | [CANoe Programming](https://assets.vector.com/cms/content/know-how/technical-articles/Application_Programming_CANoe.pdf) | SK-008, SK-016 |
| dSPACE ControlDesk | [ControlDesk API](https://www.dspace.com/en/inc/home/products/sw/expsoft/controldesk_ng.cfm) | SK-011: HIL Test |
| ETAS INCA | [INCA API](https://www.etas.com/en/products/inca_software_products.php) | SK-012: Calibration |
| MathWorks Simulink | [Simulink API](https://www.mathworks.com/help/simulink/) | SK-001, SK-003 |
| IPG CarMaker | [CarMaker Programmer Guide](https://ipg-automotive.com/en/products-solutions/software/carmaker/) | SK-001, SK-017 |

### Open Source APIs

| Tool | API Documentation | Integration Skills |
|------|-------------------|-------------------|
| CARLA | [CARLA Python API](https://carla.readthedocs.io/en/latest/python_api/) | SK-017: Scenario Simulation |
| Autoware | [Autoware API](https://autowarefoundation.github.io/autoware-documentation/main/) | SK-006, SK-010 |
| python-can | [python-can docs](https://python-can.readthedocs.io/) | SK-008: CAN |
| OpenCV | [OpenCV Python docs](https://docs.opencv.org/) | SK-006: Sensor Fusion |
| ROS2 | [ROS2 API](https://docs.ros.org/en/humble/) | ADAS/AD development |

### Standards and Protocols

| Standard | Documentation | Related Skills |
|----------|---------------|----------------|
| ISO 26262 | Parts 1-12 | SK-007: Functional Safety |
| ISO 21448 (SOTIF) | SOTIF methodology | SK-014: SOTIF Analysis |
| ISO/SAE 21434 | Cybersecurity engineering | SK-015: Cybersecurity |
| AUTOSAR Classic | [AUTOSAR Documents](https://www.autosar.org/standards/classic-platform/) | SK-005: AUTOSAR |
| AUTOSAR Adaptive | [Adaptive Platform](https://www.autosar.org/standards/adaptive-platform/) | SK-005: AUTOSAR |

### Protocol Specifications

| Protocol | Specification | Skills |
|----------|---------------|--------|
| CAN/CAN-FD | ISO 11898 | SK-008: CAN Communication |
| UDS | ISO 14229 | SK-016: UDS Diagnostics |
| DoIP | ISO 13400 | SK-009: Automotive Ethernet |
| SOME/IP | AUTOSAR SOME/IP | SK-009: Automotive Ethernet |
| XCP | ASAM XCP | SK-012: Calibration |
| ODX | ASAM MCD-2D | SK-016: UDS Diagnostics |
| OpenSCENARIO | ASAM OpenSCENARIO | SK-017: Scenario Simulation |
| OpenDRIVE | ASAM OpenDRIVE | SK-017: Scenario Simulation |

---

## Applicable Skills from Other Specializations

### From Aerospace Engineering

| Skill | Description | Application in Automotive |
|-------|-------------|---------------------------|
| SK-007: FEA Structural | Finite element analysis | Vehicle body/chassis structural analysis |
| SK-011: Control Law Design | Flight control design | Vehicle dynamics control systems |
| SK-022: Safety Assessment (ARP4761) | Safety analysis methods | Adaptable to ISO 26262 methods |
| SK-023: DO-178C Compliance | Safety-critical software | Principles applicable to ASIL-D software |

### From Bioinformatics

| Skill | Description | Application in Automotive |
|-------|-------------|---------------------------|
| nextflow-pipeline-executor | Workflow automation | CI/CD for automotive software |
| giab-benchmark-validator | Validation methodology | Applicable to ADAS validation |

### From Biomedical Engineering

| Skill | Description | Application in Automotive |
|-------|-------------|---------------------------|
| requirements-traceability-manager | Design control | ISO 26262 traceability requirements |
| software-vv-test-generator | Software V&V | ASPICE-compliant testing |
| iso14971-risk-analyzer | Risk management | Adaptable to ISO 26262 HARA |

### From Chemical Engineering

| Skill | Description | Application in Automotive |
|-------|-------------|---------------------------|
| thermodynamic-model-selector | Thermodynamic modeling | Battery thermal modeling |
| control-strategy-designer | Process control | Powertrain control strategies |
| pid-tuner | Controller tuning | Engine/motor control tuning |

### From Civil Engineering

| Skill | Description | Application in Automotive |
|-------|-------------|---------------------------|
| fea-structural-engine | Structural analysis | Crash simulation setup |
| traffic-simulation-engine | Traffic modeling | V2X and traffic scenario simulation |

### From Electrical Engineering

| Skill | Description | Application in Automotive |
|-------|-------------|---------------------------|
| digital-filter-design | Signal processing | Sensor signal conditioning |
| feedback-control-design | Control systems | Vehicle control algorithms |
| emc-design-testing | EMC compliance | Automotive EMC requirements |

### Cross-Specialization Agent Applicability

| Agent Source | Agent | Automotive Application |
|--------------|-------|------------------------|
| Aerospace | safety-specialist | Adaptable for ISO 26262 safety management |
| Aerospace | software-certification-specialist | ASPICE/ISO 26262 software compliance |
| Biomedical | software-lifecycle-manager | Automotive software process management |
| Civil | traffic-engineer | V2X and traffic management systems |
| Electrical | control-systems-engineer | Vehicle control system design |

---

## Integration Recommendations

### Priority Tool Integrations

1. **CARLA/Autoware** - Primary open-source ADAS simulation platform
2. **python-can** - CAN bus communication interface
3. **PyBaMM** - Battery system modeling
4. **OpenCV/PCL** - Perception algorithm development
5. **ROS2** - Robotics middleware for ADAS

### Recommended MCP Server Development

1. **vector-tools-mcp** - CANoe/CANalyzer automation
2. **dspace-hil-mcp** - HIL test automation
3. **calibration-mcp** - XCP/CCP calibration interface
4. **scenario-mcp** - OpenSCENARIO management
5. **compliance-mcp** - ISO 26262/SOTIF compliance tracking

### Data Standards to Support

- **DBC** - CAN database format
- **ARXML** - AUTOSAR configuration
- **ODX/PDX** - Diagnostic data
- **OpenSCENARIO** - Scenario description
- **OpenDRIVE** - Road network description
- **ASAM ODS** - Test data storage
- **MDF4** - Measurement data format

---

## Summary

This reference document provides the foundational resources for implementing automotive engineering skills and agents:

| Category | Count |
|----------|-------|
| GitHub Repositories | 30+ |
| MCP Server References | 15+ |
| Community Resources | 15+ |
| API Documentation Sources | 25+ |
| Cross-Specialization Skills | 15+ |

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Implement specialized skills and agents using these references
