---
name: cog-team-intelligence
description: Cross-reference GitHub, Linear, Slack, and PostHog with bidirectional sync for team briefs
allowed-tools:
  - file-read
  - file-write
  - web-fetch
  - api-call
  - git-commit
---

# COG Team Intelligence Skill

Cross-reference GitHub, Linear, Slack, and PostHog data to generate unified team intelligence briefs with bidirectional sync support.

## Capabilities

- Gather activity data from GitHub (PRs, issues, commits, reviews)
- Gather activity data from Linear (issues, cycles, projects)
- Gather activity data from Slack (discussions, decisions, threads)
- Gather analytics from PostHog (metrics, feature flags, experiments)
- Cross-reference data across all platforms
- Detect cross-platform misalignment
- Generate team intelligence briefs with blocker detection
- Support bidirectional sync between platforms

## Tool Use Instructions

1. Use `api-call` or `web-fetch` to gather data from configured integrations
2. Normalize data from each platform into comparable format
3. Cross-reference to identify patterns spanning platforms
4. Use `file-read` to load existing team context from 04-projects
5. Use `file-write` to create team brief in 01-daily
6. Use `file-write` to update team context in 04-projects
7. Use `git-commit` to commit team intelligence

## Examples

```json
{
  "vaultPath": "./cog-vault",
  "mode": "team-brief",
  "userName": "Alex",
  "integrations": {
    "github": { "org": "my-org", "repos": ["frontend", "backend"] },
    "linear": { "team": "engineering" },
    "slack": { "channels": ["engineering", "product"] }
  }
}
```
