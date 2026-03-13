---
name: middleware-chain-designer
description: Design middleware and interceptor chains for SDK extensibility
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Middleware Chain Designer Skill

## Overview

This skill designs middleware and interceptor chain architectures that enable SDK extensibility through pluggable request/response processing.

## Capabilities

- Design middleware interfaces and contracts
- Implement interceptor chains with ordering
- Support before/after hooks for requests
- Enable custom transport implementations
- Implement retry and circuit breaker middleware
- Design logging and tracing interceptors
- Support middleware composition
- Configure middleware priority ordering

## Target Processes

- Plugin and Extension Architecture
- Custom Transport and Middleware
- SDK Architecture Design

## Integration Points

- SDK core HTTP clients
- Authentication handlers
- Logging frameworks
- Retry libraries
- Custom transports

## Input Requirements

- Extensibility requirements
- Middleware ordering needs
- Hook types required
- Composition patterns
- Transport abstraction needs

## Output Artifacts

- Middleware interface definitions
- Interceptor chain implementation
- Built-in middleware (logging, retry)
- Transport abstraction layer
- Middleware composition utilities
- Documentation and examples

## Usage Example

```yaml
skill:
  name: middleware-chain-designer
  context:
    middlewareTypes:
      - request
      - response
      - error
    hooks:
      beforeRequest: true
      afterResponse: true
      onError: true
    builtInMiddleware:
      - logging
      - retry
      - timeout
      - compression
    ordering:
      priority: true
      named: true
    transports:
      - http
      - websocket
      - custom
```

## Best Practices

1. Define clear middleware interfaces
2. Support ordered execution
3. Enable middleware composition
4. Provide built-in common middleware
5. Allow transport customization
6. Document middleware authoring
