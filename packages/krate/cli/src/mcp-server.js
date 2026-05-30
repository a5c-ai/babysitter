import { createKrateApiController } from '../../core/src/api-controller.js';
import { createKubernetesResourceGateway } from '../../core/src/kubernetes-resource-gateway.js';
import { createAgentSecretGrantController } from '../../core/src/agent-secret-config-grant-controller.js';
import { createAuditController } from '../../core/src/audit-controller.js';
import { orgNamespaceName } from '../../core/src/org-scoping.js';
import crypto from 'node:crypto';

export const MCP_TOOLS = [
  { name: 'krate_list_resources', description: 'List resources of a given kind', inputSchema: { type: 'object', properties: { kind: { type: 'string' } }, required: ['kind'] } },
  { name: 'krate_get_resource', description: 'Get a single resource by kind and name', inputSchema: { type: 'object', properties: { kind: { type: 'string' }, name: { type: 'string' } }, required: ['kind', 'name'] } },
  { name: 'krate_apply_resource', description: 'Create or update a resource', inputSchema: { type: 'object', properties: { resource: { type: 'object' } }, required: ['resource'] } },
  { name: 'krate_delete_resource', description: 'Delete a resource', inputSchema: { type: 'object', properties: { kind: { type: 'string' }, name: { type: 'string' } }, required: ['kind', 'name'] } },
  { name: 'krate_snapshot', description: 'Get full organization snapshot', inputSchema: { type: 'object', properties: {} } },
  { name: 'krate_search', description: 'Search resources by query', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'krate_list_stacks', description: 'List agent stacks', inputSchema: { type: 'object', properties: {} } },
  {
    name: 'krate_dispatch_agent',
    description: 'Dispatch an agent run from an AgentDefinition or legacy AgentStack',
    inputSchema: {
      type: 'object',
      properties: {
        agentDefinition: { type: 'string' },
        definitionRef: { type: 'string' },
        stackRef: { type: 'string' },
        agentStack: { type: 'string' },
        input: { type: 'object' },
      },
      anyOf: [
        { required: ['agentDefinition'] },
        { required: ['definitionRef'] },
        { required: ['stackRef'] },
        { required: ['agentStack'] },
      ],
    },
  },
  { name: 'krate_list_agents', description: 'List agent definitions enriched with persona profiles', inputSchema: { type: 'object', properties: {} } },
  { name: 'krate_get_agent_profile', description: 'Get a resolved agent definition profile', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
  { name: 'krate_create_agent', description: 'Create an AgentPersona and AgentDefinition binding', inputSchema: { type: 'object', properties: { name: { type: 'string' }, org: { type: 'string' }, displayName: { type: 'string' }, stackRef: { type: 'string' }, personaSpec: { type: 'object' }, definitionSpec: { type: 'object' } }, required: ['name', 'org', 'displayName', 'stackRef'] } },
  { name: 'krate_list_secrets', description: 'List AgentSecretGrant resources in an org namespace', inputSchema: { type: 'object', properties: { org: { type: 'string' } } } },
  { name: 'krate_create_secret', description: 'Create an AgentSecretGrant resource', inputSchema: { type: 'object', properties: { name: { type: 'string' }, org: { type: 'string' }, agentRef: { type: 'string' }, secretRef: { type: 'string' }, permissions: { type: 'array', items: { type: 'string' } } }, required: ['name', 'org', 'agentRef', 'secretRef'] } },
  { name: 'krate_create_stack', description: 'Create an AgentStack resource', inputSchema: { type: 'object', properties: { name: { type: 'string' }, org: { type: 'string' }, spec: { type: 'object' } }, required: ['name', 'org'] } },
  { name: 'krate_sync_external', description: 'Trigger an external sync for a binding', inputSchema: { type: 'object', properties: { bindingName: { type: 'string' }, kind: { type: 'string' }, localName: { type: 'string' }, spec: { type: 'object' }, externalEnvelope: { type: 'object' }, watermark: { type: 'string' } }, required: ['bindingName', 'kind', 'localName'] } },
  { name: 'krate_resolve_conflict', description: 'Resolve an external sync conflict', inputSchema: { type: 'object', properties: { conflictName: { type: 'string' }, strategy: { type: 'string' }, resolvedValue: {} }, required: ['conflictName', 'strategy'] } },
  { name: 'krate_audit_query', description: 'Query audit events with optional org/action/time filters', inputSchema: { type: 'object', properties: { org: { type: 'string' }, action: { type: 'string' }, since: { type: 'string' }, until: { type: 'string' }, limit: { type: 'number' }, offset: { type: 'number' } } } },
  { name: 'krate_model_catalog', description: 'List all available models (internal KServe + external cloud LLM) from the unified model catalog', inputSchema: { type: 'object', properties: { org: { type: 'string' } } } },
  { name: 'krate_list_model_routes', description: 'List KrateModelRoute resources for model routing', inputSchema: { type: 'object', properties: {} } },
  { name: 'krate_create_model_route', description: 'Create a KrateModelRoute for internal or external model routing', inputSchema: { type: 'object', properties: { name: { type: 'string' }, org: { type: 'string' }, modelName: { type: 'string' }, routeType: { type: 'string', enum: ['internal', 'external'] }, inferenceServiceRef: { type: 'string' }, provider: { type: 'string' }, endpoint: { type: 'string' }, modelId: { type: 'string' } }, required: ['name', 'org', 'modelName', 'routeType'] } },
  { name: 'krate_list_virtual_models', description: 'List KrateVirtualModel resources for programmable model abstraction', inputSchema: { type: 'object', properties: {} } },
  { name: 'krate_create_virtual_model', description: 'Create a KrateVirtualModel with declarative routing rules, hooks, and session config', inputSchema: { type: 'object', properties: { name: { type: 'string' }, org: { type: 'string' }, modelName: { type: 'string' }, routes: { type: 'array', items: { type: 'object', properties: { modelRouteRef: { type: 'string' }, weight: { type: 'number' }, priority: { type: 'number' } }, required: ['modelRouteRef'] } } }, required: ['name', 'org', 'modelName', 'routes'] } },
  { name: 'krate_create_meeting', description: 'Create a Jitsi meeting room', inputSchema: { type: 'object', properties: { org: { type: 'string' }, displayName: { type: 'string' }, templateRef: { type: 'string' }, ttlMinutes: { type: 'number' }, inviteAgentStacks: { type: 'array', items: { type: 'string' } } }, required: ['displayName'] } },
  { name: 'krate_join_meeting', description: 'Get a JWT and URL to join an active Jitsi meeting', inputSchema: { type: 'object', properties: { org: { type: 'string' }, meetingRef: { type: 'string' }, participantName: { type: 'string' }, participantRef: { type: 'string' } }, required: ['meetingRef'] } },
  { name: 'krate_list_meetings', description: 'List active and recent Jitsi meetings', inputSchema: { type: 'object', properties: { org: { type: 'string' }, status: { type: 'string', enum: ['active', 'ended', 'all'] } } } },
  { name: 'krate_invite_to_meeting', description: 'Invite a user or agent to an active Jitsi meeting', inputSchema: { type: 'object', properties: { org: { type: 'string' }, meetingRef: { type: 'string' }, participantType: { type: 'string', enum: ['user', 'agentStack'] }, participantRef: { type: 'string' }, role: { type: 'string' } }, required: ['meetingRef', 'participantType', 'participantRef'] } },
];

export const MCP_PROMPTS = [
  {
    name: 'krate_workspace_setup',
    description: 'Guide for setting up a new krate workspace',
  },
  {
    name: 'krate_stack_config',
    description: 'Help configuring an agent stack',
  },
  {
    name: 'krate_troubleshoot',
    description: 'Diagnose common krate issues',
  },
];

export const MCP_RESOURCES = [
  {
    uri: 'krate://snapshot',
    name: 'Workspace Snapshot',
    description: 'Current org runtime snapshot',
    mimeType: 'application/json',
  },
  {
    uri: 'krate://stacks',
    name: 'Agent Stacks',
    description: 'List of configured agent stacks',
    mimeType: 'application/json',
  },
  {
    uri: 'krate://models',
    name: 'Model Catalog',
    description: 'Unified catalog of internal and external models',
    mimeType: 'application/json',
  },
];

const PROMPT_MESSAGES = {
  krate_workspace_setup: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: 'How do I set up a new krate workspace?',
      },
    },
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: [
          'To set up a new krate workspace:',
          '',
          '1. Install the CLI: npm install -g @a5c-ai/krate-cli',
          '2. Configure your Kubernetes cluster context: kubectl config use-context <your-cluster>',
          '3. Apply the Krate CRDs: kubectl apply -f https://krate.a5c.ai/crds/latest',
          '4. Create an Organization resource: krate apply --file org.yaml',
          '5. Verify the workspace: krate status',
          '',
          'Use `krate help` to see all available commands.',
        ].join('\n'),
      },
    },
  ],
  krate_stack_config: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: 'How do I configure an agent stack?',
      },
    },
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: [
          'To configure an agent stack:',
          '',
          '1. Create a YAML file for your AgentStack resource:',
          '   apiVersion: krate.a5c.ai/v1',
          '   kind: AgentStack',
          '   metadata:',
          '     name: my-stack',
          '     namespace: krate-org-default',
          '   spec:',
          '     organizationRef: default',
          '     baseAgent: claude-code',
          '     adapterRef: github',
          '',
          '2. Apply it: krate apply --file stack.yaml',
          '3. List stacks: krate stacks',
          '4. Dispatch a run: krate dispatch --stack my-stack',
        ].join('\n'),
      },
    },
  ],
  krate_troubleshoot: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: 'How do I diagnose krate issues?',
      },
    },
    {
      role: 'assistant',
      content: {
        type: 'text',
        text: [
          'Common krate troubleshooting steps:',
          '',
          '1. Check workspace status: krate status',
          '   - Verifies connectivity and resource counts',
          '',
          '2. Check Kubernetes connectivity:',
          '   kubectl get namespaces | grep krate',
          '',
          '3. Inspect agent stack health:',
          '   krate stacks',
          '   krate get AgentStack <name>',
          '',
          '4. Check for resource errors:',
          '   kubectl get agentstacks -A',
          '   kubectl describe agentstack <name> -n krate-org-default',
          '',
          '5. View recent audit events via MCP:',
          '   Use krate_audit_query tool with your org name',
        ].join('\n'),
      },
    },
  ],
};

