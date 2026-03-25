# Healthcare and Medical Management - Skills and Agents Backlog

## Overview

This document defines the skills and agents required to support the Healthcare and Medical Management specialization processes. Skills represent reusable capabilities that can be invoked across multiple processes, while agents represent specialized roles that orchestrate skills to accomplish complex healthcare management tasks.

---

## Skills Backlog

| ID | Skill Name | Description | Priority | Related Processes |
|----|------------|-------------|----------|-------------------|
| SK-HC-001 | clinical-workflow-analysis | Analyzes clinical workflows to identify inefficiencies, bottlenecks, and improvement opportunities using Lean healthcare principles and value stream mapping techniques | High | Patient Flow Optimization, Care Coordination Protocol, Clinical Pathway Development |
| SK-HC-002 | quality-metrics-measurement | Collects, calculates, and reports healthcare quality metrics including core measures, HEDIS, patient safety indicators, and value-based purchasing measures | High | PDSA Cycle Implementation, Quality Reporting Program Compliance, HRO Implementation |
| SK-HC-003 | regulatory-compliance-assessment | Evaluates organizational compliance with healthcare regulations including HIPAA, CMS Conditions of Participation, and accreditation standards through gap analysis and audit procedures | High | HIPAA Compliance Program, Joint Commission Survey Readiness, CMS Conditions of Participation Compliance |
| SK-HC-004 | medical-coding-audit | Reviews clinical documentation and assigned codes for accuracy, compliance, and optimization, identifying documentation improvement opportunities and coding errors | High | Medical Coding Compliance, Clinical Documentation Improvement, Claims Management Workflow |
| SK-HC-005 | patient-safety-event-analysis | Investigates patient safety events using RCA, FMEA, and other systematic analysis methods to identify contributing factors and develop corrective actions | High | Root Cause Analysis, Patient Safety Event Reporting, FMEA |
| SK-HC-006 | health-data-integration | Facilitates interoperability between health IT systems including EHR, HIE, and clinical decision support through HL7, FHIR, and other healthcare data standards | Medium | EHR Implementation Methodology, HIE Integration, Clinical Decision Support Implementation |
| SK-HC-007 | revenue-cycle-analytics | Analyzes revenue cycle performance metrics including denial rates, days in AR, clean claim rates, and collection efficiency to identify improvement opportunities | Medium | Claims Management Workflow, Denial Prevention and Management, Prior Authorization Workflow |
| SK-HC-008 | care-transition-coordination | Manages care transitions between settings including discharge planning, medication reconciliation, follow-up scheduling, and post-acute care coordination | Medium | Discharge Planning Process, Care Coordination Protocol, Population Health Management Program |
| SK-HC-009 | population-health-stratification | Stratifies patient populations by risk level using claims data, clinical data, and social determinants to prioritize care management interventions | Medium | Population Health Management Program, Clinical Pathway Development, Service Line Strategic Planning |
| SK-HC-010 | accreditation-tracer-simulation | Simulates Joint Commission tracer methodology to assess compliance with accreditation standards across patient care processes and support systems | Medium | Joint Commission Survey Readiness, HRO Implementation, Quality Reporting Program Compliance |
| SK-HC-011 | clinical-documentation-query | Generates compliant physician queries to clarify clinical documentation for accurate coding, severity of illness, and risk of mortality capture | Medium | Clinical Documentation Improvement, Medical Coding Compliance, Quality Reporting Program Compliance |
| SK-HC-012 | workforce-demand-forecasting | Projects healthcare workforce requirements based on patient volume trends, acuity levels, productivity standards, and skill mix optimization | Low | Healthcare Workforce Planning, Patient Flow Optimization, Service Line Strategic Planning |
| SK-HC-013 | payer-contract-analysis | Analyzes payer contracts for reimbursement rates, terms, and value-based incentives to optimize revenue and support contract negotiations | Low | Claims Management Workflow, Denial Prevention and Management, Service Line Strategic Planning |
| SK-HC-014 | clinical-decision-support-rules | Develops and maintains clinical decision support rules including alerts, reminders, order sets, and evidence-based recommendations within EHR systems | Low | Clinical Decision Support Implementation, Clinical Pathway Development, EHR Implementation Methodology |

