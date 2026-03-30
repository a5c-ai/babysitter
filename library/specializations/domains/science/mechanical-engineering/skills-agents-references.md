# Mechanical Engineering - Skills and Agents References (Phase 5)

This document provides implementation references for the skills and agents identified in the Mechanical Engineering skills-agents-backlog.md, including GitHub repositories, MCP servers, community resources, API documentation, and applicable skills from other specializations.

---

## Table of Contents

1. [GitHub Repositories](#github-repositories)
2. [MCP Server References](#mcp-server-references)
3. [Community Resources](#community-resources)
4. [API Documentation](#api-documentation)
5. [Applicable Skills from Other Specializations](#applicable-skills-from-other-specializations)

---

## GitHub Repositories

### Finite Element Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [FEniCSx](https://github.com/FEniCS/dolfinx) | Finite element computing platform | SK-001: FEA Structural |
| [SfePy](https://github.com/sfepy/sfepy) | Simple Finite Elements in Python | SK-001: FEA Structural |
| [Calculix](https://github.com/calculix/calculix-adapter) | Open source FEA solver | SK-001: FEA Structural |
| [meshio](https://github.com/nschloe/meshio) | Mesh I/O library | SK-001: FEA Structural |
| [gmsh](https://github.com/gmsh/gmsh) | Mesh generator | SK-001: FEA Structural |
| [pygmsh](https://github.com/nschloe/pygmsh) | Python interface to Gmsh | SK-001: FEA Structural |
| [pyvista](https://github.com/pyvista/pyvista) | 3D visualization | SK-001: FEA Structural |

### Fatigue and Fracture

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [pyFatigue](https://github.com/OWI-Lab/py_fatigue) | Fatigue analysis library | SK-002: Fatigue Life |
| [fatpack](https://github.com/Gunnstein/fatpack) | Fatigue analysis in Python | SK-002: Fatigue Life |
| [rainflow](https://github.com/iamlikeme/rainflow) | Rainflow cycle counting | SK-002: Fatigue Life |
| [NASGRO](https://www.nasgro.swri.org) | Fracture mechanics (commercial) | SK-002: Fatigue Life |

### Dynamics and Vibration

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [scipy.signal](https://github.com/scipy/scipy) | Signal processing | SK-003: Vibration Analysis |
| [pyFRF](https://github.com/openmodal/pyFRF) | Frequency response functions | SK-003: Vibration Analysis |
| [pyExSi](https://github.com/ladisk/pyExSi) | Excitation signal generation | SK-003: Vibration Analysis |
| [MBDyn](https://github.com/mmorandi/MBDyn) | Multibody dynamics | SK-003: Vibration Analysis |
| [modal](https://github.com/openmodal/OpenModal) | Modal analysis toolkit | SK-003: Vibration Analysis |

### Computational Fluid Dynamics

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OpenFOAM](https://github.com/OpenFOAM/OpenFOAM-dev) | Open source CFD toolkit | SK-004: CFD Analysis |
| [PyFR](https://github.com/PyFR/PyFR) | High-order CFD solver | SK-004: CFD Analysis |
| [fluids](https://github.com/CalebBell/fluids) | Fluid dynamics calculations | SK-004: CFD Analysis |
| [meshio](https://github.com/nschloe/meshio) | CFD mesh handling | SK-004: CFD Analysis |
| [paraview](https://github.com/Kitware/ParaView) | Visualization | SK-004: CFD Analysis |
| [pyvista](https://github.com/pyvista/pyvista) | 3D plotting and mesh analysis | SK-004: CFD Analysis |

### Thermal Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [CoolProp](https://github.com/CoolProp/CoolProp) | Thermophysical properties | SK-005: Thermal Analysis |
| [HT](https://github.com/CalebBell/ht) | Heat transfer calculations | SK-005: Thermal Analysis |
| [ThermalComfort](https://github.com/CenterForTheBuiltEnvironment/pythermalcomfort) | Thermal comfort analysis | SK-007: HVAC Design |
| [psychrolib](https://github.com/psychrometrics/psychrolib) | Psychrometric calculations | SK-007: HVAC Design |

### Heat Exchanger Design

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [HT](https://github.com/CalebBell/ht) | Heat transfer correlations | SK-006: Heat Exchanger |
| [fluids](https://github.com/CalebBell/fluids) | Fluid mechanics calculations | SK-006: Heat Exchanger |
| [thermo](https://github.com/CalebBell/thermo) | Thermodynamic properties | SK-006: Heat Exchanger |

### CAD and Design

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [FreeCAD](https://github.com/FreeCAD/FreeCAD) | Open source CAD | SK-008: 3D CAD Modeling |
| [CadQuery](https://github.com/CadQuery/cadquery) | Programmatic CAD | SK-008: 3D CAD Modeling |
| [build123d](https://github.com/gumyr/build123d) | Python CAD | SK-008: 3D CAD Modeling |
| [OpenSCAD](https://github.com/openscad/openscad) | Programmer's CAD | SK-008: 3D CAD Modeling |
| [solvespace](https://github.com/solvespace/solvespace) | Parametric 2D/3D CAD | SK-008: 3D CAD Modeling |
| [pythonOCC](https://github.com/tpaviot/pythonocc-core) | Python OpenCASCADE wrapper | SK-008: 3D CAD Modeling |

### Tolerance Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [tolerance](https://github.com/tolerance-analysis) | Tolerance stack-up tools | SK-009, SK-028: GD&T/Tolerance |
| [pymoo](https://github.com/anyoptimization/pymoo) | Multi-objective optimization | SK-028: Tolerance Analysis |

### Materials Database

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [MatWeb](https://www.matweb.com) | Material properties (commercial) | SK-010: Material Selection |
| [pymatgen](https://github.com/materialsproject/pymatgen) | Materials analysis | SK-010: Material Selection |

### CNC and Manufacturing

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [LinuxCNC](https://github.com/LinuxCNC/linuxcnc) | CNC controller | SK-013: CNC Programming |
| [pycam](https://github.com/SebKu);/pycam | Toolpath generation | SK-013: CNC Programming |
| [freecad-cam](https://github.com/FreeCAD/FreeCAD) | CAM in FreeCAD | SK-013: CNC Programming |
| [grbl](https://github.com/gnea/grbl) | G-code interpreter | SK-013: CNC Programming |

### Additive Manufacturing

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [PrusaSlicer](https://github.com/prusa3d/PrusaSlicer) | 3D printing slicer | SK-014: Additive Manufacturing |
| [Cura](https://github.com/Ultimaker/Cura) | 3D printing slicer | SK-014: Additive Manufacturing |
| [slic3r](https://github.com/slic3r/Slic3r) | G-code generator | SK-014: Additive Manufacturing |
| [OrcaSlicer](https://github.com/SoftFever/OrcaSlicer) | Advanced slicer | SK-014: Additive Manufacturing |

### Welding

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [weldcalc](https://github.com/welding-calculators) | Welding calculators | SK-015: Welding Qualification |

### Mechanism Design

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [pydy](https://github.com/pydy/pydy) | Multibody dynamics | SK-025: Mechanism Design |
| [sympy.physics.mechanics](https://github.com/sympy/sympy) | Symbolic mechanics | SK-025: Mechanism Design |
| [MBDyn](https://github.com/mmorandi/MBDyn) | Multibody dynamics | SK-025: Mechanism Design |

### Pressure Vessel and Piping

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [ASME-Calculators](https://github.com/pressure-vessel) | ASME calculations | SK-026: Pressure Vessel |
| [CoolProp](https://github.com/CoolProp/CoolProp) | Fluid properties | SK-027: Piping Stress |
| [fluids](https://github.com/CalebBell/fluids) | Piping calculations | SK-027: Piping Stress |

### Test and Data Acquisition

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [python-daq](https://github.com/nidaqmx-python) | NI DAQ interface | SK-017: Test Planning |
| [PyVISA](https://github.com/pyvisa/pyvisa) | Instrument control | SK-017: Test Planning |
| [pydm](https://github.com/slaclab/pydm) | Data monitoring | SK-018: Test Correlation |

---

## MCP Server References

### CAD/CAE MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| SolidWorks API MCP | SolidWorks automation | SK-008: 3D CAD Modeling |
| CATIA Automation MCP | CATIA scripting | SK-008: 3D CAD Modeling |
| NX Open MCP | Siemens NX automation | SK-008: 3D CAD Modeling |
| ANSYS ACT MCP | ANSYS customization | SK-001, SK-004: FEA/CFD |
| Abaqus Scripting MCP | Abaqus automation | SK-001: FEA Structural |

### Simulation MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| OpenFOAM MCP | CFD simulation execution | SK-004: CFD Analysis |
| Calculix MCP | FEA solver execution | SK-001: FEA Structural |
| ADAMS MCP | Multibody dynamics | SK-025: Mechanism Design |

### PLM/PDM MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| Windchill MCP | PTC PLM integration | SK-020, SK-021: Design Review/ECM |
| Teamcenter MCP | Siemens PLM integration | SK-020, SK-021: Design Review/ECM |
| ENOVIA MCP | Dassault PLM integration | SK-020, SK-021: Design Review/ECM |

### Manufacturing MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| Mastercam API MCP | CAM programming | SK-013: CNC Programming |
| Fusion 360 MCP | CAD/CAM integration | SK-013, SK-014: CNC/AM |
| MES Integration MCP | Manufacturing execution | SK-016: Process Planning |

### Requirements Management MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| DOORS MCP | IBM DOORS integration | SK-022: Requirements Flow-Down |
| Jama Connect MCP | Jama requirements | SK-022: Requirements Flow-Down |
| Polarion MCP | Siemens requirements | SK-022: Requirements Flow-Down |

---

## Community Resources

### Forums and Discussion

| Resource | URL | Topics |
|----------|-----|--------|
| Eng-Tips Forums | https://www.eng-tips.com | General mechanical engineering |
| ASME Community | https://community.asme.org | ASME standards, design |
| Reddit r/MechanicalEngineering | https://reddit.com/r/MechanicalEngineering | General ME |
| Reddit r/AskEngineers | https://reddit.com/r/AskEngineers | Engineering Q&A |
| CFD Online | https://www.cfd-online.com | CFD discussions |
| OpenFOAM Forum | https://www.cfd-online.com/Forums/openfoam/ | OpenFOAM |
| NAFEMS | https://www.nafems.org | FEA community |

### Documentation and Tutorials

| Resource | URL | Topics |
|----------|-----|--------|
| MIT OpenCourseWare ME | https://ocw.mit.edu/courses/mechanical-engineering/ | University courses |
| NPTEL Mechanical | https://nptel.ac.in | Indian university courses |
| LearnCAx | https://learncax.com | CAE tutorials |
| SimScale Academy | https://www.simscale.com/academy/ | Cloud simulation |
| GrabCAD Tutorials | https://grabcad.com/tutorials | CAD tutorials |
| Autodesk Knowledge | https://knowledge.autodesk.com | Autodesk software |

### Standards and Codes

| Organization | Standards | Topics |
|--------------|-----------|--------|
| ASME | Y14.5, BPVC, B31 | GD&T, pressure vessels, piping |
| ASTM | E8, E23, E466, E399 | Mechanical testing |
| AWS | D1.1, D1.2, D1.6 | Welding codes |
| ISO | ISO 1101, 2768 | GD&T, tolerances |
| SAE | Various | Automotive, aerospace |
| ASHRAE | 90.1, 62.1 | HVAC standards |
| TEMA | TEMA Standards | Heat exchangers |
| API | 610, 650, 653 | Pumps, tanks |

### Professional Organizations

| Organization | URL | Focus |
|--------------|-----|-------|
| ASME | https://www.asme.org | Mechanical engineering |
| SAE International | https://www.sae.org | Automotive, aerospace |
| NAFEMS | https://www.nafems.org | Finite element analysis |
| AIAA | https://www.aiaa.org | Aerospace |
| ASHRAE | https://www.ashrae.org | HVAC |
| AWS | https://www.aws.org | Welding |

---

## API Documentation

### CAD Software APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| SolidWorks API | https://help.solidworks.com/api | SolidWorks automation |
| CATIA Automation | Dassault documentation | CATIA scripting |
| NX Open | https://docs.plm.automation.siemens.com | NX automation |
| Creo Toolkit | PTC documentation | Creo customization |
| Inventor API | Autodesk documentation | Inventor automation |
| Fusion 360 API | https://help.autodesk.com/view/fusion360/ENU/ | Fusion automation |
| FreeCAD Python | https://wiki.freecadweb.org/Python_scripting_tutorial | FreeCAD scripting |

### Simulation APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| ANSYS ACT | https://ansyshelp.ansys.com | ANSYS customization |
| Abaqus Scripting | Dassault documentation | Abaqus automation |
| COMSOL API | https://www.comsol.com/documentation | COMSOL LiveLink |
| OpenFOAM | https://www.openfoam.com/documentation | CFD |
| Calculix | http://www.calculix.de | FEA solver |

### PLM APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| Windchill REST | PTC documentation | PLM integration |
| Teamcenter SOA | Siemens documentation | PLM integration |
| ENOVIA | Dassault documentation | PLM integration |

### Testing and DAQ APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| NI-DAQmx | https://www.ni.com/docs/en-US/bundle/ni-daqmx | Data acquisition |
| PyVISA | https://pyvisa.readthedocs.io | Instrument control |
| LabVIEW | https://www.ni.com/docs/en-US/bundle/labview | Test automation |

### Materials APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| MatWeb | https://www.matweb.com/reference/ | Material properties |
| Total Materia | https://www.totalmateria.com | Material database |
| Granta MI | Ansys documentation | Materials data |
| MMPDS | SAE documentation | Aerospace allowables |

---

## Applicable Skills from Other Specializations

### From Aerospace Engineering

| Skill | Original ID | Application in Mechanical Engineering |
|-------|-------------|--------------------------------------|
| Composite Structure Design Skill | Various | Composite component design |
| Aeroelastic Analysis Skill | Various | Fluid-structure interaction |
| Fatigue/Damage Tolerance Skill | Various | Aircraft-grade fatigue analysis |
| DO-178C Compliance Skill | Various | Safety-critical systems |

### From Automotive Engineering

| Skill | Original ID | Application in Mechanical Engineering |
|-------|-------------|--------------------------------------|
| Crashworthiness Skill | Various | Impact and crash simulation |
| Vehicle Dynamics Skill | Various | System dynamics modeling |
| NVH Analysis Skill | Various | Noise, vibration, harshness |
| Durability Testing Skill | Various | Accelerated life testing |

### From Civil Engineering

| Skill | Original ID | Application in Mechanical Engineering |
|-------|-------------|--------------------------------------|
| Structural Load Analysis Skill | Various | Building/structure loading |
| Seismic Design Skill | Various | Earthquake-resistant equipment |
| Foundation Design Skill | Various | Heavy equipment foundations |

### From Electrical Engineering

| Skill | Original ID | Application in Mechanical Engineering |
|-------|-------------|--------------------------------------|
| Thermal Analysis Skill | SK-025 | Electronics cooling, motor thermal |
| Test Automation Skill | SK-018 | Automated mechanical testing |
| Reliability Analysis Skill | SK-020 | Mechanical system reliability |
| Control Systems Skill | SK-009 | Mechatronic system control |

### From Chemical Engineering

| Skill | Original ID | Application in Mechanical Engineering |
|-------|-------------|--------------------------------------|
| Heat Exchanger Design Skill | Various | Process heat exchangers |
| Piping Design Skill | Various | Process piping systems |
| Pressure Vessel Skill | Various | ASME pressure equipment |
| Process Control Skill | Various | Automated systems |

### From Materials Science

| Skill | Original ID | Application in Mechanical Engineering |
|-------|-------------|--------------------------------------|
| Mechanical Testing Skill | SK-005 | Material characterization |
| Fatigue Testing Skill | SK-006 | Fatigue property determination |
| Failure Analysis Skill | SK-017 | Component failure investigation |
| Corrosion Assessment Skill | SK-018 | Material degradation |

### From Industrial Engineering

| Skill | Original ID | Application in Mechanical Engineering |
|-------|-------------|--------------------------------------|
| Design of Experiments Skill | Various | Test optimization |
| Statistical Analysis Skill | Various | Test data analysis |
| Process Capability Skill | Various | Manufacturing quality |
| Root Cause Analysis Skill | Various | Failure investigation |
| FMEA Skill | Various | Design FMEA |

### From Biomedical Engineering

| Skill | Original ID | Application in Mechanical Engineering |
|-------|-------------|--------------------------------------|
| FEA for Medical Devices Skill | Various | Implant stress analysis |
| Fatigue Testing Skill | Various | Implant fatigue |
| Human Factors Skill | Various | Ergonomic design |

### From Nanotechnology

| Skill | Original ID | Application in Mechanical Engineering |
|-------|-------------|--------------------------------------|
| Thin Film Deposition Skill | Various | Surface coatings |
| Nanomaterial Characterization Skill | Various | Advanced material analysis |

---

## Implementation Notes

### Priority Integration Points

1. **FEniCSx/OpenFOAM**: Core simulation capability
2. **CadQuery/FreeCAD**: Programmatic CAD modeling
3. **fatpack/rainflow**: Fatigue analysis
4. **CoolProp/HT**: Thermal and heat transfer
5. **PyVISA**: Test equipment automation
6. **meshio/pyvista**: Mesh handling and visualization

### Cross-Specialization Synergies

- Aerospace composite and fatigue skills directly applicable
- Automotive crash and NVH skills for impact analysis
- Materials Science testing skills for material characterization
- Industrial Engineering DOE and statistical skills for test design
- Electrical Engineering thermal and control skills for mechatronics

### Recommended Implementation Order

1. FEA infrastructure (meshing, solving, post-processing)
2. CAD integration (programmatic modeling, automation)
3. CFD capabilities (OpenFOAM integration)
4. Thermal analysis (CoolProp, heat transfer)
5. Fatigue and fracture (fatpack, cycle counting)
6. Test automation (PyVISA, DAQ)
7. Manufacturing (CAM, welding calculations)
8. PLM integration (requirements, change management)

### Industry-Specific Considerations

- Aerospace: MMPDS materials, DO-178C software, AS9100
- Automotive: SAE standards, APQP/PPAP, crash simulation
- Pressure Equipment: ASME BPVC, NB certification
- HVAC: ASHRAE standards, energy codes
- Medical: FDA design controls, ISO 13485

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Phase 6 - Skills and Agents Implementation
