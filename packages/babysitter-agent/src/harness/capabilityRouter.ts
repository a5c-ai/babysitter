/**
 * Capability-based task routing (GAP-HADAPT-001).
 *
 * Scores harness candidates against task requirements and selects
 * the best match. Pure functions, no side effects.
 */

import type { HarnessCapability, HarnessDiscoveryResult } from "./types";
import { HarnessCapability as Cap } from "./types";
import { KNOWN_HARNESSES } from "@a5c-ai/babysitter-sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** What a task needs from a harness. */
export interface TaskRequirements {
  /** Capabilities that MUST be present (missing = disqualified). */
  requiredCapabilities: HarnessCapability[];
  /** Preferred model name (exact match > partial > none). */
  preferredModel?: string;
  /** Tools the task needs available. */
  requiredTools: string[];
  /** Permissions the task needs. */
  requiredPermissions: string[];
  /** Preferred harness name (soft preference, not hard requirement). */
  preferredHarness?: string;
}

/** A harness candidate for routing. */
export interface HarnessCandidate {
  name: string;
  capabilities: HarnessCapability[];
  supportedModels: string[];
  availableTools: string[];
  permissions: string[];
}

/** Score breakdown for a single candidate. */
export interface ScoreBreakdown {
  capabilities: number;
  model: number;
  tools: number;
  permissions: number;
}

/** Per-candidate score entry. */
export interface CandidateScore {
  name: string;
  total: number;
  breakdown: ScoreBreakdown;
  disqualified: boolean;
}

/** Result of routing — null if no suitable candidate found. */
export interface RoutingResult {
  selected: HarnessCandidate;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  scores: CandidateScore[];
  candidates: HarnessCandidate[];
}

// ---------------------------------------------------------------------------
// Scoring weights
// ---------------------------------------------------------------------------

const WEIGHT_CAPABILITIES = 40;
const WEIGHT_MODEL = 25;
const WEIGHT_TOOLS = 20;
const WEIGHT_PERMISSIONS = 15;
const SCORE_THRESHOLD = 50;

// ---------------------------------------------------------------------------
// Core routing
// ---------------------------------------------------------------------------

function scoreCandidate(
  requirements: TaskRequirements,
  candidate: HarnessCandidate,
): CandidateScore {
  const breakdown: ScoreBreakdown = {
    capabilities: 0,
    model: 0,
    tools: 0,
    permissions: 0,
  };

  // -- Capabilities (hard requirement: all must be present) --
  const reqCaps = requirements.requiredCapabilities;
  if (reqCaps.length === 0) {
    breakdown.capabilities = WEIGHT_CAPABILITIES;
  } else {
    const hasAll = reqCaps.every((c) => candidate.capabilities.includes(c));
    if (!hasAll) {
      return { name: candidate.name, total: 0, breakdown, disqualified: true };
    }
    breakdown.capabilities = WEIGHT_CAPABILITIES;
  }

  // -- Model (exact > partial family > no match) --
  if (!requirements.preferredModel) {
    breakdown.model = WEIGHT_MODEL;
  } else {
    const preferred = requirements.preferredModel.toLowerCase();
    const hasExact = candidate.supportedModels.some(
      (m) => m.toLowerCase() === preferred,
    );
    if (hasExact) {
      breakdown.model = WEIGHT_MODEL;
    } else {
      // Partial: same family prefix (e.g., "claude-opus" matches "claude-opus-4-0")
      const family = preferred.split("-").slice(0, 2).join("-");
      const hasFamily = candidate.supportedModels.some((m) =>
        m.toLowerCase().startsWith(family),
      );
      breakdown.model = hasFamily ? Math.round(WEIGHT_MODEL * 0.6) : 0;
    }
  }

  // -- Tools (ratio of matched) --
  const reqTools = requirements.requiredTools;
  if (reqTools.length === 0) {
    breakdown.tools = WEIGHT_TOOLS;
  } else {
    const matched = reqTools.filter((t) =>
      candidate.availableTools.some(
        (at) => at.toLowerCase() === t.toLowerCase(),
      ),
    ).length;
    breakdown.tools = Math.round((matched / reqTools.length) * WEIGHT_TOOLS);
  }

  // -- Permissions (ratio of matched) --
  const reqPerms = requirements.requiredPermissions;
  if (reqPerms.length === 0) {
    breakdown.permissions = WEIGHT_PERMISSIONS;
  } else {
    const matched = reqPerms.filter((p) =>
      candidate.permissions.some(
        (cp) => cp.toLowerCase() === p.toLowerCase(),
      ),
    ).length;
    breakdown.permissions = Math.round(
      (matched / reqPerms.length) * WEIGHT_PERMISSIONS,
    );
  }

  const total =
    breakdown.capabilities +
    breakdown.model +
    breakdown.tools +
    breakdown.permissions;

  return { name: candidate.name, total, breakdown, disqualified: false };
}

