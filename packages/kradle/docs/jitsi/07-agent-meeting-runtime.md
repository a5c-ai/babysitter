# Jitsi Integration — Agent Meeting Runtime

## The Jitsi Agent Sidecar

The sidecar is a container that runs alongside the agent container in the same K8s Pod. It handles all Jitsi communication so the agent itself doesn't need to know about WebRTC, XMPP, or audio processing.

### Sidecar Responsibilities

```
┌─────────────────────────────────────────────┐
│                 K8s Pod                      │
│                                              │
│  ┌──────────────┐    ┌──────────────────┐   │
│  │ Agent        │    │ Jitsi Sidecar    │   │
│  │ Container    │    │                  │   │
│  │              │    │ ┌──────────────┐ │   │
│  │ Claude Code  │◄──►│ │ Unix Socket  │ │   │
│  │ / Custom     │    │ │ IPC Server   │ │   │
│  │ Agent        │    │ └──────────────┘ │   │
│  │              │    │        │         │   │
│  │ Reads:       │    │ ┌──────▼───────┐ │   │
│  │ - transcript │    │ │ Headless     │ │   │
│  │ - partcpnts  │    │ │ Jitsi Client │ │   │
│  │ - chat msgs  │    │ │ (Puppeteer   │ │   │
│  │              │    │ │  or lib-jitsi)│ │   │
│  │ Writes:      │    │ └──────────────┘ │   │
│  │ - chat msgs  │    │        │         │   │
│  │ - reactions   │    │ ┌──────▼───────┐ │   │
│  │ - hand raise  │    │ │ Audio        │ │   │
│  │              │    │ │ Pipeline     │ │   │
│  │              │    │ │ (STT + TTS)  │ │   │
│  └──────────────┘    │ └──────────────┘ │   │
│         ▲            └──────────────────┘   │
│         │                     │              │
│    /tmp/jitsi-agent.sock      │              │
│    (shared emptyDir volume)   │              │
│                               ▼              │
│                        Jitsi Server          │
│                        (WebRTC/XMPP)         │
└─────────────────────────────────────────────┘
```

### IPC Protocol

The sidecar and agent communicate via a Unix domain socket at `/tmp/jitsi-agent.sock`. Protocol is newline-delimited JSON (NDJSON):

**Sidecar → Agent (events):**
```jsonl
{"type":"connected","roomId":"standup-20260530","participants":["alice","bob"]}
{"type":"transcript","speaker":"alice","text":"Good morning everyone. Let's start with updates.","timestamp":"2026-05-30T09:00:15Z"}
{"type":"chat","sender":"bob","text":"My PR is ready for review","timestamp":"2026-05-30T09:01:02Z"}
{"type":"participant_joined","name":"Charlie","id":"charlie-123","timestamp":"2026-05-30T09:01:30Z"}
{"type":"participant_left","name":"Charlie","id":"charlie-123","timestamp":"2026-05-30T09:15:00Z"}
{"type":"hand_raised","name":"alice","timestamp":"2026-05-30T09:02:00Z"}
{"type":"recording_started","timestamp":"2026-05-30T09:05:00Z"}
```

**Agent → Sidecar (commands):**
```jsonl
{"action":"send_chat","text":"Based on the discussion, I'll create a summary of the action items."}
{"action":"raise_hand"}
{"action":"lower_hand"}
{"action":"react","emoji":"thumbsup"}
{"action":"speak_tts","text":"I've reviewed the PR and found two issues in the auth module.","voice":"nova"}
{"action":"share_screen","url":"https://kradle.a5c.ai/orgs/default/agents/runs/run-abc123"}
{"action":"get_transcript"}
{"action":"get_participants"}
{"action":"disconnect","reason":"task_complete"}
```

### Sidecar Implementation Options

#### Option A: Puppeteer-based (recommended for v1)

Use headless Chromium + Puppeteer to join Jitsi as a browser participant:

```dockerfile
FROM node:22-slim
RUN apt-get update && apt-get install -y chromium
COPY sidecar/ /app/
WORKDIR /app
CMD ["node", "sidecar.js"]
```

Pros:
- Full Jitsi web client compatibility
- No custom XMPP implementation
- Supports all Jitsi features (chat, reactions, screen share)

Cons:
- Higher resource usage (Chromium process)
- ~500MB container image
- Audio processing requires PulseAudio or virtual audio device

#### Option B: lib-jitsi-meet (native client)

