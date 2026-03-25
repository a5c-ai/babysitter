# template-scaffolding

Template loading, variable filling, and document scaffolding for GSD artifacts.

## Quick Start

All GSD documents are generated from templates in the `templates/` directory. This skill loads a template, fills variables, and writes the result.

### Fill a Template

1. Load template from `templates/project.md`
2. Replace `{{PROJECT_NAME}}` with actual project name
3. Replace all other variables
4. Write to `.planning/PROJECT.md`

### Available Templates

| Template | Output | Used By |
|----------|--------|---------|
| project.md | PROJECT.md | new-project |
| requirements.md | REQUIREMENTS.md | new-project |
| roadmap.md | ROADMAP.md | new-project |
| state.md | STATE.md | new-project |
| context.md | CONTEXT.md | discuss-phase |
| phase-prompt.md | PLAN.md | plan-phase |
| summary.md | SUMMARY.md | all phases |
| debug.md | debug session | debug |
| research.md | RESEARCH.md | research-phase |
| uat.md | UAT.md | verify-work |

### Summary Variants

- `summary-minimal` - Quick tasks and simple phases
- `summary-standard` - Typical phases (3-8 tasks)
- `summary-complex` - Multi-wave phases (9+ tasks)

## Examples

### Generate PROJECT.md

Load `templates/project.md`, fill variables:
```
{{PROJECT_NAME}} -> "My Web App"
{{PROJECT_VISION}} -> "A modern web application for task management"
{{TIMESTAMP}} -> "2026-03-02"
```

### Batch Generation (New Project)

Generate all 4 planning documents at once:
1. `.planning/PROJECT.md`
2. `.planning/REQUIREMENTS.md`
3. `.planning/ROADMAP.md`
4. `.planning/STATE.md`

## Troubleshooting

### Template not found
- Check template name matches a file in `templates/`
- Use template discovery to list all available templates
- Template names are case-sensitive

### Variables not filled
- Ensure variable names match exactly (uppercase, underscores)
- Check that all required variables are provided in the data
- Unfilled variables are left as `{{VARIABLE_NAME}}` markers

### Generated file has wrong format
- Verify the correct template variant is being used
- Check conditional blocks are evaluating correctly
- Ensure frontmatter injection is enabled if expected
