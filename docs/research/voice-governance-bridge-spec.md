# `@a5c-ai/voice-adapter` — voice-governance bridge (draft spec)

> **Status:** Draft design spec for a **proposed, not-yet-built** package. Companion to [`realtime-voice-agent-stack.md`](./realtime-voice-agent-stack.md).
> **Date:** 2026-06-23.
> **One-liner:** the thin TypeScript bridge that lets an external realtime voice framework (LiveKit Agents) call **babysitter-governed tools** over MCP, with a kradle `VoiceCall` session CRD and an inbound-call→session spawn path — keeping all governance/audit logic inside this monorepo and out of the audio hot path.

## 1. Why this package exists

The voice stack splits cleanly:
- **External (LiveKit, Python):** media (WebRTC + SIP), VAD/turn-detection, STT, the conversational LLM turn, TTS. The audio hot path. We do **not** rebuild this.
- **Internal (this package, TS):** the *governed* tool/decision workflows the agent invokes mid-conversation — decomposition, policy, human approval gates, and a replayable audit journal — powered by the babysitter SDK + genty + kradle.

The bridge is the seam between them. It exists because (per the research) the only safe place to insert a deterministic, fsync-per-step, replay-based governance runtime into a sub-second voice loop is **behind an async tool boundary**, and LiveKit's **native one-line MCP** support makes MCP the cleanest wire for that boundary.

Naming/placement follows the established `packages/adapters/*` sibling convention (`@a5c-ai/<x>-adapter`, see `channels-adapter`).

## 2. Proposed package layout

```
packages/adapters/voice/
  src/
    index.ts                  # barrel
    mcp/
      server.ts               # MCP server exposing governed tools to LiveKit
      tools.ts                # GovernedTool registry + schema
      runDriver.ts            # in-process babysitter loop (create→iterate→commit)
    crd/
      voiceCall.ts            # VoiceCall CRD type + schema (kradle)
      voiceCallController.ts  # reconciler (clone of JitsiMeeting controller)
    backends/
      telephony.ts            # channels-adapter backend: inbound call → spawn
    processes/
      governedToolProcess.ts  # babysitter process() skeleton for a governed tool
    types.ts
    __tests__/...
  package.json                # @a5c-ai/voice-adapter, deps: babysitter-sdk, genty-core,
                              #   @modelcontextprotocol/sdk, kradle-core/sdk, triggers/channels-adapter
  tsconfig.json  vitest.config.ts (root-pinned)  README.md  LICENSE
  graph: → packages/atlas/graph/catalog-meta/package-surfaces/voice-adapter.yaml
```

Dependencies (all in-repo, `5.1.0`): `@a5c-ai/babysitter-sdk`, `@a5c-ai/genty-core`, `@a5c-ai/transport-adapter`, `@a5c-ai/channels-adapter`, kradle core/sdk; external `@modelcontextprotocol/sdk`. Architecture family: `dispatch-core` (depends on adapters + babysitter, like channels-adapter).

## 3. Component 1 — MCP server exposing governed tools

LiveKit connects with one line: `mcp_servers=[mcp.MCPServerHTTP(url="http://voice-bridge/mcp")]`. Each governed tool is declared once and backed by a babysitter run.

### 3.1 GovernedTool declaration

```ts
interface GovernedTool {
  name: string;                      // MCP tool name, e.g. "issue_refund"
  description: string;               // shown to the conversational LLM
  inputSchema: JSONSchema;           // validated before any run is created
  /** babysitter process entrypoint that governs this tool's workflow */
  process: { importPath: string; exportName: string };
  /** async = return control to the agent immediately (filler), deliver via callback.
   *  sync  = block the MCP call until the run is terminal (only for fast, <~1.5s workflows). */
  mode: 'async' | 'sync';
  /** optional pre-filler spoken while the governed run executes */
  filler?: string;                   // e.g. "Let me take care of that, one moment."
}
```

### 3.2 MCP call semantics (async tool — the default)

1. MCP `tools/call` arrives (`issue_refund`, `{acct, amount}`). Validate against `inputSchema` (reject malformed before any run — no fallback).
2. Create a babysitter run: `createRun({ process, inputs: args, runsDir })`. Tag it with the `voiceCallId` (§4) for correlation.
3. **Return immediately** with an MCP result that carries a `correlationId` + the `filler` string. LiveKit speaks the filler (`ToolFlag.CANCELLABLE`); the conversation continues.
4. Drive the run out-of-band in `runDriver.ts` (§3.3).
5. On terminal/approval-needed, deliver the result back into the LiveKit session — preferred mechanism: a **second MCP tool the agent polls** *or* an MCP **notification / SSE event** the LiveKit worker subscribes to, injected as a developer/tool message → the agent speaks the outcome. (LiveKit-side: an async tool that `await`s a future resolved by this callback.)

