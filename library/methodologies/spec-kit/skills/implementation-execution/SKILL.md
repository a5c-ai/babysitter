---
name: implementation-execution
description: Execute development tasks to build features, producing code, tests, and configuration artifacts that satisfy specification requirements and comply with constitution standards.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent, AskUserQuestion
---

# Implementation Execution

## Overview

Execute development tasks from the task list against the specification and constitution. Produces code, tests, and configuration artifacts with progressive validation. Independent tasks execute in parallel; dependent tasks execute sequentially respecting the dependency graph.

## When to Use

- After task list is approved and analysis confirms readiness
- When implementing feature code against a specification
- When running per-task tests during implementation
- When validating implementation against specification requirements

## Key Principle

Every line of code must trace back to a specification requirement. Code quality must meet constitution standards. Tests must verify acceptance criteria from the task definition.

## Process

1. **Prepare environment** - Scaffold directories and configuration
2. **Execute independent tasks** - Parallel execution for tasks without dependencies
3. **Execute dependent tasks** - Sequential execution respecting dependency graph
4. **Run per-task tests** - Verify each task's acceptance criteria
5. **Validate against spec** - Check requirement coverage and story satisfaction
6. **Run integration tests** - Cross-component testing
7. **Human review** - Approve implementation before quality checklist

## Tool Use

Invoke via babysitter process: `methodologies/spec-kit/spec-kit-implementation`
Full pipeline: `methodologies/spec-kit/spec-kit-orchestrator`
