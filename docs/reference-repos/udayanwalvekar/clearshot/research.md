# udayanwalvekar/clearshot
- **Archetype**: utility-with-skill
- **Stars**: 124
- **Last pushed**: 2026-03-25
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 1
- **Source**: gh-search

## Summary
Structured screenshot analysis skill for AI coding tools. Implements a 3-level analysis framework (Map, System, Blueprint) that forces the AI to build a structured intermediate representation before responding about UI screenshots. Based on research from Microsoft OmniParser, DCGen, and Google ScreenAI. Includes telemetry, auto-update, and self-rating systems.

## Assessment
The core 3-level analysis methodology (spatial grid mapping -> design system extraction -> implementation blueprint) is a genuine procedural innovation. The gate check (is this a UI? is this about building UI?) and the escalation logic (Level 3 only when building) are well-designed. The self-rating and feedback loop system is interesting but tightly coupled to the clearshot brand. The methodology itself is transferable as a "screenshot-to-implementation" process. The telemetry/update infrastructure is not transferable.

## Extraction Priority
- Medium
- Rationale: The 3-level analysis protocol is a solid specialization process for frontend development workflows. However, it is prompt engineering rather than a multi-step orchestrated process -- it runs in a single agent turn. Plugin value is moderate since it requires multimodal image capabilities.

---

## Processes
- **screenshot-to-implementation**: Structured UI screenshot analysis pipeline
  - Source: SKILL.md (full file, ~400 lines)
  - Placement: specializations/shared/ (cross-domain; applies to any frontend project)
  - Inputs: Screenshot image path, context (critique vs implementation vs comparison)
  - Outputs: Structured analysis document with spatial map, design system tokens, and optionally a full implementation blueprint
  - Complexity: moderate
  - Notes: The 3-level analysis (Map/System/Blueprint) with automatic escalation to Level 3 when building is the core extractable pattern. The gate check, spatial grid methodology, and design token extraction protocol are the valuable parts. Strip telemetry, auto-update, self-rating, and field report systems.

## Plugin Ideas
- **clearshot**: Screenshot intelligence for UI implementation
  - What install.md would do: Copy the skill definition with the 3-level analysis protocol, create a ~/.clearshot/ state directory for field reports, register the skill for auto-trigger on UI screenshot analysis requests
  - Processes it would copy: The screenshot-to-implementation process (simplified, without telemetry)
  - Configs/hooks it would create: PostToolUse hook on Read (image files) that suggests the clearshot analysis when a PNG/JPG is read in a frontend context
  - Source evidence: SKILL.md gate check, Level 1-3 analysis protocols, output format specifications
  - Category: DevExp (Developer Experience)

## Implicit Procedural Knowledge
- **Spatial grid analysis protocol**: 5x5 grid decomposition of UI screenshots
  - Source: SKILL.md Level 1 (Map)
  - Placement: specializations/shared/
  - Why codify: Forces systematic spatial awareness instead of vague "I see a dashboard" responses. The element inventory format (type, label, position, state, size, colors, border, shadow, icon) is a reusable structured extraction template.
  - Sketch: Phase 1: Gate check (UI image? building context?). Phase 2: 5x5 grid mapping with section identification. Phase 3: Element inventory per section. Phase 4: Design system extraction (colors hex, typography px, spacing patterns). Phase 5: Blueprint escalation (layout architecture, interaction map, responsive context) -- only when building.

- **Design token extraction protocol**: Systematic extraction of design system from visual inspection
  - Source: SKILL.md Level 2 (System)
  - Placement: specializations/shared/
  - Why codify: The structured format (page bg, card bg, primary action, text primary/secondary, border, accent, destructive, success -- all hex) combined with qualitative assessment (cohesive vs patchwork) is a reusable pattern for any design review workflow.
  - Sketch: Input: screenshot + Level 1 analysis. Output: Color palette (10 named slots with hex), typography scale (heading/body/caption with px/weight/family), spacing pattern classification (tight/comfortable/spacious), border radius pattern, density classification.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Screenshot-to-Implementation | NEW | Structured UI screenshot analysis pipeline with 3-level analysis framework | - | specializations/shared/screenshot-to-implementation.js |
| Spatial Grid Analysis Protocol | NEW | 5x5 grid decomposition of UI screenshots with systematic element inventory | - | specializations/shared/spatial-grid-analysis-protocol.js |
| Design Token Extraction Protocol | NEW | Systematic design system extraction from visual inspection with structured format | - | specializations/shared/design-token-extraction-protocol.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Clearshot | NEW | Screenshot intelligence for UI implementation with 3-level analysis protocol | - | plugins/a5c/marketplace/blueprints/clearshot/ |
