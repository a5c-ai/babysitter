# Biomedical Engineering - Skills and Agents References (Phase 5)

This document provides reference materials, tools, libraries, and cross-specialization resources for implementing the skills and agents defined in the skills-agents-backlog.md.

---

## Table of Contents

1. [GitHub Repositories](#github-repositories)
2. [MCP Server References](#mcp-server-references)
3. [Community Resources](#community-resources)
4. [API Documentation](#api-documentation)
5. [Applicable Skills from Other Specializations](#applicable-skills-from-other-specializations)

---

## GitHub Repositories

### Regulatory and Compliance

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [FDA-My-Studies](https://github.com/GoogleCloudPlatform/fda-mystudies) | FDA research platform | clinical-study-designer |
| [openregulatory](https://github.com/openregulatory/templates) | QMS templates | iso-standards-compliance-checker |
| [FDA-submission-tools](https://github.com/FDA/openfda) | FDA data access | fda-510k-submission-generator |

### Biomechanics and FEA

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OpenSim](https://github.com/opensim-org/opensim-core) | Musculoskeletal modeling | opensim-modeler |
| [FEBio](https://github.com/febiosoftware/FEBio) | Finite element analysis | fea-mesh-generator |
| [pyNastran](https://github.com/SteveDoyle2/pyNastran) | NASTRAN interface | fea-mesh-generator |
| [meshio](https://github.com/nschloe/meshio) | Mesh I/O library | fea-mesh-generator |
| [pygmsh](https://github.com/nschloe/pygmsh) | Gmsh Python interface | fea-mesh-generator |
| [pyvista](https://github.com/pyvista/pyvista) | 3D visualization | fea-mesh-generator |

### Medical Imaging

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OHIF-Viewers](https://github.com/OHIF/Viewers) | DICOM viewer | dicom-conformance-validator |
| [dcm4che](https://github.com/dcm4che/dcm4che) | DICOM toolkit | dicom-conformance-validator |
| [pydicom](https://github.com/pydicom/pydicom) | Python DICOM library | dicom-conformance-validator |
| [SimpleITK](https://github.com/SimpleITK/SimpleITK) | Medical image analysis | image-algorithm-validator |
| [3D Slicer](https://github.com/Slicer/Slicer) | Medical imaging platform | image-algorithm-validator |
| [MONAI](https://github.com/Project-MONAI/MONAI) | Medical AI framework | aiml-validation-framework |
| [ITK](https://github.com/InsightSoftwareConsortium/ITK) | Insight Toolkit | image-algorithm-validator |

### AI/ML in Healthcare

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [MONAI](https://github.com/Project-MONAI/MONAI) | Medical AI framework | aiml-validation-framework |
| [TorchIO](https://github.com/fepegar/torchio) | Medical image transforms | aiml-validation-framework |
| [fairlearn](https://github.com/fairlearn/fairlearn) | ML fairness toolkit | aiml-validation-framework |
| [aif360](https://github.com/Trusted-AI/AIF360) | Bias detection | aiml-validation-framework |

### Biocompatibility and Materials

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [MaterialsProject](https://github.com/materialsproject/pymatgen) | Materials analysis | material-model-library |
| [ASE](https://github.com/rosswhitfield/ase) | Atomic simulation | material-model-library |

### Software Development

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [pytest](https://github.com/pytest-dev/pytest) | Testing framework | software-vv-test-generator |
| [hypothesis](https://github.com/HypothesisWorks/hypothesis) | Property-based testing | software-vv-test-generator |
| [coverage.py](https://github.com/nedbat/coveragepy) | Code coverage | software-vv-test-generator |
| [doorstop](https://github.com/doorstop-dev/doorstop) | Requirements management | requirements-traceability-manager |

### Tissue Engineering

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Materialise-3-matic](https://www.materialise.com/) | 3D printing tools | scaffold-design-optimizer |
| [nTopology](https://www.ntop.com/) | Lattice design | scaffold-design-optimizer |

---

## MCP Server References

### Regulatory Database MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **filesystem** | Access DHF, DMR, and documentation files | All regulatory skills |
| **github** | Version control for documentation | All skills |
| **postgres/sqlite** | Store compliance tracking data | iso-standards-compliance-checker |

### Potential Custom MCP Servers

| Server Concept | Description | Target Skills |
|----------------|-------------|---------------|
| **fda-gudid-mcp** | FDA GUDID database queries | fda-510k-submission-generator, udi-labeling-generator |
| **eudamed-mcp** | EUDAMED database integration | eu-mdr-gspr-mapper |
| **510k-database-mcp** | 510(k) predicate search | fda-510k-submission-generator |
| **pubmed-mcp** | Literature search | clinical-literature-reviewer |
| **maude-mcp** | FDA MAUDE adverse event database | adverse-event-reporter |
| **dicom-pacs-mcp** | PACS integration | dicom-conformance-validator |

### Clinical Data MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **clinicaltrials-mcp** | ClinicalTrials.gov access | clinical-study-designer |
| **medra-mcp** | MedDRA coding | adverse-event-reporter |
| **snomed-mcp** | SNOMED-CT terminology | clinical-study-designer |
| **icd-mcp** | ICD-10 coding | adverse-event-reporter |

### Simulation Tool MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **ansys-mcp** | ANSYS interface | fea-mesh-generator |
| **abaqus-mcp** | ABAQUS interface | fea-mesh-generator |
| **opensim-mcp** | OpenSim modeling | opensim-modeler |
| **matlab-mcp** | MATLAB execution | motion-capture-analyzer |

---

## Community Resources

### Professional Organizations

| Organization | Resources | Relevant Areas |
|--------------|-----------|----------------|
| [FDA CDRH](https://www.fda.gov/medical-devices) | Medical device guidance | All regulatory skills |
| [MDCG](https://health.ec.europa.eu/medical-devices-topics-interest/medical-device-coordination-group-mdcg_en) | EU MDR guidance | eu-mdr-gspr-mapper |
| [AAMI](https://www.aami.org/) | Standards, technical information | All standards skills |
| [RAPS](https://www.raps.org/) | Regulatory affairs | Regulatory skills |
| [BMES](https://www.bmes.org/) | Biomedical engineering society | All disciplines |
| [ISO TC 194](https://www.iso.org/committee/54508.html) | Biological evaluation | iso10993-evaluator |
| [ISO TC 210](https://www.iso.org/committee/54892.html) | Medical devices quality | iso-standards-compliance-checker |

### Forums and Communities

| Community | Focus Area | URL |
|-----------|------------|-----|
| MedDev LinkedIn | Medical device professionals | https://www.linkedin.com/groups/120887/ |
| RegDesk | Regulatory discussions | https://www.regdesk.co/ |
| Emergo | Regulatory resources | https://www.emergobyul.com/resources |
| r/biomedicalengineering | Reddit community | https://www.reddit.com/r/biomedicalengineering/ |
| Eng-Tips Biomedical | Engineering forums | https://www.eng-tips.com/ |

### Educational Resources

| Resource | Description | Topics |
|----------|-------------|--------|
| [FDA Learning Portal](https://www.fda.gov/training-and-continuing-education) | FDA training | Regulatory compliance |
| [AAMI Courses](https://www.aami.org/education) | Standards training | ISO standards |
| [Greenlight Guru Academy](https://www.greenlight.guru/academy) | QMS training | Design control, QMS |
| [PRRC Courses](https://www.prrc.com/) | EU MDR training | European regulations |
| [OpenSim Documentation](https://opensim.stanford.edu/support/index.html) | Biomechanics tutorials | opensim-modeler |

### Documentation and Tutorials

| Resource | Description | Skills |
|----------|-------------|--------|
| [FDA Guidance Documents](https://www.fda.gov/regulatory-information/search-fda-guidance-documents) | Official guidance | All FDA-related skills |
| [EU MDR Portal](https://ec.europa.eu/health/md_sector/overview_en) | MDR resources | eu-mdr-gspr-mapper |
| [ISO Store](https://www.iso.org/store.html) | Official standards | All ISO skills |
| [IMDRF Documents](https://www.imdrf.org/documents) | Global harmonization | All regulatory skills |
| [FEBio Documentation](https://febio.org/documentation/) | FEA tutorials | fea-mesh-generator |

---

## API Documentation

### Regulatory Database APIs

| Database | API Documentation | Integration Skills |
|----------|-------------------|-------------------|
| FDA GUDID | [GUDID API](https://accessgudid.nlm.nih.gov/resources/developers) | udi-labeling-generator |
| FDA 510(k) | [openFDA Device 510(k)](https://open.fda.gov/apis/device/510k/) | fda-510k-submission-generator |
| FDA MAUDE | [openFDA Device Events](https://open.fda.gov/apis/device/event/) | adverse-event-reporter |
| FDA Recalls | [openFDA Device Recalls](https://open.fda.gov/apis/device/recall/) | adverse-event-reporter |
| FDA Classification | [openFDA Classification](https://open.fda.gov/apis/device/classification/) | fda-510k-submission-generator |
| ClinicalTrials.gov | [ClinicalTrials API](https://clinicaltrials.gov/ct2/resources/download) | clinical-study-designer |

### Medical Imaging APIs

| System | API Documentation | Integration Skills |
|--------|-------------------|-------------------|
| DICOM | [DICOM Standard](https://www.dicomstandard.org/) | dicom-conformance-validator |
| DICOMweb | [DICOMweb Standard](https://www.dicomstandard.org/using/dicomweb) | dicom-conformance-validator |
| IHE Profiles | [IHE Profiles](https://www.ihe.net/resources/profiles/) | dicom-conformance-validator |
| HL7 FHIR | [FHIR Documentation](https://www.hl7.org/fhir/) | dicom-conformance-validator |

### Scientific Computing APIs

| Tool | API Documentation | Integration Skills |
|------|-------------------|-------------------|
| OpenSim | [OpenSim API](https://simtk-confluence.stanford.edu:8443/display/OpenSim/OpenSim+API) | opensim-modeler |
| FEBio | [FEBio Documentation](https://febio.org/febio/febio-documentation/) | fea-mesh-generator |
| SimpleITK | [SimpleITK Notebooks](https://simpleitk.readthedocs.io/) | image-algorithm-validator |
| MONAI | [MONAI Documentation](https://docs.monai.io/) | aiml-validation-framework |
| PyMOL | [PyMOL API](https://pymol.org/2/support.html) | structural modeling |

### Standards References

| Standard | Documentation | Skills |
|----------|---------------|--------|
| ISO 13485 | Quality management systems | iso-standards-compliance-checker |
| ISO 14971 | Risk management | iso14971-risk-analyzer |
| IEC 62304 | Software lifecycle | iec62304-lifecycle-manager |
| IEC 60601 | Electrical safety | iso-standards-compliance-checker |
| IEC 62366-1 | Usability engineering | use-related-risk-analyzer |
| ISO 10993 | Biological evaluation | iso10993-evaluator |
| ISO 11607 | Packaging validation | packaging-validation-planner |
| ISO 11135/11137/17665 | Sterilization | sterilization-validation-planner |

---

## Applicable Skills from Other Specializations

### From Aerospace Engineering

| Skill | Description | Application in Biomedical |
|-------|-------------|---------------------------|
| SK-007: FEA Structural | Finite element analysis | Device structural analysis |
| SK-018: Requirements Verification | Traceability matrix | Design control documentation |
| SK-022: Safety Assessment (ARP4761) | Safety methods | Adaptable for ISO 14971 |
| SK-023: DO-178C Compliance | Software certification | Principles for IEC 62304 |

### From Automotive Engineering

| Skill | Description | Application in Biomedical |
|-------|-------------|---------------------------|
| SK-007: ISO 26262 Compliance | Functional safety | Similar methods for ISO 14971 |
| SK-013: Requirements Engineering | Requirements management | Design control requirements |
| SK-024: MISRA C/C++ Compliance | Code quality | Medical device software quality |

### From Bioinformatics

| Skill | Description | Application in Biomedical |
|-------|-------------|---------------------------|
| nextflow-pipeline-executor | Workflow automation | Image processing pipelines |
| aiml-validation-framework | ML validation | AI/ML medical device validation |
| clinical-study-designer | Study design | Device clinical trials |

### From Chemical Engineering

| Skill | Description | Application in Biomedical |
|-------|-------------|---------------------------|
| hazop-facilitator | Process hazard analysis | Medical device FMEA |
| lca-analyzer | Life cycle assessment | Device environmental impact |
| process-economics-estimator | Cost estimation | Manufacturing cost analysis |

### From Civil Engineering

| Skill | Description | Application in Biomedical |
|-------|-------------|---------------------------|
| fea-structural-engine | Structural FEA | Implant structural analysis |
| engineering-report-generator | Report generation | Technical documentation |

### From Software Engineering (Generic)

| Skill | Description | Application in Biomedical |
|-------|-------------|---------------------------|
| ci-cd-pipeline | Continuous integration | Medical software CI/CD |
| testing-frameworks | Test automation | Software V&V automation |
| code-coverage | Coverage analysis | IEC 62304 compliance |
| version-control | Configuration management | DHF/DMR management |

### Cross-Specialization Agent Applicability

| Agent Source | Agent | Biomedical Application |
|--------------|-------|------------------------|
| Aerospace | safety-specialist | Risk management coordination |
| Aerospace | software-certification-specialist | IEC 62304 compliance |
| Automotive | functional-safety-expert | ISO 14971 risk analysis |
| Chemical | risk-analyst | Process risk assessment |
| Software Eng | qa-engineer | Software V&V |

---

## Integration Recommendations

### Priority Tool Integrations

1. **FDA openAPI** - 510(k), GUDID, MAUDE database access
2. **pydicom/OHIF** - DICOM handling and visualization
3. **OpenSim** - Biomechanical modeling
4. **SimpleITK/MONAI** - Medical image processing
5. **doorstop** - Requirements traceability

### Recommended MCP Server Development

1. **fda-regulatory-mcp** - FDA database integration
2. **dicom-mcp** - DICOM operations and queries
3. **clinical-trial-mcp** - ClinicalTrials.gov integration
4. **standards-compliance-mcp** - ISO/IEC compliance checking
5. **dhf-management-mcp** - Design History File management

### Data Standards to Support

- **DICOM** - Medical imaging format
- **HL7 FHIR** - Healthcare data exchange
- **HL7 v2** - Legacy healthcare messages
- **QSR (21 CFR 820)** - FDA QMS requirements
- **MDR/IVDR** - EU device regulations
- **UDI** - Unique Device Identification
- **GHTF/IMDRF** - Global harmonization documents

---

## Summary

This reference document provides the foundational resources for implementing biomedical engineering skills and agents:

| Category | Count |
|----------|-------|
| GitHub Repositories | 25+ |
| MCP Server References | 15+ |
| Community Resources | 20+ |
| API Documentation Sources | 25+ |
| Cross-Specialization Skills | 15+ |

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Implement specialized skills and agents using these references
