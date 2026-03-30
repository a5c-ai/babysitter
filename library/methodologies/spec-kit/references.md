# Spec Kit References and Attribution

## Primary Source

- **Repository**: [https://github.com/github/spec-kit](https://github.com/github/spec-kit)
- **Author**: GitHub
- **Description**: Spec-Driven Development where specifications define what before how, with multi-step refinement rather than one-shot generation

## Concepts Adapted

The following Spec Kit concepts have been adapted into babysitter process definitions:

### Core Workflow Phases
- **Constitution** (/speckit.constitution) -> constitution tasks in `spec-kit-orchestrator.js`, `spec-kit-specification.js`
- **Specification** (/speckit.specify) -> specification tasks in `spec-kit-specification.js`
- **Clarification** (/speckit.clarify) -> clarification tasks in `spec-kit-specification.js`
- **Planning** (/speckit.plan) -> planning tasks in `spec-kit-planning.js`
- **Task Breakdown** (/speckit.tasks) -> decomposition tasks in `spec-kit-planning.js`
- **Implementation** (/speckit.implement) -> execution tasks in `spec-kit-implementation.js`

### Quality Gates (mapped to process steps)
- `/speckit.analyze` -> `spec-kit-plan-analyze-consistency` task in `spec-kit-planning.js`
- `/speckit.checklist` -> `spec-kit-impl-quality-checklist` task in `spec-kit-implementation.js`

### Agents (mapped to agent definitions)
- **constitution-architect** -> `agents/constitution-architect/` (governing principles establishment)
- **specification-writer** -> `agents/specification-writer/` (requirements and user stories)
- **technical-planner** -> `agents/technical-planner/` (architecture and tech stack design)
- **task-analyst** -> `agents/task-analyst/` (task decomposition and dependency analysis)
- **implementation-engineer** -> `agents/implementation-engineer/` (code generation and execution)
- **consistency-analyzer** -> `agents/consistency-analyzer/` (cross-artifact consistency analysis)
- **quality-auditor** -> `agents/quality-auditor/` (checklist validation and scoring)

### Skills (mapped to skill definitions)
- **constitution-creation** -> `skills/constitution-creation/` (project governance)
- **specification-writing** -> `skills/specification-writing/` (requirements elicitation)
- **planning-design** -> `skills/planning-design/` (technical architecture)
- **task-decomposition** -> `skills/task-decomposition/` (plan-to-tasks conversion)
- **implementation-execution** -> `skills/implementation-execution/` (task execution)
- **cross-artifact-analysis** -> `skills/cross-artifact-analysis/` (consistency assessment)
- **quality-checklist** -> `skills/quality-checklist/` (validation checklists)

### Key Concepts
- **Progressive Refinement Pipeline**: Intent -> spec -> plan -> tasks -> code
- **Technology Independence**: Works across any tech stack
- **Specifications as First-Class Artifacts**: Specs govern the entire pipeline
- **Multi-Mode Support**: Greenfield, brownfield, creative
- **Feature-Based Organization**: SPECIFY_FEATURE env var for scoping
- **Quality Gates**: analyze (pre-implementation) and checklist (post-implementation)
- **CLI Integration**: `specify init`, `specify check`
- **AI Agent Compatibility**: Supports 18+ AI agents including Claude, Gemini, Copilot, Cursor

### Upstream Commands (mapped to process phases)
- `specify init` -> constitution establishment phase
- `/speckit.constitution` -> `spec-kit-spec-draft-constitution` task
- `/speckit.specify` -> `spec-kit-spec-elicit-requirements` + `spec-kit-spec-write-stories` tasks
- `/speckit.clarify` -> `spec-kit-spec-identify-gaps` + `spec-kit-spec-resolve-gaps` tasks
- `/speckit.plan` -> `spec-kit-plan-design-architecture` + `spec-kit-plan-strategy` tasks
- `/speckit.tasks` -> `spec-kit-plan-decompose` task
- `/speckit.analyze` -> `spec-kit-plan-analyze-consistency` task
- `/speckit.implement` -> `spec-kit-impl-execute-task` loop
- `/speckit.checklist` -> `spec-kit-impl-quality-checklist` task

## Acknowledgment

This adaptation brings GitHub's Spec Kit Spec-Driven Development methodology into the babysitter process system. All credit for the original concepts, workflow design, and methodology belongs to GitHub and the Spec Kit project contributors. The original repository is available at https://github.com/github/spec-kit.
