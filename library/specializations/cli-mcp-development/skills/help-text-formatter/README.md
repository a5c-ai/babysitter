# Help Text Formatter Skill

Generate formatted, user-friendly help text with examples and consistent styling for CLI applications.

## Overview

This skill generates well-structured help text for CLI commands, including usage examples, option descriptions, and proper formatting for terminal display.

## When to Use

- Creating consistent help text formatting
- Adding examples to command help
- Implementing custom help renderers
- Generating documentation from help

## Quick Start

```json
{
  "language": "typescript",
  "commands": [
    {
      "name": "deploy",
      "description": "Deploy application",
      "examples": [
        { "command": "deploy api -e prod", "description": "Deploy to production" }
      ]
    }
  ]
}
```

## Features

- Structured section layouts
- Color and styling support
- Example formatting
- Terminal width awareness
- Man page compatibility

## Integration with Processes

| Process | Integration |
|---------|-------------|
| cli-documentation-generation | Help text generation |
| argument-parser-setup | Option documentation |
| cli-command-structure-design | Usage formatting |
