# GAP-TOOLS-037: Fetch Content Processing

| Field | Value |
|-------|-------|
| Category | tools-capabilities |
| Priority | Low |
| Effort | M |
| Status | Missing |

## Description
CC's WebFetchTool requires a `prompt` parameter that processes and summarizes fetched
web content before returning it. Babysitter's `fetch` tool returns raw HTTP responses.
Different content processing models.

## Current State
Babysitter's `fetch` tool params: `url`, `timeout`, `raw`. Makes an HTTP GET request
and returns `{ status, statusText, body }`. Body is truncated at 50KB unless `raw: true`.
No content processing, summarization, or extraction.

CC's WebFetchTool params: `url` (required), `prompt` (required -- describes how to
process the fetched content). CC fetches the URL, then applies the prompt to extract
or summarize relevant information before returning it. This reduces token usage by
filtering irrelevant content.

## Target State
Add a `prompt` parameter to the `fetch` agentic tool:

- **`prompt`**: Optional string. When provided, fetched content is processed through
  an LLM call (or simpler extraction logic) using the prompt as instructions.
  Example: `prompt: "Extract all API endpoint URLs"` would fetch a page and return
  only the extracted URLs.

When `prompt` is omitted, current raw-response behavior is preserved.

Implementation options:
1. **LLM-based**: Route fetched content + prompt through a lightweight model call.
   Expensive but matches CC's behavior exactly.
2. **Extraction-based**: Use the prompt as a pattern/instruction for rule-based
   extraction (regex, CSS selectors, text filters). Cheaper but less flexible.
3. **Hybrid**: Try extraction first, fall back to LLM for complex prompts.

## Dependencies
- None for raw param addition.
- LLM-based processing depends on model access within agentic tool execution context.

## Key Files
| Component | Path |
|-----------|------|
| Agentic tools | `packages/sdk/src/harness/agenticTools.ts` |
| CC WebFetchTool | `src/tools/WebFetchTool/WebFetchTool.ts` |

## Recommendation
Phase 3. Low priority -- babysitter's raw fetch is often sufficient since the LLM
processing the response can extract what it needs. The `prompt` param matters more
in token-constrained scenarios.
