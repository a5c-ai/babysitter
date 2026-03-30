# Cross-Artifact Analysis Skill

Consistency and coverage analysis adapted from [Spec Kit](https://github.com/github/spec-kit) by GitHub.

## Purpose

Analyze all pipeline artifacts for consistency, coverage, and alignment before implementation.

## Integration

- **Input from:** `task-decomposition` skill with task list and all prior artifacts
- **Output to:** `implementation-execution` skill (if ready) or back to `planning-design` (if not)
- **Process file:** `../../spec-kit-planning.js`
