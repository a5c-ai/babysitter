import * as path from "node:path";
import { promises as fs } from "node:fs";
import {
  DIM,
  RESET,
  type ProcessDefinitionReport,
  writeVerboseBlock,
} from "../utils";
import {
  extractMentionedProcessPaths,
  waitForProcessFile,
} from "./paths";

function looksLikeProcessDefinitionSource(source: string): boolean {
  const normalized = source.trim();
  if (!normalized) {
    return false;
  }
  return (
    normalized.includes("defineTask(") ||
    /export\s+async\s+function\s+process\s*\(/.test(normalized) ||
    /export\s+default\s+async\s+function/.test(normalized) ||
    /export\s*\{\s*process\s*\}/.test(normalized)
  );
}

function extractProcessDefinitionCodeBlock(text: string): string | null {
  const codeBlockPattern = /```(?:javascript|js|mjs|ts)?\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  let fallback: string | null = null;

  while ((match = codeBlockPattern.exec(text)) !== null) {
    const candidate = match[1]?.trim();
    if (!candidate) {
      continue;
    }
    if (looksLikeProcessDefinitionSource(candidate)) {
      return candidate;
    }
    fallback ??= candidate;
  }

  return fallback;
}

export function buildPhaseConversationSummary(outputs: string[]): string {
  const trimmedOutputs = outputs
    .map((output) => output.replace(/\s+/g, " ").trim())
    .filter((output) => output.length > 0);
  if (trimmedOutputs.length === 0) {
    return "";
  }
  const joined = trimmedOutputs.slice(-3).join("\n\n---\n\n");
  return joined.length > 4_000 ? `${joined.slice(0, 3_997)}...` : joined;
}

async function recoverProcessDefinitionFromOutputs(args: {
  outputDir: string;
  workspace?: string;
  outputs: string[];
}): Promise<ProcessDefinitionReport | null> {
  const resolvedDir = path.resolve(args.outputDir);

  try {
    const entries = await fs.readdir(resolvedDir);
    const processFiles = entries.filter((entry) => /\.m?js$/.test(entry));
    if (processFiles.length > 0) {
      const candidatePath = path.join(resolvedDir, processFiles[0]);
      return {
        processPath: candidatePath,
        summary: "Recovered from missing process-definition tool report by scanning the output directory.",
      };
    }
  } catch {
    // directory may not exist yet
  }

  for (const output of args.outputs) {
    for (const candidatePath of extractMentionedProcessPaths(output, args.workspace)) {
      try {
        await waitForProcessFile(candidatePath, 1_000);
        return {
          processPath: candidatePath,
          summary: "Recovered process-definition output by using a path mentioned by the agent.",
        };
      } catch {
        // keep trying
      }
    }
  }

  for (const output of args.outputs) {
    const extracted = extractProcessDefinitionCodeBlock(output);
    if (!extracted || !looksLikeProcessDefinitionSource(extracted)) {
      continue;
    }
    const recoveredName = `recovered-process-${Date.now()}.mjs`;
    const recoveredPath = path.join(resolvedDir, recoveredName);
    await fs.mkdir(resolvedDir, { recursive: true });
    await fs.writeFile(recoveredPath, extracted, "utf8");
    return {
      processPath: recoveredPath,
      summary: "Recovered process-definition output by writing a JavaScript code block returned by the agent.",
    };
  }

  for (const output of args.outputs) {
    if (!looksLikeProcessDefinitionSource(output)) {
      continue;
    }
    const recoveredName = `recovered-process-${Date.now()}.mjs`;
    const recoveredPath = path.join(resolvedDir, recoveredName);
    await fs.mkdir(resolvedDir, { recursive: true });
    await fs.writeFile(recoveredPath, output.trim(), "utf8");
    return {
      processPath: recoveredPath,
      summary: "Recovered process-definition output by writing the agent's direct JavaScript response.",
    };
  }

  return null;
}

export async function recoverReportedProcessDefinition(args: {
  state: { report?: ProcessDefinitionReport };
  outputDir: string;
  workspace?: string;
  outputs: string[];
  verbose: boolean;
  json: boolean;
}): Promise<ProcessDefinitionReport | undefined> {
  if (args.state.report?.processPath) {
    return args.state.report;
  }

  const recovered = await recoverProcessDefinitionFromOutputs({
    outputDir: args.outputDir,
    workspace: args.workspace,
    outputs: args.outputs,
  });
  if (recovered) {
    args.state.report = recovered;
    writeVerboseBlock(args.verbose, args.json, "phasePlanProcess recovered report", recovered);
  }
  return recovered ?? undefined;
}

export function writeVerboseProcessDefinitionRecovery(json: boolean): void {
  if (!json) {
    process.stderr.write(`${DIM}PhasePlanProcess recovery: the agent did not report the process file, retrying with an explicit write-and-report instruction...${RESET}\n`);
  }
}
