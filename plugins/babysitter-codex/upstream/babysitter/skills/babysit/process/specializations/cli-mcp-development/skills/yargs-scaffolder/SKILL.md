---
name: yargs-scaffolder
description: Generate Yargs-based CLI applications with commands, positional args, middleware, and TypeScript support. Creates a complete scaffolded CLI application with modern patterns.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Yargs Scaffolder

Generate a complete Yargs CLI application with TypeScript, middleware support, and best practices.

## Capabilities

- Generate TypeScript-based Yargs CLI projects
- Create command modules with positional arguments
- Set up middleware for common operations (logging, config loading)
- Configure type coercion and validation
- Implement strict mode and fail handlers
- Set up build and development workflows

## Usage

Invoke this skill when you need to:
- Bootstrap a new CLI application using Yargs
- Create a CLI with command modules pattern
- Set up middleware-based processing
- Configure complex argument parsing

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Name of the CLI project (kebab-case) |
| description | string | Yes | Short description of the CLI |
| commands | array | No | List of commands to scaffold |
| typescript | boolean | No | Use TypeScript (default: true) |
| packageManager | string | No | npm, yarn, or pnpm (default: npm) |
| strictMode | boolean | No | Enable strict mode (default: true) |

### Command Structure

```json
{
  "commands": [
    {
      "name": "serve",
      "description": "Start the server",
      "aliases": ["s"],
      "positional": [
        { "name": "port", "type": "number", "default": 3000 }
      ],
      "options": [
        { "name": "host", "type": "string", "default": "localhost" },
        { "name": "watch", "type": "boolean", "alias": "w" }
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
│   ├── index.ts              # Entry point
│   ├── cli.ts                # Yargs setup
│   ├── commands/
│   │   ├── index.ts          # Command exports
│   │   └── <command>.ts      # Command modules
│   ├── middleware/
│   │   ├── logger.ts         # Logging middleware
│   │   └── config.ts         # Config loading middleware
│   ├── utils/
│   │   └── helpers.ts        # Helper utilities
│   └── types/
│       └── index.ts          # Type definitions
└── tests/
    └── commands/
        └── <command>.test.ts
```

## Generated Code Patterns

### Main CLI Entry (src/cli.ts)

```typescript
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as commands from './commands';
import { loggerMiddleware } from './middleware/logger';

export const cli = yargs(hideBin(process.argv))
  .scriptName('<projectName>')
  .usage('$0 <cmd> [args]')
  .middleware([loggerMiddleware])
  .command(commands.serveCommand)
  .command(commands.buildCommand)
  .demandCommand(1, 'You need at least one command')
  .strict()
  .fail((msg, err, yargs) => {
    if (err) throw err;
    console.error(msg);
    console.error(yargs.help());
    process.exit(1);
  })
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .wrap(Math.min(120, process.stdout.columns || 80));
```

### Command Module Template

```typescript
import { CommandModule, Argv } from 'yargs';

interface ServeArgs {
  port: number;
  host: string;
  watch: boolean;
}

export const serveCommand: CommandModule<{}, ServeArgs> = {
  command: 'serve [port]',
  aliases: ['s'],
  describe: 'Start the development server',
  builder: (yargs: Argv) => {
    return yargs
      .positional('port', {
        type: 'number',
        default: 3000,
        describe: 'Port to listen on'
      })
      .option('host', {
        type: 'string',
        default: 'localhost',
        describe: 'Host to bind to'
      })
      .option('watch', {
        alias: 'w',
        type: 'boolean',
        default: false,
        describe: 'Enable watch mode'
      });
  },
  handler: async (argv) => {
    console.log(`Starting server on ${argv.host}:${argv.port}`);
  }
};
```

## Dependencies

```json
{
  "dependencies": {
    "yargs": "^17.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/yargs": "^17.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "vitest": "^1.0.0"
  }
}
```

## Workflow

1. **Validate inputs** - Check project name, commands structure
2. **Create directory structure** - Set up folders and base files
3. **Generate package.json** - Configure project metadata
4. **Generate tsconfig.json** - TypeScript configuration
5. **Create CLI entry point** - Yargs setup with middleware
6. **Generate command modules** - Individual command files
7. **Create middleware** - Logger, config middleware
8. **Set up tests** - Test structure for commands
9. **Initialize git** - Optional git initialization

## Best Practices Applied

- TypeScript strict mode enabled
- Command module pattern for scalability
- Middleware for cross-cutting concerns
- Strict mode with custom fail handler
- Proper type definitions for arguments
- Completion script support

## References

- Yargs Documentation: https://yargs.js.org/
- Yargs GitHub: https://github.com/yargs/yargs
- Command Modules: https://yargs.js.org/docs/#api-reference-commandmodule

## Target Processes

- cli-application-bootstrap
- argument-parser-setup
- cli-command-structure-design
