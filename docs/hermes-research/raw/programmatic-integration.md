# Programmatic Integration

> Source: https://hermes-agent.nousresearch.com/docs/developer-guide/programmatic-integration

Hermes offers three protocols for external program control:

## Protocol Comparison

| Protocol | Transport | Use Case | Location |
|----------|-----------|----------|----------|
| ACP | JSON-RPC over stdio | IDE clients (VS Code, Zed, JetBrains) | `acp_adapter/` |
| TUI Gateway | JSON-RPC over stdio/WebSocket | Custom hosts needing fine-grained control | `tui_gateway/server.py` |
| API Server | HTTP + Server-Sent Events | OpenAI-compatible frontends | `gateway/platforms/api_server.py` |

All three drive the same `AIAgent` core with different wire formats.

## ACP (Agent Client Protocol)

Launch with: `hermes acp`

"Session creation, prompt submission, streaming agent message chunks, tool-call events, permission requests, session fork, cancel, and authentication" are exposed capabilities.

Bootstrap for IDEs: `hermes acp --bootstrap`

## TUI Gateway JSON-RPC

Controls sessions and features via methods like:
- `session.create`, `session.list`, `session.activate`, `session.close`
- `prompt.submit`, `prompt.background`
- `session.steer`, `session.history`, `session.compress`, `session.branch`
- `command.dispatch`, `approval.respond`, `clarify.respond`

**Events returned:** `message.delta`, `message.complete`, `tool.start`, `tool.progress`, `tool.complete`, plus approval and clarify requests.

## OpenAI-Compatible API Server

HTTP endpoints:
- `POST /v1/chat/completions` (with SSE streaming)
- `POST /v1/responses` (stateful)
- `POST /v1/runs` (start run, returns ID)
- `GET /v1/runs/{id}` (status)
- `GET /v1/runs/{id}/events` (SSE lifecycle stream)
- `POST /v1/runs/{id}/approval` (resolve approvals)

## Model Hot-Swapping

Mid-session model switching via `/model` slash command:
- CLI/TUI: `/model claude-sonnet-4`
- TUI gateway: `command.dispatch` RPC method
- API server: `model` field in request body

## Selection Guide

- **IDE plugins with ACP support** -> Use ACP
- **Custom hosts requiring all features** -> TUI gateway JSON-RPC
- **OpenAI-compatible frontends or HTTP clients** -> API server
- **Python in-process without subprocess** -> Import `AIAgent` directly
