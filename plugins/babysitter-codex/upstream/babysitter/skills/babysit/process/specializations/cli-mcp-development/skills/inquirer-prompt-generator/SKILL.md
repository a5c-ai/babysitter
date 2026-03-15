---
name: inquirer-prompt-generator
description: Generate interactive command-line prompts using Inquirer.js with validation, conditional logic, and custom renderers. Creates user-friendly input collection flows for CLI applications.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Inquirer Prompt Generator

Generate interactive CLI prompts using Inquirer.js with comprehensive validation, conditional flows, and custom formatting.

## Capabilities

- Generate Inquirer.js prompt definitions
- Create multi-step wizard flows
- Implement input validation
- Support conditional prompts
- Generate TypeScript interfaces for answers
- Create custom prompt formatters

## Usage

Invoke this skill when you need to:
- Create interactive CLI input collection
- Build configuration wizards
- Implement user confirmation flows
- Generate form-like CLI interfaces

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| flowName | string | Yes | Name of the prompt flow |
| prompts | array | Yes | List of prompt definitions |
| typescript | boolean | No | Generate TypeScript types (default: true) |
| validation | boolean | No | Include validation helpers (default: true) |

### Prompt Definition Structure

```json
{
  "prompts": [
    {
      "type": "input",
      "name": "projectName",
      "message": "What is your project name?",
      "default": "my-project",
      "validate": {
        "required": true,
        "pattern": "^[a-z][a-z0-9-]*$",
        "message": "Project name must be lowercase with hyphens"
      }
    },
    {
      "type": "list",
      "name": "template",
      "message": "Select a template:",
      "choices": [
        { "name": "React + TypeScript", "value": "react-ts" },
        { "name": "Vue + TypeScript", "value": "vue-ts" },
        { "name": "Node.js + Express", "value": "node-express" }
      ]
    },
    {
      "type": "checkbox",
      "name": "features",
      "message": "Select features to include:",
      "choices": ["ESLint", "Prettier", "Husky", "Jest", "Docker"],
      "when": "answers.template !== 'node-express'"
    },
    {
      "type": "confirm",
      "name": "installDeps",
      "message": "Install dependencies now?",
      "default": true
    }
  ]
}
```

## Output Structure

```
prompts/
├── <flowName>/
│   ├── index.ts              # Main prompt flow
│   ├── types.ts              # TypeScript interfaces
│   ├── validators.ts         # Validation functions
│   ├── formatters.ts         # Custom formatters
│   └── README.md             # Usage documentation
```

## Generated Code Patterns

### Prompt Flow (index.ts)

```typescript
import { input, select, checkbox, confirm } from '@inquirer/prompts';
import { validateProjectName, validatePort } from './validators';
import type { ProjectConfig } from './types';

export async function createProjectPrompt(): Promise<ProjectConfig> {
  // Project name
  const projectName = await input({
    message: 'What is your project name?',
    default: 'my-project',
    validate: validateProjectName,
  });

  // Template selection
  const template = await select({
    message: 'Select a template:',
    choices: [
      { name: 'React + TypeScript', value: 'react-ts' },
      { name: 'Vue + TypeScript', value: 'vue-ts' },
      { name: 'Node.js + Express', value: 'node-express' },
    ],
  });

  // Conditional features (not shown for node-express)
  let features: string[] = [];
  if (template !== 'node-express') {
    features = await checkbox({
      message: 'Select features to include:',
      choices: [
        { name: 'ESLint', value: 'eslint', checked: true },
        { name: 'Prettier', value: 'prettier', checked: true },
        { name: 'Husky', value: 'husky' },
        { name: 'Jest', value: 'jest' },
        { name: 'Docker', value: 'docker' },
      ],
    });
  }

  // Confirmation
  const installDeps = await confirm({
    message: 'Install dependencies now?',
    default: true,
  });

  return {
    projectName,
    template,
    features,
    installDeps,
  };
}
```

### TypeScript Types (types.ts)

```typescript
/**
 * Configuration collected from create-project prompts
 */
export interface ProjectConfig {
  /** Project name (lowercase, hyphens allowed) */
  projectName: string;

  /** Selected project template */
  template: 'react-ts' | 'vue-ts' | 'node-express';

  /** Selected optional features */
  features: Array<'eslint' | 'prettier' | 'husky' | 'jest' | 'docker'>;

  /** Whether to install dependencies */
  installDeps: boolean;
}

/**
 * Template metadata for display
 */
export interface TemplateChoice {
  name: string;
  value: ProjectConfig['template'];
  description?: string;
}
```

