# Jitsi Integration — Web Management

## New Pages

### Sidebar Navigation

Add under a new "Meetings" section in `orgNavigationGroups`:

```javascript
{
  title: 'Meetings',
  items: [
    ['/meetings', 'Meetings', 'Create and join video meetings'],
    ['/meetings/templates', 'Templates', 'Reusable meeting configurations'],
    ['/meetings/recordings', 'Recordings', 'Meeting recordings and transcripts'],
  ]
}
```

### Page Structure

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/orgs/[org]/meetings` | MeetingsPage | List active + recent meetings, create new |
| `/orgs/[org]/meetings/[id]` | MeetingDetailPage | Meeting detail with embedded Jitsi + participants |
| `/orgs/[org]/meetings/new` | CreateMeetingPage | Create meeting from template or ad-hoc |
| `/orgs/[org]/meetings/templates` | MeetingTemplatesPage | List + CRUD for JitsiMeetingTemplate |
| `/orgs/[org]/meetings/templates/[id]` | MeetingTemplateDetailPage | Template detail + edit |
| `/orgs/[org]/meetings/recordings` | RecordingsPage | List recordings with playback + transcript |
| `/orgs/[org]/meetings/recordings/[id]` | RecordingDetailPage | Recording playback + transcript view |

### Settings Integration

Add Jitsi configuration to the existing settings page (`/orgs/[org]/settings`):

```javascript
// New settings section
{
  title: 'Meetings (Jitsi)',
  fields: [
    { name: 'jitsiProvider', label: 'Jitsi Provider', type: 'select' },
    { name: 'defaultRoomTTL', label: 'Default room TTL (minutes)', type: 'number' },
    { name: 'autoRecord', label: 'Auto-record meetings', type: 'checkbox' },
    { name: 'lobbyEnabled', label: 'Enable lobby for all rooms', type: 'checkbox' },
    { name: 'maxAgentsPerRoom', label: 'Max agents per room', type: 'number' },
    { name: 'agentAutoJoin', label: 'Agents auto-join meetings', type: 'checkbox' },
  ]
}
```

## API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/orgs/[org]/jitsi/providers` | GET, POST | List/create JitsiMeetProvider |
| `/api/orgs/[org]/jitsi/providers/[name]` | GET, PATCH, DELETE | Get/update/delete provider |
| `/api/orgs/[org]/jitsi/meetings` | GET, POST | List/create JitsiMeeting |
| `/api/orgs/[org]/jitsi/meetings/[id]` | GET, PATCH, DELETE | Get/update/end meeting |
| `/api/orgs/[org]/jitsi/meetings/[id]/join` | POST | Generate JWT + room URL for joining |
| `/api/orgs/[org]/jitsi/meetings/[id]/invite` | POST | Invite participant (user or agent) |
| `/api/orgs/[org]/jitsi/meetings/[id]/record` | POST | Start/stop recording |
| `/api/orgs/[org]/jitsi/templates` | GET, POST | List/create JitsiMeetingTemplate |
| `/api/orgs/[org]/jitsi/templates/[id]` | GET, PATCH, DELETE | Get/update/delete template |
| `/api/orgs/[org]/jitsi/recordings` | GET | List recordings |
| `/api/orgs/[org]/jitsi/recordings/[id]` | GET, DELETE | Get/delete recording |
| `/api/orgs/[org]/jitsi/webhooks/ingest` | POST | Receive Jitsi server webhooks |

All routes except webhooks/ingest use `withAuth` middleware.

## Component Structure

```
app/components/jitsi/
  ├── jitsi-meeting-manager.jsx       # Main meeting list + tabs
  ├── jitsi-meeting-card.jsx          # Meeting card in list
  ├── jitsi-create-meeting-form.jsx   # Create meeting form
  ├── jitsi-template-form.jsx         # Template create/edit form
  ├── jitsi-participant-list.jsx      # Participant list with status
  ├── jitsi-recording-list.jsx        # Recording list with playback
  ├── jitsi-embedded-meeting.jsx      # Embedded Jitsi iframe
  ├── jitsi-meeting-controls.jsx      # Meeting controls (mute, record, invite)
  └── jitsi-provider-config.jsx       # Provider configuration form
```

## MCP Server Tools

Add to `cli/src/mcp-server.js`:

```javascript
{
  name: 'kradle_create_meeting',
  description: 'Create a Jitsi meeting room',
  inputSchema: {
    type: 'object',
    properties: {
      displayName: { type: 'string' },
      templateRef: { type: 'string' },
      ttlMinutes: { type: 'number' },
      inviteAgentStacks: { type: 'array', items: { type: 'string' } }
    },
    required: ['displayName']
  }
},
{
  name: 'kradle_join_meeting',
  description: 'Get a JWT and URL to join an active Jitsi meeting',
  inputSchema: {
    type: 'object',
    properties: {
      meetingRef: { type: 'string' }
    },
    required: ['meetingRef']
  }
},
{
  name: 'kradle_list_meetings',
  description: 'List active and recent Jitsi meetings',
  inputSchema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['active', 'ended', 'all'] }
    }
  }
},
{
  name: 'kradle_invite_to_meeting',
  description: 'Invite a user or agent to an active Jitsi meeting',
  inputSchema: {
    type: 'object',
    properties: {
      meetingRef: { type: 'string' },
      participantType: { type: 'string', enum: ['user', 'agentStack'] },
      participantRef: { type: 'string' }
    },
    required: ['meetingRef', 'participantType', 'participantRef']
  }
}
```
