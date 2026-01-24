# Electrical Engineering - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Electrical Engineering processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, simulation capabilities, hardware interaction, and integration with specialized EE development tooling.

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
All 21 processes defined in the Electrical Engineering processes-backlog.md currently use generic agent names for task execution (e.g., `electrical-engineer`, `design-engineer`, `test-engineer`). While functional, this approach lacks domain-specific optimizations that specialized skills and agents with deep expertise in circuit simulation, power systems analysis, signal processing, and control systems could provide.

### Goals
- Provide deep expertise in circuit simulation tools (SPICE, power electronics simulators)
- Enable automated power system analysis and protection coordination
- Support digital signal processing algorithm development and implementation
- Enhance control system design with model-based approaches
- Improve PCB design with signal integrity and EMC analysis
- Enable hardware-in-the-loop testing and validation
- Support regulatory compliance and certification workflows

---

## Skills Backlog

### SK-001: SPICE Simulation Skill
**Slug**: `spice-simulation`
**Category**: Circuit Simulation

**Description**: Deep integration with SPICE simulators for analog and mixed-signal circuit analysis.

**Capabilities**:
- Generate and execute LTspice, PSpice, and Ngspice netlists
- DC operating point, AC analysis, transient simulation
- Monte Carlo and worst-case analysis
- Temperature and process variation sweeps
- Noise and distortion analysis (THD, SNR)
- Fourier analysis and harmonic content
- SPICE model parameter extraction
- Subcircuit and hierarchical design management
- Convergence troubleshooting and optimization

**Process Integration**:
- ee-analog-circuit-design
- ee-mixed-signal-design
- ee-switching-power-supply-design
- ee-motor-drive-design
- ee-bms-design

**Dependencies**: LTspice, PSpice, Ngspice, HSPICE, PySpice

---

### SK-002: Power Electronics Simulation Skill
**Slug**: `power-electronics-sim`
**Category**: Power Electronics

**Description**: Specialized simulation for power converters, motor drives, and power electronic systems.

**Capabilities**:
- PLECS and PSIM simulation execution
- Switching waveform analysis
- Efficiency and loss calculations (conduction, switching)
- Thermal modeling and junction temperature estimation
- Control loop design and compensation
- Magnetic component design (inductors, transformers)
- EMI/EMC prediction and filtering
- Power factor correction simulation
- Motor drive FOC/DTC simulation

**Process Integration**:
- ee-switching-power-supply-design
- ee-motor-drive-design
- ee-bms-design
- ee-renewable-integration

**Dependencies**: PLECS, PSIM, SIMPLIS, SIMetrix

---

### SK-003: Power Flow Analysis Skill
**Slug**: `power-flow-analysis`
**Category**: Power Systems

**Description**: Power system load flow and contingency analysis expertise.

**Capabilities**:
- Newton-Raphson and Gauss-Seidel power flow algorithms
- Bus voltage and power flow calculations
- Contingency analysis (N-1, N-2)
- Optimal power flow (OPF) formulation
- Loss minimization and VAR optimization
- MATPOWER and pandapower integration
- OpenDSS distribution system analysis
- IEEE test case model setup
- Result visualization and reporting

**Process Integration**:
- ee-power-flow-analysis
- ee-renewable-integration
- ee-arc-flash-analysis

**Dependencies**: MATPOWER, pandapower, OpenDSS, PyPSA

---

### SK-004: Short Circuit Analysis Skill
**Slug**: `short-circuit-analysis`
**Category**: Power Systems

**Description**: Fault current calculation and equipment rating verification.

**Capabilities**:
- Symmetrical component analysis (positive, negative, zero sequence)
- Three-phase, line-to-line, line-to-ground fault calculations
- IEC 60909 and ANSI/IEEE calculation methods
- X/R ratio and DC offset determination
- Equipment interrupting capacity verification
- Fault current contribution analysis
- Impedance network reduction
- Fault location estimation

**Process Integration**:
- ee-protection-coordination
- ee-arc-flash-analysis
- ee-power-flow-analysis

**Dependencies**: Power system analysis libraries, IEC 60909 calculators

---

### SK-005: Protection Relay Coordination Skill
**Slug**: `relay-coordination`
**Category**: Power Systems Protection

**Description**: Protective relay settings and time-current coordination.

**Capabilities**:
- Time-current curve generation and plotting
- Relay pickup and time dial calculations
- Coordination interval verification
- Inverse-time overcurrent relay curves (IEC, IEEE, US)
- Distance relay settings (zones 1, 2, 3)
- Differential relay configuration
- Fuse-breaker-relay coordination
- Arc flash boundary determination
- Settings file generation for common relay manufacturers

