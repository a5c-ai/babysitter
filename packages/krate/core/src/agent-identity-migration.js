import { clone, createResource } from './resource-model.js';

export const LEGACY_AGENT_STACK_IDENTITY_FIELDS = Object.freeze([
  'systemPrompt',
  'developerPrompt',
  'taskPrompt',
  'skillRefs',
]);

export function agentStackHasInlineIdentity(stack) {
  const spec = stack?.spec || {};
  return Boolean(
    (typeof spec.systemPrompt === 'string' && spec.systemPrompt.trim()) ||
    (typeof spec.developerPrompt === 'string' && spec.developerPrompt.trim()) ||
    (typeof spec.taskPrompt === 'string' && spec.taskPrompt.trim()) ||
    (Array.isArray(spec.skillRefs) && spec.skillRefs.length > 0)
  );
}

export function legacyAgentStackIdentityWarning(stack) {
  if (!agentStackHasInlineIdentity(stack)) return null;
  const name = stack?.metadata?.name || 'unknown';
  return `[krate] AgentStack "${name}" has inline prompts or skills. Consider migrating to AgentPersona + AgentDefinition.`;
}

export function cleanAgentStackIdentity(stack) {
  const cleaned = clone(stack);
  cleaned.spec ||= {};
  for (const field of LEGACY_AGENT_STACK_IDENTITY_FIELDS) {
    delete cleaned.spec[field];
  }
  cleaned.metadata ||= {};
  cleaned.metadata.annotations ||= {};
  cleaned.metadata.annotations['krate.a5c.ai/identity-migrated'] = 'true';
  return cleaned;
}

export function planAgentStackIdentityMigration(stack, options = {}) {
  if (!stack || stack.kind !== 'AgentStack') {
    throw new Error('planAgentStackIdentityMigration requires an AgentStack resource');
  }
  const stackName = stack.metadata?.name;
  if (!stackName) throw new Error('AgentStack metadata.name is required');

  const namespace = options.namespace || stack.metadata?.namespace || 'default';
  const organizationRef = options.organizationRef || stack.spec?.organizationRef || 'default';
  const personaName = options.personaName || `${stackName}-persona`;
  const definitionName = options.definitionName || stackName;
  const cleanStack = options.cleanStack !== false;

  const legacyPrompts = {};
  if (stack.spec?.developerPrompt) legacyPrompts.developerPrompt = stack.spec.developerPrompt;
  if (stack.spec?.taskPrompt) legacyPrompts.taskPrompt = stack.spec.taskPrompt;

  const persona = createResource('AgentPersona', { name: personaName, namespace }, {
    organizationRef,
    displayName: stack.spec?.displayName || stackName,
    soul: { inline: stack.spec?.systemPrompt || '' },
    personality: {
      communicationStyle: 'direct',
      tone: 'professional',
      explanationDepth: 'moderate',
      language: 'en',
    },
    role: {
      title: stack.spec?.roleTitle || stackName,
      domain: stack.spec?.domain || 'general',
    },
    skillRefs: clone(stack.spec?.skillRefs || []),
    ...(Object.keys(legacyPrompts).length > 0 ? { legacyPrompts } : {}),
  });

  const definition = createResource('AgentDefinition', { name: definitionName, namespace }, {
    organizationRef,
    personaRef: personaName,
    stackRef: stackName,
  });

  const cleanedStack = cleanStack ? cleanAgentStackIdentity(stack) : clone(stack);
  const backup = clone(stack);
  const operations = [
    { action: 'apply', kind: 'AgentPersona', resource: persona },
    { action: 'apply', kind: 'AgentDefinition', resource: definition },
    ...(cleanStack ? [{ action: 'apply', kind: 'AgentStack', resource: cleanedStack }] : []),
  ];

  return {
    dryRun: true,
    cleanStack,
    backup,
    persona,
    definition,
    cleanedStack,
    operations,
    warning: legacyAgentStackIdentityWarning(stack),
  };
}

export async function migrateAgentStackIdentity(stack, options = {}) {
  const dryRun = options.dryRun !== false;
  const plan = planAgentStackIdentityMigration(stack, options);
  if (dryRun) return plan;

  const applyResource = options.applyResource;
  if (typeof applyResource !== 'function') {
    throw new Error('migrateAgentStackIdentity apply mode requires applyResource(resource)');
  }

  const applied = [];
  for (const operation of plan.operations) {
    const result = await applyResource(operation.resource);
    applied.push({ ...operation, result });
  }
  return { ...plan, dryRun: false, applied };
}
