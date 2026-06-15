# Agent Identity — Migration

## Backward Compatibility

The decoupling must not break existing workflows. AgentStack remains a valid resource — it just becomes infrastructure-only. Existing stacks that have prompts/skills inline continue to work via a compatibility layer.

## Migration Strategy

### Phase 1: Add New CRDs (non-breaking)

Add AgentPersona, AgentSoul, AgentAppearance, AgentVoiceProfile, AgentDefinition to `resource-model.js` and `charts/crds/agent-resources.yaml`. No existing resources change.

### Phase 2: AgentDefinition as Optional Wrapper

Update `agent-dispatch-controller.js` to accept either:
- `agentStack` (existing — works as before)
- `agentDefinition` (new — resolves persona + stack)

```javascript
async function resolveDispatchTarget(ref) {
  // Try AgentDefinition first
  const definition = await controller.getResource('AgentDefinition', ref);
  if (definition) {
    const persona = await controller.getResource('AgentPersona', definition.spec.personaRef);
    const stack = await controller.getResource('AgentStack', definition.spec.stackRef);
    return { definition, persona, stack };
  }

  // Legacy: direct AgentStack reference
  const stack = await controller.getResource('AgentStack', ref);
  return { definition: null, persona: null, stack };
}
```

TriggerRule, dispatch button, and MCP tools all accept `agentDefinition` OR `agentStack`.

### Phase 3: Prompt Composition Layer

Add prompt composition that layers soul → persona → definition → stack:

```javascript
function composeSystemPrompt({ soul, persona, definition, stack }) {
  const parts = [];

  // Layer 1: Soul (deepest identity)
  if (soul?.spec?.content) {
    parts.push(soul.spec.content);
  }

  // Layer 2: Persona personality and role
  if (persona?.spec?.personality) {
    const p = persona.spec.personality;
    parts.push(`Communication style: ${p.communicationStyle}. Tone: ${p.tone}.`);
  }
  if (persona?.spec?.role) {
    parts.push(`Role: ${persona.spec.role.title}. Domain: ${persona.spec.role.domain}.`);
  }

  // Layer 3: Definition role context
  if (definition?.spec?.roleContext) {
    parts.push(definition.spec.roleContext);
  }

  // Layer 4: Stack system prompt (legacy, lowest priority)
  if (stack?.spec?.systemPrompt) {
    parts.push(stack.spec.systemPrompt);
  }

  return parts.filter(Boolean).join('\n\n');
}
```

### Phase 4: UI Migration

Add persona/definition management to the web console. The stack builder graph continues to work for creating AgentStacks. New "Agents" page shows AgentDefinitions with persona details.

### Phase 5: Deprecation

Mark `systemPrompt`, `developerPrompt`, `taskPrompt`, and `skillRefs` on AgentStack as deprecated. Log a warning when dispatch resolves a stack with inline prompts:

```
[kradle] AgentStack "my-stack" has inline prompts. Consider migrating to AgentPersona + AgentDefinition.
```

No removal timeline — legacy stacks work indefinitely.

## Data Migration Script

For orgs that want to migrate existing stacks:

```javascript
async function migrateStackToDefinition(stackName, orgRef) {
  const stack = await controller.getResource('AgentStack', stackName);

  // Extract persona from stack
  const persona = {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind: 'AgentPersona',
    metadata: { name: `${stackName}-persona` },
    spec: {
      organizationRef: orgRef,
      displayName: stackName,
      soul: { inline: stack.spec.systemPrompt || '' },
      personality: { communicationStyle: 'direct', tone: 'professional' },
      role: { title: stackName, domain: 'general' },
      skillRefs: stack.spec.skillRefs || [],
    }
  };

  // Create definition binding
  const definition = {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind: 'AgentDefinition',
    metadata: { name: stackName },
    spec: {
      organizationRef: orgRef,
      personaRef: `${stackName}-persona`,
      stackRef: stackName,
    }
  };

  // Remove prompts from stack (after backup)
  const cleanedStack = { ...stack };
  delete cleanedStack.spec.systemPrompt;
  delete cleanedStack.spec.developerPrompt;
  delete cleanedStack.spec.taskPrompt;
  delete cleanedStack.spec.skillRefs;

  await controller.applyResource(persona);
  await controller.applyResource(definition);
  await controller.applyResource(cleanedStack);
}
```

## What References Change

| Resource | Current Field | After Migration |
|----------|-------------|-----------------|
| AgentTriggerRule | `spec.agentStack` | `spec.agentDefinition` (or `spec.agentStack` for legacy) |
| AgentDispatchRun | `spec.agentStack` | `spec.agentDefinition` (or `spec.agentStack` for legacy) |
| AgentSession | `spec.agentStack` | `spec.agentDefinition` |
| JitsiMeeting | `spec.participants[].ref` (stack name) | `spec.participants[].ref` (definition name) |
| DispatchButton UI | stack selector dropdown | definition selector (shows persona name + stack) |
| Stack Builder | creates AgentStack | creates AgentStack (infra) — separate persona editor |
