---
name: compatibility-test-matrix
description: Multi-version, multi-platform SDK compatibility testing
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Compatibility Test Matrix Skill

## Overview

This skill implements comprehensive compatibility testing across runtime versions, operating systems, and dependency versions to ensure SDKs work reliably in all supported environments.

## Capabilities

- Test across runtime versions (Node.js, Python, Java, etc.)
- Validate OS compatibility (Windows, macOS, Linux)
- Check dependency compatibility matrices
- Generate compatibility reports
- Configure CI matrix builds
- Test browser compatibility for web SDKs
- Validate cloud platform compatibility
- Support containerized test environments

## Target Processes

- Compatibility Testing
- SDK Testing Strategy
- Multi-Language SDK Strategy

## Integration Points

- GitHub Actions matrix builds
- tox for Python version testing
- nox for advanced Python testing
- Docker for isolated environments
- BrowserStack/Sauce Labs for browsers
- Cross-platform CI systems

## Input Requirements

- Supported runtime versions
- Target operating systems
- Dependency version ranges
- Browser support requirements
- Cloud platform targets

## Output Artifacts

- CI matrix configuration
- Compatibility test suite
- Multi-version test environments
- Compatibility matrix documentation
- Test result aggregation
- Support policy documentation

## Usage Example

```yaml
skill:
  name: compatibility-test-matrix
  context:
    language: python
    runtimes:
      - "3.8"
      - "3.9"
      - "3.10"
      - "3.11"
      - "3.12"
    operatingSystems:
      - ubuntu-latest
      - macos-latest
      - windows-latest
    dependencies:
      requests: [">=2.25", ">=2.28", ">=2.31"]
    browsers:
      - chrome
      - firefox
      - safari
```

## Best Practices

1. Test minimum and maximum supported versions
2. Include pre-release runtime versions
3. Automate matrix expansion
4. Document support policy clearly
5. Track compatibility over time
6. Fail fast on compatibility breaks
