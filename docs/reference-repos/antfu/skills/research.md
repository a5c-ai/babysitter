# antfu/skills

- **Archetype**: mega-skill-pack
- **Stars**: 4,559
- **Last pushed**: 2026-03-16
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 17 SKILL.md files in skills/
- **Fork**: No
- **Source**: gh-search

## Summary

Anthony Fu's curated collection of agent skills for the Vue/Vite/Nuxt ecosystem. Self-described as a "proof-of-concept for generating agent skills from source documentation and keeping them in sync." Uses git submodules to reference upstream documentation sources.

Three types of skills:
1. **Hand-maintained**: antfu (opinionated personal preferences for app/library projects)
2. **Generated from docs**: vue, nuxt, pinia, vite, vitepress, vitest, unocss, pnpm (generated from official docs, fine-tuned)
3. **Vendored**: slidev, tsdown, turborepo, vueuse-functions, vue-best-practices, vue-router-best-practices, vue-testing-best-practices, web-design-guidelines (synced from external repos)

Notable: includes a meta-system for generating skills from documentation sources (meta.ts + scripts/). The repo itself is a template for creating skill collections.

## Assessment

Moderate extractable value. The Vue/Nuxt/Vite skills are ecosystem-specific. The real value is the meta-pattern: generating skills from documentation sources and keeping them synced via git submodules. The opinionated "antfu" skill demonstrates how personal coding preferences can be codified.

**Extraction priority**: MEDIUM-LOW

---

## Processes

### 1. Vue/Nuxt Application Quality Review
- **Source skills**: vue-best-practices, vue-testing-best-practices, vue-router-best-practices, pinia
- **Placement**: `specializations/shared/vue-nuxt-quality-review.js`
- **Description**: Quality gate process for Vue/Nuxt projects: Composition API pattern check -> state management review (Pinia best practices) -> router configuration audit -> test coverage assessment -> SSR/hydration safety check. Focused on modern Vue 3 + TypeScript patterns.

### 2. Documentation-to-Skill Generation Pipeline
- **Source**: meta.ts, scripts/, AGENTS.md generation guidelines
- **Placement**: `methodologies/doc-to-skill-generation.js` (this is a generic dev methodology -- generating skills from any documentation source)
- **Description**: Process for converting documentation into agent skills: identify source repos -> clone/submodule docs -> extract key patterns/rules -> generate SKILL.md with examples -> validate skill quality -> set up sync mechanism for updates.

## Plugin Ideas

### 1. Skill Sync Plugin
- **Category**: Knowledge Management
- **install.md**: Configures automatic syncing of vendored skills from upstream repositories using git submodules. Detects stale skills, pulls updates, and validates SKILL.md format integrity. Supports both global and project-scoped skill libraries.

## Implicit Procedural Knowledge

- **Documentation-to-skill generation**: The meta.ts + scripts pipeline demonstrates a replicable pattern for converting any library's documentation into structured agent skills. This is a meta-capability worth codifying.
- **Opinionated preference codification**: The hand-maintained "antfu" SKILL.md shows how individual developer preferences (ESLint config, package manager choice, testing framework) can be captured as a skill -- relevant for babysitter's profile system.
- **Skill vendoring pattern**: Using git submodules to keep third-party skills in sync while allowing local customization. This informs how the babysitter process library could handle external skill imports.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Vue/Nuxt Application Quality Review | NEW | Vue 3 + TypeScript quality gate with Composition API and SSR checks | - | specializations/frontend/vue-nuxt-quality-review.js |
| Documentation-to-Skill Generation Pipeline | NEW | Convert documentation into structured agent skills with sync mechanism | - | methodologies/doc-to-skill-generation/ |
| Vue Best Practices Audit | NEW | Modern Vue 3 development pattern validation and code review | - | specializations/frontend/vue-best-practices-audit.js |
| Nuxt Application Development Process | NEW | SSR/SSG application development with Nuxt framework patterns | - | specializations/frontend/nuxt-application-development.js |
| Pinia State Management Review | NEW | Vue state management pattern validation and optimization | - | specializations/frontend/pinia-state-management-review.js |
| Vite Build Optimization | NEW | Vite build configuration and performance optimization workflow | - | specializations/frontend/vite-build-optimization.js |
| Vue Testing Strategy Implementation | NEW | Vue component testing with Vitest and Vue Testing Library patterns | - | specializations/frontend/vue-testing-strategy.js |
| Skill Vendoring and Sync | NEW | Git submodule-based skill syncing and update management | - | specializations/shared/skill-vendoring-sync.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Git Submodule Sync | NEW | Automatic syncing of vendored content from upstream repos via git submodules | - | plugins/a5c/marketplace/plugins/git-submodule-sync/ |
