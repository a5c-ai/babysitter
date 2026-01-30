# UI/UX Requirements - Process Library Catalog

**Document Version:** 1.0
**Last Updated:** 2026-01-26
**Project:** Babysitter Process Library Catalog
**Path:** `C:/Users/tmusk/IdeaProjects/babysitter/packages/catalog`

---

## Table of Contents

1. [Design System](#1-design-system)
2. [Component Library](#2-component-library)
3. [Page Layouts](#3-page-layouts)
4. [Navigation and User Flows](#4-navigation-and-user-flows)
5. [Responsive Design](#5-responsive-design)
6. [Loading, Error, and Empty States](#6-loading-error-and-empty-states)
7. [Animations and Transitions](#7-animations-and-transitions)
8. [Accessibility Requirements](#8-accessibility-requirements)

---

## 1. Design System

### 1.1 Theme Overview

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-001 | Theme Style | Victorian Steampunk aesthetic with brass, copper, and parchment tones |
| UX-002 | Theme Consistency | All components must adhere to the Steampunk design language |
| UX-003 | Visual Hierarchy | Use metallic gradients and ornate decorations to establish visual importance |

### 1.2 Color Palette

#### 1.2.1 Primary Metallic Tones

| ID | Color Name | Hex Value | CSS Variable | Usage |
|----|------------|-----------|--------------|-------|
| UX-004 | Brass | `#B8860B` | `--steampunk-brass` | Primary accent, buttons, links |
| UX-005 | Copper | `#CD7F32` | `--steampunk-copper` | Secondary accent, warnings |
| UX-006 | Bronze | `#8B4513` | `--steampunk-bronze` | Neutral emphasis |
| UX-007 | Dark Brass | `#8B6914` | `--steampunk-dark-brass` | Borders, shadows |
| UX-008 | Polished Brass | `#D4AF37` | `--steampunk-polished-brass` | Highlights, focus rings |

#### 1.2.2 Parchment Tones (Backgrounds)

| ID | Color Name | Hex Value | CSS Variable | Usage |
|----|------------|-----------|--------------|-------|
| UX-009 | Parchment | `#F5E6C8` | `--steampunk-parchment` | Light backgrounds |
| UX-010 | Cream | `#FDF5E6` | `--steampunk-cream` | Text on dark backgrounds |
| UX-011 | Light Tan | `#E8DCC4` | `--steampunk-light-tan` | Subtle backgrounds |
| UX-012 | Parchment Dark | `#E8D5B0` | `--steampunk-parchment-dark` | Inset backgrounds |
| UX-013 | Main Background | `#F2E8D5` | `--steampunk-bg-main` | Page background |
| UX-014 | Card Background | `#F8F0E0` / `#F9F0DC` | `--steampunk-card` | Card surfaces |

#### 1.2.3 Text Colors

| ID | Color Name | Hex Value | CSS Variable | Usage |
|----|------------|-----------|--------------|-------|
| UX-015 | Text Primary | `#3D2314` | `--steampunk-text-primary` | Primary text |
| UX-016 | Text Secondary | `#5C4033` | `--steampunk-text-secondary` | Secondary text |
| UX-017 | Text Muted | `#7D6B5D` | `--steampunk-text-muted` | Muted/placeholder text |
| UX-018 | Text Header | `#3D2B1F` | `--steampunk-text-header` | Headings |
| UX-019 | Text Body | `#4A3728` | `--steampunk-text-body` | Body text |

#### 1.2.4 Accent Colors

| ID | Color Name | Hex Value | CSS Variable | Usage |
|----|------------|-----------|--------------|-------|
| UX-020 | Accent Green | `#6B8E23` | `--steampunk-accent-green` | Success states |
| UX-021 | Accent Pink | `#DB7093` | `--steampunk-accent-pink` | Danger/destructive states |
| UX-022 | Accent Sepia | `#704214` | `--steampunk-accent-sepia` | Emphasis text |

#### 1.2.5 Border Colors

| ID | Color Name | Hex Value | CSS Variable | Usage |
|----|------------|-----------|--------------|-------|
| UX-023 | Border Brass | `#A67C00` | `--steampunk-border-brass` | Default borders |
| UX-024 | Card Border | `#8B7355` | `--steampunk-card-border` | Card borders |

#### 1.2.6 Chart Colors

| ID | Color | CSS Variable | Usage |
|----|-------|--------------|-------|
| UX-025 | Chart 1 | `--chart-1` (Brass) | Primary chart data |
| UX-026 | Chart 2 | `--chart-2` (Green) | Secondary chart data |
| UX-027 | Chart 3 | `--chart-3` (Copper) | Tertiary chart data |
| UX-028 | Chart 4 | `--chart-4` (Bronze) | Quaternary chart data |
| UX-029 | Chart 5 | `--chart-5` (Pink) | Quinary chart data |

### 1.3 Typography

#### 1.3.1 Font Families

| ID | Font Type | Font Family | CSS Variable | Usage |
|----|-----------|-------------|--------------|-------|
| UX-030 | Header Font | "Playfair Display", Georgia, serif | `--font-steampunk-header` | Headings, titles, buttons |
| UX-031 | Body Font | "Merriweather", Georgia, serif | `--font-steampunk-body` | Body text, paragraphs |
| UX-032 | Accent Font | "EB Garamond", Georgia, serif | `--font-steampunk-accent` | Blockquotes, emphasis |
| UX-033 | Monospace | "Courier New", Courier, monospace | `--font-mono` | Code blocks, technical content |

#### 1.3.2 Font Sizes

| ID | Element | Size | Weight | Line Height | Letter Spacing |
|----|---------|------|--------|-------------|----------------|
| UX-034 | H1 | 2.75rem (44px) | 700 | 1.3 | -0.02em |
| UX-035 | H2 | 2.125rem (34px) | 600 | 1.3 | -0.01em |
| UX-036 | H3 | 1.625rem (26px) | 600 | 1.3 | -0.01em |
| UX-037 | H4 | 1.25rem (20px) | 600 | 1.3 | -0.01em |
| UX-038 | H5 | 1.125rem (18px) | 600 | 1.3 | -0.01em |
| UX-039 | H6 | 1rem (16px) | 600 | 1.3 | -0.01em |
| UX-040 | Body | 1rem (16px) | 400 | 1.75 | normal |
| UX-041 | Small | 0.875rem (14px) | 400 | 1.5 | normal |
| UX-042 | XSmall | 0.75rem (12px) | 400 | 1.5 | normal |

### 1.4 Spacing

| ID | Size | Value | CSS | Usage |
|----|------|-------|-----|-------|
| UX-043 | XS | 4px | `p-1` | Tight padding |
| UX-044 | SM | 8px | `p-2` | Small padding |
| UX-045 | MD | 16px | `p-4` | Default padding |
| UX-046 | LG | 24px | `p-6` | Large padding |
| UX-047 | XL | 32px | `p-8` | Extra large padding |
| UX-048 | 2XL | 48px | `p-12` | Section padding |

### 1.5 Border Radius

| ID | Size | Value | CSS Variable | Usage |
|----|------|-------|--------------|-------|
| UX-049 | Base Radius | 4px | `--radius` | Default radius |
| UX-050 | SM Radius | 2px | `--radius-sm` | Small elements |
| UX-051 | MD Radius | 4px | `--radius-md` | Medium elements |
| UX-052 | LG Radius | 6px | `--radius-lg` | Large elements |
| UX-053 | XL Radius | 10px | `--radius-xl` | Extra large elements |
| UX-054 | Full | 999px | `rounded-full` | Pills, avatars |

### 1.6 Shadows

| ID | Shadow Type | Value | Usage |
|----|-------------|-------|-------|
| UX-055 | Card Shadow | `0 1px 3px rgba(61, 43, 31, 0.15), 0 2px 4px rgba(61, 43, 31, 0.1)` | Cards at rest |
| UX-056 | Card Hover | `0 4px 6px rgba(61, 43, 31, 0.25), 0 2px 4px rgba(61, 43, 31, 0.1)` | Cards on hover |
| UX-057 | Button Shadow | `inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 4px rgba(61, 43, 31, 0.2)` | Brass buttons |
| UX-058 | Focus Ring | `0 0 8px rgba(184, 134, 11, 0.3)` | Focus states |
| UX-059 | Inset Shadow | `inset 0 2px 4px rgba(61, 43, 31, 0.1)` | Input fields |

---

## 2. Component Library

### 2.1 Layout Components

#### 2.1.1 Header

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-060 | Sticky Behavior | Header remains fixed at top of viewport with `z-index: 50` |
| UX-061 | Height | Fixed height of 56px (3.5rem / h-14) |
| UX-062 | Backdrop Blur | Semi-transparent background with backdrop blur effect |
| UX-063 | Logo | Displays application logo (book icon) and title "Babysitter Catalog" |
| UX-064 | Navigation | Desktop: Horizontal nav links; Mobile: Hamburger menu |
| UX-065 | Search | Global search input with keyboard shortcut indicator (Ctrl+K) |
| UX-066 | External Link | GitHub repository link with icon |

**Nav Items:** Dashboard, Processes, Skills, Agents, Domains

#### 2.1.2 Sidebar

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-067 | Width | Fixed 256px (w-64) on desktop |
| UX-068 | Sections | Collapsible sections: Processes, Skills, Agents, Domains, Specializations |
| UX-069 | Active State | Highlighted background for active route |
| UX-070 | Mobile Behavior | Slide-out drawer with overlay on mobile |
| UX-071 | Close Button | Visible X button on mobile |
| UX-072 | Footer | Version information at bottom |

#### 2.1.3 Footer

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-073 | Content | Copyright, version, and useful links |
| UX-074 | Placement | Full width at bottom of page |

#### 2.1.4 PageContainer

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-075 | Max Width | Container with `max-w-7xl` (1280px) |
| UX-076 | Padding | Horizontal padding `px-4` with vertical `py-10` |
| UX-077 | Centering | Horizontally centered with `mx-auto` |

#### 2.1.5 Breadcrumb

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-078 | Structure | Home > Section > Current page |
| UX-079 | Separator | Chevron icon between items |
| UX-080 | Current Item | Non-clickable, muted color |

### 2.2 UI Components

#### 2.2.1 Button

| ID | Variant | Style Description |
|----|---------|-------------------|
| UX-081 | Default/Brass | Brass gradient background, cream text, brass border |
| UX-082 | Destructive | Pink/rose gradient for dangerous actions |
| UX-083 | Outline | Brass border, parchment background |
| UX-084 | Secondary | Parchment dark background, dark text |
| UX-085 | Ghost | Transparent, hover shows parchment background |
| UX-086 | Link | Brass text with underline on hover |

**Sizes:** Default (h-9), Small (h-8), Large (h-10), Icon (h-9 w-9)

#### 2.2.2 Card

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-087 | Background | Parchment (`#F9F0DC`) |
| UX-088 | Border | 2px brass border (`#A67C00`) |
| UX-089 | Shadow | Multi-layer shadow with inset highlight |
| UX-090 | Hover | Enhanced shadow on hover |
| UX-091 | Sub-components | CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| UX-092 | Title Typography | Playfair Display font, dark brass color |

#### 2.2.3 Badge

| ID | Variant | Style Description |
|----|---------|-------------------|
| UX-093 | Default | Primary color with shadow |
| UX-094 | Secondary | Subtle background |
| UX-095 | Destructive | Pink/rose for errors |
| UX-096 | Outline | Border only |
| UX-097 | Success | Green background |
| UX-098 | Warning | Copper/orange background |
| UX-099 | Accent | Brass accent background |
| UX-100 | Steampunk | Enhanced brass gradient with 3D effect, uppercase text |

#### 2.2.4 Input

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-101 | Height | 36px (h-9) |
| UX-102 | Border | 1px brass border |
| UX-103 | Focus | Polished brass ring with glow |
| UX-104 | Placeholder | Muted color, italic style |
| UX-105 | Background | Card/parchment background |

#### 2.2.5 Skeleton

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-106 | Animation | Pulse animation |
| UX-107 | Color | Neutral muted background |
| UX-108 | Variants | Base, Card, List, Detail, Table |

### 2.3 Catalog Components

#### 2.3.1 ProcessCard

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-109 | Variants | Default (full info) and Compact |
| UX-110 | Content | Process ID, description, category badge, task count, updated time |
| UX-111 | Icon | Clipboard/process icon in accent color |
| UX-112 | Hover | Border highlight, shadow enhancement |
| UX-113 | Link | Entire card is clickable link to detail page |

#### 2.3.2 SkillCard

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-114 | Content | Skill name, description, tags, capabilities |
| UX-115 | Icon | Lightning bolt icon |
| UX-116 | Variants | Default and Compact |

#### 2.3.3 AgentCard

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-117 | Content | Agent name, role, expertise areas, capabilities |
| UX-118 | Icon | User/person icon |
| UX-119 | Expertise Tags | Badge list of expertise areas |

#### 2.3.4 DomainCard

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-120 | Content | Domain name, description, child count |
| UX-121 | Icon | Folder/hierarchy icon |
| UX-122 | Navigation | Links to domain detail page |

#### 2.3.5 EntityList

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-123 | Layout | Responsive grid with configurable columns |
| UX-124 | Pagination | Integrated pagination controls |
| UX-125 | Empty State | Customizable empty message and action |
| UX-126 | Loading | Skeleton loading with configurable count |
| UX-127 | Render Prop | Custom item renderer function |

#### 2.3.6 FilterPanel

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-128 | Filter Types | Entity type checkboxes, domain dropdown, category dropdown, expertise badges |
| UX-129 | Collapsible | Optional collapse/expand behavior |
| UX-130 | Active Count | Badge showing number of active filters |
| UX-131 | Clear All | Button to reset all filters |
| UX-132 | Sticky | Optional sticky positioning |

#### 2.3.7 SearchBar

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-133 | Icon | Magnifying glass icon |
| UX-134 | Suggestions | Autocomplete dropdown with suggestions |
| UX-135 | Keyboard | Enter to submit, Escape to clear |
| UX-136 | Placeholder | "Search catalog..." text |

#### 2.3.8 SortDropdown

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-137 | Options | Name, Date, Relevance, etc. |
| UX-138 | Direction | Ascending/Descending toggle |

### 2.4 Dashboard Components

#### 2.4.1 MetricCard

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-139 | Content | Title, value, subtitle, icon, trend indicator |
| UX-140 | Animation | Animated counter for numeric values |
| UX-141 | Trend | Up/down/neutral indicator with color coding |
| UX-142 | Link | Optional clickable to detail page |

#### 2.4.2 StatsOverview

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-143 | Content | Total entities, files indexed, last index time, database size |
| UX-144 | Layout | Horizontal row of stats |

#### 2.4.3 BarChart

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-145 | Library | D3.js or Recharts |
| UX-146 | Colors | Steampunk color palette |
| UX-147 | Interaction | Hover tooltips, clickable bars |

#### 2.4.4 PieChart

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-148 | Style | Donut chart with configurable inner/outer radius |
| UX-149 | Labels | Legend with percentages |

#### 2.4.5 TreemapChart

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-150 | Data | Hierarchical domain distribution |
| UX-151 | Colors | Category-based color coding |

#### 2.4.6 RecentActivity

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-152 | Items | List of recent changes with timestamps |
| UX-153 | Type Icons | Different icons for add/update/delete |
| UX-154 | Links | Click to navigate to entity |

#### 2.4.7 QuickLinks

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-155 | Layout | Grid of link cards |
| UX-156 | Content | Icon, title, description, count badge |
| UX-157 | Columns | Configurable (1-4 columns) |

### 2.5 Markdown Components

#### 2.5.1 MarkdownRenderer

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-158 | Parser | react-markdown with remark-gfm |
| UX-159 | Syntax Highlighting | rehype-highlight with GitHub theme |
| UX-160 | Features | Tables, task lists, footnotes, definition lists |
| UX-161 | Heading Anchors | Auto-generated IDs with hover link |

#### 2.5.2 CodeBlock

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-162 | Language Badge | Display detected language |
| UX-163 | Copy Button | One-click copy to clipboard |
| UX-164 | Line Numbers | Optional line number display |
| UX-165 | Filename | Optional filename header |

#### 2.5.3 TableOfContents

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-166 | Generation | Auto-generated from headings |
| UX-167 | Max Depth | Configurable (default: 3 levels) |
| UX-168 | Sticky | Fixed position in sidebar |
| UX-169 | Active Tracking | Highlight current section |

### 2.6 Decorative Components (Steampunk Theme)

#### 2.6.1 GearCluster

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-170 | Animation | Multiple gears rotating at different speeds |
| UX-171 | Variants | Brass, copper, dark color variants |
| UX-172 | Position | Left or right placement |
| UX-173 | Static Variant | Non-animated version available |

#### 2.6.2 BrassPipeBorder

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-174 | Placement | Fixed position on left/right screen edges |
| UX-175 | Elements | Vertical pipe, valve wheels, pressure gauges, T-connectors, gears |
| UX-176 | Gradients | Metallic brass/copper gradients with specular highlights |
| UX-177 | Gauges | Animated pressure and temperature gauges |
| UX-178 | Height | Full viewport height with preserveAspectRatio |

#### 2.6.3 CardCornerFlourish

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-179 | Positions | top-left, top-right, bottom-left, bottom-right |
| UX-180 | Style | Victorian scroll/curl design |
| UX-181 | Size | Configurable (default 28px) |
| UX-182 | Gradient | Brass gradient with highlight |

#### 2.6.4 MechanicalBee

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-183 | Animation | Wing flutter animation |
| UX-184 | Style | Brass/copper mechanical bee |

#### 2.6.5 BotanicalDecor

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-185 | Style | Victorian botanical illustrations |
| UX-186 | Placement | Corner or border decorations |

### 2.7 Common Components

#### 2.7.1 EmptyState

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-187 | Variants | Default, Compact, Card |
| UX-188 | Content | Icon, title, description, primary action, secondary action |
| UX-189 | Presets | NoResults, NoItems, Error, NoPermission |

#### 2.7.2 Tag

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-190 | Style | Small pill with optional remove button |
| UX-191 | Colors | Multiple color variants |

#### 2.7.3 Pagination

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-192 | Features | Page numbers, prev/next, items per page selector |
| UX-193 | Ellipsis | Smart ellipsis for large page counts |
| UX-194 | Info | "Showing X-Y of Z items" text |
| UX-195 | Simple Variant | Prev/Next only with page counter |

#### 2.7.4 ErrorBoundary

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-196 | Fallback UI | Error message, retry button, reload page, go back |
| UX-197 | Dev Info | Stack trace in development mode |
| UX-198 | Variants | ErrorBoundary, PageErrorBoundary, SuspenseErrorBoundary, AsyncBoundary |

---

## 3. Page Layouts

### 3.1 Dashboard Page (`/`)

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-199 | Hero Section | Centered title, subtitle, CTA buttons |
| UX-200 | Stats Row | Overview statistics cards |
| UX-201 | Metrics Grid | 5-column grid of MetricCards |
| UX-202 | Quick Links | 4-column grid of navigation cards |
| UX-203 | Charts | 2-column grid for PieChart and BarChart |
| UX-204 | Treemap | Full-width TreemapChart |
| UX-205 | Activity | Recent activity list |

### 3.2 Catalog List Pages (`/processes`, `/skills`, `/agents`, `/domains`, `/specializations`)

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-206 | Breadcrumb | Navigation path at top |
| UX-207 | Page Header | Title and description |
| UX-208 | Layout | Sidebar (filters) + Main content |
| UX-209 | Sidebar Width | 256px (w-64) |
| UX-210 | Search | SearchBar above entity grid |
| UX-211 | Entity Grid | Responsive card grid (1/2/3 columns) |
| UX-212 | Pagination | Bottom pagination controls |

### 3.3 Entity Detail Pages (`/processes/[id]`, `/skills/[slug]`, `/agents/[slug]`)

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-213 | Breadcrumb | Full path including entity name |
| UX-214 | Header | Title, badges, action buttons |
| UX-215 | Metadata | Key-value metadata display |
| UX-216 | Content | Markdown-rendered description/documentation |
| UX-217 | TOC | Optional table of contents sidebar |
| UX-218 | Related Items | Links to related entities |
| UX-219 | Quick Actions | Copy link, view source, etc. |

### 3.4 Search Page (`/search`)

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-220 | Search Input | Large, prominent search field |
| UX-221 | Filter Chips | Entity type filter toggles |
| UX-222 | Results | Categorized search results |
| UX-223 | Highlighting | Search term highlighting in results |

---

## 4. Navigation and User Flows

### 4.1 Primary Navigation

| ID | Flow | Steps |
|----|------|-------|
| UX-224 | Header Nav | Click nav item -> Navigate to section |
| UX-225 | Sidebar Nav | Expand section -> Click item -> Navigate |
| UX-226 | Breadcrumb | Click parent -> Navigate up hierarchy |

### 4.2 Search Flow

| ID | Step | Description |
|----|------|-------------|
| UX-227 | Initiate | Click search input OR press Ctrl+K |
| UX-228 | Type | Enter search query, see suggestions |
| UX-229 | Submit | Press Enter to search |
| UX-230 | Filter | Toggle entity type filters |
| UX-231 | Select | Click result to view detail |

### 4.3 Browse Flow

| ID | Step | Description |
|----|------|-------------|
| UX-232 | Navigate | Go to catalog section (Processes, Skills, etc.) |
| UX-233 | Filter | Apply sidebar filters |
| UX-234 | Sort | Select sort option |
| UX-235 | Paginate | Navigate through pages |
| UX-236 | Select | Click card to view detail |

### 4.4 Detail View Flow

| ID | Step | Description |
|----|------|-------------|
| UX-237 | View | See full entity details |
| UX-238 | Navigate TOC | Click TOC item to scroll to section |
| UX-239 | Related | Click related item to view it |
| UX-240 | Actions | Copy link, view source code |
| UX-241 | Back | Use breadcrumb or browser back |

---

## 5. Responsive Design

### 5.1 Breakpoints

| ID | Breakpoint | Min Width | Usage |
|----|------------|-----------|-------|
| UX-242 | SM | 640px | Small tablets |
| UX-243 | MD | 768px | Tablets, hide mobile menu |
| UX-244 | LG | 1024px | Desktop, show sidebar |
| UX-245 | XL | 1280px | Wide desktop |
| UX-246 | 2XL | 1536px | Ultra-wide |

### 5.2 Mobile Behavior (< 768px)

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-247 | Header | Logo + hamburger menu, hidden nav links |
| UX-248 | Mobile Menu | Full-screen overlay with nav items |
| UX-249 | Sidebar | Hidden by default, slide-out drawer |
| UX-250 | Cards | Single column grid |
| UX-251 | Search | Full-width in mobile menu |
| UX-252 | Charts | Stacked vertically |
| UX-253 | Pagination | Simplified with fewer page buttons |

### 5.3 Tablet Behavior (768px - 1024px)

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-254 | Header | Show nav links, hide sidebar trigger |
| UX-255 | Sidebar | Hidden on list pages |
| UX-256 | Cards | 2-column grid |
| UX-257 | Charts | 2-column grid |

### 5.4 Desktop Behavior (>= 1024px)

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-258 | Sidebar | Visible, fixed position |
| UX-259 | Cards | 2-3 column grid |
| UX-260 | TOC | Visible in detail pages |
| UX-261 | Pipe Borders | Visible decorative borders |

---

## 6. Loading, Error, and Empty States

### 6.1 Loading States

| ID | Component | Loading Behavior |
|----|-----------|------------------|
| UX-262 | Page Load | Full-page skeleton with structure preview |
| UX-263 | Card Grid | Grid of CardSkeleton placeholders |
| UX-264 | Detail Page | DetailSkeleton with breadcrumb, header, sections |
| UX-265 | Table | TableSkeleton with header and rows |
| UX-266 | List | ListSkeleton with avatar and text lines |
| UX-267 | Inline | Pulse animation on skeleton elements |
| UX-268 | Suspense | React Suspense with fallback components |

### 6.2 Error States

| ID | Error Type | UI Treatment |
|----|------------|--------------|
| UX-269 | Page Error | ErrorFallback card with retry, reload, go back |
| UX-270 | Component Error | Inline error message with retry |
| UX-271 | Network Error | Toast notification + retry option |
| UX-272 | 404 Not Found | Custom not found page |
| UX-273 | Permission Error | NoPermission empty state |

### 6.3 Empty States

| ID | Context | UI Treatment |
|----|---------|--------------|
| UX-274 | No Search Results | NoResults preset with search icon |
| UX-275 | Empty Collection | NoItems preset with box icon |
| UX-276 | No Permissions | NoPermission preset with lock icon |
| UX-277 | Error Loading | Error preset with warning icon |

---

## 7. Animations and Transitions

### 7.1 CSS Transitions

| ID | Property | Duration | Easing | Usage |
|----|----------|----------|--------|-------|
| UX-278 | Colors | 200ms | ease | Hover states, focus states |
| UX-279 | Transform | 200ms | ease-in-out | Sidebar slide, menu open/close |
| UX-280 | Box Shadow | 200ms | ease | Card hover effects |
| UX-281 | Opacity | 150ms | ease | Fade in/out |

### 7.2 Keyframe Animations

| ID | Animation | Description | Duration |
|----|-----------|-------------|----------|
| UX-282 | brass-shimmer | Gradient shimmer effect | 3s linear infinite |
| UX-283 | gear-spin | Clockwise rotation | 2s/4s linear infinite |
| UX-284 | gear-spin-reverse | Counter-clockwise rotation | 2s linear infinite reverse |
| UX-285 | steam-puff | Rising steam effect | 2s ease-out infinite |
| UX-286 | gauge-wobble | Pressure gauge needle wobble | 0.5s ease-in-out infinite |
| UX-287 | brass-pulse | Glow pulse effect | 2s ease-in-out infinite |
| UX-288 | animate-pulse | Skeleton loading pulse | Tailwind default |
| UX-289 | animate-spin | Loading spinner | Tailwind default |

### 7.3 Component Animations

| ID | Component | Animation |
|----|-----------|-----------|
| UX-290 | MetricCard | Animated counter on mount |
| UX-291 | GearCluster | Multiple gears rotating at different speeds |
| UX-292 | Sidebar | Slide in/out on mobile |
| UX-293 | Mobile Menu | Fade overlay + slide menu |
| UX-294 | Card Hover | Shadow expansion, border highlight |
| UX-295 | Button Hover | Background gradient shift |
| UX-296 | Link Hover | Border-bottom reveal, text glow |

### 7.4 Reduced Motion

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-297 | Preference | Respect `prefers-reduced-motion` media query |
| UX-298 | Fallback | Disable all animations when reduced motion preferred |

---

## 8. Accessibility Requirements

### 8.1 Keyboard Navigation

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-299 | Tab Order | Logical tab order through interactive elements |
| UX-300 | Focus Visible | 2px polished brass outline with offset and glow |
| UX-301 | Skip Link | Skip to main content link (hidden until focused) |
| UX-302 | Escape Key | Close modals, menus, dropdowns |
| UX-303 | Enter/Space | Activate buttons, links, checkboxes |
| UX-304 | Arrow Keys | Navigate within menus, pagination |
| UX-305 | Ctrl+K | Open global search |

### 8.2 ARIA Attributes

| ID | Component | ARIA Implementation |
|----|-----------|---------------------|
| UX-306 | Navigation | `role="navigation"`, `aria-label="Main navigation"` |
| UX-307 | Sidebar | `role="complementary"`, section headings |
| UX-308 | Pagination | `role="navigation"`, `aria-label="Pagination"`, `aria-current="page"` |
| UX-309 | Buttons | Descriptive `aria-label` for icon-only buttons |
| UX-310 | Menu Button | `aria-expanded`, `aria-controls` |
| UX-311 | Search | `role="search"`, `aria-label="Search catalog"` |
| UX-312 | Cards | Interactive cards use `role="button"`, `tabIndex="0"` |
| UX-313 | Headings | Proper heading hierarchy (h1 -> h2 -> h3) |
| UX-314 | Images | Descriptive `alt` text |

### 8.3 Color Contrast

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-315 | Text Contrast | Minimum 4.5:1 for body text |
| UX-316 | Large Text | Minimum 3:1 for text >= 18px |
| UX-317 | Interactive | Minimum 3:1 for interactive element boundaries |
| UX-318 | Focus | High contrast focus indicators |

### 8.4 Screen Reader Support

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-319 | Landmarks | Use semantic HTML (header, main, nav, aside, footer) |
| UX-320 | Announcements | Live regions for dynamic content updates |
| UX-321 | Hidden Decorative | `aria-hidden="true"` on decorative SVGs |
| UX-322 | Link Purpose | Links describe destination or action |
| UX-323 | Form Labels | All inputs have associated labels |
| UX-324 | Error Messages | Associate errors with form fields |

### 8.5 Touch Targets

| ID | Requirement | Description |
|----|-------------|-------------|
| UX-325 | Minimum Size | 44x44px minimum for touch targets |
| UX-326 | Spacing | 8px minimum between touch targets |

---

## Appendix A: Component Inventory

### A.1 Component Count Summary

| Category | Count |
|----------|-------|
| Layout Components | 5 |
| UI Components | 6 |
| Catalog Components | 10 |
| Dashboard Components | 7 |
| Markdown Components | 6 |
| Decorative Components | 5 |
| Common Components | 5 |
| **Total** | **44** |

### A.2 Full Component List

**Layout:**
1. Header
2. Footer
3. Sidebar
4. PageContainer
5. Breadcrumb

**UI:**
1. Button
2. Card (CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
3. Badge
4. Input
5. Skeleton
6. Separator

**Catalog:**
1. ProcessCard
2. SkillCard
3. AgentCard
4. DomainCard
5. EntityList
6. FilterPanel
7. SearchBar
8. SortDropdown
9. MetadataDisplay
10. RelatedItems

**Dashboard:**
1. MetricCard
2. StatsOverview
3. BarChart
4. PieChart
5. TreemapChart
6. RecentActivity
7. QuickLinks

**Markdown:**
1. MarkdownRenderer
2. CodeBlock
3. TableOfContents
4. LinkHandler
5. ImageHandler
6. FrontmatterDisplay

**Decorative:**
1. GearCluster
2. BrassPipeBorder
3. CardCornerFlourish
4. MechanicalBee
5. BotanicalDecor

**Common:**
1. EmptyState
2. Tag
3. LoadingSkeleton
4. Pagination
5. ErrorBoundary

---

## Appendix B: Page Inventory

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview with stats and quick links |
| Processes List | `/processes` | Browse process definitions |
| Process Detail | `/processes/[id]` | View process details |
| Skills List | `/skills` | Browse skills catalog |
| Skill Detail | `/skills/[slug]` | View skill details |
| Agents List | `/agents` | Browse agents directory |
| Agent Detail | `/agents/[slug]` | View agent details |
| Domains List | `/domains` | Browse domain hierarchy |
| Domain Detail | `/domains/[slug]` | View domain details |
| Specializations List | `/specializations` | Browse specializations |
| Specialization Detail | `/specializations/[slug]` | View specialization details |
| Search | `/search` | Global search page |

**Total Pages:** 12

---

## Appendix C: User Flow Diagrams

### C.1 Primary User Flows

1. **Search Flow:** Header Search -> Query -> Results -> Filter -> Select -> Detail
2. **Browse Flow:** Nav -> Catalog -> Filter -> Sort -> Paginate -> Select -> Detail
3. **Dashboard Flow:** Dashboard -> Quick Link/Metric -> Catalog -> Detail
4. **Related Navigation:** Detail -> Related Item -> New Detail

### C.2 Key Design System Features

1. **Colors:** 24 custom steampunk color variables
2. **Typography:** 4 font families (Header, Body, Accent, Mono)
3. **Animations:** 8 custom keyframe animations
4. **Shadows:** 5 shadow presets

---

*End of UI/UX Requirements Document*
