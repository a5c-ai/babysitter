---
name: codebase-mapping
description: Automatic codebase indexing for invisible context injection. Catalogs project structure, file types, entry points, dependencies, and test layout.
allowed-tools: Read, Bash, Grep, Glob
---

# Codebase Mapping

## Overview

Auto-indexes the project structure to build a comprehensive codebase map. This map is used for invisible context injection via the UserPromptSubmit hook, providing Claude with project awareness without explicit user prompting.

## Map Contents

### Project Structure
- Directory tree with depth-limited enumeration
- Key file identification (entry points, configs, lock files)

### File Type Distribution
- Language breakdown (TypeScript, JavaScript, Python, etc.)
- Framework detection (React, Next.js, Express, etc.)

### Entry Points
- Main entry files (index, main, app)
- CLI entry points
- API route definitions

### Module Dependencies
- Import graph analysis
- Package boundary mapping
- Circular dependency detection

### Test Layout
- Test directory structure
- Test file patterns and conventions
- Test framework identification

## Context Injection

The codebase map is injected as invisible context during UserPromptSubmit, providing:
- Project type and framework awareness
- Convention awareness for code generation
- Dependency awareness for import suggestions
- Test pattern awareness for test generation

## When to Use

- Automatically at ClaudeKit session start
- When project structure changes significantly
- Before research or specification tasks

## Processes Used By

- `claudekit-orchestrator` (session initialization)
- `claudekit-research` (context for research agents)
- `claudekit-spec-workflow` (context for spec creation)
