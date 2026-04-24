import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type {
  CatalogGraph,
  GraphDocument,
  GraphEdge,
  GraphNode,
  GraphRelationship,
  OntologySchema,
} from "./models";

interface NodeDocument {
  kind: "NodeDocument";
  documentPath: string;
  generatedAt: string;
  nodes: GraphNode[];
}

interface EdgeDocument {
  kind: "EdgeDocument";
  documentPath: string;
  generatedAt: string;
  edges: GraphRelationship[];
}

function listYamlFilesRecursively(targetPath: string): string[] {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return targetPath.endsWith(".yaml") ? [targetPath] : [];
  }

  return fs
    .readdirSync(targetPath, { withFileTypes: true })
    .flatMap((entry) => listYamlFilesRecursively(path.join(targetPath, entry.name)))
    .sort((left, right) => left.localeCompare(right));
}

let cachedGraph: CatalogGraph | undefined;

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
  return findExistingRoot(path.join("graph", "agent-catalog.graph.yaml"));
}

function graphRoot(): string {
  return path.join(packageRoot(), "graph");
}

function readYamlFile<T>(filePath: string): T {
  return parse(fs.readFileSync(filePath, "utf8")) as T;
}

function ensureArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${label} to be an array.`);
  }
  return value;
}

function ensureString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Expected ${label} to be a non-empty string.`);
  }
  return value;
}

function validateRequiredAttributes(subject: Record<string, unknown>, required: string[], label: string): void {
  for (const attribute of required) {
    if (!(attribute in subject)) {
      throw new Error(`Missing required ${label} attribute "${attribute}".`);
    }
  }
}

function loadCatalogGraph(): CatalogGraph {
  if (cachedGraph) {
    return cachedGraph;
  }

  const rootDir = graphRoot();
  const document = readYamlFile<GraphDocument>(path.join(rootDir, "agent-catalog.graph.yaml"));
  const schema = readYamlFile<OntologySchema>(path.join(rootDir, document.schemaPath));

  validateRequiredAttributes(document as unknown as Record<string, unknown>, schema.nodeKinds.GraphDocument.requiredAttributes, "GraphDocument");
  validateRequiredAttributes(schema as unknown as Record<string, unknown>, schema.nodeKinds.OntologySchema.requiredAttributes, "OntologySchema");

  const nodes: GraphNode[] = [];
  const edges: GraphRelationship[] = [];

  for (const importPath of document.imports) {
    for (const resolvedPath of listYamlFilesRecursively(path.join(rootDir, importPath))) {
      const parsed = readYamlFile<NodeDocument | EdgeDocument>(resolvedPath);
      if (parsed.kind === "NodeDocument") {
        nodes.push(...parsed.nodes);
        continue;
      }
      if (parsed.kind === "EdgeDocument") {
        edges.push(...parsed.edges);
        continue;
      }
      throw new Error(`Unsupported graph document kind in ${resolvedPath}.`);
    }
  }

  const nodeIds = new Set<string>([document.id, schema.id]);
  const nodeKinds = new Map<string, string>([
    [document.id, "GraphDocument"],
    [schema.id, "OntologySchema"],
  ]);

  for (const node of nodes) {
    ensureString(node.id, "node.id");
    ensureString(node.kind, `node.kind for ${node.id}`);
    const definition = schema.nodeKinds[node.kind];
    if (!definition) {
      throw new Error(`Unknown node kind "${node.kind}" for ${node.id}.`);
    }
    validateRequiredAttributes(node as Record<string, unknown>, definition.requiredAttributes, `node ${node.id}`);
    nodeIds.add(node.id);
    nodeKinds.set(node.id, node.kind);
  }

  for (const edge of edges) {
    ensureString(edge.id, "edge.id");
    ensureString(edge.relation, `edge.relation for ${edge.id}`);
    ensureString(edge.from, `edge.from for ${edge.id}`);
    ensureString(edge.to, `edge.to for ${edge.id}`);

    const definition = schema.edgeKinds[edge.relation];
    if (!definition) {
      throw new Error(`Unknown edge relation "${edge.relation}" for ${edge.id}.`);
    }
    validateRequiredAttributes(edge as Record<string, unknown>, definition.requiredAttributes, `edge ${edge.id}`);

    if (!nodeIds.has(edge.from)) {
      throw new Error(`Edge ${edge.id} references unknown source node ${edge.from}.`);
    }
    if (!nodeIds.has(edge.to)) {
      throw new Error(`Edge ${edge.id} references unknown target node ${edge.to}.`);
    }

    if (definition.from && !definition.from.includes(nodeKinds.get(edge.from) ?? "")) {
      throw new Error(`Edge ${edge.id} has invalid source kind ${nodeKinds.get(edge.from)} for relation ${edge.relation}.`);
    }
    if (definition.to && !definition.to.includes(nodeKinds.get(edge.to) ?? "")) {
      throw new Error(`Edge ${edge.id} has invalid target kind ${nodeKinds.get(edge.to)} for relation ${edge.relation}.`);
    }
  }

  cachedGraph = { document, schema, nodes, edges };
  return cachedGraph;
}

