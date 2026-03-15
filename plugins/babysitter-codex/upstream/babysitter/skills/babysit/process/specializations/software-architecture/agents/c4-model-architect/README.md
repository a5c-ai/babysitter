# C4 Model Architect Agent

## Overview

The `c4-model-architect` agent embodies the expertise of a Senior Software Architect specialized in C4 model methodology. It provides expert guidance on architecture visualization at multiple abstraction levels.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Software Architect / C4 Specialist |
| **Experience** | 10+ years in software architecture |
| **Background** | Simon Brown's C4 model methodology |
| **Philosophy** | "Architecture should be as easy to understand as Google Maps" |

## Core C4 Principles

1. **Abstraction Levels** - Context, Container, Component, Code
2. **Audience Awareness** - Different diagrams for different stakeholders
3. **Technology Focus** - Context is business-focused, lower levels are technical
4. **Living Documentation** - Diagrams as code, version controlled
5. **Supplementary Diagrams** - Deployment, dynamic, filtered views

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **System Context** | Big picture, external actors, system boundary |
| **Container Diagrams** | Technology choices, deployable units |
| **Component Diagrams** | Internal structure, responsibilities |
| **Code Diagrams** | UML class diagrams, domain models |
| **Stakeholder Communication** | Audience-appropriate visualizations |
| **Notation Standards** | Structurizr, PlantUML, Mermaid |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(c4ArchitectTask, {
  agentName: 'c4-model-architect',
  prompt: {
    role: 'C4 Model Specialist',
    task: 'Create architecture diagrams for the e-commerce platform',
    context: {
      systemName: 'E-commerce Platform',
      scope: 'Order processing subsystem',
      stakeholders: ['executives', 'developers', 'operations'],
      existingDocs: './docs/architecture'
    },
    instructions: [
      'Identify system boundaries and actors',
      'Create context diagram for executive overview',
      'Create container diagram showing technology stack',
      'Recommend component diagrams for complex services'
    ],
    outputFormat: 'JSON with Structurizr DSL'
  }
});
```

### Direct Invocation

```bash
# Create context diagram
/agent c4-model-architect context \
  --system "Payment Gateway" \
  --output ./docs/diagrams

# Design container diagram
/agent c4-model-architect container \
  --system "Payment Gateway" \
  --include-external \
  --format structurizr

# Review existing architecture
/agent c4-model-architect review \
  --diagrams ./docs/diagrams \
  --suggest-improvements

# Create presentation-ready diagrams
/agent c4-model-architect presentation \
  --system "Platform Overview" \
  --audience executives \
  --format svg
```

## Common Tasks

### 1. System Context Design

```bash
/agent c4-model-architect context \
  --system "Customer Portal" \
  --actors "Customer,Support Agent,Admin" \
  --external-systems "Payment Provider,Email Service,Analytics" \
  --output-format structurizr
```

Output includes:
- System boundary identification
- Actor and external system mapping
- Relationship definitions
- Structurizr DSL code

### 2. Container Architecture

```bash
/agent c4-model-architect container \
  --system "Customer Portal" \
  --technology-stack "React,Node.js,PostgreSQL,Redis" \
  --communication-patterns
```

Provides:
- Container identification and grouping
- Technology annotations
- Communication protocols
- Database and cache placement

### 3. Component Decomposition

```bash
/agent c4-model-architect component \
  --container "Order Service" \
  --pattern "Clean Architecture" \
  --depth detailed
```

Delivers:
- Component identification
- Responsibility mapping
- Dependency analysis
- Pattern recommendations

### 4. Architecture Review

```bash
/agent c4-model-architect review \
  --workspace ./architecture/workspace.dsl \
  --check-completeness \
  --suggest-improvements
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `c4-model-documentation.js` | Primary diagram creation |
| `system-design-review.js` | Architecture visualization |
| `microservices-decomposition.js` | Service boundary mapping |
| `cloud-architecture-design.js` | Infrastructure visualization |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const createC4DiagramsTask = defineTask({
  name: 'create-c4-diagrams',
  description: 'Create C4 model diagrams for system architecture',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `C4 Diagrams for ${inputs.systemName}`,
      agent: {
        name: 'c4-model-architect',
        prompt: {
          role: 'C4 Model Architecture Specialist',
          task: 'Design architecture diagrams at appropriate abstraction levels',
          context: {
            system: inputs.systemName,
            scope: inputs.scope,
            existingArchitecture: inputs.existingDocs,
            targetAudience: inputs.stakeholders,
            diagramLevels: inputs.levels || ['context', 'container']
          },
          instructions: [
            'Analyze the system scope and identify boundaries',
            'Identify all actors and external systems',
            'Create context diagram showing big picture',
            'Create container diagram with technology choices',
            'Recommend component diagrams where needed',
            'Suggest supplementary diagrams (deployment, dynamic)'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['diagrams', 'recommendations'],
          properties: {
            diagrams: { type: 'array' },
            recommendations: { type: 'array' },
            conventions: { type: 'object' }
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

## C4 Model Reference

### Abstraction Levels

| Level | Purpose | Audience | Detail |
|-------|---------|----------|--------|
| **Context** | Big picture | Everyone | Low |
| **Container** | Technology decisions | Technical | Medium |
| **Component** | Internal structure | Developers | High |
| **Code** | Implementation | Developers | Very High |

### Element Types

| Element | Level | Description |
|---------|-------|-------------|
| Person | Context | Human user of the system |
| Software System | Context | Primary or external system |
| Container | Container | Deployable/runnable unit |
| Component | Component | Module/package within container |

### Relationship Guidelines

| Aspect | Guideline |
|--------|-----------|
| Direction | Arrow points in direction of dependency |
| Labels | Describe what happens, not just "uses" |
| Technology | Include protocol/technology in label |
| Consistency | Same relationship style across diagrams |

## Stakeholder Mapping

| Stakeholder | Diagram Levels | Focus Areas |
|-------------|----------------|-------------|
| Executives | Context | Business capabilities |
| Product | Context, Container | Features, integrations |
| Architects | Context, Container, Component | Patterns, decisions |
| Developers | Container, Component, Code | Implementation |
| Operations | Container, Deployment | Infrastructure |

## Interaction Guidelines

### What to Expect

- **Visual-first thinking** with diagram recommendations
- **Audience-appropriate** detail levels
- **Notation standards** (Structurizr DSL preferred)
- **Actionable recommendations** for diagram improvements

### Best Practices

1. Start with context, then zoom in
2. One primary focus per diagram
3. Include technology in container labels
4. Use consistent naming conventions
5. Version control diagram source

## Related Resources

- [c4-diagram-generator skill](../../skills/c4-diagram-generator/) - Diagram rendering
- [diagram-specialist agent](../diagram-specialist/) - General diagramming
- [technical-writer agent](../technical-writer/) - Documentation

## References

- [C4 Model](https://c4model.com/)
- [Structurizr](https://structurizr.com/)
- [Simon Brown's Books](https://simonbrown.je/)
- [C4 Model FAQ](https://c4model.com/#faq)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-SA-001
**Category:** Architecture Design
**Status:** Active
