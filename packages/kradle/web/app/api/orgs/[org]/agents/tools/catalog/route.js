import { createKradleApiController, orgNamespaceName } from '@a5c-ai/kradle-sdk';
import { withAuth } from '../../../../../../lib/api-auth.js';

export const dynamic = 'force-dynamic';

const INTERNAL_TOOLS_CATALOG = [
  {
    category: 'File System',
    tools: [
      { id: 'read', label: 'Read', description: 'Read file contents' },
      { id: 'write', label: 'Write', description: 'Write file contents' },
      { id: 'edit', label: 'Edit', description: 'Edit file with string replacements' },
      { id: 'glob', label: 'Glob', description: 'Find files by pattern' },
      { id: 'grep', label: 'Grep', description: 'Search file contents' },
    ],
  },
  {
    category: 'Execution',
    tools: [
      { id: 'bash', label: 'Bash', description: 'Execute shell commands' },
      { id: 'powershell', label: 'PowerShell', description: 'Execute PowerShell commands' },
    ],
  },
  {
    category: 'Code',
    tools: [
      { id: 'notebook_edit', label: 'NotebookEdit', description: 'Edit Jupyter notebook cells' },
    ],
  },
  {
    category: 'Discovery',
    tools: [
      { id: 'tool_search', label: 'ToolSearch', description: 'Search for deferred tools' },
    ],
  },
  {
    category: 'Web',
    tools: [
      { id: 'web_search', label: 'WebSearch', description: 'Search the web' },
      { id: 'web_fetch', label: 'WebFetch', description: 'Fetch web page content' },
    ],
  },
  {
    category: 'Agents',
    tools: [
      { id: 'agent', label: 'Agent', description: 'Launch subagents for complex tasks' },
    ],
  },
];

export const GET = withAuth(async function GET(request, { params }) {
  const { org } = await params;
  const namespace = orgNamespaceName(org);

  // Start with the static internal tools catalog
  const categories = [...INTERNAL_TOOLS_CATALOG];

  // Dynamically discover AgentMcpServer resources for this org and merge them in
  let mcpServers = [];
  try {
    const controller = createKradleApiController({ namespace });
    const result = await controller.listResourceForOrg(org, 'AgentMcpServer');
    const items = result?.items || (Array.isArray(result) ? result : []);
    mcpServers = items.map((server) => ({
      name: server.metadata?.name,
      transport: server.spec?.transport,
      scope: server.spec?.scope,
      purpose: server.spec?.purpose || server.metadata?.annotations?.['kradle.a5c.ai/description'] || null,
    }));

    // If MCP servers were found, add them as a dynamic category
    if (mcpServers.length > 0) {
      categories.push({
        category: 'MCP Servers (Dynamic)',
        tools: mcpServers.map((s) => ({
          id: `mcp:${s.name}`,
          label: s.name,
          description: s.purpose || `MCP server (${s.transport || 'unknown'} transport)`,
        })),
      });
    }
  } catch (err) {
    // Controller not available or listing failed — return static catalog only
    console.warn('[tools/catalog] Failed to discover MCP servers:', err?.message || err);
  }

  return Response.json(
    { categories, mcpServers },
    { headers: { 'Cache-Control': 'no-store' } }
  );
});
