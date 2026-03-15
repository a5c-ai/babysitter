# Work Decomposition Skill

MEOW-based work decomposition adapted from [Gas Town](https://github.com/steveyegge/gastown) by Steve Yegge.

## Purpose

Break goals into trackable atomic work units (beads and wisps) with clear dependencies.

## Process Flow

1. Analyze goal and context
2. Identify decomposition seams
3. Create MEOWs with boundaries
4. Classify as beads or wisps
5. Map dependencies
6. Estimate and prioritize

## Integration

- **Input from:** User goal or Mayor orchestrator
- **Output to:** `convoy-management` skill
- **Process file:** `../../gastown-orchestrator.js` (analyze-work task)
