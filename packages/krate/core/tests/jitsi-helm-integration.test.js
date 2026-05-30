import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const chart = readFileSync(new URL('../../charts/Chart.yaml', import.meta.url), 'utf8');
const values = readFileSync(new URL('../../charts/values.yaml', import.meta.url), 'utf8');
const networkPolicy = readFileSync(new URL('../../charts/templates/networkpolicy.yaml', import.meta.url), 'utf8');
const secrets = readFileSync(new URL('../../charts/templates/jitsi-secrets.yaml', import.meta.url), 'utf8');
const jitsiCrds = readFileSync(new URL('../../charts/crds/jitsi-resources.yaml', import.meta.url), 'utf8');
const agentCrds = readFileSync(new URL('../../charts/crds/agent-resources.yaml', import.meta.url), 'utf8');
const aggregatedCrds = readFileSync(new URL('../../charts/crds/aggregated-resources.yaml', import.meta.url), 'utf8');
const externalCrds = readFileSync(new URL('../../charts/crds/external-resources.yaml', import.meta.url), 'utf8');

test('Krate chart declares the Jitsi Meet subchart dependency behind jitsi.install', () => {
  assert.match(chart, /name:\s+jitsi-meet/);
  assert.match(chart, /repository:\s+https:\/\/jitsi-contrib\.github\.io\/jitsi-helm\//);
  assert.match(chart, /condition:\s+jitsi\.install/);
  assert.match(chart, /alias:\s+jitsi-subchart/);
});

test('values expose internal and external Jitsi deployment settings', () => {
  for (const term of [
    'jitsi:',
    'install: false',
    'external:',
    'publicURL: https://meet.krate.local',
    'jwtAppSecret:',
    'web:',
    'prosody:',
    'type: jwt',
    'existingSecretName:',
    'jicofo:',
    'jvb:',
    'useNodeIP: true',
    'UDPPort: 10000',
    'udpPort: 10000',
    'jibri:',
    'recordingStorageClass:',
    'jitsi-subchart:',
  ]) {
    assert.ok(values.includes(term), `values.yaml should include ${term}`);
  }
  assert.match(values, /jitsi-subchart:[\s\S]*prosody:\n\s+<<: \*jitsiProsody[\s\S]*secretEnvs:\n\s+JWT_APP_SECRET: ""[\s\S]*jwt:\n\s+secret: ""\n\s+existingSecretName: ""/);
});

test('Jitsi CRDs are installed from a dedicated chart CRD file', () => {
  const expectedKinds = ['JitsiMeetProvider', 'JitsiMeetingTemplate', 'JitsiMeeting', 'JitsiRecording'];
  for (const kind of expectedKinds) {
    assert.match(jitsiCrds, new RegExp(`kind:\\s+${kind}`));
  }
  assert.match(jitsiCrds, /required:\n\s+- organizationRef/);
  assert.match(jitsiCrds, /name:\s+jitsimeetproviders\.krate\.a5c\.ai/);
  assert.match(jitsiCrds, /name:\s+jitsimeetings\.krate\.a5c\.ai/);
});

test('Jitsi CRDs are not duplicated in non-Jitsi chart CRD bundles', () => {
  for (const crdBundle of [agentCrds, aggregatedCrds, externalCrds]) {
    assert.doesNotMatch(crdBundle, /name:\s+jitsi(?:meetproviders|meetingtemplates|meetings|recordings)\.krate\.a5c\.ai/);
  }
});

test('chart templates manage Jitsi secrets without committing literal credentials', () => {
  assert.match(secrets, /jitsi-jwt/);
  assert.match(secrets, /appSecret:\s+\{\{ \$jwtAppSecret \| quote \}\}/);
  assert.match(secrets, /jitsi-webhook/);
  assert.match(secrets, /webhookExistingSecret/);
  assert.match(secrets, /webhookSecret:\s+\{\{ \.Values\.jitsi\.krate\.webhookSecret \| quote \}\}/);
});

test('network policy opens JVB UDP media traffic only when Jitsi is installed', () => {
  assert.match(networkPolicy, /if \.Values\.jitsi\.install/);
  assert.match(networkPolicy, /jitsi-media/);
  assert.match(networkPolicy, /component/);
  assert.match(networkPolicy, /jvb/);
  assert.match(networkPolicy, /protocol:\s+UDP/);
  assert.match(networkPolicy, /port:\s+\{\{ \.Values\.jitsi\.jvb\.service\.udpPort \| default 10000 \}\}/);
});
