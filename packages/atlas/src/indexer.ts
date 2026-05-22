import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";
import type { AtlasRecord, Edge, IndexShape } from "./types";

export interface BuildIndexOptions {
  catalogDir: string;
  outFile?: string;
}

interface ClusterAccumulator {
  nodeKinds: Set<string>;
  recordCount: number;
}

interface PendingRecordPatch {
  record: AtlasRecord;
  edges: Edge[];
}

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    else if (exts.some((ext) => entry.name.toLowerCase().endsWith(ext))) out.push(full);
  }
  return out;
}

function walkGraphYaml(catalogDir: string): string[] {
  const blocked = new Set(["schema", "tools", "wiki", "migration", "process", "tests"]);
  return walk(catalogDir, [".yaml", ".yml"]).filter((file) => {
    const [firstSegment] = path.relative(catalogDir, file).split(path.sep);
    return !blocked.has(firstSegment);
  });
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function relativeTo(base: string, filePath: string): string {
  return normalizePath(path.relative(base, filePath));
}

function clusterOf(catalogDir: string, filePath: string): string {
  const [cluster] = path.relative(catalogDir, filePath).split(path.sep);
  return cluster || "uncategorized";
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function edgeAttributes(value: Record<string, unknown>): Record<string, unknown> {
  const attributes = { ...value };
  delete attributes.to;
  delete attributes.id;
  delete attributes.target;
  return attributes;
}

function extractEdges(record: Record<string, unknown>, fromId: string): Edge[] {
  const edges: Edge[] = [];
  const rawEdges = record.edges;
  if (Array.isArray(rawEdges)) {
    for (const item of rawEdges) {
      const edge = asObject(item);
      if (edge && edge.kind && edge.to) {
        edges.push({ from: fromId, to: String(edge.to), kind: String(edge.kind), attributes: asObject(edge.attributes) ?? undefined });
      }
    }
    return edges;
  }
  const edgeMap = asObject(rawEdges);
  if (!edgeMap) return edges;
  for (const [kind, value] of Object.entries(edgeMap)) {
    if (value == null) continue;
    if (typeof value === "string") {
      edges.push({ from: fromId, to: value, kind });
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") edges.push({ from: fromId, to: item, kind });
        else {
          const objectItem = asObject(item);
          const to = objectItem?.to ?? objectItem?.id ?? objectItem?.target;
          if (typeof to === "string" && objectItem) edges.push({ from: fromId, to, kind, attributes: edgeAttributes(objectItem) });
        }
      }
      continue;
    }
    const objectValue = asObject(value);
    const to = objectValue?.to ?? objectValue?.id ?? objectValue?.target;
    if (typeof to === "string" && objectValue) edges.push({ from: fromId, to, kind, attributes: objectValue });
  }
  return edges;
}

function hasRecordEdge(edges: Edge[], kind: string, to: string): boolean {
  return edges.some((edge) => edge.kind === kind && edge.to === to);
}

function isRecordPatch(record: AtlasRecord): boolean {
  return record.patch === true || record.mergeStrategy === "patch";
}

function mergeRecordPatch(record: AtlasRecord, patchRecord: AtlasRecord): AtlasRecord {
  const {
    id: _id,
    _kind: _kind,
    _file: _file,
    _cluster: _cluster,
    patch: _patch,
    mergeStrategy: _mergeStrategy,
    ...attributes
  } = patchRecord;
  return { ...record, ...attributes };
}

function evidenceSourceId(ref: string): string {
  return ref.startsWith("evidence:") ? ref : `evidence:${ref}`;
}

function journalEventAliasId(eventName: string): string {
  return `journal-event:babysitter-${eventName.toLowerCase().replace(/_/g, "-")}`;
}

function providerProductId(providerId: string): string {
  return providerId.startsWith("provider:") ? providerId : `provider:${providerId}`;
}

function packageSurfaceId(packageName: string): string {
  return `package:${packageName.replace(/^@/, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function installMethodRequirement(record: AtlasRecord): string | undefined {
  switch (record.kind) {
    case "cargo":
      return "tool:cargo";
    case "go-install":
      return "language:go";
    case "nix":
      return "tool:nix";
    case "scoop":
      return "tool:scoop";
    case "winget":
      return "tool:winget";
    default:
      return undefined;
  }
}

function deploymentInfrastructure(record: AtlasRecord): string | undefined {
  switch (record.targetType) {
    case "eks":
      return "platform-service:aws-eks";
    case "minikube":
      return "tool:minikube";
    default:
      return undefined;
  }
}

function hardeningAppliesTo(record: AtlasRecord): string | undefined {
  return record.appliesTo === "agent-session" ? "topic:agent-session-management" : undefined;
}

function deriveAttributeEdges(record: AtlasRecord, recordEdges: Edge[], recordIds?: Set<string>): Edge[] {
  const derived: Edge[] = [];
  const add = (kind: string, to: string): void => {
    if (recordIds && !recordIds.has(to)) return;
    if (!hasRecordEdge(recordEdges, kind, to) && !hasRecordEdge(derived, kind, to)) {
      derived.push({ from: record.id, to, kind });
    }
  };

  if (record._kind === "EvidenceSource" && typeof record.trustLevel === "string") {
    add("has_trust_level", record.trustLevel);
  }

  if (["Modality", "ModelProviderProduct", "ModelProviderVersion"].includes(record._kind)) {
    for (const evidenceRef of asStringList(record.evidenceRefs)) {
      add("has_evidence_source", evidenceSourceId(evidenceRef));
    }
  }

  if (record._kind === "ScopeBoundary") {
    for (const reasonId of asStringList(record.outOfScopeReasonIds)) {
      add("has_out_of_scope_reason", reasonId);
    }
  }

  if (record._kind === "InstallMethod") {
    const required = installMethodRequirement(record);
    if (required) add("install_method_requires", required);
  }

  if (record._kind === "ProcessDescriptor" && typeof record.ownerPackage === "string") {
    add("owned_by_package_surface", packageSurfaceId(record.ownerPackage));
  }

  if (record._kind === "DeploymentTarget") {
    const infrastructure = deploymentInfrastructure(record);
    if (infrastructure) add("deployment_target_uses_infrastructure", infrastructure);
  }

  if (record._kind === "HarnessHardeningGuidance") {
    const topic = hardeningAppliesTo(record);
    if (topic) add("hardening_guidance_applies_to", topic);
  }

  if (record._kind === "AgentVersion") {
    for (const installMethod of asStringList(record.installMethods)) {
      add("installed_via", installMethod);
    }
  }

  if (record._kind === "ModelProviderVersion" && typeof record.providerId === "string") {
    add("model_provider_version_of", providerProductId(record.providerId));
  }

  if (record._kind === "EndUser" && typeof record.tenantId === "string") {
    add("belongs_to_tenant", record.tenantId);
  }

  if (record._kind === "RunJournalEvent" && typeof record.eventName === "string") {
    add("aliases_journal_event", journalEventAliasId(record.eventName));
  }

  return derived;
}

function loadNodeKinds(catalogDir: string, schemaDir: string): Record<string, Record<string, unknown>> {
  const dir = path.join(schemaDir, "node-kinds");
  const nodeKinds: Record<string, Record<string, unknown>> = {};
  for (const file of walk(dir, [".yaml", ".yml"])) {
    try {
      const docs = yaml.loadAll(fs.readFileSync(file, "utf8"));
      for (const doc of docs) {
        const objectDoc = asObject(doc);
        if (!objectDoc) continue;
        const list = objectDoc.nodeKinds ?? objectDoc.kinds ?? (objectDoc.nodeKind ? [objectDoc] : null);
        if (!Array.isArray(list)) continue;
        for (const item of list) {
          const kind = asObject(item);
          const name = kind?.name ?? kind?.id;
          if (typeof name === "string") nodeKinds[name] = { ...kind, _file: relativeTo(catalogDir, file) };
        }
      }
    } catch {
    }
  }
  return nodeKinds;
}

function loadEdgeKinds(schemaDir: string): Record<string, Record<string, unknown>> {
  const file = path.join(schemaDir, "edge-kinds.yaml");
  const edgeKinds: Record<string, Record<string, unknown>> = {};
  if (!fs.existsSync(file)) return edgeKinds;
  try {
    const doc = asObject(yaml.load(fs.readFileSync(file, "utf8")));
    const list = doc?.edgeKinds;
    if (!Array.isArray(list)) return edgeKinds;
    for (const item of list) {
      const kind = asObject(item);
      const name = kind?.name ?? kind?.id;
      if (typeof name === "string" && kind) edgeKinds[name] = kind;
    }
  } catch {
  }
  return edgeKinds;
}

function splitFrontmatter(text: string): { data: Record<string, unknown>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { data: {}, body: text };
  const data = asObject(yaml.load(match[1])) ?? {};
  return { data, body: text.slice(match[0].length) };
}

function fallbackTitle(body: string, slug: string): string {
  const match = /^#\s+(.+)$/m.exec(body);
  return match ? match[1].trim() : slug.split("/").at(-1) ?? slug;
}

function derivePageHierarchyEdges(records: Record<string, AtlasRecord>): Edge[] {
  const pages = Object.values(records);
  const bySlug = new Map<string, AtlasRecord>();
  for (const page of pages) {
    if (typeof page.slug === "string") bySlug.set(page.slug, page);
  }

  const edges: Edge[] = [];
  for (const page of pages) {
    if (typeof page.slug !== "string" || page.slug === "index") continue;
    const segments = page.slug.split("/").filter(Boolean);
    for (let length = segments.length - 1; length >= 0; length--) {
      const parentSlug = length === 0 ? "index" : segments.slice(0, length).join("/");
      const parent = bySlug.get(parentSlug);
      if (parent && parent.id !== page.id) {
        edges.push({ from: parent.id, to: page.id, kind: "contains_page" });
        break;
      }
    }
  }
  return edges;
}

function loadMarkdownPages(catalogDir: string): { records: Record<string, AtlasRecord>; edges: Edge[] } {
  const wikiDir = path.join(catalogDir, "wiki");
  const records: Record<string, AtlasRecord> = {};
  const edges: Edge[] = [];
  for (const file of walk(wikiDir, [".md"])) {
    const articlePath = relativeTo(catalogDir, file);
    const relWithoutExt = articlePath.replace(/^wiki\//, "").replace(/\.md$/, "");
    const slug = relWithoutExt.replace(/\/README$/, "").replace(/^README$/, "index") || "index";
    const { data, body } = splitFrontmatter(fs.readFileSync(file, "utf8"));
    const id = typeof data.id === "string" ? data.id : `page:${slug.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "index"}`;
    const title = typeof data.title === "string" ? data.title : fallbackTitle(body, slug);
    const documents = asStringList(data.documents);
    const {
      id: _frontmatterId,
      title: _frontmatterTitle,
      slug: _frontmatterSlug,
      articlePath: _frontmatterArticlePath,
      documents: _frontmatterDocuments,
      ...pageAttributes
    } = data;
    records[id] = {
      id,
      _kind: "Page",
      _file: articlePath,
      _cluster: "wiki",
      ...pageAttributes,
      title,
      displayName: title,
      slug: typeof data.slug === "string" ? data.slug : slug,
      articlePath: typeof data.articlePath === "string" ? data.articlePath : articlePath,
      article: body,
      documents,
    };
    for (const target of documents) edges.push({ from: id, to: target, kind: "documents" });
  }
  edges.push(...derivePageHierarchyEdges(records));
  return { records, edges };
}

export function buildIndex(options: BuildIndexOptions): IndexShape {
  const catalogDir = path.resolve(options.catalogDir);
  const schemaDir = path.join(catalogDir, "schema");
  const yamlFiles = walkGraphYaml(catalogDir);
  const records: Record<string, AtlasRecord> = {};
  const edges: Edge[] = [];
  const nodeKindCounts: Record<string, number> = {};
  const edgeKindCounts: Record<string, number> = {};
  const clusters: Record<string, ClusterAccumulator> = {};
  const pendingRecordPatches: Record<string, PendingRecordPatch[]> = {};
  let parseErrors = 0;

  function addEdge(edge: Edge): void {
    edges.push(edge);
    edgeKindCounts[edge.kind] = (edgeKindCounts[edge.kind] ?? 0) + 1;
  }

  function addRecord(record: AtlasRecord, recordEdges: Edge[] = []): void {
    if (isRecordPatch(record)) {
      const existing = records[record.id];
      if (existing) {
        records[record.id] = mergeRecordPatch(existing, record);
        for (const edge of recordEdges) addEdge(edge);
      } else {
        (pendingRecordPatches[record.id] ??= []).push({ record, edges: recordEdges });
      }
      return;
    }

    const existing = records[record.id];
    const shouldReplaceDuplicate =
      existing !== undefined && existing._cluster !== "agent-catalog" && record._cluster === "agent-catalog";
    if (existing === undefined || shouldReplaceDuplicate) {
      records[record.id] = record;
      const patches = pendingRecordPatches[record.id];
      if (patches) {
        for (const patch of patches) {
          records[record.id] = mergeRecordPatch(records[record.id], patch.record);
          for (const edge of patch.edges) addEdge(edge);
        }
        delete pendingRecordPatches[record.id];
      }
    }
    if (existing === undefined) {
      nodeKindCounts[record._kind] = (nodeKindCounts[record._kind] ?? 0) + 1;
      const clusterInfo = clusters[record._cluster] ??= { nodeKinds: new Set<string>(), recordCount: 0 };
      clusterInfo.nodeKinds.add(record._kind);
      clusterInfo.recordCount++;
    }
    for (const edge of recordEdges) addEdge(edge);
  }

  for (const file of yamlFiles) {
    let docs: unknown[];
    try {
      docs = yaml.loadAll(fs.readFileSync(file, "utf8"));
    } catch {
      parseErrors++;
      continue;
    }
    for (const doc of docs) {
      const objectDoc = asObject(doc);
      if (!objectDoc) continue;
      if (objectDoc.kind === "NodeDocument" && Array.isArray(objectDoc.nodes)) {
        for (const nodeItem of objectDoc.nodes) {
          const node = asObject(nodeItem);
          if (!node || typeof node.id !== "string" || typeof node.kind !== "string") continue;
          const { id, kind, edges: _edges, ...attributes } = node;
          const record: AtlasRecord = {
            id,
            _kind: kind,
            _file: relativeTo(catalogDir, file),
            _cluster: clusterOf(catalogDir, file),
            ...attributes,
          };
          addRecord(record, extractEdges(node, id));
        }
        continue;
      }
      const id = objectDoc.id;
      const kind = objectDoc.nodeKind ?? objectDoc.kind;
      if (typeof id !== "string" || typeof kind !== "string") continue;
      const attributes = asObject(objectDoc.attributes) ?? {};
      const record: AtlasRecord = {
        id,
        _kind: kind,
        _file: relativeTo(catalogDir, file),
        _cluster: clusterOf(catalogDir, file),
        ...attributes,
      };
      addRecord(record, extractEdges(objectDoc, id));
    }
  }

  const pages = loadMarkdownPages(catalogDir);
  for (const record of Object.values(pages.records)) addRecord(record, pages.edges.filter((edge) => edge.from === record.id));

  const unresolvedRecordPatches = Object.keys(pendingRecordPatches);
  if (unresolvedRecordPatches.length > 0) {
    throw new Error(`Unresolved record patches: ${unresolvedRecordPatches.join(", ")}`);
  }

  const recordIds = new Set(Object.keys(records));
  for (const record of Object.values(records)) {
    const recordEdges = edges.filter((edge) => edge.from === record.id);
    for (const edge of deriveAttributeEdges(record, recordEdges, recordIds)) addEdge(edge);
  }

  const schemaNodeKinds = loadNodeKinds(catalogDir, schemaDir);
  const schemaEdgeKinds = loadEdgeKinds(schemaDir);
  const nodeKinds: IndexShape["nodeKinds"] = {};
  const edgeKinds: IndexShape["edgeKinds"] = {};
  const clustersOut: IndexShape["clusters"] = {};

  for (const [name, count] of Object.entries(nodeKindCounts)) nodeKinds[name] = { ...schemaNodeKinds[name], name, count };
  for (const [name, def] of Object.entries(schemaNodeKinds)) if (!nodeKinds[name]) nodeKinds[name] = { ...def, name, count: 0 };
  for (const [name, count] of Object.entries(edgeKindCounts)) edgeKinds[name] = { ...schemaEdgeKinds[name], name, count };
  for (const [name, def] of Object.entries(schemaEdgeKinds)) if (!edgeKinds[name]) edgeKinds[name] = { ...def, name, count: 0 };
  for (const [cluster, value] of Object.entries(clusters)) clustersOut[cluster] = { nodeKinds: Array.from(value.nodeKinds).sort(), recordCount: value.recordCount };

  const index: IndexShape = {
    generatedAt: new Date().toISOString(),
    catalogDir: normalizePath(catalogDir),
    stats: {
      totalRecords: Object.keys(records).length,
      totalEdges: edges.length,
      totalNodeKinds: Object.keys(nodeKinds).length,
      totalEdgeKinds: Object.keys(edgeKinds).length,
      totalClusters: Object.keys(clustersOut).length,
      yamlFiles: yamlFiles.length,
      parseErrors,
    },
    records,
    edges,
    nodeKinds,
    edgeKinds,
    clusters: clustersOut,
  };

  if (options.outFile) {
    fs.mkdirSync(path.dirname(path.resolve(options.outFile)), { recursive: true });
    fs.writeFileSync(options.outFile, JSON.stringify(index, null, 2), "utf8");
  }
  return index;
}

function readArg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

if (require.main === module) {
  const catalogDir = readArg("--catalog-dir", process.env.CATALOG_DIR ?? path.resolve(process.cwd(), "../../graph"));
  const outFile = readArg("--out", path.resolve(process.cwd(), "src/index.json"));
  const index = buildIndex({ catalogDir: catalogDir as string, outFile });
  console.log(`[atlas:indexer] wrote ${outFile}`);
  console.log(`[atlas:indexer] stats ${JSON.stringify(index.stats)}`);
}
