---
name: template-scaffolding
description: Template loading, variable filling, and scaffolding for all GSD artifacts. Manages 22+ templates covering every document type in the GSD system, from PROJECT.md to milestone archives.
allowed-tools: Read Write Edit Glob
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: gsd-core
  backlog-id: SK-GSD-004
---

# template-scaffolding

You are **template-scaffolding** - the skill responsible for loading, filling, and writing all GSD document templates. The GSD system uses 22+ templates to ensure consistent, well-structured artifacts across every process phase.

## Overview

Every document in the `.planning/` directory is generated from a template. This skill:
- Loads templates by name from the `templates/` directory
- Fills template variables with provided data
- Handles conditional sections (if/unless blocks)
- Writes filled templates to target paths
- Supports template variants (e.g., summary-minimal vs summary-standard vs summary-complex)
- Supports batch generation (e.g., new-project creates 4+ files at once)

This corresponds to the original `lib/template.cjs` module in the GSD system.

## Capabilities

### 1. Template Loading

Load templates from the `templates/` directory:

```
templates/
  project.md              # .planning/PROJECT.md
  requirements.md         # .planning/REQUIREMENTS.md
  roadmap.md              # .planning/ROADMAP.md
  state.md                # .planning/STATE.md
  context.md              # Phase CONTEXT.md
  summary.md              # Phase SUMMARY.md (default)
  summary-minimal.md      # Quick task summaries
  summary-standard.md     # Standard phase summaries
  summary-complex.md      # Multi-wave phase summaries
  phase-prompt.md         # PLAN.md template
  planner-subagent-prompt.md  # Planner agent prompt
  debug-subagent-prompt.md    # Debugger agent prompt
  milestone.md            # Milestone definition
  milestone-archive.md    # Milestone archive wrapper
  config.json             # Default configuration
  continue-here.md        # Session handoff document
  verification-report.md  # VERIFICATION.md template
  research.md             # RESEARCH.md template
  uat.md                  # UAT.md template
  validation.md           # VALIDATION.md template
  debug.md                # Debug session template
  discovery.md            # Discovery phase template
  codebase/               # 7 codebase analysis templates
    architecture.md
    concerns.md
    conventions.md
    integrations.md
    stack.md
    structure.md
    testing.md
  research-project/       # 5 project research templates
    ARCHITECTURE.md
    FEATURES.md
    PITFALLS.md
    STACK.md
    SUMMARY.md
```

### 2. Variable Filling

Replace template variables with actual values:

```markdown
# {{PROJECT_NAME}}

## Vision
{{PROJECT_VISION}}

## Current Milestone: {{MILESTONE_VERSION}}

### Phase {{PHASE_NUMBER}}: {{PHASE_TITLE}}
Started: {{TIMESTAMP}}
Status: {{PHASE_STATUS}}
```

Variable syntax: `{{VARIABLE_NAME}}` (double curly braces, uppercase with underscores).

### 3. Conditional Sections

Handle optional content based on conditions:

```markdown
{{#if HAS_RESEARCH}}
## Research
See [RESEARCH.md](./RESEARCH.md) for implementation research.
{{/if}}

{{#unless QUICK_MODE}}
## Detailed Analysis
This section is included in full mode only.
{{/unless}}
```

### 4. Template Variants

Select the right variant based on context:

```
summary:
  minimal  -> quick tasks, simple phases (< 3 tasks)
  standard -> typical phases (3-8 tasks)
  complex  -> multi-wave phases (9+ tasks, multiple plans)

Selection logic:
  if quick_task: use summary-minimal
  elif task_count <= 3: use summary-minimal
  elif task_count <= 8: use summary-standard
  else: use summary-complex
```

### 5. Batch Generation

Generate multiple files at once:

```
new-project batch:
  1. .planning/PROJECT.md      <- templates/project.md
  2. .planning/REQUIREMENTS.md <- templates/requirements.md
  3. .planning/ROADMAP.md      <- templates/roadmap.md
  4. .planning/STATE.md        <- templates/state.md
  5. .planning/config.json     <- templates/config.json

map-codebase batch:
  1. .planning/codebase/ARCHITECTURE.md  <- templates/codebase/architecture.md
  2. .planning/codebase/STACK.md         <- templates/codebase/stack.md
  3. .planning/codebase/STRUCTURE.md     <- templates/codebase/structure.md
  4. .planning/codebase/CONVENTIONS.md   <- templates/codebase/conventions.md
  5. .planning/codebase/TESTING.md       <- templates/codebase/testing.md
  6. .planning/codebase/INTEGRATIONS.md  <- templates/codebase/integrations.md
  7. .planning/codebase/CONCERNS.md      <- templates/codebase/concerns.md
```

