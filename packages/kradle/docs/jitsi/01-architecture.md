# Jitsi Integration — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Kradle Cluster                                │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  Kradle Web   │───▶│  Kradle API   │───▶│  Kubernetes API      │  │
│  │  Console     │    │  Controller  │    │  (CRDs in etcd)      │  │
│  │              │    │              │    └──────────────────────┘  │
│  │  ┌────────┐  │    │  ┌────────┐  │                              │
│  │  │Embedded│  │    │  │Jitsi   │  │    ┌──────────────────────┐  │
│  │  │Jitsi   │  │    │  │Meeting │  │───▶│  Jitsi Meet Server   │  │
│  │  │iFrame  │  │    │  │Ctrl    │  │    │  (Prosody + JVB +    │  │
│  │  └────────┘  │    │  └────────┘  │    │   Jicofo + Web)      │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Agent Jobs (K8s)                           │  │
│  │                                                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ Agent Pod A  │  │ Agent Pod B  │  │ Agent Pod C  │          │  │
│  │  │             │  │             │  │             │          │  │
│  │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │          │  │
│  │  │ │Jitsi    │ │  │ │Jitsi    │ │  │ │Claude   │ │          │  │
│  │  │ │Headless │ │  │ │Headless │ │  │ │Code     │ │          │  │
│  │  │ │Client   │ │  │ │Client   │ │  │ │(no mtg) │ │          │  │
│  │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

### Jitsi Meeting Controller (`jitsi-meeting-controller.js`)

| Owns | Delegates To | Must Not Own |
|------|-------------|-------------|
| Meeting lifecycle (create, join, end) | resource-model (CRD validation) | Jitsi server deployment |
| Participant tracking | event-bus (meeting events) | Audio/video transcoding |
| Recording management | external sync controller (state sync) | Authentication against Jitsi |
| JWT token generation for rooms | agent-dispatch-controller (agent attendance) | Jitsi internal configuration |
| Room template resolution | kubernetes-controller (CRD persistence) | Network topology |

### Jitsi Sync Controller (`jitsi-sync-controller.js`)

Follows the external sync controller pattern:
- Polls or receives webhooks from Jitsi server
- Normalizes events into CRD updates (JitsiMeeting status, participant count, recording status)
- Updates watermarks for incremental sync
- Detects drift between CRD desired state and Jitsi actual state

### Jitsi Agent Bridge (`jitsi-agent-bridge.js`)

New component — bridges agent dispatch with Jitsi participation:
- When an agent stack has `jitsiCapability: true`, dispatch creates a meeting-aware container
- Injects Jitsi connection environment variables into agent Job pods
- Monitors agent participation events (joined, spoke, left)
- Feeds meeting transcript into agent context

## CRD Resource Hierarchy

```
JitsiMeetProvider (cluster-scoped config)
  └── JitsiMeetingTemplate (reusable meeting configs)
        └── JitsiMeeting (active meeting instance)
              ├── JitsiParticipant (human or agent participant)
              └── JitsiRecording (recording of a meeting)
```

## Authentication Model

Jitsi supports JWT-based authentication. Kradle generates short-lived JWTs for:
- **Human users** — signed with user identity from kradle session, scoped to specific room
- **Agent participants** — signed with agent identity from dispatch run, scoped to specific room + time window
- **Admin operations** — signed with org-level admin claims for room management

JWT claims follow the Jitsi JWT spec:
```json
{
  "aud": "jitsi",
  "iss": "kradle",
  "sub": "meet.kradle.local",
  "room": "room-name",
  "exp": 1234567890,
  "context": {
    "user": {
      "name": "Agent: code-reviewer",
      "email": "agent@kradle.a5c.ai",
      "avatar": "",
      "id": "agent-dispatch-run-id"
    },
    "features": {
      "recording": true,
      "livestreaming": false
    }
  }
}
```

## Data Flow: Agent Joins Meeting

```
1. User creates JitsiMeeting CRD (or meeting auto-created by dispatch)
2. Jitsi Meeting Controller reconciles → creates room on Jitsi server
3. User dispatches agent with meetingRef
4. Agent Dispatch Controller:
   a. Creates AgentDispatchRun as normal
   b. Detects meetingRef → calls Jitsi Meeting Controller for JWT
   c. Injects JITSI_ROOM_URL, JITSI_JWT, JITSI_ROOM_ID into Job env
5. Agent Adapter Client creates K8s Job with Jitsi sidecar container
6. Sidecar connects to Jitsi room via headless client
7. Agent main container receives meeting audio/text via local socket
8. Agent processes and responds through the socket → sidecar sends to Jitsi
9. Meeting events (joined, spoke, left) emitted to event bus
10. Jitsi Sync Controller updates JitsiMeeting status with participant list
```

## Integration with Existing Systems

| System | Integration Point |
|--------|------------------|
| Agent Stack | New `jitsiCapability` field + `jitsiMeetingProviderRef` |
| Agent Dispatch | Inject Jitsi env vars when meeting-aware stack |
| Agent Adapter Client | Add Jitsi sidecar container spec to Job manifest |
| Event Bus | New event types: `meeting-created`, `participant-joined`, `participant-left`, `recording-started` |
| External Sync | JitsiSyncController follows sync-controller pattern |
| Approval Controller | Optional approval gate for agent meeting participation |
| Virtual Model Hooks | New hook types: `onMeetingJoin`, `onMeetingMessage`, `onMeetingEnd` |
| MCP Server | New tools: `kradle_create_meeting`, `kradle_join_meeting`, `kradle_list_meetings` |
