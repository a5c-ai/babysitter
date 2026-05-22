import * as path from "node:path";
import { promises as fs } from "node:fs";
import { pathToFileURL } from "node:url";
import { resetGlobalTaskRegistry } from "@a5c-ai/babysitter-sdk";
import {
  BabysitterRuntimeError,
  ErrorCategory,
} from "../utils";
import { execShellEffect } from "./delegation";
import {
  assumesRuntimeWorkspacePathWithoutModuleFallback,
  hasNamedProcessGlobalReferenceConflict,
} from "./validationText";
import {
  getDefineTaskIdsByKind,
  getDefineTaskIdsMissingKind,
  getDefineTaskKindShapeMismatches,
  getInvalidCtxTaskTargets,
  getUnresolvedTemplatePlaceholders,
  hasDefineTaskBlocks,
  hasCtxTaskInvocation,
} from "./validationSource";

let processValidationImportNonce = 0;

const dynamicImportModule: (specifier: string) => Promise<Record<string, unknown>> = (() => {
  if (process.env.VITEST) {
    return (specifier: string) => import(specifier);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<Record<string, unknown>>;
})();

async function ensureSdkResolvable(workspaceDir: string): Promise<void> {
  const sdkPkg = path.dirname(require.resolve("@a5c-ai/babysitter-sdk/package.json"));
  const targetNodeModules = path.join(workspaceDir, "node_modules");
  const targetSdkDir = path.join(targetNodeModules, "@a5c-ai", "babysitter-sdk");

  try {
    await fs.access(targetSdkDir);
    return;
  } catch {
    // create below
  }

  try {
    await fs.mkdir(path.join(targetNodeModules, "@a5c-ai"), { recursive: true });
    const linkType = process.platform === "win32" ? "junction" : "dir";
    await fs.symlink(sdkPkg, targetSdkDir, linkType);
  } catch {
    // best effort
  }
}

export async function validateProcessExport(filePath: string): Promise<void> {
  const source = await fs.readFile(path.resolve(filePath), "utf8");
  const syntaxCheck = await execShellEffect(process.execPath, ["--check", path.resolve(filePath)]);
  if (syntaxCheck.exitCode !== 0) {
    const diagnostic = [syntaxCheck.stdout, syntaxCheck.stderr]
      .map((value) => value.trim())
      .filter(Boolean)
      .join("\n");
    throw new BabysitterRuntimeError(
      "InvalidProcessSyntaxError",
      diagnostic
        ? `Process file at ${filePath} failed \`node --check\`.\n${diagnostic}`
        : `Process file at ${filePath} failed \`node --check\`.`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Rewrite the file so it is syntactically valid ESM before runtime import",
          "If the process writes HTML/CSS/JS assets, do not embed raw nested template literals inside outer template literals",
          "Prefer String.raw, arrays joined with \"\\n\", or escaped inner backticks and \\${...} sequences when embedding source files",
        ],
      },
    );
  }
  if (hasNamedProcessGlobalReferenceConflict(source)) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} references \`process.\` inside the named 'process' export, which shadows Node's global process object`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "If the process needs the workspace root, resolve it from the module location with import.meta.url",
          "If you need Node's global process object, use globalThis.process or import it under another name such as nodeProcess",
        ],
      },
    );
  }
  if (assumesRuntimeWorkspacePathWithoutModuleFallback(source)) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} assumes ctx.workspaceDir or ctx.cwd exists, but the runtime process context does not provide workspace paths`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "When the process needs the workspace root, derive it from the module location with import.meta.url",
          "For a generated process in the workspace root, use path.dirname(fileURLToPath(import.meta.url)) or an equivalent import.meta.url-based approach",
        ],
      },
    );
  }
  const unresolvedPlaceholders = getUnresolvedTemplatePlaceholders(source);
  if (unresolvedPlaceholders.length > 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} contains unresolved template placeholders: ${unresolvedPlaceholders.join(", ")}`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Do not leave {{workspaceDir}}, {{gameRequest}}, or similar template placeholders in task prompts, shell commands, or node args",
          "Build concrete prompt text and shell commands from defineTask(args, taskCtx) inputs when returning each TaskDef",
          "If a task needs workspaceDir or request text, interpolate the actual args value into the returned TaskDef before runtime",
        ],
      },
    );
  }
  await ensureSdkResolvable(path.dirname(path.resolve(filePath)));
  const moduleUrl = `${pathToFileURL(path.resolve(filePath)).href}?t=${Date.now()}-${++processValidationImportNonce}`;
  resetGlobalTaskRegistry();
  let mod: Record<string, unknown>;
  try {
    mod = await dynamicImportModule(moduleUrl);
  } finally {
    resetGlobalTaskRegistry();
  }
  const fn = mod.process;
  if (typeof fn !== "function") {
    throw new BabysitterRuntimeError(
      "InvalidProcessExportError",
      `Process file at ${filePath} does not export a function named 'process'`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Ensure the file exports: async function process(inputs, ctx) { ... }",
        ],
      },
    );
  }
  if (!hasDefineTaskBlocks(source)) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} does not define any babysitter tasks via defineTask(...)`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Create at least one task with const taskName = defineTask(\"task-id\", (args, taskCtx) => ({ ... }))",
          "Move the main implementation and verification work into those tasks instead of doing it directly in process(inputs, ctx)",
          "Have process(inputs, ctx) orchestrate the work by awaiting ctx.task(taskName, args)",
        ],
      },
    );
  }
  const taskIdsMissingKind = getDefineTaskIdsMissingKind(source);
  if (taskIdsMissingKind.length > 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} defines task(s) without a top-level kind: ${taskIdsMissingKind.join(", ")}`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Every TaskDef returned from defineTask(...) must include a top-level kind string",
          "Use kind: \"agent\" with agent: { ... }, kind: \"shell\" with shell: { command: ... }, or another supported effect kind that the agent will execute and post manually",
        ],
      },
    );
  }
  if (!hasCtxTaskInvocation(source)) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} does not invoke any babysitter tasks through ctx.task(...)`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "After defining tasks with defineTask(...), run them from process(inputs, ctx) via await ctx.task(taskName, args)",
          "Do not perform the main implementation directly in process(inputs, ctx)",
        ],
      },
    );
  }
  const taskKindShapeMismatches = getDefineTaskKindShapeMismatches(source);
  if (taskKindShapeMismatches.length > 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} has task definition kind mismatches: ${taskKindShapeMismatches
        .map((mismatch) => `${mismatch.id} should use kind "${mismatch.expectedKind}"`)
        .join(", ")}`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Match each task's kind to its body shape",
          "Agent tasks must use kind: \"agent\" and shell tasks must use kind: \"shell\". Do not generate node task definitions in authored processes",
        ],
      },
    );
  }
  const agentTaskIds = getDefineTaskIdsByKind(source, "agent");
  if (agentTaskIds.length === 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} does not define any agent tasks`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Define at least one agent task with kind: \"agent\" for the main planning, implementation, or refinement work",
          "Use shell tasks only for concrete runnable commands such as tests, builds, package installs, or linters",
        ],
      },
    );
  }
  const nodeTaskIds = getDefineTaskIdsByKind(source, "node");
  if (nodeTaskIds.length > 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} defines forbidden node tasks: ${nodeTaskIds.join(", ")}`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Replace each node task with an agent or skill task",
          "If the work is a concrete existing CLI command, use a shell task and have the orchestrating agent execute it and post the result",
        ],
      },
    );
  }
  const invalidCtxTaskTargets = getInvalidCtxTaskTargets(source);
  if (invalidCtxTaskTargets.length > 0) {
    throw new BabysitterRuntimeError(
      "InvalidProcessSourceError",
      `Process file at ${filePath} calls ctx.task(...) with values that are not DefinedTask bindings created via defineTask(...): ${invalidCtxTaskTargets.join(", ")}`,
      {
        category: ErrorCategory.Validation,
        nextSteps: [
          "Define each task with const taskName = defineTask(\"task-id\", (args, taskCtx) => ({ ... }))",
          "Pass only those DefinedTask bindings to await ctx.task(taskName, args)",
          "Do not pass plain object task definitions, inline literals, or ad-hoc task objects to ctx.task(...)",
        ],
      },
    );
  }
}
