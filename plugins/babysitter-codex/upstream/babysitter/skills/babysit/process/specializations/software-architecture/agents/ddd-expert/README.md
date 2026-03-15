# DDD Expert Agent

## Overview

The `ddd-expert` agent embodies the expertise of a Domain-Driven Design consultant specialized in strategic and tactical DDD patterns. It provides expert guidance on domain modeling, bounded context identification, and aggregate design.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | DDD Strategic Consultant |
| **Experience** | 15+ years applying DDD |
| **Background** | Eric Evans, Vaughn Vernon methodologies |
| **Philosophy** | "Software should model the business" |

## Core DDD Principles

1. **Ubiquitous Language** - Shared vocabulary between devs and domain experts
2. **Bounded Contexts** - Explicit boundaries with clear interfaces
3. **Context Mapping** - Relationships between bounded contexts
4. **Aggregates** - Transactional consistency boundaries
5. **Domain Events** - Important business occurrences

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **Strategic DDD** | Subdomain classification, bounded contexts |
| **Context Mapping** | Partnership, ACL, OHS, Conformist patterns |
| **Aggregate Design** | Invariants, consistency boundaries |
| **Domain Events** | Event identification, event storming |
| **Ubiquitous Language** | Glossary building, language enforcement |
| **Event Storming** | Facilitation, process modeling |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(dddExpertTask, {
  agentName: 'ddd-expert',
  prompt: {
    role: 'DDD Strategic Consultant',
    task: 'Identify bounded contexts for e-commerce platform',
    context: {
      domain: 'E-commerce',
      businessCapabilities: ['ordering', 'fulfillment', 'payments'],
      currentArchitecture: './docs/current-state.md',
      domainExperts: ['product-owner', 'operations-lead']
    },
    instructions: [
      'Classify subdomains (core/supporting/generic)',
      'Identify bounded contexts',
      'Map context relationships',
      'Define ubiquitous language per context'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Subdomain analysis
/agent ddd-expert subdomains \
  --domain "Insurance Claims" \
  --business-capabilities "claims,underwriting,policies,customer-service"

# Bounded context design
/agent ddd-expert bounded-contexts \
  --domain "Order Management" \
  --event-storm-results ./event-storm.json

# Context mapping
/agent ddd-expert context-map \
  --contexts "sales,fulfillment,billing,inventory" \
  --integration-style event-driven

# Aggregate design
/agent ddd-expert aggregate-design \
  --context "Order Management" \
  --entities "Order,OrderItem,Customer,Payment"
```

## Common Tasks

### 1. Subdomain Classification

```bash
/agent ddd-expert classify-subdomains \
  --domain "FinTech Lending" \
  --capabilities "loan-origination,risk-assessment,servicing,collections"
```

Output includes:
- Core domain identification
- Supporting domain classification
- Generic domain recommendations
- Build vs buy guidance

### 2. Bounded Context Discovery

```bash
/agent ddd-expert discover-contexts \
  --domain "Healthcare Platform" \
  --processes "patient-intake,appointments,billing,records" \
  --output ./contexts.json
```

Provides:
- Context boundaries
- Context responsibilities
- Ubiquitous language per context
- Team alignment recommendations

### 3. Context Map Design

```bash
/agent ddd-expert design-context-map \
  --contexts ./contexts.json \
  --integration-requirements ./requirements.md \
  --output-format mermaid
```

Delivers:
- Context relationships
- Integration patterns (ACL, OHS, etc.)
- Data flow directions
- Visualization

### 4. Event Storming Facilitation

```bash
/agent ddd-expert event-storm \
  --domain "Order Processing" \
  --mode big-picture \
  --output ./event-storm-results.json
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `ddd-strategic-modeling.js` | Primary DDD workflow |
| `event-storming.js` | Event storming facilitation |
| `microservices-decomposition.js` | Service boundaries |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const dddAnalysisTask = defineTask({
  name: 'ddd-analysis',
  description: 'Perform DDD strategic analysis',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `DDD Analysis: ${inputs.domain}`,
      agent: {
        name: 'ddd-expert',
        prompt: {
          role: 'DDD Strategic Consultant',
          task: 'Analyze domain and identify bounded contexts',
          context: {
            domain: inputs.domain,
            businessCapabilities: inputs.capabilities,
            existingArchitecture: inputs.currentState,
            constraints: inputs.constraints
          },
          instructions: [
            'Classify subdomains by strategic importance',
            'Identify bounded contexts based on language boundaries',
            'Define context map with integration patterns',
            'Design key aggregates within core domain',
            'Identify critical domain events'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['subdomains', 'boundedContexts', 'contextMap'],
          properties: {
            subdomains: { type: 'object' },
            boundedContexts: { type: 'array' },
            contextMap: { type: 'object' },
            recommendations: { type: 'array' }
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

## DDD Reference

### Subdomain Types

| Type | Description | Guidance |
|------|-------------|----------|
| **Core** | Competitive advantage | Build, invest heavily |
| **Supporting** | Necessary, not differentiating | Build or buy |
| **Generic** | Common problems | Buy or SaaS |

### Context Map Patterns

| Pattern | Relationship | Use Case |
|---------|--------------|----------|
| **Partnership** | Symmetric collaboration | Tightly coupled teams |
| **Shared Kernel** | Shared model subset | Related contexts |
| **Customer-Supplier** | Asymmetric, customer influences | Internal service |
| **Conformist** | Downstream conforms | No negotiating power |
| **ACL** | Translation layer | External/legacy |
| **Open Host Service** | Published API | Multiple consumers |
| **Published Language** | Standard schema | Industry standards |
| **Separate Ways** | No integration | Independence preferred |

### Aggregate Design Rules

| Rule | Description |
|------|-------------|
| **Invariant Boundary** | Aggregate protects business rules |
| **Small Aggregates** | Include only what's needed |
| **Consistency Boundary** | Single aggregate = single transaction |
| **Reference by ID** | Don't embed other aggregates |

### Event Storming Elements

| Element | Color | Purpose |
|---------|-------|---------|
| Domain Event | Orange | What happened |
| Command | Blue | User intention |
| Aggregate | Yellow | Handles command |
| Policy | Lilac | Reaction to event |
| Read Model | Green | Information for decision |
| External System | Pink | Integration point |
| Actor | Small Yellow | Who triggers |

## Interaction Guidelines

### What to Expect

- **Collaborative approach** involving domain experts
- **Business-focused** language and concepts
- **Iterative refinement** of models
- **Pragmatic** application of patterns

### Best Practices

1. Involve domain experts from the start
2. Focus on core domain first
3. Let boundaries emerge from language
4. Don't force DDD everywhere
5. Iterate as understanding grows

## Related Resources

- [event-storming-facilitator agent](../event-storming-facilitator/) - Event storming
- [microservices-architect agent](../microservices-architect/) - Service design
- [c4-model-architect agent](../c4-model-architect/) - Visualization

## References

- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/)
- [Implementing DDD (Vaughn Vernon)](https://www.informit.com/store/implementing-domain-driven-design-9780321834577)
- [Domain-Driven Design Distilled](https://www.informit.com/store/domain-driven-design-distilled-9780134434421)
- [Event Storming (Alberto Brandolini)](https://www.eventstorming.com/)
- [Context Mapping Patterns](https://github.com/ddd-crew/context-mapping)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-SA-003
**Category:** Domain Modeling
**Status:** Active
