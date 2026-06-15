# Jitsi Integration — Agent Meeting Participation

## Agent Stack Configuration

### New Fields on AgentStack

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: AgentStack
metadata:
  name: standup-summarizer
spec:
  organizationRef: default
  baseAgent: claude-code
  adapter: subprocess
  provider: anthropic
  model: claude-sonnet-4-6

  # --- New Jitsi fields ---
  jitsiCapability: true                    # Agent can attend meetings
  jitsiMeetingProviderRef: jitsi-prod      # Which Jitsi deployment
  jitsiConfig:
    participantName: "Standup Bot"         # Display name in meeting
    role: observer                         # observer | participant | moderator
    capabilities:
      audio: listen                        # listen | speak | both | none
      video: none                          # display | none
      chat: readwrite                      # read | readwrite | none
      screenshare: none                    # share | view | none
    autoJoin: true                         # Join when dispatched with meetingRef
    autoLeave: true                        # Leave when dispatch run completes
    contextInjection:
      - meetingTranscript                  # Inject live transcript into agent context
      - participantList                    # Inject current participants
      - meetingAgenda                      # Inject agenda from template
    tools:
      - kradle_send_chat_message            # Send messages to Jitsi chat
      - kradle_raise_hand                   # Raise hand in meeting
      - kradle_share_screen                 # Share screen (if capability allows)
      - kradle_get_meeting_transcript       # Read current transcript
      - kradle_invite_to_meeting            # Invite another participant
```

### Agent Stack Validation

`agent-stack-controller.js` validates:
- If `jitsiCapability: true`, `jitsiMeetingProviderRef` must reference a valid JitsiMeetProvider
- `role` must be one of: `observer`, `participant`, `moderator`
- Audio/video capabilities must be compatible with role (observers can't speak)
- `tools` listed must be valid Jitsi MCP tools

## Dispatch Flow with Meeting

### Manual Dispatch with Meeting

User clicks "Dispatch" on a Jitsi-capable stack:
1. Dispatch form shows additional "Meeting" field
2. User can select an active meeting or create a new one
3. Dispatch creates `AgentDispatchRun` with `spec.meetingRef`

### Auto-Dispatch from Meeting

When a meeting starts (via template with `agentConfig.autoJoin: true`):
1. JitsiMeetingController detects meeting start
2. For each agent in `participants.autoInvite` with `type: agentStack`:
   - Calls `agentDispatchController.createManualDispatch()` with `meetingRef`
   - Agent joins the meeting automatically

### Dispatch Controller Changes

In `agent-dispatch-controller.js`, add meeting awareness:

```javascript
async function createManualDispatch({ agentStack, meetingRef, ...rest }) {
  const stack = await resolveStack(agentStack);

  // If meetingRef is provided AND stack has jitsiCapability
  if (meetingRef && stack.spec?.jitsiCapability) {
    const meeting = await jitsiMeetingController.getMeeting(meetingRef);
    if (!meeting || meeting.status?.phase !== 'Active') {
      throw new Error(`Meeting ${meetingRef} is not active`);
    }

    // Generate participant JWT for the agent
    const jwt = jitsiMeetingController.generateParticipantJwt(
      meeting.spec.roomId,
      {
        name: stack.spec.jitsiConfig?.participantName || stack.metadata.name,
        type: 'agent',
        id: runId,
      },
      meeting.spec.ttlMinutes || 120
    );

    // Add to dispatch run spec
    run.spec.meetingRef = meetingRef;
    run.spec.meetingContext = {
      roomUrl: meeting.status.roomUrl,
      roomId: meeting.spec.roomId,
      jwt,
      role: stack.spec.jitsiConfig?.role || 'observer',
      capabilities: stack.spec.jitsiConfig?.capabilities || {},
    };
  }

  // Continue normal dispatch flow...
}
```

### Agent Adapter Client Changes

In `adapters-client.js`, add Jitsi sidecar to Job spec:

```javascript
function createAgentJob({ run, stack, workspace, namespace }) {
  const containers = [mainAgentContainer(run, stack, workspace)];

  // Add Jitsi sidecar if meeting context exists
  if (run.spec.meetingContext) {
    containers.push({
      name: 'jitsi-agent-sidecar',
      image: values.jitsi.kradle.agentSidecarImage,
      env: [
        { name: 'JITSI_ROOM_URL', value: run.spec.meetingContext.roomUrl },
        { name: 'JITSI_JWT', value: run.spec.meetingContext.jwt },
        { name: 'JITSI_ROOM_ID', value: run.spec.meetingContext.roomId },
        { name: 'JITSI_PARTICIPANT_NAME', value: stack.spec.jitsiConfig?.participantName },
        { name: 'JITSI_PARTICIPANT_ROLE', value: run.spec.meetingContext.role },
        { name: 'JITSI_AUDIO_MODE', value: run.spec.meetingContext.capabilities?.audio || 'listen' },
        { name: 'JITSI_CHAT_MODE', value: run.spec.meetingContext.capabilities?.chat || 'read' },
        { name: 'AGENT_SOCKET_PATH', value: '/tmp/jitsi-agent.sock' },
      ],
      volumeMounts: [
        { name: 'agent-socket', mountPath: '/tmp' },
      ],
      resources: {
        requests: { cpu: '100m', memory: '256Mi' },
        limits: { cpu: '500m', memory: '512Mi' },
      },
    });

    // Add shared volume for IPC between agent and sidecar
    job.spec.template.spec.volumes.push({
      name: 'agent-socket',
      emptyDir: {},
    });

    // Add sidecar env to main container
    mainContainer.env.push(
      { name: 'JITSI_AGENT_SOCKET', value: '/tmp/jitsi-agent.sock' },
      { name: 'JITSI_MEETING_ACTIVE', value: 'true' },
    );
  }

  return job;
}
```

## Agent-Specific MCP Tools

New tools available to agents during meeting-aware dispatch:

| Tool | Description | Available When |
|------|-------------|---------------|
| `kradle_send_chat_message` | Send a text message to the Jitsi meeting chat | `chat: readwrite` |
| `kradle_get_meeting_transcript` | Get the current live transcript of the meeting | Always |
| `kradle_get_participant_list` | Get current participants with status | Always |
| `kradle_raise_hand` | Raise/lower hand in the meeting | `role: participant` or `moderator` |
| `kradle_share_screen` | Share the agent's terminal/output as screen | `screenshare: share` |
| `kradle_invite_to_meeting` | Invite another user or agent to the meeting | `role: moderator` |
| `kradle_start_recording` | Start recording the meeting | `role: moderator` |
| `kradle_react` | Send a reaction (thumbs up, etc.) | Always |

## Event Flow

```
Meeting Active
  │
  ├─ Agent dispatched with meetingRef
  │   └─ K8s Job created with sidecar
  │       └─ Sidecar connects to Jitsi room
  │           ├─ participant-joined event → Kradle event bus
  │           ├─ Audio stream → STT → text → agent context
  │           ├─ Chat messages → agent context
  │           └─ Agent responses → sidecar → Jitsi chat/audio
  │
  ├─ Meeting events flow:
  │   ├─ meeting.participant.joined  → update JitsiMeeting status
  │   ├─ meeting.participant.left    → update JitsiMeeting status
  │   ├─ meeting.chat.message        → log to transcript
  │   ├─ meeting.agent.spoke         → log to transcript
  │   └─ meeting.recording.started   → create JitsiRecording CRD
  │
  └─ Agent dispatch completes
      └─ Sidecar disconnects from Jitsi
          └─ participant-left event → Kradle event bus
```
