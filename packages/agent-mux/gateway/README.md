# @a5c-ai/agent-mux-gateway

`@a5c-ai/agent-mux-gateway` is the package scaffold for remote and browser-facing
agent-mux surfaces.

Current scope:

- `GatewayConfig` and default configuration helpers
- `createGateway(config)` returning a start/stop gateway handle
- token auth, HTTP/WS server, run manager, fanout replay, and runtime hook brokering
- optional static webui hosting from `@a5c-ai/agent-mux-webui/dist`

Service templates:

- `examples/systemd/amux-gateway.service`
- `examples/launchd/ai.a5c.amux.gateway.plist`

If the web UI package is not installed, `/` returns a helpful 404. Install
`@a5c-ai/agent-mux-webui` alongside this package or start the CLI with
`amux gateway serve --webui /path/to/dist`.
