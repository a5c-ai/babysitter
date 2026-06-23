# Realtime Voice **+ Video / Animated-Avatar** Agent Stack — with babysitter as the inner governance layer

> **Status:** Research + architecture report (no code yet). Originally a voice-only design (Parts 0–6); **extended to a realtime animated-avatar VIDEO harness on kradle/Jitsi in Part II** (lipsync, tool-driven expression/posture/canvas/screen-share, video published into meetings).
> **Date:** 2026-06-23.
> **Scope (locked with requester):** open-core (managed STT/TTS/LLM acceptable) · WebRTC **+** telephony (SIP/PSTN) · **+ realtime video: an animated character with voice-synced mouth/expression/posture, an HTML canvas it can draw on, screen-share (VNC), and arbitrary video metadata — fully usable through kradle meetings (CRD + UX + full create-stack→agent→call flow)** · deliverable = research + architecture report · primary use case = **task/tool agent**.
> **Method:** five research streams — (A) babysitter-SDK governance-fit, (B) reusable in-repo infra, (C) online voice landscape (deep-research, 28 sources→25 verified), plus for Part II: (D) the online avatar/video-subsystem landscape and (E) the kradle media/CRD/UX code map. Raw streams are reproduced in the appendices.
> **Gaps:** the consolidated, dependency-ordered gap register lives in [`realtime-agent-gaps.md`](./realtime-agent-gaps.md); the bridge/CRD/UX spec in [`voice-governance-bridge-spec.md`](./voice-governance-bridge-spec.md).

---

## 0. Bottom line

Build the realtime audio path on **LiveKit Agents** (Apache-2.0, fully self-hostable including its WebRTC media server *and* a dedicated SIP bridge) running the **cascaded VAD→STT→LLM→TTS pipeline** — **not** speech-to-speech, because a tool/compliance agent needs the text audit trail at every stage. Reuse the babysitter monorepo for the **non-audio half** (genty as the streaming tool-brain, `transport-adapter` as the multi-provider + observability LLM gateway, kradle as the session control plane, the channels-adapter spawn pattern for inbound calls). Plug babysitter in as **governance behind an async MCP tool boundary — never inside the audio turn** — using LiveKit's native MCP support + async/background tools so the agent speaks filler while the deterministic, replayable governance run executes out-of-band.

The design hinges on one hard, code-verified fact: **babysitter is a fsync-per-step, lock-serialized, replay-by-re-execution orchestrator. It physically cannot sit in a sub-second turn.** So it governs the *workflow behind a tool call*, not the conversation.

**For video (Part II):** keep the realtime media in the existing **kradle headless-Chromium Jitsi sidecar** — render the avatar (TalkingHead.js / Ready Player Me + Three.js) into an HTML `<canvas>`, `captureStream()` it as the agent's **video track**, publish TTS through a same-page Web Audio graph as the **audio track**, and drive mouth visemes off the same audio clock. Cosmetic animation (mouth, expression, posture, gaze) is a **realtime fast path** straight to the renderer; **consequential** visual tool calls (writing content to the canvas, starting screen-share/VNC, emitting external video metadata) route through the same async babysitter governance boundary as any other sensitive tool. The whole capability is declared on the **AgentStack CRD**, bound to an **AgentAppearance/AgentVoiceProfile** identity, and exercised through the **create-stack → create-agent → call → interact (text + video)** flow in kradle/web.

---

## 1. Recommended open-core stack, by layer

| Layer | Recommendation (open-core) | Self-host alternative | Reuse from this monorepo |
|---|---|---|---|
| **Media transport (WebRTC + SIP/PSTN)** | **LiveKit server** (Go/Pion, Apache-2.0) + **`livekit/sip`** bridge — one stack covers web + phone, DTMF/REFER/transfers | — | — (absent in repo) |
| **VAD + turn-taking / interruption** | LiveKit **Turn Detector v1.0** (audio+text semantics) + Silero VAD | — | — (only Jitsi `audio.js` stub) |
| **STT/ASR** | Deepgram (managed, low-latency) | faster-whisper / AssemblyAI | — |
| **LLM brain + tool-calling + streaming** | LiveKit LLM node → pointed at **`@a5c-ai/transport-adapter`** (OpenAI-compatible proxy) | any OpenAI-compatible endpoint | ✅ **adapters/transport** (multi-provider + cost/usage observability); ✅ **genty-core** (token streaming + native tool loop) |
| **TTS** | Cartesia / ElevenLabs (managed, ~sub-150ms) | Kokoro / Piper | ✅ genty `text_delta` stream feeds an early-start TTS |
| **S2S vs cascaded** | **Cascaded** — full text audit trail at every stage (S2S ~200-300ms but "requires additional tooling for auditability") | — | — |
| **Session / control plane** | **kradle** `VoiceCall` CRD (model on the existing `JitsiMeeting` CRD + JWT minting + reconcilers) | — | ✅ **kradle** control-plane |
| **Inbound-call → session spawn** | channels-adapter **SessionSpawner** pattern (bounded concurrency + reply back-channel) → a new "telephony" backend | — | ✅ **channels-adapter** |
| **Observability / governance** | LiveKit/Pipecat OpenTelemetry (observe) **+ babysitter journal (gate + replay)** | — | ✅ **babysitter journal**, gateway observer UI |

