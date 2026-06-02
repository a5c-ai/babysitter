# transport-mux architecture

## Objective

Build a JS proxy package that preserves the current `amux-proxy` external contract while separating two internal concerns cleanly:

- **protocols**: what the harness talks
- **providers**: where the request actually goes

The package should be designed so a protocol can evolve without re-implementing provider auth/discovery logic, and a provider can evolve without re-implementing protocol parsing/rendering logic.

## Terminology

### Protocol

A protocol is the harness-facing wire contract exposed by the proxy.

Examples:

- Anthropic Messages
- OpenAI Chat Completions
- OpenAI Responses
- Google GenerateContent
- Bedrock Converse
- Vertex-native GenerateContent
- Azure Foundry chat completions

### Provider

A provider is the upstream execution target plus its operational rules.

Examples:

- OpenAI direct
- Anthropic direct
- Google direct
- Bedrock
- Vertex
- Azure/Foundry
- custom OpenAI-compatible endpoint

## Design rule

**Protocol is not provider.**

The old transport-centric framing made it too easy to bury provider behavior inside protocol handlers. This architecture forbids that.

In particular:

- auth resolution belongs to providers
- endpoint/path construction belongs to providers
- model alias and deployment resolution belong to providers
- request body parsing and response framing belong to protocols

## Top-level shape

The implementation should be organized around two first-class layers plus a narrow shared seam.

### 1. Protocol layer

Suggested module area:

- `src/protocols/*`

Each protocol module owns:

- route registration
- auth extraction from incoming harness requests
- request body validation
- conversion into a normalized completion request
- response rendering
- streaming event rendering
- protocol-native error translation

Suggested protocol interface:

```ts
interface ProtocolCodec {
  id: ExposedTransportId;
  mount(router: Hono, deps: ProtocolRuntimeDeps): void;
  decode(request: Request, ctx: ProtocolRequestContext): Promise<NormalizedCompletionRequest>;
  encode(result: NormalizedCompletionResult, ctx: ProtocolResponseContext): Response;
  encodeError(error: NormalizedProxyError, ctx: ProtocolResponseContext): Response;
  encodeStream(
    stream: AsyncIterable<NormalizedStreamEvent>,
    ctx: ProtocolResponseContext,
  ): Response;
}
```

### 2. Provider layer

Suggested module area:

- `src/providers/*`

Each provider module owns:

- auth acquisition and injection
- base URL and path resolution
- provider request mapping
- provider-native streaming parser
- model listing
- token counting
- provider capability reporting

Suggested provider interface:

```ts
interface ProviderAdapter {
  id: CanonicalProviderId;
  describeCapabilities(config: ProxyConfig): ProviderCapabilities;
  complete(
    request: NormalizedCompletionRequest,
    ctx: ProviderExecutionContext,
  ): Promise<NormalizedCompletionResult>;
  stream(
    request: NormalizedCompletionRequest,
    ctx: ProviderExecutionContext,
  ): AsyncIterable<NormalizedStreamEvent>;
  listModels(ctx: ProviderExecutionContext): Promise<ModelDescriptor[]>;
  countTokens(
    request: NormalizedTokenCountRequest,
    ctx: ProviderExecutionContext,
  ): Promise<TokenCountResult>;
}
```

### Shared seam: normalized core

Suggested module area:

- `src/core/*`

The shared seam should define:

- normalized request types
- normalized result types
- normalized streaming events
- provider capability descriptors
- cross-layer error types

This seam is where protocol/provider coordination happens.

## Context sensitivity without coupling

The layers must be context-aware without becoming entangled.

### Protocol layer needs provider context for

- deciding whether tool calling can be passed through
- deciding whether reasoning or thinking blocks can be represented faithfully
- deciding whether token counting is supported natively or needs fallback behavior
- deciding whether streaming should be downgraded, buffered, or rejected

### Provider layer needs protocol context for

- shaping tool call arguments so the harness receives the right protocol form
- preserving finish reasons that the harness depends on
- deciding whether to emit richer metadata or reduce to the protocol’s legal surface
- mapping upstream errors into a normalized form that can be rendered back correctly

