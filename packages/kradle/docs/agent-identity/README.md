# Agent Identity — Decoupling Stack from Persona

## Problem

Today `AgentStack` is a monolith that combines two fundamentally different concerns:

**Infrastructure** (how the agent runs):
- `baseAgent`, `adapter`, `transport` — runtime engine
- `runtimeIdentity`, `serviceAccountRef` — K8s identity
- `provider`, `model` — LLM provider config
- `mcpServerRefs`, `cliToolRefs`, `openApiRefs` — tool access
- `approvalMode`, `budgetLimitUsd` — operational policy

**Persona** (who the agent is):
- `systemPrompt`, `developerPrompt`, `taskPrompt` — personality and role
- `skillRefs` — what the agent knows how to do
- implicit name / display identity — no structured field today

This coupling means:
- You can't reuse the same persona across different infrastructure configs
- You can't give an agent a name, avatar, voice, or biography
- You can't define an agent's personality independently from what model it uses
- When agents attend meetings, they have no identity beyond their stack name
- There's no place to put soul.md, personality.md, looks, voice profile

## Solution

Split into three resource types:

```
AgentStack (infrastructure)     AgentPersona (identity)
    │                               │
    │   ┌───────────────────────┐   │
    └──▶│  AgentDefinition      │◀──┘
         │  (binds stack + persona) │
         │  + role, scope, context  │
         └───────────────────────┘
               │
               ▼
         AgentDispatchRun (execution)
```

## Documents

| File | Scope |
|------|-------|
| [01-resource-model.md](./01-resource-model.md) | New CRDs: AgentPersona, AgentSoul, AgentVoiceProfile, AgentAppearance, AgentDefinition |
| [02-migration.md](./02-migration.md) | Backward compatibility, migration from AgentStack monolith |
| [03-web-experience.md](./03-web-experience.md) | Agent profile pages, persona editor, avatar upload, voice preview |
| [04-meeting-integration.md](./04-meeting-integration.md) | How persona feeds into Jitsi meetings (name, avatar, voice) |
