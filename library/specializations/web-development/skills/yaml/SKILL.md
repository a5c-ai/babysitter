---
name: yaml
description: YAML configuration for CI/CD, Docker Compose, and Kubernetes.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:configuration-management]
  roles: [role:devops-engineer, role:backend-engineer]
  topics: [topic:developer-experience]

---

# YAML Skill

Expert assistance for YAML configuration files.

## Capabilities

- Write YAML configurations
- Handle complex structures
- Validate YAML syntax
- Configure CI/CD
- Set up Docker Compose

## Examples

```yaml
# Docker Compose
services:
  web:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

## Target Processes

- ci-cd-configuration
- docker-setup
- kubernetes-deployment
