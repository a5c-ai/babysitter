# Nanotechnology - Skills and Agents References (Phase 5)

This document provides implementation references for the skills and agents identified in the Nanotechnology skills-agents-backlog.md, including GitHub repositories, MCP servers, community resources, API documentation, and applicable skills from other specializations.

---

## Table of Contents

1. [GitHub Repositories](#github-repositories)
2. [MCP Server References](#mcp-server-references)
3. [Community Resources](#community-resources)
4. [API Documentation](#api-documentation)
5. [Applicable Skills from Other Specializations](#applicable-skills-from-other-specializations)

---

## GitHub Repositories

### Synthesis and Materials

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [pymatgen](https://github.com/materialsproject/pymatgen) | Materials analysis library | nanoparticle-synthesis-optimizer |
| [rdkit](https://github.com/rdkit/rdkit) | Cheminformatics toolkit | ligand-exchange-protocol-manager |
| [ASE](https://github.com/rosswhitfield/ase) | Atomic Simulation Environment | nanoparticle-synthesis-optimizer |
| [chempy](https://github.com/bjodah/chempy) | Chemistry in Python | green-synthesis-evaluator |
| [brightway2](https://github.com/brightway-lca/brightway2) | Life cycle assessment | green-synthesis-evaluator |

### Surface Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [lmfit](https://github.com/lmfit/lmfit-py) | Curve fitting for spectra | xps-surface-analyzer |
| [xraylarch](https://github.com/xraypy/xraylarch) | X-ray spectroscopy | xps-surface-analyzer |
| [CasaXPS](https://www.casaxps.com) | XPS analysis (commercial) | xps-surface-analyzer |
| [gxps](https://github.com/schachmett/gxps) | Open source XPS analysis | xps-surface-analyzer |

### Microscopy and Characterization

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [hyperspy](https://github.com/hyperspy/hyperspy) | Multi-dimensional data analysis | tem-image-analyzer, sem-eds-analyzer |
| [pyxem](https://github.com/pyxem/pyxem) | Crystallographic EM analysis | tem-image-analyzer |
| [atomap](https://github.com/nzaker/atomap) | Atomic resolution STEM | tem-image-analyzer |
| [Gwyddion](https://github.com/gwyddion) | SPM data analysis | afm-spm-analyzer |
| [pySPM](https://github.com/scholi/pySPM) | SPM data processing | afm-spm-analyzer, stm-analyzer |
| [scikit-image](https://github.com/scikit-image/scikit-image) | Image processing | tem-image-analyzer |
| [napari](https://github.com/napari/napari) | Multi-dimensional viewer | All microscopy skills |

### Particle Sizing

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [PyDTS](https://github.com/particle-sizing) | Dynamic light scattering analysis | dls-particle-sizer |
| [NanoTrack](https://github.com/nanotracking) | Particle tracking analysis | nta-particle-tracker |
| [trackpy](https://github.com/soft-matter/trackpy) | Particle tracking toolkit | nta-particle-tracker |
| [PIMS](https://github.com/soft-matter/pims) | Image sequence handling | nta-particle-tracker |

### Spectroscopy

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [rampy](https://github.com/charlesll/rampy) | Raman spectroscopy | raman-spectroscopy-analyzer |
| [specutils](https://github.com/astropy/specutils) | Spectroscopic analysis | uv-vis-nir-analyzer |
| [scipy.signal](https://github.com/scipy/scipy) | Signal processing | All spectroscopy skills |
| [nmrglue](https://github.com/jjhelmus/nmrglue) | NMR processing | spectroscopy-analyst agent |
| [pyspectra](https://github.com/spectra-tools) | Spectral analysis | ftir-analyzer |

### X-ray Diffraction

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [GSAS-II](https://github.com/AdvancedPhotonSource/GSAS-II) | Crystallographic analysis | xrd-crystallography-analyzer |
| [pymatgen](https://github.com/materialsproject/pymatgen) | Materials analysis | xrd-crystallography-analyzer |
| [diffpy-cmi](https://github.com/diffpy) | Diffraction analysis | xrd-crystallography-analyzer |
| [xraylib](https://github.com/tschoonj/xraylib) | X-ray interaction data | xrd-crystallography-analyzer |

### SAXS/WAXS

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [SasView](https://github.com/SasView/sasview) | Small-angle scattering | saxs-waxs-analyzer |
| [sasmodels](https://github.com/SasView/sasmodels) | SAS model library | saxs-waxs-analyzer |
| [silx](https://github.com/silx-kit/silx) | Scientific data analysis | saxs-waxs-analyzer |
| [pyFAI](https://github.com/silx-kit/pyFAI) | Azimuthal integration | saxs-waxs-analyzer |

### Nanofabrication

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [BEAMER](https://www.genisys-gmbh.com) | EBL proximity correction (commercial) | ebl-process-controller |
| [KLayout](https://github.com/KLayout/klayout) | Layout editor/viewer | ebl-process-controller |
| [gdspy](https://github.com/heitzmann/gdspy) | GDSII library | ebl-process-controller |
| [gdstk](https://github.com/heitzmann/gdstk) | GDSII toolkit | ebl-process-controller |
| [nazca-design](https://github.com/actilogi/nazca-design) | Photonic IC design | nanolithography-engineer agent |

### Computational - DFT

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [VASP](https://www.vasp.at) | DFT code (commercial) | vasp-dft-executor |
| [Quantum ESPRESSO](https://github.com/QEF/q-e) | DFT code | quantum-espresso-executor |
| [GPAW](https://github.com/gpaw-developers/gpaw) | Real-space DFT | dft-computation-specialist agent |
| [cp2k](https://github.com/cp2k/cp2k) | Atomistic simulations | dft-computation-specialist agent |
| [pymatgen](https://github.com/materialsproject/pymatgen) | Materials analysis | vasp-dft-executor |
| [ASE](https://github.com/rosswhitfield/ase) | Atomic simulations | All DFT skills |
| [atomate2](https://github.com/materialsproject/atomate2) | DFT workflows | vasp-dft-executor |

### Computational - Molecular Dynamics

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [LAMMPS](https://github.com/lammps/lammps) | Classical MD simulator | lammps-md-executor |
| [GROMACS](https://github.com/gromacs/gromacs) | MD for biomolecules | gromacs-md-executor |
| [MDAnalysis](https://github.com/MDAnalysis/mdanalysis) | Trajectory analysis | Both MD skills |
| [OVITO](https://gitlab.com/stuko/ovito) | Visualization and analysis | lammps-md-executor |
| [freud](https://github.com/glotzerlab/freud) | Particle system analysis | lammps-md-executor |
| [signac](https://github.com/glotzerlab/signac) | Data management | Both MD skills |

### Machine Learning for Materials

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [matminer](https://github.com/hackingmaterials/matminer) | Materials data mining | ml-materials-predictor |
| [CGCNN](https://github.com/txie-93/cgcnn) | Crystal graph neural networks | ml-materials-predictor |
| [MEGNet](https://github.com/materialsvirtuallab/megnet) | Graph networks | ml-materials-predictor |
| [SchNet](https://github.com/atomistic-machine-learning/schnetpack) | Neural network potentials | ml-materials-predictor |
| [ALIGNN](https://github.com/usnistgov/alignn) | Graph neural networks | ml-materials-predictor |
| [M3GNet](https://github.com/materialsvirtuallab/m3gnet) | Universal potential | ml-materials-predictor |
| [DeepChem](https://github.com/deepchem/deepchem) | Deep learning for chemistry | ml-materials-predictor |

### Applications - Drug Delivery

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [GROMACS](https://github.com/gromacs/gromacs) | Nanoparticle-bio simulations | gromacs-md-executor |
| [Martini](http://cgmartini.nl) | Coarse-grained force field | gromacs-md-executor |
| [MDAnalysis](https://github.com/MDAnalysis/mdanalysis) | Trajectory analysis | drug-encapsulation-optimizer |
| [rdkit](https://github.com/rdkit/rdkit) | Cheminformatics | targeting-ligand-designer |

### Applications - Toxicology

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [pyproteome](https://github.com/white-lab/pyproteome) | Proteomics analysis | cytotoxicity-assay-analyzer |
| [cellprofiler](https://github.com/CellProfiler/CellProfiler) | Cell image analysis | cytotoxicity-assay-analyzer |

### Data Management

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OPTIMADE](https://github.com/Materials-Consortia/OPTIMADE) | Materials database API | materials-database-querier |
| [nomad](https://github.com/nomad-coe/nomad) | FAIR materials repository | materials-database-querier |
| [labgrid](https://github.com/labgrid-project/labgrid) | Lab automation | nanomaterial-lims-manager |

---

## MCP Server References

### Computational Infrastructure MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| VASP MCP | Remote VASP execution | vasp-dft-executor |
| Quantum ESPRESSO MCP | QE calculation management | quantum-espresso-executor |
| LAMMPS MCP | MD simulation execution | lammps-md-executor |
| GROMACS MCP | Biomolecular MD | gromacs-md-executor |
| COMSOL MCP | Multiphysics simulation | comsol-multiphysics-executor |
| HPC Scheduler MCP | SLURM/PBS job submission | All computational skills |

### Database MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| Materials Project MCP | MP database access | materials-database-querier |
| AFLOW MCP | AFLOW database queries | materials-database-querier |
| NOMAD MCP | FAIR repository | materials-database-querier |
| NanoHUB MCP | NanoHUB tool access | nanohub-simulator-interface |
| ICSD MCP | Crystal structures | xrd-crystallography-analyzer |

### Instrumentation MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| TEM/SEM MCP | Microscope control | tem-image-analyzer, sem-eds-analyzer |
| AFM MCP | SPM instrument control | afm-spm-analyzer |
| XRD MCP | Diffractometer control | xrd-crystallography-analyzer |
| DLS MCP | Light scattering instruments | dls-particle-sizer |
| Spectroscopy MCP | Spectrometer control | All spectroscopy skills |

### Cleanroom Equipment MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| EBL MCP | E-beam lithography control | ebl-process-controller |
| ALD MCP | Atomic layer deposition | ald-process-controller |
| CVD/PVD MCP | Deposition systems | cvd-pvd-process-controller |
| Plasma Etch MCP | Reactive ion etching | plasma-etch-controller |
| FIB MCP | Focused ion beam | fib-mill-controller |

### Laboratory Management MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| LIMS MCP | Lab information management | nanomaterial-lims-manager |
| ELN MCP | Electronic lab notebook | All synthesis skills |
| Scheduling MCP | Equipment booking | characterization-workflow-orchestrator |

---

## Community Resources

### Forums and Discussion

| Resource | URL | Topics |
|----------|-----|--------|
| Matter Modeling Stack Exchange | https://mattermodeling.stackexchange.com | Computational nanoscience |
| Materials Project Community | https://discuss.materialsproject.org | Materials databases |
| ResearchGate | https://www.researchgate.net | Research discussions |
| NanoHUB Discussions | https://nanohub.org/groups | Nanotechnology |
| LAMMPS Users | https://www.lammps.org/mailing.html | Molecular dynamics |
| VASP Forum | https://www.vasp.at/forum/ | DFT calculations |
| Reddit r/nanotechnology | https://reddit.com/r/nanotechnology | General nano |

### Documentation and Tutorials

| Resource | URL | Topics |
|----------|-----|--------|
| NanoHUB Tools | https://nanohub.org/resources/tools | Educational simulations |
| Materials Project Docs | https://docs.materialsproject.org | Computational materials |
| LAMMPS Documentation | https://docs.lammps.org | Molecular dynamics |
| Gwyddion Manual | http://gwyddion.net/documentation/ | SPM analysis |
| hyperspy Documentation | https://hyperspy.org/hyperspy-doc/current/ | EM data analysis |
| SasView Tutorials | https://www.sasview.org/docs/index.html | Small-angle scattering |

### Standards and Guidelines

| Organization | Standards/Guidelines | Topics |
|--------------|---------------------|--------|
| ISO | ISO/TS 80004, ISO/TR 13014, ISO/TR 12885 | Nanotechnology standards |
| ASTM | E2456, E2490, E2859, E2865 | Nano characterization |
| NIST | NIST Nanotechnology Portal | Reference materials |
| OECD | OECD Test Guidelines | Nanosafety testing |
| NIOSH | Nanomaterial guidelines | Occupational safety |
| FDA | Nanotechnology guidance | Regulatory guidance |
| EPA | TSCA nanomaterials | Environmental regulations |

### Research Databases and Repositories

| Database | URL | Topics |
|----------|-----|--------|
| Materials Project | https://materialsproject.org | Computed properties |
| AFLOW | http://www.aflowlib.org | High-throughput data |
| NOMAD | https://nomad-lab.eu | FAIR repository |
| NanoHUB | https://nanohub.org | Educational resources |
| eNanoMapper | https://www.enanomapper.net | Nanosafety database |
| NanoCommons | https://www.nanocommons.eu | Nanoinformatics |

---

## API Documentation

### Materials Databases

| API | Documentation | Purpose |
|-----|---------------|---------|
| Materials Project | https://docs.materialsproject.org/api | Computed properties |
| AFLOW REST API | http://www.aflowlib.org/API/ | AFLOW database |
| OPTIMADE | https://www.optimade.org/specification/ | Federated access |
| ICSD | https://icsd.fiz-karlsruhe.de | Crystal structures |
| PubChem | https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest | Chemical data |

### Computational Tools

| API | Documentation | Purpose |
|-----|---------------|---------|
| pymatgen | https://pymatgen.org/pymatgen.html | Materials analysis |
| ASE | https://wiki.fysik.dtu.dk/ase/ | Atomic simulations |
| atomate2 | https://materialsproject.github.io/atomate2/ | DFT workflows |
| MDAnalysis | https://docs.mdanalysis.org | MD analysis |
| hyperspy | https://hyperspy.org/hyperspy-doc/current/ | EM data analysis |

### NanoHUB API

| API | Documentation | Purpose |
|-----|---------------|---------|
| NanoHUB API | https://nanohub.org/developer/ | Tool access |
| Rappture | https://rappture.org | Tool development |
| HUBzero | https://hubzero.org/documentation | Platform API |

### Instrument Vendor APIs

| Vendor | Documentation | Purpose |
|--------|---------------|---------|
| Thermo Fisher | Vendor documentation | TEM, SEM, XPS |
| JEOL | Vendor documentation | Electron microscopy |
| Bruker | Vendor documentation | AFM, XRD |
| Malvern | Vendor documentation | DLS, NTA |
| Renishaw | Vendor documentation | Raman |
| PHI/ULVAC | Vendor documentation | XPS |

### Safety and Regulatory APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| eNanoMapper | https://www.enanomapper.net/api | Nanosafety data |
| PubChem | https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest | Chemical safety |
| ECHA | https://echa.europa.eu/de/support/dossier-submission-tools/reach-it/web-service-interface | REACH data |

---

## Applicable Skills from Other Specializations

### From Materials Science

| Skill | Original ID | Application in Nanotechnology |
|-------|-------------|-------------------------------|
| XRD Analysis Skill | SK-001 | Nanocrystal phase identification |
| Electron Microscopy Skill | SK-002 | Nanoparticle TEM/SEM imaging |
| Spectroscopy Analysis Skill | SK-003 | Optical characterization |
| Thermal Analysis Skill | SK-004 | Nanomaterial stability |
| Mechanical Testing Skill | SK-005 | Nanocomposite properties |
| DFT Calculation Skill | SK-008 | Electronic structure |
| Molecular Dynamics Skill | SK-009 | Nanoparticle dynamics |
| ML Prediction Skill | SK-012 | Property prediction |
| Failure Analysis Skill | SK-017 | Nanodevice failure |

### From Chemical Engineering

| Skill | Original ID | Application in Nanotechnology |
|-------|-------------|-------------------------------|
| Process Simulation Skill | Various | Synthesis process modeling |
| Reaction Kinetics Skill | Various | Nanoparticle growth kinetics |
| Scale-Up Analysis Skill | Various | Nano production scale-up |
| Heat Integration Skill | Various | Thermal processing |
| Process Control Skill | Various | Synthesis automation |
| Crystallization Design Skill | Various | Nanocrystal growth |

### From Biomedical Engineering

| Skill | Original ID | Application in Nanotechnology |
|-------|-------------|-------------------------------|
| Biological Evaluation Skill | Various | Nanomaterial biocompatibility |
| Drug Delivery Skill | Various | Nanoparticle drug loading |
| Cell Culture Skill | Various | In vitro nanotoxicology |
| Medical Image Processing Skill | Various | Nanoparticle imaging |
| Risk Management Skill | Various | Nanosafety risk assessment |

### From Electrical Engineering

| Skill | Original ID | Application in Nanotechnology |
|-------|-------------|-------------------------------|
| Test Automation Skill | SK-018 | Characterization automation |
| Semiconductor Design Skill | Various | Nanoelectronics |
| EMC Analysis Skill | SK-013 | Nanodevice interference |
| Reliability Analysis Skill | SK-020 | Nanodevice reliability |

### From Environmental Engineering

| Skill | Original ID | Application in Nanotechnology |
|-------|-------------|-------------------------------|
| LCA Assessment Skill | SK-020 | Nanomaterial lifecycle |
| Risk Assessment Skill | SK-012 | Environmental nanosafety |
| Water Treatment Skill | SK-001 | Nano for water treatment |
| Air Quality Skill | SK-006 | Nanoparticle emissions |

### From Industrial Engineering

| Skill | Original ID | Application in Nanotechnology |
|-------|-------------|-------------------------------|
| DOE Designer Skill | Various | Synthesis optimization |
| Statistical Analysis Skill | Various | Characterization data analysis |
| Process Capability Skill | Various | Synthesis reproducibility |
| Quality Control Skill | Various | Batch quality assurance |

### From Mechanical Engineering

| Skill | Original ID | Application in Nanotechnology |
|-------|-------------|-------------------------------|
| FEA Structural Skill | SK-001 | Nanostructure stress analysis |
| CFD Analysis Skill | SK-004 | Nanofluidics modeling |
| Thermal Analysis Skill | SK-005 | Thermal management |
| Test Planning Skill | SK-017 | Characterization test design |

### From Aerospace Engineering

| Skill | Original ID | Application in Nanotechnology |
|-------|-------------|-------------------------------|
| Composite Design Skill | Various | Nanocomposite structures |
| Thermal Analysis Skill | Various | Thermal protection |
| Environmental Testing Skill | Various | Nanomaterial qualification |

### From Bioinformatics

| Skill | Original ID | Application in Nanotechnology |
|-------|-------------|-------------------------------|
| Molecular Docking Skill | Various | Nanoparticle-protein interactions |
| Protein Structure Skill | Various | Corona formation modeling |
| Sequence Analysis Skill | Various | Targeting ligand design |

---

## Implementation Notes

### Priority Integration Points

1. **hyperspy**: Core electron microscopy analysis
2. **pymatgen/ASE**: Computational infrastructure
3. **LAMMPS/GROMACS**: Molecular dynamics
4. **Materials Project API**: Database integration
5. **matminer**: Machine learning for materials
6. **SasView**: Small-angle scattering analysis

### Cross-Specialization Synergies

- Materials Science shares most computational and characterization skills
- Chemical Engineering scale-up and process skills directly applicable
- Biomedical Engineering biocompatibility and drug delivery skills essential
- Environmental Engineering risk assessment for nanosafety
- Industrial Engineering DOE for synthesis optimization

### Recommended Implementation Order

1. Characterization infrastructure (hyperspy, Gwyddion, rampy)
2. Computational tools (pymatgen, ASE, LAMMPS)
3. Database integration (Materials Project, NOMAD)
4. Machine learning (matminer, GNN models)
5. Synthesis optimization (DOE, process control)
6. Safety assessment (toxicology, environmental fate)
7. Application-specific (drug delivery, sensors, catalysis)
8. Fabrication process (lithography, deposition)

### Data Management Priorities

- FAIR data principles (NOMAD, OPTIMADE)
- ISO nanotechnology standards compliance
- ELN integration for provenance
- Characterization data standardization
- Machine-readable formats (HDF5, JSON)

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Phase 6 - Skills and Agents Implementation
