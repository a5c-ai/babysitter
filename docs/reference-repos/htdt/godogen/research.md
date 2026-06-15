# htdt/godogen

- **Archetype**: domain-skill-pack
- **Stars**: 2,762
- **Last pushed**: 2026-04-11
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 3

## Summary

Claude Code skills for building complete Godot 4 games from natural language descriptions. Ships 3 skills: `godogen` (main orchestrator), `godot-api` (C# Godot syntax reference), and `visual-qa` (visual quality assurance via screenshots). The orchestrator implements a sophisticated pipeline: visual target generation -> task DAG decomposition -> architecture scaffolding -> asset planning/generation -> task execution -> scene generation -> testing -> capture -> visual QA -> optional Android build. Uses a modular sub-file system where each pipeline stage has its own instruction file loaded on demand.

## Assessment

High value as a domain specialization exemplar. The pipeline architecture is the most sophisticated orchestration pattern seen in a skill repo -- a full DAG-based task decomposition with resume support (checks for existing PLAN.md), lazy sub-skill loading, and visual verification loop. The orchestrator pattern (reading sub-files from `${CLAUDE_SKILL_DIR}/` on demand) is a reusable pattern for complex multi-stage processes. Game development is a legitimate domain specialization.

## Extraction Priority
- High
- Rationale: Exceptional orchestration architecture. The DAG decomposition pipeline, resume/checkpoint support, and visual QA verification loop are directly transferable as process patterns. The game development domain itself maps to `specializations/game-dev/`.

## Processes

### 1. Game Generation Pipeline
- **Source skills**: godogen orchestrator
- **Placement**: `specializations/game-dev/godot-game-generation.js`
- **Description**: End-to-end game generation: requirement analysis -> visual target -> task DAG decomposition -> scaffold -> asset planning -> iterative task execution -> scene assembly -> test harness -> visual QA verification -> build.

### 2. Visual QA Verification Loop
- **Source skills**: visual-qa, capture
- **Placement**: `specializations/shared/visual-qa-verification.js`
- **Description**: Generic visual verification process: capture screenshot -> compare against visual target -> identify discrepancies -> generate fix tasks -> iterate until visual match. Applicable beyond game dev.

### 3. Task DAG Decomposition
- **Source skills**: godogen decomposer
- **Placement**: `methodologies/task-dag-decomposition.js`
- **Description**: Decompose a high-level goal into a directed acyclic graph of implementation tasks with dependencies, then execute in topological order. Generic pattern applicable to any complex build process.

## Plugin Ideas

- **Visual QA plugin**: Screenshot capture and comparison as a babysitter task type for visual regression testing. Category: QA & testing.
- **Godot Integration plugin**: Godot project scaffolding, scene generation, and build automation as babysitter tasks. Category: tools integration.

## Patterns

- Orchestrator skill with lazy sub-file loading (`${CLAUDE_SKILL_DIR}/` pattern)
- DAG-based task decomposition with topological execution ordering
- Resume/checkpoint support via plan file detection (PLAN.md, STRUCTURE.md, MEMORY.md)
- Visual target -> implementation -> visual QA feedback loop
- Pipeline stage table documenting when to read each sub-skill file
- Asset budget planning as a separate pipeline stage

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Game Generation Pipeline | NEW | End-to-end Godot game creation from natural language requirements | - | specializations/creative/godot-game-generation.js |
| Visual QA Verification Loop | NEW | Screenshot capture and comparison for visual regression testing | - | specializations/shared/visual-qa-verification.js |
| Task DAG Decomposition | NEW | Break high-level goals into DAG of implementation tasks with dependencies | - | methodologies/task-dag-decomposition/ |
| Lazy Sub-File Loading Pattern | NEW | Orchestrator pattern with on-demand loading of stage-specific instructions | - | specializations/shared/lazy-sub-file-loading.js |
| Resume/Checkpoint Support | NEW | Process resumability via plan file detection and state recovery | - | specializations/shared/resume-checkpoint-support.js |
| Asset Budget Planning | NEW | Resource planning and asset generation budgeting for creative projects | - | specializations/creative/asset-budget-planning.js |
| Game Architecture Scaffolding | NEW | Godot project structure and scene hierarchy generation | - | specializations/creative/game-architecture-scaffolding.js |
| Visual Target Implementation Loop | NEW | Visual reference → implementation → QA verification feedback cycle | - | specializations/shared/visual-target-implementation-loop.js |
| Multi-Stage Pipeline Orchestration | NEW | Complex pipeline with stage documentation and execution ordering | - | specializations/shared/multi-stage-pipeline-orchestration.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Godot Integration | NEW | Godot CLI tools integration for project scaffolding and build automation | - | plugins/a5c/marketplace/blueprints/godot-integration/ |
| Screenshot QA Integration | NEW | Visual regression testing via screenshot capture and comparison tools | - | plugins/a5c/marketplace/blueprints/screenshot-qa-integration/ |
