# GAP-TOOLS-038: Ask Tool Interaction Model Alignment

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Low |
| Effort | S |
| Status | Missing |

## Description
CC's AskUserQuestionTool and babysitter's `ask` agentic tool use fundamentally
different interaction models. Alignment needed for cross-harness compatibility.

## Current State
**CC's AskUserQuestionTool**: Single question, free-text response. The model asks
one question at a time, user types a response. Simple prompt-and-answer.

**Babysitter's `ask` tool**: Structured multi-question format with:
- `questions[]` array (multiple questions per call)
- `options[]` per question (predefined choices)
- `multi` flag (allow multiple selections)
- `recommended` index (suggested default)

Babysitter's model is richer (supports approval workflows, structured choices) but
cannot replicate CC's simple free-text flow without ignoring its structured fields.
When babysitter orchestrates CC as a harness, the CC side presents AskUserQuestionTool
while babysitter's internal model uses the structured format.

## Target State
Support both interaction modes in the `ask` tool:

- **`mode`**: `'simple'` (CC-compatible single question, free-text) or `'structured'`
  (current babysitter model with options/multi-select). Default: `'structured'`.
- When `mode: 'simple'`: accept a single `question` string param, return free-text
  `answer` string. Maps directly to CC's AskUserQuestionTool.
- When `mode: 'structured'`: current behavior preserved.

This enables processes to use the appropriate interaction style depending on whether
they need a simple confirmation or a complex multi-option workflow.

## Dependencies
- None.

## Key Files
| Component | Path |
|-----------|------|
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |
| CC AskUserQuestionTool | (inline in CC's tool definitions) |
| Interaction module | `packages/sdk/src/interaction/` |

## Recommendation
M0 (Quick Wins). Low priority. The current structured model works well for babysitter's
orchestration patterns. Alignment matters mainly for cross-harness tool compatibility.