---

## Agents Backlog

| ID | Agent Name | Role | Expertise | Related Skills |
|----|------------|------|-----------|----------------|
| AG-HC-001 | quality-improvement-orchestrator | Leads continuous quality improvement initiatives using PDSA methodology, facilitates improvement teams, and drives measurable outcome improvements | Lean Six Sigma, PDSA methodology, statistical process control, quality measurement, change management | SK-HC-001, SK-HC-002, SK-HC-005 |
| AG-HC-002 | compliance-readiness-manager | Ensures continuous readiness for regulatory surveys and accreditation visits through gap assessments, mock surveys, and corrective action management | HIPAA, Joint Commission standards, CMS CoP, state regulations, audit methodology, risk assessment | SK-HC-003, SK-HC-010, SK-HC-002 |
| AG-HC-003 | revenue-integrity-analyst | Optimizes revenue cycle performance through coding compliance, denial management, and charge capture improvement while ensuring regulatory compliance | Medical coding (ICD-10, CPT), revenue cycle management, payer relations, compliance auditing, data analytics | SK-HC-004, SK-HC-007, SK-HC-011, SK-HC-013 |
| AG-HC-004 | patient-safety-officer | Leads patient safety programs including event investigation, proactive risk assessment, and safety culture development using HRO principles | Patient safety science, RCA/FMEA methodologies, Just Culture, HRO principles, human factors engineering | SK-HC-005, SK-HC-002, SK-HC-010 |
| AG-HC-005 | clinical-informatics-specialist | Implements and optimizes health IT systems including EHR, HIE, and clinical decision support to improve clinical workflows and data quality | Health informatics, HL7/FHIR standards, EHR optimization, clinical workflows, data governance, interoperability | SK-HC-006, SK-HC-014, SK-HC-001 |
| AG-HC-006 | care-management-coordinator | Coordinates care across settings and providers for complex patients, managing transitions, resources, and outcomes through population health approaches | Care coordination, case management, discharge planning, chronic disease management, motivational interviewing | SK-HC-008, SK-HC-009, SK-HC-001 |
| AG-HC-007 | operations-excellence-director | Drives operational efficiency across clinical departments using Lean healthcare principles, capacity management, and throughput optimization | Lean healthcare, operations management, capacity planning, resource optimization, project management | SK-HC-001, SK-HC-012, SK-HC-002 |
| AG-HC-008 | documentation-integrity-specialist | Improves clinical documentation accuracy and completeness through CDI programs, physician education, and query management processes | Clinical documentation improvement, medical terminology, coding guidelines, physician engagement, audit methodology | SK-HC-011, SK-HC-004, SK-HC-002 |

---

## Process-to-Skill/Agent Mapping

### Clinical Operations Processes

| Process | Recommended Skills | Recommended Agents | Status |
|---------|-------------------|-------------------|--------|
| Patient Flow Optimization | SK-HC-001 (clinical-workflow-analysis), SK-HC-012 (workforce-demand-forecasting) | AG-HC-007 (operations-excellence-director), AG-HC-006 (care-management-coordinator) | [x] |
| Care Coordination Protocol | SK-HC-001 (clinical-workflow-analysis), SK-HC-008 (care-transition-coordination) | AG-HC-006 (care-management-coordinator), AG-HC-005 (clinical-informatics-specialist) | [x] |
| Clinical Pathway Development | SK-HC-001 (clinical-workflow-analysis), SK-HC-009 (population-health-stratification), SK-HC-014 (clinical-decision-support-rules) | AG-HC-001 (quality-improvement-orchestrator), AG-HC-005 (clinical-informatics-specialist) | [x] |
| Discharge Planning Process | SK-HC-008 (care-transition-coordination), SK-HC-001 (clinical-workflow-analysis) | AG-HC-006 (care-management-coordinator), AG-HC-007 (operations-excellence-director) | [x] |

