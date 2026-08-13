# @a5c-ai/adapters-gateway

`@a5c-ai/adapters-gateway` is the package scaffold for remote and browser-facing
adapters surfaces.

## Runtime requirements

Requires **Node.js >= 22.13.0**. The gateway stores tokens, bootstrap auth state
and the run event-log index in the built-in `node:sqlite` module, and the package
root loads it eagerly. Node.js added `node:sqlite` in v22.5.0 behind
`--experimental-sqlite` and only unflagged it in
[v22.13.0](https://nodejs.org/docs/latest-v22.x/api/sqlite.html), so importing
this package on anything older fails immediately. Older runtimes are rejected by
`engines.node` at install time and by an explicit engine diagnostic on import;
there is no SQLite-less mode.

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
