# Test Environment Expert Agent

## Overview

The `test-environment-expert` agent is a specialized AI agent embodying the expertise of a Test Infrastructure Engineer. It provides deep knowledge for test environment architecture, container-based environments, environment provisioning, service virtualization, and test isolation patterns.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Test Infrastructure Engineer |
| **Experience** | 6+ years test environments |
| **Background** | Docker, Kubernetes, IaC |
| **Focus** | Reproducible, isolated environments |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Environment Architecture** | Test env design and tiers |
| **Container Environments** | Docker, Docker Compose, Testcontainers |
| **Provisioning** | Terraform, IaC, cloud environments |
| **Service Virtualization** | Mocks, stubs, WireMock |
| **Environment Parity** | Dev/staging/prod consistency |
| **Test Isolation** | Network, data, filesystem isolation |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(envExpertTask, {
  agentName: 'test-environment-expert',
  prompt: {
    role: 'Test Infrastructure Engineer',
    task: 'Design test environment for microservices',
    context: {
      services: ['api', 'worker', 'scheduler'],
      dependencies: ['postgres', 'redis', 'rabbitmq'],
      testTypes: ['unit', 'integration', 'e2e']
    },
    instructions: [
      'Design Docker Compose configuration',
      'Configure health checks',
      'Set up service virtualization',
      'Plan cleanup strategy'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Design test environment
/agent test-environment-expert design \
  --services api,worker \
  --dependencies postgres,redis \
  --output docker-compose.test.yml

# Analyze environment parity
/agent test-environment-expert check-parity \
  --source local \
  --target staging

# Optimize environment
/agent test-environment-expert optimize \
  --compose docker-compose.test.yml \
  --focus startup-time
```

## Common Tasks

### 1. Environment Design

Design comprehensive test environments:

```bash
/agent test-environment-expert design \
  --architecture microservices \
  --services "api,auth,notifications" \
  --databases "postgres,redis" \
  --message-queues rabbitmq \
  --output-format compose
```

### 2. Environment Troubleshooting

Debug environment issues:

```bash
/agent test-environment-expert troubleshoot \
  --compose docker-compose.test.yml \
  --issue "service unhealthy" \
  --service db
```

### 3. Resource Optimization

Optimize resource usage:

```bash
/agent test-environment-expert optimize \
  --compose docker-compose.test.yml \
  --targets memory,startup-time \
  --constraints "max-memory=4GB"
```

### 4. CI/CD Integration

Configure pipeline environments:

```bash
/agent test-environment-expert ci-config \
  --platform github-actions \
  --compose docker-compose.test.yml \
  --parallel 4
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `environment-management.js` | All environment phases |
| `test-data-management.js` | Environment data management |
| `automation-framework.js` | Framework environment setup |
| `continuous-testing.js` | CI/CD environment management |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const setupEnvironmentTask = defineTask({
  name: 'setup-test-environment',
  description: 'Set up test environment with expert guidance',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Test Environment Setup',
      agent: {
        name: 'test-environment-expert',
        prompt: {
          role: 'Test Infrastructure Engineer',
          task: 'Set up isolated test environment',
          context: {
            services: inputs.services,
            dependencies: inputs.dependencies,
            testType: inputs.testType
          },
          instructions: [
            'Generate Docker Compose configuration',
            'Configure health checks for all services',
            'Set up test data seeding',
            'Configure cleanup procedures',
            'Provide startup and verification commands'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['compose', 'commands', 'cleanup'],
          properties: {
            compose: { type: 'string' },
            commands: { type: 'object' },
            cleanup: { type: 'object' }
          }
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

## Environment Tiers

| Tier | Purpose | Lifecycle | Data | Isolation |
|------|---------|-----------|------|-----------|
| **Local** | Dev testing | Ephemeral | Synthetic | Full |
| **CI** | Automated tests | Per-build | Synthetic | Full |
| **Staging** | Integration | Persistent | Anonymized | Partial |
| **Performance** | Load testing | On-demand | Production-like | Network |

## Service Templates

### Common Services

| Service | Image | Health Check |
|---------|-------|--------------|
| PostgreSQL | `postgres:15-alpine` | `pg_isready` |
| Redis | `redis:7-alpine` | `redis-cli ping` |
| RabbitMQ | `rabbitmq:3-management` | `rabbitmq-diagnostics` |
| Elasticsearch | `elasticsearch:8.11.0` | `curl /_cluster/health` |
| LocalStack | `localstack/localstack` | `curl /health` |

## Interaction Guidelines

### What to Expect

- **Comprehensive configurations** with best practices
- **Health check configurations** for all services
- **Resource-optimized** setups
- **Cleanup procedures** included
- **CI/CD integration** guidance

### Best Practices

1. Provide full service list and dependencies
2. Specify test types (unit, integration, e2e)
3. Include resource constraints
4. Mention CI/CD platform if relevant
5. Specify environment tier

## Related Resources

- [docker-test-environments skill](../skills/docker-test-environments/) - Docker integration
- [test-data-generation skill](../skills/test-data-generation/) - Test data
- [security-testing-expert agent](../agents/security-testing-expert/) - Security testing

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Testcontainers](https://testcontainers.com/)
- [WireMock](https://wiremock.org/)
- [Terraform](https://www.terraform.io/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-012
**Category:** Environment Management
**Status:** Active
