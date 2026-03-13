# Containerization Assistant Skill

## Overview

The Containerization Assistant skill helps containerize applications. It generates optimized Dockerfiles, selects appropriate base images, and ensures security best practices.

## Quick Start

### Prerequisites

- Docker installed
- Application to containerize
- Understanding of dependencies

### Basic Usage

1. **Analyze application**
   - Detect language/framework
   - Identify dependencies
   - Map build process

2. **Generate Dockerfile**
   ```dockerfile
   # Generated Dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:18-alpine
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   CMD ["node", "dist/index.js"]
   ```

3. **Build and test**
   ```bash
   docker build -t myapp .
   docker run myapp
   ```

## Features

### Optimization Techniques

| Technique | Benefit | Impact |
|-----------|---------|--------|
| Multi-stage builds | Smaller images | High |
| Layer caching | Faster builds | Medium |
| Alpine base | Smaller size | High |
| Distroless | Security | High |

### Language Support

- Node.js/JavaScript
- Python
- Java (Spring Boot)
- Go
- .NET Core
- Ruby

## Configuration

```json
{
  "application": {
    "path": "./",
    "language": "auto-detect"
  },
  "options": {
    "multiStage": true,
    "baseImage": "alpine",
    "includeHealthCheck": true,
    "runAsNonRoot": true
  }
}
```

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
