#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { loadGraph } from "./graph.mjs";
import { createQuery } from "./query.mjs";
import { renderTemplate } from "./template.mjs";
import { runGeneratorSpec } from "./generator.mjs";

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      flags[rawKey] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags[rawKey] = true;
    } else {
      flags[rawKey] = next;
      index += 1;
    }
  }
  return { positional, flags };
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printTable(rows, columns) {
  if (rows.length === 0) return;
  const widths = columns.map((column) => Math.max(column.length, ...rows.map((row) => String(row[column] ?? "").length)));
  process.stdout.write(`${columns.map((column, index) => column.padEnd(widths[index])).join("  ")}\n`);
  process.stdout.write(`${widths.map((width) => "-".repeat(width)).join("  ")}\n`);
  for (const row of rows) {
    process.stdout.write(`${columns.map((column, index) => String(row[column] ?? "").padEnd(widths[index])).join("  ")}\n`);
  }
}

function usage() {
  return `v6-graph <command> [options]

Commands:
  stats                         Print graph counts and diagnostics.
  validate                      Check loader diagnostics; --strict exits non-zero.
  kinds                         List node kinds and counts.
  nodes --kind <kind> [--q x]   List/query nodes.
  get <id>                      Show one node.
  edges <id>                    Show incoming/outgoing edges for a node.
  render --template <file>      Render a template from a query context.
  generate --spec <file>        Run a generator spec and write output+manifest.

Common options:
  --root <dir>                  Repo root. Defaults to current directory.
  --json                        Emit JSON.
  --limit <n>                   Limit node rows.
  --where <path=value>          Keep nodes where a field equals a value.
  --missing <path>              Keep nodes where a field is absent.
`;
}

async function buildContext(flags) {
  const rootDir = path.resolve(flags.root ?? process.cwd());
  const graph = await loadGraph({ rootDir });
  const query = createQuery(graph);
  return { rootDir, graph, query };
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help" || command === "-h") {
    process.stdout.write(usage());
    return;
  }

  const { positional, flags } = parseArgs(rest);

  if (command === "generate") {
    const spec = flags.spec ?? positional[0];
    if (!spec) throw new Error("generate requires --spec <file>.");
    const result = await runGeneratorSpec(spec, { rootDir: flags.root, dryRun: Boolean(flags["dry-run"]) });
    if (flags.json) printJson({ output: result.outputPath, manifest: result.manifest, wrote: result.wrote });
    else process.stdout.write(`${result.wrote ? "wrote" : "unchanged"} ${result.manifest.output}\n`);
    return;
  }

  const { rootDir, query } = await buildContext(flags);

  if (command === "stats") {
    const stats = query.stats();
    if (flags.json) printJson(stats);
    else {
      process.stdout.write(`nodes: ${stats.nodes}\nedges: ${stats.edges}\nfiles: ${stats.files}\nkinds: ${stats.kinds}\nrelations: ${stats.relations}\n`);
      process.stdout.write(`parseErrors: ${stats.diagnostics.parseErrors.length}\nduplicateNodeIds: ${stats.diagnostics.duplicateNodeIds.length}\ndanglingEdges: ${stats.diagnostics.danglingEdges.length}\n`);
    }
    return;
  }

  if (command === "validate") {
    const stats = query.stats();
    const diagnostics = stats.diagnostics;
    const ok = diagnostics.parseErrors.length === 0 && diagnostics.duplicateNodeIds.length === 0 && diagnostics.danglingEdges.length === 0;
    if (flags.json) printJson({ ok, diagnostics });
    else {
      process.stdout.write(`ok: ${ok}\nparseErrors: ${diagnostics.parseErrors.length}\nduplicateNodeIds: ${diagnostics.duplicateNodeIds.length}\ndanglingEdges: ${diagnostics.danglingEdges.length}\n`);
    }
    if (flags.strict && !ok) process.exitCode = 1;
    return;
  }

  if (command === "kinds") {
    const rows = Object.entries(query.stats().byKind).map(([kind, count]) => ({ kind, count }));
    if (flags.json) printJson(rows);
    else printTable(rows, ["kind", "count"]);
    return;
  }

  if (command === "nodes") {
    const nodes = query.select({ kind: flags.kind, q: flags.q, where: flags.where, limit: flags.limit, sort: flags.sort ?? "id", missing: flags.missing });
    if (flags.json) printJson(nodes);
    else printTable(nodes.map((node) => ({ id: node.id, kind: node.nodeKind, name: node.attributes?.displayName ?? "", file: node.sourceFile })), ["id", "kind", "name", "file"]);
    return;
  }

  if (command === "get") {
    const id = positional[0];
    if (!id) throw new Error("get requires <id>.");
    const node = query.get(id);
    if (!node) throw new Error(`Node not found: ${id}`);
    if (flags.json) printJson(node);
    else {
      process.stdout.write(`${node.id} (${node.nodeKind})\n`);
      process.stdout.write(`file: ${node.sourceFile}\n`);
      process.stdout.write(`${JSON.stringify(node.attributes ?? {}, null, 2)}\n`);
    }
    return;
  }

  if (command === "edges") {
    const id = positional[0];
    if (!id) throw new Error("edges requires <id>.");
    const direction = flags.direction ?? "both";
    const rows = query.related(id, { direction, relation: flags.relation }).map((item) => ({
      direction: item.direction,
      relation: item.edge.relation,
      node: item.node?.id ?? item.edge.target,
      kind: item.node?.nodeKind ?? "",
      file: item.edge.sourceFile,
    }));
    if (flags.json) printJson(rows);
    else printTable(rows, ["direction", "relation", "node", "kind", "file"]);
    return;
  }

  if (command === "render") {
    const templatePath = flags.template ?? positional[0];
    if (!templatePath) throw new Error("render requires --template <file>.");
    const nodes = query.select({ kind: flags.kind, q: flags.q, where: flags.where, limit: flags.limit, sort: flags.sort ?? "id", missing: flags.missing });
    const template = await fs.readFile(path.resolve(rootDir, templatePath), "utf8");
    const content = `${renderTemplate(template, { graph: query.stats(), nodes, node: nodes[0] }).trimEnd()}\n`;
    if (flags.stdout || !flags.out) process.stdout.write(content);
    else {
      const outputPath = path.resolve(rootDir, flags.out);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, content, "utf8");
      process.stdout.write(`wrote ${flags.out}\n`);
    }
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

