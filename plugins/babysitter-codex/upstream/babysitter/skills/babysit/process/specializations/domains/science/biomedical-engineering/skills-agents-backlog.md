# Biomedical Engineering - Skills and Agents Backlog (Phase 4)

## Overview

This backlog identifies specialized skills and agents that could enhance the Biomedical Engineering processes beyond general-purpose capabilities. Each skill or agent is designed to provide domain-specific tooling, validation, or automation for medical device development, regulatory compliance, biomechanics analysis, tissue engineering, and clinical evidence generation workflows.

## Summary Statistics

- **Total Skills Identified**: 32
- **Total Agents Identified**: 22
- **Shared Candidates (Cross-Specialization)**: 12
- **Categories**: 8 (Regulatory Compliance, Design Control, Risk Management, Biomechanics, Biocompatibility, Medical Software, Clinical Evidence, Manufacturing)

---

## Skills

### Regulatory Compliance Skills

#### 1. fda-510k-submission-generator
**Description**: Automated 510(k) premarket notification preparation skill for generating submission packages, predicate device comparisons, and substantial equivalence arguments.

**Capabilities**:
- Predicate device database search and comparison
- Substantial equivalence argument drafting
- Device description template generation
- Performance data tabulation
- eCopy package structure validation
- FDA eSTAR form population assistance

**Used By Processes**:
- 510(k) Premarket Submission Preparation
- EU MDR Technical Documentation
- Post-Market Surveillance System Implementation

**Tools/Libraries**: FDA GUDID API, 510(k) Database, eSTAR templates

---

#### 2. eu-mdr-gspr-mapper
**Description**: EU MDR General Safety and Performance Requirements (GSPR) mapping and compliance documentation skill.

**Capabilities**:
- GSPR checklist generation by device classification
- Annex I requirement mapping
- Compliance evidence linkage
- Gap analysis reporting
- SSCP (Summary of Safety and Clinical Performance) drafting
- UDI-DI assignment assistance

**Used By Processes**:
- EU MDR Technical Documentation
- Clinical Evaluation Report Development
- Post-Market Surveillance System Implementation

**Tools/Libraries**: EUDAMED integration, MDR Annex templates

---

#### 3. iso-standards-compliance-checker
**Description**: Medical device standards compliance verification skill for ISO 13485, ISO 14971, IEC 62304, IEC 60601, and related standards.

**Capabilities**:
- Standards applicability determination
- Compliance checklist generation
- Gap analysis against standard clauses
- Evidence mapping to requirements
- Harmonized standards cross-reference
- Declaration of Conformity assistance

**Used By Processes**:
- Design Control Process Implementation
- Medical Device Risk Management (ISO 14971)
- Software Development Lifecycle (IEC 62304)
- EU MDR Technical Documentation

**Tools/Libraries**: ISO standards database, FDA recognized consensus standards list

---

#### 4. udi-labeling-generator
**Description**: Unique Device Identification (UDI) and labeling compliance skill for generating compliant labels and device identifiers.

**Capabilities**:
- UDI-DI and UDI-PI generation
- GUDID data submission preparation
- Label content validation
- IFU (Instructions for Use) template generation
- Multi-language labeling support
- Symbol compliance verification (ISO 15223-1)

**Used By Processes**:
- 510(k) Premarket Submission Preparation
- EU MDR Technical Documentation
- Design Control Process Implementation

**Tools/Libraries**: FDA GUDID API, GS1 standards, EUDAMED

---

### Design Control Skills

#### 5. requirements-traceability-manager
**Description**: Design control traceability skill for managing user needs, design inputs, design outputs, and verification/validation linkages.

**Capabilities**:
- Bidirectional traceability matrix generation
- Requirements coverage analysis
- Gap identification in V&V coverage
- Design change impact analysis
- Traceability report generation
- DHF (Design History File) completeness checking

**Used By Processes**:
- Design Control Process Implementation
- Verification and Validation Test Planning
- Software Development Lifecycle (IEC 62304)

**Tools/Libraries**: Jama Connect, Polarion, DOORS integration

---

#### 6. design-review-facilitator
**Description**: Design review planning and execution skill for structured design phase gate reviews per 21 CFR 820.30.

**Capabilities**:
- Design review agenda generation
- Review checklist by phase (input, output, verification, validation, transfer)
- Action item tracking
- Review record documentation
- Cross-functional reviewer identification
- Risk review integration

**Used By Processes**:
- Design Control Process Implementation
- Verification and Validation Test Planning
- Design for Manufacturing and Assembly (DFMA)

**Tools/Libraries**: Review templates, checklists per FDA guidance

---

#### 7. design-fmea-generator
**Description**: Design Failure Mode and Effects Analysis (DFMEA) skill for systematic design risk identification.

**Capabilities**:
- DFMEA worksheet generation
- Failure mode brainstorming support
- Severity, Occurrence, Detection rating guidance
- RPN (Risk Priority Number) calculation
- Recommended action tracking
- Control plan linkage

**Used By Processes**:
- Medical Device Risk Management (ISO 14971)
- Design Control Process Implementation
- Design for Manufacturing and Assembly (DFMA)

