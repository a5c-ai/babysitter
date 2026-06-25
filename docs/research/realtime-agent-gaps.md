# Realtime agent harness — gap register (voice + video/avatar)

> **Status:** Living gap map for the realtime audio+video avatar agent harness on kradle.
> **Date:** 2026-06-23.
> **Companions:** [`realtime-voice-agent-stack.md`](./realtime-voice-agent-stack.md) (architecture), [`voice-governance-bridge-spec.md`](./voice-governance-bridge-spec.md) (bridge + CRD + UX flow).
> **Legend:** **HAS** = real & usable · **PARTIAL** = real but incomplete/unwired · **LACKS** = absent/stub. Seams are `file:line` in `packages/…`.

## 0. The shape of the problem

kradle's **control plane is real and fairly complete**; the **media plane is almost entirely stub**. The harness can already model a meeting agent, dispatch it as a K8s Job with a headless-Chromium Jitsi sidecar, render the agent as a participant tile in the web UI, and expose meeting MCP tools — but the agent currently publishes only Chrome's **fake spinning-ball video + beep** (`--use-fake-device-for-media-stream`), and the agent's reasoning never actually reaches the sidecar at runtime. Closing the harness = (1) fix the **load-bearing runtime gap** (agent↔sidecar socket client), then (2) build the **media plane** (avatar render, real A/V tracks, lipsync, screen-share, tool-driven visuals), then (3) extend the **CRD/UX** surface to declare & drive video capability.

---

## 1. LOAD-BEARING gap (everything else depends on it)

| # | Gap | State | Seam / evidence | Notes |
|---|---|---|---|---|
| **G0** | **Agent→sidecar socket client at runtime** | **DONE (impl) · live-pending** | Implemented `jitsi-agent-sidecar/src/ipc-client.js` (`createAgentIpcClient`: connect → NDJSON `command` → `command_result` correlation → `onEvent` stream; no silent fallback) + `bin/agent-ipc-client.mjs` CLI consuming the MCP `{socketPath,command}` descriptor (`kradle/cli/src/mcp-server.js:724-732`). Verified via `runtime.test.js` (9/9, non-socket) + `ipc-client.test.js` (real AF_UNIX socket, runs on Linux CI; platform-skips where AF_UNIX is unbindable). | **Was the load-bearing gap; now built + unit-verified.** Residual = wire it into the in-pod agent wrapper so a dispatched agent actually invokes it (and the live G0-RT meeting boot). |
| **G0-RT** | **Agent-Job runtime substrate** | **HAS (board) / UNPROVEN (meeting-sidecar)** | Main container runs `node packages/adapters/cli/kradle-agent-entrypoint.mjs` with `KRADLE_AGENT_IMAGE` (`adapters-client.js:491-496`) + emptyDir/PVC workspace (`:467-474`); board→agent E2E verified live (memory `project_dispatch_emptydir_agentimage_task`; supersedes the older "no Job ever ran"). Meeting dispatch attaches the sidecar as a 2nd container + `agent-socket` emptyDir (`:477,507`). | **Reconciled:** the Job runtime now WORKS for board/text dispatch — it is NOT the bottleneck. Residual: (a) the sidecar uses a **separate image** `kradle/jitsi-agent-sidecar:latest` (`:123`) that must be built/published; (b) **no live E2E of the meeting-sidecar dispatch** (2nd container actually starting + joining); (c) the sidecar's main command isn't the agent entrypoint, so G0 is how the agent reaches it. Verify the sidecar container boots in a real dispatch before relying on the media plane. |

---

## 2. Media plane — sidecar (`packages/kradle/jitsi-agent-sidecar/src`)

