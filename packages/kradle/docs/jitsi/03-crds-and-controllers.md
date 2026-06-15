# Jitsi Integration — CRDs and Controllers

## New Resource Kinds

Add to `resource-model.js` RESOURCE_DEFINITIONS:

### JitsiMeetProvider

Represents a Jitsi deployment (in-cluster or external) that kradle manages.

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: JitsiMeetProvider
metadata:
  name: jitsi-prod
spec:
  organizationRef: default
  endpoint: https://meet.kradle.local     # Jitsi web URL
  internalEndpoint: http://jitsi-web.kradle-system.svc  # In-cluster URL
  authMode: jwt                          # jwt | anonymous | ldap
  jwtConfig:
    appId: kradle
    secretRef: jitsi-jwt-secret          # K8s Secret with appSecret
    issuer: kradle
    audience: jitsi
  prosodyAdminUrl: http://jitsi-prosody:5280  # Prosody HTTP admin
  webhookEndpoint: /api/orgs/{org}/jitsi/webhooks/ingest
  deploymentMode: internal               # internal (Helm) | external
  features:
    recording: true
    livestreaming: false
    lobbyEnabled: true
    breakoutRooms: true
    maxParticipants: 100
  defaultRoomConfig:
    ttlMinutes: 120
    startWithAudioMuted: true
    startWithVideoMuted: false
    requireDisplayName: true
status:
  phase: Ready                           # Pending | Ready | Error | Degraded
  endpoint: https://meet.kradle.local
  version: "2.0.9258"
  connectedAt: "2026-05-30T12:00:00Z"
  activeRooms: 3
  totalParticipants: 12
```

**RESOURCE_DEFINITIONS entry:**
```javascript
JitsiMeetProvider: {
  storage: 'etcd',
  context: 'external-backends',
  plural: 'jitsimeetproviders',
  purpose: 'Jitsi Meet deployment endpoint with JWT auth, recording, and room lifecycle configuration',
  requiredSpec: ['organizationRef', 'endpoint', 'authMode']
}
```

### JitsiMeetingTemplate

Reusable meeting configuration (like AgentStack is to AgentDispatchRun).

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: JitsiMeetingTemplate
metadata:
  name: standup-template
spec:
  organizationRef: default
  providerRef: jitsi-prod
  displayName: "Daily Standup"
  roomNameTemplate: "standup-{{date}}-{{org}}"
  ttlMinutes: 30
  schedule:
    cron: "0 9 * * 1-5"                  # Weekdays at 9am
    timezone: America/New_York
  participants:
    autoInvite:
      - type: user
        ref: alice
      - type: agentStack
        ref: standup-summarizer
  roomConfig:
    startWithAudioMuted: false
    startWithVideoMuted: true
    lobbyEnabled: false
    requireDisplayName: true
    maxParticipants: 20
  agentConfig:
    autoJoin: true                        # Agents join when meeting starts
    autoLeave: true                       # Agents leave when meeting ends
    contextLabels:
      - meeting-started
      - participants-list
      - meeting-agenda
  recording:
    autoRecord: false
    storageRef: recording-bucket
status:
  phase: Active
  nextScheduledAt: "2026-05-31T09:00:00Z"
  lastMeetingRef: standup-2026-05-30
```

**RESOURCE_DEFINITIONS entry:**
```javascript
JitsiMeetingTemplate: {
  storage: 'etcd',
  context: 'agents',
  plural: 'jitsimeetingtemplates',
  purpose: 'Reusable Jitsi meeting configuration with scheduling, auto-invite, and agent participation settings',
  requiredSpec: ['organizationRef', 'providerRef', 'displayName']
}
```

### JitsiMeeting

Active or completed meeting instance.

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: JitsiMeeting
metadata:
  name: standup-2026-05-30
spec:
  organizationRef: default
  providerRef: jitsi-prod
  templateRef: standup-template          # Optional — can be ad-hoc
  roomId: standup-20260530-default
  displayName: "Daily Standup — May 30"
  dispatchRunRef: run-abc123             # If tied to a dispatch run
  ttlMinutes: 30
  participants:
    invited:
      - type: user
        ref: alice
        role: moderator
      - type: user
        ref: bob
        role: participant
      - type: agentStack
        ref: standup-summarizer
        role: observer
  roomConfig:
    startWithAudioMuted: false
    password: ""                         # Optional room password
