# Transport Mux & Proxy

The `@a5c-ai/agent-mux-transport` package bridges API protocol differences between harnesses and upstream providers.

## When Proxy is Needed

A harness needs the proxy when it speaks a different protocol than the upstream provider:

| Harness Protocol | Upstream Protocol | Proxy? |
|-----------------|-------------------|--------|
| Anthropic (Claude Code) | Anthropic | No |
| Anthropic (Claude Code) | OpenAI (Foundry) | **Yes** |
| Anthropic (Claude Code) | Google (Vertex) | **Yes** |
| OpenAI (Codex) | OpenAI (Foundry) | No |
| OpenAI (Pi via models.json) | OpenAI (Foundry) | **Yes** |

## Completion Engines

| Engine | Upstream | Key Features |
|--------|----------|-------------|
| OpenAI | Azure Foundry | Tool normalization (`input_schema` → `parameters`), streaming `delta.tool_calls` accumulation |
| Google | Vertex AI | `functionCall`/`functionResponse` translation, `thoughtSignature` server-side store |

## Message Translation

The proxy translates between Anthropic and upstream formats bidirectionally:

- **Anthropic → OpenAI**: `tool_use` → `role:"assistant" + tool_calls`, `tool_result` → `role:"tool"`
- **Anthropic → Google**: `tool_use` → `functionCall`, `tool_result` → `functionResponse` (with `toolIdToName` mapping)
- **OpenAI → Anthropic**: `delta.tool_calls` → `content_block_start(tool_use) + input_json_delta`
- **Google → Anthropic**: `functionCall` → `tool_use`, `thoughtSignature` preserved via server-side store

## Streaming Tool Support

The proxy handles streaming tool calls end-to-end:

```
CompletionStreamEvent =
  | { type: 'text-delta', text: string }
  | { type: 'tool-call', id, name, arguments, metadata? }
  | { type: 'done', finishReason?, usage? }
```

See [babysitter-plugin-flows](./03-babysitter-plugin-flows.md) for full sequence diagrams.
