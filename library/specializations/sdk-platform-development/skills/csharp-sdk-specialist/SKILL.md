---
name: csharp-sdk-specialist
description: C#/.NET SDK development with async patterns
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# C#/.NET SDK Specialist Skill

## Overview

This skill specializes in developing .NET SDKs with proper async/await patterns, supporting .NET Standard, .NET Core, and .NET 6+ with NuGet distribution.

## Capabilities

- Design .NET SDK architecture with modern patterns
- Implement async/await patterns with proper cancellation
- Configure NuGet package publishing
- Support .NET Standard 2.0/2.1, .NET Core 3.1, .NET 6/7/8
- Design extension methods for fluent APIs
- Implement dependency injection patterns
- Configure XML documentation for IntelliSense
- Support source link for debugging

## Target Processes

- Multi-Language SDK Strategy
- SDK Architecture Design
- SDK Testing Strategy

## Integration Points

- NuGet package registry
- xUnit/NUnit for testing
- dotnet CLI for building
- HttpClientFactory for HTTP
- System.Text.Json/Newtonsoft.Json
- Polly for resilience

## Input Requirements

- API specification
- Target framework versions
- Nullable reference types preference
- HTTP client preference
- Dependency injection requirements

## Output Artifacts

- .NET SDK source code (.csproj)
- NuGet package specification
- xUnit test project
- XML documentation
- Example console application
- README with installation

## Usage Example

```yaml
skill:
  name: csharp-sdk-specialist
  context:
    apiSpec: ./openapi.yaml
    targetFrameworks:
      - netstandard2.0
      - net6.0
      - net8.0
    nullableEnabled: true
    useSourceLink: true
    jsonSerializer: system-text-json
```

## Best Practices

1. Use async/await with ConfigureAwait(false)
2. Support CancellationToken in all async methods
3. Implement IDisposable/IAsyncDisposable properly
4. Use nullable reference types
5. Provide extension methods for DI registration
6. Include comprehensive XML documentation
