# Subagent-Driven Development Skill

Two-stage reviewed subagent execution adapted from [Superpowers Extended](https://github.com/pcvelz/superpowers).

## Purpose

Execute plans with fresh agent per task, spec compliance review, then code quality review.

## Integration

- **Input from:** `writing-plans` skill (plan document)
- **Agents:** `implementer`, `spec-reviewer`, `code-quality-reviewer`, `code-reviewer`
- **Output to:** `finishing-a-development-branch` skill
- **Process file:** `../../subagent-driven-development.js`