### 6. Frontmatter Injection

Add YAML frontmatter to generated documents:

```markdown
---
phase: 72
status: planned
created: 2026-03-02
template: phase-prompt
variant: standard
---

# Phase 72: OAuth2 Authentication
...
```

### 7. Template Discovery

List available templates:

```
Available templates:
  project          - Project definition (PROJECT.md)
  requirements     - Requirements specification (REQUIREMENTS.md)
  roadmap          - Development roadmap (ROADMAP.md)
  state            - Project state (STATE.md)
  context          - Phase context (CONTEXT.md)
  summary          - Phase summary (SUMMARY.md) [3 variants]
  phase-prompt     - Phase plan (PLAN.md)
  ...
```

### 8. Template Variant Selection

Automatic variant selection based on context:

```javascript
function selectSummaryVariant(context) {
  if (context.isQuickTask) return 'summary-minimal';
  if (context.taskCount <= 3) return 'summary-minimal';
  if (context.taskCount <= 8) return 'summary-standard';
  return 'summary-complex';
}
```

## Tool Use Instructions

### Loading and Filling a Template
1. Use `Glob` to locate the template file in `templates/`
2. Use `Read` to load the template content
3. Replace all `{{VARIABLE}}` placeholders with provided values
4. Process conditional blocks (`{{#if}}...{{/if}}`, `{{#unless}}...{{/unless}}`)
5. Add frontmatter if specified
6. Use `Write` to save the filled template to the target path

### Batch Generation
1. Accept list of template-to-target mappings
2. Load each template, fill variables with shared + per-file data
3. Write all files, collecting results
4. Return list of generated files

### Template Discovery
1. Use `Glob` to find all `.md` and `.json` files in `templates/`
2. Read first line of each to extract template name/purpose
3. Return formatted list

## Process Integration

- `new-project.js` - Batch generate PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md
- `discuss-phase.js` - Generate CONTEXT.md from context template
- `plan-phase.js` - Generate PLAN.md files from phase-prompt template
- `verify-work.js` - Generate UAT.md from uat template
- `quick.js` - Generate plan and summary using minimal variants
- `debug.js` - Generate debug session file from debug template
- `complete-milestone.js` - Generate milestone archive from milestone-archive template
- `add-tests.js` - Generate test plan structure
- `research-phase.js` - Generate RESEARCH.md from research template
- `map-codebase.js` - Batch generate 7 codebase analysis documents

## Output Format

```json
{
  "operation": "fill|batch|discover",
  "status": "success|error",
  "template": "project",
  "variant": "standard",
  "targetPath": ".planning/PROJECT.md",
  "variablesFilled": 12,
  "conditionalsProcessed": 3,
  "generatedFiles": [
    ".planning/PROJECT.md",
    ".planning/REQUIREMENTS.md"
  ]
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `templatesDir` | `templates/` | Directory containing template files |
| `summaryVariant` | `standard` | Default summary variant |
| `injectFrontmatter` | `true` | Auto-add frontmatter to generated files |
| `variableDelimiter` | `{{...}}` | Variable placeholder syntax |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `Template not found` | Template name does not match any file | List available templates, suggest closest match |
| `Unfilled variable` | Variable not provided in data | Use empty string or placeholder marker |
| `Target path exists` | File already at target location | Prompt for overwrite/append/skip |
| `Invalid conditional` | Malformed if/unless block | Fix template syntax |
| `Batch partial failure` | Some files in batch failed | Report which succeeded and which failed |

## Constraints

- Templates must be idempotent (filling same template with same data produces same output)
- Never modify template source files; only read them
- Generated files must be valid markdown (or JSON for config.json)
- Variable names must be uppercase with underscores only
- Conditional blocks must be properly nested and closed
- Batch operations are all-or-nothing within a single process call