**Process Integration**:
- ee-protection-coordination
- ee-arc-flash-analysis

**Dependencies**: ETAP, SKM, relay manufacturer software, coordination curve libraries

---

### SK-006: Digital Filter Design Skill
**Slug**: `digital-filter-design`
**Category**: Digital Signal Processing

**Description**: Comprehensive digital filter design and analysis.

**Capabilities**:
- FIR filter design (windowing, Parks-McClellan, least-squares)
- IIR filter design (Butterworth, Chebyshev, elliptic, bilinear transform)
- Filter frequency response visualization
- Group delay and phase response analysis
- Fixed-point coefficient quantization
- Filter structure selection (direct form, cascade, lattice)
- Multirate filter design (decimation, interpolation)
- Adaptive filter algorithms (LMS, RLS, NLMS)
- Filter implementation code generation (C, VHDL, Verilog)

**Process Integration**:
- ee-digital-filter-design
- ee-dsp-algorithm-design
- ee-communication-system-design

**Dependencies**: scipy.signal, MATLAB Filter Designer, Python filterpy

---

### SK-007: DSP Algorithm Implementation Skill
**Slug**: `dsp-implementation`
**Category**: Digital Signal Processing

**Description**: DSP algorithm development from floating-point to fixed-point implementation.

**Capabilities**:
- FFT/IFFT implementation and optimization
- Fixed-point conversion and quantization analysis
- Word length optimization
- Overflow and saturation handling
- DSP processor intrinsics (TI C6000, ARM CMSIS-DSP)
- SIMD optimization (NEON, SSE)
- Real-time scheduling and buffer management
- Code generation for DSP platforms
- Bit-exact simulation

**Process Integration**:
- ee-dsp-algorithm-design
- ee-digital-filter-design
- ee-communication-system-design

**Dependencies**: NumPy, SciPy, MATLAB Fixed-Point Toolbox, CMSIS-DSP

---

### SK-008: Communication System Simulation Skill
**Slug**: `comm-system-sim`
**Category**: Communications

**Description**: Digital communication system modeling and BER simulation.

**Capabilities**:
- Modulation scheme implementation (QAM, PSK, OFDM)
- Channel models (AWGN, Rayleigh, Rician, multipath)
- Bit error rate (BER) and symbol error rate (SER) analysis
- Synchronization algorithm simulation (timing, carrier, frame)
- Channel coding (convolutional, turbo, LDPC)
- Equalization algorithms (ZF, MMSE, DFE)
- Link budget calculations
- SNR and Eb/N0 conversions
- Constellation diagram generation

**Process Integration**:
- ee-communication-system-design
- ee-dsp-algorithm-design

**Dependencies**: GNU Radio, MATLAB Communications Toolbox, CommPy

---

### SK-009: Control System Design Skill
**Slug**: `control-system-design`
**Category**: Control Systems

**Description**: Classical and modern control system analysis and design.

**Capabilities**:
- Transfer function and state-space model creation
- Root locus and Bode plot generation
- Nyquist stability analysis
- PID controller tuning (Ziegler-Nichols, Cohen-Coon, IMC)
- Gain and phase margin calculation
- Pole placement and LQR design
- Observer and Kalman filter design
- Discretization methods (ZOH, Tustin, matched)
- Closed-loop simulation

**Process Integration**:
- ee-feedback-control-design
- ee-motion-control-development
- ee-mpc-implementation

**Dependencies**: Python Control Library, MATLAB Control Toolbox, Scilab

---

### SK-010: Model Predictive Control Skill
**Slug**: `mpc-design`
**Category**: Control Systems

**Description**: Advanced MPC controller design and implementation.

**Capabilities**:
- Linear MPC formulation and tuning
- Constraint handling (input, output, rate)
- Prediction and control horizon optimization
- State estimation integration
- Explicit MPC for embedded implementation
- Nonlinear MPC (NMPC) design
- Economic MPC formulations
- Real-time QP solver configuration
- MPC code generation for embedded targets

**Process Integration**:
- ee-mpc-implementation
- ee-feedback-control-design

**Dependencies**: CasADi, ACADO, MATLAB MPC Toolbox, do-mpc

---

### SK-011: Motion Control Skill
**Slug**: `motion-control`
**Category**: Control Systems

**Description**: Multi-axis motion control system design and tuning.