**Tools/Libraries**: AIAG FMEA templates, ISO 14971 alignment

---

### Risk Management Skills

#### 8. iso14971-risk-analyzer
**Description**: Comprehensive risk management skill implementing ISO 14971:2019 methodology for medical device risk analysis.

**Capabilities**:
- Hazard identification questionnaire generation
- Hazardous situation analysis templates
- Risk estimation matrix configuration
- Risk acceptability criteria setup
- Risk control measure tracking
- Residual risk evaluation
- Benefit-risk analysis documentation

**Used By Processes**:
- Medical Device Risk Management (ISO 14971)
- Human Factors Engineering and Usability
- 510(k) Premarket Submission Preparation
- EU MDR Technical Documentation

**Tools/Libraries**: ISO 14971 templates, risk matrix tools

---

#### 9. use-related-risk-analyzer
**Description**: Use-related risk analysis skill for identifying hazards associated with user interaction per IEC 62366-1.

**Capabilities**:
- Use scenario identification
- Task analysis decomposition
- Use error categorization (perception, cognition, action)
- Known use problems database search
- Risk mitigation strategy development
- Training vs. design solution recommendations

**Used By Processes**:
- Human Factors Engineering and Usability
- Medical Device Risk Management (ISO 14971)
- Verification and Validation Test Planning

**Tools/Libraries**: FDA Human Factors guidance, AAMI HE75

---

#### 10. cybersecurity-risk-assessor
**Description**: Medical device cybersecurity risk assessment skill per FDA premarket and postmarket guidance.

**Capabilities**:
- Threat modeling (STRIDE methodology)
- Vulnerability assessment
- SBOM (Software Bill of Materials) generation
- Security control identification
- Penetration testing planning
- Cybersecurity documentation for FDA submissions

**Used By Processes**:
- Software Development Lifecycle (IEC 62304)
- Medical Device Risk Management (ISO 14971)
- 510(k) Premarket Submission Preparation

**Tools/Libraries**: FDA Cybersecurity guidance, IEC 81001-5-1, SBOM tools

---

### Biomechanics and Structural Analysis Skills

#### 11. fea-mesh-generator
**Description**: Finite element mesh generation skill optimized for biomedical geometries including implants, anatomical structures, and tissue models.

**Capabilities**:
- Automatic mesh generation from CAD/STL
- Mesh quality assessment and repair
- Boundary layer meshing for fluid-structure
- Mesh convergence study automation
- Anatomical landmark identification
- Patient-specific mesh generation from imaging

**Used By Processes**:
- Finite Element Analysis for Medical Devices
- Orthopedic Implant Biomechanical Testing
- Gait Analysis and Musculoskeletal Modeling

**Tools/Libraries**: ANSYS, Abaqus, COMSOL, Mimics, 3-matic

---

#### 12. material-model-library
**Description**: Biomaterial constitutive model library skill providing validated material properties for biological tissues and implant materials.

**Capabilities**:
- Tissue material property database (bone, cartilage, soft tissue)
- Hyperelastic model parameter sets (Mooney-Rivlin, Ogden)
- Viscoelastic and poroelastic models
- Implant material database (Ti-6Al-4V, CoCrMo, PEEK)
- Degradation model parameters
- Temperature and rate-dependent properties

**Used By Processes**:
- Finite Element Analysis for Medical Devices
- Biomaterial Selection and Characterization
- Orthopedic Implant Biomechanical Testing

**Tools/Libraries**: Material property databases, literature compilations

---

#### 13. fatigue-life-predictor
**Description**: Fatigue life prediction skill for implants and load-bearing devices using validated approaches.

**Capabilities**:
- S-N curve generation and analysis
- Strain-life fatigue modeling
- Multiaxial fatigue assessment
- Fretting fatigue evaluation
- Corrosion fatigue considerations
- Goodman diagram construction
- Run-out criteria application

**Used By Processes**:
- Finite Element Analysis for Medical Devices
- Orthopedic Implant Biomechanical Testing
- Design Control Process Implementation

**Tools/Libraries**: fe-safe, ANSYS nCode, ASTM F1717/F2077 standards

---

#### 14. motion-capture-analyzer
**Description**: Motion capture data processing and analysis skill for gait analysis and biomechanical studies.

**Capabilities**:
- Marker data processing and gap-filling
- Inverse kinematics calculation
- Ground reaction force analysis
- Joint angle computation
- Spatiotemporal parameter extraction
- Statistical parametric mapping
- Normative database comparison

**Used By Processes**:
- Gait Analysis and Musculoskeletal Modeling
- Human Factors Engineering and Usability
- Clinical Study Design and Execution

**Tools/Libraries**: Vicon, OptiTrack, OpenSim, Visual3D

---

#### 15. opensim-modeler
**Description**: OpenSim musculoskeletal modeling skill for biomechanical simulation and analysis.

**Capabilities**:
- Model scaling to subject anthropometry
- Inverse kinematics and dynamics
- Static optimization
- Computed muscle control
- Joint reaction analysis
- Custom model development
- Prosthetic/orthotic integration

