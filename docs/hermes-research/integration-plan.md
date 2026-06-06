# Hermes Integration Plan

## Adapter Implementation Plan

### Phase 1: Upgrade adapter-hermes from shell-hook to JSON-RPC (Priority: High)

**Current state:** The adapter at `packages/adapters/hooks/adapter-hermes/` operates as a `shell-hook` family adapter. It receives a single `onEvent` stdin payload, normalizes it to a unified hook event, and cannot block, deny, or mutate tool calls. This is the minimum viable integration.

**Target state:** Upgrade to leverage Hermes' TUI Gateway JSON-RPC protocol for bidirectional control.

**Implementation steps:**

1. **Add JSON-RPC client to adapter-hermes**
   - File: `packages/adapters/hooks/adapter-hermes/src/rpc-client.ts`
   - Implement a JSON-RPC client that connects to Hermes' TUI Gateway (stdio or WebSocket)
   - Support methods: `session.create`, `prompt.submit`, `session.history`, `approval.respond`, `clarify.respond`
   - Handle events: `message.delta`, `message.complete`, `tool.start`, `tool.progress`, `tool.complete`

2. **Extend adapter capabilities**
   - File: `packages/adapters/hooks/adapter-hermes/src/adapter.ts`
   - Upgrade `family` from `shell-hook` to `rpc-bridge`
   - Enable `supportsBlock: true` (via approval.respond)
   - Enable `supportsAsk: true` (via clarify.respond)
   - Keep `supportsToolInputMutation: false` and `supportsToolResultMutation: false` (Hermes does not support these)

3. **Add session management**
   - File: `packages/adapters/hooks/adapter-hermes/src/session-manager.ts`
   - Track active Hermes sessions and map them to babysitter run sessions
   - Support session creation, listing, activation, and cleanup

4. **Update normalizer for bidirectional events**
   - File: `packages/adapters/hooks/adapter-hermes/src/normalizer.ts`
   - Add normalization for all TUI Gateway event types (currently only handles `onEvent`)
   - Map Hermes `tool.start`/`tool.progress`/`tool.complete` to unified pre/post tool events

### Phase 2: Gateway bridge for messaging delivery (Priority: Medium)

**Goal:** Route babysitter orchestration results to Hermes' 20+ messaging platforms.

**Implementation steps:**

1. **Create gateway bridge module**
   - File: `packages/adapters/gateway/src/hermes-bridge.ts`
   - Connect to Hermes gateway's delivery API
   - Map babysitter run events (task completion, breakpoint hit, approval needed) to Hermes gateway `send_message` calls
   - Support targeting specific platforms (Telegram, Discord, Slack) by chat ID

2. **Add notification routing**
   - File: `packages/adapters/gateway/src/notifications/hermes-relay.ts`
   - Register Hermes gateway as a notification backend in our gateway
   - Route babysitter notification events to the Hermes gateway process

3. **Authorization mapping**
   - Map our gateway auth tokens to Hermes gateway authorization
   - Support DM pairing flow for user onboarding

### Phase 3: Memory synchronization (Priority: Low)

**Goal:** Bidirectional memory sync between babysitter crossRunState and Hermes memory files.

**Implementation steps:**

1. **Create memory sync plugin**
   - File: `packages/adapters/extensions/src/targets/hermes/memory-sync.ts`
   - Read Hermes' `MEMORY.md` and `USER.md` at babysitter run start
   - Write babysitter crossRunState insights back to Hermes memory files at run end

2. **Leverage Hermes memory provider hooks**
   - If Hermes is the execution harness, hook into `on_session_end` to capture extracted memory
   - Feed captured memory into babysitter run journal for cross-run state

### Phase 4: Provider catalog bridge (Priority: Low)

**Goal:** Expose Hermes' 30+ provider catalog through our adapters proxy.

**Implementation steps:**

1. **Add Hermes provider backend to adapters proxy**
   - File: `packages/adapters/proxy/src/adapters_proxy/providers/hermes.py`
   - Query Hermes' runtime resolver for available providers
   - Map provider capabilities to our proxy's provider interface
   - Route inference requests through Hermes when using its unique providers (Nous Portal, NovitaAI, etc.)

---

## Hook Wiring Plan

### Event mapping (current adapter-hermes)

