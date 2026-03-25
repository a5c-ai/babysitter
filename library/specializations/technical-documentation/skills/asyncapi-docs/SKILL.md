---
name: asyncapi-docs
description: AsyncAPI specification handling for event-driven API documentation. Parse, validate, and generate documentation for message-based APIs including Kafka, MQTT, WebSocket, and AMQP systems.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-016
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# AsyncAPI Documentation Skill

Generate and validate documentation for event-driven APIs using the AsyncAPI specification with support for multiple messaging protocols.

## Capabilities

- Parse and validate AsyncAPI 2.x and 3.x specifications
- Generate documentation from AsyncAPI specs
- Document event/message schemas
- Channel and operation documentation
- Protocol-specific binding documentation (Kafka, MQTT, WebSocket, AMQP)
- Code generator integration
- Spectral linting for AsyncAPI
- Schema validation and type generation

## Usage

Invoke this skill when you need to:
- Document event-driven microservices
- Create message broker API documentation
- Generate client code from async specifications
- Validate AsyncAPI specifications
- Create interactive documentation sites

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| specPath | string | Yes | Path to AsyncAPI specification |
| outputDir | string | No | Documentation output directory |
| generator | string | No | html, markdown, react (default: html) |
| validate | boolean | No | Run spec validation (default: true) |
| lint | boolean | No | Run Spectral linting (default: true) |
| generateCode | boolean | No | Generate client/server stubs |
| codeLanguage | string | No | Code generation target language |

### Input Example

```json
{
  "specPath": "./asyncapi.yaml",
  "outputDir": "docs/async",
  "generator": "html",
  "validate": true,
  "lint": true,
  "generateCode": true,
  "codeLanguage": "typescript"
}
```

## Output Structure

```
docs/async/
├── index.html              # Main documentation page
├── servers.html            # Server/broker documentation
├── channels/
│   ├── user-events.html    # Channel documentation
│   └── order-events.html
├── messages/
│   ├── UserCreated.html    # Message documentation
│   └── OrderPlaced.html
├── schemas/
│   ├── User.html           # Schema documentation
│   └── Order.html
├── bindings/               # Protocol bindings
│   └── kafka.html
├── search.json             # Search index
└── asyncapi.json           # Bundled spec
```

## AsyncAPI Specification Patterns

### Basic AsyncAPI 3.0 Document

