---
name: commander-js-scaffolder
description: Generate Commander.js CLI project structure with TypeScript, commands, options, and best practices. Creates a complete scaffolded CLI application ready for development.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Commander.js Scaffolder

Generate a complete Commander.js CLI application with TypeScript, proper project structure, and best practices.

## Capabilities

- Generate TypeScript-based Commander.js CLI projects
- Create command structure with subcommands and options
- Set up proper argument parsing with type coercion
- Configure help text generation
- Implement version management
- Set up build and development workflows

## Usage

Invoke this skill when you need to:
- Bootstrap a new CLI application using Commander.js
- Create a TypeScript CLI with proper structure
- Set up command hierarchies with subcommands
- Configure CLI options and arguments

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Name of the CLI project (kebab-case) |
| description | string | Yes | Short description of the CLI |
| commands | array | No | List of commands to scaffold |
| typescript | boolean | No | Use TypeScript (default: true) |
| packageManager | string | No | npm, yarn, or pnpm (default: npm) |

### Command Structure

```json
{
  "commands": [
    {
      "name": "init",
      "description": "Initialize a new project",
      "options": [
        { "flags": "-t, --template <name>", "description": "Template to use" },
        { "flags": "-f, --force", "description": "Overwrite existing files" }
      ],
      "arguments": [
        { "name": "<directory>", "description": "Target directory" }
      ]
    }
  ]
}
```

## Output Structure

```
<projectName>/
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
├── src/
│   ├── index.ts              # Entry point with shebang
│   ├── cli.ts                # Main CLI setup
│   ├── commands/
│   │   ├── index.ts          # Command exports
│   │   └── <command>.ts      # Individual commands
│   ├── utils/
│   │   ├── logger.ts         # Logging utilities
│   │   └── config.ts         # Configuration helpers
│   └── types/
│       └── index.ts          # Type definitions
├── bin/
│   └── <projectName>         # Compiled binary entry
└── tests/
    └── commands/
        └── <command>.test.ts
```

## Generated Code Patterns

### Main CLI Entry (src/cli.ts)

```typescript
import { Command } from 'commander';
import { version } from '../package.json';

const program = new Command();

program
  .name('<projectName>')
  .description('<description>')
  .version(version, '-v, --version', 'Display version number');

// Register commands
program.addCommand(initCommand);
program.addCommand(buildCommand);

// Global options
program
  .option('-d, --debug', 'Enable debug mode')
  .option('-q, --quiet', 'Suppress output');

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (err) {
  // Handle gracefully
}
```

### Command Template (src/commands/<name>.ts)

```typescript
import { Command } from 'commander';

export const <name>Command = new Command('<name>')
  .description('<description>')
  .argument('<required>', 'Required argument description')
  .argument('[optional]', 'Optional argument description')
  .option('-o, --option <value>', 'Option description', 'default')
  .action(async (required, optional, options) => {
    // Command implementation
  });
```

## Dependencies

```json
{
  "dependencies": {
    "commander": "^12.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "vitest": "^1.0.0"
  }
}
```

## Workflow

1. **Validate inputs** - Check project name, commands structure
2. **Create directory structure** - Set up folders and base files
3. **Generate package.json** - Configure project metadata and scripts
4. **Generate tsconfig.json** - TypeScript configuration
5. **Create CLI entry point** - Main program setup
6. **Generate commands** - Individual command files
7. **Create utilities** - Logger, config helpers
8. **Set up tests** - Test structure for commands
9. **Initialize git** - Optional git initialization

## Best Practices Applied

- TypeScript strict mode enabled
- Proper error handling with exitOverride
- Consistent command naming conventions
- Help text formatting standards
- Version flag configuration
- Debug/verbose mode support
- Graceful error messages

## References

- Commander.js Documentation: https://github.com/tj/commander.js
- Commander.js Examples: https://github.com/tj/commander.js/tree/master/examples
- Node.js CLI Best Practices: https://clig.dev/

## Target Processes

- cli-application-bootstrap
- cli-command-structure-design
- argument-parser-setup