const SERVER_INFO = {
  name: 'krate',
  version: '0.1.0',
};

const SERVER_CAPABILITIES = {
  tools: {},
  prompts: {},
  resources: {},
};

/**
 * Create an MCP server instance.
 * @param {object} [options]
 * @param {object} [options.controller] - A Krate API controller instance (for testing / DI).
 * @returns {{ start: () => void, stop: () => void, handleMessage: (msg: object) => Promise<object> }}
 */
export function createMcpServer(options = {}) {
  const controller = options.controller || createKrateApiController({
    resourceGateway: createKubernetesResourceGateway(),
  });

  /**
   * Handle a single JSON-RPC 2.0 request object and return the response object.
   * This is the testable core -- no I/O involved.
   */
  async function handleMessage(msg) {
    const id = msg.id ?? null;

    if (msg.method === 'initialize') {
      return jsonrpcResult(id, {
        protocolVersion: '2024-11-05',
        serverInfo: SERVER_INFO,
        capabilities: SERVER_CAPABILITIES,
      });
    }

    if (msg.method === 'notifications/initialized') {
      // Client acknowledgement -- no response required for notifications.
      return null;
    }

    if (msg.method === 'tools/list') {
      return jsonrpcResult(id, { tools: MCP_TOOLS });
    }

    if (msg.method === 'prompts/list') {
      return jsonrpcResult(id, { prompts: MCP_PROMPTS });
    }

    if (msg.method === 'prompts/get') {
      const promptName = msg.params?.name;
      const prompt = MCP_PROMPTS.find((p) => p.name === promptName);
      if (!prompt) {
        return jsonrpcError(id, -32602, `Unknown prompt: ${promptName}`);
      }
      const messages = PROMPT_MESSAGES[promptName] || [];
      return jsonrpcResult(id, {
        description: prompt.description,
        messages,
      });
    }

    if (msg.method === 'resources/list') {
      return jsonrpcResult(id, { resources: MCP_RESOURCES });
    }

    if (msg.method === 'resources/read') {
      const uri = msg.params?.uri;
      const resourceDef = MCP_RESOURCES.find((r) => r.uri === uri);
      if (!resourceDef) {
        return jsonrpcError(id, -32602, `Unknown resource URI: ${uri}`);
      }
      try {
        const content = await readMcpResource(controller, uri);
        return jsonrpcResult(id, {
          contents: [
            {
              uri,
              mimeType: resourceDef.mimeType || 'application/json',
              text: JSON.stringify(content, null, 2),
            },
          ],
        });
      } catch (err) {
        return jsonrpcError(id, -32603, `Failed to read resource ${uri}: ${err.message}`);
      }
    }

    if (msg.method === 'tools/call') {
      const toolName = msg.params?.name;
      const args = msg.params?.arguments || {};

      const toolDef = MCP_TOOLS.find((t) => t.name === toolName);
      if (!toolDef) {
        return jsonrpcError(id, -32602, `Unknown tool: ${toolName}`);
      }

      try {
        const result = await executeTool(controller, toolName, args);
        return jsonrpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        });
      } catch (err) {
        return jsonrpcResult(id, {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
          isError: true,
        });
      }
    }

    return jsonrpcError(id, -32601, `Method not found: ${msg.method}`);
  }

  // --- stdio transport -------------------------------------------------------

  let stdinBuffer = '';
  let running = false;

  function onStdinData(chunk) {
    stdinBuffer += chunk.toString();
    let newlineIdx;
    while ((newlineIdx = stdinBuffer.indexOf('\n')) !== -1) {
      const line = stdinBuffer.slice(0, newlineIdx).trim();
      stdinBuffer = stdinBuffer.slice(newlineIdx + 1);
      if (!line) continue;
      processLine(line);
    }
  }

  async function processLine(line) {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      const resp = jsonrpcError(null, -32700, 'Parse error');
      writeResponse(resp);
      return;
    }
    const resp = await handleMessage(msg);
    if (resp) writeResponse(resp);
  }

  function writeResponse(resp) {
    process.stdout.write(JSON.stringify(resp) + '\n');
  }

  function start() {
    if (running) return;
    running = true;
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', onStdinData);
    process.stdin.resume();
  }

  function stop() {
    if (!running) return;
    running = false;
    process.stdin.removeListener('data', onStdinData);
    process.stdin.pause();
  }

  return { start, stop, handleMessage };
}

