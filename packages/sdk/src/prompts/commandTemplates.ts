import { readFileSync } from "node:fs";
import { resolveTemplatePath, renderTemplateString } from "./templateRenderer";
import type { PromptContext } from "./types";

export type CommandTemplateName =
  | "anycli"
  | "assimilate"
  | "cleanup"
  | "contrib"
  | "doctor"
  | "forever"
  | "project-install"
  | "retrospect"
  | "user-install";

const COMMAND_TEMPLATE_CONTEXT: PromptContext = {
  harness: "sdk-command-template",
  harnessLabel: "SDK Command Template",
  interactive: undefined,
  capabilities: [],
  platform: process.platform,
  pluginRootVar: "",
  loopControlTerm: "",
  sessionBindingFlags: "",
  hookDriven: false,
  interactiveToolName: "",
  sessionEnvVars: "",
  resumeFlags: "",
  sdkVersionExpr: "",
  hasIntentFidelityChecks: false,
  hasNonNegotiables: false,
  cliSetupSnippet: "",
  iterateFlags: "",
};

export function resolveCommandTemplatePath(templateName: CommandTemplateName): string {
  return resolveTemplatePath(`commands/${templateName}.md`);
}

export function renderCommandTemplate(
  templateName: CommandTemplateName,
  extras?: Record<string, string>,
): string {
  const raw = readFileSync(resolveCommandTemplatePath(templateName), "utf8");
  return renderTemplateString(raw, COMMAND_TEMPLATE_CONTEXT, extras);
}
