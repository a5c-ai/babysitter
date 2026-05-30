import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAgentMuxClient, parseSseLines, AGENT_MUX_CLIENT_BOUNDARY } from '../src/agent-mux-client.js';

describe('AGENT_MUX_CLIENT_BOUNDARY', () => {
  it('declares the expected role and scope', () => {
    assert.equal(AGENT_MUX_CLIENT_BOUNDARY.role, 'agent-mux-client');
    assert.ok(AGENT_MUX_CLIENT_BOUNDARY.scope.includes('HTTP/SSE'));
    assert.ok(AGENT_MUX_CLIENT_BOUNDARY.owns.includes('gateway HTTP calls'));
    assert.ok(AGENT_MUX_CLIENT_BOUNDARY.delegatesTo.includes('resource-model'));
  });
});

describe('createAgentMuxClient — isAvailable', () => {
  it('returns false when enabled is false', () => {
    const client = createAgentMuxClient({ gateway: 'http://localhost:8080', enabled: false });
    assert.equal(client.isAvailable(), false);
  });

  it('returns false when gateway is empty', () => {
    const client = createAgentMuxClient({ gateway: '', enabled: true });
    assert.equal(client.isAvailable(), false);
  });

  it('returns false when no options are provided', () => {
    const client = createAgentMuxClient();
    assert.equal(client.isAvailable(), false);
  });

  it('returns true when enabled is true and gateway is set', () => {
    const client = createAgentMuxClient({ gateway: 'http://localhost:8080', enabled: true });
    assert.equal(client.isAvailable(), true);
  });
});

describe('createAgentMuxClient — queryCapabilities', () => {
  it('returns null when client is unavailable', async () => {
    const client = createAgentMuxClient({ enabled: false });
    const result = await client.queryCapabilities('claude-code');
    assert.equal(result, null);
  });
});

describe('createAgentMuxClient — launchSession', () => {
  it('returns null when client is unavailable', async () => {
    const client = createAgentMuxClient({ enabled: false });
    const result = await client.launchSession({
      stack: { baseAgent: 'claude-code' },
      contextBundle: {},
      permissionSnapshot: {},
      workspace: {}
    });
    assert.equal(result, null);
  });
});

describe('parseSseLines', () => {
  it('parses valid SSE data lines', () => {
    const text = [
      'data: {"role":"assistant","content":"hello"}',
      '',
      'data: {"role":"user","content":"world"}',
      '',
    ].join('\n');
    const events = parseSseLines(text);
    assert.equal(events.length, 2);
    assert.equal(events[0].role, 'assistant');
    assert.equal(events[0].content, 'hello');
    assert.equal(events[1].role, 'user');
    assert.equal(events[1].content, 'world');
  });

  it('handles multiple data lines in a single block', () => {
    const text = [
      'data: {"seq":1}',
      'data: {"seq":2}',
      '',
    ].join('\n');
    const events = parseSseLines(text);
    assert.equal(events.length, 2);
    assert.equal(events[0].seq, 1);
    assert.equal(events[1].seq, 2);
  });

  it('skips malformed JSON gracefully', () => {
    const text = [
      'data: {"valid":true}',
      'data: not-json',
      'data: {"also":"valid"}',
      '',
    ].join('\n');
    const events = parseSseLines(text);
    assert.equal(events.length, 2);
    assert.equal(events[0].valid, true);
    assert.equal(events[1].also, 'valid');
  });

  it('ignores non-data SSE lines', () => {
    const text = [
      'event: message',
      'id: 42',
      'data: {"role":"assistant","content":"test"}',
      'retry: 3000',
      '',
    ].join('\n');
    const events = parseSseLines(text);
    assert.equal(events.length, 1);
    assert.equal(events[0].role, 'assistant');
  });

  it('returns empty array for empty text', () => {
    assert.deepEqual(parseSseLines(''), []);
  });

  it('returns empty array for text with no data lines', () => {
    assert.deepEqual(parseSseLines('event: ping\nid: 1\n\n'), []);
  });
});

