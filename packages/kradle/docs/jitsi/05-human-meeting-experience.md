# Jitsi Integration — Human Meeting Experience

## Meeting Lifecycle from the User's Perspective

### 1. Create a Meeting

From the meetings page (`/orgs/{org}/meetings`):

**Quick create** — single button, uses org defaults:
- Click "New Meeting" → room created immediately → redirected to meeting page with embedded Jitsi

**From template** — pick a template, customize:
- Select template (e.g., "Daily Standup") → pre-fills config → optionally invite agents → create

**Scheduled** — create for a future time:
- Set date/time, recurrence, invite list → CRD created with `status.phase: Scheduled`
- Kradle creates the room at the scheduled time
- Invited users receive notification (via NotificationBell component)

### 2. Join a Meeting

Three entry points:

**From meetings page:**
- Active meetings show a "Join" button → generates JWT → opens embedded Jitsi or new tab

**From notification:**
- Meeting invitation notification → click → join embedded meeting

**From agent run page:**
- If a dispatch run has a linked meeting → "Join Meeting" button on the run detail page
- Shows who's in the meeting (humans + agents)

### 3. Embedded Meeting View

The meeting detail page (`/orgs/{org}/meetings/{id}`) has the embedded Jitsi experience:

```
┌─────────────────────────────────────────────────────────┐
│  Meeting: Daily Standup — May 30                    [×] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │              Jitsi Meet iFrame                    │   │
│  │         (full Jitsi UI with video tiles,          │   │
│  │          chat, screen share, reactions)            │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─── Kradle Context Panel ──────────────────────────┐  │
│  │  Participants (5)           Recording: Active     │  │
│  │  ● Alice (moderator)       Duration: 12:34       │  │
│  │  ● Bob (participant)                              │  │
│  │  ● Agent: code-reviewer    Dispatch: run-abc123  │  │
│  │  ● Agent: standup-bot      Dispatch: run-def456  │  │
│  │  ○ Charlie (invited)                              │  │
│  │                                                    │  │
│  │  [Invite User] [Invite Agent] [Start Recording]   │  │
│  │  [End Meeting] [Share Link]                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Jitsi iFrame Integration

Use the [Jitsi Meet External API](https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/):

```javascript
// jitsi-embedded-meeting.jsx
'use client';
import { useEffect, useRef } from 'react';

export function EmbeddedMeeting({ roomUrl, jwt, displayName, onParticipantJoined, onParticipantLeft, onMeetingEnded }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const domain = new URL(roomUrl).hostname;
    const roomName = new URL(roomUrl).pathname.slice(1);

    const api = new window.JitsiMeetExternalAPI(domain, {
      roomName,
      jwt,
      parentNode: containerRef.current,
      userInfo: { displayName },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: true,
        toolbarButtons: [
          'microphone', 'camera', 'desktop', 'chat',
          'raisehand', 'tileview', 'hangup',
          'recording', 'participants-pane'
        ],
        prejoinConfig: { enabled: false }, // Skip prejoin for authenticated users
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_BRAND_WATERMARK: false,
        DEFAULT_BACKGROUND: '#0f172a',
      }
    });

    api.addEventListener('participantJoined', onParticipantJoined);
    api.addEventListener('participantLeft', onParticipantLeft);
    api.addEventListener('readyToClose', onMeetingEnded);

    apiRef.current = api;
    return () => { api.dispose(); };
  }, [roomUrl, jwt]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 500 }} />;
}
```

The Jitsi External API script is loaded from the Jitsi server:
```html
<script src="https://meet.kradle.local/external_api.js"></script>
```

### 4. Meeting Context Panel

Below or beside the Jitsi iframe, show kradle-specific context:

- **Participant list** with types (human/agent) and status
- **Agent dispatch links** — click agent name → go to dispatch run
- **Recording controls** — start/stop, view active recording
- **Meeting metadata** — template, org, duration, room config
- **Invite actions** — invite more users or agents mid-meeting
- **End meeting** — ends room, disconnects all participants, finalizes recording

### 5. Post-Meeting

After a meeting ends:
- JitsiMeeting CRD status updates to `phase: Ended`
- Recording is processed and stored (if Jibri was enabled)
- Transcript is extracted (if available)
- Meeting summary accessible from the recordings page
- Agent dispatch runs linked to the meeting show meeting context in their transcript

## Mobile / Responsive

The embedded Jitsi iframe is responsive — Jitsi Meet handles mobile layout internally. The kradle context panel should collapse below the iframe on narrow viewports.

## Deep Links

Support direct meeting links that work from outside the kradle console:
- `https://kradle.a5c.ai/orgs/{org}/meetings/{id}` — opens meeting page (auth required)
- `https://meet.kradle.local/{roomId}?jwt={token}` — direct Jitsi link (no kradle UI)
