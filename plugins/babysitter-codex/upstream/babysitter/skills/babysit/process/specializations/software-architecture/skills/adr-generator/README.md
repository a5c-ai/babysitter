# ADR Generator Skill

## Overview

The `adr-generator` skill provides specialized capabilities for generating and managing Architecture Decision Records (ADRs). It supports multiple templates and integrates with common ADR tooling.

## Quick Start

### Prerequisites

1. **Node.js** (v18+) - For tooling
2. **Optional Tools** - adr-tools, log4brains, adr-viewer

### Installation

The skill is included in the babysitter-sdk. For enhanced capabilities:

```bash
# Install adr-tools (macOS)
brew install adr-tools

# Install log4brains (interactive ADR viewer)
npm install -g log4brains

# Install adr-viewer
npm install -g adr-viewer
```

## Usage

### Basic Operations

```bash
# Initialize ADR directory
/skill adr-generator init \
  --directory ./docs/decisions \
  --template madr

# Create new ADR
/skill adr-generator create \
  --title "Use PostgreSQL as Primary Database" \
  --template madr \
  --status proposed

# Update ADR status
/skill adr-generator update \
  --adr 0005 \
  --status accepted

# Generate index
/skill adr-generator index \
  --directory ./docs/decisions \
  --format markdown
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(adrTask, {
  operation: 'create',
  title: 'Use Event Sourcing for Audit Trail',
  template: 'madr',
  context: 'We need immutable audit logging...',
  decision: 'We will use event sourcing pattern...',
  consequences: ['Positive: Complete audit trail', 'Negative: Increased complexity'],
  relatedAdrs: ['ADR-0002', 'ADR-0010']
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Multiple Templates** | Nygard, MADR, Y-Statement, custom |
| **Auto-Numbering** | Sequential numbering with prefix |
| **Status Management** | Lifecycle tracking |
| **Linking** | Related ADRs and supersession |
| **Index Generation** | Automated index and visualization |
| **Validation** | Template compliance checking |

## Examples

### Example 1: Create ADR with MADR Template

```bash
/skill adr-generator create \
  --title "Adopt Microservices Architecture" \
  --template madr \
  --decision-makers "CTO,Lead Architect" \
  --drivers "scalability,team autonomy,deployment flexibility" \
  --options "monolith,microservices,serverless" \
  --chosen "microservices"
```

### Example 2: Supersede Existing ADR

```bash
/skill adr-generator supersede \
  --original ADR-0003 \
  --title "Migrate from MySQL to PostgreSQL" \
  --reason "Need better JSON support and complex queries"
```

### Example 3: Generate ADR Graph

```bash
/skill adr-generator graph \
  --directory ./docs/decisions \
  --format mermaid \
  --output ./docs/decisions/graph.md
```

### Example 4: Search and Filter ADRs

```bash
/skill adr-generator search \
  --query "database" \
  --status accepted \
  --tag "infrastructure"
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADR_DIR` | Default ADR directory | `./docs/decisions` |
| `ADR_TEMPLATE` | Default template | `madr` |
| `ADR_PREFIX` | Number prefix format | `0000` |

### Skill Configuration

```yaml
# .babysitter/skills/adr-generator.yaml
adr-generator:
  directory: ./docs/decisions
  template: madr
  numbering:
    prefix: ""
    padding: 4
    separator: "-"
  frontmatter:
    enabled: true
    fields: [status, date, decision-makers]
  validation:
    requireContext: true
    requireConsequences: true
    minimumOptions: 2
```

### Custom Template

```yaml
# .babysitter/templates/custom-adr.yaml
name: custom-adr
sections:
  - name: title
    required: true
    format: "# {title}"
  - name: metadata
    required: true
    fields: [status, date, owner]
  - name: context
    required: true
    heading: "## Context"
  - name: decision
    required: true
    heading: "## Decision"
  - name: rationale
    required: false
    heading: "## Rationale"
  - name: consequences
    required: true
    heading: "## Consequences"
    subsections: [positive, negative, risks]
  - name: references
    required: false
    heading: "## References"
```

## Process Integration

### Processes Using This Skill

| Process | Role |
|---------|------|
| `adr-documentation.js` | Primary ADR workflow |
| `system-design-review.js` | Decision capture |
| `tech-stack-evaluation.js` | Technology decisions |
| `migration-strategy.js` | Migration decisions |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const createAdrTask = defineTask({
  name: 'create-adr',
  description: 'Create Architecture Decision Record',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Create ADR: ${inputs.title}`,
      skill: {
        name: 'adr-generator',
        context: {
          operation: 'create',
          title: inputs.title,
          template: inputs.template || 'madr',
          context: inputs.context,
          decision: inputs.decision,
          drivers: inputs.drivers,
          options: inputs.options,
          chosenOption: inputs.chosen,
          consequences: inputs.consequences,
          relatedAdrs: inputs.related,
          directory: inputs.directory || './docs/decisions'
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

## Template Reference

### Nygard Format (Classic)

```markdown
# {Number}. {Title}

Date: {Date}

## Status

{Status}

## Context

{Context description}

## Decision

{Decision statement}

## Consequences

{Consequences list}
```

### MADR Format (Detailed)

```markdown
---
status: {status}
date: {date}
decision-makers: [{names}]
---

# {Title}

## Context and Problem Statement

{Problem description}

## Decision Drivers

* {Driver 1}
* {Driver 2}

## Considered Options

* {Option 1}
* {Option 2}

## Decision Outcome

Chosen option: "{Option}", because {rationale}.

### Consequences

* Good, because {positive consequence}
* Bad, because {negative consequence}

## Pros and Cons of the Options

### {Option 1}

* Good, because {pro}
* Bad, because {con}
```

### Y-Statement Format (Concise)

```markdown
In the context of {context},
facing {concern},
we decided for {option}
and against {rejected options},
to achieve {quality goals},
accepting {tradeoff}.
```

## ADR Lifecycle

| Status | Description | Allowed Transitions |
|--------|-------------|---------------------|
| `proposed` | Under discussion | `accepted`, `rejected` |
| `accepted` | Approved and active | `deprecated`, `superseded` |
| `deprecated` | No longer recommended | - |
| `superseded` | Replaced by another ADR | - |
| `rejected` | Not approved | - |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Duplicate number` | Regenerate index, fix numbering |
| `Invalid status` | Use allowed status values |
| `Missing fields` | Complete required template fields |
| `Broken links` | Update or remove dead references |

### Debug Mode

```bash
DEBUG=adr-generator /skill adr-generator create \
  --title "Test ADR" \
  --verbose
```

## Related Skills

- **markdown-processor** - Markdown rendering
- **tech-writing-linter** - Documentation quality
- **docs-site-generator** - Documentation publishing

## References

- [ADR GitHub Organization](https://adr.github.io/)
- [MADR Template](https://adr.github.io/madr/)
- [Nygard Article](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [adr-tools](https://github.com/npryce/adr-tools)
- [log4brains](https://github.com/thomvaill/log4brains)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SA-003
**Category:** Documentation
**Status:** Active
