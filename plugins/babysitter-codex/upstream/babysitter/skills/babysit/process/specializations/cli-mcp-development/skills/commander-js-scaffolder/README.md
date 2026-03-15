# Commander.js Scaffolder Skill

Generate production-ready Commander.js CLI applications with TypeScript, proper structure, and best practices.

## Overview

This skill automates the creation of CLI applications using Commander.js, the most popular Node.js CLI framework. It generates a complete project structure with TypeScript support, command organization, and development tooling.

## When to Use

- Starting a new Node.js/TypeScript CLI project
- Need a well-structured command-line application
- Want consistent patterns across CLI projects
- Require TypeScript type safety in CLI development

## Quick Start

### Basic Usage

```json
{
  "projectName": "my-cli",
  "description": "A helpful CLI tool",
  "typescript": true
}
```

### With Commands

```json
{
  "projectName": "deploy-cli",
  "description": "Deployment automation CLI",
  "commands": [
    {
      "name": "deploy",
      "description": "Deploy to environment",
      "options": [
        { "flags": "-e, --env <name>", "description": "Target environment" },
        { "flags": "--dry-run", "description": "Preview changes only" }
      ],
      "arguments": [
        { "name": "<service>", "description": "Service to deploy" }
      ]
    },
    {
      "name": "rollback",
      "description": "Rollback deployment",
      "options": [
        { "flags": "-v, --version <tag>", "description": "Version to rollback to" }
      ]
    },
    {
      "name": "status",
      "description": "Check deployment status",
      "subcommands": [
        { "name": "services", "description": "List service statuses" },
        { "name": "history", "description": "Show deployment history" }
      ]
    }
  ]
}
```

## Generated Structure

```
my-cli/
├── package.json           # Project config with scripts
├── tsconfig.json          # TypeScript configuration
├── .gitignore             # Git ignore patterns
├── README.md              # Project documentation
├── src/
│   ├── index.ts           # Entry point (#!/usr/bin/env node)
│   ├── cli.ts             # Commander program setup
│   ├── commands/
│   │   ├── index.ts       # Command barrel exports
│   │   ├── deploy.ts      # Deploy command
│   │   ├── rollback.ts    # Rollback command
│   │   └── status/
│   │       ├── index.ts   # Status parent command
│   │       ├── services.ts
│   │       └── history.ts
│   ├── utils/
│   │   ├── logger.ts      # Console output utilities
│   │   ├── config.ts      # Configuration loading
│   │   └── errors.ts      # Error handling
│   └── types/
│       └── index.ts       # Shared type definitions
├── bin/
│   └── my-cli             # Executable entry
└── tests/
    ├── setup.ts           # Test configuration
    └── commands/
        ├── deploy.test.ts
        └── rollback.test.ts
```

## Features

### TypeScript Support
- Strict mode enabled
- Type-safe command definitions
- Proper module resolution
- Source maps for debugging

### Command Patterns
- Nested subcommands
- Required and optional arguments
- Options with defaults and validation
- Action handlers with async support

### Developer Experience
- Hot reload with tsx
- Vitest for testing
- ESLint configuration
- Prettier formatting

### Production Ready
- Proper error handling
- Exit code management
- Help text generation
- Version management

## Example Generated Command

```typescript
// src/commands/deploy.ts
import { Command } from 'commander';
import { logger } from '../utils/logger';

export interface DeployOptions {
  env: string;
  dryRun: boolean;
}

export const deployCommand = new Command('deploy')
  .description('Deploy to environment')
  .argument('<service>', 'Service to deploy')
  .option('-e, --env <name>', 'Target environment', 'staging')
  .option('--dry-run', 'Preview changes only', false)
  .action(async (service: string, options: DeployOptions) => {
    logger.info(`Deploying ${service} to ${options.env}`);

    if (options.dryRun) {
      logger.warn('Dry run mode - no changes will be made');
      return;
    }

    // Deployment logic here
    logger.success(`Successfully deployed ${service}`);
  });
```

## Scripts Generated

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src/**/*.ts",
    "prepublishOnly": "npm run build"
  }
}
```

## Integration with Processes

This skill is designed to work with:

| Process | Integration |
|---------|-------------|
| cli-application-bootstrap | Primary scaffolding for Node.js CLIs |
| cli-command-structure-design | Generates command hierarchies |
| argument-parser-setup | Creates type-safe argument parsing |

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| typescript | true | Generate TypeScript project |
| packageManager | npm | npm, yarn, or pnpm |
| testFramework | vitest | Testing framework to use |
| linter | eslint | Linting configuration |
| includeExamples | true | Include example commands |

## Best Practices

1. **Command Naming**: Use verb-noun pattern (deploy-app, create-user)
2. **Options**: Short + long flags (-e, --env)
3. **Arguments**: Use angle brackets for required, square for optional
4. **Descriptions**: Clear, concise, action-oriented
5. **Defaults**: Provide sensible defaults for optional values

## References

- [Commander.js Documentation](https://github.com/tj/commander.js)
- [Node.js CLI Best Practices](https://clig.dev/)
- [12 Factor CLI Apps](https://medium.com/@jdxcode/12-factor-cli-apps-dd3c227a0e46)
