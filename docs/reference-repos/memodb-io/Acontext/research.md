# memodb-io/Acontext

- **Archetype**: context-platform
- **Stars**: 3,314
- **Last pushed**: 2026-04-11
- **License**: Apache-2.0
- **Discovered**: 2026-04-12
- **Skills found**: 3

## Summary

A TypeScript/Go platform providing "Agent Skills as a Memory Layer." Acontext positions agent skills as persistent, self-evolving context that learns from usage. Includes a Go backend API, landing page, and skill template system. The 3 SKILL.md files are templates (daily-logs, user-general-facts) and a landing page skill. Topics emphasize context engineering, self-learning, agent observability, and LLMOps. The platform treats skills as living documents that accumulate knowledge over time.

## Assessment

High conceptual value. The "skills as memory" paradigm aligns well with babysitter's event-sourced model -- skills that evolve based on run history. The daily-logs skill template demonstrates a structured journaling pattern (one file per day, append-only entries) that maps to babysitter's journal model. The user-general-facts template shows how to maintain persistent user context. The self-evolving skill concept could inform how babysitter processes adapt based on retrospective feedback.

## Extraction Priority
- Medium
- Rationale: The platform architecture (Go backend, context data platform) is not directly extractable, but the skill-as-memory pattern and skill templates are conceptually valuable. The daily-logs and user-general-facts templates could inform babysitter context/memory plugins.

## Processes

### 1. Self-Evolving Process Template
- **Source skills**: daily-logs template, self-learning concept
- **Placement**: `methodologies/self-evolving-process.js`
- **Description**: Meta-process that wraps any process with a learning loop: execute -> log outcomes -> extract patterns -> update process heuristics for next run.

### 2. Context Accumulation Workflow
- **Source skills**: daily-logs, user-general-facts
- **Placement**: `specializations/shared/context-accumulation.js`
- **Description**: Structured context building process: daily activity logging -> fact extraction -> profile building -> context injection for subsequent runs.

## Plugin Ideas

- **Memory Layer plugin**: Persistent skill-scoped memory that accumulates context across runs (daily logs, learned facts, user preferences). Category: context & memory.
- **Self-Evolving Skills plugin**: Track skill effectiveness across runs and auto-suggest skill refinements based on outcome patterns. Category: knowledge management.

## Patterns

- Skills as persistent memory (not just instructions, but accumulating knowledge)
- Daily-log skill template: one file per day, append-only, ISO date naming
- Third-person user references in logs ("The user requested X") for objectivity
- Skill templates shipped with the platform as starting points

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Self-Evolving Process Template | NEW | Meta-process that wraps any process with learning loop and outcome-based adaptation | - | methodologies/self-evolving-process/ |
| Context Accumulation Workflow | NEW | Structured context building with daily logging and fact extraction | - | specializations/shared/context-accumulation-workflow.js |
| Daily Activity Logging Process | NEW | Structured daily logging with append-only entries and ISO date naming | - | specializations/shared/daily-activity-logging.js |
| User Profile Building | NEW | Fact extraction and user context profile generation from activity logs | - | specializations/shared/user-profile-building.js |
| Skills-as-Memory Pattern | NEW | Persistent skill-scoped memory accumulation across multiple runs | - | specializations/shared/skills-as-memory-pattern.js |
| Skill Template Management | NEW | Template system for bootstrapping new skills with learning capabilities | - | specializations/shared/skill-template-management.js |
| Process Heuristic Adaptation | NEW | Extract patterns from process outcomes to improve future executions | - | specializations/shared/process-heuristic-adaptation.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Memory Layer | NEW | Persistent skill-scoped memory that accumulates context across runs | claude-mem | plugins/a5c/marketplace/blueprints/memory-layer/ |
| Self-Evolving Skills Tracker | NEW | Track skill effectiveness and suggest refinements based on outcome patterns | - | plugins/a5c/marketplace/blueprints/self-evolving-skills-tracker/ |