**Capabilities**:
- Trajectory generation (trapezoidal, S-curve, spline)
- Servo loop tuning (current, velocity, position)
- Feedforward compensation design
- Electronic gearing and camming
- Multi-axis coordination
- Vibration suppression (input shaping, notch filters)
- Compliance and force control
- Motion profile optimization
- PLCopen motion function blocks

**Process Integration**:
- ee-motion-control-development
- ee-feedback-control-design
- ee-motor-drive-design

**Dependencies**: Motion control libraries, PLCopen standards

---

### SK-012: Signal Integrity Analysis Skill
**Slug**: `signal-integrity`
**Category**: PCB Design

**Description**: High-speed signal integrity analysis and simulation.

**Capabilities**:
- Transmission line impedance calculations
- S-parameter analysis and touchstone files
- Eye diagram generation and analysis
- Crosstalk (NEXT, FEXT) calculation
- Via modeling and optimization
- PDN impedance analysis
- Time-domain reflectometry (TDR) simulation
- Channel compliance testing
- IBIS model usage and creation

**Process Integration**:
- ee-highspeed-pcb-design
- ee-emc-design-testing

**Dependencies**: HyperLynx, ANSYS SIwave, Sigrity, openEMS

---

### SK-013: EMC Analysis Skill
**Slug**: `emc-analysis`
**Category**: EMC/EMI

**Description**: Electromagnetic compatibility analysis and mitigation.

**Capabilities**:
- Radiated emissions prediction
- Conducted emissions analysis
- Common-mode and differential-mode noise separation
- Filter design for EMC compliance
- Shielding effectiveness calculation
- Cable shield termination analysis
- Grounding scheme evaluation
- Pre-compliance measurement interpretation
- EMC standard requirements mapping (CISPR, FCC, CE)

**Process Integration**:
- ee-emc-design-testing
- ee-highspeed-pcb-design
- ee-switching-power-supply-design

**Dependencies**: EMC simulation tools, LISN models, standard requirements databases

---

### SK-014: PCB Stack-Up Design Skill
**Slug**: `pcb-stackup`
**Category**: PCB Design

**Description**: Multi-layer PCB stack-up optimization for signal and power integrity.

**Capabilities**:
- Layer count determination
- Impedance-controlled stackup design
- Material selection (FR-4, Rogers, Isola)
- Dielectric constant and loss tangent analysis
- Reference plane planning
- Return path optimization
- Manufacturing tolerance analysis
- Cost vs performance trade-off
- IPC-2221/2223 compliance checking

**Process Integration**:
- ee-highspeed-pcb-design
- ee-dfm-review

**Dependencies**: Saturn PCB Toolkit, manufacturer stackup calculators

---

### SK-015: HDL Design and Verification Skill
**Slug**: `hdl-design`
**Category**: Digital Design

**Description**: RTL design and functional verification for FPGAs and ASICs.

**Capabilities**:
- Verilog/VHDL/SystemVerilog code generation
- Testbench creation and stimulus generation
- Assertion-based verification (SVA)
- Timing constraint generation (SDC/XDC)
- Synthesis and implementation guidance
- Clock domain crossing analysis
- Reset domain analysis
- Code coverage analysis
- Formal verification setup

**Process Integration**:
- ee-digital-logic-design
- ee-mixed-signal-design
- ee-dsp-algorithm-design

**Dependencies**: Vivado, Quartus, ModelSim, Verilator, cocotb

---

### SK-016: Magnetic Component Design Skill
**Slug**: `magnetics-design`
**Category**: Power Electronics

**Description**: Inductor and transformer design for power electronics.

**Capabilities**:
- Core selection (ferrite, powder, amorphous, nanocrystalline)
- Winding design and optimization
- Inductance and turns ratio calculation
- Core loss estimation (Steinmetz equation)
- Copper loss calculation (skin effect, proximity effect)
- Thermal analysis and temperature rise
- Leakage inductance control
- EMI considerations in magnetics
- Design for manufacturing

**Process Integration**:
- ee-switching-power-supply-design
- ee-motor-drive-design

**Dependencies**: Magnetics design tools, core manufacturer software

---

### SK-017: Battery Modeling Skill
**Slug**: `battery-modeling`
**Category**: Power Electronics

**Description**: Battery cell modeling and state estimation for BMS.

**Capabilities**:
- Equivalent circuit model (ECM) parameterization
- State of Charge (SOC) estimation algorithms
- State of Health (SOH) estimation
- Electrochemical impedance spectroscopy (EIS) analysis
- Thermal modeling of battery packs
- Coulomb counting and OCV methods
- Extended Kalman filter for SOC
- Cell balancing algorithm design
- Pack configuration optimization

