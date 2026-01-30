import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// Badge unused - keeping import for future use
import { Separator } from "@/components/ui/separator";
import { QuickActions } from "@/components/catalog/QuickActions";
import { Tag } from "@/components/common/Tag";
import type { SpecializationDetail, AgentSummary, SkillSummary } from "@/lib/api/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getSpecialization(slug: string): Promise<SpecializationDetail | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/specializations/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export default async function SpecializationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const specialization = await getSpecialization(decodeURIComponent(slug));

  if (!specialization) {
    notFound();
  }

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Specializations", href: "/specializations" },
          { label: specialization.name },
        ]}
      />

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-[var(--color-sponsors-subtle)] p-2 text-[var(--color-sponsors-fg)]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">{specialization.name}</h1>
          </div>
          {specialization.domainName && (
            <Link href={`/domains/${encodeURIComponent(specialization.domainName)}` as Route}>
              <Tag variant="domain">{specialization.domainName}</Tag>
            </Link>
          )}
        </div>

        <QuickActions
          entityId={specialization.name}
          entityType="specialization"
          filePath={specialization.path}
        />
      </div>

      <Separator className="mb-8" />

      {/* Statistics */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{specialization.skillCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{specialization.agentCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Skills List */}
        <Card>
          <CardHeader>
            <CardTitle>Skills ({specialization.skills.length})</CardTitle>
            <CardDescription>
              Available skills in this specialization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {specialization.skills.length > 0 ? (
              <div className="space-y-3">
                {specialization.skills.map((skill) => (
                  <SkillRow key={skill.id} skill={skill} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No skills found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Agents List */}
        <Card>
          <CardHeader>
            <CardTitle>Agents ({specialization.agents.length})</CardTitle>
            <CardDescription>
              Available agents in this specialization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {specialization.agents.length > 0 ? (
              <div className="space-y-3">
                {specialization.agents.map((agent) => (
                  <AgentRow key={agent.id} agent={agent} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No agents found
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">File Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Path:</span>
              <code className="rounded bg-muted px-2 py-0.5 text-xs">
                {specialization.path}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>
                {new Date(specialization.updatedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function SkillRow({ skill }: { skill: SkillSummary }) {
  return (
    <Link
      href={`/skills/${encodeURIComponent(skill.name)}` as Route}
      className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors"
    >
      <div className="shrink-0 rounded-md bg-[var(--color-success-subtle)] p-1.5 text-[var(--color-success-fg)]">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{skill.name}</p>
        <p className="text-sm text-muted-foreground line-clamp-1">{skill.description}</p>
      </div>
      <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function AgentRow({ agent }: { agent: AgentSummary }) {
  return (
    <Link
      href={`/agents/${encodeURIComponent(agent.name)}` as Route}
      className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors"
    >
      <div className="shrink-0 rounded-full bg-[var(--color-attention-subtle)] p-1.5 text-[var(--color-attention-fg)]">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{agent.name}</p>
        {agent.role && (
          <p className="text-xs text-muted-foreground">{agent.role}</p>
        )}
        <p className="text-sm text-muted-foreground line-clamp-1">{agent.description}</p>
      </div>
      <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const specialization = await getSpecialization(decodeURIComponent(slug));

  if (!specialization) {
    return {
      title: "Specialization Not Found",
    };
  }

  return {
    title: `${specialization.name} - Specializations - Process Catalog`,
    description: `Explore the ${specialization.name} specialization with ${specialization.skillCount} skills and ${specialization.agentCount} agents.`,
  };
}
