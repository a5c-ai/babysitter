/**
 * Host Contract Layer (GAP-REMOTE-007).
 *
 * Defines the formal contract between babysitter and host environments.
 * Pure functions for resolving, validating, and building host manifests.
 */

import type { HarnessAdapter, HarnessDiscoveryResult, HarnessCapability } from "./types";
import { HarnessCapability as Cap } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommunicationProtocol = "stdio" | "websocket" | "http" | "mcp";

export interface HostLifecycleSupport {
  supportsSessionBinding: boolean;
  supportsStopHook: boolean;
  supportsGracefulShutdown: boolean;
  supportsHealthCheck: boolean;
}

export interface HostLimits {
  maxConcurrentSessions?: number;
  maxPromptTokens?: number;
  timeoutMs?: number;
}

export interface HostCapabilityManifest {
  harnessName: string;
  version?: string;
  capabilities: HarnessCapability[];
  supportedModels: string[];
  communication: {
    protocol: CommunicationProtocol;
    supportsStreaming: boolean;
    supportsJsonMode: boolean;
  };
  lifecycle: HostLifecycleSupport;
  limits: HostLimits;
}

export interface HostContractViolation {
  field: string;
  requirement: string;
  actual: string;
  severity: "error" | "warning";
}

export interface HostContractValidationResult {
  valid: boolean;
  violations: HostContractViolation[];
  capabilities: HarnessCapability[];
}

/** Optional requirements to validate a manifest against. */
export interface ManifestRequirements {
  requiredCapabilities?: HarnessCapability[];
  minTimeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Resolve: adapter → manifest
// ---------------------------------------------------------------------------

/**
 * Resolve a HarnessAdapter into a HostCapabilityManifest.
 * Uses the adapter's getCapabilities() if available, otherwise defaults.
 */
export function resolveHostCapabilities(
  adapter: HarnessAdapter,
): HostCapabilityManifest {
  const caps = adapter.getCapabilities?.() ?? [];

  const hasCapability = (cap: HarnessCapability) => caps.includes(cap);

  return {
    harnessName: adapter.name,
    version: undefined,
    capabilities: caps,
    supportedModels: [],
    communication: {
      protocol: "stdio" as CommunicationProtocol,
      supportsStreaming: hasCapability(Cap.Programmatic),
      supportsJsonMode: hasCapability(Cap.Programmatic),
    },
    lifecycle: {
      supportsSessionBinding: hasCapability(Cap.SessionBinding),
      supportsStopHook: hasCapability(Cap.StopHook),
      supportsGracefulShutdown: hasCapability(Cap.StopHook),
      supportsHealthCheck: false,
    },
    limits: {},
  };
}

// ---------------------------------------------------------------------------
// Validate: manifest → validation result
// ---------------------------------------------------------------------------

/**
 * Validate a HostCapabilityManifest for structural correctness and
 * optional conformance to task requirements.
 */
export function validateHostContract(
  manifest: HostCapabilityManifest,
  requirements?: ManifestRequirements,
): HostContractValidationResult {
  const violations: HostContractViolation[] = [];

  // Required fields
  if (!manifest.harnessName) {
    violations.push({
      field: "harnessName",
      requirement: "harnessName must be a non-empty string",
      actual: String(manifest.harnessName ?? "undefined"),
      severity: "error",
    });
  }

  // Capability-lifecycle consistency
  const hasCap = (cap: HarnessCapability) =>
    manifest.capabilities.includes(cap);

  if (hasCap(Cap.SessionBinding) && !manifest.lifecycle.supportsSessionBinding) {
    violations.push({
      field: "lifecycle.supportsSessionBinding",
      requirement:
        "SessionBinding capability declared but lifecycle.supportsSessionBinding is false",
      actual: "false",
      severity: "error",
    });
  }

  if (hasCap(Cap.StopHook) && !manifest.lifecycle.supportsStopHook) {
    violations.push({
      field: "lifecycle.supportsStopHook",
      requirement:
        "StopHook capability declared but lifecycle.supportsStopHook is false",
      actual: "false",
      severity: "error",
    });
  }

  // Task requirements validation
  if (requirements) {
    if (requirements.requiredCapabilities) {
      for (const cap of requirements.requiredCapabilities) {
        if (!hasCap(cap)) {
          violations.push({
            field: "capabilities",
            requirement: `Required capability: ${cap}`,
            actual: `Missing: ${cap}`,
            severity: "error",
          });
        }
      }
    }

    if (
      requirements.minTimeoutMs != null &&
      manifest.limits.timeoutMs != null &&
      manifest.limits.timeoutMs < requirements.minTimeoutMs
    ) {
      violations.push({
        field: "limits.timeoutMs",
        requirement: `Minimum timeout: ${requirements.minTimeoutMs}ms`,
        actual: `${manifest.limits.timeoutMs}ms`,
        severity: "error",
      });
    }
  }

  return {
    valid: violations.filter((v) => v.severity === "error").length === 0,
    violations,
    capabilities: manifest.capabilities,
  };
}

// ---------------------------------------------------------------------------
// Build: discovery result → manifest
// ---------------------------------------------------------------------------

/**
 * Construct a HostCapabilityManifest from a HarnessDiscoveryResult.
 */
export function buildManifestFromDiscovery(
  discovery: HarnessDiscoveryResult,
): HostCapabilityManifest {
  const caps = discovery.capabilities ?? [];
  const hasCap = (cap: HarnessCapability) => caps.includes(cap);

  return {
    harnessName: discovery.name,
    version: discovery.version,
    capabilities: caps,
    supportedModels: [],
    communication: {
      protocol: "stdio" as CommunicationProtocol,
      supportsStreaming: hasCap(Cap.Programmatic) || discovery.installed,
      supportsJsonMode: hasCap(Cap.Programmatic) || discovery.installed,
    },
    lifecycle: {
      supportsSessionBinding: hasCap(Cap.SessionBinding),
      supportsStopHook: hasCap(Cap.StopHook),
      supportsGracefulShutdown: hasCap(Cap.StopHook),
      supportsHealthCheck: false,
    },
    limits: {},
  };
}
