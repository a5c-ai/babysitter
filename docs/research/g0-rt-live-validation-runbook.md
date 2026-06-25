# G0-RT — Live-cluster validation runbook (kradle realtime avatar agent)

> **Status:** Operator runbook (manual / cluster). Everything in the realtime-avatar harness that is
> *headlessly* verifiable is built, tested, and green (see [`realtime-agent-gaps.md`](./realtime-agent-gaps.md) —
> G0–G17 DONE (impl)). **G0-RT is the one thing a CI host cannot prove:** booting the real
> `jitsi-agent-sidecar` into a live Jitsi room and confirming it (1) joins, (2) publishes the avatar
> **video** + TTS **audio** tracks, (3) drives the avatar from the fast-path tools, and (4) honors the
> **media-governance bridge** (G13) on a consequential tool — with `JitsiMeeting.status` populating.
> This runbook is the step-by-step to do that on a cluster. Every field/env/route name below is cited
> from the code so the manifests apply verbatim.

---

## 0. What this validates (and what it does not)

| Validate (live) | Maps to |
|---|---|
| Sidecar Job is created + scheduled + `connect()`s to the room | dispatch→sidecar Job, `bin/sidecar.mjs` |
| Avatar renders + a **video** track is published (`setEffect`) | G1 / G2 live-publish residual |
| TTS **audio** track is published + lipsync rides the shared clock | G3 / G4 live-publish residual |
| `set_expression`/`play_gesture` (fast path) visibly drive the avatar | G8 live |
| `share_surface` (governed) → approval breakpoint → only-then socket write | **G13** governance round-trip |
| `JitsiMeeting.status.media.agentTracks` / `session.agents` / `governanceRuns` populate | G12 live-pop residual |
| Real noVNC RFB against a live websockify/VNC server shows a desktop | G7 real-VNC residual |

**Out of scope here:** real-GPU perceptual quality (X2/X3), A/V sync drift measurement (X1/X5 — benchmark
separately), telephony/SIP (G18), and the `@a5c-ai/voice-adapter` TS/LiveKit + MCP async-callback delivery
(separate follow-up). Those are tracked in the gaps doc; do not block G0-RT on them.

---

## 1. Prerequisites

1. **Cluster access** to the kradle cluster (`kubectl` context set), and the **kradle control plane**
   deployed (controllers + web/BFF). Org namespace convention is `kradle-org-<org>`
   (`adapters-client.js:551`).
2. **A reachable Jitsi deployment** the sidecar can join (the `JitsiMeetProvider` the meeting references),
   and the JWT secret the BFF signs room tokens with (`KRADLE_JITSI_JWT_SECRET`,
   `mcp-server.js:717`).
3. **The agent image** (the harness wrapper) available at `KRADLE_AGENT_IMAGE` in the **web/controller pod
   env** — this is the load-bearing env var; if unset it falls back to `ghcr.io/a5c-ai/adapters:latest`
   (`adapters-client.js:514`). It must be in the pod's env range or the Job pulls the wrong image
   (see Landmines).
4. **The sidecar image** `kradle/jitsi-agent-sidecar:<tag>` built from
   `packages/kradle/jitsi-agent-sidecar` and pushed to a registry the cluster can pull. The Job sets the
   sidecar container image from `jitsi.sidecarImage || 'kradle/jitsi-agent-sidecar:latest'`
   (`adapters-client.js:146`). **The image must ship a real Chromium with GPU** (`--headless=new`; old
   headless breaks `captureStream`, see design doc D.3) — set `PUPPETEER_EXECUTABLE_PATH`/`CHROMIUM_PATH`
   (`config.js`) and request a GPU/SwiftShader-capable node.
5. **A license-clean avatar GLB URL** the operator supplies via `avatarModelUrl` — the sidecar **never**
   auto-loads a CC-BY-NC asset (avatar defaults to the primitive placeholder; see
   `src/browser/avatar.js`). Host your own RPM/GLB and point `avatarModelUrl` at it.
