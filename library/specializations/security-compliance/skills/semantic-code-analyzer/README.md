# Semantic Code Analyzer

LLM-powered semantic analysis that detects business-logic trojans by comparing code intent against implementation.

## Purpose

The core detection engine for nation-state trojan detection. Catches operator substitutions, logic inversions, narrative camouflage, and compound self-masking attacks by understanding what code *should* do vs what it *actually* does.

## Used In

- `nation-state-trojan-detection.js` — Phase 2 (per-file analysis) and Phase 3 (compound analysis)

See [SKILL.md](./SKILL.md) for full capabilities, schemas, and attack signatures.
