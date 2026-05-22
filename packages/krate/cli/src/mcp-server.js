import { createKrateApiController } from '../../core/src/api-controller.js';
import { createKubernetesResourceGateway } from '../../core/src/kubernetes-resource-gateway.js';
import { createAgentSecretGrantController } from '../../core/src/agent-secret-config-grant-controller.js';
import { createAuditController } from '../../core/src/audit-controller.js';
import { orgNamespaceName } from '../../core/src/org-scoping.js';

export const MCP_TOOLS = [
  { name: 'krate_list_resources', description: 'List resources of a given kind', inputSchema: { type: 'object', properties: { kind: { type: 'string' } }, required: ['kind'] } },
  { name: 'krate_get_resource', description: 'Get a single resource by kind and name', inputSchema: { type: 'object', properties: { kind: { type: 'string' }, name: { type: 'string' } }, required: ['kind', 'name'] } },
  { name: 'krate_apply_resource', description: 'Create or update a resource', inputSchema: { type: 'object', properties: { resource: { type: 'object' } }, required: ['resource'] } },
  { name: 'krate_delete_resource', description: 'Delete a resource', inputSchema: { type: 'object', properties: { kind: { type: 'string' }, name: { type: 'string' } }, required: ['kind', 'name'] } },
  { name: 'krate_snapshot', description: 'Get full organization snapshot', inputSchema: { type: 'object', properties: {} } },
  { name: 'krate_search', description: 'Search resources by query', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'krate_list_stacks', description: 'List agent stacks', inputSchema: { type: 'object', properties: {} } },
  { name: 'krate_dispatch_agent', description: 'Dispatch an agent run', inputSchema: { type: 'object', properties: { stackRef: { type: 'string' }, input: { type: 'object' } }, required: ['stackRef'] } },
  { name: 'krate_list_secrets', description: 'List AgentSecretGrant resources in an org namespace', inputSchema: { type: 'object', properties: { org: { type: 'string' } } } },
  { name: 'krate_create_secret', description: 'Create an AgentSecretGrant resource', inputSchema: { type: 'object', properties: { name: { type: 'string' }, org: { type: 'string' }, agentRef: { type: 'string' }, secretRef: { type: 'string' }, permissions: { type: 'array', items: { type: 'string' } } }, required: ['name', 'org', 'agentRef', 'secretRef'] } },
  { name: 'krate_create_stack', description: 'Create an AgentStack resource', inputSchema: { type: 'object', properties: { name: { type: 'string' }, org: { type: 'string' }, spec: { type: 'object' } }, required: ['name', 'org'] } },
  { name: 'krate_sync_external', description: 'Trigger an external sync for a binding', inputSchema: { type: 'object', properties: { bindingName: { type: 'string' }, kind: { type: 'string' }, localName: { type: 'string' }, spec: { type: 'object' }, externalEnvelope: { type: 'object' }, watermark: { type: 'string' } }, required: ['bindingName', 'kind', 'localName'] } },
  { name: 'krate_resolve_conflict', description: 'Resolve an external sync conflict', inputSchema: { type: 'object', properties: { conflictName: { type: 'string' }, strategy: { type: 'string' }, resolvedValue: {} }, required: ['conflictName', 'strategy'] } },
  { name: 'krate_audit_query', description: 'Query audit events with optional org/action/time filters', inputSchema: { type: 'object', properties: { org: { type: 'string' }, action: { type: 'string' }, since: { type: 'string' }, until: { type: 'string' }, limit: { type: 'number' }, offset: { type: 'number' } } } },
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

    case 'krate_dispatch_agent':
      return controller.dispatchAgent({
        agentStack: args.stackRef,
        ...args.input,
      });

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

    default:
      throw new Error(`Tool not implemented: ${toolName}`);
  }
}

// --- MCP resource readers ----------------------------------------------------

async function readMcpResource(controller, uri) {
  switch (uri) {
    case 'krate://snapshot':
      return controller.snapshot();

    case 'krate://stacks':
      return controller.listResource('AgentStack');

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