**Process Integration**:
- ee-bms-design
- ee-switching-power-supply-design

**Dependencies**: Battery modeling libraries, EIS analysis tools

---

### SK-018: Test Equipment Automation Skill
**Slug**: `test-automation`
**Category**: Testing

**Description**: Automated test equipment control and data acquisition.

**Capabilities**:
- VISA/SCPI instrument communication
- Oscilloscope automation (Keysight, Tektronix)
- Spectrum analyzer control
- Power supply/electronic load control
- DMM and SMU automation
- Data logging and analysis
- Test sequence scripting
- Measurement uncertainty analysis
- Report generation

**Process Integration**:
- ee-hardware-validation
- ee-environmental-testing
- ee-emc-design-testing

**Dependencies**: PyVISA, NI VISA, instrument drivers

---

### SK-019: Renewable Energy Modeling Skill
**Slug**: `renewable-modeling`
**Category**: Power Systems

**Description**: Solar PV and wind generation system modeling.

**Capabilities**:
- PV array I-V curve modeling
- MPPT algorithm simulation
- Inverter control modeling
- Wind turbine power curve analysis
- Capacity factor calculation
- Grid-tied inverter anti-islanding
- Fault ride-through analysis
- Harmonic injection analysis
- IEEE 1547 compliance checking

**Process Integration**:
- ee-renewable-integration
- ee-power-flow-analysis

**Dependencies**: PVlib, OpenDSS, HOMER, PVsyst

---

### SK-020: Reliability Analysis Skill
**Slug**: `reliability-analysis`
**Category**: Testing and Validation

**Description**: Component and system reliability prediction and analysis.

**Capabilities**:
- MTBF/MTTF calculations
- Failure rate databases (MIL-HDBK-217, Telcordia)
- Derating analysis
- FMEA/FMECA support
- Reliability block diagram analysis
- Fault tree analysis (FTA)
- Accelerated life testing data analysis
- Weibull distribution fitting
- Thermal derating curves

**Process Integration**:
- ee-environmental-testing
- ee-hardware-validation
- ee-dfm-review

**Dependencies**: Reliability databases, statistical analysis tools

---

### SK-021: Arc Flash Calculation Skill
**Slug**: `arc-flash-calc`
**Category**: Safety

**Description**: IEEE 1584 arc flash hazard calculations.

**Capabilities**:
- IEEE 1584-2018 incident energy calculations
- Arc flash boundary determination
- PPE category assignment
- Working distance calculations
- Electrode configuration analysis
- Equipment labeling requirements
- Protective device clearing time analysis
- Arc flash mitigation recommendations
- Compliance report generation

**Process Integration**:
- ee-arc-flash-analysis
- ee-protection-coordination

**Dependencies**: IEEE 1584 calculation tools, protective device databases

---

### SK-022: DFM Analysis Skill
**Slug**: `dfm-analysis`
**Category**: Manufacturing

**Description**: Design for manufacturing analysis for PCBs and assemblies.

**Capabilities**:
- PCB fabrication rule checking
- Component placement optimization
- Solder joint reliability analysis
- Thermal profile analysis for reflow
- Test point accessibility verification
- BOM analysis and component availability
- Tombstoning and bridging risk assessment
- Panelization optimization
- IPC-A-610 compliance guidance

**Process Integration**:
- ee-dfm-review
- ee-highspeed-pcb-design
- ee-hardware-validation

**Dependencies**: DFM analysis tools, IPC standards

---

### SK-023: System Identification Skill
**Slug**: `system-identification`
**Category**: Control Systems

**Description**: Data-driven system modeling and parameter estimation.

**Capabilities**:
- Time-domain identification (ARX, ARMAX, OE)
- Frequency-domain identification
- Subspace identification methods
- Model validation and residual analysis
- Transfer function fitting from frequency response
- Nonlinear system identification
- Recursive identification for adaptive systems
- Experiment design for identification
- Model order selection

**Process Integration**:
- ee-feedback-control-design
- ee-mpc-implementation
- ee-motor-drive-design

**Dependencies**: Python sysidentpy, MATLAB System Identification Toolbox

---

### SK-024: RF Circuit Design Skill
**Slug**: `rf-circuit-design`
**Category**: Circuit Design

**Description**: Radio frequency circuit design and analysis.

