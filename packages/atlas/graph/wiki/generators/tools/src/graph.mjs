import fs from "node:fs/promises";
import path from "node:path";
import { parseAllDocuments } from "yaml";

const YAML_EXTENSIONS = new Set([".yaml", ".yml"]);

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listYamlFiles(targetPath) {
  const stat = await fs.stat(targetPath);
  if (stat.isFile()) {
    return YAML_EXTENSIONS.has(path.extname(targetPath)) ? [targetPath] : [];
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith("."))
      .map((entry) => listYamlFiles(path.join(targetPath, entry.name))),
  );
  return nested.flat().sort((left, right) => left.localeCompare(right));
}

function normalizePath(filePath, rootDir) {
  return path.relative(rootDir, filePath).replaceAll(path.sep, "/");
}

function asEdgeArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeEdgeTarget(edge) {
  if (typeof edge === "string") return { target: edge, attributes: {} };
  if (edge && typeof edge === "object" && typeof edge.target === "string") {
    const { target, ...attributes } = edge;
    return { target, attributes };
  }
  return undefined;
}

function flattenEdges(node) {
  const edges = [];
  const rawEdges = node.edges && typeof node.edges === "object" ? node.edges : {};
  for (const [relation, relationEdges] of Object.entries(rawEdges)) {
    for (const relationEdge of asEdgeArray(relationEdges)) {
      const normalized = normalizeEdgeTarget(relationEdge);
      if (!normalized) continue;
      edges.push({
        id: `${node.id}--${relation}--${normalized.target}`,
        source: node.id,
        target: normalized.target,
        relation,
        attributes: normalized.attributes,
        sourceFile: node.sourceFile,
      });
    }
  }
  return edges;
}

export async function loadGraph(options = {}) {
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const graphDir = path.resolve(rootDir, options.graphDir ?? "graph");
  const schemaDir = path.resolve(rootDir, options.schemaDir ?? "graph/schema");
  if (!(await exists(graphDir))) {
    throw new Error(`Graph directory not found: ${graphDir}`);
  }

  const graphFiles = await listYamlFiles(graphDir);
  const nodes = [];
  const parseErrors = [];

  for (const filePath of graphFiles) {
    const text = await fs.readFile(filePath, "utf8");
    let documents;
    try {
      documents = parseAllDocuments(text);
    } catch (error) {
      parseErrors.push({ file: normalizePath(filePath, rootDir), message: error.message });
      continue;
    }

    for (let index = 0; index < documents.length; index += 1) {
      const document = documents[index];
      if (document.errors?.length) {
        parseErrors.push({
          file: normalizePath(filePath, rootDir),
          documentIndex: index + 1,
          message: document.errors.map((error) => error.message).join("; "),
        });
        continue;
      }
      const value = document.toJSON();
      if (!value || typeof value !== "object") continue;
      if (typeof value.id !== "string" || typeof value.nodeKind !== "string") continue;
      nodes.push({
        ...value,
        attributes: value.attributes ?? {},
        edges: value.edges ?? {},
        sourceFile: normalizePath(filePath, rootDir),
        documentIndex: index + 1,
      });
    }
  }

  const nodeById = new Map();
  const duplicates = [];
  for (const node of nodes) {
    if (nodeById.has(node.id)) duplicates.push(node.id);
    nodeById.set(node.id, node);
  }

  const edges = nodes.flatMap(flattenEdges).sort((left, right) => left.id.localeCompare(right.id));
  const danglingEdges = edges.filter((edge) => !nodeById.has(edge.target));
  const schemaFiles = (await exists(schemaDir)) ? await listYamlFiles(schemaDir) : [];

  return {
    rootDir,
    graphDir,
    schemaDir,
    graphFiles: graphFiles.map((filePath) => normalizePath(filePath, rootDir)),
    schemaFiles: schemaFiles.map((filePath) => normalizePath(filePath, rootDir)),
    nodes: nodes.sort((left, right) => left.id.localeCompare(right.id)),
    edges,
    nodeById,
    diagnostics: {
      parseErrors,
      duplicateNodeIds: [...new Set(duplicates)].sort(),
      danglingEdges,
    },
  };
}