For `mode:'sync'` (fast governed workflows only): block the MCP response until terminal; LiveKit treats it as an ordinary synchronous tool. Use sparingly — only when the governed workflow's worst-case latency fits inside the filler-free budget.

### 3.3 In-process run driver (no subprocess)

`runDriver.ts` is the loop proven by genty's `runInternalOrchestrationPhase`:

```ts
async function driveRun(runDir: string, resolvers: EffectResolvers): Promise<RunOutcome> {
  for (;;) {
    const it = await orchestrateIteration({ runDir });
    if (it.status === 'completed') return { ok: true, value: it.result };
    if (it.status === 'failed' || it.status === 'process-error') return { ok: false, error: it };
    if (it.status === 'halted') return { ok: false, halted: it };
    if (it.status === 'waiting') {
      for (const action of it.nextActions) {
        if (action.kind === 'breakpoint') {
          // surface approval to the call (DTMF/console/human-agent); resolve when answered
          const decision = await resolvers.approve(action);            // async, may be slow
          await commitEffectResult({ runDir, effectId: action.effectId,
            invocationKey: action.invocationKey, result: { status: 'ok', value: decision } });
        } else {
          // execute the governed sub-tool IN THE HOST (genty lesson: don't make the LLM drive it)
          const value = await resolvers.execute(action);               // tool call / genty agent
          await commitEffectResult({ runDir, effectId: action.effectId,
            invocationKey: action.invocationKey, result: { status: 'ok', value } });
        }
      }
    }
  }
}
```

`resolvers.execute` runs the actual sub-tool (a DB write, an API call, or a `genty-core` agent task with `customTools`); `resolvers.approve` routes a breakpoint to the human channel.

## 4. Component 2 — kradle `VoiceCall` CRD

Clone the existing `JitsiMeeting` CRD + controller (`packages/kradle/core/src/jitsi-meeting-controller.js`). It owns per-call session lifecycle, correlation, and (optionally) join credentials for the LiveKit room.

```yaml
apiVersion: kradle.a5c.ai/v1
kind: VoiceCall
spec:
  channel: webrtc | sip            # transport
  direction: inbound | outbound
  peer: { e164?: "+1...", roomId?: "..." }   # phone or WebRTC room
  agent: { model, systemPrompt, governedTools: [issue_refund, ...] }
  ttlSeconds: 3600
status:
  phase: Pending | Ringing | Active | Completed | Failed
  livekitRoom: "..."               # bound LiveKit room
  governanceRuns:                  # correlation: every governed run spawned this call
    - { tool: issue_refund, runId: 01..., phase: waiting-approval }
  transcriptRef: "..."
  startedAt / endedAt
```

Controller responsibilities: admit the call, (for SIP) coordinate with the LiveKit SIP trunk/dispatch, mint any room JWT (reuse `signJwt`), track `governanceRuns` status by watching babysitter run journals, enforce TTL, and reconcile terminal cleanup. This makes every governed decision in a call queryable as control-plane state + a replayable journal.

## 5. Component 3 — telephony channels backend (inbound spawn)

A new backend in `channels-adapter`'s poller/relay/spawner pipeline (the pattern in `spawner.ts:148,383`). An inbound call event (from the LiveKit SIP dispatch webhook / trunk) becomes a surviving channel event → `SessionSpawner.spawn` launches **one bounded per-call agent session**, self-associating the voice-bridge MCP server (so the spawned agent has the governed tools) and a `reply_to`-style back-channel keyed to the `voiceCallId`. Bounded concurrency + error isolation come for free from the existing spawner. (Outbound calls are initiated via the `VoiceCall` CRD + LiveKit SIP outbound API.)

## 6. Governed-tool process skeleton (babysitter)

`processes/governedToolProcess.ts` — the `process(inputs, ctx)` that governs one tool's workflow. **Must be deterministic across replay** (no wall-clock/random branching; non-deterministic results enter only as effect results).

