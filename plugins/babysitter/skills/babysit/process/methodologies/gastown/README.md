# Gas Town Methodology

**Source**: [steveyegge/gastown](https://github.com/steveyegge/gastown) by Steve Yegge
**Category**: Multi-Agent Orchestration / AI-Driven Software Development
**License**: See upstream repository

## Overview

Gas Town is a multi-agent orchestration framework for AI-driven software development. It provides infrastructure roles (Mayor, Deacon, Witness, Refinery), worker roles (Crew, Polecats, Dogs), and a git-backed work unit system (Beads, Convoys, Molecules) for coordinating parallel agent execution with persistent attribution.

## Core Principles

- **GUPP** (Gas Town Universal Propulsion Principle): "If there is work on your Hook, YOU MUST RUN IT"
- **MEOW** (Molecular Expression of Work): Breaking goals into trackable atomic units
- **NDI** (Nondeterministic Idempotence): Ensuring useful outcomes through orchestration of unreliable processes

## Process Files

| Process | File | Description | Task Count |
|---------|------|-------------|------------|
| Mayor Orchestrator | `gastown-orchestrator.js` | Global coordinator: convoys, agents, monitoring | 8 |
| Patrol Monitoring | `gastown-patrol.js` | Deacon/Witness health checks and recovery | 4 |
| Convoy Lifecycle | `gastown-convoy.js` | Create, assign, track, and land convoys | 6 |
| Molecule Workflow | `gastown-molecule.js` | Formula -> Protomolecule -> Molecule execution | 6 |
| Merge Queue | `gastown-merge-queue.js` | Refinery conflict resolution and integration | 5 |

## Skills Catalog

| Skill | Directory | Description |
|-------|-----------|-------------|
| convoy-management | `skills/convoy-management/` | Convoy lifecycle: create, track, land |
| work-decomposition | `skills/work-decomposition/` | MEOW decomposition into beads and wisps |
| agent-coordination | `skills/agent-coordination/` | Crew/Polecat assignment and hook management |
| merge-queue | `skills/merge-queue/` | Refinery conflict resolution and merge |
| patrol-monitoring | `skills/patrol-monitoring/` | Deacon/Witness health and recovery |
| formula-authoring | `skills/formula-authoring/` | TOML Formula -> Protomolecule -> Molecule |
| issue-tracking | `skills/issue-tracking/` | Bead lifecycle and attribution tracking |
| session-management | `skills/session-management/` | Agent session init, handoff, seance |

## Agents Catalog

| Agent | Directory | Role |
|-------|-----------|------|
| mayor | `agents/mayor/` | Global Coordinator |
| deacon | `agents/deacon/` | System Supervisor |
| witness | `agents/witness/` | Rig Lifecycle Manager |
| refinery | `agents/refinery/` | Merge Queue Processor |
| polecat | `agents/polecat/` | Task Worker (transient) |
| crew-lead | `agents/crew-lead/` | Persistent Collaborator |

## Workflow Lifecycle

```
Mayor analyzes goal -> MEOW decomposition -> Convoy creation -> Agent assignment -> Execution (GUPP) -> Patrol monitoring -> Refinery merge -> Landing
```

Cross-cutting concerns applied throughout:
- `patrol-monitoring` - Continuous health checks via Deacon
- `merge-queue` - Refinery processes all agent work
- `issue-tracking` - All beads carry persistent attribution
- `session-management` - Agent lifecycle across sessions

## Work Unit Hierarchy

```
Goal -> MEOWs -> Convoy (work order) -> Beads (git-backed tasks) + Wisps (ephemeral)
                                    |
                                    +-> Formula -> Protomolecule -> Molecule (durable workflow)
```

## Philosophy

- **GUPP enforcement** - Work on hooks must be executed, no exceptions
- **Persistent attribution** - All work tracked for agent evaluation and A/B testing
- **Durable workflows** - Molecules survive restarts via checkpointing
- **NDI resilience** - Useful outcomes despite unreliable individual processes
- **Three-tier hooks** - Base -> Role -> Rig+Role hierarchy for configuration
