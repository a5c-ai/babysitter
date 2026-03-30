# Materials Science - Skills and Agents References (Phase 5)

This document provides implementation references for the skills and agents identified in the Materials Science skills-agents-backlog.md, including GitHub repositories, MCP servers, community resources, API documentation, and applicable skills from other specializations.

---

## Table of Contents

1. [GitHub Repositories](#github-repositories)
2. [MCP Server References](#mcp-server-references)
3. [Community Resources](#community-resources)
4. [API Documentation](#api-documentation)
5. [Applicable Skills from Other Specializations](#applicable-skills-from-other-specializations)

---

## GitHub Repositories

### Crystallography and XRD

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [pymatgen](https://github.com/materialsproject/pymatgen) | Materials analysis library | SK-001: XRD Analysis, SK-025: Crystallography |
| [GSAS-II](https://github.com/AdvancedPhotonSource/GSAS-II) | Crystallographic analysis | SK-001: XRD Analysis |
| [diffpy-cmi](https://github.com/diffpy) | Diffraction and PDF analysis | SK-001, SK-025: XRD/Crystallography |
| [VESTA](https://jp-minerals.org/vesta/) | 3D visualization of crystal structures | SK-025: Crystallography Analysis |
| [CrystalMaker](https://www.crystalmaker.com) | Crystal structure visualization | SK-025: Crystallography Analysis |
| [orix](https://github.com/pyxem/orix) | Orientation analysis | SK-002: Electron Microscopy (EBSD) |

### Electron Microscopy

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [hyperspy](https://github.com/hyperspy/hyperspy) | Multi-dimensional data analysis | SK-002: Electron Microscopy |
| [pyxem](https://github.com/pyxem/pyxem) | Crystallographic EM analysis | SK-002: Electron Microscopy |
| [atomap](https://github.com/nzaker/atomap) | Atomic resolution STEM analysis | SK-002: Electron Microscopy |
| [pycroscopy](https://github.com/pycroscopy/pycroscopy) | Scientific imaging analysis | SK-002: Electron Microscopy |
| [kikuchipy](https://github.com/pyxem/kikuchipy) | EBSD pattern analysis | SK-002: Electron Microscopy |
| [stemtool](https://github.com/stemtool/stemtool) | STEM image processing | SK-002: Electron Microscopy |

### Spectroscopy

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [specutils](https://github.com/astropy/specutils) | Spectroscopic analysis | SK-003: Spectroscopy Analysis |
| [rampy](https://github.com/charlesll/rampy) | Raman spectroscopy analysis | SK-003: Spectroscopy Analysis |
| [nmrglue](https://github.com/jjhelmus/nmrglue) | NMR data processing | SK-003: Spectroscopy Analysis |
| [lmfit](https://github.com/lmfit/lmfit-py) | Curve fitting for spectra | SK-003: Spectroscopy Analysis |
| [xraylarch](https://github.com/xraypy/xraylarch) | X-ray spectroscopy | SK-003: Spectroscopy Analysis |

### Computational Materials Science

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [ASE](https://github.com/rosswhitfield/ase) | Atomic Simulation Environment | SK-008, SK-009: DFT/MD |
| [pymatgen](https://github.com/materialsproject/pymatgen) | Materials analysis | SK-008, SK-010: DFT/HT Screening |
| [atomate](https://github.com/hackingmaterials/atomate) | DFT workflows | SK-008, SK-010: DFT/HT Screening |
| [atomate2](https://github.com/materialsproject/atomate2) | Next-gen DFT workflows | SK-008, SK-010: DFT/HT Screening |
| [FireWorks](https://github.com/materialsproject/fireworks) | Workflow management | SK-010: HT Screening |
| [AiiDA](https://github.com/aiidateam/aiida-core) | Workflow infrastructure | SK-008, SK-010: DFT/HT |

### Molecular Dynamics

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [LAMMPS](https://github.com/lammps/lammps) | Classical MD simulator | SK-009: Molecular Dynamics |
| [MDAnalysis](https://github.com/MDAnalysis/mdanalysis) | MD trajectory analysis | SK-009: Molecular Dynamics |
| [OVITO](https://gitlab.com/stuko/ovito) | Visualization and analysis | SK-009: Molecular Dynamics |
| [freud](https://github.com/glotzerlab/freud) | Particle system analysis | SK-009: Molecular Dynamics |
| [signac](https://github.com/glotzerlab/signac) | Data management for simulations | SK-009: Molecular Dynamics |

### Machine Learning for Materials

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [matminer](https://github.com/hackingmaterials/matminer) | Materials data mining | SK-012: ML Prediction |
| [CGCNN](https://github.com/txie-93/cgcnn) | Crystal graph neural networks | SK-012: ML Prediction |
| [MEGNet](https://github.com/materialsvirtuallab/megnet) | Graph networks for materials | SK-012: ML Prediction |
| [SchNet](https://github.com/atomistic-machine-learning/schnetpack) | Neural network potentials | SK-012: ML Prediction |
| [ALIGNN](https://github.com/usnistgov/alignn) | Graph neural networks | SK-012: ML Prediction |
| [M3GNet](https://github.com/materialsvirtuallab/m3gnet) | Universal potential | SK-012: ML Prediction |

### Thermodynamics and Phase Diagrams

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [pycalphad](https://github.com/pycalphad/pycalphad) | Computational thermodynamics | SK-011: CALPHAD Modeling |
| [ESPEI](https://github.com/pycalphad/espei) | Thermodynamic database fitting | SK-011: CALPHAD Modeling |
| [kawin](https://github.com/materialsarchive/kawin) | Precipitation kinetics | SK-011: CALPHAD Modeling |

### Mechanical Properties and Failure

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [pyfrac](https://github.com/fracture-tools) | Fracture mechanics | SK-006: Fatigue and Fracture |
| [pymatgen-analysis-defects](https://github.com/materialsproject/pymatgen-analysis-defects) | Defect analysis | SK-006: Fatigue and Fracture |

### Image Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [scikit-image](https://github.com/scikit-image/scikit-image) | Image processing | SK-002, SK-026: EM/Metallography |
| [napari](https://github.com/napari/napari) | Multi-dimensional image viewer | SK-002: Electron Microscopy |
| [cellpose](https://github.com/MouseLand/cellpose) | Segmentation (adaptable) | SK-026: Metallurgical Analysis |

### Polymer Science

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [polymerMD](https://github.com/polymersimulations) | Polymer MD tools | SK-027: Polymer Characterization |
| [mbuild](https://github.com/mosdef-hub/mbuild) | Molecular building | SK-027: Polymer Characterization |
| [foyer](https://github.com/mosdef-hub/foyer) | Force field management | SK-009, SK-027: MD/Polymers |

### Additive Manufacturing

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [PyMKS](https://github.com/materialsinnovation/pymks) | Microstructure-property | SK-016: Additive Manufacturing |

### Data Management

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OPTIMADE](https://github.com/Materials-Consortia/OPTIMADE) | Materials database API | SK-023: Materials Database |
| [nomad](https://github.com/nomad-coe/nomad) | FAIR materials repository | SK-023: Materials Database |

---

## MCP Server References

### Computational Infrastructure MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| VASP MCP | Remote VASP calculation execution | SK-008: DFT Calculation |
| Quantum ESPRESSO MCP | QE calculation management | SK-008: DFT Calculation |
| LAMMPS MCP | MD simulation execution | SK-009: Molecular Dynamics |
| HPC Scheduler MCP | Job submission (SLURM, PBS) | All computational skills |

### Database MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| Materials Project MCP | MP database access | SK-010: HT Screening, SK-023: Database |
| AFLOW MCP | AFLOW database queries | SK-010: HT Screening |
| ICSD MCP | Crystal structure database | SK-001, SK-025: XRD/Crystallography |
| NOMAD MCP | FAIR repository access | SK-023: Materials Database |

### Instrumentation MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| SEM/TEM MCP | Microscope control and data | SK-002: Electron Microscopy |
| XRD MCP | Diffractometer automation | SK-001: XRD Analysis |
| Tensile Tester MCP | Mechanical testing | SK-005: Mechanical Testing |
| Thermal Analysis MCP | DSC/TGA automation | SK-004: Thermal Analysis |

### Software Integration MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| Thermo-Calc MCP | TC-Python integration | SK-011: CALPHAD Modeling |
| ImageJ MCP | Image analysis automation | SK-002, SK-026: EM/Metallography |
| MATLAB MCP | MATLAB engine access | Multiple analysis skills |

---

## Community Resources

### Forums and Discussion

| Resource | URL | Topics |
|----------|-----|--------|
| Materials Science Stack Exchange | https://mattermodeling.stackexchange.com | Computational materials |
| Materials Project Community | https://discuss.materialsproject.org | MP database, pymatgen |
| LAMMPS Users | https://www.lammps.org/mailing.html | Molecular dynamics |
| VASP Forum | https://www.vasp.at/forum/ | DFT calculations |
| Reddit r/materials | https://reddit.com/r/materials | General materials |
| ResearchGate | https://www.researchgate.net | Materials research |

### Documentation and Tutorials

| Resource | URL | Topics |
|----------|-----|--------|
| Materials Project Docs | https://docs.materialsproject.org | Computational materials |
| pymatgen Docs | https://pymatgen.org | Materials analysis |
| LAMMPS Documentation | https://docs.lammps.org | Molecular dynamics |
| VASP Wiki | https://www.vasp.at/wiki/ | DFT calculations |
| ASM Handbooks Online | https://www.asminternational.org/handbooks | Materials reference |
| MIT OpenCourseWare | https://ocw.mit.edu/courses/materials-science-and-engineering/ | Materials courses |

### Standards and Testing

| Organization | Standards | Topics |
|--------------|-----------|--------|
| ASTM | E8, E18, E23, E399, E112, E1382 | Mechanical testing |
| ISO | ISO 6892, 6506, 6507, 6508 | Mechanical testing |
| ASM International | ASM Handbooks | Materials reference |
| NIST | NIST databases | Properties, standards |
| ICDD | PDF database | XRD phase ID |
| ICSD | Crystal structures | Crystallography |

### Research Databases

| Database | URL | Topics |
|----------|-----|--------|
| Materials Project | https://materialsproject.org | Computed properties |
| AFLOW | http://www.aflowlib.org | High-throughput data |
| NOMAD | https://nomad-lab.eu | FAIR repository |
| MatWeb | https://www.matweb.com | Material properties |
| Total Materia | https://www.totalmateria.com | Material properties |
| NIST Materials Data | https://mgi.nist.gov | NIST resources |

---

## API Documentation

### Materials Databases

| API | Documentation | Purpose |
|-----|---------------|---------|
| Materials Project | https://docs.materialsproject.org/api | Computed properties |
| AFLOW REST API | http://www.aflowlib.org/API/ | AFLOW database |
| OPTIMADE | https://www.optimade.org | Federated access |
| ICSD | https://icsd.fiz-karlsruhe.de/display/about.xhtml | Crystal structures |
| CSD | https://www.ccdc.cam.ac.uk/solutions/csd-system/ | Organic structures |

### Computational Tools

| API | Documentation | Purpose |
|-----|---------------|---------|
| pymatgen | https://pymatgen.org/pymatgen.html | Materials analysis |
| ASE | https://wiki.fysik.dtu.dk/ase/ | Atomic simulations |
| atomate2 | https://materialsproject.github.io/atomate2/ | DFT workflows |
| AiiDA | https://aiida.readthedocs.io | Workflow management |

### Commercial Software APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| Thermo-Calc TC-Python | https://thermocalc.com/products/add-ons/tc-python/ | CALPHAD |
| FactSage | https://www.factsage.com | Thermodynamics |
| ANSYS Granta MI | https://www.ansys.com/products/materials | Materials data |
| JMatPro | https://www.sentesoftware.co.uk | Thermodynamic modeling |

### Instrument Vendor APIs

| Vendor | Documentation | Purpose |
|--------|---------------|---------|
| Thermo Fisher | Various | SEM/TEM, XPS |
| Bruker | Various | XRD, NMR |
| JEOL | Various | Electron microscopy |
| TA Instruments | Various | Thermal analysis |
| Instron | Various | Mechanical testing |

---

## Applicable Skills from Other Specializations

### From Mechanical Engineering

| Skill | Original ID | Application in Materials Science |
|-------|-------------|----------------------------------|
| FEA Structural Skill | SK-001 | Stress analysis for material response |
| Fatigue Life Prediction Skill | SK-002 | Fatigue behavior correlation |
| Dynamics Skill | SK-003 | Dynamic mechanical analysis interpretation |
| Material Testing Planning Skill | SK-011 | Mechanical test design |
| Failure Analysis Skill | SK-012 | Component failure investigation |

### From Chemical Engineering

| Skill | Original ID | Application in Materials Science |
|-------|-------------|----------------------------------|
| Process Simulation Skill | Various | Materials processing simulation |
| Kinetic Modeling Skill | Various | Reaction and transformation kinetics |
| Crystallization Design Skill | Various | Crystal growth and control |
| Heat Treatment Optimization Skill | Various | Thermal processing design |

### From Aerospace Engineering

| Skill | Original ID | Application in Materials Science |
|-------|-------------|----------------------------------|
| Composite Structure Skill | Various | Composite material testing and design |
| Environmental Testing Skill | Various | Materials qualification testing |
| Fatigue/Damage Tolerance Skill | Various | Aerospace materials certification |

### From Biomedical Engineering

| Skill | Original ID | Application in Materials Science |
|-------|-------------|----------------------------------|
| Biomaterial Selection Skill | Various | Biocompatibility assessment |
| Biological Evaluation Skill | Various | ISO 10993 testing |
| Cell Culture Skill | Various | In vitro material testing |

### From Nanotechnology

| Skill | Original ID | Application in Materials Science |
|-------|-------------|----------------------------------|
| TEM Analysis Skill | tem-image-analyzer | High-resolution imaging |
| AFM/SPM Skill | afm-spm-analyzer | Surface characterization |
| XPS Analysis Skill | xps-surface-analyzer | Surface chemistry |
| DFT Calculation Skill | vasp-dft-executor | Electronic structure |
| MD Simulation Skill | lammps-md-executor | Atomistic modeling |
| ML Materials Skill | ml-materials-predictor | Property prediction |

### From Electrical Engineering

| Skill | Original ID | Application in Materials Science |
|-------|-------------|----------------------------------|
| Reliability Analysis Skill | SK-020 | Material reliability prediction |
| Test Automation Skill | SK-018 | Automated material characterization |

### From Environmental Engineering

| Skill | Original ID | Application in Materials Science |
|-------|-------------|----------------------------------|
| LCA Assessment Skill | SK-020 | Materials lifecycle assessment |
| Corrosion Assessment Skill | SK-018 | Corrosion testing and prevention |

### From Industrial Engineering

| Skill | Original ID | Application in Materials Science |
|-------|-------------|----------------------------------|
| DOE Designer Skill | Various | Experimental design for materials |
| Statistical Analysis Skill | Various | Materials data analysis |
| Process Capability Skill | Various | Materials process control |
| Root Cause Analysis Skill | Various | Defect investigation |

---

## Implementation Notes

### Priority Integration Points

1. **pymatgen**: Foundation for computational materials analysis
2. **hyperspy**: Core electron microscopy data analysis
3. **ASE/atomate2**: DFT workflow infrastructure
4. **LAMMPS/MDAnalysis**: Molecular dynamics capability
5. **matminer**: Machine learning feature engineering
6. **pycalphad**: CALPHAD thermodynamics

### Cross-Specialization Synergies

- Nanotechnology shares many characterization skills (TEM, AFM, XPS, DFT, MD)
- Mechanical Engineering fatigue and failure skills directly applicable
- Chemical Engineering kinetics and processing skills support materials processing
- Industrial Engineering DOE and statistical skills enhance experimental design

### Recommended Implementation Order

1. Core analysis infrastructure (pymatgen, ASE)
2. Characterization tools (hyperspy, XRD analysis)
3. Computational materials (DFT workflows, MD)
4. Machine learning (matminer, GNN models)
5. Thermodynamics (pycalphad)
6. Database integration (Materials Project API)
7. Mechanical testing automation
8. Specialized processing skills

### Data Standards and FAIR Principles

- OPTIMADE for federated database access
- NOMAD for FAIR data repository
- CIF format for crystallographic data
- JSON/MongoDB for computational results
- HDF5 for large datasets (microscopy, simulation)

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Phase 6 - Skills and Agents Implementation
