import { Command } from "commander";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { formatTable, printError } from "../output.js";
import { resolveConfigRoot } from "../../config.js";
import { TaskRuleSchema } from "../../types.js";
import type { TaskRule } from "../../types.js";

interface GlobalOpts {
  json?: boolean;
  repoRoot?: string;
  configRoot?: string;
}

function rulesPath(opts: GlobalOpts): string {
  return join(resolveConfigRoot({
    repoRoot: opts.repoRoot,
    configRoot: opts.configRoot,
  }), "task-rules.json");
}

function readRules(opts: GlobalOpts): TaskRule[] {
  const filePath = rulesPath(opts);
  if (!existsSync(filePath)) {
    return [];
  }

  const parsed = JSON.parse(readFileSync(filePath, "utf-8")) as unknown;
  return TaskRuleSchema.array().parse(parsed);
}

function writeRules(opts: GlobalOpts, rules: TaskRule[]): void {
  const filePath = rulesPath(opts);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(rules, null, 2) + "\n", "utf-8");
}

export function createRulesCommand(): Command {
  const cmd = new Command("rules").description("Manage task routing rules");

  cmd
    .command("list")
    .description("List task routing rules")
    .action((_opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;
      try {
        const values = readRules(allOpts);
        if (jsonMode) {
          console.log(JSON.stringify(values, null, 2));
        } else if (values.length === 0) {
          console.log("No rules found.");
        } else {
          console.log(formatTable(
            values.map((rule) => [rule.id, rule.responderId, rule.domain ?? "", (rule.tags ?? []).join(", ")]),
            ["ID", "Responder", "Domain", "Tags"],
          ));
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("add")
    .description("Add a task routing rule")
    .argument("<ruleId>", "Rule ID")
    .requiredOption("-e, --responder <responderId>", "Responder ID")
    .option("--domain <domain>", "Domain matcher")
    .option("--tag <tag...>", "Tag matcher")
    .action((ruleId: string, opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;
      const localOpts = opts as { responder: string; domain?: string; tag?: string[] };
      try {
        const rule = TaskRuleSchema.parse({
          id: ruleId,
          responderId: localOpts.responder,
          domain: localOpts.domain,
          tags: localOpts.tag,
        });
        const existing = readRules(allOpts).filter((entry) => entry.id !== rule.id);
        writeRules(allOpts, [...existing, rule]);
        console.log(jsonMode ? JSON.stringify(rule, null, 2) : `Added rule ${rule.id}.`);
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("remove")
    .description("Remove a task routing rule")
    .argument("<ruleId>", "Rule ID")
    .action((ruleId: string, _opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;
      try {
        const values = readRules(allOpts);
        const next = values.filter((rule) => rule.id !== ruleId);
        if (next.length === values.length) throw new Error(`Rule not found: ${ruleId}`);
        writeRules(allOpts, next);
        const result = { id: ruleId, removed: true };
        console.log(jsonMode ? JSON.stringify(result, null, 2) : `Removed rule ${ruleId}.`);
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  return cmd;
}
