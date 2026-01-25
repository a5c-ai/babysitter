# Physics - Skills and Agents Backlog (Phase 4)

## Overview

This backlog identifies specialized skills and agents that could enhance the Physics processes beyond general-purpose capabilities. Each skill or agent is designed to provide domain-specific tooling, validation, or automation for physics research workflows across theoretical, experimental, computational, and applied physics domains.

## Summary Statistics

- **Total Skills Identified**: 36
- **Total Agents Identified**: 24
- **Shared Candidates (Cross-Specialization)**: 12
- **Categories**: 8 (Numerical Simulation, Particle Physics, Condensed Matter, Optics, Quantum Mechanics, Cosmology, Data Analysis, Lab Automation)

---

## Skills

### Numerical Simulation Skills

#### 1. lammps-md-simulator
**Description**: LAMMPS molecular dynamics simulation skill for atomistic simulations, force field setup, and large-scale parallel computations.

**Capabilities**:
- Input script generation and validation
- Force field selection (EAM, Tersoff, ReaxFF)
- Boundary condition and ensemble configuration
- Thermodynamic property extraction
- Trajectory file analysis
- Parallel run optimization (MPI/GPU)

**Used By Processes**:
- Molecular Dynamics Simulation Setup
- High-Performance Computing Workflow
- Material Synthesis and Characterization

**Tools/Libraries**: LAMMPS, OVITO, MDAnalysis

---

#### 2. gromacs-biosim-runner
**Description**: GROMACS molecular dynamics skill specialized for biomolecular systems, protein simulations, and free energy calculations.

**Capabilities**:
- Topology preparation and solvation
- Energy minimization workflows
- NPT/NVT equilibration protocols
- Free energy perturbation setup
- Trajectory analysis (RMSD, RMSF, RDF)
- Enhanced sampling methods (metadynamics, replica exchange)

**Used By Processes**:
- Molecular Dynamics Simulation Setup
- High-Performance Computing Workflow

**Tools/Libraries**: GROMACS, pdb2gmx, MDAnalysis

---

#### 3. vasp-dft-calculator
**Description**: VASP DFT calculation skill for electronic structure, band structures, and materials property predictions.

**Capabilities**:
- INCAR/POSCAR/POTCAR generation
- k-point mesh optimization
- Self-consistent field convergence management
- Band structure and DOS calculation
- Geometry optimization workflows
- Phonon calculation setup (with Phonopy)

**Used By Processes**:
- Density Functional Theory Calculations
- Material Synthesis and Characterization
- Phase Transition Investigation

**Tools/Libraries**: VASP, VASPKIT, Phonopy, pymatgen

---

#### 4. quantum-espresso-runner
**Description**: Quantum ESPRESSO DFT skill for plane-wave pseudopotential calculations and materials simulation.

**Capabilities**:
- Input file generation (pw.x, ph.x, pp.x)
- Pseudopotential library management
- Convergence testing automation
- Wannier90 interface for tight-binding
- Transport property calculations
- Spin-orbit coupling handling

**Used By Processes**:
- Density Functional Theory Calculations
- Spectroscopy Measurement Campaign

**Tools/Libraries**: Quantum ESPRESSO, Wannier90, EPW

---

#### 5. comsol-multiphysics-modeler
**Description**: COMSOL finite element skill for multiphysics simulations including electromagnetics, heat transfer, and fluid dynamics.

**Capabilities**:
- Geometry import and meshing
- Physics module configuration
- Boundary condition setup
- Parametric sweep automation
- Results extraction and post-processing
- LiveLink scripting (MATLAB/Python)

**Used By Processes**:
- Experiment Design and Planning
- Data Acquisition System Development
- Spectroscopy Measurement Campaign

**Tools/Libraries**: COMSOL Multiphysics, LiveLink for MATLAB

---

#### 6. monte-carlo-physics-simulator
**Description**: Monte Carlo simulation skill for statistical physics, particle transport, and stochastic processes.

**Capabilities**:
- Metropolis algorithm implementation
- Wang-Landau sampling
- Parallel tempering coordination
- Variance reduction techniques
- Autocorrelation analysis
- Error estimation and jackknife/bootstrap

**Used By Processes**:
- Monte Carlo Simulation Implementation
- Statistical Analysis Pipeline
- Monte Carlo Event Generation

**Tools/Libraries**: Custom MC codes, OpenMC, Geant4

---

### Particle Physics Skills

#### 7. root-data-analyzer
**Description**: ROOT/CERN data analysis skill for high-energy physics data processing, histogramming, and statistical analysis.

**Capabilities**:
- TTree/TChain manipulation
- Histogram creation and fitting
- RooFit statistical modeling
- TCanvas visualization
- ROOT macro development
- PyROOT integration

**Used By Processes**:
- Statistical Analysis Pipeline
- Event Reconstruction
- Monte Carlo Event Generation
- Beyond Standard Model Search

**Tools/Libraries**: ROOT, RooFit, RooStats, uproot

---

