# Homoglyph Detector

Byte-level Unicode homoglyph detection for identifying invisible character substitutions in code.

## Purpose

Detects characters that look identical to ASCII but have different Unicode codepoints (Cyrillic, Greek, zero-width, Bidi controls). These attacks are invisible in every editor and diff tool — only byte-level `hexdump` analysis can reveal them.

## Used In

- `nation-state-trojan-detection.js` — Phase 2: Homoglyph Detection (parallel with semantic analysis)

See [SKILL.md](./SKILL.md) for full confusable character tables, detection method, and real-world examples.
