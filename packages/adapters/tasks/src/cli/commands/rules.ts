import { promises as fs } from "node:fs";
import * as path from "node:path";
import { Command } from "commander";
import { resolveRoutingConfigPath, resolveConfigRoot } from "../../config.js";
import type { RoutingConfig, RoutingRule } from "../../types.js";
import { printError } from "../output.js";

interface GlobalOpts {
  json?: boolean;
  repoRoot?: string;
  configRoot?: string;
}

interface StoredRoutingConfig extends RoutingConfig {
  routes: Array<RoutingRule & { id?: string }>;
}

function routingPath(opts: GlobalOpts): string {
  return resolveRoutingConfigPath(resolveConfigRoot({
    repoRoot: opts.repoRoot,
    configRoot: opts.configRoot,
  }));
}

async function readRoutingConfig(filePath: string): Promise<StoredRoutingConfig> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StoredRoutingConfig>;
    return {
      defaultBackend: parsed.defaultBackend ?? "git-native",
      routes: parsed.routes ?? [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { defaultBackend: "git-native", routes: [] };
    }
    throw error;
  }
}

async function writeRoutingConfig(filePath: string, config: StoredRoutingConfig): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

function printValue(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export function createRulesCommand(): Command {
  const cmd = new Command("rules").description("Manage tasks-adapter routing rules");

  cmd
    .command("list")
    .description("List routing rules")
    .action(async (_opts: Record<string, never>, command: Command) => {
      const allOpts = command.optsWithGlobals() as GlobalOpts;
      try {
        printValue((await readRoutingConfig(routingPath(allOpts))).routes);
      } catch (error) {
        printError(error, allOpts.json === true);
        process.exitCode = 1;
      }
    });

  cmd
    .command("add")
    .description("Add or replace a routing rule")
    .argument("<ruleId>", "Rule id")
    .requiredOption("--backend <backend>", "Backend name")
    .option("--domain <csv>", "Comma-separated domains")
    .option("--tag <csv>", "Comma-separated tags")
    .action(async (ruleId: string, opts: Record<string, string | undefined>, command: Command) => {
      const allOpts = command.optsWithGlobals() as GlobalOpts;
      try {
        const filePath = routingPath(allOpts);
        const config = await readRoutingConfig(filePath);
        const rule = {
          id: ruleId,
          backend: opts.backend ?? "git-native",
          backendConfig: {},
          domains: splitCsv(opts.domain),
          tags: splitCsv(opts.tag),
        };
        const existingIndex = config.routes.findIndex((item) => item.id === ruleId);
        if (existingIndex === -1) config.routes.push(rule);
        else config.routes[existingIndex] = rule;
        await writeRoutingConfig(filePath, config);
        printValue(rule);
      } catch (error) {
        printError(error, allOpts.json === true);
        process.exitCode = 1;
      }
    });

  cmd
    .command("remove")
    .description("Remove a routing rule")
    .argument("<ruleId>", "Rule id")
    .action(async (ruleId: string, _opts: Record<string, never>, command: Command) => {
      const allOpts = command.optsWithGlobals() as GlobalOpts;
      try {
        const filePath = routingPath(allOpts);
        const config = await readRoutingConfig(filePath);
        const before = config.routes.length;
        config.routes = config.routes.filter((rule) => rule.id !== ruleId);
        await writeRoutingConfig(filePath, config);
        printValue({ id: ruleId, removed: before !== config.routes.length });
      } catch (error) {
        printError(error, allOpts.json === true);
        process.exitCode = 1;
      }
    });

  return cmd;
}

function splitCsv(value: string | undefined): string[] | undefined {
  return value?.split(",").map((item) => item.trim()).filter(Boolean);
}
