---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment.
graph:
  domains: [domain:software-engineering]
  skillAreas: [skill-area:agentic-loops, skill-area:orchestration-loop]
  workflows: [workflow:feature-development]
  topics: [topic:developer-experience]
  roles: [role:tech-lead, role:backend-engineer]
|-------------|----------------|
| Test case | Pressure scenario with subagent |
| Production code | Skill document (SKILL.md) |
| RED | Agent violates rule without skill |
| GREEN | Agent complies with skill present |
| REFACTOR | Close loopholes |

---

## Skill Structure

- YAML frontmatter: `name` and `description` only
- Description: "Use when..." (triggering conditions only, never summarize workflow)
- Flat namespace, separate files only for heavy reference or reusable tools

## Tool Use

Meta-skill for creating new skills within the methodology.
