---
name: click-scaffolder
description: Generate Click-based Python CLI applications with decorators, groups, context, and modern Python patterns. Creates complete scaffolded CLI with proper project structure.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Click Scaffolder

Generate a complete Click CLI application with Python, proper project structure, and best practices.

## Capabilities

- Generate Python-based Click CLI projects
- Create command groups with decorators
- Set up context passing between commands
- Configure type coercion and validation
- Implement custom parameter types
- Set up Poetry/pip project structure

## Usage

Invoke this skill when you need to:
- Bootstrap a new CLI application using Click
- Create a Python CLI with decorator-based commands
- Set up command groups and context
- Configure rich terminal output

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Name of the CLI project (kebab-case) |
| description | string | Yes | Short description of the CLI |
| commands | array | No | List of commands to scaffold |
| usePoetry | boolean | No | Use Poetry for dependency management (default: true) |
| pythonVersion | string | No | Python version requirement (default: ">=3.9") |

### Command Structure

```json
{
  "commands": [
    {
      "name": "init",
      "description": "Initialize a new project",
      "options": [
        { "name": "template", "type": "string", "help": "Template to use" },
        { "name": "force", "is_flag": true, "help": "Overwrite existing" }
      ],
      "arguments": [
        { "name": "directory", "required": true }
      ]
    }
  ],
  "groups": [
    {
      "name": "config",
      "description": "Configuration management",
      "commands": ["get", "set", "list"]
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
│       ├── cli.py             # Main Click setup
│       ├── commands/
│       │   ├── __init__.py
│       │   └── <command>.py   # Individual commands
│       ├── utils/
│       │   ├── __init__.py
│       │   ├── config.py      # Configuration
│       │   └── console.py     # Rich console output
│       └── types/
│           ├── __init__.py
│           └── custom.py      # Custom parameter types
└── tests/
    ├── __init__.py
    ├── conftest.py
    └── test_<command>.py
```

## Generated Code Patterns

### Main CLI Entry (src/<package>/cli.py)

```python
import click
from rich.console import Console

from .commands import init, config

console = Console()

@click.group()
@click.version_option()
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose output')
@click.pass_context
def cli(ctx: click.Context, verbose: bool) -> None:
    """<description>"""
    ctx.ensure_object(dict)
    ctx.obj['verbose'] = verbose
    ctx.obj['console'] = console

cli.add_command(init.init)
cli.add_command(config.config)

def main() -> None:
    cli(obj={})

if __name__ == '__main__':
    main()
```

### Command Template

```python
import click
from rich.console import Console

@click.command()
@click.argument('directory', type=click.Path())
@click.option(
    '--template', '-t',
    type=click.Choice(['basic', 'advanced']),
    default='basic',
    help='Template to use'
)
@click.option('--force', '-f', is_flag=True, help='Overwrite existing files')
@click.pass_context
def init(ctx: click.Context, directory: str, template: str, force: bool) -> None:
    """Initialize a new project in DIRECTORY."""
    console: Console = ctx.obj['console']
    verbose: bool = ctx.obj['verbose']

    if verbose:
        console.print(f"[dim]Using template: {template}[/dim]")

    console.print(f"[green]Initializing project in {directory}[/green]")
```

### Command Group Template

```python
import click

@click.group()
def config() -> None:
    """Configuration management commands."""
    pass

@config.command()
@click.argument('key')
@click.pass_context
def get(ctx: click.Context, key: str) -> None:
    """Get a configuration value."""
    console = ctx.obj['console']
    console.print(f"Getting {key}")

@config.command()
@click.argument('key')
@click.argument('value')
def set(key: str, value: str) -> None:
    """Set a configuration value."""
    click.echo(f"Setting {key} = {value}")
```

## Dependencies

```toml
[tool.poetry.dependencies]
python = ">=3.9"
click = "^8.1.0"
rich = "^13.0.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.0.0"
pytest-cov = "^4.0.0"
mypy = "^1.0.0"
ruff = "^0.1.0"
```

## Workflow

1. **Validate inputs** - Check project name, commands structure
2. **Create directory structure** - Set up folders and base files
3. **Generate pyproject.toml** - Configure project metadata
4. **Create CLI entry point** - Click group setup
5. **Generate commands** - Individual command files
6. **Create utilities** - Console, config helpers
7. **Set up tests** - pytest fixtures and command tests
8. **Initialize git** - Optional git initialization

## Best Practices Applied

- Type hints throughout
- Click context for shared state
- Rich library for terminal output
- Command groups for organization
- Custom parameter types
- Proper error handling

## References

- Click Documentation: https://click.palletsprojects.com/
- Click GitHub: https://github.com/pallets/click
- Rich Library: https://rich.readthedocs.io/

## Target Processes

- cli-application-bootstrap
- cli-command-structure-design
- argument-parser-setup