// --- Tool execution ----------------------------------------------------------

async function executeTool(controller, toolName, args) {
  switch (toolName) {
    case 'krate_list_resources':
      return controller.listResource(args.kind);

    case 'krate_get_resource':
      return controller.getResource(args.kind, args.name);

    case 'krate_apply_resource':
      return controller.applyResource(args.resource);

    case 'krate_delete_resource':
      return controller.deleteResource(args.kind, args.name);

    case 'krate_snapshot':
      return controller.snapshot();

    case 'krate_search': {
      // Search across the snapshot for resources matching the query string.
      const snapshot = await controller.snapshot();
      const query = (args.query || '').toLowerCase();
      const matches = [];
      for (const [kind, items] of Object.entries(snapshot.resources || {})) {
        for (const item of Array.isArray(items) ? items : []) {
          const name = item.metadata?.name || '';
          const ns = item.metadata?.namespace || '';
          const haystack = `${kind} ${name} ${ns} ${JSON.stringify(item.spec || {})}`.toLowerCase();
          if (haystack.includes(query)) {
            matches.push({ kind, name, namespace: ns });
          }
        }
      }
      return { query: args.query, matches };
    }

    case 'krate_list_stacks':
      return controller.listResource('AgentStack');

    case 'krate_dispatch_agent': {
      const agentDefinition = args.agentDefinition || args.definitionRef;
      const agentStack = args.agentStack || args.stackRef;
      return controller.dispatchAgent({
        ...(agentDefinition ? { agentDefinition } : { agentStack }),
        ...args.input,
      });
    }

    case 'krate_list_agents':
      return listAgents(controller);

    case 'krate_get_agent_profile':
      return getAgentProfile(controller, args.name);

    case 'krate_create_agent':
      return createAgent(controller, args);

    case 'krate_list_secrets': {
      // List AgentSecretGrant resources, optionally filtering by org namespace.
      const result = await controller.listResource('AgentSecretGrant');
      if (!args.org) return result;
      const ns = orgNamespaceName(args.org);
      const items = (result.items || []).filter((r) => r.metadata?.namespace === ns);
      return { ...result, items };
    }

    case 'krate_create_secret': {
      // Create an AgentSecretGrant resource and persist it via applyResource.
      const grantController = createAgentSecretGrantController();
      const result = grantController.createSecretGrant({
        name: args.name,
        orgRef: args.org,
        secretName: args.secretRef,
        grantedTo: args.agentRef,
        permissions: args.permissions || ['read'],
        namespace: orgNamespaceName(args.org),
      });
      if (result.error) throw new Error(result.message);
      return controller.applyResource(result.grant);
    }

    case 'krate_create_stack': {
      // Create an AgentStack resource via applyResource.
      const resource = {
        apiVersion: 'krate.a5c.ai/v1',
        kind: 'AgentStack',
        metadata: {
          name: args.name,
          namespace: orgNamespaceName(args.org),
        },
        spec: {
          organizationRef: args.org,
          ...(args.spec || {}),
        },
      };
      return controller.applyResource(resource);
    }

    case 'krate_sync_external':
      return controller.syncExternalBinding(args.bindingName, {
        kind: args.kind,
        localName: args.localName,
        namespace: args.namespace,
        spec: args.spec || {},
        externalEnvelope: args.externalEnvelope || {},
        watermark: args.watermark,
      });

    case 'krate_resolve_conflict':
      return controller.resolveExternalConflict({
        conflictName: args.conflictName,
        strategy: args.strategy,
        resolvedValue: args.resolvedValue,
      });

    case 'krate_audit_query': {
      // Use an in-memory audit controller that reads logged events from the
      // global event bus snapshot (best-effort; returns empty on cold start).
      const auditController = createAuditController();
      return auditController.query({
        org: args.org,
        action: args.action,
        since: args.since,
        until: args.until,
        limit: args.limit,
        offset: args.offset,
      });
    }

    case 'krate_model_catalog':
      return controller.listModelCatalog(args.org || 'default');

    case 'krate_list_model_routes':
      return controller.listResource('KrateModelRoute');

    case 'krate_create_model_route': {
      const routeSpec = {
        organizationRef: args.org,
        modelName: args.modelName,
        routeType: args.routeType,
      };
      if (args.routeType === 'internal') {
        routeSpec.internal = { inferenceServiceRef: args.inferenceServiceRef || args.modelName, protocol: 'v2' };
      } else {
        routeSpec.external = { provider: args.provider || 'custom', endpoint: args.endpoint, model: args.modelId || args.modelName };
      }
      return controller.applyResource({
        apiVersion: 'krate.a5c.ai/v1alpha1',
        kind: 'KrateModelRoute',
        metadata: { name: args.name, namespace: orgNamespaceName(args.org) },
        spec: routeSpec,
      });
    }

    case 'krate_list_virtual_models':
      return controller.listResource('KrateVirtualModel');

    case 'krate_create_virtual_model': {
      const vmSpec = {
        organizationRef: args.org,
        modelName: args.modelName,
        routes: args.routes,
      };
      return controller.applyResource({
        apiVersion: 'krate.a5c.ai/v1alpha1',
        kind: 'KrateVirtualModel',
        metadata: { name: args.name, namespace: orgNamespaceName(args.org) },
        spec: vmSpec,
      });
    }

    case 'krate_create_meeting': {
      const org = args.org || 'default';
      const name = toResourceName(args.name || args.displayName);
      const roomId = args.roomId || `${name}-${org}`;
      const resource = {
        apiVersion: 'krate.a5c.ai/v1alpha1',
        kind: 'JitsiMeeting',
        metadata: { name, namespace: orgNamespaceName(org) },
        spec: {
          organizationRef: org,
          providerRef: args.providerRef || 'default',
          templateRef: args.templateRef,
          roomId,
          displayName: args.displayName,
          ttlMinutes: args.ttlMinutes || 120,
          participants: {
            invited: (args.inviteAgentStacks || []).map((ref) => ({ type: 'agentStack', ref, role: 'observer' })),
          },
        },
        status: {
          phase: 'Active',
          roomUrl: args.roomUrl || `https://meet.krate.local/${roomId}`,
          participants: { current: [], total: 0, peak: 0 },
          recording: { active: false, recordingId: null },
        },
      };
      return applyOrgResource(controller, org, resource);
    }

    case 'krate_list_meetings': {
      const org = args.org || 'default';
      const result = await listOrgResources(controller, org, 'JitsiMeeting');
      let items = result.items || [];
      if (!args.status || args.status === 'all') return { ...result, items };
      const phase = args.status === 'active' ? 'Active' : 'Ended';
      items = items.filter((meeting) => meeting.status?.phase === phase);
      return { ...result, items };
    }

    case 'krate_join_meeting': {
      const org = args.org || 'default';
      const result = await getOrgResource(controller, org, 'JitsiMeeting', args.meetingRef);
      const meeting = result.resource || result;
      if (meeting.status?.phase && meeting.status.phase !== 'Active') throw new Error(`Meeting ${args.meetingRef} is not active`);
      return createMeetingJoinPayload(meeting, { ...args, org });
    }

    case 'krate_invite_to_meeting': {
      const org = args.org || 'default';
      const result = await getOrgResource(controller, org, 'JitsiMeeting', args.meetingRef);
      const meeting = result.resource || result;
      const invited = meeting.spec?.participants?.invited || [];
      return applyOrgResource(controller, org, {
        ...meeting,
        spec: {
          ...(meeting.spec || {}),
          participants: {
            ...(meeting.spec?.participants || {}),
            invited: [
              ...invited,
              { type: args.participantType, ref: args.participantRef, role: args.role || (args.participantType === 'agentStack' ? 'observer' : 'participant') },
            ],
          },
        },
      });
    }

    default:
      throw new Error(`Tool not implemented: ${toolName}`);
  }
}

