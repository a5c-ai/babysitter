# Materials Science - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Materials Science processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, computational integration capabilities, and specialized knowledge for materials characterization, testing, simulation, processing, and quality assurance.

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
All 24 processes defined in the processes-backlog.md for this specialization require specialized materials science knowledge across multiple disciplines including crystallography, spectroscopy, mechanical testing, computational materials science, processing, failure analysis, and materials selection. While generic scientific agents can provide basic support, specialized skills and agents with deep materials domain knowledge would significantly enhance process quality and efficiency.

### Goals
- Provide deep expertise in DFT calculations, molecular dynamics, and materials informatics
- Enable integration with industry-standard software (VASP, LAMMPS, Thermo-Calc, GSAS-II)
- Reduce context-switching overhead for complex multi-technique characterization tasks
- Improve accuracy for failure analysis and root cause determination
- Support compliance with ASTM/ISO testing standards and material specifications
- Enable automated data curation and FAIR-compliant data management workflows

---

## Skills Backlog

### SK-001: XRD Analysis Skill
**Slug**: `xrd-analysis`
**Category**: Materials Characterization

**Description**: Deep integration with X-ray diffraction analysis tools for crystal structure determination and phase identification.

**Capabilities**:
- GSAS-II, HighScore, TOPAS workflow automation
- Rietveld refinement parameter optimization
- Phase identification using ICDD PDF database
- Crystallographic parameter extraction (lattice parameters, atomic positions)
- Crystallite size estimation (Scherrer equation, Williamson-Hall)
- Residual stress analysis from peak shifts
- Texture and preferred orientation analysis
- Multi-phase quantitative analysis

**Process Integration**:
- MS-001: XRD Analysis & Phase Identification

**Dependencies**: GSAS-II, HighScore, TOPAS, ICDD PDF database, pymatgen

---

### SK-002: Electron Microscopy Skill
**Slug**: `electron-microscopy`
**Category**: Materials Characterization

**Description**: Comprehensive skill for SEM/TEM analysis including imaging, spectroscopy, and microstructural quantification.

**Capabilities**:
- SEM imaging parameter optimization (accelerating voltage, working distance)
- EDS/WDS elemental mapping and quantification
- EBSD orientation mapping and grain analysis
- TEM diffraction pattern indexing
- HRTEM image simulation and interpretation
- STEM-HAADF and ABF imaging
- In-situ microscopy experiment design
- Image segmentation and particle size analysis

**Process Integration**:
- MS-002: Electron Microscopy Characterization
- MS-017: Root Cause Failure Analysis

**Dependencies**: ImageJ/Fiji, MTEX, Digital Micrograph, INCA, OIM Analysis

---

### SK-003: Spectroscopy Analysis Skill
**Slug**: `spectroscopy-analysis`
**Category**: Materials Characterization

**Description**: Multi-technique spectroscopy workflow skill for chemical bonding and surface composition analysis.

**Capabilities**:
- XPS peak fitting and quantification (CasaXPS integration)
- FTIR spectrum interpretation and library matching
- Raman spectroscopy for phase identification and stress analysis
- NMR chemical shift interpretation (solid-state)
- Auger electron spectroscopy depth profiling
- UV-Vis absorption and reflectance analysis
- Background subtraction and baseline correction
- Multi-technique data correlation

**Process Integration**:
- MS-003: Spectroscopic Analysis Suite

**Dependencies**: CasaXPS, OMNIC, OriginLab, MestReNova, Spectragryph

---

### SK-004: Thermal Analysis Skill
**Slug**: `thermal-analysis`
**Category**: Materials Characterization

**Description**: Skill for thermal characterization workflows including DSC, TGA, and thermomechanical analysis.

