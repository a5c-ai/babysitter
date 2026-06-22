import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createResource } from './resource-model.js';

export const AGENT_MUX_CLIENT_BOUNDARY = {
  role: 'adapters-client',
  scope: 'HTTP/SSE adapter for Agent Adapter gateway — capabilities, sessions, events, transcripts, K8s Job dispatch',
  owns: ['gateway HTTP calls', 'SSE event streaming', 'transcript reconciliation', 'K8s Job manifest generation', 'Job lifecycle management'],
  delegatesTo: ['resource-model', 'kubernetes-resource-gateway'],
  mustNotOwn: ['secret values', 'permission review', 'resource persistence']
};

/** Known agent adapter names for job dispatch. */
const KNOWN_ADAPTERS = new Set([
  'claude-code', 'codex', 'gemini-cli', 'aider', 'goose',
  'amp', 'roo-code', 'kilo-code', 'cline', 'cursor',
]);

// Kradle adapter/baseAgent names → the harness identifier the `adapters launch`
// CLI expects (packages/adapters/cli). They differ: kradle uses 'claude-code'
// and 'gemini-cli', the launcher uses 'claude' and 'gemini'. An unmapped adapter
// passes through unchanged.
const HARNESS_MAP = {
  'claude-code': 'claude',
  'gemini-cli': 'gemini',
};

/**
 * Map a kradle adapter/baseAgent name to the `adapters launch` harness name.
 * @param {string} adapter
 * @returns {string}
 */
export function resolveHarness(adapter) {
  return HARNESS_MAP[adapter] || adapter;
}

/**
 * Resolve the effective adapter name for a stack spec. `adapter: 'default'` is a
 * sentinel — the Helm-installed builtin stacks (e.g. the assistant) set it to
 * mean "use the base agent's adapter". An empty adapter falls back the same way.
 * Without this, 'default' reaches the job builder and is rejected as
 * "Unknown adapter: default", so every dispatch of a builtin stack fails.
 */
export function resolveAdapterName(spec) {
  const adapter = spec?.adapter;
  if (adapter && adapter !== 'default') return adapter;
  return spec?.baseAgent || 'claude-code';
}

const JITSI_SOCKET_PATH = '/tmp/jitsi-agent.sock';

function jitsiResourceProfile(audioMode = 'listen') {
  if (audioMode === 'both') {
    return {
      requests: { cpu: '500m', memory: '512Mi' },
      limits: { cpu: '2000m', memory: '2Gi' },
    };
  }
  if (audioMode === 'speak') {
    return {
      requests: { cpu: '500m', memory: '512Mi' },
      limits: { cpu: '2000m', memory: '2Gi' },
    };
  }
  if (audioMode === 'listen') {
    return {
      requests: { cpu: '200m', memory: '256Mi' },
      limits: { cpu: '1000m', memory: '1Gi' },
    };
  }
  return {
    requests: { cpu: '50m', memory: '128Mi' },
    limits: { cpu: '200m', memory: '256Mi' },
  };
}

function createJitsiSidecarContainer(jitsi = {}) {
  const capabilities = jitsi.capabilities || {};
  const tts = jitsi.tts || {};
  const stt = jitsi.stt || {};
  const vad = jitsi.vad || {};
  const audioMode = capabilities.audio || jitsi.audioMode || 'listen';
  const chatMode = capabilities.chat || jitsi.chatMode || 'read';
  const screenshareMode = capabilities.screenshare || jitsi.screenshareMode || 'none';
  const env = [
    { name: 'JITSI_ROOM_URL', value: jitsi.roomUrl || '' },
    { name: 'JITSI_JWT', value: jitsi.jwt || '' },
    { name: 'JITSI_ROOM_ID', value: jitsi.roomId || '' },
    { name: 'JITSI_PARTICIPANT_NAME', value: jitsi.participantName || jitsi.stackName || 'Kradle Agent' },
    { name: 'JITSI_PARTICIPANT_ROLE', value: jitsi.role || 'observer' },
    { name: 'JITSI_GOODBYE_MESSAGE', value: jitsi.goodbyeMessage || 'Kradle agent is leaving the meeting.' },
    { name: 'JITSI_AUDIO_MODE', value: audioMode },
    { name: 'JITSI_CHAT_MODE', value: chatMode },
    { name: 'JITSI_SCREENSHARE_MODE', value: screenshareMode },
    { name: 'AGENT_SOCKET_PATH', value: JITSI_SOCKET_PATH },
  ];
  if (tts.provider) env.push({ name: 'JITSI_TTS_PROVIDER', value: tts.provider });
  if (tts.voice) env.push({ name: 'JITSI_TTS_VOICE', value: tts.voice });
  if (tts.speed) env.push({ name: 'JITSI_TTS_SPEED', value: String(tts.speed) });
  if (stt.provider) env.push({ name: 'JITSI_STT_PROVIDER', value: stt.provider });
  if (vad.provider) env.push({ name: 'JITSI_VAD_PROVIDER', value: vad.provider });
  if (jitsi.goodbyeMessage) env.push({ name: 'JITSI_GOODBYE_MESSAGE', value: jitsi.goodbyeMessage });

  return {
    name: 'jitsi-agent-sidecar',
    image: jitsi.sidecarImage || 'kradle/jitsi-agent-sidecar:latest',
    env,
    resources: jitsi.resources || jitsiResourceProfile(audioMode),
    volumeMounts: [{ name: 'agent-socket', mountPath: '/tmp' }],
    lifecycle: {
      preStop: {
        exec: {
          command: ['node', 'bin/graceful-leave.mjs'],
        },
      },
    },
  };
}

