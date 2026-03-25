# Convoy Management Skill

Convoy lifecycle management adapted from [Gas Town](https://github.com/steveyegge/gastown) by Steve Yegge.

## Purpose

Coordinate multi-agent work through convoy creation, bead assignment, tracking, and landing.

## Process Flow

1. Create convoy from goal
2. Decompose into beads and wisps
3. Assign to agents (Crew/Polecats)
4. Track progress via hooks
5. Verify completion
6. Land convoy (merge)

## Integration

- **Input from:** Mayor orchestrator or manual convoy creation
- **Output to:** `merge-queue` skill for final integration
- **Process file:** `../../gastown-convoy.js`
