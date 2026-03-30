---
name: context-engineering
description: Dynamic context injection, mode switching (dev/review/research), selective loading, and strategic compaction for token optimization.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Context Engineering

## Overview

Context management methodology adapted from the Everything Claude Code project. Optimizes context window usage through dynamic injection, mode switching, selective loading, and strategic compaction.

## Context Modes

### Dev Mode
- Load: architecture docs, active code files, test files, recent changes
- Skip: historical discussions, completed milestones, research notes
- Priority: implementation speed

### Review Mode
- Load: code diff, coding standards, security rules, test coverage
- Skip: architecture docs, planning notes, research
- Priority: thoroughness and accuracy

### Research Mode
- Load: requirements, existing patterns, external research, alternatives
- Skip: implementation details, test files, CI configs
- Priority: breadth of information

## Dynamic Injection
- Detect project context automatically (language, framework, tools)
- Load relevant skills based on detected context
- Inject domain-specific patterns and conventions
- Adjust tool allowlists per context mode

## Selective Loading
- Load only files relevant to the current task
- Use glob patterns to scope file reading
- Prioritize recently modified files
- Skip binary files and generated code

## Strategic Compaction
- Monitor context token usage
- Suggest compression for resolved/completed items
- Archive to memory files (activeContext, patterns, progress)
- Pre-compaction state preservation
- Automated compaction triggers at token thresholds

## Cross-Platform Detection
- Package manager: npm (package-lock.json), pnpm (pnpm-lock.yaml), yarn (yarn.lock), bun (bun.lockb)
- Language: TypeScript (tsconfig.json), Go (go.mod), Python (pyproject.toml), Java (pom.xml)
- Test runner: vitest, jest, pytest, go test
- CI/CD: GitHub Actions, Dockerfile, docker-compose

## When to Use

- Session initialization (detect context)
- Before each phase (inject relevant context)
- Token budget warnings (strategic compaction)
- Mode transitions (dev to review to research)

## Agents Used

- Used by all agents indirectly through context detection
- `context-engineering` agent for explicit compaction analysis