**Used By Processes**:
- Gait Analysis and Musculoskeletal Modeling
- Orthopedic Implant Biomechanical Testing
- Clinical Study Design and Execution

**Tools/Libraries**: OpenSim, MATLAB, Python scripting

---

### Biocompatibility and Materials Skills

#### 16. iso10993-evaluator
**Description**: Biological evaluation planning skill implementing ISO 10993-1 for biocompatibility testing strategy.

**Capabilities**:
- Device categorization (body contact, duration)
- Testing endpoint determination matrix
- Existing data evaluation guidance
- Equivalence assessment templates
- Gap analysis for testing requirements
- Biological evaluation plan generation
- Report template generation

**Used By Processes**:
- Biological Evaluation Planning (ISO 10993)
- Extractables and Leachables Analysis
- Biomaterial Selection and Characterization

**Tools/Libraries**: ISO 10993 series, FDA G95-1 guidance

---

#### 17. extractables-leachables-analyzer
**Description**: E&L study design and data analysis skill for chemical characterization of medical devices.

**Capabilities**:
- Extraction solvent and condition selection
- Analytical method recommendations (GC-MS, LC-MS, ICP)
- AET (Analytical Evaluation Threshold) calculation
- Compound identification assistance
- Toxicological risk assessment templates
- ICH Q3D elemental impurity guidance
- Study protocol generation

**Used By Processes**:
- Extractables and Leachables Analysis
- Biological Evaluation Planning (ISO 10993)
- Biomaterial Selection and Characterization

**Tools/Libraries**: Mass spectral databases, toxicology databases (ToxNet)

---

#### 18. biocompatibility-test-selector
**Description**: Biocompatibility test selection and protocol recommendation skill based on device categorization.

**Capabilities**:
- Test battery recommendation by category
- ISO 10993 part selection guidance
- Test lab capability assessment
- Protocol review checklist
- In vitro vs. in vivo decision support
- Alternative testing approaches (21st century toxicology)
- Cost and timeline estimation

**Used By Processes**:
- Biological Evaluation Planning (ISO 10993)
- Biomaterial Selection and Characterization
- 510(k) Premarket Submission Preparation

**Tools/Libraries**: ISO 10993 test standards, ICCVAM methods

---

### Medical Device Software Skills

#### 19. iec62304-lifecycle-manager
**Description**: Medical device software lifecycle management skill implementing IEC 62304 requirements.

**Capabilities**:
- Software safety classification (Class A, B, C)
- Software development plan template generation
- SOUP (Software of Unknown Provenance) management
- Software architecture documentation templates
- Anomaly and problem tracking
- Configuration management guidance
- Maintenance planning

**Used By Processes**:
- Software Development Lifecycle (IEC 62304)
- Software Verification and Validation
- AI/ML Medical Device Development

**Tools/Libraries**: IEC 62304 templates, AAMI TIR45

---

#### 20. software-vv-test-generator
**Description**: Medical device software verification and validation test case generation skill.

**Capabilities**:
- Requirements-based test case derivation
- Unit test framework setup (embedded and application)
- Integration test planning
- System test protocol generation
- Test coverage analysis (statement, branch, MC/DC)
- Traceability matrix generation
- Test report templates

**Used By Processes**:
- Software Verification and Validation
- Software Development Lifecycle (IEC 62304)
- AI/ML Medical Device Development

**Tools/Libraries**: pytest, GoogleTest, LDRA, VectorCAST

---

#### 21. aiml-validation-framework
**Description**: AI/ML medical device validation skill implementing FDA's GMLP principles.

**Capabilities**:
- Training data quality assessment
- Ground truth labeling validation
- Model performance metrics calculation (AUC, sensitivity, specificity)
- Subgroup performance analysis
- Bias and fairness evaluation
- Predetermined change control plan (PCCP) templates
- Clinical validation study design
- Locked algorithm vs. adaptive documentation

**Used By Processes**:
- AI/ML Medical Device Development
- Software Verification and Validation
- Clinical Evaluation Report Development

**Tools/Libraries**: FDA AI/ML guidance, GMLP principles, fairness toolkits

---

#### 22. dicom-conformance-validator
**Description**: DICOM conformance testing and integration skill for medical imaging systems.

**Capabilities**:
- DICOM Conformance Statement generation
- Service class (SCP/SCU) implementation verification
- PACS integration testing
- IHE profile conformance checking
- Worklist integration validation
- WADO-RS/DICOMweb compliance
- HL7 FHIR integration support

**Used By Processes**:
- DICOM Integration and Interoperability
- Medical Image Processing Algorithm Development
- Software Verification and Validation

**Tools/Libraries**: DVTk, DCMTK, Pydicom, OHIF

---

### Clinical Evidence Skills

#### 23. clinical-literature-reviewer
**Description**: Systematic literature review skill for clinical evaluation supporting regulatory submissions.

**Capabilities**:
- Literature search strategy development (PubMed, Embase, Cochrane)
- PICO framework application
- Abstract screening criteria
- Data extraction templates
- Appraisal of clinical data quality
- Evidence synthesis and summary tables
- MEDDEV 2.7/1 compliance checking

