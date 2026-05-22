# NodeKinds: `ModelTransportProtocol`, `MCPTransport`, `AgentHostTransport`, `TransportProxy`

> Cluster 2 — Compute path entities. See [`README.md`](./README.md) for the full catalog.

## Purpose

The transport NodeKinds make wire protocols first-class graph entities, separable from the providers that serve them, the models that speak them, and the agents that consume them. There are three orthogonal transport axes in the atlas stack, each with its own NodeKind, plus an optional interposer:

- **`ModelTransportProtocol`** — the LLM wire protocol carrying inference requests (e.g., Anthropic Messages, OpenAI Responses). Realizes Layer 3 Transport.
- **`MCPTransport`** — the wire transport for MCP, the tool-side JSON-RPC protocol (stdio, Streamable HTTP, …). Lives at Layer 5 (`AgentRuntimeImpl` speaks MCP).
- **`AgentHostTransport`** — how a host process talks to an agent CLI/process (stdio, http, ws, mcp-mediated, …). Lives at Layer 6 (`AgentPlatformImpl` exposes this).
- **`TransportProxy`** — optional interposer between Transport-Client and Provider for routing, recording, integrity, local-model bridging, etc. Realizes Layer 3 Transport as an optional proxy/interposer.

These are deliberately separate NodeKinds. Conflating them (as legacy docs sometimes did with the word "transport") loses the distinction between *talking to a model*, *talking to a tool server*, and *talking to an agent process*, all of which evolve on different vendor timelines.

---

