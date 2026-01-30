# Process Library Catalog - Project Analysis

**Document Version:** 1.0
**Analysis Date:** January 2026
**Project Path:** `packages/catalog`

---

## Executive Summary

The Process Library Catalog is a modern web application built with Next.js 16 that serves as a searchable catalog for the Babysitter AI Framework. It provides a sophisticated interface for browsing, searching, and exploring process definitions, AI agents, skills, domains, and specializations used in AI automation workflows.

The application features a distinctive **Victorian Steampunk design theme** with brass, copper, and parchment aesthetics, animated gear decorations, and a rich visual identity that sets it apart from typical developer tools. The backend uses SQLite with FTS5 (Full-Text Search) for efficient content indexing and search capabilities.

### Key Capabilities
- Full-text search across all catalog entities
- Hierarchical navigation (Domains > Specializations > Agents/Skills)
- Real-time analytics dashboard with charts
- Markdown content rendering with syntax highlighting
- Incremental file indexing system
- RESTful API for all data operations
- Responsive design with mobile support

---

## Technology Stack

### Frontend Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.4 | React framework with App Router, Server Components, Turbopack |
| **React** | 19.2.3 | UI component library |
| **React DOM** | 19.2.3 | DOM rendering |
| **TypeScript** | ^5 | Type safety and developer experience |

### UI & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | ^4 | Utility-first CSS framework |
| **shadcn/ui** | - | Component library (Radix UI primitives) |
| **Lucide React** | ^0.469.0 | Icon library |
| **Class Variance Authority** | ^0.7.0 | Component variant management |
| **clsx** | ^2.1.0 | Conditional class names |
| **tailwind-merge** | ^2.2.0 | Tailwind class merging |

### Radix UI Components
| Component | Version | Usage |
|-----------|---------|-------|
| @radix-ui/react-slot | ^1.0.2 | Component composition |
| @radix-ui/react-dialog | ^1.0.5 | Modal dialogs |
| @radix-ui/react-dropdown-menu | ^2.0.6 | Dropdown menus |
| @radix-ui/react-tabs | ^1.0.4 | Tab navigation |
| @radix-ui/react-tooltip | ^1.0.7 | Tooltips |
| @radix-ui/react-scroll-area | ^1.0.5 | Custom scrollbars |
| @radix-ui/react-separator | ^1.0.3 | Visual separators |
| @radix-ui/react-accordion | ^1.0.2 | Collapsible sections |

### Data Visualization
| Technology | Version | Purpose |
|------------|---------|---------|
| **Recharts** | ^2.12.0 | Charts (Bar, Pie, Treemap) |

### Content Processing
| Technology | Version | Purpose |
|------------|---------|---------|
| **react-markdown** | ^9.0.1 | Markdown rendering |
| **remark-gfm** | ^4.0.0 | GitHub Flavored Markdown |
| **rehype-highlight** | ^7.0.0 | Syntax highlighting |
| **gray-matter** | ^4.0.3 | YAML frontmatter parsing |

### Database
| Technology | Version | Purpose |
|------------|---------|---------|
| **better-sqlite3** | ^11.0.0 | SQLite database driver |
| **SQLite FTS5** | - | Full-text search extension |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | ^9 | Code linting |
| **Prettier** | ^3.2.0 | Code formatting |
| **prettier-plugin-tailwindcss** | ^0.5.11 | Tailwind class sorting |
| **tsx** | ^4.7.0 | TypeScript execution |

### Typography (Google Fonts)
| Font | Usage |
|------|-------|
| **Playfair Display** | Headers, Victorian serif style |
| **EB Garamond** | Body text, elegant serif |
| **Cinzel Decorative** | Victorian accent text |

---

## Architecture Overview

### Architecture Pattern
The application follows a **Layered Architecture** with clear separation of concerns:

```
+-------------------------------------------+
|           Presentation Layer              |
|   (Pages, Components, UI Elements)        |
+-------------------------------------------+
|            API Layer (Routes)             |
|    (REST endpoints, Request handling)     |
+-------------------------------------------+
|           Service Layer                   |
|   (Queries, Indexer, Parsers)            |
+-------------------------------------------+
|            Data Access Layer              |
|   (Database Client, Schema, Types)        |
+-------------------------------------------+
|           Storage Layer                   |
|        (SQLite Database)                  |
+-------------------------------------------+
```

