import { clone, createResource } from './resource-model.js';

export const AGENT_PERSONA_CONTROLLER_BOUNDARY = {
  role: 'agent-persona-controller',
  scope: 'Agent identity validation and resolution for personas, definitions, souls, appearance, and voice profiles',
  owns: ['agent identity reference resolution', 'agent profile validation'],
  delegatesTo: ['resource-model', 'agent-prompt-composition'],
  mustNotOwn: ['runtime job creation', 'permission review']
};

function findByName(resources, kind, name, organizationRef) {
  return (resources?.[kind] || []).find((resource) => {
    if (resource.metadata?.name !== name) return false;
    return !organizationRef || !resource.spec?.organizationRef || resource.spec.organizationRef === organizationRef;
  }) || null;
}

function required(resource, fields) {
  const errors = [];
  for (const field of fields) {
    const value = resource?.spec?.[field];
    if (value === undefined || value === null || value === '') errors.push(`spec.${field} is required`);
  }
  return errors;
}

export function validateAgentPersona(resource) {
  const errors = required(resource, ['organizationRef', 'displayName']);
  if (resource?.kind && resource.kind !== 'AgentPersona') errors.push('kind must be AgentPersona');
  return { valid: errors.length === 0, errors };
}

export function validateAgentDefinition(resource) {
  const errors = required(resource, ['organizationRef', 'personaRef', 'stackRef']);
  if (resource?.kind && resource.kind !== 'AgentDefinition') errors.push('kind must be AgentDefinition');
  return { valid: errors.length === 0, errors };
}

function inlineResource(kind, name, namespace, organizationRef, spec) {
  return createResource(kind, { name, namespace }, { organizationRef, ...(spec || {}) });
}

function resolveProfileRef({ resources, kind, ref, organizationRef, errors }) {
  if (!ref) return null;
  const found = findByName(resources, kind, ref, organizationRef);
  if (!found) errors.push(`${kind} not found: ${ref}`);
  return found;
}

export function resolveAgentPersona(personaRef, { resources = {}, organizationRef = 'default' } = {}) {
  const errors = [];
  const persona = typeof personaRef === 'string' ? findByName(resources, 'AgentPersona', personaRef, organizationRef) : personaRef;
  if (!persona) {
    return { error: true, persona: null, soul: null, appearance: null, voiceProfile: null, errors: [`AgentPersona not found: ${personaRef}`] };
  }

  const validation = validateAgentPersona(persona);
  errors.push(...validation.errors);

  const namespace = persona.metadata?.namespace || 'default';
  const name = persona.metadata?.name || 'agent';
  const spec = persona.spec || {};

  let soul = null;
  if (spec.soul?.inline) {
    soul = inlineResource('AgentSoul', `${name}-inline-soul`, namespace, spec.organizationRef || organizationRef, { personaRef: name, content: spec.soul.inline });
  } else if (spec.soul?.ref) {
    soul = resolveProfileRef({ resources, kind: 'AgentSoul', ref: spec.soul.ref, organizationRef, errors });
  }

  let appearance = null;
  if (spec.appearance?.inline) {
    appearance = inlineResource('AgentAppearance', `${name}-inline-appearance`, namespace, spec.organizationRef || organizationRef, { personaRef: name, ...spec.appearance.inline });
  } else if (spec.appearance?.ref) {
    appearance = resolveProfileRef({ resources, kind: 'AgentAppearance', ref: spec.appearance.ref, organizationRef, errors });
  }

  let voiceProfile = null;
  if (spec.voiceProfile?.inline) {
    voiceProfile = inlineResource('AgentVoiceProfile', `${name}-inline-voice`, namespace, spec.organizationRef || organizationRef, { personaRef: name, ...spec.voiceProfile.inline });
  } else if (spec.voiceProfile?.ref) {
    voiceProfile = resolveProfileRef({ resources, kind: 'AgentVoiceProfile', ref: spec.voiceProfile.ref, organizationRef, errors });
  }

  return { error: errors.length > 0, persona, soul, appearance, voiceProfile, errors };
}

export function resolveAgentDefinition(definitionRef, { resources = {}, organizationRef = 'default' } = {}) {
  const errors = [];
  const definition = typeof definitionRef === 'string' ? findByName(resources, 'AgentDefinition', definitionRef, organizationRef) : definitionRef;
  if (!definition) {
    return { error: true, definition: null, persona: null, soul: null, appearance: null, voiceProfile: null, stack: null, errors: [`AgentDefinition not found: ${definitionRef}`] };
  }

  const validation = validateAgentDefinition(definition);
  errors.push(...validation.errors);
  const resolvedPersona = resolveAgentPersona(definition.spec?.personaRef, { resources, organizationRef: definition.spec?.organizationRef || organizationRef });
  errors.push(...resolvedPersona.errors);

  const stackRef = definition.spec?.stackRef;
  const stack = stackRef ? findByName(resources, 'AgentStack', stackRef, definition.spec?.organizationRef || organizationRef) : null;
  if (stackRef && !stack) errors.push(`AgentStack not found: ${stackRef}`);

  return {
    error: errors.length > 0,
    definition,
    persona: resolvedPersona.persona,
    soul: resolvedPersona.soul,
    appearance: resolvedPersona.appearance,
    voiceProfile: resolvedPersona.voiceProfile,
    stack,
    errors,
  };
}

export function createAgentPersonaController() {
  return {
    role: 'agent-persona-controller',
    validateAgentPersona,
    validateAgentDefinition,
    resolveAgentPersona,
    resolveAgentDefinition,
    summarizeProfile(resolved) {
      return {
        definition: clone(resolved.definition),
        persona: clone(resolved.persona),
        soul: clone(resolved.soul),
        appearance: clone(resolved.appearance),
        voiceProfile: clone(resolved.voiceProfile),
        stack: clone(resolved.stack),
        errors: clone(resolved.errors || []),
      };
    }
  };
}