## `ModelTransportProtocol`

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `model-transport:anthropic-messages`. |
| `displayName` | string | yes | Human-readable label (e.g., `"Anthropic Messages"`). |
| `vendor` | string | yes | The defining vendor (e.g., `"Anthropic"`, `"OpenAI"`, `"Google"`, `"AWS Bedrock"`, community for de-facto standards). |
| `specUrl` | evidence-bound<url> | yes | URL of the canonical spec / API reference. Evidence at `vendor-doc-or-better`. |
| `streamingFraming` | enum<sse,jsonl,grpc-stream,custom,aws-event-stream> | yes | How streamed responses are framed on the wire. |
| `toolUseSchema` | evidence-bound<markdown> | yes | Short description of the tool-use envelope (block kinds, ids, naming). Evidence at `vendor-doc-or-better`. |
| `thinkingChannel` | evidence-bound<enum<content-block,item,part,none>> | yes | How extended-thinking output is carried in responses. Evidence at `vendor-doc-or-better`. |
| `cacheControl` | evidence-bound<enum<explicit,implicit,none>> | yes | Whether the protocol exposes prompt-cache control to clients. Evidence at `vendor-doc-or-better`. |
| `usageEnvelope` | evidence-bound<enum<anthropic-usage,openai-usage,gemini-usage-metadata,bedrock-usage,none>> | yes | Per-protocol cost/usage envelope shape. Anthropic Messages emits `usage{input_tokens,output_tokens,cache_creation_input_tokens,cache_read_input_tokens}`; OpenAI Responses/ChatCompletions emits `usage{prompt_tokens,completion_tokens,total_tokens,reasoning_tokens?}`; Gemini emits `usageMetadata{promptTokenCount,candidatesTokenCount,totalTokenCount}`; Bedrock Converse emits `usage{inputTokens,outputTokens,totalTokens}`. Evidence at `vendor-doc-or-better`. No cross-vendor standard exists — the absence is recorded as a gap-of-record, not an OpenQuestion. |
| `requestBodyShape` | evidence-bound<markdown> | no | Canonical request body structure on the wire (top-level fields and required vs. optional). Evidence at `vendor-doc-or-better`. |
| `responseBodyShape` | evidence-bound<markdown> | no | Canonical non-streaming response body structure on the wire. Evidence at `vendor-doc-or-better`. |
| `streamingEventTypes` | evidence-bound<list<string>> | no | Ordered list of event types observed on a streamed response (e.g. Anthropic: `message_start`, `content_block_start`, `content_block_delta`, `content_block_stop`, `message_delta`, `message_stop`). Evidence at `vendor-doc-or-better`. |
| `toolCallWireFormat` | evidence-bound<markdown> | no | Concrete shape used to carry a tool/function call from the model (envelope field names and required keys). Evidence at `vendor-doc-or-better`. |
| `toolResultWireFormat` | evidence-bound<markdown> | no | Concrete shape used to carry a tool/function result back to the model (envelope field names and the id used to correlate with the call). Evidence at `vendor-doc-or-better`. |
| `errorEnvelope` | evidence-bound<markdown> | no | Concrete error response body shape (status code(s), envelope field names, error type/code surface). Evidence at `vendor-doc-or-better`. |
| `cacheControlWireFormat` | evidence-bound<markdown> | no | Concrete on-the-wire mechanism for prompt caching (block-level annotations, opaque keys, named cache resources, …). Evidence at `vendor-doc-or-better`. |
| `rateLimitSignaling` | evidence-bound<markdown> | no | Headers and/or body fields the protocol uses to signal rate-limit state (remaining budget, reset, `Retry-After`). Evidence at `vendor-doc-or-better`. |
| `reasoningWireFormat` | evidence-bound<markdown> | no | Concrete on-the-wire shape used to carry reasoning / extended-thinking output, including any signature/redaction fields. Evidence at `vendor-doc-or-better`. |
| `authHeaderFormat` | evidence-bound<markdown> | no | Authentication header shape expected by first-party endpoints (header name + token format). Evidence at `vendor-doc-or-better`. |
| `versioningHeader` | evidence-bound<markdown> | no | How protocol version is negotiated on the wire (header name + value, beta opt-in headers, or path-versioning). Evidence at `vendor-doc-or-better`. |
| `firstSpecVersion` | string | yes | The version label of the first publicly-documented release of this protocol. |
| `currentSpecVersion` | string | yes | The version label of the currently-recommended release. |
| `status` | enum<standard,de-facto,proprietary,deprecated> | yes | Protocol status; `de-facto` for community-standardized shapes (e.g., the OpenAI-compatible chat-completions surface served by local-model runners). |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `served_by` | `Provider` | N:N | Providers that expose this protocol as a public endpoint. |
| `spoken_by` | `ModelVersion` | N:N | Model versions whose canonical surface is this protocol. Inverse of `speaks` (see `../../schema/edge-kinds.md`). |
| `bridged_by` | `TransportProxy` | N:N | Proxies that translate to/from this protocol. |

### Known instances (Phase 2 population targets)

- `model-transport:anthropic-messages` (status: standard) — `https://docs.anthropic.com/en/api/messages`
- `model-transport:openai-responses` (status: standard) — `https://platform.openai.com/docs/api-reference/responses`
- `model-transport:openai-chatcompletions` (status: standard) — `https://platform.openai.com/docs/api-reference/chat`
- `model-transport:gemini-generatecontent` (status: standard) — `https://ai.google.dev/api/generate-content`
- `model-transport:bedrock-invoke` (status: standard) — `https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeModel.html`
- `model-transport:bedrock-converse` (status: standard) — `https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html`
- `model-transport:openai-compat` (status: de-facto) — the OpenAI-chat-completions-compatible surface served by Ollama, vLLM, llama.cpp, LM Studio, etc. Vendor `"community"`.

---