### Directory Structure
```
packages/catalog/
├── .a5c/                    # Babysitter process definitions
├── data/                    # SQLite database storage
│   └── catalog.db           # Main database file (~25MB)
├── docs/                    # Documentation
├── public/                  # Static assets
├── scripts/                 # CLI scripts (reindex)
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API route handlers
│   │   ├── agents/         # Agent pages
│   │   ├── domains/        # Domain pages
│   │   ├── processes/      # Process pages
│   │   ├── search/         # Search page
│   │   ├── skills/         # Skill pages
│   │   ├── specializations/# Specialization pages
│   │   ├── globals.css     # Global styles (Steampunk theme)
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Dashboard homepage
│   ├── components/
│   │   ├── catalog/        # Entity-specific components
│   │   ├── common/         # Shared components
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── decorations/    # Steampunk visual elements
│   │   ├── layout/         # Layout components
│   │   ├── markdown/       # Content rendering
│   │   └── ui/             # shadcn/ui primitives
│   ├── hooks/              # Custom React hooks
│   ├── lib/
│   │   ├── api/            # API utilities and types
│   │   ├── db/             # Database layer
│   │   └── parsers/        # File content parsers
│   └── types/              # TypeScript type definitions
├── components.json          # shadcn/ui configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

### Data Flow

```
                    +----------------+
                    |  File System   |
                    |  (Markdown,    |
                    |   JS files)    |
                    +-------+--------+
                            |
                            v
                    +-------+--------+
                    |    Indexer     |
                    |   (Parsers)    |
                    +-------+--------+
                            |
                            v
                    +-------+--------+
                    | SQLite + FTS5  |
                    |   Database     |
                    +-------+--------+
                            |
                            v
                    +-------+--------+
                    |  API Routes    |
                    +-------+--------+
                            |
                            v
                    +-------+--------+
                    |  React Pages   |
                    |  & Components  |
                    +----------------+
