---
name: spec-creation
description: Feature specification creation from codebase research. Produces requirements, acceptance criteria, architecture decisions, implementation plans, and risk analysis.
allowed-tools: Read, Bash, Grep, Glob
---

# Spec Creation

## Overview

Creates comprehensive feature specifications by first deeply researching the codebase, then generating structured specifications with requirements, acceptance criteria, architecture decisions, and phased implementation plans.

## Research Phase

- Analyze project structure and module organization
- Identify existing patterns and conventions
- Map dependencies and integration points
- Review existing tests for testing patterns
- Document technical constraints

## Specification Components

### Scope and Non-Goals
Clear boundaries on what the feature does and does not include.

### Functional Requirements
Detailed requirements with unique identifiers for tracking.

### Acceptance Criteria
Testable, measurable criteria for each requirement.

### Architecture Decisions
Decision records with rationale and alternatives considered.

### Implementation Plan
Phased approach ordered by dependency, not priority.

### Risk Analysis
Identified risks with probability, impact, and mitigation strategies.

### API Contracts and Data Models
Interface definitions and data model schemas.

### Test Strategy
Mapping of unit, integration, and E2E tests to requirements.

## Output

Specifications are saved to `docs/specs/{feature}.md` for reference by the execution workflow.

## When to Use

- `/spec:create [feature]` slash command
- Before starting a new feature implementation
- When planning complex multi-module changes

## Processes Used By

- `claudekit-spec-workflow` (create mode)
