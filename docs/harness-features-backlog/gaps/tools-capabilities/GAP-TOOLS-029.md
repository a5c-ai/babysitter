# GAP-TOOLS-029: Structured Output Tool

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Medium |
| Effort | M |
| Status | Missing |

## Description
Produce structured output blocks (images, code blocks, downloadable files, tables,
diagrams) from within orchestrated tasks. CC's `SyntheticOutputTool` creates rich
output that appears in the conversation UI.

## Current State
Task results are stored as JSON in `result.json`. Large outputs go to blobs
(`BLOB_THRESHOLD_BYTES: 1 MiB`). But there's no concept of typed output blocks --
everything is unstructured text or JSON. No embedded SDK dashboard exists yet; `task:show`
renders all results the same way.

## Target State
A structured output system where effects can produce typed output blocks:
- `code`: syntax-highlighted code blocks with language tag
- `image`: base64 or file-referenced images (diagrams, screenshots)
- `table`: structured tabular data
- `diff`: unified diff output
- `file`: downloadable file artifacts
- `markdown`: rendered markdown

Output blocks stored in task result as `{ blocks: [{ type, content, metadata }] }`.
Embedded SDK dashboard and `task:show` render each block type appropriately.

## Dependencies
- [GAP-UX-001b](../user-experience/GAP-UX-001b.md) -- diff rendering for diff blocks
- [GAP-UX-001d](../user-experience/GAP-UX-001d.md) -- type-specific rendering

## Key Files
| Component | Path |
|-----------|------|
| Task serializer | `packages/sdk/src/tasks/serializer.ts` |
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |

## Recommendation
Phase 3 (M5). Define output block schema in task types. Add rendering support in
embedded SDK dashboard. Most impactful for code-generation tasks where seeing diffs
and code blocks is critical.