### Validators (validators.ts)

```typescript
/**
 * Validate project name format
 * - Must start with lowercase letter
 * - Only lowercase letters, numbers, and hyphens
 * - Max 50 characters
 */
export function validateProjectName(value: string): string | true {
  if (!value.trim()) {
    return 'Project name is required';
  }

  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    return 'Project name must start with a letter and contain only lowercase letters, numbers, and hyphens';
  }

  if (value.length > 50) {
    return 'Project name must be 50 characters or less';
  }

  return true;
}

/**
 * Validate port number
 */
export function validatePort(value: string): string | true {
  const port = parseInt(value, 10);

  if (isNaN(port)) {
    return 'Port must be a number';
  }

  if (port < 1024 || port > 65535) {
    return 'Port must be between 1024 and 65535';
  }

  return true;
}

/**
 * Validate URL format
 */
export function validateUrl(value: string): string | true {
  try {
    new URL(value);
    return true;
  } catch {
    return 'Please enter a valid URL';
  }
}

/**
 * Create async validator that checks for conflicts
 */
export function createConflictValidator(
  checkFn: (value: string) => Promise<boolean>
): (value: string) => Promise<string | true> {
  return async (value: string) => {
    const exists = await checkFn(value);
    if (exists) {
      return `"${value}" already exists`;
    }
    return true;
  };
}
```

### Custom Formatters (formatters.ts)

```typescript
import chalk from 'chalk';

/**
 * Format project name for display
 */
export function formatProjectName(value: string): string {
  return chalk.cyan(value);
}

/**
 * Format feature list for summary
 */
export function formatFeatures(features: string[]): string {
  if (features.length === 0) {
    return chalk.dim('None selected');
  }
  return features.map(f => chalk.green(`+ ${f}`)).join('\n');
}

/**
 * Format configuration summary
 */
export function formatSummary(config: ProjectConfig): string {
  return `
${chalk.bold('Project Configuration:')}

  ${chalk.dim('Name:')}     ${formatProjectName(config.projectName)}
  ${chalk.dim('Template:')} ${config.template}
  ${chalk.dim('Features:')}
${formatFeatures(config.features).split('\n').map(l => '    ' + l).join('\n')}
  ${chalk.dim('Install:')}  ${config.installDeps ? chalk.green('Yes') : chalk.yellow('No')}
`;
}
```

## Prompt Types

| Type | Description | Use Case |
|------|-------------|----------|
| input | Single-line text | Names, values |
| password | Hidden input | Secrets, tokens |
| number | Numeric input | Ports, counts |
| confirm | Yes/No | Confirmations |
| select | Single choice list | Options |
| checkbox | Multiple choice | Features |
| expand | Abbreviated choices | Quick actions |
| editor | Multi-line editor | Long text |
| search | Searchable list | Large lists |
| rawlist | Numbered list | Indexed options |

## Validation Patterns

### Required Field
```typescript
validate: (value) => value.trim() ? true : 'This field is required'
```

### Pattern Matching
```typescript
validate: (value) => /^[a-z-]+$/.test(value) || 'Invalid format'
```

### Async Validation
```typescript
validate: async (value) => {
  const exists = await checkExists(value);
  return exists ? 'Already exists' : true;
}
```

### Dependent Validation
```typescript
validate: (value, answers) => {
  if (answers.type === 'advanced' && !value) {
    return 'Required for advanced mode';
  }
  return true;
}
```

## Conditional Prompts

### When Function
```typescript
{
  type: 'input',
  name: 'apiKey',
  message: 'Enter API key:',
  when: (answers) => answers.useExternalApi
}
```

### Skip Logic
```typescript
const prompts = basePrompts.filter(p => {
  if (p.name === 'advanced' && !options.showAdvanced) {
    return false;
  }
  return true;
});
```

## Workflow

1. **Parse prompt definitions** - Validate structure
2. **Generate prompt flow** - Create main prompt file
3. **Generate types** - TypeScript interfaces
4. **Generate validators** - Validation functions
5. **Generate formatters** - Display helpers
6. **Create documentation** - Usage guide

## Best Practices Applied

- Modern @inquirer/prompts API
- Reusable validation functions
- Type-safe answer interfaces
- Conditional flow support
- Custom formatters for output
- Clear error messages

## References

- Inquirer.js: https://github.com/SBoudrias/Inquirer.js
- @inquirer/prompts: https://www.npmjs.com/package/@inquirer/prompts
- Chalk: https://github.com/chalk/chalk

## Target Processes

- interactive-prompt-system
- interactive-form-implementation
- cli-application-bootstrap
