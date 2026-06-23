# `@a5c-ai/voice-adapter` — media-governance bridge (draft spec, **audio + video/avatar**)

> **Status:** Draft design spec for a **proposed, not-yet-built** package. Companion to [`realtime-voice-agent-stack.md`](./realtime-voice-agent-stack.md) (architecture, incl. Part II video) and [`realtime-agent-gaps.md`](./realtime-agent-gaps.md) (gap register).
> **Date:** 2026-06-23.
> **One-liner:** the thin TypeScript bridge that lets a realtime media agent call **babysitter-governed tools** over MCP — now covering both the voice path **and** the animated-avatar **video** path on kradle/Jitsi: cosmetic animation runs on a realtime fast path, while consequential visual actions (canvas content, screen-share/VNC, external video metadata) are gated exactly like any sensitive tool, with a replayable audit journal — all out of the audio/animation hot path.
> **Reconciled with kradle reality (Appendix E of the architecture doc):** kradle ALREADY has the session/identity CRDs (`AgentStack.jitsiConfig`, `JitsiMeeting`, `AgentAppearance`/`AgentVoiceProfile`) and the dispatch→sidecar wiring. **§4 below now EXTENDS those existing CRDs rather than minting a parallel `VoiceCall`** (an earlier draft of this spec proposed a new CRD before the code map; superseded).

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

## 4. Component 2 — kradle CRD extensions (EXTEND existing, don't invent)

The code map (Appendix E of the architecture doc) shows kradle already has the session/identity CRDs. We **extend** them — no parallel `VoiceCall` kind.

**(a) `AgentStack.spec.jitsiConfig` — add the video capability** (validated in `agent-stack-controller.js:223-257`):
```yaml
spec:
  jitsiCapability: true
  jitsiMeetingProviderRef: { name: ... }
  jitsiConfig:
    role: agent
    participantName: "Aria"
    capabilities:
      audio: publish          # existing
      video: publish          # NEW — gates the avatar/video media plane
    avatarRef: { name: aria-appearance }      # NEW — points at an AgentAppearance
    tools: [send_chat, speak, set_expression, set_posture, play_gesture,    # NEW video tools
            look_at, set_view, draw_canvas, share_surface, send_video_metadata]
    governedTools: [draw_canvas, share_surface, send_video_metadata]        # NEW — which visual tools are babysitter-gated
```
`JitsiCapabilityReady` validation extends to: video role may publish, `avatarRef` resolves, `governedTools ⊆ tools`.

**(b) `AgentAppearance` — add the avatar model** (`resource-model.js:36`; today “avatar generation settings” only):
```yaml
spec:
  organizationRef: ...
  renderer: talkinghead          # talkinghead | live2d
  avatarModelUrl: "https://…/aria.glb"     # Ready Player Me GLB (own-licensed)
  visemeSet: oculus              # oculus | arkit
  defaultMood: neutral
  defaultView: upper
```
Pair with the existing `AgentVoiceProfile` (TTS provider/voice). **Critical wiring gap (G10):** both are resolved into dispatch identity (`agent-dispatch-controller.js:303-309`) but never reach the sidecar — thread them through `prepareMeetingContext` (`jitsi-agent-bridge.js:62-99`) → `meetingContext` → `createJitsiSidecarContainer` env (`adapters-client.js:94-118`).

**(c) `JitsiMeeting.status` — add media/session tracking** (`jitsi-meeting-controller.js:156-174` tracks only `recording.*`):
```yaml
status:
  media:        { agentTracks: [{ participant, audio: true, video: true, screenshare: false }] }
  transcript:   { live: true, ref: "..." }
  session:      { agents: [{ stackRef, jobRef, phase }] }
  governanceRuns: [{ tool: draw_canvas, runId: 01…, phase: waiting-approval }]   # correlation to babysitter runs
```
The meeting controller watches babysitter run journals (via this bridge) to populate `governanceRuns`, making every gated visual/tool decision queryable as control-plane state + a replayable journal.

## 5. Component 3 — inbound spawn (two paths)

