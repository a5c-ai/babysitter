# nextlevelbuilder/ui-ux-pro-max-skill

- **Full name**: nextlevelbuilder/ui-ux-pro-max-skill
- **Description**: An AI SKILL that provides design intelligence for building professional UI/UX across multiple platforms
- **Stars**: 63,594
- **License**: MIT
- **Last pushed**: 2026-04-03
- **Topics**: ai-skills, claude, claude-code, codex, cursor-ai, react, tailwindcss, ui-design, uikit, windsurf-ai
- **Fork**: No
- **Source**: gh-search

## Archetype

**domain-skill-pack** -- A comprehensive UI/UX design intelligence system with 161 reasoning rules, 67 UI styles, design system generation, color palettes, typography pairing, and landing page patterns. Ships as a Claude Code plugin with CLI installer (`uipro-cli`).

## Structure

```
.claude-plugin/       # Plugin manifest
.claude/              # Claude Code integration
cli/                  # NPM CLI installer (uipro-cli)
src/ui-ux-pro-max/
  data/               # CSV knowledge bases
    products.csv      # 161 product categories
    styles.csv        # 67 UI styles
    colors.csv        # Color palettes
    typography.csv    # Font pairings
    landing.csv       # Landing page patterns
    charts.csv        # Chart recommendations
    icons.csv         # Icon set recommendations
    design.csv        # Design system rules
    ui-reasoning.csv  # Reasoning rules
    ux-guidelines.csv # UX guidelines
  templates/          # Platform-specific templates
    base/             # Base templates
    platforms/        # Per-platform variants
  scripts/            # Build/sync scripts
skill.json            # Skill manifest
docs/                 # Documentation
```

## Key Techniques

1. **Multi-domain BM25 search** -- 5 parallel searches across product types, styles, colors, patterns, typography to build a complete design system recommendation
2. **Reasoning engine** -- JSON condition rules that match product type to UI category, apply style priorities, filter anti-patterns by industry
3. **Design system generation** -- Full design system (pattern, style, colors, typography, effects, anti-patterns, pre-delivery checklist) from a single natural language description
4. **CSV knowledge bases** -- All design intelligence stored as searchable CSVs rather than embedded in prompts
5. **Platform-aware templates** -- Separate templates for different frameworks (React, Vue, etc.)

---

## Processes

### 1. UI/UX Design System Generation (specializations/frontend/ui-ux-design-system-generation)

A process that takes a product description and generates a complete, tailored design system through multi-domain parallel search and reasoning.

**Phases:**
1. Parse product description and extract domain signals (industry, audience, brand tone)
2. Parallel search across 5 knowledge domains: product type matching, style recommendations, color palette selection, landing page patterns, typography pairing
3. Reasoning engine applies style priorities, filters anti-patterns, processes decision rules
4. Generate complete design system: pattern, style, colors, typography, effects, anti-patterns, pre-delivery checklist
5. Breakpoint for human review of generated design system
6. Apply design system to scaffold project structure with platform-appropriate templates

**Key insight from repo:** The multi-domain parallel search pattern (5 independent CSV searches merged by a reasoning engine) is a strong fit for babysitter's `ctx.parallel.all()`.

### 2. UI/UX Audit and Quality Gate (specializations/frontend/ui-ux-audit)

A process that audits an existing UI implementation against design best practices, accessibility standards, and anti-patterns.

**Phases:**
1. Scan project for UI components and extract current design patterns
2. Check accessibility compliance (WCAG AA minimum contrast, focus states, prefers-reduced-motion)
3. Validate against anti-patterns for the detected industry/domain
4. Check responsive breakpoints (375px, 768px, 1024px, 1440px)
5. Generate pre-delivery checklist with pass/fail status
6. Breakpoint with findings report for human review

## Plugin Ideas

### 1. Design Intelligence Knowledge Base (Category: Knowledge Management)

A babysitter plugin that ships searchable CSV knowledge bases for UI/UX design decisions. The plugin provides:
- Product-to-style matching (161 categories)
- Color palette recommendations by industry
- Typography pairing suggestions (57 combinations)
- Landing page pattern library (24 patterns)
- Anti-pattern databases by industry

**install.md**: Copies CSV data files to plugin state directory, registers a `design-intelligence` task kind that processes can use to query the knowledge base.

### 2. Design System Linter Hook (Category: Quality Assurance & Testing)

A babysitter plugin that adds a `pre-commit` hook checking UI code against design system rules. Validates:
- No emoji-as-icon patterns (should use SVG icon libraries)
- cursor-pointer on clickable elements
- Hover state transitions in 150-300ms range
- Color contrast ratios meet WCAG AA
- Responsive breakpoint coverage

**install.md**: Installs pre-commit hook that runs design linting on changed `.tsx`/`.vue`/`.svelte` files.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| UI/UX Design System Generation | NEW | Multi-domain parallel search with reasoning engine for complete design system generation | - | specializations/frontend/ui-ux-design-system-generation.js |
| UI/UX Audit and Quality Gate | NEW | Design system validation with accessibility compliance and anti-pattern checking | - | specializations/frontend/ui-ux-audit.js |
| Multi-Domain Parallel Search Pattern | NEW | Parallel knowledge base searches with reasoning engine merge | - | specializations/shared/multi-domain-parallel-search.js |
| Design Intelligence Knowledge Query | NEW | CSV-based design knowledge lookup and recommendation system | - | specializations/frontend/design-intelligence-query.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Design Intelligence Knowledge Base | NEW | CSV knowledge bases for UI/UX design decisions with searchable data | - | plugins/a5c/marketplace/blueprints/design-intelligence/ |
| Design System Linter | NEW | Pre-commit hook for UI code validation against design system rules | - | plugins/a5c/marketplace/blueprints/design-system-linter/ |
