const { defineTask } = require('@a5c-ai/babysitter-sdk');

// Research-and-enrich Layers 10-11 (Interaction / Presentation):
// InteractionPrimitive (slash commands, keybindings, command palettes, voice
// triggers, multimodal input, collaborative actions, telemetry surfaces) and
// Presentation (TUI / web / IDE side-panel / mobile / TV / watch).
// Cross-cuts AgentUIImpl, presentationsBundled, supports_interaction_primitive.

const discoverUIGapsTask = defineTask('discover-ui-gaps', (args) => ({
  kind: 'agent',
  title: 'Inventory UI/interaction records — find gaps',
  metadata: {
    graphRoot: args.graphRoot,
    instructions: [
      'List every InteractionPrimitive, InteractionPrimitiveCategory, Presentation, AgentUIImpl under graph/agent-stack/.',
      'Identify gaps:',
      '  - InteractionPrimitive surfaces missing: a comprehensive scan of slash commands across all 27+ AgentVersions in the catalog. Each agent ships a unique slash-command set (claude-code: /clear /init /resume /fork /model /config /permissions, codex: /diff /apply, cursor: ⌘K shortcuts, gemini-cli: /tools, etc.). Audit which are catalogued.',
      '  - Tool-call primitives: agent-emitted tool calls that double as user-perceived UI (AskUserQuestion, TodoWrite, NotebookEdit). Check completeness across products.',
      '  - Keybindings: editor-style shortcuts (Cmd+K command palette, Cmd+L clear, Esc to interrupt). Per AgentUIImpl.',
      '  - Voice / dictation primitives: voice-dictation, wake-word, tts-narration. Are voice-first agents (Sesame, Inflection Pi, ChatGPT Voice, Anthropic future-voice) modeled?',
      '  - Multimodal-input primitives: drag-drop-files, paste-image, paste-url, screenshot-capture, camera-capture.',
      '  - Collaborative primitives: share-session, follow-agent, hand-off-to-human, request-pair-on.',
      '  - Telemetry surfaces: status-line, cost-meter, token-counter, run-summary card.',
      '  - Presentation: TUI / web / IDE side-panel / mobile / TV / watch / desktop-tray. Per AgentProduct, are all surfaces enumerated?',
      'For each AgentUIImpl, check supports_interaction_primitive list completeness against the product\'s known slash-command set + tool-call set + keybinding set.',
      'Return JSON: { interactionPrimitivesMissing, presentationsMissing, agentUIImplsMissingPrimitives, voicePrimitivesMissing, multimodalPrimitivesMissing }.'
    ]
  }
}));

const researchUIFactsTask = defineTask('research-ui-facts', (args) => ({
  kind: 'agent',
  title: 'Research UI/interaction facts from agent docs',
  metadata: {
    gaps: args.gaps,
    instructions: [
      'For each InteractionPrimitive gap, fetch the source agent\'s slash-command / shortcut docs:',
      '  - Claude Code: docs.anthropic.com/en/docs/claude-code/slash-commands, .../keyboard-shortcuts.',
      '  - Codex: github.com/openai/codex docs/.',
      '  - Cursor: docs.cursor.com/en/keyboard-shortcuts.',
      '  - Copilot CLI: cli.github.com/manual/.',
      '  - Gemini CLI: github.com/google-gemini/gemini-cli docs/.',
      '  - OpenCode, Amp, Droid, Hermes, Qwen, OMP, openclaw: their respective github repos.',
      'For each Presentation gap, fetch the rendering-tech docs (vt100/vte/electron/webview/native-cocoa/native-win32/flutter/react-native/next-js/jetbrains-platform/vs-code-extension).',
      'For voice/multimodal/collaborative primitives, mine vendor product pages for documented features.',
      'Per primitive: kind, surface, category (in_category target), keyboardShortcut, availableInModes, requiresPermission, evidence.',
      'Per presentation: renderingTechnology, themeSupport, accessibilitySupport, offlineMode, platforms, bundleSize, updateChannel.',
      'Per finding: source URL, retrievedAt, quote, confidence.',
      'Return JSON: { evidence, newPrimitivesToAuthor, newPresentationsToAuthor, supportsEdgesToAdd: [{ uiImplId, primitiveId, mechanism, toolCallName?, invocationToken? }] }.'
    ]
  }
}));

