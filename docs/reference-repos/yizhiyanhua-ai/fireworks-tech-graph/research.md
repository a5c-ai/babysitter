# yizhiyanhua-ai/fireworks-tech-graph

- **Archetype**: utility-with-skill
- **Stars**: 1,512
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 1

## Summary
Claude Code skill for generating production-quality SVG+PNG technical diagrams. Supports 8 diagram types and 5 visual styles with deep AI/Agent domain knowledge. Uses rsvg-convert for SVG-to-PNG export. Includes 4 helper scripts: generate-diagram.sh (validate+export), generate-from-template.py (template-based SVG creation), validate-svg.sh (syntax validation), and test-all-styles.sh (batch testing). Bilingual triggers (Chinese + English).

## Assessment
MEDIUM VALUE. The helper script architecture is well-designed: a Python template renderer produces SVGs from structured JSON input (title, nodes, arrows, legend), a bash validator checks XML syntax/tag balance/marker references/path data, and a test script batch-validates all styles. This validation-centric approach to SVG generation (generate -> validate -> export) is a reusable pattern for any code-generation skill. The template-based generation avoids the fragility of raw SVG string construction. The bilingual trigger pattern shows how to make skills accessible across language communities.

## Extraction Priority
- Low-Medium
- Rationale: The diagram generation procedure and validation pipeline are useful patterns, but the skill is primarily a rendering tool. The template-based generation + validation loop is the most transferable element.

## Processes
- **Validated Diagram Generation Process**: Select diagram type + style -> generate from template with structured JSON -> validate SVG (XML syntax, tag balance, markers, paths, attributes) -> export PNG. The validation step prevents malformed output.
- **Batch Style Testing**: Generate diagrams across multiple sizes and styles -> validate all -> produce test report. A CI-like quality gate for visual output.

## Plugin Ideas
- **Tech Diagram Generator plugin**: Install.md-driven plugin that adds diagram generation skills with template-based SVG creation and validation. Configurable diagram types and visual styles.

## Patterns
- **Template-based generation with validation**: Generate from structured input (JSON) via templates rather than raw string construction. Validate output before delivery. Prevents fragile code generation.
- **Helper script decomposition**: Four focused scripts (generate, template-render, validate, batch-test) each handling one concern. The skill orchestrates them as a pipeline.
- **Bilingual triggers**: Both Chinese and English trigger phrases in the skill description. Simple internationalization for skill discovery.
- **SVG validation checklist**: XML syntax, tag balance, marker references, attribute completeness, path data integrity. A reusable validation pattern for any structured output format.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Validated Diagram Generation Process | NEW | Template-based SVG creation with comprehensive validation and PNG export | - | specializations/shared/validated-diagram-generation.js |
| Batch Style Testing | NEW | CI-like quality gate for visual output across multiple styles and sizes | - | specializations/shared/batch-style-testing.js |
| Template-Based Generation with Validation | NEW | Structured input generation via templates with output validation to prevent fragility | - | specializations/shared/template-based-generation-validation.js |
| Bilingual Triggers | NEW | Internationalization pattern with both Chinese and English trigger phrases | - | specializations/shared/bilingual-triggers.js |
| SVG Validation Checklist | NEW | Comprehensive validation pattern for structured output formats | - | specializations/shared/svg-validation-checklist.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Tech Diagram Generator Plugin | NEW | Template-based diagram generation with validation and configurable styles | - | plugins/a5c/marketplace/blueprints/tech-diagram-generator/ |
