import { promises as fs } from "node:fs";
import path from "node:path";
import { getGlobalLogDir } from "../../config";
import type {
  PolicyDecisionLog,
  PolicyDecisionReporter,
  RuntimeGovernanceConfig,
} from "./types";

const LOG_FILENAME = "governance-decisions.jsonl";

export function resolvePolicyDecisionLogDir(runId: string, governance?: RuntimeGovernanceConfig): string {
  const logRoot = governance?.auditLogDir ? path.resolve(governance.auditLogDir) : getGlobalLogDir();
  return path.join(logRoot, runId);
}

export async function logPolicyDecision(logDir: string, entry: PolicyDecisionLog): Promise<void> {
  await fs.mkdir(logDir, { recursive: true });
  await fs.appendFile(path.join(logDir, LOG_FILENAME), JSON.stringify(entry) + "\n", "utf8");
}

export async function readPolicyDecisionLog(logDir: string): Promise<PolicyDecisionLog[]> {
  try {
    const content = await fs.readFile(path.join(logDir, LOG_FILENAME), "utf8");
    return content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as PolicyDecisionLog);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function createPolicyDecisionReporter(
  runId: string,
  governance?: RuntimeGovernanceConfig
): PolicyDecisionReporter {
  const logDir = resolvePolicyDecisionLogDir(runId, governance);
  return async (entry) => {
    await logPolicyDecision(logDir, entry);
  };
}
