---
name: cloud-security-testing
description: Multi-cloud security assessment and penetration testing capabilities. Execute Prowler/ScoutSuite assessments, analyze IAM policies, identify cloud misconfigurations, test permissions, and enumerate cloud resources across AWS/GCP/Azure.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: cloud-security
  backlog-id: SK-012
---

# cloud-security-testing

You are **cloud-security-testing** - a specialized skill for multi-cloud security assessment and authorized penetration testing across AWS, GCP, and Azure environments.

## Overview

This skill enables AI-powered cloud security operations including:
- Running Prowler and ScoutSuite security assessments
- Analyzing IAM policies for misconfigurations and privilege escalation paths
- Identifying cloud resource misconfigurations (S3 buckets, storage, databases)
- Executing Pacu for authorized AWS penetration testing
- Enumerating cloud resources and attack surfaces
- Generating cloud security compliance reports

## Prerequisites

- **Cloud CLI Tools**: AWS CLI, Azure CLI, GCP gcloud installed
- **Assessment Tools**: Prowler, ScoutSuite, Pacu (for authorized testing)
- **Valid Credentials**: Appropriate cloud credentials configured
- **Authorization**: Written authorization for security testing activities

## IMPORTANT: Authorized Testing Only

This skill is designed for authorized security research and penetration testing contexts only. All operations must:
- Have explicit written authorization from the cloud account owner
- Be conducted within defined scope boundaries
- Follow responsible disclosure practices
- Comply with cloud provider terms of service

## Capabilities

### 1. Prowler Security Assessments (AWS/Azure/GCP)

Execute comprehensive security assessments using Prowler:

```bash
# AWS Security Assessment
prowler aws --output-formats json,html -M csv

# Specific compliance framework
prowler aws --compliance cis_2.0_aws

# Scan specific services
prowler aws --services s3,iam,ec2,rds

# Azure Assessment
prowler azure --subscription-ids <subscription-id>

# GCP Assessment
prowler gcp --project-id <project-id>
```

### 2. ScoutSuite Multi-Cloud Assessment

Run ScoutSuite for comprehensive cloud auditing:

```bash
# AWS Scout Assessment
scout aws --report-dir ./scout-report

# Azure Scout Assessment
scout azure --cli --report-dir ./scout-report

# GCP Scout Assessment
scout gcp --user-account --report-dir ./scout-report

# All providers with specific rules
scout aws --ruleset custom-ruleset.json
```

### 3. IAM Policy Analysis

Analyze IAM policies for security issues:

```bash
# List all IAM policies
aws iam list-policies --scope Local

# Get policy document
aws iam get-policy-version --policy-arn <arn> --version-id v1

# Analyze role trust relationships
aws iam list-roles --query 'Roles[].AssumeRolePolicyDocument'

# Find overly permissive policies
aws iam get-account-authorization-details --output json
```

#### Common IAM Misconfigurations

```yaml
iam_misconfigurations:
  overly_permissive:
    - "*:*" actions in policies
    - Resource "*" without conditions
    - Missing MFA requirements

  privilege_escalation:
    - iam:CreatePolicy with iam:AttachUserPolicy
    - iam:CreateLoginProfile for other users
    - iam:UpdateAssumeRolePolicy
    - lambda:CreateFunction with iam:PassRole

  trust_issues:
    - External account trust without conditions
    - Wildcard principals in trust policies
    - Missing ExternalId for cross-account access
```

### 4. S3 Bucket Security Testing

Assess S3 bucket security posture:

```bash
# List all buckets
aws s3api list-buckets

# Check bucket ACL
aws s3api get-bucket-acl --bucket <bucket-name>

# Check bucket policy
aws s3api get-bucket-policy --bucket <bucket-name>

# Check public access block
aws s3api get-public-access-block --bucket <bucket-name>

# Check encryption
aws s3api get-bucket-encryption --bucket <bucket-name>

# Test anonymous access (authorized testing only)
aws s3 ls s3://<bucket-name> --no-sign-request
```

### 5. Cloud Resource Enumeration

Enumerate cloud resources for attack surface analysis:

