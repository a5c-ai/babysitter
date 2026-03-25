# Findings Capture

Capture and persist research findings, discoveries, and decision rationale to findings.md.

## Agent
Findings Curator - `pwf-findings-curator`

## Workflow
1. Initialize findings.md with structured section headers
2. Capture findings during execution with timestamps
3. Apply 2-Action Rule: persist after every 2 operations
4. Record decisions with supporting rationale
5. Deduplicate and organize on final flush
6. Analyze coverage for verification

## Inputs
- `projectPath` - Root path for planning files
- `phaseName` - Current phase name
- `findings` - Array of finding objects
- `decisions` - Array of decision objects

## Outputs
- Updated findings.md with organized, timestamped entries
- Coverage analysis for verification

## Process Files
- `planning-orchestrator.js` - Findings initialization and appending
- `planning-execution.js` - 2-Action Rule batches and final flush
- `planning-verification.js` - Coverage analysis