**Capabilities**:
- S-parameter network analysis
- Smith chart matching network design
- Low-noise amplifier design
- Power amplifier characterization
- Filter design (LC, microstrip, SAW)
- Mixer and frequency conversion analysis
- Oscillator design (LC, crystal, VCO)
- PLL loop filter design
- Link budget calculation

**Process Integration**:
- ee-analog-circuit-design
- ee-communication-system-design
- ee-emc-design-testing

**Dependencies**: RF design tools, S-parameter libraries, Smith chart tools

---

### SK-025: Thermal Analysis Skill
**Slug**: `thermal-analysis`
**Category**: Thermal Management

**Description**: Electronic system thermal modeling and analysis.

**Capabilities**:
- Junction-to-ambient thermal resistance calculation
- Heat sink selection and optimization
- Forced convection analysis
- PCB thermal analysis
- Thermal interface material selection
- Transient thermal analysis
- Safe operating area (SOA) verification
- Derating curve application
- CFD simulation setup guidance

**Process Integration**:
- ee-switching-power-supply-design
- ee-motor-drive-design
- ee-hardware-validation
- ee-dfm-review

**Dependencies**: Thermal calculators, component thermal models

---

---

## Agents Backlog

### AG-001: Analog Circuit Design Expert Agent
**Slug**: `analog-circuit-expert`
**Category**: Circuit Design

**Description**: Senior expert in analog circuit design and simulation.

**Expertise Areas**:
- Operational amplifier circuit design
- Active filter design and optimization
- Voltage reference and regulator design
- Data converter interface design
- Low-noise circuit techniques
- High-frequency circuit design
- Analog circuit troubleshooting
- Component selection and trade-offs

**Persona**:
- Role: Principal Analog Design Engineer
- Experience: 15+ years analog IC and board-level design
- Background: Precision instrumentation, audio, RF front-ends

**Process Integration**:
- ee-analog-circuit-design (all phases)
- ee-mixed-signal-design (analog phases)
- ee-switching-power-supply-design (control circuits)

---

### AG-002: Power Systems Engineer Agent
**Slug**: `power-systems-engineer`
**Category**: Power Systems

**Description**: Expert in electrical power system analysis and design.

**Expertise Areas**:
- Power flow and contingency analysis
- Short circuit and fault analysis
- Protection system design and coordination
- Power quality analysis
- Grid integration studies
- Stability analysis (transient, voltage, frequency)
- Renewable energy interconnection
- NERC reliability standards compliance

**Persona**:
- Role: Senior Power Systems Engineer
- Experience: 12+ years utility and industrial power systems
- Background: Transmission planning, protection engineering, grid modernization

**Process Integration**:
- ee-power-flow-analysis (all phases)
- ee-protection-coordination (all phases)
- ee-renewable-integration (all phases)
- ee-arc-flash-analysis (all phases)

---

### AG-003: DSP Algorithm Engineer Agent
**Slug**: `dsp-algorithm-engineer`
**Category**: Signal Processing

**Description**: Expert in digital signal processing algorithm design and implementation.

**Expertise Areas**:
- Filter design and optimization
- Spectral analysis techniques
- Adaptive signal processing
- Communication system DSP
- Audio and speech processing
- Image and video processing
- Real-time DSP implementation
- Fixed-point algorithm development

**Persona**:
- Role: Senior DSP Engineer
- Experience: 10+ years DSP algorithm development
- Background: Communications, radar, audio processing, biomedical

**Process Integration**:
- ee-dsp-algorithm-design (all phases)
- ee-digital-filter-design (all phases)
- ee-communication-system-design (all phases)

---

### AG-004: Control Systems Engineer Agent
**Slug**: `control-systems-engineer`
**Category**: Control Systems

**Description**: Expert in feedback control system design and implementation.

**Expertise Areas**:
- Classical control design (root locus, frequency response)
- Modern control (state-space, optimal control)
- Digital control implementation
- PID tuning methodologies
- Model predictive control
- Motion control and servo systems
- Process control applications
- Control system commissioning

**Persona**:
- Role: Senior Control Systems Engineer
- Experience: 12+ years control system design
- Background: Robotics, process control, aerospace, automotive

**Process Integration**:
- ee-feedback-control-design (all phases)
- ee-motion-control-development (all phases)
- ee-mpc-implementation (all phases)

---

### AG-005: Power Electronics Engineer Agent
**Slug**: `power-electronics-engineer`
**Category**: Power Electronics

**Description**: Expert in power converter and motor drive design.

