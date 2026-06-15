# alirezarezvani/claude-code-skill-factory

- **Archetype**: meta-tooling
- **Stars**: 686
- **Last pushed**: 2025-11-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 14

## Summary
A toolkit for building and deploying production-ready Claude Skills, Code Agents, custom Slash Commands, and LLM Prompts at scale. Includes a skill generator that produces structured skill templates. The generated-skills/ directory contains 14 example skills spanning agent factories, app store optimization, AWS architecture, content research, hook factories, prompt factories, scrum mastering, social media analysis, TDD guidance, and tech stack evaluation.

## Assessment
MEDIUM VALUE. The meta-tooling aspect (generating skills) is interesting but largely superseded by babysitter's own plugin-dev:create-plugin and skill-development skills. The generated skills themselves are formulaic -- the TDD guide is comprehensive but generic, the agent-factory and hook-factory are Claude Code plugin scaffolding tools. The value lies in studying how a skill factory structures its output templates and what domains it considers worth generating skills for. The repo is notably older (last pushed Nov 2025), suggesting it may be from an earlier generation of Claude Code skill development.

## Extraction Priority
- Low
- Rationale: Meta-tooling that babysitter already provides natively via plugin-dev skills. The generated skills are template-quality, not expert-quality. The repo predates current skill conventions and may use outdated patterns. The domain coverage (14 generated skills) provides a useful survey of "what people want skills for" but the skills themselves lack the depth of purpose-built alternatives.

## Processes
- **Skill Template Generation**: Analyze user requirements -> select skill archetype -> generate SKILL.md with frontmatter + workflow + reference sections -> scaffold supporting files. Could inform babysitter's own process-builder skill.
- **TDD Workflow**: Red-green-refactor cycle with coverage analysis, multi-framework support, and prioritized recommendations. Generic but structurally sound -- already well-covered by babysitter's existing TDD methodology.

## Plugin Ideas
- **Skill Quality Benchmark plugin**: A babysitter marketplace plugin that evaluates generated skills against quality criteria (procedural depth, reference completeness, trigger accuracy, guardrail coverage). Uses the skill-factory's output as a baseline for comparison. Install.md sets up evaluation rubrics and scoring.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Skill Template Generation | NEW | Automated skill generation with frontmatter and section templates | - | specializations/shared/skill-template-generation.js |
| TDD Workflow | EXISTS | Red-green-refactor cycle with coverage analysis | methodologies/tdd/ | No action - already covered by existing TDD methodology |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Skill Quality Benchmark | NEW | Skill evaluation with quality criteria and scoring rubrics | - | plugins/a5c/marketplace/blueprints/skill-quality-benchmark/ |

## Patterns
- **Skill archetype taxonomy**: The factory implicitly defines skill archetypes: guide (TDD), factory (agent-factory, hook-factory, prompt-factory, slash-command-factory), analyzer (social-media, tech-stack), advisor (AWS, app-store-optimization), manager (scrum-master, ms365-tenant). Useful categorization.
- **Generated skill structure**: Consistent template: frontmatter -> capabilities list -> input requirements -> workflow steps -> output format. A reusable skeleton.
- **Multi-framework detection**: Automatic language/framework detection from syntax and imports for test generation. Pattern applicable to any code-analysis skill.
