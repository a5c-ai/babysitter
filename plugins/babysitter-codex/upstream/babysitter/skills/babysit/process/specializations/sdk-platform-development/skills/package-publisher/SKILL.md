---
name: package-publisher
description: Publish packages to language-specific registries
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Package Publisher Skill

## Overview

This skill manages SDK package publishing to language-specific registries including npm, PyPI, Maven Central, NuGet, and crates.io with proper signing and verification.

## Capabilities

- Publish to npm, PyPI, Maven Central, NuGet, crates.io
- Implement package signing and verification
- Configure CDN distribution for performance
- Verify installation across environments
- Support pre-release and stable channels
- Implement rollback capabilities
- Configure scoped/namespaced packages
- Generate installation documentation

## Target Processes

- Package Distribution
- SDK Versioning and Release Management
- Multi-Language SDK Strategy

## Integration Points

- npm registry
- PyPI (Python Package Index)
- Maven Central
- NuGet Gallery
- crates.io
- GitHub Packages

## Input Requirements

- Target registries
- Package metadata
- Signing requirements
- Distribution channels
- Verification requirements

## Output Artifacts

- Publishing automation scripts
- Package signing configuration
- Registry configurations
- Verification test scripts
- Installation documentation
- Rollback procedures

## Usage Example

```yaml
skill:
  name: package-publisher
  context:
    packages:
      - registry: npm
        scope: "@myorg"
        access: public
      - registry: pypi
        name: mysdk
      - registry: maven
        groupId: com.myorg
        artifactId: mysdk
    signing:
      enabled: true
      gpg: true
    distribution:
      cdn: true
      mirrors: true
    channels:
      - stable
      - beta
      - alpha
```

## Best Practices

1. Sign all published packages
2. Use scoped/namespaced packages
3. Support multiple distribution channels
4. Verify installation post-publish
5. Document installation clearly
6. Implement rollback procedures