describe('createAgentMuxClient — reconcileTranscript', () => {
  it('creates a valid AgentSessionTranscript resource from events', () => {
    const client = createAgentMuxClient({ gateway: 'http://localhost:8080', enabled: true });
    const events = [
      { role: 'user', content: 'Fix the bug', timestamp: '2026-01-01T00:00:00Z' },
      { role: 'assistant', content: 'Looking at the code...', timestamp: '2026-01-01T00:00:01Z', usage: { inputTokens: 100, outputTokens: 50 } },
      { role: 'assistant', content: 'Fixed it.', timestamp: '2026-01-01T00:00:02Z', usage: { inputTokens: 200, outputTokens: 80 } },
    ];

    const transcript = client.reconcileTranscript('sess-123', events, { namespace: 'krate-org-acme', organizationRef: 'acme' });

    assert.equal(transcript.kind, 'AgentSessionTranscript');
    assert.equal(transcript.apiVersion, 'krate.a5c.ai/v1alpha1');
    assert.equal(transcript.metadata.name, 'transcript-sess-123');
    assert.equal(transcript.metadata.namespace, 'krate-org-acme');
    assert.equal(transcript.spec.organizationRef, 'acme');
    assert.equal(transcript.spec.sessionRef, 'sess-123');
    assert.equal(transcript.spec.messages.length, 3);
    assert.equal(transcript.spec.messages[0].role, 'user');
    assert.equal(transcript.spec.messages[0].content, 'Fix the bug');
    assert.equal(transcript.spec.messages[1].role, 'assistant');
    assert.equal(transcript.spec.cost.inputTokens, 300);
    assert.equal(transcript.spec.cost.outputTokens, 130);
    assert.equal(transcript.spec.cost.totalTokens, 430);
    assert.equal(transcript.status.phase, 'Reconciled');
  });

  it('handles empty events array', () => {
    const client = createAgentMuxClient({ gateway: 'http://localhost:8080', enabled: true });
    const transcript = client.reconcileTranscript('sess-empty', [], { namespace: 'default', organizationRef: 'default' });

    assert.equal(transcript.kind, 'AgentSessionTranscript');
    assert.equal(transcript.spec.sessionRef, 'sess-empty');
    assert.equal(transcript.spec.messages.length, 0);
    assert.equal(transcript.spec.cost.inputTokens, 0);
    assert.equal(transcript.spec.cost.outputTokens, 0);
    assert.equal(transcript.spec.cost.totalTokens, 0);
  });

  it('handles events with toolUse and toolResult', () => {
    const client = createAgentMuxClient({ gateway: 'http://localhost:8080', enabled: true });
    const events = [
      { role: 'assistant', content: 'Using tool...', toolUse: { name: 'read_file', input: { path: '/tmp/f' } }, timestamp: '2026-01-01T00:00:00Z' },
      { role: 'tool', content: 'file contents', toolResult: { output: 'ok' }, timestamp: '2026-01-01T00:00:01Z' },
    ];
    const transcript = client.reconcileTranscript('sess-tools', events, { namespace: 'default', organizationRef: 'default' });

    assert.equal(transcript.spec.messages.length, 2);
    assert.deepEqual(transcript.spec.messages[0].toolUse, { name: 'read_file', input: { path: '/tmp/f' } });
    assert.deepEqual(transcript.spec.messages[1].toolResult, { output: 'ok' });
  });

  it('handles events with non-string content', () => {
    const client = createAgentMuxClient({ gateway: 'http://localhost:8080', enabled: true });
    const events = [
      { role: 'assistant', content: { type: 'structured', data: [1, 2, 3] }, timestamp: '2026-01-01T00:00:00Z' },
    ];
    const transcript = client.reconcileTranscript('sess-obj', events, { namespace: 'default', organizationRef: 'default' });

    assert.equal(typeof transcript.spec.messages[0].content, 'string');
    assert.ok(transcript.spec.messages[0].content.includes('"type":"structured"'));
  });

  it('skips null/non-object events gracefully', () => {
    const client = createAgentMuxClient({ gateway: 'http://localhost:8080', enabled: true });
    const events = [
      null,
      'not-an-object',
      42,
      { role: 'user', content: 'valid', timestamp: '2026-01-01T00:00:00Z' },
    ];
    const transcript = client.reconcileTranscript('sess-mixed', events, { namespace: 'default', organizationRef: 'default' });

    assert.equal(transcript.spec.messages.length, 1);
    assert.equal(transcript.spec.messages[0].role, 'user');
  });

  it('uses default namespace and organizationRef when not specified', () => {
    const client = createAgentMuxClient({ gateway: 'http://localhost:8080', enabled: true });
    const transcript = client.reconcileTranscript('sess-defaults', []);

    assert.equal(transcript.metadata.namespace, 'default');
    assert.equal(transcript.spec.organizationRef, 'default');
  });
});

