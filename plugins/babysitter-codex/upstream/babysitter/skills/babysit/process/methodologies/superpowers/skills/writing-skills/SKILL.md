---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment.
---

# Writing Skills

## Overview

Writing skills IS Test-Driven Development applied to process documentation. Write pressure tests, watch agents fail, write the skill, watch them pass, close loopholes.

**Core principle:** If you did not watch an agent fail without the skill, you do not know if the skill teaches the right thing.

## TDD for Skills

| TDD Concept | Skill Creation |
|-------------|----------------|
| Test case | Pressure scenario with subagent |
| Production code | Skill document (SKILL.md) |
| RED | Agent violates rule without skill |
| GREEN | Agent complies with skill present |
| REFACTOR | Close loopholes |

## Skill Structure

- YAML frontmatter: `name` and `description` only
- Description: "Use when..." (triggering conditions only, never summarize workflow)
- Flat namespace, separate files only for heavy reference or reusable tools

## Tool Use

Meta-skill for creating new skills within the methodology.
