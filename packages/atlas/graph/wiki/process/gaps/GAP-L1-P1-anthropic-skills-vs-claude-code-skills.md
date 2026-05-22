---
id: page:process-gaps-GAP-L1-P1-anthropic-skills-vs-claude-code-skills
nodeKind: Page
title: "GAP-L1-P1-anthropic-skills-vs-claude-code-skills"
slug: "process/gaps/GAP-L1-P1-anthropic-skills-vs-claude-code-skills"
articlePath: "wiki/process/gaps/GAP-L1-P1-anthropic-skills-vs-claude-code-skills.md"
documents: []
---
# GAP-L1-P1-anthropic-skills-vs-claude-code-skills

| Field | Value |
|---|---|
| id | gap:anthropic-skills-vs-claude-code-skills |
| title | Anthropic Skills (API-level) vs Claude Code Skills (filesystem) not distinguished |
| level | 1 |
| priority | P1 |
| discoveredAt | 2026-04-28T00:00:00Z |
| source | https://docs.anthropic.com/en/docs/agents-and-tools/skills + https://code.claude.com/docs/en/skills |
| status | open |
| owner | tbd |

## Current state
`Skill` NodeKind has one shape: directory-of-markdown with `SKILL.md` entrypoint. Anthropic now ships TWO distinct concepts both called "Skill":
- **Anthropic Skills (API)** — model-side feature accessible via Messages API, configured server-side, not filesystem-based. Used by claude.ai.
- **Claude Code Skills** — filesystem-based `SKILL.md` directories, invoked via slash command, can ship in plugins.

Both have `disable-model-invocation` frontmatter, but their distribution and lifecycle differ. The skill node example file `python-django-debug.yaml` references "Anthropic Skills" in its comment but the body is clearly a Claude Code skill.

## Desired state
- Split into `Skill.kind: enum<anthropic-api-skill,claude-code-skill,portable-skill>`.
- Add `Skill.invocationMode: enum<model-invoked,user-invoked,both>`.
- Add `Skill.disableModelInvocation: bool` (matches frontmatter).
- Add a `Term` `term:skill` with `synonym_of` records distinguishing the two senses, `inContext=anthropic-api` vs `inContext=claude-code`.

## Evidence
- https://docs.anthropic.com/en/docs/agents-and-tools/skills (API-level)
- https://code.claude.com/docs/en/skills (filesystem-level)
- C:/work/v6/graph/schema/examples/extensions/skills/python-django-debug.yaml (mislabeled comment)

## Propagation status
- Level 1: open
- Level 2: not-started — terminology.md needs new synonym record

## Propagation chain
- Level 1: split kind enum + 2 attribute additions.
- Level 2: 02-node-kinds/extensions-plugins.md disambiguation block.

## Notes
Without disambiguation, downstream derivations will conflate two different distribution channels.
