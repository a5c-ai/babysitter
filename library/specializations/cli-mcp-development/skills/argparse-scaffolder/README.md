# Argparse Scaffolder Skill

Generate lightweight Python CLI applications using the standard library argparse module with zero external dependencies.

## Overview

This skill automates the creation of CLI applications using Python's built-in argparse module. It generates a complete project structure with subparsers, custom type converters, and proper Python packaging without requiring any external dependencies.

## When to Use

- Building CLIs that must run on any Python installation
- Need zero external dependencies
- Want standard library compatibility
- Require lightweight, portable CLIs

## Quick Start

### Basic Usage

```json
{
  "projectName": "my-tool",
  "description": "A lightweight CLI tool",
  "pythonVersion": ">=3.8"
}
```

### With Commands

```json
{
  "projectName": "file-tool",
  "description": "File manipulation tool",
  "commands": [
    {
      "name": "convert",
      "description": "Convert file formats",
      "arguments": [
        { "name": "input", "help": "Input file" }
      ],
      "options": [
        { "flags": ["-o", "--output"], "help": "Output file" }
      ]
    },
    {
      "name": "validate",
      "description": "Validate file format",
      "arguments": [
        { "name": "file", "help": "File to validate" }
      ]
    }
  ]
}
```

## Features

### Standard Library Only
- No external dependencies
- Works on any Python 3.8+ installation
- Portable and lightweight

### argparse Features
- Subparsers for subcommands
- Custom type converters
- Mutually exclusive groups
- Parent parsers for shared args

### Python Best Practices
- Type hints throughout
- Package execution support
- Proper project structure
- pytest for testing

## Integration with Processes

| Process | Integration |
|---------|-------------|
| cli-application-bootstrap | Lightweight Python CLI scaffolding |
| argument-parser-setup | argparse configuration |
| cli-command-structure-design | Subparser organization |

## References

- [argparse Documentation](https://docs.python.org/3/library/argparse.html)
- [argparse Tutorial](https://docs.python.org/3/howto/argparse.html)
- [Python Packaging Guide](https://packaging.python.org/)