#### 8. geant4-detector-simulator
**Description**: Geant4 detector simulation skill for particle transport, detector geometry, and physics process modeling.

**Capabilities**:
- Geometry construction (GDML, C++)
- Physics list selection and customization
- Sensitive detector implementation
- Hit collection and digitization
- Visualization configuration
- Multi-threading optimization

**Used By Processes**:
- Experiment Design and Planning
- Event Reconstruction
- Systematic Uncertainty Evaluation

**Tools/Libraries**: Geant4, GDML, ROOT

---

#### 9. pythia-event-generator
**Description**: Pythia event generation skill for proton-proton and lepton collisions at high energies.

**Capabilities**:
- Process selection and configuration
- Parton distribution function management
- Hadronization and decay settings
- Underlying event tuning
- HepMC output generation
- Shower matching (MLM, CKKW)

**Used By Processes**:
- Monte Carlo Event Generation
- Beyond Standard Model Search
- Statistical Analysis Pipeline

**Tools/Libraries**: Pythia8, HepMC, LHAPDF

---

#### 10. madgraph-amplitude-calculator
**Description**: MadGraph matrix element calculation skill for BSM physics, cross-section computation, and event generation.

**Capabilities**:
- UFO model import and validation
- Process generation and optimization
- NLO calculation setup
- Parton-level event generation
- Shower matching with Pythia/Herwig
- Cross-section extraction with uncertainties

**Used By Processes**:
- Quantum Field Theory Calculations
- Beyond Standard Model Search
- Monte Carlo Event Generation

**Tools/Libraries**: MadGraph5_aMC@NLO, UFO models, FeynRules

---

#### 11. delphes-fast-simulator
**Description**: Delphes fast detector simulation skill for phenomenological studies and BSM searches.

**Capabilities**:
- Detector card configuration (ATLAS, CMS, custom)
- Jet reconstruction algorithms
- Object efficiency parameterization
- Pile-up simulation
- Trigger emulation
- ROOT/Delphes tree output

**Used By Processes**:
- Event Reconstruction
- Beyond Standard Model Search
- Experiment Design and Planning

**Tools/Libraries**: Delphes, FastJet, ROOT

---

### Condensed Matter Skills

#### 12. wannier90-tight-binding
**Description**: Wannier90 skill for maximally localized Wannier functions and tight-binding model construction.

**Capabilities**:
- Wannierization from DFT
- Band interpolation
- Berry phase calculations
- Topological invariant computation
- Transport property modeling
- Interface with DFT codes (VASP, QE)

**Used By Processes**:
- Density Functional Theory Calculations
- Phase Transition Investigation
- Material Synthesis and Characterization

**Tools/Libraries**: Wannier90, WannierTools, Z2Pack

---

#### 13. kwant-quantum-transport
**Description**: Kwant quantum transport skill for mesoscopic physics, scattering matrix calculations, and nanostructure modeling.

**Capabilities**:
- System builder for arbitrary geometries
- Scattering matrix computation
- Landauer-Buttiker formalism
- Tight-binding Hamiltonian construction
- Band structure visualization
- Parallel transport calculations

**Used By Processes**:
- Density Functional Theory Calculations
- Material Synthesis and Characterization

**Tools/Libraries**: Kwant, NumPy, SciPy

---

#### 14. spinw-magnetic-simulator
**Description**: SpinW spin wave simulation skill for magnetic materials, magnon dispersions, and neutron scattering analysis.

**Capabilities**:
- Magnetic structure definition
- Exchange coupling parameterization
- Linear spin wave theory calculations
- Neutron scattering cross-section computation
- Magnetic phase diagram exploration
- Powder averaging

**Used By Processes**:
- Spectroscopy Measurement Campaign
- Phase Transition Investigation
- Material Synthesis and Characterization

**Tools/Libraries**: SpinW (MATLAB), magnopy

---

#### 15. aflow-materials-discovery
**Description**: AFLOW automatic materials discovery skill for high-throughput DFT calculations and materials database queries.

**Capabilities**:
- AFLOW database API queries
- Automatic workflow generation
- Thermodynamic stability analysis
- Prototype structure generation
- Descriptor calculation
- Machine learning integration

**Used By Processes**:
- Density Functional Theory Calculations
- Material Synthesis and Characterization
- Machine Learning for Physics

**Tools/Libraries**: AFLOW, aflow.py, Materials Project API

---

### Optics and Photonics Skills

#### 16. meep-fdtd-simulator
**Description**: MEEP electromagnetic FDTD simulation skill for photonic devices, metamaterials, and waveguides.

**Capabilities**:
- Geometry definition with materials library
- Source configuration (dipole, Gaussian, plane wave)
- Absorbing boundary conditions (PML)
- Flux and field extraction
- Parameter sweeps and optimization
- Parallel domain decomposition

**Used By Processes**:
- Experiment Design and Planning
- Material Synthesis and Characterization
- Spectroscopy Measurement Campaign

**Tools/Libraries**: MEEP, MPB, h5py

---

