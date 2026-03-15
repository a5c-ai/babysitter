# Network Systems Architect Agent

## Overview

The `network-architect` agent is a specialized AI agent embodying the expertise of a Principal Network Systems Architect. It provides strategic guidance for network system design, protocol architecture, and high-performance distributed systems.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Principal Network Systems Architect |
| **Experience** | 10+ years network systems design |
| **Background** | High-scale distributed systems, protocol design |
| **Certifications** | CCIE, AWS SA Pro equivalent |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Protocol Design** | Message formats, state machines, patterns |
| **High Performance** | Event-driven, zero-copy, kernel bypass |
| **Scalability** | Load balancing, sharding, caching |
| **Reliability** | HA patterns, failover, disaster recovery |
| **Security** | Zero trust, mTLS, defense in depth |
| **Multi-Region** | Global DNS, data replication, traffic management |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(networkArchitectTask, {
  agentName: 'network-architect',
  prompt: {
    role: 'Principal Network Systems Architect',
    task: 'Design high-availability API platform',
    context: {
      requirements: {
        rps: 100000,
        latency: '< 50ms p99',
        availability: '99.99%',
        regions: ['us-east', 'us-west', 'eu-west']
      },
      constraints: {
        budget: 'moderate',
        team: 'experienced with Kubernetes',
        existing: 'AWS infrastructure'
      }
    },
    instructions: [
      'Analyze requirements and constraints',
      'Propose architecture options with tradeoffs',
      'Recommend implementation approach',
      'Identify risks and mitigations'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Design network architecture
/agent network-architect design \
  --requirements "100k RPS, 50ms latency, 99.99% availability" \
  --constraints "AWS, Kubernetes, moderate budget"

# Review existing architecture
/agent network-architect review \
  --architecture-doc architecture.md \
  --focus "scalability,security"

# Protocol design consultation
/agent network-architect protocol-design \
  --use-case "real-time gaming" \
  --requirements "low latency, reliable ordering"
```

## Common Tasks

### 1. Architecture Design

Design complete network architectures:

```bash
/agent network-architect design-architecture \
  --type api-platform \
  --scale high \
  --availability 99.99 \
  --regions multi \
  --output architecture.json
```

Output includes:
- Component diagram
- Technology recommendations
- Scalability analysis
- Security considerations
- Cost estimates

### 2. Protocol Design Review

Review and improve protocol designs:

```bash
/agent network-architect review-protocol \
  --spec protocol.md \
  --checklist "performance,security,extensibility"
```

Reviews:
- Message format efficiency
- State machine correctness
- Error handling completeness
- Version compatibility

### 3. Performance Optimization

Optimize network performance:

```bash
/agent network-architect optimize \
  --current-architecture arch.yaml \
  --bottleneck "database connections" \
  --target "2x throughput"
```

Provides:
- Bottleneck analysis
- Optimization strategies
- Implementation roadmap
- Expected improvements

### 4. Migration Planning

Plan architecture migrations:

```bash
/agent network-architect migration-plan \
  --from monolith \
  --to microservices \
  --constraints "zero downtime"
```

Delivers:
- Migration phases
- Risk assessment
- Rollback strategies
- Timeline estimates

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `tcp-socket-server.js` | Architecture design |
| `custom-protocol-design.js` | Protocol architecture |
| `layer4-load-balancer.js` | Load balancing design |
| `layer7-load-balancer.js` | Application routing |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const architectureDesignTask = defineTask({
  name: 'design-network-architecture',
  description: 'Design network architecture with expert guidance',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Network Architecture Design',
      agent: {
        name: 'network-architect',
        prompt: {
          role: 'Principal Network Systems Architect',
          task: `Design ${inputs.type} architecture`,
          context: {
            requirements: inputs.requirements,
            constraints: inputs.constraints,
            existingInfra: inputs.existing
          },
          instructions: [
            'Analyze functional and non-functional requirements',
            'Evaluate architecture patterns and technologies',
            'Propose detailed component design',
            'Document tradeoffs and decisions',
            'Provide implementation roadmap'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['architecture', 'recommendations', 'adrs'],
          properties: {
            architecture: { type: 'object' },
            tradeoffs: { type: 'object' },
            recommendations: { type: 'array' },
            adrs: { type: 'array' }
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

## Architecture Patterns Reference

### Load Balancing

| Pattern | Use Case |
|---------|----------|
| Round Robin | Stateless services, equal capacity |
| Least Connections | Variable request duration |
| IP Hash | Session persistence |
| Weighted | Heterogeneous servers |

### High Availability

| Pattern | Use Case |
|---------|----------|
| Active-Passive | Stateful services, databases |
| Active-Active | Stateless services, APIs |
| Multi-Region | Global services, DR |

### Communication

| Pattern | Use Case |
|---------|----------|
| Request-Response | APIs, RPCs |
| Pub-Sub | Event-driven, notifications |
| Streaming | Real-time data, logs |

## Interaction Guidelines

### What to Expect

- **Comprehensive analysis** with multiple options
- **Trade-off discussions** for informed decisions
- **Industry best practices** and standards references
- **Practical implementation guidance**

### Best Practices

1. Provide clear requirements and constraints
2. Include existing infrastructure details
3. Specify team capabilities and preferences
4. Mention budget and timeline considerations

## Related Resources

- [socket-programming skill](../../skills/socket-programming/) - Low-level networking
- [tls-security skill](../../skills/tls-security/) - Security implementation
- [protocol-expert agent](../protocol-expert/) - Protocol implementation

## References

- [Designing Data-Intensive Applications](https://dataintensive.net/)
- [Building Microservices](https://www.oreilly.com/library/view/building-microservices/9781491950340/)
- [Site Reliability Engineering](https://sre.google/books/)
- [Network Programmability and Automation](https://www.oreilly.com/library/view/network-programmability-and/9781491931240/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-001
**Category:** Architecture
**Status:** Active
