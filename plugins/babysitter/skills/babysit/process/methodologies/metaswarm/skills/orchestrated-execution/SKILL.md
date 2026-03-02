---
name: orchestrated-execution
description: Execute work units through the rigorous 4-phase Metaswarm cycle (Implement -> Validate -> Adversarial Review -> Commit) with independent quality gate enforcement.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Orchestrated Execution

## Overview

Execute work units through the Metaswarm 4-phase cycle. Quality gates are blocking state transitions. Adversarial reviews use fresh reviewers with binary PASS/FAIL verdicts.

## When to Use

- Implementing work units from an approved plan
- Executing tasks requiring rigorous quality enforcement
- When TDD compliance must be verified independently

## Process

1. **IMPLEMENT** - Coder executes via TDD against spec with DoD items
2. **VALIDATE** - Orchestrator independently runs tsc, eslint, vitest (never trusts subagent)
3. **ADVERSARIAL REVIEW** - Fresh reviewer checks spec compliance: binary PASS/FAIL with evidence
4. **COMMIT** - Only after adversarial PASS, within declared file scope

## Anti-Patterns (Enforced)

- Self-certifying (trusting subagent "tests passed" claims)
- Combining phases into single steps
- Reusing reviewers after FAIL
- Passing previous review findings to new reviewers
- Treating quality gate failures as advisory

## Agents Used

- `agents/coder/` - TDD implementation
- `agents/code-reviewer/` - Fresh adversarial review
- `agents/issue-orchestrator/` - Independent validation

## Tool Use

Invoke via babysitter process: `methodologies/metaswarm/metaswarm-execution-loop`