**Used By Processes**:
- Clinical Evaluation Report Development
- Clinical Study Design and Execution
- EU MDR Technical Documentation

**Tools/Libraries**: PubMed API, Cochrane Library, systematic review tools

---

#### 24. clinical-study-designer
**Description**: Clinical study design skill for medical device trials including IDE studies and post-market studies.

**Capabilities**:
- Study design selection (RCT, single-arm, registry)
- Endpoint definition guidance
- Sample size calculation (superiority, non-inferiority, equivalence)
- Protocol template generation
- Informed consent template generation
- CRF design assistance
- Statistical analysis plan development

**Used By Processes**:
- Clinical Study Design and Execution
- Clinical Evaluation Report Development
- AI/ML Medical Device Development

**Tools/Libraries**: PASS, nQuery, FDA IDE guidance, ISO 14155

---

#### 25. adverse-event-reporter
**Description**: Adverse event monitoring and reporting skill for MDR/MEDWATCH compliance.

**Capabilities**:
- MDR reportability assessment
- FDA Form 3500A population assistance
- MEDWATCH submission guidance
- EU vigilance reporting templates
- Trend analysis and signal detection
- PSUR data compilation
- Field safety corrective action templates

**Used By Processes**:
- Post-Market Surveillance System Implementation
- Clinical Evaluation Report Development
- Medical Device Risk Management (ISO 14971)

**Tools/Libraries**: FDA MAUDE database, EUDAMED, MedDRA coding

---

### Sterilization and Manufacturing Skills

#### 26. sterilization-validation-planner
**Description**: Sterilization process validation planning skill for EO, radiation, and steam sterilization.

**Capabilities**:
- Sterilization method selection guidance
- Bioburden determination protocol
- Dose setting (ISO 11137) or half-cycle development
- IQ/OQ/PQ protocol templates
- Sterility test requirements
- Parametric release guidance
- Revalidation scheduling

**Used By Processes**:
- Sterilization Validation
- Sterile Barrier System Validation
- Design for Manufacturing and Assembly (DFMA)

**Tools/Libraries**: ISO 11135, ISO 11137, ISO 17665, AAMI standards

---

#### 27. packaging-validation-planner
**Description**: Sterile barrier system validation planning skill per ISO 11607.

**Capabilities**:
- Packaging material qualification guidance
- Seal strength optimization protocols
- Package integrity test selection
- Accelerated aging study design (ASTM F1980)
- Distribution simulation planning (ISTA protocols)
- Shelf life determination
- Packaging validation protocol templates

**Used By Processes**:
- Sterile Barrier System Validation
- Sterilization Validation
- Design Control Process Implementation

**Tools/Libraries**: ISO 11607, ASTM F1980, ISTA protocols

---

#### 28. process-fmea-generator
**Description**: Process Failure Mode and Effects Analysis (PFMEA) skill for manufacturing risk assessment.

**Capabilities**:
- PFMEA worksheet generation
- Process step decomposition
- Failure mode identification by process type
- Control plan development
- Statistical process control recommendations
- Inspection point identification
- OOS/OOT handling procedures

**Used By Processes**:
- Design for Manufacturing and Assembly (DFMA)
- Sterilization Validation
- Design Control Process Implementation

**Tools/Libraries**: AIAG PFMEA templates, ISO 13485 alignment

---

### Tissue Engineering Skills

#### 29. scaffold-design-optimizer
**Description**: Tissue engineering scaffold design optimization skill for pore size, porosity, and mechanical properties.

**Capabilities**:
- Pore architecture design (gradient, uniform)
- Porosity calculation and optimization
- Mechanical property prediction
- Degradation rate modeling
- Surface area calculation
- Nutrient transport modeling
- Fabrication parameter recommendations

**Used By Processes**:
- Scaffold Fabrication and Characterization
- Cell Culture and Tissue Construct Development
- Biomaterial Selection and Characterization

**Tools/Libraries**: CAD software, lattice structure generators

---

#### 30. bioreactor-protocol-generator
**Description**: Bioreactor culture protocol development skill for tissue construct maturation.

**Capabilities**:
- Bioreactor type selection guidance
- Mechanical conditioning protocol design
- Perfusion flow rate optimization
- Gas exchange parameter calculation
- Culture duration recommendations
- Monitoring parameter identification
- Aseptic technique checklists

**Used By Processes**:
- Cell Culture and Tissue Construct Development
- Scaffold Fabrication and Characterization

**Tools/Libraries**: Bioreactor specifications, culture optimization literature

---

### Medical Imaging Skills

#### 31. image-algorithm-validator
**Description**: Medical image processing algorithm validation skill for segmentation, detection, and analysis algorithms.

**Capabilities**:
- Ground truth dataset curation guidance
- Performance metric calculation (Dice, IoU, sensitivity, specificity)
- Inter-observer variability analysis
- Statistical comparison methods
- Validation dataset stratification
- Multi-reader multi-case study design
- FDA AI/ML guidance alignment

