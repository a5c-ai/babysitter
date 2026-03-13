# FPGA Programming and Hardware Description References

## IEEE Standards

### VHDL Standards
- **IEEE 1076-2019** - IEEE Standard VHDL Language Reference Manual
  - https://standards.ieee.org/standard/1076-2019.html
  - The authoritative reference for VHDL language syntax, semantics, and behavior

- **IEEE 1076.1-2017** - IEEE Standard VHDL Analog and Mixed-Signal Extensions (VHDL-AMS)
  - https://standards.ieee.org/standard/1076_1-2017.html
  - Extensions for analog and mixed-signal modeling

- **IEEE 1076.6-2004** - IEEE Standard for VHDL Register Transfer Level (RTL) Synthesis
  - https://standards.ieee.org/standard/1076_6-2004.html
  - Defines synthesizable VHDL subset and synthesis semantics

### Verilog and SystemVerilog Standards
- **IEEE 1364-2005** - IEEE Standard for Verilog Hardware Description Language
  - https://standards.ieee.org/standard/1364-2005.html
  - Complete Verilog language specification

- **IEEE 1800-2023** - IEEE Standard for SystemVerilog
  - https://standards.ieee.org/standard/1800-2023.html
  - Unified hardware design, specification, and verification language

- **IEEE 1800.2-2020** - IEEE Standard for Universal Verification Methodology (UVM)
  - https://standards.ieee.org/standard/1800_2-2020.html
  - Standard verification methodology class library

### Timing and Constraints
- **IEEE 1497-2001** - Standard for Standard Delay Format (SDF)
  - https://standards.ieee.org/standard/1497-2001.html
  - Timing annotation format for simulation

- **SDC (Synopsys Design Constraints)** - Industry-standard timing constraint format
  - https://www.synopsys.com/
  - De facto standard adopted by all major FPGA vendors

## Vendor Documentation

### Xilinx (AMD)
- **Vivado Design Suite User Guide**
  - https://docs.amd.com/r/en-US/ug910-vivado-getting-started
  - Comprehensive guide to Vivado tools and workflows

- **UltraScale Architecture Libraries Guide**
  - https://docs.amd.com/r/en-US/ug974-vivado-ultrascale-libraries
  - Primitive and macro library documentation

- **Vivado Design Suite Tcl Command Reference Guide**
  - https://docs.amd.com/r/en-US/ug835-vivado-tcl-commands
  - Complete Tcl command reference for automation

- **UltraFast Design Methodology Guide**
  - https://docs.amd.com/r/en-US/ug949-vivado-design-methodology
  - Best practices for timing closure and design optimization

- **Vitis Unified Software Platform Documentation**
  - https://docs.amd.com/r/en-US/ug1393-vitis-application-acceleration
  - Hardware acceleration development guide

- **Versal Architecture and Product Data Sheet**
  - https://docs.amd.com/r/en-US/ds950-versal-overview
  - Adaptive compute acceleration platform documentation

### Intel (Altera)
- **Intel Quartus Prime Pro Edition User Guide**
  - https://www.intel.com/content/www/us/en/programmable/documentation/mwh1409960181641.html
  - Design flow and tool documentation

- **Intel Agilex FPGA Device Overview**
  - https://www.intel.com/content/www/us/en/programmable/documentation/kqj1591686540472.html
  - Architecture and capabilities overview

- **Intel FPGA SDK for OpenCL**
  - https://www.intel.com/content/www/us/en/programmable/documentation/mwh1391807309901.html
  - High-level synthesis and OpenCL development

- **Intel Quartus Prime Timing Analyzer**
  - https://www.intel.com/content/www/us/en/programmable/documentation/mwh1410385117325.html
  - Static timing analysis documentation

- **Platform Designer User Guide**
  - https://www.intel.com/content/www/us/en/programmable/documentation/jrw1529444674987.html
  - System integration tool documentation

### Lattice Semiconductor
- **Lattice Diamond User Guide**
  - https://www.latticesemi.com/Products/DesignSoftwareAndIP/FPGAandLDS/LatticeDiamond
  - Design tools for Lattice FPGAs

- **Lattice Propel Design Environment**
  - https://www.latticesemi.com/Products/DesignSoftwareAndIP/FPGAandLDS/Propel
  - Embedded design and system integration

### Microchip (Microsemi)
- **Libero SoC Design Suite**
  - https://www.microchip.com/en-us/products/fpgas-and-plds/fpga-and-soc-design-tools/fpga/libero-software-later-versions
  - FPGA design tools documentation

