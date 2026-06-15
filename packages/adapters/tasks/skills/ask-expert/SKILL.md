# Breakpoints Adapter Skill

## When to Use

Use `ask_breakpoint` when you need an answer from a human responder and the codebase, existing docs, and your own analysis are not enough.

Good fits:

- architecture trade-offs
- security reviews
- domain-specific implementation questions
- approval or intervention checkpoints

Do not route breakpoints you can already answer confidently from the available context.

## Before Asking

1. Check who is available with `list_responders`.
2. Gather the code paths, constraints, and prior attempts you want the responder to see.
3. Decide whether you need a named responder with `targetResponders` or general routing by `domain` and `tags`.

## Tool Contract

Tool: `ask_breakpoint`

```json
{
  "question": "Should we keep the GitHub Issues backend for this workflow, or move this project to the server backend?",
  "context": "The repo already has routing.json entries for github-issues. We now need token-backed polling for multiple responders.",
  "fileReferences": [
    "packages/adapters/tasks/src/backends/index.ts",
    "packages/adapters/tasks/src/mcp/backend-resolver.ts"
  ],
  "tags": ["backends", "routing", "operations"],
  "domain": "platform",
  "targetResponders": ["platform-responder"],
  "routingStrategy": "single",
  "timeout": 600000
}
```

Current `ask_breakpoint` parameters:

- `question`
- `context`
- `markdown`
- `codeSnippets`
- `fileReferences`
- `tags`
- `domain`
- `urgency`
- `interactionKind`
- `targetResponders`
- `routingStrategy`
- `timeout`
- `breakpointId`
- `backend`
- `breakpointsDir`
- `proven`

## Routing Guidance

- Use `routingStrategy: "single"` when one named responder should answer.
- Use `routingStrategy: "first-response-wins"` for the fastest qualified answer.
- Use `routingStrategy: "collect-all"` when you want multiple viewpoints.
- Use `routingStrategy: "quorum"` when you need a majority outcome.

## After the Answer

- `ask_breakpoint` waits for the answer path to resolve, timeout, or cancellation.
- Use `check_breakpoint_status` with the returned `breakpointId` when you need to inspect the stored breakpoint record after the initial exchange.
- If the response must be signed, set `proven: true` on `ask_breakpoint` and optionally call `verify_breakpoint_answer` afterward for an explicit verification record.
