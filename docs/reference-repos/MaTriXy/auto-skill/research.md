# MaTriXy/auto-skill

- **Archetype**: skill-generation-platform
- **Stars**: 18
- **Last pushed**: 2026-02-05 (v5.0.0)
- **License**: MIT
- **Discovered**: 2026-04-13
- **Skills found**: 0 (generates skills, doesn't contain them)

## Summary
Auto-Skill automatically learns from coding workflows and converts them into intelligent, context-aware skills. Version 5.0 introduces proactive skill discovery that monitors coding patterns, identifies repetitions, and recommends community skills from 27,000+ sources. Hybrid learning combines local pattern detection with external skill discovery using confidence evolution (50% external → 75% proven → 85% graduated). Supports multi-agent skill sharing across different coding agents.

## Assessment
EXTREMELY HIGH VALUE for babysitter integration. The automatic skill generation from workflow patterns directly aligns with babysitter's process-oriented approach. The pattern recognition for 18 design patterns (architectural, coding, workflow), session intent analysis (debug, implement, refactor modes), and confidence evolution system provide sophisticated methodologies for process discovery and validation. The agentskills.io specification compatibility and multi-agent support make this highly relevant to babysitter's ecosystem.

## Extraction Priority
- High
- Rationale: The automatic workflow-to-skill conversion methodology could dramatically accelerate babysitter process library development. The pattern recognition algorithms, confidence evolution system, and multi-agent coordination patterns are directly transferable. The mental model integration for semantic codebase understanding aligns with babysitter's contextual approach.

## Processes
- **Automatic Skill Generation from Workflows**: Monitor coding patterns, identify repetitions, generate reusable skills with confidence scoring
- **Pattern Recognition for Design Patterns**: Detect 18 design patterns (architectural, coding, workflow) from code analysis
- **Confidence Evolution System**: Graduate external recommendations through proven usage (50% → 75% → 85%)
- **Session Intent Analysis**: Classify development sessions by intent (debug, implement, refactor) for contextual skill recommendation
- **Workflow Pattern Mining**: Extract reusable patterns from developer behavior and codify as structured processes

## Plugin Ideas
- **Pattern Discovery Integration**: Monitor babysitter runs to identify repetitive patterns and suggest new processes
- **External Skill Discovery**: Integration with 27,000+ skill sources for process recommendation

## Patterns
- Privacy-first anonymous telemetry (disableable via environment variables)
- Path security with traversal prevention and unicode normalization
- Zero-config external skill search
- SHA-256 lock file integrity verification
- RFC 8615 well-known endpoint provider system
- Mental model integration for semantic understanding

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Automatic Skill Generation from Workflows | NEW | Monitor patterns and generate reusable skills with confidence evolution | - | methodologies/automatic-skill-generation/ |
| Pattern Recognition for Design Patterns | NEW | Detect 18 design patterns from code analysis and workflow monitoring | - | specializations/shared/pattern-recognition-design-patterns.js |
| Confidence Evolution System | NEW | Graduate external recommendations through proven usage with scoring | - | specializations/shared/confidence-evolution-system.js |
| Session Intent Analysis | NEW | Classify development sessions by intent for contextual recommendations | - | specializations/shared/session-intent-analysis.js |
| Workflow Pattern Mining | NEW | Extract reusable patterns from developer behavior and codify as processes | - | specializations/shared/workflow-pattern-mining.js |
| Multi-Agent Skill Sharing | NEW | Cross-agent skill distribution and coordination mechanisms | - | specializations/shared/multi-agent-skill-sharing.js |
| Mental Model Integration | NEW | Semantic codebase understanding for context-aware skill recommendations | - | specializations/shared/mental-model-integration.js |
| External Skill Discovery | NEW | Search and integration with external skill repositories and marketplaces | - | specializations/shared/external-skill-discovery.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Pattern Discovery Integration | NEW | Monitor babysitter runs to identify repetitive patterns and suggest new processes | - | plugins/a5c/marketplace/blueprints/pattern-discovery-integration/ |
| External Skill Discovery | NEW | Integration with 27,000+ skill sources for process recommendation and discovery | - | plugins/a5c/marketplace/blueprints/external-skill-discovery/ |