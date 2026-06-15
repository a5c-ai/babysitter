# awesome-skills/code-review-skill

## Metadata
- **Stars:** 263
- **License:** MIT
- **Last pushed:** 2026-03-01
- **Description:** A comprehensive code review skill for Claude Code, covering React 19, Vue 3, Rust, TypeScript, TanStack Query v5, and more.

## Archetype: Specialization Process (code-review domain)

## Structure
- `SKILL.md` — Main skill definition with phased review methodology
- `reference/` — 16 language/framework-specific review guides (react.md, vue.md, rust.md, typescript.md, python.md, java.md, go.md, c.md, cpp.md, css-less-sass.md, qt.md, architecture-review-guide.md, performance-review-guide.md, common-bugs-checklist.md, security-review-guide.md, code-review-best-practices.md)
- `assets/` — PR review templates and checklists
- `scripts/` — Supporting automation

## Extractable Value

### As a Babysitter Process: `specializations/shared/code-review-excellence`
Cross-domain, language-aware code review methodology with:
1. **4-phase structured review process** — Context Gathering (2-3 min) -> High-Level Review (5-10 min) -> Line-by-Line Review (10-20 min) -> Summary & Decision (2-3 min)
2. **Severity labeling system** — blocking / important / nit / suggestion / learning / praise
3. **Question-based feedback technique** — Asks "What happens if..." instead of declaring "This is wrong"
4. **Language-specific deep guides** — 11 languages/frameworks with anti-patterns, common bugs, and best practices per language
5. **Cross-cutting review guides** — Architecture, performance, security, and common bugs checklists

### Key Differentiators from Existing
- The phased time-boxed approach is a concrete methodology (not just a checklist)
- Language-specific reference guides are modular and composable
- Severity labeling system is well-defined and actionable
- Emphasis on "educational, not judgmental" feedback aligns with collaborative review culture

### Plugin Idea: `code-review-excellence`
install.md-driven plugin that provides:
- The SKILL.md as a skill
- Language-specific reference files as context
- Hook into `pre-commit` or PR review workflows

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| 4-Phase Code Review Process | NEW | Structured time-boxed review methodology with severity labeling | - | specializations/shared/code-review-excellence.js |
| Language-Specific Review Framework | NEW | Modular review guides for 11 languages/frameworks with anti-patterns | - | specializations/shared/language-specific-review.js |
| Educational Feedback Technique | NEW | Question-based code review methodology emphasizing learning over judgment | - | specializations/shared/educational-feedback.js |
| Cross-Cutting Review Process | NEW | Architecture, performance, and security review checklists | - | specializations/shared/cross-cutting-review.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Code Review Excellence | NEW | Multi-language code review setup with phased methodology and hooks | - | plugins/a5c/marketplace/blueprints/code-review-excellence/ |

## Classification Rationale
This is a cross-domain specialization (not a full dev methodology). The review process is applicable to any language/framework, so it fits in `specializations/shared/`. The language-specific guides are modular reference material.
