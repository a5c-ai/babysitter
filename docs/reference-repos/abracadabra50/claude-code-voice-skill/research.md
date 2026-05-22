# abracadabra50/claude-code-voice-skill

- **Archetype**: utility-with-skill
- **Stars**: 161
- **Last pushed**: 2026-04-12 (approx)
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: gh-search (code: SKILL.md)
- **Skills found**: 1

## Summary
Voice conversations with Claude about your projects. Call a phone number to brainstorm, or have Claude call you with updates. Uses Vapi for voice API. Supports both inbound and outbound calls. Features personalized greetings and project context loading.

## Assessment
LOW-MEDIUM VALUE. Novel interaction modality (voice) for agent communication. The outbound call pattern (agent initiates call to human with updates) is an interesting breakpoint/notification pattern that could complement babysitter's breakpoint system.

## Extraction Priority
LOW -- Primarily a tool integration (Vapi), not a methodology. The "agent calls human" pattern is the only extractable concept.

## Processes
None with significant multi-step procedural value.

## Plugin Ideas
- **voice-breakpoint plugin**: Babysitter plugin that calls the user via phone when a breakpoint requires human approval

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| N/A | N/A | No significant multi-step processes identified - primarily tool integration | - | N/A |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Voice Breakpoint Notifications | NEW | Phone call integration for babysitter breakpoint notifications | - | plugins/a5c/marketplace/plugins/voice-breakpoint-notifications/ |

## Implicit Procedural Knowledge
- Voice as a breakpoint notification channel
- Project context auto-loading for voice conversations
- Agent-initiated outbound calls for status updates
