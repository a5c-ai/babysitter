# References and Attribution

## Source Repository

- **Repository**: https://github.com/pcvelz/superpowers
- **Type**: Community-maintained fork of [obra/superpowers](https://github.com/obra/superpowers)
- **License**: MIT License
- **Description**: An agentic skills framework and software development methodology for Claude Code

## Original Work

- **Original Author**: Jesse Vincent (obra)
- **Original Repository**: https://github.com/obra/superpowers
- **Blog Post**: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## What Was Adapted

This babysitter process definition adapts the following from the Superpowers Extended repository:

### Skills (14 total)
- `brainstorming` - Socratic design refinement
- `writing-plans` - Bite-sized TDD implementation planning
- `executing-plans` - Batch execution with checkpoints
- `subagent-driven-development` - Fresh agent per task with two-stage review
- `test-driven-development` - RED-GREEN-REFACTOR cycle
- `systematic-debugging` - 4-phase root cause process
- `dispatching-parallel-agents` - Concurrent domain solving
- `using-git-worktrees` - Workspace isolation
- `finishing-a-development-branch` - Branch completion
- `requesting-code-review` - Review dispatch
- `receiving-code-review` - Review reception
- `verification-before-completion` - Evidence-based completion
- `writing-skills` - Skill creation methodology
- `using-superpowers` - Skill discovery system

### Agents (4 total)
- `code-reviewer` - Senior code review agent
- `implementer` - Task implementation subagent
- `spec-reviewer` - Spec compliance verifier
- `code-quality-reviewer` - Code quality assessor

### Key Patterns Preserved
- Hard gates (no implementation before design approval)
- Iron laws (no production code without failing test)
- Two-stage review (spec compliance THEN code quality)
- Task persistence (.tasks.json for cross-session resume)
- Worktree isolation for safe development
- Evidence-based verification before completion claims
- Quality-gated convergence loops with maximum attempts
- Breakpoints for human review at critical decision points

## Adaptation Notes

The original Superpowers methodology is designed as Claude Code plugin skills (SKILL.md files with YAML frontmatter). This adaptation translates those skills into babysitter SDK process definitions with:
- `defineTask()` for agent tasks
- `ctx.task()` for orchestrated execution
- `ctx.breakpoint()` for human review gates
- `ctx.parallel.all()` for independent parallel work
- `ctx.log()` for progress tracking
- Quality-gated retry loops for review cycles
