# adamlyttleapps/claude-skill-app-onboarding-questionnaire

- **Archetype**: domain-skill-pack
- **Stars**: 775
- **Last pushed**: 2026-04-06
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 1

## Summary
Claude Code skill for designing and building high-converting questionnaire-style app onboarding flows, modeled on proven conversion patterns from subscription apps (Mob, Headspace, Duolingo, Noom). A multi-phase process with persistent state: App Discovery -> User Transformation -> Blueprint -> Screen Content -> Implementation. Notable for its RECALL system -- checks Claude Code memory for saved progress at each phase, enabling resume-from-anywhere across sessions. The skill acts as both designer (conversion strategy) and implementer (code generation).

## Assessment
MEDIUM-HIGH VALUE. The multi-phase process with persistent state and resume capability is directly transferable to babysitter's orchestration model. The RECALL pattern (check memory for each phase's saved state -> present status summary -> resume from last checkpoint) is a clean implementation of session continuity. The five-phase workflow (discovery -> transformation -> blueprint -> content -> implementation) with memory saves between phases maps perfectly to babysitter's event-sourced run model where each phase completion is a journal event. The conversion optimization domain (onboarding flow design) is extractable to specializations/business/product-design.

## Extraction Priority
- Medium
- Rationale: The multi-phase process with persistent state and resume capability is the key transferable pattern. The onboarding flow design methodology itself is domain-specific but well-structured. The RECALL pattern and status summary presentation are reusable across any multi-session process.

## Processes
- **App Onboarding Design Process**: Phase 1 (App Discovery: analyze codebase) -> Phase 2 (User Transformation: define before/after states) -> Phase 3 (Blueprint: design screen sequence with objectives) -> Phase 4 (Screen Content: draft headlines, options, copy per screen) -> Phase 5 (Implementation: generate code for each screen). Each phase saves to memory, enabling cross-session resume.
- **Conversion-Optimized UX Design**: A methodology for designing user flows that maximize conversion, based on patterns from successful subscription apps. Extractable to specializations/business/conversion-optimization.

## Patterns
- **RECALL pattern**: Before any work, check for saved state at each phase in sequence. Present a visual status summary showing completed/in-progress/not-started phases. Resume from the last incomplete phase. Enables cross-session workflow continuity.
- **Status summary with visual indicators**: Checkmarks, progress indicators, and pending markers for each phase. Gives the user immediate orientation on where they are in the process.
- **Phase-gated progression**: Each phase must complete before the next begins, with state saved between phases. Prevents skipping steps and enables partial completion.
- **Expert-then-implementer dual role**: The skill acts as both domain expert (conversion strategist) and implementer (code generator). Two distinct personas within one skill.
- **Proven pattern references**: Explicitly naming successful apps (Mob, Headspace, Duolingo, Noom) as pattern sources. Grounds design decisions in real-world validation.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| App Onboarding Design Process | NEW | 5-phase onboarding flow design with persistent state and cross-session resume | - | specializations/business/app-onboarding-design.js |
| Conversion-Optimized UX Design | NEW | User flow design methodology based on successful subscription app patterns | - | specializations/business/conversion-optimized-ux-design.js |
| RECALL Pattern Implementation | NEW | Cross-session state management with visual status summary and resume capability | - | specializations/shared/recall-pattern-implementation.js |
| Phase-Gated Progression | NEW | Multi-phase workflow with state persistence and completion validation | - | specializations/shared/phase-gated-progression.js |
| Expert-Implementer Dual Role Pattern | NEW | Single process acting as both domain expert and technical implementer | - | specializations/shared/expert-implementer-dual-role.js |
| Conversion Pattern Analysis | NEW | Analysis of successful app patterns for onboarding and user activation | - | specializations/business/conversion-pattern-analysis.js |
| Visual Status Summary Generation | NEW | Progress visualization with checkmarks and indicators for multi-phase processes | - | specializations/shared/visual-status-summary.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| N/A | N/A | No valid plugin ideas - functionality best implemented as processes | - | N/A |