```yaml
asyncapi: 3.0.0
info:
  title: User Events API
  version: 1.0.0
  description: |
    Event-driven API for user management operations.

    ## Overview
    This API publishes events when user data changes.
    Consumers can subscribe to specific channels to receive
    real-time updates.

    ## Authentication
    All connections require a valid API key passed in the
    connection headers.
  contact:
    name: API Team
    email: api-team@example.com
  license:
    name: Apache 2.0
    url: https://www.apache.org/licenses/LICENSE-2.0

servers:
  production:
    host: kafka.example.com:9092
    protocol: kafka
    description: Production Kafka cluster
    security:
      - $ref: '#/components/securitySchemes/sasl'
    tags:
      - name: production
        description: Production environment

  staging:
    host: kafka-staging.example.com:9092
    protocol: kafka
    description: Staging environment

channels:
  userCreated:
    address: user.events.created
    messages:
      UserCreatedMessage:
        $ref: '#/components/messages/UserCreated'
    description: |
      Published when a new user account is created.

      **Trigger**: User registration completion
      **Frequency**: ~1000 events/day

  userUpdated:
    address: user.events.updated
    messages:
      UserUpdatedMessage:
        $ref: '#/components/messages/UserUpdated'

operations:
  publishUserCreated:
    action: send
    channel:
      $ref: '#/channels/userCreated'
    summary: Publish user created event
    description: |
      Publishes an event when a new user is created.
      Events are partitioned by user ID.
    tags:
      - name: users
    bindings:
      kafka:
        groupId: user-service
        clientId: user-publisher

  subscribeUserCreated:
    action: receive
    channel:
      $ref: '#/channels/userCreated'
    summary: Subscribe to user created events
    description: |
      Subscribe to receive notifications when new users
      are created. Ideal for:
      - Welcome email services
      - Analytics tracking
      - Audit logging

components:
  messages:
    UserCreated:
      name: UserCreated
      title: User Created Event
      summary: Event published when a user is created
      contentType: application/json
      traits:
        - $ref: '#/components/messageTraits/commonHeaders'
      payload:
        $ref: '#/components/schemas/UserCreatedPayload'
      examples:
        - name: NewUser
          summary: Standard user creation
          payload:
            userId: "usr_123456"
            email: "john@example.com"
            createdAt: "2026-01-24T10:30:00Z"
            source: "web-signup"

    UserUpdated:
      name: UserUpdated
      title: User Updated Event
      summary: Event published when user data changes
      contentType: application/json
      payload:
        $ref: '#/components/schemas/UserUpdatedPayload'

  schemas:
    UserCreatedPayload:
      type: object
      description: Payload for user created events
      required:
        - userId
        - email
        - createdAt
      properties:
        userId:
          type: string
          description: Unique user identifier
          pattern: "^usr_[a-zA-Z0-9]+$"
          examples:
            - "usr_123456"
        email:
          type: string
          format: email
          description: User's email address
        createdAt:
          type: string
          format: date-time
          description: Timestamp of user creation
        source:
          type: string
          enum:
            - web-signup
            - mobile-app
            - admin-portal
            - api
          description: Registration source

    UserUpdatedPayload:
      type: object
      required:
        - userId
        - updatedAt
        - changes
      properties:
        userId:
          type: string
          description: Unique user identifier
        updatedAt:
          type: string
          format: date-time
        changes:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              oldValue:
                type: string
              newValue:
                type: string

  messageTraits:
    commonHeaders:
      headers:
        type: object
        properties:
          correlationId:
            type: string
            description: Correlation ID for distributed tracing
            format: uuid
          timestamp:
            type: string
            format: date-time
            description: Event timestamp
          version:
            type: string
            description: Schema version

  securitySchemes:
    sasl:
      type: scramSha256
      description: SASL/SCRAM-SHA-256 authentication
```

### Kafka-Specific Bindings

```yaml
channels:
  orderEvents:
    address: orders.events
    bindings:
      kafka:
        topic: orders.events.v1
        partitions: 12
        replicas: 3
        topicConfiguration:
          cleanup.policy:
            - delete
          retention.ms: 604800000  # 7 days
          segment.bytes: 1073741824
    messages:
      OrderCreated:
        bindings:
          kafka:
            key:
              type: string
              description: Order ID used as partition key
            schemaIdLocation: header
            schemaIdPayloadEncoding: confluent
```

### WebSocket Channel

```yaml
asyncapi: 3.0.0
info:
  title: Real-time Notifications API
  version: 1.0.0

servers:
  production:
    host: ws.example.com
    protocol: wss
    description: WebSocket server for real-time notifications

channels:
  notifications:
    address: /notifications/{userId}
    parameters:
      userId:
        description: The user ID to receive notifications for
    messages:
      Notification:
        $ref: '#/components/messages/Notification'
    bindings:
      ws:
        query:
          type: object
          properties:
            token:
              type: string
              description: Authentication token
          required:
            - token
```

### MQTT Channel

```yaml
asyncapi: 3.0.0
info:
  title: IoT Sensor API
  version: 1.0.0

servers:
  production:
    host: mqtt.example.com:8883
    protocol: mqtts
    description: MQTT broker for IoT devices

channels:
  sensorReadings:
    address: sensors/{sensorId}/readings
    parameters:
      sensorId:
        description: Unique sensor identifier
    messages:
      SensorReading:
        $ref: '#/components/messages/SensorReading'
    bindings:
      mqtt:
        qos: 1
        retain: false
        bindingVersion: '0.2.0'
```

## AsyncAPI CLI Commands

### Validation

```bash
# Validate specification
asyncapi validate asyncapi.yaml

# Validate with custom rules
asyncapi validate asyncapi.yaml --rule-file .spectral.yaml
```

### Documentation Generation

```bash
# Generate HTML documentation
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/html-template -o docs

# Generate Markdown
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/markdown-template -o docs

# Generate React app
asyncapi generate fromTemplate asyncapi.yaml @asyncapi/react-component -o docs
```

