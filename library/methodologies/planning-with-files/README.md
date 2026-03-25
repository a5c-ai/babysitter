# Planning with Files

**Source:** [Planning with Files](https://github.com/OthmanAdi/planning-with-files) by OthmanAdi
**Category:** Persistent Markdown-Based Planning (Context Engineering)
**Priority:** High

## Overview

Planning with Files is a persistent markdown-based planning methodology inspired by Manus AI's context engineering patterns. It treats the filesystem as extended memory for volatile agent workflows, solving the fundamental problem that agent context windows are ephemeral while file systems are persistent.

Central Principle: "Context Window = RAM (volatile); Filesystem = Disk (persistent)"

## Key Features

- **Three-File Pattern** (task_plan.md, findings.md, progress.md) for structured persistence
- **5 Manus Principles** (Filesystem as Memory, Attention Manipulation, Error Persistence, Goal Tracking, Completion Verification)
- **2-Action Rule** for systematic findings capture
- **Session Recovery** across context window resets
- **Quality-Gated Convergence** with weighted scoring
- **Never Repeat Failures** with error pattern detection and approach mutations

## Process Files

| File | Description | Primary Agents |
|------|-------------|----------------|
| `planning-orchestrator.js` | Full lifecycle (plan, execute, verify) | All agents |
| `planning-session.js` | Session lifecycle management | Session Manager, Plan Architect |
| `planning-execution.js` | Task execution with 2-action rule | Execution Monitor, Error Analyst, Findings Curator |
| `planning-verification.js` | Completion verification and scoring | Completion Verifier, all analysis agents |

## Agent Personas

| Agent | Role | ID |
|-------|------|----|
| Plan Architect | Plan Structure Design | `pwf-plan-architect` |
| Execution Monitor | Task Execution Oversight | `pwf-execution-monitor` |
| Findings Curator | Research & Discovery Management | `pwf-findings-curator` |
| Error Analyst | Error Analysis & Pattern Detection | `pwf-error-analyst` |
| Session Manager | Session Lifecycle Management | `pwf-session-manager` |
| Completion Verifier | Phase Completion Verification | `pwf-completion-verifier` |

## Skills

| Skill | Description | Agent |
|-------|-------------|-------|
| Plan Creation | Structured task_plan.md generation | Plan Architect |
| Findings Capture | Research persistence with 2-Action Rule | Findings Curator |
| Progress Tracking | Session logs and phase status | Execution Monitor |
| Error Logging | Error persistence and pattern detection | Error Analyst |
| Session Recovery | Context recovery across resets | Session Manager |
| Completion Verification | Weighted quality scoring | Completion Verifier |

## Three-File Pattern

### task_plan.md
The plan file contains phases, goals, and progress checkboxes. It is created first (Rule 1: never start without a plan) and serves as the primary source of truth for what needs to be done.

### findings.md
The findings file captures research, discoveries, and decision rationale. Updated via the 2-Action Rule (save findings after every 2 view/browser operations) to ensure nothing is lost.

### progress.md
The progress file maintains session logs, test results, and error records. It supports session recovery by preserving timestamps and session identifiers.

## 5 Manus Principles

1. **Filesystem as Memory** - Store in files, not context window
2. **Attention Manipulation** - Re-read plan before every decision
3. **Error Persistence** - Log all failures in progress file
4. **Goal Tracking** - Checkboxes show progress at a glance
5. **Completion Verification** - Verify all phases before exit

## Quality Scoring

| Component | Weight | Measurement |
|-----------|--------|-------------|
| Phase Completion | 40% | Checked goals / total goals |
| Error Resolution | 25% | Resolved errors / total errors |
| Findings Coverage | 20% | Phases with findings / total phases |
| Progress Continuity | 15% | Sessions without gaps / total sessions |

## Examples

See `examples/` directory for JSON input files covering various task types and configurations.
