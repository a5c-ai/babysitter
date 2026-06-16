export const METHOD_COLORS = {
  GET: { bg: 'var(--accent)', text: '#fff' },
  POST: { bg: 'var(--success)', text: '#fff' },
  DELETE: { bg: 'var(--danger)', text: '#fff' },
  PUT: { bg: 'var(--warning)', text: '#fff' },
  PATCH: { bg: 'var(--info)', text: '#fff' },
};

export const ENDPOINT_GROUPS = [
  {
    title: 'Health',
    description: 'Health and readiness checks',
    endpoints: [
      {
        method: 'GET',
        path: '/healthz',
        description: 'Returns 200 OK when the server is healthy.',
        parameters: [],
        requestBody: null,
        responseSchema: '{ ok: boolean, project: string }',
        sseOnly: false,
      },
    ],
  },
  {
    title: 'Resources',
    description: 'Kubernetes resource CRUD scoped to an organization',
    endpoints: [
      {
        method: 'GET',
        path: '/api/orgs/{org}/resources',
        description: 'List resources by kind within the organization namespace.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
          { name: 'kind', in: 'query', required: false, description: 'Resource kind (e.g. Repository, AgentStack)', example: 'Repository' },
        ],
        requestBody: null,
        responseSchema: '{ items: KradleResource[], total: number, kind: string }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/resources',
        description: 'Apply (create or update) a resource in the organization namespace.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: '{\n  "apiVersion": "kradle.a5c.ai/v1alpha1",\n  "kind": "AgentStack",\n  "metadata": { "name": "my-stack" },\n  "spec": { "organizationRef": "default", "description": "My agent stack" }\n}',
        responseSchema: '{ resource: KradleResource, created: boolean, name: string }',
      },
      {
        method: 'DELETE',
        path: '/api/orgs/{org}/resources/{kind}/{name}',
        description: 'Delete a resource by kind and name from the organization namespace.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
          { name: 'kind', in: 'path', required: true, description: 'Resource kind', example: 'Repository' },
          { name: 'name', in: 'path', required: true, description: 'Resource name', example: 'my-repo' },
        ],
        requestBody: null,
        responseSchema: '{ deleted: boolean, name: string, kind: string }',
      },
    ],
  },
  {
    title: 'Secrets',
    description: 'Secret management via AgentSecretGrant resources',
    endpoints: [
      {
        method: 'GET',
        path: '/api/orgs/{org}/secrets',
        description: 'List all secrets (AgentSecretGrant resources) for the organization.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: null,
        responseSchema: '{ secrets: SecretItem[] }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/secrets',
        description: 'Create a secret (AgentSecretGrant) for the organization.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: '{\n  "name": "github-token",\n  "grantedTo": "agent-stack-builder",\n  "permissions": ["read"],\n  "data": {}\n}',
        responseSchema: '{ resource: KradleResource, created: boolean }',
      },
      {
        method: 'DELETE',
        path: '/api/orgs/{org}/secrets/{name}',
        description: 'Delete a secret by name from the organization.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
          { name: 'name', in: 'path', required: true, description: 'Secret name', example: 'github-token' },
        ],
        requestBody: null,
        responseSchema: '{ deleted: boolean, name: string }',
      },
      {
        method: 'GET',
        path: '/api/orgs/{org}/secret-grants',
        description: 'List all AgentSecretGrant resources (full resource view).',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: null,
        responseSchema: '{ items: KradleResource[], total: number }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/secret-grants',
        description: 'Create a fine-grained secret grant for an agent or system.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: '{\n  "name": "grant-github-token",\n  "secretName": "github-token",\n  "grantedTo": "agent-stack-builder",\n  "permissions": ["read"]\n}',
        responseSchema: '{ resource: KradleResource, created: boolean }',
      },
    ],
  },
  {
    title: 'Agents',
    description: 'Agent dispatch, memory queries, and real-time event streaming',
    endpoints: [
      {
        method: 'POST',
        path: '/api/orgs/{org}/agents/dispatch',
        description: 'Dispatch a new AgentDispatchRun against the named stack.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: '{\n  "stackRef": "claude-code-stack",\n  "repository": "my-repo",\n  "branch": "main",\n  "prompt": "Fix the failing tests in the auth module"\n}',
        responseSchema: '{ run: KradleResource, runName: string, status: string }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/agents/memory/query',
        description: 'Query the agent memory graph using graph, grep, or semantic strategy.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: '{\n  "query": "deployment failures in the auth module",\n  "strategy": "graph",\n  "topK": 10,\n  "context": { "organizationRef": "default" }\n}',
        responseSchema: '{ results: MemoryResult[], total: number, strategy: string }',
      },
      {
        method: 'GET',
        path: '/api/orgs/{org}/agents/events/stream',
        description: 'Server-Sent Events stream for real-time agent events. Use EventSource API in the browser. Not try-able from this explorer.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: null,
        responseSchema: 'text/event-stream — data: {"type":"<event>","payload":{...}}',
        sseOnly: true,
      },
    ],
  },
  {
    title: 'External',
    description: 'External backend sync, conflict resolution, and write intent management',
    endpoints: [
      {
        method: 'POST',
        path: '/api/orgs/{org}/external/sync',
        description: 'Trigger synchronization of an external binding against the provider.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
        ],
        requestBody: '{\n  "bindingName": "github-binding",\n  "kind": "Repository",\n  "localName": "my-repo",\n  "spec": {},\n  "externalEnvelope": {\n    "nativeId": "123456",\n    "url": "https://github.com/org/repo",\n    "etag": "abc123",\n    "providerRef": "github"\n  }\n}',
        responseSchema: '{ synced: boolean, resource: KradleResource, conflicts: any[] }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/external/conflicts/{name}/resolve',
        description: 'Resolve a named external sync conflict using local-wins, remote-wins, or manual strategy.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
          { name: 'name', in: 'path', required: true, description: 'Conflict resource name', example: 'repo-conflict-abc' },
        ],
        requestBody: '{\n  "strategy": "local-wins",\n  "resolvedValue": {},\n  "resources": {}\n}',
        responseSchema: '{ resolved: boolean, conflictName: string, strategy: string }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/external/write-intents/{name}/approve',
        description: 'Approve a pending external write intent, allowing the agent to write to the external provider.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
          { name: 'name', in: 'path', required: true, description: 'Write intent resource name', example: 'write-intent-push-abc' },
        ],
        requestBody: '{\n  "approvedBy": "alice",\n  "resources": {}\n}',
        responseSchema: '{ approved: boolean, intentName: string }',
      },
      {
        method: 'POST',
        path: '/api/orgs/{org}/external/write-intents/{name}/cancel',
        description: 'Cancel a pending external write intent.',
        parameters: [
          { name: 'org', in: 'path', required: true, description: 'Organization slug', example: 'default' },
          { name: 'name', in: 'path', required: true, description: 'Write intent resource name', example: 'write-intent-push-abc' },
        ],
        requestBody: '{\n  "cancelledBy": "alice",\n  "resources": {}\n}',
        responseSchema: '{ cancelled: boolean, intentName: string }',
      },
    ],
  },
];
