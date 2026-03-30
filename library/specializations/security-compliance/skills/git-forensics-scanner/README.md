# Git Forensics Scanner

Git diff analysis and change classification for nation-state trojan detection.

## Purpose

Surfaces the complete change set from a git repository and classifies each change by type (code/config/data-model/cosmetic) and risk level. Small diffs in critical code paths are flagged as highest priority for semantic analysis.

## Used In

- `nation-state-trojan-detection.js` — Phase 1: Git Forensics

See [SKILL.md](./SKILL.md) for full capabilities, schemas, and usage.