**Used By Processes**:
- Medical Image Processing Algorithm Development
- AI/ML Medical Device Development
- Clinical Evaluation Report Development

**Tools/Libraries**: SimpleITK, scikit-image, MONAI, evaluation frameworks

---

#### 32. prosthetics-design-optimizer
**Description**: Prosthetics and orthotics design optimization skill integrating biomechanical requirements with manufacturing constraints.

**Capabilities**:
- Socket design parameterization
- Load distribution analysis
- Alignment optimization
- Component selection guidance
- Suspension system design
- Cosmesis integration
- Patient-specific customization from scanning

**Used By Processes**:
- Gait Analysis and Musculoskeletal Modeling
- Finite Element Analysis for Medical Devices
- Design Control Process Implementation

**Tools/Libraries**: CAD/CAM systems, 3D scanning, OpenSim

---

## Agents

### Regulatory Affairs Agents

#### 1. regulatory-submission-strategist
**Description**: Agent specialized in regulatory pathway determination, submission strategy, and timeline planning.

**Responsibilities**:
- Regulatory pathway selection (510(k), De Novo, PMA, CE marking)
- Predicate device identification and comparison
- Submission timeline development
- Pre-submission meeting preparation
- International regulatory strategy alignment
- Regulatory risk assessment

**Used By Processes**:
- 510(k) Premarket Submission Preparation
- EU MDR Technical Documentation
- Clinical Study Design and Execution

**Required Skills**: fda-510k-submission-generator, eu-mdr-gspr-mapper, iso-standards-compliance-checker

---

#### 2. clinical-evidence-specialist
**Description**: Agent specialized in clinical evidence planning, literature review, and clinical evaluation report development.

**Responsibilities**:
- Clinical evidence gap analysis
- Literature search strategy execution
- Data appraisal and synthesis
- Equivalence determination
- CER writing and updating
- PMCF plan development

**Used By Processes**:
- Clinical Evaluation Report Development
- Clinical Study Design and Execution
- Post-Market Surveillance System Implementation

**Required Skills**: clinical-literature-reviewer, clinical-study-designer, adverse-event-reporter

---

#### 3. post-market-surveillance-manager
**Description**: Agent specialized in post-market surveillance system implementation and vigilance reporting.

**Responsibilities**:
- Complaint trend analysis
- Adverse event assessment and reporting
- PSUR preparation
- PMCF study coordination
- Field action management
- Regulatory notification coordination

**Used By Processes**:
- Post-Market Surveillance System Implementation
- Clinical Evaluation Report Development
- Medical Device Risk Management (ISO 14971)

**Required Skills**: adverse-event-reporter, iso14971-risk-analyzer, clinical-literature-reviewer

---

### Design Control Agents

#### 4. design-control-manager
**Description**: Agent specialized in design control process implementation and DHF management.

**Responsibilities**:
- Design phase gate management
- Requirements traceability oversight
- Design review facilitation
- V&V planning coordination
- Design change control
- DHF compilation and maintenance

**Used By Processes**:
- Design Control Process Implementation
- Verification and Validation Test Planning
- Design for Manufacturing and Assembly (DFMA)

**Required Skills**: requirements-traceability-manager, design-review-facilitator, design-fmea-generator

---

#### 5. human-factors-engineer
**Description**: Agent specialized in human factors engineering and usability evaluation for medical devices.

**Responsibilities**:
- Use-related risk analysis
- User profile development
- Task analysis execution
- Formative evaluation planning
- Usability validation study design
- Use error root cause analysis

**Used By Processes**:
- Human Factors Engineering and Usability
- Design Control Process Implementation
- Verification and Validation Test Planning

**Required Skills**: use-related-risk-analyzer, iso14971-risk-analyzer, clinical-study-designer

---

#### 6. vv-test-engineer
**Description**: Agent specialized in verification and validation test planning, execution, and reporting.

**Responsibilities**:
- Test protocol development
- Test method validation
- Sample size determination
- Test execution oversight
- Results analysis and reporting
- Non-conformance investigation

**Used By Processes**:
- Verification and Validation Test Planning
- Software Verification and Validation
- Sterilization Validation

**Required Skills**: requirements-traceability-manager, software-vv-test-generator, iso-standards-compliance-checker

---

### Risk Management Agents

#### 7. risk-manager
**Description**: Agent specialized in ISO 14971 risk management throughout the device lifecycle.

**Responsibilities**:
- Risk management planning
- Hazard identification facilitation
- Risk estimation and evaluation
- Risk control implementation tracking
- Residual risk acceptance
- Benefit-risk analysis

**Used By Processes**:
- Medical Device Risk Management (ISO 14971)
- Human Factors Engineering and Usability
- Biological Evaluation Planning (ISO 10993)

**Required Skills**: iso14971-risk-analyzer, use-related-risk-analyzer, design-fmea-generator

---

#### 8. cybersecurity-specialist
**Description**: Agent specialized in medical device cybersecurity risk assessment and mitigation.

**Responsibilities**:
- Threat modeling
- Vulnerability assessment coordination
- Security control implementation
- Penetration testing coordination
- SBOM maintenance
- Cybersecurity submission documentation

