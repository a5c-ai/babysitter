# Agent Identity — Web Experience

## New Pages

### Agent Directory (`/orgs/{org}/agents/directory`)

A gallery/directory of all defined agents in the organization. This is the primary page for discovering and managing agents.

```
┌─────────────────────────────────────────────────────────┐
│  Agent Directory                          [+ New Agent] │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  🔍      │  │  📝      │  │  🛡️      │              │
│  │  Aria    │  │  Max     │  │  Scout   │              │
│  │          │  │          │  │          │              │
│  │ Sr. Code │  │ Tech     │  │ Security │              │
│  │ Reviewer │  │ Writer   │  │ Auditor  │              │
│  │          │  │          │  │          │              │
│  │ 47 runs  │  │ 23 runs  │  │ 12 runs  │              │
│  │ 4.6 avg  │  │ 4.8 avg  │  │ 4.2 avg  │              │
│  │          │  │          │  │          │              │
│  │ [View]   │  │ [View]   │  │ [View]   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│  ┌──────────┐  ┌──────────┐                             │
│  │  🤖      │  │  📊      │                             │
│  │ Standup  │  │ Data     │                             │
│  │ Bot      │  │ Analyst  │                             │
│  │          │  │          │                             │
│  │ Meeting  │  │ Report   │                             │
│  │ Summ.    │  │ Gen.     │                             │
│  │          │  │          │                             │
│  │ 89 mtgs  │  │ 5 runs   │                             │
│  └──────────┘  └──────────┘                             │
└─────────────────────────────────────────────────────────┘
```

Each card shows:
- Avatar (from AgentAppearance)
- Display name and tagline (from AgentPersona)
- Role title (from AgentPersona.role)
- Run count and average rating (from AgentDefinition.status)
- Meeting count (if Jitsi-capable)

### Agent Profile Page (`/orgs/{org}/agents/directory/{name}`)

Full agent profile — the "about me" page for an agent.

```
┌─────────────────────────────────────────────────────────┐
│  ◀ Back to Directory                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐  Aria                                      │
│  │         │  Senior Code Reviewer                      │
│  │  Avatar │  Security & Code Quality                   │
│  │         │                                            │
│  └─────────┘  ● Active  |  47 runs  |  4.6 rating      │
│               Claude Sonnet 4.6 on claude-code adapter  │
│                                                         │
│  ┌─── Soul ──────────────────────────────────────────┐  │
│  │  I am Aria, a senior code reviewer at a5c.ai...   │  │
│  │  [View full soul document]  [Edit]                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─── Personality ───────────────────────────────────┐  │
│  │  Style: Direct  |  Tone: Professional             │  │
│  │  Depth: Thorough  |  Humor: Occasional            │  │
│  │  Traits: assertive, detail-oriented, empathetic   │  │
│  │  [Edit]                                           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─── Skills ────────────────────────────────────────┐  │
│  │  security-review  |  performance-audit            │  │
│  │  dependency-check  |  test-coverage-analysis      │  │
│  │  [Manage Skills]                                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─── Deployments (AgentDefinitions) ────────────────┐  │
│  │  aria-code-reviewer → claude-sonnet-security      │  │
│  │  aria-deep-audit → claude-opus-security            │  │
│  │  [Add Deployment]                                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─── Appearance ────────────────────────────────────┐  │
│  │  [Avatar Preview]  Primary: #7c3aed               │  │
│  │  Badge: "Security"  Emoji: 🔍                     │  │
│  │  [Upload Avatar]  [Generate]  [Edit]              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─── Voice ─────────────────────────────────────────┐  │
│  │  Provider: OpenAI TTS  |  Voice: Nova             │  │
│  │  Speed: 1.0  |  Pacing: Moderate                  │  │
│  │  [Preview Voice]  [Edit]                          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─── Recent Activity ───────────────────────────────┐  │
│  │  run-abc123  PR review on auth-module    2h ago   │  │
│  │  run-def456  Security scan on api-routes 5h ago   │  │
│  │  mtg-ghi789  Security standup            1d ago   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Create Agent Wizard (`/orgs/{org}/agents/directory/new`)

Multi-step wizard for creating a complete agent:

**Step 1: Identity** — Name, tagline, role, domain, emoji
**Step 2: Soul** — Write or paste soul.md content, choose traits
**Step 3: Skills** — Select from available AgentSkill resources
**Step 4: Appearance** — Upload avatar or generate one, pick colors
**Step 5: Voice** — Select TTS provider/voice, preview, adjust
**Step 6: Infrastructure** — Pick or create an AgentStack to bind to
**Step 7: Review** — Summary of all settings, create

The wizard creates: AgentPersona + AgentSoul + AgentAppearance + AgentVoiceProfile + AgentDefinition in a single transaction.

## Component Structure

```
app/components/agent/
  ├── agent-directory.jsx           # Grid of agent cards
  ├── agent-profile-card.jsx        # Individual agent card
  ├── agent-profile-page.jsx        # Full profile page
  ├── agent-persona-editor.jsx      # Inline persona editing
  ├── agent-soul-editor.jsx         # Soul document editor (markdown)
  ├── agent-appearance-editor.jsx   # Avatar upload/generate, colors
  ├── agent-voice-editor.jsx        # Voice config + preview
  ├── agent-definition-form.jsx     # Bind persona to stack
  ├── agent-create-wizard.jsx       # Multi-step creation wizard
  └── agent-personality-traits.jsx  # Trait selector component
```

## Persona in Existing UI

Agent identity should appear wherever agents are referenced:

### Dispatch Button
Currently shows stack names. After: shows agent persona names with avatars.

### Run List
Currently shows `spec.agentStack`. After: shows persona display name + avatar + role.

### Session Detail
Currently shows stack name. After: shows full agent identity in header.

### Meeting Participant List
Shows persona avatar, display name, role, and voice indicator.

### Notification Bell
"Aria completed security review on auth-module" instead of "claude-sonnet-security completed run-abc123".

### Command Palette
`Dispatch Aria for code review` instead of `Dispatch claude-sonnet-security`.

## API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/orgs/[org]/agents/personas` | GET, POST | List/create AgentPersona |
| `/api/orgs/[org]/agents/personas/[name]` | GET, PATCH, DELETE | CRUD on persona |
| `/api/orgs/[org]/agents/souls/[name]` | GET, PATCH | Get/update soul document |
| `/api/orgs/[org]/agents/appearances/[name]` | GET, PATCH | Get/update appearance |
| `/api/orgs/[org]/agents/appearances/[name]/avatar` | POST | Upload avatar image |
| `/api/orgs/[org]/agents/voices/[name]` | GET, PATCH | Get/update voice profile |
| `/api/orgs/[org]/agents/voices/[name]/preview` | POST | Generate TTS preview audio |
| `/api/orgs/[org]/agents/definitions` | GET, POST | List/create AgentDefinition |
| `/api/orgs/[org]/agents/definitions/[name]` | GET, PATCH, DELETE | CRUD on definition |

## MCP Tools

```javascript
{
  name: 'kradle_list_agents',
  description: 'List all defined agents (personas) in the organization',
},
{
  name: 'kradle_get_agent_profile',
  description: 'Get full agent profile including soul, personality, skills, appearance',
  inputSchema: { properties: { name: { type: 'string' } }, required: ['name'] }
},
{
  name: 'kradle_create_agent',
  description: 'Create a new agent with persona, soul, and infrastructure binding',
  inputSchema: { ... }
}
```