function toResourceName(value) {
  return String(value || 'meeting').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 63) || 'meeting';
}

async function listOrgResources(controller, org, kind) {
  if (controller.listResourceForOrg) return controller.listResourceForOrg(org, kind);
  const result = await controller.listResource(kind);
  const namespace = orgNamespaceName(org);
  return {
    ...result,
    items: (result.items || []).filter((resource) => resource.spec?.organizationRef === org || resource.metadata?.namespace === namespace),
  };
}

async function getOrgResource(controller, org, kind, name) {
  if (controller.getResourceForOrg) return controller.getResourceForOrg(org, kind, name);
  const result = await controller.getResource(kind, name);
  const resource = result.resource || result;
  const namespace = orgNamespaceName(org);
  if (resource.spec?.organizationRef !== org && resource.metadata?.namespace !== namespace) {
    throw new Error(`${kind}/${name} is not in org ${org}`);
  }
  return result;
}

async function applyOrgResource(controller, org, resource) {
  if (controller.applyResourceForOrg) return controller.applyResourceForOrg(org, resource);
  return controller.applyResource(resource);
}

function createMeetingJoinPayload(meeting, args = {}) {
  const ttlMinutes = Math.max(1, Math.min(Number(args.ttlMinutes || meeting.spec?.ttlMinutes || 60), 60));
  const exp = Math.floor(Date.now() / 1000) + ttlMinutes * 60;
  const claims = {
    aud: 'jitsi',
    iss: 'krate',
    room: meeting.spec?.roomId,
    org: meeting.spec?.organizationRef || args.org,
    exp,
    context: { user: { name: args.participantName || 'Krate user', id: args.participantRef || 'krate-mcp' } },
  };
  const encoded = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.KRATE_JITSI_JWT_SECRET || 'dev-jitsi-secret').update(encoded).digest('base64url');
  return {
    meetingRef: meeting.metadata?.name,
    org: meeting.spec?.organizationRef || args.org,
    roomUrl: meeting.status?.roomUrl || `https://meet.krate.local/${meeting.spec?.roomId}`,
    roomId: meeting.spec?.roomId,
    jwt: `krate-jitsi.${encoded}.${signature}`,
    expiresAt: new Date(exp * 1000).toISOString(),
    expiresInSeconds: ttlMinutes * 60,
  };
}

