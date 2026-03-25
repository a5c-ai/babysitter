# C4 Diagram Generator Skill

## Overview

The `c4-diagram-generator` skill provides specialized capabilities for generating C4 model architecture diagrams following Simon Brown's methodology. It supports multiple DSL formats and all four abstraction levels.

## Quick Start

### Prerequisites

1. **Node.js** (v18+) - For Structurizr CLI and Mermaid CLI
2. **Java Runtime** - For PlantUML rendering (optional)
3. **Optional Tools** - Structurizr CLI, mmdc (Mermaid CLI), Kroki

### Installation

The skill is included in the babysitter-sdk. For enhanced capabilities:

```bash
# Install Structurizr CLI
npm install -g @structurizr/cli

# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Install PlantUML (macOS)
brew install plantuml
```

## Usage

### Basic Operations

```bash
# Generate a context diagram
/skill c4-diagram-generator context \
  --system "Payment System" \
  --output ./docs/diagrams

# Generate a container diagram
/skill c4-diagram-generator container \
  --workspace ./architecture/workspace.dsl \
  --format svg

# Generate from existing codebase
/skill c4-diagram-generator analyze \
  --source ./src \
  --level container
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(c4DiagramTask, {
  level: 'container',
  workspace: './architecture/workspace.dsl',
  outputFormat: 'svg',
  outputDir: './docs/diagrams'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Multi-DSL Support** | Structurizr, PlantUML, Mermaid |
| **Four Levels** | Context, Container, Component, Code |
| **Multiple Formats** | SVG, PNG, PDF export |
| **Auto-layout** | Automatic diagram layout |
| **Doc Integration** | Embed in Docusaurus, MkDocs |

## Examples

### Example 1: E-commerce System Context

```bash
/skill c4-diagram-generator context \
  --system "E-commerce Platform" \
  --people "Customer,Admin,Support" \
  --external "Payment Gateway,Shipping Provider,Email Service" \
  --output ./docs/architecture
```

### Example 2: Generate from Structurizr DSL

```bash
/skill c4-diagram-generator render \
  --workspace ./workspace.dsl \
  --views "SystemContext,Containers" \
  --format "svg,png"
```

### Example 3: Mermaid Diagram Generation

```bash
/skill c4-diagram-generator mermaid \
  --level container \
  --system "API Gateway" \
  --output ./docs/diagrams/api-gateway.mmd
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STRUCTURIZR_CLI_PATH` | Path to Structurizr CLI | `structurizr-cli` |
| `PLANTUML_JAR` | Path to PlantUML JAR | `plantuml.jar` |
| `KROKI_URL` | Kroki service URL | `https://kroki.io` |

### Skill Configuration

```yaml
# .babysitter/skills/c4-diagram-generator.yaml
c4-diagram-generator:
  defaultFormat: structurizr
  outputFormats: [svg, png]
  defaultOutputDir: ./docs/diagrams
  styling:
    theme: default
    layout: auto
  rendering:
    engine: local  # local | kroki
    timeout: 30000
```

## Process Integration

### Processes Using This Skill

| Process | Role |
|---------|------|
| `c4-model-documentation.js` | Primary diagram generation |
| `system-design-review.js` | Architecture visualization |
| `microservices-decomposition.js` | Service boundary diagrams |
| `cloud-architecture-design.js` | Infrastructure visualization |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const generateC4DiagramTask = defineTask({
  name: 'generate-c4-diagram',
  description: 'Generate C4 model diagram at specified level',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Generate C4 ${inputs.level} Diagram`,
      skill: {
        name: 'c4-diagram-generator',
        context: {
          level: inputs.level,
          workspace: inputs.workspace,
          outputFormat: inputs.format || 'svg',
          outputDir: inputs.outputDir,
          views: inputs.views
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

### UML-MCP Server

Comprehensive UML diagram generation supporting PlantUML, Mermaid, Kroki, and D2.

**Features:**
- Class, sequence, activity diagrams
- C4 diagram support
- Multiple output formats

**GitHub:** https://github.com/antoinebou12/uml-mcp

### Mermaid MCP Server

Native Mermaid diagram generation with 50+ pre-built templates.

**Features:**
- Flowcharts, sequence diagrams
- C4 diagram syntax support
- Real-time preview

**Source:** https://mcpservers.org/servers/narasimhaponnada/mermaid-mcp.git

### Structurizr Tools

**Structurizr DSL:**
- Official C4 model tooling
- Workspace as code
- Multiple export formats

**Documentation:** https://structurizr.com/

## C4 Model Reference

### Abstraction Levels

| Level | Purpose | Audience |
|-------|---------|----------|
| **Context** | Big picture, scope | Everyone |
| **Container** | High-level technology | Technical staff |
| **Component** | Container internals | Developers |
| **Code** | Implementation details | Developers |

### Element Types

| Element | Level | Description |
|---------|-------|-------------|
| Person | Context | User of the system |
| Software System | Context | The system being modeled |
| External System | Context | Systems outside scope |
| Container | Container | Deployable unit |
| Component | Component | Module within container |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Structurizr CLI not found` | Install globally or set path |
| `Diagram too complex` | Split into multiple diagrams |
| `Rendering timeout` | Use local renderer or increase timeout |
| `Invalid syntax` | Validate with CLI before rendering |

### Debug Mode

```bash
DEBUG=c4-diagram-generator /skill c4-diagram-generator context \
  --system "My System" \
  --verbose
```

## Related Skills

- **plantuml-renderer** - PlantUML-specific rendering
- **mermaid-renderer** - Mermaid-specific rendering
- **graphviz-renderer** - DOT graph rendering

## References

- [C4 Model](https://c4model.com/)
- [Structurizr](https://structurizr.com/)
- [C4-PlantUML](https://github.com/plantuml-stdlib/C4-PlantUML)
- [Mermaid C4 Diagrams](https://mermaid.js.org/syntax/c4.html)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-SA-001
**Category:** Visualization
**Status:** Active
