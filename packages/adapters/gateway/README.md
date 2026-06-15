# @a5c-ai/adapters-gateway

`@a5c-ai/adapters-gateway` is the package scaffold for remote and browser-facing
adapters surfaces.

Current scope:

- `GatewayConfig` and default configuration helpers
- `createGateway(config)` returning a start/stop gateway handle
- token auth, HTTP/WS server, run manager, fanout replay, and runtime hook brokering
- optional static webui hosting from `@a5c-ai/genty-webui/dist`

Service templates:

- `examples/systemd/adapters-gateway.service`
- `examples/launchd/ai.a5c.adapters.gateway.plist`

If the web UI package is not installed, `/` returns a helpful 404. Install
`@a5c-ai/genty-webui` alongside this package or start the CLI with
`adapters gateway serve --webui /path/to/dist`.
