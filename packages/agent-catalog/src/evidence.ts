import fs from "node:fs";
import path from "node:path";
import { resolveCatalogEvidenceAssetPath } from "./assets";
import { buildClaimsByEvidence, getEvidenceClaimStatement } from "./evidence-projection";
import { getCatalogGraph } from "./graph";
import { effectiveTransportMuxClaimStatus, effectiveTransportMuxUnresolvedGaps } from "./transport-mux-cutover";
import type {
  ClaimConfidence,
  ClaimEvidenceStrength,
  ClaimProvenanceKind,
  ClaimRecord,
  EvidenceRecord,
  GraphNode,
  OntologyEvidenceExport,
  OntologyEvidenceManifest,
  OntologyEvidenceSearchResult,
  OntologyEvidenceShard,
  OntologyEvidenceShardDescriptor,
  SubjectProvenance,
} from "./models";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function evidenceRoot(): string {
  return path.dirname(resolveCatalogEvidenceAssetPath("ontology-evidence", "manifest.json"));
}

function readJson<T>(filePath: string): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read JSON asset ${filePath}: ${reason}`);
  }
}

function manifestPath(): string {
  return path.join(evidenceRoot(), "manifest.json");
}

function valueAsString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function claimConfidence(value: unknown): ClaimConfidence {
  const normalized = valueAsString(value);
  return normalized === "high" || normalized === "medium" ? normalized : "low";
}

function claimProvenanceKind(value: unknown): ClaimProvenanceKind {
  const normalized = valueAsString(value);
  if (normalized === "repo-observation" || normalized === "vendor-documentation") {
    return normalized;
  }
  return "vendor-inference";
}

function claimEvidenceStrength(value: unknown): ClaimEvidenceStrength {
  const normalized = valueAsString(value);
  if (normalized === "corroborated" || normalized === "partial") {
    return normalized;
  }
  return "inferred";
}

function loadManifest(): OntologyEvidenceManifest {
  return readJson<OntologyEvidenceManifest>(manifestPath());
}

function loadShard<TEntry extends GraphNode>(descriptor: OntologyEvidenceShardDescriptor): OntologyEvidenceShard<TEntry> {
  return readJson<OntologyEvidenceShard<TEntry>>(path.join(evidenceRoot(), descriptor.relativePath));
}

function loadEvidenceNodes(manifest: OntologyEvidenceManifest): GraphNode[] {
  return manifest.shards
    .filter((descriptor) => descriptor.entryKind === "evidence-sources")
    .flatMap((descriptor) => loadShard<GraphNode>(descriptor).entries);
}

function loadClaimNodes(manifest: OntologyEvidenceManifest): GraphNode[] {
  return manifest.shards
    .filter((descriptor) => descriptor.entryKind === "claims")
    .flatMap((descriptor) => loadShard<GraphNode>(descriptor).entries);
}

interface EvidenceState {
  manifest: OntologyEvidenceManifest;
  evidenceSourceNodes: GraphNode[];
  claimNodes: GraphNode[];
  claimsById: Map<string, GraphNode>;
  evidenceById: Map<string, GraphNode>;
  claimsBySubject: Map<string, GraphNode[]>;
  claimsByEvidence: Map<string, GraphNode[]>;
}

let cachedEvidenceState: EvidenceState | undefined;

function buildEvidenceState(): EvidenceState {
  try {
    const manifest = loadManifest();
    const evidenceSourceNodes = loadEvidenceNodes(manifest);
    const claimNodes = loadClaimNodes(manifest);
    const graph = getCatalogGraph();
    const claimsById = new Map(claimNodes.map((node) => [valueAsString(node.claimId), node] as const));
    const evidenceById = new Map(evidenceSourceNodes.map((node) => [valueAsString(node.evidenceId), node] as const));
    const claimNodeByGraphId = new Map(claimNodes.map((node) => [valueAsString(node.id), node] as const));
    const claimsBySubject = new Map<string, GraphNode[]>();
    const claimsByEvidence = buildClaimsByEvidence(claimNodes, evidenceSourceNodes, graph.edges);

    for (const edge of graph.edges) {
      if (edge.relation !== "supported_by_claim") {
        continue;
      }
      const claimNode = claimNodeByGraphId.get(edge.to);
      if (!claimNode) {
        continue;
      }
      const subjectBucket = claimsBySubject.get(edge.from);
      if (subjectBucket) {
        subjectBucket.push(claimNode);
      } else {
        claimsBySubject.set(edge.from, [claimNode]);
      }
    }

    return {
      manifest,
      evidenceSourceNodes,
      claimNodes,
      claimsById,
      evidenceById,
      claimsBySubject,
      claimsByEvidence,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to load ontology evidence assets for @a5c-ai/agent-catalog. Ensure evidence/ontology-evidence/manifest.json and referenced shards are packaged and valid JSON. Cause: ${reason}`,
    );
  }
}

function getEvidenceState(): EvidenceState {
  if (!cachedEvidenceState) {
    cachedEvidenceState = buildEvidenceState();
  }
  return cachedEvidenceState;
}

