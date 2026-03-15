---
name: git-forensics-scanner
description: Git diff forensics for surfacing and classifying code changes for trojan detection
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Git Forensics Scanner

Surfaces and classifies all code changes in a repository using git diff analysis, providing structured change sets for downstream semantic analysis.

## Purpose

The first phase of nation-state trojan detection: identify exactly what changed, how much changed, and classify each change by risk level. Small diffs in critical code paths are flagged as highest-risk since business-logic trojans typically modify 1-5 lines.

## Capabilities

### Change Set Extraction
- Unstaged changes (`git diff`)
- Staged changes (`git diff --cached`)
- Commit range diffs (`git diff <base>..<head>`)
- Branch diffs (`git diff <base>...<head>`)
- Per-file patch extraction with full hunk context

### Change Classification
- **code** — Logic, algorithms, formulas, control flow
- **config** — Constants, parameters, thresholds, defaults
- **data-model** — Schemas, types, model properties, ORM mappings
- **cosmetic** — Formatting, comments, whitespace, rounding wrappers

### Risk Triage
- Files with 1-5 line changes in prediction/financial/auth code → HIGH RISK
- Single-character operator changes → CRITICAL RISK
- Comment-only changes accompanying code changes → CAMOUFLAGE RISK

## Input Schema

```json
{
  "type": "object",
  "required": ["projectRoot"],
  "properties": {
    "projectRoot": {
      "type": "string",
      "description": "Absolute path to the git repository"
    },
    "scanMode": {
      "type": "string",
      "enum": ["uncommitted", "commit-range", "branch-diff"],
      "default": "uncommitted"
    },
    "baseRef": {
      "type": "string",
      "description": "Base git reference (for commit-range/branch-diff)"
    },
    "headRef": {
      "type": "string",
      "description": "Head git reference (for commit-range/branch-diff)"
    },
    "targetPaths": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Limit scan to specific paths"
    }
  }
}
```

## Output Schema

```json
{
  "type": "object",
  "required": ["totalFiles", "files"],
  "properties": {
    "totalFiles": { "type": "number" },
    "totalInsertions": { "type": "number" },
    "totalDeletions": { "type": "number" },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "insertions": { "type": "number" },
          "deletions": { "type": "number" },
          "hunks": { "type": "number" },
          "classification": { "type": "string" },
          "rawDiff": { "type": "string" },
          "riskLevel": { "type": "string" }
        }
      }
    }
  }
}
```

## Usage Example

```javascript
skill: {
  name: 'git-forensics-scanner',
  context: {
    projectRoot: '/path/to/project',
    scanMode: 'uncommitted'
  }
}
```

## Process Files

- `nation-state-trojan-detection.js` — Phase 1: Git Forensics task
