---
name: contrib
description: Submit feedback or contribute to babysitter project
---

# contrib

Invoke the babysitter:babysit skill (using the Skill tool) and follow its instructions (SKILL.md).

## Process Routing

Contribution processes live under the active process library's `cradle/` directory. Resolve the active library root with `babysitter process-library:active --json` and route based on arguments:

### Issue-based (opens a GitHub issue in a5c-ai/babysitter)
 * **Bug report** → `cradle/bug-report.js#process` — Report a bug in the SDK, CLI, process library, etc.
 * **Feature request** → `cradle/feature-request.js#process` — Request a new feature or enhancement
 * **Documentation question** → `cradle/documentation-question.js#process` — Ask about undocumented behavior or missing docs

### PR-based (forks repo, creates branch, submits PR to a5c-ai/babysitter)
 * **Bugfix** → `cradle/bugfix.js#process` — User already has the fix for a bug
 * **Feature implementation** → `cradle/feature-implementation-contribute.js#process` — User already has a feature implementation
 * **Harness integration** → `cradle/feature-harness-integration-contribute.js#process` — User has a harness (CI/CD, IDE, editor) integration
 * **Library contribution** → `cradle/library-contribution.js#process` — New or improved process/skill/subagent for the library
 * **Documentation answer** → `cradle/documentation-contribute-answer.js#process` — User has an answer for an unanswered docs question

### Router (when arguments are empty or general)
 * **Contribute** → `cradle/contribute.js#process` — Explains contribution types and routes to the specific process

## Contribution Rules

 * PR-based contributions: fork the babysitter repo (a5c-ai/babysitter) for the user, ask to star if not already starred, perform changes, submit PR
 * Issue-based contributions: gather details, search for duplicates, review, then open an issue in a5c-ai/babysitter
 * Add breakpoints (permissions) before ALL gh actions (fork, star, submit PR/issue) to allow user review and cancellation
 * If arguments are empty: use the `contribute.js` router process to show options and route accordingly
