"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { SearchBar } from "@/components/catalog/SearchBar";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { EntityList } from "@/components/catalog/EntityList";
import { ProcessCard } from "@/components/catalog/EntityCard/ProcessCard";
import type { ProcessListItem } from "@/lib/api/types";
import type { Route } from "next";
import ProcessesLoading from "./loading";

function ProcessesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [processes, setProcesses] = React.useState<ProcessListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [categories, setCategories] = React.useState<string[]>([]);

  // Get initial values from URL
  const initialCategory = searchParams.get("category") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = React.useState(initialSearch);
  const [filterCategory, setFilterCategory] = React.useState(initialCategory);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(12);

  // Fetch processes
  React.useEffect(() => {
    const fetchProcesses = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", itemsPerPage.toString());
        params.set("offset", ((currentPage - 1) * itemsPerPage).toString());
        if (filterCategory) params.set("category", filterCategory);

        const res = await fetch(`/api/processes?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setProcesses(json.data || []);
          setTotal(json.meta?.total || 0);

          // Extract unique categories from results if we don't have them yet
          if (categories.length === 0 && json.data) {
            const uniqueCategories = [...new Set(json.data.map((p: ProcessListItem) => p.category).filter(Boolean))] as string[];
            setCategories(uniqueCategories);
          }
        }
      } catch (error) {
        console.error("Failed to fetch processes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcesses();
  }, [currentPage, itemsPerPage, filterCategory]);

  // Fetch all categories on mount
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/processes?limit=1000");
        if (res.ok) {
          const json = await res.json();
          const uniqueCategories = [...new Set((json.data || []).map((p: ProcessListItem) => p.category).filter(Boolean))] as string[];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Update URL when filters change
  const updateUrl = React.useCallback((category: string, page: number, query: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (page > 1) params.set("page", page.toString());
    if (query) params.set("q", query);

    const search = params.toString();
    const url = search ? `/processes?${search}` : "/processes";
    router.push(url as Route);
  }, [router]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    updateUrl(filterCategory, 1, query);

    // If search query, redirect to global search
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}&type=process` as Route);
    }
  };

  const handleFilterChange = (filters: { category?: string }) => {
    const newCategory = filters.category || "";
    setFilterCategory(newCategory);
    setCurrentPage(1);
    updateUrl(newCategory, 1, searchQuery);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl(filterCategory, page, searchQuery);
  };

  // Filter processes by search query (client-side for now)
  const filteredProcesses = searchQuery
    ? processes.filter(
        (p) =>
          p.processId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : processes;

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Processes" },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Processes</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and explore process definitions for building automation workflows.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <FilterPanel
            filters={{ category: filterCategory || undefined }}
            onFilterChange={handleFilterChange}
            categories={categories}
            showEntityTypes={false}
            showDomain={false}
            showExpertise={false}
            showCategory={true}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <SearchBar
              value={searchQuery}
              onSearch={handleSearch}
              suggestions={processes.slice(0, 5).map((p) => p.processId)}
            />
          </div>

          <EntityList
            items={filteredProcesses}
            totalItems={total}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={setItemsPerPage}
            isLoading={isLoading}
            skeletonCount={6}
            renderItem={(process) => <ProcessCard process={process} />}
            keyExtractor={(process) => process.id}
            emptyMessage="No processes found"
            emptyDescription="Try adjusting your filters or search query"
            gridCols={{ sm: 1, md: 2, lg: 2 }}
          />
        </div>
      </div>
    </PageContainer>
  );
}

export default function ProcessesPage() {
  return (
    <React.Suspense fallback={<ProcessesLoading />}>
      <ProcessesContent />
    </React.Suspense>
  );
}
