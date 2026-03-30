---
name: sdk-init-generator
description: Generate SDK initialization wizards and scaffolding
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# SDK Init Generator Skill

## Overview

This skill generates SDK initialization wizards and project scaffolding that help developers quickly start using SDKs with best-practice configurations.

## Capabilities

- Create project scaffolding templates
- Generate configuration files for various frameworks
- Implement interactive setup wizards
- Support multiple frameworks and languages
- Configure authentication during setup
- Generate example code and tests
- Support template versioning
- Implement post-install hooks

## Target Processes

- CLI Tool Development
- SDK Onboarding and Tutorials
- Developer Experience Optimization

## Integration Points

- Yeoman generator framework
- create-* package patterns
- cookiecutter for Python
- degit for repository scaffolding
- npm/cargo/pip init patterns

## Input Requirements

- Project types to support
- Configuration options
- Framework integrations
- Authentication setup needs
- Example code requirements

## Output Artifacts

- Project templates
- Init command implementation
- Interactive wizard flows
- Configuration generators
- Example projects
- Post-install scripts

## Usage Example

```yaml
skill:
  name: sdk-init-generator
  context:
    initCommand: create-mysdk-app
    templates:
      - name: basic
        description: Basic SDK setup
        files: [config, auth, examples]
      - name: full
        description: Full project with tests
        files: [config, auth, examples, tests, ci]
    frameworks:
      - nextjs
      - express
      - fastapi
    interactiveSetup:
      enabled: true
      questions:
        - apiKey
        - environment
        - features
```

## Best Practices

1. Provide minimal and full templates
2. Support framework-specific setups
3. Include working examples
4. Configure authentication during init
5. Generate README with next steps
6. Support non-interactive mode
