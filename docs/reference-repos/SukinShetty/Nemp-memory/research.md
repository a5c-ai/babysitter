# SukinShetty/Nemp-memory

- **Archetype**: utility-with-skill
- **Stars**: 92
- **Last pushed**: 2026-04-12 (approx)
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: gh-search (code: SKILL.md)
- **Skills found**: 1

## Summary
Memory management skill for Claude Code. NEMP (presumably an acronym for a memory protocol). Provides structured memory persistence across sessions.

## Assessment
LOW VALUE. Memory management skill at 92 stars. Likely overlaps with existing memory/context persistence patterns already tracked (AIPMAndy/dna-memory, memodb-io/Acontext).

## Extraction Priority
LOW -- Covered by existing tracked repos in the memory category.

## Processes
Needs deeper investigation but likely basic memory CRUD.

## Plugin Ideas
None beyond existing memory plugins.

## Implicit Procedural Knowledge
Minimal -- likely standard memory persistence patterns.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Basic Memory CRUD Process | EXISTING | Standard memory persistence patterns already covered | specializations/shared/memory-persistence.js | N/A |
| NEMP Memory Protocol | LOW_VALUE | Memory management skill with limited novel patterns | - | specializations/shared/nemp-memory-protocol.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| NEMP Memory Integration | EXISTING | Memory persistence already covered by existing plugins | plugins/a5c/marketplace/plugins/claude-mem/ | N/A |
