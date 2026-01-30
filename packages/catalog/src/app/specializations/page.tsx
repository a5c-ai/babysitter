"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { EntityList } from "@/components/catalog/EntityList";
// Pagination is handled through EntityList
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SpecializationListItem, DomainListItem } from "@/lib/api/types";
import SpecializationsLoading from "./loading";

function SpecializationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [specializations, setSpecializations] = React.useState<SpecializationListItem[]>([]);
  const [domains, setDomains] = React.useState<DomainListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Get initial values from URL
  const initialDomain = searchParams.get("domain") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [filterDomain, setFilterDomain] = React.useState(initialDomain);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(12);

  // Fetch domains for filter
  React.useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await fetch("/api/domains?limit=100");
        if (res.ok) {
          const json = await res.json();
          setDomains(json.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch domains:", error);
      }
    };
    fetchDomains();
  }, []);

  // Fetch specializations
  React.useEffect(() => {
    const fetchSpecializations = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", itemsPerPage.toString());
        params.set("offset", ((currentPage - 1) * itemsPerPage).toString());
        if (filterDomain) params.set("domain", filterDomain);

        const res = await fetch(`/api/specializations?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setSpecializations(json.data || []);
          setTotal(json.meta?.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch specializations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpecializations();
  }, [currentPage, itemsPerPage, filterDomain]);

  // Update URL when filters change
  const updateUrl = React.useCallback((domain: string, page: number) => {
    const params = new URLSearchParams();
    if (domain) params.set("domain", domain);
    if (page > 1) params.set("page", page.toString());

    const search = params.toString();
    const url = search ? `/specializations?${search}` : "/specializations";
    router.push(url as Route);
  }, [router]);

  const handleFilterChange = (filters: { domain?: string }) => {
    const newDomain = filters.domain || "";
    setFilterDomain(newDomain);
    setCurrentPage(1);
    updateUrl(newDomain, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(filterDomain, page);
  };

  const domainNames = domains.map((d) => d.name);

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Specializations" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Specializations</h1>
        <p className="mt-2 text-muted-foreground">
          Browse domain specializations and their associated skills and agents.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <FilterPanel
            filters={{ domain: filterDomain || undefined }}
            onFilterChange={handleFilterChange}
            domains={domainNames}
            showEntityTypes={false}
            showDomain={true}
            showCategory={false}
            showExpertise={false}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <EntityList
            items={specializations}
            totalItems={total}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={setItemsPerPage}
            isLoading={isLoading}
            skeletonCount={6}
            renderItem={(spec) => <SpecializationCard specialization={spec} />}
            keyExtractor={(spec) => spec.id}
            emptyMessage="No specializations found"
            emptyDescription="Try adjusting your filters"
            gridCols={{ sm: 1, md: 2, lg: 3 }}
          />
        </div>
      </div>
    </PageContainer>
  );
}

export default function SpecializationsPage() {
  return (
    <React.Suspense fallback={<SpecializationsLoading />}>
      <SpecializationsContent />
    </React.Suspense>
  );
}

function SpecializationCard({ specialization }: { specialization: SpecializationListItem }) {
  return (
    <Link
      href={`/specializations/${encodeURIComponent(specialization.name)}` as Route}
      className="block"
    >
      <Card className="h-full hover:border-primary/50 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{specialization.name}</CardTitle>
              {specialization.domainName && (
                <Badge variant="secondary" className="mt-2">
                  {specialization.domainName}
                </Badge>
              )}
            </div>
            <div className="shrink-0 rounded-md bg-[var(--color-sponsors-subtle)] p-1.5 text-[var(--color-sponsors-fg)]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
          </div>
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
