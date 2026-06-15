# gadievron/raptor

- **Archetype:** domain-skill-pack
- **Stars:** 1931
- **Last pushed:** 2026-04-12
- **License:** MIT (NOASSERTION in API)
- **Discovered:** 2026-04-12
- **URL:** https://github.com/gadievron/raptor
- **Source**: gh-search

## Summary

RAPTOR (Recursive Autonomous Penetration Testing and Observation Robot) is an autonomous offensive/defensive security research framework built on Claude Code. It combines traditional security tools (Semgrep, CodeQL, AFL fuzzing) with agentic automation. Features include code understanding, vulnerability scanning, fuzzing, exploit generation, patching, OSS forensics investigation, and cost management.

## Assessment

Two highly structured multi-phase workflows are directly extractable:

1. **Exploitability Validation Pipeline:** A 9-stage pipeline (stages 0, A-F, E, 1) mixing mechanical computation with LLM reasoning. Has explicit stage typing (letter=LLM reasoning, number=mechanical), clear inputs/outputs per stage, and conditional stage execution (Stage E only for memory corruption).

2. **OSS Forensics Investigation:** A 8-phase orchestrated investigation with parallel agent spawning, hypothesis formation loops with followup evidence collection, evidence verification, and iterative hypothesis validation. Uses specialized investigator agents (GH Archive, GitHub API, Wayback Machine, local git, IOC extractor) spawned in parallel.

The crash analysis skills (function tracing, gcov coverage, line execution checker, rr-debugger) are tool-specific and better suited as plugins.

## Extraction Priority

**HIGH** -- The exploitability validation pipeline is one of the most well-structured multi-phase processes found across any repo, with clear stage definitions, conditional execution, and explicit mechanical vs reasoning stage classification. The OSS forensics process is a sophisticated parallel-then-sequential orchestration pattern.

---

## Processes

### 1. Exploitability Validation Pipeline

**Source:** `.claude/skills/exploitability-validation/`
**Placement:** `specializations/security/exploitability-validation`

9-stage pipeline for validating whether a reported vulnerability is actually exploitable. Two stage types: letter stages (LLM reasoning) and numeric stages (mechanical computation with optional enrichment).

- **Stage 0 (Mechanical):** Inventory -- build checklist.json ground truth from vulnerability report.
- **Stage A (LLM):** One-shot quick exploitability assessment and initial PoC attempt. Outputs findings.json.
- **Stage B (LLM):** Systematic analysis with attack trees, hypotheses, and evidence gathering. Outputs 5 working documents.
- **Stage C (LLM):** Sanity check -- validate against actual code, verify reachability. Outputs validated findings.json.
- **Stage D (LLM):** Final ruling with CVSS vector selection. Outputs confirmed findings.json.
- **Stage E (Mechanical, conditional):** Binary constraint analysis. Only runs for memory corruption vulnerabilities; web/injection vulns skip this stage.
- **Stage F (LLM):** Self-review -- "what did I get wrong?" Outputs corrected findings.json.
- **Stage 1 (Mechanical):** CVSS scoring from vectors (after Stage F corrections), schema validation, report generation. Never changes verdicts.

Key patterns to codify:
- Stage typing (reasoning vs mechanical) maps to different task kinds
- Conditional stage execution (Stage E skip for non-memory-corruption)
- Progressive refinement of findings.json through pipeline
- Self-review stage as quality gate before final output
- Separation of verdict-setting (Stage D) from scoring (Stage 1)

### 2. OSS Forensics Investigation Process

**Source:** `.claude/skills/oss-forensics/` and `.claude/commands/oss-forensics.md`
**Placement:** `specializations/security/oss-forensics`

8-phase orchestrated forensic investigation for public GitHub repositories. Uses parallel evidence collection with specialized investigators followed by sequential analysis.

- **Phase 0:** Initialize investigation (create output directory, run init script).
- **Phase 1:** Parse prompt and form research question.
- **Phase 2:** Parallel evidence collection -- spawn 4-5 specialist investigators simultaneously:
  - GH Archive investigator (BigQuery queries for immutable events)
  - GitHub API investigator (API queries, commit recovery by SHA)
  - Wayback Machine investigator (deleted content recovery)
  - Local git investigator (dangling commit analysis)
  - IOC extractor (indicators of compromise from vendor reports, if URL provided)