**Expertise Areas**:
- DC-DC converter topologies
- AC-DC and DC-AC conversion
- Soft-switching techniques
- Magnetic component design
- Gate driver design
- Thermal management
- EMI/EMC mitigation
- Motor drive control (FOC, DTC)

**Persona**:
- Role: Senior Power Electronics Engineer
- Experience: 10+ years power converter design
- Background: EV charging, motor drives, renewable inverters, UPS

**Process Integration**:
- ee-switching-power-supply-design (all phases)
- ee-motor-drive-design (all phases)
- ee-bms-design (power electronics phases)

---

### AG-006: PCB Design Engineer Agent
**Slug**: `pcb-design-engineer`
**Category**: PCB Design

**Description**: Expert in high-speed and power PCB design.

**Expertise Areas**:
- Multi-layer PCB stack-up design
- High-speed signal routing
- Power distribution network design
- Impedance-controlled routing
- EMC-compliant layout techniques
- Thermal management on PCB
- Design for manufacturing
- Signal and power integrity

**Persona**:
- Role: Senior PCB Design Engineer
- Experience: 10+ years high-speed PCB design
- Background: Telecom, computing, power electronics, RF

**Process Integration**:
- ee-highspeed-pcb-design (all phases)
- ee-emc-design-testing (layout phases)
- ee-dfm-review (all phases)

---

### AG-007: EMC Engineer Agent
**Slug**: `emc-engineer`
**Category**: EMC/EMI

**Description**: Expert in electromagnetic compatibility design and testing.

**Expertise Areas**:
- EMI source identification
- Filter design for emissions
- Shielding and grounding techniques
- Pre-compliance testing
- EMC standard interpretation
- Immunity design techniques
- Cable and connector EMC
- Troubleshooting EMC failures

**Persona**:
- Role: Senior EMC Engineer
- Experience: 10+ years EMC design and testing
- Background: Consumer electronics, automotive, medical devices

**Process Integration**:
- ee-emc-design-testing (all phases)
- ee-highspeed-pcb-design (EMC aspects)
- ee-switching-power-supply-design (EMI aspects)

---

### AG-008: Digital Design Engineer Agent
**Slug**: `digital-design-engineer`
**Category**: Digital Design

**Description**: Expert in FPGA and ASIC digital logic design.

**Expertise Areas**:
- RTL design in Verilog/VHDL/SystemVerilog
- FPGA implementation and optimization
- Timing closure techniques
- Verification methodologies
- High-speed interfaces (DDR, PCIe, Ethernet)
- DSP implementation on FPGA
- Clock and reset architecture
- Design for testability

**Persona**:
- Role: Senior Digital Design Engineer
- Experience: 12+ years FPGA/ASIC design
- Background: Communications, image processing, high-performance computing

**Process Integration**:
- ee-digital-logic-design (all phases)
- ee-mixed-signal-design (digital phases)

---

### AG-009: Hardware Validation Engineer Agent
**Slug**: `hardware-validation-engineer`
**Category**: Testing

**Description**: Expert in electronic hardware validation and debug.

**Expertise Areas**:
- Systematic debug methodology
- Test equipment operation and automation
- Performance characterization
- Environmental testing
- Failure analysis techniques
- Root cause investigation
- Test procedure development
- Validation report documentation

**Persona**:
- Role: Senior Hardware Validation Engineer
- Experience: 8+ years hardware validation
- Background: Consumer electronics, computing, automotive

**Process Integration**:
- ee-hardware-validation (all phases)
- ee-environmental-testing (all phases)
- ee-dfm-review (validation phases)

---

### AG-010: Protection Engineer Agent
**Slug**: `protection-engineer`
**Category**: Power Systems

**Description**: Expert in power system protection and relay coordination.

**Expertise Areas**:
- Relay selection and application
- Time-current coordination
- Distance protection schemes
- Differential protection
- Transformer and motor protection
- Generator protection
- Arc flash mitigation
- Protection system testing

**Persona**:
- Role: Senior Protection Engineer
- Experience: 12+ years protection engineering
- Background: Utility protection, industrial power systems

**Process Integration**:
- ee-protection-coordination (all phases)
- ee-arc-flash-analysis (protection aspects)

---

### AG-011: Mixed-Signal IC Design Agent
**Slug**: `mixed-signal-ic-designer`
**Category**: IC Design

**Description**: Expert in mixed-signal integrated circuit design.

**Expertise Areas**:
- Data converter architecture
- PLL and clock generation
- Analog-digital interface design
- Substrate noise isolation
- Layout for mixed-signal
- Verification methodologies
- Process variation handling
- Low-power mixed-signal techniques

