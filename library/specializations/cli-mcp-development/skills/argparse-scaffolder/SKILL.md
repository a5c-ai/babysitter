---
name: argparse-scaffolder
description: Generate argparse-based Python CLI applications with subparsers, type converters, and standard library patterns. Creates lightweight Python CLIs without external dependencies.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Argparse Scaffolder

Generate a complete argparse CLI application with Python standard library, subparsers, and best practices.

## Capabilities

- Generate Python-based argparse CLI projects
- Create subparser hierarchies for subcommands
- Set up custom type converters and actions
- Configure mutually exclusive groups
- Implement parent parsers for shared arguments
- Set up standard Python project structure

## Usage

Invoke this skill when you need to:
- Bootstrap a CLI using Python standard library only
- Create a lightweight CLI without external dependencies
- Set up subparsers for command hierarchies
- Build CLIs that need to run on any Python installation

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Name of the CLI project (kebab-case) |
| description | string | Yes | Short description of the CLI |
| commands | array | No | List of commands to scaffold |
| pythonVersion | string | No | Python version requirement (default: ">=3.8") |
| useSubparsers | boolean | No | Use subparsers for commands (default: true) |

### Command Structure

```json
{
  "commands": [
    {
      "name": "convert",
      "description": "Convert file formats",
      "arguments": [
        { "name": "input", "help": "Input file path" },
        { "name": "output", "help": "Output file path", "nargs": "?" }
      ],
      "options": [
        { "flags": ["-f", "--format"], "choices": ["json", "yaml", "xml"] },
        { "flags": ["-v", "--verbose"], "action": "store_true" }
      ]
    }
  ]
}
```

## Output Structure

```
<projectName>/
├── pyproject.toml
├── README.md
├── .gitignore
├── src/
│   └── <package_name>/
│       ├── __init__.py
│       ├── __main__.py        # Entry point
│       ├── cli.py             # Argparse setup
│       ├── commands/
│       │   ├── __init__.py
│       │   └── <command>.py   # Command handlers
│       ├── types/
│       │   ├── __init__.py
│       │   └── converters.py  # Custom type converters
│       └── utils/
│           ├── __init__.py
│           └── helpers.py     # Helper functions
└── tests/
    ├── __init__.py
    └── test_<command>.py
```

## Generated Code Patterns

### Main CLI Entry (src/<package>/cli.py)

```python
import argparse
import sys
from typing import Optional, Sequence

from .commands import convert, validate


def create_parser() -> argparse.ArgumentParser:
    """Create the argument parser with all subcommands."""
    parser = argparse.ArgumentParser(
        prog='<projectName>',
        description='<description>',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s convert input.json output.yaml
  %(prog)s validate config.yaml --strict
        '''
    )

    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    parser.add_argument(
        '--version',
        action='version',
        version='%(prog)s 1.0.0'
    )

    # Create subparsers
    subparsers = parser.add_subparsers(
        dest='command',
        title='commands',
        description='Available commands',
        help='Command to run'
    )

    # Register commands
    convert.register_parser(subparsers)
    validate.register_parser(subparsers)

    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Main entry point."""
    parser = create_parser()
    args = parser.parse_args(argv)

    if args.command is None:
        parser.print_help()
        return 1

    # Execute command
    return args.func(args)


if __name__ == '__main__':
    sys.exit(main())
```

### Command Template (src/<package>/commands/convert.py)

```python
import argparse
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from argparse import _SubParsersAction


def register_parser(subparsers: '_SubParsersAction[argparse.ArgumentParser]') -> None:
    """Register the convert subparser."""
    parser = subparsers.add_parser(
        'convert',
        help='Convert file formats',
        description='Convert files between different formats.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        'input',
        type=Path,
        help='Input file path'
    )
    parser.add_argument(
        'output',
        type=Path,
        nargs='?',
        help='Output file path (default: stdout)'
    )
    parser.add_argument(
        '-f', '--format',
        choices=['json', 'yaml', 'xml'],
        default='json',
        help='Output format (default: %(default)s)'
    )

    # Mutually exclusive group
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--compact', action='store_true', help='Compact output')
    group.add_argument('--pretty', action='store_true', help='Pretty print')

    parser.set_defaults(func=execute)


def execute(args: argparse.Namespace) -> int:
    """Execute the convert command."""
    print(f"Converting {args.input} to {args.format}")

    if args.output:
        print(f"Output: {args.output}")

    return 0
```

### Custom Type Converter

```python
import argparse
from pathlib import Path


def existing_file(value: str) -> Path:
    """Type converter for existing file paths."""
    path = Path(value)
    if not path.exists():
        raise argparse.ArgumentTypeError(f"File not found: {value}")
    if not path.is_file():
        raise argparse.ArgumentTypeError(f"Not a file: {value}")
    return path


def port_number(value: str) -> int:
    """Type converter for port numbers."""
    try:
        port = int(value)
    except ValueError:
        raise argparse.ArgumentTypeError(f"Invalid port number: {value}")

    if not 1 <= port <= 65535:
        raise argparse.ArgumentTypeError(f"Port must be 1-65535: {value}")

    return port
```

## Dependencies

```toml
[project]
name = "<projectName>"
version = "1.0.0"
requires-python = ">=3.8"
dependencies = []  # No external dependencies!

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-cov>=4.0.0",
    "mypy>=1.0.0",
]

[project.scripts]
<projectName> = "<package_name>.cli:main"
```

## Workflow

1. **Validate inputs** - Check project name, commands structure
2. **Create directory structure** - Set up Python project layout
3. **Generate pyproject.toml** - Configure project metadata
4. **Create CLI entry point** - Argparse setup with subparsers
5. **Generate commands** - Individual command handlers
6. **Create type converters** - Custom argument types
7. **Set up tests** - pytest test structure
8. **Generate __main__.py** - Package execution support

## Best Practices Applied

- Zero external dependencies for core CLI
- Type hints throughout
- Custom type converters for validation
- Mutually exclusive argument groups
- Parent parsers for shared arguments
- Proper help text and examples

## References

- argparse Documentation: https://docs.python.org/3/library/argparse.html
- argparse Tutorial: https://docs.python.org/3/howto/argparse.html
- PEP 389 - argparse: https://peps.python.org/pep-0389/

## Target Processes

- cli-application-bootstrap
- argument-parser-setup
- cli-command-structure-design
