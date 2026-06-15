# yctimlin/mcp_excalidraw

- **Archetype**: utility-with-skill
- **Stars**: 1,698
- **Last pushed**: 2026-03-06
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 1

## Summary
MCP server and Claude Code skill for Excalidraw -- a programmatic canvas toolkit for creating, editing, and exporting diagrams via AI agents with real-time canvas sync. The skill provides dual-mode operation (MCP preferred, REST fallback) with detailed format difference documentation between modes. Covers element CRUD, alignment, distribution, grouping, snapshot/restore, viewport control, and image export.

## Assessment
MEDIUM VALUE. The dual-interface pattern (MCP tools + REST API fallback) with explicit format difference documentation is architecturally interesting and transferable. The skill's connection mode detection workflow (try MCP -> fall back to REST -> guide setup if neither works) is a reusable resilience pattern. The coordinate system documentation with spacing guidelines shows how to encode spatial reasoning for agents. The format differences table (labels, arrow binding, fontFamily) between MCP and REST modes demonstrates the importance of documenting API surface inconsistencies when wrapping external tools.

## Extraction Priority
- Low
- Rationale: Primarily a tool integration, not a methodology. The dual-mode pattern and format difference documentation are useful patterns but not sufficient for a standalone babysitter process. The Excalidraw-specific content is not transferable.

## Processes
- **Diagram Creation Pipeline**: Determine connection mode -> plan layout with coordinate system -> batch create elements -> connect with arrows -> refine using describe_scene feedback -> export. The iterative refinement loop (create -> screenshot -> describe -> adjust) is a visual feedback pattern applicable to any diagram generation process.

## Plugin Ideas
- **Excalidraw Canvas plugin**: A babysitter marketplace plugin wrapping the MCP server + skill. Install.md would handle server setup, MCP registration, and canvas server startup. Provides diagram creation skills with automatic mode detection.
- **Dual-Mode Tool Wrapper template**: A plugin template for wrapping any tool that has both MCP and REST interfaces, with automatic mode detection and format normalization.

## Patterns
- **Dual-mode connection detection**: Try preferred mode (MCP) -> fall back to alternative (REST) -> guide setup if neither available. Three-tier degradation with user guidance at each level.
- **Format difference documentation**: Explicit table documenting field name differences between API surfaces (MCP vs REST). Critical for avoiding subtle bugs when wrapping external tools.
- **Visual feedback loop**: Create elements -> take screenshot -> describe scene -> refine. Iterative improvement using the agent's own visual perception.
- **Coordinate system documentation**: Explicit origin, axis directions, and spacing guidelines for spatial reasoning. Essential for any skill that generates visual layouts.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Diagram Creation Pipeline | NEW | Multi-step diagram creation with connection mode detection and iterative refinement | - | specializations/shared/diagram-creation-pipeline.js |
| Dual-Mode Connection Detection | NEW | Three-tier degradation pattern: preferred mode → fallback → user guidance | - | specializations/shared/dual-mode-connection-detection.js |
| Format Difference Documentation | NEW | Systematic documentation of API surface inconsistencies between modes | - | specializations/shared/format-difference-documentation.js |
| Visual Feedback Loop | NEW | Iterative visual improvement using screenshot analysis and scene description | - | specializations/shared/visual-feedback-loop.js |
| Coordinate System Documentation | NEW | Spatial reasoning guidelines with origin, axis directions, and spacing specifications | - | specializations/shared/coordinate-system-documentation.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Excalidraw Canvas Plugin | NEW | MCP server wrapper with automatic mode detection and canvas creation skills | - | plugins/a5c/marketplace/blueprints/excalidraw-canvas/ |
| Dual-Mode Tool Wrapper Template | NEW | Template for wrapping tools with both MCP and REST interfaces with format normalization | - | plugins/a5c/marketplace/blueprints/dual-mode-tool-wrapper/ |
