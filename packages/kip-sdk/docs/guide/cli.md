# kip CLI reference

`kip` is a standalone command-line surface over the kip SDK. It drives the `Repo` methods directly
and adds no new substrate semantics — every write still enters kip as one signed, append-only fact.

This page documents the **real** command surface: flags, the SDK method each command calls, the
stdout shapes, and the exit-code contract. All examples were run against the built binary.

> **Running the CLI.** The package is unpublished, so run the built entry directly:
> ```bash
> npm run build --workspace=@a5c-ai/kip-sdk
> node packages/kip-sdk/dist/cli/kip.js --help
> ```
> In this reference the command is shortened to `kip`; substitute
> `node packages/kip-sdk/dist/cli/kip.js` (or a shell alias).

---

## Global options, resolution, and identity

Every command resolves a `Repo` from flags → environment → default, and surfaces any resolution
failure (exit 3) **before** touching the SDK.

| Global option | Env fallback | Default | Purpose |
|---|---|---|---|
| `--dir <path>` | `KIP_DIR` | `./.kip` | repo directory |
| `--replica <id>` | `KIP_REPLICA_ID` | — (**required** to open) | stable author id |
| `--keyring <path>` | `KIP_KEYRING` | `<dir>/keyring.json` if present | signing key material (JSON) |
| `--tenant <t>` | `KIP_TENANT` | — | scope lens (`withScope`) |
| `--namespace <ns>` | `KIP_NAMESPACE` | — | scope namespace |
| `--json` | — | off (human render) | emit one canonical JSON value to stdout |
| `--as-of <t>` | — | now | per-read valid-time selector (read commands) |
| `--help`, `-h` / `--version`, `-V` | — | — | usage / version, exit 0 |

Grammar: `kip [GLOBAL_OPTS] <command> [ARGS] [CMD_OPTS]`. Global options may appear before the
command. Under `--json`, stdout carries **only** the JSON value; all diagnostics go to stderr.