function toClaimRecord(node: GraphNode): ClaimRecord {
  const evidenceIds = stringArray(node.evidenceIds);
  return {
    claimId: valueAsString(node.claimId),
    statement: valueAsString(node.statement),
    subjectKind: valueAsString(node.subjectKind),
    subjectId: valueAsString(node.subjectId),
    confidence: claimConfidence(node.confidence),
    status: effectiveTransportMuxClaimStatus(valueAsString(node.status), evidenceIds),
    provenanceKind: claimProvenanceKind(node.provenanceKind),
    evidenceStrength: claimEvidenceStrength(node.evidenceStrength),
    evidenceIds,
    unresolvedGaps: effectiveTransportMuxUnresolvedGaps(stringArray(node.unresolvedGaps), evidenceIds),
  };
}

function toEvidenceRecord(node: GraphNode): EvidenceRecord {
  const evidenceState = getEvidenceState();
  const evidenceId = valueAsString(node.evidenceId);
  const freshnessWindowDays =
    typeof node.freshnessWindowDays === "number" && Number.isFinite(node.freshnessWindowDays)
      ? node.freshnessWindowDays
      : undefined;
  return {
    evidenceId,
    kind: valueAsString(node.kindLabel) === "web" ? "web" : "repo",
    sourcePathOrUrl: valueAsString(node.sourcePathOrUrl),
    excerptLocator: valueAsString(node.locator),
    claim: getEvidenceClaimStatement(evidenceId, evidenceState.claimsByEvidence),
    capturedAt: valueAsString(node.capturedAt),
    trustLevel: valueAsString(node.trustLevel),
    reviewOwner: valueAsString(node.reviewOwner),
    reviewedAt: valueAsString(node.reviewedAt),
    freshnessWindowDays,
  };
}

function searchTextMatches(node: GraphNode, normalizedQuery: string, fields: string[]): boolean {
  return fields.some((field) => valueAsString(node[field]).toLowerCase().includes(normalizedQuery));
}

export function getOntologyEvidenceManifest(): OntologyEvidenceManifest {
  return clone(getEvidenceState().manifest);
}

export function getOntologyEvidenceSnapshot(): OntologyEvidenceExport {
  const evidenceState = getEvidenceState();
  return {
    generatedAt: evidenceState.manifest.generatedAt,
    manifest: clone(evidenceState.manifest),
    evidenceSources: clone(evidenceState.evidenceSourceNodes),
    claims: clone(evidenceState.claimNodes),
  };
}

export function listOntologyEvidenceSources(): EvidenceRecord[] {
  return getEvidenceState().evidenceSourceNodes.map(toEvidenceRecord).map(clone);
}

export function getOntologyEvidenceSource(evidenceId: string): EvidenceRecord | undefined {
  const node = getEvidenceState().evidenceById.get(evidenceId);
  return node ? clone(toEvidenceRecord(node)) : undefined;
}

export function listOntologyClaims(): ClaimRecord[] {
  return getEvidenceState().claimNodes.map(toClaimRecord).map(clone);
}

export function getOntologyClaim(claimId: string): ClaimRecord | undefined {
  const node = getEvidenceState().claimsById.get(claimId);
  return node ? clone(toClaimRecord(node)) : undefined;
}

export function listClaimsForSubject(subjectId: string): ClaimRecord[] {
  return (getEvidenceState().claimsBySubject.get(subjectId) ?? []).map(toClaimRecord).map(clone);
}

export function listClaimsForEvidence(evidenceId: string): ClaimRecord[] {
  return (getEvidenceState().claimsByEvidence.get(evidenceId) ?? []).map(toClaimRecord).map(clone);
}

export function listEvidenceForSubject(subjectId: string): EvidenceRecord[] {
  const evidenceIds = new Set(listClaimsForSubject(subjectId).flatMap((claim) => claim.evidenceIds));
  return [...evidenceIds]
    .map((evidenceId) => getOntologyEvidenceSource(evidenceId))
    .filter((record): record is EvidenceRecord => Boolean(record));
}

export function getSubjectProvenance(subjectId: string): SubjectProvenance {
  return {
    subjectId,
    claims: listClaimsForSubject(subjectId),
    evidence: listEvidenceForSubject(subjectId),
  };
}

export function searchOntologyEvidence(query: string): OntologyEvidenceSearchResult {
  const evidenceState = getEvidenceState();
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return { query, evidence: [], claims: [] };
  }

  return {
    query,
    evidence: evidenceState.evidenceSourceNodes.filter((node) =>
      searchTextMatches(node, normalizedQuery, ["evidenceId", "sourcePathOrUrl", "locator", "kindLabel"]),
    )
      .map(toEvidenceRecord)
      .map(clone),
    claims: evidenceState.claimNodes.filter((node) =>
      searchTextMatches(node, normalizedQuery, ["claimId", "statement", "subjectId", "subjectKind", "confidence", "status"]),
    )
      .map(toClaimRecord)
      .map(clone),
  };
}