## `MCPTransport`

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `mcp-transport:stdio`. |
| `displayName` | string | yes | Human-readable label (e.g., `"Streamable HTTP"`). |
| `kind` | enum<stdio,streamable-http,http-sse-deprecated,websocket-non-standard> | yes | The wire framing. |
| `specVersion` | string | yes | The MCP spec version label in which this transport first appeared (or in which it was deprecated, for `http-sse-deprecated`). |
| `specRevisions` | evidence-bound<list<string>> | yes | Ordered MCP spec revisions the transport appears in (or last appeared in, for deprecated). Known revisions in order: `2024-11-05`, `2025-03-26`, `2025-06-18`, `2025-11-25`. Evidence at `vendor-doc-or-better`. |
| `currentSpecRevision` | evidence-bound<string> | yes | The most recently published MCP spec revision this entry has been audited against. Updated when the spec advances. Evidence at `vendor-doc-or-better`. |
| `streaming` | evidence-bound<enum<none,partial,full>> | yes | Streaming richness: `none` = request/response only; `partial` = incremental single-channel framing (stdio); `full` = bidirectional streaming with server-push (Streamable HTTP). Evidence at `vendor-doc-or-better`. |
| `status` | enum<live,deprecated,non-standard> | yes | `non-standard` is reserved for the WebSocket variant which exists in some implementations but is not part of the spec. |
| `specUrl` | evidence-bound<url> | yes | URL anchor in the MCP spec. Evidence at `vendor-doc-or-better`. |
| `connectionLifecycle` | evidence-bound<markdown> | no | Connection lifecycle: handshake, `initialize` request → `initialize` response → `notifications/initialized`, ready, and shutdown semantics for this transport. Evidence at `vendor-doc-or-better`. |
| `capabilityNegotiation` | evidence-bound<markdown> | no | Shape of the `initialize` request and response — `protocolVersion`, `clientInfo`/`serverInfo`, the exchanged `capabilities` object — as carried over this transport. Evidence at `vendor-doc-or-better`. |
| `notificationModel` | evidence-bound<markdown> | no | How JSON-RPC notifications and server-pushed events are delivered on this transport (channel, ordering, delivery guarantees). Evidence at `vendor-doc-or-better`. |
| `reconnectPolicy` | evidence-bound<markdown> | no | Reconnect / session-resumption semantics. For Streamable HTTP this includes the `Mcp-Session-Id` header and SSE `Last-Event-ID` resumption. Evidence at `vendor-doc-or-better`. |
| `authentication` | evidence-bound<markdown> | no | Authentication model on this transport (none for stdio; bearer tokens / OAuth Resource Server flow per the 2025-06-18 spec for HTTP-based transports). Evidence at `vendor-doc-or-better`. |
| `streamingFraming` | evidence-bound<markdown> | no | Wire framing details: SSE event delimiters / headers, JSON-RPC message-id discipline, content-length framing on stdio, etc. Evidence at `vendor-doc-or-better`. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `supported_by` | `AgentVersion` | N:N | Per-product MCP transport support, version-ranged. Each edge carries an `EvidenceSource`. |
| `replaced_by` | `MCPTransport` | N:1 | Required when `status = deprecated`. |

### Known instances

- `mcp-transport:stdio` (status: live, primary) — the original local-process transport. Present in every spec revision: `2024-11-05`, `2025-03-26`, `2025-06-18`, `2025-11-25`. `streaming = partial`.
- `mcp-transport:streamable-http` (status: live, current) — introduced in MCP spec `2025-03-26`; carried forward (with the mandatory `MCP-Protocol-Version` header added in `2025-06-18`) into `2025-11-25`. `streaming = full`.
- `mcp-transport:http-sse` (status: deprecated; deprecated in spec `2025-03-26`; `replaced_by` `mcp-transport:streamable-http`). `streaming = partial`.
- `mcp-transport:websocket` (status: non-standard) — appears in some community implementations; not part of the spec. `streaming = full`.

### Spec revision history

The MCP specification has shipped four published revisions to date:

1. **`2024-11-05`** — initial public release. stdio transport plus an early HTTP+SSE transport.
2. **`2025-03-26`** — adds Streamable HTTP, deprecates the legacy HTTP+SSE transport.
3. **`2025-06-18`** — removes JSON-RPC batching; adds **elicitation** (server→client structured prompts), **structured tool output**, **resource links**, **OAuth Resource Server** classification with **RFC 8707 Resource Indicators**, and the mandatory **`MCP-Protocol-Version`** header on Streamable HTTP requests.
4. **`2025-11-25`** — current spec at time of cataloguing.