That means the core seam should carry both:

- **provider capabilities**
- **protocol hints**

but never raw protocol-specific payloads across the layer boundary.

## Runtime flow

### Control plane

1. `agent-mux` resolves canonical provider config.
2. `translate-for-harness.ts` decides the exposed protocol expected by the harness.
3. `launch.ts` starts the `transport-mux` runtime when a proxy bridge is needed.
4. `transport-mux` boots the protocol codec and provider adapter implied by that config.

### Data plane

1. inbound request enters the selected protocol route
2. protocol auth is validated against the proxy token
3. protocol payload is decoded into a normalized request
4. provider adapter resolves endpoint/auth/model nuances and executes upstream
5. provider-native response/stream is normalized
6. protocol codec renders the normalized result back into the harness-facing protocol

## Config model

The package contract already expects a config layer around:

- `createProxyConfig(...)`
- `readProxyConfigFromEnv()`
- `validateProxyConfig(...)`

The minimal config surface already pinned by tests is:

```ts
interface ProxyConfig {
  targetProvider: string;
  targetModel: string;
  exposedTransport: ExposedTransportId;
  authToken?: string;
  host: string;   // defaults to 127.0.0.1
  port: number;   // defaults to 0
  stream: boolean; // defaults to true
  apiBase?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}
```

Validation rules already implied by tests:

- `targetProvider` is required
- `targetModel` is required
- `exposedTransport` is required
- invalid transport ids are rejected

## Route contract already pinned by tests

The server contract should continue to mount the following routes.

### Shared routes

- `GET /health`
- `GET /v1/models`
- `GET /metrics`
- `GET /cache/stats`
- `POST /v1/count_tokens`

`GET /v1/models` is already expected by tests to expose the configured target model through an OpenAI-style `data` array where `data[0].id === targetModel`.

`POST /v1/count_tokens` should delegate to the provider/runtime token-counting seam, not synthesize a JSON-length estimate in the protocol layer. The cutover contract is the legacy `amux-proxy` response shape `{ count }`. Invalid JSON and provider/request failures should surface as explicit error responses, and providers that do not implement token counting should return a clear unsupported response instead of a fabricated estimate.

`GET /metrics` and `GET /cache/stats` are retained as part of the cutover contract rather than silently dropped. The current JS runtime must preserve the legacy route shapes:

- `/metrics` returns in-process request/error/token counters with the historical keys: `total_input_tokens`, `total_output_tokens`, `total_requests`, `total_errors`, `uptime_seconds`, and `avg_tokens_per_request`.
- `/cache/stats` returns legacy cache visibility. Until `transport-mux` owns a real response cache, the route returns `{ "enabled": false }` explicitly instead of disappearing.
- For engine-backed completions, `/metrics` records normalized usage from the completion result or terminal stream event.
- For passthrough responses, `/metrics` still records successful request counts and error counts, but token totals remain `0` because upstream provider usage is not normalized at the proxy boundary today.

### Protocol routes

| Protocol id | Route shape | Notes |
|---|---|---|
| `anthropic` | `POST /v1/messages` | accepts `x-api-key` or bearer auth |
| `openai-chat` | `POST /v1/chat/completions` | returns `object: "chat.completion"` |
| `openai-responses` | `POST /v1/responses` | returns `object: "response"` |
| `google` | `POST /v1beta/models/*` | public Gemini-style route |
| `passthrough` | `/passthrough/*` | forwards upstream path directly |
| `bedrock-converse` | `POST /converse` | Bedrock-native surface |
| `vertex-native` | `POST /v1/projects/.../publishers/.../models/...:generateContent` | Vertex-specific route shape |
| `azure-foundry` | `POST /models/chat/completions` | Foundry-specific route shape |

## Auth model

There are two different auth domains and they must stay separate.

### Proxy-boundary auth

Owned by the protocol/server boundary:

