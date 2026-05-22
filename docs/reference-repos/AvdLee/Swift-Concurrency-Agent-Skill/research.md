# AvdLee/Swift-Concurrency-Agent-Skill

- **Archetype**: domain-skill-pack
- **Stars**: 1,388
- **Last pushed**: 2026-03-29
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 1

## Summary
Expert-level Swift Concurrency guidance packaged as an agent skill. Covers safe concurrency patterns, performance optimization, and Swift 6 migration. Authored by a well-known iOS developer (Antoine van der Lee / SwiftLee). The single SKILL.md is exceptionally deep -- a diagnostic-first workflow with quick-fix mode, common diagnostics table, and project-settings-aware guardrails.

## Assessment
HIGH VALUE for domain specialization. The skill demonstrates a gold-standard pattern for encoding language-specific expertise: it begins by reading project settings (Package.swift / .pbxproj) to determine the exact Swift language mode and strict concurrency level before offering any guidance. The diagnostic table mapping compiler errors to smallest-safe-fix + escalation references is directly extractable as a methodology pattern. The "Quick Fix Mode" vs. full analysis branching based on issue scope is a reusable decision framework. Transferable to specializations/engineering/swift-concurrency or more broadly as a template for language-migration specializations.

## Extraction Priority
- High
- Rationale: Authoritative source (prominent iOS developer), deeply procedural with diagnostic-first workflow, project-settings-aware guardrails, and a reusable pattern for encoding language migration expertise. The diagnostic table + quick-fix-mode branching is a novel pattern not yet in babysitter's process library.

## Processes
- **Swift Concurrency Diagnostic Workflow**: Read project settings -> capture diagnostic -> determine isolation boundary -> confirm UI-boundness -> apply smallest safe fix. Maps to a babysitter process with breakpoints for developer confirmation at each decision point.
- **Swift 6 Migration Process**: Incremental migration with guardrails against blanket @MainActor, preference for structured concurrency, and documented safety invariants for escape hatches. Could be a multi-step babysitter process with tasks for each migration phase.
- **Quick Fix Mode Decision Gate**: A reusable branching pattern -- if issue is localized + isolation is clear + fix is 1-2 steps, use quick path; otherwise escalate to full analysis. Extractable as a shared methodology pattern.

## Patterns
- **Diagnostic-first workflow**: Always analyze project settings and capture exact diagnostic before proposing fixes. Prevents incorrect guidance from assumed context.
- **Smallest-safe-change principle**: Optimize for minimal behavioral change during migration. Avoid refactoring unrelated architecture.
- **Quick Fix Mode branching**: Scope-based decision gate that routes simple issues to fast path and complex issues to full analysis. Reduces overhead for trivial fixes.
- **Escape hatch documentation**: When recommending unsafe patterns (@preconcurrency, @unchecked Sendable), require documented safety invariants and removal plans.
- **Reference file architecture**: Deep reference docs (actors.md, sendable.md, threading.md, testing.md, linting.md) linked from diagnostic table for escalation.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Swift Concurrency Diagnostic Workflow | NEW | Project-settings-aware diagnostic process with smallest-safe-fix methodology | - | specializations/business/swift-concurrency-diagnostic.js |
| Swift 6 Migration Process | NEW | Incremental Swift 6 migration with safety guardrails and structured concurrency | - | specializations/business/swift-6-migration.js |
| Quick Fix Mode Decision Gate | NEW | Scope-based branching for simple vs complex issue resolution | - | specializations/shared/quick-fix-mode-decision-gate.js |
| Language Migration Framework | NEW | Generic pattern for language-version migration with diagnostic tables | - | specializations/shared/language-migration-framework.js |
| Project Settings Analysis | NEW | Pre-analysis project configuration detection for context-aware guidance | - | specializations/shared/project-settings-analysis.js |
| Diagnostic Table Methodology | NEW | Structured error-to-fix mapping with escalation references | - | specializations/shared/diagnostic-table-methodology.js |
| Escape Hatch Documentation Pattern | NEW | Safety invariant documentation for unsafe migration patterns | - | specializations/shared/escape-hatch-documentation.js |
| Smallest-Safe-Change Principle | NEW | Minimal behavioral change optimization for migration workflows | - | specializations/shared/smallest-safe-change-principle.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Swift Project Settings Hook | NEW | Automatic Package.swift/.pbxproj analysis on session start for Swift projects | - | plugins/a5c/marketplace/plugins/swift-project-settings-hook/ |
