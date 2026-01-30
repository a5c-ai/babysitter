# Performance Analysis: Process Library Catalog

**Date:** 2026-01-26
**Scope:** Performance optimization opportunities and critical bottlenecks
**Status:** Analysis Complete

---

## Executive Summary

This analysis identifies **23 performance optimization opportunities** across the Process Library Catalog application. The codebase demonstrates several performance anti-patterns including:

- Missing memoization in render-heavy components
- Redundant API calls and waterfall data fetching
- Inefficient database query patterns
- Large bundle size contributors
- Missing caching at multiple layers
- Suboptimal code splitting strategies

**Critical Finding:** The agents list page makes up to 3 separate API calls on initial load, with one fetching up to 1000 records just to extract unique expertise values - a classic N+1 adjacent pattern.

---

## Table of Contents

1. [Render Path Performance](#1-render-path-performance)
2. [Memoization Opportunities](#2-memoization-opportunities)
3. [N+1 and Data Fetching Issues](#3-n1-and-data-fetching-issues)
4. [Bundle Size Analysis](#4-bundle-size-analysis)
5. [Re-render Prevention](#5-re-render-prevention)
6. [Code Splitting and Lazy Loading](#6-code-splitting-and-lazy-loading)
7. [Database Query Optimization](#7-database-query-optimization)
8. [Caching Opportunities](#8-caching-opportunities)
9. [Image and Asset Optimization](#9-image-and-asset-optimization)
10. [Parallel Processing Opportunities](#10-parallel-processing-opportunities)
11. [Recommendations Summary](#11-recommendations-summary)

---

## 1. Render Path Performance

### 1.1 Expensive Dashboard Render (CRITICAL)

**Location:** `src/app/page.tsx`

**Issue:** The dashboard home page performs data transformation on every render:

```typescript
// Lines 37-52 - Data transformation happens during render
const barChartData: BarChartData[] = analytics?.distributions.byCategory?.map((item) => ({
  name: item.name,
  value: item.count,
  href: `/processes?category=${encodeURIComponent(item.name)}`,
})) || [];

const pieChartData: PieChartData[] = analytics?.distributions.byType?.map((item) => ({
  name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
  value: item.count,
})) || [];

const treemapData: TreemapData[] = analytics?.distributions.byDomain?.map((item) => ({
  name: item.name,
  size: item.count,
})) || [];
```

**Impact:** Medium - Creates new objects on every render, triggering unnecessary child re-renders.

**Recommendation:** Move to server-side data transformation or use `useMemo` if converted to client component.

---

### 1.2 MarkdownRenderer Heavy Processing

**Location:** `src/components/markdown/MarkdownRenderer.tsx`

**Issue:** The component creates heading components on every invocation of `createHeadingComponent`:

```typescript
// Lines 32-75 - Creates new component functions
function createHeadingComponent(level: 1 | 2 | 3 | 4 | 5 | 6) {
  const HeadingComponent = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    const text = React.Children.toArray(children)
      .filter((child) => typeof child === 'string')
      .join('');
    // ... slug generation on every render
```

**Impact:** High for pages with lots of markdown content.

**Recommendation:** Pre-compute heading IDs and memoize the components object.

---

### 1.3 EntityList Grid Class Computation

**Location:** `src/components/catalog/EntityList.tsx`

**Issue:** `getGridClass()` is called on every render without memoization:

```typescript
// Lines 85-96 - Recalculates on every render
const getGridClass = () => {
  const classes = ["grid", "gap-4", "grid-cols-1"];
  if (gridCols.sm && gridCols.sm > 1)
    classes.push(gridColsClasses[gridCols.sm as keyof typeof gridColsClasses] || "");
  // ...
  return classes.filter(Boolean).join(" ");
};
```

**Impact:** Low individually, but called frequently.

**Recommendation:** Memoize with `useMemo` based on `gridCols`.

---

## 2. Memoization Opportunities

### 2.1 Missing useMemo in FilterPanel

**Location:** `src/components/catalog/FilterPanel.tsx`

**Issue:** Filter calculations run on every render:

```typescript
// Lines 150-161 - No memoization
const hasActiveFilters =
  (filters.entityTypes && filters.entityTypes.length > 0) ||
  filters.domain ||
  filters.category ||
  (filters.expertise && filters.expertise.length > 0);

const activeFilterCount =
  (filters.entityTypes?.length || 0) +
  (filters.domain ? 1 : 0) +
  (filters.category ? 1 : 0) +
  (filters.expertise?.length || 0);
```

**Recommendation:**
```typescript
const hasActiveFilters = React.useMemo(() =>
  Boolean(filters.entityTypes?.length || filters.domain || filters.category || filters.expertise?.length),
  [filters.entityTypes, filters.domain, filters.category, filters.expertise]
);
```

---

### 2.2 Missing useCallback for Event Handlers

**Location:** `src/components/catalog/FilterPanel.tsx`

**Issue:** Handler functions recreated on every render:

```typescript
// Lines 108-148 - No useCallback
const handleEntityTypeToggle = (type: EntityType) => {
  // ...
};

const handleDomainChange = (domain: string) => {
  // ...
};
```

**Impact:** Causes unnecessary re-renders of child components.

**Recommendation:** Wrap all handlers with `useCallback`.

---

### 2.3 Missing React.memo on Card Components

**Location:** `src/components/catalog/EntityCard/*.tsx`

**Issue:** Entity cards (AgentCard, SkillCard, ProcessCard) are not memoized.

**Impact:** Every filter/page change re-renders all visible cards even when their data hasn't changed.

**Recommendation:**
```typescript
export const AgentCard = React.memo(function AgentCard({ agent }: AgentCardProps) {
  // ...
});
```

---

### 2.4 RelatedItemCard Not Memoized

**Location:** `src/components/catalog/RelatedItems.tsx`

**Issue:** `RelatedItemCard` component is defined inside the file but not memoized:

```typescript
// Lines 108-148 - Renders frequently without memoization
function RelatedItemCard({ item }: { item: RelatedItem }) {
  return (
    <Link href={item.href as Route}>
      // ... complex JSX
    </Link>
  );
}
```

**Recommendation:** Apply `React.memo` wrapper.

---

## 3. N+1 and Data Fetching Issues

### 3.1 Expertise Extraction Anti-Pattern (CRITICAL)

**Location:** `src/app/agents/page.tsx`

**Issue:** Fetches ALL agents (up to 1000) just to extract unique expertise values:

```typescript
// Lines 53-61 - Extremely inefficient
const agentsRes = await fetch("/api/agents?limit=1000");
if (agentsRes.ok) {
  const json = await agentsRes.json();
  const allExpertise = new Set<string>();
  (json.data || []).forEach((agent: AgentListItem) => {
    (agent.expertise || []).forEach((exp) => allExpertise.add(exp));
  });
  setExpertiseOptions(Array.from(allExpertise).sort());
}
```

**Impact:** CRITICAL - Downloads potentially megabytes of data for a simple list of strings.

**Recommendation:** Create a dedicated `/api/agents/expertise` endpoint:
```sql
SELECT DISTINCT value
FROM agents, json_each(agents.expertise)
ORDER BY value;
```

---

### 3.2 Waterfall Data Fetching Pattern

**Location:** `src/app/agents/page.tsx`, `src/app/skills/page.tsx`

**Issue:** Reference data and entity data are fetched in separate effects, creating waterfalls:

```typescript
// Effect 1: Fetch reference data
React.useEffect(() => {
  const fetchReferenceData = async () => {
    // Domains, specializations, expertise
  };
  fetchReferenceData();
}, []);

// Effect 2: Fetch entities (waits for effect 1 conceptually)
React.useEffect(() => {
  const fetchAgents = async () => { ... };
  fetchAgents();
}, [currentPage, itemsPerPage, filterDomain, filterExpertiseKey]);
```

**Recommendation:**
1. Use `Promise.all` for parallel fetching
2. Consider React Server Components for initial data
3. Use SWR/React Query for client-side caching

---

### 3.3 Duplicate API Call in usePaginatedQuery

**Location:** `src/lib/hooks/useApi.ts`

**Issue:** The hook makes TWO API calls - one for data, one for pagination metadata:

```typescript
// Lines 192-214 - Makes the same API call twice
const queryResult = useQuery<T[]>(buildEndpoint(), { ... });

React.useEffect(() => {
  const fetchPagination = async () => {
    try {
      const response = await fetch(buildEndpoint()); // DUPLICATE CALL!
      const json = await response.json();
      if (json.meta) {
        setPagination(json.meta);
      }
    }
  };
  fetchPagination();
}, [buildEndpoint]);
```

**Impact:** CRITICAL - Doubles API load for every paginated request.

**Recommendation:** Extract pagination from the initial response, not a separate call.

---

### 3.4 Search API Inefficiency

**Location:** `src/app/api/search/route.ts`

**Issue:** Fetches more results than needed, then slices:

```typescript
// Lines 49-56 - Over-fetches then discards
const allResults = queries.search(query, {
  limit: limit + offset, // Fetches more than needed
  types
});

// Apply offset
const paginatedResults = allResults.slice(offset, offset + limit);
const total = allResults.length; // Wrong total count!
```

**Impact:** High - For page 10 with limit 20, fetches 200 results just to show 20.

**Recommendation:** Implement proper OFFSET in the FTS5 query or use a separate COUNT query.

---

### 3.5 getCatalogEntries Union Query + In-Memory Filtering

**Location:** `src/lib/db/queries.ts`

**Issue:** The method fetches ALL data, then filters in JavaScript:

```typescript
// Lines 679-821 - Fetches everything, filters in memory
const rows = this.db.getDb().prepare(sql).all() as Array<...>;

// Apply filtering IN MEMORY
let filtered = entries;
if (options?.filters) {
  for (const filter of options.filters) {
    filtered = filtered.filter((entry) => { ... });
  }
}

// Apply search IN MEMORY
if (options?.search) {
  filtered = filtered.filter(...);
}
```

**Impact:** Grows worse with database size.

**Recommendation:** Build dynamic SQL with WHERE clauses instead of in-memory filtering.

---

## 4. Bundle Size Analysis

### 4.1 Recharts Full Import (CRITICAL)

**Location:** `src/components/dashboard/*.tsx`

**Issue:** Recharts is imported which is a large charting library (~400KB unpacked):

```typescript
import {
  Treemap,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
```

**Impact:** CRITICAL - Significant initial bundle size increase.

**Recommendations:**
1. Use dynamic imports with `next/dynamic`
2. Consider lighter alternatives (chart.js, lightweight custom SVG)
3. Use tree-shaking friendly imports

---

### 4.2 Lucide React Icons

**Location:** Throughout components

**Issue:** While Lucide supports tree-shaking, inline SVG icons are used inconsistently:

```typescript
// Sometimes uses inline SVG
<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path ... />
</svg>

// Package is installed but underutilized
import { ... } from "lucide-react";
```

**Recommendation:** Standardize on one approach - either all Lucide or all custom SVG.

---

### 4.3 react-markdown + Plugins

**Location:** `src/components/markdown/MarkdownRenderer.tsx`

**Imported packages:**
- `react-markdown` (~100KB)
- `remark-gfm` (~20KB)
- `rehype-highlight` (~50KB)

**Recommendation:** Lazy load the MarkdownRenderer since it's not needed on list pages.

---

### 4.4 Radix UI Component Bundle

**Location:** `package.json`

**Issue:** Multiple Radix UI packages imported:
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-tabs
- @radix-ui/react-tooltip
- @radix-ui/react-scroll-area
- @radix-ui/react-separator
- @radix-ui/react-accordion

**Recommendation:** Ensure only used components are imported; audit for unused packages.

---

## 5. Re-render Prevention

### 5.1 Object Identity in Props

**Location:** `src/app/agents/page.tsx`

**Issue:** Creating new objects in render causes child re-renders:

```typescript
// Line 173-176 - New object created on every render
<FilterPanel
  filters={{
    domain: filterDomain || undefined,
    expertise: filterExpertise.length > 0 ? filterExpertise : undefined,
  }}
  // ...
/>
```

**Recommendation:**
```typescript
const filterValue = React.useMemo(() => ({
  domain: filterDomain || undefined,
  expertise: filterExpertise.length > 0 ? filterExpertise : undefined,
}), [filterDomain, filterExpertise]);
```

---

### 5.2 Inline Function Props

**Location:** `src/app/agents/page.tsx`

**Issue:** Inline arrow functions in JSX:

```typescript
// Line 207 - New function reference on every render
renderItem={(agent) => <AgentCard agent={agent} />}
```

**Recommendation:** Extract to a memoized callback or component.

---

### 5.3 SearchBar State Sync Effect

**Location:** `src/components/catalog/SearchBar.tsx`

**Issue:** Effect that syncs external props to internal state triggers re-renders:

```typescript
// Lines 59-63 - Runs on every external prop change
React.useEffect(() => {
  setLocalFilters({ entityType: externalEntityType, domain: externalDomain });
}, [externalEntityType, externalDomain]);
```

**Recommendation:** Use controlled component pattern or derive state directly.

---

## 6. Code Splitting and Lazy Loading

### 6.1 Missing Dynamic Imports for Heavy Components

**Location:** Dashboard charts, MarkdownRenderer

**Issue:** Heavy components are statically imported:

```typescript
// src/app/page.tsx
import {
  MetricCard,
  BarChart,
  PieChart,
  TreemapChart,
  RecentActivity,
  QuickLinks,
  StatsOverview,
} from "@/components/dashboard";
```

**Recommendation:**
```typescript
const TreemapChart = dynamic(() => import('@/components/dashboard/TreemapChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

---

### 6.2 Route-Level Code Splitting

**Current State:** Next.js 16 provides automatic route-level code splitting.

**Optimization Opportunity:** Detail view pages load markdown rendering that isn't needed on list pages.

**Recommendation:** Verify chunks are split correctly using `next build && next analyze`.

---

### 6.3 Conditional Feature Loading

**Location:** Various detail views

**Issue:** Features like "Table of Contents" are always bundled even when `showTableOfContents={false}`:

```typescript
// Always imported
import { TableOfContents } from './TableOfContents';

// Conditionally rendered
{showTableOfContents && (
  <TableOfContents markdown={content} maxDepth={tocMaxDepth} />
)}
```

**Recommendation:** Dynamic import within the condition.

---

## 7. Database Query Optimization

### 7.1 Missing Database Indexes

**Location:** Schema definition (not visible, inferred from queries)

**Issue:** Queries filter on `d.name` and `s.name` (domain and specialization names) but indexes may only exist on IDs:

```sql
-- From agents route
WHERE s.name = ? AND d.name = ?
```

**Recommendation:** Add indexes:
```sql
CREATE INDEX idx_domains_name ON domains(name);
CREATE INDEX idx_specializations_name ON specializations(name);
```

---

### 7.2 Separate COUNT Query

**Location:** `src/app/api/agents/route.ts`

**Issue:** Runs a separate COUNT query before the main query:

```typescript
// Lines 91-97
let countSql = 'SELECT COUNT(*) as count FROM agents a LEFT JOIN specializations s...';
const countResult = rawDb.prepare(countSql).get(...countParams) as { count: number };
```

**Recommendation:** Use SQL window functions for combined data + count:
```sql
SELECT *, COUNT(*) OVER() as total_count FROM agents ...
```

---

### 7.3 FTS5 Query Without Proper Ranking

**Location:** `src/lib/db/queries.ts`

**Issue:** Search results are ordered by `rank` but FTS5 rank is not optimized:

```typescript
ORDER BY rank
LIMIT ?
```

**Recommendation:** Consider BM25 ranking or custom ranking functions for better relevance.

---

### 7.4 Analytics Multiple Sequential Queries

**Location:** `src/app/api/analytics/route.ts`

**Issue:** Runs 4 separate queries sequentially:

```typescript
const byDomainRows = rawDb.prepare(byDomainSql).all();
const byCategoryRows = rawDb.prepare(byCategorySql).all();
// ... stats queries
const recentRows = rawDb.prepare(recentActivitySql).all();
```

**Recommendation:** Combine into a single query using CTEs or use Promise.all with prepared statements.

---

### 7.5 Database Singleton Per-Request Overhead

**Location:** `src/lib/db/client.ts`

**Issue:** While using singleton pattern, the `initialize()` check happens on every request:

```typescript
public initialize(): void {
  if (this.isInitialized) return;  // Still a function call overhead
  // ...
}
```

**Impact:** Low - minimal overhead but could be eliminated.

---

## 8. Caching Opportunities

### 8.1 No API Response Caching

**Location:** All API routes

**Issue:** No caching headers set on API responses:

```typescript
// Current - no cache headers
return createSuccessResponse(agents, total, limit, offset);
```

**Recommendation:**
```typescript
return new NextResponse(JSON.stringify(response), {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  },
});
```

---

### 8.2 No Client-Side Query Caching

**Location:** `src/lib/hooks/useApi.ts`

**Issue:** Custom hooks don't cache results - refetches on every mount:

```typescript
// No cache, no deduplication
const fetchData = React.useCallback(async () => {
  const response = await fetch(endpoint);
  // ...
});
```

**Recommendation:** Implement SWR-like caching or use `@tanstack/react-query`.

---

### 8.3 Reference Data Not Cached

**Location:** `src/app/agents/page.tsx`, `src/app/skills/page.tsx`

**Issue:** Domains and specializations are refetched on every page navigation:

```typescript
React.useEffect(() => {
  const fetchReferenceData = async () => {
    const domainsRes = await fetch("/api/domains?limit=100");
    // ...
  };
  fetchReferenceData();
}, []);
```

**Recommendation:**
1. Use React Context for shared reference data
2. Cache in localStorage with TTL
3. Use React Query's cacheTime

---

### 8.4 No FTS Index Caching

**Location:** SQLite FTS5 configuration

**Issue:** FTS queries may benefit from preloading into memory cache.

**Recommendation:** Configure SQLite cache size pragma (already done: `cache_size = -64000`).

---

### 8.5 Dashboard Analytics Not Cached

**Location:** `src/app/page.tsx`

**Issue:** Dashboard uses `cache: "no-store"` forcing fresh fetch:

```typescript
const res = await fetch(`${baseUrl}/api/analytics`, {
  cache: "no-store",
});
```

**Recommendation:** Use incremental static regeneration or short cache:
```typescript
const res = await fetch(`${baseUrl}/api/analytics`, {
  next: { revalidate: 60 }, // Revalidate every 60 seconds
});
```

---

## 9. Image and Asset Optimization

### 9.1 SVG Icons Inline Duplication

**Location:** Throughout components

**Issue:** Same SVG icons are defined inline multiple times across files:

```typescript
// Repeated in FilterPanel, SearchBar, EntityCard, etc.
<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7..." />
</svg>
```

**Impact:** Increases HTML size and makes maintenance difficult.

**Recommendation:** Extract to a shared Icon component:
```typescript
// components/icons/ProcessIcon.tsx
export const ProcessIcon = ({ className }: { className?: string }) => (
  <svg className={className} ...>...</svg>
);
```

---

### 9.2 No Image Optimization Configuration

**Location:** `next.config.ts`

**Issue:** Only remote patterns defined, no local optimization settings:

```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "github.com" },
    { protocol: "https", hostname: "avatars.githubusercontent.com" },
  ],
},
```

**Recommendation:** Add image optimization settings:
```typescript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
  // ...
}
```

---

### 9.3 CSS Import in Component

**Location:** `src/components/markdown/MarkdownRenderer.tsx`

**Issue:** Imports CSS directly in component:

```typescript
import './markdown.css';
```

**Recommendation:** Use CSS modules or Tailwind utilities to enable better tree-shaking.

---

## 10. Parallel Processing Opportunities

### 10.1 Sequential Reference Data Fetching

**Location:** `src/app/skills/page.tsx` (Good example of parallel)

**Current:** Already uses `Promise.all` which is good:

```typescript
const [domainsRes, specsRes] = await Promise.all([
  fetch("/api/domains?limit=100"),
  fetch("/api/specializations?limit=500"),
]);
```

**Note:** This pattern should be applied consistently across all pages.

---

### 10.2 API Route Database Operations

**Location:** `src/app/api/analytics/route.ts`

**Issue:** Sequential database queries when they could be parallel:

```typescript
// These could run in parallel
const byDomainRows = rawDb.prepare(byDomainSql).all();
const byCategoryRows = rawDb.prepare(byCategorySql).all();
const recentRows = rawDb.prepare(recentActivitySql).all();
```

**Note:** SQLite operations are synchronous, so parallelization won't help. However, you could use a single combined query or transaction.

---

### 10.3 Suspense Boundaries for Parallel Loading

**Location:** Detail pages

**Issue:** No granular Suspense boundaries for parallel data loading:

```typescript
// Current - single boundary
<React.Suspense fallback={<Loading />}>
  <FullPageContent />
</React.Suspense>
```

**Recommendation:** Add nested Suspense for parallel streaming:
```typescript
<Suspense fallback={<HeaderSkeleton />}>
  <Header />
</Suspense>
<Suspense fallback={<ContentSkeleton />}>
  <Content />
</Suspense>
<Suspense fallback={<RelatedSkeleton />}>
  <RelatedItems />
</Suspense>
```

---

## 11. Recommendations Summary

### Critical Priority (Immediate Action)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | Duplicate API call in usePaginatedQuery | High | Low |
| 2 | Expertise extraction fetches 1000 agents | High | Medium |
| 3 | Search API over-fetches then slices | High | Medium |
| 4 | Dashboard analytics no-cache | Medium | Low |
| 5 | Recharts full bundle import | High | Medium |

### High Priority (This Sprint)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 6 | Missing React.memo on card components | Medium | Low |
| 7 | Reference data not cached between pages | Medium | Medium |
| 8 | getCatalogEntries in-memory filtering | Medium | High |
| 9 | API response caching headers | Medium | Low |
| 10 | Dynamic imports for charts | Medium | Medium |

### Medium Priority (Next Sprint)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 11 | Missing useCallback/useMemo throughout | Low | Medium |
| 12 | Inline SVG icon duplication | Low | Medium |
| 13 | Object identity in props | Low | Low |
| 14 | Database indexes on name columns | Low | Low |
| 15 | Markdown CSS as module | Low | Low |

### Quick Wins (Low Hanging Fruit)

1. **Add React.memo to EntityCard components** - 5 minutes each
2. **Fix duplicate pagination API call** - 15 minutes
3. **Add cache headers to API routes** - 30 minutes total
4. **Change analytics fetch to use revalidate** - 2 minutes
5. **Memoize filter calculations** - 10 minutes per component

---

## Performance Metrics to Track

After implementing optimizations, track:

1. **Time to First Byte (TTFB)** - Target: < 200ms
2. **First Contentful Paint (FCP)** - Target: < 1.5s
3. **Largest Contentful Paint (LCP)** - Target: < 2.5s
4. **Total Blocking Time (TBT)** - Target: < 300ms
5. **Cumulative Layout Shift (CLS)** - Target: < 0.1
6. **Bundle Size** - Track JS/CSS size per route
7. **API Response Times** - P50, P95, P99

---

## Implementation Order

1. **Week 1:** Critical fixes (items 1-5)
2. **Week 2:** High priority (items 6-10)
3. **Week 3:** Medium priority and monitoring setup
4. **Ongoing:** Continuous optimization based on metrics

---

## Appendix: Tools for Performance Analysis

- **Next.js Bundle Analyzer:** `@next/bundle-analyzer`
- **React DevTools Profiler:** Built into browser extension
- **Lighthouse:** Chrome DevTools
- **Web Vitals:** `next/web-vitals` integration
- **SQLite Query Analyzer:** `EXPLAIN QUERY PLAN`
