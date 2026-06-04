# GAP-PROMPT-009: Tool Preference and Usage Rules

| Field | Value |
|-------|-------|
| Category | prompt-engineering |
| Priority | High |
| Effort | S |
| Status | Missing |

## Description
Include tool preference and usage rules in task prompts when delegating to harnesses with agentic tool access. Prevents common mistakes like using Bash for file operations when dedicated tools exist, blind file overwrites without reading first, and inefficient tool usage patterns.

## Current State
CC's system prompt includes explicit tool preference rules ("Use Read instead of cat", "Use Edit instead of sed", "Use Grep instead of grep"). The agentic tools module (`packages/sdk/src/harness/agenticTools.ts`) defines tools for Pi sessions but does not include meta-instructions about tool selection. When Pi sessions use agentic tools, the agent lacks guidance on when to prefer which tool.

## Target State
A `toolPreferences` prompt section injected when tasks involve agentic tool access. Includes: dedicated tool preference over Bash, read-before-edit enforcement, efficient search patterns (Grep over bash grep). Adapts rules based on which tools are available in the target harness. Configurable per harness adapter.

## Dependencies
- [GAP-PROMPT-001](../prompt-engineering/GAP-PROMPT-001.md) -- strata model for section placement
- [GAP-PROMPT-002](../prompt-engineering/GAP-PROMPT-002.md) -- capability projection to know which tools are available

## Key Files
| Component | Path |
|-----------|------|
| Prompts module | `packages/sdk/src/prompts/` |
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |
| CC prompt phrasing analysis | [`11-prompt-phrasing-analysis.md`](../../11-prompt-phrasing-analysis.md) -- Section 3 (Tool Preference Rules) and Section 7 (Tool Descriptions) have exact phrasing |

## Recommendation
Phase 2 implementation. Small effort -- extract tool preference rules from CC phrasing analysis, inject into agentic tools system prompt preamble.