6. **The model-provider Secret** for the agent container exists in `kradle-org-<org>` and is referenced as
   `modelSecretName` — it is mounted `optional:false` (`adapters-client.js:508-510`); a missing Secret
   means the agent pod never starts.

### Build + push the sidecar image

```bash
# from repo root; do NOT run npm install on Windows (lockfile pollution) — build the image in CI/Linux
docker build -t <registry>/kradle/jitsi-agent-sidecar:g0rt packages/kradle/jitsi-agent-sidecar
docker push <registry>/kradle/jitsi-agent-sidecar:g0rt
```

---

## 2. The declarative flow (create-stack → appearance/voice → meeting → dispatch)

All resources are kradle CRDs (`kradle.a5c.ai/...`); apply them into the org. **Order matters**: the
`AgentAppearance` + `AgentVoiceProfile` must exist before the `AgentStack` validates, because the G9
validator resolves `avatarRef` against `AgentAppearance` and **fails hard** if `capabilities.video ===
'publish'` and the appearance is missing (`agent-stack-controller.js:252-259`).

### 2.1 AgentAppearance (the avatar identity — G11 fields)

`AgentAppearance.spec` requires `organizationRef`; the avatar fields consumed by the sidecar are
`renderer`, `avatarModelUrl`, `visemeSet`, `defaultMood`, `defaultView`
(`resource-model.js:36`, threaded at `jitsi-agent-bridge.js:116-124`).

```yaml
apiVersion: kradle.a5c.ai/v1
kind: AgentAppearance
metadata:
  name: support-avatar
  namespace: kradle-org-acme
spec:
  organizationRef: acme
  renderer: talkinghead            # JITSI_AVATAR_RENDERER
  avatarModelUrl: https://cdn.acme.example/avatars/support.glb   # JITSI_AVATAR_MODEL_URL (operator-hosted, license-clean)
  visemeSet: oculus                # JITSI_AVATAR_VISEME_SET  (oculus | arkit)
  defaultMood: neutral             # JITSI_AVATAR_DEFAULT_MOOD
  defaultView: upper               # JITSI_AVATAR_DEFAULT_VIEW
```

### 2.2 AgentVoiceProfile (TTS identity)

`AgentVoiceProfile.spec` requires `organizationRef` + `ttsProvider` (`resource-model.js:37`); voice fields
flow to `JITSI_TTS_PROVIDER`/`JITSI_TTS_VOICE`/`JITSI_TTS_SPEED` (`adapters-client.js:128-133`).

```yaml
apiVersion: kradle.a5c.ai/v1
kind: AgentVoiceProfile
metadata:
  name: support-voice
  namespace: kradle-org-acme
spec:
  organizationRef: acme
  ttsProvider: azure               # JITSI_TTS_PROVIDER  (a real provider w/ creds in the model secret)
  ttsConfig:
    voice: en-US-JennyNeural       # JITSI_TTS_VOICE
    speed: "1.0"                    # JITSI_TTS_SPEED
```

> **Visemes** for lipsync (X1) are best driven by an Azure-style provider that emits `VisemeReceived`
> timing — the sidecar lipsync branch activates only when the TTS descriptor carries
> `visemes`+`vtimes` (`puppeteer-jitsi-client.js` publishAudio). A provider without visemes still
> publishes audio; the mouth just won't sync.

### 2.3 AgentStack (declare the video capability — G9)

The G9 validator (`agent-stack-controller.js:234-284`) requires, for a publishing avatar agent:
`jitsiCapability: true`, a `jitsiMeetingProviderRef`, `role: agent` (an **observer cannot publish video**,
`:250`), `capabilities.video: publish` **with** a resolvable `avatarRef` (`:252-259`), valid `tools` (subset
of the JITSI_TOOLS set, `:14-34`), and `governedTools ⊆ tools` (`:261`).

