# Clap Scaffolder Skill

Generate production-ready Clap Rust CLI applications with derive macros, type-safe arguments, and fast native binaries.

## Overview

This skill automates the creation of CLI applications using Clap, the most popular Rust CLI framework. It generates a complete project structure with derive macro-based command definitions, error handling, and shell completions.

## When to Use

- Starting a new Rust CLI project
- Need type-safe argument parsing
- Want fast, native cross-platform binaries
- Require compile-time argument validation

## Quick Start

### Basic Usage

```json
{
  "projectName": "my-cli",
  "description": "A fast CLI tool"
}
```

### With Commands

```json
{
  "projectName": "build-tool",
  "description": "Build automation tool",
  "commands": [
    {
      "name": "build",
      "description": "Build the project",
      "options": [
        { "long": "release", "short": "r", "help": "Build in release mode" },
        { "long": "target", "value_name": "TARGET", "help": "Target platform" }
      ]
    },
    {
      "name": "test",
      "description": "Run tests",
      "args": [
        { "name": "filter", "help": "Test filter pattern", "required": false }
      ]
    }
  ]
}
```

## Features

### Derive Macros
- Declarative command definitions
- Compile-time validation
- Automatic help generation
- Type-safe argument handling

### Rust Benefits
- Zero-cost abstractions
- Fast native binaries
- Cross-platform compilation
- Memory safety

### Developer Experience
- Colored terminal output
- Comprehensive error handling
- Shell completions
- Integration tests

## Integration with Processes

| Process | Integration |
|---------|-------------|
| cli-application-bootstrap | Primary scaffolding for Rust CLIs |
| argument-parser-setup | Type-safe argument parsing |
| shell-completion-scripts | Built-in completion generation |

## References

- [Clap Documentation](https://docs.rs/clap/)
- [Rust CLI Book](https://rust-cli.github.io/book/)
- [Command Line Apps in Rust](https://rust-cli.github.io/book/index.html)