describe('createAgentMuxClient — resolveTransport', () => {
  it('returns stdio + anthropic codec when no transport bindings provided', () => {
    const client = createAgentMuxClient();
    const result = client.resolveTransport({ spec: { adapter: 'claude-code', provider: 'anthropic' } }, []);
    assert.equal(result.protocol, 'stdio');
    assert.equal(result.endpoint, '');
    assert.equal(result.codec, 'anthropic');
  });

  it('returns stdio + openai codec when provider is openai', () => {
    const client = createAgentMuxClient();
    const result = client.resolveTransport({ spec: { adapter: 'codex', provider: 'openai' } }, []);
    assert.equal(result.protocol, 'stdio');
    assert.equal(result.codec, 'openai');
  });

  it('returns stdio + google codec when provider is google', () => {
    const client = createAgentMuxClient();
    const result = client.resolveTransport({ spec: { adapter: 'gemini-cli', provider: 'google' } }, []);
    assert.equal(result.protocol, 'stdio');
    assert.equal(result.codec, 'google');
  });

  it('returns google codec when provider is gemini', () => {
    const client = createAgentMuxClient();
    const result = client.resolveTransport({ spec: { adapter: 'gemini-cli', provider: 'gemini' } }, []);
    assert.equal(result.codec, 'google');
  });

  it('returns http + endpoint + anthropic codec from a matching AgentTransportBinding', () => {
    const client = createAgentMuxClient();
    const bindings = [
      { spec: { adapterRef: 'claude-code', protocol: 'http', endpoint: 'http://localhost:9090' } },
    ];
    const result = client.resolveTransport({ spec: { adapter: 'claude-code', provider: 'anthropic' } }, bindings);
    assert.equal(result.protocol, 'http');
    assert.equal(result.endpoint, 'http://localhost:9090');
    assert.equal(result.codec, 'anthropic');
  });

  it('returns websocket + endpoint from a binding with websocket protocol', () => {
    const client = createAgentMuxClient();
    const bindings = [
      { spec: { adapterRef: 'claude-code', protocol: 'websocket', endpoint: 'ws://agent.example.com:8080' } },
    ];
    const result = client.resolveTransport({ spec: { adapter: 'claude-code', provider: 'anthropic' } }, bindings);
    assert.equal(result.protocol, 'websocket');
    assert.equal(result.endpoint, 'ws://agent.example.com:8080');
  });

  it('ignores a binding whose adapterRef does not match the stack adapter', () => {
    const client = createAgentMuxClient();
    const bindings = [
      { spec: { adapterRef: 'other-adapter', protocol: 'http', endpoint: 'http://other:9090' } },
    ];
    const result = client.resolveTransport({ spec: { adapter: 'claude-code', provider: 'anthropic' } }, bindings);
    assert.equal(result.protocol, 'stdio');
  });

  it('defaults to stdio when transportBindings is undefined', () => {
    const client = createAgentMuxClient();
    const result = client.resolveTransport({ spec: { adapter: 'aider', provider: 'openai' } });
    assert.equal(result.protocol, 'stdio');
    assert.equal(result.codec, 'openai');
  });

  it('falls back to claude-code adapter when stack spec has no adapter or baseAgent', () => {
    const client = createAgentMuxClient();
    const result = client.resolveTransport({ spec: {} }, []);
    assert.equal(result.protocol, 'stdio');
    assert.equal(result.codec, 'anthropic');
  });
});

describe('createAgentMuxClient — createAgentJob transport env vars', () => {
  it('injects AGENT_MUX_TRANSPORT=stdio when no transport binding found', () => {
    const client = createAgentMuxClient();
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      provider: 'anthropic',
      org: 'test-org',
      transportBindings: [],
    });
    const env = jobManifest.spec.template.spec.containers[0].env;
    const transport = env.find(e => e.name === 'AGENT_MUX_TRANSPORT');
    const codec = env.find(e => e.name === 'TRANSPORT_MUX_CODEC');
    assert.ok(transport, 'AGENT_MUX_TRANSPORT must be set');
    assert.equal(transport.value, 'stdio');
    assert.ok(codec, 'TRANSPORT_MUX_CODEC must be set');
    assert.equal(codec.value, 'anthropic');
  });

  it('injects AGENT_MUX_TRANSPORT=http and AGENT_MUX_TRANSPORT_ENDPOINT when binding found', () => {
    const client = createAgentMuxClient();
    const bindings = [
      { spec: { adapterRef: 'claude-code', protocol: 'http', endpoint: 'http://mux.internal:9090' } },
    ];
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      provider: 'anthropic',
      org: 'test-org',
      transportBindings: bindings,
    });
    const env = jobManifest.spec.template.spec.containers[0].env;
    const transport = env.find(e => e.name === 'AGENT_MUX_TRANSPORT');
    const endpoint = env.find(e => e.name === 'AGENT_MUX_TRANSPORT_ENDPOINT');
    const codec = env.find(e => e.name === 'TRANSPORT_MUX_CODEC');
    assert.equal(transport.value, 'http');
    assert.ok(endpoint, 'AGENT_MUX_TRANSPORT_ENDPOINT must be set for non-stdio');
    assert.equal(endpoint.value, 'http://mux.internal:9090');
    assert.equal(codec.value, 'anthropic');
  });

  it('does not set AGENT_MUX_TRANSPORT_ENDPOINT for stdio transport', () => {
    const client = createAgentMuxClient();
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      provider: 'anthropic',
      org: 'test-org',
    });
    const env = jobManifest.spec.template.spec.containers[0].env;
    const endpoint = env.find(e => e.name === 'AGENT_MUX_TRANSPORT_ENDPOINT');
    assert.equal(endpoint, undefined);
  });
});

