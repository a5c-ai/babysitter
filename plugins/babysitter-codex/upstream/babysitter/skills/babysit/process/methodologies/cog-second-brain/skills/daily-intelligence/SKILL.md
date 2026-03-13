---
name: cog-daily-intelligence
description: Generate personalized verified news briefs with 7-day freshness and 95%+ source accuracy
allowed-tools:
  - file-read
  - file-write
  - web-search
  - web-fetch
  - git-commit
---

# COG Daily Intelligence Skill

Generate personalized daily intelligence briefs using verified sources with strict freshness and accuracy requirements.

## Capabilities

- Gather intelligence sources filtered by role and interests
- Enforce 7-day freshness requirement on all sources
- Apply verification-first methodology: every claim needs a source
- Target 95%+ source accuracy
- Assign confidence levels to all intelligence items
- Cross-reference with existing vault knowledge in 05-knowledge
- Quality-gated brief generation with iterative refinement

## Tool Use Instructions

1. Use `file-read` to load user profile and interests from 00-inbox
2. Use `web-search` to gather relevant intelligence sources
3. Use `web-fetch` to verify and extract content from sources
4. Cross-verify claims across multiple sources
5. Use `file-read` to check existing knowledge in 05-knowledge for context
6. Use `file-write` to create daily brief in 01-daily
7. Use `git-commit` to commit the brief

## Quality Standards

- All sources must be within 7 days
- Every claim must have at least one verifiable source
- Confidence levels: high (3+ corroborating sources), medium (2 sources), low (1 source)
- Target overall accuracy: 95%+

## Examples

```json
{
  "vaultPath": "./cog-vault",
  "mode": "daily-brief",
  "userName": "Alex",
  "rolePack": "engineer",
  "targetQuality": 80
}
```
