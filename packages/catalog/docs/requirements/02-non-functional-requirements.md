# Non-Functional Requirements (NFRs)

## Process Library Catalog

**Document Version:** 1.0
**Last Updated:** 2026-01-26
**Project Path:** `packages/catalog`

---

## Table of Contents

1. [Overview](#overview)
2. [Performance Requirements](#performance-requirements)
3. [Security Requirements](#security-requirements)
4. [Scalability Requirements](#scalability-requirements)
5. [Usability Requirements](#usability-requirements)
6. [Reliability Requirements](#reliability-requirements)
7. [Maintainability Requirements](#maintainability-requirements)
8. [Compatibility Requirements](#compatibility-requirements)
9. [Requirements Traceability Matrix](#requirements-traceability-matrix)

---

## Overview

This document specifies the non-functional requirements (NFRs) for the Process Library Catalog application. These requirements define the quality attributes, constraints, and operational characteristics that govern how the system performs its functions.

### Technology Stack Summary

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 16.1.4 |
| Runtime | React | 19.2.3 |
| Database | SQLite (better-sqlite3) | ^11.0.0 |
| Search | FTS5 (Full-Text Search) | SQLite native |
| Styling | Tailwind CSS | ^4 |
| Language | TypeScript | ^5 |
| UI Components | Radix UI | Various |

### Architecture Overview

The application follows a layered architecture:
- **Presentation Layer**: React components with Next.js App Router
- **API Layer**: Next.js Route Handlers
- **Service Layer**: Business logic and query builders
- **Data Access Layer**: SQLite with better-sqlite3
- **Storage Layer**: File-based SQLite database with WAL mode

---

## Performance Requirements

### NFR-001: Database Query Response Time

**Category:** Performance
**Priority:** High

**Description:**
Database queries must return results within acceptable time thresholds to ensure responsive user experience.

**Rationale:**
Users expect near-instant responses when browsing catalogs and searching content. Slow queries lead to poor user experience and reduced adoption.

**Current Implementation:**
- FTS5 virtual tables for full-text search with Porter stemming tokenizer
- B-tree indexes on frequently queried columns (name, category, domain_id, etc.)
- Prepared statements for query reuse
- 64MB database cache (`cache_size = -64000`)
- 256MB memory-mapped I/O (`mmap_size = 268435456`)

**Metrics/Thresholds:**
| Operation | Target Response Time |
|-----------|---------------------|
| Single record lookup | < 50ms |
| List queries (paginated) | < 100ms |
| Full-text search | < 200ms |
| Analytics aggregations | < 500ms |

**Implementation Evidence:**
```typescript
// From src/lib/db/client.ts
this.db.pragma('cache_size = -64000'); // 64MB cache
this.db.pragma('temp_store = MEMORY');
this.db.pragma('mmap_size = 268435456'); // 256MB mmap
```

---

### NFR-002: Pagination Support

**Category:** Performance
**Priority:** High

**Description:**
All list endpoints and UI components must support pagination to limit data transfer and rendering overhead.

**Rationale:**
Loading all records at once causes memory pressure, slow rendering, and poor network performance. Pagination enables efficient data loading.

**Current Implementation:**
- QueryBuilder class with `limit()`, `offset()`, and `paginate()` methods
- PaginatedResult type with metadata (page, pageSize, totalItems, totalPages, hasNext, hasPrev)
- API utilities with configurable limits (`DEFAULT_LIMIT = 20`, `MAX_LIMIT = 100`)
- UI Pagination component with accessible navigation controls

**Metrics/Thresholds:**
| Metric | Value |
|--------|-------|
| Default page size | 20 items |
| Maximum page size | 100 items |
| Minimum page size | 1 item |

**Implementation Evidence:**
```typescript
// From src/lib/api/utils.ts
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// From src/lib/db/queries.ts
paginate(options: PaginationOptions): this {
  const { page, pageSize } = options;
  this.limitValue = pageSize;
  this.offsetValue = (page - 1) * pageSize;
  return this;
}
```

---

### NFR-003: Full-Text Search Performance

**Category:** Performance
**Priority:** High

**Description:**
Full-text search must provide fast, relevant results with highlighting support across all catalog entities.

**Rationale:**
Search is a core feature; users need to quickly find processes, agents, and skills by content, not just exact names.

**Current Implementation:**
- SQLite FTS5 virtual tables for agents, skills, and processes
- Unified `catalog_search` FTS5 table for cross-entity search
- Porter stemming tokenizer (`tokenize='porter unicode61'`)
- Database triggers for automatic FTS index synchronization
- Search result snippets with `<mark>` highlighting
- BM25 ranking via FTS5 rank function

**Metrics/Thresholds:**
| Metric | Target |
|--------|--------|
| Search response time | < 200ms |
| Default result limit | 50 items |
| Snippet context | 32 words |

**Implementation Evidence:**
```sql
-- From src/lib/db/schema.ts
CREATE VIRTUAL TABLE IF NOT EXISTS catalog_search USING fts5(
  item_type,
  item_id UNINDEXED,
  name,
  description,
  content,
  tokenize='porter unicode61'
);
```

---

### NFR-004: Incremental Indexing

**Category:** Performance
**Priority:** Medium

**Description:**
The system must support incremental file indexing based on modification times to avoid full re-index overhead.

**Rationale:**
Full re-indexing is time-consuming for large process libraries. Incremental updates provide faster refresh cycles.

**Current Implementation:**
- `file_tracking` table storing file paths, modification times (mtime), and hashes
- `file_mtime` columns on entity tables for change detection
- Index metadata tracking (`last_full_index`, `last_incremental_index`, `index_duration_ms`)
- CLI scripts for force reindex (`--force`) and reset (`--reset`)

**Metrics/Thresholds:**
| Metric | Target |
|--------|--------|
| Incremental index time | < 5 seconds for 100 changed files |
| Full index time | < 60 seconds for 1000 files |

---

### NFR-005: Database Connection Pooling

**Category:** Performance
**Priority:** Medium

**Description:**
The database client must implement connection reuse via singleton pattern to avoid connection overhead.

**Rationale:**
Creating new database connections is expensive. Connection reuse improves performance under concurrent load.

**Current Implementation:**
- `CatalogDatabase` class implementing singleton pattern
- Static `instance` property for connection reuse
- WAL mode enabled for better concurrent access
- Proper connection lifecycle management (close, reset)

**Implementation Evidence:**
```typescript
// From src/lib/db/client.ts
export class CatalogDatabase {
  private static instance: CatalogDatabase | null = null;

  public static getInstance(options?: Partial<DatabaseClientOptions>): CatalogDatabase {
    if (!CatalogDatabase.instance) {
      CatalogDatabase.instance = new CatalogDatabase({...});
    }
    return CatalogDatabase.instance;
  }
}
```

---

### NFR-006: Build Optimization

**Category:** Performance
**Priority:** Medium

**Description:**
The application must use Next.js optimizations for fast development and production builds.

**Rationale:**
Fast builds improve developer productivity and CI/CD pipeline efficiency.

**Current Implementation:**
- Turbopack enabled for development (`next dev --turbopack`)
- Standalone output mode for optimized production builds
- TypeScript incremental compilation enabled
- External packages configuration for native modules

**Implementation Evidence:**
```typescript
// From next.config.ts
const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  serverExternalPackages: ["better-sqlite3"],
};
```

---

## Security Requirements

### NFR-007: Input Validation

**Category:** Security
**Priority:** High

**Description:**
All user inputs must be validated and sanitized before processing or database operations.

**Rationale:**
Input validation prevents injection attacks and ensures data integrity.

**Current Implementation:**
- Parameterized queries via prepared statements (SQLite injection prevention)
- Query parameter validation in API routes
- Type validation using TypeScript strict mode
- Validation utilities (`validateSlug`, `validateId`, `requireQueryParam`)

**Implementation Evidence:**
```typescript
// From src/lib/api/utils.ts
export function validateId(id: string | undefined):
  { valid: true; id: number } | { valid: false; error: NextResponse } {
  if (!id) {
    return { valid: false, error: badRequestResponse('Invalid or missing ID parameter') };
  }
  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId < 1) {
    return { valid: false, error: badRequestResponse('ID must be a positive integer') };
  }
  return { valid: true, id: numId };
}
```

---

### NFR-008: Safe JSON Parsing

**Category:** Security
**Priority:** Medium

**Description:**
JSON parsing operations must handle malformed input gracefully without exposing stack traces.

**Rationale:**
Defensive parsing prevents crashes and potential information disclosure.

**Current Implementation:**
- `safeJsonParse` utility function with default value fallback
- Try-catch blocks around JSON operations
- Error responses that don't expose internal details in production

**Implementation Evidence:**
```typescript
// From src/lib/api/utils.ts
export function safeJsonParse<T>(value: string | null | undefined, defaultValue: T): T {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
}
```

---

### NFR-009: External Image Domain Whitelist

**Category:** Security
**Priority:** Medium

**Description:**
Only images from whitelisted domains may be loaded through Next.js Image optimization.

**Rationale:**
Restricting image sources prevents SSRF attacks and content injection.

**Current Implementation:**
- `remotePatterns` configuration in next.config.ts
- Only GitHub-related domains whitelisted (github.com, avatars.githubusercontent.com)

**Implementation Evidence:**
```typescript
// From next.config.ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "github.com" },
    { protocol: "https", hostname: "avatars.githubusercontent.com" },
  ],
},
```

---

### NFR-010: Error Information Disclosure Prevention

**Category:** Security
**Priority:** High

**Description:**
Error responses must not expose sensitive internal details (stack traces, file paths, database errors) in production.

**Rationale:**
Information disclosure aids attackers in understanding system internals and finding vulnerabilities.

**Current Implementation:**
- Generic error messages in API responses
- Stack traces only visible in development mode (`NODE_ENV === "development"`)
- Structured error response format with codes (NOT_FOUND, BAD_REQUEST, INTERNAL_ERROR)
- Console error logging for debugging without client exposure

**Implementation Evidence:**
```typescript
// From src/components/ErrorBoundary.tsx
const isDev = process.env.NODE_ENV === "development";
// Stack trace only shown when isDev is true

// From src/lib/api/utils.ts
export function internalErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  console.error('Internal server error:', error);  // Log internally
  return createErrorResponse('INTERNAL_ERROR', message, 500);  // Generic to client
}
```

---

## Scalability Requirements

### NFR-011: Horizontal Scaling Support

**Category:** Scalability
**Priority:** Medium

**Description:**
The application architecture must support standalone deployment for containerized horizontal scaling.

**Rationale:**
Standalone mode reduces image size and enables efficient container orchestration.

**Current Implementation:**
- Next.js standalone output mode configured
- Stateless API design (database is the single source of truth)
- No in-memory session state

**Implementation Evidence:**
```typescript
// From next.config.ts
output: "standalone",
```

---

### NFR-012: Database Write-Ahead Logging (WAL)

**Category:** Scalability
**Priority:** High

**Description:**
The database must use WAL mode for improved concurrent read/write performance.

**Rationale:**
WAL mode allows readers and writers to proceed concurrently, improving scalability under load.

**Current Implementation:**
- WAL mode enabled by default in database client
- Checkpoint operation available for manual WAL truncation
- Synchronous mode set to NORMAL for balance of safety and performance

**Implementation Evidence:**
```typescript
// From src/lib/db/client.ts
if (options.walMode !== false) {
  this.db.pragma('journal_mode = WAL');
}
this.db.pragma('synchronous = NORMAL');
```

---

### NFR-013: Query Result Limits

**Category:** Scalability
**Priority:** High

**Description:**
All list queries must enforce maximum result limits to prevent resource exhaustion.

**Rationale:**
Unbounded queries can exhaust memory and database resources under malicious or accidental misuse.

**Current Implementation:**
- `MAX_LIMIT = 100` enforced in API layer
- Search results capped at configurable limit (default 50)
- Pagination required for large result sets

**Implementation Evidence:**
```typescript
// From src/lib/api/utils.ts
export const MAX_LIMIT = 100;

return {
  limit: Math.min(Math.max(1, limit), MAX_LIMIT),  // Clamp to valid range
  offset: Math.max(0, offset),
  // ...
};
```

---

## Usability Requirements

### NFR-014: Accessible Navigation

**Category:** Usability / Accessibility
**Priority:** High

**Description:**
Navigation components must be accessible to users with disabilities, following WCAG guidelines.

**Rationale:**
Accessibility is both a legal requirement in many jurisdictions and ensures inclusive user experience.

**Current Implementation:**
- ARIA labels on navigation elements (`aria-label="Breadcrumb"`, `aria-label="Pagination"`)
- Screen reader text (`sr-only` class for visually hidden labels)
- `aria-current="page"` for current page indication
- `aria-hidden="true"` for decorative elements (separators)
- Keyboard-accessible interactive elements
- Focus ring styles for keyboard navigation visibility

**Implementation Evidence:**
```tsx
// From src/components/layout/Breadcrumb.tsx
<nav aria-label="Breadcrumb" className={...}>
  <span className="sr-only">{item.label}</span>
  <Link aria-current={isLast ? "page" : undefined} ... >

// From src/components/common/Pagination.tsx
<nav role="navigation" aria-label="Pagination">
  <Button aria-label="Go to previous page" ... >
  <Button aria-label="Go to page ${page}" aria-current={isActive ? "page" : undefined} ... >
```

---

### NFR-015: Loading State Indicators

**Category:** Usability
**Priority:** High

**Description:**
All asynchronous operations must display appropriate loading indicators to provide user feedback.

**Rationale:**
Loading indicators prevent user confusion and perceived unresponsiveness during data fetching.

**Current Implementation:**
- Skeleton loading components for different content types (Card, List, Detail, Table)
- Next.js `loading.tsx` files for route-level loading states
- Suspense boundaries with fallback content
- CSS animations for visual loading feedback (`animate-pulse`)
- Loading state in custom hooks (`isLoading` property)

**Implementation Evidence:**
```tsx
// From src/components/common/LoadingSkeleton.tsx
function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-md bg-[var(--color-neutral-muted)]", className)} />
  );
}

// From src/app/processes/loading.tsx
export default function ProcessesLoading() {
  return (
    <PageContainer>
      <Skeleton className="h-6 w-48" />
      {/* ... more skeletons ... */}
    </PageContainer>
  );
}
```

---

### NFR-016: Responsive Design

**Category:** Usability
**Priority:** High

**Description:**
The application must be fully functional and visually appropriate across device sizes from mobile to desktop.

**Rationale:**
Users access the catalog from various devices; responsive design ensures consistent experience.

**Current Implementation:**
- Tailwind CSS responsive breakpoints (sm, md, lg, xl)
- Mobile-first design approach
- Collapsible sidebar for mobile with overlay
- Grid layouts that adapt to screen size
- Touch-friendly button sizes on mobile

**Implementation Evidence:**
```tsx
// From src/components/layout/Sidebar.tsx
<aside className={cn(
  "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 transform ... transition-transform duration-200",
  "lg:static lg:translate-x-0",  // Static on large screens
  isCollapsed ? "-translate-x-full" : "translate-x-0"  // Slide on mobile
)}>

// From src/app/processes/loading.tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
```

---

### NFR-017: Debounced Search Input

**Category:** Usability
**Priority:** Medium

**Description:**
Search inputs must debounce user input to reduce unnecessary API calls during typing.

**Rationale:**
Debouncing improves performance and reduces server load while still providing responsive search.

**Current Implementation:**
- `useDebouncedSearch` hook with configurable delay (default 300ms)
- Debounce implemented via setTimeout with cleanup

**Metrics/Thresholds:**
| Metric | Value |
|--------|-------|
| Default debounce delay | 300ms |

**Implementation Evidence:**
```typescript
// From src/lib/hooks/useApi.ts
export function useDebouncedSearch(params: SearchParams, delay: number = 300, ...) {
  const [debouncedQuery, setDebouncedQuery] = React.useState(params.query);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(params.query);
    }, delay);
    return () => clearTimeout(timer);
  }, [params.query, delay]);

  return useSearch({ ...params, query: debouncedQuery }, options);
}
```

---

## Reliability Requirements

### NFR-018: Error Boundary Implementation

**Category:** Reliability
**Priority:** High

**Description:**
React component trees must be wrapped in error boundaries to prevent full application crashes.

**Rationale:**
Error boundaries contain failures to specific components, improving overall application stability.

**Current Implementation:**
- `ErrorBoundary` class component with `getDerivedStateFromError` and `componentDidCatch`
- `ErrorFallback` component for user-friendly error display
- `PageErrorBoundary` for page-level error containment
- `SuspenseErrorBoundary` combining Suspense and error handling
- `AsyncBoundary` for async data loading states
- Retry functionality via component reset
- Custom error handler callbacks for logging/monitoring integration

**Implementation Evidence:**
```tsx
// From src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }
}
```

---

### NFR-019: Database Transaction Support

**Category:** Reliability
**Priority:** High

**Description:**
Multi-step database operations must be wrapped in transactions to ensure atomicity.

**Rationale:**
Transactions prevent partial updates and maintain data consistency on errors.

**Current Implementation:**
- `transaction` method on CatalogDatabase class
- better-sqlite3 transaction wrapper
- Atomic batch operations for indexing

**Implementation Evidence:**
```typescript
// From src/lib/db/client.ts
public transaction<T>(fn: () => T): T {
  return this.db.transaction(fn)();
}
```

---

### NFR-020: Graceful Degradation

**Category:** Reliability
**Priority:** Medium

**Description:**
The application must handle missing or corrupted data gracefully without crashing.

**Rationale:**
Real-world data is imperfect; graceful handling improves user experience.

**Current Implementation:**
- Default values for missing JSON fields (`DEFAULT '{}'`, `DEFAULT '[]'`)
- Null-safe field access with optional chaining
- Foreign key SET NULL on delete for referential integrity
- Safe JSON parsing with fallback values
- Not found responses for missing entities (404 status)

**Implementation Evidence:**
```sql
-- From src/lib/db/schema.ts
FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL

-- Default empty arrays/objects
expertise TEXT NOT NULL DEFAULT '[]',
frontmatter TEXT NOT NULL DEFAULT '{}',
```

---

### NFR-021: Idempotent Initialization

**Category:** Reliability
**Priority:** Medium

**Description:**
Database and application initialization must be idempotent, safe to call multiple times.

**Rationale:**
Idempotent initialization prevents duplicate schema creation and data corruption.

**Current Implementation:**
- `IF NOT EXISTS` clauses on all CREATE TABLE/INDEX statements
- Initialization state tracking (`isInitialized` flag)
- Promise deduplication for concurrent init calls (`initPromise`)
- Schema version tracking for migration safety

**Implementation Evidence:**
```typescript
// From src/lib/db/init.ts
export async function ensureDatabaseInitialized(options: InitOptions = {}): Promise<InitResult> {
  if (initPromise) {
    return initPromise;  // Return existing promise if init in progress
  }
  if (isInitialized && !options.force) {
    // Return cached result
  }
  initPromise = performInitialization(options);
  // ...
}
```

---

### NFR-022: Schema Migration Support

**Category:** Reliability
**Priority:** Medium

**Description:**
The database schema must support versioned migrations for safe updates.

**Rationale:**
Schema migrations enable controlled database evolution without data loss.

**Current Implementation:**
- `schema_version` table tracking current version
- `needsMigration` function checking version compatibility
- `runMigrations` function for applying updates
- Defined `SCHEMA_VERSION` constant for expected version

**Implementation Evidence:**
```typescript
// From src/lib/db/schema.ts
export const SCHEMA_VERSION = 1;

export function needsMigration(db: Database.Database): boolean {
  const currentVersion = getSchemaVersion(db);
  return currentVersion < SCHEMA_VERSION;
}

export function runMigrations(db: Database.Database): void {
  const currentVersion = getSchemaVersion(db);
  if (currentVersion < 1) {
    initializeSchema(db);
    return;
  }
  // Add future migrations here as needed
}
```

---

## Maintainability Requirements

### NFR-023: Strict TypeScript Configuration

**Category:** Maintainability
**Priority:** High

**Description:**
The project must use strict TypeScript settings to catch type errors at compile time.

**Rationale:**
Strict typing reduces runtime errors, improves code documentation, and enables better IDE support.

**Current Implementation:**
- `strict: true` enabling all strict checks
- Individual strict flags enabled: `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`
- `noImplicitAny`, `noImplicitReturns`, `noImplicitThis`
- `noUnusedLocals`, `noUnusedParameters`
- `noUncheckedIndexedAccess` for safe array/object access

**Implementation Evidence:**
```json
// From tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true
  }
}
```

---

### NFR-024: Code Formatting Standards

**Category:** Maintainability
**Priority:** Medium

**Description:**
All code must adhere to consistent formatting standards enforced by automated tools.

**Rationale:**
Consistent formatting reduces cognitive load and merge conflicts.

**Current Implementation:**
- Prettier configuration with Tailwind CSS plugin
- ESLint with Next.js recommended rules
- Format check scripts (`format:check`, `format`)
- Consistent settings: 2-space tabs, semicolons, double quotes, ES5 trailing commas

**Implementation Evidence:**
```json
// From .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

### NFR-025: Modular Code Organization

**Category:** Maintainability
**Priority:** High

**Description:**
Code must be organized in a modular, layered structure with clear separation of concerns.

**Rationale:**
Modular organization improves code discoverability, testability, and reusability.

**Current Implementation:**
- Directory structure by feature/layer:
  - `src/app/` - Next.js pages and API routes
  - `src/components/` - React components organized by category (common, catalog, dashboard, layout, markdown, ui)
  - `src/lib/` - Core libraries (api, db, hooks, parsers, utils)
  - `src/types/` - TypeScript type definitions
- Barrel exports via `index.ts` files
- Path aliases (`@/*` mapping to `./src/*`)

**Implementation Evidence:**
```typescript
// From src/lib/db/index.ts - Barrel export example
export type { DomainRow, SpecializationRow, AgentRow, ... } from './types';
export { initializeSchema, getSchemaVersion, ... } from './schema';
export { CatalogDatabase, getDatabase, initializeDatabase, ... } from './client';
export { CatalogIndexer, runFullIndex, ... } from './indexer';
```

---

### NFR-026: Documentation Standards

**Category:** Maintainability
**Priority:** Medium

**Description:**
Code must include JSDoc comments for public APIs and complex logic.

**Rationale:**
Documentation improves code understanding and enables IDE tooltips.

**Current Implementation:**
- Module-level documentation headers
- JSDoc comments on exported functions and classes
- Type definitions with descriptive property names
- Section separators for visual organization (`// ===...===`)

**Implementation Evidence:**
```typescript
// From src/lib/db/index.ts
/**
 * Process Library Catalog Database
 *
 * SQLite-based storage and search for the process library catalog.
 * Features:
 * - Full-text search using FTS5
 * - Incremental indexing based on file modification times
 * - Query builder with filter, sort, and pagination support
 * - Relationship tracking between domains, specializations, agents, and skills
 *
 * @module db
 */
```

---

### NFR-027: Centralized Type Definitions

**Category:** Maintainability
**Priority:** Medium

**Description:**
Type definitions must be centralized and exported from dedicated type modules.

**Rationale:**
Centralized types prevent duplication and ensure consistency across the codebase.

**Current Implementation:**
- `src/types/index.ts` for application-level types
- `src/lib/db/types.ts` for database-specific types
- `src/lib/api/types.ts` for API-specific types
- Re-exports from barrel files for convenient imports

---

## Compatibility Requirements

### NFR-028: Node.js Version Compatibility

**Category:** Compatibility
**Priority:** High

**Description:**
The application must be compatible with Node.js LTS versions and support TypeScript ES2017 target.

**Rationale:**
LTS compatibility ensures production environment support and security updates.

**Current Implementation:**
- TypeScript target: ES2017
- Node types version: ^20
- better-sqlite3 compatibility with Node 20+
- ES module support via bundler module resolution

**Implementation Evidence:**
```json
// From tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}

// From package.json
"@types/node": "^20"
```

---

### NFR-029: Browser Compatibility

**Category:** Compatibility
**Priority:** High

**Description:**
The client-side application must support modern browsers (evergreen browsers).

**Rationale:**
Supporting modern browsers enables use of latest web platform features while covering majority of users.

**Current Implementation:**
- React 19 with modern JSX transform
- Tailwind CSS 4 with modern CSS features
- Next.js App Router with React Server Components
- Radix UI components for cross-browser accessible primitives

**Supported Browsers:**
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

---

### NFR-030: React Strict Mode

**Category:** Compatibility
**Priority:** Medium

**Description:**
The application must run correctly under React Strict Mode for future compatibility.

**Rationale:**
Strict Mode identifies potential problems and deprecated patterns for React 19+ compatibility.

**Current Implementation:**
- `reactStrictMode: true` in next.config.ts
- Components written to handle double-invocation in development
- UseEffect cleanup functions properly implemented

**Implementation Evidence:**
```typescript
// From next.config.ts
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // ...
};
```

---

### NFR-031: Typed Routes

**Category:** Compatibility
**Priority:** Low

**Description:**
The application uses Next.js typed routes for compile-time route validation.

**Rationale:**
Typed routes prevent broken links and improve refactoring safety.

**Current Implementation:**
- `typedRoutes: true` in next.config.ts
- Route type from "next" used in Link components
- Build-time type checking for route strings

**Implementation Evidence:**
```typescript
// From next.config.ts
typedRoutes: true,

// From src/components/layout/Sidebar.tsx
import type { Route } from "next";
<Link href={item.href as Route} ... >
```

---

## Requirements Traceability Matrix

| Req ID | Category | Title | Priority | Status |
|--------|----------|-------|----------|--------|
| NFR-001 | Performance | Database Query Response Time | High | Implemented |
| NFR-002 | Performance | Pagination Support | High | Implemented |
| NFR-003 | Performance | Full-Text Search Performance | High | Implemented |
| NFR-004 | Performance | Incremental Indexing | Medium | Implemented |
| NFR-005 | Performance | Database Connection Pooling | Medium | Implemented |
| NFR-006 | Performance | Build Optimization | Medium | Implemented |
| NFR-007 | Security | Input Validation | High | Implemented |
| NFR-008 | Security | Safe JSON Parsing | Medium | Implemented |
| NFR-009 | Security | External Image Domain Whitelist | Medium | Implemented |
| NFR-010 | Security | Error Information Disclosure Prevention | High | Implemented |
| NFR-011 | Scalability | Horizontal Scaling Support | Medium | Implemented |
| NFR-012 | Scalability | Database Write-Ahead Logging | High | Implemented |
| NFR-013 | Scalability | Query Result Limits | High | Implemented |
| NFR-014 | Usability | Accessible Navigation | High | Implemented |
| NFR-015 | Usability | Loading State Indicators | High | Implemented |
| NFR-016 | Usability | Responsive Design | High | Implemented |
| NFR-017 | Usability | Debounced Search Input | Medium | Implemented |
| NFR-018 | Reliability | Error Boundary Implementation | High | Implemented |
| NFR-019 | Reliability | Database Transaction Support | High | Implemented |
| NFR-020 | Reliability | Graceful Degradation | Medium | Implemented |
| NFR-021 | Reliability | Idempotent Initialization | Medium | Implemented |
| NFR-022 | Reliability | Schema Migration Support | Medium | Implemented |
| NFR-023 | Maintainability | Strict TypeScript Configuration | High | Implemented |
| NFR-024 | Maintainability | Code Formatting Standards | Medium | Implemented |
| NFR-025 | Maintainability | Modular Code Organization | High | Implemented |
| NFR-026 | Maintainability | Documentation Standards | Medium | Implemented |
| NFR-027 | Maintainability | Centralized Type Definitions | Medium | Implemented |
| NFR-028 | Compatibility | Node.js Version Compatibility | High | Implemented |
| NFR-029 | Compatibility | Browser Compatibility | High | Implemented |
| NFR-030 | Compatibility | React Strict Mode | Medium | Implemented |
| NFR-031 | Compatibility | Typed Routes | Low | Implemented |

---

## Summary Statistics

| Category | Count | High Priority | Medium Priority | Low Priority |
|----------|-------|---------------|-----------------|--------------|
| Performance | 6 | 3 | 3 | 0 |
| Security | 4 | 2 | 2 | 0 |
| Scalability | 3 | 2 | 1 | 0 |
| Usability | 4 | 3 | 1 | 0 |
| Reliability | 5 | 2 | 3 | 0 |
| Maintainability | 5 | 2 | 3 | 0 |
| Compatibility | 4 | 2 | 1 | 1 |
| **Total** | **31** | **16** | **14** | **1** |

---

*Document generated based on analysis of the Process Library Catalog codebase.*