| # | Gap | State | Seam | Fix |
|---|---|---|---|---|
| G1 | Render avatar in-browser | **DONE (impl) · live-publish pending** | `puppeteer-jitsi-client.connect()` now `injectAvatar()`s when `JITSI_VIDEO_MODE==='publish'`: a `node:http` static server serves `src/browser/{avatar,compositor,publish-effect,lipsync}.js` (promoted byte-identical from `avatar-poc/`), grafted into the live Jitsi page via es-module-shims (`shimMode`) + CDN importmap + `importShim()`, building the avatar from `JITSI_AVATAR_*` env and defining `window.__kradleAvatar`. `verify-sidecar.mjs` S1 confirms a non-blank render headless. Residual: real-GPU TalkingHead quality (cluster). |
| G2 | Publish generated **video** track | **DONE (impl) · live-publish pending** | `injectAvatar()` builds `createCanvasPublishEffect({canvas,fps})` + `attachToConference` → `localVideoTrack.setEffect(effect)` (the `JitsiStreamPresenterEffect` pattern) off the composited output canvas. `verify-sidecar.mjs` S2 confirms a live video track + `setEffect` on a mock conference. Residual: the real `window.APP.conference` publish into a live Jitsi room (G0-RT). |
| G3 | Publish **TTS audio** track | **DONE (impl) · live-publish pending** | `audio.js` now routes `speak()` → pluggable `TtsProvider` (mock synthetic default) → audio descriptor; `puppeteer-jitsi-client.publishAudio` builds a Web-Audio `MediaStreamAudioDestinationNode` audio track (avatar-poc `verify-audio.mjs` A1/A2 confirm a live `kind:audio` track headless). Residual: real TTS provider (creds) + the live `window.APP.conference` publish are manual/config. |
| G4 | **Lipsync** (viseme/mouth sync) | **DONE (impl) · live-publish pending** | `src/browser/lipsync.js` `buildVisemeSchedule` on the `AudioContext` clock + `LipsyncRunner` (X1), now folded into the live sidecar: `publishAudio()` drives lipsync on the shared `window.__kradleAudio.ctx` when the avatar is present and the descriptor carries viseme timing (no silent fallback — a lipsync fault surfaces, never degrades to a plain tone). `verify-sidecar.mjs` S3 confirms the audio track + `replaceTrack`. Residual: real Azure visemes + live publish. |
| G5 | STT (hear the user) | **PARTIAL (impl) · inbound wiring pending** | `audio.js` `transcribe()` → pluggable `SttProvider` (mock canned default), capability-gated; `runtime.onInboundAudio` routes to the existing `transcript` event. Residual: the page-side inbound-audio tap emits only a signal (no PCM) and isn't wired to `onInboundAudio` yet — real inbound PCM + a real STT provider are manual/live. |
| G6 | VAD / turn detection | **DONE (impl)** | `audio.js` `detectVoice()` → pluggable `VadProvider` (energy-threshold `local-vad` default); capability-gated; `energy` detail opt-in (keeps the deepEqual success shape). Residual: a real Silero/framework VAD adapter is config-driven. |
| G7 | Screen-share / VNC into video | **DONE (impl) · live-publish + real-VNC pending** | The compositor now has a real screen layer: `compositor.setScreenSource(el)/clearScreen()` + `drawScreenLayer` composite a source (canvas/video/image) into `#out` (full/inset/region, readiness-guarded), and a real annotation layer (`pushAnnotation`/`clearAnnotations` — text/rect/line/image). `window.__kradleAvatar.startScreenshare({source,url})` feeds it: **noVNC** RFB (lazy CDN-importmap `@novnc/novnc`, ws/wss VNC url) → canvas → screen layer; `getDisplayMedia`→`<video>`; image url→`<img>`. `verify-sidecar.mjs` S6 confirms a synthetic source composites while the avatar base + published track stay live (S5 confirms annotations). The legacy `share_screen` (`window.open`) action is marked **deprecated** in favor of `start_screenshare`. | The real noVNC RFB against a live **websockify/VNC server** (actual desktop pixels) + desktop **input/operate**, `getDisplayMedia` on a real display, and the live `window.APP.conference` publish (G0-RT) stay manual/cluster (X7 throughput). |
| G8 | New IPC actions for visuals | **DONE (impl) · drives the live avatar** | Added `set_expression/set_posture/play_gesture/look_at/set_view/draw_canvas/start_screenshare/send_video_metadata` to `SUPPORTED_ACTIONS` + `handleCommand` → `jitsi.*` puppeteer methods. With the media plane now wired (G1/G2), `setExpression/setPosture/playGesture/lookAt/setView` mutate the **real** `window.__kradleAvatar` (`verify-sidecar.mjs` S4 confirms `set_expression` changes the rendered mood). Dispatch verified (`runtime.test.js`, exact args). With G7 landed, `draw_canvas`→`compositor.pushAnnotation` (S5) and `start_screenshare`→`compositor.setScreenSource` (S6) now drive the **real** compositor too. | Only `send_video_metadata` remains a no-op — it is the **governed** data-channel path (G13). |
| G-chat | Inbound `chat` events not emitted | **DONE (impl) · live-pending** | `runtime.js` now emits a normalized `chat` event, and `puppeteer-jitsi-client.connect()` installs the `onEvent` listener it previously **ignored** (the real reason no inbound event flowed). Round-trip verified non-socket. | The in-page Jitsi `message` listener is best-effort/unverified against a live page (real Jitsi API surface) — confirm on a live meeting. |

