# kip MCP server (`kip-mcp`)

`kip-mcp` is a standalone [Model Context Protocol](https://modelcontextprotocol.io) server that
exposes one kip memory repo — read, write, and graph-QA — to any MCP-speaking agent over stdio. One
process opens exactly one `Repo` (via `open()`) and serves it as a set of named tools.

All shapes and behaviors below were verified against the built server.

---

## Launching the server

The server ships as the `kip-mcp` bin. The package is unpublished, so launch the built entry:

```bash
npm run build --workspace=@a5c-ai/kip-sdk

node packages/kip-sdk/dist/mcp/server.js --dir ./my-memory --replica-id laptop-1 --keyring ./keyring.json
```

It speaks newline-delimited JSON-RPC 2.0 on stdin/stdout; **stdout carries only protocol frames**
(diagnostics go to stderr).

> **A write server needs a keyring file first.** The `--keyring ./keyring.json` above (and the
> `KIP_KEYRING` in the `.mcp.json` below) points at a file this server does **not** create — start a
> write server against a nonexistent keyring and it fails to load key material. Create the
> `{ privateKeyPem, publicKeyPem }` JSON once (see [Creating a keyring](#creating-a-keyring)). Only a
> `--read-only` server may start without one.

### Creating a keyring

The write tools (`kip_assert`, `kip_retract`, `kip_sync`) sign facts and therefore need a keyring —
the same `{ privateKeyPem, publicKeyPem }` PEM JSON the CLI loads. Neither `kip-mcp` nor `kip init`
emits one (tracked as [D-51](../DEBTS.md#d-51-cli-has-no-keygenidentity-bootstrap-command--writing-from-the-cli-requires-hand-creating-keyringjson-via-the-sdk)),
so write it once with a tiny SDK script and point `--keyring` / `KIP_KEYRING` at it. The runnable
recipe (and its verified output) is in
[Getting started → Create a `keyring.json` for the CLI / MCP](./getting-started.md#create-a-keyringjson-for-the-cli--mcp);
the exact file shape is documented under the SDK's
[`exportKeyring()`](./api.md#exportkeyring). A `--read-only` server serves the read tools and
`kip_ask` with no keyring at all.

### Launch options

| Flag | Env fallback | Purpose |
|---|---|---|
| `--dir <path>` | `KIP_REPO_DIR` | repo directory (**required** — no cwd default) |
| `--replica-id <id>` | `KIP_REPLICA_ID` | stable author id (**required**) |
| `--keyring <path>` | `KIP_KEYRING` | signing key material (JSON); required for a write server |
| `--read-only` | `KIP_READ_ONLY=1` | omit and refuse the write tools |
| `--create-if-missing` | — | create genesis; requires `--genesis <path>` |
| `--genesis <path>` | — | genesis config file for `--create-if-missing` |
| `--tenant <t>` / `--namespace <ns>` | — | scope lens applied to every tool |

> Note the repo-dir env var here is `KIP_REPO_DIR` (the MCP server), distinct from the CLI's
> `KIP_DIR`. Startup with neither `--dir` nor `KIP_REPO_DIR` fails before advertising any tools.

---

## Registering it with an MCP client

Point any harness's MCP config at the built server. For example, an `.mcp.json`:

```jsonc
{
  "mcpServers": {
    "kip": {
      "command": "node",
      "args": [
        "packages/kip-sdk/dist/mcp/server.js",
        "--dir", "./my-memory",
        "--replica-id", "laptop-1"
      ],
      "env": { "KIP_KEYRING": "./keyring.json" }
    }
  }
}
```

The server advertises its tool list in the standard `initialize` / `tools/list` handshake:

```console
$ printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"c","version":"1"}}}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | node packages/kip-sdk/dist/mcp/server.js --dir ./my-memory --replica-id laptop-1
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{"name":"kip-mcp","version":"0.0.1"}}}
{"jsonrpc":"2.0","id":2,"result":{"tools":[ ... ten tools ... ]}}
```

---

## The ten tools

Each tool result is a single `text` content item whose `text` is the JSON-serialized body. Domain
outcomes that kip models as *data* (a `null` node, an `ok:false` fsck report, an abstaining answer)
come back as **normal results**, not MCP errors.

| Tool | Group | `Repo` method | Authors a fact? | In `--read-only`? |
|---|---|---|---|---|
| `kip_get_node` | read | `getNode(eid, asOf?)` | no | available |
| `kip_get_edge` | read | `getEdge(eid, asOf?)` | no | available |
| `kip_query` | read | `query(TraversalSpec)` | no | available |
| `kip_recall` | read | `recall(RecallQuery)` | no | available |
| `kip_asof` | read | `asOf(AsOf)` → one sub-read | no | available |
| `kip_fsck` | read | `fsck()` | no | available |
| `kip_ask` | graph-QA | genty dispatch over read-only reads | **no** | available |
| `kip_assert` | write | `putNode` / `putEdge` | **yes** | **omitted** |
| `kip_retract` | write | `tombstone` / `retractFact` | **yes** | **omitted** |
| `kip_sync` | write | `sync(remote, opts)` | mutates local set | **omitted** |

### Read tools

- **`kip_get_node`** — input `{ eid, asOf? }`; body `NodeView | null`.
- **`kip_get_edge`** — input `{ eid, asOf? }`; body `EdgeView | null`.
- **`kip_query`** — input `{ seed, direction, depth, maxFanout, edgeKinds?, kinds?, asOf? }`
  (`depth` and `maxFanout` **required**); body `{ results: (NodeView | EdgeView)[] }` (the fully
  drained iterable). Missing `depth`/`maxFanout` returns an `InvalidParams` error with
  `data.code: "ERR_MALFORMED_INPUT"`.
- **`kip_recall`** — input `{ query?, embedding?, k?, asOf? }`; body `{ results: RecallResult[] }`,
  each row preserving `conflicted` and `provenance`. (The input field is named `query` here — the
  same exact/keyword graph seed the SDK's `RecallQuery.text` carries.)
- **`kip_asof`** — input `{ asOf, read }` where `read` is one of `{ op: "getNode", eid }`,
  `{ op: "getEdge", eid }`, `{ op: "query", spec }`, `{ op: "recall", q }`; body is the chosen
  sub-read's result, evaluated at the fixed `asOf`.
- **`kip_fsck`** — no input; body the `FsckReport`. An `ok:false` report is a normal result.

```console
# kip_get_node
$ ... '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"kip_get_node","arguments":{"eid":"ada"}}}'
{"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"{\"eid\":\"ada\",\"kind\":\"Person\",\"props\":{...},\"provenance\":{...}}"}]}}
```

### Write tools

- **`kip_assert`** — a discriminated body: `{ kind: "node", node: { eid, kind, props?, validFrom?, validTo? } }`
  → `putNode`, or `{ kind: "edge", edge: { kind, from, to, validFrom, eid?, props?, validTo? } }`
  → `putEdge`. Body `{ eid }`. (Raw `assertFact` is deliberately **not** an MCP tool — a client
  supplies intent, and the server is the sole signer.)
- **`kip_retract`** — `{ mode: "tombstone", eid, reason }` → `tombstone` (body `{ factId }`), or
  `{ mode: "cell", target, validTo? }` → `retractFact` (body `{ id, hlc, seq, status }`).
- **`kip_sync`** — `{ remote, fetch?, push?, remoteBranches?, retention? }` → `sync`; body the
  `SyncReport`, conflicts surfaced.

```console
# kip_assert (node)
$ ... '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"kip_assert","arguments":{"kind":"node","node":{"eid":"zed","kind":"Person","props":{"name":"Zed"}}}}}'
{"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"{\"eid\":\"zed\"}"}]}}

# kip_retract (tombstone)
$ ... '{"name":"kip_retract","arguments":{"mode":"tombstone","eid":"zed","reason":"demo"}}'
{"...":"...","result":{"content":[{"type":"text","text":"{\"factId\":\"23914c88...\"}"}]}}
```

> `excise` and `revokeKey` are intentionally **not** MCP tools — destructive/authority operations
> stay operator-only SDK/CLI actions.

### Graph-QA tool — `kip_ask`

`kip_ask` answers a natural-language question over the graph with a **read-only** genty microagent
that traverses the graph and returns a grounded, cited answer. Input `{ question, asOf?, scope? }`;
body `{ answer, abstained?, citations, usedFacts, model? }`.

- It authors **nothing** — a `kip_ask` call leaves the fact-set frontier byte-identical.
- With no supporting evidence it abstains as a **normal** result (no fabricated answer):

```console
$ ... '{"name":"kip_ask","arguments":{"question":"who is ada?"}}'
{"...":"...","result":{"content":[{"type":"text","text":"{\"answer\":\"No supporting facts in the knowledge graph.\",\"abstained\":true,\"citations\":[],\"usedFacts\":[],\"model\":\"haiku\"}"}]}}
```

Like the CLI's `kip ask`, live synthesis needs an authenticated local `claude` CLI on the host (see
the [CLI reference](./cli.md#kip-ask) for the model requirement, the ~$0.02–0.045 cost, and the
loud-failure contract). A dispatch failure (no model / timeout / schema-invalid output) returns an
MCP error with `data.code: "ERR_ASK_DISPATCH_FAILED"` — never an invented answer.

> **`kip_ask` model prerequisite.** Like `kip ask` on the CLI, `kip_ask` needs an authenticated
> `claude` CLI on the host `PATH` — the default dispatcher spawns it directly via `node:child_process`
> (no extra package dependency; `@a5c-ai/genty-platform` is only a documented seam for a host that
> wires its own dispatcher, not a requirement of the default path). Without a usable model the tool
> fails loudly with `data.code: "ERR_ASK_DISPATCH_FAILED"` — it never fabricates — and the read/write
> tools are unaffected.

---

## Read-only mode and error model

With `--read-only` (or `KIP_READ_ONLY=1`):

- `tools/list` **omits** `kip_assert`, `kip_retract`, and `kip_sync`; read tools and `kip_ask`
  remain.
- Calling a write tool by name anyway returns an MCP error **before** touching the repo:

```console
$ ... --read-only  '{"name":"kip_assert","arguments":{"kind":"node","node":{"eid":"q","kind":"T"}}}'
{"jsonrpc":"2.0","id":1,"error":{"code":-32600,"message":"tool 'kip_assert' is not available on a --read-only kip MCP server","data":{"code":"ERR_READ_ONLY"}}}
```

- A read-only server may start without a keyring (it still opens and reads the repo).

Error mapping otherwise mirrors kip's two-channel rule: domain outcomes are normal results;
caller-input rejections and capability denials become MCP errors carrying the originating
`KipErrorCode` in `data.code` (e.g. `InvalidParams` / `ERR_MALFORMED_INPUT` for a schema violation,
`MethodNotFound` / `ERR_UNKNOWN_TOOL` for an unknown tool).

## See also

- [CLI reference](./cli.md) — the same operations at a terminal.
- [API reference](./api.md) — the `Repo` methods each tool calls.
