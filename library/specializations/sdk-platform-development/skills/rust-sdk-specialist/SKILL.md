---
name: rust-sdk-specialist
description: Rust SDK development with zero-cost abstractions
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Rust SDK Specialist Skill

## Overview

This skill specializes in developing high-performance Rust SDKs with zero-cost abstractions, memory safety guarantees, and async support through tokio or async-std.

## Capabilities

- Design Rust SDK architecture with traits and generics
- Implement async with tokio or async-std runtimes
- Configure cargo publishing to crates.io
- Ensure memory safety patterns without runtime overhead
- Design ergonomic APIs with builder patterns
- Implement proper error handling with thiserror/anyhow
- Support feature flags for optional functionality
- Configure no_std support where applicable

## Target Processes

- Multi-Language SDK Strategy
- SDK Architecture Design
- SDK Testing Strategy

## Integration Points

- crates.io package registry
- cargo for building and testing
- tokio async runtime
- reqwest/hyper for HTTP
- serde for serialization
- tracing for observability

## Input Requirements

- API specification
- Async runtime preference (tokio/async-std)
- MSRV (Minimum Supported Rust Version)
- Feature flag requirements
- no_std requirements (if any)

## Output Artifacts

- Rust crate source code
- Cargo.toml configuration
- Integration and unit tests
- Examples directory
- Documentation (rustdoc)
- CI configuration

## Usage Example

```yaml
skill:
  name: rust-sdk-specialist
  context:
    apiSpec: ./openapi.yaml
    msrv: "1.70"
    asyncRuntime: tokio
    httpClient: reqwest
    errorHandling: thiserror
    features:
      - blocking
      - native-tls
      - rustls
```

## Best Practices

1. Use traits for abstraction without overhead
2. Implement From/Into for type conversions
3. Provide both async and blocking APIs via features
4. Use the newtype pattern for type safety
5. Document with rustdoc and examples
6. Follow Rust API guidelines