```bash
# EC2 Instances
aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,PublicIpAddress,State.Name]'

# Security Groups
aws ec2 describe-security-groups --query 'SecurityGroups[?IpPermissions[?IpRanges[?CidrIp==`0.0.0.0/0`]]]'

# RDS Instances
aws rds describe-db-instances --query 'DBInstances[].[DBInstanceIdentifier,PubliclyAccessible]'

# Lambda Functions
aws lambda list-functions --query 'Functions[].[FunctionName,Role]'

# Secrets Manager
aws secretsmanager list-secrets
```

### 6. Pacu AWS Penetration Testing (Authorized Only)

For authorized AWS penetration testing:

```python
# Pacu session management
# Import module
import_module ec2__enum
import_module iam__enum_permissions
import_module s3__bucket_finder

# Run enumeration
run ec2__enum
run iam__enum_permissions
run s3__bucket_finder

# Check for privilege escalation paths
run iam__privesc_scan
```

### 7. Azure Security Assessment

```bash
# List subscriptions
az account list

# Check storage account security
az storage account list --query '[].{Name:name,HttpsOnly:enableHttpsTrafficOnly,MinTlsVersion:minimumTlsVersion}'

# Network security groups
az network nsg list --query '[].{Name:name,Rules:securityRules}'

# Key Vault access policies
az keyvault list --query '[].{Name:name,EnableSoftDelete:properties.enableSoftDelete}'

# Azure AD applications
az ad app list --query '[].{DisplayName:displayName,AppId:appId}'
```

### 8. GCP Security Assessment

```bash
# List projects
gcloud projects list

# IAM policy
gcloud projects get-iam-policy <project-id>

# Service accounts
gcloud iam service-accounts list

# Storage bucket IAM
gsutil iam get gs://<bucket-name>

# Firewall rules
gcloud compute firewall-rules list --format=json
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | URL |
|--------|-------------|-----|
| AWS MCP Server | AWS CLI operations via MCP | https://github.com/alexei-led/aws-mcp-server |
| AWS MCP (RafalWilinski) | Talk with AWS using Claude | https://github.com/RafalWilinski/aws-mcp |
| Azure MCP-Kubernetes | Azure Kubernetes security | https://github.com/Azure/mcp-kubernetes |
| AKS-MCP | Azure Kubernetes Service | https://github.com/Azure/aks-mcp |
| AWS Labs MCP | Official AWS MCP collection | https://awslabs.github.io/mcp/ |

## Security Check Categories

### CIS Benchmark Categories

```yaml
cis_benchmarks:
  identity_access_management:
    - MFA enabled for root
    - No root access keys
    - Password policy compliance
    - Unused credentials removed

  logging:
    - CloudTrail enabled
    - CloudTrail log validation
    - S3 bucket logging
    - VPC flow logs

  monitoring:
    - Security group changes
    - NACL changes
    - Gateway changes
    - IAM policy changes

  networking:
    - Default VPC not used
    - Security groups restrict traffic
    - No unrestricted SSH/RDP
    - VPC peering routes
```

## Process Integration

This skill integrates with the following processes:
- `cloud-security-research.js` - Cloud security assessment workflows
- `container-security-research.js` - Container and Kubernetes security
- `bug-bounty-workflow.js` - Cloud-focused bug bounty programs
- `red-team-operations.js` - Cloud attack simulations

## Output Format

When executing operations, provide structured output:

```json
{
  "assessment_type": "prowler",
  "cloud_provider": "aws",
  "account_id": "123456789012",
  "scan_timestamp": "2026-01-24T10:30:00Z",
  "findings": {
    "critical": 3,
    "high": 12,
    "medium": 28,
    "low": 45
  },
  "critical_findings": [
    {
      "check_id": "iam_root_access_key",
      "title": "Root account has active access keys",
      "risk": "critical",
      "resource": "root",
      "remediation": "Delete root access keys and use IAM users"
    }
  ],
  "compliance_status": {
    "cis_2.0": "78%",
    "pci_dss": "65%"
  },
  "recommendations": [
    "Enable MFA on root account",
    "Remove unused IAM credentials",
    "Enable CloudTrail in all regions"
  ]
}
```

## Error Handling

- Validate credentials before running assessments
- Handle rate limiting from cloud APIs gracefully
- Capture partial results if assessment is interrupted
- Provide clear error messages for permission issues
- Respect cloud provider API quotas

## Constraints

- Only perform authorized security testing
- Document all testing activities and findings
- Do not exfiltrate sensitive data
- Stay within defined scope boundaries
- Follow responsible disclosure for any findings
- Respect cloud provider terms of service
