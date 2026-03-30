---
name: cross-platform-test-matrix
description: Generate CI test matrix for Windows, macOS, and Linux combinations
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [testing, ci-cd, cross-platform, matrix, github-actions]
---

# cross-platform-test-matrix

Generate CI/CD test matrix configurations for testing desktop applications across Windows, macOS, and Linux.

## Capabilities

- Generate GitHub Actions matrix
- Configure Azure Pipelines matrix
- Set up platform-specific tests
- Handle architecture variants (x64, arm64)
- Configure parallel execution
- Set up artifact collection

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "ciPlatform": { "enum": ["github-actions", "azure-devops", "gitlab-ci"] },
    "platforms": { "type": "array" },
    "architectures": { "type": "array" }
  },
  "required": ["projectPath"]
}
```

## GitHub Actions Matrix

```yaml
name: Test Matrix

on: [push, pull_request]

jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        arch: [x64]
        include:
          - os: macos-latest
            arch: arm64

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          architecture: ${{ matrix.arch }}

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ matrix.os }}-${{ matrix.arch }}
          path: test-results/
```

## Related Skills

- `playwright-electron-config`
- `desktop-ci-architect` agent