```

---

## Feature Inventory

### 1. Dashboard (Homepage)
- **Hero section** with branding and navigation CTAs
- **Stats overview** showing total entities, files indexed, last index time
- **Metric cards** for each entity type (Processes, Domains, Specializations, Skills, Agents)
- **Quick links** for navigation to main sections
- **Distribution charts**:
  - Pie chart: Entity type distribution
  - Bar chart: Processes by category
  - Treemap: Agents by domain
- **Recent activity** feed showing latest updates

### 2. Search Functionality
- **Global full-text search** across all entities
- **Type filtering** (processes, skills, agents, domains, specializations)
- **Highlighted search results** with content snippets
- **Grouped results** by entity type
- **URL-based search state** for shareable links
- **Keyboard shortcuts** (Ctrl+K for search focus)

### 3. Process Catalog
- **List view** with card-based layout
- **Category filtering** via sidebar
- **Search within processes**
- **Pagination** with configurable page size
- **Detail view** showing:
  - Process ID and description
  - Input/output parameters
  - Task definitions
  - Metadata and frontmatter

### 4. Skills Catalog
- **List view** with filtering
- **Filter by domain** and specialization
- **Skill cards** showing allowed tools
- **Detail view** with full markdown content

### 5. Agents Directory
- **List view** with expertise tags
- **Filter by domain**, specialization, role
- **Agent cards** showing role and expertise
- **Detail view** with full content and metadata

### 6. Domains Browser
- **Hierarchical domain list**
- **Count badges** for nested entities
- **Detail view** with specializations list
- **Related agents and skills**

### 7. Specializations Browser
- **Filter by parent domain**
- **Entity counts** display
- **Detail view** with nested agents/skills

### 8. Content Indexing
- **Full reindex** via API or CLI
- **Incremental updates** based on file modification times
- **Progress tracking** during indexing
- **Error reporting** for failed parses

### 9. Navigation & Layout
- **Responsive header** with navigation
- **Mobile-friendly menu**
- **Breadcrumb navigation**
- **Collapsible sidebar** (optional)
- **Footer** with links

---

## Component Catalog

### Layout Components
| Component | Path | Purpose |
|-----------|------|---------|
| Header | `components/layout/Header.tsx` | Main navigation header with search |
| Footer | `components/layout/Footer.tsx` | Page footer with links |
| Sidebar | `components/layout/Sidebar.tsx` | Collapsible navigation sidebar |
| PageContainer | `components/layout/PageContainer.tsx` | Page content wrapper |
| Breadcrumb | `components/layout/Breadcrumb.tsx` | Navigation breadcrumbs |

### Dashboard Components
| Component | Path | Purpose |
|-----------|------|---------|
| MetricCard | `components/dashboard/MetricCard.tsx` | Stat display card |
| StatsOverview | `components/dashboard/StatsOverview.tsx` | Summary statistics bar |
| QuickLinks | `components/dashboard/QuickLinks.tsx` | Navigation link cards |
| RecentActivity | `components/dashboard/RecentActivity.tsx` | Activity feed |
| BarChart | `components/dashboard/BarChart.tsx` | Category distribution chart |
| PieChart | `components/dashboard/PieChart.tsx` | Type distribution chart |
| TreemapChart | `components/dashboard/TreemapChart.tsx` | Domain distribution treemap |

### Catalog Components
| Component | Path | Purpose |
|-----------|------|---------|
| EntityList | `components/catalog/EntityList.tsx` | Generic paginated list |
| FilterPanel | `components/catalog/FilterPanel.tsx` | Filter sidebar |
| SearchBar | `components/catalog/SearchBar.tsx` | Search input with suggestions |
| SortDropdown | `components/catalog/SortDropdown.tsx` | Sort options dropdown |
| TreeView | `components/catalog/TreeView.tsx` | Hierarchical tree display |
| MetadataDisplay | `components/catalog/MetadataDisplay.tsx` | Metadata key-value display |
| RelatedItems | `components/catalog/RelatedItems.tsx` | Related entity links |
| QuickActions | `components/catalog/QuickActions.tsx` | Action buttons |

### Entity Card Components
| Component | Path | Purpose |
|-----------|------|---------|
| ProcessCard | `components/catalog/EntityCard/ProcessCard.tsx` | Process summary card |
| SkillCard | `components/catalog/EntityCard/SkillCard.tsx` | Skill summary card |
| AgentCard | `components/catalog/EntityCard/AgentCard.tsx` | Agent summary card |
| DomainCard | `components/catalog/EntityCard/DomainCard.tsx` | Domain summary card |

### Detail View Components
| Component | Path | Purpose |
|-----------|------|---------|
| ProcessDetail | `components/catalog/DetailView/ProcessDetail.tsx` | Full process view |
| SkillDetail | `components/catalog/DetailView/SkillDetail.tsx` | Full skill view |
| AgentDetail | `components/catalog/DetailView/AgentDetail.tsx` | Full agent view |

### Markdown Components
| Component | Path | Purpose |
|-----------|------|---------|
| MarkdownRenderer | `components/markdown/MarkdownRenderer.tsx` | Markdown to HTML |
| CodeBlock | `components/markdown/CodeBlock.tsx` | Syntax-highlighted code |
| TableOfContents | `components/markdown/TableOfContents.tsx` | Generated TOC |
| FrontmatterDisplay | `components/markdown/FrontmatterDisplay.tsx` | YAML frontmatter |
| LinkHandler | `components/markdown/LinkHandler.tsx` | Internal link handling |
| ImageHandler | `components/markdown/ImageHandler.tsx` | Image rendering |

### Decorative Components (Steampunk Theme)
| Component | Path | Purpose |
|-----------|------|---------|
| GearCluster | `components/decorations/GearCluster.tsx` | Animated gear decoration |
| BrassPipeBorder | `components/decorations/BrassPipeBorder.tsx` | Decorative pipe borders |
| CardCornerFlourish | `components/decorations/CardCornerFlourish.tsx` | Corner ornaments |
| MechanicalBee | `components/decorations/MechanicalBee.tsx` | Animated bee decoration |
| BotanicalDecor | `components/decorations/BotanicalDecor.tsx` | Plant decorations |

### UI Primitives (shadcn/ui)
| Component | Path | Purpose |
|-----------|------|---------|
| Button | `components/ui/button.tsx` | Button variants |
| Card | `components/ui/card.tsx` | Card container |
| Badge | `components/ui/badge.tsx` | Label badges |
| Input | `components/ui/input.tsx` | Form input |
| Skeleton | `components/ui/skeleton.tsx` | Loading skeleton |
| Separator | `components/ui/separator.tsx` | Visual divider |

### Common Components
| Component | Path | Purpose |
|-----------|------|---------|
| EmptyState | `components/common/EmptyState.tsx` | No results display |
| Tag | `components/common/Tag.tsx` | Tag/chip component |
| LoadingSkeleton | `components/common/LoadingSkeleton.tsx` | Loading states |
| Pagination | `components/common/Pagination.tsx` | Page navigation |
| SearchInput | `components/common/SearchInput.tsx` | Search input field |
| ErrorBoundary | `components/ErrorBoundary.tsx` | Error handling |

---

## API Endpoint Inventory

### Search
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/search` | Full-text search across all entities |

