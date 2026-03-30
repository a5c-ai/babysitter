# AsyncAPI Documentation Skill

Generate comprehensive documentation for event-driven APIs using the AsyncAPI specification with support for Kafka, MQTT, WebSocket, AMQP, and other messaging protocols.

## Overview

This skill provides expertise in AsyncAPI specification handling for documenting message-based and event-driven architectures. It supports validation, documentation generation, code generation, and linting for AsyncAPI 2.x and 3.x specifications.

## When to Use

- Documenting event-driven microservices
- Creating Kafka/MQTT/WebSocket API documentation
- Generating message schemas and types
- Setting up async API documentation pipelines
- Validating event-driven API contracts

## Quick Start

### Basic Documentation

```json
{
  "specPath": "./asyncapi.yaml",
  "generator": "html",
  "validate": true
}
```

### With Code Generation

```json
{
  "specPath": "./asyncapi.yaml",
  "outputDir": "docs/async",
  "generateCode": true,
  "codeLanguage": "typescript"
}
```

## AsyncAPI Specification Example

### Minimal Specification

```yaml
asyncapi: 3.0.0
info:
  title: User Events API
  version: 1.0.0
  description: Event-driven API for user management

servers:
  production:
    host: kafka.example.com:9092
    protocol: kafka

channels:
  userCreated:
    address: user.events.created
    messages:
      UserCreated:
        payload:
          type: object
          properties:
            userId:
              type: string
            email:
              type: string
              format: email

operations:
  onUserCreated:
    action: receive
    channel:
      $ref: '#/channels/userCreated'
```

### Full Specification with Bindings

```yaml
asyncapi: 3.0.0
info:
  title: Order Events API
  version: 2.0.0
  description: |
    Event-driven API for order processing.

    ## Events
    - OrderCreated - New order placed
    - OrderShipped - Order has shipped
    - OrderDelivered - Order delivered
  contact:
    name: Platform Team
    email: platform@example.com

servers:
  production:
    host: kafka.example.com:9092
    protocol: kafka
    security:
      - $ref: '#/components/securitySchemes/sasl'

channels:
  orderCreated:
    address: orders.created.v2
    description: |
      Published when a new order is placed.

      **Partitioning**: By orderId
      **Retention**: 7 days
    messages:
      OrderCreated:
        $ref: '#/components/messages/OrderCreated'
    bindings:
      kafka:
        partitions: 12
        replicas: 3

components:
  messages:
    OrderCreated:
      name: OrderCreated
      title: Order Created Event
      summary: Published when order is created
      contentType: application/json
      payload:
        $ref: '#/components/schemas/OrderCreatedPayload'
      examples:
        - name: StandardOrder
          payload:
            orderId: "ord_123"
            customerId: "cust_456"
            total: 9999
            createdAt: "2026-01-24T10:00:00Z"

  schemas:
    OrderCreatedPayload:
      type: object
      required:
        - orderId
        - customerId
        - total
      properties:
        orderId:
          type: string
          pattern: "^ord_[a-zA-Z0-9]+$"
        customerId:
          type: string
        total:
          type: integer
          minimum: 0
          description: Total in cents
        createdAt:
          type: string
          format: date-time

  securitySchemes:
    sasl:
      type: scramSha256
      description: SASL authentication
```

## CLI Commands

### Validation

```bash
# Validate spec
asyncapi validate asyncapi.yaml

# Validate with diagnostics
asyncapi validate asyncapi.yaml --diagnostics-format stylish
```

### Generate Documentation

```bash
# HTML documentation
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/html-template -o docs

# Markdown documentation
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/markdown-template -o docs

# Custom parameters
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/html-template \
  -o docs \
  -p singleFile=true \
  -p sidebarOrganization=byTags
```

### Generate Code

```bash
# TypeScript types
asyncapi generate models asyncapi.yaml typescript -o src/types

# Java models
asyncapi generate models asyncapi.yaml java -o src/main/java

# With options
asyncapi generate models asyncapi.yaml typescript \
  --output src/types \
  --tsModelType interface \
  --tsEnumType enum
```

## Protocol-Specific Bindings

### Kafka

```yaml
channels:
  events:
    bindings:
      kafka:
        topic: my-topic
        partitions: 6
        replicas: 3
        topicConfiguration:
          retention.ms: 604800000
          cleanup.policy:
            - compact

operations:
  publish:
    bindings:
      kafka:
        groupId: my-consumer-group
        clientId: my-client
```

### MQTT

```yaml
channels:
  sensors:
    address: sensors/{sensorId}/readings
    bindings:
      mqtt:
        qos: 1
        retain: false
```

### WebSocket

```yaml
servers:
  ws:
    host: ws.example.com
    protocol: wss

channels:
  notifications:
    bindings:
      ws:
        query:
          type: object
          properties:
            token:
              type: string
```

## Linting Configuration

### .spectral.yaml

```yaml
extends:
  - "@asyncapi/spectral-ruleset"

rules:
  asyncapi-info-description: error
  asyncapi-channel-description: warn
  asyncapi-operation-description: warn
  asyncapi-message-examples: warn
```

### Running Spectral

```bash
# Lint specification
spectral lint asyncapi.yaml

# With custom ruleset
spectral lint asyncapi.yaml --ruleset .spectral.yaml
```

## Generated Output

```
docs/
├── index.html              # Documentation home
├── servers.html            # Server documentation
├── channels/
│   ├── userCreated.html    # Channel details
│   └── orderShipped.html
├── messages/
│   ├── UserCreated.html    # Message schema
│   └── OrderShipped.html
├── schemas/                # Schema documentation
└── asyncapi.json           # Bundled spec
```

## Process Integration

| Process | Usage |
|---------|-------|
| `api-doc-generation.js` | AsyncAPI documentation generation |
| `api-reference-docs.js` | API reference with examples |
| `data-model-docs.js` | Schema documentation |
| `docs-as-code-pipeline.js` | CI/CD integration |

## CI/CD Integration

### GitHub Actions

```yaml
name: AsyncAPI Docs

on:
  push:
    paths:
      - 'asyncapi.yaml'

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate AsyncAPI
        uses: asyncapi/github-action-for-cli@v3
        with:
          command: validate
          filepath: asyncapi.yaml

      - name: Generate documentation
        uses: asyncapi/github-action-for-cli@v3
        with:
          command: generate
          template: '@asyncapi/html-template'
          filepath: asyncapi.yaml
          output: docs

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

## Installation

```bash
# Install AsyncAPI CLI
npm install -g @asyncapi/cli

# Install templates
npm install -g @asyncapi/html-template @asyncapi/markdown-template

# Install Spectral
npm install -g @stoplight/spectral-cli @asyncapi/spectral-ruleset
```

## Best Practices

1. **Version your APIs** - Use semantic versioning in spec info
2. **Document channels** - Include descriptions and use cases
3. **Provide examples** - Add message examples for consumers
4. **Specify bindings** - Document protocol-specific details
5. **Include consumer guidelines** - Document SLAs and expectations
6. **Use traits** - Extract common patterns to traits
7. **Lint specifications** - Use Spectral for consistency

## References

- [AsyncAPI Specification](https://www.asyncapi.com/docs/reference/specification/v3.0.0)
- [AsyncAPI CLI](https://www.asyncapi.com/tools/cli)
- [AsyncAPI Generator](https://www.asyncapi.com/tools/generator)
- [AsyncAPI Modelina](https://www.asyncapi.com/tools/modelina)
- [Spectral](https://stoplight.io/open-source/spectral)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-016
**Category:** API Documentation
**Status:** Active
