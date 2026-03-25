---
name: cog-weekly-reflection
description: Cross-domain pattern analysis with personal, professional, and project domain synthesis
allowed-tools:
  - file-read
  - file-write
  - file-search
  - git-commit
---

# COG Weekly Reflection Skill

Perform weekly check-in with cross-domain pattern analysis spanning personal, professional, and project domains.

## Capabilities

- Gather and analyze the past week's vault entries across all sections
- Identify patterns in personal domain (energy, mood, productivity)
- Identify patterns in professional domain (skills, career, industry)
- Identify patterns in project domain (velocity, blockers, progress)
- Synthesize cross-domain connections
- Generate actionable insights with confidence levels
- Quality-gated reflection with iterative refinement

## Tool Use Instructions

1. Use `file-read` to load entries from 01-daily, 02-personal, 03-professional, 04-projects
2. Use `file-search` to find related entries across sections
3. Analyze patterns within each domain independently
4. Synthesize cross-domain connections
5. Use `file-write` to create weekly check-in in 01-daily
6. Add cross-references to identified patterns
7. Use `git-commit` to commit reflection

## Examples

```json
{
  "vaultPath": "./cog-vault",
  "mode": "weekly-checkin",
  "userName": "Alex",
  "rolePack": "engineer",
  "targetQuality": 80
}
```
