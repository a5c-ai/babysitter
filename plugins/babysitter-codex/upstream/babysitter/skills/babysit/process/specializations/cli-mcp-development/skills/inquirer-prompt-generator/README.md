# Inquirer Prompt Generator Skill

Generate interactive command-line prompts using Inquirer.js with validation, conditional logic, and custom formatting.

## Overview

Interactive prompts make CLI applications more user-friendly by guiding users through configuration and input collection. This skill generates comprehensive prompt flows using the modern @inquirer/prompts API.

## When to Use

- Creating project scaffolding wizards
- Building configuration setup flows
- Implementing user confirmation dialogs
- Collecting structured input from users

## Quick Start

### Simple Form

```json
{
  "flowName": "user-registration",
  "prompts": [
    {
      "type": "input",
      "name": "username",
      "message": "Enter username:",
      "validate": { "required": true, "minLength": 3 }
    },
    {
      "type": "input",
      "name": "email",
      "message": "Enter email:",
      "validate": { "format": "email" }
    },
    {
      "type": "password",
      "name": "password",
      "message": "Enter password:",
      "validate": { "minLength": 8 }
    },
    {
      "type": "confirm",
      "name": "newsletter",
      "message": "Subscribe to newsletter?",
      "default": false
    }
  ]
}
```

### Wizard Flow

```json
{
  "flowName": "project-setup",
  "prompts": [
    {
      "type": "input",
      "name": "name",
      "message": "Project name:",
      "default": "my-app"
    },
    {
      "type": "select",
      "name": "language",
      "message": "Programming language:",
      "choices": [
        { "name": "TypeScript", "value": "ts" },
        { "name": "JavaScript", "value": "js" },
        { "name": "Python", "value": "py" }
      ]
    },
    {
      "type": "select",
      "name": "framework",
      "message": "Framework:",
      "choices": {
        "ts": [
          { "name": "React", "value": "react" },
          { "name": "Vue", "value": "vue" },
          { "name": "Express", "value": "express" }
        ],
        "js": [
          { "name": "React", "value": "react" },
          { "name": "Vue", "value": "vue" }
        ],
        "py": [
          { "name": "FastAPI", "value": "fastapi" },
          { "name": "Flask", "value": "flask" },
          { "name": "Django", "value": "django" }
        ]
      },
      "dependsOn": "language"
    },
    {
      "type": "checkbox",
      "name": "features",
      "message": "Include features:",
      "choices": ["Linting", "Testing", "CI/CD", "Docker"],
      "default": ["Linting", "Testing"]
    },
    {
      "type": "confirm",
      "name": "git",
      "message": "Initialize git repository?",
      "default": true
    }
  ]
}
```

## Generated Structure

```
prompts/project-setup/
├── index.ts           # Main prompt flow
├── types.ts           # TypeScript interfaces
├── validators.ts      # Validation functions
├── formatters.ts      # Output formatters
└── README.md          # Usage documentation
```

## Prompt Types

### Input
Single-line text input:
```typescript
const name = await input({
  message: 'Project name:',
  default: 'my-app',
  validate: (value) => value.length >= 2 || 'Name too short',
});
```

### Password
Hidden input for sensitive data:
```typescript
const apiKey = await password({
  message: 'API Key:',
  mask: '*',
});
```

### Number
Numeric input with validation:
```typescript
const port = await number({
  message: 'Server port:',
  default: 3000,
  min: 1024,
  max: 65535,
});
```

### Confirm
Yes/No questions:
```typescript
const proceed = await confirm({
  message: 'Continue?',
  default: true,
});
```

### Select (List)
Single selection from list:
```typescript
const env = await select({
  message: 'Environment:',
  choices: [
    { name: 'Development', value: 'dev' },
    { name: 'Staging', value: 'staging' },
    { name: 'Production', value: 'prod' },
  ],
});
```

### Checkbox
Multiple selections:
```typescript
const features = await checkbox({
  message: 'Features:',
  choices: [
    { name: 'ESLint', value: 'eslint', checked: true },
    { name: 'Prettier', value: 'prettier', checked: true },
    { name: 'Jest', value: 'jest' },
    { name: 'Docker', value: 'docker' },
  ],
});
```

### Search
Searchable list for many options:
```typescript
const country = await search({
  message: 'Country:',
  source: async (input) => {
    const countries = await fetchCountries(input);
    return countries.map(c => ({ name: c.name, value: c.code }));
  },
});
```

### Editor
Multi-line text in external editor:
```typescript
const description = await editor({
  message: 'Description:',
  default: '# Project Description\n\n',
  postfix: '.md',
});
```

## Validation

### Built-in Validators

