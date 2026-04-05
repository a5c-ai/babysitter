import type { HarnessAdapter } from "../harness/types";

export interface HarnessCapabilityReport {
  requirementList: boolean;
  explicitSkillInvocation: boolean;
  sessionThreads: boolean;
  symlinkSkillDiscovery: boolean;
  approvalFlow: boolean;
  subagentFanOut: boolean;
}

const DEFAULT_CAPABILITIES: HarnessCapabilityReport = {
  requirementList: false,
  explicitSkillInvocation: false,
  sessionThreads: false,
  symlinkSkillDiscovery: false,
  approvalFlow: false,
  subagentFanOut: false,
};

const CODEX_CAPABILITIES: HarnessCapabilityReport = {
  requirementList: true,
  explicitSkillInvocation: true,
  sessionThreads: true,
  symlinkSkillDiscovery: true,
  approvalFlow: true,
  subagentFanOut: true,
};

const HARNESS_CAPABILITIES: Record<string, HarnessCapabilityReport> = {
  codex: CODEX_CAPABILITIES,
};

export function resolveActiveHarnessName(env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (env.CODEX_THREAD_ID || env.CODEX_SESSION_ID || env.CODEX_PLUGIN_ROOT) {
    return "codex";
  }
  return undefined;
}

export function detectHarnessCapabilities(
  input?: string | Pick<HarnessAdapter, "name">
): HarnessCapabilityReport {
  const name = typeof input === "string" ? input : input?.name;
  if (!name) {
    return { ...DEFAULT_CAPABILITIES };
  }
  const matched = HARNESS_CAPABILITIES[name];
  return matched ? { ...matched } : { ...DEFAULT_CAPABILITIES };
}
