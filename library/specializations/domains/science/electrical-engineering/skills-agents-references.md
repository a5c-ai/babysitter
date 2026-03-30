# Electrical Engineering - Skills and Agents References (Phase 5)

This document provides implementation references for the skills and agents identified in the Electrical Engineering skills-agents-backlog.md, including GitHub repositories, MCP servers, community resources, API documentation, and applicable skills from other specializations.

---

## Table of Contents

1. [GitHub Repositories](#github-repositories)
2. [MCP Server References](#mcp-server-references)
3. [Community Resources](#community-resources)
4. [API Documentation](#api-documentation)
5. [Applicable Skills from Other Specializations](#applicable-skills-from-other-specializations)

---

## GitHub Repositories

### Circuit Simulation

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [PySpice](https://github.com/FabriceSalvaire/PySpice) | Python interface to Ngspice and Xyce circuit simulators | SK-001: SPICE Simulation |
| [ahkab](https://github.com/ahkab/ahkab) | Pure Python SPICE-like circuit simulator | SK-001: SPICE Simulation |
| [lcapy](https://github.com/mph-/lcapy) | Linear circuit analysis in Python | SK-001: SPICE Simulation |
| [SchemDraw](https://github.com/cdelker/schemdraw) | Electrical schematic drawing library | SK-001: SPICE Simulation |
| [ngspice](https://github.com/ngspice/ngspice) | Open source SPICE simulator | SK-001: SPICE Simulation |

### Power Systems

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [pandapower](https://github.com/e2nIEE/pandapower) | Power system analysis and optimization | SK-003: Power Flow Analysis, SK-004: Short Circuit |
| [PyPSA](https://github.com/PyPSA/PyPSA) | Python for Power System Analysis | SK-003: Power Flow Analysis |
| [OpenDSS](https://github.com/dss-extensions/OpenDSSDirect.py) | Distribution system simulator Python bindings | SK-003: Power Flow Analysis |
| [MATPOWER](https://github.com/MATPOWER/matpower) | Power system simulation in MATLAB | SK-003: Power Flow Analysis |
| [GridCal](https://github.com/SanPen/GridCal) | Power systems analysis software | SK-003, SK-004 |
| [PYPOWER](https://github.com/rwl/PYPOWER) | Power flow and OPF solver | SK-003: Power Flow Analysis |
| [py-dss-interface](https://github.com/PauloRadique/py-dss-interface) | OpenDSS Python interface | SK-003: Power Flow Analysis |

### Power Electronics

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [PyPEEC](https://github.com/otvam/pypeec) | 3D quasi-magnetostatic FFT-accelerated solver | SK-002: Power Electronics Sim |
| [andes](https://github.com/cuihantao/andes) | Power system dynamics simulation | SK-002: Power Electronics Sim |
| [OpenEMC](https://github.com/OpenEMC/OpenEMC) | Open-source EMC simulation | SK-013: EMC Analysis |

### Signal Processing

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [scipy.signal](https://github.com/scipy/scipy) | Signal processing functions | SK-006, SK-007: Digital Filter/DSP |
| [python-control](https://github.com/python-control/python-control) | Control systems library | SK-009: Control System Design |
| [filterpy](https://github.com/rlabbe/filterpy) | Kalman filtering and optimal estimation | SK-007: DSP Implementation |
| [pyFDA](https://github.com/chipmuenk/pyfda) | Python Filter Design Analysis Tool | SK-006: Digital Filter Design |
| [commpy](https://github.com/veeresht/CommPy) | Digital communication library | SK-008: Communication System Sim |
| [sdr](https://github.com/mhostetter/sdr) | Software-defined radio tools | SK-008: Communication System Sim |
| [gnuradio](https://github.com/gnuradio/gnuradio) | GNU Radio signal processing toolkit | SK-008: Communication System Sim |

### Control Systems

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [python-control](https://github.com/python-control/python-control) | Control systems analysis | SK-009: Control System Design |
| [GEKKO](https://github.com/BYU-PRISM/GEKKO) | Optimization and control | SK-010: MPC Design |
| [do-mpc](https://github.com/do-mpc/do-mpc) | Model predictive control | SK-010: MPC Design |
| [CasADi](https://github.com/casadi/casadi) | Nonlinear optimization and algorithmic differentiation | SK-010: MPC Design |
| [sysidentpy](https://github.com/wilsonrljr/sysidentpy) | System identification | SK-023: System Identification |

### Digital Design (HDL)

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Verilator](https://github.com/verilator/verilator) | Verilog/SystemVerilog simulator | SK-015: HDL Design |
| [cocotb](https://github.com/cocotb/cocotb) | Coroutine-based testbench | SK-015: HDL Design |
| [amaranth](https://github.com/amaranth-lang/amaranth) | Python-based HDL | SK-015: HDL Design |
| [migen](https://github.com/m-labs/migen) | Python-based HDL | SK-015: HDL Design |
| [SpinalHDL](https://github.com/SpinalHDL/SpinalHDL) | Scala-based hardware description | SK-015: HDL Design |
| [chisel](https://github.com/chipsalliance/chisel) | Scala-based hardware construction | SK-015: HDL Design |

### PCB Design and Signal Integrity

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [KiCad](https://github.com/KiCad/kicad-source-mirror) | Open source PCB design suite | SK-012, SK-014: PCB Design |
| [skidl](https://github.com/devbisme/skidl) | Python-based schematic design | SK-014: PCB Stack-Up Design |
| [openEMS](https://github.com/thliebig/openEMS) | EM field solver | SK-012: Signal Integrity, SK-013: EMC |
| [scikit-rf](https://github.com/scikit-rf/scikit-rf) | RF/microwave engineering | SK-024: RF Circuit Design |

### Test Automation

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [PyVISA](https://github.com/pyvisa/pyvisa) | VISA instrument control | SK-018: Test Equipment Automation |
| [PyVISA-py](https://github.com/pyvisa/pyvisa-py) | Pure Python VISA implementation | SK-018: Test Equipment Automation |
| [InstrumentKit](https://github.com/Galvant/InstrumentKit) | Python instrument control | SK-018: Test Equipment Automation |
| [QCoDeS](https://github.com/QCoDeS/Qcodes) | Quantum computing data acquisition | SK-018: Test Equipment Automation |

### Battery Management

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [PyBaMM](https://github.com/pybamm-team/PyBaMM) | Battery modeling | SK-017: Battery Modeling |
| [Ampere](https://github.com/TRI-AMDD/ampere) | Battery cycling analysis | SK-017: Battery Modeling |

### Renewable Energy

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [pvlib-python](https://github.com/pvlib/pvlib-python) | Photovoltaic system modeling | SK-019: Renewable Energy Modeling |
| [windpowerlib](https://github.com/wind-python/windpowerlib) | Wind power simulation | SK-019: Renewable Energy Modeling |
| [feedinlib](https://github.com/oemof/feedinlib) | Feed-in time series generation | SK-019: Renewable Energy Modeling |

---

## MCP Server References

### Instrument Control MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| Serial Port MCP | UART/RS-232 communication for instrument control | SK-018: Test Equipment Automation |
| GPIB/VISA MCP | IEEE-488 instrument communication | SK-018: Test Equipment Automation |
| NI-DAQ MCP | National Instruments data acquisition | SK-018: Test Equipment Automation |

### Simulation MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| SPICE MCP Server | Remote SPICE simulation execution | SK-001: SPICE Simulation |
| OpenEMS MCP | Electromagnetic field simulation | SK-012, SK-013: SI/EMC |
| MATLAB/Simulink MCP | MATLAB engine integration | SK-006, SK-009: Filter/Control Design |

### Design Tool MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| KiCad MCP | PCB design automation | SK-012, SK-014: PCB Design |
| FreeCAD/Electronics MCP | 3D modeling for enclosures | SK-025: Thermal Analysis |

### Data and Documentation MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| Component Database MCP | Electronic component specifications | SK-020: Reliability Analysis |
| Standards Database MCP | IEC/IEEE/CISPR standards reference | SK-013, SK-021: EMC/Arc Flash |

---

## Community Resources

### Forums and Discussion

| Resource | URL | Topics |
|----------|-----|--------|
| Electronics Stack Exchange | https://electronics.stackexchange.com | General EE Q&A |
| EEVBlog Forum | https://www.eevblog.com/forum/ | Test equipment, design |
| All About Circuits | https://forum.allaboutcircuits.com | Circuit design, tutorials |
| Reddit r/AskElectronics | https://reddit.com/r/AskElectronics | General EE questions |
| Reddit r/ECE | https://reddit.com/r/ECE | Electrical/Computer Engineering |
| Reddit r/FPGA | https://reddit.com/r/FPGA | FPGA design |

### Documentation and Tutorials

| Resource | URL | Topics |
|----------|-----|--------|
| All About Circuits Textbook | https://www.allaboutcircuits.com/textbook/ | Circuit theory fundamentals |
| Analog Devices Wiki | https://wiki.analog.com | Analog design, precision |
| Texas Instruments Training | https://training.ti.com | Power, analog, embedded |
| NPTEL Electrical Engineering | https://nptel.ac.in/course.html | Academic courses |
| MIT OpenCourseWare EE | https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/ | University courses |
| Power Electronics Book | https://www.springer.com | Mohan, Undeland, Robbins |
| IEEE Xplore | https://ieeexplore.ieee.org | Research papers |

### Standards and Codes

| Organization | Standards | Topics |
|--------------|-----------|--------|
| IEEE | IEEE 1584, 1547, C37, C62 | Arc flash, interconnection, protection |
| IEC | IEC 61000, 60909, 61850 | EMC, short circuit, substation automation |
| NEMA | NEMA standards | Motor, enclosure ratings |
| UL | UL 508A, 1741 | Industrial control, inverters |
| CISPR | CISPR 11, 22, 32 | EMC emissions |
| FCC | Part 15, Part 18 | US EMC regulations |

### Application Notes and Technical References

| Source | URL | Topics |
|--------|-----|--------|
| Analog Devices App Notes | https://www.analog.com/en/technical-articles.html | Precision design |
| TI Application Reports | https://www.ti.com/lit/slva | Power, analog design |
| Infineon App Notes | https://www.infineon.com/cms/en/tools/landing-pages/app-notes/ | Power semiconductors |
| ON Semiconductor | https://www.onsemi.com/design/resources/technical-documentation | Power management |
| NXP App Notes | https://www.nxp.com/docs/en/application-note | RF, automotive |

---

## API Documentation

### Simulation Tool APIs

| Tool | API Documentation | Purpose |
|------|-------------------|---------|
| LTspice | CLI automation, netlist format | SPICE simulation |
| Ngspice | https://ngspice.sourceforge.io/docs.html | Open source SPICE |
| PySpice | https://pyspice.fabrice-salvaire.fr/releases/v1.4/ | Python SPICE interface |
| OpenDSS | https://opendss.epri.com | Distribution system simulation |
| MATPOWER | https://matpower.org/docs/ | Power flow analysis |

### Instrument Control APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| PyVISA | https://pyvisa.readthedocs.io | VISA instrument control |
| NI-VISA | https://www.ni.com/docs/en-US/bundle/ni-visa | National Instruments VISA |
| Keysight IO Libraries | https://www.keysight.com/find/iolibraries | Keysight instruments |
| Tektronix PI | https://www.tek.com/en/support/software/driver | Tektronix control |

### CAD/EDA Tool APIs

| Tool | API Documentation | Purpose |
|------|-------------------|---------|
| KiCad Python | https://docs.kicad.org/doxygen-python/ | PCB design automation |
| Altium API | https://www.altium.com/documentation | PCB design |
| Cadence SKILL | Cadence documentation | IC/PCB design |
| ANSYS ACT | https://ansyshelp.ansys.com | Simulation customization |

### Standards Database APIs

| API | Purpose | Relevant Skills |
|-----|---------|-----------------|
| IEEE Xplore API | Standards and papers access | All |
| IEC Webstore API | Standards documents | EMC, safety |
| NIST Chemistry WebBook | Material properties | Thermal analysis |

---

## Applicable Skills from Other Specializations

### From Materials Science

| Skill | Original ID | Application in Electrical Engineering |
|-------|-------------|--------------------------------------|
| Thermal Analysis Skill | SK-004 | Junction temperature estimation, thermal management of power electronics |
| Failure Analysis Skill | SK-017 | Component failure root cause, solder joint analysis |
| Mechanical Testing Skill | SK-005 | Connector and terminal reliability testing |

### From Mechanical Engineering

| Skill | Original ID | Application in Electrical Engineering |
|-------|-------------|--------------------------------------|
| Thermal Analysis Skill | SK-005 | Heat sink design, forced convection cooling systems |
| FEA Structural Skill | SK-001 | Thermal-mechanical stress in PCBs, connector modeling |
| CFD Analysis Skill | SK-004 | Airflow in enclosures, thermal management |
| DFM Review Skill | SK-024 | PCB manufacturing and assembly considerations |

### From Aerospace Engineering

| Skill | Original ID | Application in Electrical Engineering |
|-------|-------------|--------------------------------------|
| DO-178C Compliance Skill | Various | Safety-critical embedded software for avionics |
| Environmental Testing Skill | Various | MIL-STD testing, HALT/HASS for electronics |
| Requirements Verification Skill | Various | System-level verification for safety-critical systems |

### From Automotive Engineering

| Skill | Original ID | Application in Electrical Engineering |
|-------|-------------|--------------------------------------|
| Functional Safety (ISO 26262) Skill | Various | Automotive electronic system safety |
| ECU Software Development Skill | Various | Embedded controller development |
| HIL Testing Skill | Various | Hardware-in-the-loop validation |
| Cybersecurity Engineering Skill | Various | Connected vehicle security |

### From Chemical Engineering

| Skill | Original ID | Application in Electrical Engineering |
|-------|-------------|--------------------------------------|
| Process Control Skill | Various | Industrial process control loops |
| PID Controller Tuning Skill | Various | Temperature, flow control systems |
| Model Predictive Control Skill | Various | Advanced process control |

### From Industrial Engineering

| Skill | Original ID | Application in Electrical Engineering |
|-------|-------------|--------------------------------------|
| Statistical Process Control Skill | Various | Manufacturing quality control |
| Design of Experiments Skill | Various | Component selection, process optimization |
| Reliability Analysis Skill | Various | MTBF prediction, life testing |
| Root Cause Analysis Skill | Various | Failure investigation methodology |

### From Biomedical Engineering

| Skill | Original ID | Application in Electrical Engineering |
|-------|-------------|--------------------------------------|
| IEC 62304 Software Skill | Various | Medical device software development |
| EMC Design Skill | Various | Medical device EMC compliance |
| Risk Management (ISO 14971) Skill | Various | Medical electronic device risk |

### From Nanotechnology

| Skill | Original ID | Application in Electrical Engineering |
|-------|-------------|--------------------------------------|
| Thin Film Deposition Skill | Various | Semiconductor fabrication, coatings |
| Electron Microscopy Skill | Various | IC failure analysis, nanoscale inspection |

---

## Implementation Notes

### Priority Integration Points

1. **PyVISA + Test Automation**: Critical for hardware validation processes
2. **pandapower + Power Systems**: Foundation for power flow and protection analysis
3. **python-control + Control Design**: Essential for feedback control processes
4. **PySpice/Ngspice**: Core circuit simulation capability
5. **KiCad API**: PCB design automation and DFM checking

### Cross-Specialization Synergies

- Thermal analysis skills from Mechanical Engineering directly applicable to electronics cooling
- Reliability analysis from Industrial Engineering enhances component selection and life prediction
- Process control skills from Chemical Engineering applicable to industrial automation
- Safety analysis skills from Automotive/Aerospace for safety-critical electronic systems

### Recommended Implementation Order

1. Circuit simulation infrastructure (PySpice, Ngspice)
2. Test equipment automation (PyVISA)
3. Power systems analysis (pandapower)
4. Control systems (python-control, GEKKO)
5. Signal processing (scipy.signal, pyFDA)
6. HDL verification (cocotb, Verilator)
7. PCB design automation (KiCad API)

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Phase 6 - Skills and Agents Implementation
