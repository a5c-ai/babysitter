---
name: containerization-assistant
description: Assist in containerizing applications with Dockerfile generation and optimization
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Containerization Assistant Skill

Assists in containerizing applications by generating Dockerfiles, optimizing images, and configuring container deployments.

## Purpose

Enable application containerization for:
- Dockerfile generation
- Multi-stage build optimization
- Base image selection
- Dependency packaging
- Security scanning

## Capabilities

### 1. Dockerfile Generation
- Generate from application analysis
- Support multiple languages
- Include best practices
- Handle build dependencies

### 2. Multi-Stage Build Optimization
- Separate build and runtime
- Minimize image size
- Cache build layers
- Optimize build time

### 3. Base Image Selection
- Recommend appropriate base images
- Balance size vs features
- Consider security updates
- Handle distroless options

### 4. Dependency Packaging
- Bundle application dependencies
- Handle native extensions
- Configure build tools
- Manage versions

### 5. Health Check Configuration
- Add health checks
- Configure readiness probes
- Set up liveness probes
- Define startup probes

### 6. Security Scanning
- Scan for vulnerabilities
- Check base image security
- Identify exposed secrets
- Review permissions

## Tool Integrations

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| Docker | Container runtime | CLI |
| Buildpacks | Auto-detection | CLI |
| Jib | Java containers | CLI |
| ko | Go containers | CLI |
| Dive | Image analysis | CLI |
| Trivy | Security scanning | CLI |

## Output Schema

```json
{
  "containerizationId": "string",
  "timestamp": "ISO8601",
  "application": {
    "name": "string",
    "language": "string",
    "framework": "string"
  },
  "artifacts": {
    "dockerfile": "string",
    "dockerignore": "string",
    "composeFile": "string"
  },
  "image": {
    "baseImage": "string",
    "estimatedSize": "string",
    "stages": "number"
  },
  "security": {
    "vulnerabilities": [],
    "recommendations": []
  }
}
```

## Integration with Migration Processes

- **containerization**: Primary containerization tool
- **cloud-migration**: Container deployment
- **monolith-to-microservices**: Service extraction

## Related Skills

- `iac-generator`: Kubernetes IaC
- `cloud-readiness-assessor`: Container readiness

## Related Agents

- `cloud-migration-engineer`: Container deployment
- `infrastructure-migration-agent`: Container infrastructure
