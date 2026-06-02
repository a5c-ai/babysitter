/**
 * Process recommender types for the L6 Agent-Platform.
 *
 * Mirrors the catalog's CatalogDiscoveryProcess shape in a
 * platform-level descriptor that is registry-friendly and
 * scoring-friendly, without coupling to the catalog layer.
 */

export interface ProcessDescriptor {
  /** Unique identifier for the process (e.g. "dev/code-review"). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Free-text description of what the process does. */
  description: string;
  /** Optional category grouping (e.g. "dev", "ops"). */
  category?: string;
  /** Optional domain the process belongs to (e.g. "frontend", "security"). */
  domain?: string;
  /** Task identifiers contained in the process. */
  tasks?: string[];
  /** Named inputs the process expects. */
  inputs?: string[];
  /** Named outputs the process produces. */
  outputs?: string[];
  /** Optional 0-1 quality score assigned by external evaluators. */
  qualityScore?: number;
}

export interface RecommendationCriteria {
  /** Natural-language description of the task the user wants to accomplish. */
  taskDescription: string;
  /** Optional repo or project context string for additional relevance signals. */
  repoContext?: string;
  /** Optional domain to boost matching processes. */
  domain?: string;
  /** Optional capability keywords the process should cover. */
  capabilities?: string[];
  /** Maximum number of results to return (default: 5). */
  maxResults?: number;
}

export interface ProcessRecommendation {
  /** The matched process descriptor. */
  process: ProcessDescriptor;
  /** Computed relevance score (higher is better). */
  score: number;
  /** Human-readable reasons that contributed to the score. */
  reasons: string[];
}
