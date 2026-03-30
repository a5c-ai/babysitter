---
name: homoglyph-detector
description: Byte-level Unicode homoglyph detection for identifying invisible character substitutions in code
allowed-tools:
  - Bash
  - Read
  - Grep
---

# Homoglyph Detector

Byte-level forensic analysis of code changes to detect Unicode homoglyph substitutions — characters that look identical to ASCII in every editor and diff tool but have different codepoints, silently breaking string comparisons, dictionary lookups, and identifier resolution.

## Purpose

Homoglyph attacks (related to CVE-2021-42574 "Trojan Source") are the highest-stealth trojan technique. A Cyrillic `р` (U+0440) looks identical to a Latin `p` (U+0070) in every font, editor, and diff viewer. The only way to detect it is byte-level analysis via `hexdump`.

This skill pipes git diffs through `hexdump -C` and scans for multi-byte UTF-8 sequences where single-byte ASCII is expected, particularly in string literals used as dictionary keys, variable names, and identifiers.

## Capabilities

### Confusable Character Detection
Scans for these high-risk Unicode confusables:

| Latin | Cyrillic | Greek | UTF-8 Bytes |
|-------|----------|-------|-------------|
| a (61) | а (D0 B0) | α (CE B1) | 1 vs 2 bytes |
| c (63) | с (D1 81) | — | 1 vs 2 bytes |
| e (65) | е (D0 B5) | ε (CE B5) | 1 vs 2 bytes |
| o (6F) | о (D0 BE) | ο (CE BF) | 1 vs 2 bytes |
| p (70) | р (D1 80) | ρ (CF 81) | 1 vs 2 bytes |
| x (78) | х (D1 85) | χ (CF 87) | 1 vs 2 bytes |
| y (79) | у (D1 83) | — | 1 vs 2 bytes |

### Zero-Width Character Detection
- U+200B — Zero-width space
- U+200C — Zero-width non-joiner
- U+200D — Zero-width joiner
- U+FEFF — Byte order mark (in non-BOM position)

### Bidi Control Character Detection (Trojan Source)
- U+200F — Right-to-left mark
- U+200E — Left-to-right mark
- U+202A — Left-to-right embedding
- U+202B — Right-to-left embedding
- U+202C — Pop directional formatting
- U+2066 — Left-to-right isolate
- U+2067 — Right-to-left isolate

### Context-Aware Analysis
- Focuses on **string literals** (dictionary keys, config values)
- Focuses on **identifiers** (variable names, function names, class names)
- Ignores legitimate Unicode in comments, docstrings, and i18n strings
- Compares byte patterns between removed (-) and added (+) diff lines

## Input Schema

```json
{
  "type": "object",
  "required": ["projectRoot", "changedFiles"],
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the git repository"
    },
    "changedFiles": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of changed file paths to scan"
    },
    "scanMode": {
      "type": "string",
      "enum": ["uncommitted", "commit-range", "branch-diff"],
      "default": "uncommitted"
    },
    "baseRef": { "type": "string" },
    "headRef": { "type": "string" }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["filesScanned", "homoglyphsFound", "verdict"],
  "properties": {
    "filesScanned": { "type": "number" },
    "homoglyphsFound": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file": { "type": "string" },
          "line": { "type": "number" },
          "byteOffset": { "type": "string" },
          "context": { "type": "string" },
          "expectedAscii": { "type": "string" },
          "actualBytes": { "type": "string" },
          "unicodeCodepoint": { "type": "string" },
          "scriptName": { "type": "string" },
          "impact": { "type": "string" }
        }
      }
    },
    "bidiControlChars": { "type": "array" },
    "verdict": {
      "type": "string",
      "enum": ["CLEAN", "HOMOGLYPH_DETECTED"]
    }
  }
}
```

## Detection Method

```bash
# Step 1: Pipe git diff through hexdump
git diff <file> | hexdump -C

# Step 2: In added (+) lines, look for multi-byte sequences
# where the removed (-) line had single-byte ASCII
#
# Example — Latin 'p' vs Cyrillic 'р':
# Removed: 22 70 70 67 22   |  "ppg"  |   ← 70 = Latin 'p'
# Added:   22 d1 80 70 67   |  "..pg" |   ← d1 80 = Cyrillic 'р'
#
# The d1 80 bytes where 70 should be = HOMOGLYPH DETECTED
```

## Usage Example

```javascript
skill: {
  name: 'homoglyph-detector',
  context: {
    projectRoot: '/path/to/project',
    changedFiles: ['backend/app/prediction/temporal.py'],
    scanMode: 'uncommitted'
  }
}
```

## Real-World Example

From adversarial drill #6:
- **Attack**: Dictionary key `"ppg"` changed to `"рpg"` (Cyrillic р + Latin pg)
- **Camouflage**: 4 lines of harmless `round()` wrappers added as decoy
- **Impact**: All `dict.get("ppg")` lookups return default `0`, disabling trend detection
- **Detection**: `hexdump -C` revealed bytes `d1 80` where `70` was expected

## Process Files

- `nation-state-trojan-detection.js` — Phase 2: Homoglyph Detection (parallel with semantic analysis)
