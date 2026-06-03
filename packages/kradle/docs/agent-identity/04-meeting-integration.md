# Agent Identity — Meeting Integration

How agent persona feeds into the Jitsi meeting experience.

## Participant Identity in Meetings

When an agent joins a Jitsi meeting, its persona determines how it appears and behaves:

### Display Name

```javascript
// From AgentPersona
const participantName = persona.spec.displayName; // "Aria"
// NOT the stack name "claude-sonnet-security"
```

### Avatar

The agent's avatar from AgentAppearance is set in the Jitsi JWT context:

```json
{
  "context": {
    "user": {
      "name": "Aria",
      "email": "aria@agents.kradle.a5c.ai",
      "avatar": "https://assets.a5c.ai/agents/aria-avatar.png",
      "id": "agent-aria"
    }
  }
}
```

Jitsi displays this avatar in the participant tile when video is off.

### Voice

The agent's TTS voice from AgentVoiceProfile is injected into the sidecar container:

```yaml
env:
  - name: JITSI_TTS_PROVIDER
    value: openai
  - name: JITSI_TTS_VOICE
    value: nova
  - name: JITSI_TTS_SPEED
    value: "1.0"
```

Each agent in a meeting sounds different — their voice is part of their identity.

### Behavioral Style in Meetings

The persona's personality traits influence meeting behavior:

```yaml
# AgentPersona.spec.personality
communicationStyle: direct       → Agent speaks concisely, interrupts less
explanationDepth: thorough       → Agent gives detailed answers when asked
humorLevel: occasional           → Agent may react with emojis occasionally
tone: professional               → Formal language, no slang
```

These traits are injected into the agent's system prompt as meeting-specific context:

```
You are currently in a Jitsi video meeting. Your communication style is direct
and professional. Keep responses concise — this is a live conversation, not a
document. Wait for natural pauses before speaking. If asked a question, respond
within 2-3 sentences. Use the chat for longer responses or code snippets.
```

## Meeting Participant List UI

The participant list in the kradle meeting context panel shows persona details:

```
┌─── Participants (4) ─────────────────────────┐
│                                               │
│  [avatar] Alice                 👤 Moderator  │
│           Human participant                   │
│                                               │
│  [🔍]    Aria                   🤖 Reviewer   │
│           Senior Code Reviewer                │
│           🎤 Speaking | run-abc123            │
│                                               │
│  [📝]    Max                    🤖 Observer    │
│           Technical Writer                    │
│           🔇 Listening | run-def456           │
│                                               │
│  ○        Charlie               👤 Invited    │
│           Not yet joined                      │
│                                               │
└───────────────────────────────────────────────┘
```

Agent participants show:
- Persona avatar (not a generic bot icon)
- Persona display name (not stack name)
- Role title from persona
- Current audio state (speaking/listening/muted)
- Link to dispatch run

## Agent-to-Agent Meetings

Multiple agents can attend the same meeting. Each has its own identity:

```yaml
apiVersion: kradle.a5c.ai/v1alpha1
kind: JitsiMeetingTemplate
metadata:
  name: architecture-review
spec:
  displayName: "Architecture Review"
  participants:
    autoInvite:
      - type: agentDefinition
        ref: aria-code-reviewer          # Security perspective
      - type: agentDefinition
        ref: max-tech-writer             # Documentation perspective
      - type: agentDefinition
        ref: scout-security-auditor      # Compliance perspective
```

Each agent sees the others as distinct participants with names and voices. Their soul documents ensure they don't agree blindly — each brings their own perspective.

## Persona in Meeting Transcripts

After a meeting, the transcript uses persona names:

```
[09:00:05] Alice: Let's review the auth module refactor.
[09:00:12] Aria: I've reviewed the PR. Two security concerns in the session handling.
[09:00:20] Scout: I also flagged the same session issue from a compliance angle.
[09:00:35] Max: I'll update the auth docs after we resolve the implementation.
```

Not:
```
[09:00:12] claude-sonnet-security: I've reviewed...
[09:00:20] claude-opus-compliance: I also flagged...
```

## Persona-Aware Context Injection

When an agent is in a meeting, its persona influences what context is injected:

```javascript
function buildMeetingContext(persona, meeting) {
  const context = [];

  // Who the agent is in this meeting
  context.push(`You are ${persona.spec.displayName}, ${persona.spec.role.title}.`);
  context.push(`Your expertise: ${persona.spec.role.expertise.join(', ')}.`);

  // Who else is here
  const others = meeting.status.participants.current
    .filter(p => p.id !== persona.metadata.name)
    .map(p => `${p.name} (${p.type === 'agent' ? 'AI agent' : 'human'})`);
  context.push(`Other participants: ${others.join(', ')}.`);

  // Soul-driven behavioral boundaries in meeting context
  if (persona.spec.soul?.inline) {
    context.push('Your behavioral guidelines for this meeting:');
    context.push(persona.spec.soul.inline);
  }

  return context.join('\n');
}
```