#### 17. lumerical-photonics-simulator
**Description**: Lumerical FDTD and MODE skill for nanophotonics, integrated photonics, and solar cell design.

**Capabilities**:
- 2D/3D FDTD simulations
- Eigenmode expansion (EME)
- S-parameter extraction
- Grating coupler optimization
- CW and pulsed source analysis
- CHARGE electrical integration

**Used By Processes**:
- Experiment Design and Planning
- Spectroscopy Measurement Campaign

**Tools/Libraries**: Lumerical FDTD, MODE, DEVICE

---

#### 18. zemax-optical-designer
**Description**: Zemax optical design skill for lens systems, imaging optics, and tolerancing analysis.

**Capabilities**:
- Sequential ray tracing
- Non-sequential analysis
- Tolerance analysis
- MTF and PSF calculation
- Coating optimization
- Stray light analysis

**Used By Processes**:
- Experiment Design and Planning
- Detector Calibration and Characterization

**Tools/Libraries**: Zemax OpticStudio, Python ZOS-API

---

### Quantum Mechanics and Quantum Computing Skills

#### 19. qiskit-quantum-simulator
**Description**: Qiskit quantum computing skill for circuit design, simulation, and quantum algorithm development.

**Capabilities**:
- Quantum circuit construction
- Statevector and density matrix simulation
- Noise modeling and mitigation
- Variational algorithm implementation (VQE, QAOA)
- IBM Quantum backend submission
- Quantum chemistry integration (Qiskit Nature)

**Used By Processes**:
- Quantum Field Theory Calculations
- Machine Learning for Physics
- Mathematical Model Derivation

**Tools/Libraries**: Qiskit, Qiskit Nature, Qiskit Aer

---

#### 20. quimb-tensor-network
**Description**: QuTiP/quimb tensor network skill for quantum many-body simulations and entanglement analysis.

**Capabilities**:
- MPS and DMRG calculations
- TEBD time evolution
- Entanglement entropy computation
- Quantum master equation solving
- Open quantum systems dynamics
- GPU-accelerated contractions

**Used By Processes**:
- Mathematical Model Derivation
- Perturbation Theory Analysis
- Phase Transition Investigation

**Tools/Libraries**: quimb, QuTiP, ITensor

---

#### 21. pyscf-quantum-chemistry
**Description**: PySCF quantum chemistry skill for molecular calculations, coupled cluster, and multireference methods.

**Capabilities**:
- Hartree-Fock and post-HF methods
- Coupled cluster (CCSD, CCSD(T))
- CASSCF/CASPT2 multireference
- Periodic boundary conditions
- Relativistic corrections
- DMRG integration

**Used By Processes**:
- Density Functional Theory Calculations
- Molecular Dynamics Simulation Setup
- Symmetry and Conservation Law Analysis

**Tools/Libraries**: PySCF, Block2, libcint

---

### Cosmology and Astrophysics Skills

#### 22. camb-cosmology-calculator
**Description**: CAMB cosmological perturbation skill for CMB power spectra, matter power spectra, and cosmological parameter estimation.

**Capabilities**:
- CMB temperature and polarization spectra
- Matter power spectrum computation
- Transfer function calculation
- Dark energy equation of state models
- Neutrino mass effects
- Python/Fortran interface

**Used By Processes**:
- Mathematical Model Derivation
- Statistical Analysis Pipeline
- Perturbation Theory Analysis

**Tools/Libraries**: CAMB, CLASS, CosmoMC

---

#### 23. cosmosis-parameter-estimator
**Description**: CosmoSIS cosmological parameter estimation skill for MCMC sampling and likelihood analysis.

**Capabilities**:
- Modular likelihood construction
- Multiple sampler support (emcee, multinest, polychord)
- Prior specification
- Chain analysis and diagnostics
- Plotting and visualization
- Pipeline construction

**Used By Processes**:
- Statistical Analysis Pipeline
- Uncertainty Propagation and Quantification
- Machine Learning for Physics

**Tools/Libraries**: CosmoSIS, emcee, GetDist

---

#### 24. nbodykit-cosmology-analyzer
**Description**: nbodykit large-scale structure analysis skill for N-body simulations and galaxy surveys.

**Capabilities**:
- Power spectrum estimation (FFT-based)
- Correlation function computation
- Halo finding and mass functions
- Particle mesh operations
- Mock catalog generation
- MPI parallelization

**Used By Processes**:
- Monte Carlo Simulation Implementation
- High-Performance Computing Workflow
- Statistical Analysis Pipeline

**Tools/Libraries**: nbodykit, Corrfunc, halotools

---

### Data Analysis Skills

#### 25. scipy-optimization-toolkit
**Description**: SciPy scientific computing skill for numerical optimization, integration, and signal processing in physics.

**Capabilities**:
- Nonlinear least squares fitting
- Global optimization methods
- Numerical integration (quadrature)
- ODE/PDE solvers
- Signal processing (FFT, filtering)
- Sparse matrix operations

