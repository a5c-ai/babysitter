---
name: eslint
description: ESLint configuration, custom rules, and plugin development.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
graph:
  domains: [domain:web-development]
  specializations: [specialization:web-development]
  skillAreas: [skill-area:code-analysis-linting, skill-area:code-review-practice]
  roles: [role:frontend-engineer, role:tech-lead]
  workflows: [workflow:code-review]
  topics: [topic:code-review-best-practices]

---

# ESLint Skill

Expert assistance for ESLint configuration.

## Capabilities

- Configure ESLint
- Set up plugins
- Create custom rules
- Handle TypeScript
- Configure for React/Vue

## Configuration

```javascript
// eslint.config.js (flat config)
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';

export default [
  js.configs.recommended,
  {
    plugins: { '@typescript-eslint': typescript, react },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
];
```

## Target Processes

- code-quality
- linting-setup
- team-standards
