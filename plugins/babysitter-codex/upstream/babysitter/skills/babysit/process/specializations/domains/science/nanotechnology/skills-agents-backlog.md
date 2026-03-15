# Nanotechnology - Skills and Agents Backlog (Phase 4)

## Overview

This backlog identifies specialized skills and agents that could enhance the Nanotechnology processes beyond general-purpose capabilities. Each skill or agent is designed to provide domain-specific tooling, validation, or automation for nanomaterial synthesis, characterization, fabrication, computational modeling, and application development workflows.

## Summary Statistics

- **Total Skills Identified**: 48
- **Total Agents Identified**: 22
- **Shared Candidates (Cross-Specialization)**: 14
- **Categories**: 8 (Synthesis & Materials, Surface Analysis, Microscopy & Characterization, Spectroscopy, Fabrication, Computational, Applications, Infrastructure)

---

## Skills

### Synthesis & Materials Skills

#### 1. nanoparticle-synthesis-optimizer
**Description**: Synthesis parameter optimization skill for metal, semiconductor, and oxide nanoparticle production with automated protocol generation and reproducibility validation.

**Capabilities**:
- Precursor stoichiometry calculation
- Reaction temperature/time optimization
- Surfactant and capping agent selection
- Nucleation and growth kinetics modeling
- Size distribution targeting
- Batch reproducibility assessment

**Used By Processes**:
- Nanoparticle Synthesis Protocol Development
- Nanomaterial Scale-Up and Process Transfer
- Green Synthesis Route Development

**Tools/Libraries**: Custom synthesis planners, reaction kinetics models, DOE (Design of Experiments) frameworks

---

#### 2. colloidal-stability-analyzer
**Description**: Colloidal stability assessment skill for evaluating nanoparticle dispersion stability through zeta potential, aggregation kinetics, and shelf-life prediction.

**Capabilities**:
- Zeta potential analysis
- DLVO theory-based stability prediction
- Aggregation kinetics modeling
- pH and ionic strength effects
- Steric stabilization assessment
- Shelf-life prediction algorithms

**Used By Processes**:
- Nanoparticle Synthesis Protocol Development
- Nanomaterial Surface Functionalization Pipeline
- Nanoparticle Drug Delivery System Development

**Tools/Libraries**: DLS analyzers, zeta potential meters, stability prediction models

---

#### 3. ligand-exchange-protocol-manager
**Description**: Surface chemistry skill for managing ligand exchange reactions, bioconjugation protocols, and functional group quantification.