**Query Parameters:**
- `q` (required): Search query string
- `type`: Filter by entity type
- `limit`: Results per page (default: 20)
- `offset`: Pagination offset

### Processes
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/processes` | List processes with filtering |
| GET | `/api/processes/[id]` | Get process by ID |

**Query Parameters:**
- `category`: Filter by category
- `limit`, `offset`: Pagination
- `sort`, `order`: Sorting

### Agents
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/agents` | List agents with filtering |
| GET | `/api/agents/[slug]` | Get agent by name |

**Query Parameters:**
- `domain`: Filter by domain
- `specialization`: Filter by specialization
- `expertise`: Filter by expertise tag
- `limit`, `offset`: Pagination
- `sort`, `order`: Sorting

### Skills
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/skills` | List skills with filtering |
| GET | `/api/skills/[slug]` | Get skill by name |

**Query Parameters:**
- `domain`: Filter by domain
- `specialization`: Filter by specialization
- `category`: Filter by category
- `limit`, `offset`: Pagination
- `sort`, `order`: Sorting

### Domains
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/domains` | List domains with counts |
| GET | `/api/domains/[slug]` | Get domain detail |

**Query Parameters:**
- `category`: Filter by category
- `limit`, `offset`: Pagination
- `sort`, `order`: Sorting

### Specializations
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/specializations` | List specializations |
| GET | `/api/specializations/[slug]` | Get specialization detail |

**Query Parameters:**
- `domain`: Filter by parent domain
- `limit`, `offset`: Pagination
- `sort`, `order`: Sorting

### Analytics
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/analytics` | Dashboard metrics and statistics |

**Response includes:**
- Entity counts (domains, specializations, agents, skills, processes)
- Distribution by domain, category, type
- Recent activity feed
- Database size and last indexed timestamp

### Reindex
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/reindex` | Trigger incremental reindex |
| POST | `/api/reindex` | Trigger full/incremental reindex |

**Request Body (POST):**
```json
{
  "force": true  // Force full reindex
}
```

---

## Data Layer Architecture

### Database Schema

The application uses SQLite with the following table structure:

#### Core Tables
```sql
-- Schema version tracking
schema_version (id, version, updated_at)

-- Knowledge domains
domains (id, name, path, category, readme_path, references_path, created_at, updated_at)

-- Domain specializations
specializations (id, name, path, domain_id FK, readme_path, references_path, created_at, updated_at)

-- AI agent definitions
agents (id, name, description, file_path, directory, role, expertise JSON,
        specialization_id FK, domain_id FK, frontmatter JSON, content,
        file_mtime, created_at, updated_at)

-- Skill definitions
skills (id, name, description, file_path, directory, allowed_tools JSON,
        specialization_id FK, domain_id FK, frontmatter JSON, content,
        file_mtime, created_at, updated_at)

-- Process definitions
processes (id, process_id, description, file_path, directory, category,
           inputs JSON, outputs JSON, tasks JSON, frontmatter JSON,
           file_mtime, created_at, updated_at)

-- File change tracking for incremental updates
file_tracking (id, file_path, file_type, mtime, hash, indexed_at)

-- Index metadata
index_metadata (id, last_full_index, last_incremental_index,
                total_files_indexed, index_duration_ms)
```

#### FTS5 Virtual Tables (Full-Text Search)
```sql
-- Entity-specific FTS tables
agents_fts (name, description, role, expertise, content)
skills_fts (name, description, allowed_tools, content)
processes_fts (process_id, description, category, inputs, outputs)

-- Unified search across all entities
catalog_search (item_type, item_id, name, description, content)
```

### Database Indexes
- Name indexes for quick lookups
- Foreign key indexes for joins
- File modification time indexes for incremental updates
- Category/type indexes for filtering

### Data Models

#### Agent Model
```typescript
interface AgentRow {
  id: number;
  name: string;
  description: string;
  file_path: string;
  directory: string;
  role: string | null;
  expertise: string; // JSON array
  specialization_id: number | null;
  domain_id: number | null;
  frontmatter: string; // JSON object
  content: string;
  file_mtime: number;
  created_at: string;
  updated_at: string;
}
```

#### Skill Model
```typescript
interface SkillRow {
  id: number;
  name: string;
  description: string;
  file_path: string;
  directory: string;
  allowed_tools: string; // JSON array
  specialization_id: number | null;
  domain_id: number | null;
  frontmatter: string; // JSON object
  content: string;
  file_mtime: number;
  created_at: string;
  updated_at: string;
}
```

#### Process Model
```typescript
interface ProcessRow {
  id: number;
  process_id: string;
  description: string;
  file_path: string;
  directory: string;
  category: string | null;
  inputs: string; // JSON array
  outputs: string; // JSON array
  tasks: string; // JSON array
  frontmatter: string; // JSON object
  file_mtime: number;
  created_at: string;
  updated_at: string;
}
```

---

## Third-Party Integrations

### GitHub Integration
- **GitHub link** in header and footer
- **Repository link**: `https://github.com/a5c-ai/babysitter`
- **Avatar support** for GitHub profile images

