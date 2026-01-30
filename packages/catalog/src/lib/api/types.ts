/**
 * API request and response types for the catalog API routes
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

/**
 * Standard pagination metadata returned with list responses
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Common query parameters for list endpoints
 */
export interface ListQueryParams {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// =============================================================================
// SEARCH TYPES
// =============================================================================

/**
 * Search query parameters
 */
export interface SearchQueryParams extends ListQueryParams {
  q: string;
  type?: 'agent' | 'skill' | 'process' | 'domain' | 'specialization';
}

/**
 * Search result item
 */
export interface SearchResultItem {
  type: 'agent' | 'skill' | 'process' | 'domain' | 'specialization';
  id: number;
  name: string;
  description: string;
  path: string;
  score: number;
  highlights?: {
    name?: string;
    description?: string;
    content?: string;
  };
}

/**
 * Search response
 */
export interface SearchResponse {
  results: SearchResultItem[];
}

// =============================================================================
// PROCESS TYPES
// =============================================================================

/**
 * Process query parameters
 */
export interface ProcessQueryParams extends ListQueryParams {
  category?: string;
}

/**
 * Process list item (summary)
 */
export interface ProcessListItem {
  id: number;
  processId: string;
  description: string;
  category: string | null;
  filePath: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Process task detail
 */
export interface ProcessTask {
  id: string;
  type: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Process input/output
 */
export interface ProcessIO {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
}

/**
 * Full process detail
 */
export interface ProcessDetail extends ProcessListItem {
  inputs: ProcessIO[];
  outputs: ProcessIO[];
  tasks: ProcessTask[];
  frontmatter: Record<string, unknown>;
}

// =============================================================================
// DOMAIN TYPES
// =============================================================================

/**
 * Domain list item
 */
export interface DomainListItem {
  id: number;
  name: string;
  path: string;
  category: string | null;
  specializationCount: number;
  agentCount: number;
  skillCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Specialization summary for domain detail
 */
export interface SpecializationSummary {
  id: number;
  name: string;
  path: string;
  agentCount: number;
  skillCount: number;
}

/**
 * Full domain detail with specializations
 */
export interface DomainDetail extends DomainListItem {
  readmePath: string | null;
  referencesPath: string | null;
  specializations: SpecializationSummary[];
}

// =============================================================================
// SPECIALIZATION TYPES
// =============================================================================

/**
 * Specialization query parameters
 */
export interface SpecializationQueryParams extends ListQueryParams {
  domain?: string;
}

/**
 * Specialization list item
 */
export interface SpecializationListItem {
  id: number;
  name: string;
  path: string;
  domainId: number | null;
  domainName: string | null;
  agentCount: number;
  skillCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Agent summary for specialization detail
 */
export interface AgentSummary {
  id: number;
  name: string;
  description: string;
  role: string | null;
}

/**
 * Skill summary for specialization detail
 */
export interface SkillSummary {
  id: number;
  name: string;
  description: string;
}

/**
 * Full specialization detail
 */
export interface SpecializationDetail extends SpecializationListItem {
  readmePath: string | null;
  referencesPath: string | null;
  agents: AgentSummary[];
  skills: SkillSummary[];
}

// =============================================================================
// SKILL TYPES
// =============================================================================

/**
 * Skill query parameters
 */
export interface SkillQueryParams extends ListQueryParams {
  specialization?: string;
  domain?: string;
  category?: string;
}

/**
 * Skill list item
 */
export interface SkillListItem {
  id: number;
  name: string;
  description: string;
  filePath: string;
  directory: string;
  specializationId: number | null;
  specializationName: string | null;
  domainId: number | null;
  domainName: string | null;
  allowedTools: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Full skill detail
 */
export interface SkillDetail extends SkillListItem {
  content: string;
  frontmatter: Record<string, unknown>;
}

// =============================================================================
// AGENT TYPES
// =============================================================================

/**
 * Agent query parameters
 */
export interface AgentQueryParams extends ListQueryParams {
  specialization?: string;
  domain?: string;
  expertise?: string;
}

/**
 * Agent list item
 */
export interface AgentListItem {
  id: number;
  name: string;
  description: string;
  filePath: string;
  directory: string;
  role: string | null;
  expertise: string[];
  specializationId: number | null;
  specializationName: string | null;
  domainId: number | null;
  domainName: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Full agent detail
 */
export interface AgentDetail extends AgentListItem {
  content: string;
  frontmatter: Record<string, unknown>;
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

/**
 * Entity distribution
 */
export interface EntityDistribution {
  name: string;
  count: number;
}

/**
 * Recent activity item
 */
export interface RecentActivityItem {
  type: 'agent' | 'skill' | 'process' | 'domain' | 'specialization';
  id: number;
  name: string;
  updatedAt: string;
}

/**
 * Analytics dashboard response
 */
export interface AnalyticsResponse {
  counts: {
    domains: number;
    specializations: number;
    agents: number;
    skills: number;
    processes: number;
    total: number;
  };
  distributions: {
    byDomain: EntityDistribution[];
    byCategory: EntityDistribution[];
    byType: EntityDistribution[];
  };
  recentActivity: RecentActivityItem[];
  databaseSize: number;
  lastIndexedAt: string | null;
}

// =============================================================================
// REINDEX TYPES
// =============================================================================

/**
 * Reindex request body
 */
export interface ReindexRequest {
  force?: boolean;
}

/**
 * Reindex response
 */
export interface ReindexResponse {
  success: boolean;
  statistics: {
    domainsIndexed: number;
    specializationsIndexed: number;
    agentsIndexed: number;
    skillsIndexed: number;
    processesIndexed: number;
    filesProcessed: number;
    errors: number;
    duration: number;
  };
  errors: Array<{ file: string; error: string }>;
}