```yaml
apiVersion: kradle.a5c.ai/v1
kind: AgentStack
metadata:
  name: support-avatar-stack
  namespace: kradle-org-acme
spec:
  organizationRef: acme
  jitsiCapability: true
  jitsiMeetingProviderRef: default-jitsi      # REQUIRED — your JitsiMeetProvider
  jitsiConfig:
    role: agent
    avatarRef: support-avatar                  # -> AgentAppearance above
    capabilities:
      video: publish
      audio: both
      chat: write
      screenshare: send
    tools:
      - set_expression
      - play_gesture
      - set_posture
      - look_at
      - set_view
      - publish_video
      - draw_canvas
      - share_surface
      - send_video_metadata
    governedTools:                             # MUST be a subset of tools (G9) -> these route through G13
      - draw_canvas
      - share_surface
      - send_video_metadata
    tts:                                        # optional inline; AgentVoiceProfile via dispatch identity wins
      provider: azure
      voice: en-US-JennyNeural
```

Confirm the stack went **Ready**:

```bash
kubectl -n kradle-org-acme get agentstack support-avatar-stack -o jsonpath='{.status.conditions[?(@.type=="JitsiCapabilityReady")]}{"\n"}'
# expect: status:"True". If "False"/InvalidJitsiCapability, read .message — it lists the exact violation
# (observer-cannot-publish, avatarRef unresolved, governedTools⊄tools, unknown tool).
```

### 2.4 JitsiMeeting (the room)

`JitsiMeeting.spec`: `organizationRef`, `providerRef`, `roomId`, `displayName`, `ttlMinutes`,
`participants.invited`, `roomConfig` (`jitsi-meeting-controller.js:92-100`). Create via the BFF route so the
room URL + JWT signing path are exercised:

```bash
curl -sS -X POST "$KRADLE_WEB/api/orgs/acme/jitsi/meetings" \
  -H 'content-type: application/json' \
  -d '{"name":"support-demo","displayName":"Support demo","ttlMinutes":30,"providerRef":"default-jitsi"}'
# POST /api/orgs/[org]/jitsi/meetings -> createMeetingResource -> applyJitsiResource (meetings/route.js:17-25).
# roomId defaults to "<name>-<org>" if unset (jitsi-service.js:81). Note the returned meeting name (meetingRef).
```

### 2.5 Dispatch the agent into the meeting

```bash
curl -sS -X POST "$KRADLE_WEB/api/orgs/acme/agents/dispatch" \
  -H 'content-type: application/json' \
  -d '{"agentStack":"support-avatar-stack","meetingRef":"support-demo-acme","input":{"title":"Join and greet the room"}}'
# dispatch/route.js:7-54 -> controller.dispatchAgent({...meetingRef}) -> prepareMeetingContext
# (jitsi-agent-bridge.js:62-136) resolves avatar+voice and threads meetingContext -> createAgentJob.
```

This creates a `batch/v1` Job `kradle-agent-<runId>` in `kradle-org-acme` with the agent container **and**
the `jitsi-agent-sidecar` container (`adapters-client.js:546-577`, sidecar at `:102-158`). The sidecar gets
the full `JITSI_*` env (room/jwt/role + `JITSI_VIDEO_MODE=publish` + the `JITSI_AVATAR_*` + `JITSI_TTS_*`
vars) and an `agent-socket` emptyDir mounted at `/tmp` shared with the agent container; the MCP video tools
write to `AGENT_SOCKET_PATH=/tmp/jitsi-agent.sock` (`adapters-client.js:67,125,481`).

---

## 3. Verification checkpoints

### C1 — Job scheduled + both containers up
```bash
kubectl -n kradle-org-acme get job -l kradle.a5c.ai/component=agent-run
kubectl -n kradle-org-acme get pods -l kradle.a5c.ai/run=<runId>
# Both 'agent-run' and 'jitsi-agent-sidecar' containers should be Running (not ImagePullBackOff / CreateContainerConfigError).
```
**If the Job is missing entirely**, check the org-scope landmine (§4.1) and the controller logs.

