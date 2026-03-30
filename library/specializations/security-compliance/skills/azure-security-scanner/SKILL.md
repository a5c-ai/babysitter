---
name: azure-security-scanner
description: Azure security configuration scanning and hardening using Azure Security Center, Azure Policy, and ScoutSuite
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# Azure Security Scanner Skill

## Purpose

Automated Azure security configuration scanning and hardening to identify misconfigurations, compliance violations, and security risks across Azure subscriptions and tenants.

## Capabilities

### Azure Security Center Assessments
- Run Microsoft Defender for Cloud security assessments
- Check secure score and recommendations
- Review security alerts and incidents
- Validate just-in-time VM access
- Check adaptive application controls
- Monitor regulatory compliance dashboards

### Azure AD Security Analysis
- Analyze Azure AD conditional access policies
- Check MFA enforcement status
- Review privileged identity management (PIM)
- Identify risky sign-ins and users
- Analyze app registrations and service principals
- Check guest user access configurations

### Network Security Group Analysis
- Review NSG rules for overly permissive access
- Check for open management ports (RDP, SSH)
- Validate application security groups
- Review Azure Firewall configurations
- Check DDoS protection status
- Analyze virtual network configurations

### Storage Account Security
- Identify publicly accessible storage accounts
- Check encryption configurations (SSE, CMK)
- Review shared access signatures (SAS)
- Validate network access rules
- Check secure transfer requirements
- Review access keys rotation

### Key Vault Security
- Check Key Vault access policies
- Validate network restrictions
- Review key expiration policies
- Check certificate configurations
- Verify soft-delete enablement
- Audit secret access patterns

### Activity Logging Verification
- Validate Azure Activity Log configuration
- Check diagnostic settings on resources
- Review Log Analytics workspace security
- Verify Azure Monitor alert rules
- Check Azure Sentinel integration

### Azure Policy Compliance
- Assess built-in policy compliance
- Check custom policy assignments
- Review policy exemptions
- Validate initiative assignments
- Generate compliance reports

## Azure Services Covered

| Category | Services |
|----------|----------|
| Identity | Azure AD, PIM, Conditional Access |
| Compute | VMs, App Services, Functions, AKS |
| Storage | Storage Accounts, Blobs, Files |
| Database | SQL Database, Cosmos DB, PostgreSQL |
| Network | VNets, NSGs, Azure Firewall, WAF |
| Security | Defender, Key Vault, Sentinel |
| Monitoring | Monitor, Log Analytics, Application Insights |

## Integrations

- **Microsoft Defender for Cloud**: Cloud security posture management
- **Azure Policy**: Governance and compliance
- **Azure AD**: Identity security
- **ScoutSuite**: Multi-cloud security auditing
- **Azure Sentinel**: SIEM and SOAR

## Target Processes

- Cloud Security Architecture Review
- Compliance Monitoring
- Azure Subscription Hardening
- Security Posture Assessment

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "scanType": {
      "type": "string",
      "enum": ["full", "cis", "pci", "hipaa", "iso27001", "custom"],
      "description": "Type of security scan"
    },
    "subscriptions": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Azure subscription IDs to scan"
    },
    "resourceGroups": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Specific resource groups to scan"
    },
    "services": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Specific services to scan"
    },
    "severityThreshold": {
      "type": "string",
      "enum": ["critical", "high", "medium", "low"]
    },
    "complianceFrameworks": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["CIS", "PCI-DSS", "HIPAA", "ISO27001", "SOC2", "NIST"]
      }
    },
    "includeAzureAD": {
      "type": "boolean",
      "description": "Include Azure AD security checks"
    }
  },
  "required": ["scanType"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "scanId": {
      "type": "string"
    },
    "scanTimestamp": {
      "type": "string",
      "format": "date-time"
    },
    "subscriptionsScanned": {
      "type": "array"
    },
    "secureScore": {
      "type": "object",
      "properties": {
        "current": { "type": "number" },
        "max": { "type": "number" },
        "percentage": { "type": "number" }
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalChecks": { "type": "integer" },
        "passed": { "type": "integer" },
        "failed": { "type": "integer" },
        "warnings": { "type": "integer" }
      }
    },
    "findingsBySeverity": {
      "type": "object",
      "properties": {
        "critical": { "type": "integer" },
        "high": { "type": "integer" },
        "medium": { "type": "integer" },
        "low": { "type": "integer" }
      }
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "checkId": { "type": "string" },
          "severity": { "type": "string" },
          "service": { "type": "string" },
          "resourceId": { "type": "string" },
          "description": { "type": "string" },
          "remediation": { "type": "string" },
          "complianceMapping": { "type": "array" }
        }
      }
    },
    "azureAdFindings": {
      "type": "array"
    },
    "policyCompliance": {
      "type": "object"
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
  name: 'azure-security-scanner',
  context: {
    scanType: 'cis',
    subscriptions: ['subscription-id-1'],
    complianceFrameworks: ['CIS', 'SOC2'],
    includeAzureAD: true,
    severityThreshold: 'medium'
  }
}
```
