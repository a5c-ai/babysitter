---
name: oclif-scaffolder
description: Generate oclif CLI framework projects with plugin support, topics, hooks, and TypeScript. Creates enterprise-grade CLI applications with extensibility.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# oclif Scaffolder

Generate a complete oclif CLI application with plugin architecture, topics, and enterprise patterns.

## Capabilities

- Generate TypeScript-based oclif CLI projects
- Create command topics with hierarchical organization
- Set up plugin system for extensibility
- Configure hooks for lifecycle events
- Implement flag inheritance and parsing
- Set up testing and development workflows

## Usage

Invoke this skill when you need to:
- Bootstrap an enterprise-grade CLI with oclif
- Create extensible CLIs with plugin support
- Build CLIs with complex command hierarchies
- Implement lifecycle hooks and middleware

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectName | string | Yes | Name of the CLI project (kebab-case) |
| description | string | Yes | Short description of the CLI |
| commands | array | No | List of commands to scaffold |
| plugins | boolean | No | Enable plugin support (default: true) |
| topics | array | No | Command topics/namespaces |

### Command Structure

```json
{
  "commands": [
    {
      "name": "deploy",
      "description": "Deploy application",
      "topic": "app",
      "flags": [
        { "name": "env", "char": "e", "required": true },
        { "name": "force", "char": "f", "allowNo": true }
      ],
      "args": [
        { "name": "service", "required": true }
      ]
    }
  ],
  "topics": [
    { "name": "app", "description": "Application commands" },
    { "name": "config", "description": "Configuration management" }
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
├── bin/
│   ├── dev.js               # Development entry
│   └── run.js               # Production entry
├── src/
│   ├── index.ts             # Plugin exports
│   ├── commands/
│   │   ├── app/
│   │   │   ├── deploy.ts    # app:deploy command
│   │   │   └── status.ts    # app:status command
│   │   └── config/
│   │       ├── get.ts       # config:get command
│   │       └── set.ts       # config:set command
│   ├── hooks/
│   │   ├── init.ts          # Init hook
│   │   └── prerun.ts        # Pre-run hook
│   └── lib/
│       ├── base-command.ts  # Base command class
│       └── config.ts        # Configuration
└── test/
    └── commands/
        └── app/
            └── deploy.test.ts
```

## Generated Code Patterns

### Base Command (src/lib/base-command.ts)

```typescript
import { Command, Flags } from '@oclif/core';
import { Config } from './config';

export abstract class BaseCommand extends Command {
  static baseFlags = {
    verbose: Flags.boolean({
      char: 'v',
      description: 'Enable verbose output',
    }),
    config: Flags.string({
      char: 'c',
      description: 'Path to config file',
    }),
  };

  protected config!: Config;

  async init(): Promise<void> {
    const { flags } = await this.parse(this.constructor as typeof BaseCommand);
    this.config = new Config(flags.config);
  }

  protected log(message: string): void {
    this.logToStderr(message);
  }
}
```

### Command Template (src/commands/app/deploy.ts)

```typescript
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../lib/base-command';

export default class Deploy extends BaseCommand {
  static description = 'Deploy application to environment';

  static examples = [
    '<%= config.bin %> <%= command.id %> my-service -e production',
    '<%= config.bin %> <%= command.id %> my-service --force',
  ];

  static flags = {
    ...BaseCommand.baseFlags,
    env: Flags.string({
      char: 'e',
      description: 'Target environment',
      required: true,
      options: ['development', 'staging', 'production'],
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Force deployment without confirmation',
      allowNo: true,
    }),
  };

  static args = {
    service: Args.string({
      description: 'Service to deploy',
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Deploy);

    this.log(`Deploying ${args.service} to ${flags.env}`);

    if (flags.force) {
      this.log('Force mode enabled');
    }

    // Deployment logic
    this.log('Deployment complete!');
  }
}
```

### Hook Template (src/hooks/init.ts)

```typescript
import { Hook } from '@oclif/core';

const hook: Hook<'init'> = async function (options) {
  // Initialization logic
  process.stdout.write(`Initializing ${options.config.name}...\n`);
};

export default hook;
```

## Dependencies

```json
{
  "dependencies": {
    "@oclif/core": "^3.0.0",
    "@oclif/plugin-help": "^6.0.0",
    "@oclif/plugin-plugins": "^4.0.0"
  },
  "devDependencies": {
    "@oclif/test": "^3.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.0.0",
    "mocha": "^10.0.0",
    "chai": "^4.0.0"
  }
}
```

## Workflow

1. **Validate inputs** - Check project name, topics structure
2. **Create directory structure** - Set up oclif project layout
3. **Generate package.json** - Configure oclif metadata
4. **Create base command** - Shared flag inheritance
5. **Generate commands** - Topic-organized commands
6. **Create hooks** - Lifecycle hooks
7. **Set up plugins** - Plugin manifest if enabled
8. **Create tests** - Command tests with @oclif/test

## Best Practices Applied

- Topic-based command organization
- Base command for shared functionality
- Hook system for lifecycle events
- Plugin architecture for extensibility
- Auto-generated help and documentation
- Mocha/Chai testing setup

## References

- oclif Documentation: https://oclif.io/
- oclif GitHub: https://github.com/oclif/oclif
- oclif Core: https://github.com/oclif/core

## Target Processes

- cli-application-bootstrap
- plugin-architecture-implementation
- cli-command-structure-design
