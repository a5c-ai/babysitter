---
name: cli-framework-builder
description: Build command-line interfaces for SDK interaction
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# CLI Framework Builder Skill

## Overview

This skill builds professional command-line interfaces for SDK interaction, including command structure, interactive prompts, shell completions, and configuration management.

## Capabilities

- Design CLI command structure and hierarchy
- Implement interactive prompts and wizards
- Generate shell completions (bash, zsh, fish)
- Support configuration file management
- Implement colored output and progress bars
- Handle authentication flows in CLI
- Support multiple output formats (JSON, table, plain)
- Implement plugin systems for extensibility

## Target Processes

- CLI Tool Development
- Developer Experience Optimization
- SDK Onboarding and Tutorials

## Integration Points

- oclif for Node.js CLIs
- cobra for Go CLIs
- click/typer for Python CLIs
- clap for Rust CLIs
- Configuration managers

## Input Requirements

- Command structure requirements
- Authentication methods
- Output format needs
- Plugin system requirements
- Configuration management needs

## Output Artifacts

- CLI application framework
- Command implementations
- Shell completion scripts
- Configuration management
- Interactive prompt flows
- Plugin system

## Usage Example

```yaml
skill:
  name: cli-framework-builder
  context:
    framework: oclif
    commands:
      - name: auth
        subcommands: [login, logout, status]
      - name: api
        subcommands: [get, post, list]
      - name: config
        subcommands: [set, get, list]
    features:
      shellCompletions: true
      interactiveMode: true
      outputFormats: [json, table, plain]
      configFile: ~/.mysdkrc
    plugins:
      enabled: true
      registry: npm
```

## Best Practices

1. Follow CLI design conventions
2. Provide helpful error messages
3. Support both interactive and scripted use
4. Generate shell completions
5. Implement proper exit codes
6. Support configuration files
