import { promises as fs } from "node:fs";
import * as path from "node:path";
import { Command } from "commander";
import { resolveConfigRoot } from "../../config.js";
import { printError } from "../output.js";

interface GlobalOpts {
  json?: boolean;
  repoRoot?: string;
  configRoot?: string;
}

interface TemplateRecord {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

function templatesPath(opts: GlobalOpts): string {
  return path.join(resolveConfigRoot({
    repoRoot: opts.repoRoot,
    configRoot: opts.configRoot,
  }), "tasks-mux", "templates.json");
}

async function readTemplates(filePath: string): Promise<TemplateRecord[]> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as TemplateRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeTemplates(filePath: string, templates: TemplateRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(templates, null, 2) + "\n", "utf-8");
}

function printValue(value: unknown, jsonMode: boolean): void {
  if (jsonMode || Array.isArray(value) || typeof value === "object") {
    console.log(JSON.stringify(value, null, 2));
    return;
  }
  console.log(String(value));
}

export function createTemplatesCommand(): Command {
  const cmd = new Command("templates").description("Manage reusable task templates");

  cmd
    .command("list")
    .description("List task templates")
    .action(async (_opts: Record<string, never>, command: Command) => {
      const allOpts = command.optsWithGlobals() as GlobalOpts;
      const jsonMode = allOpts.json === true;
      try {
        printValue(await readTemplates(templatesPath(allOpts)), jsonMode);
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("show")
    .description("Show a task template")
    .argument("<templateId>", "Template id")
    .action(async (templateId: string, _opts: Record<string, never>, command: Command) => {
      const allOpts = command.optsWithGlobals() as GlobalOpts;
      const jsonMode = allOpts.json === true;
      try {
        const template = (await readTemplates(templatesPath(allOpts))).find((item) => item.id === templateId);
        if (!template) throw new Error(`Template not found: ${templateId}`);
        printValue(template, jsonMode);
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  cmd
    .command("create")
    .description("Create or replace a task template")
    .argument("<templateId>", "Template id")
    .requiredOption("--title <title>", "Template title")
    .requiredOption("--body <body>", "Template body")
    .action(async (templateId: string, opts: Record<string, string>, command: Command) => {
      const allOpts = command.optsWithGlobals() as GlobalOpts;
      const jsonMode = allOpts.json === true;
      try {
        const filePath = templatesPath(allOpts);
        const templates = await readTemplates(filePath);
        const next: TemplateRecord = {
          id: templateId,
          title: opts.title,
          body: opts.body,
          createdAt: new Date().toISOString(),
        };
        const existingIndex = templates.findIndex((item) => item.id === templateId);
        if (existingIndex === -1) templates.push(next);
        else templates[existingIndex] = next;
        await writeTemplates(filePath, templates);
        printValue(next, jsonMode);
      } catch (error) {
        printError(error, jsonMode);
        process.exitCode = 1;
      }
    });

  return cmd;
}
