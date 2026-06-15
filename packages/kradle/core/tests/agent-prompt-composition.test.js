import assert from 'node:assert/strict';
import test from 'node:test';
import { composeAgentPrompt, composeAgentSystemPrompt } from '../src/index.js';

const soul = { spec: { content: 'Soul layer.' } };
const persona = {
  spec: {
    displayName: 'Aria',
    tagline: 'Security reviewer',
    personality: {
      traits: ['direct', 'security-conscious'],
      communicationStyle: 'direct',
      explanationDepth: 'thorough',
      tone: 'professional'
    },
    role: {
      title: 'Senior Reviewer',
      domain: 'Security',
      expertise: ['code-review', 'threat-modeling']
    },
    skillRefs: ['security-review'],
    knowledgeRefs: ['owasp-top-10']
  }
};
const definition = { spec: { roleContext: 'Definition role context.' } };
const stack = { spec: { systemPrompt: 'Legacy stack system.', developerPrompt: 'Legacy developer.', taskPrompt: 'Legacy task.' } };

test('composeAgentSystemPrompt layers soul persona definition and stack deterministically', () => {
  const prompt = composeAgentSystemPrompt({ soul, persona, definition, stack });

  const soulIndex = prompt.indexOf('Soul layer.');
  const personaIndex = prompt.indexOf('Aria');
  const definitionIndex = prompt.indexOf('Definition role context.');
  const stackIndex = prompt.indexOf('Legacy stack system.');

  assert.ok(soulIndex >= 0, 'soul content should be present');
  assert.ok(personaIndex > soulIndex, 'persona layer should follow soul');
  assert.ok(definitionIndex > personaIndex, 'definition layer should follow persona');
  assert.ok(stackIndex > definitionIndex, 'legacy stack system prompt should follow definition');
  assert.ok(prompt.includes('Communication style: direct'));
  assert.ok(prompt.includes('Role: Senior Reviewer'));
  assert.ok(prompt.includes('Skills: security-review'));
  assert.ok(prompt.includes('Knowledge: owasp-top-10'));
});

test('composeAgentPrompt preserves legacy developer and task prompts', () => {
  const prompt = composeAgentPrompt({ soul, persona, definition, stack });

  assert.ok(prompt.system.includes('Soul layer.'));
  assert.equal(prompt.developer, 'Legacy developer.');
  assert.equal(prompt.task, 'Legacy task.');
});

test('composeAgentPrompt uses migrated persona legacy prompts before stack fallback', () => {
  const migratedPersona = {
    spec: {
      ...persona.spec,
      legacyPrompts: {
        developerPrompt: 'Migrated developer.',
        taskPrompt: 'Migrated task.',
      },
    },
  };
  const prompt = composeAgentPrompt({ soul, persona: migratedPersona, definition, stack });

  assert.equal(prompt.developer, 'Migrated developer.');
  assert.equal(prompt.task, 'Migrated task.');
});

test('composeAgentPrompt returns legacy stack prompts when no identity resources are supplied', () => {
  const prompt = composeAgentPrompt({ stack });

  assert.equal(prompt.system, 'Legacy stack system.');
  assert.equal(prompt.developer, 'Legacy developer.');
  assert.equal(prompt.task, 'Legacy task.');
});
