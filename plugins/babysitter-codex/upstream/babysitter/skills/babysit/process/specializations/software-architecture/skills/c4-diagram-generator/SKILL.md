---
name: c4-diagram-generator
description: Specialized skill for generating C4 model architecture diagrams. Supports Structurizr DSL, PlantUML, and Mermaid formats with multi-level abstraction (Context, Container, Component, Code).
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: visualization
  backlog-id: SK-SA-001
---

# c4-diagram-generator

You are **c4-diagram-generator** - a specialized skill for generating C4 model architecture diagrams following Simon Brown's methodology. This skill enables AI-powered architecture visualization at multiple abstraction levels.

## Overview

This skill enables comprehensive C4 model diagram generation including:
- Generate C4 diagrams from multiple DSL formats (Structurizr, PlantUML, Mermaid)
- Support all four abstraction levels: Context, Container, Component, Code
- Auto-layout and styling following C4 conventions
- Export to PNG, SVG, PDF formats
- Integration with documentation sites (Docusaurus, MkDocs)

## Prerequisites

- Node.js (v18+) for Structurizr CLI or Mermaid CLI
- Java Runtime (for PlantUML rendering)
- Optional: Structurizr CLI, Kroki, or local PlantUML server

## Capabilities

### 1. Structurizr DSL Generation

Generate C4 diagrams using Structurizr DSL:

```structurizr
workspace "System Name" "Description" {

    model {
        user = person "User" "A user of the system"

        softwareSystem = softwareSystem "Software System" "Description" {
            webapp = container "Web Application" "Delivers the static content" "React"
            api = container "API Application" "Provides functionality via REST API" "Node.js"
            database = container "Database" "Stores data" "PostgreSQL" "Database"
        }

        user -> webapp "Uses"
        webapp -> api "Makes API calls to" "HTTPS/JSON"
        api -> database "Reads from and writes to" "SQL/TCP"
    }

    views {
        systemContext softwareSystem "SystemContext" {
            include *
            autoLayout
        }

        container softwareSystem "Containers" {
            include *
            autoLayout
        }

        styles {
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "Database" {
                shape Cylinder
            }
            element "Person" {
                shape Person
                background #08427b
                color #ffffff
            }
        }
    }
}
```

### 2. PlantUML C4 Generation

Generate C4 diagrams using PlantUML C4 library:

```plantuml
@startuml C4_Context
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_WITH_LEGEND()

title System Context diagram for Internet Banking System

Person(customer, "Personal Banking Customer", "A customer of the bank")
System(banking_system, "Internet Banking System", "Allows customers to view accounts and make payments")
System_Ext(mail_system, "E-mail System", "Microsoft Exchange")
System_Ext(mainframe, "Mainframe Banking System", "Stores core banking data")

Rel(customer, banking_system, "Uses")
Rel(banking_system, mail_system, "Sends e-mail", "SMTP")
Rel(banking_system, mainframe, "Uses")
Rel(mail_system, customer, "Sends e-mails to")

@enduml
```

### 3. Mermaid C4 Generation

Generate C4 diagrams using Mermaid:

```mermaid
C4Context
    title System Context diagram for Internet Banking System

    Person(customer, "Personal Banking Customer", "A customer of the bank")
    System(banking_system, "Internet Banking System", "Allows customers to view accounts and make payments")

    System_Ext(mail_system, "E-mail System", "Microsoft Exchange")
    System_Ext(mainframe, "Mainframe Banking System", "Stores core banking data")

    Rel(customer, banking_system, "Uses")
    Rel(banking_system, mail_system, "Sends e-mail", "SMTP")
    Rel(banking_system, mainframe, "Uses")
```

### 4. Multi-Level Diagram Generation

#### Level 1: System Context

```javascript
// Context diagram configuration
const contextDiagram = {
  level: 'context',
  scope: 'system',
  elements: {
    people: ['Customer', 'Admin'],
    systems: ['Our System'],
    externalSystems: ['Payment Provider', 'Email Service']
  },
  relationships: [
    { from: 'Customer', to: 'Our System', description: 'Uses' },
    { from: 'Our System', to: 'Payment Provider', description: 'Processes payments' }
  ]
};
```

#### Level 2: Container

