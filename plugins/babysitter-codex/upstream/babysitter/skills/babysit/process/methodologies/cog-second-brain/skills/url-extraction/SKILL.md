---
name: cog-url-extraction
description: Save URLs with auto-extracted insights, credibility scoring, and vault routing
allowed-tools:
  - file-read
  - file-write
  - web-fetch
  - file-search
  - git-commit
---

# COG URL Extraction Skill

Save URLs and automatically extract insights including title, summary, key takeaways, and credibility assessment.

## Capabilities

- Fetch and analyze URLs for key insights
- Extract: title, summary, key takeaways, relevant quotes
- Assess source credibility and assign confidence levels
- Classify extracted insights by domain
- Route insights to appropriate vault sections
- Create cross-references to related vault entries

## Tool Use Instructions

1. Use `web-fetch` to retrieve URL content
2. Extract key insights: title, summary, takeaways, quotes
3. Assess source credibility using domain reputation and content quality
4. Use `file-read` to find related existing vault entries
5. Use `file-write` to store extracted insights in markdown format
6. Add cross-references to related entries
7. Use `git-commit` to commit extracted insights

## Examples

```json
{
  "vaultPath": "./cog-vault",
  "captureType": "url-dump",
  "urls": [
    "https://example.com/interesting-article",
    "https://blog.example.com/deep-dive-post"
  ],
  "targetQuality": 80
}
```
