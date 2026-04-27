# @a5c-ai/agent-mux-core

Core types, client, and stream engine for [agent-mux](https://github.com/a5c-ai/agent-mux).

Provides the `AgentMuxClient`, the normalized `AgentEvent` stream, adapter contracts, atomic filesystem helpers, authentication managers, and the session/run machinery that every adapter depends on.

## Install

```bash
npm install @a5c-ai/agent-mux-core
```

Requires Node.js >= 20.9.0. ESM-only.

## Usage

```ts
import {
  AgentMuxClient,
  createClient,
  resolveRunOptions,
  type AuthMethodDescriptor,
  type PluginInfo,
} from '@a5c-ai/agent-mux-core';
```

The public surface is grouped around:

- client/runtime entry points such as `AgentMuxClient` and `createClient`
- run, auth, and capability contracts such as `RunOptions` and `AuthMethodDescriptor`
- plugin contracts such as `PluginInfo`, `PluginListing`, and `PluginBrowseOptions`
- merge and filesystem helpers such as `resolveRunOptions` and `writeFileAtomic`

See the [repository README](https://github.com/a5c-ai/agent-mux#readme) for full documentation.

## License

MIT © a5c-ai
