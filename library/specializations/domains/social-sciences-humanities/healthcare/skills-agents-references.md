# Healthcare and Medical Management - Skills and Agents References

## Phase 5: External Resources and Cross-Specialization References

This document provides external resources, tools, and cross-specialization references to support the implementation of Healthcare and Medical Management skills and agents.

---

## GitHub Repositories

### Health Informatics and EHR Integration

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [HAPI-FHIR/hapi-fhir](https://github.com/hapifhir/hapi-fhir) | Open-source FHIR implementation in Java | SK-HC-006 (health-data-integration) |
| [smart-on-fhir](https://github.com/smart-on-fhir) | SMART on FHIR app development resources | SK-HC-006, SK-HC-014 |
| [HL7/fhir](https://github.com/HL7/fhir) | HL7 FHIR specification source | SK-HC-006 |
| [OpenMRS/openmrs-core](https://github.com/openmrs/openmrs-core) | Open-source medical record system | SK-HC-006 |
| [LinuxForHealth/FHIR](https://github.com/LinuxForHealth/FHIR) | IBM FHIR Server | SK-HC-006 |
| [microsoft/fhir-server](https://github.com/microsoft/fhir-server) | Microsoft FHIR Server for Azure | SK-HC-006 |
| [cqframework/cql-execution](https://github.com/cqframework/cql-execution) | Clinical Quality Language execution engine | SK-HC-014 (clinical-decision-support-rules) |

### Quality and Safety

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [isbntools/LEAN](https://github.com/lean-delivery) | Lean methodology tools | SK-HC-001 (clinical-workflow-analysis) |
| [openquality](https://github.com/openquality) | Healthcare quality measurement | SK-HC-002 (quality-metrics-measurement) |
| [OHDSI/Achilles](https://github.com/OHDSI/Achilles) | Data characterization and quality assessment | SK-HC-002 |
| [OHDSI/CommonDataModel](https://github.com/OHDSI/CommonDataModel) | OMOP Common Data Model | SK-HC-006, SK-HC-002 |

### Revenue Cycle and Coding

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [CMS-gov](https://github.com/CMSgov) | CMS open source projects | SK-HC-003 (regulatory-compliance), SK-HC-004 |
| [InsiteTech/icd-mappings](https://github.com/cci-gothenburg/icd-mappings) | ICD code mapping tools | SK-HC-004 (medical-coding-audit) |
| [stanfordnlp/CoreNLP](https://github.com/stanfordnlp/CoreNLP) | NLP for clinical text processing | SK-HC-011 (clinical-documentation-query) |
| [clinical-biobert](https://github.com/EmilyAlsentzer/clinicalBERT) | Pre-trained clinical NLP model | SK-HC-011 |

### Population Health and Analytics

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [OHDSI/PatientLevelPrediction](https://github.com/OHDSI/PatientLevelPrediction) | Patient-level prediction analytics | SK-HC-009 (population-health-stratification) |
| [OHDSI/CohortMethod](https://github.com/OHDSI/CohortMethod) | Population-level effect estimation | SK-HC-009 |
| [HealthCatalyst](https://github.com/healthcatalyst) | Healthcare analytics platform tools | SK-HC-002, SK-HC-007 |
| [apache/superset](https://github.com/apache/superset) | Data visualization for healthcare dashboards | SK-HC-002, SK-HC-007 |

### Compliance and Security

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [HIPAA-Security](https://github.com/truevault/hipaa-compliance-developers-guide) | HIPAA compliance guide | SK-HC-003 (regulatory-compliance-assessment) |
| [HITRUST](https://hitrustalliance.net/csf/) | Security framework resources | SK-HC-003 |

---

## MCP Server References

### Potential MCP Integrations

| MCP Server Type | Description | Applicable Skills |
|-----------------|-------------|-------------------|
| **FHIR Server MCP** | HL7 FHIR resource access and manipulation | SK-HC-006 |
| **EHR Integration MCP** | Epic, Cerner, Meditech API connectivity | SK-HC-006, SK-HC-014 |
| **Clinical Terminology MCP** | SNOMED CT, ICD-10, CPT lookups | SK-HC-004, SK-HC-011 |
| **Quality Measures MCP** | CMS eCQM calculation and reporting | SK-HC-002 |
| **Claims Data MCP** | Revenue cycle analytics integration | SK-HC-007 |
| **HIE Connectivity MCP** | Health information exchange access | SK-HC-006 |
| **Regulatory Database MCP** | CMS, Joint Commission standards lookup | SK-HC-003, SK-HC-010 |

### Recommended MCP Implementations

```yaml
# Example MCP configuration for healthcare integration
mcp_servers:
  - name: fhir-connector
    type: api
    description: Multi-vendor FHIR integration
    supported_vendors:
      - Epic
      - Cerner
      - Meditech
      - Allscripts
    fhir_version: R4
    resources:
      - Patient
      - Encounter
      - Observation
      - DiagnosticReport
      - MedicationRequest
      - Procedure
      - Condition

  - name: terminology-service
    type: api
    description: Clinical terminology lookup and validation
    vocabularies:
      - SNOMED_CT
      - ICD10_CM
      - ICD10_PCS
      - CPT
      - LOINC
      - RxNorm
    features:
      - code_lookup
      - concept_mapping
      - hierarchy_navigation
      - subset_validation

  - name: quality-measures-engine
    type: computation
    description: eCQM calculation and reporting
    standards:
      - CMS_eCQMs
      - HEDIS
      - CQMs
    features:
      - measure_calculation
      - gap_identification
      - compliance_reporting
```

---

## Community Resources

### Professional Organizations

| Organization | Resources | Relevant Areas |
|--------------|-----------|----------------|
| [AHIMA](https://www.ahima.org/) | Health information management standards | SK-HC-004, SK-HC-011, SK-HC-003 |
| [HIMSS](https://www.himss.org/) | Health IT standards, interoperability | SK-HC-006, SK-HC-014 |
| [IHI (Institute for Healthcare Improvement)](http://www.ihi.org/) | Quality improvement, patient safety | SK-HC-001, SK-HC-002, SK-HC-005 |
| [HFMA](https://www.hfma.org/) | Healthcare financial management | SK-HC-007, SK-HC-013 |
| [ACHE](https://www.ache.org/) | Healthcare executive leadership | AG-HC-007 (operations-excellence) |
| [ASHRM](https://www.ashrm.org/) | Risk management | SK-HC-005, SK-HC-011 |
| [AAPC](https://www.aapc.com/) | Medical coding certification and education | SK-HC-004 |
| [ACDIS](https://acdis.org/) | Clinical documentation improvement | SK-HC-011, AG-HC-008 |
| [NAHQ](https://nahq.org/) | Healthcare quality professionals | SK-HC-002, AG-HC-001 |
| [ASQ Healthcare](https://asq.org/communities/healthcare) | Quality and Lean Six Sigma in healthcare | SK-HC-001 |

### Regulatory Bodies and Standards

| Organization | Standards | Relevant Skills |
|--------------|-----------|-----------------|
| [CMS (Centers for Medicare & Medicaid Services)](https://www.cms.gov/) | CoP, quality programs, reimbursement | SK-HC-003, SK-HC-002 |
| [The Joint Commission](https://www.jointcommission.org/) | Accreditation standards | SK-HC-010, SK-HC-003 |
| [NCQA](https://www.ncqa.org/) | HEDIS, accreditation | SK-HC-002 |
| [HL7 International](https://www.hl7.org/) | FHIR, CDA, v2 messaging | SK-HC-006 |
| [ONC (Office of National Coordinator)](https://www.healthit.gov/) | Health IT certification, interoperability | SK-HC-006 |
| [NQF (National Quality Forum)](https://www.qualityforum.org/) | Quality measure endorsement | SK-HC-002 |

### Online Learning and Resources

| Resource | Description | Relevant Areas |
|----------|-------------|----------------|
| [IHI Open School](http://www.ihi.org/education/IHIOpenSchool) | Free quality and safety courses | SK-HC-001, SK-HC-005 |
| [AHRQ Patient Safety Network](https://psnet.ahrq.gov/) | Patient safety research and resources | SK-HC-005 |
| [HealthIT.gov](https://www.healthit.gov/playbook/) | Health IT implementation guides | SK-HC-006 |
| [CMS Quality Reporting Programs](https://www.cms.gov/Medicare/Quality-Initiatives-Patient-Assessment-Instruments) | Quality program specifications | SK-HC-002 |
| [ECRI Institute](https://www.ecri.org/) | Patient safety guidance | SK-HC-005 |

### Forums and Communities

| Community | Focus | URL |
|-----------|-------|-----|
| HIMSS Community | Health IT professionals | [himss.org/community](https://www.himss.org/community) |
| HL7 Confluence | FHIR implementation | [confluence.hl7.org](https://confluence.hl7.org/) |
| AMIA | Informatics professionals | [amia.org](https://www.amia.org/) |
| OHDSI Forums | Observational health data | [forums.ohdsi.org](https://forums.ohdsi.org/) |

---

## API Documentation

### EHR and Clinical APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [Epic FHIR API](https://fhir.epic.com/) | Epic FHIR R4 integration | SK-HC-006 |
| [Cerner FHIR API](https://fhir.cerner.com/) | Cerner Millennium FHIR | SK-HC-006 |
| [SMART on FHIR](https://docs.smarthealthit.org/) | Healthcare app framework | SK-HC-006, SK-HC-014 |
| [Apple HealthKit](https://developer.apple.com/documentation/healthkit) | Patient-generated health data | SK-HC-006 |
| [Google Health API](https://cloud.google.com/healthcare-api) | Cloud Healthcare API | SK-HC-006 |

### Terminology and Coding APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [UMLS REST API](https://documentation.uts.nlm.nih.gov/rest/home.html) | NLM terminology services | SK-HC-004, SK-HC-011 |
| [SNOMED CT Browser API](https://browser.ihtsdotools.org/) | SNOMED concept lookup | SK-HC-004 |
| [ICD API (WHO)](https://icd.who.int/icdapi) | WHO ICD classification | SK-HC-004 |
| [RxNorm API](https://rxnav.nlm.nih.gov/RxNormAPIs.html) | Drug terminology | SK-HC-004, SK-HC-014 |
| [LOINC API](https://loinc.org/kb/users-guide/loinc-fhir-api/) | Laboratory codes | SK-HC-004 |

### Quality and Compliance APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [CMS Quality Data Submission](https://qpp.cms.gov/api) | QPP/MIPS submission | SK-HC-002 |
| [Medicare Provider Data](https://data.cms.gov/) | CMS open data | SK-HC-002, SK-HC-007 |
| [Hospital Compare API](https://data.medicare.gov/) | Quality comparison data | SK-HC-002 |
| [FDA Drug APIs](https://open.fda.gov/) | Drug and device data | SK-HC-003 |

### Revenue Cycle APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [Availity API](https://developer.availity.com/) | Eligibility, claims | SK-HC-007 |
| [Change Healthcare API](https://developers.changehealthcare.com/) | Revenue cycle services | SK-HC-007 |
| [Waystar API](https://www.waystar.com/) | Claims management | SK-HC-007 |

---

## Applicable Skills from Other Specializations

### From Technology Specializations

| Source Specialization | Skill/Process | Application to Healthcare |
|----------------------|---------------|---------------------------|
| **Software Development** | API Integration | EHR/HIE connectivity |
| **Software Development** | Database Design | Clinical data warehousing |
| **Software Development** | Security Implementation | HIPAA technical safeguards |
| **Data Science** | Statistical Analysis | Quality metrics, outcomes research |
| **Data Science** | Predictive Modeling | Risk stratification, readmission prediction |
| **Data Science** | Data Visualization | Quality dashboards, analytics |
| **Data Science** | Machine Learning | Clinical decision support |
| **Cybersecurity** | Security Auditing | HIPAA security assessment |
| **Cybersecurity** | Incident Response | Data breach management |

### From Business Specializations

| Source Specialization | Skill/Process | Application to Healthcare |
|----------------------|---------------|---------------------------|
| **Finance & Accounting** | Financial Analysis | SK-HC-007 revenue cycle analytics |
| **Finance & Accounting** | Compliance Reporting | Regulatory financial reporting |
| **Finance & Accounting** | Audit Procedures | SK-HC-004 coding compliance audits |
| **Operations** | Lean Six Sigma | SK-HC-001 clinical workflow analysis |
| **Operations** | Process Improvement | PDSA quality improvement |
| **Operations** | Capacity Planning | SK-HC-012 workforce demand forecasting |
| **Human Resources** | Workforce Planning | Healthcare staffing optimization |
| **Human Resources** | Training Development | Clinical staff education |
| **Legal/Compliance** | Regulatory Compliance | HIPAA, CMS, Joint Commission |
| **Legal/Compliance** | Risk Assessment | Patient safety risk management |
| **Legal/Compliance** | Contract Analysis | SK-HC-013 payer contract analysis |

### From Other Social Sciences & Humanities

| Source Specialization | Skill/Process | Application to Healthcare |
|----------------------|---------------|---------------------------|
| **Social Sciences** | Survey Research | Patient satisfaction, HCAHPS |
| **Social Sciences** | Program Evaluation | Quality program effectiveness |
| **Social Sciences** | Statistical Methods | Outcomes research, epidemiology |
| **Education** | Training Design | Clinical education programs |
| **Education** | Competency Assessment | Clinical competency evaluation |
| **Education** | E-Learning Development | Healthcare compliance training |

### Cross-Functional Agent Collaborations

| Healthcare Agent | Collaborating Agent | Collaboration Purpose |
|-----------------|--------------------|-----------------------|
| AG-HC-001 (quality-improvement-orchestrator) | Operations: Process Improvement Lead | Lean/Six Sigma implementation |
| AG-HC-002 (compliance-readiness-manager) | Legal: Compliance Officer | Regulatory interpretation |
| AG-HC-003 (revenue-integrity-analyst) | Finance: Financial Analyst | Revenue optimization |
| AG-HC-004 (patient-safety-officer) | Legal: Risk Manager | Safety event legal review |
| AG-HC-005 (clinical-informatics-specialist) | IT: Systems Architect | Infrastructure planning |
| AG-HC-006 (care-management-coordinator) | Social Work: Case Manager | Social determinants integration |
| AG-HC-007 (operations-excellence-director) | Operations: Capacity Planner | Resource optimization |
| AG-HC-008 (documentation-integrity-specialist) | Medical Staff: Physician Advisor | Documentation improvement |

---

## Implementation Recommendations

### Priority Integration Order

1. **FHIR Connectivity** (SK-HC-006) - Establish EHR/HIE interoperability foundation
2. **Quality Measurement** (SK-HC-002) - Implement eCQM calculation engine
3. **Compliance Tracking** (SK-HC-003) - Deploy regulatory compliance monitoring
4. **Coding Analytics** (SK-HC-004) - Enable coding compliance auditing
5. **Population Health** (SK-HC-009) - Risk stratification capabilities

### Technology Stack Recommendations

```yaml
recommended_stack:
  interoperability:
    fhir_server: HAPI-FHIR / Microsoft FHIR Server
    integration_engine: Mirth Connect / Rhapsody
    terminology_server: Snowstorm SNOMED CT

  analytics:
    data_platform: OMOP CDM / i2b2
    visualization: Tableau / Power BI
    ml_platform: Azure ML / AWS SageMaker

  quality_measurement:
    ecqm_engine: CQL Engine
    measure_authoring: MADiE / Bonnie
    reporting: QRDA Cat I/III

  revenue_cycle:
    analytics: Tableau / Qlik
    coding_audit: 3M / Optum CAC
    denial_management: Waystar / Experian

  compliance:
    risk_assessment: Healthicity / ComplyAssistant
    audit_tracking: MedTrainer / Relias
    policy_management: PolicyStat / MCN
```

### Interoperability Standards

```yaml
standards:
  data_exchange:
    - HL7 FHIR R4
    - HL7 v2.x messaging
    - C-CDA documents
    - USCDI v2

  quality_reporting:
    - QRDA Cat I/III
    - CQL (Clinical Quality Language)
    - eCQMs

  terminology:
    - SNOMED CT
    - ICD-10-CM/PCS
    - CPT/HCPCS
    - LOINC
    - RxNorm

  security:
    - HIPAA Security Rule
    - NIST Cybersecurity Framework
    - HITRUST CSF
```

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Specialization**: Healthcare and Medical Management (`healthcare`)
**Phase**: 5 - Skills and Agents References