Use [lib-jitsi-meet](https://github.com/jitsi/lib-jitsi-meet) JavaScript library directly:

```javascript
import JitsiMeetJS from 'lib-jitsi-meet';

const connection = new JitsiMeetJS.JitsiConnection(null, jwt, {
  hosts: { domain, muc: `conference.${domain}` },
  serviceUrl: `wss://${domain}/xmpp-websocket`
});

connection.addEventListener('CONNECTION_ESTABLISHED', () => {
  const room = connection.initJitsiConference(roomName, {});
  room.on('MESSAGE_RECEIVED', (id, text) => { /* forward to agent */ });
  room.join();
});
```

Pros:
- Lightweight (~50MB image)
- Direct XMPP/WebRTC control
- Lower resource usage

Cons:
- No audio processing built-in (need separate STT/TTS)
- Must handle XMPP protocol details
- Fewer Jitsi features available

### Audio Pipeline

For agents that can listen and speak:

```
Jitsi Audio Stream (WebRTC)
    │
    ▼
┌─────────────────────┐
│ Audio Capture        │ Sidecar captures mixed audio
│ (Web Audio API or   │ from all participants
│  PulseAudio)        │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ Speech-to-Text (STT)│ Whisper API, Deepgram, or
│                      │ local Whisper model
└─────────────────────┘
    │
    ▼  transcript events → Unix socket → Agent
    │
    ▼  (Agent processes, decides to respond)
    │
    ▼  speak_tts command ← Unix socket ← Agent
    │
┌─────────────────────┐
│ Text-to-Speech (TTS)│ OpenAI TTS, ElevenLabs,
│                      │ or local Piper/Coqui
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ Audio Injection      │ Sidecar injects TTS audio
│ (Virtual Microphone) │ into the Jitsi audio track
└─────────────────────┘
    │
    ▼
Jitsi Meeting (other participants hear the agent)
```

### STT/TTS Configuration

```yaml
# In JitsiMeetProvider or AgentStack
spec:
  jitsiConfig:
    audioProcessing:
      sttProvider: whisper-api           # whisper-api | deepgram | local-whisper
      sttModel: whisper-1               # Model for STT
      ttsProvider: openai-tts            # openai-tts | elevenlabs | local-piper
      ttsVoice: nova                     # Voice for TTS
      ttsSpeed: 1.0
      vadSensitivity: 0.5               # Voice activity detection threshold
      silenceTimeoutMs: 2000             # Wait for speaker to finish
```

STT/TTS API keys can be provided via AgentSecretGrant resources.

## Container Resource Requirements

| Mode | CPU Request | CPU Limit | Memory Request | Memory Limit | Image Size |
|------|------------|-----------|----------------|--------------|------------|
| Chat-only (no audio) | 50m | 200m | 128Mi | 256Mi | ~100MB |
| Listen-only (STT) | 200m | 1000m | 256Mi | 1Gi | ~500MB |
| Listen + Speak (STT+TTS) | 500m | 2000m | 512Mi | 2Gi | ~600MB |
| Full (+ screen share) | 500m | 2000m | 1Gi | 4Gi | ~800MB |

## Sidecar Lifecycle

1. **Init**: Sidecar starts, connects to Jitsi room using JWT, opens Unix socket
2. **Connected**: Sends `connected` event to agent via socket. Begins streaming events.
3. **Active**: Relays transcripts, chat, participant events to agent. Accepts commands.
4. **Graceful shutdown**: Agent sends `disconnect` command, sidecar sends goodbye chat message, disconnects from Jitsi.
5. **Forced shutdown**: K8s terminates pod (SIGTERM) → sidecar disconnects immediately.

The sidecar respects the `preStop` lifecycle hook for graceful shutdown:
```yaml
lifecycle:
  preStop:
    exec:
      command: ["node", "graceful-leave.js"]
```

## Testing the Agent Meeting Flow

### Unit tests
- Sidecar IPC protocol parsing
- JWT generation with correct claims
- Agent dispatch with meetingRef correctly populates Job spec

### Integration tests
- Sidecar connects to a local Jitsi instance
- Agent receives transcript events via socket
- Agent sends chat message via socket → appears in Jitsi

### E2E tests
- Dispatch agent with meetingRef → agent appears in Jitsi room
- Human sends chat → agent receives and responds
- Agent speaks via TTS → audio reaches Jitsi
- Meeting ends → agent dispatch run completes