Per-feature support is modeled as `Capability` entities (`capability:mcp-elicitation`, `capability:mcp-structured-tool-output`, `capability:mcp-resource-links`, `capability:mcp-oauth-resource-server`, `capability:mcp-protocol-version-header`, `capability:mcp-no-jsonrpc-batching`) bound to `AgentRuntimeImpl` consumers via `CapabilitySupport`, rather than as enum flags on the transport itself. This keeps per-product support level (`full`, `partial`, `none`) and evidence sourcing first-class.

---

## `AgentHostTransport`

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `agent-host-transport:stdio`. |
| `displayName` | string | yes | Human-readable label. |
| `kind` | enum<stdio,stdio-pty,http,ws,grpc,mcp-mediated,embedded-sdk> | yes | How a host process invokes / communicates with an agent. |
| `description` | markdown | yes | One-paragraph description of the host↔agent shape, when each is used. |
| `inboundMessageFormat` | evidence-bound<markdown> | no | Concrete format the host uses to deliver work to the agent (e.g. JSON object on stdin per turn, HTTP request body shape, framed JSONL). Evidence at `vendor-doc-or-better`. |
| `outboundMessageFormat` | evidence-bound<markdown> | no | Concrete format the agent emits back to the host (e.g. line-delimited JSON / JSONL events on stdout, HTTP response body, WebSocket frames). Evidence at `vendor-doc-or-better`. |
| `signalForwarding` | evidence-bound<markdown> | no | How the host signals interrupt/cancel/shutdown to the agent process (POSIX signals on stdio; cancel RPC / abort message on http/ws; close-frame on ws). Evidence at `vendor-doc-or-better`. |
| `ptySemantics` | evidence-bound<markdown> | no | When `stdio+pty` is used vs. plain stdio — terminal semantics preserved (raw mode, ANSI, resize), and which agents require it. Evidence at `vendor-doc-or-better`. Only meaningful for `kind = stdio-pty` (or stdio with notes about PTY-aware behavior). |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `used_by` | `AgentVersion` | N:N | How a product can be invoked by a host (CI, IDE, dashboard, …). |

### Known instances

- `agent-host-transport:stdio` — plain stdin/stdout pipe; the simplest CLI invocation shape.
- `agent-host-transport:stdio-pty` — stdio over a PTY, preserving TTY semantics for interactive tools.
- `agent-host-transport:http` — HTTP request/response; used by hosted agent SDKs.
- `agent-host-transport:ws` — WebSocket; used for bidirectional streaming.
- `agent-host-transport:grpc` — gRPC; used by some enterprise integrations.
- `agent-host-transport:mcp-mediated` — host speaks MCP to the agent process (treats the agent as an MCP server).
- `agent-host-transport:embedded-sdk` — agent runs in-process via an SDK (no separate process); included so the schema can record "the host is also the agent runtime".

---

## `MCPResource`

MCP server-exposed read-only resource. Distinct from a tool — it is fetched by URI and may carry a MIME type. Reified as a NodeKind because the `uri + mimeType + subscribable` shape genuinely diverges from peer MCP primitives. (D1, planner 2026-05-01.)

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `mcp-resource:filesystem-readonly`. |
| `displayName` | string | yes | Human-readable label. |
| `uri` | evidence-bound<string> | yes | Canonical resource URI per MCP spec. Evidence at `vendor-doc-or-better`. |
| `mimeType` | string | no | MIME type when the resource is binary or typed. |
| `subscribable` | bool | no | Whether the resource supports `resources/subscribe` updates. |
| `description` | markdown | yes | One-paragraph description of what the resource exposes. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `exposes_resource` (incoming) | `ToolServer` → `MCPResource` | N:N | Declares the tool server exposes the resource. |

