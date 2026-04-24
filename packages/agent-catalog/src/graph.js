"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCatalogGraph = getCatalogGraph;
exports.getGraphDocument = getGraphDocument;
exports.getOntologySchema = getOntologySchema;
exports.listGraphNodes = listGraphNodes;
exports.listNodesByKind = listNodesByKind;
exports.getNodeById = getNodeById;
exports.listGraphEdges = listGraphEdges;
exports.listRelationshipsForNode = listRelationshipsForNode;
exports.listRelationshipsByRelation = listRelationshipsByRelation;
exports.listOutgoingTargets = listOutgoingTargets;
exports.listIncomingSources = listIncomingSources;
exports.listEdgesForNode = listEdgesForNode;
exports.listEdgesByRelation = listEdgesByRelation;
exports.assertGraphFileCoverage = assertGraphFileCoverage;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const yaml_1 = require("yaml");
function listYamlFilesRecursively(targetPath) {
    const stat = node_fs_1.default.statSync(targetPath);
    if (stat.isFile()) {
        return targetPath.endsWith(".yaml") ? [targetPath] : [];
    }
    return node_fs_1.default
        .readdirSync(targetPath, { withFileTypes: true })
        .flatMap((entry) => listYamlFilesRecursively(node_path_1.default.join(targetPath, entry.name)))
        .sort((left, right) => left.localeCompare(right));
}
let cachedGraph;
function packageRoot() {
    return node_path_1.default.resolve(__dirname, "..");
}
function graphRoot() {
    return node_path_1.default.join(packageRoot(), "graph");
}
function readYamlFile(filePath) {
    return (0, yaml_1.parse)(node_fs_1.default.readFileSync(filePath, "utf8"));
}
function ensureArray(value, label) {
    if (!Array.isArray(value)) {
        throw new Error(`Expected ${label} to be an array.`);
    }
    return value;
}
function ensureString(value, label) {
    if (typeof value !== "string" || value.length === 0) {
        throw new Error(`Expected ${label} to be a non-empty string.`);
    }
    return value;
}
function validateRequiredAttributes(subject, required, label) {
    for (const attribute of required) {
        if (!(attribute in subject)) {
            throw new Error(`Missing required ${label} attribute "${attribute}".`);
        }
    }
}
function loadCatalogGraph() {
    if (cachedGraph) {
        return cachedGraph;
    }
    const rootDir = graphRoot();
    const document = readYamlFile(node_path_1.default.join(rootDir, "agent-catalog.graph.yaml"));
    const schema = readYamlFile(node_path_1.default.join(rootDir, document.schemaPath));
    validateRequiredAttributes(document, schema.nodeKinds.GraphDocument.requiredAttributes, "GraphDocument");
    validateRequiredAttributes(schema, schema.nodeKinds.OntologySchema.requiredAttributes, "OntologySchema");
    const nodes = [];
    const edges = [];
    for (const importPath of document.imports) {
        for (const resolvedPath of listYamlFilesRecursively(node_path_1.default.join(rootDir, importPath))) {
            const parsed = readYamlFile(resolvedPath);
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
    const nodeIds = new Set([document.id, schema.id]);
    const nodeKinds = new Map([
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
        validateRequiredAttributes(node, definition.requiredAttributes, `node ${node.id}`);
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
        validateRequiredAttributes(edge, definition.requiredAttributes, `edge ${edge.id}`);
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
function getCatalogGraph() {
    return loadCatalogGraph();
}
function getGraphDocument() {
    return loadCatalogGraph().document;
}
function getOntologySchema() {
    return loadCatalogGraph().schema;
}
function listGraphNodes() {
    return [...loadCatalogGraph().nodes];
}
function listNodesByKind(kind) {
    return loadCatalogGraph().nodes.filter((node) => node.kind === kind);
}
function getNodeById(nodeId) {
    return loadCatalogGraph().nodes.find((node) => node.id === nodeId);
}
function listGraphEdges() {
    return [...loadCatalogGraph().edges];
}
function listRelationshipsForNode(nodeId) {
    return loadCatalogGraph().edges.filter((edge) => edge.from === nodeId || edge.to === nodeId);
}
function listRelationshipsByRelation(relation) {
    return loadCatalogGraph().edges.filter((edge) => edge.relation === relation);
}
function listOutgoingTargets(nodeId, relation) {
    const graph = loadCatalogGraph();
    const targetIds = graph.edges.filter((edge) => edge.from === nodeId && edge.relation === relation).map((edge) => edge.to);
    return graph.nodes.filter((node) => targetIds.includes(node.id));
}
function listIncomingSources(nodeId, relation) {
    const graph = loadCatalogGraph();
    const sourceIds = graph.edges.filter((edge) => edge.to === nodeId && edge.relation === relation).map((edge) => edge.from);
    return graph.nodes.filter((node) => sourceIds.includes(node.id));
}
function listEdgesForNode(catalog, nodeId) {
    return catalog.graph.filter((edge) => edge.from === nodeId || edge.to === nodeId);
}
function listEdgesByRelation(catalog, relation) {
    return catalog.graph.filter((edge) => edge.relation === relation);
}
function assertGraphFileCoverage() {
    const document = getGraphDocument();
    ensureArray(document.imports, "GraphDocument.imports");
    for (const importPath of document.imports) {
        const absolutePath = node_path_1.default.join(graphRoot(), ensureString(importPath, "GraphDocument.imports[]"));
        if (!node_fs_1.default.existsSync(absolutePath)) {
            throw new Error(`Graph import is missing: ${importPath}`);
        }
        if (listYamlFilesRecursively(absolutePath).length === 0) {
            throw new Error(`Graph import has no YAML files: ${importPath}`);
        }
    }
}
