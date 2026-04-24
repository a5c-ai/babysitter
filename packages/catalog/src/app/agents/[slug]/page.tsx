import { notFound } from "next/navigation";
import { AgentDetail } from "@/components/catalog/DetailView/AgentDetail";
import { Breadcrumb, type BreadcrumbItem } from "@/components/layout/Breadcrumb";
import { PageContainer } from "@/components/layout/PageContainer";
import type { AgentDetail as AgentDetailType, AgentListItem } from "@/lib/api/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getAgent(slug: string): Promise<AgentDetailType | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/agents/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json.data;
  } catch {
    return null;
  }
}

async function getRelatedAgents(agent: AgentDetailType): Promise<AgentListItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const params = new URLSearchParams({ limit: "8" });
    const primaryProvider = agent.providers[0]?.displayName;
    const primaryCapability = agent.capabilities[0]?.label;

    if (primaryProvider) {
      params.set("provider", primaryProvider);
    } else if (primaryCapability) {
      params.set("capability", primaryCapability);
    }

    const response = await fetch(`${baseUrl}/api/agents?${params.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const json = await response.json();
    return (json.data || []).filter((entry: AgentListItem) => entry.slug !== agent.slug).slice(0, 5);
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

  const relatedAgents = await getRelatedAgents(agent);
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Agents", href: "/agents" },
  ];

  if (agent.providers[0]) {
    breadcrumbItems.push({ label: agent.providers[0].displayName });
  }

  breadcrumbItems.push({ label: `${agent.name} ${agent.versionRange}` });

  return (
    <PageContainer>
      <Breadcrumb items={breadcrumbItems} />
      <AgentDetail
        agent={agent}
        relatedAgents={relatedAgents.map((entry) => ({
          id: entry.slug,
          name: entry.name,
          description: entry.description,
          versionRange: entry.versionRange,
        }))}
      />
    </PageContainer>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const agent = await getAgent(decodeURIComponent(slug));

  if (!agent) {
    return { title: "Agent Not Found" };
  }

  return {
    title: `${agent.name} ${agent.versionRange} - Agent Catalog`,
    description: agent.description,
  };
}
