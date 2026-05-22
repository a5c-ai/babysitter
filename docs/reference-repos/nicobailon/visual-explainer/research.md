# nicobailon/visual-explainer

- **Archetype**: utility-with-skill
- **Stars**: 7,484
- **Last pushed**: 2026-03-29
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: gh-search (keyword: "agent skill")
- **Skills found**: 1 (SKILL.md content not retrievable at scan time)

## Summary
Agent skill that generates rich HTML pages or slide decks for diagrams, diff reviews, plan audits, data tables, and project recaps. Produces visual artifacts from structured data.

## Assessment
MEDIUM VALUE. The visualization generation procedure is a useful cross-domain capability. The specific output types (diff reviews, plan audits, project recaps) align well with babysitter's orchestration needs -- particularly plan audits and project recap visualization.

## Extraction Priority
MEDIUM -- Plan audit visualization and project recap generation are useful for babysitter observability and retrospection workflows.

## Processes
1. **visual-artifact-generation** -- Transform structured data into rich HTML visualization (diagrams, tables, slides)
2. **plan-audit-visualization** -- Generate visual plan audit reports
3. **diff-review-presentation** -- Create visual diff review artifacts

## Plugin Ideas
- **visual-reports plugin**: Babysitter plugin that generates HTML reports from run data, journal events, and retrospection results

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Visual Artifact Generation | NEW | Transform structured data into rich HTML visualizations (diagrams, tables, slides) | - | specializations/shared/visual-artifact-generation.js |
| Plan Audit Visualization | NEW | Generate visual plan audit reports with structured presentation | - | specializations/shared/plan-audit-visualization.js |
| Diff Review Presentation | NEW | Create visual diff review artifacts with HTML-based presentation | - | specializations/shared/diff-review-presentation.js |
| HTML-as-Artifact Pattern | NEW | Generate self-contained HTML pages as deliverable artifacts with multi-format support | - | specializations/shared/html-as-artifact-pattern.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Visual Reports Generator | NEW | HTML report generation from run data, journal events, and retrospection results | - | plugins/a5c/marketplace/plugins/visual-reports-generator/ |

## Implicit Procedural Knowledge
- HTML-as-artifact pattern: generating self-contained HTML pages as deliverables
- Multi-format output (page vs slide deck) from same structured input
