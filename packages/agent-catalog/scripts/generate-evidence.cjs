const fs = require("fs");
const path = require("path");
const { parse } = require("yaml");

function readYaml(filePath) {
  return parse(fs.readFileSync(filePath, "utf8"));
}

function listYamlFilesRecursively(targetPath) {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return targetPath.endsWith(".yaml") ? [targetPath] : [];
  }

  return fs
    .readdirSync(targetPath, { withFileTypes: true })
    .flatMap((entry) => listYamlFilesRecursively(path.join(targetPath, entry.name)))
    .sort((left, right) => left.localeCompare(right));
}

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`Expected ${label} to be an array.`);
  }
  return value;
}

function sortByStableId(left, right) {
  const leftId = left.evidenceId || left.claimId || left.id || "";
  const rightId = right.evidenceId || right.claimId || right.id || "";
  return String(leftId).localeCompare(String(rightId));
}

function sanitizeShardName(value) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function shardGroupForEvidence(node) {
  const evidenceId = String(node.evidenceId || "");
  const source = String(node.sourcePathOrUrl || "");
  const kindLabel = String(node.kindLabel || "");

  if (kindLabel === "web" || evidenceId.startsWith("web-")) {
    return "vendor-web";
  }
  if (
    source.includes("agent-plugins-mux") ||
    source.includes("hooks-mux") ||
    evidenceId.includes("target-") ||
    evidenceId.includes("hooks") ||
    evidenceId.includes("detector")
  ) {
    return "plugins-hooks-discovery";
  }
  if (
    source.includes("packages/catalog/") ||
    source.includes("/processes/") ||
    source.endsWith("/package.json") ||
    source.endsWith("package.json") ||
    evidenceId.includes("catalog") ||
    evidenceId.includes("process")
  ) {
    return "catalog-processes-and-packaging";
  }
  return "runtime-core";
}

function shardGroupForClaim(node) {
  const claimId = String(node.claimId || "");
  const evidenceIds = Array.isArray(node.evidenceIds) ? node.evidenceIds.map(String) : [];
  const firstEvidenceId = evidenceIds[0] || claimId;

  if (firstEvidenceId.startsWith("web-")) {
    return "vendor-web";
  }
  if (
    firstEvidenceId.includes("target-") ||
    firstEvidenceId.includes("hooks") ||
    firstEvidenceId.includes("detector")
  ) {
    return "plugins-hooks-discovery";
  }
  if (
    firstEvidenceId.includes("catalog") ||
    firstEvidenceId.includes("process") ||
    firstEvidenceId.includes("package")
  ) {
    return "catalog-processes-and-packaging";
  }
  return "runtime-core";
}

function bucketBy(nodes, getKey) {
  const buckets = new Map();
  for (const node of nodes) {
    const key = getKey(node);
    const current = buckets.get(key) || [];
    current.push(node);
    buckets.set(key, current);
  }
  return Array.from(buckets.entries()).sort(([left], [right]) => left.localeCompare(right));
}

function loadGraphData(rootDir) {
  const graphDir = path.join(rootDir, "graph");
  const graphDocument = readYaml(path.join(graphDir, "agent-catalog.graph.yaml"));
  const nodes = [];

  for (const importPath of ensureArray(graphDocument.imports, "GraphDocument.imports")) {
    for (const yamlFile of listYamlFilesRecursively(path.join(graphDir, importPath))) {
      const document = readYaml(yamlFile);
      if (document.kind === "NodeDocument") {
        nodes.push(...ensureArray(document.nodes, `${yamlFile}.nodes`));
      }
    }
  }

  return {
    graphDocument,
    evidenceSources: nodes.filter((node) => node.kind === "EvidenceSource").sort(sortByStableId),
    claims: nodes.filter((node) => node.kind === "Claim").sort(sortByStableId),
  };
}

function main() {
  const rootDir = path.resolve(__dirname, "..");
  const evidenceDir = path.join(rootDir, "evidence");
  const targetDir = path.join(evidenceDir, "ontology-evidence");
  const legacyFile = path.join(evidenceDir, "ontology-evidence.json");
  const { graphDocument, evidenceSources, claims } = loadGraphData(rootDir);

  // Keep the current snapshot in place while regenerating so concurrent readers
  // in the root contract suite never observe a missing manifest.
  fs.rmSync(legacyFile, { force: true });

  const manifest = {
    generatedAt: graphDocument.generatedAt,
    graphId: graphDocument.graphId,
    schemaVersion: graphDocument.schemaVersion,
    exportVersion: 1,
    shards: [],
  };

  for (const [group, entries] of bucketBy(evidenceSources, shardGroupForEvidence)) {
    const relativePath = path.join("evidence-sources", `${sanitizeShardName(group)}.json`);
    writeJson(path.join(targetDir, relativePath), {
      kind: "EvidenceShard",
      entryKind: "evidence-sources",
      group,
      generatedAt: graphDocument.generatedAt,
      entries,
    });
    manifest.shards.push({
      entryKind: "evidence-sources",
      group,
      relativePath: relativePath.replace(/\\/g, "/"),
      entryCount: entries.length,
    });
  }

  for (const [group, entries] of bucketBy(claims, shardGroupForClaim)) {
    const relativePath = path.join("claims", `${sanitizeShardName(group)}.json`);
    writeJson(path.join(targetDir, relativePath), {
      kind: "EvidenceShard",
      entryKind: "claims",
      group,
      generatedAt: graphDocument.generatedAt,
      entries,
    });
    manifest.shards.push({
      entryKind: "claims",
      group,
      relativePath: relativePath.replace(/\\/g, "/"),
      entryCount: entries.length,
    });
  }

  manifest.shards.sort((left, right) =>
    `${left.entryKind}:${left.group}`.localeCompare(`${right.entryKind}:${right.group}`),
  );

  writeJson(path.join(targetDir, "manifest.json"), manifest);

  console.log(
    JSON.stringify(
      {
        generatedAt: manifest.generatedAt,
        graphId: manifest.graphId,
        shardCount: manifest.shards.length,
        evidenceSourceCount: evidenceSources.length,
        claimCount: claims.length,
      },
      null,
      2,
    ),
  );
}

main();
