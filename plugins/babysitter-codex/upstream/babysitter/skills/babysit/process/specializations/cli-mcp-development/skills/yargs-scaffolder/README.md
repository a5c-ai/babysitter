# Yargs Scaffolder Skill

Generate production-ready Yargs CLI applications with TypeScript, middleware, and command modules.

## Overview

This skill automates the creation of CLI applications using Yargs, a powerful argument parser for Node.js. It generates a complete project structure with TypeScript support, command modules, middleware, and development tooling.

## When to Use

- Starting a new Node.js/TypeScript CLI project with Yargs
- Need command modules pattern for scalable CLI architecture
- Want middleware support for cross-cutting concerns
- Require advanced argument parsing with positional args

## Quick Start

### Basic Usage

```json
{
  "projectName": "my-tool",
  "description": "A powerful CLI tool",
  "typescript": true
}
```

### With Commands

```json
{
  "projectName": "task-cli",
  "description": "Task management CLI",
  "commands": [
    {
      "name": "add",
      "description": "Add a new task",
      "positional": [
        { "name": "title", "type": "string", "demandOption": true }
      ],
      "options": [
        { "name": "priority", "alias": "p", "type": "string", "default": "medium" }
      ]
    },
    {
      "name": "list",
      "aliases": ["ls"],
      "description": "List all tasks",
      "options": [
        { "name": "status", "type": "string", "choices": ["pending", "done", "all"] }
      ]
    }
  ]
}
```

## Features

### Command Modules
- Scalable command organization
- Type-safe argument definitions
- Builder pattern for complex options
- Aliases and subcommands

### Middleware Support
- Logger middleware for debugging
- Config loading middleware
- Custom middleware hooks

### Type Safety
- Full TypeScript integration
- Typed argument objects
- Generic command modules

## Integration with Processes

| Process | Integration |
|---------|-------------|
| cli-application-bootstrap | Primary scaffolding for Yargs CLIs |
| argument-parser-setup | Advanced argument parsing setup |
| cli-command-structure-design | Command modules architecture |

## References

- [Yargs Documentation](https://yargs.js.org/)
- [Yargs Command Modules](https://yargs.js.org/docs/#api-reference-commandmodule)