---

## 3. Control plane — CRDs & controllers (`packages/kradle/core/src`)

| # | Gap | State | Seam | Fix |
|---|---|---|---|---|
| G9 | AgentStack **video capability** | **DONE (impl)** | `agent-stack-controller.js` `JitsiCapabilityReady` now validates `capabilities.video:'publish'` + `avatarRef` (resolved against `AgentAppearance`) + video tools + `governedTools⊆tools` + observer-cannot-publish gate (audio/chat path intact). node:test verified. | Residual: `kradle_speak` is allowlisted but not yet MCP-wired. |
| G10 | Appearance/voice **threaded to sidecar** | **DONE (impl) · live-publish pending** | Closed the resolved-but-undelivered gap: `prepareMeetingContext` now receives `identity` (`agent-dispatch-controller.js:483`), the bridge embeds `meetingContext.{avatar,voice,video}` (bare-stack falls back to `jitsiConfig.avatarRef`, **hard-fail** on unresolvable — no silent fallback), and `createJitsiSidecarContainer` emits `JITSI_VIDEO_MODE`+`JITSI_AVATAR_*`+identity `JITSI_TTS_*`. node:test verified end-to-end. | Residual: the sidecar must actually consume the env to render/publish (G1/G2 live wiring). |
| G11 | AgentAppearance avatar **model** field | **DONE (impl)** | `resource-model.js` `AgentAppearance` gains optional `renderer/avatarModelUrl/visemeSet/defaultMood/defaultView` (no required-field regression). | — |
| G12 | JitsiMeeting **media/session status** | **DONE (impl) · live-pop pending** | `jitsi-meeting-controller.js` reconcile adds `status.media/session/transcript/governanceRuns`, **`status.recording` preserved**. node:test verified. | Residual: `governanceRuns` is reserved (`[]`) — live population is the G13 bridge; `media`/`transcript` populate from the live sidecar. |
| G13 | Governance of consequential visual tools | **LACKS** | no policy/approval over screen-share, content writes, external metadata | Route consequential visual tool calls through the babysitter media-governance bridge (see [`voice-governance-bridge-spec.md`](./voice-governance-bridge-spec.md)); cosmetic animation stays fast-path |

---

## 4. Surfaces — web UX & MCP

| # | Gap | State | Seam | Fix |
|---|---|---|---|---|
| G14 | Stack-builder video/meeting section | **DONE (impl)** | The active `GraphStackBuilder` gains a "Meeting / Video" section + provider/avatar/voice/role pickers (new `agents/appearances` + `agents/voices` list routes); pure `buildStackResource` emits `jitsiCapability`/`jitsiConfig`/`jitsiMeetingProviderRef` per modality. A node:test round-trips the emitted spec through the **real** `reconcileStack` G9 validator (True/False). Web suite 353/353. | Residuals (minor): validator doesn't *require* `avatarRef` for video (worth a small follow-up); live React render/POST + the dispatched sidecar publishing are manual. G15 overlay + G17 (genty/ui avatar editor) deferred. |
| G15 | Agent overlay/controls in call UI | **PARTIAL (optional)** | iframe embed (`jitsi-embedded-meeting.jsx:104-122`) **already renders the agent's published track as a participant tile** — no new video component needed | Optional: agent-specific overlays/controls in `jitsi-meeting-experience.jsx`/`jitsi-meeting-controls.jsx` |
| G16 | Video MCP tools | **DONE (impl)** | `cli/src/mcp-server.js` adds 9 video tools (`kradle_set_expression`/`play_gesture`/`set_posture`/`look_at`/`set_view`/`draw_canvas`/`publish_video`/`share_surface`/`send_video_metadata`), each returning the `{socketPath,command}` descriptor with role/`requireVideoPublish` gates; `MCP_TOOLS` 33→42. node:test verified. | The descriptor is **written to the socket by the G0 ipc-client** (live wiring), not the tools. |
| G17 | Agent voice/avatar editor UX | **PARTIAL** | `genty/ui/.../AgentVoiceEditor.tsx` picks TTS voice only | Extend to an avatar/media editor (model, expression set, default pose, view framing) bound to `AgentAppearance` |

