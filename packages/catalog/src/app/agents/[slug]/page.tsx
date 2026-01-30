import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/Breadcrumb";
import { AgentDetail } from "@/components/catalog/DetailView/AgentDetail";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentDetail as AgentDetailType, AgentListItem } from "@/lib/api/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getAgent(slug: string): Promise<AgentDetailType | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/agents/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

async function getRelatedAgents(
  domainName: string | null,
  specializationName: string | null,
  currentId: number
): Promise<AgentListItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const params = new URLSearchParams({ limit: "6" });
    if (specializationName) {
      params.set("specialization", specializationName);
    } else if (domainName) {
      params.set("domain", domainName);
    }

    const res = await fetch(`${baseUrl}/api/agents?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    // Filter out current agent and limit to 5
    return (json.data || []).filter((a: AgentListItem) => a.id !== currentId).slice(0, 5);
  } catch {
    return [];
  }
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const agent = await getAgent(decodeURIComponent(slug));

  if (!agent) {
    notFound();
  }

  const relatedAgents = await getRelatedAgents(
    agent.domainName,
    agent.specializationName,
    agent.id
  );

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Agents", href: "/agents" },
  ];

  if (agent.domainName) {
    breadcrumbItems.push({
      label: agent.domainName,
      href: `/domains/${encodeURIComponent(agent.domainName)}`,
    });
  }

  if (agent.specializationName) {
    breadcrumbItems.push({
      label: agent.specializationName,
      href: `/specializations/${encodeURIComponent(agent.specializationName)}`,
    });
  }

  breadcrumbItems.push({ label: agent.name });

  return (
    <PageContainer>
      <Breadcrumb items={breadcrumbItems} />

      <AgentDetail
        agent={agent}
        relatedAgents={relatedAgents.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          role: a.role,
        }))}
      />

      {/* Rendered Markdown Content */}
      {agent.content && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Content</CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownRenderer content={agent.content} />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const agent = await getAgent(decodeURIComponent(slug));

  if (!agent) {
    return {
      title: "Agent Not Found",
    };
  }

  return {
    title: `${agent.name} - Agents - Process Catalog`,
    description: agent.description || `View details for the ${agent.name} agent`,
  };
}
