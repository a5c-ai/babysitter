# callstackincubator/agent-skills

- **Archetype**: domain-skill-pack
- **Stars**: 1,230
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 10

## Summary
Agent-optimized React Native skills from Callstack (a leading React Native consulting firm). 10 skills organized across source skills/ (5 public), plugins/vendored/ (5 internal), and .claude/skills/ (1 meta-skill). Covers React Native best practices (performance optimization with impact ratings), brownfield migration, upgrading React Native, GitHub Actions, GitHub workflows, device testing, and Vercel integration. The react-native-best-practices skill is particularly deep -- an optimization guide structured as Quick Pattern/Command/Config/Reference + Deep Dive per topic, with CRITICAL/HIGH/MEDIUM impact ratings and a six-priority optimization hierarchy.

## Assessment
HIGH VALUE for domain specialization. The react-native-best-practices skill demonstrates expert-level encoding of performance optimization knowledge: FPS/re-renders (CRITICAL) -> bundle size (CRITICAL) -> TTI (HIGH) -> native performance (HIGH) -> memory management (MEDIUM-HIGH) -> animations (MEDIUM). The hybrid format (Quick Pattern for fast lookup + Deep Dive for full context) is a reusable skill structure pattern. The impact ratings with priority ordering provide a triage framework. The brownfield migration and upgrading skills represent procedural workflows for complex multi-step operations. Authoritative source (Callstack is a recognized React Native expert firm).

## Extraction Priority
- High
- Rationale: Authoritative domain expertise from a recognized React Native consultancy. The performance optimization priority hierarchy, impact ratings, and hybrid skill format (quick reference + deep dive) are directly transferable patterns. Brownfield migration and upgrading are complex multi-step processes ideal for babysitter orchestration.

## Processes
- **React Native Performance Optimization**: Measure -> identify category (FPS/bundle/TTI/native/memory/animations) -> apply priority-ordered fixes with impact ratings -> re-measure -> validate. An iterative convergence process with triage.
- **React Native Brownfield Migration**: Integrate React Native into existing native app with incremental adoption steps. A multi-phase migration process.
- **React Native Upgrade Process**: Version upgrade with dependency resolution, breaking change handling, and testing. A complex multi-step process with rollback gates.
- **Validate Skills Meta-Process**: .claude/skills/validate-skills/ -- a meta-skill for validating other skills in the collection. Quality assurance for skill content.

## Plugin Ideas
- **React Native Expert plugin**: Install.md-driven plugin with performance optimization skills, impact-rated guidelines, and the Quick Pattern + Deep Dive format. Includes profiling commands and configuration snippets.
- **Performance Triage Framework plugin**: A generic performance optimization plugin template with customizable categories, impact ratings (CRITICAL/HIGH/MEDIUM), and measure-optimize-remeasure cycle. Adaptable to any framework, not just React Native.

## Patterns
- **Impact-rated priority hierarchy**: Six categories ordered by impact, each with CRITICAL/HIGH/MEDIUM ratings. Provides clear triage guidance -- "fix CRITICAL first, then HIGH."
- **Hybrid skill format**: Quick Pattern (code snippets) + Quick Command (shell) + Quick Config (configuration) + Quick Reference (summary tables) + Deep Dive (full context with prerequisites, step-by-step, common pitfalls). Serves both quick lookup and deep learning needs.
- **Measure-optimize-remeasure cycle**: Explicit measurement requirement before and after optimization. Prevents subjective assessment of improvement.
- **Security notes in skill files**: Explicit security guidance for shell commands, third-party dependencies, and remote code loading within skill documentation. A responsible disclosure pattern.
- **Vendored plugins**: plugins/vendored/ directory for internal/pre-release skills separate from public skills/. Clean separation of public and internal skill content.
- **Meta-skill for validation**: A skill whose purpose is validating other skills in the collection. Self-referential quality assurance.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| React Native Performance Optimization | NEW | Priority-ordered performance optimization with impact ratings and measurement cycle | - | specializations/mobile/react-native-performance-optimization.js |
| React Native Brownfield Migration | NEW | Incremental React Native integration into existing native apps | - | specializations/mobile/react-native-brownfield-migration.js |
| React Native Upgrade Process | NEW | Version upgrade with dependency resolution and breaking change handling | - | specializations/mobile/react-native-upgrade-process.js |
| Performance Triage Framework | NEW | Generic performance optimization with impact-rated categories and measurement cycle | - | specializations/shared/performance-triage-framework.js |
| Hybrid Skill Format Design | NEW | Quick reference + deep dive skill structure pattern | - | specializations/shared/hybrid-skill-format-design.js |
| Impact-Rated Priority Hierarchy | NEW | CRITICAL/HIGH/MEDIUM impact rating system for optimization tasks | - | specializations/shared/impact-rated-priority-hierarchy.js |
| Measure-Optimize-Remeasure Cycle | NEW | Data-driven optimization workflow with before/after measurement | - | specializations/shared/measure-optimize-remeasure-cycle.js |
| Skills Validation Meta-Process | NEW | Quality assurance for skill collection content and format | - | methodologies/skills-validation/ |
| Mobile CI/CD with GitHub Actions | NEW | React Native CI/CD pipeline optimization and automation | - | specializations/mobile/mobile-cicd-github-actions.js |
| Device Testing Automation | NEW | Automated testing across mobile device configurations | - | specializations/mobile/device-testing-automation.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| React Native Profiler Integration | NEW | Metro bundler analysis, Flipper integration, and performance monitoring tools | - | plugins/a5c/marketplace/plugins/react-native-profiler-integration/ |
| Performance Triage Framework | NEW | Generic performance optimization with customizable categories and impact ratings | - | plugins/a5c/marketplace/plugins/performance-triage-framework/ |
