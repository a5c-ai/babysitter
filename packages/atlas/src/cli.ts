#!/usr/bin/env node
import { buildIndex } from "./indexer";
import { getEdgeKinds, getNeighbors, getNodeKinds, getRecord, getStats, searchRecords } from "./index";

function valueAfter(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function numberAfter(args: string[], name: string, fallback: number): number {
  const value = valueAfter(args, name);
  const parsed = value ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function print(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function usage(): never {
  process.stderr.write([
    "Usage: atlas <command>",
    "",
    "Commands:",
    "  stats",
    "  kinds",
    "  edges",
    "  get <node-id>",
    "  search <query> [--limit n] [--kind kind] [--cluster cluster]",
    "  neighbors <node-id> [--depth n]",
    "  reindex --catalog-dir <path> --out <path>",
    "",
  ].join("\n"));
  process.exit(1);
}

function main(): void {
  const [, , command, ...args] = process.argv;
  if (!command || command === "help" || command === "--help" || command === "-h") usage();

  if (command === "stats") {
    print(getStats());
    return;
  }

  if (command === "kinds") {
    print(getNodeKinds());
    return;
  }

  if (command === "edges") {
    print(getEdgeKinds());
    return;
  }

  if (command === "get") {
    const id = args[0];
    if (!id) usage();
    const record = getRecord(id);
    if (!record) {
      process.stderr.write(`record not found: ${id}\n`);
      process.exit(2);
    }
    print(record);
    return;
  }

  if (command === "search") {
    const queryParts = args.filter((arg, index) => !arg.startsWith("--") && !args[index - 1]?.startsWith("--"));
    const query = queryParts.join(" ").trim();
    if (!query) usage();
    print(searchRecords(query, { limit: numberAfter(args, "--limit", 25), kind: valueAfter(args, "--kind"), cluster: valueAfter(args, "--cluster") }));
    return;
  }

  if (command === "neighbors") {
    const id = args[0];
    if (!id) usage();
    const result = getNeighbors(id, numberAfter(args, "--depth", 1));
    print({ nodes: Array.from(result.nodes), edges: result.edges });
    return;
  }

  if (command === "reindex") {
    const catalogDir = valueAfter(args, "--catalog-dir");
    const outFile = valueAfter(args, "--out");
    if (!catalogDir || !outFile) usage();
    const index = buildIndex({ catalogDir, outFile });
    print(index.stats);
    return;
  }

  usage();
}

main();