describe('createAgentMuxClient — Jitsi sidecar job contract from docs/jitsi/06-agent-meeting-participation.md', () => {
  it('adds the documented sidecar container, socket env vars, shared volume, lifecycle, and resources', () => {
    const client = createAgentMuxClient();
    const { jobManifest } = client.createAgentJob({
      adapter: 'claude-code',
      provider: 'anthropic',
      org: 'test-org',
      runId: 'run-jitsi',
      stackName: 'standup-summarizer',
      jitsi: {
        roomUrl: 'https://meet.example.test/standup',
        jwt: 'jwt-token',
        roomId: 'standup',
        participantName: 'Standup Bot',
        role: 'observer',
        capabilities: { audio: 'listen', chat: 'readwrite', screenshare: 'none' },
        tts: { provider: 'openai', voice: 'nova', speed: '1.0' },
        stt: { provider: 'deepgram' },
        vad: { provider: 'local-vad' },
        goodbyeMessage: 'Standup Bot is leaving the meeting.',
      },
    });

    const podSpec = jobManifest.spec.template.spec;
    const agent = podSpec.containers.find((container) => container.name === 'agent');
    const sidecar = podSpec.containers.find((container) => container.name === 'jitsi-agent-sidecar');
    assert.ok(sidecar, 'meeting-aware jobs must include jitsi-agent-sidecar');

    const agentEnv = Object.fromEntries(agent.env.map((entry) => [entry.name, entry.value]));
    assert.equal(agentEnv.JITSI_AGENT_SOCKET, '/tmp/jitsi-agent.sock');
    assert.equal(agentEnv.JITSI_MEETING_ACTIVE, 'true');

    const sidecarEnv = Object.fromEntries(sidecar.env.map((entry) => [entry.name, entry.value]));
    assert.equal(sidecar.image, 'krate/jitsi-agent-sidecar:latest');
    assert.equal(sidecarEnv.JITSI_ROOM_URL, 'https://meet.example.test/standup');
    assert.equal(sidecarEnv.JITSI_JWT, 'jwt-token');
    assert.equal(sidecarEnv.JITSI_ROOM_ID, 'standup');
    assert.equal(sidecarEnv.JITSI_PARTICIPANT_NAME, 'Standup Bot');
    assert.equal(sidecarEnv.JITSI_PARTICIPANT_ROLE, 'observer');
    assert.equal(sidecarEnv.JITSI_AUDIO_MODE, 'listen');
    assert.equal(sidecarEnv.JITSI_CHAT_MODE, 'readwrite');
    assert.equal(sidecarEnv.JITSI_SCREENSHARE_MODE, 'none');
    assert.equal(sidecarEnv.JITSI_TTS_PROVIDER, 'openai');
    assert.equal(sidecarEnv.JITSI_TTS_VOICE, 'nova');
    assert.equal(sidecarEnv.JITSI_TTS_SPEED, '1.0');
    assert.equal(sidecarEnv.JITSI_STT_PROVIDER, 'deepgram');
    assert.equal(sidecarEnv.JITSI_VAD_PROVIDER, 'local-vad');
    assert.equal(sidecarEnv.JITSI_GOODBYE_MESSAGE, 'Standup Bot is leaving the meeting.');
    assert.equal(sidecarEnv.AGENT_SOCKET_PATH, '/tmp/jitsi-agent.sock');

    assert.deepEqual(agent.volumeMounts.find((mount) => mount.name === 'agent-socket'), { name: 'agent-socket', mountPath: '/tmp' });
    assert.deepEqual(sidecar.volumeMounts, [{ name: 'agent-socket', mountPath: '/tmp' }]);
    assert.deepEqual(podSpec.volumes.find((volume) => volume.name === 'agent-socket'), { name: 'agent-socket', emptyDir: {} });
    assert.deepEqual(sidecar.lifecycle.preStop.exec.command, ['node', 'bin/graceful-leave.mjs']);
    assert.deepEqual(sidecar.resources.requests, { cpu: '200m', memory: '256Mi' });
    assert.deepEqual(sidecar.resources.limits, { cpu: '1000m', memory: '1Gi' });
  });
});
