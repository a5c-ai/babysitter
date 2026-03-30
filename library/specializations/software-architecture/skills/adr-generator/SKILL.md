---
name: adr-generator
description: Specialized skill for generating and managing Architecture Decision Records (ADRs). Supports Nygard, MADR, and custom templates with auto-numbering, linking, and status management.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: documentation
  backlog-id: SK-SA-003
---

# adr-generator

You are **adr-generator** - a specialized skill for generating and managing Architecture Decision Records. This skill enables AI-powered decision documentation following industry-standard templates and practices.

## Overview

This skill enables comprehensive ADR management including:
- Generate ADRs from multiple templates (Nygard, MADR, custom)
- Auto-number ADRs with configurable prefix
- Link related ADRs and track supersession
- Manage ADR lifecycle (Proposed, Accepted, Deprecated, Superseded)
- Integration with adr-tools CLI
- Generate ADR index and visualization

## Prerequisites

- Node.js (v18+) or Python for tooling
- Optional: adr-tools, log4brains, adr-viewer

## Capabilities

### 1. ADR Generation - Nygard Template

Generate ADRs using the classic Nygard format:

```markdown
# 1. Record architecture decisions

Date: 2026-01-24

## Status

Accepted

## Context

We need to record the architectural decisions made on this project.

## Decision

We will use Architecture Decision Records, as described by Michael Nygard in his article.

## Consequences

See Michael Nygard's article, linked above. For a lightweight ADR toolset, see Nat Pryce's adr-tools.
```

### 2. ADR Generation - MADR Template

Generate ADRs using the Markdown Any Decision Records (MADR) format:

```markdown
---
status: accepted
date: 2026-01-24
decision-makers: [John Doe, Jane Smith]
consulted: [Architecture Team, Security Team]
informed: [Engineering]
---

# Use PostgreSQL as Primary Database

## Context and Problem Statement

We need to select a primary database for the application. The database needs to handle OLTP workloads with complex queries and support ACID transactions.

## Decision Drivers

* Performance requirements: <100ms query latency at P99
* Data consistency requirements for financial transactions
* Developer familiarity and ecosystem support
* Operational complexity and cost

## Considered Options

* PostgreSQL
* MySQL
* MongoDB
* CockroachDB

## Decision Outcome

Chosen option: "PostgreSQL", because it best meets our requirements for complex queries, ACID compliance, and has strong team familiarity.

### Consequences

* Good, because PostgreSQL supports complex queries and joins efficiently
* Good, because ACID compliance ensures data integrity
* Good, because team has existing PostgreSQL expertise
* Bad, because horizontal scaling requires additional complexity (Citus/partitioning)
* Neutral, because operational costs are similar to alternatives

### Confirmation

We will measure query performance during load testing and review database operations after 3 months of production use.

## Pros and Cons of the Options

### PostgreSQL

* Good, because excellent query optimizer and JSON support
* Good, because mature ecosystem with many tools
* Bad, because complex replication setup
* Neutral, because licensing is permissive (PostgreSQL License)

### MySQL

* Good, because simple replication
* Bad, because limited JSON query capabilities
* Bad, because less sophisticated query optimizer

### MongoDB

* Good, because easy horizontal scaling
* Bad, because no ACID transactions across documents
* Bad, because eventual consistency issues

### CockroachDB

* Good, because distributed ACID by default
* Bad, because higher operational complexity
* Bad, because less mature ecosystem

## More Information

* [PostgreSQL Documentation](https://www.postgresql.org/docs/)
* Related to ADR-001: Use microservices architecture
* Supersedes ADR-003: Use MySQL (draft, never accepted)
```

### 3. Auto-Numbering and Organization

```bash
# Directory structure
docs/
  decisions/
    0001-record-architecture-decisions.md
    0002-use-postgresql-database.md
    0003-adopt-event-sourcing.md
    0004-use-kubernetes-deployment.md
    index.md
    graph.md
```

### 4. ADR Lifecycle Management

```javascript
// Status transitions
const adrLifecycle = {
  statuses: ['proposed', 'accepted', 'deprecated', 'superseded'],
  transitions: {
    proposed: ['accepted', 'rejected'],
    accepted: ['deprecated', 'superseded'],
    deprecated: [],
    superseded: []
  }
};

// Supersession linking
const supersessionExample = {
  adr: 'ADR-0010',
  status: 'superseded',
  supersededBy: 'ADR-0015',
  reason: 'Technology migration to new platform'
};
```