```ts
import { defineTask } from '@a5c-ai/babysitter-sdk';

const verifyIdentity = defineTask('verify-identity', (a, t) => ({ kind: 'agent', /* genty agent */ ... }));
const checkPolicy    = defineTask('check-policy',    (a, t) => ({ kind: 'agent', ... }));
const executeRefund  = defineTask('execute-refund',  (a, t) => ({ kind: 'agent', ... }));

export async function process(inputs, ctx) {
  const { acct, amount } = inputs;

  // 1. multi-step decomposition + early validation (cheap effects first)
  const who = await ctx.task(verifyIdentity, { acct });
  if (!who.verified) return { status: 'denied', reason: 'identity-unverified' };

  // 2. policy: PolicyEngine also gates dispatch automatically; this is the explicit business check
  const policy = await ctx.task(checkPolicy, { acct, amount, who });
  if (!policy.allowed) return { status: 'denied', reason: policy.reason };

  // 3. HITL gate — breakpointId prefix drives the posture. `auth.`/`destroy.` force OWNER approval
  //    and cannot auto-approve. Threshold chosen by business rule, evaluated as a deterministic input.
  if (amount >= inputs.approvalThreshold) {
    const ok = await ctx.breakpoint({
      breakpointId: 'auth.refund-over-threshold',
      title: `Approve $${amount} refund for ${acct}?`,
      expert: 'owner', tags: ['voice-call', `call:${inputs.voiceCallId}`],
    });
    if (!ok.approved) return { status: 'denied', reason: 'approval-rejected', response: ok.response };
  }

  // 4. irreversible execution (LiveKit side pairs this with disallow_interruptions())
  const receipt = await ctx.task(executeRefund, { acct, amount, approvedBy: 'owner' });
  return { status: 'done', receipt };  // journal = replayable audit trail of every step above
}
```

The journal of this run is the per-decision audit record the cascaded pipeline's text trail feeds; `auth.`/`destroy.` breakpoints guarantee a human gate on sensitive actions; `PolicyEngine` can hard-deny any sub-effect.

## 7. End-to-end sequence (async governed tool with approval)

```
caller speaks ── LiveKit STT ── LLM decides issue_refund($400)
   └─ MCP tools/call → voice-bridge: validate → createRun(governedToolProcess, {acct,$400})
        → return {correlationId, filler:"one moment…"}  (LiveKit speaks filler, convo continues)
   runDriver: iterate → verifyIdentity → checkPolicy → breakpoint(auth.refund-over-threshold)
        → VoiceCall.status.governanceRuns[*].phase = waiting-approval
        → resolvers.approve routes to supervisor (DTMF/console/human-agent)
        → commitEffectResult(approved) → iterate → executeRefund → completed
   callback → inject tool result into LiveKit session → agent: "Done, $400 refunded."
```

If approval is slow, the agent fills naturally ("still waiting on a supervisor…"); the audio path never blocked on a babysitter fsync/iterate.

## 8. Latency-budget rules (non-negotiable)

- Governed tools are **`async` by default**; only provably-fast workflows use `sync`.
- A pre-`createRun` `inputSchema` validation is the only synchronous work on the MCP call path.
- No babysitter `orchestrateIteration`/`commitEffectResult` ever runs inside a turn — always in `runDriver` off the hot path.
- Filler speech + `ToolFlag.CANCELLABLE` cover the governance round-trip; `disallow_interruptions()`/`wait_for_playout()` wrap only the irreversible execute step (heed issue #4560 — re-assert per step).

## 9. Open implementation questions

1. **Callback transport:** MCP notification/SSE vs an agent-polled `check_status` tool vs a LiveKit data-channel message — which gives the lowest-friction "result is ready" injection? (Prototype both.)
2. **Breakpoint→human routing in-call:** DTMF capture, a supervisor console, or warm-transfer to a human agent who approves — needs a concrete `resolvers.approve` implementation per channel.
3. **Babysitter latency envelope:** micro-benchmark `create→iterate→commit→iterate` on target disk to set the `sync`-eligible threshold and typical governed-tool wall-clock.
4. **Run/session GC:** TTL + terminal-cleanup reconciliation in the `VoiceCall` controller; orphaned-run sweeping.
5. **genty-as-sub-executor vs direct effect resolvers:** when a governed sub-task is itself agentic, run it via `genty-core` (`customTools`) vs a plain function — pick per tool.
6. **Multi-tool calls in one turn:** ordering/locking when the LLM emits several governed tool calls at once (babysitter runs are per-tool; the `VoiceCall` correlates them).