/**
 * Internal HTTP request helper. Zero external deps — uses node:http / node:https.
 * @param {string} url
 * @param {{ method?: string, body?: object, headers?: Record<string,string>, timeout?: number }} options
 * @returns {Promise<{ status: number, body: any }>}
 */
function httpRequest(url, { method = 'GET', body, headers = {}, timeout = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: { 'Accept': 'application/json', ...headers },
      timeout,
    };
    if (body) {
      const payload = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = transport.request(opts, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Parse SSE text into an array of parsed JSON data payloads.
 * Each `data: {...}` line is extracted; malformed JSON is silently skipped.
 * @param {string} text
 * @returns {object[]}
 */
export function parseSseLines(text) {
  const events = [];
  for (const block of text.split('\n\n')) {
    for (const line of block.split('\n')) {
      if (line.startsWith('data: ')) {
        try { events.push(JSON.parse(line.slice(6))); } catch { /* skip malformed */ }
      }
    }
  }
  return events;
}

/**
 * Map provider name to codec identifier.
 * @param {string} provider
 * @returns {'anthropic'|'openai'|'google'}
 */
function deriveCodec(provider) {
  const map = { anthropic: 'anthropic', openai: 'openai', google: 'google', gemini: 'google' };
  return map[provider] || 'anthropic';
}

/**
 * @param {{ gateway?: string, enabled?: boolean, resourceGateway?: object }} options
 */
export function createAgentMuxClient(options = {}) {
  const envGateway = process.env.AGENT_MUX_URL || process.env.AGENT_GATEWAY_URL || '';
  const { gateway = envGateway, enabled = !!envGateway, resourceGateway = null } = options;

  return {
    role: 'adapters-client',

    isAvailable() {
      return enabled && !!gateway;
    },

    /**
     * Resolve the transport config for a stack from its AgentTransportBinding.
     * Defaults to 'stdio' for local subprocess adapters when no binding is found.
     *
     * @param {object} stack - AgentStack resource or plain spec object
     * @param {object[]} transportBindings - Array of AgentTransportBinding resources
     * @returns {{ protocol: string, endpoint: string, codec: string }}
     */
    resolveTransport(stack, transportBindings = []) {
      const adapterName = resolveAdapterName(stack?.spec);
      const provider = stack?.spec?.provider || 'anthropic';
      const binding = (transportBindings || []).find(b => b.spec?.adapterRef === adapterName);

      if (binding) {
        const protocol = binding.spec.protocol || 'http';
        const endpoint = binding.spec.endpoint || '';
        const codec = deriveCodec(provider);
        return { protocol, endpoint, codec };
      }

      return { protocol: 'stdio', endpoint: '', codec: deriveCodec(provider) };
    },

    /**
     * Query adapter capabilities from the gateway.
     * GET {gateway}/api/v1/agents/{adapter}/capabilities
     * @param {string} adapter
     * @returns {Promise<object|null>}
     */
    async queryCapabilities(adapter) {
      if (!this.isAvailable()) return null;
      try {
        const { status, body } = await httpRequest(`${gateway}/api/v1/agents/${encodeURIComponent(adapter)}/capabilities`);
        if (status >= 200 && status < 300) return body;
        return null;
      } catch {
        return null;
      }
    },

    /**
     * Launch a new agent session through the gateway.
     * POST {gateway}/api/v1/sessions
     * @param {{ stack: object, contextBundle?: object, permissionSnapshot?: object, workspace?: object }} params
     * @returns {Promise<{ runId: string, sessionId: string }|null>}
     */
    async launchSession({ stack, contextBundle, permissionSnapshot, workspace }) {
      if (!this.isAvailable()) return null;
      try {
        const payload = {
          agent: stack?.baseAgent,
          model: stack?.model,
          prompt: contextBundle?.prompt,
          systemPrompt: contextBundle?.systemPrompt,
          attachments: contextBundle?.attachments,
          workspace: workspace?.mountPath || '/workspace',
        };
        const { status, body } = await httpRequest(`${gateway}/api/v1/sessions`, { method: 'POST', body: payload });
        if (status >= 200 && status < 300 && body?.runId && body?.sessionId) {
          return { runId: body.runId, sessionId: body.sessionId };
        }
        return null;
      } catch {
        return null;
      }
    },

    /**
     * Get session status from the gateway.
     * GET {gateway}/api/v1/sessions/{sessionId}
     * @param {string} sessionId
     * @returns {Promise<object|null>}
     */
    async getSessionStatus(sessionId) {
      if (!this.isAvailable()) return null;
      try {
        const { status, body } = await httpRequest(`${gateway}/api/v1/sessions/${encodeURIComponent(sessionId)}`);
        if (status >= 200 && status < 300) return body;
        return null;
      } catch {
        return null;
      }
    },

    /**
     * Subscribe to SSE events for a run. Reconnects with exponential backoff (1s, 2s, 4s... max 30s).
     * GET {gateway}/api/v1/runs/{runId}/events (Accept: text/event-stream)
     * @param {string} runId
     * @param {(event: object) => void} callback
     * @returns {{ abort: () => void }}
     */
    subscribeToEvents(runId, callback) {
      let aborted = false;
      let currentReq = null;
      let backoff = 1000;

      const connect = () => {
        if (aborted) return;
        try {
          const parsed = new URL(`${gateway}/api/v1/runs/${encodeURIComponent(runId)}/events`);
          const transport = parsed.protocol === 'https:' ? https : http;
          const opts = {
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: 'GET',
            headers: { 'Accept': 'text/event-stream' },
          };
          currentReq = transport.request(opts, (res) => {
            if (aborted) return;
            // Reset backoff on successful connection
            backoff = 1000;
            let buffer = '';
            res.on('data', (chunk) => {
              if (aborted) return;
              buffer += chunk.toString();
              // Process complete SSE blocks (separated by double newlines)
              const parts = buffer.split('\n\n');
              // Keep the last part as it may be incomplete
              buffer = parts.pop() || '';
              for (const block of parts) {
                for (const line of block.split('\n')) {
                  if (line.startsWith('data: ')) {
                    try {
                      callback(JSON.parse(line.slice(6)));
                    } catch { /* skip malformed */ }
                  }
                }
              }
            });
            res.on('end', () => {
              if (!aborted) reconnect();
            });
            res.on('error', () => {
              if (!aborted) reconnect();
            });
          });
          currentReq.on('error', () => {
            if (!aborted) reconnect();
          });
          currentReq.end();
        } catch {
          if (!aborted) reconnect();
        }
      };

      const reconnect = () => {
        if (aborted) return;
        const delay = backoff;
        backoff = Math.min(backoff * 2, 30000);
        setTimeout(connect, delay);
      };

      connect();

      return {
        abort() {
          aborted = true;
          if (currentReq) {
            currentReq.destroy();
            currentReq = null;
          }
        }
      };
    },

    /**
     * Generate a Kubernetes Job manifest to run an agent as an isolated Job
     * instead of a subprocess of the API server.
     *
     * @param {{ adapter: string, provider?: string, model?: string, workspace?: { pvcName?: string }, prompt?: { system?: string, task?: string }, env?: Record<string,string>, org: string, runId?: string, stackName?: string, budget?: { maxDurationSeconds?: number }, resources?: object, image?: string, serviceAccount?: string, callbackUrl?: string, jitsi?: object, meetingContext?: object, modelSecretName?: string }} config
     * @returns {{ jobManifest: object, jobName: string }}
     */
    createAgentJob(config = {}) {
      const {
        adapter,
        provider = 'anthropic',
        model,
        org,
        runId = randomUUID(),
        stackName,
        budget,
        image,
        serviceAccount,
        callbackUrl,
        prompt,
        env = {},
        workspace,
        resources: resourceLimits,
        transportBindings = [],
        jitsi,
        meetingContext = null,
        modelSecretName = null,
      } = config;

      // Validate adapter
      if (!adapter || typeof adapter !== 'string') {
        throw new Error('createAgentJob requires a valid adapter name');
      }
      if (!KNOWN_ADAPTERS.has(adapter)) {
        throw new Error(`Unknown adapter: ${adapter}. Known adapters: ${[...KNOWN_ADAPTERS].join(', ')}`);
      }
      if (!org) {
        throw new Error('createAgentJob requires an org');
      }

      const jobName = `kradle-agent-${runId}`;
      const pvcName = workspace?.pvcName;

      const transportConfig = this.resolveTransport(
        { spec: { adapter, provider } },
        transportBindings
      );
      const jitsiContext = meetingContext || jitsi || null;

      const containerEnv = [
        { name: 'KRADLE_ORG', value: org },
        { name: 'KRADLE_RUN_ID', value: runId },
        { name: 'KRADLE_WORKSPACE_PATH', value: '/workspace' },
        // Harness/provider/model the entrypoint wrapper passes to `adapters launch`.
        // adapter is a kradle name (e.g. 'claude-code'); resolveHarness maps it to
        // the launcher's harness id (e.g. 'claude').
        { name: 'KRADLE_HARNESS', value: resolveHarness(adapter) },
        { name: 'KRADLE_PROVIDER', value: provider },
        ...(model ? [{ name: 'KRADLE_MODEL', value: model }] : []),
        { name: 'AGENT_MUX_TRANSPORT', value: transportConfig.protocol },
        { name: 'TRANSPORT_MUX_CODEC', value: transportConfig.codec },
        ...(transportConfig.endpoint ? [{ name: 'AGENT_MUX_TRANSPORT_ENDPOINT', value: transportConfig.endpoint }] : []),
        ...(callbackUrl ? [{ name: 'KRADLE_CALLBACK_URL', value: callbackUrl }] : []),
        ...(prompt?.system ? [{ name: 'AGENT_SYSTEM_PROMPT', value: prompt.system }] : []),
        ...(prompt?.task ? [{ name: 'AGENT_TASK', value: prompt.task }] : []),
        ...(jitsiContext ? [
          { name: 'JITSI_AGENT_SOCKET', value: JITSI_SOCKET_PATH },
          { name: 'JITSI_MEETING_ACTIVE', value: 'true' },
        ] : []),
        ...Object.entries(env).map(([name, value]) => ({ name, value: String(value) })),
      ];
      const volumes = pvcName ? [{ name: 'workspace', persistentVolumeClaim: { claimName: pvcName } }] : [];
      const agentVolumeMounts = pvcName ? [{ name: 'workspace', mountPath: '/workspace' }] : [];
      if (jitsiContext) {
        agentVolumeMounts.push({ name: 'agent-socket', mountPath: '/tmp' });
        volumes.push({ name: 'agent-socket', emptyDir: {} });
      }
      // The model-provider secret (API key + endpoint) is granted via an
      // AgentSecretGrant and must reach the agent pod. K8s secret refs are
      // namespace-scoped, so the secret is expected to live in the Job's own
      // org namespace (projected there by the chart). It is REQUIRED, never
      // optional: a missing provider secret must hard-fail the pod rather than
      // silently launch an unauthenticated run.
      const envFrom = modelSecretName
        ? [{ secretRef: { name: modelSecretName, optional: false } }]
        : undefined;

      const containers = [{
        name: 'agent',
        image: image || process.env.KRADLE_AGENT_IMAGE || 'ghcr.io/a5c-ai/adapters:latest',
        // The runtime image's entrypoint wrapper (kradle-agent-entrypoint.mjs)
        // runs `adapters launch <harness> <provider>` through the JS transport-mux
        // proxy and POSTs the result to KRADLE_CALLBACK_URL. It reads the harness/
        // provider/model and task from env (below), so no inline command args.
        command: ['node', 'packages/adapters/cli/kradle-agent-entrypoint.mjs'],
        env: containerEnv,
        ...(envFrom ? { envFrom } : {}),
        resources: resourceLimits || {
          requests: { cpu: '500m', memory: '1Gi' },
          limits: { cpu: '2', memory: '4Gi' },
        },
        volumeMounts: agentVolumeMounts,
      }];

      if (jitsiContext) {
        containers.push(createJitsiSidecarContainer({ ...jitsiContext, stackName }));
      }

      const jobManifest = {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
          name: jobName,
          namespace: `kradle-org-${org}`,
          labels: {
            'kradle.a5c.ai/component': 'agent-run',
            'kradle.a5c.ai/run': runId,
            ...(stackName ? { 'kradle.a5c.ai/stack': stackName } : {}),
            'kradle.a5c.ai/org': org,
          },
        },
        spec: {
          backoffLimit: 0,
          activeDeadlineSeconds: budget?.maxDurationSeconds || 3600,
          template: {
            metadata: {
              labels: {
                'kradle.a5c.ai/component': 'agent-run',
                'kradle.a5c.ai/run': runId,
              },
            },
            spec: {
              restartPolicy: 'Never',
              serviceAccountName: serviceAccount || 'kradle',
              containers,
              volumes,
            },
          },
        },
      };

      return { jobManifest, jobName };
    },

    /**
     * Submit a Job manifest to Kubernetes via the resource gateway.
     *
     * @param {object} jobManifest - Full K8s Job manifest
     * @returns {Promise<{ jobName: string, namespace: string, submitted: boolean }>}
     */
    async submitAgentJob(jobManifest) {
      if (!resourceGateway) {
        throw new Error('submitAgentJob requires a resourceGateway');
      }
      const jobName = jobManifest?.metadata?.name;
      const namespace = jobManifest?.metadata?.namespace;
      await resourceGateway.apply(jobManifest);
      return { jobName, namespace, submitted: true };
    },

    /**
     * Get the status of a submitted K8s Job.
     *
     * @param {string} jobName
     * @param {string} namespace
     * @returns {Promise<{ active: number, succeeded: number, failed: number, startTime: string|null, completionTime: string|null, conditions: object[] }>}
     */
    async getJobStatus(jobName, namespace) {
      if (!resourceGateway) {
        throw new Error('getJobStatus requires a resourceGateway');
      }
      const job = await resourceGateway.get('Job', jobName);
      if (!job) {
        return { active: 0, succeeded: 0, failed: 0, startTime: null, completionTime: null, conditions: [] };
      }
      const status = job.status || {};
      return {
        active: status.active || 0,
        succeeded: status.succeeded || 0,
        failed: status.failed || 0,
        startTime: status.startTime || null,
        completionTime: status.completionTime || null,
        conditions: status.conditions || [],
      };
    },

    /**
     * Retrieve logs from a K8s Job's pod.
     *
     * @param {string} jobName
     * @param {string} namespace
     * @returns {Promise<string>}
     */
    async getJobLogs(jobName, namespace) {
      if (!resourceGateway) {
        throw new Error('getJobLogs requires a resourceGateway');
      }
      // Use the resource gateway's log retrieval (reads pod logs for the job)
      if (typeof resourceGateway.getLogs === 'function') {
        return resourceGateway.getLogs('Job', jobName, namespace);
      }
      // Fallback: return empty string if gateway doesn't support logs
      return '';
    },

    /**
     * Delete a completed K8s Job and its pods.
     *
     * @param {string} jobName
     * @param {string} namespace
     * @returns {Promise<{ deleted: boolean }>}
     */
    async deleteJob(jobName, namespace) {
      if (!resourceGateway) {
        throw new Error('deleteJob requires a resourceGateway');
      }
      await resourceGateway.delete('Job', jobName);
      return { deleted: true };
    },

    /**
     * Reconcile SSE events into an AgentSessionTranscript resource.
     * Parses events by role, computes cost, creates the resource via createResource().
     * @param {string} sessionId
     * @param {object[]} events
     * @param {{ namespace?: string, organizationRef?: string }} options
     * @returns {object} AgentSessionTranscript resource
     */
    reconcileTranscript(sessionId, events, { namespace = 'default', organizationRef = 'default' } = {}) {
      const messages = [];
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      for (const event of events) {
        if (!event || typeof event !== 'object') continue;
        const role = event.role || 'unknown';
        const content = event.content || event.text || event.message || '';
        const node = {
          role,
          content: typeof content === 'string' ? content : JSON.stringify(content),
          timestamp: event.timestamp || new Date().toISOString(),
        };
        if (event.toolUse) node.toolUse = event.toolUse;
        if (event.toolResult) node.toolResult = event.toolResult;
        messages.push(node);

        // Accumulate token usage if present
        if (event.usage) {
          totalInputTokens += event.usage.inputTokens || 0;
          totalOutputTokens += event.usage.outputTokens || 0;
        }
      }

      return createResource(
        'AgentSessionTranscript',
        { name: `transcript-${sessionId}`, namespace },
        {
          organizationRef,
          sessionRef: sessionId,
          messages,
          cost: {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens,
          },
        },
        { phase: 'Reconciled', reconciledAt: new Date().toISOString() }
      );
    },
  };
}
