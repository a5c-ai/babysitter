# @a5c-ai/agent-mux-hooks-cli

CLI entrypoint for hooks-mux.

## Install

```bash
npm install -g @a5c-ai/agent-mux-hooks-cli
```

This package ships the built CLI in `dist/` and this package README for npm publish-surface auditing.

## CLI Surface

```bash
agent-mux-hooks --help
agent-mux-hooks doctor
agent-mux-hooks invoke --adapter claude --native-event SessionStart
```

Use this package when you want the `agent-mux-hooks` binary without depending on the full monorepo source tree.

See the workspace overview in [`packages/agent-mux/hooks/README.md`](../README.md) and the operational guides in `packages/agent-mux/hooks/docs/`.

## License

MIT © a5c-ai
