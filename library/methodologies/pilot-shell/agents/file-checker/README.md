# File Checker Agent

## Overview

The `file-checker` agent operates language-specific quality tool pipelines (lint, format, typecheck) with auto-fix support for Python, TypeScript/JavaScript, and Go.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Quality Automation Specialist |
| **Philosophy** | "Automate everything that can be automated" |

## Supported Languages

| Language | Linter | Formatter | Type Checker |
|----------|--------|-----------|-------------|
| Python | ruff | ruff format | pyright |
| TypeScript/JS | eslint | prettier | tsc |
| Go | golangci-lint | gofmt | go vet |

## Usage

Referenced by `pilot-shell-quality-pipeline.js`, `pilot-shell-feature.js`, and `pilot-shell-orchestrator.js`.

## Attribution

Adapted from the file_checker PostToolUse hook in [Pilot Shell](https://github.com/maxritter/pilot-shell) by Max Ritter.
