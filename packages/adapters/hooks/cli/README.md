# @a5c-ai/hooks-adapter-cli

CLI entrypoint for hooks-adapter.

## Install

```bash
npm install -g @a5c-ai/hooks-adapter-cli
```

This package ships the built CLI in `dist/` and this package README for npm publish-surface auditing.

## CLI Surface

```bash
adapters-hooks --help
adapters-hooks doctor
adapters-hooks invoke --adapter claude --native-event SessionStart
```

Use this package when you want the `adapters-hooks` binary without depending on the full monorepo source tree.

See the workspace overview in [`packages/adapters/hooks/README.md`](../README.md) and the operational guides in `packages/adapters/hooks/docs/`.

## License

MIT © a5c-ai