### 5. ADR Index Generation

Generate an index of all ADRs:

```markdown
# Architecture Decision Records

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-01-24 |
| [ADR-0002](0002-use-postgresql-database.md) | Use PostgreSQL as Primary Database | Accepted | 2026-01-24 |
| [ADR-0003](0003-adopt-event-sourcing.md) | Adopt Event Sourcing | Proposed | 2026-01-24 |
| [ADR-0004](0004-use-kubernetes-deployment.md) | Use Kubernetes for Deployment | Accepted | 2026-01-24 |

## By Status

### Accepted
- ADR-0001: Record architecture decisions
- ADR-0002: Use PostgreSQL as Primary Database
- ADR-0004: Use Kubernetes for Deployment

### Proposed
- ADR-0003: Adopt Event Sourcing

## Relationships

```mermaid
graph TD
    ADR0001[ADR-0001: Record decisions]
    ADR0002[ADR-0002: PostgreSQL]
    ADR0003[ADR-0003: Event Sourcing]
    ADR0004[ADR-0004: Kubernetes]

    ADR0002 --> ADR0003
    ADR0004 --> ADR0002
```
```

### 6. ADR Search and Analysis

```bash
# Search ADRs by keyword
adr-generator search "database" --status accepted

# List ADRs affecting a component
adr-generator list --tag database --tag persistence

# Show ADR history
adr-generator history ADR-0002

# Validate all ADRs
adr-generator validate --strict
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| ADR Analysis MCP | AI-powered ADR analysis | [mcpmarket.com](https://mcpmarket.com/tools/skills/adr-creator-3) |
| ADR Creator Skill | MADR template with AI extensions | [mcpmarket.com](https://mcpmarket.com/tools/skills/adr-creator-3) |

## Best Practices

### Writing Effective ADRs

1. **Clear Context** - Explain the forces at play
2. **Explicit Decision** - State the decision clearly
3. **Rationale** - Document why this decision was made
4. **Consequences** - List both positive and negative impacts
5. **Options Considered** - Show alternatives evaluated

### ADR Anti-patterns to Avoid

```yaml
anti_patterns:
  - name: "Missing context"
    description: "Decision without explaining the problem"
    fix: "Always describe the context and forces"

  - name: "No alternatives"
    description: "Only one option considered"
    fix: "Document at least 2-3 alternatives"

  - name: "Orphaned ADR"
    description: "ADR not linked to related decisions"
    fix: "Always link related ADRs"

  - name: "Never updated"
    description: "Outdated ADR never superseded"
    fix: "Review and update status regularly"
```

### Template Selection Guide

| Template | Use Case | Complexity |
|----------|----------|------------|
| Nygard | Quick decisions, simple context | Low |
| MADR | Detailed analysis, multiple stakeholders | Medium |
| Y-Statements | Technical trade-offs | Low |
| Custom | Organization-specific requirements | Variable |

## Process Integration

This skill integrates with the following processes:
- `adr-documentation.js` - Primary ADR workflow
- `system-design-review.js` - Decision capture during reviews
- `tech-stack-evaluation.js` - Technology selection decisions
- `migration-strategy.js` - Migration decision documentation

## Output Format

When generating ADRs, provide structured output:

```json
{
  "operation": "create",
  "template": "madr",
  "status": "success",
  "adr": {
    "number": "0005",
    "title": "Use Redis for Caching",
    "status": "proposed",
    "path": "./docs/decisions/0005-use-redis-for-caching.md",
    "date": "2026-01-24"
  },
  "relationships": {
    "relatedTo": ["ADR-0002"],
    "supersedes": null,
    "supersededBy": null
  },
  "validation": {
    "valid": true,
    "warnings": [],
    "errors": []
  },
  "artifacts": ["0005-use-redis-for-caching.md", "index.md"]
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Duplicate ADR number` | Number already exists | Use next available number |
| `Invalid status transition` | Status change not allowed | Follow lifecycle rules |
| `Missing required field` | Template field empty | Fill all required fields |
| `Broken reference` | Referenced ADR not found | Fix or remove reference |

## Constraints

- Use consistent numbering format
- Document all significant decisions
- Link related ADRs bidirectionally
- Review and update ADR status regularly
- Store ADRs in version control
