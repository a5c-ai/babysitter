# Architecture Review Report

## Executive Summary

This document provides a comprehensive architectural analysis of the Process Library Catalog application (`packages/catalog`). The application is a Next.js 16 application with SQLite-backed data storage, designed to catalog and browse agents, skills, processes, and domains from a process library.

**Architecture Health Score: 6.5/10** - The application demonstrates a solid foundational architecture with clear separation of concerns, but suffers from layer boundary violations, inconsistent abstraction levels, and missed opportunities for better modularity.

**Key Findings:**
- 23 architectural improvements identified
- 5 critical architecture issues
- Good foundation for component organization
- Significant opportunities for better abstraction and code reuse

---

## Table of Contents

1. [Current Architecture Overview](#1-current-architecture-overview)
2. [Layer Analysis](#2-layer-analysis)
3. [Critical Architecture Issues](#3-critical-architecture-issues)
4. [Separation of Concerns](#4-separation-of-concerns)
5. [State Management](#5-state-management)
6. [Abstraction Layers](#6-abstraction-layers)
7. [Component Architecture](#7-component-architecture)
8. [API Design](#8-api-design)
9. [File Organization](#9-file-organization)
10. [Code Reuse Opportunities](#10-code-reuse-opportunities)
11. [Patterns and Anti-Patterns](#11-patterns-and-anti-patterns)
12. [Recommendations](#12-recommendations)

---

## 1. Current Architecture Overview

### 1.1 High-Level Architecture

```
+-------------------------------------------------------------------+
|                         PRESENTATION LAYER                         |
|  +---------------+  +---------------+  +----------------------+    |
|  | Next.js Pages |  | React        |  | Dashboard           |    |
|  | (App Router)  |  | Components   |  | Components          |    |
|  +---------------+  +---------------+  +----------------------+    |
+-------------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------------+
|                         DATA ACCESS LAYER                          |
|  +---------------+  +---------------+  +----------------------+    |
|  | API Routes    |  | React Hooks  |  | API Utilities       |    |
|  | (/api/*)      |  | (useApi)     |  | (utils.ts)          |    |
|  +---------------+  +---------------+  +----------------------+    |
+-------------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------------+
|                         SERVICE/DOMAIN LAYER                       |
|  +---------------+  +---------------+  +----------------------+    |
|  | CatalogQueries|  | QueryBuilder |  | Parser Services     |    |
|  +---------------+  +---------------+  +----------------------+    |
+-------------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------------+
|                         DATA LAYER                                 |
|  +---------------+  +---------------+  +----------------------+    |
|  | CatalogDB     |  | Schema/      |  | Indexer             |    |
|  | (Singleton)   |  | Migrations   |  |                     |    |
|  +---------------+  +---------------+  +----------------------+    |
+-------------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------------+
|                         EXTERNAL DATA                              |
|  +---------------+  +---------------+                              |
|  | SQLite DB     |  | File System  |                              |
|  | (catalog.db)  |  | (AGENT.md,   |                              |
|  |               |  |  SKILL.md)   |                              |
|  +---------------+  +---------------+                              |
+-------------------------------------------------------------------+
```

### 1.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16.1.4 |
| Runtime | React | 19.2.3 |
| Database | better-sqlite3 | 11.0.0 |
| Styling | Tailwind CSS | 4.x |
| UI Components | Radix UI | Various |
| Charts | Recharts | 2.12.0 |
| Markdown | react-markdown + remark-gfm | 9.0.1 |

### 1.3 Directory Structure

```
packages/catalog/
  src/
    app/                    # Next.js App Router pages
      api/                  # API routes (13 routes)
      agents/              # Agent pages
      skills/              # Skill pages
      processes/           # Process pages
      domains/             # Domain pages
      specializations/     # Specialization pages
      search/              # Search page
    components/            # React components
      catalog/             # Catalog-specific components
      common/              # Shared UI components
      dashboard/           # Dashboard visualizations
      decorations/         # Visual decorations
      layout/              # Layout components
      markdown/            # Markdown rendering
      ui/                  # Base UI components (shadcn)
    lib/                   # Library code
      api/                 # API utilities and types
      db/                  # Database layer
      hooks/               # React hooks
      parsers/             # File parsing logic
    types/                 # Type definitions (legacy)
    hooks/                 # Re-export hooks (redundant)
  scripts/                 # CLI scripts
  data/                    # Database storage
```

---

## 2. Layer Analysis

### 2.1 Presentation Layer

**Components:** ~67 files
**Responsibilities:** UI rendering, user interaction, data display

**Strengths:**
- Well-organized component hierarchy
- Separation of catalog, common, and layout components
- Use of shadcn/ui for consistent base components

**Weaknesses:**
- Some pages contain business logic (data fetching, transformation)
- Inconsistent use of client vs. server components
- No clear container/presentational component pattern

### 2.2 Data Access Layer

**Components:** 13 API routes, 1 custom hook file
**Responsibilities:** HTTP request handling, response formatting, data validation

**Strengths:**
- Consistent response format with `ApiResponse<T>`
- Utility functions for common patterns
- Type-safe parameter parsing

**Weaknesses:**
- API routes directly import database layer (layer bypass)
- Duplicate query-building logic across routes
- No service layer abstraction

### 2.3 Domain/Service Layer

**Components:** `CatalogQueries`, `QueryBuilder`, Parsers
**Responsibilities:** Business logic, data transformation, domain rules

**Strengths:**
- `QueryBuilder` provides fluent API for queries
- Parsers handle complex file format parsing
- Type-safe result wrappers (`ParseResult<T>`)

**Weaknesses:**
- `CatalogQueries` mixes query execution with data transformation
- No clear domain model separate from database schema
- Parsers tightly coupled to file system

### 2.4 Data Layer

**Components:** `CatalogDatabase`, Schema, Indexer
**Responsibilities:** Database access, schema management, data persistence

**Strengths:**
- Singleton pattern prevents multiple connections
- FTS5 for efficient full-text search
- Incremental indexing support

**Weaknesses:**
- No connection pooling
- No cleanup on process exit
- Tight coupling between indexer and parsers

---

## 3. Critical Architecture Issues

### 3.1 Layer Boundary Violations

**Severity: Critical**

API routes bypass the service layer and directly manipulate the database:

```typescript
// src/app/api/agents/route.ts - Lines 38-118
export async function GET(request: NextRequest) {
  // API route directly builds SQL queries
  const db = initializeDatabase();
  const rawDb = db.getDb();

  let sql = `SELECT ... FROM agents a LEFT JOIN ...`;
  // ... manual SQL construction
  const rows = rawDb.prepare(sql).all(...params);
}
```

**Impact:**
- Business logic spread across layers
- Difficult to test API routes in isolation
- Changes to database schema require API route changes

**Recommended Architecture:**

```typescript
// src/lib/services/agentService.ts
export class AgentService {
  constructor(private queries: CatalogQueries) {}

  async listAgents(params: AgentQueryParams): Promise<PaginatedResult<Agent>> {
    // Business logic here
  }
}

// src/app/api/agents/route.ts
export async function GET(request: NextRequest) {
  const service = getAgentService();
  const result = await service.listAgents(parseParams(request));
  return createResponse(result);
}
```

### 3.2 Missing Domain Model

**Severity: Critical**

The application lacks a clear domain model. Types are defined in multiple places:
- `src/types/index.ts` - Generic catalog types
- `src/lib/db/types.ts` - Database row types
- `src/lib/api/types.ts` - API response types
- `src/lib/parsers/types.ts` - Parser output types

This leads to:
- Type confusion and potential mismatches
- Manual mapping between representations
- No single source of truth for domain concepts

**Recommended Architecture:**

```
src/
  domain/
    agent/
      Agent.ts        # Domain entity
      AgentService.ts # Domain operations
      agentTypes.ts   # Domain-specific types
    skill/
      ...
    shared/
      types.ts        # Shared domain types
```

### 3.3 Improper Singleton Usage

**Severity: Critical**

The `CatalogDatabase` singleton pattern has issues:

```typescript
// src/lib/db/client.ts
export class CatalogDatabase {
  private static instance: CatalogDatabase | null = null;

  // No process exit handler
  // No connection health check
  // No automatic reconnection
}
```

**Impact:**
- Memory leaks in long-running processes
- No graceful shutdown handling
- Testing difficulties (singleton state persists)

**Recommended Architecture:**

```typescript
// Use dependency injection instead of singleton
interface DatabaseProvider {
  getDatabase(): CatalogDatabase;
  close(): Promise<void>;
}

// Production implementation with lifecycle management
class ProductionDatabaseProvider implements DatabaseProvider {
  private db: CatalogDatabase | null = null;

  constructor() {
    process.on('SIGTERM', () => this.close());
    process.on('SIGINT', () => this.close());
  }

  async close(): Promise<void> {
    await this.db?.close();
    this.db = null;
  }
}
```

### 3.4 Mixed Responsibilities in Components

**Severity: High**

Page components mix data fetching, state management, and presentation:

```typescript
// src/app/agents/page.tsx - AgentsContent component
function AgentsContent() {
  // State management (7 useState calls)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null);
  // ... 5 more state variables

  // Data fetching logic
  const fetchReferenceData = async () => {
    const agentsRes = await fetch("/api/agents?limit=1000");
    // ... data transformation
  };

  // URL synchronization
  useEffect(() => {
  const params = new URLSearchParams();
    // ... URL building
  }, [searchQuery, selectedDomain, ...]);

  // JSX rendering (~100 lines)
}
```

**Recommended Architecture:**

```typescript
// Custom hooks for each concern
function useAgentFilters() { /* filter state */ }
function useUrlSync(filters) { /* URL sync */ }
function useAgentData(filters) { /* data fetching */ }

// Clean component
function AgentsContent() {
  const filters = useAgentFilters();
  useUrlSync(filters);
  const { data, isLoading } = useAgentData(filters);

  return <AgentsView data={data} filters={filters} />;
}
```

### 3.5 Inconsistent Error Handling Architecture

**Severity: High**

No unified error handling strategy:

```typescript
// API routes - generic catch
} catch (error) {
  return internalErrorResponse(error);
}

// Parsers - structured errors
return {
  success: false,
  error: { code: 'PARSE_ERROR', message: '...' }
};

// React hooks - silent failures
} catch {
  // Pagination extraction failed silently
}
```

**Recommended Architecture:**

```typescript
// src/lib/errors/index.ts
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
}

// Error boundary component
// API error handler middleware
// Logging service integration
```

---

## 4. Separation of Concerns

### 4.1 Current State Analysis

| Concern | Location | Evaluation |
|---------|----------|------------|
| Routing | `app/` | Good - follows Next.js conventions |
| UI Components | `components/` | Good - well organized |
| API Handling | `app/api/` | Poor - contains business logic |
| Data Access | `lib/db/` | Fair - some mixing with business logic |
| Parsing | `lib/parsers/` | Good - clear responsibility |
| State Management | `lib/hooks/` | Poor - mixed with data fetching |
| Configuration | Scattered | Poor - no centralized config |

### 4.2 Violations Identified

1. **API Routes with Business Logic**
   - SQL query construction in routes
   - Data transformation in routes
   - Validation logic in routes

2. **Components with Data Fetching**
   - Direct `fetch()` calls in page components
   - Server-side data fetching mixed with client state

3. **Database Layer with Presentation Concerns**
   - `CatalogQueries.getCatalogEntries()` handles pagination UI logic
   - JSON parsing with display-specific transformations

4. **Missing Configuration Layer**
   - Database paths hardcoded
   - API limits scattered as magic numbers
   - No environment-based configuration

### 4.3 Recommended Separation

```
Concern                 Recommended Location
---------               --------------------
Routing                 app/ (current)
UI Components           components/ (current)
Business Logic          lib/services/ (NEW)
Data Access             lib/repositories/ (NEW)
Domain Models           domain/ (NEW)
Configuration           config/ (NEW)
Error Handling          lib/errors/ (NEW)
Utilities               lib/utils/ (current)
```

---

## 5. State Management

### 5.1 Current Patterns

The application uses multiple state management approaches:

1. **Server Component Data Fetching**
   ```typescript
   // Dashboard page
   async function getAnalytics(): Promise<AnalyticsResponse | null> {
     const res = await fetch(`${baseUrl}/api/analytics`, { cache: "no-store" });
     return json.data;
   }
   ```

2. **Custom Hooks (useApi.ts)**
   ```typescript
   export function useQuery<T>(endpoint: string, options = {}): UseQueryResult<T> {
     const [data, setData] = useState<T | undefined>();
     const [error, setError] = useState<Error | null>(null);
     const [isLoading, setIsLoading] = useState(enabled);
     // ...
   }
   ```

3. **Local Component State**
   ```typescript
   const [searchQuery, setSearchQuery] = useState("");
   const [currentPage, setCurrentPage] = useState(1);
   // ... many more
   ```

### 5.2 State Management Issues

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| No global state management | Data refetching between pages | Consider Zustand or React Context |
| URL state not synchronized | Back button issues | Use URL state as source of truth |
| No caching strategy | Unnecessary API calls | Implement SWR or React Query patterns |
| Prop drilling in some components | Maintenance burden | Use Context for deep trees |

### 5.3 Recommended State Architecture

```typescript
// Global app state (minimal)
interface AppState {
  isInitialized: boolean;
  user: User | null;
  theme: 'light' | 'dark';
}

// Feature-specific contexts
interface CatalogFilterContext {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

// URL as state for search/filter pages
// Server state for data (with caching)
// Local state for UI-only concerns
```

---

## 6. Abstraction Layers

### 6.1 Missing Abstractions

#### 6.1.1 Repository Pattern

No repository abstraction between queries and database:

```typescript
// Current: Direct SQL in CatalogQueries
class CatalogQueries {
  getAgents(options?: QueryOptions): AgentRow[] | PaginatedResult<AgentRow> {
    const builder = new QueryBuilder<AgentRow>(this.db.getDb(), 'agents');
    // SQL construction here
  }
}

// Recommended: Repository abstraction
interface AgentRepository {
  findAll(options: QueryOptions): Promise<Agent[]>;
  findById(id: number): Promise<Agent | null>;
  findBySpecialization(specId: number): Promise<Agent[]>;
  search(query: string): Promise<Agent[]>;
}

class SQLiteAgentRepository implements AgentRepository {
  // Implementation details hidden
}
```

#### 6.1.2 Service Layer

No service layer for business operations:

```typescript
// Recommended: Service layer
class AgentService {
  constructor(
    private repository: AgentRepository,
    private validator: AgentValidator
  ) {}

  async getAgentsForCatalog(params: CatalogParams): Promise<CatalogResult> {
    // Business logic here
    // Validation
    // Transformation
    // Caching decisions
  }
}
```

#### 6.1.3 Data Transfer Objects (DTOs)

Direct exposure of database rows to API:

```typescript
// Current: DB types leaked to API
const rows = rawDb.prepare(sql).all(...params) as Array<{
  id: number;
  name: string;
  // ... DB column names
}>;

// Transform manually in every route
const agents: AgentListItem[] = rows.map(row => ({
  id: row.id,
  name: row.name,
  filePath: row.file_path,  // snake_case to camelCase
  // ...
}));
```

**Recommended:** Explicit DTOs and mappers

```typescript
// src/lib/mappers/agentMapper.ts
export function toAgentListItem(row: AgentRow): AgentListItem {
  return {
    id: row.id,
    name: row.name,
    filePath: row.file_path,
    // ...
  };
}
```

### 6.2 Over-Abstractions

Some areas have unnecessary abstraction:

1. **QueryBuilder Complexity**
   - Full ORM-like API but only used for simple queries
   - Consider using raw SQL with type-safe result parsing

2. **Parser Module Structure**
   - Heavy abstraction for single-use parsing
   - Could be simplified with functional composition

---

## 7. Component Architecture

### 7.1 Component Hierarchy

```
components/
  ui/           # Base components (shadcn)
    button.tsx
    card.tsx
    input.tsx
    badge.tsx
    skeleton.tsx
    separator.tsx

  common/       # Shared application components
    EmptyState.tsx
    LoadingSkeleton.tsx
    Pagination.tsx
    SearchInput.tsx
    Tag.tsx

  layout/       # Layout structure
    Breadcrumb.tsx
    Footer.tsx
    Header.tsx
    PageContainer.tsx
    Sidebar.tsx

  catalog/      # Domain-specific components
    EntityCard/
      AgentCard.tsx
      DomainCard.tsx
      ProcessCard.tsx
      SkillCard.tsx
    DetailView/
      AgentDetail.tsx
      ProcessDetail.tsx
      SkillDetail.tsx
    EntityList.tsx
    FilterPanel.tsx
    MetadataDisplay.tsx
    QuickActions.tsx
    RelatedItems.tsx
    SearchBar.tsx
    SortDropdown.tsx
    TreeView.tsx

  dashboard/    # Dashboard visualizations
    BarChart.tsx
    MetricCard.tsx
    PieChart.tsx
    QuickLinks.tsx
    RecentActivity.tsx
    StatsOverview.tsx
    TreemapChart.tsx

  markdown/     # Markdown rendering
    CodeBlock.tsx
    FrontmatterDisplay.tsx
    ImageHandler.tsx
    LinkHandler.tsx
    MarkdownRenderer.tsx
    TableOfContents.tsx

  decorations/  # Visual flourishes
    BotanicalDecor.tsx
    BrassPipeBorder.tsx
    CardCornerFlourish.tsx
    GearCluster.tsx
    MechanicalBee.tsx
```

### 7.2 Component Issues

#### 7.2.1 Duplicate Card Patterns

All entity cards share ~70% structure:

```typescript
// AgentCard.tsx, SkillCard.tsx, ProcessCard.tsx
// All have:
// - Optional onClick handler
// - Link wrapper when no onClick
// - Card layout with header/body/footer
// - Tags/badges section
// - Metadata display
```

**Recommendation:** Create `EntityCardBase` component:

```typescript
interface EntityCardBaseProps {
  href?: string;
  onClick?: () => void;
  header: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
  badges?: Badge[];
}

function EntityCardBase({ href, onClick, ...props }: EntityCardBaseProps) {
  const CardContent = () => (/* shared structure */);

  if (onClick) {
    return <ClickableCard onClick={onClick}><CardContent /></ClickableCard>;
  }
  return <Link href={href}><CardContent /></Link>;
}
```

#### 7.2.2 Missing Component Composition

Detail views could benefit from composition:

```typescript
// Current: Monolithic detail components
function AgentDetail({ data }: AgentDetailProps) {
  return (
    <div>
      {/* 200+ lines of JSX */}
    </div>
  );
}

// Recommended: Composed details
function AgentDetail({ data }: AgentDetailProps) {
  return (
    <DetailLayout>
      <DetailHeader entity={data} />
      <DetailMetadata metadata={data.metadata} />
      <DetailContent content={data.content} />
      <RelatedEntities relations={data.relations} />
    </DetailLayout>
  );
}
```

#### 7.2.3 Missing Error Boundary Coverage

`ErrorBoundary.tsx` exists but is not consistently used:

```typescript
// Current usage: Only in specific places
// Recommended: Wrap at route level

// app/agents/page.tsx
export default function AgentsPage() {
  return (
    <ErrorBoundary fallback={<AgentsErrorFallback />}>
      <AgentsContent />
    </ErrorBoundary>
  );
}
```

---

## 8. API Design

### 8.1 Current API Structure

```
/api/
  agents/
    route.ts          GET    List agents
    [slug]/route.ts   GET    Get agent by slug
  skills/
    route.ts          GET    List skills
    [slug]/route.ts   GET    Get skill by slug
  processes/
    route.ts          GET    List processes
    [id]/route.ts     GET    Get process by ID
  domains/
    route.ts          GET    List domains
    [slug]/route.ts   GET    Get domain by slug
  specializations/
    route.ts          GET    List specializations
    [slug]/route.ts   GET    Get specialization by slug
  search/
    route.ts          GET    Search all entities
  analytics/
    route.ts          GET    Dashboard analytics
  reindex/
    route.ts          POST   Trigger reindex
```

### 8.2 API Design Issues

#### 8.2.1 Inconsistent ID Parameters

```typescript
// Agents use slug
/api/agents/[slug]

// Processes use numeric ID
/api/processes/[id]

// Both should use consistent approach
```

#### 8.2.2 Missing Batch Operations

No bulk operations available:

```typescript
// Current: Must fetch one at a time
GET /api/agents/agent-1
GET /api/agents/agent-2

// Recommended: Batch endpoint
GET /api/agents?ids=1,2,3
// or
POST /api/agents/batch { ids: [1, 2, 3] }
```

#### 8.2.3 No API Versioning

APIs are not versioned, making breaking changes difficult:

```typescript
// Current
/api/agents

// Recommended
/api/v1/agents
```

#### 8.2.4 Inconsistent Error Responses

Some routes return different error structures:

```typescript
// Recommended: Consistent error format
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
  };
}
```

### 8.3 Recommended API Improvements

1. **Add OpenAPI/Swagger documentation**
2. **Implement API versioning**
3. **Add request ID tracking**
4. **Implement rate limiting**
5. **Add CORS configuration**
6. **Create batch endpoints**

---

## 9. File Organization

### 9.1 Current Structure Evaluation

| Directory | Purpose | Rating | Notes |
|-----------|---------|--------|-------|
| `app/` | Pages and routes | Good | Follows Next.js conventions |
| `components/` | React components | Good | Well-organized hierarchy |
| `lib/api/` | API utilities | Fair | Could be merged with routes |
| `lib/db/` | Database layer | Fair | Too many responsibilities |
| `lib/hooks/` | React hooks | Poor | Only one file, wrong location |
| `lib/parsers/` | File parsers | Good | Clear purpose |
| `types/` | Type definitions | Poor | Redundant with lib types |
| `hooks/` | Re-export | Poor | Unnecessary indirection |

### 9.2 Naming Conventions

| Convention | Status | Examples |
|------------|--------|----------|
| PascalCase for components | Consistent | `AgentCard.tsx`, `SearchBar.tsx` |
| camelCase for utilities | Consistent | `utils.ts`, `queries.ts` |
| Index files for exports | Consistent | `index.ts` in all modules |
| Route naming | Inconsistent | `[slug]` vs `[id]` |
| Type naming | Inconsistent | `AgentRow` vs `AgentListItem` |

### 9.3 Recommended Structure

```
packages/catalog/
  src/
    app/                    # Next.js pages (keep)

    components/             # React components (keep)
      ui/                   # Base UI (keep)
      common/               # Shared (keep)
      catalog/              # Domain-specific (keep)
      layout/               # Layout (keep)

    domain/                 # NEW: Domain model
      agent/
        Agent.ts            # Domain entity
        AgentRepository.ts  # Repository interface
        AgentService.ts     # Business logic
      skill/
      process/
      shared/
        types.ts

    infrastructure/         # NEW: External integrations
      db/
        sqlite/
          SqliteAgentRepository.ts
          SqliteConnection.ts
      parsers/              # Move from lib/

    lib/                    # Utilities only
      utils.ts
      constants.ts

    config/                 # NEW: Configuration
      database.config.ts
      api.config.ts

    tests/                  # NEW: Test directory
      unit/
      integration/
      e2e/
```

---

## 10. Code Reuse Opportunities

### 10.1 Extract Generic Entity Operations

Pattern repeated across all entity types:

```typescript
// Create generic entity service
interface EntityService<T, CreateDTO, UpdateDTO> {
  findAll(options: QueryOptions): Promise<PaginatedResult<T>>;
  findById(id: string | number): Promise<T | null>;
  create(data: CreateDTO): Promise<T>;
  update(id: string | number, data: UpdateDTO): Promise<T>;
  delete(id: string | number): Promise<void>;
  search(query: string): Promise<T[]>;
}
```

### 10.2 Unified API Route Handler

```typescript
// Generic route handler factory
function createListHandler<T>(
  service: EntityService<T, unknown, unknown>,
  transformer: (item: T) => unknown
) {
  return async (request: NextRequest) => {
    const params = parseListQueryParams(request.nextUrl.searchParams);
    const result = await service.findAll(params);
    return createPaginatedResponse(result.data.map(transformer), result.total);
  };
}

// Usage
export const GET = createListHandler(agentService, toAgentListItem);
```

### 10.3 Shared Card Behavior

```typescript
// HOC for card behavior
function withCardBehavior<P extends { href?: string; onClick?: () => void }>(
  Component: React.ComponentType<P>
) {
  return function CardWithBehavior(props: P) {
    const { href, onClick, ...rest } = props;

    const content = <Component {...(rest as P)} />;

    if (onClick) {
      return <ClickableWrapper onClick={onClick}>{content}</ClickableWrapper>;
    }

    return <Link href={href!}>{content}</Link>;
  };
}
```

### 10.4 Unified Form Handling

```typescript
// Generic filter form hook
function useFilterForm<T extends Record<string, unknown>>(
  initialValues: T,
  onSubmit: (values: T) => void
) {
  const [values, setValues] = useState(initialValues);

  const handleChange = useCallback((key: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  return { values, handleChange, handleReset, handleSubmit: () => onSubmit(values) };
}
```

### 10.5 Shared Validation Logic

```typescript
// Validation utilities
const validators = {
  required: (value: unknown) => value != null && value !== '',
  minLength: (min: number) => (value: string) => value.length >= min,
  maxLength: (max: number) => (value: string) => value.length <= max,
  pattern: (regex: RegExp) => (value: string) => regex.test(value),
};

// Validation schema builder
function createValidator<T>(schema: ValidationSchema<T>) {
  return (data: unknown): ValidationResult<T> => {
    // Implementation
  };
}
```

---

## 11. Patterns and Anti-Patterns

### 11.1 Positive Patterns Found

| Pattern | Location | Description |
|---------|----------|-------------|
| **Result Types** | `lib/parsers/types.ts` | `ParseResult<T>` for explicit success/failure |
| **Query Builder** | `lib/db/queries.ts` | Fluent API for query construction |
| **Component Composition** | `components/catalog/` | Atomic design-ish hierarchy |
| **Type-Safe Responses** | `lib/api/types.ts` | `ApiResponse<T>` wrapper |
| **Index File Exports** | All modules | Clean public API per module |

### 11.2 Anti-Patterns Found

| Anti-Pattern | Location | Impact | Fix |
|--------------|----------|--------|-----|
| **God Object** | `CatalogQueries` | 800+ lines, 20+ methods | Split by entity |
| **Singleton Abuse** | `CatalogDatabase` | Testing difficulties | Dependency injection |
| **Primitive Obsession** | Multiple | Using strings for IDs, enums | Create value objects |
| **Feature Envy** | API routes | Routes know too much about DB | Service layer |
| **Shotgun Surgery** | Types | Changes require multiple file edits | Single source of truth |
| **Magic Strings** | Error codes | Scattered string literals | Enumerated constants |
| **Copy-Paste Programming** | Entity cards | 70% duplicate code | Extract base component |

### 11.3 Missing Patterns

| Pattern | Benefit | Recommendation |
|---------|---------|----------------|
| **Repository Pattern** | Testable data access | Add repository interfaces |
| **Unit of Work** | Transaction management | Wrap related operations |
| **Specification Pattern** | Composable queries | For complex search |
| **Factory Pattern** | Object creation | For entity instantiation |
| **Observer Pattern** | Event handling | For index updates |

---

## 12. Recommendations

### 12.1 Priority Matrix

| Priority | Improvement | Effort | Impact |
|----------|-------------|--------|--------|
| P0 | Add service layer | High | Critical |
| P0 | Consolidate type definitions | Medium | High |
| P0 | Fix singleton lifecycle | Medium | High |
| P1 | Extract repository pattern | Medium | High |
| P1 | Create domain model | High | High |
| P1 | Unified error handling | Medium | Medium |
| P2 | Extract card base component | Low | Medium |
| P2 | API versioning | Low | Medium |
| P2 | Configuration management | Low | Medium |
| P3 | OpenAPI documentation | Medium | Low |
| P3 | Batch API endpoints | Medium | Low |

### 12.2 Implementation Roadmap

#### Phase 1: Foundation (2-3 weeks)

1. Create service layer structure
2. Consolidate type definitions
3. Implement proper database lifecycle
4. Add error handling infrastructure

#### Phase 2: Domain Model (2-3 weeks)

1. Define domain entities
2. Create repository interfaces
3. Implement repository pattern
4. Migrate API routes to use services

#### Phase 3: Component Refactoring (1-2 weeks)

1. Extract card base component
2. Create filter form hook
3. Improve error boundary coverage
4. Add loading state management

#### Phase 4: API Improvements (1-2 weeks)

1. Add API versioning
2. Implement batch endpoints
3. Add OpenAPI documentation
4. Add rate limiting

### 12.3 Quick Wins

These can be done immediately with low risk:

1. **Create constants file**
   ```typescript
   // src/lib/constants.ts
   export const PAGINATION = { DEFAULT_LIMIT: 20, MAX_LIMIT: 100 };
   export const SEARCH = { DEBOUNCE_MS: 300 };
   ```

2. **Add process exit handler**
   ```typescript
   // src/lib/db/client.ts
   process.on('SIGTERM', () => CatalogDatabase.getInstance()?.close());
   ```

3. **Extract getDirectory utility**
   ```typescript
   // src/lib/utils.ts
   export function getDirectory(filePath: string): string {
     return filePath.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
   }
   ```

4. **Create ValidationResult interface**
   ```typescript
   // src/lib/types/validation.ts
   export interface ValidationResult {
     valid: boolean;
     errors: string[];
     warnings: string[];
   }
   ```

---

## Appendix A: Architecture Decision Records

### ADR-001: Use SQLite for Local Storage

**Context:** Need persistent storage for catalog data
**Decision:** Use better-sqlite3 with FTS5
**Status:** Implemented
**Consequences:** Fast full-text search, no external dependencies, limited concurrent access

### ADR-002: Next.js App Router

**Context:** Modern React framework needed
**Decision:** Use Next.js 16 with App Router
**Status:** Implemented
**Consequences:** Server components, streaming, but complex mental model

### ADR-003: Custom Data Fetching Hooks

**Context:** Need data fetching without heavy dependencies
**Decision:** Custom useQuery-like hooks
**Status:** Implemented
**Consequences:** Full control, but missing advanced features of React Query/SWR

---

## Appendix B: Component Dependency Graph

```
app/page.tsx
  -> components/dashboard/*
    -> components/ui/*

app/agents/page.tsx
  -> components/catalog/SearchBar
  -> components/catalog/EntityList
  -> components/catalog/EntityCard/AgentCard
  -> components/common/Pagination
  -> lib/hooks/useApi

components/catalog/EntityCard/AgentCard
  -> components/ui/card
  -> components/ui/badge
  -> components/common/Tag
  -> lib/utils

lib/hooks/useApi
  -> lib/api/types
```

---

## Appendix C: Files Analyzed

```
Total files analyzed: 85+

src/types/index.ts
src/lib/utils.ts
src/lib/api/types.ts, index.ts, utils.ts
src/lib/db/types.ts, schema.ts, queries.ts, client.ts, indexer.ts, init.ts, index.ts
src/lib/parsers/types.ts, frontmatter.ts, markdown.ts, agent.ts, skill.ts, process.ts, index.ts
src/lib/hooks/useApi.ts
src/hooks/index.ts
src/app/page.tsx
src/app/api/agents/route.ts, skills/route.ts, processes/route.ts, search/route.ts, analytics/route.ts
src/app/agents/page.tsx
src/components/catalog/*.tsx
src/components/common/*.tsx
src/components/dashboard/*.tsx
src/components/layout/*.tsx
src/components/ui/*.tsx
package.json
```

---

*Report generated: 2026-01-26*
*Reviewer: Software Architect*
