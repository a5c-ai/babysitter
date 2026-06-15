# axtonliu/ai-pair

- **Archetype**: utility-with-skill
- **Stars**: 190
- **Last pushed**: 2026-04-12 (approx)
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: gh-search (code: SKILL.md)
- **Skills found**: 1

## Summary
AI Pair Collaboration skill. Coordinates multiple AI models to work together: one creates (Author/Developer), two others review (Codex + Gemini). Works for code, articles, video scripts, and creative tasks. Uses Claude Code's native Agent Teams capability with heterogeneous model reviewers.

## Assessment
MEDIUM-HIGH VALUE. The multi-model review pattern (author + 2 reviewers from different model families) is a sophisticated orchestration pattern. The insight that "different AI models have fundamentally different review tendencies -- they look at completely different dimensions" is valuable. This maps directly to babysitter's multi-harness capabilities.

## Extraction Priority
MEDIUM-HIGH -- The heterogeneous-reviewer pattern is directly extractable:
- Multi-model review -> methodologies/ (quality assurance methodology)
- Team coordination -> specializations/shared/ (cross-domain collaboration pattern)

## Processes
1. **heterogeneous-ai-review** -- Author creates -> Codex reviews from angle A -> Gemini reviews from angle B -> synthesize feedback
2. **ai-dev-team** -- Developer + codex-reviewer + gemini-reviewer for code
3. **ai-content-team** -- Author + codex-reviewer + gemini-reviewer for content

## Plugin Ideas
- **multi-harness-review plugin**: Babysitter plugin that dispatches review tasks to multiple harnesses and synthesizes their feedback

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Heterogeneous AI Review | NEW | Multi-model review pattern with feedback synthesis | - | methodologies/heterogeneous-ai-review/ |
| AI Development Team Coordination | NEW | Code review with multiple AI model perspectives | - | specializations/shared/ai-team-coordination.js |
| AI Content Team Orchestration | NEW | Content review and creation with diverse model feedback | - | specializations/shared/ai-content-team-orchestration.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Multi-Harness Review | NEW | Orchestrate review tasks across multiple AI harnesses with feedback synthesis | - | plugins/a5c/marketplace/blueprints/multi-harness-review/ |

## Implicit Procedural Knowledge
- Different model families find different categories of issues (coverage maximization through diversity)
- Team architecture: Commander (user) -> Team Lead (Claude) -> Specialists (Codex, Gemini)
- team-stop command for clean resource teardown