| Hermes Native Event | Unified Phase | Direction | Notes |
|---------------------|---------------|-----------|-------|
| `onEvent` (tool.start) | `tool.before` | post | Cannot block |
| `onEvent` (tool.complete) | `tool.after` | post | Cannot mutate result |
| `onEvent` (session.start) | `session.start` | post | |
| `onEvent` (session.end) | `session.end` | post | |
| `onEvent` (agent.step) | `turn.after` | post | |

### Planned event mapping (with JSON-RPC upgrade)

| Hermes RPC Event | Unified Phase | Direction | Notes |
|------------------|---------------|-----------|-------|
| `tool.start` | `tool.before` | pre+post | Can block via approval |
| `tool.progress` | `tool.during` | stream | Progress updates |
| `tool.complete` | `tool.after` | post | Result available |
| `message.delta` | `response.stream` | stream | Token-by-token |
| `message.complete` | `response.complete` | post | Full response |
| `approval_request` | `approval.request` | pre | Block and wait |
| `clarify_request` | `clarify.request` | pre | Block and wait |

### Hook lifecycle integration

```
babysitter run start
  |
  +-- adapter-hermes creates Hermes session (session.create RPC)
  |
  +-- babysitter submits task prompt (prompt.submit RPC)
  |
  +-- Hermes AIAgent processes turns:
  |     |
  |     +-- tool.start -> unified pre-tool hook -> governance check
  |     |
  |     +-- approval_request -> adapter bridges to babysitter breakpoint
  |     |
  |     +-- tool.complete -> unified post-tool hook -> effect recording
  |     |
  |     +-- message.delta -> streaming renderer
  |     |
  |     +-- message.complete -> babysitter task result capture
  |
  +-- adapter-hermes captures session history
  |
  +-- babysitter records effects and journal entries
```

---

## Test Strategy

### Unit tests (adapter-hermes)

Location: `packages/adapters/hooks/adapter-hermes/src/__tests__/`

| Test file | Coverage |
|-----------|----------|
| `adapter.test.ts` | Adapter capabilities, family assignment, capability flags |
| `normalizer.test.ts` | Event normalization, stdin parsing, session ID extraction |
| `mappings.test.ts` | Phase mapping table completeness |
| `renderer.test.ts` | Output rendering for Hermes format |
| `session-resolver.test.ts` | Session resolution from env vars |

**New tests needed for Phase 1:**

| Test file | Coverage |
|-----------|----------|
| `rpc-client.test.ts` | JSON-RPC method calls, event handling, error recovery |
| `session-manager.test.ts` | Session lifecycle, mapping to babysitter runs |
| `bidirectional-normalizer.test.ts` | All TUI Gateway event types |

### Integration tests

| Test | Description |
|------|-------------|
| `hermes-shell-hook-e2e` | Verify current shell-hook adapter normalizes real Hermes onEvent payloads |
| `hermes-rpc-session-e2e` | Verify JSON-RPC session creation and prompt submission (Phase 1) |
| `hermes-gateway-delivery-e2e` | Verify babysitter notifications route through Hermes gateway (Phase 2) |

### Live-stack tests

| Test | Description |
|------|-------------|
| `hermes-babysitter-create` | Babysitter creates a session in Hermes, submits a simple task, captures result |
| `hermes-babysitter-resume` | Babysitter resumes a Hermes session across process restarts |
| `hermes-approval-bridge` | Hermes approval request bridges to babysitter breakpoint and back |

### Test fixtures

Hermes event fixtures already exist at:
`packages/adapters/hooks/adapter-hermes/src/__tests__/fixtures/hermes-events.ts`

Additional fixtures needed:
- TUI Gateway JSON-RPC response payloads
- Gateway message delivery payloads
- Memory provider hook payloads

### CI integration

- Hermes adapter unit tests run in the existing `npm run test:hooks-adapter` pipeline
- Integration tests require Hermes installed as a dependency (`pip install hermes-agent`)
- Live-stack tests require a running Hermes instance with a configured provider
- Gate: all adapter unit tests must pass before integration tests run

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Hermes API instability (pre-1.0) | Pin to specific version range; adapter capabilities read from atlas catalog |
| Python/TypeScript bridge complexity | JSON-RPC is language-agnostic; stdio transport avoids FFI |
| Session state divergence | Adapter-hermes is authoritative for session mapping; Hermes sessions are ephemeral from our perspective |
| Gateway auth mismatch | Map our auth tokens to Hermes platform-specific auth; do not store Hermes credentials in our config |
| Memory format drift | Schema-validate MEMORY.md/USER.md content before writing; fail-open on parse errors |
