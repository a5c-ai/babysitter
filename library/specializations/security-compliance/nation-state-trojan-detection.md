# Nation-State Trojan Detection

LLM-powered semantic code analysis engine that detects business-logic trojans invisible to traditional SAST tools, linters, and unit tests.

## Overview

Nation-state actors don't need to inject `eval()` or open reverse shells. They change **one character** in your business logic — a `/` to `//`, a Latin `p` to a Cyrillic `р` — and walk away. Every linter passes. Every test passes. The code is syntactically perfect but semantically corrupted.

This process uses an LLM as the core detection engine, combining git diff forensics, byte-level homoglyph analysis, cross-file data flow reasoning, and semantic code understanding to catch what no traditional tool can.

## Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                      GIT FORENSICS (Phase 1)                    │
│   git diff --stat → per-file diffs → change classification      │
└──────────┬──────────────────────────────────────┬───────────────┘
           │                                      │
           ▼                                      ▼
┌─────────────────────┐              ┌────────────────────────────┐
│  SEMANTIC ANALYSIS   │   parallel   │   HOMOGLYPH DETECTION      │
│  (Phase 2, per file) │◄───────────►│   (Phase 2, byte-level)    │
│                      │              │                            │
│  • Intent vs impl   │              │  • hexdump -C analysis     │
│  • Math verification │              │  • Cyrillic/Greek/Bidi     │
│  • Docstring check   │              │  • Zero-width chars        │
│  • Blast radius map  │              │  • Trojan Source (CVE)     │
└──────────┬──────────┘              └────────────┬───────────────┘
           │                                      │
           └──────────────┬───────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 COMPOUND ANALYSIS (Phase 3)                      │
│   Cross-file correlation • Self-masking detection               │
│   Cascading effect computation • Decoy identification           │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────────────────────┐
│  REVIEW BREAKPOINT   │────►│   HTML REPORT GENERATION (Phase 5)  │
│  (Phase 4)           │     │                                     │
│  Human approval gate │     │  • Attack classification            │
└──────────────────────┘     │  • Stealth assessment               │
                             │  • Blast radius map                 │
                             │  • MITRE ATT&CK mapping             │
                             │  • Remediation plan                 │
                             └──────────┬──────────────────────────┘
                                        │
                                        ▼
                             ┌─────────────────────────────────────┐
                             │  OPTIONAL: AUTO-REVERT (Phase 6)    │
                             │  git checkout -- <malicious files>  │
                             └─────────────────────────────────────┘
```

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectRoot` | string | Yes | — | Absolute path to the project directory |
| `projectName` | string | No | dir name | Display name for reports |
| `reportOutputPath` | string | No | `<projectRoot>/reports/trojan-detection-<date>.html` | HTML report output path |
| `scanMode` | string | No | `'uncommitted'` | `'uncommitted'`, `'commit-range'`, or `'branch-diff'` |
| `baseRef` | string | No | — | Base git ref (for commit-range/branch-diff) |
| `headRef` | string | No | — | Head git ref (for commit-range/branch-diff) |
| `targetPaths` | string[] | No | all | Limit scan to specific paths |
| `autoRevert` | boolean | No | `false` | Auto-revert detected trojans after reporting |
| `drillMode` | boolean | No | `false` | Enable red-team drill mode |

## Output Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the scan completed |
| `verdict` | string | `'CLEAN'`, `'SUSPICIOUS'`, or `'TROJAN_DETECTED'` |
| `reportPath` | string | Path to the generated HTML report |
| `findings` | object[] | All detected trojan findings with details |
| `layerCount` | number | Number of independent attack layers |
| `stealthRating` | string | Overall stealth: MODERATE / HIGH / VERY_HIGH / EXTREME |
| `signatures` | string[] | Attack signature identifiers |
| `artifacts` | object[] | Generated files (report, revert log) |
| `duration` | number | Scan duration in milliseconds |
| `metadata` | object | Process metadata (scan mode, timestamps, etc.) |

## Scan Modes

