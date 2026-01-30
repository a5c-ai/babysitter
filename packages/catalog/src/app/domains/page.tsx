"use client";

import * as React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { TreeView, type TreeNode } from "@/components/catalog/TreeView";
import { DomainCard } from "@/components/catalog/EntityCard/DomainCard";
import { CardSkeleton } from "@/components/common/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DomainListItem, SpecializationListItem } from "@/lib/api/types";

export default function DomainsPage() {
  const [domains, setDomains] = React.useState<DomainListItem[]>([]);
  const [specializations, setSpecializations] = React.useState<SpecializationListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch domains and specializations
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [domainsRes, specsRes] = await Promise.all([
          fetch("/api/domains?limit=100"),
          fetch("/api/specializations?limit=500"),
        ]);

        if (domainsRes.ok) {
          const json = await domainsRes.json();
          setDomains(json.data || []);
        }

        if (specsRes.ok) {
          const json = await specsRes.json();
          setSpecializations(json.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Build tree data for TreeView
  const treeData: TreeNode[] = React.useMemo(() => {
    return domains.map((domain) => {
      const domainSpecs = specializations.filter((s) => s.domainId === domain.id);
      return {
        id: `domain-${domain.id}`,
        name: domain.name,
        type: "domain" as const,
        href: `/domains/${encodeURIComponent(domain.name)}`,
        count: domain.specializationCount + domain.skillCount + domain.agentCount,
        children: domainSpecs.map((spec) => ({
          id: `spec-${spec.id}`,
          name: spec.name,
          type: "specialization" as const,
          href: `/specializations/${encodeURIComponent(spec.name)}`,
          count: spec.skillCount + spec.agentCount,
        })),
      };
    });
  }, [domains, specializations]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    return {
      totalDomains: domains.length,
      totalSpecializations: specializations.length,
      totalSkills: domains.reduce((sum, d) => sum + d.skillCount, 0),
      totalAgents: domains.reduce((sum, d) => sum + d.agentCount, 0),
    };
  }, [domains, specializations]);

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Domains" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Domains</h1>
        <p className="mt-2 text-muted-foreground">
          Explore the hierarchical structure of knowledge domains and their specializations.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "--" : stats.totalDomains}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Specializations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "--" : stats.totalSpecializations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "--" : stats.totalSkills}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "--" : stats.totalAgents}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Tree View */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Domain Hierarchy</h2>
          {isLoading ? (
            <div className="space-y-2">
              <CardSkeleton lines={1} />
              <CardSkeleton lines={1} />
              <CardSkeleton lines={1} />
            </div>
          ) : treeData.length > 0 ? (
            <TreeView
              data={treeData}
              showCounts={true}
              defaultExpanded={treeData.slice(0, 3).map((d) => d.id)}
            />
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">No domains found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Domain Cards */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">All Domains</h2>
          {isLoading ? (
            <div className="grid gap-4">
              <CardSkeleton lines={3} />
              <CardSkeleton lines={3} />
              <CardSkeleton lines={3} />
            </div>
          ) : domains.length > 0 ? (
            <div className="grid gap-4">
              {domains.map((domain) => (
                <DomainCard key={domain.id} domain={domain} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">No domains found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
