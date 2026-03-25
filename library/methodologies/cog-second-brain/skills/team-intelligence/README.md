# COG Team Intelligence Skill

Cross-platform team intelligence with bidirectional sync.

## Quick Start

```bash
babysitter run:create --process methodologies/cog-second-brain/cog-intelligence-cycle \
  --input '{"vaultPath":"./cog-vault","mode":"team-brief","userName":"Alex","integrations":{"github":{"org":"my-org"}}}'
```

## Supported Platforms

| Platform | Data Gathered |
|----------|---------------|
| GitHub | PRs, issues, commits, reviews, velocity |
| Linear | Issues, cycles, projects, sprint progress |
| Slack | Discussions, decisions, threads, commitments |
| PostHog | Metrics, feature flags, experiments, funnels |

## Examples

- [Team brief with all integrations](../../examples/team-brief-full.json)