**Capabilities**:
- DSC baseline correction and peak integration
- Glass transition temperature (Tg) determination
- Crystallization and melting enthalpy calculation
- TGA decomposition kinetics analysis (Kissinger, FWO methods)
- DTA phase transformation identification
- TMA expansion coefficient calculation
- DMA viscoelastic property extraction (E', E'', tan delta)
- Multi-heating rate kinetic analysis

**Process Integration**:
- MS-004: Thermal Analysis Protocol

**Dependencies**: TA Universal Analysis, Netzsch Proteus, STARe Software, TRIOS

---

### SK-005: Mechanical Testing Skill
**Slug**: `mechanical-testing`
**Category**: Mechanical Testing

**Description**: Comprehensive skill for mechanical property testing per ASTM/ISO standards.

**Capabilities**:
- Tensile test data analysis (yield strength, UTS, elongation, modulus)
- Stress-strain curve digitization and comparison
- Hardness conversion between scales (HRC, HV, HB)
- Impact toughness evaluation (Charpy V-notch, Izod)
- Bend test mandrel diameter selection
- Compression test with barreling correction
- Statistical analysis of mechanical data
- Test specification selection (ASTM E8, ISO 6892)

**Process Integration**:
- MS-005: Mechanical Properties Testing
- MS-017: Root Cause Failure Analysis

**Dependencies**: Bluehill, TestXpert, Instron WaveMatrix, MTS TestSuite

---

### SK-006: Fatigue and Fracture Skill
**Slug**: `fatigue-fracture`
**Category**: Mechanical Testing

**Description**: Specialized skill for fatigue life prediction and fracture mechanics analysis.

**Capabilities**:
- S-N curve fitting and fatigue limit estimation
- Strain-life (epsilon-N) analysis
- Paris law crack growth parameter extraction
- Fracture toughness (KIC) calculation per ASTM E399
- CTOD and J-integral analysis
- Stress intensity factor solutions for standard geometries
- Variable amplitude fatigue analysis
- Fractographic feature identification (striations, beach marks)

**Process Integration**:
- MS-006: Fatigue & Fracture Analysis
- MS-017: Root Cause Failure Analysis

**Dependencies**: FE-Safe, nCode, AFGROW, NASGRO, ImageJ

---

### SK-007: Creep Analysis Skill
**Slug**: `creep-analysis`
**Category**: Mechanical Testing

**Description**: Skill for creep and stress-rupture testing and life prediction.

**Capabilities**:
- Creep curve analysis (primary, secondary, tertiary)
- Minimum creep rate extraction
- Larson-Miller parameter calculation
- Stress-rupture data fitting
- Creep deformation mechanism mapping
- Time-temperature parameter methods
- Monkman-Grant relationship application
- Microstructural stability assessment

**Process Integration**:
- MS-007: Creep & High-Temperature Testing

**Dependencies**: MATLAB, Origin, specialized creep analysis software

---

### SK-008: DFT Calculation Skill
**Slug**: `dft-calculation`
**Category**: Computational Materials Science

**Description**: Expert skill for density functional theory calculations using VASP and Quantum ESPRESSO.

**Capabilities**:
- VASP/QE input file generation and validation
- k-point mesh optimization
- Exchange-correlation functional selection (PBE, HSE06, PBEsol)
- Pseudopotential selection and testing
- Electronic structure analysis (band structure, DOS)
- Formation energy calculation
- Elastic constant computation
- Phonon dispersion calculation (DFPT, finite difference)

**Process Integration**:
- MS-008: DFT Electronic Structure Calculation
- MS-010: High-Throughput Computational Screening

**Dependencies**: VASP, Quantum ESPRESSO, pymatgen, ASE, VASPKIT, phonopy

---

### SK-009: Molecular Dynamics Skill
**Slug**: `molecular-dynamics`
**Category**: Computational Materials Science

**Description**: Comprehensive skill for molecular dynamics simulations using LAMMPS.

**Capabilities**:
- LAMMPS input script generation
- Interatomic potential selection (EAM, MEAM, ReaxFF, ML potentials)
- Thermalization and equilibration protocols
- Thermal conductivity calculation (Green-Kubo, NEMD)
- Mechanical deformation simulation (tension, compression, shear)
- Diffusion coefficient computation (MSD analysis)
- Phase transformation kinetics
- Visualization and trajectory analysis (OVITO, VMD)

**Process Integration**:
- MS-009: Molecular Dynamics Simulation

**Dependencies**: LAMMPS, OVITO, ASE, VMD, MDAnalysis, atomsk

---

### SK-010: High-Throughput Screening Skill
**Slug**: `high-throughput-screening`
**Category**: Computational Materials Science

**Description**: Automated screening workflow skill using materials databases.

**Capabilities**:
- Materials Project API queries and filtering
- AFLOW REST API integration
- Stability hull analysis and filtering
- Property-based candidate selection
- Automated DFT workflow orchestration (atomate, AiiDA)
- Descriptor generation for ML models
- Database cross-referencing
- Results aggregation and ranking

**Process Integration**:
- MS-010: High-Throughput Computational Screening
- MS-021: Systematic Materials Selection

**Dependencies**: Materials Project API, AFLOW, atomate, AiiDA, fireworks, pymatgen

---

### SK-011: CALPHAD Modeling Skill
**Slug**: `calphad-modeling`
**Category**: Computational Materials Science

**Description**: Skill for thermodynamic database development and phase diagram calculation.

**Capabilities**:
- Thermo-Calc/FactSage scripting automation
- Phase diagram calculation and mapping
- Equilibrium phase composition prediction
- Scheil solidification simulation
- Thermodynamic database assessment
- DICTRA diffusion simulation setup
- Activity and driving force calculation
- Multi-component phase equilibria

**Process Integration**:
- MS-011: CALPHAD Phase Diagram Modeling
- MS-013: Heat Treatment Optimization

**Dependencies**: Thermo-Calc, FactSage, Pandat, TC-Python, DICTRA

---

### SK-012: ML Materials Prediction Skill
**Slug**: `ml-materials-prediction`
**Category**: Computational Materials Science

**Description**: Machine learning skill for materials property prediction.

**Capabilities**:
- Feature engineering with matminer descriptors
- Graph neural network models (CGCNN, MEGNet, SchNet)
- SISSO symbolic regression
- Property prediction model training and validation
- Uncertainty quantification for predictions
- Active learning workflow design
- Model interpretability analysis (SHAP, feature importance)
- Transfer learning from pre-trained models

**Process Integration**:
- MS-012: ML Materials Property Prediction
- MS-024: Uncertainty Quantification Protocol

**Dependencies**: matminer, CGCNN, MEGNet, scikit-learn, PyTorch, TensorFlow

---

### SK-013: Heat Treatment Optimization Skill
**Slug**: `heat-treatment-optimization`
**Category**: Processing

**Description**: Skill for designing and optimizing heat treatment schedules.

**Capabilities**:
- TTT and CCT diagram interpretation
- Austenitizing temperature selection
- Quench severity estimation (H-values)
- Tempering parameter optimization
- Age hardening schedule design
- Solution treatment parameters
- Retained austenite prediction
- Hardness profile prediction (Jominy correlation)

**Process Integration**:
- MS-013: Heat Treatment Optimization

**Dependencies**: JMatPro, DANTE, Thermo-Calc, DICTRA

---

### SK-014: Powder Metallurgy Skill
**Slug**: `powder-metallurgy`
**Category**: Processing

**Description**: Skill for powder processing and sintering parameter development.

**Capabilities**:
- Powder characterization (PSD, morphology, flowability)
- Compaction pressure optimization
- Sintering temperature and atmosphere selection
- Densification kinetics modeling
- Hot isostatic pressing (HIP) parameter design
- Debinding schedule optimization
- Green and sintered density calculation
- Porosity and pore distribution analysis

**Process Integration**:
- MS-014: Powder Processing & Sintering
- MS-016: Additive Manufacturing Qualification

**Dependencies**: ImageJ, powder analysis software, sintering simulation tools

---

### SK-015: Thin Film Deposition Skill
**Slug**: `thin-film-deposition`
**Category**: Processing

**Description**: Skill for thin film process development and characterization.

**Capabilities**:
- PVD process parameter optimization (power, pressure, target distance)
- CVD precursor selection and flow rate design
- ALD cycle design and saturation curve analysis
- Film thickness measurement (ellipsometry, profilometry)
- Stress measurement and management
- Adhesion testing (scratch test, peel test)
- Composition and uniformity mapping
- Interface analysis and diffusion barriers

**Process Integration**:
- MS-015: Thin Film Deposition Protocol

**Dependencies**: Ellipsometry software, XRR analysis, scratch test analysis

---

### SK-016: Additive Manufacturing Skill
**Slug**: `additive-manufacturing`
**Category**: Processing

**Description**: Skill for AM process qualification and parameter optimization.

**Capabilities**:
- SLM/EBM parameter optimization (laser power, scan speed, hatch spacing)
- Build orientation and support strategy
- Residual stress prediction and mitigation
- Porosity and defect analysis
- Melt pool monitoring data analysis
- Post-processing requirements (stress relief, HIP)
- Microstructure prediction (columnar vs equiaxed)
- Surface roughness characterization

**Process Integration**:
- MS-016: Additive Manufacturing Qualification

**Dependencies**: Simulation software (Ansys AM, Simufact), CT analysis, ImageJ

---

### SK-017: Failure Analysis Skill
**Slug**: `failure-analysis`
**Category**: Failure Analysis

**Description**: Systematic skill for root cause failure analysis investigation.

**Capabilities**:
- Visual examination documentation and photography
- Fracture mode identification (ductile, brittle, fatigue, creep)
- Fractography interpretation (SEM)
- Metallographic preparation and etching selection
- Chemical analysis interpretation (EDS, XRF, OES)
- Failure mechanism correlation
- Fishbone diagram construction
- Root cause determination methodology (5-Why, fault tree)

**Process Integration**:
- MS-017: Root Cause Failure Analysis

**Dependencies**: Image analysis software, EDS software, metallographic databases

---

### SK-018: Corrosion Assessment Skill
**Slug**: `corrosion-assessment`
**Category**: Failure Analysis

**Description**: Skill for corrosion mechanism evaluation and protection strategies.

**Capabilities**:
- Electrochemical testing (potentiodynamic, EIS, linear polarization)
- Salt spray test protocol design (ASTM B117)
- Immersion and cyclic corrosion testing
- Corrosion rate calculation (mpy, mm/year)
- Corrosion mechanism identification (pitting, crevice, galvanic, SCC)
- Pourbaix diagram interpretation
- Cathodic protection design
- Coating and inhibitor selection

**Process Integration**:
- MS-018: Corrosion & Degradation Assessment

**Dependencies**: Gamry Echem Analyst, Nova, EC-Lab, corrview

---

### SK-019: NDT Methods Skill
**Slug**: `ndt-methods`
**Category**: Quality Assurance

**Description**: Skill for non-destructive testing method selection and implementation.

**Capabilities**:
- Ultrasonic testing parameter selection (frequency, probe angle)
- Radiographic technique specification (kV, exposure)
- Magnetic particle testing (AC vs DC, wet vs dry)
- Liquid penetrant selection (Type I vs II, sensitivity level)
- Eddy current testing for crack and conductivity
- Phased array ultrasonic setup
- Defect sizing and characterization
- Acceptance criteria application (AWS, ASTM, API)

**Process Integration**:
- MS-019: Non-Destructive Testing Protocol
- MS-017: Root Cause Failure Analysis

**Dependencies**: UT analysis software, image processing, RT digitization

---

### SK-020: Materials Specification Skill
**Slug**: `materials-specification`
**Category**: Quality Assurance

**Description**: Skill for creating comprehensive material specifications.

**Capabilities**:
- Composition limit definition
- Property requirement specification
- Test method selection and frequency
- Acceptance criteria development
- Statistical tolerance analysis
- Traceability requirements
- Certification and documentation requirements
- Specification cross-referencing (AMS, ASTM, SAE)

**Process Integration**:
- MS-020: Materials Specification Development

**Dependencies**: Standards databases, specification management systems

---

### SK-021: Ashby Materials Selection Skill
**Slug**: `ashby-selection`
**Category**: Materials Selection

**Description**: Systematic skill for engineering material selection using Ashby methodology.

**Capabilities**:
- Performance index derivation
- Property chart generation and screening
- Material class comparison
- Multi-objective optimization (Pareto front)
- Constraint specification and filtering
- Trade-off analysis
- Eco-audit and sustainability metrics
- Cost modeling integration

**Process Integration**:
- MS-021: Systematic Materials Selection

**Dependencies**: Granta Selector, CES EduPack, matplotlib

---

### SK-022: Composite Design Skill
**Slug**: `composite-design`
**Category**: Materials Selection

**Description**: Skill for fiber-reinforced composite design and optimization.

**Capabilities**:
- Classical laminate theory (CLT) calculations
- Stacking sequence optimization
- Failure criteria application (Tsai-Wu, Hashin, Puck)
- Ply failure and progressive damage analysis
- Manufacturing constraint integration (drape, minimum ply drops)
- Laminate optimization for buckling
- Hygrothermal effects analysis
- Repair analysis and design

**Process Integration**:
- MS-022: Composite Design & Optimization

**Dependencies**: ESACOMP, HyperSizer, Laminator, ABAQUS, eLaminate

---

### SK-023: Materials Database Skill
**Slug**: `materials-database`
**Category**: Data Management

**Description**: Skill for FAIR-compliant materials data management and curation.

**Capabilities**:
- Metadata schema development (Dublin Core, materials-specific)
- Data provenance tracking
- Database query and integration (Materials Project, ICSD, ASM)
- Data validation and quality checks
- DOI and persistent identifier management
- Data format conversion (CIF, POSCAR, JSON)
- Ontology mapping (ChEBI, MatOnto)
- FAIR assessment and improvement

**Process Integration**:
- MS-023: Materials Database Curation
- MS-010: High-Throughput Computational Screening

**Dependencies**: MongoDB, PostgreSQL, pymatgen, ASE, OPTIMADE

---

### SK-024: Uncertainty Quantification Skill
**Slug**: `uncertainty-quantification`
**Category**: Data Management

**Description**: Skill for uncertainty analysis in materials measurements and predictions.

**Capabilities**:
- GUM-compliant uncertainty evaluation
- Error propagation calculations
- Type A and Type B uncertainty estimation
- Sensitivity analysis (Sobol indices, Morris screening)
- Monte Carlo uncertainty propagation
- Bayesian inference for parameter estimation
- Model validation metrics (RMSE, MAE, R-squared)
- Confidence and prediction interval calculation

**Process Integration**:
- MS-024: Uncertainty Quantification Protocol
- MS-012: ML Materials Property Prediction

**Dependencies**: UncertainPy, SALib, PyMC, scipy.stats, emcee

---

### SK-025: Crystallography Analysis Skill
**Slug**: `crystallography-analysis`
**Category**: Materials Characterization

**Description**: Advanced skill for crystallographic structure analysis and determination.

**Capabilities**:
- Space group determination and symmetry analysis
- Atomic position refinement
- Disorder and defect modeling
- Structure factor calculation
- Pair distribution function (PDF) analysis
- Neutron diffraction data analysis
- Single-crystal structure solution
- Reciprocal space mapping interpretation

**Process Integration**:
- MS-001: XRD Analysis & Phase Identification
- MS-002: Electron Microscopy Characterization

**Dependencies**: GSAS-II, VESTA, CrystalMaker, Mercury, PDFgui

---

### SK-026: Metallurgical Analysis Skill
**Slug**: `metallurgical-analysis`
**Category**: Materials Characterization

**Description**: Specialized skill for metallic materials analysis and metallography.

**Capabilities**:
- Metallographic preparation protocol selection
- Etching reagent selection for different alloys
- Grain size measurement (ASTM E112, intercept method)
- Phase fraction quantification (point count, image analysis)
- Inclusion rating (ASTM E45)
- Banding and segregation assessment
- Prior austenite grain boundary revelation
- Weld microstructure evaluation (HAZ mapping)

**Process Integration**:
- MS-002: Electron Microscopy Characterization
- MS-017: Root Cause Failure Analysis

**Dependencies**: ImageJ, Clemex, metallographic standards databases

---

### SK-027: Polymer Characterization Skill
**Slug**: `polymer-characterization`
**Category**: Materials Characterization

**Description**: Specialized skill for polymer materials analysis.

**Capabilities**:
- Molecular weight distribution analysis (GPC/SEC)
- Thermal transition identification (Tg, Tm, Tc)
- Crystallinity determination (DSC, XRD)
- Rheological property analysis (viscosity, viscoelasticity)
- Chemical structure verification (FTIR, NMR)
- Degradation pathway analysis
- Additive and filler content determination
- Polymer blend compatibility assessment

**Process Integration**:
- MS-003: Spectroscopic Analysis Suite
- MS-004: Thermal Analysis Protocol

**Dependencies**: GPC software, rheometer software, FTIR libraries

---

### SK-028: Surface Analysis Skill
**Slug**: `surface-analysis`
**Category**: Materials Characterization

**Description**: Skill for surface composition and topography analysis.

**Capabilities**:
- XPS depth profiling and chemical state analysis
- AFM imaging and roughness quantification
- Contact angle measurement and surface energy calculation
- Profilometry data analysis
- Surface contamination identification
- Tribological surface analysis
- Coating thickness measurement
- Adhesion mechanism analysis

**Process Integration**:
- MS-003: Spectroscopic Analysis Suite
- MS-015: Thin Film Deposition Protocol

**Dependencies**: CasaXPS, Gwyddion, AFM analysis software, ImageJ

---

## Agents Backlog

### AG-001: Materials Characterization Specialist Agent
**Slug**: `characterization-specialist`
**Category**: Materials Characterization

**Description**: Senior materials scientist for comprehensive characterization strategy and data interpretation.

**Expertise Areas**:
- Multi-technique characterization strategy
- XRD, SEM, TEM methodology and best practices
- Spectroscopy interpretation (XPS, FTIR, Raman, NMR)
- Thermal analysis and phase transformation
- Sample preparation optimization
- Data correlation across techniques
- Artifact identification and mitigation
- Characterization report preparation

**Persona**:
- Role: Principal Materials Scientist
- Experience: 15+ years materials characterization
- Background: Metals, ceramics, polymers, composites across industries

**Process Integration**:
- MS-001: XRD Analysis & Phase Identification (all phases)
- MS-002: Electron Microscopy Characterization (all phases)
- MS-003: Spectroscopic Analysis Suite (all phases)
- MS-004: Thermal Analysis Protocol (all phases)

---

### AG-002: Mechanical Testing Specialist Agent
**Slug**: `mechanical-testing-specialist`
**Category**: Mechanical Testing

**Description**: Expert in mechanical property testing and data interpretation.

**Expertise Areas**:
- Tensile, compression, and hardness testing
- Fatigue and fracture mechanics
- Creep and stress-rupture testing
- High and low temperature testing
- ASTM/ISO standard compliance
- Statistical analysis of mechanical data
- Test fixture design and validation
- Correlation of properties with microstructure

**Persona**:
- Role: Senior Mechanical Test Engineer
- Experience: 12+ years mechanical testing
- Background: Aerospace, automotive, and energy sectors

**Process Integration**:
- MS-005: Mechanical Properties Testing (all phases)
- MS-006: Fatigue & Fracture Analysis (all phases)
- MS-007: Creep & High-Temperature Testing (all phases)

---

### AG-003: Computational Materials Scientist Agent
**Slug**: `computational-materials-specialist`
**Category**: Computational Materials Science

**Description**: Expert in atomistic simulation and materials informatics.

**Expertise Areas**:
- Density functional theory (DFT) calculations
- Molecular dynamics simulation
- High-throughput computational screening
- Machine learning for materials
- Electronic structure analysis
- Thermodynamic and kinetic modeling
- Interatomic potential development
- Computational workflow automation

**Persona**:
- Role: Principal Computational Materials Scientist
- Experience: 14+ years computational materials
- Background: HPC, DFT, MD, materials informatics

**Process Integration**:
- MS-008: DFT Electronic Structure Calculation (all phases)
- MS-009: Molecular Dynamics Simulation (all phases)
- MS-010: High-Throughput Computational Screening (all phases)
- MS-012: ML Materials Property Prediction (all phases)

---

### AG-004: Thermodynamics and CALPHAD Specialist Agent
**Slug**: `calphad-specialist`
**Category**: Computational Materials Science

**Description**: Expert in thermodynamic modeling and phase diagram calculation.

**Expertise Areas**:
- CALPHAD methodology and database development
- Phase diagram calculation and interpretation
- Solidification modeling (Scheil, equilibrium)
- Thermodynamic database assessment
- Diffusion simulation (DICTRA)
- Activity and driving force analysis
- Multi-component alloy design
- Heat treatment optimization

**Persona**:
- Role: Senior Thermodynamics Engineer
- Experience: 12+ years CALPHAD modeling
- Background: Alloy development, steels, superalloys, high-entropy alloys

**Process Integration**:
- MS-011: CALPHAD Phase Diagram Modeling (all phases)
- MS-013: Heat Treatment Optimization (all phases)

---

### AG-005: Process Metallurgist Agent
**Slug**: `process-metallurgist`
**Category**: Processing

**Description**: Expert in metal processing and manufacturing optimization.

**Expertise Areas**:
- Heat treatment design and optimization
- Powder metallurgy and sintering
- Additive manufacturing process development
- Casting and solidification
- Deformation processing (forging, rolling)
- Microstructure-property relationships
- Process-structure-property optimization
- Scale-up from lab to production

**Persona**:
- Role: Principal Process Metallurgist
- Experience: 15+ years process metallurgy
- Background: Steel, aluminum, titanium, nickel alloys

**Process Integration**:
- MS-013: Heat Treatment Optimization (all phases)
- MS-014: Powder Processing & Sintering (all phases)
- MS-016: Additive Manufacturing Qualification (all phases)

---

### AG-006: Thin Film Specialist Agent
**Slug**: `thin-film-specialist`
**Category**: Processing

**Description**: Expert in thin film deposition and surface engineering.

**Expertise Areas**:
- PVD process development (sputtering, evaporation)
- CVD and ALD process design
- Film characterization (thickness, composition, stress)
- Adhesion and interface engineering
- Functional coating design
- Semiconductor processing
- Tribological coatings
- Optical and electronic thin films

**Persona**:
- Role: Senior Thin Film Engineer
- Experience: 12+ years thin film processing
- Background: Semiconductor, wear-resistant coatings, optical films

**Process Integration**:
- MS-015: Thin Film Deposition Protocol (all phases)

---

### AG-007: Failure Analysis Specialist Agent
**Slug**: `failure-analyst`
**Category**: Failure Analysis

**Description**: Expert in materials failure investigation and root cause determination.

**Expertise Areas**:
- Systematic failure investigation methodology
- Fractography and fracture mode identification
- Metallographic examination
- Chemical and compositional analysis
- Stress analysis and loading reconstruction
- Failure mechanism correlation
- Root cause determination
- Corrective action recommendations

**Persona**:
- Role: Principal Failure Analyst
- Experience: 18+ years failure analysis
- Background: Aerospace, automotive, energy, manufacturing

**Process Integration**:
- MS-017: Root Cause Failure Analysis (all phases)

---

### AG-008: Corrosion Engineer Agent
**Slug**: `corrosion-engineer`
**Category**: Failure Analysis

**Description**: Expert in corrosion mechanisms, testing, and protection strategies.

**Expertise Areas**:
- Corrosion mechanism identification
- Electrochemical testing and interpretation
- Accelerated corrosion testing
- Materials selection for corrosive environments
- Cathodic and anodic protection design
- Coating system selection and evaluation
- Stress corrosion cracking assessment
- Corrosion failure investigation

**Persona**:
- Role: Senior Corrosion Engineer
- Experience: 14+ years corrosion engineering
- Background: Oil and gas, marine, chemical processing, infrastructure

**Process Integration**:
- MS-018: Corrosion & Degradation Assessment (all phases)
- MS-017: Root Cause Failure Analysis (corrosion aspects)

---

### AG-009: NDT Specialist Agent
**Slug**: `ndt-specialist`
**Category**: Quality Assurance

**Description**: Expert in non-destructive testing methods and defect detection.

**Expertise Areas**:
- Ultrasonic testing (UT, PAUT, TOFD)
- Radiographic testing (RT, CR, DR)
- Magnetic particle and liquid penetrant testing
- Eddy current testing
- Visual and optical inspection
- Method selection for different materials and defects
- Acceptance criteria application
- Procedure development and qualification

**Persona**:
- Role: Level III NDT Inspector
- Experience: 15+ years NDT
- Background: Aerospace, petrochemical, power generation, manufacturing

**Process Integration**:
- MS-019: Non-Destructive Testing Protocol (all phases)

---

### AG-010: Materials Selection Specialist Agent
**Slug**: `materials-selection-specialist`
**Category**: Materials Selection

**Description**: Expert in systematic materials selection for engineering applications.

**Expertise Areas**:
- Ashby methodology and performance indices
- Multi-criteria decision analysis
- Property-process-performance relationships
- Cost-benefit analysis
- Sustainability and lifecycle considerations
- Material substitution strategies
- Application-specific material selection
- Specification development

**Persona**:
- Role: Principal Materials Engineer
- Experience: 16+ years materials selection
- Background: Product development, aerospace, automotive, medical devices

**Process Integration**:
- MS-021: Systematic Materials Selection (all phases)
- MS-020: Materials Specification Development (all phases)

---

### AG-011: Composite Materials Specialist Agent
**Slug**: `composite-specialist`
**Category**: Materials Selection

**Description**: Expert in composite material design, analysis, and manufacturing.

**Expertise Areas**:
- Fiber-reinforced composite design
- Laminate analysis and optimization
- Failure criteria and damage mechanics
- Manufacturing process selection
- Composite testing and characterization
- Repair design and analysis
- Joining and assembly
- Certification and qualification

**Persona**:
- Role: Senior Composite Engineer
- Experience: 14+ years composites
- Background: Aerospace structures, automotive, wind energy, sporting goods

**Process Integration**:
- MS-022: Composite Design & Optimization (all phases)

---

### AG-012: Materials Informatics Specialist Agent
**Slug**: `materials-informatics-specialist`
**Category**: Data Management

**Description**: Expert in materials data management and informatics.

**Expertise Areas**:
- FAIR data principles implementation
- Materials database design and curation
- Metadata standards and ontologies
- Data quality and validation
- Machine learning data pipelines
- Knowledge graph development
- Data integration and interoperability
- Reproducibility and provenance

**Persona**:
- Role: Principal Data Scientist (Materials)
- Experience: 10+ years materials informatics
- Background: Materials databases, ML for materials, data engineering

**Process Integration**:
- MS-023: Materials Database Curation (all phases)
- MS-024: Uncertainty Quantification Protocol (all phases)

---

### AG-013: Ceramicist Agent
**Slug**: `ceramicist`
**Category**: Materials Specialist

**Description**: Expert in ceramic materials science and engineering.

**Expertise Areas**:
- Structural and functional ceramics
- Ceramic processing (sintering, hot pressing, slip casting)
- Phase equilibria in oxide and non-oxide systems
- Mechanical properties of brittle materials
- High-temperature behavior
- Electronic and optical ceramics
- Ceramic coatings and composites
- Defect chemistry and ionic conductivity

**Persona**:
- Role: Senior Ceramic Scientist
- Experience: 14+ years ceramics
- Background: Structural ceramics, electronic ceramics, refractories

**Process Integration**:
- MS-001, MS-002, MS-004 (ceramic-specific applications)
- MS-014: Powder Processing & Sintering (ceramics)

---

### AG-014: Polymer Scientist Agent
**Slug**: `polymer-scientist`
**Category**: Materials Specialist

**Description**: Expert in polymer science and engineering.

**Expertise Areas**:
- Polymer synthesis and characterization
- Molecular weight and chain structure
- Thermal transitions and crystallinity
- Mechanical and rheological properties
- Polymer processing (extrusion, molding, film)
- Degradation mechanisms
- Polymer composites and blends
- Biopolymers and sustainable materials

**Persona**:
- Role: Principal Polymer Scientist
- Experience: 15+ years polymer science
- Background: Thermoplastics, thermosets, elastomers, composites

**Process Integration**:
- MS-003, MS-004 (polymer-specific applications)
- MS-005, MS-006 (polymer testing)

---

### AG-015: Additive Manufacturing Specialist Agent
**Slug**: `additive-manufacturing-specialist`
**Category**: Processing

**Description**: Expert in metal additive manufacturing process development.

**Expertise Areas**:
- SLM/LPBF process optimization
- EBM process development
- DED and wire-arc AM
- Parameter-microstructure relationships
- Defect identification and mitigation
- Post-processing requirements
- Part qualification and certification
- Design for additive manufacturing

**Persona**:
- Role: Senior AM Process Engineer
- Experience: 10+ years additive manufacturing
- Background: Aerospace, medical, tooling, energy

**Process Integration**:
- MS-016: Additive Manufacturing Qualification (all phases)

---

---

## Process-to-Skill/Agent Mapping

| Process ID | Process Name | Primary Skills | Primary Agents |
|-----------|--------------|----------------|----------------|
| MS-001 | XRD Analysis & Phase Identification | SK-001, SK-025 | AG-001 |
| MS-002 | Electron Microscopy Characterization | SK-002, SK-025, SK-026 | AG-001 |
| MS-003 | Spectroscopic Analysis Suite | SK-003, SK-027, SK-028 | AG-001, AG-014 |
| MS-004 | Thermal Analysis Protocol | SK-004, SK-027 | AG-001, AG-014 |
| MS-005 | Mechanical Properties Testing | SK-005 | AG-002 |
| MS-006 | Fatigue & Fracture Analysis | SK-005, SK-006 | AG-002, AG-007 |
| MS-007 | Creep & High-Temperature Testing | SK-005, SK-007 | AG-002 |
| MS-008 | DFT Electronic Structure Calculation | SK-008 | AG-003 |
| MS-009 | Molecular Dynamics Simulation | SK-009 | AG-003 |
| MS-010 | High-Throughput Computational Screening | SK-008, SK-010, SK-023 | AG-003, AG-012 |
| MS-011 | CALPHAD Phase Diagram Modeling | SK-011 | AG-004 |
| MS-012 | ML Materials Property Prediction | SK-012, SK-024 | AG-003, AG-012 |
| MS-013 | Heat Treatment Optimization | SK-011, SK-013, SK-026 | AG-004, AG-005 |
| MS-014 | Powder Processing & Sintering | SK-014 | AG-005, AG-013 |
| MS-015 | Thin Film Deposition Protocol | SK-015, SK-028 | AG-006 |
| MS-016 | Additive Manufacturing Qualification | SK-014, SK-016 | AG-005, AG-015 |
| MS-017 | Root Cause Failure Analysis | SK-002, SK-005, SK-006, SK-017, SK-019, SK-026 | AG-007, AG-001, AG-002 |
| MS-018 | Corrosion & Degradation Assessment | SK-018 | AG-008 |
| MS-019 | Non-Destructive Testing Protocol | SK-019 | AG-009 |
| MS-020 | Materials Specification Development | SK-020 | AG-010 |
| MS-021 | Systematic Materials Selection | SK-010, SK-021 | AG-010 |
| MS-022 | Composite Design & Optimization | SK-022 | AG-011 |
| MS-023 | Materials Database Curation | SK-023 | AG-012 |
| MS-024 | Uncertainty Quantification Protocol | SK-024 | AG-003, AG-012 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-005 | Mechanical Testing | Mechanical Engineering, Aerospace, Automotive, Biomedical |
| SK-006 | Fatigue and Fracture | Aerospace Engineering, Mechanical Engineering, Civil Engineering |
| SK-008 | DFT Calculation | Chemistry, Physics, Chemical Engineering, Nanotechnology |
| SK-009 | Molecular Dynamics | Chemistry, Biochemistry, Chemical Engineering, Physics |
| SK-012 | ML Materials Prediction | Chemistry, Physics, Data Science, Chemical Engineering |
| SK-016 | Additive Manufacturing | Mechanical Engineering, Aerospace, Biomedical, Manufacturing |
| SK-019 | NDT Methods | Aerospace, Oil & Gas, Power Generation, Manufacturing |
| SK-022 | Composite Design | Aerospace, Automotive, Marine, Civil Engineering |
| SK-024 | Uncertainty Quantification | All scientific and engineering domains |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-002 | Mechanical Testing Specialist | Mechanical Engineering, Aerospace, Automotive |
| AG-003 | Computational Materials Scientist | Chemistry, Physics, Chemical Engineering |
| AG-007 | Failure Analysis Specialist | Mechanical Engineering, Aerospace, Manufacturing, Quality |
| AG-009 | NDT Specialist | Aerospace, Oil & Gas, Nuclear, Power Generation |
| AG-011 | Composite Materials Specialist | Aerospace, Automotive, Marine, Wind Energy |
| AG-015 | Additive Manufacturing Specialist | Aerospace, Biomedical, Tooling, Manufacturing |

---

## Implementation Priority

### Phase 1: Core Characterization Skills (High Impact)
1. **SK-001**: XRD Analysis - Foundation for phase identification
2. **SK-002**: Electron Microscopy - Critical for microstructure analysis
3. **SK-003**: Spectroscopy Analysis - Chemical state determination
4. **SK-005**: Mechanical Testing - Essential property measurement

### Phase 2: Core Analysis Agents (High Impact)
1. **AG-001**: Materials Characterization Specialist - Characterization leadership
2. **AG-002**: Mechanical Testing Specialist - Testing expertise
3. **AG-007**: Failure Analysis Specialist - Root cause investigation
4. **AG-010**: Materials Selection Specialist - Application guidance

### Phase 3: Computational Materials Science
1. **SK-008**: DFT Calculation
2. **SK-009**: Molecular Dynamics
3. **SK-010**: High-Throughput Screening
4. **SK-011**: CALPHAD Modeling
5. **AG-003**: Computational Materials Scientist
6. **AG-004**: Thermodynamics and CALPHAD Specialist

### Phase 4: Processing Skills
1. **SK-013**: Heat Treatment Optimization
2. **SK-014**: Powder Metallurgy
3. **SK-015**: Thin Film Deposition
4. **SK-016**: Additive Manufacturing
5. **AG-005**: Process Metallurgist
6. **AG-006**: Thin Film Specialist
7. **AG-015**: Additive Manufacturing Specialist

### Phase 5: Failure Analysis and Quality
1. **SK-006**: Fatigue and Fracture
2. **SK-017**: Failure Analysis
3. **SK-018**: Corrosion Assessment
4. **SK-019**: NDT Methods
5. **AG-008**: Corrosion Engineer
6. **AG-009**: NDT Specialist

### Phase 6: Advanced Characterization
1. **SK-004**: Thermal Analysis
2. **SK-025**: Crystallography Analysis
3. **SK-026**: Metallurgical Analysis
4. **SK-027**: Polymer Characterization
5. **SK-028**: Surface Analysis
6. **AG-013**: Ceramicist
7. **AG-014**: Polymer Scientist

### Phase 7: Machine Learning and Data Management
1. **SK-012**: ML Materials Prediction
2. **SK-023**: Materials Database
3. **SK-024**: Uncertainty Quantification
4. **AG-012**: Materials Informatics Specialist

### Phase 8: Materials Selection and Design
1. **SK-007**: Creep Analysis
2. **SK-020**: Materials Specification
3. **SK-021**: Ashby Materials Selection
4. **SK-022**: Composite Design
5. **AG-011**: Composite Materials Specialist

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 28 |
| Agents Identified | 15 |
| Shared Skill Candidates | 9 |
| Shared Agent Candidates | 6 |
| Total Processes Covered | 24 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
