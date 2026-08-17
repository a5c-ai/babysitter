# @a5c-ai/adapters-cli

The `adapters` command-line interface for [adapters](https://github.com/a5c-ai/adapters).

## Install

```bash
npm install -g @a5c-ai/adapters-cli
# or
npx @a5c-ai/adapters-cli --help
```

Requires Node.js >= 22.13.0. The CLI root statically loads `@a5c-ai/adapters-gateway`, which uses the built-in `node:sqlite` module (unflagged only from Node.js 22.13.0).

## Usage

```bash
adapters --help
adapters run --agent claude-code --prompt "Summarize README.md"
adapters adapters list
adapters sessions list
```

See the [repository README](https://github.com/a5c-ai/adapters#readme) for full command documentation.

## License

MIT © a5c-ai
