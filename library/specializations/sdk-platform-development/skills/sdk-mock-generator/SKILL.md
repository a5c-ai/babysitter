---
name: sdk-mock-generator
description: Generate mock servers and clients for SDK testing
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# SDK Mock Generator Skill

## Overview

This skill generates mock servers and clients for SDK testing, enabling developers to test integrations without hitting production APIs.

## Capabilities

- Generate mock servers from OpenAPI specifications
- Create SDK test fixtures with realistic data
- Implement response stubbing for various scenarios
- Support stateful mocking for complex workflows
- Generate error response mocks
- Configure latency simulation
- Support request recording and playback
- Create mock data factories

## Target Processes

- SDK Testing Strategy
- Developer Experience Optimization
- API Documentation System

## Integration Points

- Prism (OpenAPI mock server)
- WireMock (HTTP mock server)
- MSW (Mock Service Worker for browsers)
- Nock (Node.js HTTP mocking)
- VCR-style recording libraries

## Input Requirements

- OpenAPI specification
- Test scenario requirements
- Stateful behavior definitions
- Error scenarios to mock
- Performance simulation needs

## Output Artifacts

- Mock server implementation
- Test fixture data
- Response stub configurations
- Stateful scenario handlers
- Mock data factories
- Recording/playback setup

## Usage Example

```yaml
skill:
  name: sdk-mock-generator
  context:
    apiSpec: ./openapi.yaml
    mockTool: prism
    features:
      - responseStubbing
      - statefulMocking
      - errorSimulation
      - latencySimulation
    scenarios:
      - name: happyPath
        responses: ./fixtures/happy-path/
      - name: errorCases
        responses: ./fixtures/errors/
    recordMode: true
```

## Best Practices

1. Generate mocks from the same spec as production
2. Include realistic data in fixtures
3. Mock all error scenarios
4. Support stateful testing flows
5. Enable request recording for debugging
6. Simulate realistic latencies
