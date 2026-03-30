---
name: github-actions-web
description: GitHub Actions for web app CI/CD, testing, and deployment.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# GitHub Actions Web Skill

Expert assistance for CI/CD with GitHub Actions.

## Capabilities

- Create CI/CD workflows
- Configure test automation
- Set up deployment pipelines
- Handle secrets
- Optimize workflow performance

## Workflow

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Target Processes

- ci-cd-setup
- automated-testing
- deployment-automation
