---
name: container-security-scanner
description: Container image and Kubernetes security scanning for CVEs, misconfigurations, and compliance
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - WebFetch
---

# Container Security Scanner Skill

## Purpose

Automated container image and Kubernetes security scanning to identify vulnerabilities, misconfigurations, secrets, and compliance issues in containerized environments.

## Capabilities

### Image Vulnerability Scanning
- Scan container images for known CVEs using Trivy, Grype, or Anchore
- Detect vulnerabilities in OS packages and application dependencies
- Generate SBOM (Software Bill of Materials) in CycloneDX or SPDX format
- Track vulnerability severity (Critical, High, Medium, Low)

### Dockerfile Security Analysis
- Check Dockerfile best practices and security issues
- Identify privileged container configurations
- Detect hardcoded secrets in Dockerfiles
- Verify base image security and freshness

### Kubernetes Security Scanning
- Run Kubernetes CIS benchmark checks using kube-bench
- Analyze pod security policies and standards
- Check RBAC configurations for over-permissive access
- Detect insecure network policies

### Secrets Detection
- Scan images for embedded secrets and credentials
- Identify API keys, tokens, and passwords in layers
- Check environment variable configurations

### Image Signature Verification
- Verify container image signatures using cosign
- Validate image provenance and attestations
- Check image registry security configurations

### Compliance Reporting
- Generate compliance reports (CIS, NIST, PCI-DSS)
- Map findings to compliance controls
- Track remediation status and timelines

## Integrations

- **Trivy**: Comprehensive vulnerability scanner for containers
- **Grype**: Container image vulnerability scanner
- **Syft**: SBOM generation tool
- **kube-bench**: Kubernetes CIS benchmark checker
- **Falco**: Runtime security monitoring
- **Anchore**: Enterprise container security platform
- **cosign**: Container image signing and verification

## Target Processes

- Container Security Scanning Process
- DevSecOps Pipeline Integration
- IaC Security Scanning
- Kubernetes Security Hardening
- Container Image Build Pipeline

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "imageName": {
      "type": "string",
      "description": "Container image name with tag"
    },
    "registry": {
      "type": "string",
      "description": "Container registry URL"
    },
    "dockerfilePath": {
      "type": "string",
      "description": "Path to Dockerfile for static analysis"
    },
    "kubeManifestPath": {
      "type": "string",
      "description": "Path to Kubernetes manifests"
    },
    "scanType": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["vulnerability", "config", "secrets", "compliance", "sbom"]
      }
    },
    "severityThreshold": {
      "type": "string",
      "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    }
  },
  "required": ["imageName"]
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
    "imageName": {
      "type": "string"
    },
    "scanTimestamp": {
      "type": "string",
      "format": "date-time"
    },
    "vulnerabilities": {
      "type": "object",
      "properties": {
        "critical": { "type": "integer" },
        "high": { "type": "integer" },
        "medium": { "type": "integer" },
        "low": { "type": "integer" },
        "findings": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "cveId": { "type": "string" },
              "severity": { "type": "string" },
              "package": { "type": "string" },
              "fixedVersion": { "type": "string" },
              "description": { "type": "string" }
            }
          }
        }
      }
    },
    "misconfigurations": {
      "type": "array"
    },
    "secrets": {
      "type": "array"
    },
    "complianceStatus": {
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
  name: 'container-security-scanner',
  context: {
    imageName: 'myapp:v1.2.3',
    registry: 'registry.example.com',
    scanType: ['vulnerability', 'config', 'secrets'],
    severityThreshold: 'HIGH'
  }
}
```
