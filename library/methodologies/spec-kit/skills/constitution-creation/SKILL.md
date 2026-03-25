---
name: constitution-creation
description: Establish project governing principles including dev guidelines, code quality standards, testing policies, UX requirements, performance benchmarks, and security constraints.
allowed-tools: Read, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Constitution Creation

## Overview

Establish the project constitution -- the governing document that defines development principles, quality standards, and constraints for all subsequent specification and implementation work.

## When to Use

- Starting a new project that needs governance foundations
- Formalizing existing project standards into a constitution
- Updating governance principles for an evolving project
- Before writing specifications for a new feature area

## Distinction from Specification

- **Constitution**: Defines project-wide governance (HOW the project operates)
- **Specification**: Defines feature-level requirements (WHAT to build)

## Process

1. **Gather context** - Assess project type, audience, compliance needs, existing standards
2. **Define dev guidelines** - Coding standards, branching strategy, review process
3. **Set code quality standards** - Linting, formatting, complexity limits, naming conventions
4. **Establish testing policies** - Coverage thresholds, test types, CI requirements
5. **Specify UX requirements** - Accessibility, responsiveness, performance budgets
6. **Define performance benchmarks** - Load times, throughput, memory limits
7. **Establish security constraints** - Auth, data handling, vulnerability policies
8. **Document architecture principles** - Modularity, dependencies, extensibility
9. **Human review** - Approve constitution before proceeding

## Tool Use

Invoke via babysitter process: `methodologies/spec-kit/spec-kit-specification` (constitution phase)
Full pipeline: `methodologies/spec-kit/spec-kit-orchestrator`
