# lackeyjb/playwright-skill

- **URL**: https://github.com/lackeyjb/playwright-skill
- **Stars**: 2,394
- **License**: MIT
- **Pushed**: 2025-12-19
- **Fork**: No
- **Archetype**: utility-with-skill (single-purpose browser automation skill)

## Overview

Claude Code plugin that enables Claude to write and execute arbitrary Playwright automation on-the-fly. Model-invoked (Claude decides when to use it). Uses progressive disclosure pattern (minimal SKILL.md with full API reference loaded on demand). Visible browser by default (headless: false). Includes smart temp file cleanup and universal module resolution.

## Structure

```
.claude-plugin/               # Plugin metadata
skills/
  playwright-skill/
    SKILL.md                  # Progressive disclosure skill definition
```

## Extractable Value

### Processes

- No full development methodology to extract. Single-purpose tool.

### Plugin Ideas

1. **Browser Automation Plugin** (babysitter marketplace)
   - Wraps Playwright for model-invoked browser automation during process runs
   - Progressive disclosure pattern is worth adopting: minimal context by default, full API on demand
   - install.md-driven with npm setup script
   - Could enhance webapp-testing processes with on-demand browser interaction

### SKIP Reasons

- Not a methodology or process pattern
- The progressive disclosure pattern is the main architectural insight
- Overlaps significantly with anthropics/skills webapp-testing skill

### Notes

- MIT license, very permissive
- The progressive disclosure pattern (concise SKILL.md + lazy-loaded API reference) is a good practice to adopt in babysitter skill design
- Hasn't been updated since Dec 2025 - may be stale

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| N/A | N/A | No multi-step processes identified - single-purpose tool, not a methodology | - | N/A |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Browser Automation Plugin | POTENTIAL OVERLAP | Model-invoked Playwright automation with progressive disclosure | plugins/a5c/marketplace/blueprints/dev-browser/ | plugins/a5c/marketplace/blueprints/browser-automation-plugin/ |
