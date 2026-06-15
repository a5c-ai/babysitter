# AvdLee/SwiftUI-Agent-Skill

- **Archetype**: domain-skill-pack
- **Stars**: 2,510
- **Last pushed**: 2026-04-11
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 2

## Summary

SwiftUI best practices agent skill by Antoine van der Lee (SwiftLee.com). Ships 2 skills: `swiftui-expert-skill` (main best practices with topic router, task workflows for review/improve/implement, and reference files for latest APIs, Liquid Glass, image optimization) and `update-swiftui-apis` (updating the API reference). Uses a reference-file architecture where the skill consults `references/latest-apis.md` at task start to avoid deprecated APIs. Covers state management, view composition, performance, macOS-specific APIs, and iOS 26+ Liquid Glass adoption.

**Note**: Different from `twostraws/SwiftUI-Agent-Skill` (Paul Hudson's version with 1 skill). This is Antoine van der Lee's version with 2 skills, a reference-file system, and explicit task workflows (review/improve/implement).

## Assessment

Moderate value. More sophisticated than the twostraws version due to the reference-file architecture and structured task workflows. The pattern of consulting a living reference file (`latest-apis.md`) at the start of every task is transferable -- it ensures processes use up-to-date information rather than stale training data. The three-workflow structure (review/improve/implement) is a clean process decomposition pattern.

## Extraction Priority
- Low
- Rationale: SwiftUI-specific domain. The reference-file consultation pattern and three-workflow decomposition are the transferable elements, but the domain itself is narrow.

## Processes

### 1. SwiftUI Code Quality Workflow
- **Source skills**: swiftui-expert-skill
- **Placement**: `specializations/shared/swiftui-code-quality.js`
- **Description**: Three-mode SwiftUI quality process: review (flag deprecated APIs, audit accessibility, check performance) -> improve (replace deprecated APIs, refactor hot paths, extract subviews) -> implement (design data flow, structure views, apply animations, gate version-specific APIs).

## Plugin Ideas

- **Living Reference File plugin**: Maintain auto-updating reference files (like latest-apis.md) that skills/processes consult at task start. Useful for any domain with rapidly changing APIs. Category: knowledge management.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| SwiftUI Code Quality Workflow | NEW | Three-mode quality process: review → improve → implement with API deprecation checking | - | specializations/mobile/swiftui-code-quality.js |
| Living Reference Consultation Pattern | NEW | Auto-updating reference files that processes consult at task start for current APIs | - | specializations/shared/living-reference-consultation.js |
| Three-Workflow Decomposition Pattern | NEW | Review/improve/implement task workflow structure for code quality | - | specializations/shared/three-workflow-decomposition.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Living Reference Manager | NEW | Auto-updating reference file system for rapidly changing APIs and knowledge | - | plugins/a5c/marketplace/blueprints/living-reference-manager/ |

## Patterns

- Reference-file architecture: skill consults `references/latest-apis.md` at start of every task
- Three-workflow decomposition: review / improve / implement as distinct entry points
- `#available` gating pattern for version-specific features with fallbacks
- Explicit "operating rules" section at skill top defining non-negotiable behaviors
- Topic Router pattern for dispatching to domain-specific guidance based on code analysis
