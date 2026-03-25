# Maestro App Factory

**Source:** [Maestro](https://github.com/SnapdragonPartners/maestro) by SnapdragonPartners
**Category:** Multi-Agent App Factory Framework
**License:** MIT
**Priority:** High

## Overview

Maestro orchestrates AI agents mimicking high-performing human dev teams for production-ready applications. It features three core agent roles (Product Manager, Architect, Coders) with strict separation of concerns: PMs gather requirements, Architects design and review, Coders implement and test. Code review separation is enforced -- architects never write code, coders never self-review.

## Key Features

- **Multi-Agent Roles** with strict responsibility separation
- **Operating Modes**: Bootstrap, Development, Hotfix, Maintenance
- **Knowledge Graph** (`.maestro/knowledge.dot`) for institutional memory
- **Quality Gates** with DRY, YAGNI, abstraction, coverage enforcement
- **Parallel Coder Dispatch** with stateless coder lifecycle
- **Metrics Dashboard** for tokens, time, quality, and costs
- **Maintenance Mode** triggered after N specs for tech debt management

## Process Files

| File | Description | Primary Agents |
|------|-------------|----------------|
| `maestro-orchestrator.js` | Full lifecycle (PM interview through merge) | All agents |
| `maestro-bootstrap.js` | New project scaffold and setup | Architect, Coder |
| `maestro-development.js` | Feature development cycle | Architect, Coder, Test Engineer |
| `maestro-hotfix.js` | Fast-path production fixes | Hotfix Specialist, Architect |
| `maestro-maintenance.js` | Technical debt management | Maintenance Engineer, Knowledge Curator |
| `maestro-knowledge-graph.js` | Knowledge capture, validation, sync | Knowledge Curator |

## Agent Personas

| Agent | Role | ID |
|-------|------|----|
| Product Manager | Requirements elicitation and specification | `product-manager` |
| Architect | Technical design, stories, code oversight, merge | `architect` |
| Coder | Implementation, testing, PR submission | `coder` |
| Code Reviewer | Independent quality verification | `code-reviewer` |
| Knowledge Curator | Knowledge graph maintenance | `knowledge-curator` |
| Maintenance Engineer | Technical debt management | `maintenance-engineer` |
| Hotfix Specialist | Rapid triage and fix | `hotfix-specialist` |
| Test Engineer | Test strategy and coverage | `test-engineer` |

## Skills

| Skill | Description | Agent |
|-------|-------------|-------|
| Requirements Interview | Expertise-adaptive PM interview | Product Manager |
| Specification Generation | Requirements to tech spec | PM + Architect |
| Story Decomposition | Spec to implementable stories | Architect |
| Code Review Gate | Principle enforcement review | Architect / Code Reviewer |
| Knowledge Graph Management | Pattern capture, validation, query | Knowledge Curator |
| Maintenance Orchestration | Tech debt management | Maintenance Engineer |
| Hotfix Triage | Issue classification and routing | Hotfix Specialist |
| Test Enforcement | Test validation and coverage | Test Engineer |

## Operating Modes

### Bootstrap
New project minimum infrastructure: scaffold directories, configure tooling, install dependencies, define initial architecture, initialize knowledge graph.

### Development (Default)
Feature development: story planning, parallel coder implementation, automated testing, architect code review, merge. Coders terminate between story batches.

### Hotfix
Fast-path for urgent production issues: triage, locate root cause, minimal fix, regression test, expedited review, deploy. Simple fixes skip planning.

### Maintenance
Technical debt management after every N specs: branch cleanup, knowledge sync, doc verification, TODO scanning, coverage analysis, dependency audit.

## Quality Principles

1. **DRY** - No unnecessary duplication
2. **YAGNI** - No speculative features
3. **Proper Abstraction** - Correct encapsulation
4. **Test Coverage** - Adequate automated tests
5. **Separation of Concerns** - Architects review, coders implement

## Attribution

Adapted from [Maestro App Factory](https://github.com/SnapdragonPartners/maestro) by SnapdragonPartners. Licensed under MIT.
