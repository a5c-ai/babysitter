import assert from 'node:assert/strict';
import test from 'node:test';
import { createResource, listResourceDefinitions, resourceSchemaForKind, storageClassForKind, validateResource } from '../src/index.js';

const JITSI_KINDS = {
  JitsiMeetProvider: {
    storage: 'etcd',
    context: 'external-backends',
    plural: 'jitsimeetproviders',
    requiredSpec: ['organizationRef', 'endpoint', 'authMode'],
    validSpec: { organizationRef: 'default', endpoint: 'https://meet.krate.local', authMode: 'jwt' },
  },
  JitsiMeetingTemplate: {
    storage: 'etcd',
    context: 'agents',
    plural: 'jitsimeetingtemplates',
    requiredSpec: ['organizationRef', 'providerRef', 'displayName'],
    validSpec: { organizationRef: 'default', providerRef: 'jitsi-prod', displayName: 'Daily Standup' },
  },
  JitsiMeeting: {
    storage: 'postgres',
    context: 'agents',
    plural: 'jitsimeetings',
    requiredSpec: ['organizationRef', 'providerRef', 'roomId'],
    validSpec: { organizationRef: 'default', providerRef: 'jitsi-prod', roomId: 'standup-20260530-default' },
  },
  JitsiRecording: {
    storage: 'postgres',
    context: 'agents',
    plural: 'jitsirecordings',
    requiredSpec: ['organizationRef', 'meetingRef', 'providerRef'],
    validSpec: { organizationRef: 'default', meetingRef: 'standup-2026-05-30', providerRef: 'jitsi-prod' },
  },
};

test('Jitsi resource kinds are registered with #624 frozen storage contracts', () => {
  const definitions = listResourceDefinitions();
  for (const [kind, expected] of Object.entries(JITSI_KINDS)) {
    const definition = definitions.find((entry) => entry.kind === kind);
    assert.ok(definition, `${kind} must be present in listResourceDefinitions`);
    assert.equal(definition.storage, expected.storage);
    assert.equal(definition.context, expected.context);
    assert.equal(definition.plural, expected.plural);
    assert.deepEqual(definition.requiredSpec, expected.requiredSpec);
    assert.equal(storageClassForKind(kind), expected.storage);
  }
});

test('Jitsi resource schemas expose documented required spec fields', () => {
  for (const [kind, expected] of Object.entries(JITSI_KINDS)) {
    const schema = resourceSchemaForKind(kind);
    assert.equal(schema.kind, kind);
    assert.equal(schema.plural, expected.plural);
    assert.equal(schema.storage, expected.storage);
    assert.deepEqual(schema.required.spec, expected.requiredSpec);
  }
});

test('Jitsi resources validate required org-scoped specs', () => {
  for (const [kind, expected] of Object.entries(JITSI_KINDS)) {
    const resource = createResource(kind, { name: kind.toLowerCase(), namespace: 'krate-org-default' }, expected.validSpec);
    assert.equal(resource.kind, kind);
    assert.equal(validateResource(resource), resource);

    for (const field of expected.requiredSpec) {
      const invalid = createResource(kind, { name: `${kind.toLowerCase()}-missing-${field}` }, {
        ...expected.validSpec,
        [field]: '',
      });
      assert.throws(() => validateResource(invalid), new RegExp(`${kind} spec.${field} is required`));
    }
  }
});