- **PolarFire FPGA User Guide**
  - https://www.microchip.com/en-us/products/fpgas-and-plds/fpgas/polarfire-fpgas
  - Low-power FPGA documentation

## Digital Design Textbooks

### Foundational Texts
- **Digital Design and Computer Architecture** - Harris & Harris
  - ISBN: 978-0128000564
  - Comprehensive introduction to digital design with HDL examples

- **Digital Design: Principles and Practices** - John F. Wakerly
  - ISBN: 978-0134460093
  - Classic textbook covering digital design fundamentals

- **RTL Hardware Design Using VHDL** - Pong P. Chu
  - ISBN: 978-0471720928
  - Practical guide to synthesizable VHDL design

- **Verilog HDL: A Guide to Digital Design and Synthesis** - Samir Palnitkar
  - ISBN: 978-0134516752
  - Industry-standard Verilog reference

### Advanced Design
- **FPGA Prototyping by VHDL Examples** - Pong P. Chu
  - ISBN: 978-1119282747
  - Practical FPGA design examples with VHDL

- **FPGA Prototyping by SystemVerilog Examples** - Pong P. Chu
  - ISBN: 978-1119282648
  - SystemVerilog-based FPGA design guide

- **Advanced FPGA Design: Architecture, Implementation, and Optimization** - Steve Kilts
  - ISBN: 978-0470054376
  - Advanced techniques for high-performance FPGA design

- **Digital Signal Processing with Field Programmable Gate Arrays** - Uwe Meyer-Baese
  - ISBN: 978-3662543269
  - DSP implementation on FPGAs

### Verification
- **Writing Testbenches: Functional Verification of HDL Models** - Janick Bergeron
  - ISBN: 978-1402074011
  - Classic verification methodology text

- **SystemVerilog for Verification** - Chris Spear & Greg Tumbush
  - ISBN: 978-1461407140
  - Comprehensive SystemVerilog verification guide

- **The UVM Primer** - Ray Salemi
  - ISBN: 978-0974164939
  - Practical introduction to Universal Verification Methodology

## FPGA Design Guides

### Architecture and Optimization
- **Designing with Xilinx FPGAs Using Vivado** - Sanjay Churiwala
  - ISBN: 978-3319424378
  - Practical Vivado design guide

- **High-Speed Digital Design: A Handbook of Black Magic** - Howard Johnson
  - ISBN: 978-0133957242
  - Signal integrity and high-speed design principles

- **Clock Domain Crossing (CDC) Design & Verification Techniques**
  - http://www.sunburst-design.com/papers/
  - Clifford Cummings' authoritative CDC papers

### Timing Analysis
- **Static Timing Analysis for Nanometer Designs** - J. Bhasker & Rakesh Chadha
  - ISBN: 978-0387938196
  - Comprehensive STA methodology guide

- **Constraining Designs for Synthesis and Timing Analysis** - Sridhar Gangadharan
  - ISBN: 978-1461432685
  - Practical constraint specification guide

### High-Level Synthesis
- **High-Level Synthesis: Blue Book** - Michael Fingeroff
  - https://www.mentor.com/hls-lp/resources/
  - Catapult HLS methodology guide

- **Parallel Programming for FPGAs** - Ryan Kastner, Janarbek Matai, Stephen Neuendorffer
  - https://kastner.ucsd.edu/hlsbook/
  - Open-source HLS design guide

## Online Resources

### Technical Communities
- **FPGA Reddit Community**
  - https://www.reddit.com/r/FPGA/
  - Active community for FPGA discussions

- **EDA Playground**
  - https://www.edaplayground.com/
  - Free online HDL simulation environment

- **Verification Academy**
  - https://verificationacademy.com/
  - Siemens EDA verification resources and training

### Tutorial Sites
- **NANDLAND**
  - https://www.nandland.com/
  - FPGA tutorials and examples

- **FPGA4Fun**
  - https://www.fpga4fun.com/
  - Practical FPGA project tutorials

- **ZipCPU**
  - https://zipcpu.com/
  - Advanced FPGA design blog and tutorials

- **HDLBits**
  - https://hdlbits.01xz.net/
  - Interactive Verilog exercises and problems

### Standards and Specifications
- **Accellera Systems Initiative**
  - https://www.accellera.org/
  - Industry standards organization for EDA

- **AMBA Specifications**
  - https://developer.arm.com/architectures/system-architectures/amba
  - ARM AMBA bus protocol specifications (AXI, AHB, APB)

- **PCI Express Specifications**
  - https://pcisig.com/specifications
  - PCIe interface specifications