- **`replicaId` is mandatory** for any command that opens the repo. Missing it exits 3.
- **Keyring** is **required** for write commands (`assert`, `retract`, `sync --push`) and optional
  for reads. A missing keyring on a write exits 3 (`keyring required to author facts`). The CLI does
  not create one — see [Creating a keyring](#creating-a-keyring) before your first write.
- A read/write command against an uninitialized dir exits 3 (`repo not initialized`).

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Command evaluated; result (including `null`, `[]`, `unanswerable`) on stdout |
| `1` | A typed `KipError` was thrown (caller-input rejection) |
| `2` | CLI usage error (unknown command/flag, missing required positional/bound) |
| `3` | Environment/resolution error, surfaced before any SDK call |
| `4` | Transport/sync failure (`kip sync`) |
| `5` | Graph-QA dispatch failure (`kip ask` — never a fabricated answer) |
| `6` | Opt-in `--fail-on-conflict` / `--fail-on-unknown` signal (data still printed first) |

`fsck` is the one read command whose report verdict maps to an exit code: `report.ok === false`
exits 1 (the report is still printed).

### Creating a keyring

Every write command (`assert`, `retract`, `sync --push`) needs a resolvable keyring, and the CLI
does **not** create one — `kip init` writes genesis but no key, and there is no `kip keygen` command
(tracked as [D-51](../DEBTS.md#d-51-cli-has-no-keygenidentity-bootstrap-command--writing-from-the-cli-requires-hand-creating-keyringjson-via-the-sdk)).
So before your first write, create the keyring **file** the CLI loads. It is a JSON object of PEM
key material with exactly this shape:

```json
{
  "privateKeyPem": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "publicKeyPem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"
}
```

Write it once with a tiny SDK script, then run writes against `<dir>/keyring.json` (the resolved
default) — the full runnable recipe and its verified `assert`/`get` output live in
[Getting started → Create a `keyring.json` for the CLI / MCP](./getting-started.md#create-a-keyringjson-for-the-cli--mcp).
The `kip assert` / `kip retract` examples below assume that keyring is already in place.

---

## Commands

### `kip init` / `kip open`

Lifecycle commands over `open()`.

- **`kip init --create`** — create a fresh repo (genesis). `--create` is required (guards accidental
  init over a non-empty dir). Genesis params are flags with defaults: `--hash-algo <sha1|sha256>`
  (default `sha256`), `--shard-depth` (2), `--clock-epoch` (0), `--epsilon-causal-ms` (0),
  `--root-key <fpr>` (repeatable), `--quarantine-ttl-ms`, `--quarantine-key-cap-bytes`,
  `--quarantine-pool-bytes`, `--key-chain-durable-cap-bytes`, `--heads-committed`. Or pass the whole
  block with `--genesis-file <path>`.
  - stdout: `{ "dir", "created": true, "manifestGenesisCid", "branch" }`
- **`kip open`** — open an existing repo and print status (no write).
  - stdout: `{ "dir", "created": false, "branch", "manifestGenesisCid" }`

```console
$ export KIP_DIR=./mem KIP_REPLICA_ID=r1
$ kip init --create --json
{"dir":".../mem","created":true,"manifestGenesisCid":"sha256:68ea...","branch":"refs/kip/replicas/r1"}
$ kip open --json
{"dir":".../mem","created":false,"branch":"refs/kip/replicas/r1","manifestGenesisCid":"sha256:68ea..."}
```

> `manifestGenesisCid` is the SHA-256 of the on-disk genesis `manifest.json` (a stable content
> address the CLI derives; the `Repo` surface exposes no genesis-CID accessor).

### `kip assert`

Author signed `assert` facts. Three forms:

- **Node:** `kip assert node --eid <EID> --kind <NodeKind> [--prop k=v ...] [--valid-from <t>] [--valid-to <t>]` → `putNode`.
- **Edge:** `kip assert edge --kind <EdgeKind> --from <EID> --to <EID> [--eid <EID>] [--prop k=v ...] --valid-from <t> [--valid-to <t>]` → `putEdge` (`--valid-from` is required).
- **Raw fact:** `kip assert fact --file <fact.json>` or `--stdin` → `assertFact`.

`--prop k=v` values parse as JSON scalars (`name="Ada"` → string, `born=1815` → number,
`ok=true` → boolean); a value that fails to parse is kept as a raw string; `k=@<cid>` denotes a
`BlobRef`.

- Node/edge forms echo `{ "eid", "status": "pending" }` — the sugar compiles to multiple facts, so
  there is no single stamped fact id to return (the CLI never fabricates one).
- The raw-fact form echoes the full stamped envelope `{ "id", "hlc", "seq", "status" }`.

```console
$ kip assert node --eid ada --kind Person --prop 'name="Ada Lovelace"' --prop born=1815 --json
{"eid":"ada","status":"pending"}
$ kip assert edge --kind knows --from ada --to babbage --valid-from 2020-01-01 --json
{"eid":"knows:ada->babbage","status":"pending"}
```

### `kip retract`

Author a signed `retract` (a bounded `validTo` on an existing cell). Two forms:

- **Targeted:** `kip retract --eid <EID> [--prop <PropKey>] --valid-to <t>`.
- **Raw fact:** `kip retract fact --file <retract.json>` / `--stdin`.

Echoes `{ "id", "hlc", "seq", "status" }`.

```console
$ kip retract --eid ada --prop born --valid-to 2021-01-01 --json
{"id":"460b6f...","hlc":{"wall":1784402258034,"counter":0,"replicaId":"r1"},"seq":0,"status":"pending"}
```

### `kip get`

Read one node (or edge) as-of a time.

- `kip get <EID>` (node) — SDK `getNode`; `--edge` reads an edge via `getEdge`.
- `--as-of <t>` pins the read to a valid-time.
- stdout: the `NodeView` (or `EdgeView` with `--edge`), or `null` for an unknown EID. `null` exits 0
  (unknown is data, not an error); `--fail-on-unknown` exits 6.

```console
$ kip get ada --json
{"eid":"ada","kind":"Person","props":{"name":{"segments":[{"kind":"value","value":"Ada Lovelace","validFrom":0,"validTo":null,"assertedBy":"05ab..."}]},...},"provenance":{...}}
$ kip get nobody --json
null
```

### `kip query`

Typed, bounded, as-of traversal → `query(TraversalSpec)`. `--depth` and `--max-fanout` are
**mandatory** (missing either exits 2); `--direction` is required.

- Flags: `--seed <EID>` (repeatable), `--direction <out|in|both>`, `--depth <n>`, `--max-fanout <n>`,
  `--edge-kind <k>` (repeatable), `--kind <NodeKind>` (repeatable), `--as-of <t>`, `--ndjson`.
- stdout: a JSON array of `NodeView | EdgeView` in traversal order (or one per line with `--ndjson`).

```console
$ kip query --seed ada --direction out --depth 2 --max-fanout 8 --json
[{"eid":"ada","kind":"Person",...},{"eid":"knows:ada->babbage","kind":"knows","from":"ada","to":"babbage",...},{"eid":"babbage","kind":"Person",...}]
```

### `kip recall`

Hybrid vector+graph+salience RRF retrieval → `recall(RecallQuery)`. The query text is a positional;
`--k <n>` is **required**.

- Flags: `"<query text>"` (positional → `RecallQuery.text`), `--k <n>`, `--embedding-file <path>`
  (a JSON `number[]` → `RecallQuery.embedding`), `--as-of <t>`, `--fail-on-conflict`.
- stdout: `RecallResult[]` — each `{ eid, view, score, ranks, conflicted, provenance }`.

```console
$ kip recall "the analytical engine" --k 5 --json
[{"eid":"note1","view":{...},"score":0.0163...,"ranks":{"graph":1},"conflicted":false,"provenance":{...}}]
```

> **Honest scope.** `text` is an **exact/keyword graph seed** matched against a node's `content`
> cell — not a semantic search, and kip never embeds it for you. `--embedding-file` supplies the
> caller's own query vector for the vector half, which additionally requires a corpus-embedding
> dispatcher to be wired; without one, an embedding-bearing recall errors (exit 1). The vector half,
> when enabled, is an exact brute-force cosine scan — there is no ANN index yet.

### `kip asof`

Curry a fixed bitemporal read view and run one sub-read against it → `asOf(asOf)` then a `ReadView`
method. Grammar: `kip asof <get|query|recall> <args> [--valid-time <t>] [--tx-time <hlc>] [--believer <id>]`.

- `kip asof get <EID> [--edge]`
- `kip asof query --seed <EID> --direction <...> --depth <n> --max-fanout <n>`
- `kip asof recall "<query>" --k <n>`
- stdout: identical shape to the corresponding live read, evaluated at the fixed frontier.

```console
$ kip asof get ada --valid-time 1900-01-01 --json
null
$ kip asof get ada --json
{"eid":"ada","kind":"Person",...}
```

> `--valid-time` is fully supported. A `--tx-time`/`--believer` lens naming a *different* replica is
> not yet implemented and throws rather than returning a wrong answer.

### `kip fsck`

Verify the repo → `fsck()`. `--quiet` suppresses the human report body.

- stdout: the full `FsckReport`.
- exit: `0` iff `report.ok === true`, else `1` (the report is still printed).

```console
$ kip fsck --json
{"ok":true,"headsMatch":true,"mergeDriverInstalled":true,"manifestGenesisCidMatch":true,"badSignatures":[],"authorityViolations":[],"excisionResidue":[],"missingDurable":[],"missingNonDurable":[],"promisorMissingDurable":[]}
```

### `kip rollup`

Materialize a read-latency snapshot through an author-HLC → `rollup(RollupOptions)`. `--through-hlc <hlc>`
is **required** (missing it exits 2); accepts an epoch-ms number or a JSON HLC object.

- stdout: `{ "rollup": <CID>, "throughHlc": <HlcStamp>, "scope"?: <ScopeRef> }`.

```console
$ kip rollup --through-hlc 9999999999999 --json
{"rollup":"f920503a...","throughHlc":{"wall":9999999999999,"counter":0,"replicaId":"r1"}}
```

### `kip sync`

Fetch/push facts against a git remote and set-union merge → `sync(remote, opts)`. Conflicts are
surfaced as data, never auto-picked.

- Flags: `kip sync <remote>` (git remote name or URL), `--fetch` / `--push` (default both),
  `--remote-branch <ref>` (repeatable), `--retention <default|permissive>`, `--fail-on-conflict`.
- stdout: `SyncReport` — `{ received, sent, merged, conflicts, tip }`.
- exit: `0` on a completed sync (even with conflicts); `4` on transport failure. With
  `--fail-on-conflict`, exit `6` when `conflicts.length > 0`.

> **Honest scope.** `sync` is **pull-only** in this build: `sent` is always `0`, `--push` is not yet
> implemented, and `tip` is a fact-set digest, not a resolvable git commit CID. This example is
> illustrative (it needs a reachable remote); the *shape* is the contract.

### `kip ask`

Answer a natural-language question over the graph → the read-only graph-QA microagent. It authors
**nothing** (a pure read).

- Flags: `kip ask "<question>"` (required), `--as-of <t>`, `--model <id>`, `--timeout <ms>`,
  `--k <n>`, `--manifest <name@version>`.
- stdout: `{ "answer": <string|null>, "status": "answered"|"unanswerable", "citations": [...], "model": <id>, "asOf"?: <AsOf> }`.
- exit: `0` for both `answered` and `unanswerable`; `5` if the microagent **dispatch fails**
  (no model / timeout / schema-invalid output — never a fabricated answer); `1` on
  `ERR_UNREGISTERED_MANIFEST` or an empty question.

**`kip ask` needs a host model.** By default it synthesizes prose by spawning your
already-authenticated local `claude` CLI (ADR-B8) — there is no bundled model. Two behaviors follow:

- When retrieval finds **no** supporting facts, `ask` abstains **without** spending anything:
  `status: "unanswerable"`, `answer: null`, exit 0.
- When retrieval **does** find facts but no model is available (no `claude` on PATH, or
  unauthenticated), it **fails loudly**: exit 5, with a diagnostic on stderr, and never invents an
  answer.

```console
$ kip ask "who does ada know?" --json      # no matching content → honest abstention
{"answer":null,"status":"unanswerable","citations":[],"model":"haiku"}

$ kip ask "the analytical engine" --json    # facts found, but no model on this host
kip: graph-QA dispatch failed (exitCode 1): graph-QA synthesis: no model is available — `claude --version` exited 127 ...
# exit 5
```

The live path costs roughly **$0.02–0.045 per ask** on the default `haiku` model (the OAuth flow
forces ~20k cache-creation tokens before the question is even read). Live asks in the test suite are
gated behind `KIP_ASK_LIVE=1` so a default test run never spends. Set `KIP_CLAUDE_BIN` to an explicit
path if the wrong `claude` is picked up on PATH.

---

## Errors

- **Resolution errors (exit 3)** are pre-flight: repo-not-initialized, missing `replicaId`,
  keyring-required-but-unreadable — all before any SDK call.
- **`KipError` (exit 1)** renders as `{ "error": { "code", "message", "context"? } }` on stderr under
  `--json`, or `kip: <code>: <message>` otherwise.
- **Domain outcomes are exit 0 by default** — `null`, empty arrays, `unanswerable`. The opt-in
  `--fail-on-conflict` / `--fail-on-unknown` flags (exit 6) exist purely so scripts can request a
  non-zero signal without the CLI reinterpreting data as failure.

## See also

- [Getting started](./getting-started.md) — the same operations from the SDK.
- [API reference](./api.md) — the underlying `Repo` methods and types.
- [MCP server](./mcp.md) — the same graph exposed to MCP clients.
