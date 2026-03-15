# COG URL Extraction Skill

Save URLs with auto-extracted insights and credibility scoring.

## Quick Start

```bash
babysitter run:create --process methodologies/cog-second-brain/cog-knowledge-capture \
  --input '{"vaultPath":"./cog-vault","captureType":"url-dump","urls":["https://example.com/article"]}'
```

## What Gets Extracted

- Title and metadata
- Executive summary
- Key takeaways and insights
- Relevant quotes
- Source credibility score
- Domain classification

## Examples

- [Single URL extraction](../../examples/url-dump-single.json)
- [Batch URL extraction](../../examples/url-dump-batch.json)
