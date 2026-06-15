import Link from "next/link";
import type { Metadata } from "next";
import { AtlasDocsScaffold } from "@/components/AtlasDocsScaffold";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAtlasView } from "@/lib/server/atlas-view";
import {
  ATLAS_AGENTS_MD_PATH,
  ATLAS_MCP_MANIFEST_PATH,
  ATLAS_MCP_PATH,
  ATLAS_MCP_WELL_KNOWN_PATH,
  ATLAS_OPENAPI_DOCS_PATH,
  ATLAS_OPENAPI_PATH,
  atlasMcpTools,
} from "@/lib/server/agent-docs";

export const metadata: Metadata = {
  title: "Atlas for Agents",
  description: "Agent-facing Atlas guide with MCP, agents.md, OpenAPI, and graph traversal instructions.",
};

export default async function ForAgentsPage() {
  const { index } = await getCurrentAtlasView();
  const stats = index.stats;
  const oraScores = Object.values(index.records).filter((record) => record._kind === "AgentReadinessScore");
  const toolServers = Object.values(index.records).filter((record) => record._kind === "ToolServer");
  const supportEdges = index.edges.filter((edge) => edge.kind === "supports_work");
  const scoreEdges = index.edges.filter((edge) => edge.kind === "scores_agent_readiness_of");

  const routes = [
    { label: "MCP endpoint", path: ATLAS_MCP_PATH, note: "Streamable HTTP MCP tools" },
    { label: "MCP manifest", path: ATLAS_MCP_MANIFEST_PATH, note: "JSON descriptor for agents" },
    { label: "Well-known MCP", path: ATLAS_MCP_WELL_KNOWN_PATH, note: "Discovery-friendly mirror" },
    { label: "agents.md", path: ATLAS_AGENTS_MD_PATH, note: "Plain-text agent instructions" },
    { label: "OpenAPI JSON", path: ATLAS_OPENAPI_PATH, note: "REST API contract" },
    { label: "OpenAPI docs", path: ATLAS_OPENAPI_DOCS_PATH, note: "Swagger UI" },
  ];

  return (
    <AtlasDocsScaffold
      runningLeft={
        <>
          <span className="folio">AG</span>
          <span>For agents</span>
        </>
      }
      runningTitle={
        <>
          Agentic AI Atlas · <em>agent surface</em>
        </>
      }
      runningRight={
        <>
          <span>{stats.totalRecords.toLocaleString()} records</span>
          <span>{atlasMcpTools.length} MCP tools</span>
        </>
      }
      tocSearchLabel="Search agent docs"
      tocBookLabel="Atlas · for agents"
      tocTitle="Agent entrypoints"
      chapters={[
        {
          num: "I.",
          title: "Connect",
          pages: "pp. 1 - 1",
          current: true,
          items: [
            { label: "Start here", href: "#start", current: true },
            { label: "Agent files", href: "#agent-files" },
            { label: "MCP tools", href: "#mcp-tools" },
            { label: "Graph projections", href: "#graph-projections" },
            { label: "OpenAPI", href: "#openapi" },
          ],
        },
      ]}
      chapterMark={{
        num: "I.",
        subtitle: "Agent entrypoints",
        context: "Public graph",
        readingTime: "MCP · agents.md · OpenAPI",
      }}
      articleTitle={
        <>
          Atlas <em>for agents</em>
        </>
      }
      lead="A compact agent-facing guide for connecting to Atlas, discovering graph records, traversing neighborhoods, and grounding claims in record ids and edge kinds."
      meta={
        <>
          <span>{atlasMcpTools.length} MCP tools</span>
          <span>{toolServers.length.toLocaleString()} tool servers</span>
          <span>{supportEdges.length.toLocaleString()} work-support edges</span>
        </>
      }
      marginSections={[
        {
          title: "Machine files",
          items: routes.slice(0, 4).map((route) => (
            <Link key={route.path} href={route.path}>{route.path}</Link>
          )),
        },
      ]}
    >
      <div className="atlas-docs-body">
        <section id="start" className="atlas-docs-full atlas-docs-stack">
          <div className="atlas-docs-kpis atlas-docs-full">
            <Kpi label="Records" value={stats.totalRecords} />
            <Kpi label="Edges" value={stats.totalEdges} />
            <Kpi label="NodeKinds" value={stats.totalNodeKinds} />
            <Kpi label="EdgeKinds" value={stats.totalEdgeKinds} />
            <Kpi label="MCP Tools" value={atlasMcpTools.length} />
          </div>
          <p>
            Atlas is read-only for public agents. Use search to find exact ids, then fetch a record or bounded
            neighborhood before making claims about agent stacks, tools, roles, workflows, or wiki pages.
          </p>
        </section>

        <section id="agent-files" className="atlas-docs-full atlas-docs-stack">
          <h2>Agent discovery files</h2>
          <div className="atlas-docs-grid atlas-docs-grid--2">
            {routes.map((route) => (
              <Card key={route.path}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{route.label}</CardTitle>
                    <Badge variant="secondary">public</Badge>
                  </div>
                  <CardDescription>{route.note}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={route.path} className="font-mono text-sm hover:underline" style={{ color: "var(--brass)" }}>
                    {route.path}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="mcp-tools" className="atlas-docs-full atlas-docs-stack">
          <h2>MCP tools</h2>
          <div className="atlas-docs-grid atlas-docs-grid--2">
            {atlasMcpTools.map((tool) => (
              <Card key={tool.name}>
                <CardHeader>
                  <CardTitle className="font-mono text-sm">{tool.name}</CardTitle>
                  <CardDescription>{tool.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm" style={{ color: "var(--fg-2)" }}>{tool.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

 
        <section id="openapi" className="atlas-docs-full atlas-docs-stack">
          <h2>REST fallback</h2>
          <p>
            MCP is the preferred agent interface. Use the REST API when an environment cannot speak MCP or needs
            cacheable HTTP JSON for records, neighbors, node kinds, edge kinds, search, clusters, and docs.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={ATLAS_OPENAPI_PATH} className="atlas-header__link">OpenAPI JSON</Link>
            <Link href={ATLAS_OPENAPI_DOCS_PATH} className="atlas-header__link">Swagger UI</Link>
          </div>
        </section>
      </div>
    </AtlasDocsScaffold>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="atlas-docs-kpi">
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
    </div>
  );
}

function ProjectionCard({ title, value, label, href }: { title: string; value: number; label: string; href: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href={href} className="text-3xl font-semibold hover:underline" style={{ color: "var(--brass)" }}>
          {value.toLocaleString()}
        </Link>
      </CardContent>
    </Card>
  );
}