/**
 * Select the best harness candidate for a set of task requirements.
 * Returns null if no candidate meets the threshold (50).
 */
export function selectHarness(
  requirements: Partial<TaskRequirements>,
  candidates: HarnessCandidate[],
): RoutingResult | null {
  if (candidates.length === 0) return null;

  const fullReqs: TaskRequirements = {
    requiredCapabilities: requirements.requiredCapabilities ?? [],
    preferredModel: requirements.preferredModel,
    requiredTools: requirements.requiredTools ?? [],
    requiredPermissions: requirements.requiredPermissions ?? [],
    preferredHarness: requirements.preferredHarness,
  };

  const scores = candidates.map((c) => scoreCandidate(fullReqs, c));

  // Filter out disqualified candidates
  const eligible = scores.filter((s) => !s.disqualified);
  if (eligible.length === 0) return null;

  // Sort by total score descending; preferred harness breaks ties
  eligible.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    // Tiebreaker: prefer the harness named in preferredHarness
    if (fullReqs.preferredHarness) {
      if (a.name === fullReqs.preferredHarness) return -1;
      if (b.name === fullReqs.preferredHarness) return 1;
    }
    return 0;
  });

  const best = eligible[0];
  if (best.total < SCORE_THRESHOLD) return null;

  const selected = candidates.find((c) => c.name === best.name)!;

  return {
    selected,
    score: best.total,
    scoreBreakdown: best.breakdown,
    scores,
    candidates,
  };
}

// ---------------------------------------------------------------------------
// Discovery enrichment
// ---------------------------------------------------------------------------

/** Known capability mappings for harnesses not captured in discovery. */
const KNOWN_CAPABILITY_MAP: Record<string, HarnessCapability[]> = {};

// Build map from KNOWN_HARNESSES
for (const spec of KNOWN_HARNESSES) {
  // All known harnesses support Programmatic invocation
  const caps = [...spec.capabilities];
  if (!caps.includes(Cap.Programmatic)) {
    caps.unshift(Cap.Programmatic);
  }
  KNOWN_CAPABILITY_MAP[spec.name] = caps;
}

/**
 * Enrich discovery results with capabilities from the known harness registry.
 * Merges discovered capabilities with known capabilities, deduplicating.
 */
export function enrichDiscoveryWithCapabilities(
  discoveries: HarnessDiscoveryResult[],
): HarnessDiscoveryResult[] {
  return discoveries.map((d) => {
    const known = KNOWN_CAPABILITY_MAP[d.name];
    if (!known) return d;

    const merged = [...new Set([...d.capabilities, ...known])];
    return { ...d, capabilities: merged };
  });
}

// ---------------------------------------------------------------------------
// TaskDef → TaskRequirements extraction
// ---------------------------------------------------------------------------

interface TaskDefLike {
  kind: string;
  execution?: {
    harness?: string;
    model?: string;
    permissions?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Build TaskRequirements from a TaskDef's execution hints and kind.
 */
export function buildTaskRequirements(
  taskDef: Partial<TaskDefLike>,
): TaskRequirements {
  const exec = taskDef.execution ?? {};
  const requiredCapabilities: HarnessCapability[] = [];

  // Map task kind to required capabilities
  if (taskDef.kind === "breakpoint") {
    requiredCapabilities.push(Cap.HeadlessPrompt);
  }
  if (taskDef.kind === "orchestrator_task") {
    requiredCapabilities.push(Cap.Programmatic);
  }

  return {
    requiredCapabilities,
    preferredModel: exec.model,
    requiredTools: [],
    requiredPermissions: (exec.permissions) ?? [],
    preferredHarness: exec.harness,
  };
}
