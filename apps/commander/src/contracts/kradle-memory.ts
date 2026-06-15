/**
 * Mirrored kradle memory contracts (SPEC-V2 §V2-3 "the Company Brain").
 *
 * Faithful mirror of:
 *   - `packages/kradle/core/docs/agents/memory-ontology-schema-spec.md`
 *     (graph YAML schema: nodeKind/id/attributes/edges; node-kind and
 *     edge-kind vocabularies — mirrored verbatim)
 *   - `packages/kradle/core/docs/agents/crd-schema-spec.md`
 *     (AgentMemoryRepository / AgentMemorySource / AgentMemoryQuery /
 *     AgentMemoryUpdate resource specs)
 *   - `packages/kradle/sdk` `queryGraph()` result shapes
 *     (`{ matches: [{ record, score, edges }], totalMatches }`)
 *
 * UI-only metadata (graph layout positions, glyph badges, silo tints) stays
 * OUT of these mirrored types and lives in the game layer keyed by record id.
 */

import type { KradleResource, KradleResourceStatus } from './kradle-resources';

// ---------------------------------------------------------------------------
// Ontology vocabularies (memory-ontology-schema-spec.md — verbatim)
// ---------------------------------------------------------------------------

/** Initial node kinds (ontology spec "Initial node kinds" table). */
export const MEMORY_NODE_KINDS = [
  'Organization',
  'Team',
  'Repository',
  'Service',
  'Package',
  'Runbook',
  'Decision',
  'Incident',
  'AgentPractice',
  'Skill',
  'Tool',
  'Customer',
  'ProductArea',
  'Term',
  'PromptFragment',
] as const;
export type MemoryNodeKind = (typeof MEMORY_NODE_KINDS)[number];

/** Initial edge kinds (ontology spec "Initial edge kinds" table). */
export const MEMORY_EDGE_KINDS = [
  'documents',
  'implements',
  'depends_on',
  'supersedes',
  'owned_by',
  'applies_to_repo',
  'applies_to_stack',
  'mentions',
  'derived_from',
  'requires_secret',
  'requires_config',
  'safe_for_trigger',
  'resolved_by',
] as const;
export type MemoryEdgeKind = (typeof MEMORY_EDGE_KINDS)[number];

/** Record lifecycle status (`attributes.status`). */
export type GraphRecordStatus = 'draft' | 'approved' | 'deprecated' | 'archived';

// ---------------------------------------------------------------------------
// Graph record (graph/**/*.yaml — Atlas-style nodeKind/id/attributes/edges)
// ---------------------------------------------------------------------------

export interface GraphRecordAttributes {
  /** Display name (required). */
  title: string;
  /** Lifecycle status (required). */
  status: GraphRecordStatus;
  /** One or more teams/users (required), e.g. `team:platform`. */
  owners: string[];
  summary?: string;
  tags?: string[];
  /** ISO timestamp (required by the ontology spec). */
  updatedAt: string;
}

/** One outgoing edge target. */
export interface GraphRecordEdgeTarget {
  /** Stable prefixed id of the target node, e.g. `repository:kradle`. */
  target: string;
}

export interface GraphRecord {
  /** Ontology kind name. */
  nodeKind: MemoryNodeKind;
  /** Stable prefixed ID (immutable), e.g. `runbook:ci-playwright-flake`. */
  id: string;
  attributes: GraphRecordAttributes;
  /** Edge map: edge kind -> target list. */
  edges?: Partial<Record<MemoryEdgeKind, GraphRecordEdgeTarget[]>>;
}

// ---------------------------------------------------------------------------
// AgentMemoryRepository — a memory silo (CONFIG_KINDS)
// ---------------------------------------------------------------------------

export interface AgentMemoryRepositorySpec {
  /** Required: backing git repository identity. */
  repositoryRef: string;
  /** Required: branch holding the authoritative memory tree. */
  defaultBranch: string;
  /** Required: file layout profile (graph/, runbooks/, notes/, ...). */
  layoutProfile: string;
}

export interface AgentMemoryRepositoryStatusFields {
  /** Short sha of the last indexed memory commit. */
  currentCommit?: string;
  /** Digest of the derived index for the current commit. */
  indexDigest?: string;
}

export type AgentMemoryRepository = Omit<
  KradleResource<'AgentMemoryRepository', AgentMemoryRepositorySpec>,
  'status'
> & { status: KradleResourceStatus & AgentMemoryRepositoryStatusFields };

// ---------------------------------------------------------------------------
// AgentMemorySource — silo scoping (CONFIG_KINDS)
// ---------------------------------------------------------------------------

export interface AgentMemorySourceSpec {
  /** Required: the AgentMemoryRepository this source scopes. */
  repositoryRef: string;
  /** Required: which repositories/teams the silo applies to. */
  appliesTo: {
    repositories: string[];
    teams: string[];
  };
  /** Required: what content the silo exposes. */
  include: {
    graphKinds: MemoryNodeKind[];
    paths: string[];
  };
  maxContextBytes?: number;
}

export type AgentMemorySource = KradleResource<'AgentMemorySource', AgentMemorySourceSpec>;

// ---------------------------------------------------------------------------
// AgentMemoryQuery — a REQUEST for memory pieces (AGGREGATED_KINDS)
// ---------------------------------------------------------------------------

export type MemoryQueryMode = 'graph-only' | 'grep-only' | 'graph-and-grep';

export interface AgentMemoryQuerySpec {
  /** Required: snapshot the query runs against. */
  snapshotRef: string;
  /** Required: who is asking. */
  requester: {
    kind: string;
    name: string;
  };
  /** Required: the query itself. */
  query: {
    text: string;
    modes: MemoryQueryMode[];
    graph?: {
      kinds: MemoryNodeKind[];
      edgeDepth: number;
    };
    grep?: {
      paths: string[];
      maxMatches: number;
    };
  };
}

export type AgentMemoryQuery = KradleResource<'AgentMemoryQuery', AgentMemoryQuerySpec>;

// ---------------------------------------------------------------------------
// queryGraph() result shapes (kradle SDK)
// ---------------------------------------------------------------------------

export interface GraphQueryMatch {
  record: GraphRecord;
  score: number;
  /** Edges traversed to reach/justify the match. */
  edges: Array<{ kind: MemoryEdgeKind; source: string; target: string }>;
}

export interface GraphQueryResult {
  matches: GraphQueryMatch[];
  totalMatches: number;
}

// ---------------------------------------------------------------------------
// AgentMemoryUpdate — SENDING pieces back (AGGREGATED_KINDS)
// ---------------------------------------------------------------------------

export interface AgentMemoryUpdateSpec {
  /** Required: target memory repository (silo). */
  memoryRepository: string;
  /** Required: the dispatch run proposing the update. */
  sourceRun: string;
  updateKind: 'proposed-pr';
  baseCommit: string;
  branchName: string;
  /** Required: proposed file changes. */
  changes: Array<{
    path: string;
    action: 'add' | 'modify' | 'delete';
    reason: string;
  }>;
  validationPolicy?: string;
}

export interface AgentMemoryUpdateStatusFields {
  diffDigest?: string;
  pullRequestRef?: string;
}

export type AgentMemoryUpdate = Omit<
  KradleResource<'AgentMemoryUpdate', AgentMemoryUpdateSpec>,
  'status'
> & { status: KradleResourceStatus & AgentMemoryUpdateStatusFields };
