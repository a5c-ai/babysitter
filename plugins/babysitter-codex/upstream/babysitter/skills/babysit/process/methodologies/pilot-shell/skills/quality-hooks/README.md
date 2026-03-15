# Quality Hooks Skill

## Overview

Language-specific auto-lint/format/typecheck pipeline with auto-fix convergence loops. Supports Python, TypeScript/JavaScript, and Go.

## Tool Chains

| Language | Linter | Formatter | Type Checker |
|----------|--------|-----------|-------------|
| Python | ruff | ruff format | pyright |
| TypeScript/JS | eslint | prettier | tsc |
| Go | golangci-lint | gofmt | go vet |

## Attribution

Adapted from the file_checker PostToolUse hook and quality hooks pipeline in [Pilot Shell](https://github.com/maxritter/pilot-shell) by Max Ritter.