**Capabilities**:
- Ligand exchange reaction design
- Bioconjugation chemistry selection
- Click chemistry protocols
- Functional group quantification (TNBS, Ellman's)
- Conjugation efficiency optimization
- Surface coverage calculation

**Used By Processes**:
- Nanomaterial Surface Functionalization Pipeline
- Nanoparticle Drug Delivery System Development
- Nanosensor Development and Validation Pipeline

**Tools/Libraries**: Bioconjugation reaction databases, surface chemistry calculators

---

#### 4. green-synthesis-evaluator
**Description**: Sustainability assessment skill for evaluating and designing environmentally friendly nanomaterial synthesis routes.

**Capabilities**:
- Green chemistry metrics calculation (E-factor, atom economy)
- Lifecycle assessment integration
- Bio-based precursor database
- Solvent sustainability scoring
- Energy consumption estimation
- Waste minimization strategies

**Used By Processes**:
- Green Synthesis Route Development
- Nanoparticle Synthesis Protocol Development

**Tools/Libraries**: LCA tools, green chemistry databases, sustainability metrics calculators

---

#### 5. scale-up-process-analyzer
**Description**: Process engineering skill for analyzing and optimizing nanomaterial synthesis scale-up from lab to production.

**Capabilities**:
- Heat and mass transfer scaling
- Reactor design recommendations
- Mixing efficiency analysis
- Continuous flow process design
- Batch consistency validation
- Cost-at-scale estimation

**Used By Processes**:
- Nanomaterial Scale-Up and Process Transfer
- Nanoparticle Synthesis Protocol Development

**Tools/Libraries**: Process simulation tools, reactor design calculators, microfluidics design tools

---

### Surface Analysis Skills

#### 6. xps-surface-analyzer
**Description**: X-ray Photoelectron Spectroscopy analysis skill for surface composition, chemical state, and depth profiling.

**Capabilities**:
- Survey and high-resolution spectra acquisition
- Peak fitting and deconvolution
- Chemical state identification
- Quantitative surface composition
- Depth profiling analysis
- Charge correction and calibration

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- Nanomaterial Surface Functionalization Pipeline
- Structure-Property Correlation Analysis

**Tools/Libraries**: CasaXPS, XPSPeak, PHI MultiPak, Avantage

---

#### 7. tof-sims-analyzer
**Description**: Time-of-Flight Secondary Ion Mass Spectrometry skill for molecular surface analysis and imaging.

**Capabilities**:
- Molecular ion identification
- Surface contamination analysis
- 2D and 3D chemical imaging
- Isotope labeling detection
- Depth profiling
- Principal component analysis of spectra

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- Nanomaterial Surface Functionalization Pipeline

**Tools/Libraries**: ION-TOF software, SurfaceLab, NESAC/BIO tools

---

#### 8. contact-angle-analyzer
**Description**: Wettability analysis skill for surface energy characterization and hydrophobicity/hydrophilicity assessment.

**Capabilities**:
- Static contact angle measurement
- Dynamic advancing/receding angles
- Surface energy calculation (Owens-Wendt, van Oss)
- Wilhelmy plate analysis
- Surface roughness correlation
- Superhydrophobic/superhydrophilic assessment

**Used By Processes**:
- Nanomaterial Surface Functionalization Pipeline
- Thin Film Deposition Process Optimization

**Tools/Libraries**: Contact angle goniometers, surface energy calculators

---

### Microscopy & Characterization Skills

#### 9. tem-image-analyzer
**Description**: Transmission Electron Microscopy image analysis skill for nanoparticle size, morphology, and crystallography assessment.

**Capabilities**:
- Automated particle detection and sizing
- Morphology classification
- Lattice fringe analysis
- Selected area electron diffraction (SAED) indexing
- High-resolution TEM (HRTEM) analysis
- STEM-HAADF imaging

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- Statistical Particle Size Distribution Analysis
- In-Situ Characterization Experiment Design

**Tools/Libraries**: ImageJ/Fiji, Gatan DigitalMicrograph, JEMS, CryoSPARC

---

#### 10. sem-eds-analyzer
**Description**: Scanning Electron Microscopy with Energy Dispersive X-ray Spectroscopy skill for morphology and elemental analysis.

**Capabilities**:
- Automated SEM image analysis
- EDS spectrum acquisition and quantification
- Elemental mapping and line scans
- Particle size from SEM images
- Surface morphology characterization
- Cross-section analysis

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- Nanodevice Integration Process Flow
- Nanolithography Process Development

**Tools/Libraries**: AZtec, ESPRIT, NSS, Pathfinder

---

#### 11. afm-spm-analyzer
**Description**: Atomic Force Microscopy and Scanning Probe Microscopy skill for nanoscale topography, mechanical, and electrical property mapping.

**Capabilities**:
- Topography imaging and analysis
- Surface roughness calculation (Ra, RMS)
- Force-distance curve analysis
- Nanoindentation and mechanical mapping
- Kelvin probe force microscopy (KPFM)
- Conductive AFM measurements

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- In-Situ Characterization Experiment Design
- Thin Film Deposition Process Optimization

**Tools/Libraries**: Gwyddion, WSxM, NanoScope Analysis, SPIP

---

#### 12. stm-analyzer
**Description**: Scanning Tunneling Microscopy skill for atomic-resolution imaging and local density of states measurements.

**Capabilities**:
- Atomic-resolution imaging
- STS (Scanning Tunneling Spectroscopy)
- Local density of states mapping
- Surface reconstruction analysis
- Molecular imaging
- Low-temperature operation protocols

**Used By Processes**:
- In-Situ Characterization Experiment Design
- Structure-Property Correlation Analysis

**Tools/Libraries**: WSxM, SPECS software, custom STM analysis tools

---

#### 13. dls-particle-sizer
**Description**: Dynamic Light Scattering skill for hydrodynamic size distribution and polydispersity analysis.

**Capabilities**:
- Hydrodynamic diameter measurement
- Polydispersity index (PDI) calculation
- Size distribution analysis (intensity, volume, number)
- Temperature-dependent measurements
- Multi-angle DLS analysis
- Particle concentration estimation

**Used By Processes**:
- Statistical Particle Size Distribution Analysis
- Nanoparticle Synthesis Protocol Development
- Nanoparticle Drug Delivery System Development

**Tools/Libraries**: Malvern Zetasizer software, ALV correlator, CONTIN algorithm

---

#### 14. nta-particle-tracker
**Description**: Nanoparticle Tracking Analysis skill for single-particle size and concentration measurements.

**Capabilities**:
- Single-particle tracking
- Size-concentration profiles
- Fluorescence NTA mode
- Real-time size distribution
- Particle count and concentration
- Sample heterogeneity assessment

**Used By Processes**:
- Statistical Particle Size Distribution Analysis
- Nanoparticle Drug Delivery System Development

**Tools/Libraries**: NanoSight NTA software, ZetaView software

---

### Spectroscopy Skills

#### 15. raman-spectroscopy-analyzer
**Description**: Raman spectroscopy skill for molecular fingerprinting, structural characterization, and chemical identification of nanomaterials.

**Capabilities**:
- Raman spectrum acquisition and processing
- Peak identification and assignment
- SERS (Surface-Enhanced Raman) analysis
- Raman mapping and imaging
- Resonance Raman analysis
- Graphene/CNT characterization (D/G ratio)

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- In-Situ Characterization Experiment Design
- Structure-Property Correlation Analysis

**Tools/Libraries**: WiRE, LabSpec, Renishaw software, custom spectral databases

---

#### 16. uv-vis-nir-analyzer
**Description**: UV-Vis-NIR spectroscopy skill for optical property characterization including plasmon resonance and bandgap analysis.

**Capabilities**:
- Absorption/transmission/reflectance spectra
- Localized surface plasmon resonance (LSPR) analysis
- Bandgap determination (Tauc plot)
- Quantum dot emission characterization
- Beer-Lambert quantification
- Aggregation monitoring

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- Structure-Property Correlation Analysis
- Nanosensor Development and Validation Pipeline

**Tools/Libraries**: UV Probe, Lambda software, custom analysis scripts

---

#### 17. ftir-analyzer
**Description**: Fourier Transform Infrared spectroscopy skill for molecular identification and surface functional group analysis.

**Capabilities**:
- ATR-FTIR for nanoparticle surfaces
- Functional group identification
- Surface modification verification
- Gas-phase FTIR for reactions
- Diffuse reflectance (DRIFTS)
- Spectral library searching

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- Nanomaterial Surface Functionalization Pipeline

**Tools/Libraries**: OMNIC, OPUS, PerkinElmer Spectrum software

---

#### 18. fluorescence-spectroscopy-analyzer
**Description**: Fluorescence spectroscopy skill for quantum dot characterization, FRET measurements, and photoluminescence analysis.

**Capabilities**:
- Excitation/emission spectra
- Quantum yield calculation
- Fluorescence lifetime measurements
- FRET efficiency calculation
- Photostability assessment
- Single-particle fluorescence

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- Nanosensor Development and Validation Pipeline
- Nanoparticle Drug Delivery System Development

**Tools/Libraries**: FluorEssence, Edinburgh Instruments F980, custom analysis tools

---

#### 19. xrd-crystallography-analyzer
**Description**: X-ray Diffraction skill for crystal structure, phase identification, and crystallite size analysis of nanomaterials.

**Capabilities**:
- Phase identification and Rietveld refinement
- Crystallite size (Scherrer equation)
- Lattice parameter calculation
- Preferred orientation analysis
- In-situ XRD capabilities
- PDF (Pair Distribution Function) analysis

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- Structure-Property Correlation Analysis
- Nanoparticle Synthesis Protocol Development

**Tools/Libraries**: HighScore, JADE, GSAS-II, FullProf, PDFgui

---

#### 20. saxs-waxs-analyzer
**Description**: Small/Wide Angle X-ray Scattering skill for nanostructure size, shape, and organization analysis.

**Capabilities**:
- SAXS data reduction and analysis
- Form factor fitting
- Guinier and Kratky analysis
- Pair distance distribution function
- WAXS crystallinity assessment
- Self-assembly structure determination

**Used By Processes**:
- Statistical Particle Size Distribution Analysis
- Directed Self-Assembly Process Development
- Structure-Property Correlation Analysis

**Tools/Libraries**: ATSAS, SasView, Irena, RAW

---

### Fabrication Skills

#### 21. ebl-process-controller
**Description**: Electron Beam Lithography skill for high-resolution nanopatterning with dose optimization and proximity effect correction.

**Capabilities**:
- Pattern design and fracturing
- Dose optimization and modulation
- Proximity effect correction (PEC)
- Alignment and overlay control
- Resist processing optimization
- Critical dimension (CD) control

**Used By Processes**:
- Nanolithography Process Development
- Nanodevice Integration Process Flow

**Tools/Libraries**: BEAMER, GenISys TRACER, Raith NanoSuite

---

#### 22. nanoimprint-process-controller
**Description**: Nanoimprint Lithography skill for high-throughput nanopatterning with template management and demolding optimization.

**Capabilities**:
- Template design and fabrication
- Imprint pressure and temperature optimization
- UV-NIL and thermal NIL protocols
- Demolding force analysis
- Residual layer control
- Defect inspection and yield analysis

**Used By Processes**:
- Nanolithography Process Development
- Directed Self-Assembly Process Development

**Tools/Libraries**: NIL process simulation, template design tools

---

#### 23. ald-process-controller
**Description**: Atomic Layer Deposition skill for conformal thin film deposition with atomic-level thickness control.

**Capabilities**:
- Precursor pulse/purge optimization
- Growth per cycle (GPC) characterization
- Film uniformity mapping
- Conformality assessment
- In-situ monitoring integration
- Multi-component film design

**Used By Processes**:
- Thin Film Deposition Process Optimization
- Nanodevice Integration Process Flow

**Tools/Libraries**: ALD process simulators, quartz crystal microbalance analysis

---

#### 24. cvd-pvd-process-controller
**Description**: Chemical/Physical Vapor Deposition skill for thin film and nanostructure deposition optimization.

**Capabilities**:
- CVD precursor chemistry selection
- Temperature and pressure optimization
- Plasma-enhanced CVD protocols
- PVD sputtering/evaporation control
- Film stress management
- Rate and uniformity optimization

**Used By Processes**:
- Thin Film Deposition Process Optimization
- Nanodevice Integration Process Flow

**Tools/Libraries**: Deposition rate calculators, film thickness monitors

---

#### 25. plasma-etch-controller
**Description**: Plasma etching skill for anisotropic nanostructure patterning with selectivity and profile control.

**Capabilities**:
- Etch chemistry selection
- Anisotropy and selectivity optimization
- Endpoint detection
- Profile and sidewall angle control
- Loading effect compensation
- Plasma damage assessment

**Used By Processes**:
- Nanolithography Process Development
- Nanodevice Integration Process Flow

**Tools/Libraries**: Etch simulators, OES/interferometry analysis

---

#### 26. fib-mill-controller
**Description**: Focused Ion Beam milling skill for site-specific nanofabrication and cross-section preparation.

**Capabilities**:
- TEM lamella preparation
- Nanoscale milling and deposition
- Pattern writing and editing
- Cross-section imaging
- Gas-assisted etching/deposition
- Damage minimization protocols

**Used By Processes**:
- Nanodevice Integration Process Flow
- Multi-Modal Nanomaterial Characterization Pipeline

**Tools/Libraries**: FIB pattern generators, dual-beam workflow automation

---

#### 27. dsa-process-controller
**Description**: Directed Self-Assembly skill for block copolymer lithography and nanoparticle templating.

**Capabilities**:
- Block copolymer selection and design
- Annealing protocol optimization
- Defect density analysis
- Pattern transfer protocols
- Graphoepitaxy and chemoepitaxy
- Long-range order characterization

**Used By Processes**:
- Directed Self-Assembly Process Development
- Nanolithography Process Development

**Tools/Libraries**: BCP simulation tools, SCFT (Self-Consistent Field Theory)

---

#### 28. cleanroom-metrology-controller
**Description**: Nanofabrication metrology skill for process control with CD-SEM, ellipsometry, and profilometry.

**Capabilities**:
- CD-SEM measurement recipes
- Spectroscopic ellipsometry analysis
- Film thickness mapping
- Surface profilometry
- Defect inspection
- Overlay measurement

**Used By Processes**:
- All fabrication processes
- Analysis Pipeline Validation

**Tools/Libraries**: CDSEM recipe managers, ellipsometry fitting software

---

### Computational Skills

#### 29. vasp-dft-executor
**Description**: VASP DFT calculation skill for electronic structure, geometry optimization, and property prediction of nanomaterials.

**Capabilities**:
- Input file generation (INCAR, POSCAR, KPOINTS, POTCAR)
- Geometry optimization
- Electronic band structure calculation
- Density of states analysis
- Formation energy calculation
- Optical property prediction

**Used By Processes**:
- DFT Calculation Pipeline for Nanomaterials
- Multiscale Modeling Integration
- Machine Learning Materials Discovery Pipeline

**Tools/Libraries**: VASP, VASPKIT, pymatgen, ASE

---

#### 30. quantum-espresso-executor
**Description**: Quantum ESPRESSO calculation skill for DFT simulations with pseudopotential management.

**Capabilities**:
- PWscf calculations
- Phonon calculations (DFPT)
- NEB reaction pathway modeling
- Time-dependent DFT
- Pseudopotential library management
- Wannier function analysis

**Used By Processes**:
- DFT Calculation Pipeline for Nanomaterials
- Multiscale Modeling Integration

**Tools/Libraries**: Quantum ESPRESSO, QE-tools, Wannier90

---

#### 31. lammps-md-executor
**Description**: LAMMPS molecular dynamics skill for nanoscale system simulation with force field management.

**Capabilities**:
- Force field selection and parameterization
- System equilibration protocols
- NVT/NPT ensemble simulations
- Trajectory analysis
- Thermal conductivity calculation
- Mechanical property simulation

**Used By Processes**:
- Molecular Dynamics Simulation Workflow
- Multiscale Modeling Integration

**Tools/Libraries**: LAMMPS, OVITO, VMD, MDAnalysis

---

#### 32. gromacs-md-executor
**Description**: GROMACS molecular dynamics skill for nanoparticle-biomolecule interaction simulations.

**Capabilities**:
- Nanoparticle-protein simulations
- Membrane-nanoparticle interactions
- Coarse-grained modeling (Martini)
- Free energy calculations
- Enhanced sampling methods
- Trajectory analysis and visualization

**Used By Processes**:
- Molecular Dynamics Simulation Workflow
- Nanoparticle Drug Delivery System Development

**Tools/Libraries**: GROMACS, gmx_MMPBSA, MDAnalysis

---

#### 33. comsol-multiphysics-executor
**Description**: COMSOL Multiphysics skill for continuum-scale nanomaterial and device modeling.

**Capabilities**:
- Heat transfer modeling
- Electromagnetic simulations
- Fluid dynamics at nanoscale
- Structural mechanics
- Chemical transport modeling
- Multi-physics coupling

**Used By Processes**:
- Multiscale Modeling Integration
- Nanodevice Integration Process Flow

**Tools/Libraries**: COMSOL Multiphysics, LiveLink interfaces

---

#### 34. ml-materials-predictor
**Description**: Machine learning skill for nanomaterial property prediction and discovery acceleration.

**Capabilities**:
- Feature engineering for materials
- Property prediction models (GNN, transformers)
- Active learning for experiment design
- High-throughput virtual screening
- Synthesis success prediction
- Transfer learning for small datasets

**Used By Processes**:
- Machine Learning Materials Discovery Pipeline
- Structure-Property Correlation Analysis

**Tools/Libraries**: MatMiner, MEGNet, CGCNN, scikit-learn, PyTorch

---

#### 35. materials-database-querier
**Description**: Materials database query skill for accessing structure and property data from multiple repositories.

**Capabilities**:
- Materials Project API integration
- AFLOW database queries
- ICSD/CSD structure retrieval
- NOMAD repository access
- Cross-database searches
- Property aggregation and comparison

**Used By Processes**:
- Machine Learning Materials Discovery Pipeline
- DFT Calculation Pipeline for Nanomaterials
- Structure-Property Correlation Analysis

**Tools/Libraries**: pymatgen, Materials Project API, AFLOW REST API

---

#### 36. nanohub-simulator-interface
**Description**: NanoHUB tool interface skill for accessing educational and research nanoscience simulations.

**Capabilities**:
- Quantum dot simulations (NEMO)
- CNT property calculators
- Nanowire transport modeling
- Band structure visualization
- Interactive simulation execution
- Result extraction and analysis

**Used By Processes**:
- Multiscale Modeling Integration
- DFT Calculation Pipeline for Nanomaterials

**Tools/Libraries**: NanoHUB API, Rappture toolkit

---

### Applications Skills

#### 37. drug-encapsulation-optimizer
**Description**: Drug delivery formulation skill for optimizing drug loading, encapsulation efficiency, and release kinetics.

**Capabilities**:
- Drug loading optimization
- Encapsulation efficiency calculation
- Release kinetics modeling (zero-order, Higuchi, Korsmeyer-Peppas)
- Stability testing protocols
- Size optimization for target application
- Payload-to-carrier ratio optimization

**Used By Processes**:
- Nanoparticle Drug Delivery System Development
- Nanomaterial Safety Assessment Pipeline

**Tools/Libraries**: Dissolution modeling software, stability testing protocols

---

#### 38. targeting-ligand-designer
**Description**: Active targeting skill for designing and validating nanoparticle targeting strategies.

**Capabilities**:
- Targeting ligand selection (antibodies, peptides, aptamers)
- Conjugation chemistry optimization
- Binding affinity assessment
- Biodistribution prediction
- Receptor expression analysis
- In vitro targeting validation

**Used By Processes**:
- Nanoparticle Drug Delivery System Development
- Nanosensor Development and Validation Pipeline

**Tools/Libraries**: Binding kinetics analyzers, molecular modeling tools

---

#### 39. nanosensor-calibration-manager
**Description**: Nanosensor characterization skill for calibration, sensitivity analysis, and selectivity validation.

**Capabilities**:
- Calibration curve generation
- Limit of detection (LOD) calculation
- Sensitivity and dynamic range analysis
- Selectivity and interference testing
- Response time characterization
- Long-term stability assessment

**Used By Processes**:
- Nanosensor Development and Validation Pipeline

**Tools/Libraries**: Sensor calibration software, data analysis tools

---

#### 40. nanocatalyst-performance-analyzer
**Description**: Nanocatalysis skill for evaluating catalytic activity, selectivity, and stability of nanomaterial catalysts.

**Capabilities**:
- Turnover frequency (TOF) calculation
- Selectivity analysis
- Activation energy determination
- Stability and recyclability testing
- Surface area normalization (BET)
- Reaction mechanism investigation

**Used By Processes**:
- Nanocatalyst Development and Performance Optimization

**Tools/Libraries**: Reaction kinetics analyzers, BET surface area tools

---

#### 41. cytotoxicity-assay-analyzer
**Description**: Nanotoxicology skill for in vitro cytotoxicity assessment and cell viability analysis.

**Capabilities**:
- MTT/MTS/WST assay analysis
- Live/dead staining quantification
- IC50/EC50 calculation
- Dose-response curve fitting
- Cell morphology analysis
- Apoptosis/necrosis detection

**Used By Processes**:
- Nanomaterial Safety Assessment Pipeline
- Nanoparticle Drug Delivery System Development

**Tools/Libraries**: Plate reader analysis software, cell imaging analysis

---

#### 42. environmental-fate-modeler
**Description**: Environmental nanosafety skill for modeling nanomaterial environmental fate and transport.

**Capabilities**:
- Dissolution and aggregation modeling
- Bioaccumulation prediction
- Environmental exposure assessment
- Ecotoxicity data analysis
- Lifecycle impact assessment
- Risk characterization

**Used By Processes**:
- Nanomaterial Safety Assessment Pipeline
- Green Synthesis Route Development

**Tools/Libraries**: Environmental modeling tools, LCA software

---

### Infrastructure and Quality Skills

#### 43. nanomaterial-lims-manager
**Description**: Laboratory Information Management System skill for nanomaterial sample tracking and data management.

**Capabilities**:
- Sample tracking and chain of custody
- Synthesis parameter logging
- Characterization data linking
- Batch genealogy tracking
- Quality control checkpoints
- Regulatory documentation

**Used By Processes**:
- All synthesis and characterization processes
- Nanomaterial Scale-Up and Process Transfer

**Tools/Libraries**: LIMS systems, ELN platforms

---

#### 44. iso-nanotechnology-compliance-checker
**Description**: Regulatory compliance skill for ISO nanotechnology standards verification and documentation.

**Capabilities**:
- ISO/TS 80004 terminology compliance
- ISO/TR 13014 characterization guidance
- ISO/TR 12885 safety practices
- Documentation template generation
- Compliance audit checklists
- Gap analysis reports

**Used By Processes**:
- Nanomaterial Safety Assessment Pipeline
- Nanomaterial Scale-Up and Process Transfer

**Tools/Libraries**: ISO standards databases, compliance management tools

---

#### 45. nanomaterial-sds-generator
**Description**: Safety documentation skill for generating Safety Data Sheets for nanomaterials.

**Capabilities**:
- GHS classification for nanomaterials
- Hazard identification
- Exposure control recommendations
- First aid and fire-fighting measures
- Disposal considerations
- Regulatory information compilation

**Used By Processes**:
- Nanomaterial Safety Assessment Pipeline

**Tools/Libraries**: SDS authoring tools, hazard databases

---

#### 46. cleanroom-protocol-manager
**Description**: Cleanroom operations skill for managing protocols, contamination control, and process flows.

**Capabilities**:
- Protocol version control
- Equipment qualification tracking
- Contamination monitoring
- Process flow documentation
- Training record management
- Maintenance scheduling

**Used By Processes**:
- All fabrication processes
- Nanomaterial Scale-Up and Process Transfer

**Tools/Libraries**: Cleanroom management systems, protocol databases

---

#### 47. experiment-planner-doe
**Description**: Design of Experiments skill for systematic optimization of nanomaterial synthesis and processing.

**Capabilities**:
- Factorial design generation
- Response surface methodology
- Taguchi method implementation
- ANOVA analysis
- Optimization predictions
- Robustness testing

**Used By Processes**:
- Nanoparticle Synthesis Protocol Development
- Thin Film Deposition Process Optimization
- Nanolithography Process Development

**Tools/Libraries**: JMP, Design-Expert, Minitab, scipy.stats

---

#### 48. characterization-workflow-orchestrator
**Description**: Workflow automation skill for orchestrating multi-technique characterization sequences.

**Capabilities**:
- Characterization sequence planning
- Sample routing optimization
- Data aggregation and correlation
- Report generation
- Quality gate enforcement
- Instrument scheduling

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- Structure-Property Correlation Analysis

**Tools/Libraries**: Workflow engines, instrument integration APIs

---

## Agents

### Planning and Design Agents

#### 1. nanotechnology-project-planner
**Description**: Agent specialized in nanotechnology project scoping, experimental design consultation, and research strategy planning.

**Responsibilities**:
- Research objective definition
- Experimental design review
- Resource and equipment assessment
- Timeline and milestone planning
- Risk assessment and mitigation
- Collaboration coordination

**Used By Processes**:
- All nanotechnology processes

**Required Skills**: experiment-planner-doe, nanomaterial-lims-manager

---

#### 2. nanomaterial-synthesis-designer
**Description**: Agent specialized in designing and optimizing nanomaterial synthesis strategies based on target properties.

**Responsibilities**:
- Synthesis route selection
- Precursor and reagent recommendations
- Reaction parameter optimization
- Scale-up feasibility assessment
- Reproducibility verification
- Documentation and protocol creation

**Used By Processes**:
- Nanoparticle Synthesis Protocol Development
- Green Synthesis Route Development
- Nanomaterial Scale-Up and Process Transfer

**Required Skills**: nanoparticle-synthesis-optimizer, green-synthesis-evaluator, scale-up-process-analyzer

---

### Characterization Agents

#### 3. electron-microscopy-specialist
**Description**: Agent specialized in electron microscopy analysis (TEM, SEM, STEM) for nanomaterial structural characterization.

**Responsibilities**:
- Sample preparation guidance
- Imaging condition optimization
- Image analysis and interpretation
- Crystallographic analysis
- EDS/EELS spectrum analysis
- Artifact identification

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- Statistical Particle Size Distribution Analysis
- In-Situ Characterization Experiment Design

**Required Skills**: tem-image-analyzer, sem-eds-analyzer, fib-mill-controller

---

#### 4. scanning-probe-specialist
**Description**: Agent specialized in SPM techniques (AFM, STM) for nanoscale surface characterization.

**Responsibilities**:
- Probe and mode selection
- Scanning parameter optimization
- Surface property mapping
- Force curve analysis
- Electrical characterization
- Data interpretation and reporting

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- In-Situ Characterization Experiment Design
- Structure-Property Correlation Analysis

**Required Skills**: afm-spm-analyzer, stm-analyzer

---

#### 5. spectroscopy-analyst
**Description**: Agent specialized in spectroscopic characterization of nanomaterials across multiple techniques.

**Responsibilities**:
- Technique selection for target information
- Measurement protocol development
- Spectrum interpretation
- Cross-technique correlation
- Database searching and matching
- Quantitative analysis

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- Structure-Property Correlation Analysis

**Required Skills**: raman-spectroscopy-analyzer, uv-vis-nir-analyzer, ftir-analyzer, fluorescence-spectroscopy-analyzer

---

#### 6. surface-chemistry-analyst
**Description**: Agent specialized in surface analysis techniques for chemical composition and bonding state characterization.

**Responsibilities**:
- XPS measurement planning
- Chemical state interpretation
- Depth profiling analysis
- Surface contamination identification
- Quantitative surface composition
- ToF-SIMS molecular analysis

**Used By Processes**:
- Nanomaterial Surface Functionalization Pipeline
- Multi-Modal Nanomaterial Characterization Pipeline

**Required Skills**: xps-surface-analyzer, tof-sims-analyzer, contact-angle-analyzer

---

#### 7. particle-sizing-specialist
**Description**: Agent specialized in particle size distribution analysis using multiple complementary techniques.

**Responsibilities**:
- Technique selection based on size range
- Measurement protocol optimization
- Distribution analysis and interpretation
- Cross-technique validation
- Statistical significance assessment
- Stability monitoring

**Used By Processes**:
- Statistical Particle Size Distribution Analysis
- Nanoparticle Synthesis Protocol Development

**Required Skills**: dls-particle-sizer, nta-particle-tracker, tem-image-analyzer, saxs-waxs-analyzer

---

#### 8. crystallography-analyst
**Description**: Agent specialized in crystallographic analysis of nanomaterials using XRD, SAXS/WAXS, and electron diffraction.

**Responsibilities**:
- Phase identification
- Crystallite size determination
- Lattice parameter analysis
- Texture and orientation analysis
- In-situ structure monitoring
- Pair distribution function analysis

**Used By Processes**:
- Multi-Modal Nanomaterial Characterization Pipeline
- Structure-Property Correlation Analysis

**Required Skills**: xrd-crystallography-analyzer, saxs-waxs-analyzer, tem-image-analyzer

---

### Fabrication Agents

#### 9. nanolithography-engineer
**Description**: Agent specialized in nanolithography process development and optimization.

**Responsibilities**:
- Lithography technique selection
- Process window optimization
- Critical dimension control
- Defect reduction strategies
- Pattern transfer development
- Metrology integration

**Used By Processes**:
- Nanolithography Process Development
- Nanodevice Integration Process Flow

**Required Skills**: ebl-process-controller, nanoimprint-process-controller, plasma-etch-controller, cleanroom-metrology-controller

---

#### 10. thin-film-engineer
**Description**: Agent specialized in thin film deposition process development and optimization.

**Responsibilities**:
- Deposition technique selection
- Process parameter optimization
- Film property characterization
- Conformality and uniformity control
- Stress management
- Interface engineering

**Used By Processes**:
- Thin Film Deposition Process Optimization
- Nanodevice Integration Process Flow

**Required Skills**: ald-process-controller, cvd-pvd-process-controller, cleanroom-metrology-controller

---

#### 11. process-integration-engineer
**Description**: Agent specialized in integrating multiple fabrication processes into complete device flows.

**Responsibilities**:
- Process flow design
- Compatibility analysis
- Yield optimization
- Defect root cause analysis
- Process window management
- Documentation and transfer

**Used By Processes**:
- Nanodevice Integration Process Flow
- Directed Self-Assembly Process Development

**Required Skills**: All fabrication skills, cleanroom-protocol-manager, experiment-planner-doe

---

#### 12. self-assembly-specialist
**Description**: Agent specialized in directed self-assembly processes for nanoscale patterning.

**Responsibilities**:
- Block copolymer selection
- Annealing optimization
- Template design
- Defect analysis and reduction
- Pattern transfer development
- Long-range order optimization

**Used By Processes**:
- Directed Self-Assembly Process Development

**Required Skills**: dsa-process-controller, sem-eds-analyzer, afm-spm-analyzer, saxs-waxs-analyzer

---

### Computational Agents

#### 13. dft-computation-specialist
**Description**: Agent specialized in density functional theory calculations for nanomaterial property prediction.

**Responsibilities**:
- Calculation setup and parameterization
- Convergence verification
- Electronic structure analysis
- Property extraction
- Result validation
- Computational resource optimization

**Used By Processes**:
- DFT Calculation Pipeline for Nanomaterials
- Multiscale Modeling Integration

**Required Skills**: vasp-dft-executor, quantum-espresso-executor, materials-database-querier

---

#### 14. molecular-dynamics-specialist
**Description**: Agent specialized in molecular dynamics simulations of nanoscale systems.

**Responsibilities**:
- Force field selection and validation
- System setup and equilibration
- Simulation protocol design
- Trajectory analysis
- Property extraction
- Validation against experiment

**Used By Processes**:
- Molecular Dynamics Simulation Workflow
- Nanoparticle Drug Delivery System Development

**Required Skills**: lammps-md-executor, gromacs-md-executor, ml-materials-predictor

---

#### 15. multiscale-modeling-integrator
**Description**: Agent specialized in integrating computational models across length scales.

**Responsibilities**:
- Scale bridging strategy
- Parameter passing between scales
- Uncertainty quantification
- Validation design
- Result interpretation
- Model refinement

**Used By Processes**:
- Multiscale Modeling Integration
- Machine Learning Materials Discovery Pipeline

**Required Skills**: vasp-dft-executor, lammps-md-executor, comsol-multiphysics-executor, ml-materials-predictor

---

#### 16. materials-informatics-specialist
**Description**: Agent specialized in machine learning for materials discovery and property prediction.

**Responsibilities**:
- Feature engineering
- Model selection and training
- Active learning design
- High-throughput screening
- Validation strategy
- Experimental prioritization

**Used By Processes**:
- Machine Learning Materials Discovery Pipeline
- Structure-Property Correlation Analysis

**Required Skills**: ml-materials-predictor, materials-database-querier, experiment-planner-doe

---

### Applications Agents

#### 17. nanomedicine-formulation-specialist
**Description**: Agent specialized in nanoparticle drug delivery system design and optimization.

**Responsibilities**:
- Formulation design
- Drug loading optimization
- Release kinetics engineering
- Targeting strategy development
- Stability assessment
- Regulatory pathway guidance

**Used By Processes**:
- Nanoparticle Drug Delivery System Development
- Nanomaterial Safety Assessment Pipeline

**Required Skills**: drug-encapsulation-optimizer, targeting-ligand-designer, colloidal-stability-analyzer, cytotoxicity-assay-analyzer

---

#### 18. nanosensor-development-specialist
**Description**: Agent specialized in nanomaterial-based sensor design, fabrication, and validation.

**Responsibilities**:
- Sensor architecture design
- Transduction mechanism selection
- Surface functionalization for selectivity
- Calibration and validation
- Performance optimization
- Application-specific customization

**Used By Processes**:
- Nanosensor Development and Validation Pipeline

**Required Skills**: nanosensor-calibration-manager, ligand-exchange-protocol-manager, uv-vis-nir-analyzer, raman-spectroscopy-analyzer

---

#### 19. nanocatalysis-specialist
**Description**: Agent specialized in nanocatalyst design, synthesis, and performance optimization.

**Responsibilities**:
- Catalyst design and synthesis
- Activity and selectivity optimization
- Mechanistic investigation
- Stability and recyclability testing
- Scale-up considerations
- Application matching

**Used By Processes**:
- Nanocatalyst Development and Performance Optimization

**Required Skills**: nanocatalyst-performance-analyzer, nanoparticle-synthesis-optimizer, tem-image-analyzer, xps-surface-analyzer

---

#### 20. nanotoxicology-specialist
**Description**: Agent specialized in nanomaterial safety assessment and regulatory compliance.

**Responsibilities**:
- Toxicity testing design
- In vitro assay selection
- Environmental fate assessment
- Risk characterization
- Regulatory documentation
- Safety data compilation

**Used By Processes**:
- Nanomaterial Safety Assessment Pipeline

**Required Skills**: cytotoxicity-assay-analyzer, environmental-fate-modeler, iso-nanotechnology-compliance-checker, nanomaterial-sds-generator

---

### Quality and Infrastructure Agents

#### 21. nanofabrication-quality-engineer
**Description**: Agent specialized in quality assurance for nanofabrication processes and products.

**Responsibilities**:
- Quality control protocol development
- Statistical process control
- Metrology strategy
- Failure mode analysis
- Yield improvement
- Documentation and compliance

**Used By Processes**:
- All fabrication processes
- Nanomaterial Scale-Up and Process Transfer

**Required Skills**: cleanroom-metrology-controller, cleanroom-protocol-manager, experiment-planner-doe, iso-nanotechnology-compliance-checker

---

#### 22. characterization-lab-manager
**Description**: Agent specialized in managing multi-technique characterization laboratory operations.

**Responsibilities**:
- Instrument scheduling
- Method validation
- Data quality assurance
- Sample management
- Report generation
- Training and competency

**Used By Processes**:
- All characterization processes

**Required Skills**: characterization-workflow-orchestrator, nanomaterial-lims-manager, All characterization skills

---

## Process to Skills/Agents Mapping

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| Nanoparticle Synthesis Protocol Development | nanoparticle-synthesis-optimizer, colloidal-stability-analyzer, dls-particle-sizer, xrd-crystallography-analyzer, experiment-planner-doe | nanomaterial-synthesis-designer, particle-sizing-specialist |
| Nanomaterial Surface Functionalization Pipeline | ligand-exchange-protocol-manager, xps-surface-analyzer, ftir-analyzer, contact-angle-analyzer, colloidal-stability-analyzer | surface-chemistry-analyst, nanomaterial-synthesis-designer |
| Green Synthesis Route Development | green-synthesis-evaluator, nanoparticle-synthesis-optimizer, environmental-fate-modeler | nanomaterial-synthesis-designer, nanotoxicology-specialist |
| Nanomaterial Scale-Up and Process Transfer | scale-up-process-analyzer, experiment-planner-doe, nanomaterial-lims-manager, iso-nanotechnology-compliance-checker | nanomaterial-synthesis-designer, nanofabrication-quality-engineer |
| Multi-Modal Nanomaterial Characterization Pipeline | tem-image-analyzer, sem-eds-analyzer, afm-spm-analyzer, raman-spectroscopy-analyzer, xps-surface-analyzer, characterization-workflow-orchestrator | electron-microscopy-specialist, spectroscopy-analyst, characterization-lab-manager |
| Statistical Particle Size Distribution Analysis | tem-image-analyzer, dls-particle-sizer, nta-particle-tracker, saxs-waxs-analyzer | particle-sizing-specialist, crystallography-analyst |
| In-Situ Characterization Experiment Design | tem-image-analyzer, afm-spm-analyzer, raman-spectroscopy-analyzer, stm-analyzer | electron-microscopy-specialist, scanning-probe-specialist |
| Structure-Property Correlation Analysis | ml-materials-predictor, materials-database-querier, all characterization skills | materials-informatics-specialist, crystallography-analyst |
| Nanolithography Process Development | ebl-process-controller, nanoimprint-process-controller, plasma-etch-controller, cleanroom-metrology-controller | nanolithography-engineer, process-integration-engineer |
| Thin Film Deposition Process Optimization | ald-process-controller, cvd-pvd-process-controller, cleanroom-metrology-controller, afm-spm-analyzer | thin-film-engineer, nanofabrication-quality-engineer |
| Nanodevice Integration Process Flow | All fabrication skills, cleanroom-protocol-manager | process-integration-engineer, nanolithography-engineer, thin-film-engineer |
| Directed Self-Assembly Process Development | dsa-process-controller, sem-eds-analyzer, afm-spm-analyzer, saxs-waxs-analyzer | self-assembly-specialist, process-integration-engineer |
| DFT Calculation Pipeline for Nanomaterials | vasp-dft-executor, quantum-espresso-executor, materials-database-querier | dft-computation-specialist, multiscale-modeling-integrator |
| Molecular Dynamics Simulation Workflow | lammps-md-executor, gromacs-md-executor | molecular-dynamics-specialist, multiscale-modeling-integrator |
| Machine Learning Materials Discovery Pipeline | ml-materials-predictor, materials-database-querier, experiment-planner-doe | materials-informatics-specialist, dft-computation-specialist |
| Multiscale Modeling Integration | vasp-dft-executor, lammps-md-executor, comsol-multiphysics-executor, nanohub-simulator-interface | multiscale-modeling-integrator, dft-computation-specialist, molecular-dynamics-specialist |
| Nanoparticle Drug Delivery System Development | drug-encapsulation-optimizer, targeting-ligand-designer, dls-particle-sizer, cytotoxicity-assay-analyzer, gromacs-md-executor | nanomedicine-formulation-specialist, nanotoxicology-specialist |
| Nanosensor Development and Validation Pipeline | nanosensor-calibration-manager, ligand-exchange-protocol-manager, uv-vis-nir-analyzer, fluorescence-spectroscopy-analyzer | nanosensor-development-specialist, surface-chemistry-analyst |
| Nanocatalyst Development and Performance Optimization | nanocatalyst-performance-analyzer, nanoparticle-synthesis-optimizer, tem-image-analyzer, xps-surface-analyzer | nanocatalysis-specialist, nanomaterial-synthesis-designer |
| Nanomaterial Safety Assessment Pipeline | cytotoxicity-assay-analyzer, environmental-fate-modeler, iso-nanotechnology-compliance-checker, nanomaterial-sds-generator | nanotoxicology-specialist, nanomedicine-formulation-specialist |

---

## Shared Candidates (Cross-Specialization)

These skills and agents could be shared with other specializations:

### Shared Skills

1. **vasp-dft-executor** - Applicable to Materials Science, Chemistry, Physics specializations
2. **lammps-md-executor** - Useful for Materials Science, Chemistry, Bioinformatics (protein simulations)
3. **gromacs-md-executor** - Applicable to Bioinformatics, Drug Discovery, Biochemistry
4. **comsol-multiphysics-executor** - Multi-physics modeling for any engineering discipline
5. **ml-materials-predictor** - Machine learning for any materials-related specialization
6. **experiment-planner-doe** - Design of Experiments applicable to any experimental science
7. **xrd-crystallography-analyzer** - Crystallography for Materials Science, Chemistry, Geology
8. **sem-eds-analyzer** - SEM/EDS applicable to Materials Science, Geology, Forensics
9. **cytotoxicity-assay-analyzer** - Cell viability for Biomedical, Pharmaceutical specializations
10. **green-synthesis-evaluator** - Sustainability assessment for Chemistry, Chemical Engineering

### Shared Agents

1. **dft-computation-specialist** - DFT expertise applicable to Chemistry, Materials Science, Physics
2. **molecular-dynamics-specialist** - MD expertise applicable to Bioinformatics, Drug Discovery
3. **electron-microscopy-specialist** - EM expertise applicable to Materials Science, Biology
4. **materials-informatics-specialist** - ML for materials applicable to Materials Science, Chemistry

---

## Implementation Priority

### High Priority (Core Nanotechnology Workflows)
1. nanoparticle-synthesis-optimizer
2. tem-image-analyzer
3. dls-particle-sizer
4. xps-surface-analyzer
5. raman-spectroscopy-analyzer
6. ebl-process-controller
7. vasp-dft-executor
8. nanomaterial-synthesis-designer (agent)
9. electron-microscopy-specialist (agent)
10. particle-sizing-specialist (agent)

### Medium Priority (Specialized Analysis)
1. afm-spm-analyzer
2. sem-eds-analyzer
3. ald-process-controller
4. lammps-md-executor
5. ml-materials-predictor
6. drug-encapsulation-optimizer
7. nanocatalyst-performance-analyzer
8. dft-computation-specialist (agent)
9. thin-film-engineer (agent)
10. nanomedicine-formulation-specialist (agent)

### Lower Priority (Advanced and Emerging)
1. stm-analyzer
2. tof-sims-analyzer
3. dsa-process-controller
4. gromacs-md-executor
5. nanohub-simulator-interface
6. environmental-fate-modeler
7. multiscale-modeling-integrator (agent)
8. self-assembly-specialist (agent)
9. nanotoxicology-specialist (agent)

---

## Notes

- All skills should implement standardized input/output schemas following ISO nanotechnology standards where applicable
- Skills should support both local execution and integration with cloud-based HPC resources
- Container compatibility (Docker/Singularity) is essential for computational tools
- Characterization skills must include measurement uncertainty quantification
- Agents should provide detailed reasoning and evidence citations for analysis decisions
- All skills should support data traceability and provenance tracking
- Integration with electronic lab notebooks (ELN) should be prioritized
- Skills should handle both experimental data and computational results
- Error handling should include nanotechnology-specific failure modes (e.g., aggregation, contamination, beam damage)
- Monitoring should include domain-specific QC metrics (size distribution, surface coverage, crystallinity)
- Safety and regulatory compliance must be integrated throughout the workflow