---

## `MCPPrompt`

MCP server-exposed prompt template. Has `name + arguments` shape, distinct from MCPResource. (D1, planner 2026-05-01.)

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `mcp-prompt:summarize-thread`. |
| `displayName` | string | yes | Human-readable label. |
| `name` | evidence-bound<string> | yes | Canonical prompt name advertised by the server. |
| `arguments` | list<object> | no | Per MCP spec each argument has `{ name, description?, required? }`. |
| `description` | markdown | yes | One-paragraph description of when to invoke the prompt. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `exposes_prompt` (incoming) | `ToolServer` → `MCPPrompt` | N:N | Declares the tool server exposes the prompt template. |

---

## `MCPSampling`

MCP server-requested model sampling capability. Distinct from a tool — the server requests inference back from the host's model. (D1, planner 2026-05-01.)

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `mcp-sampling:default-anthropic`. |
| `displayName` | string | yes | Human-readable label. |
| `modelPreferences` | object | no | Per MCP spec — `hints`, `costPriority`, `speedPriority`, `intelligencePriority`. |
| `systemPrompt` | string | no | Optional system prompt the server requests. |
| `description` | markdown | yes | One-paragraph description of the sampling shape. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `exposes_sampling` (incoming) | `ToolServer` → `MCPSampling` | N:1 | Declares the tool server requests sampling. |

---

## `MCPRoot`

MCP filesystem root scope advertised by the host. Distinct from MCPResource — a root is a scope (URI prefix) inside which the server may operate, not a fetchable artifact. (D1, planner 2026-05-01.)

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `mcp-root:project-workspace`. |
| `displayName` | string | yes | Human-readable label. |
| `uri` | evidence-bound<string> | yes | Filesystem URI scope advertised to the server. Evidence at `vendor-doc-or-better`. |
| `description` | markdown | yes | One-paragraph description of the scope. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `exposes_root` (incoming) | `ToolServer` → `MCPRoot` | N:N | Declares the tool server (host) advertises the root. |

---

## `AsyncJob`

Async / long-running job submission primitive. `kind` (what kind of work) and `statusModel` (how status is delivered) are independent enums, so it is reified rather than collapsed to enum. (D5, planner 2026-05-01.)

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `async-job:openai-batch-api`. |
| `displayName` | string | yes | Human-readable label. |
| `kind` | evidence-bound<enum<batch-api,background-task,webhook-callback,scheduled-job,streaming-completion>> | yes | What kind of asynchronous work the primitive submits. |
| `statusModel` | evidence-bound<enum<polling,webhook,sse,websocket>> | yes | How status / completion is delivered to the caller. |
| `description` | markdown | yes | One-paragraph description with link to vendor docs. |

### Multimodal output coverage (cross-link)

Output-direction modalities (TTS, image-gen, audio-gen) are now first-class on `ModelVersion` via the `modalityDirections` attribute (D8, planner 2026-05-01). When a model advertises e.g. `{ kind: audio, direction: output }` (TTS) or `{ kind: image, direction: output }` (image generation), `AsyncJob` of `kind=batch-api` is the typical submission shape. (D-bonus.multimodalOutputCoverage.)

### Stream-event kinds (cross-link)

`StreamEventKind` is an enum used as `streamEventKinds: list<...>` on `AgentHostTransport`, `ToolServer`, and `ModelTransportProtocol` (D7, planner 2026-05-01). Canonical values: `content-delta`, `tool-input-delta`, `thinking-delta`, `citation-delta`, `message-stop`, `error-event`, `ping`. Used for cross-protocol event-shape comparison alongside the existing free-form `streamingEventTypes` list.

### Tool-call shape (cross-link)

