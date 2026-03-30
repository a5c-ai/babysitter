# BMAD Method

**Source:** [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) by BMad Code Org
**Category:** AI-Driven Agile Development Framework
**Priority:** High

## Overview

The BMAD Method is an AI-driven agile development framework with specialized agent personas and structured workflows guiding developers through the complete project lifecycle from brainstorming to deployment. It features 10 agent personas and 4 lifecycle phases with adaptive scaling based on project complexity.

Unlike traditional AI tools, BMAD positions AI agents as expert collaborators who guide structured processes rather than making decisions independently. The framework emphasizes partnership between humans and AI throughout development.

## Key Features

- **10 Specialized Agent Personas** with distinct expertise domains
- **4 Lifecycle Phases** (Analysis, Planning, Solutioning, Implementation)
- **Adaptive Scaling** adjusting depth based on project complexity
- **Party Mode** for multi-agent collaborative decision-making
- **Quick Flow** lean solo-developer alternative
- **Course Correction** mid-sprint quality issue handling

## Process Files

| File | Description | Primary Agents |
|------|-------------|----------------|
| `bmad-orchestrator.js` | Full lifecycle (all 4 phases) | All agents |
| `bmad-quick-flow.js` | Lean solo-developer workflow | Barry (Solo Dev) |
| `bmad-analysis.js` | Standalone analysis phase | Mary (Analyst) |
| `bmad-implementation.js` | Standalone implementation sprints | Bob, Amelia, Quinn |
| `bmad-party-mode.js` | Multi-agent collaboration | All agents |
| `bmad-document-project.js` | Project documentation generation | Paige (Tech Writer) |

## Agent Personas

| Agent | Name | Role | ID |
|-------|------|------|----|
| BMad Master | - | Orchestrator + Validator | `bmad-master` |
| Analyst | Mary | Strategic Business Analyst | `bmad-analyst-mary` |
| Product Manager | John | PRD + Requirements Expert | `bmad-pm-john` |
| Architect | Winston | System Architecture + Tech Design | `bmad-architect-winston` |
| Scrum Master | Bob | Sprint Planning + Agile Ceremonies | `bmad-sm-bob` |
| Developer | Amelia | TDD Implementation + Code Review | `bmad-dev-amelia` |
| QA Engineer | Quinn | Test Automation + Quality Gates | `bmad-qa-quinn` |
| UX Designer | Sally | User Experience + Interaction Design | `bmad-ux-sally` |
| Tech Writer | Paige | Documentation + Knowledge Curation | `bmad-writer-paige` |
| Solo Dev | Barry | Quick Flow Full-Stack Developer | `bmad-solodev-barry` |

## Skills

| Skill | Description | Agent |
|-------|-------------|-------|
| Product Brief Creation | Research and product brief synthesis | Mary |
| PRD Creation | Requirements document through structured discovery | John |
| Architecture Design | System design with ADRs | Winston |
| Sprint Planning | Story selection and sprint goal definition | Bob |
| Story Development | TDD implementation | Amelia |
| Code Review | Multi-dimensional quality review | Amelia / Barry |
| UX Design | User flows, wireframes, design systems | Sally |
| QA Testing | API/E2E test automation and quality gates | Quinn |
| Project Documentation | Source tree analysis and documentation | Paige |
| Quick Flow | Lean spec-to-implementation | Barry |

## Lifecycle Phases

### Phase 1: Analysis
Mary (Analyst) conducts market, domain, and technical research to create an evidence-based product brief. Research depth scales with project complexity.

### Phase 2: Planning
John (PM) creates the PRD through structured discovery. Sally (UX Designer) creates user flows and wireframes. BMad Master validates PRD completeness.

### Phase 3: Solutioning
Winston (Architect) designs system architecture with ADRs. Bob (SM) creates implementation-ready epics and stories. Winston validates implementation readiness.

### Phase 4: Implementation
Bob (SM) plans sprints. Amelia (Dev) implements stories with TDD. Quinn (QA) runs automated tests. Bob facilitates retrospectives. Course corrections triggered by quality issues.

### Documentation (Final)
Paige (Tech Writer) generates comprehensive project documentation from all lifecycle artifacts.

## Complexity Scaling

| Level | Analysis | Planning | Solutioning | Implementation |
|-------|----------|----------|-------------|----------------|
| Small | Shallow research | Lean PRD | Basic architecture | 1-2 sprints |
| Medium | Standard research | Full PRD + UX | Full architecture + ADRs | 2-3 sprints |
| Large | Deep research | Full PRD + UX + validation | Full + readiness check | 3-5 sprints |
| Enterprise | Deep + multi-stream | Full + compliance | Full + security review | 5+ sprints |

## Examples

See `examples/` directory for JSON input files covering various project types and complexity levels.
