export const dynamic = 'force-dynamic';

import { loadKrateUi, orgHref, StatusPill, DegradedBanner } from '../../../lib/krate-ui.jsx';
import { PageFrame } from '../../../lib/page-frame.jsx';

export const metadata = { title: 'For Agents | Krate' };

const MCP_TOOLS = [
  { name: 'krate_snapshot', description: 'Get full organization runtime snapshot', params: '—' },
  { name: 'krate_list_resources', description: 'List resources of a given kind', params: 'kind' },
  { name: 'krate_get_resource', description: 'Get a single resource by kind and name', params: 'kind, name' },
  { name: 'krate_apply_resource', description: 'Create or update a resource', params: 'resource (object)' },
  { name: 'krate_delete_resource', description: 'Delete a resource by kind and name', params: 'kind, name' },
  { name: 'krate_search', description: 'Search resources by query string', params: 'query' },
  { name: 'krate_list_stacks', description: 'List agent stack configurations', params: '—' },
  { name: 'krate_create_stack', description: 'Create an AgentStack resource', params: 'name, org, spec' },
  { name: 'krate_dispatch_agent', description: 'Dispatch an agent run from a stack', params: 'stackRef, input' },
  { name: 'krate_list_secrets', description: 'List AgentSecretGrant resources', params: 'org' },
  { name: 'krate_create_secret', description: 'Create an AgentSecretGrant', params: 'name, org, agentRef, secretRef' },
  { name: 'krate_sync_external', description: 'Trigger external backend sync', params: 'bindingName, kind, localName' },
  { name: 'krate_resolve_conflict', description: 'Resolve an external sync conflict', params: 'conflictName, strategy' },
  { name: 'krate_audit_query', description: 'Query audit events with filters', params: 'org, action, since, until' },
];

const MCP_PROMPTS = [
  { name: 'krate_workspace_setup', description: 'Guide for setting up a new krate workspace' },
  { name: 'krate_stack_config', description: 'Help configuring an agent stack' },
  { name: 'krate_troubleshoot', description: 'Diagnose common krate issues' },
];

const MCP_RESOURCES = [
  { uri: 'krate://snapshot', name: 'Workspace Snapshot', mimeType: 'application/json' },
  { uri: 'krate://stacks', name: 'Agent Stacks', mimeType: 'application/json' },
];

function CodeBlock({ children, title }) {
  return <div style={{ marginBottom: '1rem' }}>
    {title && <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{title}</div>}
    <pre style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '0.8rem', lineHeight: 1.6, overflow: 'auto', margin: 0 }}><code>{children}</code></pre>
  </div>;
}

function Section({ title, children }) {
  return <section className="card" style={{ marginBottom: '1rem' }}>
    <div className="cardTitle"><h3>{title}</h3></div>
    {children}
  </section>;
}