**Used By Processes**:
- Statistical Analysis Pipeline
- Uncertainty Propagation and Quantification
- Systematic Uncertainty Evaluation

**Tools/Libraries**: SciPy, NumPy, lmfit

---

#### 26. iminuit-statistical-fitter
**Description**: iminuit statistical fitting skill for physics data analysis with proper error handling and profile likelihood.

**Capabilities**:
- MINUIT minimization algorithms
- HESSE error matrix calculation
- MINOS asymmetric error estimation
- Profile likelihood computation
- Constrained fitting
- Simultaneous fit orchestration

**Used By Processes**:
- Statistical Analysis Pipeline
- Systematic Uncertainty Evaluation
- Blinded Analysis Protocol

**Tools/Libraries**: iminuit, probfit, zfit

---

#### 27. emcee-mcmc-sampler
**Description**: emcee MCMC skill for Bayesian parameter estimation and posterior sampling in physics applications.

**Capabilities**:
- Affine-invariant ensemble sampling
- Parallel tempering support
- Autocorrelation analysis
- Convergence diagnostics
- Prior/likelihood specification
- Chain visualization

**Used By Processes**:
- Statistical Analysis Pipeline
- Uncertainty Propagation and Quantification
- Blinded Analysis Protocol

**Tools/Libraries**: emcee, corner, arviz

---

#### 28. pymc-bayesian-modeler
**Description**: PyMC probabilistic programming skill for hierarchical Bayesian models in physics data analysis.

**Capabilities**:
- Probabilistic model construction
- NUTS/HMC sampling
- Variational inference
- Gaussian processes
- Model comparison (WAIC, LOO)
- Prior predictive checks

**Used By Processes**:
- Statistical Analysis Pipeline
- Machine Learning for Physics
- Uncertainty Propagation and Quantification

**Tools/Libraries**: PyMC, arviz, Theano/JAX

---

#### 29. tensorflow-physics-ml
**Description**: TensorFlow machine learning skill specialized for physics applications including neural network potentials and surrogate models.

**Capabilities**:
- Physics-informed neural networks (PINNs)
- Neural network potentials (NNP)
- Normalizing flows for density estimation
- Graph neural networks for molecular systems
- Automatic differentiation for physics
- TensorBoard experiment tracking

**Used By Processes**:
- Machine Learning for Physics
- Molecular Dynamics Simulation Setup
- Density Functional Theory Calculations

**Tools/Libraries**: TensorFlow, DeepMD-kit, SchNet

---

#### 30. scikit-hep-analysis
**Description**: Scikit-HEP toolkit skill for particle physics data analysis with modern Python tools.

**Capabilities**:
- Awkward array manipulation
- uproot ROOT file I/O
- Histogram operations (hist, boost-histogram)
- Particle data access
- Vector operations
- pyhf statistical modeling

**Used By Processes**:
- Statistical Analysis Pipeline
- Event Reconstruction
- Beyond Standard Model Search

**Tools/Libraries**: scikit-hep, awkward, uproot, hist, pyhf

---

### Lab Automation Skills

#### 31. labview-instrument-controller
**Description**: LabVIEW instrument control skill for DAQ systems, hardware integration, and real-time data acquisition.

**Capabilities**:
- VISA instrument communication
- NI-DAQmx integration
- Real-time data streaming
- Hardware timing control
- Custom VI development
- LabVIEW-Python bridge

**Used By Processes**:
- Data Acquisition System Development
- Detector Calibration and Characterization
- Experiment Design and Planning

**Tools/Libraries**: LabVIEW, NI-VISA, PyVISA

---

#### 32. epics-control-system
**Description**: EPICS control system skill for accelerator and beamline instrument control and monitoring.

**Capabilities**:
- IOC configuration and deployment
- Channel Access protocol
- Archiver integration
- Alarm handling
- OPI screen development
- Python/caproto scripting

**Used By Processes**:
- Data Acquisition System Development
- Detector Calibration and Characterization
- Systematic Uncertainty Evaluation

**Tools/Libraries**: EPICS, caproto, pyepics, phoebus

---

#### 33. bluesky-data-collection
**Description**: Bluesky experimental orchestration skill for scan automation, data collection, and metadata management.

**Capabilities**:
- Scan plan execution
- Adaptive scanning
- Databroker integration
- Live visualization
- Hardware abstraction (ophyd)
- Jupyter integration

**Used By Processes**:
- Data Acquisition System Development
- Spectroscopy Measurement Campaign
- Detector Calibration and Characterization

**Tools/Libraries**: Bluesky, ophyd, databroker

---

#### 34. pymeasure-automation
**Description**: PyMeasure laboratory automation skill for instrument control and automated measurement sequences.

**Capabilities**:
- Instrument driver library
- Automated measurement procedures
- Real-time data logging
- GUI generation
- Error handling and recovery
- Multi-instrument coordination

**Used By Processes**:
- Data Acquisition System Development
- Experiment Design and Planning
- Detector Calibration and Characterization

**Tools/Libraries**: PyMeasure, PyVISA, Qt

---

