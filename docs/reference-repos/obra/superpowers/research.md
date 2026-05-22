# obra/superpowers

## Metadata
- **Stars:** 148,122
- **License:** MIT
- **Last pushed:** 2026-04-10 (very actively maintained)
- **Topics:** (none)
- **Fork:** No
- **Author:** Jesse Vincent (obra)

## Archetype: methodology-repo

The dominant open-source software development methodology for coding agents. A complete Claude Code plugin (v5.0.7) with 14 composable skills covering the full development lifecycle: brainstorming, planning, TDD, debugging, code review, subagent orchestration, and branch management.

## Structure
- `.claude-plugin/plugin.json` + `marketplace.json` -- official Claude plugin
- `.codex/`, `.cursor-plugin/`, `.opencode/` -- multi-harness support
- `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` -- harness-specific instructions
- `skills/` with 14 SKILL.md-based skills:
  - brainstorming
  - writing-plans (+ plan-document-reviewer-prompt.md)
  - executing-plans
  - subagent-driven-development (+ implementer-prompt.md, spec-reviewer-prompt.md, code-quality-reviewer-prompt.md)
  - dispatching-parallel-agents
  - test-driven-development (+ testing-anti-patterns.md)
  - systematic-debugging (+ defense-in-depth.md, root-cause-tracing.md, find-polluter.sh, condition-based-waiting.md)
  - requesting-code-review
  - receiving-code-review
  - finishing-a-development-branch
  - using-git-worktrees
  - using-superpowers (meta-skill)
  - verification-before-completion
  - writing-skills
- `agents/`, `commands/`, `hooks/` -- plugin infrastructure
- `gemini-extension.json` -- Gemini CLI extension

## IMPORTANT CONTEXT
Superpowers is already installed as a plugin in the babysitter project (skills are visible in the skill list as `superpowers:*`). This repo is the upstream source. The investigation here is about identifying what methodology patterns could be assimilated as babysitter-native processes, beyond what's already available via the plugin.

## Extractable Value

### Processes

**HIGH VALUE -- Full dev methodologies (methodologies/):**

- **TDD quality convergence** (methodologies/): The test-driven-development skill is a rigorous Red-Green-Refactor methodology with "Iron Law" enforcement (no production code without failing test first). Includes anti-patterns reference. This maps to a babysitter process with breakpoints at each phase transition (RED->GREEN->REFACTOR) and quality gates.

- **Systematic debugging** (methodologies/): Four-phase debugging methodology (Root Cause Investigation -> Hypothesis Formation -> Targeted Fix -> Verification). Includes supplementary materials on defense-in-depth, root-cause tracing, and condition-based waiting. Maps to a babysitter process with mandatory phase completion gates.

- **Plan-execute-review pipeline** (methodologies/): The writing-plans + executing-plans + verification-before-completion chain describes a complete plan-driven development methodology. Writing-plans includes a plan-document-reviewer-prompt. This is a three-phase babysitter process with breakpoints between planning, execution, and verification.

**MEDIUM VALUE -- Orchestration patterns (specializations/shared/):**

- **Subagent orchestration pattern** (specializations/shared/): The subagent-driven-development skill defines a dispatch-implement-review cycle with two-stage review (spec compliance then code quality). Each stage has dedicated prompts (implementer-prompt.md, spec-reviewer-prompt.md, code-quality-reviewer-prompt.md). This maps to a babysitter parallel.map() process with nested review breakpoints.

- **Parallel agent dispatch** (specializations/shared/): The dispatching-parallel-agents skill describes patterns for identifying independent tasks and farming them out. Maps to babysitter's parallel.all() effect pattern.

**LOWER VALUE -- Workflow patterns:**

- **Code review cycle** (specializations/shared/): requesting-code-review + receiving-code-review describe a bidirectional review process. Could become a babysitter process with breakpoint-based review gates.

- **Branch finalization** (specializations/shared/): finishing-a-development-branch describes the decision tree for squash vs merge vs rebase and cleanup. Useful as a lightweight babysitter process.

### Plugin Ideas
- **Superpowers methodology bridge plugin:** Since superpowers is already installed as a plugin, the value is in converting its skill-based methodology into deterministic babysitter processes that can be replayed, journal-tracked, and state-cached. A marketplace plugin could provide `babysitter-agent call --process superpowers-tdd` etc.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| TDD Quality Convergence | UPGRADE | Enhance with Iron Law enforcement and anti-patterns | library/methodologies/superpowers/superpowers-workflow.js | methodologies/superpowers/ (enhancement) |
| Systematic Debugging | UPGRADE | Enhance with 4-phase methodology and root-cause tracing | library/methodologies/superpowers/superpowers-workflow.js | methodologies/superpowers/ (enhancement) |
| Plan-Execute-Review Pipeline | UPGRADE | Enhance with dedicated reviewer prompts and phase gates | library/methodologies/superpowers/superpowers-workflow.js | methodologies/superpowers/ (enhancement) |
| Subagent Orchestration Pattern | UPGRADE | Enhance with dispatch-implement-review cycle | library/methodologies/superpowers/using-superpowers.js | methodologies/superpowers/ (enhancement) |
| Parallel Agent Dispatch | UPGRADE | Enhance with independent task identification patterns | library/methodologies/superpowers/superpowers-workflow.js | methodologies/superpowers/ (enhancement) |
| Code Review Cycle | VARIANT | Could be extracted as shared pattern | - | specializations/shared/bidirectional-review.js |
| Branch Finalization | VARIANT | Could be extracted as shared workflow pattern | - | specializations/shared/branch-finalization.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Superpowers Methodology Bridge | NEW | Convert superpowers skills to deterministic processes | - | plugins/a5c/marketplace/plugins/superpowers-bridge/ |

### SKIP
- using-superpowers meta-skill (skill-management)
- writing-skills (skill-management)  
- using-git-worktrees (utility, not a process methodology)
- brainstorming (already lightweight enough as a skill, doesn't benefit from process orchestration)
- The plugin infrastructure (hooks, commands, agents) -- babysitter has its own
