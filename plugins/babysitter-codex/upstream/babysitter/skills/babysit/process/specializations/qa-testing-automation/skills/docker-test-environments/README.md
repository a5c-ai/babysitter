# Docker Test Environments Skill

## Overview

The `docker-test-environments` skill provides Docker-based test environment management for isolated, reproducible test execution. It enables AI-powered environment orchestration using Docker Compose, Testcontainers, and CI/CD pipeline integration.

## Quick Start

### Prerequisites

1. **Docker Engine** - Install from [docker.com](https://docs.docker.com/engine/install/)
2. **Docker Compose** - Typically included with Docker Desktop
3. **Sufficient Resources** - Recommended: 8GB RAM, 20GB disk space

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

For Testcontainers support:

```bash
# JavaScript/TypeScript
npm install @testcontainers/postgresql @testcontainers/redis

# Python
pip install testcontainers

# Java
# Add testcontainers dependency to pom.xml or build.gradle
```

## Usage

### Basic Operations

```bash
# Start test environment
/skill docker-test-environments start --compose docker-compose.test.yml

# Check environment status
/skill docker-test-environments status

# Run tests in environment
/skill docker-test-environments run-tests --command "npm test"

# Stop and cleanup
/skill docker-test-environments cleanup --volumes
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(dockerEnvTask, {
  operation: 'start',
  composeFile: 'docker-compose.test.yml',
  waitForHealthy: true,
  timeout: 120
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Compose Management** | Start, stop, and manage Docker Compose environments |
| **Testcontainers** | Programmatic container management for tests |
| **Health Checks** | Wait for services to be healthy |
| **Database Seeding** | Initialize databases with test data |
| **Network Isolation** | Create isolated networks for tests |
| **CI/CD Integration** | GitHub Actions, GitLab CI patterns |
| **Cleanup Automation** | Automatic environment teardown |

## Examples

### Example 1: Basic Test Environment

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  app:
    build: .
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgres://test:test@db:5432/testdb
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
      - POSTGRES_DB=testdb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test"]
      interval: 5s
      timeout: 5s
      retries: 5
```

```bash
# Start and run tests
/skill docker-test-environments start --compose docker-compose.test.yml --wait
/skill docker-test-environments run-tests --service app --command "npm test"
/skill docker-test-environments cleanup --volumes
```

### Example 2: Testcontainers (JavaScript)

```javascript
// test/integration/database.test.js
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { describe, it, beforeAll, afterAll } from 'vitest';

describe('Database Integration', () => {
  let container;
  let connectionUrl;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('testdb')
      .start();
    connectionUrl = container.getConnectionUri();
  }, 60000);

  afterAll(async () => {
    await container?.stop();
  });

  it('should connect to database', async () => {
    // Test with connectionUrl
  });
});
```

### Example 3: CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Start environment
        run: docker compose -f docker-compose.test.yml up -d --wait

      - name: Run tests
        run: docker compose -f docker-compose.test.yml exec -T app npm test

      - name: Cleanup
        if: always()
        run: docker compose -f docker-compose.test.yml down -v
```

### Example 4: Multiple Services

```bash
# Start full microservices test environment
/skill docker-test-environments start \
  --compose docker-compose.test.yml \
  --services api,worker,db,redis,kafka \
  --wait-timeout 180
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOCKER_HOST` | Docker daemon socket | `unix:///var/run/docker.sock` |
| `COMPOSE_FILE` | Default compose file | `docker-compose.yml` |
| `COMPOSE_PROJECT_NAME` | Project namespace | Directory name |

### Skill Configuration

```yaml
# .babysitter/skills/docker-test-environments.yaml
docker-test-environments:
  defaultComposeFile: docker-compose.test.yml
  waitTimeout: 120
  cleanupOnExit: true
  resourceLimits:
    memory: 4g
    cpus: 2
```

## Process Integration

### Processes Using This Skill

1. **environment-management.js** - All phases of environment setup
2. **test-data-management.js** - Data seeding and cleanup
3. **automation-framework.js** - Test framework environment setup
4. **continuous-testing.js** - CI/CD environment management

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const setupTestEnvTask = defineTask({
  name: 'setup-test-environment',
  description: 'Set up Docker test environment',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: 'Start Test Environment',
      skill: {
        name: 'docker-test-environments',
        context: {
          operation: 'start',
          composeFile: inputs.composeFile || 'docker-compose.test.yml',
          waitForHealthy: true,
          timeout: inputs.timeout || 120
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Reference

### QuantGeekDev/docker-mcp

Docker MCP Server for container management.

**Features:**
- Container lifecycle management
- Image operations
- Volume management
- Network configuration

**GitHub:** https://github.com/QuantGeekDev/docker-mcp

### Docker MCP Toolkit

Official Docker MCP integration.

**Features:**
- Docker Desktop integration
- Compose support
- Resource monitoring

**Documentation:** https://www.docker.com/blog/connect-mcp-servers-to-claude-desktop-with-mcp-toolkit/

## Service Templates

### Common Services

| Service | Image | Health Check |
|---------|-------|--------------|
| PostgreSQL | `postgres:15-alpine` | `pg_isready` |
| MySQL | `mysql:8` | `mysqladmin ping` |
| MongoDB | `mongo:6` | `mongosh ping` |
| Redis | `redis:7-alpine` | `redis-cli ping` |
| Elasticsearch | `elasticsearch:8.11.0` | `curl /_cluster/health` |
| Kafka | `confluentinc/cp-kafka:7.5.0` | `kafka-topics.sh --list` |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Cannot connect to Docker` | Start Docker daemon, check DOCKER_HOST |
| `Port already in use` | Stop conflicting services, use different ports |
| `Out of memory` | Increase Docker memory limit, reduce containers |
| `Health check timeout` | Increase timeout, check service logs |
| `Volume permission denied` | Check file ownership, use named volumes |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
DOCKER_DEBUG=true /skill docker-test-environments start --compose docker-compose.test.yml
```

### View Logs

```bash
# All services
docker compose -f docker-compose.test.yml logs -f

# Specific service
docker compose -f docker-compose.test.yml logs -f db
```

## Related Skills

- **test-data-generation** - Generate test data for environments
- **owasp-zap-security** - Security testing in Docker
- **playwright-e2e** - E2E testing with Docker

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Testcontainers](https://testcontainers.com/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [QuantGeekDev/docker-mcp](https://github.com/QuantGeekDev/docker-mcp)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-020
**Category:** Environment Management
**Status:** Active
