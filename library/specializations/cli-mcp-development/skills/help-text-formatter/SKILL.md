---
name: help-text-formatter
description: Generate formatted help text with examples, descriptions, sections, and consistent styling for CLI applications.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Help Text Formatter

Generate formatted, user-friendly help text for CLI applications.

## Capabilities

- Generate structured help text layouts
- Create command examples with descriptions
- Format options and arguments sections
- Implement custom help formatters
- Add color and styling support
- Generate man page compatible output

## Usage

Invoke this skill when you need to:
- Create consistent help text formatting
- Add examples to command help
- Implement custom help renderers
- Generate documentation from help text

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language | string | Yes | Target language (typescript, python, go) |
| commands | array | Yes | Command definitions with help text |
| styling | object | No | Color and formatting options |

### Command Structure

```json
{
  "commands": [
    {
      "name": "deploy",
      "description": "Deploy application to target environment",
      "longDescription": "Deploy the application with optional configuration...",
      "arguments": [
        { "name": "service", "description": "Service to deploy" }
      ],
      "options": [
        { "flags": "-e, --env", "description": "Target environment" }
      ],
      "examples": [
        { "command": "deploy api -e production", "description": "Deploy API to production" }
      ]
    }
  ]
}
```

## Generated Patterns

### TypeScript Help Formatter

```typescript
import chalk from 'chalk';

interface HelpSection {
  title: string;
  content: string | string[];
}

export function formatHelp(command: CommandDefinition): string {
  const sections: HelpSection[] = [];

  // Description
  sections.push({
    title: '',
    content: command.description,
  });

  // Usage
  sections.push({
    title: 'Usage',
    content: `  $ ${command.name} ${formatUsage(command)}`,
  });

  // Arguments
  if (command.arguments?.length) {
    sections.push({
      title: 'Arguments',
      content: command.arguments.map(arg =>
        `  ${chalk.cyan(arg.name.padEnd(20))} ${arg.description}`
      ),
    });
  }

  // Options
  if (command.options?.length) {
    sections.push({
      title: 'Options',
      content: command.options.map(opt =>
        `  ${chalk.cyan(opt.flags.padEnd(20))} ${opt.description}`
      ),
    });
  }

  // Examples
  if (command.examples?.length) {
    sections.push({
      title: 'Examples',
      content: command.examples.map(ex =>
        `  ${chalk.dim('$')} ${ex.command}\n  ${chalk.dim(ex.description)}`
      ),
    });
  }

  return renderSections(sections);
}

function renderSections(sections: HelpSection[]): string {
  return sections.map(section => {
    const title = section.title
      ? chalk.bold.underline(section.title) + '\n\n'
      : '';
    const content = Array.isArray(section.content)
      ? section.content.join('\n')
      : section.content;
    return title + content;
  }).join('\n\n');
}
```

### Python Help Formatter

```python
from typing import List, Optional
import textwrap

class HelpFormatter:
    def __init__(self, width: int = 80, indent: int = 2):
        self.width = width
        self.indent = ' ' * indent

    def format_command(self, command: dict) -> str:
        sections = []

        # Description
        sections.append(command['description'])

        # Usage
        usage = self._format_usage(command)
        sections.append(f"Usage:\n{self.indent}{usage}")

        # Arguments
        if args := command.get('arguments'):
            section = self._format_section('Arguments', args)
            sections.append(section)

        # Options
        if opts := command.get('options'):
            section = self._format_section('Options', opts)
            sections.append(section)

        # Examples
        if examples := command.get('examples'):
            section = self._format_examples(examples)
            sections.append(section)

        return '\n\n'.join(sections)

    def _format_section(self, title: str, items: List[dict]) -> str:
        lines = [f"{title}:"]
        for item in items:
            name = item.get('name') or item.get('flags', '')
            desc = item.get('description', '')
            lines.append(f"{self.indent}{name:<20} {desc}")
        return '\n'.join(lines)

    def _format_examples(self, examples: List[dict]) -> str:
        lines = ["Examples:"]
        for ex in examples:
            lines.append(f"{self.indent}$ {ex['command']}")
            lines.append(f"{self.indent}  {ex['description']}")
            lines.append('')
        return '\n'.join(lines).rstrip()

    def _format_usage(self, command: dict) -> str:
        parts = [command['name']]
        for arg in command.get('arguments', []):
            if arg.get('required', True):
                parts.append(f"<{arg['name']}>")
            else:
                parts.append(f"[{arg['name']}]")
        parts.append('[options]')
        return ' '.join(parts)
```

## Workflow

1. **Analyze commands** - Review command definitions
2. **Structure sections** - Organize help content
3. **Format content** - Apply styling and layout
4. **Add examples** - Include usage examples
5. **Generate output** - Create final help text

## Best Practices Applied

- Consistent section ordering
- Appropriate indentation
- Color coding for clarity
- Example-driven documentation
- Terminal width awareness
- Screen reader friendly

## Target Processes

- cli-documentation-generation
- argument-parser-setup
- cli-command-structure-design
