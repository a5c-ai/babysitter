# model-profile-resolution

AI model selection per agent based on quality/balanced/budget profiles.

## Quick Start

GSD uses three profiles to control which AI model each agent uses:

| Profile | Orchestrator | Agents | Cost |
|---------|-------------|--------|------|
| quality | opus-4-6 | opus-4-6 | High |
| balanced | opus-4-6 | sonnet-4 | Medium |
| budget | sonnet-4 | haiku-4 | Low |

### Check Active Profile

Read `.planning/config.json` and look at the `profile` field.

### Switch Profile

Update `profile` in `.planning/config.json` to `quality`, `balanced`, or `budget`.

### Resolve Agent Model

```
Agent: gsd-executor
Profile: balanced
Model: claude-sonnet-4
```

## Examples

### New Project with Quality Profile

All 4 parallel researchers use opus-4-6 for maximum research quality.

### Execute Phase with Budget Profile

Executor agents use haiku-4 for cost-efficient task execution.

### Cost Comparison

For a typical phase execution (3 agent spawns):
- quality: ~$6.75
- balanced: ~$1.35
- budget: ~$0.12

## Troubleshooting

### Profile not applying
- Profile changes take effect on the next agent spawn
- Check `.planning/config.json` has the correct `profile` value
- Verify config file is valid JSON

### Agent using wrong model
- Check for custom overrides in `customMappings` config
- Verify the profile name is correct (case-sensitive)
- Default profile is `balanced` if not specified

### Cost higher than expected
- Review which profile is active
- Check number of agent spawns in the workflow
- Consider switching to `balanced` or `budget` for non-critical work