---

## 5. External components to integrate (not in repo — must add)

| # | Component | State | Source / choice |
|---|---|---|---|
| G18 | Realtime media server + SIP | **LACKS** | LiveKit server + `livekit/sip` **or** the existing Jitsi (already wired) — Jitsi is the path of least resistance since the sidecar+CRDs target it |
| G19 | Avatar renderer | **LACKS** | TalkingHead.js (RPM GLB + Three.js) in headless Chromium; Live2D alt (Cubism Core proprietary) |
| G20 | STT / TTS providers | **LACKS** | Deepgram / faster-whisper (STT); Azure (visemes) / ElevenLabs / Cartesia (TTS) |
| G21 | noVNC + websockify | **LACKS** | screen-share/desktop-into-video |
| G22 | (optional) server-side face anim | **LACKS** | NVIDIA Audio2Face-3D (MIT SDK, audio→blendshapes; still needs a renderer) for higher-fidelity lipsync on GPU |

---

## 6. Cross-cutting hard problems / unknowns

| # | Risk | Why it's hard |
|---|---|---|
| X1 | **Cross-track A/V sync drift** | Audio + canvas video are separate WebRTC tracks; not auto-lip-synced beyond RTCP. Must originate both from one page/one audio clock; network jitter buffers still add offset. Budget testing. |
| X2 | **Headless WebGL + WebRTC** | Headless Chromium needs real GPU/ANGLE (SwiftShader is slow); older headless modes broke `mediaDevices`/`captureStream`. Verify under `--headless=new` + GPU on the sidecar host. |
| X3 | **GPU cost** | One GPU box per concurrent video bot (WebGL composite readback; worse if Audio2Face). Capacity/scheduling concern for the kradle scheduler. |
| X4 | **Lipsync retargeting accuracy** | Azure ARKit blendshapes are tuned for ARKit, not Oculus/TalkingHead rigs; TalkingHead's rule-based EN mapping ~80%. Retarget quality varies. |
| X5 | **Governance latency budget** | babysitter governance round-trip (seconds) must hide behind filler speech + async tools; never on the audio/animation hot path. Unbenchmarked — measure `create→iterate→commit` on target disk. |
| X6 | **lib-jitsi-meet `setEffect`/`replaceTrack` reliability** | Reported multi-second/20s delays, null-old-track failures. Pin a known-good LJM version; test the effect path. |
| X7 | **noVNC throughput** | Full-desktop RFB over WebSocket at video frame rate is bandwidth-heavy; rate-limit / dirty-region. |
| X8 | **Licensing** | Live2D Cubism Core proprietary (revenue-gated); RPM sample avatar CC BY-NC; Mixamo raw files no-redistribute; Audio2Face NIM under NVIDIA AI license (not OSS); HeyGen/D-ID closed SaaS. Ship own-licensed assets. |

---

## 7. Recommended build order (dependency-aware)

0. **G0-RT** — confirm the meeting-sidecar dispatch actually boots (the Job runtime already works for board dispatch; build/publish `kradle/jitsi-agent-sidecar:latest` and prove the 2nd container joins a room). Precondition for everything below.
1. **G0** — the agent↔sidecar socket client (unblocks everything; makes today's text chat actually work).
2. **G3 + G5 + G-chat** — real audio out (TTS) + audio in (STT) + chat events → a working **voice** agent in a meeting (the [voice stack](./realtime-voice-agent-stack.md) MVP).
3. **G1 + G2 + G4** — avatar render + video-track publish + lipsync → a working **talking-avatar** agent.
4. **G8 + G16 + G17** — visual tool calls (expression/posture/gesture/canvas) end-to-end (IPC actions + MCP tools + editor).
5. **G7 + G21** — screen-share / VNC into the video.
6. **G9 + G10 + G11 + G12 + G14** — CRD video capability + appearance/voice threading + status + stack-builder UX (the full declarative flow).
7. **G13** — babysitter governance over consequential visual tools (canvas content, screen-share, external metadata).
8. **X-items** — harden sync/GPU/latency/licensing as each lands.

Prior **voice gaps** (STT/TTS/VAD/WebRTC/SIP from the original voice research) are absorbed here as G3/G5/G6/G18/G20 — they are the same media-plane gaps, now grounded in the kradle sidecar.
