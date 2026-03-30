# Merge Queue Skill

Refinery merge queue processing adapted from [Gas Town](https://github.com/steveyegge/gastown) by Steve Yegge.

## Purpose

Safely merge work from multiple agents, handling conflicts and verifying integration.

## Process Flow

1. Collect changes from agent branches
2. Detect merge conflicts
3. Resolve conflicts
4. Merge in dependency order
5. Verify integration

## Integration

- **Input from:** `convoy-management` after bead completion
- **Output to:** Landing result, integration report
- **Process file:** `../../gastown-merge-queue.js`
