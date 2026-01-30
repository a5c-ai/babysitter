"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SearchBar } from "@/components/catalog/SearchBar";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { EntityList } from "@/components/catalog/EntityList";
import { SkillCard } from "@/components/catalog/EntityCard/SkillCard";
import type { SkillListItem, DomainListItem, SpecializationListItem } from "@/lib/api/types";
import type { Route } from "next";
import SkillsLoading from "./loading";

function SkillsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [skills, setSkills] = React.useState<SkillListItem[]>([]);
  const [domains, setDomains] = React.useState<DomainListItem[]>([]);
  const [_specializations, setSpecializations] = React.useState<SpecializationListItem[]>([]); // Reserved for filter UI
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Get initial values from URL
  const initialDomain = searchParams.get("domain") || "";
  const initialSpecialization = searchParams.get("specialization") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = React.useState(initialSearch);
  const [filterDomain, setFilterDomain] = React.useState(initialDomain);
  const [filterSpecialization, _setFilterSpecialization] = React.useState(initialSpecialization); // Reserved for filter UI
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(12);

  // Fetch reference data
  React.useEffect(() => {
    const fetchReferenceData = async () => {
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
        console.error("Failed to fetch reference data:", error);
      }
    };
    fetchReferenceData();
  }, []);

  // Fetch skills
  React.useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", itemsPerPage.toString());
        params.set("offset", ((currentPage - 1) * itemsPerPage).toString());
        if (filterDomain) params.set("domain", filterDomain);
        if (filterSpecialization) params.set("specialization", filterSpecialization);

        const res = await fetch(`/api/skills?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setSkills(json.data || []);
          setTotal(json.meta?.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch skills:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, [currentPage, itemsPerPage, filterDomain, filterSpecialization]);

  // Update URL when filters change
  const updateUrl = React.useCallback((domain: string, specialization: string, page: number, query: string) => {
    const params = new URLSearchParams();
    if (domain) params.set("domain", domain);
    if (specialization) params.set("specialization", specialization);
    if (page > 1) params.set("page", page.toString());
    if (query) params.set("q", query);

    const search = params.toString();
    const url = search ? `/skills?${search}` : "/skills";
    router.push(url as Route);
  }, [router]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    updateUrl(filterDomain, filterSpecialization, 1, query);

    // If search query, redirect to global search
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}&type=skill` as Route);
    }
  };

  const handleFilterChange = (filters: { domain?: string; category?: string }) => {
    const newDomain = filters.domain || "";
    setFilterDomain(newDomain);
    setCurrentPage(1);
    updateUrl(newDomain, filterSpecialization, 1, searchQuery);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(filterDomain, filterSpecialization, page, searchQuery);
  };

  // Filter skills by search query (client-side)
  const filteredSkills = searchQuery
    ? skills.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : skills;

  const domainNames = domains.map((d) => d.name);

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Skills" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
        <p className="mt-2 text-muted-foreground">
          Browse reusable skill modules for building intelligent automation workflows.
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
          <div className="mb-6">
            <SearchBar
              value={searchQuery}
              onSearch={handleSearch}
              domains={domainNames}
              suggestions={skills.slice(0, 5).map((s) => s.name)}
            />
          </div>

          <EntityList
            items={filteredSkills}
            totalItems={total}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={setItemsPerPage}
            isLoading={isLoading}
            skeletonCount={6}
            renderItem={(skill) => <SkillCard skill={skill} />}
            keyExtractor={(skill) => skill.id}
            emptyMessage="No skills found"
            emptyDescription="Try adjusting your filters or search query"
            gridCols={{ sm: 1, md: 2, lg: 3 }}
          />
        </div>
      </div>
    </PageContainer>
  );
}

export default function SkillsPage() {
  return (
    <React.Suspense fallback={<SkillsLoading />}>
      <SkillsContent />
    </React.Suspense>
  );
}
