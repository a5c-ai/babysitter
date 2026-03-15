# Cobra Scaffolder Skill

Generate production-ready Cobra/Viper Go CLI applications with persistent flags, configuration management, and cross-platform builds.

## Overview

This skill automates the creation of CLI applications using Cobra, the most popular Go CLI framework. It generates a complete project structure with Viper configuration integration, standard Go layout, and goreleaser for distribution.

## When to Use

- Starting a new Go CLI project
- Need hierarchical commands with persistent flags
- Want multi-source configuration (file, env, flags)
- Require cross-platform native binaries

## Quick Start

### Basic Usage

```json
{
  "projectName": "my-cli",
  "modulePath": "github.com/user/my-cli",
  "description": "A powerful CLI tool"
}
```

### With Commands

```json
{
  "projectName": "kubectl-plugin",
  "modulePath": "github.com/user/kubectl-plugin",
  "description": "Kubernetes helper plugin",
  "commands": [
    {
      "name": "sync",
      "description": "Sync resources",
      "flags": [
        { "name": "namespace", "shorthand": "n", "type": "string" },
        { "name": "all", "type": "bool" }
      ]
    },
    {
      "name": "diff",
      "description": "Show differences",
      "subcommands": ["resources", "config"]
    }
  ]
}
```

## Features

### Cobra Integration
- Hierarchical commands
- Persistent and local flags
- Built-in help and completion
- PreRun/PostRun hooks

### Viper Configuration
- Multi-source config (file, env, flags)
- Automatic env variable binding
- Config file watching
- Type-safe config access

### Go Best Practices
- Standard project layout
- Internal packages for private code
- Testable command structure
- Goreleaser for releases

## Integration with Processes

| Process | Integration |
|---------|-------------|
| cli-application-bootstrap | Primary scaffolding for Go CLIs |
| cli-command-structure-design | Command hierarchy design |
| configuration-management-system | Viper config setup |

## References

- [Cobra Documentation](https://cobra.dev/)
- [Viper Documentation](https://github.com/spf13/viper)
- [Go Project Layout](https://github.com/golang-standards/project-layout)
