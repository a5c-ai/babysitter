import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { loadGraph } from "./graph.mjs";
import { createQuery } from "./query.mjs";
import { renderTemplate } from "./template.mjs";

export function hashContent(content) {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

async function readSpec(specPath) {
  const text = await fs.readFile(specPath, "utf8");
  if (specPath.endsWith(".json")) return JSON.parse(text);
  return parse(text);
}

async function writeIfChanged(filePath, content) {
  try {
    const existing = await fs.readFile(filePath, "utf8");
    if (existing === content) return false;
  } catch {
    // Missing file is expected on first generation.
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
  return true;
}

export async function runGeneratorSpec(specPath, options = {}) {
  const absoluteSpecPath = path.resolve(specPath);
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const spec = await readSpec(absoluteSpecPath);
  const graph = options.graph ?? (await loadGraph({ rootDir }));
  const query = createQuery(graph);
  const selectedNodes = query.select(spec.query ?? {});
  const templatePath = path.resolve(rootDir, spec.render?.template ?? spec.template);
  const template = await fs.readFile(templatePath, "utf8");
  const context = {
    graph: query.stats(),
    nodes: selectedNodes,
    node: selectedNodes[0],
    spec,
  };
  const content = `${renderTemplate(template, context).trimEnd()}\n`;
  const outputPath = path.resolve(rootDir, spec.output?.path ?? spec.output);
  const manifest = {
    generatorId: spec.id ?? path.basename(specPath),
    sourceSpec: path.relative(rootDir, absoluteSpecPath).replaceAll(path.sep, "/"),
    template: path.relative(rootDir, templatePath).replaceAll(path.sep, "/"),
    output: path.relative(rootDir, outputPath).replaceAll(path.sep, "/"),
    inputNodeIds: selectedNodes.map((node) => node.id).sort(),
    inputNodeKinds: [...new Set(selectedNodes.map((node) => node.nodeKind))].sort(),
    contentHash: hashContent(content),
  };

  if (options.dryRun) {
    return { spec, outputPath, manifest, content, wrote: false };
  }

  const wrote = await writeIfChanged(outputPath, content);
  const manifestPath = `${outputPath}.manifest.json`;
  await writeIfChanged(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { spec, outputPath, manifest, wrote };
}