**Used By Processes**:
- Software Development Lifecycle (IEC 62304)
- Medical Device Risk Management (ISO 14971)
- 510(k) Premarket Submission Preparation

**Required Skills**: cybersecurity-risk-assessor, software-vv-test-generator, iso14971-risk-analyzer

---

### Biomechanics Agents

#### 9. biomechanical-analyst
**Description**: Agent specialized in biomechanical analysis, FEA, and implant performance evaluation.

**Responsibilities**:
- FEA model development and validation
- Loading condition definition
- Stress and fatigue analysis
- Model verification against bench testing
- Design optimization recommendations
- Report generation

**Used By Processes**:
- Finite Element Analysis for Medical Devices
- Orthopedic Implant Biomechanical Testing
- Design Control Process Implementation

**Required Skills**: fea-mesh-generator, material-model-library, fatigue-life-predictor

---

#### 10. gait-biomechanist
**Description**: Agent specialized in gait analysis, musculoskeletal modeling, and prosthetics/orthotics evaluation.

**Responsibilities**:
- Motion capture data collection planning
- Gait data processing and analysis
- Musculoskeletal model development
- Muscle force and joint loading analysis
- Clinical outcome correlation
- Report generation

**Used By Processes**:
- Gait Analysis and Musculoskeletal Modeling
- Clinical Study Design and Execution
- Human Factors Engineering and Usability

**Required Skills**: motion-capture-analyzer, opensim-modeler, prosthetics-design-optimizer

---

#### 11. orthopedic-test-engineer
**Description**: Agent specialized in orthopedic implant mechanical testing per ASTM and ISO standards.

**Responsibilities**:
- Test standard identification
- Test fixture design coordination
- Test protocol development
- Testing execution oversight
- Data analysis and reporting
- Standard compliance verification

**Used By Processes**:
- Orthopedic Implant Biomechanical Testing
- Finite Element Analysis for Medical Devices
- Verification and Validation Test Planning

**Required Skills**: fatigue-life-predictor, material-model-library, requirements-traceability-manager

---

### Biocompatibility Agents

#### 12. biocompatibility-evaluator
**Description**: Agent specialized in biological evaluation planning and biocompatibility assessment.

**Responsibilities**:
- Device categorization
- Testing strategy development
- Equivalence assessment
- Test lab coordination
- Results interpretation
- Biological evaluation report generation

**Used By Processes**:
- Biological Evaluation Planning (ISO 10993)
- Extractables and Leachables Analysis
- Biomaterial Selection and Characterization

**Required Skills**: iso10993-evaluator, extractables-leachables-analyzer, biocompatibility-test-selector

---

#### 13. materials-specialist
**Description**: Agent specialized in biomaterial selection, characterization, and supplier qualification.

**Responsibilities**:
- Material requirements development
- Candidate material evaluation
- Material characterization coordination
- Supplier qualification
- Material specification documentation
- Biocompatibility strategy alignment

**Used By Processes**:
- Biomaterial Selection and Characterization
- Biological Evaluation Planning (ISO 10993)
- Design Control Process Implementation

**Required Skills**: material-model-library, iso10993-evaluator, iso-standards-compliance-checker

---

### Medical Software Agents

#### 14. software-lifecycle-manager
**Description**: Agent specialized in IEC 62304 software lifecycle management for medical devices.

**Responsibilities**:
- Software safety classification
- Development planning
- SOUP management
- Configuration management
- Anomaly tracking
- Maintenance planning

**Used By Processes**:
- Software Development Lifecycle (IEC 62304)
- Software Verification and Validation
- AI/ML Medical Device Development

**Required Skills**: iec62304-lifecycle-manager, software-vv-test-generator, cybersecurity-risk-assessor

---

#### 15. software-vv-specialist
**Description**: Agent specialized in medical device software verification and validation.

**Responsibilities**:
- V&V planning
- Test case development
- Test execution coordination
- Coverage analysis
- Traceability verification
- V&V report generation

**Used By Processes**:
- Software Verification and Validation
- Software Development Lifecycle (IEC 62304)
- AI/ML Medical Device Development

**Required Skills**: software-vv-test-generator, iec62304-lifecycle-manager, requirements-traceability-manager

---

#### 16. aiml-device-specialist
**Description**: Agent specialized in AI/ML medical device development and validation.

**Responsibilities**:
- Algorithm description documentation
- Training data quality assessment
- Model performance evaluation
- Bias and fairness assessment
- PCCP development
- Clinical validation planning

**Used By Processes**:
- AI/ML Medical Device Development
- Software Verification and Validation
- Clinical Evaluation Report Development

**Required Skills**: aiml-validation-framework, software-vv-test-generator, clinical-study-designer

---

### Manufacturing Agents

#### 17. sterilization-engineer
**Description**: Agent specialized in sterilization process development and validation.

**Responsibilities**:
- Sterilization method selection
- Validation protocol development
- IQ/OQ/PQ execution coordination
- Bioburden monitoring
- Revalidation planning
- Parametric release implementation

**Used By Processes**:
- Sterilization Validation
- Sterile Barrier System Validation
- Design for Manufacturing and Assembly (DFMA)

