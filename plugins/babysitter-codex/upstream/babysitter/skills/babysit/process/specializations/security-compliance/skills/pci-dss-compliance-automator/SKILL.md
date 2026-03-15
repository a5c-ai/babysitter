---
name: pci-dss-compliance-automator
description: PCI DSS compliance assessment and reporting for cardholder data protection, SAQ automation, and ASV scan orchestration
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# PCI DSS Compliance Automator Skill

## Purpose

Automate Payment Card Industry Data Security Standard (PCI DSS) compliance activities including cardholder data environment scoping, SAQ questionnaire automation, ASV scan orchestration, control validation, and compliance reporting.

## Capabilities

### Cardholder Data Environment (CDE) Scoping
- Identify systems storing, processing, or transmitting cardholder data
- Map cardholder data flows
- Document network segmentation
- Identify connected and security-impacting systems
- Generate CDE scope documentation

### Self-Assessment Questionnaire (SAQ) Automation
- Determine appropriate SAQ type (A, A-EP, B, B-IP, C, C-VT, D, P2PE)
- Auto-populate questionnaire responses from evidence
- Track compensating controls
- Generate SAQ submissions

### ASV Scan Orchestration
- Schedule and manage ASV vulnerability scans
- Track quarterly scan requirements
- Manage scan disputes and remediation
- Aggregate scan results across environments
- Monitor passing scan status

### Control Validation by Requirement
- Requirement 1: Network security controls
- Requirement 2: Secure configurations
- Requirement 3: Protect stored account data
- Requirement 4: Protect data in transit
- Requirement 5: Malware protection
- Requirement 6: Secure systems and software
- Requirement 7: Restrict access by business need
- Requirement 8: User identification and authentication
- Requirement 9: Physical access restrictions
- Requirement 10: Logging and monitoring
- Requirement 11: Security testing
- Requirement 12: Security policies

### Evidence Collection
- Automated evidence gathering for each requirement
- Policy and procedure documentation
- Configuration evidence capture
- Log sample collection
- Access control evidence

### Compliance Reporting
- Generate Attestation of Compliance (AOC)
- Prepare Report on Compliance (ROC) artifacts
- Create compliance dashboards
- Track compliance metrics over time

## PCI DSS v4.0 Coverage

### Build and Maintain Secure Network
- Req 1: Install and maintain network security controls
- Req 2: Apply secure configurations

### Protect Account Data
- Req 3: Protect stored account data
- Req 4: Protect cardholder data during transmission

### Maintain Vulnerability Management
- Req 5: Protect against malicious software
- Req 6: Develop and maintain secure systems

### Implement Strong Access Control
- Req 7: Restrict access to system components
- Req 8: Identify users and authenticate access
- Req 9: Restrict physical access

### Monitor and Test Networks
- Req 10: Log and monitor access
- Req 11: Test security regularly

### Maintain Security Policy
- Req 12: Support information security with policies

## Integrations

- **SecurityMetrics**: PCI compliance and ASV scanning
- **Qualys**: Vulnerability scanning and PCI compliance
- **Trustwave**: ASV scanning and compliance services
- **PCI Council Tools**: Official PCI SSC resources
- **Cloud Provider Tools**: AWS, Azure, GCP compliance tools

## Target Processes

- PCI DSS Compliance Process
- Quarterly ASV Scanning
- Annual Assessment Preparation
- Cardholder Data Protection

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "assessmentType": {
      "type": "string",
      "enum": ["full", "saq", "asv", "scope", "gap"],
      "description": "Type of PCI DSS assessment"
    },
    "merchantLevel": {
      "type": "integer",
      "enum": [1, 2, 3, 4],
      "description": "PCI merchant level"
    },
    "saqType": {
      "type": "string",
      "enum": ["A", "A-EP", "B", "B-IP", "C", "C-VT", "D-Merchant", "D-ServiceProvider", "P2PE"],
      "description": "Applicable SAQ type"
    },
    "cdeScope": {
      "type": "object",
      "properties": {
        "systems": { "type": "array", "items": { "type": "string" } },
        "networks": { "type": "array", "items": { "type": "string" } },
        "applications": { "type": "array", "items": { "type": "string" } }
      }
    },
    "asvTargets": {
      "type": "array",
      "items": { "type": "string" },
      "description": "IP addresses/hostnames for ASV scanning"
    },
    "existingDocumentation": {
      "type": "string",
      "description": "Path to existing PCI documentation"
    }
  },
  "required": ["assessmentType"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "assessmentId": {
      "type": "string"
    },
    "assessmentType": {
      "type": "string"
    },
    "assessmentDate": {
      "type": "string",
      "format": "date-time"
    },
    "cdeScope": {
      "type": "object",
      "properties": {
        "inScopeSystems": { "type": "array" },
        "connectedSystems": { "type": "array" },
        "outOfScopeSystems": { "type": "array" },
        "segmentationStatus": { "type": "string" }
      }
    },
    "requirementStatus": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "requirement": { "type": "string" },
          "status": { "type": "string", "enum": ["compliant", "non-compliant", "not-applicable", "compensating-control"] },
          "findings": { "type": "array" },
          "evidence": { "type": "array" }
        }
      }
    },
    "asvResults": {
      "type": "object",
      "properties": {
        "scanDate": { "type": "string" },
        "passingStatus": { "type": "boolean" },
        "vulnerabilities": { "type": "array" },
        "disputes": { "type": "array" }
      }
    },
    "saqResponses": {
      "type": "object"
    },
    "gapAnalysis": {
      "type": "array"
    },
    "complianceScore": {
      "type": "number"
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'pci-dss-compliance-automator',
  context: {
    assessmentType: 'full',
    merchantLevel: 2,
    saqType: 'D-Merchant',
    cdeScope: {
      systems: ['Payment Gateway', 'POS Terminal', 'Web Store'],
      networks: ['Payment VLAN', 'DMZ']
    }
  }
}
```
