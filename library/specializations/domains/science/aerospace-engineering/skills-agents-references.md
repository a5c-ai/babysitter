# Aerospace Engineering - Skills and Agents References (Phase 5)

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

### Aerodynamics and CFD

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OpenFOAM/OpenFOAM](https://github.com/OpenFOAM/OpenFOAM-dev) | Open-source CFD toolbox for complex fluid flows | SK-001: CFD Analysis |
| [su2code/SU2](https://github.com/su2code/SU2) | Open-source CFD code for aerodynamic shape design | SK-001, SK-026: Hypersonic |
| [FluidityProject/fluidity](https://github.com/FluidityProject/fluidity) | Computational fluid dynamics code with adaptive meshing | SK-001: CFD Analysis |
| [peterdsharpe/AeroSandbox](https://github.com/peterdsharpe/AeroSandbox) | Aircraft design optimization framework | SK-003: Aero Database |
| [OpenMDAO/OpenMDAO](https://github.com/OpenMDAO/OpenMDAO) | Multidisciplinary design analysis and optimization | AG-001: Aero Specialist |

### Structural Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [sfepy/sfepy](https://github.com/sfepy/sfepy) | Simple Finite Elements in Python | SK-007: FEA Structural |
| [calculix/CalculiX](https://github.com/calculix/CalculiX) | 3D structural finite element solver | SK-007: FEA Structural |
| [pyNastran](https://github.com/SteveDoyle2/pyNastran) | Python interface for NASTRAN | SK-007, SK-008, SK-010 |
| [meshpy](https://github.com/inducer/meshpy) | Python mesh generation | SK-007: FEA Structural |
| [pyfatigue](https://github.com/OWI-Lab/py_fatigue) | Fatigue analysis library | SK-008: Fatigue DT |

### Flight Dynamics and Control

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [JSBSim-Team/jsbsim](https://github.com/JSBSim-Team/jsbsim) | Open-source flight dynamics model | SK-013: Flight Sim Model |
| [python-control/python-control](https://github.com/python-control/python-control) | Python control systems library | SK-011: Control Law Design |
| [AeroPython](https://github.com/barbagroup/AeroPython) | Classical aerodynamics lessons | AG-001: Aero Specialist |
| [FlightGear/flightgear](https://github.com/FlightGear/flightgear) | Open-source flight simulator | SK-013: Flight Sim Model |
| [PX4/PX4-Autopilot](https://github.com/PX4/PX4-Autopilot) | Autopilot flight control system | SK-011, SK-028: GNC |

### Space Systems

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [poliastro/poliastro](https://github.com/poliastro/poliastro) | Python astrodynamics library | SK-014: Mission Trajectory |
| [GMAT](https://sourceforge.net/projects/gmat/) | General Mission Analysis Tool | SK-014: Mission Trajectory |
| [orekit/orekit](https://github.com/CS-SI/Orekit) | Space dynamics library (Java) | SK-014, SK-017: Orbital Debris |
| [skyfielders/python-skyfield](https://github.com/skyfielders/python-skyfield) | Astronomy computations | SK-014: Mission Trajectory |
| [RocketPy-Team/RocketPy](https://github.com/RocketPy-Team/RocketPy) | Rocket trajectory simulation | SK-005: Rocket Propulsion |

### Propulsion

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [NASA CEA](https://www1.grc.nasa.gov/research-and-engineering/ceaweb/) | Chemical Equilibrium with Applications | SK-005: Rocket Propulsion |
| [cantera/cantera](https://github.com/Cantera/cantera) | Chemical kinetics and thermodynamics | SK-004, SK-005: Propulsion |
| [pyCycle](https://github.com/OpenMDAO/pyCycle) | Thermodynamic cycle modeling | SK-004: Gas Turbine Cycle |

### Safety and Certification

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OpenFTA](https://github.com/open-fta/OpenFTA) | Fault tree analysis software | SK-022: Safety Assessment |
| [doorstop](https://github.com/doorstop-dev/doorstop) | Requirements management tool | SK-018: Requirements Verification |
| [vectorcast](https://www.vector.com/int/en/products/products-a-z/software/vectorcast/) | Structural coverage analysis | SK-023: DO-178C |

---

## MCP Server References

### Simulation and Analysis MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **filesystem** | Access local CAD, mesh, and simulation files | All analysis skills |
| **github** | Version control for simulation models and configs | All skills |
| **postgres/sqlite** | Store aerodynamic databases and test results | SK-003: Aero Database |
| **puppeteer** | Automate web-based simulation tools | SK-014: STK integration |

### Potential Custom MCP Servers

| Server Concept | Description | Target Skills |
|----------------|-------------|---------------|
| **nastran-mcp** | Interface with MSC NASTRAN solver | SK-007, SK-008, SK-010 |
| **openfoam-mcp** | Control OpenFOAM CFD simulations | SK-001: CFD Analysis |
| **matlab-mcp** | Execute MATLAB/Simulink models | SK-011, SK-013, SK-028 |
| **ansys-mcp** | Interface with ANSYS suite | SK-001, SK-007 |
| **stk-mcp** | Interface with Systems Tool Kit | SK-014, SK-017 |

### Data Management MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **aws-s3** | Cloud storage for large simulation datasets | All analysis skills |
| **gdrive** | Collaborative document access | All documentation skills |
| **slack** | Team communication for design reviews | AG-006: Systems Engineering |

---

## Community Resources

### Professional Organizations

| Organization | Resources | Relevant Areas |
|--------------|-----------|----------------|
| [AIAA](https://www.aiaa.org/) | Standards, journals, conferences | All aerospace disciplines |
| [SAE International](https://www.sae.org/) | ARP standards (4754A, 4761, etc.) | Safety, certification |
| [INCOSE](https://www.incose.org/) | Systems engineering handbook | SK-018-020: Systems Engineering |
| [RTCA](https://www.rtca.org/) | DO-178C, DO-254, DO-330 standards | SK-023: DO-178C |

### Forums and Communities

| Community | Focus Area | URL |
|-----------|------------|-----|
| CFD Online | Computational fluid dynamics | https://www.cfd-online.com/Forums/ |
| Eng-Tips Aerospace | General aerospace engineering | https://www.eng-tips.com/threadarea.cfm?lev2=26 |
| Space Exploration Stack Exchange | Space systems | https://space.stackexchange.com/ |
| r/AerospaceEngineering | Reddit community | https://www.reddit.com/r/AerospaceEngineering/ |
| Simulia Community | ABAQUS/FEA users | https://www.3ds.com/support/simulia-community/ |

### Educational Resources

| Resource | Description | Topics |
|----------|-------------|--------|
| NASA Technical Reports Server | Free technical publications | All disciplines |
| MIT OpenCourseWare | Aerospace courses | Aero, structures, propulsion |
| Stanford AA Department | Course materials | Flight dynamics, optimization |
| ESDU Data Sheets | Engineering design data | Aerodynamics, structures |

### Documentation and Tutorials

| Resource | Description | Skills |
|----------|-------------|--------|
| [OpenFOAM User Guide](https://www.openfoam.com/documentation/user-guide) | CFD tutorials | SK-001: CFD Analysis |
| [JSBSim Reference Manual](https://jsbsim-team.github.io/jsbsim-reference-manual/) | Flight dynamics | SK-013: Flight Sim Model |
| [NASA Trajectory Browser](https://trajbrowser.arc.nasa.gov/) | Mission design | SK-014: Mission Trajectory |
| [NASTRAN Quick Reference Guide](https://docs.hexagon.com/r/en-US/MSC-Nastran-Quick-Reference-Guide) | FEA reference | SK-007: FEA Structural |

---

## API Documentation

### Commercial Software APIs

| Software | API Documentation | Integration Skills |
|----------|-------------------|-------------------|
| ANSYS Fluent | [Fluent Customization Manual](https://ansyshelp.ansys.com/) | SK-001: CFD Analysis |
| MSC NASTRAN | [NASTRAN DMAP Guide](https://hexagon.com/products/nastran) | SK-007, SK-008, SK-010 |
| MATLAB/Simulink | [MATLAB Engine API](https://www.mathworks.com/help/matlab/matlab-engine-api.html) | SK-011, SK-013 |
| STK (AGI) | [STK Integration](https://help.agi.com/stk/) | SK-014, SK-017 |
| DOORS | [DOORS API](https://www.ibm.com/docs/en/ermd/9.7.2?topic=overview-dxl-reference) | SK-018: Requirements |

### Open Source APIs

| Tool | API Documentation | Integration Skills |
|------|-------------------|-------------------|
| OpenFOAM | [OpenFOAM Wiki](https://www.openfoam.com/documentation/guides/latest/doc/) | SK-001: CFD Analysis |
| JSBSim | [JSBSim API](https://jsbsim-team.github.io/jsbsim/) | SK-013: Flight Sim Model |
| poliastro | [poliastro Docs](https://docs.poliastro.space/) | SK-014: Mission Trajectory |
| Cantera | [Cantera Documentation](https://cantera.org/documentation/) | SK-004, SK-005 |

### Cloud and HPC APIs

| Service | Documentation | Use Cases |
|---------|---------------|-----------|
| AWS Batch | [AWS Batch API](https://docs.aws.amazon.com/batch/) | HPC CFD simulations |
| Azure HPC | [Azure HPC Documentation](https://docs.microsoft.com/azure/batch/) | Large-scale FEA |
| Google Cloud HPC | [GCP HPC Toolkit](https://cloud.google.com/hpc-toolkit) | Monte Carlo simulations |

### Standards and Databases

| Database/Standard | Access | Related Skills |
|-------------------|--------|----------------|
| FAA Regulations | [eCFR Title 14](https://www.ecfr.gov/current/title-14) | SK-021: Certification |
| EASA CS Regulations | [EASA Easy Access Rules](https://www.easa.europa.eu/en/document-library/easy-access-rules) | SK-021: Certification |
| NIST Material Data | [NIST Standard Reference Data](https://www.nist.gov/srd) | SK-007: FEA (materials) |
| NASA Debris Environment | [ORDEM 3.1](https://orbitaldebris.jsc.nasa.gov/modeling/) | SK-017: Orbital Debris |

---

## Applicable Skills from Other Specializations

### From Automotive Engineering

| Skill | Description | Application in Aerospace |
|-------|-------------|--------------------------|
| SK-007: ISO 26262 Compliance | Functional safety analysis | Adaptable for ARP4761 safety assessments |
| SK-011: HIL Test Automation | Hardware-in-loop testing | Applicable to flight control HIL testing |
| SK-024: MISRA C/C++ Compliance | Code quality checking | Direct application for DO-178C software |

### From Biomedical Engineering

| Skill | Description | Application in Aerospace |
|-------|-------------|--------------------------|
| fea-mesh-generator | Biomedical FEA meshing | Complex geometry meshing techniques |
| fatigue-life-predictor | Fatigue analysis | Applicable to structural fatigue (SK-008) |
| requirements-traceability-manager | Design control | Direct application for DO-178C/ARP4754A |

### From Chemical Engineering

| Skill | Description | Application in Aerospace |
|-------|-------------|--------------------------|
| kinetic-modeler | Reaction kinetics | Combustion modeling for propulsion |
| thermodynamic-model-selector | Property methods | Propellant thermodynamics |
| hazop-facilitator | Process safety | Adaptable for propulsion system safety |

### From Civil Engineering

| Skill | Description | Application in Aerospace |
|-------|-------------|--------------------------|
| fea-structural-engine | Structural FEA | Direct application to aerospace structures |
| load-combination-generator | Load cases | Adaptable for aerospace load combinations |
| wind-load-calculator | Wind analysis | Ground wind loads for launch vehicles |

### From Systems Engineering (Generic)

| Skill | Description | Application in Aerospace |
|-------|-------------|--------------------------|
| requirements-management | Requirements traceability | SK-018: Requirements Verification |
| trade-study-framework | Decision analysis | SK-020: Trade Study Methodology |
| risk-management | Risk assessment | SK-022: Safety Assessment |

### Cross-Specialization Agent Applicability

| Agent Source | Agent | Aerospace Application |
|--------------|-------|----------------------|
| Automotive | functional-safety-expert | Adaptable for ARP4761 safety assessment |
| Biomedical | software-lifecycle-manager | DO-178C/IEC 62304 software processes |
| Chemical | risk-analyst | Propulsion system hazard analysis |
| Civil | structural-peer-reviewer | Independent structural analysis review |
| Systems Eng | systems-engineer | Systems integration across disciplines |

---

## Integration Recommendations

### Priority Tool Integrations

1. **OpenFOAM/SU2** - Primary open-source CFD platform integration
2. **pyNastran** - NASTRAN file parsing and post-processing
3. **JSBSim** - Flight dynamics simulation
4. **poliastro** - Orbital mechanics calculations
5. **python-control** - Control system analysis

### Recommended MCP Server Development

1. **nastran-results-mcp** - Parse and analyze NASTRAN output files
2. **cfd-postprocess-mcp** - CFD post-processing and visualization
3. **flight-test-data-mcp** - Flight test data management
4. **certification-tracker-mcp** - Regulatory compliance tracking

### Data Standards to Support

- **CGNS** - CFD General Notation System
- **HDF5** - Large dataset storage
- **STEP/IGES** - CAD geometry interchange
- **NASTRAN BDF** - Structural model format
- **OpenDRIVE** - Road network (for ground ops)
- **CZML** - Cesium language for trajectory visualization

---

## Summary

This reference document provides the foundational resources for implementing aerospace engineering skills and agents:

| Category | Count |
|----------|-------|
| GitHub Repositories | 25+ |
| MCP Server References | 10+ |
| Community Resources | 15+ |
| API Documentation Sources | 20+ |
| Cross-Specialization Skills | 15+ |

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Implement specialized skills and agents using these references
