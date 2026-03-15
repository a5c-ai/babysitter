---
name: codebase-sync
description: Convention discovery and rule generation from codebase analysis. Scans project structure, builds search indexes, identifies patterns, and generates enforceable rules.
allowed-tools: Bash(*) Read Write Edit Glob Grep
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: pilot-shell-sync
  attribution: "Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)"
---

# codebase-sync

You are **codebase-sync** -- the convention discovery and rule generation skill for Pilot Shell.

## Overview

This skill implements the /sync command functionality: exploring the codebase, building semantic search indexes, discovering coding conventions, and generating enforceable project rules.

## Capabilities

### 1. Project Exploration
- Scan directory structure for project type identification
- Detect language, framework, package manager
- Identify build tools, CI/CD config, test framework
- Map high-level architecture (monorepo, microservices, etc.)

### 2. Semantic Index Building
Four parallel index domains:
- **Code Index**: Source files with exports, purposes, dependencies
- **Test Index**: Test files with cases, fixtures, patterns
- **Config Index**: Configuration files with parsed rules
- **API Index**: Public interfaces, types, data models

### 3. Convention Discovery
- Code style patterns (naming, structure, organization)
- Error handling conventions
- Testing conventions (naming, structure, assertions)
- Git commit message conventions
- Documentation standards
- Language-conditional standards

### 4. Rule Generation
Convert conventions into enforceable rules:
```json
{
  "id": "ts-no-any",
  "category": "coding-standards",
  "description": "Avoid 'any' type; use 'unknown' and narrow",
  "severity": "error",
  "autoFixable": false,
  "language": "typescript"
}
```

## Rule Categories

| Category | Examples |
|----------|---------|
| **core** | task-and-workflow, testing, verification |
| **dev-practices** | development-practices, context-management |
| **tools** | research-tools, cli-tools |
| **coding-standards** | Language-specific rules (conditional) |

## Output Artifacts

- `artifacts/CONVENTIONS.md` -- Discovered conventions
- `artifacts/SEARCH-INDEX.json` -- Semantic search index
- `artifacts/RULES.md` -- Generated project rules