- **kradle-native (today's path):** an inbound meeting/call → `JitsiMeeting` + `dispatchAutoJoinAgents` / manual dispatch (`jitsi-meeting-controller.js:190-219`, `agent-dispatch-controller.js`) → `createAgentJob` attaches the sidecar (`adapters-client.js:496-498`). Primary flow, already exists; we ride it.
- **channels-adapter (telephony/SIP):** for PSTN inbound, a new "telephony" backend in `channels-adapter`'s poller/relay/spawner (`spawner.ts:148,383`) maps an inbound-call event → `SessionSpawner.spawn` (bounded concurrency + reply back-channel), which requests a kradle dispatch into the room. Outbound calls are initiated via the meeting controller + SIP gateway.

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

## 8A. Avatar control protocol + the two lanes (video)

The agent controls the character with tool calls mapped onto the renderer (TalkingHead.js) vocabulary. They split by latency/consequence:

| Lane | Tools | Path | Governed? |
|---|---|---|---|
| **Realtime fast path** (must sync to speech, sub-100ms) | `speak` (visemes internal), `set_expression(mood)`, `set_posture`/`play_gesture`, `look_at`, `set_view` | MCP → **G0 socket → sidecar renderer** directly | no (cosmetic, reversible) — light audit only |
| **Governed async path** (shows content / shares desktop / emits data) | `draw_canvas` (content), `share_surface`/`share_vnc`, `send_video_metadata` to external sinks | MCP **async tool → babysitter run** (filler) → on approval → socket → sidecar | yes — policy + `auth.`/`destroy.` breakpoints + journal |

MCP tool surface to add (consumed by the G0 socket-writer; see gaps G16): `kradle_speak`, `kradle_set_expression`, `kradle_set_posture`, `kradle_play_gesture`, `kradle_look_at`, `kradle_set_view` (fast); `kradle_draw_canvas`, `kradle_share_surface`, `kradle_send_video_metadata` (governed). Visemes are **never** a tool — they're driven internally from the TTS clock (architecture doc §II.2).

A governed *visual* process mirrors §6, e.g. `share_surface` → `ctx.task(resolveTarget)` → `ctx.breakpoint('auth.screen-share')` (owner) → `ctx.task(startVnc)`; or `draw_canvas` with externally-visible content → `ctx.task(contentPolicyCheck)` → optional breakpoint → emit draw commands.

## 8B. Sidecar media plane the bridge drives (kradle `jitsi-agent-sidecar`)

The bridge's fast-path and approved governed commands land as IPC actions on the sidecar. Required sidecar work (gaps G0–G8):
- **G0 (load-bearing):** build the **agent↔sidecar socket client** — today MCP tools only return a `{socketPath,command}` descriptor and nothing writes it to `/tmp/jitsi-agent.sock` (`mcp-server.js:709-733`); without this *no* command (even chat) reaches the sidecar.
- **Render + publish:** inject a TalkingHead canvas in the headless page; `canvas.captureStream()` → publish via lib-jitsi-meet `setEffect` (video); TTS → Web-Audio graph → `captureStream()` (audio) on the same clock (lipsync). Replace the `--use-fake-device` placeholder and the `audio.js` stubs.
- **New IPC actions:** extend `SUPPORTED_ACTIONS` (`ipc-server.js:4-14`) + `handleCommand` (`runtime.js:73-102`) with `set_expression`, `set_posture`, `play_gesture`, `look_at`, `set_view`, `draw_canvas`, `start_screenshare`, `send_video_metadata`; emit inbound `chat` events (`runtime.js:58-71`).
- **Screen-share:** replace `window.open` (`puppeteer-jitsi-client.js:63-65`) with noVNC-canvas compositing or `getDisplayMedia` → screen track.

## 8C. Full user flow (create stack → agent → call → interact by text AND video)

1. **Create an AgentStack** in the kradle web **stack-builder** (gap G14 adds the "Meeting / Video" section): toggle modalities (text / voice / video), pick the avatar (`AgentAppearance`) + voice (`AgentVoiceProfile`) + the governed tool set; writes `jitsiCapability` + `jitsiConfig.capabilities.video` + `avatarRef`. Reconciled by `agent-stack-controller.js` → `JitsiCapabilityReady`.
2. **Create an Agent** (persona) bound to the stack (MCP `kradle_create_agent` or the identity pages → `AgentPersona`+`AgentDefinition` (+`AgentAppearance`/`AgentVoiceProfile`)).
3. **Call it** — create a `JitsiMeeting`; dispatch attaches the sidecar Job (`createAgentJob`), the headless browser joins as the avatar and (with the media plane built) publishes A/V tracks. The kradle web meeting page already renders the agent's track as a participant tile (`jitsi-embedded-meeting.jsx`) — no new video component needed.
4. **Interact** — the user joins via the web meeting UI and talks/types. The agent responds with **voice + lipsynced mouth + expressions/posture** on the **fast path**, and can **draw on the canvas / screen-share / send video metadata** via the **governed path** (filler speech while babysitter gates the action). Text chat works both ways (human via the iframe chat; agent via `send_chat` once G0 lands). Video is active **only if the stack declares `capabilities.video`** — otherwise the same agent is a text/voice participant.

## 9. Open implementation questions

1. **Callback transport:** MCP notification/SSE vs an agent-polled `check_status` tool vs a LiveKit/Jitsi data-channel message — which gives the lowest-friction "result is ready" injection? (Prototype both.)
2. **Breakpoint→human routing in-call:** DTMF capture, a supervisor console, or warm-transfer to a human agent who approves — needs a concrete `resolvers.approve` implementation per channel.
3. **Babysitter latency envelope:** micro-benchmark `create→iterate→commit→iterate` on target disk to set the `sync`-eligible threshold and typical governed-tool wall-clock.
4. **Run/session GC:** TTL + terminal-cleanup reconciliation in the `JitsiMeeting` controller; orphaned-run sweeping; tearing down the sidecar Job + babysitter runs when the meeting ends.
5. **genty-as-sub-executor vs direct effect resolvers:** when a governed sub-task is itself agentic, run it via `genty-core` (`customTools`) vs a plain function — pick per tool.
6. **Multi-tool calls in one turn:** ordering/locking when the LLM emits several governed tool calls at once (babysitter runs are per-tool; `JitsiMeeting.status.governanceRuns` correlates them).
7. **Fast-path vs governed boundary:** is `draw_canvas` cosmetic (fast) or content (governed)? Likely per-call classification (e.g. ephemeral cursor vs persistent rendered text) — needs a crisp rule so animation never accidentally blocks on governance.
8. **A/V sync under load:** measure viseme-vs-audio drift on the real sidecar GPU host (architecture doc §II risk X1) before committing to the same-page-audio-clock approach at scale.