`ToolDescriptor.callShape` (D-bonus.toolCallShape, planner 2026-05-01) captures function-call / tool-use wire-shape variation across vendors: `openai-function`, `anthropic-tool-use`, `gemini-function-call`, `json-action`, `react-action`, `code-action`. A tool advertised as `output-format:openai-strict-json` (see `supportedOutputFormats` on AgentVersion) carries a strict JSON schema; the `callShape` records which envelope encloses it. (D-bonus.functionCallToolDescriptor.)

---

## `TransportProxy`

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `transport-proxy:agent-mux-proxy`. |
| `displayName` | string | yes | Human-readable label. |
| `kinds` | list<enum<routing,recording,integrity,local-model,compression,rate-limit,observability>> | yes | One or more proxy roles; a single proxy commonly fulfils several. |
| `bridges` | list<ref<ModelTransportProtocol>> | yes | The set of protocols the proxy can speak. When the proxy translates, the source and target are both members of this list and the per-edge `direction` attribute on `bridges` (see `../../schema/edge-kinds.md`) records which is source vs. target. |
| `signsResponses` | bool | yes | Whether the proxy emits signed responses for Trust Chain participation. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `bridges` | `ModelTransportProtocol` | N:N | Carries `direction` (`src` / `dst`) per the edge spec. |
| `participates_in` | `TrustChain` | N:N | Present when `signsResponses = true` and the proxy is part of a Trust Chain. |

---

## `TransportRuntime`