### Visualization and Documentation Skills

#### 35. paraview-scientific-visualizer
**Description**: ParaView visualization skill for 3D scientific data rendering and analysis.

**Capabilities**:
- VTK data format handling
- Volume rendering and isosurfaces
- Streamlines and glyphs
- Animation generation
- Python scripting (pvpython)
- Remote visualization

**Used By Processes**:
- High-Performance Computing Workflow
- Molecular Dynamics Simulation Setup
- Scientific Paper Preparation

**Tools/Libraries**: ParaView, VTK, vtk-numpy-integration

---

#### 36. latex-physics-documenter
**Description**: LaTeX scientific documentation skill specialized for physics papers with equation rendering and journal formatting.

**Capabilities**:
- REVTeX/APS formatting
- Equation and figure handling
- BibTeX reference management
- Tikz/PGF diagram generation
- arXiv submission preparation
- Supplementary material packaging

**Used By Processes**:
- Scientific Paper Preparation
- Research Data Management
- Mathematical Model Derivation

**Tools/Libraries**: LaTeX, REVTeX, TikZ, BibTeX

---

## Agents

### Theoretical Physics Agents

#### 1. theoretical-model-developer
**Description**: Agent specialized in developing mathematical models from first principles for physical systems.

**Responsibilities**:
- Define physical system boundaries and assumptions
- Formulate Hamiltonians and Lagrangians
- Identify symmetries and conservation laws
- Derive equations of motion
- Validate against known limiting cases
- Document mathematical derivations

**Used By Processes**:
- Mathematical Model Derivation
- Symmetry and Conservation Law Analysis

**Required Skills**: scipy-optimization-toolkit, latex-physics-documenter, qiskit-quantum-simulator

---

#### 2. perturbation-theory-analyst
**Description**: Agent specialized in perturbative expansions and approximation methods for complex physical systems.

**Responsibilities**:
- Identify small expansion parameters
- Compute systematic corrections
- Assess convergence properties
- Compare with non-perturbative results
- Estimate truncation errors
- Document approximation validity

**Used By Processes**:
- Perturbation Theory Analysis
- Quantum Field Theory Calculations

**Required Skills**: scipy-optimization-toolkit, pyscf-quantum-chemistry, latex-physics-documenter

---

#### 3. qft-calculator
**Description**: Agent specialized in quantum field theory calculations including Feynman diagrams and renormalization.

**Responsibilities**:
- Generate Feynman rules from Lagrangians
- Compute tree-level amplitudes
- Calculate loop corrections
- Perform renormalization
- Evaluate cross sections and decay rates
- Assess theoretical uncertainties

**Used By Processes**:
- Quantum Field Theory Calculations
- Beyond Standard Model Search

**Required Skills**: madgraph-amplitude-calculator, pythia-event-generator, latex-physics-documenter

---

### Experimental Physics Agents

#### 4. experiment-designer
**Description**: Agent specialized in physics experiment design, apparatus specification, and systematic planning.

**Responsibilities**:
- Define measurement objectives and precision goals
- Design apparatus configurations
- Estimate signal and background rates
- Plan calibration strategies
- Assess resource requirements
- Develop experimental protocols

**Used By Processes**:
- Experiment Design and Planning
- Systematic Uncertainty Evaluation

**Required Skills**: geant4-detector-simulator, comsol-multiphysics-modeler, root-data-analyzer

---

#### 5. daq-engineer
**Description**: Agent specialized in data acquisition system design, trigger logic, and real-time data processing.

**Responsibilities**:
- Specify data rate and trigger requirements
- Design readout electronics architecture
- Implement trigger selection logic
- Develop monitoring systems
- Optimize data throughput
- Document DAQ performance

**Used By Processes**:
- Data Acquisition System Development
- Detector Calibration and Characterization

**Required Skills**: labview-instrument-controller, epics-control-system, bluesky-data-collection

---

#### 6. systematic-uncertainty-analyst
**Description**: Agent specialized in systematic uncertainty evaluation, error source identification, and uncertainty budgeting.

**Responsibilities**:
- Identify systematic error sources
- Design dedicated systematic studies
- Evaluate detector uncertainties
- Assess modeling uncertainties
- Construct correlation matrices
- Document uncertainty budget

**Used By Processes**:
- Systematic Uncertainty Evaluation
- Blinded Analysis Protocol

**Required Skills**: root-data-analyzer, iminuit-statistical-fitter, emcee-mcmc-sampler

---

#### 7. detector-calibrator
**Description**: Agent specialized in detector calibration, response characterization, and performance validation.

**Responsibilities**:
- Design calibration procedures
- Perform energy and position calibrations
- Characterize detector resolution
- Monitor calibration stability
- Develop correction algorithms
- Validate with known physics

**Used By Processes**:
- Detector Calibration and Characterization
- Data Acquisition System Development

**Required Skills**: root-data-analyzer, bluesky-data-collection, pymeasure-automation

---

### Computational Physics Agents

#### 8. md-simulation-specialist
**Description**: Agent specialized in molecular dynamics simulation setup, validation, and analysis.