### Code Generation

```bash
# TypeScript types
asyncapi generate models asyncapi.yaml typescript -o src/types

# Java models
asyncapi generate models asyncapi.yaml java -o src/main/java

# Python models
asyncapi generate models asyncapi.yaml python -o src/models
```

## Spectral Linting Rules

### .spectral.yaml

```yaml
extends:
  - "@asyncapi/spectral-ruleset"

rules:
  # Require descriptions
  asyncapi-info-description: error
  asyncapi-channel-description: warn
  asyncapi-operation-description: warn

  # Require examples
  asyncapi-message-examples: warn

  # Schema validation
  asyncapi-payload-unsupported-schemaFormat: error
  asyncapi-schema: error

  # Custom rules
  operation-summary-required:
    description: Operations must have summaries
    given: "$.operations[*]"
    then:
      field: summary
      function: truthy
    severity: warn

  message-content-type:
    description: Messages must specify content type
    given: "$.components.messages[*]"
    then:
      field: contentType
      function: truthy
    severity: error
```

## Documentation Best Practices

### Channel Documentation

```yaml
channels:
  paymentCompleted:
    address: payments.completed.v1
    description: |
      ## Payment Completed Events

      Published when a payment is successfully processed.

      ### Use Cases
      - Order fulfillment initiation
      - Customer notification
      - Financial reconciliation

      ### Consumer Guidelines
      - Process events idempotently (use `paymentId` for deduplication)
      - Acknowledge within 30 seconds
      - Implement dead letter queue handling

      ### SLA
      - **Latency**: Events published within 1s of payment completion
      - **Ordering**: Events are ordered by `paymentId` within partition
      - **Retention**: 7 days
```

### Schema Documentation

```yaml
components:
  schemas:
    Payment:
      type: object
      title: Payment
      description: |
        Represents a completed payment transaction.

        ## Versioning
        This schema follows semantic versioning. Breaking changes
        will result in a new major version.

        ## Privacy
        Contains PII - handle according to data protection policies.
      required:
        - paymentId
        - amount
        - currency
      properties:
        paymentId:
          type: string
          format: uuid
          description: Unique payment identifier
          x-field-extra-annotation: "@Id"
        amount:
          type: number
          format: decimal
          description: Payment amount in minor units (cents)
          minimum: 0
          examples:
            - 1999
            - 50000
        currency:
          type: string
          pattern: "^[A-Z]{3}$"
          description: ISO 4217 currency code
          examples:
            - USD
            - EUR
            - GBP
```

## Workflow

1. **Parse specification** - Load and validate AsyncAPI document
2. **Lint specification** - Run Spectral rules
3. **Validate schemas** - Check JSON Schema validity
4. **Generate documentation** - Create HTML/Markdown output
5. **Generate code** - Create typed models (optional)
6. **Bundle specification** - Create bundled output file

## Dependencies

```json
{
  "devDependencies": {
    "@asyncapi/cli": "^1.0.0",
    "@asyncapi/html-template": "^2.0.0",
    "@asyncapi/markdown-template": "^1.0.0",
    "@asyncapi/generator": "^1.0.0",
    "@asyncapi/modelina": "^3.0.0",
    "@stoplight/spectral-cli": "^6.0.0",
    "@asyncapi/spectral-ruleset": "^1.0.0"
  }
}
```

## Best Practices Applied

- Use semantic versioning in spec info
- Document all channels with descriptions
- Include message examples
- Specify content types for messages
- Use traits for common patterns
- Document protocol-specific bindings
- Include consumer guidelines
- Define SLAs in documentation

## References

- AsyncAPI Specification: https://www.asyncapi.com/docs/reference/specification/v3.0.0
- AsyncAPI CLI: https://www.asyncapi.com/tools/cli
- AsyncAPI Generator: https://www.asyncapi.com/tools/generator
- AsyncAPI Modelina: https://www.asyncapi.com/tools/modelina
- Spectral: https://stoplight.io/open-source/spectral

## Target Processes

- api-doc-generation.js
- api-reference-docs.js
- data-model-docs.js
- docs-as-code-pipeline.js
