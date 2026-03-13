---
name: cog-knowledge-consolidation
description: Build structured knowledge frameworks from scattered vault notes with source attribution
allowed-tools:
  - file-read
  - file-write
  - file-search
  - git-commit
---

# COG Knowledge Consolidation Skill

Build structured knowledge frameworks from scattered notes across the vault, preserving source attribution and maintaining cross-references.

## Capabilities

- Scan vault sections for unconsolidated notes
- Cluster related notes into coherent themes
- Build structured frameworks: concept maps, key principles, examples, applications
- Cross-reference with existing frameworks in 05-knowledge
- Preserve source attribution through consolidation
- Quality-gated framework building with iterative refinement
- Identify knowledge gaps needing additional capture

## Tool Use Instructions

1. Use `file-search` to find notes not yet consolidated into frameworks
2. Use `file-read` to load candidate notes and existing frameworks
3. Cluster related notes by topic similarity
4. Build framework structure: concept map, principles, examples, applications
5. Use `file-write` to create or update frameworks in 05-knowledge
6. Add cross-references between new and existing frameworks
7. Use `git-commit` to commit consolidated frameworks

## Examples

```json
{
  "vaultPath": "./cog-vault",
  "mode": "knowledge-consolidation",
  "userName": "Alex",
  "targetQuality": 80
}
```
