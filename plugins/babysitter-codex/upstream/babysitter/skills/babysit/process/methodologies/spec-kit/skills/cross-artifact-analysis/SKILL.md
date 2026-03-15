---
name: cross-artifact-analysis
description: Perform cross-artifact consistency and coverage analysis across constitution, specification, plan, and task artifacts to detect gaps, conflicts, and misalignments before implementation.
allowed-tools: Read, Bash, Grep, Glob, Agent, AskUserQuestion
---

# Cross-Artifact Analysis

## Overview

Analyze all pipeline artifacts (constitution, specification, plan, tasks) for consistency, coverage, and alignment. This is the pre-implementation quality gate that ensures all artifacts are coherent before code is written.

## When to Use

- After task decomposition, before implementation
- When verifying that all specification requirements have corresponding tasks
- When checking for contradictions between constitution and plan
- When assessing readiness for the implementation phase

## Key Principle

Every specification requirement must be traceable through the plan to at least one task. No artifact should contradict another. Coverage gaps and conflicts must be resolved before implementation.

## Process

1. **Build traceability matrix** - Map requirements -> plan components -> tasks
2. **Detect coverage gaps** - Requirements without corresponding tasks
3. **Identify conflicts** - Contradictory constraints or requirements across artifacts
4. **Verify constitution compliance** - Plan and tasks comply with governance
5. **Check acceptance criteria** - Task criteria match specification requirements
6. **Score consistency** - Numeric score (0-100) across dimensions
7. **Determine readiness** - Boolean assessment for implementation phase
8. **Human review** - Approve analysis results before proceeding

## Tool Use

Invoke via babysitter process: `methodologies/spec-kit/spec-kit-planning` (analysis phase)
Full pipeline: `methodologies/spec-kit/spec-kit-orchestrator`