A runtime mechanism that hosts an agent's transport surface (e.g.
`terminal-cli`, `shell-hook-runtime`, `mcp-server`, `stdio-protocol`).
Distinct from `AgentHostTransport` (the agent's own host) and
`TransportProxy` (a relay).

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | E.g., `transport-runtime:terminal-cli`. |
| `displayName` | string | yes | Human-readable label. |
| `description` | markdown | yes | What this runtime does. |
| `runtimeKind` | enum<terminal-cli, shell-hook-runtime, mcp-stdio, mcp-sse, mcp-http, websocket, http-rest, native-process, in-process> | yes | Discriminator for the runtime mechanism. |
| `interactive` | bool | no | Whether the runtime supports interactive turn loops. |
| `streaming` | bool | no | Whether the runtime supports streaming output. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `supports` (incoming) | `Capability` | N:N | Capability claims pinned to this runtime. |
| `runs_in_runtime` (incoming) | (various) | N:N | Reserved for future entities that opt into a TransportRuntime. |
| `hosts_transport_protocol` (outgoing) | (various) | N:N | Transport protocols this runtime exposes. |

---

## Evidence

- `ModelTransportProtocol.specUrl`, `.toolUseSchema`, `.thinkingChannel`, `.cacheControl` are evidence-bound at **vendor-doc-or-better**: backed by the vendor's API reference, official changelog, or first-party SDK source.
- `MCPTransport.specUrl` is evidence-bound at **vendor-doc-or-better**: the MCP specification itself (or a versioned mirror).
- Every `MCPTransport.supported_by AgentVersion` edge MUST carry an `EvidenceSource` at `vendor-doc-or-better` (the product's docs / changelog).
- `AgentHostTransport.used_by` edges carry per-product evidence.

## Invariants

1. Every `ModelTransportProtocol` has at least one `served_by` edge to a `Provider`. A protocol that no provider serves is removed from the graph or marked `status = deprecated` with a `replaced_by` chain.
2. Every `ModelTransportProtocol` with `status = deprecated` MUST have a `replaced_by` edge to a non-deprecated protocol.
3. Every `MCPTransport` with `status = deprecated` MUST have a `replaced_by` edge to a transport with `status = live`.
4. `MCPTransport.kind` values are bijective with `MCPTransport` instances — at most one node per kind.
5. `TransportProxy.bridges` MUST contain at least one entry. A proxy that bridges nothing is a recorder/observability-only proxy and MUST list at least one `ModelTransportProtocol` it observes (still via `bridges`, with `direction = src`).
6. If `TransportProxy.signsResponses = true`, the proxy MUST have at least one `participates_in TrustChain` edge.
7. `id` prefixes are reserved per NodeKind: `model-transport:`, `mcp-transport:`, `agent-host-transport:`, `transport-proxy:`. No other NodeKind may use these prefixes.

---

## Examples

```yaml
- id: model-transport:anthropic-messages
  displayName: "Anthropic Messages"
  vendor: "Anthropic"
  specUrl: "https://docs.anthropic.com/en/api/messages"   # evidence: vendor-doc-or-better
  streamingFraming: sse
  toolUseSchema: |
    Tool calls appear as `tool_use` content blocks with `id`, `name`, and
    `input`; results are returned as `tool_result` blocks referencing the
    same `id`.
  thinkingChannel: content-block      # `thinking` content block
  cacheControl: explicit              # `cache_control: { type: "ephemeral" }`
  firstSpecVersion: "2023-07-12"
  currentSpecVersion: "2025-04-01"
  status: standard
  edges:
    served_by:
      - target: provider:anthropic
        firstParty: true
      - target: provider:aws-bedrock
        firstParty: false
      - target: provider:gcp-vertex
        firstParty: false
```

```yaml
- id: mcp-transport:stdio
  displayName: "stdio"
  kind: stdio
  specVersion: "2024-11-05"   # initial public spec
  status: live
  specUrl: "https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#stdio"
```

```yaml
- id: mcp-transport:http-sse
  displayName: "HTTP+SSE (deprecated)"
  kind: http-sse-deprecated
  specVersion: "2025-03-26"   # deprecated in this spec version
  status: deprecated
  specUrl: "https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#http-sse-deprecated"
  edges:
    replaced_by:
      - target: mcp-transport:streamable-http
```

```yaml
- id: agent-host-transport:stdio
  displayName: "stdio"
  kind: stdio
  description: |
    Plain stdin/stdout pipe to the agent process. The simplest invocation
    shape; used by CI runners, the babysitter harness, and most CLI tools
    when they spawn an agent for a single task.
```

```yaml
- id: transport-proxy:agent-mux-proxy
  displayName: "Agent-Mux Proxy"
  kinds: [routing, observability]
  bridges:
    - model-transport:anthropic-messages
    - model-transport:openai-responses
  signsResponses: false
  edges:
    bridges:
      - target: model-transport:anthropic-messages
        direction: src
      - target: model-transport:openai-responses
        direction: dst
```

## catalog pass 18 additions — Issue tracker integration

The catalog pass 18 remodel introduced three NodeKinds modeling *external* issue-tracker
integrations: how a babysitter/Symphony orchestrator binds to GitHub issues,
Linear, Jira, etc. These are tracker-side surfaces — distinct from internal
`Run` / `RunAttempt` lifecycle (in [`lifecycle.md`](./lifecycle.md)).

### NodeKind: `IssueTrackerProtocol` (origin: `convergent`)

#### Purpose

An **`IssueTrackerProtocol`** is the wire-and-semantics contract a tracker speaks
(GitHub Issues REST/GraphQL, Linear GraphQL, Jira REST, vibe-kanban file
protocol). Distinct from `IssueTracker` (which is a deployed instance/account).

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `issue-tracker-protocol:<slug>`, e.g. `issue-tracker-protocol:github-rest-v3`. |
| `displayName` | string | yes | |
| `vendor` | string | yes | |
| `wireFormat` | enum<rest,graphql,jsonrpc,filesystem-yaml,custom> | yes | |
| `specUrl` | evidence-bound<url> | yes | Canonical spec URL. |
| `writeBoundary` | enum `TrackerWriteBoundary` | yes | What writes the protocol permits (read-only / state-only / full). |
| `description` | markdown | yes | |

#### Invariants

1. `id` MUST start with `issue-tracker-protocol:`.

---

### NodeKind: `IssueTracker` (origin: `standardized`)

#### Purpose

An **`IssueTracker`** is a deployed tracker instance — a GitHub repo's issue
surface, a Linear team, a Jira project, a vibe-kanban directory. Bound to one
`IssueTrackerProtocol`.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `issue-tracker:<slug>`, e.g. `issue-tracker:github/babysitter`. |
| `displayName` | string | yes | |
| `protocolId` | ref `IssueTrackerProtocol` | yes | The protocol this instance speaks. |
| `endpointUrl` | string | yes | Base URL or path for the tracker. |
| `authMode` | enum<none,token,oauth,app-installation> | yes | |
| `description` | markdown | optional | |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `implements_protocol` | `IssueTrackerProtocol` | N:1 | Mirrors `protocolId`. |
| `produces_issue` | `Issue` | 1:N | Inverse of `Issue.from_tracker`. |
| `targeted_by_workflow` | `WorkflowDefinition` | N:N | Inverse of `WorkflowDefinition.targets_tracker`. |

#### Invariants

1. `id` MUST start with `issue-tracker:`.
2. `protocolId` MUST resolve.

---

### NodeKind: `Issue` (origin: `universal`)

> **catalog pass 22 origin correction:** previously `standardized`; reclassified to
> `universal`. The "issue" concept is cross-tracker (GitHub, GitLab, Jira, Linear,
> internal trackers, …) and not bound to any single published spec. See
> `REMODEL-NOTES.md` (catalog pass 22 hygiene).

#### Purpose

An **`Issue`** is a single tracked work item drawn from an `IssueTracker`. Babysitter
runs claim issues, transition their state, and post results back through the
tracker protocol.

#### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `issue:<tracker-slug>#<number>`. |
| `trackerId` | ref `IssueTracker` | yes | |
| `externalKey` | string | yes | Tracker-native key (e.g. `BABYSITTER-12`, `123` for GitHub). |
| `title` | string | yes | |
| `state` | string | yes | Tracker-native state name (mapped via `WorkflowDefinition.activeStates`). |
| `assignees` | list<string> | optional | |
| `createdAt` | iso-timestamp | yes | |
| `updatedAt` | iso-timestamp | yes | |

#### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `from_tracker` | `IssueTracker` | N:1 | Mirrors `trackerId`. |
| `has_run_attempts` | `RunAttempt` | 1:N | Inverse of `RunAttempt.for_issue`. |

#### Invariants

1. `id` MUST start with `issue:`.
2. `updatedAt >= createdAt`.

---

### Rate-limit observation note

The catalog pass 18 plan's proposed `RateLimitPayload` NodeKind was **collapsed** into
attribute blocks on `TransportProxy` and `AgentHostTransport`:
`rateLimitObservation: { capturedAt, vendor, primaryLimit{used,max,resetAt},
secondaryLimit, rawPayloadRef }`. `RuntimeSnapshot.lastRateLimitObservation`
also carries the same inline shape. Captured-snapshot data is ephemeral runtime
observation, not catalog identity — the protocol surface for rate-limit signaling
lives on `ModelTransportProtocol.rateLimitSignaling` (already present).

---

## Related

- [`README.md`](./README.md) — the full node-kind catalog and cluster index.
- [`stack-layers.md`](./stack-layers.md) — Layer 3 (Transport); Layer 5 / Layer 6 anchor MCP and AgentHost transports respectively.
- `Provider`, `ModelVersion` (Cluster 2) — endpoints of `served_by` and `spoken_by`.
- `AgentVersion`, `AgentCoreImpl`, `AgentRuntimeImpl`, `AgentPlatformImpl` (Cluster 3) — consumers of these transports.
- `TrustChain`, `Authority`, `Attestation` (Cluster 12) — participants in proxy-signed flows.
- `../../schema/edge-kinds.md` — `served_by`, `speaks` / `spoken_by`, `bridges` edge specifications.
- `../../schema/evidence-model.md` — evidence levels (`vendor-doc-or-better`) referenced above.