**Responsibilities**:
- Select appropriate force fields
- Prepare initial configurations
- Choose integration parameters
- Implement thermostats/barostats
- Validate against benchmarks
- Extract physical observables

**Used By Processes**:
- Molecular Dynamics Simulation Setup
- High-Performance Computing Workflow

**Required Skills**: lammps-md-simulator, gromacs-biosim-runner, paraview-scientific-visualizer

---

#### 9. dft-specialist
**Description**: Agent specialized in density functional theory calculations and electronic structure analysis.

**Responsibilities**:
- Select exchange-correlation functional
- Optimize computational parameters
- Perform structure relaxation
- Compute band structures and DOS
- Calculate materials properties
- Assess DFT validity

**Used By Processes**:
- Density Functional Theory Calculations
- Material Synthesis and Characterization

**Required Skills**: vasp-dft-calculator, quantum-espresso-runner, wannier90-tight-binding

---

#### 10. monte-carlo-specialist
**Description**: Agent specialized in Monte Carlo simulation design, implementation, and statistical analysis.

**Responsibilities**:
- Design MC algorithms
- Implement efficient sampling
- Develop variance reduction
- Validate against known results
- Estimate statistical errors
- Optimize performance

**Used By Processes**:
- Monte Carlo Simulation Implementation
- Monte Carlo Event Generation

**Required Skills**: monte-carlo-physics-simulator, geant4-detector-simulator, emcee-mcmc-sampler

---

#### 11. hpc-workflow-engineer
**Description**: Agent specialized in high-performance computing workflows, parallelization, and resource management.

**Responsibilities**:
- Profile and optimize codes
- Implement parallelization
- Design workflow automation
- Manage checkpointing
- Handle data movement
- Monitor resource utilization

**Used By Processes**:
- High-Performance Computing Workflow
- Distributed Training Orchestration

**Required Skills**: lammps-md-simulator, vasp-dft-calculator, paraview-scientific-visualizer

---

### Data Analysis Agents

#### 12. statistical-analyst
**Description**: Agent specialized in physics statistical analysis, fitting, and hypothesis testing.

**Responsibilities**:
- Design analysis selection criteria
- Implement background estimation
- Perform signal extraction
- Calculate statistical significance
- Apply multiple testing corrections
- Produce publication-ready results

**Used By Processes**:
- Statistical Analysis Pipeline
- Blinded Analysis Protocol

**Required Skills**: root-data-analyzer, iminuit-statistical-fitter, scikit-hep-analysis

---

#### 13. physics-ml-developer
**Description**: Agent specialized in machine learning applications to physics problems.

**Responsibilities**:
- Define ML problem formulation
- Prepare physics datasets
- Train and validate models
- Interpret predictions physically
- Deploy in analysis workflows
- Assess ML systematics

**Used By Processes**:
- Machine Learning for Physics
- Statistical Analysis Pipeline

**Required Skills**: tensorflow-physics-ml, scikit-hep-analysis, root-data-analyzer

---

#### 14. uncertainty-propagator
**Description**: Agent specialized in uncertainty propagation through analysis chains and error budgeting.

**Responsibilities**:
- Identify uncertainty sources
- Implement error propagation
- Handle correlations correctly
- Perform sensitivity analyses
- Validate uncertainty estimates
- Document uncertainty budget

**Used By Processes**:
- Uncertainty Propagation and Quantification
- Systematic Uncertainty Evaluation

**Required Skills**: emcee-mcmc-sampler, pymc-bayesian-modeler, scipy-optimization-toolkit

---

#### 15. blinded-analysis-coordinator
**Description**: Agent specialized in implementing blinded analysis procedures to prevent experimenter bias.

**Responsibilities**:
- Design blinding strategy
- Implement blinding in code
- Define unblinding criteria
- Validate pre-unblinding
- Coordinate review process
- Execute unblinding procedure

**Used By Processes**:
- Blinded Analysis Protocol
- Statistical Analysis Pipeline

**Required Skills**: root-data-analyzer, iminuit-statistical-fitter, scikit-hep-analysis

---

### Particle Physics Agents

#### 16. event-reconstructor
**Description**: Agent specialized in reconstructing physics objects and events from raw detector data.

**Responsibilities**:
- Develop tracking algorithms
- Implement calorimeter clustering
- Perform particle identification
- Reconstruct composite objects
- Optimize reconstruction performance
- Validate with simulation

**Used By Processes**:
- Event Reconstruction
- Beyond Standard Model Search

**Required Skills**: root-data-analyzer, geant4-detector-simulator, delphes-fast-simulator

---

#### 17. mc-generator-specialist
**Description**: Agent specialized in Monte Carlo event generation for particle physics experiments.

**Responsibilities**:
- Configure event generators
- Validate against measurements
- Interface with detector simulation
- Assess generator systematics
- Manage large-scale production
- Document generator settings

**Used By Processes**:
- Monte Carlo Event Generation
- Beyond Standard Model Search