### Quality and Safety Processes

| Process | Recommended Skills | Recommended Agents | Status |
|---------|-------------------|-------------------|--------|
| PDSA Cycle Implementation | SK-HC-002 (quality-metrics-measurement), SK-HC-001 (clinical-workflow-analysis) | AG-HC-001 (quality-improvement-orchestrator), AG-HC-007 (operations-excellence-director) | [x] |
| Root Cause Analysis (RCA) | SK-HC-005 (patient-safety-event-analysis), SK-HC-002 (quality-metrics-measurement) | AG-HC-004 (patient-safety-officer), AG-HC-001 (quality-improvement-orchestrator) | [x] |
| Failure Mode and Effects Analysis (FMEA) | SK-HC-005 (patient-safety-event-analysis), SK-HC-001 (clinical-workflow-analysis) | AG-HC-004 (patient-safety-officer), AG-HC-001 (quality-improvement-orchestrator) | [x] |
| Patient Safety Event Reporting | SK-HC-005 (patient-safety-event-analysis), SK-HC-002 (quality-metrics-measurement) | AG-HC-004 (patient-safety-officer), AG-HC-002 (compliance-readiness-manager) | [x] |
| High Reliability Organization (HRO) Implementation | SK-HC-002 (quality-metrics-measurement), SK-HC-005 (patient-safety-event-analysis), SK-HC-010 (accreditation-tracer-simulation) | AG-HC-004 (patient-safety-officer), AG-HC-001 (quality-improvement-orchestrator) | [x] |

### Health Informatics Processes

| Process | Recommended Skills | Recommended Agents | Status |
|---------|-------------------|-------------------|--------|
| EHR Implementation Methodology | SK-HC-006 (health-data-integration), SK-HC-001 (clinical-workflow-analysis), SK-HC-014 (clinical-decision-support-rules) | AG-HC-005 (clinical-informatics-specialist), AG-HC-007 (operations-excellence-director) | [x] |
| Clinical Documentation Improvement (CDI) | SK-HC-011 (clinical-documentation-query), SK-HC-004 (medical-coding-audit), SK-HC-002 (quality-metrics-measurement) | AG-HC-008 (documentation-integrity-specialist), AG-HC-003 (revenue-integrity-analyst) | [x] |
| Health Information Exchange (HIE) Integration | SK-HC-006 (health-data-integration), SK-HC-003 (regulatory-compliance-assessment) | AG-HC-005 (clinical-informatics-specialist), AG-HC-002 (compliance-readiness-manager) | [x] |
| Clinical Decision Support Implementation | SK-HC-014 (clinical-decision-support-rules), SK-HC-006 (health-data-integration), SK-HC-001 (clinical-workflow-analysis) | AG-HC-005 (clinical-informatics-specialist), AG-HC-001 (quality-improvement-orchestrator) | [x] |

### Revenue Cycle Processes

| Process | Recommended Skills | Recommended Agents | Status |
|---------|-------------------|-------------------|--------|
| Medical Coding Compliance | SK-HC-004 (medical-coding-audit), SK-HC-003 (regulatory-compliance-assessment), SK-HC-011 (clinical-documentation-query) | AG-HC-003 (revenue-integrity-analyst), AG-HC-008 (documentation-integrity-specialist) | [x] |
| Claims Management Workflow | SK-HC-007 (revenue-cycle-analytics), SK-HC-004 (medical-coding-audit), SK-HC-013 (payer-contract-analysis) | AG-HC-003 (revenue-integrity-analyst), AG-HC-007 (operations-excellence-director) | [x] |
| Denial Prevention and Management | SK-HC-007 (revenue-cycle-analytics), SK-HC-004 (medical-coding-audit), SK-HC-013 (payer-contract-analysis) | AG-HC-003 (revenue-integrity-analyst), AG-HC-008 (documentation-integrity-specialist) | [x] |
| Prior Authorization Workflow | SK-HC-007 (revenue-cycle-analytics), SK-HC-001 (clinical-workflow-analysis) | AG-HC-003 (revenue-integrity-analyst), AG-HC-006 (care-management-coordinator) | [x] |

