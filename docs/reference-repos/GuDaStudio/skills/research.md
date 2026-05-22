# GuDaStudio/skills

- **Archetype**: multi-model-orchestrator
- **Stars**: 1,979
- **Last pushed**: 2025-12-23
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 0

## Summary

A Chinese-language collection of agent skills enabling Claude Code to collaborate with other AI models (OpenAI Codex, Google Gemini). Ships as a Python-based installer that adds skills for delegating tasks between models. Two primary skills: `collaborating-with-codex` (delegate coding tasks to Codex CLI) and `collaborating-with-gemini` (delegate to Gemini CLI). No SKILL.md files in the main repo -- skills are in separate repos (GuDaStudio/collaborating-with-codex, GuDaStudio/collaborating-with-gemini). Uses Python 3.8+ for setup scripts. Last updated December 2025, relatively stale.

## Assessment

Conceptually relevant to babysitter's multi-harness architecture. The pattern of delegating tasks from one AI model to another maps directly to babysitter's harness adapter system. However, the implementation is simple (just skill installation scripts) compared to babysitter's sophisticated harness abstraction. The cross-model delegation concept is already better implemented in babysitter-agent's `invoke` command and adapter system.

## Extraction Priority
- Low
- Rationale: Conceptually aligned but technically superseded by babysitter's harness system. Stale (last push Dec 2025). No novel patterns beyond what babysitter already implements.

## Processes

None directly extractable. The cross-model delegation concept is already covered by babysitter's harness adapters.

## Plugin Ideas

None. Babysitter's existing harness system (`createCodexAdapter`, `createGeminiCliAdapter`) already provides this functionality with more sophistication.

## Patterns

- Cross-model task delegation via skill installation
- Python-based skill installer for non-JS ecosystems
- Separate repos per skill for independent versioning (collaborating-with-codex, collaborating-with-gemini)

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Cross-Model Task Delegation | EXISTING | Already implemented via babysitter harness adapters | library/harness/ | N/A - Already covered |
| Multi-Harness Skill Installation | EXISTING | Already implemented via babysitter harness system | library/harness/ | N/A - Already covered |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| N/A | N/A | No plugin ideas - functionality already covered by babysitter harness system | - | N/A |
