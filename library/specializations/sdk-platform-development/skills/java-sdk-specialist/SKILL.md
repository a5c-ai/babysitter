---
name: java-sdk-specialist
description: Java SDK development for enterprise environments
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Java SDK Specialist Skill

## Overview

This skill specializes in developing enterprise-grade Java SDKs with builder patterns, both reactive and synchronous clients, and proper Maven/Gradle distribution.

## Capabilities

- Design Java SDK architecture with builder patterns
- Implement reactive clients with Project Reactor or RxJava
- Implement synchronous clients with proper resource management
- Configure Maven/Gradle publishing to Maven Central
- Support Java 11+ with proper compatibility handling
- Design fluent API interfaces
- Implement proper exception hierarchies
- Configure logging with SLF4J

## Target Processes

- Multi-Language SDK Strategy
- SDK Architecture Design
- SDK Testing Strategy

## Integration Points

- Maven Central repository
- JUnit 5 for testing
- Gradle/Maven build systems
- OkHttp/Apache HttpClient
- Project Reactor for reactive
- Lombok for boilerplate reduction

## Input Requirements

- API specification
- Target Java version (11, 17, 21)
- Reactive vs synchronous preference
- Build tool preference (Maven/Gradle)
- Dependency injection requirements

## Output Artifacts

- Java SDK source code
- pom.xml or build.gradle configuration
- JUnit test suite
- Javadoc documentation
- Example applications
- Publishing configuration

## Usage Example

```yaml
skill:
  name: java-sdk-specialist
  context:
    apiSpec: ./openapi.yaml
    javaVersion: 17
    buildTool: gradle
    reactiveSupport: true
    httpClient: okhttp
    lombok: true
```

## Best Practices

1. Use builder pattern for complex objects
2. Implement AutoCloseable for resource management
3. Design immutable value objects
4. Provide both sync and async APIs
5. Use Optional for nullable returns
6. Document with comprehensive Javadoc
