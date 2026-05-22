# @a5c-ai/atlas

Atlas catalog graph package. It ships the generated graph index, SDK helpers for graph interaction, and the `atlas` CLI.

## Usage

```ts
import { getStats, getRecord, searchRecords } from "@a5c-ai/atlas";

console.log(getStats());
console.log(getRecord("some-node-id"));
console.log(searchRecords("codex"));
```

```sh
atlas stats
atlas kinds
atlas get <node-id>
atlas search codex --limit 10
atlas neighbors <node-id> --depth 2
```

## MCP

The Atlas MCP surface is exposed by the Atlas WebUI as a Streamable HTTP endpoint:

```text
http://localhost:3000/api/mcp
```

Start the WebUI locally:

```sh
npm install
npm run dev -w @a5c-ai/atlas-webui
```

Then connect any MCP client that supports Streamable HTTP directly to that endpoint.

Example remote MCP client config:

```json
{
  "agentic-ai-atlas": {
    "url": "http://localhost:3000/api/mcp"
  }
}
```

For clients that only speak stdio, bridge to the remote MCP endpoint with `npx`:

```sh
npx -y mcp-remote http://localhost:3000/api/mcp
```

Example stdio client config through `npx`:

```json
{
  "agentic-ai-atlas": {
    "command": "npx",
    "args": [
      "-y",
      "mcp-remote",
      "http://localhost:3000/api/mcp"
    ]
  }
}
```

Current MCP scope is public Atlas data only:

- graph stats and clusters
- search
- record lookup
- incoming and outgoing neighbors
- node-kind and edge-kind listings
- wiki pages
- OpenAPI discovery for the public REST surface

Authenticated overlays, user-uploaded subgraphs, and other private workspace data are intentionally excluded for now.
