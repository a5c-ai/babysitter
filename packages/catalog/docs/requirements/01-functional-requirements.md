# Functional Requirements Document
# Process Library Catalog

**Document Version:** 1.0
**Last Updated:** 2026-01-26
**Status:** Derived from Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Dashboard Module](#2-dashboard-module)
3. [Search Module](#3-search-module)
4. [Process Catalog Module](#4-process-catalog-module)
5. [Skills Catalog Module](#5-skills-catalog-module)
6. [Agents Directory Module](#6-agents-directory-module)
7. [Domains Browser Module](#7-domains-browser-module)
8. [Specializations Browser Module](#8-specializations-browser-module)
9. [Navigation and Layout Module](#9-navigation-and-layout-module)
10. [Data Management Module](#10-data-management-module)
11. [API Module](#11-api-module)
12. [Cross-Cutting Requirements](#12-cross-cutting-requirements)
13. [Dependencies and Traceability](#13-dependencies-and-traceability)

---

## 1. Overview

### 1.1 Purpose

The Process Library Catalog is a web application that provides a browsable, searchable interface for exploring process definitions, agents, skills, domains, and specializations within the Babysitter automation framework. The application enables users to discover, understand, and navigate the various components available for building intelligent automation workflows.

### 1.2 Scope

This document captures all functional requirements derived from the existing implementation of the Process Library Catalog application. Requirements are organized by feature module and include user stories, acceptance criteria, and priority classifications.

### 1.3 Definitions

| Term | Definition |
|------|------------|
| Process | A workflow definition containing tasks, inputs, and outputs |
| Agent | A specialized entity for task execution with specific expertise |
| Skill | A reusable capability module that can be invoked by agents |
| Domain | A high-level knowledge area (e.g., Science, Engineering) |
| Specialization | A sub-category within a domain (e.g., Machine Learning within Computer Science) |
| Entity | Generic term for any catalog item (process, agent, skill, domain, specialization) |

---

## 2. Dashboard Module

### FR-001: Dashboard Overview Display

**Description:** The system shall display a dashboard homepage that provides an overview of the entire catalog with key metrics and navigation options.

**User Story:** As a user, I want to see an overview of the catalog contents when I first visit the application, so that I can quickly understand what's available and navigate to relevant sections.

**Acceptance Criteria:**
- AC-001.1: Display a hero section with application title "Process Library Catalog" and description
- AC-001.2: Show a "Browse Catalog" primary call-to-action button linking to /processes
- AC-001.3: Show a "Search" secondary call-to-action button linking to /search
- AC-001.4: Display the Babysitter Framework badge

**Priority:** High
**Dependencies:** FR-038 (Analytics API)

---

### FR-002: Metric Cards Display

**Description:** The system shall display metric cards showing counts for each entity type in the catalog.

**User Story:** As a user, I want to see the total counts of processes, domains, specializations, skills, and agents, so that I can understand the scope of the catalog.

**Acceptance Criteria:**
- AC-002.1: Display a metric card for Processes with count and "Process definitions" subtitle
- AC-002.2: Display a metric card for Domains with count and "Knowledge domains" subtitle
- AC-002.3: Display a metric card for Specializations with count and "Domain specializations" subtitle
- AC-002.4: Display a metric card for Skills with count and "Reusable skill modules" subtitle
- AC-002.5: Display a metric card for Agents with count and "Specialized agents" subtitle
- AC-002.6: Each metric card shall be clickable and navigate to the corresponding catalog section
- AC-002.7: Display "--" when count data is unavailable

**Priority:** High
**Dependencies:** FR-038 (Analytics API)

---

### FR-003: Statistics Overview

**Description:** The system shall display an overview bar showing total entities, files indexed, last index time, and database size.

**User Story:** As a user, I want to see system statistics about the catalog, so that I can understand how current the data is.

**Acceptance Criteria:**
- AC-003.1: Display total number of entities in the catalog
- AC-003.2: Display total files indexed (sum of processes, agents, and skills)
- AC-003.3: Display the last indexing timestamp
- AC-003.4: Display the database size

**Priority:** Medium
**Dependencies:** FR-038 (Analytics API)

---

### FR-004: Quick Links Navigation

**Description:** The system shall provide quick link cards for navigating to main catalog sections.

**User Story:** As a user, I want quick access cards to main sections with descriptions and entity counts, so that I can quickly navigate to areas of interest.

**Acceptance Criteria:**
- AC-004.1: Display "Browse Processes" quick link with description and process count
- AC-004.2: Display "Explore Domains" quick link with description and domain count
- AC-004.3: Display "Skills Catalog" quick link with description and skill count
- AC-004.4: Display "Agents Directory" quick link with description and agent count
- AC-004.5: Each quick link shall have a distinctive color-coded icon
- AC-004.6: Quick links shall be displayed in a 4-column grid layout

**Priority:** Medium
**Dependencies:** FR-038 (Analytics API)

---

### FR-005: Distribution Charts

**Description:** The system shall display visual charts showing the distribution of entities across different dimensions.

**User Story:** As a user, I want to see visual representations of how entities are distributed, so that I can understand the catalog composition at a glance.

**Acceptance Criteria:**
- AC-005.1: Display a pie chart showing distribution by entity type (agents, skills, processes, domains, specializations)
- AC-005.2: Display a bar chart showing processes by category/methodology with clickable bars linking to filtered views
- AC-005.3: Display a treemap chart showing agents by domain
- AC-005.4: Charts shall be responsive and scale appropriately

**Priority:** Medium
**Dependencies:** FR-038 (Analytics API)

---

### FR-006: Recent Activity Feed

**Description:** The system shall display a feed of recently modified or added entities.

**User Story:** As a user, I want to see recent additions and modifications to the catalog, so that I can stay informed about new content.

**Acceptance Criteria:**
- AC-006.1: Display up to 10 most recently updated entities
- AC-006.2: Show entity type icon with color coding (agents=amber, skills=green, processes=blue, domains=purple, specializations=pink)
- AC-006.3: Show entity name and action type (created/updated)
- AC-006.4: Show relative timestamp (e.g., "2h ago", "3d ago")
- AC-006.5: Each activity item shall be clickable and navigate to the entity detail page
- AC-006.6: Display "No recent activity" message when no data available

**Priority:** Medium
**Dependencies:** FR-038 (Analytics API)

---

## 3. Search Module

### FR-007: Global Search Interface

**Description:** The system shall provide a dedicated search page with full-text search capabilities across all entity types.

**User Story:** As a user, I want to search across all processes, skills, agents, and domains from a single interface, so that I can quickly find relevant content.

**Acceptance Criteria:**
- AC-007.1: Display a search input field with placeholder text "Search..."
- AC-007.2: Support Enter key to submit search
- AC-007.3: Display a clear button when search query is present
- AC-007.4: Persist search query in URL as ?q= parameter
- AC-007.5: Perform search automatically when navigating to page with ?q= parameter
- AC-007.6: Display loading skeletons while search is in progress

**Priority:** High
**Dependencies:** FR-037 (Search API)

---

### FR-008: Search Type Filtering

**Description:** The system shall allow users to filter search results by entity type.

**User Story:** As a user, I want to filter search results by type (processes, skills, agents, domains, specializations), so that I can narrow down results to a specific category.

**Acceptance Criteria:**
- AC-008.1: Provide a type dropdown with options: All Types, Processes, Skills, Agents, Domains, Specializations
- AC-008.2: Display filter button pills for quick type selection
- AC-008.3: Highlight the currently selected filter
- AC-008.4: Update results immediately when type filter changes
- AC-008.5: Persist type filter in URL as ?type= parameter

**Priority:** High
**Dependencies:** FR-007 (Global Search Interface), FR-037 (Search API)

---

### FR-009: Search Results Display

**Description:** The system shall display search results in an organized, grouped format.

**User Story:** As a user, I want to see search results organized by type with clear visual distinction, so that I can quickly scan and find relevant items.

**Acceptance Criteria:**
- AC-009.1: Group results by entity type when "All Types" is selected
- AC-009.2: Display section headers with type name and result count
- AC-009.3: Display results in a responsive 3-column grid
- AC-009.4: Each result card shall show entity name, type badge, and description
- AC-009.5: Highlight matching text in search results with visual marker
- AC-009.6: Each result card shall be clickable and navigate to entity detail page
- AC-009.7: Display "No results found" message when search returns empty
- AC-009.8: Display "Start searching" prompt when no search has been performed

**Priority:** High
**Dependencies:** FR-007 (Global Search Interface), FR-037 (Search API)

---

### FR-010: Active Filters Display

**Description:** The system shall display active search filters with the ability to clear them.

**User Story:** As a user, I want to see what filters are currently applied and easily remove them, so that I can adjust my search criteria.

**Acceptance Criteria:**
- AC-010.1: Display "Active Filters:" label when filters are active
- AC-010.2: Show search query as a removable tag with "boost: 'query'" format
- AC-010.3: Provide individual clear button for each active filter
- AC-010.4: Provide "Clear all" button to reset all filters

**Priority:** Medium
**Dependencies:** FR-007 (Global Search Interface), FR-008 (Search Type Filtering)

---

## 4. Process Catalog Module

### FR-011: Process Listing Page

**Description:** The system shall provide a dedicated page for browsing all process definitions.

**User Story:** As a user, I want to browse all available process definitions, so that I can discover processes relevant to my needs.

**Acceptance Criteria:**
- AC-011.1: Display page title "Processes" with description
- AC-011.2: Display breadcrumb navigation showing Home > Processes
- AC-011.3: Display processes in a paginated grid layout (2 columns on large screens)
- AC-011.4: Show loading skeletons while data is being fetched
- AC-011.5: Display "No processes found" message when list is empty

**Priority:** High
**Dependencies:** FR-033 (Processes API)

---

### FR-012: Process Card Display

**Description:** The system shall display process information in card format on listing pages.

**User Story:** As a user, I want to see key process information at a glance in a card format, so that I can quickly identify relevant processes.

**Acceptance Criteria:**
- AC-012.1: Display process ID as card title
- AC-012.2: Display process description (truncated if long)
- AC-012.3: Display category badge if available
- AC-012.4: Display task count indicator
- AC-012.5: Card shall be clickable and navigate to process detail page

**Priority:** High
**Dependencies:** FR-011 (Process Listing Page)

---

### FR-013: Process Category Filtering

**Description:** The system shall allow filtering processes by category.

**User Story:** As a user, I want to filter processes by category, so that I can find processes of a specific methodology.

**Acceptance Criteria:**
- AC-013.1: Display filter panel in sidebar with category dropdown
- AC-013.2: Populate category options from available process categories
- AC-013.3: Update process list when category filter changes
- AC-013.4: Persist category filter in URL as ?category= parameter
- AC-013.5: Provide "Clear All" button to reset filters

**Priority:** Medium
**Dependencies:** FR-011 (Process Listing Page)

---

### FR-014: Process Detail Page

**Description:** The system shall display a detailed view of a single process definition.

**User Story:** As a user, I want to view complete details of a process including its inputs, outputs, and tasks, so that I can understand how to use it.

**Acceptance Criteria:**
- AC-014.1: Display process ID as page title with icon
- AC-014.2: Display process description
- AC-014.3: Display category badge and task count badge
- AC-014.4: Display breadcrumb navigation showing Home > Processes > [Process ID]
- AC-014.5: Display 404 page when process is not found

**Priority:** High
**Dependencies:** FR-033 (Processes API)

---

### FR-015: Process Inputs Table

**Description:** The system shall display a table of process inputs on the detail page.

**User Story:** As a user, I want to see all inputs required by a process with their types and requirements, so that I know what data to provide.

**Acceptance Criteria:**
- AC-015.1: Display "Inputs" section heading
- AC-015.2: Show table with columns: Name, Type, Required, Description
- AC-015.3: Highlight required inputs with "Required" badge
- AC-015.4: Show "Optional" badge for non-required inputs
- AC-015.5: Display input names in monospace font
- AC-015.6: Section shall be hidden if process has no inputs

**Priority:** High
**Dependencies:** FR-014 (Process Detail Page)

---

### FR-016: Process Outputs Table

**Description:** The system shall display a table of process outputs on the detail page.

**User Story:** As a user, I want to see all outputs produced by a process, so that I know what data to expect.

**Acceptance Criteria:**
- AC-016.1: Display "Outputs" section heading
- AC-016.2: Show table with columns: Name, Type, Description
- AC-016.3: Display output names in monospace font
- AC-016.4: Section shall be hidden if process has no outputs

**Priority:** High
**Dependencies:** FR-014 (Process Detail Page)

---

### FR-017: Process Tasks Display

**Description:** The system shall display an expandable list of tasks within a process.

**User Story:** As a user, I want to view the individual tasks that make up a process, so that I can understand the workflow steps.

**Acceptance Criteria:**
- AC-017.1: Display "Tasks" section heading with task count
- AC-017.2: Provide "Expand All" and "Collapse All" buttons
- AC-017.3: Display each task with type badge and task ID
- AC-017.4: Show task description if available
- AC-017.5: Allow clicking on task to expand/collapse details
- AC-017.6: Display full task JSON in expanded view

**Priority:** Medium
**Dependencies:** FR-014 (Process Detail Page)

---

### FR-018: Process Metadata Display

**Description:** The system shall display process frontmatter/metadata on the detail page.

**User Story:** As a user, I want to see additional metadata associated with a process, so that I can understand its context and attributes.

**Acceptance Criteria:**
- AC-018.1: Display "Metadata" section heading
- AC-018.2: Display frontmatter data in key-value format
- AC-018.3: Section shall be hidden if process has no frontmatter

**Priority:** Low
**Dependencies:** FR-014 (Process Detail Page)

---

### FR-019: Related Processes Display

**Description:** The system shall display related processes on the detail page.

**User Story:** As a user, I want to discover other processes in the same category, so that I can explore related workflows.

**Acceptance Criteria:**
- AC-019.1: Display "Related Processes" section heading
- AC-019.2: Show up to 4 related processes from the same category
- AC-019.3: Exclude the current process from related items
- AC-019.4: Each related process shall be clickable and navigate to its detail page
- AC-019.5: Section shall be hidden if no related processes exist

**Priority:** Low
**Dependencies:** FR-014 (Process Detail Page)

---

## 5. Skills Catalog Module

### FR-020: Skills Listing Page

**Description:** The system shall provide a dedicated page for browsing all skills.

**User Story:** As a user, I want to browse all available skills, so that I can discover reusable capabilities for my workflows.

**Acceptance Criteria:**
- AC-020.1: Display page title "Skills" with description
- AC-020.2: Display breadcrumb navigation showing Home > Skills
- AC-020.3: Display skills in a paginated grid layout (3 columns on large screens)
- AC-020.4: Show loading skeletons while data is being fetched
- AC-020.5: Display "No skills found" message when list is empty

**Priority:** High
**Dependencies:** FR-034 (Skills API)

---

### FR-021: Skill Card Display

**Description:** The system shall display skill information in card format on listing pages.

**User Story:** As a user, I want to see key skill information at a glance, so that I can quickly identify relevant skills.

**Acceptance Criteria:**
- AC-021.1: Display skill name as card title
- AC-021.2: Display skill description (truncated if long)
- AC-021.3: Display domain/specialization badges if available
- AC-021.4: Card shall be clickable and navigate to skill detail page

**Priority:** High
**Dependencies:** FR-020 (Skills Listing Page)

---

### FR-022: Skill Domain Filtering

**Description:** The system shall allow filtering skills by domain.

**User Story:** As a user, I want to filter skills by domain, so that I can find skills in a specific knowledge area.

**Acceptance Criteria:**
- AC-022.1: Display filter panel in sidebar with domain dropdown
- AC-022.2: Populate domain options from available domains
- AC-022.3: Update skill list when domain filter changes
- AC-022.4: Persist domain filter in URL as ?domain= parameter

**Priority:** Medium
**Dependencies:** FR-020 (Skills Listing Page)

---

### FR-023: Skill Detail Page

**Description:** The system shall display a detailed view of a single skill.

**User Story:** As a user, I want to view complete details of a skill including its content and metadata, so that I can understand how to use it.

**Acceptance Criteria:**
- AC-023.1: Display skill name as page title with icon
- AC-023.2: Display skill description
- AC-023.3: Display domain and specialization tags with links
- AC-023.4: Display breadcrumb navigation showing Home > Skills > [Domain] > [Specialization] > [Skill Name]
- AC-023.5: Render skill markdown content with proper formatting
- AC-023.6: Display 404 page when skill is not found

**Priority:** High
**Dependencies:** FR-034 (Skills API)

---

### FR-024: Related Skills Display

**Description:** The system shall display related skills on the skill detail page.

**User Story:** As a user, I want to discover other skills in the same specialization or domain, so that I can explore related capabilities.

**Acceptance Criteria:**
- AC-024.1: Display "Related Skills" section
- AC-024.2: Show up to 5 related skills from same specialization (or domain if no specialization)
- AC-024.3: Exclude current skill from related items
- AC-024.4: Each related skill shall be clickable

**Priority:** Low
**Dependencies:** FR-023 (Skill Detail Page)

---

## 6. Agents Directory Module

### FR-025: Agents Listing Page

**Description:** The system shall provide a dedicated page for browsing all agents.

**User Story:** As a user, I want to browse all available agents, so that I can discover specialized agents for my tasks.

**Acceptance Criteria:**
- AC-025.1: Display page title "Agents" with description
- AC-025.2: Display breadcrumb navigation showing Home > Agents
- AC-025.3: Display agents in a paginated grid layout (3 columns on large screens)
- AC-025.4: Show loading skeletons while data is being fetched
- AC-025.5: Display "No agents found" message when list is empty

**Priority:** High
**Dependencies:** FR-035 (Agents API)

---

### FR-026: Agent Card Display

**Description:** The system shall display agent information in card format on listing pages.

**User Story:** As a user, I want to see key agent information at a glance, so that I can quickly identify relevant agents.

**Acceptance Criteria:**
- AC-026.1: Display agent name as card title
- AC-026.2: Display agent role if available
- AC-026.3: Display agent description (truncated if long)
- AC-026.4: Display expertise tags
- AC-026.5: Card shall be clickable and navigate to agent detail page

**Priority:** High
**Dependencies:** FR-025 (Agents Listing Page)

---

### FR-027: Agent Filtering

**Description:** The system shall allow filtering agents by domain and expertise.

**User Story:** As a user, I want to filter agents by domain and expertise, so that I can find agents with specific capabilities.

**Acceptance Criteria:**
- AC-027.1: Display filter panel with domain dropdown
- AC-027.2: Display expertise multi-select with tag badges
- AC-027.3: Update agent list when filters change
- AC-027.4: Persist filters in URL as ?domain= and ?expertise= parameters
- AC-027.5: Display up to 20 expertise options

**Priority:** Medium
**Dependencies:** FR-025 (Agents Listing Page)

---

### FR-028: Agent Detail Page

**Description:** The system shall display a detailed view of a single agent.

**User Story:** As a user, I want to view complete details of an agent including its content and expertise, so that I can understand its capabilities.

**Acceptance Criteria:**
- AC-028.1: Display agent name as page title with icon
- AC-028.2: Display agent role and description
- AC-028.3: Display domain and specialization tags with links
- AC-028.4: Display expertise list
- AC-028.5: Display breadcrumb navigation showing Home > Agents > [Domain] > [Specialization] > [Agent Name]
- AC-028.6: Render agent markdown content with proper formatting
- AC-028.7: Display 404 page when agent is not found

**Priority:** High
**Dependencies:** FR-035 (Agents API)

---

### FR-029: Related Agents Display

**Description:** The system shall display related agents on the agent detail page.

**User Story:** As a user, I want to discover other agents in the same specialization or domain, so that I can explore alternatives.

**Acceptance Criteria:**
- AC-029.1: Display "Related Agents" section
- AC-029.2: Show up to 5 related agents from same specialization (or domain)
- AC-029.3: Exclude current agent from related items
- AC-029.4: Each related agent shall display name, role, and description

**Priority:** Low
**Dependencies:** FR-028 (Agent Detail Page)

---

## 7. Domains Browser Module

### FR-030: Domains Overview Page

**Description:** The system shall provide a dedicated page for browsing all domains with their hierarchy.

**User Story:** As a user, I want to explore the hierarchical structure of knowledge domains, so that I can understand how the catalog is organized.

**Acceptance Criteria:**
- AC-030.1: Display page title "Domains" with description
- AC-030.2: Display breadcrumb navigation showing Home > Domains
- AC-030.3: Display statistics cards showing: total domains, total specializations, total skills, total agents
- AC-030.4: Display interactive tree view of domain hierarchy
- AC-030.5: Display list of domain cards
- AC-030.6: Show loading skeletons while data is being fetched

**Priority:** High
**Dependencies:** FR-036 (Domains API)

---

### FR-031: Domain Hierarchy Tree View

**Description:** The system shall display an interactive tree view of the domain hierarchy.

**User Story:** As a user, I want to see a visual tree of domains and their specializations, so that I can navigate the hierarchy.

**Acceptance Criteria:**
- AC-031.1: Display domains as expandable tree nodes
- AC-031.2: Display specializations as child nodes under domains
- AC-031.3: Show count badges for each node (skills + agents)
- AC-031.4: Provide "Expand all" and "Collapse all" controls
- AC-031.5: First 3 domains shall be expanded by default
- AC-031.6: Each node shall be clickable and navigate to detail page

**Priority:** Medium
**Dependencies:** FR-030 (Domains Overview Page)

---

### FR-032: Domain Detail Page

**Description:** The system shall display a detailed view of a single domain.

**User Story:** As a user, I want to view complete details of a domain including its specializations, so that I can explore its contents.

**Acceptance Criteria:**
- AC-032.1: Display domain name as page title with icon
- AC-032.2: Display category badge if available
- AC-032.3: Display breadcrumb navigation showing Home > Domains > [Domain Name]
- AC-032.4: Display statistics cards: specialization count, skill count, agent count
- AC-032.5: Display list of specializations within the domain as clickable cards
- AC-032.6: Show skill count and agent count for each specialization
- AC-032.7: Display file information: path and last updated date
- AC-032.8: Display 404 page when domain is not found

**Priority:** High
**Dependencies:** FR-036 (Domains API)

---

## 8. Specializations Browser Module

### FR-033: Specializations Listing Page

**Description:** The system shall provide a dedicated page for browsing all specializations.

**User Story:** As a user, I want to browse all specializations across domains, so that I can discover focused areas of expertise.

**Acceptance Criteria:**
- AC-033.1: Display page title "Specializations" with description
- AC-033.2: Display breadcrumb navigation showing Home > Specializations
- AC-033.3: Display specializations in a paginated grid layout (3 columns)
- AC-033.4: Show loading skeletons while data is being fetched
- AC-033.5: Display "No specializations found" message when list is empty

**Priority:** High
**Dependencies:** FR-039 (Specializations API)

---

### FR-034: Specialization Card Display

**Description:** The system shall display specialization information in card format.

**User Story:** As a user, I want to see key specialization information at a glance, so that I can quickly identify areas of interest.

**Acceptance Criteria:**
- AC-034.1: Display specialization name as card title
- AC-034.2: Display parent domain badge with link
- AC-034.3: Display skill count and agent count
- AC-034.4: Card shall be clickable and navigate to detail page

**Priority:** High
**Dependencies:** FR-033 (Specializations Listing Page)

---

### FR-035: Specialization Domain Filtering

**Description:** The system shall allow filtering specializations by domain.

**User Story:** As a user, I want to filter specializations by domain, so that I can focus on a specific knowledge area.

**Acceptance Criteria:**
- AC-035.1: Display filter panel with domain dropdown
- AC-035.2: Update specialization list when domain filter changes
- AC-035.3: Persist filter in URL as ?domain= parameter

**Priority:** Medium
**Dependencies:** FR-033 (Specializations Listing Page)

---

### FR-036: Specialization Detail Page

**Description:** The system shall display a detailed view of a single specialization.

**User Story:** As a user, I want to view complete details of a specialization including its skills and agents, so that I can explore its contents.

**Acceptance Criteria:**
- AC-036.1: Display specialization name as page title with icon
- AC-036.2: Display parent domain tag with link
- AC-036.3: Display breadcrumb navigation showing Home > Specializations > [Specialization Name]
- AC-036.4: Display statistics cards: skill count, agent count
- AC-036.5: Display two-column layout with skills list and agents list
- AC-036.6: Each skill/agent item shall be clickable and show description
- AC-036.7: Display file information: path and last updated date
- AC-036.8: Display 404 page when specialization is not found

**Priority:** High
**Dependencies:** FR-039 (Specializations API)

---

## 9. Navigation and Layout Module

### FR-037: Header Navigation

**Description:** The system shall provide a persistent header with navigation links.

**User Story:** As a user, I want a consistent header navigation across all pages, so that I can easily navigate between sections.

**Acceptance Criteria:**
- AC-037.1: Display application logo and title "Babysitter Catalog"
- AC-037.2: Display navigation links: Dashboard, Processes, Skills, Agents, Domains
- AC-037.3: Highlight current active navigation item
- AC-037.4: Header shall be sticky and remain visible when scrolling
- AC-037.5: Apply blur effect to header background
- AC-037.6: Display GitHub link with icon

**Priority:** High
**Dependencies:** None

---

### FR-038: Header Search

**Description:** The system shall provide a search input in the header for quick access.

**User Story:** As a user, I want to quickly search from any page using the header search, so that I don't have to navigate to the search page first.

**Acceptance Criteria:**
- AC-038.1: Display search input in header on desktop
- AC-038.2: Display keyboard shortcut hint (Ctrl+K)
- AC-038.3: Focus search input when Ctrl+K is pressed
- AC-038.4: Navigate to search page with query when Enter is pressed
- AC-038.5: Search input shall be hidden on mobile (available in mobile menu)

**Priority:** High
**Dependencies:** FR-037 (Header Navigation)

---

### FR-039: Mobile Navigation

**Description:** The system shall provide mobile-friendly navigation.

**User Story:** As a mobile user, I want to access navigation through a hamburger menu, so that I can navigate on smaller screens.

**Acceptance Criteria:**
- AC-039.1: Display hamburger menu button on mobile screens
- AC-039.2: Open expandable menu when hamburger button is clicked
- AC-039.3: Display all navigation links in mobile menu
- AC-039.4: Include search input in mobile menu
- AC-039.5: Close menu when a navigation link is clicked

**Priority:** High
**Dependencies:** FR-037 (Header Navigation)

---

### FR-040: Breadcrumb Navigation

**Description:** The system shall display breadcrumb navigation on all detail and listing pages.

**User Story:** As a user, I want to see my current location in the hierarchy and navigate to parent sections, so that I can orient myself and move up the hierarchy.

**Acceptance Criteria:**
- AC-040.1: Display breadcrumb trail showing navigation path
- AC-040.2: Each breadcrumb item except the last shall be clickable
- AC-040.3: Home link shall always be first item
- AC-040.4: Current page shall be displayed as non-clickable last item

**Priority:** Medium
**Dependencies:** None

---

### FR-041: Footer Display

**Description:** The system shall display a consistent footer across all pages.

**User Story:** As a user, I want to see footer information on all pages for additional context and links.

**Acceptance Criteria:**
- AC-041.1: Display footer at the bottom of all pages
- AC-041.2: Footer shall include relevant links or information

**Priority:** Low
**Dependencies:** None

---

### FR-042: Page Container Layout

**Description:** The system shall provide consistent page container styling across all pages.

**User Story:** As a user, I want consistent page layouts, so that the application feels cohesive.

**Acceptance Criteria:**
- AC-042.1: Apply consistent max-width container to all pages
- AC-042.2: Apply consistent padding and margins
- AC-042.3: Support responsive layouts for different screen sizes

**Priority:** Medium
**Dependencies:** None

---

## 10. Data Management Module

### FR-043: Pagination

**Description:** The system shall provide pagination for all listing pages.

**User Story:** As a user, I want to navigate through large lists of items using pagination, so that I can browse efficiently.

**Acceptance Criteria:**
- AC-043.1: Display page numbers with current page highlighted
- AC-043.2: Display previous and next navigation buttons
- AC-043.3: Display ellipsis for skipped page ranges
- AC-043.4: Display "Showing X-Y of Z items" count
- AC-043.5: Persist current page in URL as ?page= parameter
- AC-043.6: Disable previous button on first page
- AC-043.7: Disable next button on last page

**Priority:** High
**Dependencies:** None

---

### FR-044: Items Per Page Selection

**Description:** The system shall allow users to select the number of items displayed per page.

**User Story:** As a user, I want to control how many items I see per page, so that I can customize my browsing experience.

**Acceptance Criteria:**
- AC-044.1: Display items per page dropdown
- AC-044.2: Provide options: 10, 25, 50, 100 per page
- AC-044.3: Reset to page 1 when items per page changes
- AC-044.4: Default to 12 items per page

**Priority:** Medium
**Dependencies:** FR-043 (Pagination)

---

### FR-045: Loading States

**Description:** The system shall display loading indicators during data fetching.

**User Story:** As a user, I want to see loading indicators, so that I know the system is working on my request.

**Acceptance Criteria:**
- AC-045.1: Display skeleton cards while list data is loading
- AC-045.2: Display skeleton components matching the expected content layout
- AC-045.3: Skeleton count shall match the expected number of items

**Priority:** High
**Dependencies:** None

---

### FR-046: Empty States

**Description:** The system shall display appropriate messages when no data is available.

**User Story:** As a user, I want clear feedback when there are no results, so that I understand the situation.

**Acceptance Criteria:**
- AC-046.1: Display "No [entity type] found" message when list is empty
- AC-046.2: Display helpful description suggesting filter adjustment
- AC-046.3: Use consistent empty state styling across all pages

**Priority:** Medium
**Dependencies:** None

---

### FR-047: Error Handling

**Description:** The system shall handle errors gracefully and display appropriate messages.

**User Story:** As a user, I want to see helpful error messages when something goes wrong, so that I understand what happened.

**Acceptance Criteria:**
- AC-047.1: Display 404 page when resource is not found
- AC-047.2: Log errors to console for debugging
- AC-047.3: Continue displaying UI even when some data fails to load

**Priority:** High
**Dependencies:** None

---

## 11. API Module

### FR-048: Search API

**Description:** The system shall provide an API endpoint for full-text search across all entities.

**Endpoint:** GET /api/search

**User Story:** As a developer, I want an API endpoint for searching the catalog, so that the frontend can retrieve search results.

**Acceptance Criteria:**
- AC-048.1: Accept required query parameter: q (search query)
- AC-048.2: Accept optional parameter: type (filter by entity type)
- AC-048.3: Accept optional parameters: limit, offset (pagination)
- AC-048.4: Return results with: type, id, name, description, path, score, highlights
- AC-048.5: Return paginated response with total count
- AC-048.6: Return 400 error if q parameter is missing
- AC-048.7: Support searching across: agents, skills, processes, domains, specializations

**Priority:** High
**Dependencies:** None

---

### FR-049: Processes API

**Description:** The system shall provide API endpoints for process data.

**Endpoints:**
- GET /api/processes - List processes
- GET /api/processes/[id] - Get process detail

**User Story:** As a developer, I want API endpoints for process data, so that the frontend can display process information.

**Acceptance Criteria:**
- AC-049.1: List endpoint shall accept: limit, offset, category parameters
- AC-049.2: List endpoint shall return process list with: id, processId, description, category, taskCount
- AC-049.3: Detail endpoint shall return full process with: inputs, outputs, tasks, frontmatter
- AC-049.4: Return 404 for non-existent process
- AC-049.5: Return paginated response with total count

**Priority:** High
**Dependencies:** None

---

### FR-050: Skills API

**Description:** The system shall provide API endpoints for skill data.

**Endpoints:**
- GET /api/skills - List skills
- GET /api/skills/[slug] - Get skill detail

**User Story:** As a developer, I want API endpoints for skill data, so that the frontend can display skill information.

**Acceptance Criteria:**
- AC-050.1: List endpoint shall accept: limit, offset, domain, specialization parameters
- AC-050.2: List endpoint shall return skill list with: id, name, description, domainName, specializationName
- AC-050.3: Detail endpoint shall return full skill with: content, frontmatter, allowedTools
- AC-050.4: Return 404 for non-existent skill
- AC-050.5: Return paginated response with total count

**Priority:** High
**Dependencies:** None

---

### FR-051: Agents API

**Description:** The system shall provide API endpoints for agent data.

**Endpoints:**
- GET /api/agents - List agents
- GET /api/agents/[slug] - Get agent detail

**User Story:** As a developer, I want API endpoints for agent data, so that the frontend can display agent information.

**Acceptance Criteria:**
- AC-051.1: List endpoint shall accept: limit, offset, domain, specialization, expertise parameters
- AC-051.2: List endpoint shall return agent list with: id, name, description, role, expertise, domainName
- AC-051.3: Detail endpoint shall return full agent with: content, frontmatter
- AC-051.4: Return 404 for non-existent agent
- AC-051.5: Return paginated response with total count

**Priority:** High
**Dependencies:** None

---

### FR-052: Domains API

**Description:** The system shall provide API endpoints for domain data.

**Endpoints:**
- GET /api/domains - List domains
- GET /api/domains/[slug] - Get domain detail

**User Story:** As a developer, I want API endpoints for domain data, so that the frontend can display domain information.

**Acceptance Criteria:**
- AC-052.1: List endpoint shall accept: limit, offset parameters
- AC-052.2: List endpoint shall return domain list with: id, name, path, specializationCount, skillCount, agentCount
- AC-052.3: Detail endpoint shall return full domain with: specializations list
- AC-052.4: Return 404 for non-existent domain
- AC-052.5: Return paginated response with total count

**Priority:** High
**Dependencies:** None

---

### FR-053: Specializations API

**Description:** The system shall provide API endpoints for specialization data.

**Endpoints:**
- GET /api/specializations - List specializations
- GET /api/specializations/[slug] - Get specialization detail

**User Story:** As a developer, I want API endpoints for specialization data, so that the frontend can display specialization information.

**Acceptance Criteria:**
- AC-053.1: List endpoint shall accept: limit, offset, domain parameters
- AC-053.2: List endpoint shall return specialization list with: id, name, domainId, domainName, skillCount, agentCount
- AC-053.3: Detail endpoint shall return full specialization with: skills list, agents list
- AC-053.4: Return 404 for non-existent specialization
- AC-053.5: Return paginated response with total count

**Priority:** High
**Dependencies:** None

---

### FR-054: Analytics API

**Description:** The system shall provide an API endpoint for dashboard analytics data.

**Endpoint:** GET /api/analytics

**User Story:** As a developer, I want an API endpoint for analytics data, so that the dashboard can display metrics and statistics.

**Acceptance Criteria:**
- AC-054.1: Return counts for: domains, specializations, agents, skills, processes, total
- AC-054.2: Return distribution data: byDomain, byCategory, byType
- AC-054.3: Return recent activity items (up to 20 most recent)
- AC-054.4: Return database size and last indexed timestamp

**Priority:** Medium
**Dependencies:** None

---

### FR-055: Reindex API

**Description:** The system shall provide an API endpoint to trigger database reindexing.

**Endpoint:** POST /api/reindex, GET /api/reindex

**User Story:** As an administrator, I want to trigger a database reindex, so that the catalog reflects the latest file changes.

**Acceptance Criteria:**
- AC-055.1: Accept optional body parameter: force (boolean)
- AC-055.2: Run incremental index by default
- AC-055.3: Run full index when force=true
- AC-055.4: Return statistics: domains/specializations/agents/skills/processes indexed, files processed, errors, duration
- AC-055.5: Return list of errors with file path and error message
- AC-055.6: Support GET method for simple trigger (testing)

**Priority:** Low
**Dependencies:** None

---

## 12. Cross-Cutting Requirements

### FR-056: Quick Actions

**Description:** The system shall provide quick action buttons on detail pages for common operations.

**User Story:** As a user, I want quick access to common actions on detail pages, so that I can efficiently interact with entities.

**Acceptance Criteria:**
- AC-056.1: Display "Copy ID" button that copies entity identifier to clipboard
- AC-056.2: Show confirmation message "Copied!" after successful copy
- AC-056.3: Display "View Raw" button that opens raw file in new tab
- AC-056.4: Display "Open in GitHub" button that opens file on GitHub
- AC-056.5: Buttons shall be grouped in horizontal layout

**Priority:** Medium
**Dependencies:** None

---

### FR-057: Markdown Rendering

**Description:** The system shall render markdown content with full formatting support.

**User Story:** As a user, I want to see properly formatted markdown content, so that documentation is readable.

**Acceptance Criteria:**
- AC-057.1: Support GitHub Flavored Markdown (tables, task lists, etc.)
- AC-057.2: Apply syntax highlighting to code blocks
- AC-057.3: Add anchor links to headings for navigation
- AC-057.4: Style tables with proper borders and alternating rows
- AC-057.5: Style blockquotes with left border and background
- AC-057.6: Support image rendering with optional lightbox
- AC-057.7: Handle internal and external links appropriately
- AC-057.8: Support optional table of contents sidebar

**Priority:** Medium
**Dependencies:** None

---

### FR-058: Responsive Design

**Description:** The system shall be responsive and work across different screen sizes.

**User Story:** As a user, I want to use the application on various devices, so that I can access it anywhere.

**Acceptance Criteria:**
- AC-058.1: Support desktop screens (large: 3 columns, medium: 2 columns)
- AC-058.2: Support tablet screens (2 columns)
- AC-058.3: Support mobile screens (1 column, hamburger menu)
- AC-058.4: Filter panels shall collapse on mobile
- AC-058.5: Tables shall be horizontally scrollable on small screens

**Priority:** High
**Dependencies:** None

---

### FR-059: URL State Persistence

**Description:** The system shall persist filter and pagination state in the URL.

**User Story:** As a user, I want my filters and page position preserved in the URL, so that I can share links and use browser navigation.

**Acceptance Criteria:**
- AC-059.1: Search query shall be persisted as ?q= parameter
- AC-059.2: Type filter shall be persisted as ?type= parameter
- AC-059.3: Category filter shall be persisted as ?category= parameter
- AC-059.4: Domain filter shall be persisted as ?domain= parameter
- AC-059.5: Page number shall be persisted as ?page= parameter
- AC-059.6: Application shall restore state from URL on page load

**Priority:** Medium
**Dependencies:** None

---

### FR-060: Keyboard Shortcuts

**Description:** The system shall support keyboard shortcuts for common actions.

**User Story:** As a power user, I want keyboard shortcuts for quick navigation, so that I can work more efficiently.

**Acceptance Criteria:**
- AC-060.1: Ctrl+K (Cmd+K on Mac) shall focus the header search input
- AC-060.2: Enter key in search input shall submit search

**Priority:** Low
**Dependencies:** FR-038 (Header Search)

---

### FR-061: Steampunk Visual Theme

**Description:** The system shall feature a distinctive steampunk visual design on the search page.

**User Story:** As a user, I want a visually distinctive interface, so that the application has a memorable aesthetic.

**Acceptance Criteria:**
- AC-061.1: Search page shall display elaborate steampunk header with brass pipes, gauges, valves, and gears
- AC-061.2: Search result cards shall feature brass pipe borders and decorative elements
- AC-061.3: Use serif fonts (Playfair Display, Georgia) for headings
- AC-061.4: Apply brass/copper color palette for decorative elements
- AC-061.5: Include paper texture overlays on cards

**Priority:** Low
**Dependencies:** None

---

### FR-062: SEO and Metadata

**Description:** The system shall provide appropriate metadata for SEO and social sharing.

**User Story:** As a user, I want pages to have proper titles and descriptions, so that they are discoverable and sharable.

**Acceptance Criteria:**
- AC-062.1: Set page titles dynamically based on content (e.g., "[Process ID] - Process Catalog")
- AC-062.2: Set meta descriptions for detail pages
- AC-062.3: Include OpenGraph metadata for social sharing
- AC-062.4: Include relevant keywords in root metadata

**Priority:** Medium
**Dependencies:** None

---

## 13. Dependencies and Traceability

### 13.1 Requirement Dependencies Matrix

| Requirement | Depends On |
|-------------|------------|
| FR-001 | FR-054 |
| FR-002 | FR-054 |
| FR-003 | FR-054 |
| FR-004 | FR-054 |
| FR-005 | FR-054 |
| FR-006 | FR-054 |
| FR-007 | FR-048 |
| FR-008 | FR-007, FR-048 |
| FR-009 | FR-007, FR-048 |
| FR-010 | FR-007, FR-008 |
| FR-011 | FR-049 |
| FR-012 | FR-011 |
| FR-013 | FR-011 |
| FR-014 | FR-049 |
| FR-015 | FR-014 |
| FR-016 | FR-014 |
| FR-017 | FR-014 |
| FR-018 | FR-014 |
| FR-019 | FR-014 |
| FR-020 | FR-050 |
| FR-021 | FR-020 |
| FR-022 | FR-020 |
| FR-023 | FR-050 |
| FR-024 | FR-023 |
| FR-025 | FR-051 |
| FR-026 | FR-025 |
| FR-027 | FR-025 |
| FR-028 | FR-051 |
| FR-029 | FR-028 |
| FR-030 | FR-052 |
| FR-031 | FR-030 |
| FR-032 | FR-052 |
| FR-033 | FR-053 |
| FR-034 | FR-033 |
| FR-035 | FR-033 |
| FR-036 | FR-053 |
| FR-038 | FR-037 |
| FR-039 | FR-037 |
| FR-044 | FR-043 |
| FR-060 | FR-038 |

### 13.2 Module to Component Mapping

| Module | Source Files |
|--------|-------------|
| Dashboard | src/app/page.tsx, src/components/dashboard/* |
| Search | src/app/search/page.tsx |
| Processes | src/app/processes/*, src/components/catalog/EntityCard/ProcessCard.tsx, src/components/catalog/DetailView/ProcessDetail.tsx |
| Skills | src/app/skills/*, src/components/catalog/EntityCard/SkillCard.tsx, src/components/catalog/DetailView/SkillDetail.tsx |
| Agents | src/app/agents/*, src/components/catalog/EntityCard/AgentCard.tsx, src/components/catalog/DetailView/AgentDetail.tsx |
| Domains | src/app/domains/*, src/components/catalog/EntityCard/DomainCard.tsx |
| Specializations | src/app/specializations/* |
| Navigation | src/components/layout/Header.tsx, src/components/layout/Sidebar.tsx, src/components/layout/Breadcrumb.tsx |
| API | src/app/api/* |

### 13.3 Priority Summary

| Priority | Count | Requirements |
|----------|-------|--------------|
| High | 28 | FR-001, FR-002, FR-007, FR-008, FR-009, FR-011, FR-012, FR-014, FR-015, FR-016, FR-020, FR-021, FR-023, FR-025, FR-026, FR-028, FR-030, FR-032, FR-033, FR-034, FR-036, FR-037, FR-038, FR-039, FR-043, FR-045, FR-047, FR-048-053, FR-058 |
| Medium | 22 | FR-003, FR-004, FR-005, FR-006, FR-010, FR-013, FR-017, FR-022, FR-027, FR-031, FR-035, FR-040, FR-042, FR-044, FR-046, FR-054, FR-056, FR-057, FR-059, FR-062 |
| Low | 12 | FR-018, FR-019, FR-024, FR-029, FR-041, FR-055, FR-060, FR-061 |

---

*Document generated from implementation analysis of the Process Library Catalog codebase.*
