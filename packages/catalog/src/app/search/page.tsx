"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
// Badge and Button imports removed (unused)
import { CardSkeleton } from "@/components/common/LoadingSkeleton";
import type { SearchResultItem } from "@/lib/api/types";
import SearchLoading from "./loading";

type EntityType = "agent" | "skill" | "process" | "domain" | "specialization";

// Neon side accent for card decorations
function NeonSideAccent({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '8px',
        bottom: '8px',
        [side]: '0',
        width: '3px',
        background: 'linear-gradient(180deg, transparent 0%, var(--scifi-cyan, #00DFDF) 20%, var(--scifi-magenta, #FF00E0) 80%, transparent 100%)',
        boxShadow: '0 0 8px rgba(0, 223, 223, 0.4)',
        borderRadius: '2px',
        zIndex: 10,
      }}
    />
  );
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const initialType = searchParams.get("type") as EntityType | null;

  const [query, setQuery] = React.useState(initialQuery);
  const [inputValue, setInputValue] = React.useState(initialQuery);
  const [activeType, setActiveType] = React.useState<EntityType | "all">(initialType || "all");
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Perform search
  const performSearch = React.useCallback(async (searchQuery: string, type: EntityType | "all") => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: "50",
      });
      if (type !== "all") {
        params.set("type", type);
      }

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setResults(json.data || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search on initial load if query exists
  const initialSearchDoneRef = React.useRef(false);
  React.useEffect(() => {
    if (initialQuery && !initialSearchDoneRef.current) {
      initialSearchDoneRef.current = true;
      performSearch(initialQuery, activeType);
    }
  }, [initialQuery, activeType, performSearch]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setInputValue(newQuery);
    updateUrl(newQuery, activeType);
    performSearch(newQuery, activeType);
  };

  const handleTypeChange = (type: EntityType | "all") => {
    setActiveType(type);
    updateUrl(query, type);
    performSearch(query, type);
  };

  const updateUrl = (q: string, type: EntityType | "all") => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type !== "all") params.set("type", type);

    const search = params.toString();
    const url = search ? `/search?${search}` : "/search";
    router.push(url as Route);
  };

  const clearSearch = () => {
    setQuery("");
    setInputValue("");
    setResults([]);
    setHasSearched(false);
    router.push("/search" as Route);
  };

  const clearFilters = () => {
    setActiveType("all");
    if (query) {
      updateUrl(query, "all");
      performSearch(query, "all");
    }
  };

  // Group results by type
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, SearchResultItem[]> = {};
    results.forEach((result) => {
      const type = result.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(result);
    });
    return groups;
  }, [results]);

  const typeOrder: EntityType[] = ["process", "skill", "agent", "domain", "specialization"];
  const sortedTypes = Object.keys(groupedResults).sort(
    (a, b) => typeOrder.indexOf(a as EntityType) - typeOrder.indexOf(b as EntityType)
  );

  // Active filters for display
  const activeFilters: { key: string; label: string }[] = [];
  if (query) {
    activeFilters.push({ key: "query", label: `boost: '${query}'` });
  }

  return (
    <PageContainer>


      {/* Sci-Fi Header Banner with Neon Accents */}
      <div className="mb-8 relative">
        <div className="relative mx-auto max-w-4xl">
          <div
            style={{
              position: 'relative',
              padding: '2rem 3rem',
              background: 'linear-gradient(135deg, var(--scifi-surface, #1a1a2e) 0%, var(--scifi-card, #12121a) 100%)',
              border: '1px solid var(--scifi-border-neon, rgba(255, 0, 224, 0.2))',
              borderRadius: 'var(--radius, 4px)',
              boxShadow: '0 0 20px rgba(0, 223, 223, 0.1), inset 0 0 30px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Neon top line */}
            <div style={{
              position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--scifi-cyan, #00DFDF), var(--scifi-magenta, #FF00E0), var(--scifi-cyan, #00DFDF), transparent)',
              boxShadow: '0 0 12px rgba(0, 223, 223, 0.5)',
            }} />
            {/* Grid pattern overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,223,223,0.05) 1px, transparent 0)',
              backgroundSize: '30px 30px',
              pointerEvents: 'none',
            }} />
            {/* Title */}
            <h2
              style={{
                textAlign: 'center',
                fontFamily: 'var(--font-header, var(--font-scifi-header))',
                fontSize: '2rem',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textShadow: '0 0 20px rgba(0, 223, 223, 0.5)',
                margin: 0,
                position: 'relative',
              }}
            >
              Search Catalog
            </h2>
            {/* Neon bottom line */}
            <div style={{
              position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--scifi-magenta, #FF00E0), var(--scifi-cyan, #00DFDF), var(--scifi-magenta, #FF00E0), transparent)',
              boxShadow: '0 0 12px rgba(255, 0, 224, 0.5)',
            }} />
          </div>
        </div>
      </div>

      {/* Page Title and Subtitle */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-header, var(--font-scifi-header))', color: '#ffffff', letterSpacing: '0.05em', textTransform: 'uppercase', textShadow: '0 0 12px rgba(0, 223, 223, 0.4)' }}
        >
          Search Catalog
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
          Search across all processes, skills, agents, and domains.
        </p>
      </div>

      {/* Search Bar with Neon Frame */}
      <div className="mb-4" style={{ overflow: 'visible' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Main search frame - sci-fi neon capsule */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              height: '50px',
              /* Dark surface with neon border glow */
              background: 'linear-gradient(180deg, var(--scifi-surface-elevated, #2a2a45) 0%, var(--scifi-surface, #1a1a2e) 100%)',
              borderRadius: '25px',
              border: '1px solid rgba(0, 223, 223, 0.3)',
              boxShadow: '0 0 15px rgba(0, 223, 223, 0.1), inset 0 0 20px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Left neon accent band */}
            <div
              style={{
                width: '32px',
                height: '100%',
                background: 'linear-gradient(90deg, rgba(0,223,223,0.05) 0%, rgba(0,223,223,0.15) 50%, rgba(0,223,223,0.05) 100%)',
                borderRadius: '25px 5px 5px 25px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '14px',
                borderRight: '1px solid rgba(0, 223, 223, 0.15)',
              }}
            >
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, var(--scifi-cyan, #00DFDF) 0%, rgba(0,223,223,0.3) 100%)',
                boxShadow: '0 0 6px rgba(0,223,223,0.5)',
              }} />
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, var(--scifi-magenta, #FF00E0) 0%, rgba(255,0,224,0.3) 100%)',
                boxShadow: '0 0 6px rgba(255,0,224,0.5)',
              }} />
            </div>

            {/* Inner search input area */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '3px',
                padding: '0 14px',
                margin: '0 3px',
                border: '1px solid rgba(0, 223, 223, 0.15)',
                height: '34px',
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="var(--scifi-cyan, #00DFDF)" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 3px rgba(0,223,223,0.5))' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(inputValue);
                  }
                }}
                placeholder="Search..."
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ fontFamily: 'var(--font-body, Inter, sans-serif)', color: '#ffffff' }}
              />
              <button onClick={clearSearch} className="p-0.5 hover:opacity-70 rounded flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="rgba(255,255,255,0.4)" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Right neon accent band */}
            <div
              style={{
                width: '32px',
                height: '100%',
                background: 'linear-gradient(90deg, rgba(255,0,224,0.05) 0%, rgba(255,0,224,0.15) 50%, rgba(255,0,224,0.05) 100%)',
                borderRadius: '5px 25px 25px 5px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '14px',
                borderLeft: '1px solid rgba(255, 0, 224, 0.15)',
              }}
            >
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, var(--scifi-magenta, #FF00E0) 0%, rgba(255,0,224,0.3) 100%)',
                boxShadow: '0 0 6px rgba(255,0,224,0.5)',
              }} />
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, var(--scifi-cyan, #00DFDF) 0%, rgba(0,223,223,0.3) 100%)',
                boxShadow: '0 0 6px rgba(0,223,223,0.5)',
              }} />
            </div>
          </div>

          {/* "All Types" dropdown - sci-fi neon styled */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={activeType}
              onChange={(e) => handleTypeChange(e.target.value as EntityType | "all")}
              className="cursor-pointer appearance-none"
              style={{
                background: 'linear-gradient(180deg, var(--scifi-surface-elevated, #2a2a45) 0%, var(--scifi-surface, #1a1a2e) 100%)',
                border: '1px solid rgba(0, 223, 223, 0.3)',
                borderRadius: '6px',
                padding: '12px 42px 12px 14px',
                fontFamily: 'var(--font-body, Inter, sans-serif)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: '0 0 10px rgba(0, 223, 223, 0.1), inset 0 0 10px rgba(0, 0, 0, 0.2)',
                height: '48px',
                minWidth: '118px',
              }}
            >
              <option value="all">All Types</option>
              <option value="process">Processes</option>
              <option value="skill">Skills</option>
              <option value="agent">Agents</option>
              <option value="domain">Domains</option>
              <option value="specialization">Specializations</option>
            </select>
            <div
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--scifi-cyan, #00DFDF)',
                filter: 'drop-shadow(0 0 3px rgba(0,223,223,0.5))',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters - Neon-styled filter chips */}
      {activeFilters.length > 0 && (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <span
            className="text-sm"
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-body, Inter, sans-serif)',
            }}
          >
            Active Filters:
          </span>
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs"
              style={{
                background: 'rgba(0, 223, 223, 0.1)',
                border: '1px solid rgba(0, 223, 223, 0.3)',
                color: 'var(--scifi-cyan, #00DFDF)',
                fontFamily: 'var(--font-body, Inter, sans-serif)',
                borderRadius: '4px',
              }}
            >
              {filter.label}
              <button onClick={clearSearch} className="ml-1 opacity-70 hover:opacity-100">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-sm hover:underline"
            style={{ color: 'var(--scifi-cyan, #00DFDF)', fontFamily: 'var(--font-body, Inter, sans-serif)' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Buttons - Neon Styled with indicator dots */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { type: "all" as const, label: "All", icon: null },
          { type: "process" as const, label: "Processes", icon: <ProcessIcon className="w-4 h-4" /> },
          { type: "skill" as const, label: "Skills", icon: <SkillIcon className="w-4 h-4" /> },
          { type: "agent" as const, label: "Agents", icon: <AgentIcon className="w-4 h-4" /> },
          { type: "domain" as const, label: "Domains", icon: <DomainIcon className="w-4 h-4" /> },
          { type: "specialization" as const, label: "Specializations", icon: <SpecializationIcon className="w-4 h-4" /> },
        ].map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className="relative inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium transition-all"
            style={activeType === type ? {
              background: 'linear-gradient(180deg, rgba(0,223,223,0.2) 0%, rgba(0,223,223,0.1) 100%)',
              color: 'var(--scifi-cyan, #00DFDF)',
              border: '1px solid rgba(0, 223, 223, 0.5)',
              borderRadius: '6px',
              boxShadow: '0 0 12px rgba(0, 223, 223, 0.2), inset 0 0 8px rgba(0, 223, 223, 0.1)',
              fontFamily: 'var(--font-body, Inter, sans-serif)',
              textShadow: '0 0 8px rgba(0, 223, 223, 0.5)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            } : {
              background: 'var(--scifi-surface, #1a1a2e)',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255, 0, 224, 0.15)',
              borderRadius: '6px',
              boxShadow: '0 0 4px rgba(0, 0, 0, 0.2)',
              fontFamily: 'var(--font-body, Inter, sans-serif)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {/* Top-left indicator dot */}
            <span
              style={{
                position: 'absolute',
                top: '3px',
                left: '3px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: activeType === type ? 'var(--scifi-cyan, #00DFDF)' : 'rgba(255,255,255,0.15)',
                boxShadow: activeType === type ? '0 0 4px rgba(0,223,223,0.5)' : 'none',
              }}
            />
            {/* Top-right indicator dot */}
            <span
              style={{
                position: 'absolute',
                top: '3px',
                right: '3px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: activeType === type ? 'var(--scifi-cyan, #00DFDF)' : 'rgba(255,255,255,0.15)',
                boxShadow: activeType === type ? '0 0 4px rgba(0,223,223,0.5)' : 'none',
              }}
            />
            {/* Bottom-left indicator dot */}
            <span
              style={{
                position: 'absolute',
                bottom: '3px',
                left: '3px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: activeType === type ? 'var(--scifi-magenta, #FF00E0)' : 'rgba(255,255,255,0.15)',
                boxShadow: activeType === type ? '0 0 4px rgba(255,0,224,0.5)' : 'none',
              }}
            />
            {/* Bottom-right indicator dot */}
            <span
              style={{
                position: 'absolute',
                bottom: '3px',
                right: '3px',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: activeType === type ? 'var(--scifi-magenta, #FF00E0)' : 'rgba(255,255,255,0.15)',
                boxShadow: activeType === type ? '0 0 4px rgba(255,0,224,0.5)' : 'none',
              }}
            />
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
        </div>
      ) : hasSearched ? (
        results.length > 0 ? (
          <div className="space-y-10">
            {/* Grouped results */}
            {activeType === "all" ? (
              sortedTypes.map((type) => {
                const typeResults = groupedResults[type];
                if (!typeResults) return null;
                return (
                  <div key={type}>
                    {/* Section header - neon styled */}
                    <div className="mb-5 flex items-center gap-2.5 pb-2" style={{ borderBottom: '1px solid rgba(0, 223, 223, 0.2)' }}>
                      <svg className="w-[18px] h-[18px]" fill="var(--scifi-cyan, #00DFDF)" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 4px rgba(0,223,223,0.5))' }}>
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                      <h2
                        className="text-lg font-semibold tracking-wide"
                        style={{ fontFamily: 'var(--font-header, var(--font-scifi-header))', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', textShadow: '0 0 10px rgba(0, 223, 223, 0.3)' }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </h2>
                      <span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
                        ({typeResults.length})
                      </span>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {typeResults.map((result) => (
                        <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((result) => (
                  <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="var(--scifi-cyan, #00DFDF)" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 6px rgba(0,223,223,0.4))' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-header, var(--font-scifi-header))', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                No results found
              </h3>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
                Try different keywords or adjust your filters
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="var(--scifi-cyan, #00DFDF)" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 6px rgba(0,223,223,0.4))' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-header, var(--font-scifi-header))', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Start searching
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
              Enter a search term to find processes, skills, agents, and more
            </p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </React.Suspense>
  );
}

function SearchResultCard({ result }: { result: SearchResultItem }) {
  const getHref = (): string => {
    switch (result.type) {
      case "agent":
        return `/agents/${encodeURIComponent(result.name)}`;
      case "skill":
        return `/skills/${encodeURIComponent(result.name)}`;
      case "process":
        return `/processes/${result.id}`;
      case "domain":
        return `/domains/${encodeURIComponent(result.name)}`;
      case "specialization":
        return `/specializations/${encodeURIComponent(result.name)}`;
      default:
        return "#";
    }
  };

  return (
    <Link href={getHref() as Route}>
      {/* Outer wrapper - sci-fi card with neon border */}
      <div
        className="h-full group relative transition-all hover:shadow-lg hover:-translate-y-0.5"
        style={{
          position: 'relative',
          borderRadius: '8px',
          background: 'var(--scifi-card, #12121a)',
          border: '1px solid rgba(255, 0, 224, 0.15)',
          boxShadow: '0 0 12px rgba(0, 0, 0, 0.3), 0 0 4px rgba(255, 0, 224, 0.05)',
          overflow: 'visible',
          padding: '4px',
        }}
      >
        {/* Left Neon Accent */}
        <NeonSideAccent side="left" />

        {/* Right Neon Accent */}
        <NeonSideAccent side="right" />

        {/* Card content area with inner neon border */}
        <div
          style={{
            position: 'relative',
            marginLeft: '12px',
            marginRight: '12px',
            borderRadius: '6px',
            border: '1px solid rgba(0, 223, 223, 0.1)',
            background: 'var(--scifi-surface, #1a1a2e)',
            overflow: 'hidden',
          }}
        >
          {/* Card body */}
          <div className="p-3">
            {/* Title row with globe icon on the right */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="truncate flex-1"
                style={{
                  fontFamily: 'var(--font-header, var(--font-scifi-header))',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '1.3',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                {result.name}
              </span>
              <GlobeIcon size={18} className="flex-shrink-0" style={{ color: 'var(--scifi-cyan, #00DFDF)', filter: 'drop-shadow(0 0 3px rgba(0,223,223,0.4))' }} />
            </div>

            {/* Badge - neon colored */}
            <div
              className="inline-block capitalize mb-2"
              style={{
                background: 'rgba(0, 223, 223, 0.15)',
                color: 'var(--scifi-cyan, #00DFDF)',
                borderRadius: '3px',
                fontFamily: 'var(--font-body, Inter, sans-serif)',
                fontSize: '11px',
                fontWeight: 500,
                padding: '2px 8px',
                lineHeight: '1.4',
                border: '1px solid rgba(0, 223, 223, 0.2)',
              }}
            >
              {result.type}
            </div>

            {/* Description */}
            <p
              className="line-clamp-2"
              style={{
                fontFamily: 'var(--font-body, Inter, sans-serif)',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: '1.5',
                fontSize: '13px',
                fontWeight: 400,
                margin: 0,
              }}
            >
              {result.description || "No description available"}
            </p>

            {/* Highlights if present */}
            {result.highlights?.content && (
              <div
                className="mt-2 leading-relaxed"
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: 'var(--font-body, Inter, sans-serif)',
                  fontSize: '12px',
                }}
              >
                <span
                  dangerouslySetInnerHTML={{
                    __html: result.highlights.content.replace(
                      /<mark>/g,
                      '<mark style="background-color: rgba(0, 223, 223, 0.2); color: var(--scifi-cyan, #00DFDF); padding: 1px 3px; border-radius: 2px;">'
                    ),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Globe Icon for SearchResultCard
function GlobeIcon({ className, size = 16, style }: { className?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  );
}

function ProcessIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function SkillIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function AgentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function DomainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function SpecializationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}
