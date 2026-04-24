"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageContainer } from "@/components/layout/PageContainer";
import { SearchBar } from "@/components/catalog/SearchBar";
import { EntityList } from "@/components/catalog/EntityList";
import { AgentCard } from "@/components/catalog/EntityCard/AgentCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentListItem } from "@/lib/api/types";
import AgentsLoading from "./loading";

function AgentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [referenceAgents, setReferenceAgents] = React.useState<AgentListItem[]>([]);
  const [agents, setAgents] = React.useState<AgentListItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [searchQuery, setSearchQuery] = React.useState(searchParams.get("q") || "");
  const [providerFilter, setProviderFilter] = React.useState(searchParams.get("provider") || "");
  const [transportFilter, setTransportFilter] = React.useState(searchParams.get("transport") || "");
  const [modalityFilter, setModalityFilter] = React.useState(searchParams.get("modality") || "");
  const [capabilityFilter, setCapabilityFilter] = React.useState(searchParams.get("capability") || "");
  const [currentPage, setCurrentPage] = React.useState(parseInt(searchParams.get("page") || "1", 10));
  const [itemsPerPage, setItemsPerPage] = React.useState(9);

  React.useEffect(() => {
    const fetchReferenceAgents = async () => {
      try {
        const response = await fetch("/api/agents?limit=1000");
        if (!response.ok) return;
        const json = await response.json();
        setReferenceAgents(json.data || []);
      } catch (error) {
        console.error("Failed to load agent reference data:", error);
      }
    };

    fetchReferenceAgents();
  }, []);

  React.useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ limit: "1000" });
        if (providerFilter) params.set("provider", providerFilter);
        if (transportFilter) params.set("transport", transportFilter);
        if (modalityFilter) params.set("modality", modalityFilter);
        if (capabilityFilter) params.set("capability", capabilityFilter);

        const response = await fetch(`/api/agents?${params.toString()}`);
        if (!response.ok) return;
        const json = await response.json();
        setAgents(json.data || []);
      } catch (error) {
        console.error("Failed to load agents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, [providerFilter, transportFilter, modalityFilter, capabilityFilter]);

  const providerOptions = React.useMemo(
    () =>
      Array.from(new Set(referenceAgents.flatMap((agent) => agent.providers.map((provider) => provider.displayName)))).sort(),
    [referenceAgents],
  );
  const transportOptions = React.useMemo(
    () =>
      Array.from(new Set(referenceAgents.flatMap((agent) => agent.transports.map((transport) => transport.label)))).sort(),
    [referenceAgents],
  );
  const modalityOptions = React.useMemo(
    () =>
      Array.from(new Set(referenceAgents.flatMap((agent) => agent.modalities.map((modality) => modality.label)))).sort(),
    [referenceAgents],
  );
  const capabilityOptions = React.useMemo(
    () =>
      Array.from(new Set(referenceAgents.flatMap((agent) => agent.capabilities.map((capability) => capability.label)))).sort(),
    [referenceAgents],
  );

  const updateUrl = React.useCallback(
    (next: {
      q?: string;
      provider?: string;
      transport?: string;
      modality?: string;
      capability?: string;
      page?: number;
    }) => {
      const params = new URLSearchParams();
      if (next.q) params.set("q", next.q);
      if (next.provider) params.set("provider", next.provider);
      if (next.transport) params.set("transport", next.transport);
      if (next.modality) params.set("modality", next.modality);
      if (next.capability) params.set("capability", next.capability);
      if ((next.page ?? 1) > 1) params.set("page", String(next.page));

      const url = params.size > 0 ? `/agents?${params.toString()}` : "/agents";
      router.push(url as Route);
    },
    [router],
  );

  const filteredAgents = React.useMemo(() => {
    if (!searchQuery) return agents;

    const query = searchQuery.toLowerCase();
    return agents.filter((agent) => {
      const haystack = [
        agent.name,
        agent.versionRange,
        agent.description,
        agent.runtimeFamily ?? "",
        ...agent.providers.map((provider) => provider.displayName),
        ...agent.models.map((model) => model.label),
        ...agent.transports.map((transport) => transport.label),
        ...agent.modalities.map((modality) => modality.label),
        ...agent.capabilities.map((capability) => capability.label),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [agents, searchQuery]);

  const total = filteredAgents.length;
  const pagedAgents = React.useMemo(
    () => filteredAgents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [currentPage, filteredAgents, itemsPerPage],
  );

  const setFilter = (kind: "provider" | "transport" | "modality" | "capability", value: string) => {
    if (kind === "provider") setProviderFilter(value);
    if (kind === "transport") setTransportFilter(value);
    if (kind === "modality") setModalityFilter(value);
    if (kind === "capability") setCapabilityFilter(value);
    setCurrentPage(1);
    updateUrl({
      q: searchQuery,
      provider: kind === "provider" ? value : providerFilter,
      transport: kind === "transport" ? value : transportFilter,
      modality: kind === "modality" ? value : modalityFilter,
      capability: kind === "capability" ? value : capabilityFilter,
      page: 1,
    });
  };

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Agents" }]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <p className="mt-2 text-muted-foreground">
          Browse version-scoped ontology entries across providers, models, transports, modalities,
          lifecycle behavior, session semantics, and evidence-backed capability support.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-80">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ontology Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FilterSelect
                label="Provider"
                value={providerFilter}
                options={providerOptions}
                onChange={(value) => setFilter("provider", value)}
              />
              <FilterSelect
                label="Transport"
                value={transportFilter}
                options={transportOptions}
                onChange={(value) => setFilter("transport", value)}
              />
              <FilterSelect
                label="Modality"
                value={modalityFilter}
                options={modalityOptions}
                onChange={(value) => setFilter("modality", value)}
              />
              <FilterSelect
                label="Capability"
                value={capabilityFilter}
                options={capabilityOptions}
                onChange={(value) => setFilter("capability", value)}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--tkc-ink-quiet)]">
                  Active Matrix
                </p>
                <div className="flex flex-wrap gap-2">
                  {[providerFilter, transportFilter, modalityFilter, capabilityFilter]
                    .filter(Boolean)
                    .map((value) => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  {!providerFilter && !transportFilter && !modalityFilter && !capabilityFilter && (
                    <span className="text-sm text-[var(--tkc-ink-soft)]">All ontology facets</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-6">
            <SearchBar
              value={searchQuery}
              onSearch={(value) => {
                setSearchQuery(value);
                setCurrentPage(1);
                updateUrl({
                  q: value,
                  provider: providerFilter,
                  transport: transportFilter,
                  modality: modalityFilter,
                  capability: capabilityFilter,
                  page: 1,
                });
              }}
              suggestions={referenceAgents.slice(0, 8).map((agent) => `${agent.name} ${agent.versionRange}`)}
            />
          </div>

          <EntityList
            items={pagedAgents}
            totalItems={total}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              updateUrl({
                q: searchQuery,
                provider: providerFilter,
                transport: transportFilter,
                modality: modalityFilter,
                capability: capabilityFilter,
                page,
              });
            }}
            onItemsPerPageChange={setItemsPerPage}
            isLoading={isLoading}
            skeletonCount={6}
            renderItem={(agent) => <AgentCard agent={agent} />}
            keyExtractor={(agent) => agent.id}
            emptyMessage="No ontology entries found"
            emptyDescription="Adjust the provider, transport, modality, capability, or search filters."
            gridCols={{ sm: 1, md: 2, lg: 2, xl: 3 }}
            showViewToggle={false}
          />
        </div>
      </div>
    </PageContainer>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--tkc-ink-quiet)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-[var(--tkc-rule-m)] bg-[rgba(255,255,255,0.65)] px-3 py-2 text-sm text-[var(--tkc-ink)] focus:outline-none"
      >
        <option value="">All {label}s</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AgentsPage() {
  return (
    <React.Suspense fallback={<AgentsLoading />}>
      <AgentsContent />
    </React.Suspense>
  );
}