**Required Skills**: sterilization-validation-planner, packaging-validation-planner, iso-standards-compliance-checker

---

#### 18. packaging-engineer
**Description**: Agent specialized in sterile barrier packaging development and validation.

**Responsibilities**:
- Package design development
- Seal strength optimization
- Aging study coordination
- Distribution testing
- Shelf life determination
- Packaging validation documentation

**Used By Processes**:
- Sterile Barrier System Validation
- Sterilization Validation
- Design Control Process Implementation

**Required Skills**: packaging-validation-planner, sterilization-validation-planner, requirements-traceability-manager

---

#### 19. manufacturing-engineer
**Description**: Agent specialized in medical device manufacturing process development and DFM.

**Responsibilities**:
- Manufacturability assessment
- Process FMEA facilitation
- Tolerance analysis
- Process validation planning
- SPC implementation
- Design transfer coordination

**Used By Processes**:
- Design for Manufacturing and Assembly (DFMA)
- Design Control Process Implementation
- Sterilization Validation

**Required Skills**: process-fmea-generator, design-fmea-generator, requirements-traceability-manager

---

### Specialized Domain Agents

#### 20. tissue-engineer
**Description**: Agent specialized in tissue engineering scaffold design and tissue construct development.

**Responsibilities**:
- Scaffold design specification
- Fabrication method selection
- Cell culture protocol development
- Bioreactor system optimization
- Tissue characterization planning
- Regulatory pathway guidance for ATMPs

**Used By Processes**:
- Scaffold Fabrication and Characterization
- Cell Culture and Tissue Construct Development
- Biomaterial Selection and Characterization

**Required Skills**: scaffold-design-optimizer, bioreactor-protocol-generator, iso10993-evaluator

---

#### 21. medical-imaging-engineer
**Description**: Agent specialized in medical imaging systems and image processing algorithm development.

**Responsibilities**:
- Imaging system design
- Algorithm development coordination
- DICOM compliance verification
- IHE profile implementation
- Image quality assessment
- Regulatory submission support

**Used By Processes**:
- Medical Image Processing Algorithm Development
- DICOM Integration and Interoperability
- AI/ML Medical Device Development

**Required Skills**: dicom-conformance-validator, image-algorithm-validator, aiml-validation-framework

---

#### 22. clinical-study-manager
**Description**: Agent specialized in clinical study design, execution, and regulatory submissions.

**Responsibilities**:
- Protocol development
- IRB/EC submission coordination
- Site management
- Data management oversight
- Monitoring coordination
- Clinical study report generation

**Used By Processes**:
- Clinical Study Design and Execution
- Clinical Evaluation Report Development
- AI/ML Medical Device Development

**Required Skills**: clinical-study-designer, clinical-literature-reviewer, adverse-event-reporter

---

## Process to Skills/Agents Mapping

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| Design Control Process Implementation | requirements-traceability-manager, design-review-facilitator, design-fmea-generator, iso-standards-compliance-checker | design-control-manager, vv-test-engineer |
| Medical Device Risk Management (ISO 14971) | iso14971-risk-analyzer, use-related-risk-analyzer, design-fmea-generator | risk-manager, human-factors-engineer |
| Human Factors Engineering and Usability | use-related-risk-analyzer, iso14971-risk-analyzer, clinical-study-designer | human-factors-engineer, design-control-manager |
| Verification and Validation Test Planning | requirements-traceability-manager, software-vv-test-generator, iso-standards-compliance-checker | vv-test-engineer, design-control-manager |
| Design for Manufacturing and Assembly (DFMA) | design-fmea-generator, process-fmea-generator, requirements-traceability-manager | manufacturing-engineer, design-control-manager |
| Biological Evaluation Planning (ISO 10993) | iso10993-evaluator, biocompatibility-test-selector, extractables-leachables-analyzer | biocompatibility-evaluator, materials-specialist |
| Extractables and Leachables Analysis | extractables-leachables-analyzer, iso10993-evaluator | biocompatibility-evaluator, materials-specialist |
| Biomaterial Selection and Characterization | material-model-library, iso10993-evaluator, iso-standards-compliance-checker | materials-specialist, biocompatibility-evaluator |
| Finite Element Analysis for Medical Devices | fea-mesh-generator, material-model-library, fatigue-life-predictor | biomechanical-analyst, orthopedic-test-engineer |
| Orthopedic Implant Biomechanical Testing | fatigue-life-predictor, material-model-library, fea-mesh-generator | orthopedic-test-engineer, biomechanical-analyst |
| Gait Analysis and Musculoskeletal Modeling | motion-capture-analyzer, opensim-modeler, prosthetics-design-optimizer | gait-biomechanist, clinical-study-manager |
| 510(k) Premarket Submission Preparation | fda-510k-submission-generator, iso-standards-compliance-checker, iso14971-risk-analyzer, udi-labeling-generator | regulatory-submission-strategist, clinical-evidence-specialist |
| EU MDR Technical Documentation | eu-mdr-gspr-mapper, iso-standards-compliance-checker, clinical-literature-reviewer | regulatory-submission-strategist, clinical-evidence-specialist |
| Post-Market Surveillance System Implementation | adverse-event-reporter, iso14971-risk-analyzer, clinical-literature-reviewer | post-market-surveillance-manager, clinical-evidence-specialist |
| Software Development Lifecycle (IEC 62304) | iec62304-lifecycle-manager, software-vv-test-generator, cybersecurity-risk-assessor | software-lifecycle-manager, software-vv-specialist |
| Software Verification and Validation | software-vv-test-generator, iec62304-lifecycle-manager, requirements-traceability-manager | software-vv-specialist, software-lifecycle-manager |
| AI/ML Medical Device Development | aiml-validation-framework, software-vv-test-generator, clinical-study-designer | aiml-device-specialist, medical-imaging-engineer |
| Sterilization Validation | sterilization-validation-planner, iso-standards-compliance-checker, packaging-validation-planner | sterilization-engineer, manufacturing-engineer |
| Sterile Barrier System Validation | packaging-validation-planner, sterilization-validation-planner | packaging-engineer, sterilization-engineer |
| Scaffold Fabrication and Characterization | scaffold-design-optimizer, material-model-library, iso10993-evaluator | tissue-engineer, materials-specialist |
| Cell Culture and Tissue Construct Development | bioreactor-protocol-generator, scaffold-design-optimizer | tissue-engineer, biocompatibility-evaluator |
| Medical Image Processing Algorithm Development | image-algorithm-validator, aiml-validation-framework, dicom-conformance-validator | medical-imaging-engineer, aiml-device-specialist |
| DICOM Integration and Interoperability | dicom-conformance-validator, iec62304-lifecycle-manager | medical-imaging-engineer, software-lifecycle-manager |
| Clinical Evaluation Report Development | clinical-literature-reviewer, clinical-study-designer, adverse-event-reporter | clinical-evidence-specialist, regulatory-submission-strategist |
| Clinical Study Design and Execution | clinical-study-designer, clinical-literature-reviewer, adverse-event-reporter | clinical-study-manager, clinical-evidence-specialist |