**Persona**:
- Role: Principal Mixed-Signal IC Designer
- Experience: 15+ years IC design
- Background: Data converters, RF transceivers, power management ICs

**Process Integration**:
- ee-mixed-signal-design (all phases)
- ee-analog-circuit-design (IC aspects)

---

### AG-012: Battery Systems Engineer Agent
**Slug**: `battery-systems-engineer`
**Category**: Energy Storage

**Description**: Expert in battery management system design and integration.

**Expertise Areas**:
- Battery chemistry characteristics
- Cell monitoring and measurement
- State estimation algorithms
- Thermal management for batteries
- Safety and protection design
- Cell balancing strategies
- Pack design and integration
- Standards compliance (UL, IEC, UN)

**Persona**:
- Role: Senior Battery Systems Engineer
- Experience: 8+ years BMS development
- Background: Electric vehicles, energy storage, portable devices

**Process Integration**:
- ee-bms-design (all phases)
- ee-switching-power-supply-design (BMS charger aspects)

---

### AG-013: Test and Measurement Expert Agent
**Slug**: `test-measurement-expert`
**Category**: Testing

**Description**: Expert in electronic test methodologies and instrumentation.

**Expertise Areas**:
- Test strategy development
- Instrumentation selection and setup
- Measurement uncertainty analysis
- Automated test system design
- Data acquisition systems
- Statistical process control
- Test fixture design
- Calibration requirements

**Persona**:
- Role: Senior Test Engineer
- Experience: 10+ years test engineering
- Background: Production testing, characterization, validation

**Process Integration**:
- ee-hardware-validation (all phases)
- ee-environmental-testing (all phases)
- ee-emc-design-testing (testing phases)

---

### AG-014: Reliability Engineer Agent
**Slug**: `reliability-engineer`
**Category**: Reliability

**Description**: Expert in electronic system reliability and qualification.

**Expertise Areas**:
- Reliability prediction methodologies
- Accelerated life testing
- Failure analysis techniques
- FMEA/FMECA facilitation
- Environmental stress screening
- Qualification test planning
- Reliability growth tracking
- Root cause analysis

**Persona**:
- Role: Senior Reliability Engineer
- Experience: 10+ years reliability engineering
- Background: Aerospace, automotive, medical devices

**Process Integration**:
- ee-environmental-testing (all phases)
- ee-hardware-validation (reliability aspects)
- ee-dfm-review (reliability aspects)

---

### AG-015: Renewable Energy Integration Expert Agent
**Slug**: `renewable-integration-expert`
**Category**: Power Systems

**Description**: Expert in grid integration of renewable energy sources.

**Expertise Areas**:
- Solar PV system design
- Wind generation integration
- Inverter control and grid codes
- Energy storage integration
- Power quality impacts
- Interconnection studies
- IEEE 1547 compliance
- Smart inverter functions

**Persona**:
- Role: Senior Renewable Energy Engineer
- Experience: 10+ years renewable integration
- Background: Utility-scale solar/wind, distributed generation

**Process Integration**:
- ee-renewable-integration (all phases)
- ee-power-flow-analysis (renewable aspects)

---

---

## Process-to-Skill/Agent Mapping