export default async function ForAgentsPage({ params }) {
  const routeParams = await params;
  const org = routeParams.org;
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model?.org?.slug || org || 'default';
  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model?.orgs || []}
      eyebrow="integration"
      title="For Agents"
      text="Connect AI agents and developer tools to the Krate platform via MCP (Model Context Protocol), HTTP API, or CLI."
      currentPath="/for-agents"
      breadcrumbs={[['/', 'Krate'], ['/for-agents', 'For Agents']]}
      actions={[['/api-docs', 'HTTP API Docs']]}
    >
      <DegradedBanner model={ui.model} />

      <Section title="Quick start">
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>Install the Krate CLI, then start the MCP server. Any MCP-compatible agent (Claude Code, Cursor, Windsurf, etc.) can connect over stdio.</p>
        <CodeBlock title="Install">npm install -g @a5c-ai/krate-cli</CodeBlock>
        <CodeBlock title="Start MCP server">krate mcp</CodeBlock>
        <CodeBlock title="Start HTTP API server">krate serve</CodeBlock>
      </Section>

      <Section title="Claude Code integration">
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>Add the Krate MCP server to your Claude Code configuration:</p>
        <CodeBlock title=".claude/settings.json">{`{
  "mcpServers": {
    "krate": {
      "command": "krate",
      "args": ["mcp"],
      "env": {
        "KRATE_NAMESPACE": "krate-system",
        "KRATE_ORG": "${activeOrg}"
      }
    }
  }
}`}</CodeBlock>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>After adding the configuration, restart Claude Code. The agent will discover 14 tools, 3 prompts, and 2 resources.</p>
      </Section>

      <Section title="Cursor / Windsurf / other MCP clients">
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>For editors that support MCP via <code>.mcp.json</code>:</p>
        <CodeBlock title=".mcp.json">{`{
  "mcpServers": {
    "krate": {
      "command": "krate",
      "args": ["mcp"],
      "env": {
        "KRATE_NAMESPACE": "krate-system"
      }
    }
  }
}`}</CodeBlock>
      </Section>

      <Section title="Environment variables">
        <div className="resourceTable">
          {[
            ['KRATE_NAMESPACE', 'krate-system', 'Kubernetes namespace for CRD operations'],
            ['KRATE_ORG', activeOrg, 'Default organization slug'],
            ['KRATE_CONTROLLER_URL', 'http://localhost:3080', 'URL of the Krate API server (optional — falls back to kubectl)'],
            ['KUBECONFIG', '~/.kube/config', 'Path to kubeconfig (used when no controller URL is set)'],
          ].map(([name, defaultVal, desc]) => <div key={name} className="resourceRow" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '0.75rem', alignItems: 'center' }}>
            <code style={{ fontSize: '0.8rem', fontWeight: 600 }}>{name}</code>
            <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{defaultVal}</code>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{desc}</span>
          </div>)}
        </div>
      </Section>

      <Section title="MCP tools (14)">
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>These tools are available to any MCP-connected agent after running <code>krate mcp</code>.</p>
        <div className="resourceTable">
          {MCP_TOOLS.map((tool) => <div key={tool.name} className="resourceRow" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
            <code style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>{tool.name}</code>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tool.description}</span>
            <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tool.params}</code>
          </div>)}
        </div>
      </Section>

      <Section title="MCP prompts (3)">
        <div className="resourceTable">
          {MCP_PROMPTS.map((prompt) => <div key={prompt.name} className="resourceRow" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <code style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>{prompt.name}</code>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{prompt.description}</span>
          </div>)}
        </div>
      </Section>

      <Section title="MCP resources (2)">
        <div className="resourceTable">
          {MCP_RESOURCES.map((resource) => <div key={resource.uri} className="resourceRow" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
            <code style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>{resource.uri}</code>
            <span style={{ fontSize: '0.8rem' }}>{resource.name}</span>
            <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{resource.mimeType}</code>
          </div>)}
        </div>
      </Section>

      <Section title="HTTP API">
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>For direct API integration without MCP, the Krate HTTP API is available at <code>KRATE_CONTROLLER_URL</code> or via <code>krate serve</code>.</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a href={orgHref(activeOrg, '/api-docs')} className="actionButton" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
            Open API Explorer
          </a>
        </div>
        <CodeBlock title="Example: list stacks via curl">{`curl -s http://localhost:3080/api/orgs/${activeOrg}/resources?kind=AgentStack | jq '.items[].metadata.name'`}</CodeBlock>
      </Section>

      <Section title="CLI commands">
        <CodeBlock>{`krate serve              # Start HTTP API server on port 3080
krate mcp                # Start MCP server over stdio
krate status             # Show workspace status
krate stacks             # List agent stacks
krate dispatch <stack>   # Dispatch an agent run
krate apply <file>       # Apply a resource from YAML/JSON
krate get <kind> <name>  # Get a specific resource
krate list <kind>        # List resources by kind
krate delete <kind> <name>  # Delete a resource
krate version            # Show CLI version`}</CodeBlock>
      </Section>
    </PageFrame>
  );
}
