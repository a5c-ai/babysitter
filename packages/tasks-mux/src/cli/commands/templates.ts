import { Command } from "commander";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { formatTable, printError } from "../output.js";
import { resolveConfigRoot } from "../../config.js";
import { TaskTemplateSchema } from "../../types.js";
import type { TaskTemplate } from "../../types.js";

interface GlobalOpts {
  json?: boolean;
  repoRoot?: string;
  configRoot?: string;
}

function templatesPath(opts: GlobalOpts): string {
  return join(resolveConfigRoot({
    repoRoot: opts.repoRoot,
    configRoot: opts.configRoot,
  }), "task-templates.json");
}

function readTemplates(opts: GlobalOpts): TaskTemplate[] {
  const filePath = templatesPath(opts);
  if (!existsSync(filePath)) {
    return [];
  }

  const parsed = JSON.parse(readFileSync(filePath, "utf-8")) as unknown;
  return TaskTemplateSchema.array().parse(parsed);
}

function writeTemplates(opts: GlobalOpts, templates: TaskTemplate[]): void {
  const filePath = templatesPath(opts);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(templates, null, 2) + "\n", "utf-8");
}

export function createTemplatesCommand(): Command {
  const cmd = new Command("templates").description("Manage task templates");

  cmd
    .command("list")
    .description("List task templates")
    .action((_opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;
      try {
        const values = readTemplates(allOpts);
        if (jsonMode) {
          console.log(JSON.stringify(values, null, 2));
        } else if (values.length === 0) {
          console.log("No templates found.");
        } else {
          console.log(formatTable(
            values.map((template) => [template.id, template.title, template.kind ?? "task"]),
            ["ID", "Title", "Kind"],
          ));
        }
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("show")
    .description("Show a task template")
    .argument("<templateId>", "Template ID")
    .action((templateId: string, _opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;
      try {
        const template = readTemplates(allOpts).find((entry) => entry.id === templateId);
        if (!template) throw new Error(`Template not found: ${templateId}`);
        console.log(jsonMode ? JSON.stringify(template, null, 2) : `${template.id}\n${template.title}`);
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("create")
    .description("Create a task template")
    .argument("<templateId>", "Template ID")
    .requiredOption("--title <title>", "Template title")
    .option("--description <text>", "Template description")
    .option("--kind <kind>", "Template kind", "task")
    .action((templateId: string, opts: Record<string, unknown>, command: Command) => {
      const allOpts: GlobalOpts = command.optsWithGlobals();
      const jsonMode = allOpts.json === true;
      const localOpts = opts as { title: string; description?: string; kind?: "todo" | "task" | "breakpoint" };
      try {
        const template = TaskTemplateSchema.parse({
          id: templateId,
          title: localOpts.title,
          description: localOpts.description,
          kind: localOpts.kind ?? "task",
        });
        const existing = readTemplates(allOpts).filter((entry) => entry.id !== template.id);
        writeTemplates(allOpts, [...existing, template]);
        console.log(jsonMode ? JSON.stringify(template, null, 2) : `Created template ${template.id}.`);
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  return cmd;
}