status:
  phase: Active                          # Scheduled | Active | Ended | Failed
  roomUrl: https://meet.kradle.local/standup-20260530-default
  jwtToken: "<short-lived-jwt>"          # For joining
  startedAt: "2026-05-30T09:00:00Z"
  endedAt: null
  duration: null
  participants:
    current:
      - id: alice
        type: user
        joinedAt: "2026-05-30T09:00:05Z"
        audioMuted: false
        videoMuted: true
      - id: standup-summarizer
        type: agent
        joinedAt: "2026-05-30T09:00:08Z"
        dispatchRunRef: run-abc123
    total: 2
    peak: 5
  recording:
    active: false
    recordingId: null
```

**RESOURCE_DEFINITIONS entry:**
```javascript
JitsiMeeting: {
  storage: 'postgres',
  context: 'agents',
  plural: 'jitsimeetings',
  purpose: 'Active or completed Jitsi meeting with participant tracking, recording state, and agent dispatch binding',
  requiredSpec: ['organizationRef', 'providerRef', 'roomId']
}
```

### JitsiRecording

Recording artifact from a meeting.

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: JitsiRecording
metadata:
  name: rec-standup-2026-05-30
spec:
  organizationRef: default
  meetingRef: standup-2026-05-30
  providerRef: jitsi-prod
  format: mp4
  storageRef: recording-bucket
status:
  phase: Completed                       # Recording | Processing | Completed | Failed
  startedAt: "2026-05-30T09:05:00Z"
  endedAt: "2026-05-30T09:28:00Z"
  duration: 1380
  sizeBytes: 52428800
  storageUrl: s3://recordings/rec-standup-2026-05-30.mp4
  transcript:
    available: true
    language: en
    wordCount: 4200
```

**RESOURCE_DEFINITIONS entry:**
```javascript
JitsiRecording: {
  storage: 'postgres',
  context: 'agents',
  plural: 'jitsirecordings',
  purpose: 'Recording artifact from a Jitsi meeting with storage reference, transcript, and duration metadata',
  requiredSpec: ['organizationRef', 'meetingRef', 'providerRef']
}
```

## Controllers

### jitsi-meeting-controller.js

```javascript
export function createJitsiMeetingController(options = {}) {
  const { resourceGateway, eventBus, jwtSecret } = options;

  return {
    role: 'jitsi-meeting-controller',

    // Validate a JitsiMeeting resource before persistence
    validate(resource) { },

    // Create a room on the Jitsi server
    async createRoom(meetingSpec) { },

    // End a room on the Jitsi server
    async endRoom(roomId) { },

    // Generate a JWT for a participant to join a room
    generateParticipantJwt(roomId, participant, ttlMinutes) { },

    // Reconcile: ensure CRD state matches Jitsi server state
    async reconcile(meeting) { },

    // List active meetings for an org
    async listActiveMeetings(organizationRef) { },

    // Get meeting stats from Jitsi server
    async getMeetingStats(roomId) { },

    // Start recording
    async startRecording(meetingRef) { },

    // Stop recording
    async stopRecording(meetingRef) { },
  };
}
```

### jitsi-sync-controller.js

Follows the `external/sync-controller.js` pattern:

```javascript
export function createJitsiSyncController(options = {}) {
  const { persistFn, eventBus } = options;

  return {
    // Normalize a Jitsi webhook event into a canonical form
    normalizeEvent(rawWebhookPayload) { },

    // Sync room state from Jitsi → CRD
    async syncRoom(roomId, jitsiState) { },

    // Sync participant events
    async syncParticipant(roomId, participantEvent) { },

    // Update watermark after successful sync
    updateWatermark(providerRef, timestamp) { },
  };
}
```

### jitsi-agent-bridge.js

Bridges agent dispatch with Jitsi participation:

```javascript
export function createJitsiAgentBridge(options = {}) {
  const { meetingController, dispatchController } = options;

  return {
    // Check if an agent stack has meeting capability
    hasMeetingCapability(stack) { },

    // Prepare meeting context for agent dispatch
    async prepareMeetingContext(dispatchRun, meetingRef) { },

    // Generate sidecar container spec for agent Job
    buildSidecarSpec(meetingUrl, jwt, agentName) { },

    // Handle agent join/leave events
    async onAgentJoined(dispatchRunRef, meetingRef) { },
    async onAgentLeft(dispatchRunRef, meetingRef, reason) { },
  };
}
```

## Webhook Ingest

New API route: `/api/orgs/[org]/jitsi/webhooks/ingest`

Receives events from Jitsi Prosody and delegates to the sync controller:
- `room-created` → create JitsiMeeting CRD if not exists
- `room-destroyed` → update JitsiMeeting status to Ended
- `participant-joined` → update participant list
- `participant-left` → update participant list
- `recording-started` → create JitsiRecording CRD
- `recording-stopped` → update JitsiRecording status

Webhook signature validation using `jitsi.kradle.webhookSecret`.
