# oclif Scaffolder Skill

Generate enterprise-grade oclif CLI applications with plugin support, topics, hooks, and TypeScript.

## Overview

This skill automates the creation of CLI applications using oclif, a powerful framework for building extensible CLIs. It generates a complete project structure with plugin architecture, command topics, lifecycle hooks, and testing infrastructure.

## When to Use

- Building enterprise-grade CLI tools
- Need plugin extensibility (like Salesforce CLI, Heroku CLI)
- Want topic-based command organization
- Require lifecycle hooks and middleware

## Quick Start

### Basic Usage

```json
{
  "projectName": "my-cli",
  "description": "An enterprise CLI tool",
  "plugins": true
}
```

### With Topics and Commands

```json
{
  "projectName": "cloud-cli",
  "description": "Cloud management CLI",
  "topics": [
    { "name": "compute", "description": "Compute resources" },
    { "name": "storage", "description": "Storage management" }
  ],
  "commands": [
    {
      "name": "create",
      "topic": "compute",
      "description": "Create compute instance"
    },
    {
      "name": "list",
      "topic": "storage",
      "description": "List storage buckets"
    }
  ]
}
```

## Features

### Plugin Architecture
- Dynamic plugin loading
- Plugin manifest support
- Hook-based extensibility
- Salesforce/Heroku CLI patterns

### Topic Organization
- Hierarchical commands (topic:command)
- Shared base commands
- Flag inheritance
- Auto-generated help

### Enterprise Features
- Lifecycle hooks
- Update notifications
- Autocomplete generation
- Comprehensive testing

## Integration with Processes

| Process | Integration |
|---------|-------------|
| cli-application-bootstrap | Enterprise CLI scaffolding |
| plugin-architecture-implementation | Plugin system setup |
| cli-command-structure-design | Topic organization |

## References

- [oclif Documentation](https://oclif.io/)
- [oclif GitHub](https://github.com/oclif/oclif)
- [Building CLIs with oclif](https://oclif.io/docs/introduction)
