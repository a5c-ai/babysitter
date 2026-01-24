---
name: cybersecurity-risk-assessor
description: Medical device cybersecurity risk assessment skill per FDA premarket and postmarket guidance
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: biomedical-engineering
  domain: science
  category: Risk Management
  skill-id: BME-SK-010
---

# Cybersecurity Risk Assessor Skill

## Purpose

The Cybersecurity Risk Assessor Skill evaluates cybersecurity risks for medical devices per FDA guidance and IEC 81001-5-1, supporting threat modeling, vulnerability assessment, and security control implementation.

## Capabilities

- Threat modeling (STRIDE methodology)
- Vulnerability assessment
- SBOM (Software Bill of Materials) generation
- Security control identification
- Penetration testing planning
- Cybersecurity documentation for FDA submissions
- Attack surface analysis
- Security architecture review
- Coordinated vulnerability disclosure planning
- Postmarket cybersecurity management
- Patch management planning

## Usage Guidelines

### When to Use
- Assessing device cybersecurity risks
- Planning penetration testing
- Preparing FDA cybersecurity submissions
- Managing software dependencies

### Prerequisites
- Software architecture documented
- Network connectivity defined
- Data flows identified
- Third-party components cataloged

### Best Practices
- Integrate cybersecurity from design inception
- Maintain current SBOM
- Plan for security updates throughout lifecycle
- Establish vulnerability disclosure process

## Process Integration

This skill integrates with the following processes:
- Software Development Lifecycle (IEC 62304)
- Medical Device Risk Management (ISO 14971)
- 510(k) Premarket Submission Preparation
- Post-Market Surveillance System Implementation

## Dependencies

- FDA Cybersecurity guidance
- IEC 81001-5-1 standard
- SBOM tools (CycloneDX, SPDX)
- Vulnerability databases (NVD, CVE)
- Threat modeling frameworks

## Configuration

```yaml
cybersecurity-risk-assessor:
  threat-methodologies:
    - STRIDE
    - PASTA
    - attack-trees
  sbom-formats:
    - CycloneDX
    - SPDX
  security-tiers:
    - Tier-1-higher
    - Tier-2-standard
  control-frameworks:
    - NIST-CSF
    - IEC-62443
```

## Output Artifacts

- Threat models
- Vulnerability assessments
- SBOM documents
- Security architecture documents
- Penetration test plans
- FDA cybersecurity submissions
- Security control matrices
- Patch management plans

## Quality Criteria

- All threat vectors identified
- Vulnerabilities assessed with CVSS scores
- SBOM is complete and current
- Security controls address identified risks
- Documentation meets FDA requirements
- Postmarket security plan established