- **OpenCAPI Consortium**
  - https://opencapi.org/
  - Open coherent accelerator processor interface

## Research and Academic Resources

### Conference Proceedings
- **FPGA (ACM/SIGDA International Symposium on FPGAs)**
  - https://www.isfpga.org/
  - Premier academic FPGA conference

- **FCCM (IEEE Symposium on Field-Programmable Custom Computing Machines)**
  - https://www.fccm.org/
  - High-performance FPGA computing

- **FPL (International Conference on Field-Programmable Logic and Applications)**
  - Leading European FPGA conference

- **DAC (Design Automation Conference)**
  - https://www.dac.com/
  - Premier EDA industry conference

### Research Papers
- **ACM Digital Library**
  - https://dl.acm.org/
  - Computer science research papers

- **IEEE Xplore**
  - https://ieeexplore.ieee.org/
  - IEEE technical papers and standards

- **arXiv Computer Science**
  - https://arxiv.org/list/cs.AR/recent
  - Preprint server for computer architecture research

## HDL Best Practices

### Coding Guidelines
- **Sunburst Design Papers** - Clifford Cummings
  - http://www.sunburst-design.com/papers/
  - Industry-standard Verilog and SystemVerilog coding guidelines

- **VHDL Coding Guidelines** - Ben Cohen
  - https://www.vhdl.org/
  - VHDL best practices and verification

- **Reuse Methodology Manual** - Michael Keating & Pierre Bricaud
  - ISBN: 978-1402071416
  - IP design for reuse guidelines

### Linting and Static Analysis
- **Spyglass Design Rules**
  - https://www.synopsys.com/verification/static-and-formal-verification/spyglass.html
  - Industry-standard lint rules

- **STARC RTL Design Style Guide**
  - Comprehensive RTL coding guidelines from Semiconductor Technology Academic Research Center

### Synthesis Guidelines
- **Xilinx HDL Coding Techniques**
  - https://docs.amd.com/r/en-US/ug901-vivado-synthesis
  - Vivado synthesis coding recommendations

- **Intel Quartus Prime Recommended HDL Coding Styles**
  - https://www.intel.com/content/www/us/en/programmable/documentation/mwh1409960181641.html
  - Quartus synthesis guidelines

## Training and Certification

### Vendor Training
- **AMD Xilinx Training**
  - https://www.amd.com/en/corporate/xilinx-training.html
  - Official Xilinx/AMD training courses

- **Intel FPGA Training**
  - https://www.intel.com/content/www/us/en/programmable/support/training/overview.html
  - Official Intel FPGA courses

### Online Courses
- **Coursera FPGA Courses**
  - https://www.coursera.org/courses?query=fpga
  - University-level FPGA courses

- **edX Hardware Design**
  - https://www.edx.org/learn/hardware
  - Digital design and FPGA courses

- **Udemy FPGA Courses**
  - https://www.udemy.com/topic/fpga/
  - Practical FPGA design courses

## Tools and Utilities

### Open Source Tools
- **Verilator**
  - https://www.veripool.org/verilator/
  - Fast open-source Verilog simulator

- **GHDL**
  - https://ghdl.github.io/ghdl/
  - Open-source VHDL analyzer and simulator

- **Yosys**
  - https://yosyshq.net/yosys/
  - Open-source synthesis suite

- **nextpnr**
  - https://github.com/YosysHQ/nextpnr
  - Open-source place and route tool

- **Icarus Verilog**
  - http://iverilog.icarus.com/
  - Open-source Verilog simulation and synthesis

- **GTKWave**
  - http://gtkwave.sourceforge.net/
  - Open-source waveform viewer

### Commercial Tools
- **Synopsys VCS**
  - https://www.synopsys.com/verification/simulation/vcs.html
  - High-performance simulation

- **Cadence Xcelium**
  - https://www.cadence.com/en_US/home/tools/system-design-and-verification/simulation-and-testbench-verification/xcelium-simulator.html
  - Multi-engine simulation

- **Siemens Questa**
  - https://eda.sw.siemens.com/en-US/ic/questa/
  - Advanced verification platform

## Industry Organizations

- **FPGA Industry Consortium**
  - Industry collaboration on FPGA standards

- **Accellera**
  - https://www.accellera.org/
  - EDA standards development

- **Si2 (Silicon Integration Initiative)**
  - https://www.si2.org/
  - Semiconductor industry collaboration

- **SPIRIT Consortium (now IEEE 1685)**
  - IP-XACT metadata standard for IP packaging