### Uncommitted (default)
Scans unstaged and staged changes in the working tree. Ideal for:
- Pre-commit hooks
- CI/CD gates
- Ad-hoc security checks

### Commit Range
Scans changes between two specific commits. Ideal for:
- Auditing a specific set of commits
- Post-merge verification
- Investigating suspicious commit windows

### Branch Diff
Scans the diff between a feature branch and its base. Ideal for:
- PR review automation
- Branch protection rules
- Feature gate security checks

## Attack Signatures

The process detects these known attack patterns:

| Signature | Stealth | Description |
|-----------|---------|-------------|
| `constant-manipulation` | MODERATE | Shift thresholds/limits to disable functionality |
| `logic-inversion` | HIGH | Flip comparison operators or ratio direction |
| `narrative-camouflage` | HIGH | Update docstrings to match malicious code |
| `edge-case-exploitation` | VERY HIGH | Corrupt fallback paths in rare conditions |
| `self-masking-compound` | VERY HIGH | One layer hides another's visible impact |
| `precision-truncation` | EXTREME | Swap operators to lose decimal precision |
| `homoglyph-injection` | EXTREME | Replace ASCII with identical-looking Unicode |
| `window-overlap-neutralization` | HIGH | Narrow comparison windows until meaningless |
| `calibration-camouflage` | HIGH | Tune ML hyperparameters to degrade accuracy |
| `cosmetic-decoy` | HIGH | Formatting changes hiding semantic modification |

## Detection Methodology

### The LLM IS the Detection Engine

Traditional tools check **syntax** (SAST/linters) or **expected behavior** (tests). Neither checks whether the code **does what it claims to do**. That requires **semantic understanding** — and that's what the LLM provides.

The LLM performs:
1. **Semantic code understanding** — reads function names, docstrings, and variable names to understand intent, then verifies the implementation matches
2. **Docstring contradiction detection** — catches when comments/docs are updated to camouflage malicious changes
3. **Cross-file data flow reasoning** — traces values across module boundaries to compute compound effects
4. **Mathematical verification** — plugs in concrete values to verify formulas produce correct results
5. **Unicode & encoding analysis** — detects homoglyph substitutions invisible to human reviewers

### Tools Used

| Tool | Purpose |
|------|---------|
| `git diff --stat` | Triage — identify changed files |
| `git diff <file>` | Full patch for semantic analysis |
| `hexdump -C` | Byte-level homoglyph detection |
| `grep / ripgrep` | Blast radius mapping |
| File reader | Full file context for analysis |

## Examples

### Minimal — Scan Uncommitted Changes

```javascript
const result = await orchestrate(
  'specializations/security-compliance/nation-state-trojan-detection',
  { projectRoot: '/path/to/project' }
);
```

### PR Branch Diff

```javascript
const result = await orchestrate(
  'specializations/security-compliance/nation-state-trojan-detection',
  {
    projectRoot: '/path/to/project',
    scanMode: 'branch-diff',
    baseRef: 'main',
    headRef: 'feature/new-scoring'
  }
);
```

### Red-Team Drill with Auto-Revert

```javascript
const result = await orchestrate(
  'specializations/security-compliance/nation-state-trojan-detection',
  {
    projectRoot: '/path/to/project',
    drillMode: true,
    autoRevert: true,
    reportOutputPath: '/path/to/project/reports/drill-report.html'
  }
);
```

## Composition Patterns

| Pattern | Phases | Use Case |
|---------|--------|----------|
| `full-pipeline` | 1-6 | Complete scan with report and optional revert |
| `scan-only` | 1-3 | Detection without report (for CI boolean gate) |
| `drill` | 1-6 | Red-team exercise with drill-mode report |
| `pr-review` | 1-5 | Branch diff scan for PR automation |

## Skills & Agents

### Skills
- **git-forensics-scanner** — Git diff analysis and change classification
- **semantic-code-analyzer** — LLM semantic analysis of code changes
- **homoglyph-detector** — Byte-level Unicode homoglyph detection

### Agents
- **trojan-detection-agent** — Specialized agent for nation-state trojan analysis
