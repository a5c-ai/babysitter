---
name: cog-braindump-capture
description: Capture raw thoughts with automatic domain classification and vault routing
allowed-tools:
  - file-read
  - file-write
  - file-search
  - git-commit
---

# COG Braindump Capture Skill

Capture raw, unstructured thoughts and automatically classify them by domain (personal, professional, project-specific) for routing to appropriate vault sections.

## Capabilities

- Accept raw braindump text of any format
- Classify content into personal, professional, and project-specific domains
- Extract embedded URLs for separate processing
- Route classified content to appropriate vault directories
- Tag entries with metadata: date, domain, confidence, topics
- Maintain strict domain separation (02-personal vs 03-professional)
- Quality-gated capture with iterative refinement

## Tool Use Instructions

1. Use `file-read` to load user profile from 00-inbox for classification context
2. Classify content by domain using natural language analysis
3. Use `file-write` to create classified entries in appropriate vault directories
4. Use `file-search` to find related existing entries for cross-referencing
5. Use `file-write` to add cross-references to new and existing entries
6. Use `git-commit` to commit captured content

## Examples

```json
{
  "vaultPath": "./cog-vault",
  "captureType": "braindump",
  "content": "Had a great idea about the auth system redesign. Also need to book vacation for July. The React 19 features look promising for our dashboard project.",
  "targetQuality": 80
}
```