export function getCatalogGraph(): CatalogGraph {
  return loadCatalogGraph();
}

export function getGraphDocument(): GraphDocument {
  return loadCatalogGraph().document;
}

export function getOntologySchema(): OntologySchema {
  return loadCatalogGraph().schema;
}

export function listGraphNodes(): GraphNode[] {
  return [...loadCatalogGraph().nodes];
}

export function listNodesByKind(kind: GraphNode["kind"]): GraphNode[] {
  return loadCatalogGraph().nodes.filter((node) => node.kind === kind);
}

export function getNodeById<TNode extends GraphNode = GraphNode>(nodeId: string): TNode | undefined {
  return loadCatalogGraph().nodes.find((node) => node.id === nodeId) as TNode | undefined;
}

export function listGraphEdges(): GraphRelationship[] {
  return [...loadCatalogGraph().edges];
}

export function listRelationshipsForNode(nodeId: string): GraphRelationship[] {
  return loadCatalogGraph().edges.filter((edge) => edge.from === nodeId || edge.to === nodeId);
}

export function listRelationshipsByRelation(relation: string): GraphRelationship[] {
  return loadCatalogGraph().edges.filter((edge) => edge.relation === relation);
}

export function listOutgoingTargets(nodeId: string, relation: string): GraphNode[] {
  const graph = loadCatalogGraph();
  const targetIds = graph.edges.filter((edge) => edge.from === nodeId && edge.relation === relation).map((edge) => edge.to);
  return graph.nodes.filter((node) => targetIds.includes(node.id));
}

export function listIncomingSources(nodeId: string, relation: string): GraphNode[] {
  const graph = loadCatalogGraph();
  const sourceIds = graph.edges.filter((edge) => edge.to === nodeId && edge.relation === relation).map((edge) => edge.from);
  return graph.nodes.filter((node) => sourceIds.includes(node.id));
}

export function listEdgesForNode(catalog: { graph: GraphEdge[] }, nodeId: string): GraphEdge[] {
  return catalog.graph.filter((edge) => edge.from === nodeId || edge.to === nodeId);
}

export function listEdgesByRelation(catalog: { graph: GraphEdge[] }, relation: string): GraphEdge[] {
  return catalog.graph.filter((edge) => edge.relation === relation);
}

export function assertGraphFileCoverage(): void {
  const document = getGraphDocument();
  ensureArray(document.imports, "GraphDocument.imports");
  for (const importPath of document.imports) {
    const absolutePath = path.join(graphRoot(), ensureString(importPath, "GraphDocument.imports[]"));
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Graph import is missing: ${importPath}`);
    }
    if (listYamlFilesRecursively(absolutePath).length === 0) {
      throw new Error(`Graph import has no YAML files: ${importPath}`);
    }
  }
}
