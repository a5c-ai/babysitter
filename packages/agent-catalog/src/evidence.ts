import fs from "node:fs";
import path from "node:path";
import { getCatalogGraph } from "./graph";
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

function findExistingRoot(relativeCheckPath: string): string {
  const candidates = [
    (() => {
      try {
        return path.dirname(require.resolve("@a5c-ai/agent-catalog/package.json"));
      } catch {
        return undefined;
      }
    })(),
    path.resolve(process.cwd(), "node_modules", "@a5c-ai", "agent-catalog"),
    path.resolve(process.cwd(), "..", "agent-catalog"),
    path.resolve(process.cwd(), "..", "..", "packages", "agent-catalog"),
    path.resolve(__dirname, ".."),
  ].filter((candidate): candidate is string => Boolean(candidate));

  const match = candidates.find((candidate) => fs.existsSync(path.join(candidate, relativeCheckPath)));
  return match ?? path.resolve(__dirname, "..");
}

function packageRoot(): string {
  return findExistingRoot(path.join("evidence", "ontology-evidence", "manifest.json"));
}

function evidenceRoot(): string {
  return path.join(packageRoot(), "evidence", "ontology-evidence");
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
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

const MANIFEST = loadManifest();
const EVIDENCE_SOURCE_NODES = loadEvidenceNodes(MANIFEST);
const CLAIM_NODES = loadClaimNodes(MANIFEST);
const GRAPH = getCatalogGraph();

const CLAIMS_BY_ID = new Map(CLAIM_NODES.map((node) => [valueAsString(node.claimId), node] as const));
const EVIDENCE_BY_ID = new Map(EVIDENCE_SOURCE_NODES.map((node) => [valueAsString(node.evidenceId), node] as const));
const CLAIM_NODE_BY_GRAPH_ID = new Map(CLAIM_NODES.map((node) => [valueAsString(node.id), node] as const));
const EVIDENCE_NODE_BY_GRAPH_ID = new Map(EVIDENCE_SOURCE_NODES.map((node) => [valueAsString(node.id), node] as const));

const CLAIMS_BY_SUBJECT = new Map<string, GraphNode[]>();
const CLAIMS_BY_EVIDENCE = new Map<string, GraphNode[]>();

for (const edge of GRAPH.edges) {
  if (edge.relation === "supported_by_claim") {
    const claimNode = CLAIM_NODE_BY_GRAPH_ID.get(edge.to);
    if (!claimNode) {
      continue;
    }
    const subjectBucket = CLAIMS_BY_SUBJECT.get(edge.from);
    if (subjectBucket) {
      subjectBucket.push(claimNode);
    } else {
      CLAIMS_BY_SUBJECT.set(edge.from, [claimNode]);
    }
    continue;
  }

  if (edge.relation === "sourced_from") {
    const claimNode = CLAIM_NODE_BY_GRAPH_ID.get(edge.from);
    const evidenceNode = EVIDENCE_NODE_BY_GRAPH_ID.get(edge.to);
    if (!claimNode || !evidenceNode) {
      continue;
    }
    const evidenceId = valueAsString(evidenceNode.evidenceId);
    const evidenceBucket = CLAIMS_BY_EVIDENCE.get(evidenceId);
    if (evidenceBucket) {
      evidenceBucket.push(claimNode);
    } else {
      CLAIMS_BY_EVIDENCE.set(evidenceId, [claimNode]);
    }
  }
}

function toClaimRecord(node: GraphNode): ClaimRecord {
  return {
    claimId: valueAsString(node.claimId),
    statement: valueAsString(node.statement),
    subjectKind: valueAsString(node.subjectKind),
    subjectId: valueAsString(node.subjectId),
    confidence: claimConfidence(node.confidence),
    status: valueAsString(node.status),
    provenanceKind: claimProvenanceKind(node.provenanceKind),
    evidenceStrength: claimEvidenceStrength(node.evidenceStrength),
    evidenceIds: stringArray(node.evidenceIds),
    unresolvedGaps: stringArray(node.unresolvedGaps),
  };
}

function toEvidenceRecord(node: GraphNode): EvidenceRecord {
  const evidenceId = valueAsString(node.evidenceId);
  const supportingClaims = CLAIMS_BY_EVIDENCE.get(evidenceId) ?? [];
  return {
    evidenceId,
    kind: valueAsString(node.kindLabel) === "web" ? "web" : "repo",
    sourcePathOrUrl: valueAsString(node.sourcePathOrUrl),
    excerptLocator: valueAsString(node.locator),
    claim: valueAsString(supportingClaims[0]?.statement),
    capturedAt: valueAsString(node.capturedAt),
  };
}

function searchTextMatches(node: GraphNode, normalizedQuery: string, fields: string[]): boolean {
  return fields.some((field) => valueAsString(node[field]).toLowerCase().includes(normalizedQuery));
}

export function getOntologyEvidenceManifest(): OntologyEvidenceManifest {
  return clone(MANIFEST);
}

export function getOntologyEvidenceSnapshot(): OntologyEvidenceExport {
  return {
    generatedAt: MANIFEST.generatedAt,
    manifest: clone(MANIFEST),
    evidenceSources: clone(EVIDENCE_SOURCE_NODES),
    claims: clone(CLAIM_NODES),
  };
}

export function listOntologyEvidenceSources(): EvidenceRecord[] {
  return EVIDENCE_SOURCE_NODES.map(toEvidenceRecord).map(clone);
}

export function getOntologyEvidenceSource(evidenceId: string): EvidenceRecord | undefined {
  const node = EVIDENCE_BY_ID.get(evidenceId);
  return node ? clone(toEvidenceRecord(node)) : undefined;
}

export function listOntologyClaims(): ClaimRecord[] {
  return CLAIM_NODES.map(toClaimRecord).map(clone);
}

export function getOntologyClaim(claimId: string): ClaimRecord | undefined {
  const node = CLAIMS_BY_ID.get(claimId);
  return node ? clone(toClaimRecord(node)) : undefined;
}

export function listClaimsForSubject(subjectId: string): ClaimRecord[] {
  return (CLAIMS_BY_SUBJECT.get(subjectId) ?? []).map(toClaimRecord).map(clone);
}

export function listClaimsForEvidence(evidenceId: string): ClaimRecord[] {
  return (CLAIMS_BY_EVIDENCE.get(evidenceId) ?? []).map(toClaimRecord).map(clone);
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
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return { query, evidence: [], claims: [] };
  }

  return {
    query,
    evidence: EVIDENCE_SOURCE_NODES.filter((node) =>
      searchTextMatches(node, normalizedQuery, ["evidenceId", "sourcePathOrUrl", "locator", "kindLabel"]),
    )
      .map(toEvidenceRecord)
      .map(clone),
    claims: CLAIM_NODES.filter((node) =>
      searchTextMatches(node, normalizedQuery, ["claimId", "statement", "subjectId", "subjectKind", "confidence", "status"]),
    )
      .map(toClaimRecord)
      .map(clone),
  };
}