**Required Skills**: pythia-event-generator, madgraph-amplitude-calculator, root-data-analyzer

---

#### 18. bsm-search-analyst
**Description**: Agent specialized in beyond Standard Model physics searches and limit setting.

**Responsibilities**:
- Identify BSM signatures
- Develop signal discrimination
- Estimate SM backgrounds
- Optimize search sensitivity
- Calculate limits or discovery significance
- Interpret in BSM models

**Used By Processes**:
- Beyond Standard Model Search
- Statistical Analysis Pipeline

**Required Skills**: madgraph-amplitude-calculator, root-data-analyzer, scikit-hep-analysis

---

### Condensed Matter Agents

#### 19. materials-synthesizer
**Description**: Agent specialized in materials synthesis planning and structural characterization.

**Responsibilities**:
- Plan synthesis routes
- Optimize growth conditions
- Characterize crystal structures
- Measure physical properties
- Correlate structure-property
- Document synthesis protocols

**Used By Processes**:
- Material Synthesis and Characterization
- Phase Transition Investigation

**Required Skills**: vasp-dft-calculator, aflow-materials-discovery, spinw-magnetic-simulator

---

#### 20. spectroscopy-analyst
**Description**: Agent specialized in spectroscopic measurements and data interpretation.

**Responsibilities**:
- Select spectroscopic techniques
- Prepare measurement conditions
- Collect and process spectra
- Extract physical quantities
- Compare with theory
- Document measurements

**Used By Processes**:
- Spectroscopy Measurement Campaign
- Material Synthesis and Characterization

**Required Skills**: spinw-magnetic-simulator, bluesky-data-collection, scipy-optimization-toolkit

---

#### 21. phase-transition-investigator
**Description**: Agent specialized in phase transitions, critical phenomena, and order parameter analysis.

**Responsibilities**:
- Identify phase transition signatures
- Design temperature/field studies
- Measure order parameters
- Determine critical exponents
- Compare with universality
- Model transition mechanisms

**Used By Processes**:
- Phase Transition Investigation
- Spectroscopy Measurement Campaign

**Required Skills**: quimb-tensor-network, monte-carlo-physics-simulator, scipy-optimization-toolkit

---

### Publication Agents

#### 22. physics-paper-writer
**Description**: Agent specialized in preparing physics research for peer-reviewed publication.

**Responsibilities**:
- Structure paper narrative
- Prepare publication figures
- Document methods rigorously
- Write precise physics text
- Respond to reviewer comments
- Prepare supplementary materials

**Used By Processes**:
- Scientific Paper Preparation
- Research Data Management

**Required Skills**: latex-physics-documenter, paraview-scientific-visualizer, root-data-analyzer

---

#### 23. research-data-manager
**Description**: Agent specialized in research data management, archiving, and FAIR compliance.

**Responsibilities**:
- Design data organization
- Implement version control
- Create metadata documentation
- Archive in repositories
- Ensure FAIR compliance
- Plan long-term preservation

**Used By Processes**:
- Research Data Management
- Scientific Paper Preparation

**Required Skills**: latex-physics-documenter, paraview-scientific-visualizer

---

#### 24. cosmology-data-analyst
**Description**: Agent specialized in cosmological data analysis, parameter estimation, and model comparison.

**Responsibilities**:
- Configure cosmological codes
- Perform parameter estimation
- Compute power spectra
- Assess model constraints
- Handle systematic effects
- Document cosmological results

**Used By Processes**:
- Statistical Analysis Pipeline
- Mathematical Model Derivation

**Required Skills**: camb-cosmology-calculator, cosmosis-parameter-estimator, nbodykit-cosmology-analyzer

---

## Process to Skills/Agents Mapping

