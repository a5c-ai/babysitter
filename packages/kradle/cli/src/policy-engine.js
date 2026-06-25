// Pure media-governance PolicyEngine for consequential visual tools (G13).
//
// This module is ZERO-DEP and fully DETERMINISTIC: no I/O, no Date.now, no
// Math.random. Every decision is a pure function of (tool, inputs, context).
// It is consumed by both the MCP boundary (src/mcp-server.js) and the SDK-side
// governed process (governance/governed-visual-tool.process.js) so that the
// classification of a visual tool call is identical on both sides.
//
// decision is one of:
//   "allow"            — proceed without governance (internal / in-meeting)
//   "require-approval" — owner approval gate via auth./destroy. breakpoint
//   "deny"             — hard deny; never reaches the sidecar
//
// @reference docs/research/voice-governance-bridge-spec.md §3, §3.3, §6, §8A

/**
 * Default allow/deny lists + breakpoint identifiers for the governed visual
 * tools. Sensible, conservative defaults; overridable via createPolicyEngine
 * or a per-call context.policy override.
 */
export const DEFAULT_VISUAL_POLICY = {
  // Surfaces the agent is never allowed to share (hard deny).
  deniedSurfaces: ['system', 'desktop', 'host', 'screen:0'],
  // URL schemes that are never allowed for share_surface (hard deny).
  deniedUrlSchemes: ['file', 'chrome', 'about', 'data'],
  // Metadata sinks that are never allowed (hard deny).
  deniedMetadataSinks: ['exfil', 'pastebin', 'unknown-external'],
  // Metadata sinks considered internal/in-meeting (allow without approval).
  internalMetadataSinks: ['in-meeting', 'meeting', 'sidecar', 'local'],
  breakpointIds: {
    // The auth./destroy. prefix is load-bearing (spec §6): it must match the
    // approvalPosture declared for the tool in governed-tools.js. Emitting
    // external video metadata to an outside sink is irreversible -> destroy.*
    draw_canvas: 'auth.draw-canvas',
    share_surface: 'auth.share-surface',
    send_video_metadata: 'destroy.send-video-metadata',
  },
};

function normalizeUrlScheme(url) {
  if (typeof url !== 'string') return '';
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(url.trim());
  return match ? match[1].toLowerCase() : '';
}

function resolvePolicy(context) {
  const override = (context && context.policy) || {};
  return {
    deniedSurfaces: override.deniedSurfaces || DEFAULT_VISUAL_POLICY.deniedSurfaces,
    deniedUrlSchemes: override.deniedUrlSchemes || DEFAULT_VISUAL_POLICY.deniedUrlSchemes,
    deniedMetadataSinks: override.deniedMetadataSinks || DEFAULT_VISUAL_POLICY.deniedMetadataSinks,
    internalMetadataSinks: override.internalMetadataSinks || DEFAULT_VISUAL_POLICY.internalMetadataSinks,
    breakpointIds: { ...DEFAULT_VISUAL_POLICY.breakpointIds, ...(override.breakpointIds || {}) },
  };
}

function decideShareSurface(inputs, policy) {
  const surface = typeof inputs.surface === 'string' ? inputs.surface.toLowerCase() : '';
  const scheme = normalizeUrlScheme(inputs.url);
  if (surface && policy.deniedSurfaces.includes(surface)) {
    return { decision: 'deny', reason: 'surface-not-allowed', breakpointId: null };
  }
  if (scheme && policy.deniedUrlSchemes.includes(scheme)) {
    return { decision: 'deny', reason: 'surface-url-not-allowed', breakpointId: null };
  }
  // Starting any screen-share / surface-share requires owner approval.
  return { decision: 'require-approval', reason: 'screen-share-start', breakpointId: policy.breakpointIds.share_surface };
}

function decideSendVideoMetadata(inputs, policy) {
  const metadata = (inputs && inputs.metadata) || {};
  const sink = typeof metadata.sink === 'string' ? metadata.sink.toLowerCase()
    : typeof metadata.destination === 'string' ? metadata.destination.toLowerCase()
      : '';
  const urlScheme = normalizeUrlScheme(metadata.url);
  if (sink && policy.deniedMetadataSinks.includes(sink)) {
    return { decision: 'deny', reason: 'metadata-sink-not-allowed', breakpointId: null };
  }
  if (urlScheme && policy.deniedUrlSchemes.includes(urlScheme)) {
    return { decision: 'deny', reason: 'metadata-sink-not-allowed', breakpointId: null };
  }
  const isInternal = (!sink && !metadata.url && metadata.external !== true)
    || (sink && policy.internalMetadataSinks.includes(sink));
  if (isInternal) {
    return { decision: 'allow', reason: 'internal-metadata', breakpointId: null };
  }
  // External sink (named sink/url, or external:true) requires owner approval.
  return { decision: 'require-approval', reason: 'external-metadata-sink', breakpointId: policy.breakpointIds.send_video_metadata };
}

function decideDrawCanvas(inputs, policy) {
  const content = inputs ? inputs.content : undefined;
  // Externally-visible / persistent content is governed. Ephemeral cosmetic
  // content never reaches here (it is not a governed tool). Any non-empty
  // content drawn to the published video track is treated as persistent.
  const hasContent = content !== undefined && content !== null && content !== '';
  if (!hasContent) {
    return { decision: 'allow', reason: 'empty-canvas', breakpointId: null };
  }
  return { decision: 'require-approval', reason: 'persistent-canvas-content', breakpointId: policy.breakpointIds.draw_canvas };
}

/**
 * Build a PolicyEngine with overridable rules. Returns an object with a single
 * pure `evaluate(tool, inputs, context)` method.
 * @param {object} [rules] - rule overrides merged over DEFAULT_VISUAL_POLICY at evaluate time.
 */
export function createPolicyEngine(rules) {
  const ruleOverride = rules || null;
  return {
    evaluate(tool, inputs, context) {
      const effectiveContext = ruleOverride
        ? { ...(context || {}), policy: { ...(ruleOverride || {}), ...((context && context.policy) || {}) } }
        : context;
      return evaluateVisualPolicy(tool, inputs, effectiveContext);
    },
  };
}

/**
 * Evaluate the governance decision for a single visual tool call.
 * @param {string} tool - sidecar action name (e.g. "draw_canvas").
 * @param {object} inputs - the same payload the fast path would have sent.
 * @param {object} [context] - meeting context (may carry context.policy overrides).
 * @returns {{ decision: 'allow'|'require-approval'|'deny', reason: string, breakpointId: (string|null) }}
 */
export function evaluateVisualPolicy(tool, inputs = {}, context = {}) {
  const policy = resolvePolicy(context);
  switch (tool) {
    case 'share_surface':
      return decideShareSurface(inputs, policy);
    case 'send_video_metadata':
      return decideSendVideoMetadata(inputs, policy);
    case 'draw_canvas':
      return decideDrawCanvas(inputs, policy);
    default:
      // Non-governed tool routed here defensively — allow (governed routing is
      // gated upstream by the declaration check).
      return { decision: 'allow', reason: 'not-a-governed-tool', breakpointId: null };
  }
}