| Process ID | Primary Skills | Primary Agents |
|-----------|---------------|----------------|
| ee-analog-circuit-design | SK-001, SK-024, SK-025 | AG-001, AG-011 |
| ee-digital-logic-design | SK-015 | AG-008 |
| ee-mixed-signal-design | SK-001, SK-015 | AG-011, AG-001, AG-008 |
| ee-power-flow-analysis | SK-003, SK-004 | AG-002, AG-015 |
| ee-protection-coordination | SK-004, SK-005, SK-021 | AG-002, AG-010 |
| ee-renewable-integration | SK-003, SK-019 | AG-002, AG-015 |
| ee-arc-flash-analysis | SK-004, SK-005, SK-021 | AG-002, AG-010 |
| ee-dsp-algorithm-design | SK-006, SK-007 | AG-003 |
| ee-digital-filter-design | SK-006, SK-007 | AG-003 |
| ee-communication-system-design | SK-006, SK-007, SK-008, SK-024 | AG-003 |
| ee-feedback-control-design | SK-009, SK-023 | AG-004 |
| ee-motion-control-development | SK-009, SK-011, SK-023 | AG-004 |
| ee-mpc-implementation | SK-009, SK-010, SK-023 | AG-004 |
| ee-highspeed-pcb-design | SK-012, SK-013, SK-014, SK-022 | AG-006, AG-007 |
| ee-emc-design-testing | SK-012, SK-013 | AG-007, AG-006 |
| ee-switching-power-supply-design | SK-001, SK-002, SK-016, SK-025 | AG-005 |
| ee-motor-drive-design | SK-002, SK-011, SK-016, SK-025 | AG-005, AG-004 |
| ee-bms-design | SK-001, SK-002, SK-017 | AG-005, AG-012 |
| ee-hardware-validation | SK-018, SK-020 | AG-009, AG-013 |
| ee-dfm-review | SK-014, SK-020, SK-022, SK-025 | AG-006, AG-014 |
| ee-environmental-testing | SK-018, SK-020 | AG-009, AG-013, AG-014 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-001 | SPICE Simulation | Embedded Systems, Robotics |
| SK-006 | Digital Filter Design | Embedded Systems, Communications |
| SK-007 | DSP Algorithm Implementation | Embedded Systems, Audio Engineering |
| SK-009 | Control System Design | Robotics, Mechanical Engineering, Aerospace |
| SK-015 | HDL Design and Verification | FPGA Programming, Digital Systems |
| SK-018 | Test Equipment Automation | QA Testing, Hardware Engineering |
| SK-020 | Reliability Analysis | Mechanical Engineering, Aerospace, Automotive |
| SK-025 | Thermal Analysis | Mechanical Engineering, Electronics Cooling |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-003 | DSP Algorithm Engineer | Communications, Audio Engineering, Biomedical |
| AG-004 | Control Systems Engineer | Robotics, Mechanical Engineering, Aerospace |
| AG-008 | Digital Design Engineer | FPGA Programming, Computer Engineering |
| AG-013 | Test and Measurement Expert | QA Testing, Hardware Engineering |
| AG-014 | Reliability Engineer | Mechanical Engineering, Aerospace, Automotive |

---

## Implementation Priority

### Phase 1: Core Simulation Skills (High Impact)
1. **SK-001**: SPICE Simulation - Foundation for all circuit design
2. **SK-002**: Power Electronics Simulation - Critical for power converter design
3. **SK-003**: Power Flow Analysis - Core power systems capability
4. **SK-009**: Control System Design - Essential for all control applications

### Phase 2: Core Expert Agents (High Impact)
1. **AG-001**: Analog Circuit Design Expert - Highest circuit design impact
2. **AG-002**: Power Systems Engineer - Critical for power system processes
3. **AG-004**: Control Systems Engineer - Essential for control processes
4. **AG-005**: Power Electronics Engineer - Key for power converter design

### Phase 3: Signal Processing & Digital
1. **SK-006**: Digital Filter Design
2. **SK-007**: DSP Algorithm Implementation
3. **SK-008**: Communication System Simulation
4. **SK-015**: HDL Design and Verification
5. **AG-003**: DSP Algorithm Engineer
6. **AG-008**: Digital Design Engineer

### Phase 4: PCB Design & EMC
1. **SK-012**: Signal Integrity Analysis
2. **SK-013**: EMC Analysis
3. **SK-014**: PCB Stack-Up Design
4. **SK-022**: DFM Analysis
5. **AG-006**: PCB Design Engineer
6. **AG-007**: EMC Engineer

### Phase 5: Power Systems & Protection
1. **SK-004**: Short Circuit Analysis
2. **SK-005**: Protection Relay Coordination
3. **SK-019**: Renewable Energy Modeling
4. **SK-021**: Arc Flash Calculation
5. **AG-010**: Protection Engineer
6. **AG-015**: Renewable Energy Integration Expert

### Phase 6: Testing & Validation
1. **SK-018**: Test Equipment Automation
2. **SK-020**: Reliability Analysis
3. **SK-025**: Thermal Analysis
4. **AG-009**: Hardware Validation Engineer
5. **AG-013**: Test and Measurement Expert
6. **AG-014**: Reliability Engineer

### Phase 7: Specialized Applications
1. **SK-010**: Model Predictive Control
2. **SK-011**: Motion Control
3. **SK-016**: Magnetic Component Design
4. **SK-017**: Battery Modeling
5. **SK-023**: System Identification
6. **SK-024**: RF Circuit Design
7. **AG-011**: Mixed-Signal IC Design Agent
8. **AG-012**: Battery Systems Engineer

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 25 |
| Agents Identified | 15 |
| Shared Skill Candidates | 8 |
| Shared Agent Candidates | 5 |
| Total Processes Covered | 21 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