---

## Shared Candidates (Cross-Specialization)

These skills and agents could be shared with other specializations:

### Shared Skills

1. **iso-standards-compliance-checker** - Useful for any ISO-regulated industries (Manufacturing, Aerospace, Automotive)
2. **requirements-traceability-manager** - Applicable to any requirements-driven development (Systems Engineering, Software Development)
3. **design-fmea-generator** - Core risk assessment tool applicable to product development (Mechanical Engineering, Automotive)
4. **software-vv-test-generator** - Software testing applicable to regulated software (Aerospace, Automotive, Nuclear)
5. **clinical-study-designer** - Applicable to pharmaceutical and clinical research domains
6. **aiml-validation-framework** - Applicable to any AI/ML deployment in regulated industries

### Shared Agents

1. **vv-test-engineer** - Testing expertise applicable to QA Testing Automation and Software Development
2. **risk-manager** - Risk management expertise applicable to any safety-critical domain
3. **cybersecurity-specialist** - Security expertise applicable to DevOps/SRE and Security Compliance
4. **software-lifecycle-manager** - Software process management applicable to regulated software development
5. **manufacturing-engineer** - Manufacturing expertise applicable to Industrial Engineering
6. **clinical-study-manager** - Clinical research expertise applicable to Pharmaceutical and Healthcare domains

---

## Implementation Priority

### High Priority (Core Regulatory and Design Control)
1. iso14971-risk-analyzer
2. requirements-traceability-manager
3. fda-510k-submission-generator
4. iec62304-lifecycle-manager
5. design-control-manager (agent)
6. risk-manager (agent)
7. regulatory-submission-strategist (agent)

### Medium Priority (Engineering Analysis and Compliance)
1. fea-mesh-generator
2. iso10993-evaluator
3. clinical-literature-reviewer
4. software-vv-test-generator
5. eu-mdr-gspr-mapper
6. biomechanical-analyst (agent)
7. biocompatibility-evaluator (agent)
8. software-vv-specialist (agent)

### Lower Priority (Specialized Applications)
1. opensim-modeler
2. scaffold-design-optimizer
3. bioreactor-protocol-generator
4. prosthetics-design-optimizer
5. dicom-conformance-validator
6. tissue-engineer (agent)
7. gait-biomechanist (agent)
8. medical-imaging-engineer (agent)

---

## Notes

- All skills should implement standardized input/output schemas aligned with medical device documentation requirements
- Skills should support audit trail generation for regulatory compliance
- Agents should maintain traceability to regulatory requirements (21 CFR 820, ISO 13485, EU MDR)
- Error handling should include regulatory impact assessment
- All outputs should be suitable for inclusion in regulatory submissions
- Skills should support both pre-market and post-market activities
- Agents should provide detailed rationale for decisions to support design history documentation
- Integration with existing quality management systems (QMS) should be considered
- Version control and change management are critical for regulatory compliance
- Skills and agents should support multi-regulatory jurisdiction requirements (FDA, EU, Health Canada, TGA, PMDA)
