import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentPersonaController, createResource } from '../src/index.js';

function persona(name = 'aria', spec = {}) {
  return createResource('AgentPersona', { name, namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    displayName: 'Aria',
    soul: { ref: 'aria-soul' },
    appearance: { ref: 'aria-appearance' },
    voiceProfile: { ref: 'aria-voice' },
    ...spec
  });
}

function soul(name = 'aria-soul') {
  return createResource('AgentSoul', { name, namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    personaRef: 'aria',
    content: 'You are Aria.'
  });
}

function appearance(name = 'aria-appearance') {
  return createResource('AgentAppearance', { name, namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    personaRef: 'aria',
    avatar: { type: 'initials', fallbackInitials: 'AR' }
  });
}

function voice(name = 'aria-voice') {
  return createResource('AgentVoiceProfile', { name, namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    personaRef: 'aria',
    ttsProvider: 'openai',
    ttsConfig: { voice: 'nova' }
  });
}

function stack(name = 'review-stack') {
  return createResource('AgentStack', { name, namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    baseAgent: 'claude-code',
    adapter: 'claude-code',
    runtimeIdentity: { serviceAccountRef: 'sa-default' }
  });
}

function definition(name = 'aria-reviewer', spec = {}) {
  return createResource('AgentDefinition', { name, namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    personaRef: 'aria',
    stackRef: 'review-stack',
    roleContext: 'Review pull requests for security issues.',
    ...spec
  });
}

test('resolveAgentDefinition resolves persona, stack, and referenced soul appearance voice', () => {
  const controller = createAgentPersonaController();
  const resources = {
    AgentDefinition: [definition()],
    AgentPersona: [persona()],
    AgentSoul: [soul()],
    AgentAppearance: [appearance()],
    AgentVoiceProfile: [voice()],
    AgentStack: [stack()]
  };

  const resolved = controller.resolveAgentDefinition('aria-reviewer', { resources, organizationRef: 'default' });

  assert.equal(resolved.error, false);
  assert.equal(resolved.definition.metadata.name, 'aria-reviewer');
  assert.equal(resolved.persona.metadata.name, 'aria');
  assert.equal(resolved.soul.spec.content, 'You are Aria.');
  assert.equal(resolved.appearance.spec.avatar.fallbackInitials, 'AR');
  assert.equal(resolved.voiceProfile.spec.ttsProvider, 'openai');
  assert.equal(resolved.stack.metadata.name, 'review-stack');
  assert.deepEqual(resolved.errors, []);
});

test('resolveAgentDefinition supports inline soul, appearance, and voice profile data', () => {
  const controller = createAgentPersonaController();
  const resources = {
    AgentDefinition: [definition()],
    AgentPersona: [persona('aria', {
      soul: { inline: 'Inline soul' },
      appearance: { inline: { avatar: { type: 'emoji', emoji: 'A' } } },
      voiceProfile: { inline: { ttsProvider: 'local-piper', ttsConfig: { voice: 'alto' } } }
    })],
    AgentStack: [stack()]
  };

  const resolved = controller.resolveAgentDefinition('aria-reviewer', { resources, organizationRef: 'default' });

  assert.equal(resolved.error, false);
  assert.equal(resolved.soul.spec.content, 'Inline soul');
  assert.equal(resolved.appearance.spec.avatar.type, 'emoji');
  assert.equal(resolved.voiceProfile.spec.ttsProvider, 'local-piper');
});

test('resolveAgentDefinition reports missing referenced resources', () => {
  const controller = createAgentPersonaController();
  const resources = {
    AgentDefinition: [definition()],
    AgentPersona: [persona()],
    AgentStack: []
  };

  const resolved = controller.resolveAgentDefinition('aria-reviewer', { resources, organizationRef: 'default' });

  assert.equal(resolved.error, true);
  assert.ok(resolved.errors.some((error) => error.includes('AgentSoul not found: aria-soul')));
  assert.ok(resolved.errors.some((error) => error.includes('AgentAppearance not found: aria-appearance')));
  assert.ok(resolved.errors.some((error) => error.includes('AgentVoiceProfile not found: aria-voice')));
  assert.ok(resolved.errors.some((error) => error.includes('AgentStack not found: review-stack')));
});

test('validateAgentDefinition requires personaRef and stackRef', () => {
  const controller = createAgentPersonaController();
  const result = controller.validateAgentDefinition({ kind: 'AgentDefinition', spec: { organizationRef: 'default' } });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('spec.personaRef is required'));
  assert.ok(result.errors.includes('spec.stackRef is required'));
});
