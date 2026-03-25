# Chemical Engineering - Skills and Agents References (Phase 5)

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

### Process Simulation

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [DWSIM](https://github.com/DanWBR/dwsim) | Open-source process simulator | aspen-plus-simulator |
| [COCO/COFE](https://www.cocosimulator.org/) | CAPE-OPEN simulator | aspen-plus-simulator |
| [Cantera](https://github.com/Cantera/cantera) | Chemical kinetics and thermodynamics | kinetic-modeler, thermodynamic-model-selector |
| [CoolProp](https://github.com/CoolProp/CoolProp) | Thermophysical properties | thermodynamic-model-selector |
| [thermo](https://github.com/CalebBell/thermo) | Thermodynamic calculations | thermodynamic-model-selector |
| [chemicals](https://github.com/CalebBell/chemicals) | Chemical property database | thermodynamic-model-selector |

### Reaction Engineering

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Cantera](https://github.com/Cantera/cantera) | Reacting flow simulation | kinetic-modeler, reactor-designer |
| [RMG-Py](https://github.com/ReactionMechanismGenerator/RMG-Py) | Reaction mechanism generation | kinetic-modeler |
| [PyRates](https://github.com/pyrates-neuroscience/PyRates) | Dynamic systems modeling | reactor-designer |
| [scipy.integrate](https://github.com/scipy/scipy) | ODE solvers | kinetic-modeler, reactor-designer |
| [GEKKO](https://github.com/BYU-PRISM/GEKKO) | Dynamic optimization | reactor-designer |

### Separation Engineering

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [DWSIM](https://github.com/DanWBR/dwsim) | Distillation simulation | distillation-designer |
| [thermo](https://github.com/CalebBell/thermo) | VLE calculations | distillation-designer, thermodynamic-model-selector |
| [PyDST](https://github.com/jAIval2/PyDST) | Distillation shortcut methods | distillation-designer |

### Process Safety

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OpenFTA](https://github.com/open-fta/OpenFTA) | Fault tree analysis | hazop-facilitator, sil-calculator |
| [reliability](https://github.com/MatthewReid854/reliability) | Reliability engineering | sil-calculator |
| [ALOHA](https://www.epa.gov/cameo/aloha-software) | Atmospheric dispersion | consequence-modeler |

### Process Control

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [python-control](https://github.com/python-control/python-control) | Control systems library | control-strategy-designer, pid-tuner |
| [APMonitor](https://github.com/APMonitor/APMonitor.py) | Process monitoring/control | mpc-configurator |
| [GEKKO](https://github.com/BYU-PRISM/GEKKO) | MPC and optimization | mpc-configurator |
| [do-mpc](https://github.com/do-mpc/do-mpc) | Model predictive control | mpc-configurator |
| [CVXPY](https://github.com/cvxpy/cvxpy) | Convex optimization | mpc-configurator |

### Sustainability and LCA

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [brightway2](https://github.com/brightway-lca/brightway2) | LCA framework | lca-analyzer |
| [lca_algebraic](https://github.com/oie-mines-paristech/lca_algebraic) | Algebraic LCA | lca-analyzer |
| [Activity Browser](https://github.com/LCA-ActivityBrowser/activity-browser) | LCA GUI | lca-analyzer |
| [OpenLCA](https://github.com/GreenDelta/olca-app) | Open-source LCA software | lca-analyzer |

### Heat Integration

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [HEN-PyCalc](https://github.com/AIChE-ChemEngSim/HEN-PyCalc) | Heat exchanger network | pinch-analyzer |
| [py-pinch](https://github.com/tonimelisma/py-pinch) | Pinch analysis | pinch-analyzer |
| [ht](https://github.com/CalebBell/ht) | Heat transfer calculations | equipment-sizing-calculator |
| [fluids](https://github.com/CalebBell/fluids) | Fluid dynamics | equipment-sizing-calculator |

### Equipment Design

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [fluids](https://github.com/CalebBell/fluids) | Fluid mechanics calculations | equipment-sizing-calculator |
| [ht](https://github.com/CalebBell/ht) | Heat transfer | equipment-sizing-calculator |
| [PyVT](https://github.com/CAChemE/PyVT) | Vessel design | equipment-sizing-calculator |

---

## MCP Server References

### Simulation Tool MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **filesystem** | Access simulation files and data | All simulation skills |
| **github** | Version control for models | All skills |
| **postgres/sqlite** | Store thermodynamic and kinetic data | thermodynamic-model-selector, kinetic-modeler |

### Potential Custom MCP Servers

| Server Concept | Description | Target Skills |
|----------------|-------------|---------------|
| **aspen-mcp** | Aspen Plus/HYSYS automation | aspen-plus-simulator, hysys-dynamic-simulator |
| **dwsim-mcp** | DWSIM simulation control | aspen-plus-simulator |
| **cantera-mcp** | Cantera integration | kinetic-modeler |
| **coolprop-mcp** | Property calculations | thermodynamic-model-selector |
| **phast-mcp** | Consequence modeling | consequence-modeler |

### Chemical Database MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **nist-mcp** | NIST property data | thermodynamic-model-selector |
| **dechema-mcp** | VLE/LLE data | thermodynamic-model-selector, distillation-designer |
| **dippr-mcp** | DIPPR database | thermodynamic-model-selector |

### Safety Analysis MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **cameo-mcp** | CAMEO chemicals database | consequence-modeler |
| **aloha-mcp** | Dispersion modeling | consequence-modeler |
| **safety-data-mcp** | Chemical hazard data | hazop-facilitator |

---

## Community Resources

### Professional Organizations

| Organization | Resources | Relevant Areas |
|--------------|-----------|----------------|
| [AIChE](https://www.aiche.org/) | Publications, conferences | All chemical engineering |
| [CCPS](https://www.aiche.org/ccps) | Process safety resources | All safety skills |
| [ISA](https://www.isa.org/) | Control/automation standards | control-strategy-designer, alarm-rationalization-tool |
| [IChemE](https://www.icheme.org/) | Chemical engineering resources | All disciplines |
| [DECHEMA](https://dechema.de/) | Chemical engineering/biotechnology | thermodynamic-model-selector |

### Forums and Communities

| Community | Focus Area | URL |
|-----------|------------|-----|
| r/ChemicalEngineering | Reddit community | https://www.reddit.com/r/ChemicalEngineering/ |
| Eng-Tips Process | Process engineering | https://www.eng-tips.com/threadarea.cfm?lev2=83 |
| AIChE Exchange | AIChE community | https://engage.aiche.org/ |
| Control Global | Process control | https://www.controlglobal.com/articles |
| DWSIM Forums | Open-source simulation | https://sourceforge.net/p/dwsim/discussion/ |

### Educational Resources

| Resource | Description | Topics |
|----------|-------------|--------|
| [LearnChemE](https://learncheme.com/) | Free educational videos | Thermodynamics, separations |
| [MIT OpenCourseWare](https://ocw.mit.edu/courses/chemical-engineering/) | Course materials | All disciplines |
| [CCPS Courses](https://www.aiche.org/ccps/education) | Safety training | Process safety |
| [ISA Training](https://www.isa.org/training-and-certifications/isa-training) | Control/automation | Control systems |
| [Aspen Tech Training](https://esupport.aspentech.com/) | Simulation training | Process simulation |

### Documentation and Tutorials

| Resource | Description | Skills |
|----------|-------------|--------|
| [DWSIM Documentation](https://dwsim.org/wiki/index.php?title=Main_Page) | DWSIM tutorials | aspen-plus-simulator |
| [Cantera Tutorials](https://cantera.org/tutorials/index.html) | Kinetics tutorials | kinetic-modeler |
| [python-control Examples](https://python-control.readthedocs.io/) | Control tutorials | pid-tuner, control-strategy-designer |
| [GEKKO Documentation](https://gekko.readthedocs.io/) | MPC tutorials | mpc-configurator |
| [brightway2 Docs](https://brightway.dev/) | LCA tutorials | lca-analyzer |

---

## API Documentation

### Commercial Software APIs

| Software | API Documentation | Integration Skills |
|----------|-------------------|-------------------|
| Aspen Plus | [Aspen COM API](https://esupport.aspentech.com/) | aspen-plus-simulator |
| Aspen HYSYS | [HYSYS API](https://esupport.aspentech.com/) | hysys-dynamic-simulator |
| MATLAB | [MATLAB Engine API](https://www.mathworks.com/help/matlab/matlab-engine-api.html) | All simulation skills |
| Chemcad | [Chemcad COM](https://www.chemstations.com/) | aspen-plus-simulator |
| ProMax | [ProMax API](https://www.bre.com/portals/0/technicalarticles/ProMax%20COM%20Automation.pdf) | aspen-plus-simulator |

### Open Source APIs

| Tool | API Documentation | Integration Skills |
|------|-------------------|-------------------|
| DWSIM | [DWSIM API](https://dwsim.org/wiki/index.php?title=Experiment_API) | aspen-plus-simulator |
| Cantera | [Cantera Python](https://cantera.org/documentation/index.html) | kinetic-modeler |
| CoolProp | [CoolProp API](http://www.coolprop.org/coolprop/wrappers/index.html) | thermodynamic-model-selector |
| thermo | [thermo Documentation](https://thermo.readthedocs.io/) | thermodynamic-model-selector |
| GEKKO | [GEKKO API](https://gekko.readthedocs.io/en/latest/) | mpc-configurator |

### Standards and Databases

| Resource | Documentation | Skills |
|----------|---------------|--------|
| NIST Chemistry WebBook | [NIST WebBook](https://webbook.nist.gov/chemistry/) | thermodynamic-model-selector |
| DECHEMA | [DECHEMA Data](https://dechema.de/en/databases.html) | thermodynamic-model-selector |
| DIPPR | [DIPPR Database](https://www.aiche.org/dippr) | thermodynamic-model-selector |
| ecoinvent | [ecoinvent API](https://www.ecoinvent.org/) | lca-analyzer |

### Safety Standards

| Standard | Documentation | Skills |
|----------|---------------|--------|
| IEC 61511 | SIS for process industries | sil-calculator |
| IEC 61508 | Functional safety | sil-calculator |
| API 520/521 | Relief system design | relief-system-designer |
| NFPA standards | Fire protection | consequence-modeler |
| OSHA PSM | Process safety management | hazop-facilitator, pssr-checklist-generator |
| EPA RMP | Risk management plan | consequence-modeler |

---

## Applicable Skills from Other Specializations

### From Aerospace Engineering

| Skill | Description | Application in Chemical Engineering |
|-------|-------------|-------------------------------------|
| SK-001: CFD Analysis | Computational fluid dynamics | Reactor flow modeling |
| SK-007: FEA Structural | Finite element analysis | Pressure vessel design |
| SK-022: Safety Assessment (ARP4761) | Safety analysis methods | Adaptable for HAZOP/LOPA |

### From Automotive Engineering

| Skill | Description | Application in Chemical Engineering |
|-------|-------------|-------------------------------------|
| SK-007: ISO 26262 Compliance | Functional safety | Similar to IEC 61511 |
| SK-024: MISRA C/C++ Compliance | Code quality | SIS software development |

### From Biomedical Engineering

| Skill | Description | Application in Chemical Engineering |
|-------|-------------|-------------------------------------|
| iso14971-risk-analyzer | Risk management | Process risk analysis |
| software-vv-test-generator | Software V&V | SIS software testing |

### From Civil Engineering

| Skill | Description | Application in Chemical Engineering |
|-------|-------------|-------------------------------------|
| fea-structural-engine | Structural analysis | Vessel and piping stress |
| construction-cost-estimation | Cost estimation | Project cost estimation |
| construction-schedule-development | Scheduling | Process plant construction |

### From Electrical Engineering

| Skill | Description | Application in Chemical Engineering |
|-------|-------------|-------------------------------------|
| feedback-control-design | Control systems | Process control design |
| digital-filter-design | Signal processing | Instrument signal processing |

### From Environmental Engineering

| Skill | Description | Application in Chemical Engineering |
|-------|-------------|-------------------------------------|
| air-permit-application | Air permits | Process emissions compliance |
| carbon-footprint-assessment | GHG analysis | Process sustainability |
| wastewater-treatment-design | Water treatment | Process water treatment |

### From Mechanical Engineering

| Skill | Description | Application in Chemical Engineering |
|-------|-------------|-------------------------------------|
| pump-selection | Pump sizing | Process pump selection |
| heat-exchanger-design | HX design | Heat exchanger sizing |
| piping-design | Piping systems | Process piping design |

### Cross-Specialization Agent Applicability

| Agent Source | Agent | Chemical Engineering Application |
|--------------|-------|----------------------------------|
| Aerospace | safety-specialist | Process safety management |
| Civil | cost-estimator | Capital cost estimation |
| Civil | construction-scheduler | Plant construction scheduling |
| Electrical | control-systems-engineer | Process control design |
| Environmental | sustainability-analyst | Process sustainability assessment |

---

## Integration Recommendations

### Priority Tool Integrations

1. **DWSIM/Cantera** - Open-source simulation platform
2. **python-control/GEKKO** - Control system analysis and MPC
3. **thermo/CoolProp** - Thermodynamic property calculations
4. **brightway2/OpenLCA** - Life cycle assessment
5. **reliability** - Safety and reliability analysis

### Recommended MCP Server Development

1. **simulation-mcp** - DWSIM/Aspen automation
2. **properties-mcp** - Thermodynamic property lookup
3. **safety-mcp** - Hazard data and consequence modeling
4. **control-mcp** - Control system analysis
5. **lca-mcp** - Life cycle assessment data

### Data Standards to Support

- **CAPE-OPEN** - Process simulation interoperability
- **OPC UA** - Industrial communication
- **ISA-95** - Manufacturing integration
- **ISA-88** - Batch control
- **ISA-18.2** - Alarm management
- **IEC 61512** - Batch control standard
- **AVEVA P&ID** - P&ID format
- **ASME PTC** - Performance test codes

---

## Summary

This reference document provides the foundational resources for implementing chemical engineering skills and agents:

| Category | Count |
|----------|-------|
| GitHub Repositories | 30+ |
| MCP Server References | 15+ |
| Community Resources | 15+ |
| API Documentation Sources | 20+ |
| Cross-Specialization Skills | 15+ |

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Implement specialized skills and agents using these references
