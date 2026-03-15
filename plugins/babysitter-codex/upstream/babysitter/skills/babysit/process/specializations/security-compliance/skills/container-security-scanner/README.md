# Container Security Scanner

Automated container image and Kubernetes security scanning skill for identifying vulnerabilities, misconfigurations, and compliance issues in containerized environments.

## Overview

This skill provides comprehensive security scanning capabilities for container images and Kubernetes deployments. It integrates with industry-standard tools like Trivy, Grype, and kube-bench to detect CVEs, configuration issues, embedded secrets, and compliance violations.

## Key Features

- **Image Vulnerability Scanning**: Detect CVEs in container images using multiple scanners
- **Dockerfile Analysis**: Check Dockerfile best practices and security issues
- **Kubernetes Security**: Run CIS benchmarks and analyze RBAC configurations
- **SBOM Generation**: Create Software Bill of Materials in standard formats
- **Secrets Detection**: Find embedded credentials and API keys in images
- **Compliance Reporting**: Generate reports mapped to security frameworks

## Supported Tools

| Tool | Purpose |
|------|---------|
| Trivy | Comprehensive vulnerability scanner |
| Grype | Container image vulnerability scanner |
| Syft | SBOM generation |
| kube-bench | Kubernetes CIS benchmarks |
| Falco | Runtime security monitoring |
| cosign | Image signature verification |

## Usage

```javascript
skill: {
  name: 'container-security-scanner',
  context: {
    imageName: 'myapp:latest',
    scanType: ['vulnerability', 'config', 'secrets'],
    severityThreshold: 'HIGH'
  }
}
```

## Related Processes

- Container Security Scanning Process
- DevSecOps Pipeline Integration
- IaC Security Scanning
