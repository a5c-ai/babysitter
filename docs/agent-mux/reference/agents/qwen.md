# Qwen Code

[`@qwen-code/qwen-code`](https://github.com/QwenLM/qwen-code) is Alibaba's
coding CLI built on top of Gemini CLI, tuned for the Qwen3-Coder family of
models. agent-mux drives it via the `qwen` binary.

## Install

```bash
amux install qwen
```

Supported on macOS, Linux and Windows.

## Authenticate

Qwen Code speaks the OpenAI-compatible API. The quickest path is DashScope:

```bash
export OPENAI_API_KEY=sk-...
export OPENAI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
export OPENAI_MODEL=qwen3-coder-plus
```

Alternatively, run `qwen` interactively and use the built-in OAuth flow.

## Example

```ts
import { createClient } from '@a5c-ai/agent-mux';

const client = createClient();
const run = client.run({
  agent: 'qwen',
  model: 'qwen3-coder-plus',
  prompt: 'Summarize the public API in src/index.ts',
});

for await (const ev of run.events()) {
  if (ev.type === 'text_delta') process.stdout.write(ev.delta);
}
```

## Plugins

Plugin support: **no**. Use MCP servers for extensibility.

### MCP Servers
```bash
amux mcp install qwen <mcp-server>
amux mcp list qwen
```

Registry: https://modelcontextprotocol.io

## Notes

- Session files live under `~/.qwen/sessions` (JSONL).
- MCP servers are configured under `mcpServers` in `~/.qwen/settings.json`.
- Capabilities are set conservatively — thinking, JSON mode, and image input
  default to `false` pending upstream confirmation.
