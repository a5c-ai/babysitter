# addyosmani/agent-skills

## Metadata
- **Full name:** addyosmani/agent-skills
- **Description:** Production-grade engineering skills for AI coding agents
- **Stars:** 13,450
- **Last pushed:** 2026-04-12
- **License:** MIT
- **Topics:** agent-skills, antigravity, antigravity-ide, claude-code, cursor, skills

## Archetype
**mega-skill-pack** - 21 production engineering skills organized by development lifecycle phases (Define, Plan, Build, Verify, Review, Ship). From Google Chrome team lead Addy Osmani.

## Structure
```
skills/
  api-and-interface-design/SKILL.md
  browser-testing-with-devtools/SKILL.md
  ci-cd-and-automation/SKILL.md
  code-review-and-quality/SKILL.md
  code-simplification/SKILL.md
  context-engineering/SKILL.md
  debugging-and-error-recovery/SKILL.md
  deprecation-and-migration/SKILL.md
  documentation-and-adrs/SKILL.md
  frontend-ui-engineering/SKILL.md
  git-workflow-and-versioning/SKILL.md
  idea-refine/SKILL.md
  incremental-implementation/SKILL.md
  performance-optimization/SKILL.md
  planning-and-task-breakdown/SKILL.md
  security-and-hardening/SKILL.md
  shipping-and-launch/SKILL.md
  source-driven-development/SKILL.md
  spec-driven-development/SKILL.md
  test-driven-development/SKILL.md
  using-agent-skills/SKILL.md
```

## Extractable Value

### Processes (methodologies/)

1. **spec-driven-development** - Already have this in babysitter but Addy's version has a strong 4-phase gated workflow (Specify -> Plan -> Tasks -> Implement) with explicit assumption-surfacing protocol. Worth comparing against existing spec-driven methodology for convergence ideas.

2. **incremental-implementation** - Vertical-slice delivery methodology with cycle: Implement -> Test -> Verify -> Commit -> Next Slice. Three slicing strategies: vertical (preferred), contract-first, risk-first. Could enhance existing iterative-convergence process.

3. **deprecation-and-migration** - Full methodology for sunsetting systems: decision framework (5 questions), compulsory vs advisory deprecation, step-by-step migration process. Unique methodology not currently in babysitter. **Placement: methodologies/deprecation-and-migration**

4. **shipping-and-launch** - Comprehensive pre-launch checklist methodology covering code quality, security, performance, accessibility, infrastructure, documentation, and feature flag strategy. **Placement: methodologies/shipping-and-launch**

### Processes (specializations/)

5. **code-review-and-quality** - Five-axis review methodology (correctness, readability, architecture, security, performance) with approval standard based on "improves overall code health." **Placement: specializations/shared/code-review-quality-gates**

6. **performance-optimization** - Measurement-first optimization workflow with Core Web Vitals targets, profiling-first approach, and regression prevention. **Placement: specializations/shared/performance-optimization**

### Plugin Ideas

None - these are all pure methodology content, not tool integrations.

### SKIP

- `using-agent-skills` - meta/self-referential skill management
- `context-engineering` - SDK-covered primitive
- `browser-testing-with-devtools` - tool-specific, not methodology
- `ci-cd-and-automation` - too generic / harness-specific
- `git-workflow-and-versioning` - SDK-covered primitive
- `source-driven-development` - variant of spec-driven, redundant

## Priority Assessment
**HIGH** - Multiple unique, well-structured methodologies from a credible engineering leader. The deprecation-and-migration and shipping-and-launch methodologies fill gaps in the current process library. The spec-driven and incremental approaches offer convergence value for existing processes.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Spec-Driven Development (4-phase gated) | UPGRADE | Enhanced spec-driven workflow with assumption-surfacing protocol | library/methodologies/spec-driven/ | methodologies/spec-driven/ |
| Incremental Implementation | UPGRADE | Vertical-slice delivery methodology with explicit slicing strategies | library/methodologies/iterative-convergence/ | methodologies/iterative-convergence/ |
| Deprecation and Migration | NEW | Full methodology for system sunsetting with decision framework | - | methodologies/deprecation-and-migration/ |
| Shipping and Launch | NEW | Comprehensive pre-launch checklist covering all quality gates | - | methodologies/shipping-and-launch/ |
| Code Review and Quality | NEW | Five-axis review methodology with code health improvement standard | - | specializations/shared/code-review-quality-gates.js |
| Performance Optimization | NEW | Measurement-first optimization workflow with Core Web Vitals | - | specializations/shared/performance-optimization.js |
| API and Interface Design | NEW | Production API design methodology from Chrome team lead | - | specializations/shared/api-interface-design.js |
| Code Simplification | NEW | Systematic code simplification and complexity reduction process | - | specializations/shared/code-simplification.js |
| Debugging and Error Recovery | UPGRADE | Production debugging methodology for complex systems | library/specializations/shared/debugging-strategies.js | specializations/shared/debugging-strategies.js |
| Security and Hardening | NEW | Production security checklist and hardening methodology | - | specializations/security-compliance/production-security-hardening.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Production Engineering Checklist | NEW | Install comprehensive pre-launch checklists and quality gates | - | plugins/a5c/marketplace/plugins/production-engineering-checklist/ |
