import type { BreakpointBackend } from "../backend.js";
import type { BreakpointContext, RoutingConfig } from "../types.js";
import { createBackend, createDefaultBackend, matchRoute } from "../backends/index.js";
import { loadRoutingConfigSync } from "../config.js";

/**
 * Build a minimal BreakpointContext suitable for routing resolution.
 */
function buildRoutingContext(ctx: BackendResolveContext): BreakpointContext {
  return {
    description: "",
    codeSnippets: [],
    fileReferences: [],
    tags: ctx.tags ?? [],
    domain: ctx.domain,
  };
}

/**
 * Context used for matching a breakpoint against routing rules.
 */
export interface BackendResolveContext {
  /** Domain of the breakpoint (e.g. "backend", "security"). */
  domain?: string;
  /** Tags on the breakpoint. */
  tags?: string[];
  /** Explicit backend override from the MCP tool params. */
  explicitBackend?: string;
  /** Explicit git-native breakpoints directory override from the MCP tool params. */
  breakpointsDir?: string;
  /** Explicit config root override. */
  configRoot?: string;
}

export interface ResolvedBackend {
  /** The resolved backend instance. */
  backend: BreakpointBackend;
  /**
   * "explicit-override" when MCP params force the choice,
   * "routed" when a routing rule matched,
   * "env-override" when BMUX_BACKEND forced the choice,
   * "default" when falling back to git-native.
   */
  source: "explicit-override" | "routed" | "env-override" | "default";
}

/**
 * Resolve the appropriate BreakpointBackend for a request.
 *
 * Resolution order:
 *   1. Explicit MCP param override.
 *   1. BMUX_BACKEND env var -- forces a specific backend type.
 *      For "git-native" this uses the default git-native backend.
 *      For "github-issues" this requires a routing config to be present
 *      (to know which repo/owner/labels to use).
 *   2. BMUX_BACKEND env var -- forces a specific backend type.
 *   3. `.a5c/routing.json` -- if present and a rule matches the
 *      breakpoint's domain/tags, create the backend from the rule.
 *   4. Fall back to git-native backend (default behaviour).
 */
export function resolveBreakpointBackend(
  ctx: BackendResolveContext = {},
): ResolvedBackend {
  if (ctx.explicitBackend) {
    if (ctx.explicitBackend === "git-native") {
      return {
        backend: createBackend("git-native", {
          breakpointsDir: ctx.breakpointsDir,
        }),
        source: "explicit-override",
      };
    }

    const routingConfig = loadRoutingConfigSync(ctx.configRoot);
    if (routingConfig) {
      const matched = matchRouteForBackendType(routingConfig, ctx.explicitBackend, ctx);
      if (matched) {
        return { backend: matched, source: "explicit-override" };
      }
    }

    throw new Error(
      `Explicit backend "${ctx.explicitBackend}" could not be resolved. ` +
      "Define a matching backend in routing.json or use backend=\"git-native\".",
    );
  }

  const envBackend = process.env.BMUX_BACKEND;

  // -- 1. Env override ---------------------------------------------------
  if (envBackend) {
    if (envBackend === "git-native") {
      return {
        backend: createDefaultBackend({ breakpointsDir: ctx.breakpointsDir }),
        source: "env-override",
      };
    }

    // For non-default backends we need routing config to know the target details.
    const routingConfig = loadRoutingConfigSync(ctx.configRoot);
    if (routingConfig) {
      const matched = matchRouteForBackendType(routingConfig, envBackend, ctx);
      if (matched) {
        return { backend: matched, source: "env-override" };
      }
    }

    // If env says github-issues but no routing config, that is a misconfiguration.
    // Fall through to default so we do not break.
  }

  // -- 2. Routing config -------------------------------------------------
  const routingConfig = loadRoutingConfigSync(ctx.configRoot);
  if (routingConfig) {
    const backendName = matchRoute(routingConfig, buildRoutingContext(ctx));
    if (backendName !== "git-native") {
      // Find the route that matched to extract its config
      for (const rule of routingConfig.routes) {
        if (rule.backend === backendName) {
          const backend = createBackend(
            rule.backendConfig.type as string,
            rule.backendConfig as unknown as Record<string, unknown>,
          );
          return { backend, source: "routed" };
        }
      }
    }
  }

  // -- 3. Default backend ------------------------------------------------
  return {
    backend: createDefaultBackend({ breakpointsDir: ctx.breakpointsDir }),
    source: "default",
  };
}

/**
 * Find the first routing rule whose backendConfig.type matches the given
 * backend type and (optionally) matches the breakpoint context.
 */
function matchRouteForBackendType(
  routingConfig: RoutingConfig,
  backendType: string,
  ctx: BackendResolveContext,
): BreakpointBackend | undefined {
  // Try context-aware match first
  if (ctx.domain || (ctx.tags && ctx.tags.length > 0)) {
    const matchedName = matchRoute(routingConfig, buildRoutingContext(ctx));
    for (const rule of routingConfig.routes) {
      if (
        rule.backend === matchedName &&
        (rule.backendConfig as Record<string, unknown>).type === backendType
      ) {
        return createBackend(backendType, rule.backendConfig as unknown as Record<string, unknown>);
      }
    }
  }

  // Fall back to first rule with the requested type
  for (const rule of routingConfig.routes) {
    if ((rule.backendConfig as Record<string, unknown>).type === backendType) {
      return createBackend(backendType, rule.backendConfig as unknown as Record<string, unknown>);
    }
  }

  return undefined;
}