async function listAgents(controller) {
  const definitions = await controller.listResource('AgentDefinition');
  const personas = await controller.listResource('AgentPersona');
  const personaByName = new Map((personas.items || []).map((persona) => [persona.metadata?.name, persona]));
  return {
    items: (definitions.items || []).map((definition) => ({
      ...definition,
      persona: personaByName.get(definition.spec?.personaRef) || null,
    })),
  };
}

async function getResourceOrNull(controller, kind, name) {
  if (!name) return null;
  const result = await controller.getResource(kind, name);
  return result?.resource || null;
}

async function getAgentProfile(controller, name) {
  const definition = await getResourceOrNull(controller, 'AgentDefinition', name);
  if (!definition) return { error: `AgentDefinition not found: ${name}` };
  const persona = await getResourceOrNull(controller, 'AgentPersona', definition.spec?.personaRef);
  const stack = await getResourceOrNull(controller, 'AgentStack', definition.spec?.stackRef);
  return { definition, persona, stack };
}

async function createAgent(controller, args) {
  const namespace = orgNamespaceName(args.org);
  const persona = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'AgentPersona',
    metadata: { name: args.name, namespace },
    spec: {
      organizationRef: args.org,
      displayName: args.displayName,
      ...(args.personaSpec || {}),
    },
  };
  const definition = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'AgentDefinition',
    metadata: { name: args.name, namespace },
    spec: {
      organizationRef: args.org,
      personaRef: args.name,
      stackRef: args.stackRef,
      ...(args.definitionSpec || {}),
    },
  };
  const applied = [];
  applied.push(await controller.applyResource(persona));
  applied.push(await controller.applyResource(definition));
  return { applied };
}

// --- MCP resource readers ----------------------------------------------------

async function readMcpResource(controller, uri) {
  switch (uri) {
    case 'krate://snapshot':
      return controller.snapshot();

    case 'krate://stacks':
      return controller.listResource('AgentStack');

    case 'krate://models':
      return controller.listModelCatalog('default');

    default:
      throw new Error(`Resource URI not implemented: ${uri}`);
  }
}

// --- JSON-RPC helpers --------------------------------------------------------

function jsonrpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function jsonrpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}
