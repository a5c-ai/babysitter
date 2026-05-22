# twostraws/SwiftUI-Agent-Skill

- **Archetype**: domain-skill-pack
- **Stars**: 3,494
- **Last pushed**: 2026-03-11
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 1 SKILL.md (swiftui-pro)
- **Fork**: No
- **Source**: gh-search

## Summary

A single focused SwiftUI agent skill by Paul Hudson (Hacking with Swift). Targets common LLM mistakes when generating SwiftUI code: deprecated API usage, VoiceOver accessibility issues, performance problems. Covers navigation, layout, animations, state management, accessibility, and deprecated API detection. Part of a larger Swift Agent Skills ecosystem (SwiftData, Swift Concurrency, Swift Testing).

Uses the Agent Skills standard. Installable via `npx skills add`.

## Assessment

Low-to-moderate extractable value for babysitter. Very domain-specific (iOS/SwiftUI only). However, the pattern of "targeting mistakes LLMs actually make" is valuable procedural knowledge. The skill demonstrates a quality-gate approach focused on LLM-specific failure modes rather than general best practices.

**Extraction priority**: LOW

---

## Processes

### 1. SwiftUI Code Quality Review
- **Source skills**: swiftui-pro
- **Placement**: `specializations/shared/swiftui-code-quality-review.js`
- **Description**: Quality gate process for SwiftUI projects focused on LLM-generated code: deprecated API detection -> accessibility/VoiceOver audit -> performance review (state management, layout) -> navigation pattern check -> animation safety review. Generates structured findings with severity levels.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| SwiftUI Code Quality Review | NEW | Quality gate process for SwiftUI focused on LLM-specific mistakes | - | specializations/mobile/swiftui-code-quality-review.js |
| LLM-Mistake-Targeted Review | NEW | Review framework focused on what AI gets wrong rather than general best practices | - | specializations/shared/llm-mistake-targeted-review.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| N/A | N/A | No valid plugin ideas - purely instructional content with no tool integration surface | - | N/A |

## Implicit Procedural Knowledge

- **LLM mistake targeting**: The skill is explicitly designed around "mistakes LLMs actually make" rather than general best practices. This targeted-correction pattern is valuable for designing quality gate processes in any domain -- focus on what the AI gets wrong, not everything.
- **Ecosystem skill families**: Part of a coordinated set (SwiftUI, SwiftData, Swift Concurrency, Swift Testing) showing how domain skills can be decomposed into focused, composable units. Relevant for how babysitter organizes domain specializations.
