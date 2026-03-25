# AutoMaker

**Source:** [AutoMaker](https://github.com/AutoMaker-Org/automaker) by AutoMaker-Org
**Category:** Autonomous AI Development Studio
**Priority:** High

## Overview

AutoMaker is an autonomous AI development studio that transforms software building: describe features on a Kanban board and AI agents implement them using Claude Agent SDK. It features git worktree isolation for safe parallel development, streaming UI updates, multi-agent task execution, and integrated test automation with Vitest and Playwright.

Unlike traditional development tools, AutoMaker positions AI agents as autonomous implementers that work in isolated branches, write code, run tests, and submit changes for human review before merge. The Kanban board metaphor provides intuitive project management while agents handle implementation details.

## Key Features

- **Kanban-Based Workflow** with feature cards moving through Backlog, Ready, In Progress, Review, Done
- **Git Worktree Isolation** ensuring agents work safely in separate branches
- **Multi-Agent Parallel Execution** with configurable concurrency limits
- **Streaming Progress Updates** showing real-time agent activity
- **Integrated Test Automation** with Vitest (unit) and Playwright (E2E)
- **Code Review Gates** with configurable approval policies
- **Convergence Loops** for automatic test failure resolution
- **Build & Deploy Pipeline** with release notes generation

## Process Files

| File | Description | Primary Agents |
|------|-------------|----------------|
| `automaker-orchestrator.js` | Full lifecycle (all 5 phases) | All agents |
| `automaker-feature-pipeline.js` | Feature intake, decomposition, dispatch | Feature Planner |
| `automaker-agent-execution.js` | Single-feature execution with worktree | Code Generator, Test Runner, Worktree Manager |
| `automaker-review-ship.js` | Review, merge, deploy, release | Code Reviewer, Deployment Engineer |

## Agent Personas

| Agent | Role | ID |
|-------|------|----|
| Feature Planner | Feature Decomposition & Planning | `automaker-feature-planner` |
| Code Generator | Implementation & Fixes | `automaker-code-generator` |
| Test Runner | Test Execution & Analysis | `automaker-test-runner` |
| Code Reviewer | Quality Review & Gates | `automaker-code-reviewer` |
| Worktree Manager | Branch Isolation & Merges | `automaker-worktree-manager` |
| Progress Streamer | Real-time UI Updates | `automaker-progress-streamer` |
| Deployment Engineer | Build, Deploy & Release | `automaker-deployment-engineer` |

## Skills

| Skill | Description | Agent |
|-------|-------------|-------|
| feature-intake | Parse features from text, images, screenshots | Feature Planner |
| agent-dispatch | Batch and dispatch features to execution agents | Feature Planner |
| worktree-isolation | Git worktree lifecycle management | Worktree Manager |
| streaming-progress | Real-time progress streaming to UI | Progress Streamer |
| test-automation | Vitest and Playwright test execution | Test Runner |
| code-review-gate | Code review with quality thresholds | Code Reviewer |
| kanban-management | Kanban board state management | Feature Planner |

## Tech Stack (from source project)

- **Frontend:** React, Vite, Electron (desktop app)
- **Backend:** Express.js server
- **Testing:** Playwright (E2E), Vitest (unit)
- **Monorepo** with shared packages
- **Claude Agent SDK** for agent orchestration

## Usage

```bash
# Full lifecycle - orchestrate features from intake to deployment
babysitter run:create --process methodologies/automaker/automaker-orchestrator --input examples/multi-feature-sprint.json

# Feature pipeline only - decompose and prioritize features
babysitter run:create --process methodologies/automaker/automaker-feature-pipeline --input examples/feature-batch.json

# Single feature execution - implement one feature in isolation
babysitter run:create --process methodologies/automaker/automaker-agent-execution --input examples/single-feature.json

# Review and ship - review, merge, and deploy completed features
babysitter run:create --process methodologies/automaker/automaker-review-ship --input examples/review-and-deploy.json
```
