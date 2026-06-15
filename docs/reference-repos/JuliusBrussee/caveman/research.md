# JuliusBrussee/caveman

- **Archetype**: utility-with-skill
- **Stars**: 21,231
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: gh-search (keyword: "claude code skills")
- **Skills found**: 1 (SKILL.md at root -- note: content was empty/not retrievable at time of scan)

## Summary
A Claude Code skill that reduces token usage by ~65% by having the AI communicate in a compressed "caveman" style. Extremely popular meme-adjacent utility. Topics include prompt-engineering, tokens, caveman.

## Assessment
Pure token-compression trick -- no procedural methodology. The approach (compressed output style) is already partially covered by babysitter's compression layer. The specific "speak like a caveman" prompt pattern is trivially simple and not worth a formal process extraction.

## Extraction Priority
LOW -- No multi-step procedural content. The token-saving technique is a single prompt instruction, not a process.

## Processes
None extractable. The entire skill is a persona/style instruction.

## Plugin Ideas
None -- babysitter already has `compression/` with multi-layer token compression.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| N/A | N/A | No multi-step processes identified - entire skill is a persona/style instruction | - | N/A |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| N/A | N/A | No plugin ideas identified - babysitter already has compression system | babysitter compression/ | N/A |

## Implicit Procedural Knowledge
The insight that output style dramatically affects token budget is valid but already well-understood.
