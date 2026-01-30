import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QuickActions } from "@/components/catalog/QuickActions";
import type { DomainDetail, SpecializationSummary } from "@/lib/api/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getDomain(slug: string): Promise<DomainDetail | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/domains/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export default async function DomainDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const domain = await getDomain(decodeURIComponent(slug));

  if (!domain) {
    notFound();
  }

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Domains", href: "/domains" },
          { label: domain.name },
        ]}
      />

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-[var(--color-done-subtle)] p-2 text-[var(--color-done-fg)]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-fg-default)]">
              {domain.name}
            </h1>
          </div>
          {domain.category && (
            <Badge variant="secondary">{domain.category}</Badge>
          )}
        </div>

        <QuickActions
          entityId={domain.name}
          entityType="domain"
          filePath={domain.path}
        />
      </div>

      <Separator className="mb-8" />

      {/* Statistics */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Specializations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domain.specializationCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domain.skillCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domain.agentCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Specializations List */}
      <Card>
        <CardHeader>
          <CardTitle>Specializations ({domain.specializations.length})</CardTitle>
          <CardDescription>
            Browse the specializations within this domain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domain.specializations.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {domain.specializations.map((spec) => (
                <SpecializationCard key={spec.id} specialization={spec} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No specializations found in this domain
            </p>
          )}
        </CardContent>
      </Card>

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
                {domain.path}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>
                {new Date(domain.updatedAt).toLocaleDateString(undefined, {
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

function SpecializationCard({ specialization }: { specialization: SpecializationSummary }) {
  return (
    <Link
      href={`/specializations/${encodeURIComponent(specialization.name)}` as Route}
      className="block"
    >
      <Card className="h-full hover:border-primary/50 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-base truncate">{specialization.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{specialization.skillCount} skills</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{specialization.agentCount} agents</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const domain = await getDomain(decodeURIComponent(slug));

  if (!domain) {
    return {
      title: "Domain Not Found",
    };
  }

  return {
    title: `${domain.name} - Domains - Process Catalog`,
    description: `Explore the ${domain.name} domain with ${domain.specializationCount} specializations, ${domain.skillCount} skills, and ${domain.agentCount} agents.`,
  };
}
