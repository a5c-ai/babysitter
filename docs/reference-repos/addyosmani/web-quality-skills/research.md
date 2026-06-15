# addyosmani/web-quality-skills

- **GitHub**: https://github.com/addyosmani/web-quality-skills
- **Stars**: 1,730
- **License**: MIT
- **Last pushed**: 2026-03-13
- **Topics**: accessibility, agent-skills, claude-skills, core-web-vitals, lighthouse, skills, testing, web-performance
- **Source**: gh-search

## Description

Comprehensive collection of Agent Skills for optimizing web projects based on Google Lighthouse guidelines and Core Web Vitals best practices. Stack-agnostic (React, Vue, Angular, Svelte, Next.js, Nuxt, Astro, plain HTML). Follows the Agent Skills specification format (agentskills.io).

## Archetype

**domain-skill-pack** -- A focused collection of 6 web quality skills covering performance, accessibility, SEO, best practices, and Core Web Vitals.

## Structure

- `skills/` -- 6 skill directories, each with SKILL.md:
  - `web-quality-audit/` -- Comprehensive orchestrator skill that coordinates all other skills
  - `performance/` -- Loading speed, runtime efficiency, resource optimization (50+ patterns)
  - `core-web-vitals/` -- LCP, INP, CLS specific optimizations
  - `accessibility/` -- WCAG 2.2 compliance, screen readers, keyboard navigation (40+ rules)
  - `seo/` -- Search engine optimization, crawlability, structured data (30+ requirements)
  - `best-practices/` -- Security, modern APIs, code quality (20+ patterns)
- `CLAUDE.md` -- Claude Code instructions
- `AGENTS.md` -- GitHub Copilot agent instructions

## Key Capabilities

- Encodes 150+ Lighthouse audit patterns
- Core Web Vitals optimization (LCP, INP, CLS)
- WCAG 2.2 accessibility standards
- Framework-agnostic patterns
- Orchestrator skill (`web-quality-audit`) that coordinates sub-skills

---

## Processes

### 1. Web Quality Audit Process

- **Placement**: `specializations/domains/science/web-engineering/` or `specializations/shared/` (cross-domain, applies to any web project)
- **Description**: Multi-step web quality audit workflow modeled after the `web-quality-audit` orchestrator skill. Runs performance, accessibility, SEO, and best practices checks in sequence, producing a consolidated report with prioritized findings.
- **Steps**:
  1. Discover project framework and tech stack
  2. Run performance audit (critical rendering path, JS bundling, image optimization, font loading, caching)
  3. Run Core Web Vitals check (LCP, INP, CLS with specific thresholds)
  4. Run accessibility audit (WCAG 2.2 level AA, keyboard navigation, screen reader compatibility)
  5. Run SEO audit (meta tags, structured data, crawlability, canonical URLs)
  6. Run best practices check (security headers, HTTPS, modern APIs, deprecated patterns)
  7. Consolidate findings with severity levels and prioritized fix list
  8. Breakpoint: present findings and recommended fixes for approval
  9. Apply approved fixes
  10. Re-audit to verify improvements
- **Why it fits**: This is a genuine multi-step workflow with clear phases, breakpoints, and verification -- not just instructions but an orchestratable process.

## Plugin Ideas

### 1. Web Quality Audit Plugin

- **Category**: Quality Assurance & Testing
- **Plugin name**: `web-quality-audit`
- **Description**: Wraps Lighthouse/CWV audit patterns as a babysitter plugin with configurable thresholds, framework detection, and CI/CD integration.
- **install.md approach**: Install Lighthouse CI or use Chrome DevTools Protocol, configure quality thresholds in plugin settings, add pre-commit or pre-deploy hooks
- **Key features**:
  - Configurable quality thresholds (e.g., LCP < 2.5s, CLS < 0.1, accessibility score > 90)
  - Framework-specific optimization suggestions (Next.js, Nuxt, Astro, etc.)
  - Pre-deploy quality gate via breakpoints
  - Progressive improvement tracking across runs
  - WCAG compliance level configuration (A, AA, AAA)
- **Integration surface**: hooks (`pre-commit`, `post-planning`), commands (`quality:audit`, `quality:report`), breakpoint rules (block deploy if scores below threshold)

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Web Quality Audit Process | NEW | Multi-step web quality audit workflow with performance, accessibility, SEO, and best practices checks | - | specializations/frontend/web-quality-audit.js |
| Core Web Vitals Optimization | NEW | LCP, INP, CLS optimization methodology with framework-specific patterns | - | specializations/frontend/core-web-vitals-optimization.js |
| WCAG Accessibility Audit | NEW | WCAG 2.2 compliance checking with screen reader and keyboard navigation validation | - | specializations/frontend/wcag-accessibility-audit.js |
| Web Performance Analysis | NEW | Critical rendering path, JS bundling, and resource optimization analysis | - | specializations/frontend/web-performance-analysis.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Web Quality Audit | NEW | Lighthouse/CWV audit integration with configurable thresholds and CI/CD hooks | - | plugins/a5c/marketplace/blueprints/web-quality-audit/ |

## Skipped

- Individual skill content (SKILL.md bodies) are instruction sets, not processes -- they provide guidelines but not orchestratable workflows
- The skills themselves follow the agentskills.io format which is a different ecosystem from babysitter plugins
