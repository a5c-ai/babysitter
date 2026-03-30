---
name: go-sdk-specialist
description: Go SDK development with idiomatic patterns
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Go SDK Specialist Skill

## Overview

This skill specializes in developing idiomatic Go SDKs with proper module versioning, context-based cancellation, and Go-style error handling patterns.

## Capabilities

- Design Go SDK architecture with proper module structure
- Implement context-based cancellation and timeouts
- Apply Go error handling patterns with wrapped errors
- Configure go.mod versioning following semver
- Design functional options pattern for configuration
- Implement interface-based design for testability
- Configure proper logging with structured output
- Support concurrent operations safely

## Target Processes

- Multi-Language SDK Strategy
- SDK Architecture Design
- SDK Testing Strategy

## Integration Points

- Go modules (go.mod)
- go test with testify
- golangci-lint for code quality
- pkg.go.dev for documentation
- goreleaser for releases

## Input Requirements

- API specification
- Module path (e.g., github.com/org/sdk)
- Minimum Go version
- Concurrency requirements
- Error handling preferences

## Output Artifacts

- Go module source code
- go.mod and go.sum files
- Test files (*_test.go)
- Examples in examples/ directory
- README with installation instructions
- GoDoc-compatible documentation

## Usage Example

```yaml
skill:
  name: go-sdk-specialist
  context:
    apiSpec: ./openapi.yaml
    modulePath: github.com/myorg/sdk-go
    goVersion: "1.21"
    useGenerics: true
    errorWrapping: true
    functionalOptions: true
```

## Best Practices

1. Use functional options for configuration
2. Accept interfaces, return structs
3. Make zero values useful
4. Handle errors explicitly with wrapping
5. Use context.Context for cancellation
6. Keep packages focused and small
