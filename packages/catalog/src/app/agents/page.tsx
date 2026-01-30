"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SearchBar } from "@/components/catalog/SearchBar";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { EntityList } from "@/components/catalog/EntityList";
import { AgentCard } from "@/components/catalog/EntityCard/AgentCard";
import type { AgentListItem, DomainListItem } from "@/lib/api/types";
import type { Route } from "next";
import AgentsLoading from "./loading";

function AgentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [agents, setAgents] = React.useState<AgentListItem[]>([]);
  const [domains, setDomains] = React.useState<DomainListItem[]>([]);
  const [expertiseOptions, setExpertiseOptions] = React.useState<string[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Get initial values from URL
  const initialDomain = searchParams.get("domain") || "";
  // initialSpecialization reserved for future filter UI
  const initialExpertise = searchParams.get("expertise") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = React.useState(initialSearch);
  const [filterDomain, setFilterDomain] = React.useState(initialDomain);
  const [filterExpertise, setFilterExpertise] = React.useState<string[]>(
    initialExpertise ? initialExpertise.split(",") : []
  );
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(12);

  // Memoize filterExpertise to a stable string for dependency arrays
  const filterExpertiseKey = filterExpertise.join(",");

  // Fetch reference data
  React.useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const domainsRes = await fetch("/api/domains?limit=100");
        if (domainsRes.ok) {
          const json = await domainsRes.json();
          setDomains(json.data || []);
        }

        // Fetch all agents to extract unique expertise
        const agentsRes = await fetch("/api/agents?limit=1000");
        if (agentsRes.ok) {
          const json = await agentsRes.json();
          const allExpertise = new Set<string>();
          (json.data || []).forEach((agent: AgentListItem) => {
            (agent.expertise || []).forEach((exp) => allExpertise.add(exp));
          });
          setExpertiseOptions(Array.from(allExpertise).sort());
        }
      } catch (error) {
        console.error("Failed to fetch reference data:", error);
      }
    };
    fetchReferenceData();
  }, []);

  // Fetch agents
  React.useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", itemsPerPage.toString());
        params.set("offset", ((currentPage - 1) * itemsPerPage).toString());
        if (filterDomain) params.set("domain", filterDomain);
        if (filterExpertise.length > 0 && filterExpertise[0]) params.set("expertise", filterExpertise[0]);

        const res = await fetch(`/api/agents?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setAgents(json.data || []);
          setTotal(json.meta?.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Using filterExpertiseKey (string) instead of filterExpertise (array) to prevent infinite loops from array reference changes
  }, [currentPage, itemsPerPage, filterDomain, filterExpertiseKey]);

  // Update URL when filters change
  const updateUrl = React.useCallback((
    domain: string,
    expertise: string[],
    page: number,
    query: string
  ) => {
    const params = new URLSearchParams();
    if (domain) params.set("domain", domain);
    if (expertise.length > 0) params.set("expertise", expertise.join(","));
    if (page > 1) params.set("page", page.toString());
    if (query) params.set("q", query);

    const search = params.toString();
    const url = search ? `/agents?${search}` : "/agents";
    router.push(url as Route);
  }, [router]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    updateUrl(filterDomain, filterExpertise, 1, query);

    // If search query, redirect to global search
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}&type=agent` as Route);
    }
  };

  const handleFilterChange = (filters: { domain?: string; expertise?: string[] }) => {
    const newDomain = filters.domain || "";
    const newExpertise = filters.expertise || [];
    setFilterDomain(newDomain);
    setFilterExpertise(newExpertise);
    setCurrentPage(1);
    updateUrl(newDomain, newExpertise, 1, searchQuery);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(filterDomain, filterExpertise, page, searchQuery);
  };

  // Filter agents by search query (client-side)
  const filteredAgents = searchQuery
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.role?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : agents;

  const domainNames = domains.map((d) => d.name);

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Agents" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <p className="mt-2 text-muted-foreground">
          Discover specialized agents for task execution and automation.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <FilterPanel
            filters={{
              domain: filterDomain || undefined,
              expertise: filterExpertise.length > 0 ? filterExpertise : undefined,
            }}
            onFilterChange={handleFilterChange}
            domains={domainNames}
            expertiseOptions={expertiseOptions.slice(0, 20)}
            showEntityTypes={false}
            showDomain={true}
            showCategory={false}
            showExpertise={true}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <SearchBar
              value={searchQuery}
              onSearch={handleSearch}
              domains={domainNames}
              suggestions={agents.slice(0, 5).map((a) => a.name)}
            />
          </div>

          <EntityList
            items={filteredAgents}
            totalItems={total}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={setItemsPerPage}
            isLoading={isLoading}
            skeletonCount={6}
            renderItem={(agent) => <AgentCard agent={agent} />}
            keyExtractor={(agent) => agent.id}
            emptyMessage="No agents found"
            emptyDescription="Try adjusting your filters or search query"
            gridCols={{ sm: 1, md: 2, lg: 3 }}
          />
        </div>
      </div>
    </PageContainer>
  );
}

export default function AgentsPage() {
  return (
    <React.Suspense fallback={<AgentsLoading />}>
      <AgentsContent />
    </React.Suspense>
  );
}
