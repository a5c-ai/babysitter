# COG Braindump Capture Skill

Capture raw thoughts with automatic domain classification.

## Quick Start

```bash
babysitter run:create --process methodologies/cog-second-brain/cog-knowledge-capture \
  --input '{"vaultPath":"./cog-vault","captureType":"braindump","content":"Your raw thoughts here..."}'
```

## How It Works

1. You provide raw, unstructured text
2. The knowledge curator classifies each thought by domain
3. Content is routed to the correct vault section (02-personal, 03-professional, or 04-projects)
4. URLs are extracted for separate analysis
5. Cross-references are added to connect related entries

## Examples

- [Simple braindump](../../examples/braindump-simple.json)
- [Mixed domains braindump](../../examples/braindump-mixed.json)