### C2 — Sidecar joined the room
```bash
kubectl -n kradle-org-acme logs <pod> -c jitsi-agent-sidecar | grep -iE "connected|roomId|connect"
# bin/sidecar.mjs boots loadConfig -> createPuppeteerJitsiClient -> ipc.start() -> runtime.start()
# -> jitsi.connect(); runtime broadcasts {type:'connected', roomId, participants} (runtime.js:43-48).
```
Open the room URL (`.status.roomUrl`) in a browser as a human participant — you should see the agent
tile join.

### C3 — Avatar video + TTS audio published
- In the room, the agent tile should show the **rendered avatar** (not a black/fake tile) and you should
  **hear** TTS when the agent speaks. The video track is published via `captureStream → setEffect`
  (`src/browser/publish-effect.js`); audio via the shared Web-Audio graph.
- Inspect: `kubectl ... logs -c jitsi-agent-sidecar | grep -iE "avatar|kradleAvatarBoot|setEffect|publishAudio"`.
  A failed avatar boot is surfaced (not swallowed) on `window.__kradleAvatarBoot.error` and as
  `[kradle-avatar] avatar injection failed` (`puppeteer-jitsi-client.js`); a lipsync fault surfaces as
  `[kradle-avatar] lipsync publish failed` (no silent degrade-to-tone).

### C4 — Fast-path tools drive the avatar
Call the MCP video tools (via the agent loop or the kradle MCP server) and watch the tile:
```
kradle_set_expression { mood: "happy" }   # -> /tmp/jitsi-agent.sock action set_expression -> avatar.setMood
kradle_play_gesture   { gesture: "wave" }  # -> play_gesture -> avatar.playGesture
```
These are the **fast lane** — no governance, immediate (`mcp-server.js:644-659` → direct `{socketPath,command}`).

### C5 — Governed tool round-trip (G13, the key check)
```
kradle_share_surface { surface: "browser", url: "https://slides.example/deck" }
```
Expected sequence:
1. The MCP tool returns a **governance descriptor** (`governed:true`, `correlationId`, `filler`,
   `policy.decision:"require-approval"`, **no `command`**) — `mcp-server.js` `governedToolDescriptor`.
2. The bridge/driver creates a governed run; the agent speaks the `filler`; an **owner approval
   breakpoint** (`auth.share-surface`) is raised.
3. **Only after approval** does the run emit `{status:"approved", socketPath, command:{action:"share_surface",...}}`
   and the socket write reaches the sidecar → the surface composites into the video.
4. A **policy hard-deny** (e.g. `surface: "system"`) returns `denied` and **never** reaches the socket.
Confirm a denied/unapproved `share_surface` produces **no** visible surface change.

### C6 — JitsiMeeting.status populates
```bash
kubectl -n kradle-org-acme get jitsimeeting support-demo-acme -o jsonpath='{.status.media}{"\n"}{.status.session}{"\n"}{.status.governanceRuns}{"\n"}'
# media.agentTracks (published tracks), session.agents (the dispatched agent), governanceRuns (the G13 runs).
# NOTE: live governanceRuns population is itself a documented follow-up (G13 bridge live-pop) — if empty,
# that is the known residual, not a C5 failure; C5 is judged by the socket-write/approval behavior above.
```

### C7 — (optional) real noVNC / screen-share (G7)
Point `share_surface` at a **VNC websocket** (`url: "wss://<websockify-host>/..."`) backed by a live
websockify→VNC server. The sidecar lazily loads noVNC RFB and composites the desktop. (Headless verify only
ever used a synthetic source; this is the real-VNC residual.)

---

## 4. Known live landmines (check these first when something fails)

