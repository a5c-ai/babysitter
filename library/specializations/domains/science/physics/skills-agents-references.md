# Physics - Skills and Agents References (Phase 5)

## Overview

This document provides reference materials, resources, and cross-specialization links for implementing the skills and agents identified in the Physics skills-agents-backlog.md. It covers GitHub repositories, MCP servers, community resources, API documentation, and applicable skills from other specializations.

---

## GitHub Repositories

### Numerical Simulation

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [LAMMPS](https://github.com/lammps/lammps) | Large-scale Atomic/Molecular Massively Parallel Simulator | lammps-md-simulator |
| [GROMACS](https://github.com/gromacs/gromacs) | High-performance molecular dynamics | gromacs-biosim-runner |
| [VASP Wiki](https://www.vasp.at/wiki/index.php/The_VASP_Manual) | Vienna Ab initio Simulation Package (commercial, wiki public) | vasp-dft-calculator |
| [Quantum ESPRESSO](https://github.com/QEF/q-e) | Open-source DFT suite | quantum-espresso-runner |
| [pymatgen](https://github.com/materialsproject/pymatgen) | Python Materials Genomics | vasp-dft-calculator, aflow-materials-discovery |
| [ASE](https://github.com/rosswhitfield/ase) | Atomic Simulation Environment | Multiple DFT/MD skills |
| [OpenMC](https://github.com/openmc-dev/openmc) | Monte Carlo particle transport | monte-carlo-physics-simulator |
| [MDAnalysis](https://github.com/MDAnalysis/mdanalysis) | Python library for MD trajectory analysis | lammps-md-simulator, gromacs-biosim-runner |
| [OVITO](https://github.com/ovito-org/ovito) | Open Visualization Tool | lammps-md-simulator |

### Particle Physics

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [ROOT](https://github.com/root-project/root) | CERN data analysis framework | root-data-analyzer |
| [uproot](https://github.com/scikit-hep/uproot5) | ROOT file I/O in Python | root-data-analyzer, scikit-hep-analysis |
| [awkward](https://github.com/scikit-hep/awkward) | Jagged arrays for HEP | scikit-hep-analysis |
| [pyhf](https://github.com/scikit-hep/pyhf) | HistFactory statistical models | scikit-hep-analysis, iminuit-statistical-fitter |
| [Geant4](https://github.com/Geant4/geant4) | Particle physics detector simulation | geant4-detector-simulator |
| [Pythia8](https://gitlab.com/Pythia8Collab/releases) | Event generator | pythia-event-generator |
| [MadGraph5_aMC@NLO](https://github.com/mg5amcnlo/mg5amcnlo) | Matrix element generator | madgraph-amplitude-calculator |
| [Delphes](https://github.com/delphes/delphes) | Fast detector simulation | delphes-fast-simulator |
| [FastJet](https://github.com/fastjet/fastjet) | Jet finding algorithms | delphes-fast-simulator |
| [HepMC](https://gitlab.cern.ch/hepmc/HepMC3) | Event record library | pythia-event-generator, madgraph-amplitude-calculator |

### Condensed Matter

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [Wannier90](https://github.com/wannier-developers/wannier90) | Maximally localized Wannier functions | wannier90-tight-binding |
| [WannierTools](https://github.com/quanshengwu/wannier_tools) | Topological materials analysis | wannier90-tight-binding |
| [Kwant](https://github.com/kwant-project/kwant) | Quantum transport simulations | kwant-quantum-transport |
| [SpinW](https://github.com/SpinW/spinw) | Spin wave simulations | spinw-magnetic-simulator |
| [AFLOW](https://github.com/aflow-org/aflow) | Automatic materials discovery | aflow-materials-discovery |
| [Materials Project API](https://github.com/materialsproject/api) | Materials database access | aflow-materials-discovery |
| [Z2Pack](https://github.com/Z2PackDev/Z2Pack) | Topological invariant calculation | wannier90-tight-binding |

### Optics and Photonics

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [MEEP](https://github.com/NanoComp/meep) | FDTD electromagnetic simulation | meep-fdtd-simulator |
| [MPB](https://github.com/NanoComp/mpb) | Photonic band structure | meep-fdtd-simulator |
| [Lumerical Python API](https://support.lumerical.com/hc/en-us/articles/360034914633) | Commercial photonics (API docs) | lumerical-photonics-simulator |

### Quantum Computing and Quantum Mechanics

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [Qiskit](https://github.com/Qiskit/qiskit) | IBM Quantum SDK | qiskit-quantum-simulator |
| [Qiskit Nature](https://github.com/Qiskit/qiskit-nature) | Quantum chemistry and physics | qiskit-quantum-simulator, pyscf-quantum-chemistry |
| [QuTiP](https://github.com/qutip/qutip) | Quantum toolbox in Python | quimb-tensor-network |
| [quimb](https://github.com/jcmgray/quimb) | Tensor network library | quimb-tensor-network |
| [ITensor](https://github.com/ITensor/ITensors.jl) | Tensor network library (Julia) | quimb-tensor-network |
| [PySCF](https://github.com/pyscf/pyscf) | Python-based quantum chemistry | pyscf-quantum-chemistry |
| [Block2](https://github.com/block-hczhai/block2-preview) | DMRG for quantum chemistry | pyscf-quantum-chemistry |

### Cosmology and Astrophysics

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [CAMB](https://github.com/cmbant/CAMB) | CMB power spectrum calculator | camb-cosmology-calculator |
| [CLASS](https://github.com/lesgourg/class_public) | Cosmic Linear Anisotropy Solving System | camb-cosmology-calculator |
| [CosmoSIS](https://github.com/joezuntz/cosmosis) | Cosmological parameter estimation | cosmosis-parameter-estimator |
| [emcee](https://github.com/dfm/emcee) | MCMC ensemble sampler | emcee-mcmc-sampler, cosmosis-parameter-estimator |
| [GetDist](https://github.com/cmbant/getdist) | MCMC sample analysis | cosmosis-parameter-estimator |
| [nbodykit](https://github.com/bccp/nbodykit) | Large-scale structure analysis | nbodykit-cosmology-analyzer |
| [Corrfunc](https://github.com/manodeep/Corrfunc) | Correlation function calculation | nbodykit-cosmology-analyzer |
| [halotools](https://github.com/astropy/halotools) | Halo occupation modeling | nbodykit-cosmology-analyzer |

### Data Analysis and Statistics

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [SciPy](https://github.com/scipy/scipy) | Scientific Python library | scipy-optimization-toolkit |
| [iminuit](https://github.com/scikit-hep/iminuit) | MINUIT minimization in Python | iminuit-statistical-fitter |
| [lmfit](https://github.com/lmfit/lmfit-py) | Non-linear fitting | scipy-optimization-toolkit |
| [corner](https://github.com/dfm/corner.py) | MCMC corner plots | emcee-mcmc-sampler |
| [arviz](https://github.com/arviz-devs/arviz) | Bayesian visualization | emcee-mcmc-sampler, pymc-bayesian-modeler |
| [PyMC](https://github.com/pymc-devs/pymc) | Probabilistic programming | pymc-bayesian-modeler |
| [TensorFlow](https://github.com/tensorflow/tensorflow) | Deep learning framework | tensorflow-physics-ml |
| [DeepMD-kit](https://github.com/deepmodeling/deepmd-kit) | Deep potential molecular dynamics | tensorflow-physics-ml |
| [SchNet](https://github.com/atomistic-machine-learning/schnetpack) | Neural networks for molecules | tensorflow-physics-ml |

### Lab Automation

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [PyVISA](https://github.com/pyvisa/pyvisa) | Python instrument control | labview-instrument-controller, pymeasure-automation |
| [pyepics](https://github.com/pyepics/pyepics) | EPICS Python interface | epics-control-system |
| [caproto](https://github.com/caproto/caproto) | Pure Python Channel Access | epics-control-system |
| [Bluesky](https://github.com/bluesky/bluesky) | Experimental orchestration | bluesky-data-collection |
| [ophyd](https://github.com/bluesky/ophyd) | Hardware abstraction for Bluesky | bluesky-data-collection |
| [databroker](https://github.com/bluesky/databroker) | Data access for Bluesky | bluesky-data-collection |
| [PyMeasure](https://github.com/pymeasure/pymeasure) | Measurement automation | pymeasure-automation |

### Visualization

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [ParaView](https://github.com/Kitware/ParaView) | 3D scientific visualization | paraview-scientific-visualizer |
| [VTK](https://github.com/Kitware/VTK) | Visualization toolkit | paraview-scientific-visualizer |
| [matplotlib](https://github.com/matplotlib/matplotlib) | Python plotting | Multiple visualization needs |

---

## MCP Server References

### Relevant MCP Servers for Physics Workflows

| MCP Server | Description | Applicable Skills |
|------------|-------------|-------------------|
| **filesystem** | File system operations for data management | All skills with file I/O |
| **github** | Version control for analysis code | All code-based skills |
| **fetch** | Web access for data downloads | aflow-materials-discovery, Materials Project queries |
| **puppeteer/playwright** | Web automation for databases | Literature search, database access |
| **postgres/sqlite** | Database operations for large datasets | Event data storage, metadata management |
| **memory** | Persistent context for long workflows | Multi-step analysis pipelines |

### Potential Custom MCP Servers

| Server Concept | Purpose | Skills Enabled |
|---------------|---------|----------------|
| **mcp-root** | ROOT file operations and analysis | root-data-analyzer, scikit-hep-analysis |
| **mcp-hdf5** | HDF5 data format handling | MD trajectories, detector data |
| **mcp-slurm** | HPC job submission and monitoring | hpc-workflow-engineer, vasp-dft-calculator |
| **mcp-materials-project** | Materials database queries | aflow-materials-discovery |
| **mcp-epics** | EPICS channel access | epics-control-system |
| **mcp-jupyter** | Notebook execution and management | Analysis reproducibility |

---

## Community Resources

### Forums and Discussion

| Resource | URL | Topics |
|----------|-----|--------|
| Physics Stack Exchange | https://physics.stackexchange.com/ | General physics questions |
| Matter Modeling SE | https://mattermodeling.stackexchange.com/ | DFT, MD, materials |
| Computational Science SE | https://scicomp.stackexchange.com/ | Numerical methods |
| LAMMPS Forum | https://matsci.org/c/lammps | LAMMPS usage |
| Quantum Computing SE | https://quantumcomputing.stackexchange.com/ | Quantum algorithms |
| ROOT Forum | https://root-forum.cern.ch/ | ROOT usage |

### Documentation and Tutorials

| Resource | URL | Relevance |
|----------|-----|-----------|
| CERN Open Data Portal | http://opendata.cern.ch/ | HEP data and tutorials |
| Materials Project Documentation | https://docs.materialsproject.org/ | Materials informatics |
| Qiskit Textbook | https://qiskit.org/learn | Quantum computing education |
| NIST Physics Data | https://physics.nist.gov/ | Physical constants, atomic data |
| Particle Data Group | https://pdg.lbl.gov/ | Particle physics reference |
| DLMF | https://dlmf.nist.gov/ | Special functions |

### Best Practices

| Resource | Description | Applicable Areas |
|----------|-------------|------------------|
| [Software Sustainability Institute](https://www.software.ac.uk/) | Research software best practices | All computational skills |
| [FAIR Data Principles](https://www.go-fair.org/fair-principles/) | Data management | Research data management |
| [Reproducible Research Guidelines](https://the-turing-way.netlify.app/) | The Turing Way | All analysis pipelines |
| [HEP Software Foundation](https://hepsoftwarefoundation.org/) | HEP software community | Particle physics tools |

---

## API Documentation

### Physics Databases and Services

| API | Documentation URL | Purpose |
|-----|-------------------|---------|
| Materials Project API | https://api.materialsproject.org/ | Materials data queries |
| AFLOW REST API | http://aflow.org/aflow-api/ | High-throughput DFT results |
| NIST WebBook API | https://webbook.nist.gov/chemistry/api/ | Chemical and physical data |
| OQMD API | http://oqmd.org/api | Quantum materials database |
| Crystallography Open Database | https://www.crystallography.net/cod/documents/api/index.html | Crystal structures |
| IBM Quantum API | https://quantum-computing.ibm.com/lab/docs/iql/runtime/ | Quantum hardware access |
| Inspire HEP API | https://github.com/inspirehep/rest-api-doc | HEP literature |

### Data Format Standards

| Standard | Documentation | Tools |
|----------|--------------|-------|
| HDF5 | https://www.hdfgroup.org/solutions/hdf5/ | h5py, PyTables |
| ROOT | https://root.cern/manual/storing_root_objects/ | uproot, PyROOT |
| VTK | https://vtk.org/documentation/ | VTK Python |
| CIF | https://www.iucr.org/resources/cif | pymatgen |
| HepMC | https://gitlab.cern.ch/hepmc/HepMC3 | pyhepmc |
| FITS | https://fits.gsfc.nasa.gov/ | astropy.io.fits |

---

## Applicable Skills from Other Specializations

### From Data Science and ML Specialization

| Skill | Application to Physics |
|-------|----------------------|
| **pandas-data-wrangler** | Tabular experimental data processing |
| **sklearn-ml-toolkit** | Feature engineering for physics ML |
| **pytorch-deep-learning** | Neural network training for physics |
| **hyperparameter-optimizer** | ML model tuning for physics applications |
| **mlflow-experiment-tracker** | Tracking physics ML experiments |
| **feature-engineering-toolkit** | Physics-informed features |

### From Mathematics Specialization

| Skill | Application to Physics |
|-------|----------------------|
| **sympy-computer-algebra** | Symbolic physics calculations |
| **numerical-linear-algebra-toolkit** | Large matrix operations in physics |
| **pde-solver-library** | Physics PDE solving |
| **ode-solver-library** | Dynamical systems in physics |
| **monte-carlo-simulation** | Statistical physics and uncertainty |
| **sensitivity-analysis-uq** | Uncertainty quantification in physics |
| **latex-math-formatter** | Physics paper preparation |

### From Computer Science Specialization

| Skill | Application to Physics |
|-------|----------------------|
| **algorithm-complexity-analyzer** | Analysis pipeline optimization |
| **hpc-parallel-computing** | Large-scale physics simulations |
| **gpu-acceleration-toolkit** | GPU-accelerated physics codes |
| **container-orchestration** | Reproducible simulation environments |

### From Engineering Specializations

| Skill | Application to Physics |
|-------|----------------------|
| **cfd-simulation** | Fluid physics simulations |
| **fea-analysis** | Structural physics problems |
| **control-systems-design** | Experimental apparatus control |
| **signal-processing-toolkit** | Detector signal analysis |

### From Bioinformatics Specialization

| Skill | Application to Physics |
|-------|----------------------|
| **protein-structure-prediction** | Biophysics applications |
| **molecular-docking** | Biophysics molecular interactions |

---

## Cross-Specialization Agent Collaboration

### Agents from Other Specializations Useful for Physics

| Agent | Source Specialization | Physics Application |
|-------|----------------------|---------------------|
| **data-pipeline-architect** | Data Engineering | Large physics data processing |
| **ml-model-validator** | Data Science | Physics ML model verification |
| **numerical-analyst** | Mathematics | Numerical physics methods |
| **systems-architect** | Software Architecture | Physics software design |
| **documentation-specialist** | Technical Writing | Physics paper preparation |
| **reproducibility-guardian** | Scientific Discovery | Physics research reproducibility |

### Physics Agents Useful for Other Specializations

| Agent | Target Specialization | Application |
|-------|----------------------|-------------|
| **hpc-workflow-engineer** | Any computational domain | HPC expertise |
| **uncertainty-propagator** | Engineering, Finance | Error analysis |
| **statistical-analyst** | Data Science, Bioinformatics | Statistical methods |
| **physics-ml-developer** | Data Science | Physics-informed ML |
| **experiment-designer** | Biology, Chemistry | Experimental methodology |

---

## Implementation Recommendations

### Tool Selection Priority

1. **Open Source First**: Prioritize open-source tools (ROOT, LAMMPS, Qiskit) over commercial alternatives
2. **Python Integration**: Ensure Python bindings exist for seamless skill integration
3. **HPC Compatibility**: Support both local and cluster execution modes
4. **Data Format Standards**: Use standard formats (HDF5, ROOT, VTK) for interoperability

### Integration Patterns

1. **Wrapper Skills**: Create Python wrapper skills around established physics codes
2. **API Clients**: Implement API clients for physics databases
3. **Pipeline Components**: Design skills as pipeline components with standard I/O
4. **Validation Hooks**: Include physics-based validation in all computational skills

### Testing Strategies

1. **Known Solutions**: Test against analytically solvable problems
2. **Benchmark Datasets**: Use community benchmark datasets for validation
3. **Cross-Code Verification**: Compare results between different codes
4. **Conservation Laws**: Verify physical conservation laws are satisfied

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-25 | Babysitter AI | Initial references document creation |