### Regulatory Compliance Processes

| Process | Recommended Skills | Recommended Agents | Status |
|---------|-------------------|-------------------|--------|
| HIPAA Compliance Program | SK-HC-003 (regulatory-compliance-assessment), SK-HC-006 (health-data-integration) | AG-HC-002 (compliance-readiness-manager), AG-HC-005 (clinical-informatics-specialist) | [x] |
| Joint Commission Survey Readiness | SK-HC-010 (accreditation-tracer-simulation), SK-HC-003 (regulatory-compliance-assessment), SK-HC-002 (quality-metrics-measurement) | AG-HC-002 (compliance-readiness-manager), AG-HC-004 (patient-safety-officer) | [x] |
| CMS Conditions of Participation Compliance | SK-HC-003 (regulatory-compliance-assessment), SK-HC-002 (quality-metrics-measurement), SK-HC-010 (accreditation-tracer-simulation) | AG-HC-002 (compliance-readiness-manager), AG-HC-001 (quality-improvement-orchestrator) | [x] |
| Quality Reporting Program Compliance | SK-HC-002 (quality-metrics-measurement), SK-HC-003 (regulatory-compliance-assessment), SK-HC-011 (clinical-documentation-query) | AG-HC-002 (compliance-readiness-manager), AG-HC-008 (documentation-integrity-specialist) | [x] |

### Strategic Planning Processes

| Process | Recommended Skills | Recommended Agents | Status |
|---------|-------------------|-------------------|--------|
| Service Line Strategic Planning | SK-HC-009 (population-health-stratification), SK-HC-012 (workforce-demand-forecasting), SK-HC-013 (payer-contract-analysis) | AG-HC-007 (operations-excellence-director), AG-HC-001 (quality-improvement-orchestrator) | [x] |
| Population Health Management Program | SK-HC-009 (population-health-stratification), SK-HC-008 (care-transition-coordination), SK-HC-002 (quality-metrics-measurement) | AG-HC-006 (care-management-coordinator), AG-HC-001 (quality-improvement-orchestrator) | [x] |
| Healthcare Workforce Planning | SK-HC-012 (workforce-demand-forecasting), SK-HC-001 (clinical-workflow-analysis) | AG-HC-007 (operations-excellence-director), AG-HC-002 (compliance-readiness-manager) | [x] |

---

## Summary

| Category | Count |
|----------|-------|
| Total Skills | 14 |
| High Priority Skills | 5 |
| Medium Priority Skills | 6 |
| Low Priority Skills | 3 |
| Total Agents | 8 |

---

## Implementation Notes

### Skill Implementation Guidelines
- Skills should be implemented as modular, reusable components that can be invoked by multiple agents
- Each skill should include clear input/output specifications and validation rules
- Skills should integrate with healthcare IT systems (EHR, HIE, RCM) via standard APIs and data formats
- Skills must maintain HIPAA compliance and audit logging for all PHI access

### Agent Implementation Guidelines
- Agents should orchestrate multiple skills to accomplish complex healthcare management tasks
- Each agent should have defined scope, authority levels, and escalation procedures
- Agents should support both autonomous operation and human-in-the-loop workflows
- Agents must implement appropriate clinical decision support safeguards for patient safety

### Integration Considerations
- All skills and agents should support HL7 FHIR for healthcare data exchange
- Revenue cycle skills should integrate with practice management and billing systems
- Quality and safety skills should integrate with event reporting and analytics platforms
- Compliance skills should maintain evidence documentation for regulatory audits

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-25 | Initial skills and agents backlog creation |
