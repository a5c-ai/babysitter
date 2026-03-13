---
name: planning-design
description: Design technical architecture, select technology stack, and define implementation strategy from specifications and constitution constraints.
allowed-tools: Read, Bash, Grep, Glob, WebFetch, WebSearch, Agent, AskUserQuestion
---

# Planning Design

## Overview

Convert a specification into a concrete technical plan with architecture decisions, technology selections, implementation strategy, and risk assessment. All decisions must trace back to specification requirements and comply with constitution constraints.

## When to Use

- After specification is approved, before task decomposition
- When evaluating technology stack options for a feature
- When designing system architecture for new components
- When assessing implementation risks and defining mitigations

## Key Principle

Architecture decisions must be traceable to specification requirements. Technology choices must comply with constitution constraints. Trade-offs must be documented for every significant decision.

## Process

1. **Assess technology stack** - Evaluate options against constitution requirements
2. **Design architecture** - Components, interfaces, data model, integration points
3. **Define strategy** - Phases, milestones, testing strategy, deployment approach
4. **Assess risks** - Identify risks and define mitigations
5. **Human review** - Approve architecture and strategy before task breakdown

## Tool Use

Invoke via babysitter process: `methodologies/spec-kit/spec-kit-planning`
Full pipeline: `methodologies/spec-kit/spec-kit-orchestrator`