- incoming harness request must present the proxy token
- `x-api-key` is accepted
- `Authorization: Bearer ...` is accepted
- missing or wrong token returns `401`
- `/health`, `/v1/models`, `/metrics`, and `/cache/stats` remain unauthenticated for startup/discovery and operator checks

### Upstream provider auth

Owned by the provider layer:

- API keys
- IAM / AWS signing
- ADC / service account credentials
- Azure deployment credentials
- custom bearer/token-command flows

The protocol layer should never know how upstream auth is constructed.

## Normalized request/result model

The tests already imply a completion seam with the following minimum shape.

### Request

```ts
interface NormalizedCompletionRequest {
  model: string;
  messages: NormalizedMessage[];
  tools?: NormalizedToolDefinition[];
  toolChoice?: NormalizedToolChoice;
  stream?: boolean;
  generation?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stop?: string[];
  };
  protocolHints?: {
    exposedTransport: ExposedTransportId;
  };
}
```

### Result

```ts
interface NormalizedCompletionResult {
  id: string;
  model: string;
  role: 'assistant';
  text: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: NormalizedToolCall[];
}
```

### Stream events

The normalized stream model should cover at least:

- text delta
- tool call start
- tool call delta
- tool call complete
- usage snapshot
- terminal completion
- terminal error

## Server/runtime API

The tests already pin two runtime entrypoints, and launcher integration now adds a third runtime helper.

### In-process app creation

```ts
createTransportMuxApp({
  config,
  completionEngine?,
})
```

Use this for route/unit tests and protocol characterization.

### Real listener startup

```ts
const server = await startProxyServer(config);
server.url;
await server.stop();
```

Use this for live HTTP/e2e verification and launcher integration.

### Launcher-managed runtime startup

```ts
const runtime = await startTransportMuxRuntime({
  targetProvider: 'bedrock',
  targetModel: 'bedrock/anthropic.claude-sonnet-4-20250514-v1:0',
  exposedTransport: 'openai-responses',
});
runtime.applyHarnessEnv(env);
await runtime.stop();
```

Use this when `agent-mux` needs the package-owned runtime to serve a harness-facing transport surface directly.

## Capability negotiation

The most important architectural refinement for this package is explicit capability negotiation.

Suggested provider capability shape:

```ts
interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsReasoningBlocks: boolean;
  supportsTokenCounting: boolean;
  supportsSystemPrompts: boolean;
  supportsResponseSchema: boolean;
  upstreamProtocol:
    | 'anthropic'
    | 'openai-chat'
    | 'openai-responses'
    | 'google'
    | 'bedrock-converse'
    | 'vertex-native'
    | 'azure-foundry'
    | 'custom';
}
```

Negotiation rules:

- protocol codecs may reject unsupported features early with protocol-native errors
- provider adapters may downgrade only when the behavior is documented and test-covered
- silent feature loss should be avoided unless the passthrough protocol explicitly allows it

## Tests as architectural guardrails

This package is still ahead in tests/specs relative to implementation. That is acceptable, but the docs should describe what is already pinned.

Current tests already cover:

- config defaults and validation
- route mounting by protocol id
- proxy-boundary auth behavior
- protocol-specific response shaping
- passthrough forwarding
- live HTTP roundtrip via `startProxyServer(...)`

The next implementation should preserve that structure and grow it rather than replacing it.

## Recommended source layout

The package can land incrementally, but this is the layout the architecture is pushing toward:

```text
src/
  bin/
    amux-proxy.ts
  config.ts
  server.ts
  types.ts
  core/
    errors.ts
    normalize.ts
    capabilities.ts
  protocols/
    anthropic.ts
    openai-chat.ts
    openai-responses.ts
    google.ts
    passthrough.ts
    bedrock-converse.ts
    vertex-native.ts
    azure-foundry.ts
  providers/
    openai.ts
    anthropic.ts
    google.ts
    bedrock.ts
    vertex.ts
    foundry.ts
    passthrough.ts
  shared/
    auth.ts
    http.ts
    logging.ts
```

That layout keeps protocol code and provider code searchable, testable, and difficult to accidentally re-entangle.
