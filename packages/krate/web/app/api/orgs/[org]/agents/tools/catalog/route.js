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

export async function GET() {
  return Response.json({ categories: INTERNAL_TOOLS_CATALOG }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