const enrichUIGraphTask = defineTask('enrich-ui-graph', (args) => ({
  kind: 'agent',
  title: 'Apply UI research to graph',
  metadata: {
    evidence: args.evidence,
    instructions: [
      'Author new InteractionPrimitive records under graph/agent-stack/interaction-primitives/.',
      'Author new Presentation records under graph/agent-stack/presentations/.',
      'Wire realizes: layer:10-interaction on each new InteractionPrimitive.',
      'Wire realizes: layer:11-presentation on each new Presentation.',
      'Wire in_category from each primitive to its InteractionPrimitiveCategory.',
      'Wire supports_interaction_primitive from AgentUIImpl to each primitive (with mechanism enum value: tool-call / slash-command / keybinding / ui-control / mcp-tool / native-api / deep-link / voice-command, plus toolCallName/invocationToken attrs as appropriate).',
      'Wire bundled_with from AgentUIImpl to each Presentation (or use presentationsBundled attr per existing convention).',
      'Author Claim records for inferred attrs. No Trust Chain.',
      'When evidence is insufficient but the missing graph shape is known, return a graph carry-over task in the process output; do not write placeholder nodes or graph-build-history records.',
      'Graph carry-over tasks should include targetNodeKind, targetIdHint or graphPathHint when known, requiredInformation, searchedSources, and nextAction; keep them outside graph.',
      'Do not add placeholder records under graph; unresolved work belongs in run/process carry-over output outside the active graph.',
      'Include carryOverTasks[] and carryOverTaskIds[] in the task result whenever unresolved work remains.',
      'Validate after each batch.',
      'If gaps remain after editing, return remainingGaps with exact unresolved ids. If evidence is insufficient, return status=blocked and blockedEvidence with source locations to check next.',
      'Return JSON: { filesEdited, filesCreated, primitivesAdded, presentationsAdded, supportsEdgesAdded, claimsAdded, remainingGaps[], blockedEvidence[], carryOverTasks[], carryOverTaskIds[], validatorState }.'
    ]
  }
}));

const verifyUIEnrichmentTask = defineTask('verify-ui-enrichment', (args) => ({
  kind: 'agent',
  title: 'Verify UI/interaction enrichment',
  metadata: {
    enrichmentResult: args.enrichmentResult,
    checks: [
      'Validator: 0 structural, 0 dangling, 0 parse errors.',
      'If unresolved work remains, it is represented as process carry-over output with non-empty requiredInformation; no placeholder graph nodes, graph-build-history records, or process descriptor placeholders.',

      'If this verification is not ok, return remainingGaps[] so the process can iterate, or status=blocked with blockedEvidence[] when facts cannot be resolved safely.',
      'Every new InteractionPrimitive has realizes layer:10-interaction AND in_category AND at least one inbound supports_interaction_primitive.',
      'Every new Presentation has realizes layer:11-presentation AND inbound bundled_with from at least one AgentUIImpl.',
      'Every supports_interaction_primitive edge has a valid mechanism enum value.',
      'No Trust Chain entries.',
    ]
  }
}));

exports.process = async function process(inputs, ctx) {
  const graphRoot = inputs.graphRoot || 'graph';
  const maxGapIterations = inputs.maxGapIterations || 3;
  const initialGaps = await ctx.task(discoverUIGapsTask, { graphRoot });

  const attempts = [];
  let currentGaps = initialGaps;
  let verification = null;
  let enrichmentResult = null;

  for (let attempt = 1; attempt <= maxGapIterations; attempt += 1) {
    const evidence = await ctx.task(researchUIFactsTask, {
      gaps: currentGaps,
      attempt,
      previousVerification: verification,
    });
    enrichmentResult = await ctx.task(enrichUIGraphTask, {
      evidence: evidence,
      gaps: currentGaps,
      attempt,
    });
    verification = await ctx.task(verifyUIEnrichmentTask, {
      enrichmentResult: enrichmentResult,
      gaps: currentGaps,
      attempt,
    });

    attempts.push({
      attempt,
      gaps: currentGaps,
      evidence: evidence,
      enrichmentResult: enrichmentResult,
      verification,
    });

    if (verification.status === 'ok') break;
    if (verification.status === 'blocked') break;

    currentGaps = verification.remainingGaps || verification.gaps || enrichmentResult.remainingGaps || currentGaps;
  }

  return {
    status: verification && verification.status === 'ok' ? 'ok' : 'needs-review',
    graphRoot,
    gaps: currentGaps,
    initialGaps,
    attempts,
    enrichmentResult: enrichmentResult,
    verification,
  };
};