### External Services
- No external APIs or services are used
- Application is fully self-contained
- Data is sourced from local file system

### Content Sources
The indexer scans these paths for content:
- `plugins/babysitter/skills/babysit/process/specializations`
- `plugins/babysitter/skills/babysit/process/methodologies`

Supported file types:
- `.md` - Markdown files (agents, skills)
- `.js` - JavaScript process definitions

---

## Design System

### Color Palette (Steampunk Theme)

#### Primary Metallic Tones
| Name | Value | Usage |
|------|-------|-------|
| Brass | `#B8860B` | Primary accent, buttons, links |
| Polished Brass | `#D4AF37` | Highlights, hover states |
| Dark Brass | `#8B6914` | Shadows, borders |
| Copper | `#CD7F32` | Secondary accent |
| Bronze | `#8B4513` | Tertiary accent |

#### Parchment Tones
| Name | Value | Usage |
|------|-------|-------|
| Parchment | `#F5E6C8` | Card backgrounds |
| Cream | `#FDF5E6` | Light backgrounds |
| Light Tan | `#E8DCC4` | Subtle backgrounds |
| Parchment Dark | `#E8D5B0` | Borders, dividers |

#### Background Colors
| Name | Value | Usage |
|------|-------|-------|
| Main Background | `#F2E8D5` | Page background |
| Card Background | `#F8F0E0` | Card surfaces |

#### Text Colors
| Name | Value | Usage |
|------|-------|-------|
| Primary Text | `#3D2314` | Headers |
| Secondary Text | `#5C4033` | Body text |
| Muted Text | `#7D6B5D` | Captions, hints |

#### Accent Colors
| Name | Value | Usage |
|------|-------|-------|
| Green | `#6B8E23` | Success states |
| Pink | `#DB7093` | Error/danger states |
| Sepia | `#704214` | Special accents |

### Typography

#### Font Families
```css
--font-steampunk-header: "Playfair Display", Georgia, serif;
--font-steampunk-body: "EB Garamond", Georgia, serif;
--font-steampunk-accent: "Cinzel Decorative", Georgia, serif;
--font-mono: "Courier New", Courier, monospace;
```

#### Type Scale
| Element | Size | Weight |
|---------|------|--------|
| H1 | 2.75rem | 700 |
| H2 | 2.125rem | 600 |
| H3 | 1.625rem | 600 |
| H4 | 1.25rem | 600 |
| H5 | 1.125rem | 600 |
| H6 | 1rem | 600 |
| Body | 1rem | 400 |
| Small | 0.875rem | 400 |

### UI Patterns

#### Card Styles
- Parchment background with brass borders
- Subtle shadow for depth
- Corner rivets as decoration
- Hover elevation effect

#### Button Styles
- **Brass button**: Gradient metallic appearance
- **Copper button**: Secondary actions
- **Bronze button**: Tertiary actions
- Embossed text with shadow

#### Input Styles
- Inset shadow for depth
- Brass border on focus
- Italic placeholder text

#### Decorative Elements
- Animated gear clusters (SVG)
- Pipe and valve decorations
- Corner flourishes
- Rivet details
- Dividers with center ornaments

### Animations
| Animation | Duration | Usage |
|-----------|----------|-------|
| gear-spin | 2-25s | Rotating gears |
| brass-shimmer | 3s | Metallic shine effect |
| steam-puff | 2s | Steam particle effect |
| gauge-wobble | 0.5s | Pressure gauge motion |
| brass-pulse | 2s | Glowing indicator |

---

## Appendix: NPM Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack

# Build
npm run build        # Production build
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
npm run type-check   # TypeScript type checking

# Database
npm run reindex        # Incremental reindex
npm run reindex:force  # Full reindex
npm run reindex:reset  # Reset and reindex with stats
```

---

## Appendix: Environment Variables

```bash
# API Base URL (optional, defaults to http://localhost:3000)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Database path (optional, defaults to data/catalog.db)
DATABASE_PATH=data/catalog.db
```

---

*End of Project Analysis Document*