| Process | Recommended Skills | Recommended Agents | Integrated |
|---------|-------------------|-------------------|------------|
| Mathematical Model Derivation | scipy-optimization-toolkit, latex-physics-documenter, qiskit-quantum-simulator | theoretical-model-developer | [x] |
| Perturbation Theory Analysis | scipy-optimization-toolkit, pyscf-quantum-chemistry | perturbation-theory-analyst | [x] |
| Symmetry and Conservation Law Analysis | pyscf-quantum-chemistry, qiskit-quantum-simulator | theoretical-model-developer | [x] |
| Quantum Field Theory Calculations | madgraph-amplitude-calculator, pythia-event-generator | qft-calculator | [x] |
| Experiment Design and Planning | geant4-detector-simulator, comsol-multiphysics-modeler | experiment-designer | [x] |
| Data Acquisition System Development | labview-instrument-controller, epics-control-system, bluesky-data-collection | daq-engineer | [x] |
| Systematic Uncertainty Evaluation | root-data-analyzer, iminuit-statistical-fitter | systematic-uncertainty-analyst | [x] |
| Detector Calibration and Characterization | root-data-analyzer, bluesky-data-collection, pymeasure-automation | detector-calibrator | [x] |
| Molecular Dynamics Simulation Setup | lammps-md-simulator, gromacs-biosim-runner | md-simulation-specialist | [x] |
| Density Functional Theory Calculations | vasp-dft-calculator, quantum-espresso-runner, wannier90-tight-binding | dft-specialist | [x] |
| Monte Carlo Simulation Implementation | monte-carlo-physics-simulator, geant4-detector-simulator | monte-carlo-specialist | [x] |
| High-Performance Computing Workflow | lammps-md-simulator, vasp-dft-calculator, paraview-scientific-visualizer | hpc-workflow-engineer | [x] |
| Statistical Analysis Pipeline | root-data-analyzer, iminuit-statistical-fitter, scikit-hep-analysis | statistical-analyst | [x] |
| Machine Learning for Physics | tensorflow-physics-ml, scikit-hep-analysis | physics-ml-developer | [x] |
| Uncertainty Propagation and Quantification | emcee-mcmc-sampler, pymc-bayesian-modeler | uncertainty-propagator | [x] |
| Blinded Analysis Protocol | root-data-analyzer, iminuit-statistical-fitter | blinded-analysis-coordinator | [x] |
| Event Reconstruction | root-data-analyzer, geant4-detector-simulator, delphes-fast-simulator | event-reconstructor | [x] |
| Monte Carlo Event Generation | pythia-event-generator, madgraph-amplitude-calculator | mc-generator-specialist | [x] |
| Beyond Standard Model Search | madgraph-amplitude-calculator, root-data-analyzer, scikit-hep-analysis | bsm-search-analyst | [x] |
| Material Synthesis and Characterization | vasp-dft-calculator, aflow-materials-discovery, spinw-magnetic-simulator | materials-synthesizer | [x] |
| Spectroscopy Measurement Campaign | spinw-magnetic-simulator, bluesky-data-collection | spectroscopy-analyst | [x] |
| Phase Transition Investigation | quimb-tensor-network, monte-carlo-physics-simulator | phase-transition-investigator | [x] |
| Scientific Paper Preparation | latex-physics-documenter, paraview-scientific-visualizer | physics-paper-writer | [x] |
| Research Data Management | latex-physics-documenter, paraview-scientific-visualizer | research-data-manager | [x] |

---

## Shared Candidates (Cross-Specialization)

These skills and agents could be shared with other specializations:

### Shared Skills

1. **scipy-optimization-toolkit** - Useful for any numerical optimization workflows (Data Science, Engineering)
2. **tensorflow-physics-ml** - Adaptable for general ML workflows (Data Science and ML)
3. **emcee-mcmc-sampler** - Applicable to Bayesian inference in any domain (Statistics, Finance)
4. **pymc-bayesian-modeler** - General probabilistic programming (Data Science, Bioinformatics)
5. **paraview-scientific-visualizer** - 3D visualization for any scientific domain (Engineering, Geophysics)
6. **latex-physics-documenter** - Adaptable for technical documentation (Mathematics, Engineering)

### Shared Agents

1. **hpc-workflow-engineer** - HPC expertise applicable to any computational domain
2. **statistical-analyst** - Statistical analysis applicable to Data Science specialization
3. **physics-ml-developer** - ML expertise applicable to Data Science and ML specialization
4. **research-data-manager** - Data management applicable to any research domain
5. **uncertainty-propagator** - Error analysis applicable to Engineering, Finance
6. **experiment-designer** - Experimental design applicable to Chemistry, Biology

---

## Implementation Priority

### High Priority (Core Physics Workflows)
1. root-data-analyzer
2. lammps-md-simulator
3. vasp-dft-calculator
4. scipy-optimization-toolkit
5. iminuit-statistical-fitter
6. statistical-analyst (agent)
7. dft-specialist (agent)
8. experiment-designer (agent)

### Medium Priority (Domain-Specific Capabilities)
1. geant4-detector-simulator
2. pythia-event-generator
3. quantum-espresso-runner
4. emcee-mcmc-sampler
5. bluesky-data-collection
6. event-reconstructor (agent)
7. monte-carlo-specialist (agent)
8. spectroscopy-analyst (agent)

### Lower Priority (Specialized Use Cases)
1. madgraph-amplitude-calculator
2. qiskit-quantum-simulator
3. camb-cosmology-calculator
4. kwant-quantum-transport
5. spinw-magnetic-simulator
6. cosmology-data-analyst (agent)
7. qft-calculator (agent)
8. bsm-search-analyst (agent)

---

## Notes

- All skills should implement standardized input/output schemas for composability with physics-specific data formats (HDF5, VTK, ROOT, HepMC)
- Skills should support both local workstation and HPC cluster execution modes
- Agents should be able to coordinate multi-step physics workflows spanning theory, simulation, and experiment
- Error handling should account for numerical convergence failures common in physics calculations
- Monitoring should track both computational resources and physical validation metrics
- Skills should support unit systems conversion (SI, CGS, natural units) where applicable
- Agents should provide detailed physics-based reasoning for methodology choices
- Integration with experiment databases (PDG, NIST, Materials Project) should be supported where relevant
