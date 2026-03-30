---
name: git
description: Git workflows, branching strategies, and hooks.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Git Skill

Expert assistance for Git workflows and best practices.

## Capabilities

- Configure Git workflows
- Set up branching strategies
- Implement Git hooks
- Handle merge strategies
- Configure commit conventions

## Branching Strategy

```
main
  └── develop
        ├── feature/user-auth
        ├── feature/dashboard
        └── bugfix/login-issue
```

## Git Hooks (Husky)

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

```bash
# .husky/pre-commit
npm run lint
npm run test:staged
```

## Target Processes

- git-workflow
- code-review
- team-collaboration