### 4.1 `withOrgScope` must not inject `organizationRef` into the Job
The dispatch Job is `batch/v1` (not a kradle CRD). `withOrgScope` skips non-`kradle.a5c.ai/*` resources
(`kubernetes-controller.js:378-384`); if a regression reintroduces injection, the Kubernetes strict decoder
rejects `spec.organizationRef` and **silently drops every Job** (the run exists, no Job appears). Symptom:
C1 shows a run but **no Job**. (Memory: this exact bug shipped once.)

### 4.2 `KRADLE_AGENT_IMAGE` must be in the controller/web pod env range
The agent image resolves to `config.image || process.env.KRADLE_AGENT_IMAGE || 'ghcr.io/a5c-ai/adapters:latest'`
(`adapters-client.js:514`). If the controller pod doesn't carry `KRADLE_AGENT_IMAGE`, the Job pulls the
public default — wrong/older harness. Symptom: agent behaves unexpectedly or `ImagePullBackOff`. Set it in
the **web-pod secret env**, not just your shell.

### 4.3 Workspace = `emptyDir`, not a PVC, on AKS
Per-run workspaces use `workspace.ephemeral:true` → `emptyDir` (`adapters-client.js:486-495`,
`agent-dispatch-controller.js:442-451`). On AKS the disk CSI provisioning timed out and left pods
**Pending**; emptyDir binds instantly. If you switch to `pvcName`, expect provisioning latency. Symptom:
pod stuck `Pending` with a volume-attach event.

### 4.4 Avatar is **required** for `video: publish` — fail-hard, no fallback
If `capabilities.video === 'publish'` and `avatarRef` doesn't resolve, validation/dispatch **throws**
(`agent-stack-controller.js:256-258`, `jitsi-agent-bridge.js:91-92`) — there is no silent fallback (repo
rule). Apply the `AgentAppearance` **before** the stack.

### 4.5 Model-provider Secret is `optional:false`
A missing `modelSecretName` Secret in `kradle-org-<org>` means the **agent** container never starts
(`adapters-client.js:508-510`). Symptom: `CreateContainerConfigError` on the agent container while the
sidecar may be Running.

### 4.6 claude-code adapter needs the proxy `apiBase`
If the agent adapter is claude-code over the gateway, the launcher must receive the transport endpoint
(`AGENT_MUX_TRANSPORT_ENDPOINT`, `adapters-client.js:471`) / `--api-base` — otherwise the launcher makes no
completion engine and 404s (memory: resolved). Verify the transport binding endpoint is threaded.

### 4.7 Headless Chromium + GPU
Old headless Chromium breaks `mediaDevices`/`captureStream` (design doc D.3). Use `--headless=new` and a
real/SwiftShader GPU; set `PUPPETEER_EXECUTABLE_PATH` or `CHROMIUM_PATH` (`config.js`). Symptom: avatar tile
black or no video track.

---

## 5. Pass / fail criteria

G0-RT **passes** when, in a live room: C1–C4 hold (Job up, sidecar joined, avatar A/V published, fast tools
visibly drive the avatar) **and** C5 holds (a governed `share_surface` is gated by an owner approval and the
socket write happens only on approval; a hard-deny never reaches the sidecar). C6 populating is desirable
but its `governanceRuns` live-population is a tracked follow-up; C7 (real noVNC) is optional.

Record the run: the `runId`, the Job name, the sidecar logs for C2/C3, a screenshot of the agent tile for
C3/C4, and the approval/deny outcomes for C5. File any failure against the specific landmine in §4.

---

## 6. After a green G0-RT

Flip the live-publish residuals in [`realtime-agent-gaps.md`](./realtime-agent-gaps.md): G1/G2/G3/G4
`live-publish pending` → done, G12 `governanceRuns` live-pop (if C6 populated), and note G0-RT verified with
the recorded evidence. The remaining open items are then only the larger follow-ups: the
`@a5c-ai/voice-adapter` TS/LiveKit package + MCP async-callback delivery, and G18 (LiveKit/SIP telephony).