- **Phase 3:** Hypothesis formation loop (with followup evidence requests, configurable max-followups).
- **Phase 4:** Evidence verification against original sources.
- **Phase 5:** Hypothesis validation loop (with revisions, configurable max-retries).
- **Phase 6:** Generate final forensic report with timeline, attribution, and IOCs.
- **Phase 7:** Inform user of completion.

Key patterns to codify:
- Parallel-then-sequential orchestration with `ctx.parallel.all()` for Phase 2
- Iterative loops with configurable bounds (max-followups, max-retries)
- Specialized sub-agents as typed tasks
- Evidence accumulation across phases (EvidenceStore pattern)
- Output directory structure for forensic artifacts

### 3. Adversarial Code Understanding Process

**Source:** `.claude/skills/code-understanding/`
**Placement:** `specializations/security/adversarial-code-understanding`

4-mode code comprehension from an adversarial security perspective:
- **Map:** Attack surface mapping
- **Trace:** Data flow tracing
- **Hunt:** Vulnerability variant hunting
- **Teach:** Explain findings for knowledge transfer

Could be codified as a process with mode selection and shared context building.

## Plugin Ideas

### 1. Crash Analysis Toolkit Plugin

**Source:** `.claude/skills/crash-analysis/`
**install.md description:** Installs crash analysis tooling integrations: function tracing (C instrumentation), gcov coverage analysis, line execution checking (C++), and rr-debugger integration with Python crash trace scripts. Provides commands for each analysis mode.

### 2. AFL Fuzzing Integration Plugin

**Source:** `.claude/commands/fuzz.md`, `.claude/commands/raptor-fuzz.md`
**install.md description:** Installs AFL (American Fuzzy Lop) fuzzing integration. Provides commands for configuring fuzz targets, managing corpus, running campaigns, and analyzing crash inputs. Includes harness generation assistance.

### 3. CodeQL Integration Plugin

**Source:** `.claude/commands/codeql.md`
**install.md description:** Installs CodeQL database creation and query execution integration. Provides commands for building CodeQL databases, running security queries, and interpreting results with SARIF output parsing.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Exploitability Validation Pipeline | NEW | 9-stage LLM + mechanical pipeline with stage typing and conditional execution | - | specializations/security-compliance/exploitability-validation.js |
| OSS Forensics Investigation Process | NEW | 8-phase parallel evidence collection with specialized investigators | - | specializations/security-compliance/oss-forensics-investigation.js |
| Adversarial Code Understanding | NEW | 4-mode security-focused code comprehension (Map/Trace/Hunt/Teach) | - | specializations/security-compliance/adversarial-code-understanding.js |
| Stage Typing Pattern | NEW | LLM reasoning vs mechanical computation stage classification framework | - | specializations/shared/stage-typing-pattern.js |
| Parallel Evidence Collection | NEW | Parallel specialist agents with sequential synthesis orchestration pattern | - | specializations/shared/parallel-evidence-collection.js |
| Self-Review Quality Gate | NEW | Explicit self-review stage before final output as quality assurance | - | specializations/shared/self-review-quality-gate.js |
| Iterative Hypothesis Refinement | NEW | Bounded loops for hypothesis formation and validation with configurable limits | - | specializations/shared/iterative-hypothesis-refinement.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Crash Analysis Toolkit | NEW | Function tracing, gcov coverage, line execution checking, rr-debugger integration | - | plugins/a5c/marketplace/blueprints/crash-analysis-toolkit/ |
| AFL Fuzzing Integration | NEW | American Fuzzy Lop fuzzing with corpus management and harness generation | - | plugins/a5c/marketplace/blueprints/afl-fuzzing-integration/ |
| CodeQL Security Analysis | NEW | CodeQL database creation and query execution with SARIF output parsing | - | plugins/a5c/marketplace/blueprints/codeql-security-analysis/ |

## Implicit Procedural Knowledge

- **Stage typing:** Classifying pipeline stages as "LLM reasoning" vs "mechanical computation" is a powerful pattern for process design. Maps directly to different babysitter task kinds (orchestrator_task vs node).
- **Conditional stage execution:** Skipping stages based on vulnerability class (memory corruption vs web/injection) is a reusable branching pattern.
- **Self-review as quality gate:** Stage F's explicit "what did I get wrong?" review before final output generation. Applicable to any analysis pipeline.
- **Parallel evidence collection with sequential synthesis:** The forensics pattern of gathering evidence in parallel then synthesizing sequentially is a general pattern for any research/investigation process.
- **Iterative hypothesis refinement with bounded loops:** Configurable max-followups and max-retries prevent infinite loops while allowing thorough investigation.
