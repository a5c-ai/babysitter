---
name: semantic-code-analyzer
description: LLM-powered semantic analysis of code diffs to detect business-logic trojans
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Semantic Code Analyzer

LLM-powered semantic analysis engine that detects business-logic trojans by comparing code intent (docstrings, function names, variable names) against actual implementation behavior.

## Purpose

The core detection capability of nation-state trojan detection. Traditional SAST tools check syntax; this skill checks **semantics** — whether the code does what it claims to do. It catches operator substitutions, logic inversions, constant manipulation, narrative camouflage, and compound self-masking attacks.

## Capabilities

### Intent vs Implementation Analysis
- Reads function names, docstrings, and variable names to establish **intent**
- Traces code execution to determine **actual behavior**
- Flags any contradiction as a potential trojan indicator

### Mathematical Verification
- Plugs concrete values into changed formulas
- Computes before/after results to quantify impact
- Detects ratio inversions (a/b vs b/a), precision loss (/ vs //), and threshold shifts

### Docstring Contradiction Detection
- Compares narrative claims in comments/docstrings against code behavior
- Detects narrative camouflage where docs are updated to match malicious code
- Cross-references variable naming against mathematical operations

### Test Evasion Analysis
- Reads existing test fixtures to identify blind spots
- Explains why each finding would pass current tests
- Recommends test improvements to prevent recurrence

### Blast Radius Mapping
- Uses grep/ripgrep to find all consumers of changed functions/values
- Maps downstream data flow through the application
- Quantifies the scope of impact (single function → system-wide)

## Input Schema

```json
{
  "type": "object",
  "required": ["projectRoot", "filePath", "rawDiff"],
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the project"
    },
    "projectName": {
      "type": "string",
      "description": "Project display name"
    },
    "filePath": {
      "type": "string",
      "description": "Path to the changed file"
    },
    "rawDiff": {
      "type": "string",
      "description": "Raw git diff output for this file"
    },
    "classification": {
      "type": "string",
      "description": "Change classification from git forensics (code/config/data-model/cosmetic)"
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["filePath", "verdict", "confidence", "findings"],
  "properties": {
    "filePath": { "type": "string" },
    "verdict": {
      "type": "string",
      "enum": ["CLEAN", "SUSPICIOUS", "TROJAN_DETECTED"]
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 100
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "line": { "type": "number" },
          "originalCode": { "type": "string" },
          "modifiedCode": { "type": "string" },
          "signature": { "type": "string" },
          "severity": { "type": "string" },
          "explanation": { "type": "string" },
          "mathematicalImpact": { "type": "string" },
          "blastRadius": { "type": "array", "items": { "type": "string" } },
          "testEvasionReason": { "type": "string" }
        }
      }
    },
    "stealthRating": { "type": "string" }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'semantic-code-analyzer',
  context: {
    projectRoot: '/path/to/project',
    filePath: 'backend/app/data/models.py',
    rawDiff: '--- a/backend/app/data/models.py\n+++ b/...',
    classification: 'data-model'
  }
}
```

## Attack Signatures Detected

| Signature | What It Catches |
|-----------|----------------|
| `constant-manipulation` | Threshold/limit changes that disable features |
| `logic-inversion` | Operator flips (< to >, a/b to b/a) |
| `narrative-camouflage` | Docstrings rewritten to match malicious code |
| `edge-case-exploitation` | Corrupted fallback/default paths |
| `self-masking-compound` | Multiple layers hiding each other's impact |
| `precision-truncation` | Division operator swaps losing precision |
| `window-overlap-neutralization` | Comparison windows narrowed until meaningless |
| `calibration-camouflage` | ML hyperparameter degradation |
| `cosmetic-decoy` | Formatting changes hiding semantic modifications |

## Process Files

- `nation-state-trojan-detection.js` — Phase 2: Semantic Analysis (per-file)
- `nation-state-trojan-detection.js` — Phase 3: Compound Analysis (cross-file)
