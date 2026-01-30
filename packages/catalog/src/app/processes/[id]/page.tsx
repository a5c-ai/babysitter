import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProcessDetail } from "@/components/catalog/DetailView/ProcessDetail";
import type { ProcessDetail as ProcessDetailType, ProcessListItem } from "@/lib/api/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getProcess(id: string): Promise<ProcessDetailType | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/processes/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

async function getRelatedProcesses(category: string | null, currentId: number): Promise<ProcessListItem[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const params = new URLSearchParams({ limit: "5" });
    if (category) params.set("category", category);

    const res = await fetch(`${baseUrl}/api/processes?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    // Filter out current process and limit to 4
    return (json.data || []).filter((p: ProcessListItem) => p.id !== currentId).slice(0, 4);
  } catch {
    return [];
  }
}

export default async function ProcessDetailPage({ params }: PageProps) {
  const { id } = await params;
  const process = await getProcess(id);

  if (!process) {
    notFound();
  }

  const relatedProcesses = await getRelatedProcesses(process.category, process.id);

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Processes", href: "/processes" },
          { label: process.processId },
        ]}
      />

      <ProcessDetail
        process={process}
        relatedProcesses={relatedProcesses.map((p) => ({
          id: p.id,
          processId: p.processId,
          description: p.description,
        }))}
      />
    </PageContainer>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const process = await getProcess(id);

  if (!process) {
    return {
      title: "Process Not Found",
    };
  }

  return {
    title: `${process.processId} - Process Catalog`,
    description: process.description || `View details for ${process.processId}`,
  };
}