```typescript
// Required
validate: { required: true }

// String length
validate: { minLength: 3, maxLength: 50 }

// Pattern
validate: { pattern: "^[a-z-]+$" }

// Format
validate: { format: "email" }  // email, url, uuid

// Range (numbers)
validate: { min: 0, max: 100 }
```

### Custom Validators

```typescript
// Sync validation
const validateName = (value: string): string | true => {
  if (!value.trim()) return 'Name is required';
  if (!/^[a-z][a-z0-9-]*$/.test(value)) return 'Invalid format';
  return true;
};

// Async validation
const validateUnique = async (value: string): Promise<string | true> => {
  const exists = await checkExists(value);
  if (exists) return `"${value}" already exists`;
  return true;
};
```

## Conditional Logic

### When Function

```typescript
// Show only if condition is met
{
  type: 'input',
  name: 'customPath',
  message: 'Custom path:',
  when: (answers) => answers.useCustomPath === true
}
```

### Dynamic Choices

```typescript
// Choices based on previous answers
{
  type: 'select',
  name: 'database',
  message: 'Database:',
  choices: (answers) => {
    if (answers.framework === 'django') {
      return ['PostgreSQL', 'MySQL', 'SQLite'];
    }
    return ['PostgreSQL', 'MySQL', 'MongoDB'];
  }
}
```

### Transform Answers

```typescript
// Transform input before storing
const slug = await input({
  message: 'Project name:',
  transformer: (value) => value.toLowerCase().replace(/\s+/g, '-'),
});
```

## Output Formatting

### With Chalk

```typescript
import chalk from 'chalk';

// Colored output
console.log(chalk.green('Success!'));
console.log(chalk.red('Error:'), message);
console.log(chalk.dim('Optional:'), value);

// Summary
console.log(`
${chalk.bold('Configuration Summary:')}
  ${chalk.cyan('Name:')}     ${config.name}
  ${chalk.cyan('Template:')} ${config.template}
`);
```

### Progress Indicators

```typescript
import ora from 'ora';

const spinner = ora('Installing dependencies...').start();
// ... work
spinner.succeed('Dependencies installed');
```

## Generated Example

```typescript
// prompts/project-setup/index.ts
import { input, select, checkbox, confirm } from '@inquirer/prompts';
import { validateProjectName } from './validators';
import { formatSummary } from './formatters';
import type { ProjectConfig } from './types';

export async function projectSetup(): Promise<ProjectConfig> {
  console.log('\n  Welcome to Project Setup\n');

  const name = await input({
    message: 'Project name:',
    default: 'my-app',
    validate: validateProjectName,
  });

  const language = await select({
    message: 'Programming language:',
    choices: [
      { name: 'TypeScript', value: 'ts', description: 'Type-safe JavaScript' },
      { name: 'JavaScript', value: 'js', description: 'Standard JavaScript' },
      { name: 'Python', value: 'py', description: 'Python 3.x' },
    ],
  });

  const features = await checkbox({
    message: 'Include features:',
    choices: [
      { name: 'Linting', value: 'lint', checked: true },
      { name: 'Testing', value: 'test', checked: true },
      { name: 'CI/CD', value: 'ci' },
      { name: 'Docker', value: 'docker' },
    ],
  });

  const git = await confirm({
    message: 'Initialize git repository?',
    default: true,
  });

  const config: ProjectConfig = { name, language, features, git };

  console.log(formatSummary(config));

  const proceed = await confirm({
    message: 'Create project with this configuration?',
    default: true,
  });

  if (!proceed) {
    throw new Error('Project setup cancelled');
  }

  return config;
}
```

## Integration with CLI Frameworks

### Commander.js

```typescript
program
  .command('init')
  .description('Initialize new project')
  .action(async () => {
    const config = await projectSetup();
    await createProject(config);
  });
```

### Interactive Fallback

```typescript
program
  .command('create <name>')
  .option('-t, --template <template>')
  .action(async (name, options) => {
    // Use prompts for missing options
    const template = options.template ?? await select({
      message: 'Template:',
      choices: templates,
    });

    await createProject(name, template);
  });
```

## Best Practices

1. **Clear Messages**: Use concise, actionable prompt messages
2. **Sensible Defaults**: Provide defaults for common cases
3. **Validation Feedback**: Give clear error messages
4. **Conditional Flow**: Only ask relevant questions
5. **Summary Before Action**: Show what will happen
6. **Allow Cancellation**: Let users abort at any point

## References

- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js)
- [@inquirer/prompts](https://www.npmjs.com/package/@inquirer/prompts)
- [Chalk](https://github.com/chalk/chalk)
- [Ora](https://github.com/sindresorhus/ora)
