# Trojan Detection Agent

Specialized security agent for detecting nation-state business-logic trojans using LLM semantic analysis.

## Purpose

Detects code changes that are syntactically valid but semantically malicious — operator substitutions, logic inversions, Unicode homoglyphs, and compound self-masking attacks that pass all traditional security tools.

## Key Capabilities

- **Semantic code understanding** — compares intent (docstrings, names) against implementation
- **Mathematical verification** — computes before/after values with concrete examples
- **Cross-file reasoning** — traces data flow to detect compound attacks
- **Homoglyph detection** — identifies Unicode confusables via byte-level analysis
- **Test evasion analysis** — explains why existing tests miss each finding

## Used In

- `nation-state-trojan-detection.js` — semantic-code-analysis, compound-analysis, homoglyph-detection tasks

See [AGENT.md](./AGENT.md) for full persona, methodology, and output format.
