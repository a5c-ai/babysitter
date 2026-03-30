# Click Scaffolder Skill

Generate production-ready Click CLI applications with Python, Rich console output, and modern project structure.

## Overview

This skill automates the creation of CLI applications using Click, the most popular Python CLI framework. It generates a complete project structure with Poetry support, command groups, Rich console output, and testing infrastructure.

## When to Use

- Starting a new Python CLI project
- Need decorator-based command definitions
- Want command groups and context passing
- Require rich terminal output with colors

## Quick Start

### Basic Usage

```json
{
  "projectName": "my-cli",
  "description": "A helpful CLI tool",
  "usePoetry": true
}
```

### With Commands and Groups

```json
{
  "projectName": "cloud-cli",
  "description": "Cloud infrastructure CLI",
  "commands": [
    {
      "name": "deploy",
      "description": "Deploy application",
      "options": [
        { "name": "env", "type": "choice", "choices": ["dev", "prod"] }
      ],
      "arguments": [
        { "name": "service", "required": true }
      ]
    }
  ],
  "groups": [
    {
      "name": "cluster",
      "description": "Cluster management",
      "commands": ["create", "delete", "list", "scale"]
    }
  ]
}
```

## Features

### Decorator-Based Commands
- Clean, Pythonic command definitions
- Automatic help generation
- Type conversion and validation

### Command Groups
- Hierarchical command organization
- Shared context between commands
- Lazy loading support

### Rich Console Output
- Colors and styling
- Progress bars and spinners
- Tables and panels

### Modern Python
- Type hints throughout
- Poetry for dependency management
- pytest for testing
- mypy for type checking

## Integration with Processes

| Process | Integration |
|---------|-------------|
| cli-application-bootstrap | Primary scaffolding for Python CLIs |
| cli-command-structure-design | Command groups architecture |
| argument-parser-setup | Click option/argument setup |

## References

- [Click Documentation](https://click.palletsprojects.com/)
- [Rich Documentation](https://rich.readthedocs.io/)
- [Poetry Documentation](https://python-poetry.org/docs/)