**Latency reality check:** streaming cascaded ≈ **400–800ms** voice-to-voice (LiveKit's "conversational band" 300–600ms); "<300ms feels human, 300–600ms acceptable." *All latency numbers are LiveKit-vendor-stated/illustrative — treat as order-of-magnitude, corroborated directionally by Hamming AI.*

---

## 2. Framework landscape (honest scope)

The deep-research stream **independently verified LiveKit Agents and Pipecat** as the two serious self-hostable open orchestrators. **Claims about Vapi / Retell / Bland / Ultravox / Vocode / OpenAI-Realtime did not survive verification**, so they are not asserted here (Vapi/Retell/Bland are managed/closed; OpenAI Realtime is an S2S API, not a self-hostable orchestrator). The comparison below is therefore a deep LiveKit-vs-Pipecat comparison plus the cascaded-vs-S2S axis, not the full 10-framework table originally requested — see Appendix C "open questions".

| | **LiveKit Agents** ✅ recommended | **Pipecat** (strong alternative) |
|---|---|---|
| License / self-host | Apache-2.0; entire stack incl. WebRTC media server | BSD; Python pipeline, self-host |
| Transport | WebRTC **+ dedicated SIP bridge** (one stack) | WebRTC/WS; SIP via Daily/Twilio |
| STT/TTS/LLM | Pluggable, mix-and-match (Deepgram, Cartesia, ElevenLabs, OpenAI, Google…) | Same pluggable model |
| Tool seam | `@function_tool` body **+ native one-line MCP** | `FunctionCallParams.result_callback` |
| Async/background tools | `ToolFlag.CANCELLABLE` (Python) — agent keeps talking | `cancel_on_interruption=False` + streaming `is_final=False` updates |
| Irreversible-action guards | `disallow_interruptions()`, `wait_for_playout()` | `wait_for_next_tts_to_finish()` |
| Governance | tool-body + MCP config; OTel observe-only | tool-body; OTel observe-only |

**Why LiveKit for this use case:** the combined **WebRTC + SIP in one Apache-2.0 self-hostable stack** plus **native MCP** is the cleanest possible seam to babysitter — babysitter/genty already speak MCP, so a governed tool becomes a one-line `mcp_servers=[...]` entry. Pipecat's `result_callback` interception is arguably more granular if a Python pipeline is preferred; the architecture below works with either.

---

## 3. The babysitter-as-inner-governance architecture (the hard part)

### 3.1 The impedance mismatch, stated plainly

babysitter reloads the full journal + re-executes the whole process function + fsyncs (file **and** directory) **per effect**, under an exclusive `O_EXCL` run lock, advancing only on thrown `EffectRequestedError`/`EffectPendingError` exceptions. That is tens of milliseconds of pure I/O floor, growing **O(n)** in the number of prior effects — appropriate for a **2–30s governed workflow**, fatal for a 200ms turn. (Full code evidence in Appendix A §2.) The rule is therefore absolute: **babysitter never touches the audio/token hot path.** It governs the *workflow behind a tool call*.

### 3.2 The seam: an async MCP tool

The conversational LLM (hot path) decides *"issue a $400 refund."* Instead of executing inline, the tool is an **async/CANCELLABLE MCP tool** whose handler drives an out-of-band babysitter run:

```
┌─────────────────────── HOT PATH (LiveKit, ~400–800ms) ───────────────────────┐
│  mic → VAD/TurnDetector → STT(Deepgram) → LLM(via transport-adapter) → TTS    │
│                                   │ tool call: refund(acct, $400)              │
│                                   ▼  (async / ToolFlag.CANCELLABLE MCP tool)   │
│   agent immediately speaks filler: "Let me take care of that, one moment…"    │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                     │ (returns control instantly; no block)
                ┌────────────────────▼─────────────────────────────────┐
                │   GOVERNANCE (babysitter run, out-of-band, seconds)    │
                │   createRun → orchestrateIteration → commitEffectResult │
                │   process(): decompose + govern the refund workflow:    │
                │     ctx.task(verifyIdentity)                            │
                │     ctx.task(checkPolicy)            ← PolicyEngine deny │
                │     ctx.breakpoint('auth.refund-over-250')  ← owner gate│
                │     ctx.task(executeRefund)          ← genty-core agent  │
                │   → append-only, checksummed, REPLAYABLE journal        │
                └────────────────────┬─────────────────────────────────┘
                                     │ terminal result / approval needed
                                     ▼  callback → inject tool result into session
                 agent speaks: "Done — $400 refunded"  OR  "I need a supervisor…"
```

### 3.3 Four governance properties this buys (all verified as fitting babysitter's model)

1. **Multi-step task decomposition** — `ctx.task` / `ctx.parallel` model "verify → check → execute" as governed steps (Appendix A §1, §5a).
2. **Policy enforcement** — the `PolicyEngine` evaluates every effect dispatch and can *deny* it before execution (Appendix A §5a).
3. **Human-in-the-loop approval gates** — `ctx.breakpoint` with **postures derived from the breakpointId prefix**: `destroy.*` / `auth.*` have `allowAutoApprove:false` and force an **owner-level** human approval (Appendix A §4). Mid-call this surfaces as *"I need a supervisor to approve that, staying on the line"*; the approval (DTMF / console / routed human agent) is posted as the `BreakpointResult` and the run resumes. Pair with LiveKit `disallow_interruptions()` on the irreversible execute step.
4. **Auditability / replay** — the journal is an append-only, checksummed record of every decision, input, and result; a crashed governance run resumes from it. This is exactly the audit trail the cascaded pipeline's text visibility is meant to feed.

### 3.4 Embedding mechanics (no subprocess)

Drive babysitter **in-process** via `createRun` → `orchestrateIteration` → `commitEffectResult` — the same loop genty already runs in `runInternalOrchestrationPhase` (Appendix A §3). The MCP tool handler owns the loop and **resolves sub-effects in the host** (genty's hard-won lesson: don't make the LLM drive the iterate/post protocol; the host executes effects). Governance round-trip latency is hidden behind filler speech + async tools, so the audio path never blocks.

---

## 4. What to adapt / reuse / create

- **REUSE (external):** LiveKit Agents + `livekit/sip` (media, VAD, turn-taking, the conversational tool loop) + managed Deepgram / Cartesia.
- **REUSE (in-repo):** `transport-adapter` as LiveKit's OpenAI-compatible LLM endpoint (multi-provider + cost/usage for free); `genty-core` as the agent that executes governed sub-tasks (streaming, tool-calling); `kradle` for a `VoiceCall` session CRD (clone the `JitsiMeeting` controller); `channels-adapter`'s SessionSpawner + reply-token pattern for inbound-call→session spawning; the babysitter **journal** as the governance audit/replay store.
- **CREATE (the thin new piece):** a **voice-governance bridge** — most naturally a new sibling `packages/adapters/voice` — that ships (a) an **MCP server exposing governed tools**, each backed by an in-process babysitter run; (b) a **kradle `VoiceCall` CRD + controller**; (c) a **telephony/WebRTC channels backend** for inbound-call spawning. LiveKit (Python) connects to it over MCP; everything governance-side stays in the existing TypeScript monorepo. Full draft in [`voice-governance-bridge-spec.md`](./voice-governance-bridge-spec.md).

This is the smallest new surface that makes the existing assets click together.

---

## 5. Risks & open questions

- **Latency budget for HITL:** the overhead a synchronous governance/approval round-trip adds — and how much filler speech can hide before users perceive lag — is unquantified. Async tools mitigate; real human approval is inherently seconds-to-minutes and must be an async gate, not a blocked turn.
- **`disallow_interruptions()` across multi-step tools:** LiveKit issue #4560 — it ties to the current `SpeechHandle`, not guaranteed across an entire multi-step execution. Don't over-trust it for end-to-end protection of a gated irreversible workflow.
- **Babysitter latency is inferred, not benchmarked** (from the fsync/lock/replay structure). Before committing, micro-benchmark a `createRun→iterate→commit→iterate` cycle on the target disk to size the governed-workflow latency envelope.
- **Async tools are opt-in & partly Python-only** (LiveKit); for S2S LLMs Pipecat drops intermediate streamed updates — another reason to stay cascaded.
- **Unverified contenders:** Vapi / Retell / Bland / Ultravox / Vocode / OpenAI-Realtime were not independently verified; if a managed platform is on the table, that comparison is still open.

---

## 6. Sources (primary where it matters)

LiveKit: [agents repo](https://github.com/livekit/agents) · [tools docs](https://docs.livekit.io/agents/logic/tools/) · [async tools](https://docs.livekit.io/agents/logic/tools/async.md) · [SIP bridge](https://github.com/livekit/sip) · [telephony](https://docs.livekit.io/telephony) · [sequential pipeline blog](https://livekit.com/blog/sequential-pipeline-architecture-voice-agents) · [human-in-the-loop](https://livekit.com/blog/human-in-the-loop-voice-agents) · [guardrails observer pattern](https://livekit.com/blog/observer-pattern-voice-agent-guardrails) · [agents releases (Turn Detector v1.0)](https://github.com/livekit/agents/releases).
Pipecat: [function-calling docs](https://docs.pipecat.ai/pipecat/learn/function-calling) · [llm_service API](https://reference-server.pipecat.ai/en/stable/api/pipecat.services.llm_service.html) · [OpenTelemetry](https://docs.pipecat.ai/server/utilities/opentelemetry) · [TTS/tool ordering issue #1842](https://github.com/pipecat-ai/pipecat/issues/1842).
External governance pattern: [webrtc.ventures — Twilio+Pipecat+LangGraph policy guardrails](https://webrtc.ventures/2026/01/building-a-voice-ai-agent-with-policy-guardrails-using-twilio-pipecat-and-langgraph).
Latency corroboration: [Hamming AI voice latency](https://hamming.ai/resources/voice-ai-latency).
In-repo (see appendices for line cites): genty `packages/genty/core/src/session.ts`; transport `packages/adapters/transport/src/server.ts`; kradle `packages/kradle/core/src/control-plane.js`; channels `packages/adapters/channels/src/spawner.ts`; babysitter `packages/babysitter-sdk/src/runtime/orchestrateIteration.ts`, `.../breakpoints/evaluator.ts`.

---
---

# Part II — Realtime video / animated-avatar harness (kradle)

> Extends Parts 0–6 from voice to a **talking animated character** published into a kradle/Jitsi meeting, with tool-driven expression/posture, an HTML canvas it draws on, screen-share (VNC), and arbitrary video metadata. Grounded in Appendix D (avatar/video tech) + Appendix E (kradle code map).

## II.1 The keystone — render inside the existing headless-Chromium Jitsi sidecar

kradle already dispatches a meeting agent as a K8s Job with a **headless-Chromium Jitsi participant sidecar** (`packages/kradle/jitsi-agent-sidecar`) that joins via `window.APP.conference`. Today it publishes only Chrome's **fake spinning-ball video + beep** (`--use-fake-device-for-media-stream`) and its audio is a stub. That headless browser is exactly the right place to render an avatar: a real DOM/WebGL page is available, so the natural pattern is **render → `canvas.captureStream()` → publish as the agent's camera track** — no new media server, no extra hop. **We extend the sidecar; we do not replace the media path.**

> **Load-bearing precondition (gap G0):** the agent's MCP meeting tools currently only *return a descriptor* `{socketPath, command}` and **nothing writes it to the sidecar's Unix socket at runtime** — so even text chat and `speak_tts` never reach the sidecar. The agent↔sidecar socket-client must be built first; every video capability rides on it. See [`realtime-agent-gaps.md`](./realtime-agent-gaps.md) §1.

## II.2 Media pipeline (and the A/V-sync fix)

```
headless Chromium page (sidecar)
  ├─ Renderer: TalkingHead.js (Ready Player Me GLB on Three.js) → WebGL canvas
  ├─ Compositor: one output <canvas>, per-frame drawImage() of
  │     [avatar WebGL canvas] + [annotation 2D overlay] + [noVNC/screen layer]
  │        → canvas.captureStream(fps)  ──► VIDEO track  (lib-jitsi-meet setEffect, the JitsiStreamPresenterEffect pattern)
  └─ Audio: TTS → AudioBuffer → Web Audio graph → MediaStreamAudioDestinationNode.captureStream()
           → AUDIO track (published in the SAME conference)
                 ▲
   Lipsync: Azure VisemeReceived (viseme ids + tick offsets) OR ElevenLabs char-timestamps
            → schedule mouth/jaw morphs against AudioContext.currentTime  (RMS-envelope fallback)
```

**The single hardest problem is cross-track A/V drift.** Audio and the canvas video are *separate* WebRTC tracks; receivers don't lip-sync-align them beyond RTCP. The fix (Appendix D): **play TTS through a Web Audio graph in the same page, publish *that* as the audio track, and drive visemes off `AudioContext.currentTime`** — one page, one audio clock → bounded drift. Publishing audio from a different process is what visibly desyncs.

## II.3 Avatar control protocol — the fast-path vs governed split

The agent controls the character with tool calls that map onto the renderer's command vocabulary (TalkingHead.js API): `speak`, `setExpression(mood)`, `setPosture`/`playGesture`, `lookAt`, `setView`, `drawCanvas`, `showScreen/shareVNC`, `sendVideoMetadata`. These split into two lanes by latency and consequence:

| Lane | Tool calls | Path | Governance |
|---|---|---|---|
| **Realtime fast path** (sub-100ms, must sync to speech) | mouth/visemes, `setExpression`, `setPosture`/`playGesture`, `lookAt`, `setView` | agent → MCP → **G0 socket → sidecar renderer** directly | none / lightweight audit only — cosmetic, reversible, must not block on fsync |
| **Governed (async) path** (consequential/irreversible) | `drawCanvas` *content*, `showScreen`/`shareVNC` start, `sendVideoMetadata` to external sinks | agent → **async MCP tool → babysitter run** (filler speech) → on approval, socket → sidecar | babysitter policy + `auth.`/`destroy.` breakpoint gates + replayable journal |

This is the same hot-path-vs-governance rule from Part I, now applied to the *visual* channel: animation is reflexive and stays on the fast path; anything that **shows content, shares a desktop, or emits data outward** is gated exactly like a sensitive tool. (Detail + the control protocol live in [`voice-governance-bridge-spec.md`](./voice-governance-bridge-spec.md).)

## II.4 Canvas, screen-share/VNC, video metadata

- **HTML canvas the agent draws on:** an annotation 2D-canvas layer composited into the output canvas (so it's part of the published video). Draw commands arrive via `drawCanvas` (governed when they render content).
- **Screen-share / view-VNC:** **noVNC** (RFB over WebSocket via websockify) renders a desktop onto a canvas → composited as a layer; the agent can both *show* and *operate* the desktop. Governed start/stop.
- **Arbitrary video metadata:** a control channel (Jitsi endpoint messages / data channel) carries whatever extra the character supports (name tags, lower-thirds, emotion telemetry); governed when it leaves the meeting.

## II.5 kradle integration (CRD → identity → call → UX)

The control plane is **already real** (Appendix E): `AgentStack` CRD with `jitsiCapability`/`jitsiConfig`, `AgentAppearance`("avatar generation settings") + `AgentVoiceProfile` identity, full `JitsiMeeting` lifecycle, dispatch→sidecar-Job wiring, and an External-API iframe that **already renders the agent's published track as a participant tile** (so no new web video component is needed). The deltas to make it video-capable — `jitsiConfig.capabilities.video:'publish'` + `avatarRef`, threading appearance/voice into the sidecar env, `JitsiMeeting.status.media`, the stack-builder “Meeting/Video” section, and the video MCP tools — are specified in [`voice-governance-bridge-spec.md`](./voice-governance-bridge-spec.md) and tracked in [`realtime-agent-gaps.md`](./realtime-agent-gaps.md) §3–4. **User flow:** create an AgentStack (toggle text/voice/video, pick avatar+voice+governed tools) → create an Agent (persona bound to the stack) → call it (a `JitsiMeeting` is created, the sidecar joins as the avatar, publishes A/V) → interact by **text** (chat) **and video** (the character speaks with lipsync, emotes, draws on canvas, shares a screen) — video only if the stack declares the capability.

## II.6 Recommended video stack (open-core, browser-canvas-in-sidecar)

| Subsystem | Choice | Notes |
|---|---|---|
| Renderer | **TalkingHead.js** (RPM GLB + Three.js) in headless Chromium (`--headless=new`, real GPU) | richest ready-made control API; ship own-licensed avatar (sample is CC BY-NC) |
| Lipsync | **Azure `VisemeReceived`** (or ElevenLabs char-timestamps) → morphs on `AudioContext.currentTime` | same-page audio clock; RMS-envelope fallback |
| Video publish | `canvas.captureStream()` → lib-jitsi-meet **`setEffect`** | the `JitsiStreamPresenterEffect` pattern; pin a known-good LJM version |
| Screen/desktop | **noVNC** + websockify, composited layer | also lets the agent operate the desktop |
| Media server | existing **Jitsi** (sidecar+CRDs already target it) | LiveKit is the Part-I alternative |
| (optional) hi-fi face | **NVIDIA Audio2Face-3D** (MIT SDK, audio→blendshapes) | GPU + gRPC hop; still needs the Three.js renderer |

## II.7 Video risks

All in [`realtime-agent-gaps.md`](./realtime-agent-gaps.md) §6: A/V sync drift (X1), headless WebGL+WebRTC GPU quirks (X2), GPU cost-per-bot (X3), lipsync retarget accuracy (X4), governance latency budget (X5), lib-jitsi-meet `setEffect`/`replaceTrack` reliability (X6), noVNC throughput (X7), and licensing landmines — Cubism Core proprietary, RPM sample CC-BY-NC, Mixamo no-redistribute, Audio2Face NIM non-OSS, HeyGen/D-ID closed SaaS (X8).

---
---

# Appendix A — Babysitter SDK as an out-of-band governance layer (raw stream A)

*Read-only code survey of the babysitter execution model, its latency characteristics, in-process embedding seams, and an honest fit assessment. Paths absolute under `C:/Users/tmusk/IdeaProjects/babysitter`.*

## A.1 Core execution model

**`defineTask(id, impl, options)`** (`packages/babysitter-sdk/src/tasks/defineTask.ts:42-97`) registers a task id and returns a frozen `DefinedTask` with an async `build(args, ctx)`. `build` calls the user impl, which returns a `TaskDef` carrying a `kind` (`defineTask.ts:75-93`). `defineTask` does **not** execute side effects — it only *describes* an effect. Convenience builders `agentTask`, `nodeTask`, `breakpointTask`, `humanTask`, `orchestratorTask`, `sleepTask` (`tasks/kinds/index.ts:45-247`) produce specific `kind` values.

**Process signature** is `(inputs, ctx, extra?) => Promise<unknown>` (`runtime/orchestrateIteration.ts:38`), loaded by dynamic `import()` of an entrypoint's `process` export (`orchestrateIteration.ts:233-258`).

**`ctx` (`ProcessContext`)** built in `createProcessContext` (`runtime/processContext.ts:83-178`): `ctx.task` → `runTaskIntrinsic` (`:100-106`); `ctx.breakpoint` → `runBreakpointIntrinsic` (`:107`); `ctx.sleepUntil`/`orchestratorTask`/`subprocess`/`hook` (`:108-111`); `ctx.parallel.all`/`.map` (`:68-71`, `runtime/intrinsics/parallel.ts`); `ctx.halt` (`:94-99`), `ctx.log`, `ctx.onCleanup`, `ctx.artifactsDir`, `ctx.now`.

**Effect kinds** seen in code: `agent`, `node` (the SDK "code" task), `shell`, `breakpoint`, `sleep`, `orchestrator_task` (`tasks/kinds/index.ts:68,136,191,222,245`; shell in `commitEffectResult.ts:191`). `EffectIndex` treats kind as opaque (`runtime/replay/effectIndex.ts:13`).

**Throw-based effect protocol (the crux).** Not coroutines — **replay-by-re-execution** driven by exceptions: (1) a never-requested `ctx.task` writes `task.json`/`inputs.json`, appends `EFFECT_REQUESTED`, and **throws `EffectRequestedError`** (`runtime/intrinsics/task.ts:108-213`). (2) `orchestrateIteration` catches it → returns `{status:"waiting", nextActions}` (`:162-164`). (3) host resolves out-of-band → `commitEffectResult` appends `EFFECT_RESOLVED` (`commitEffectResult.ts:82-96`). (4) next iteration **re-runs the whole process from the top**; resolved `ctx.task` calls return cached results, the first unresolved throws again (`task.ts:88-105`). `ctx.parallel.all` collects multiple pending effects in one pass via `ParallelPendingError` (`parallel.ts:64-66`).

**Determinism/replay** hinges on stable invocation keys: `deriveStableTaskKey = taskId.label.hash(argShape).index` (`task.ts:245-253`), hashed to `invocationKey` (`:79-83`); duplicate keys rejected (`effectIndex.ts:199-203`); strict journal seq/ULID monotonicity (`:144-185`); `ctx.log` deduped via `logSeqs.txt`. **The process MUST be deterministic across iterations** — branching on wall-clock/random/live-ASR text breaks replay.

**Run lifecycle:** `createRun` (`runtime/createRun.ts:16-137`) creates dir, writes metadata+inputs, generates `completionProof`, locks, appends `RUN_CREATED`, fires `on-run-start`. Iterate = `orchestrateIteration`; terminal events short-circuit via `getTerminalReplayResult` (`:260-309`). Statuses: `completed|waiting|failed|process-error|halted`.

## A.2 Latency & throughput — the decisive section

**A single iterate + resolve cycle is heavy, synchronous, fsync-bound, lock-serialized.**

- **Every state-changing op rebuilds state from disk.** `orchestrateIteration` opens with `createReplayEngine`, which reads metadata, inputs, the **entire journal directory**, and rebuilds the effect index *every iteration* (`runtime/replay/createReplayEngine.ts:41-94`; `loadJournal` JSON-parses every event file `storage/journal.ts:111-141`), then re-executes the whole process (`orchestrateIteration.ts:92`). `commitEffectResult` *also* rebuilds the index (`:25`) and `rebuildStateCache` builds it **again** + writes a snapshot (`:104`; `stateCache.ts:154-176`).
- **fsync on every write.** `appendEvent` → `writeFileAtomic` → `handle.sync()` (file fsync) → rename → **dir fsync** (`storage/atomic.ts:23-35`). Each effect request and each resolution = ≥2 durable fsyncs + state-cache write + task/inputs/result writes. On commodity SSDs (~1–10ms/fsync) the cycle floor is **tens of ms** before any model/tool work.
- **Serialized by a filesystem lock.** Both `orchestrateIteration` and `commitEffectResult` run inside `withRunLock` (`storage/lock.ts:7-26`); contention retries sleep **250ms** (`:66`).
- **Journal append is process-serialized** (per-runDir promise queue; re-reads dir listing per append; `journal.ts:17-57`).

**Quantitative bottom line:** one "decide → request → resolve → next decision" cycle = lock + full journal load + full process re-exec + `EFFECT_REQUESTED` fsync, then lock + load + `EFFECT_RESOLVED` fsync + state-cache rebuild + fsync, then another lock + load + re-exec — **single-digit-to-tens of ms of pure I/O + re-execution per effect, growing O(n)** in prior effects. **No streaming, no partial advance.** **Verdict: not a sub-second component; suited to asynchronous, out-of-band governance at seconds-and-up granularity.**

## A.3 In-process embedding seams (no CLI subprocess)

**Yes — drivable entirely in-process as a library** (`runtime/index.ts:1-3`): `import { createRun, orchestrateIteration, commitEffectResult } from "@a5c-ai/babysitter-sdk"`. Minimal loop: `createRun(...)` → `orchestrateIteration({runDir})` → for each pending effect do the work + `commitEffectResult(...)` → loop until terminal. **Genty proves this pattern** in `runInternalOrchestrationPhase` (`packages/genty/platform/src/harness/internal/createRun/orchestration/internalPhase.ts:48`): in-memory `pendingActions`/`pendingEffectResults`, a `babysitter_run_iterate` tool calling `orchestrateIterationWithProcessLoadRetry` directly (`internalTools.ts:179-184`), resolving shell via `execFileSync`/agent via `runDelegatedHarnessTask`, posting through `postEffectResult` → `commitEffectResult`. **Caveat:** genty auto-executes effects in the host because models struggle to drive the protocol via tool-calls (`internalPhase.ts:538-541`) — a voice backend should do the same.

## A.4 Breakpoints as policy / human gates

`ctx.breakpoint` (`runtime/intrinsics/breakpoint.ts:44-103`) is a `kind:"breakpoint"` task on the same throw-based protocol; pauses until a `BreakpointResult` (`{approved,response}`) is committed. **Auto-approval pre-computed at request time** (`intrinsics/task.ts:162-177`) via `evaluateAutoApproval` (`breakpoints/evaluator.ts:68-194`): precedence = posture-block → require-explicit-rule → never-auto-approve → alwaysBreakOn tags → auto-approve rule → `autoApproveAfterN` → default-prompt. **Categories derived from the breakpointId prefix** (`read. write. exec. destroy. auth.`; `evaluator.ts:31-48`); `destroy`/`auth` postures have `allowAutoApprove:false` and require **owner**-level approval (`:26-28`). Resolution via `commitEffectResult`, enriched with `breakpointId` (`commitEffectResult.ts:71-94`). **Fit for "confirm before a sensitive tool" mid-call: strong;** caveat is latency/UX → model as an async gate with conversational filler, not a blocking inline await.

## A.5 Honest impedance-mismatch assessment

**(a) FITS:** governing/auditing the tool-call decision loop (each tool = a `ctx.task` effect; journal = append-only checksummed replayable record); multi-step decomposition (`ctx.task`/`parallel`/`orchestrator_task`); policy gates (`PolicyEngine` denies dispatch, `intrinsics/task.ts:146-160`); human approval gates (§A.4); replay/recovery (`process-error` recoverable, `orchestrateIteration.ts:193-198`).
**(b) DOES NOT FIT:** the audio/token hot path; sub-200ms reactions/barge-in; streaming partial results (model is whole-process-replay, terminal-or-waiting; `EFFECT_PROGRESS` is coarse status only); non-determinism inside the process; high effect frequency (O(n) per step).
**(c) THE SEAM:** run the voice pipeline on the hot path; treat babysitter as an **async tool / side-car governance run owned in the same Node process**, reached at the tool-dispatch boundary. The tool handler hands the request to a babysitter run (create or resolve a pending effect), **returns immediately** with a non-blocking acknowledgement (filler), the babysitter loop runs out-of-band (resolving sub-effects, possibly a breakpoint forcing owner approval), and the terminal/approval result is delivered back via **callback/event** injected into the realtime session. **babysitter sits behind an async tool boundary, never inside the turn.**

### A.6 Key files
`tasks/defineTask.ts:42` · `tasks/kinds/index.ts` · `runtime/processContext.ts:54` · `runtime/intrinsics/task.ts:68,108,212` · `runtime/intrinsics/breakpoint.ts:44` · `runtime/intrinsics/parallel.ts:10` · `runtime/orchestrateIteration.ts:47` · `runtime/createRun.ts:16` · `runtime/commitEffectResult.ts:22` · `runtime/replay/createReplayEngine.ts:41` · `runtime/replay/effectIndex.ts` · `runtime/replay/stateCache.ts:154` · `storage/journal.ts:51` · `storage/atomic.ts:18` · `storage/lock.ts:59` · `breakpoints/evaluator.ts:68` · `runtime/index.ts:1` · genty `internalPhase.ts:48` / `internalTools.ts:147,211`.
*Unverified:* fsync/iterate wall-clock not benchmarked (figures inferred from structure; qualitative "seconds+ async" conclusion robust); the exhaustive effect-kind set beyond those listed may include plugin/adapter kinds.

---
---

# Appendix B — Voice-stack capability survey of the monorepo (raw stream B)

*Read-only. Citations are absolute paths + line numbers.*

## B.1 genty as the agent "brain" — **YES (strongest reusable asset)**
`packages/genty/core/src/session.ts`. `AgentCoreSessionHandle.runCompletionLoop` (`:1163-1308`) is a real provider-native tool-calling loop: forwards `customTools` as OpenAI `function`/`tool_choice:auto` (`buildOpenAiTools :569-584`) and Anthropic `input_schema` (`:586-597`), parses streamed `tool_calls` (`collectOpenAiToolCalls :817`, `collectAnthropicToolCalls :977`), executes, loops to plain text, with convergence guards (`:39-42,1266-1300`). **Token streaming present** (`text_delta` events `:1203-1205` via `subscribe() :1332`; SSE `stream:true` `:647/659/670`; stream readers push `onDelta` `:759-762/912-914`) — **exactly what a voice TTS needs to start speaking before completion.** Providers via `resolveEndpoint` (`:299-356`): Azure Foundry/OpenAI, OpenAI, Anthropic, any OpenAI-compatible base. **No audio/realtime transport; prompt parts are text/image only** (`types.ts:27-47`); default 15-min timeout (`:23`); one prompt at a time (`:1094`, fine for half-duplex).

## B.2 adapters transport / codecs / gateway — **PARTIAL (text LLM proxy + SSE + text-WS; no audio)**
`packages/adapters/transport/src/server.ts`. Streaming: SSE for Anthropic/OpenAI-chat/OpenAI-Responses/Google/Bedrock (`renderStreamResponse :1239`; `STREAMING_TRANSPORTS :24`). WebSocket: a real `WebSocketServer` (`:1816`) but **only upgrades `/v1/responses`** for `openai-responses` (`:1820`), framing `response.create`→`response.output_text.delta` — **the OpenAI *Responses* API over a socket, NOT the Realtime audio API**; no audio frames/PCM/Opus/VAD. Codecs: `anthropic/bedrock/google/openai-chat/openai-responses`; `exposedTransport` enum has **no `realtime`/`audio`** (`types.ts:2-9`); passthrough covers ~20 providers (`:405-448`). The `codecs/` package is *harness adapters* (claude-code/codex/gemini/opencode), not audio codecs. **Gateway** = run/session orchestration + observer UI (`runs/manager.ts`, `session-runtime.ts`, `event-log.ts`). **Launch** launches agent CLIs. No audio anywhere.

## B.3 Existing realtime/voice/audio code — **MOSTLY ABSENT (one stub exception)**
No imports of any voice/realtime SDK (deepgram/elevenlabs/whisper/livekit/pipecat/wrtc/mediasoup/google-speech/OpenAI-Realtime) anywhere under `packages/`. Real hits: **`packages/kradle/jitsi-agent-sidecar/`** — a Puppeteer headless-Chromium Jitsi participant; `src/audio.js` (`:1-47`) `speak()/transcribe()/detectVoice()` are **STUBS** (transcribe returns empty `:33-38`, detectVoice returns `speechDetected:false :40-45`, speak echoes text `:21-31`); `config.js:15-25` has tts/stt/vad slots defaulting empty; `puppeteer-jitsi-client.js` offloads WebRTC/XMPP to the browser, app code only does chat/hand/screenshare. Also `genty/ui/.../AgentVoiceEditor.tsx` = voice *config UI*; `library/specializations/ai-agents-conversational/voice-enabled-conversational.js` = a babysitter *process definition* that drives an agent to *build* a voice system (documents deepgram/elevenlabs/livekit in `@references`, doesn't implement them).

## B.4 kradle control plane — **YES (real CRD control plane; strong fit)**
`packages/kradle/core/src/control-plane.js`. `ControlPlane` (`:5`) = CRD store with dual backends (etcd map + postgres map `:11`), `create/update/patchStatus/get/list/watch` (`:17-43`), admission policies + authorizer + audit log. Already has a **`JitsiMeeting` CRD** + controller (`jitsi-meeting-controller.js`) minting join JWTs (`signJwt :18-22`), meeting lifecycle/TTL, agent bridge (`jitsi-agent-bridge.js`, `jitsi-sync-controller.js`). Session controllers: `agent-session-transcript-controller.js`, `agent-run-status-reconciler.js`, `agent-dispatch-controller.js`, `agent-stack-controller.js`, `assistant-runtime.js`, `data-plane.js`, `event-bus.js`. CLI exposes meeting MCP tools (`cli/src/mcp-server.js:50-60`). **kradle could own a long-lived `VoiceCall` CRD analogous to `JitsiMeeting`; the gateway/launch + genty-core run the per-call agent.**

## B.5 channels-adapter — **HIGHLY relevant pattern**
`packages/adapters/channels/src/spawner.ts`. `SessionSpawner.spawn(source,event)` (`:383`) launches a fresh agent session per surviving event via an injected adapters client `run(opts)`, **bounded concurrency** (semaphore `:352-371`) + **error isolation** (`:443-450`). `buildSpawnRunOptions` (`:148`) maps event→`RunOptions` (prompt/agent/model/cwd/env) and self-associates an MCP server with a `reply_to` back-channel token (`:208-217,131-137`). **Structurally identical to (inbound call → spawn one bounded agent session → give it a back-channel to reply into the same call).** A "telephony" backend slots into the existing poller/relay/spawner pipeline.

## B.6 Capability matrix
| Capability | Status | Evidence |
|---|---|---|
| LLM reasoning + native tool-calling | **HAS (strong)** | genty `runCompletionLoop` session.ts:1163; :569-597,817,977 |
| Token streaming (early TTS) | **HAS** | `text_delta` session.ts:1203; SSE :759,912; `subscribe()` :1332 |
| Multi-provider LLM (+~20 passthrough) | **HAS** | session.ts:299-356; transport :405-448 |
| Session control plane / CRDs / scheduling | **HAS** | kradle `ControlPlane` control-plane.js:5; JitsiMeeting CRD |
| Event→session spawn (inbound call) | **HAS (pattern)** | channels `SessionSpawner` spawner.ts:383,148,208 |
| Observability (cost/usage/event log) | **HAS** | transport `MetricsTracker` server.ts:108; gateway event-log |
| Transport — WebSocket (text) | **PARTIAL** | server.ts:1816 — WS only `/v1/responses` text |
| Meeting/room join (WebRTC via headless browser) | **PARTIAL (stub)** | jitsi puppeteer client; browser does WebRTC |
| TTS / STT / VAD | **LACKS (stub only)** | audio.js:21-45 |
| WebRTC (native, in-code) | **LACKS** | offloaded to Chromium |
| OpenAI Realtime (speech-to-speech) | **LACKS** | enum has no realtime/audio |
| Telephony / SIP | **LACKS** | zero SIP code/deps |
| Audio I/O data model | **LACKS** | prompt parts text/image only types.ts:27-47 |

**Summary:** the monorepo brings the **non-audio half well** — genty-core (embeddable streaming tool-loop), kradle (CRD control plane modeling meetings/sessions), adapters (multi-provider LLM + SSE + cost observability), channels (event→bounded-session-spawn + reply back-channel). It **lacks the entire audio/realtime media half** — STT, TTS, VAD/turn-detection, native WebRTC, OpenAI Realtime, telephony/SIP, audio I/O type — all of which must come from an external framework wired to genty's `text_delta` stream + tool loop and managed as a kradle session.

---
---

# Appendix C — Online landscape (raw stream C: deep-research harness)

*28 sources fetched → 133 claims → 25 verified (3-vote adversarial; 2/3 refutes kills) → 23 confirmed, 2 killed → 18 after synthesis.*

## C.1 Verified findings (confidence: high unless noted)

1. **LiveKit Agents is Apache-2.0 and fully self-hostable** incl. the LiveKit WebRTC media server; managed LiveKit Cloud is a separate proprietary scaling option. *(3-0)* — github.com/livekit/agents, livekit/livekit LICENSE.
2. **LiveKit supports WebRTC + a SIP bridge** for inbound/outbound PSTN, DTMF, SIP REFER, warm/cold transfers (OSS `livekit/sip`). *(3-0)* — agents README, docs.livekit.io/telephony, github.com/livekit/sip.
3. **LiveKit and Pipecat are vendor-neutral, mix-and-match** STT/LLM/TTS/realtime (Deepgram, AssemblyAI, Whisper, Azure, Cartesia, ElevenLabs, Rime, OpenAI, Google, Gemini Live, OpenAI Realtime). *(3-0)*
4. **Reference architecture = cascaded `Audio→VAD→STT→LLM→TTS→Audio`**, each stage independently testable/swappable; streaming overlaps stages (partial STT feeds the LLM early). *(3-0)* — livekit.com/blog/sequential-pipeline-architecture-voice-agents.
5. **Streaming cascaded ≈ 400-800ms** voice-to-voice (later "conversational band" 300-600ms) vs 1000-2000ms+ blocking; latency → `max(VAD,STT,LLM,TTS)` not sum; **S2S ≈ 200-300ms** (fewer stages). *(3-0; vendor-stated, corroborated by Hamming AI).*
6. **For tool/compliance agents, cascaded is preferred over S2S** — full text visibility + audit trail at every stage; S2S preserves prosody but "requires additional tooling for auditability." *(3-0)*
7. **LiveKit tools = async `@function_tool` decorator + typed params + `RunContext`; native one-line MCP** (`mcp_servers=[mcp.MCPServerHTTP(url=...)]`) — the function body + MCP config are the natural interception seam. *(3-0)*
8. **LiveKit non-blocking async/background tools** (dedicated capability, Python-only): long-running tool returns control, agent keeps talking/uses filler, result streams to the LLM when done (`ToolFlag.CANCELLABLE`). *(3-0)* — directly addresses the latency tension.
9. **LiveKit irreversible-action guards:** `run_ctx.disallow_interruptions()` (barge-in won't cancel mid-tool) + `await context.wait_for_playout()` (finish pre-tool speech before executing). *(3-0; caveat issue #4560 — ties to current SpeechHandle, not guaranteed across a whole multi-step execution.)*
10. **LiveKit Turn Detector v1.0** (Agents v1.6.1, ~June 2026): combined audio+text semantics for optimal response timing; "cuts interruptions 39%." *(3-0)*
11. **Pipecat tools default SYNCHRONOUS** (`cancel_on_interruption=True`); `False` makes them async/non-blocking — LLM continues, result injected later as a developer message triggering new inference. *(3-0; the core latency escape hatch.)*
12. **Pipecat interception seam:** every handler is a plain async fn receiving `FunctionCallParams` (`function_name, tool_call_id, arguments, llm, context, result_callback, app_resources`); results only via `await params.result_callback({...})` — inspect arguments + gate/transform results before they reach the LLM. *(3-0)*
13. **Pipecat async STREAMING tool calls:** intermediate progress via repeated `result_callback(..., properties=FunctionCallResultProperties(is_final=False))` + `@tool_options(cancel_on_interruption=False, timeout_secs=...)`. *(3-0; realtime LLM services drop intermediate updates.)*
14. **Pipecat lifecycle events** `on_function_calls_started`/`_cancelled`/`on_completion_timeout` — usable for audit + filler-speech (`TTSSpeakFrame('Let me check on that.')`) but **observation seams, not pre-execution veto** — gating must be in the handler body. *(3-0)*
15. **Pipecat instruments tool calls as discrete OpenTelemetry spans** (`tool.function_name/call_id/arguments/result/result_status`) within `Conversation > turn > {stt,llm,tts}` → Jaeger/Langfuse/Datadog/SigNoz. *(3-0)*
16. **Pipecat OTel is purely OBSERVATIONAL** — no gating/interception/approval/replay; governance needs a separate layer (the cited webrtc.ventures tutorial adds it via separate LangGraph). *(2-1; one dissent, well corroborated.)*
17. **Pipecat speech/tool ordering hazard:** when one LLM response has both text + a function call, the function executes immediately (control frames don't wait for TTS) → side-effects can fire before the agent finishes speaking; workaround `await task.wait_for_next_tts_to_finish(timeout=5)`. *(3-0)*
18. **Recommended stack + interception strategy:** LiveKit Agents (or Pipecat) self-hostable core + managed pluggable STT/TTS/LLM; cascaded pipeline for auditability; inject an **external out-of-band governance/journal runtime at the tool-handler boundary** (LiveKit `@function_tool`/MCP; Pipecat `result_callback`); hide governance latency with async/background tools + filler; reserve `disallow_interruptions()`/`wait_for_playout()` for gated irreversible actions. *(3-0)*

## C.2 Refuted (killed)
- Pipecat function-call control frames are `SystemFrame`s that bypass TTS pause → *don't wait for speech*. **0-3 ✗** (issue #1842 mechanism refuted as the precise cause).
- LiveKit v1.6.0 (Jun 11 2025) introduced async tools with `ctx.update()`/`ctx.with_filler()`. **1-2 ✗** (API specifics unverified).

## C.3 Caveats (verbatim)
All latency figures originate from a framework vendor (LiveKit), illustrative not audited; corroborated directionally. Non-blocking/async tools are OPT-IN (default synchronous); LiveKit async tools are Python-only; for realtime/S2S LLM services Pipecat drops intermediate streamed results (streaming-narration reliable mainly with cascaded LLMs). Date/path nits: LiveKit Turn Detector 1.6.1 vs 1.6.2 (Jun 17 vs 19); some Pipecat example URLs stale after a repo reorg (APIs verified against docs). Pipecat lifecycle handlers are observation seams, not veto points. **This report did NOT independently verify Vocode, OpenAI Realtime specifics, Ultravox, Vapi, Retell AI, Bland, or Rasa** — no claims about those survived verification, so the landscape is effectively LiveKit-vs-Pipecat + the cascaded-vs-S2S axis, not the full 10-framework table.

## C.4 Open questions
1. How do managed/closed contenders (Vapi/Retell/Bland) and the more-open OpenAI Realtime/Ultravox/Vocode/Rasa compare on self-hostability/transport/tooling/governance? (unverified here)
2. Reliability of `disallow_interruptions()` across a multi-step tool execution (issue #4560)?
3. Measured end-to-end latency overhead of a synchronous governance/approval round-trip, and how much filler can hide it (300ms human / 600ms acceptable)?
4. Concrete primary-sourced HITL mid-call patterns beyond `disallow_interruptions`/`wait_for_next_tts_to_finish` (pausing the LLM loop, escalating to a human, resuming after async approval)?

## C.5 Source set (28 fetched; primary = official docs/repos)
livekit/agents · livekit/livekit LICENSE · livekit/sip · docs.livekit.io/{telephony,agents/logic/tools,agents/integrations/overview} · livekit.com/blog/{sequential-pipeline-architecture-voice-agents, voice-agent-architecture-stt-llm-tts-pipelines-explained, human-in-the-loop-voice-agents, observer-pattern-voice-agent-guardrails} · github.com/livekit/agents/releases · docs.pipecat.ai/{pipecat/learn/function-calling, pipecat/learn/llm, server/utilities/opentelemetry} · reference-server.pipecat.ai (llm_service) · github.com/pipecat-ai/pipecat (+issue #1842, async-stream example) · webrtc.ventures (Twilio+Pipecat+LangGraph guardrails) · hamming.ai/resources/voice-ai-latency · assemblyai.com/blog/vapi-vs-pipecat-vs-livekit · softcery.com (several 2025/2026 guides) · blog.dograh.com (OSS Vapi alternatives) · openai.github.io/openai-agents-js (HITL).

---
---

# Appendix D — Avatar / video subsystems landscape (raw stream D)

*Web research; context assumes a headless-Chromium Jitsi sidecar, so a browser-canvas rendering path is favored. Primary sources linked.*

**D.1 Browser avatar rendering.** **TalkingHead.js** (met4citizen) — renders a Ready Player Me **GLB** on **Three.js**, with a ready-made control API for posture/expression/gaze/gesture/visemes; supports a scene-owned mode suitable for a sidecar; Mixamo-compatible rig with **52 ARKit shapes + 15 Oculus visemes**. MIT class; **the sample `brunette.glb` avatar is CC BY-NC and the Mixamo raw animations can't be redistributed — ship your own**. RPM GLB + Three.js + viseme-morph-targets is the mainstream 2024-25 pattern (Wawa Sensei, Agora ConvoAI+RPM). 3D alternatives: Babylon.js (first-class morph-target API), `<model-viewer>` (weaker per-blendshape control). 2D: **pixi-live2d-display** (guansss) for Live2D Cubism — expressive but requires the **proprietary, revenue-gated Cubism Core** runtime; `pixi-live2d-display-lipsyncpatch` adds amplitude mouth driving. All are local WebGL → sub-frame render latency; the deciding factor is *control surface*, where TalkingHead leads. [TalkingHead](https://github.com/met4citizen/TalkingHead) · [Wawa Sensei lip-sync](https://wawasensei.dev/tuto/react-three-fiber-tutorial-lip-sync) · [Agora ConvoAI+RPM](https://www.agora.io/en/blog/build-real-time-ai-avatars-with-lip-sync-using-agora-convoai-rpm/) · [pixi-live2d-display](https://github.com/guansss/pixi-live2d-display)

**D.2 Lipsync.** Prefer engine-emitted timing over post-hoc analysis. **Azure Speech `VisemeReceived`** = per-phoneme Viseme ID (22-set) + `AudioOffset` in 100ns ticks; or `mstts:viseme` → **55 ARKit blendshape coefficients @60 FPS** (“render each group immediately before the corresponding audio chunk”). Caveat: those are ARKit-tuned, not Oculus — retarget to the rig. **ElevenLabs** convert/stream-**with-timestamps** = character-level start/end times (convert chars→words→phonemes→visemes yourself; TalkingHead has language modules for this). **Rhubarb** = offline only (pre-rendered lines). **RMS-envelope** (Web Audio `AnalyserNode`) = universal fallback. TalkingHead `speakAudio({audio, visemes, vtimes, vdurations, words, wtimes…})` / `streamAudio()` ingest this directly. [Azure viseme how-to](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis-viseme) · [ElevenLabs timestamps](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)

**D.3 Inject generated video into WebRTC.** `HTMLCanvasElement.captureStream(fps)` → `CanvasCaptureMediaStreamTrack` (use `fps:0` + `requestFrame()` for manual cadence). **lib-jitsi-meet idiomatic path = `track.setEffect(effect)`** where the effect's `startEffect(stream)` returns `canvas.captureStream()` — exactly Jitsi's own **`JitsiStreamPresenterEffect`** (canvas + interval `drawImage` + captureStream). `createLocalTracks`+`conference.replaceTrack(old,new)` also works but has reported multi-second/20s delays + null-old-track failures — pin a good LJM version. LiveKit alt: `localParticipant.publishTrack(canvas.captureStream(30).getVideoTracks()[0], {source:Camera})`. Headless: `--headless=new` + real GPU (old headless broke `mediaDevices`/`captureStream`). [MDN captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream) · [LJM API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-ljm-api/) · [Jitsi canvas thread](https://community.jitsi.org/t/how-to-stream-a-html-canvas-content-using-video-stream/120624) · [LiveKit canvas](https://livekit.com/blog/streaming-video-from-a-canvas-with-webrtc-and-react)

**D.4 Screen-share / desktop into video.** **noVNC** (RFB over WebSocket via **websockify**) renders a desktop to an HTML5 canvas → composite as a `drawImage` layer; it also sends input events back, so the agent can *show and operate* the desktop. MPL-2.0, self-hostable. [noVNC](https://github.com/novnc/noVNC)

**D.5 Server-side alternatives.** **NVIDIA Audio2Face-3D** (open-sourced Sept 2025; SDK **MIT**, models on HF) = audio→facial-animation only (blendshapes/joints), **does not render** — needs UE5/Omniverse/Three.js; real-time via gRPC, GPU. The **NIM microservice** is under NVIDIA's AI-product license (not OSS). **HeyGen LiveAvatar / D-ID** = managed photoreal avatar over WebRTC (~sub-300ms), closed SaaS, per-minute cost, returns a *remote* track to re-pipe; HeyGen Interactive Avatar sunsets 2026-03-31. Net: server-side buys photorealism at GPU/SaaS cost + an extra hop + weaker custom control; browser-canvas wins on cost/locality/controllability for a self-hosted tool-driven agent. [NVIDIA A2F open-source](https://developer.nvidia.com/blog/nvidia-open-sources-audio2face-animation-model/) · [Audio2Face-3D repo](https://github.com/NVIDIA/Audio2Face-3D) · [HeyGen LiveAvatar](https://help.heygen.com/en/articles/12758516-introducing-liveavatar)

**D.6 Control vocabulary (TalkingHead API → agent tools).** speech `speakText/speakAudio/streamAudio`; mood `setMood(neutral|happy|angry|sad|fear|disgust|love|sleep)` + `setFixedValue(shape,v)`; gaze `lookAt/lookAtCamera/makeEyeContact`; pose/gesture `playGesture(handup|index|ok|thumbup|thumbdown|side|shrug)`/`playPose`/`playAnimation`; staging `setView(full|mid|upper|head)`/`setLighting`. Agent tools mirror these; **visemes stay internal (driven by D.2), not exposed as tools**.

**D.7 Hard problems.** Cross-track A/V drift (originate both tracks from one page/audio clock); headless WebGL+WebRTC GPU quirks; GPU cost/bot; ARKit→Oculus retarget accuracy; lib-jitsi-meet setEffect/replaceTrack reliability; noVNC bandwidth; licensing (Cubism proprietary, RPM sample CC-BY-NC, Mixamo no-redist, A2F NIM non-OSS, HeyGen/D-ID SaaS).

---
---

# Appendix E — kradle media / CRD / UX code map (raw stream E)

*Read-only; `file:line` in `packages/kradle/…`. The kradle source is present on this branch.*

**E.1 How it works today.** The sidecar joins via headless Chromium + Jitsi External API, **not a real media client**: `puppeteer-jitsi-client.js:25-37` launches `puppeteer-core` with `--use-fake-ui/--use-fake-device-for-media-stream`, navigates to the room, and drives it through `window.APP.conference.*`. The fake-device flag means Chromium publishes a **synthetic spinning-ball video + beep** — no real camera/mic/canvas/TTS reaches the meeting. `shareScreen(url)` (`:63-65`) is just `window.open`. `audio.js` is 100% stub: `speak()` returns text (`:21-31`), `transcribe()` returns `[]` (`:33-38`), `detectVoice()` returns false (`:40-45`).

**E.2 IPC channel (real but small).** `ipc-server.js` = Unix-domain NDJSON server; `runtime.js:73-102` `handleCommand` accepts exactly `send_chat, raise_hand, lower_hand, react, share_screen, speak_tts, get_transcript, get_participants, disconnect`. Inbound sidecar→agent events: `connected, transcript, participant_joined, participant_left` (`:58-71`) — **note `chat` is not emitted**.

**E.3 THE load-bearing gap.** MCP meeting tools (`cli/src/mcp-server.js:612-631`) call `meetingToolCommand` which **only returns a descriptor** `{meetingRef,roomId,socketPath,command}` (`:709-733`) — **it never opens `/tmp/jitsi-agent.sock`**. The only socket *client* is `bin/graceful-leave.mjs:6` (a `disconnect` on preStop). So **the agent-reasons→command→sidecar loop is broken at runtime even for text chat**.

**E.4 Sidecar Job injection (real).** `adapters-client.js:94-135` `createJitsiSidecarContainer` + `createAgentJob` (`:434,457-498`) attach the sidecar as a second container with a shared `agent-socket` emptyDir at `/tmp` when meeting context is present; env: room URL/JWT/roomId, role, `JITSI_AUDIO/CHAT/SCREENSHARE_MODE`, optional `JITSI_TTS_*/STT_*/VAD_*`.

**E.5 CRDs.** `AgentStack` validates `spec.jitsiCapability`, `spec.jitsiConfig.{role,tools,capabilities.audio,participantName}`, `jitsiMeetingProviderRef` (`agent-stack-controller.js:223-257`) — **no video field**. Identity: `AgentAppearance`(“avatar generation settings”) + `AgentVoiceProfile`(TTS) exist (`resource-model.js:36-37`), resolved (`agent-persona-controller.js:71-85`), surfaced to dispatch identity (`agent-dispatch-controller.js:303-309`) — **but never passed to the sidecar** (`adapters-client.js:94-118` reads `jitsi.tts`, ignores appearance). `JitsiMeeting` = full lifecycle (`jitsi-meeting-controller.js:72-289`), status tracks only `recording.*` — **no live media/transcript/session status**.

**E.6 Web.** Official `JitsiMeetExternalAPI` iframe (`web/.../jitsi-embedded-meeting.jsx:104-122`) — **agent video tracks render automatically as participant tiles; no custom video component needed**. Join: `jitsi-meeting-experience.jsx:31-57` → mints user JWT (`jitsi-service.js:145-173`). `stack-builder.jsx` captures baseAgent/adapter/model/prompts/mcp/skills only — **zero jitsi/avatar/video fields**.

**E.7 Bottom line.** Control plane (CRDs, controllers, dispatch→sidecar Job, web meeting UI, MCP tools, identity-with-appearance/voice) is **real and fairly complete**. Media plane is **almost entirely stub** — no avatar render, no published video/audio track, no lipsync, no real screen-share, and the load-bearing **missing agent↔sidecar socket client**. Smallest change set + dependency order are consolidated in [`realtime-agent-gaps.md`](./realtime-agent-gaps.md).