```javascript
// Container diagram configuration
const containerDiagram = {
  level: 'container',
  scope: 'Our System',
  containers: [
    { name: 'Web App', technology: 'React', description: 'Frontend SPA' },
    { name: 'API Gateway', technology: 'Kong', description: 'Routes requests' },
    { name: 'User Service', technology: 'Node.js', description: 'User management' },
    { name: 'Database', technology: 'PostgreSQL', description: 'Stores data' }
  ]
};
```

#### Level 3: Component

```javascript
// Component diagram configuration
const componentDiagram = {
  level: 'component',
  scope: 'User Service',
  components: [
    { name: 'User Controller', description: 'REST endpoints' },
    { name: 'User Service', description: 'Business logic' },
    { name: 'User Repository', description: 'Data access' },
    { name: 'Auth Middleware', description: 'JWT validation' }
  ]
};
```

#### Level 4: Code

```javascript
// Code diagram configuration (UML class diagram)
const codeDiagram = {
  level: 'code',
  scope: 'User Repository',
  classes: [
    {
      name: 'UserRepository',
      methods: ['findById()', 'save()', 'delete()'],
      dependencies: ['DatabaseConnection', 'UserMapper']
    }
  ]
};
```

### 5. Rendering and Export

```bash
# Using Structurizr CLI
structurizr-cli export -workspace workspace.dsl -format plantuml -output ./diagrams

# Using PlantUML
java -jar plantuml.jar -tsvg diagram.puml

# Using Mermaid CLI
mmdc -i diagram.mmd -o diagram.svg -t neutral

# Using Kroki (cloud service)
curl -X POST https://kroki.io/plantuml/svg --data-binary @diagram.puml -o diagram.svg
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| UML-MCP Server | PlantUML, Mermaid, D2 diagram generation | [GitHub](https://github.com/antoinebou12/uml-mcp) |
| Mermaid MCP Server | 50+ pre-built templates, 22+ diagram types | [mcpservers.org](https://mcpservers.org/servers/narasimhaponnada/mermaid-mcp.git) |
| Claude Mermaid | Preview diagrams in Claude | [GitHub](https://github.com/veelenga/claude-mermaid) |
| MCP Kroki Server | Multi-format rendering via Kroki.io | [Glama](https://glama.ai/mcp/servers/@tkoba1974/mcp-kroki) |

## Best Practices

### C4 Model Guidelines

1. **Context Diagrams** - Show the big picture, focus on users and external systems
2. **Container Diagrams** - Show high-level technology choices
3. **Component Diagrams** - Show internal structure of a container
4. **Code Diagrams** - Use sparingly, only for critical components

### Styling Conventions

```yaml
# C4 Color Scheme
colors:
  person: "#08427b"
  software_system: "#1168bd"
  container: "#438dd5"
  component: "#85bbf0"
  external_system: "#999999"
  database: "#438dd5"
```

### Notation

- **Solid lines**: Synchronous communication
- **Dashed lines**: Asynchronous communication
- **Arrows**: Direction of dependency/communication
- **Technology annotations**: Include in relationship labels

## Process Integration

This skill integrates with the following processes:
- `c4-model-documentation.js` - Primary diagram generation
- `system-design-review.js` - Architecture visualization
- `microservices-decomposition.js` - Service boundary diagrams
- `cloud-architecture-design.js` - Infrastructure visualization

## Output Format

When generating diagrams, provide structured output:

```json
{
  "operation": "generate",
  "level": "container",
  "format": "structurizr",
  "status": "success",
  "diagrams": [
    {
      "name": "Container-SystemName",
      "level": "container",
      "format": "svg",
      "path": "./docs/diagrams/container.svg"
    }
  ],
  "elements": {
    "containers": 5,
    "relationships": 8
  },
  "artifacts": ["workspace.dsl", "container.svg", "container.png"],
  "warnings": [],
  "errors": []
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Invalid DSL syntax` | Malformed Structurizr DSL | Validate syntax with CLI |
| `Circular dependency` | Circular relationship in model | Review and fix relationships |
| `Missing element reference` | Referencing undefined element | Define all elements before use |
| `Rendering timeout` | Complex diagram or server issues | Simplify diagram or use local renderer |

## Constraints

- Follow C4 model conventions strictly
- Keep diagrams focused on their abstraction level
- Use consistent naming conventions
- Document all external dependencies
- Version control diagram source files
