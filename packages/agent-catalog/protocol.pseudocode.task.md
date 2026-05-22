// ============================================================
// AMUX Protocol Authoring Orchestration Plan
// ============================================================
//
// Goal:
// Build the protocol as a staged, research-backed document set,
// with explicit decision capture, review loops, schema alignment,
// examples, and conformance artifacts.
//
// Core principle:
// Never write later-layer docs before locking the invariants of
// earlier layers. Every step consumes prior decisions and emits
// reusable artifacts for downstream tasks.
//
// Layers:
//   L0 = model + model-provider
//   L1 = lower runtime harness
//   L2 = upper harness / UX / extension plane
//
// Authoring rule:
// Each task receives its full working instructions as a string
// constructed from prior outputs, decisions, scope, and quality gates.
//
// ============================================================


// ------------------------------------------------------------
// 0. Shared orchestration primitives
// ------------------------------------------------------------

type ArtifactRef = string
type TaskResult = {
  id: string
  summary: string
  artifacts: ArtifactRef[]
  decisions: string[]
  openQuestions: string[]
  risks: string[]
}

function fmt(template: string, vars: Record<string, any>): string
function task(instructions: string, opts?: {
  name?: string
  deps?: TaskResult[]
  produces?: string[]
  reviewAgainst?: ArtifactRef[]
  gate?: string
}): TaskResult

function parallel(...tasks: (() => TaskResult)[]): TaskResult[]
function seq(...tasks: (() => TaskResult)[]): TaskResult[]
function join(name: string, inputs: TaskResult[]): TaskResult
function gate(instructions: string, deps: TaskResult[]): TaskResult
function revise(instructions: string, deps: TaskResult[]): TaskResult
function freeze(instructions: string, deps: TaskResult[]): TaskResult


// ------------------------------------------------------------
// 1. Global protocol workspace structure
// ------------------------------------------------------------

const WORKSPACE = {
  repo: "amux-protocol",
  dirs: {
    research: "research/",
    source_notes: "research/sources/",
    extracted_facts: "research/extracted-facts/",
    matrices: "research/matrices/",
    drafts: "docs/drafts/",
    protocol: "docs/protocol/",
    schemas: "schemas/",
    examples: "examples/",
    decisions: "decisions/",
    reviews: "reviews/",
    conformance: "conformance/",
    adapters: "reference-adapters/",
    prompts: "authoring-prompts/"
  }
}


// ------------------------------------------------------------
// 2. Canonical document inventory
// ------------------------------------------------------------

const DOCS = {
  foundation: [
    "000-charter-and-scope.md",
    "001-glossary.md",
    "002-layer-model.md",
    "003-taxonomy-and-naming-rules.md",
    "004-decision-log-index.md",
    "005-schema-style-guide.md",
    "006-example-style-guide.md",
    "007-conformance-philosophy.md"
  ],

  research: [
    "100-provider-surface-matrix.md",
    "101-lower-runtime-harness-matrix.md",
    "102-upper-harness-matrix.md",
    "103-cross-layer-delta-analysis.md",
    "104-open-questions-register.md"
  ],

  capabilities: [
    "200-capabilities-l0-model-provider.md",
    "201-capabilities-l1-lower-runtime.md",
    "202-capabilities-l2-upper-harness.md",
    "203-capabilities-cross-layer-mapping.md"
  ],

  communications: [
    "300-communications-l0-model-provider.md",
    "301-communications-l1-lower-runtime.md",
    "302-communications-l2-upper-harness.md",
    "303-cross-layer-control-propagation.md"
  ],

  events: [
    "400-events-l0-model-provider.md",
    "401-events-l1-lower-runtime.md",
    "402-events-l2-upper-harness.md",
    "403-cross-layer-event-propagation.md"
  ],

  discovery: [
    "500-discovery-overview.md",
    "501-discovery-l0-model-provider.md",
    "502-discovery-l1-lower-runtime.md",
    "503-discovery-l2-upper-harness.md",
    "504-resource-discovery-and-filesystem-resolution.md"
  ],

  config: [
    "600-configuration-overview.md",
    "601-protocol-config-l0.md",
    "602-protocol-config-l1.md",
    "603-protocol-config-l2.md",
    "604-scope-precedence-and-override-rules.md"
  ],

  assets_and_extensions: [
    "700-instructions-and-context-assets.md",
    "701-skills.md",
    "702-subagents.md",
    "703-hooks.md",
    "704-plugins.md",
    "705-mcp-management.md",
    "706-builtin-tool-exposure.md",
    "707-session-presentation-and-title-summarization.md",
    "708-compaction-and-context-optimization.md"
  ],

  schemas: [
    "800-schema-index.md",
    "schemas/amux.capabilities.l0.schema.json",
    "schemas/amux.capabilities.l1.schema.json",
    "schemas/amux.capabilities.l2.schema.json",
    "schemas/amux.communications.l0.schema.json",
    "schemas/amux.communications.l1.schema.json",
    "schemas/amux.communications.l2.schema.json",
    "schemas/amux.events.l0.schema.json",
    "schemas/amux.events.l1.schema.json",
    "schemas/amux.events.l2.schema.json",
    "schemas/amux.discovery.schema.json",
    "schemas/amux.protocol_config.schema.json"
  ],

  examples: [
    "900-end-to-end-openai-responses-example.md",
    "901-end-to-end-anthropic-messages-example.md",
    "902-end-to-end-gemini-example.md",
    "903-end-to-end-codex-runtime-example.md",
    "904-end-to-end-claude-code-example.md",
    "905-end-to-end-openhands-example.md",
    "906-cross-layer-trace-example.md"
  ],

  conformance: [
    "950-conformance-levels.md",
    "951-provider-surface-conformance.md",
    "952-lower-runtime-conformance.md",
    "953-upper-harness-conformance.md",
    "954-adapter-conformance.md"
  ]
}


// ------------------------------------------------------------
// 3. Inputs carried from prior work
// ------------------------------------------------------------

const PRIOR_DECISIONS = [
  "Capabilities are modeled per operational mode, not per product overall.",
  "Input and output are decoupled.",
  "Scope support must be explicit and reusable.",
  "Protocol-configurability must be modeled explicitly.",
  "Slash commands are their own capability surface.",
  "Upper and lower harness capabilities are separate planes.",
  "Model-provider is a deeper plane below the lower runtime harness.",
  "Model-provider capabilities are per provider surface + transport mode + model binding.",
  "Native passthrough must always remain possible.",
  "Adapter-specific filenames and paths do not belong in the abstract capability schema."
]

const CURRENT_PROTOCOL_SHAPE = {
  layers: ["L0_model_provider", "L1_lower_runtime", "L2_upper_harness"],
  known_focus_areas: [
    "capabilities",
    "communications",
    "events",
    "discovery",
    "protocol configuration",
    "cross-layer mapping"
  ]
}


// ------------------------------------------------------------
// 4. Phase A: frame the work before research expands
// ------------------------------------------------------------

const charter = task(
  fmt(`
Create the protocol charter and scope document.

Inputs:
- Prior decisions:
{prior_decisions}

Goals:
- Define what AMUX standardizes and what it explicitly does not.
- Lock the three-layer architecture:
  L0 model-provider
  L1 lower runtime harness
  L2 upper harness
- Define success criteria for the protocol set:
  precision, extensibility, conformance friendliness, lossless adaptation.
- Define artifact taxonomy:
  research docs, normative docs, schemas, examples, conformance docs.
- Define writing rules:
  no hidden assumptions, no provider-wide flattening when surface-specific differences matter.

Outputs:
- docs/protocol/000-charter-and-scope.md
- docs/protocol/002-layer-model.md
- decisions/ADR-000-overall-architecture.md
`, {
    prior_decisions: PRIOR_DECISIONS.join("\n- ")
  }),
  {
    name: "charter_and_scope",
    produces: [
      "docs/protocol/000-charter-and-scope.md",
      "docs/protocol/002-layer-model.md",
      "decisions/ADR-000-overall-architecture.md"
    ]
  }
)

const glossary = task(
  fmt(`
Create the canonical glossary and naming rules.

Inputs:
- Current protocol shape:
{shape}
- Prior decisions:
{prior_decisions}

Requirements:
- Define exact meanings for provider, provider surface, model binding, runtime, harness, upper harness, communication plane, event plane, discovery, protocolConfig, scope, asset, hosted tool, client tool, provider-hosted tool, reasoning artifact, replay artifact, session, run, turn.
- Eliminate naming collisions between modes, profiles, policies, and commands.
- Add naming guidance for schema fields.

Outputs:
- docs/protocol/001-glossary.md
- docs/protocol/003-taxonomy-and-naming-rules.md
`, {
    shape: JSON.stringify(CURRENT_PROTOCOL_SHAPE, null, 2),
    prior_decisions: PRIOR_DECISIONS.join("\n- ")
  }),
  {
    name: "glossary_and_taxonomy",
    deps: [charter],
    produces: [
      "docs/protocol/001-glossary.md",
      "docs/protocol/003-taxonomy-and-naming-rules.md"
    ]
  }
)

const style_guides = task(
  fmt(`
Create the schema style guide and example style guide.

Requirements:
- Define how to separate normative vs informative text.
- Define allowed field naming conventions.
- Define how booleans vs flag-objects vs enums are chosen.
- Define how native passthrough sections are attached.
- Define example style rules:
  compact, realistic, cross-layer traceable, surface-specific, no fake lowest-common-denominator examples.

Outputs:
- docs/protocol/005-schema-style-guide.md
- docs/protocol/006-example-style-guide.md
- docs/protocol/007-conformance-philosophy.md
`, {}),
  {
    name: "style_guides",
    deps: [charter, glossary],
    produces: [
      "docs/protocol/005-schema-style-guide.md",
      "docs/protocol/006-example-style-guide.md",
      "docs/protocol/007-conformance-philosophy.md"
    ]
  }
)


// ------------------------------------------------------------
// 5. Phase B: research plan and source extraction
// ------------------------------------------------------------

const research_plan = task(
  fmt(`
Create the research plan.

Inputs:
- Layer model
- Current capabilities drafts
- Need to research both online docs and code repos.

Requirements:
- Split research into three tracks:
  1. L0 provider surfaces
  2. L1 lower runtime harnesses
  3. L2 upper harness/extension surfaces
- For each track define:
  source classes,
  extraction template,
  comparison matrix fields,
  anti-hallucination rules,
  review rules.
- Include official docs, SDK docs, API references, code repos, config files, sample traces, and tests.

Outputs:
- research/RESEARCH_PLAN.md
- research/EXTRACTION_TEMPLATE.md
- research/MATRIX_TEMPLATE.md
`, {}),
  {
    name: "research_plan",
    deps: [charter, glossary, style_guides],
    produces: [
      "research/RESEARCH_PLAN.md",
      "research/EXTRACTION_TEMPLATE.md",
      "research/MATRIX_TEMPLATE.md"
    ]
  }
)

const l0_research = task(
  fmt(`
Research online and in code repos for L0 model-provider surfaces.

Instructions:
- Use official API docs and official SDK/repos first.
- Research by provider surface, not just provider.
- Extract capabilities for:
  provider protocol,
  auth,
  transport,
  input modalities,
  output modalities,
  reasoning,
  tool calling,
  structured generation,
  replay/state,
  caching,
  safety/refusal,
  async/batch,
  hosted assets,
  limits/accounting.
- Build a comparison matrix.
- Highlight only source-backed facts.
- Record unresolved ambiguities.

Initial provider surfaces to cover:
- OpenAI Responses
- OpenAI Realtime
- Anthropic Messages
- Gemini GenerateContent
- Gemini Interactions
- Gemini Live
- xAI chat/function surfaces
- representative openai-compatible third-party surface

Outputs:
- research/matrices/100-provider-surface-matrix.md
- research/extracted-facts/l0-provider-surfaces.json
- research/104-open-questions-register.md
`, {}),
  {
    name: "research_l0",
    deps: [research_plan],
    produces: [
      "research/matrices/100-provider-surface-matrix.md",
      "research/extracted-facts/l0-provider-surfaces.json",
      "research/104-open-questions-register.md"
    ]
  }
)

const l1_research = task(
  fmt(`
Research online and in code repos for L1 lower runtime harnesses.

Instructions:
- Focus on runtime/session/tool/agent-loop/internal communications surfaces.
- Ignore most filesystem/plugin/extension details unless needed to clarify runtime boundaries.
- Extract capabilities for:
  runtime communications,
  runtime events,
  session/run/turn lifecycle,
  tool runtime,
  approvals,
  sandboxing,
  compaction,
  remote runtime,
  lower-layer mapping to provider surfaces.

Harnesses to cover:
- Codex runtime/app-server/CLI core
- Claude Agent SDK / core runtime
- Gemini CLI runtime/ACP-relevant runtime behavior
- OpenHands runtime/server
- representative other harnesses only if they add genuinely new runtime traits

Outputs:
- research/matrices/101-lower-runtime-harness-matrix.md
- research/extracted-facts/l1-runtime-harnesses.json
- research/104-open-questions-register.md
`, {}),
  {
    name: "research_l1",
    deps: [research_plan],
    produces: [
      "research/matrices/101-lower-runtime-harness-matrix.md",
      "research/extracted-facts/l1-runtime-harnesses.json"
    ]
  }
)

const l2_research = task(
  fmt(`
Research online and in code repos for L2 upper harness / extension surfaces.

Instructions:
- Focus on discovery, files, instructions, skills, subagents, hooks, plugins, slash commands, MCP registry/config, user-facing messaging, context assembly, builtin tool exposure, compaction optimization, session presentation.
- Extract scope behavior precisely.
- Capture what is configurable through protocol-like commands vs only through files.
- Build a comparison matrix.

Harnesses to cover:
- Claude Code shell/CLI/extension surfaces
- Codex CLI + config + command surfaces
- Gemini CLI extensions and command surfaces
- OpenHands outer control surfaces
- any additional harness that introduces truly novel upper-plane behavior

Outputs:
- research/matrices/102-upper-harness-matrix.md
- research/extracted-facts/l2-upper-harnesses.json
- research/104-open-questions-register.md
`, {}),
  {
    name: "research_l2",
    deps: [research_plan],
    produces: [
      "research/matrices/102-upper-harness-matrix.md",
      "research/extracted-facts/l2-upper-harnesses.json"
    ]
  }
)

const cross_layer_analysis = task(
  fmt(`
Synthesize the three research tracks into a cross-layer delta analysis.

Inputs:
- L0 provider matrix
- L1 runtime matrix
- L2 upper harness matrix
- prior decisions

Requirements:
- Identify what belongs strictly to L0 vs L1 vs L2.
- Identify leaked concerns and boundary ambiguities.
- Propose boundary decisions where current drafts are muddy.
- Record every boundary decision as an ADR candidate.
- Produce mapping tables:
  L2 -> L1
  L1 -> L0
  L2 -> L0 indirect effects

Outputs:
- research/103-cross-layer-delta-analysis.md
- decisions/ADR-candidates-boundaries.md
`, {}),
  {
    name: "cross_layer_analysis",
    deps: [l0_research, l1_research, l2_research],
    produces: [
      "research/103-cross-layer-delta-analysis.md",
      "decisions/ADR-candidates-boundaries.md"
    ]
  }
)


// ------------------------------------------------------------
// 6. Phase C: decision closure before normative docs
// ------------------------------------------------------------

const boundary_decisions = gate(
  fmt(`
Review the cross-layer analysis and lock boundary decisions.

Requirements:
- Resolve whether each disputed concept belongs to L0, L1, or L2.
- Resolve ambiguous dual-home concepts by splitting them if needed.
- Produce normative decision records for:
  provider surface granularity,
  reasoning artifact ownership,
  tool execution ownership,
  state/replay location,
  model configuration split between L0 and L2,
  MCP split between registry/config vs runtime execution,
  compaction split between runtime compaction and upper-layer optimization,
  session title/summary ownership and propagation.
- Reject any design that causes circular dependency between layers.

Outputs:
- decisions/ADR-010-layer-boundaries.md
- decisions/ADR-011-provider-surface-granularity.md
- decisions/ADR-012-tool-ownership-model.md
- decisions/ADR-013-reasoning-and-replay-boundary.md
- decisions/ADR-014-mcp-boundary.md
- decisions/ADR-015-compaction-boundary.md
`, {}),
  {
    deps: [cross_layer_analysis],
    gate: "No normative protocol doc starts until these ADRs are frozen."
  }
)

const freeze_foundation = freeze(
  fmt(`
Freeze foundation artifacts.

Inputs:
- charter
- glossary
- schema style guide
- cross-layer ADRs

Requirements:
- Produce a frozen foundation summary for downstream authoring tasks.
- Extract the invariant rules every later doc must respect.
- Emit a machine-readable summary if useful.

Outputs:
- decisions/FROZEN_FOUNDATION.md
- research/extracted-facts/frozen-foundation.json
`, {}),
  {
    deps: [charter, glossary, style_guides, boundary_decisions]
  }
)


// ------------------------------------------------------------
// 7. Phase D: author normative capability docs first
// ------------------------------------------------------------

const author_cap_l0 = task(
  fmt(`
Author the normative L0 model-provider capabilities document.

Use:
- frozen foundation
- provider surface matrix
- existing proof-of-concept draft
- boundary ADRs

Requirements:
- Rewrite as a normative doc, not just a concept note.
- Keep one response per provider surface + transport mode + model binding.
- Separate provider-surface truths from model-binding truths.
- Make reasoning and tool-calling non-trivial, nuanced sections.
- Define protocolConfig only for what is truly configurable at L0.
- Include a concise validation checklist at the end.

Outputs:
- docs/protocol/200-capabilities-l0-model-provider.md
`, {}),
  {
    name: "author_capabilities_l0",
    deps: [freeze_foundation, l0_research]
  }
)

const author_cap_l1 = task(
  fmt(`
Author the normative L1 lower-runtime capabilities document.

Use:
- frozen foundation
- lower-runtime matrix
- prior PoC draft
- boundary ADRs

Requirements:
- Center the runtime substrate:
  agent loop,
  runtime tool execution,
  sessions,
  runtime communications,
  runtime events,
  approvals,
  sandbox,
  compaction,
  remote runtime.
- Ensure nothing upper-layer remains here except effective state passed in.

Outputs:
- docs/protocol/201-capabilities-l1-lower-runtime.md
`, {}),
  {
    name: "author_capabilities_l1",
    deps: [freeze_foundation, l1_research]
  }
)

const author_cap_l2 = task(
  fmt(`
Author the normative L2 upper-harness capabilities document.

Use:
- frozen foundation
- upper-harness matrix
- prior PoC draft
- boundary ADRs

Requirements:
- Center discovery, files, skills, commands, hooks, plugins, MCP registry/config, context assembly, builtin tool exposure, user messaging, compaction optimization, session presentation.
- Make it explicit where upper-layer config propagates into L1 and L0.
- Keep native paths out of the abstract capability schema and refer them to resource-discovery docs.

Outputs:
- docs/protocol/202-capabilities-l2-upper-harness.md
`, {}),
  {
    name: "author_capabilities_l2",
    deps: [freeze_foundation, l2_research]
  }
)

const author_cap_cross = task(
  fmt(`
Author the cross-layer capability mapping document.

Inputs:
- normative L0/L1/L2 capabilities docs
- cross-layer analysis
- frozen foundation

Requirements:
- Define how capabilities map or propagate across layers.
- Show which upper-layer surfaces configure lower layers.
- Show which lower-layer runtime behaviors depend on provider-surface capabilities.
- Define allowed lossy vs lossless mappings.
- Include propagation examples.

Outputs:
- docs/protocol/203-capabilities-cross-layer-mapping.md
`, {}),
  {
    name: "author_capabilities_cross",
    deps: [author_cap_l0, author_cap_l1, author_cap_l2]
  }
)


// ------------------------------------------------------------
// 8. Phase E: communications docs
// ------------------------------------------------------------

const author_comm_l0 = task(
  fmt(`
Author the L0 communications document.

Use:
- L0 capabilities doc
- provider research
- frozen foundation

Requirements:
- Define the abstract communications shapes for provider-surface invocation, discovery, config, auth, cancel, asset operations.
- Separate transport-independent semantics from transport-specific bindings.
- Capture streaming vs bidirectional vs async-job patterns.
- Do not yet write every schema field exhaustively unless stabilized.

Outputs:
- docs/protocol/300-communications-l0-model-provider.md
`, {}),
  {
    deps: [author_cap_l0]
  }
)

const author_comm_l1 = task(
  fmt(`
Author the L1 communications document.

Requirements:
- Define lower-runtime control plane:
  invoke,
  cancel,
  session,
  approval,
  config,
  discovery,
  runtime tool exchange.
- Make this the strictest orchestration-facing protocol layer.
- Include host/runtime message categories and lifecycle expectations.

Outputs:
- docs/protocol/301-communications-l1-lower-runtime.md
`, {}),
  {
    deps: [author_cap_l1, author_comm_l0]
  }
)

const author_comm_l2 = task(
  fmt(`
Author the L2 communications document.

Requirements:
- Define upper-layer control plane:
  user messages,
  extension management,
  discovery,
  filesystem refresh,
  protocol configuration,
  session presentation,
  tool exposure orchestration.
- Show how L2 talks to applications/users and to L1.

Outputs:
- docs/protocol/302-communications-l2-upper-harness.md
`, {}),
  {
    deps: [author_cap_l2, author_comm_l1]
  }
)

const author_comm_cross = task(
  fmt(`
Author the cross-layer communications propagation doc.

Requirements:
- Define how L2 control/config flows into L1 and optionally L0.
- Define what can bypass layers and what cannot.
- Define responsibility boundaries for translating messages between layers.
- Include examples:
  changing default provider,
  installing MCP,
  enabling a skill,
  sending a user message,
  session title propagation.

Outputs:
- docs/protocol/303-cross-layer-control-propagation.md
`, {}),
  {
    deps: [author_comm_l0, author_comm_l1, author_comm_l2, author_cap_cross]
  }
)


// ------------------------------------------------------------
// 9. Phase F: event docs
// ------------------------------------------------------------

const author_events_l0 = task(
  fmt(`
Author the L0 event document.

Requirements:
- Define provider/model-surface events:
  response lifecycle,
  content deltas,
  reasoning events,
  tool call events,
  refusal/safety events,
  usage/accounting events,
  asset lifecycle.
- Distinguish surface event semantics from transport framing.

Outputs:
- docs/protocol/400-events-l0-model-provider.md
`, {}),
  {
    deps: [author_cap_l0, author_comm_l0]
  }
)

const author_events_l1 = task(
  fmt(`
Author the L1 event document.

Requirements:
- Define runtime events:
  run/session lifecycle,
  tool runtime,
  runtime context,
  approval,
  sandbox,
  compaction,
  remote runtime,
  telemetry.
- Define causal expectations and required metadata.
- Show how L0 events may be absorbed, transformed, or forwarded.

Outputs:
- docs/protocol/401-events-l1-lower-runtime.md
`, {}),
  {
    deps: [author_cap_l1, author_comm_l1, author_events_l0]
  }
)

const author_events_l2 = task(
  fmt(`
Author the L2 event document.

Requirements:
- Define extension/control/user-facing events:
  discovery refresh,
  plugin/skill/hook changes,
  filesystem resolution,
  command execution,
  user messaging,
  context assembly,
  session presentation.
- Define what is user-visible vs internal upper-plane.

Outputs:
- docs/protocol/402-events-l2-upper-harness.md
`, {}),
  {
    deps: [author_cap_l2, author_comm_l2]
  }
)

const author_events_cross = task(
  fmt(`
Author the cross-layer event propagation doc.

Requirements:
- Define forwarding, synthesis, suppression, and enrichment rules across L0 -> L1 -> L2.
- Define when native events must be preserved.
- Define event provenance rules.
- Include cross-layer traces for:
  tool call,
  refusal,
  context compaction,
  plugin-installed tool becoming available,
  user-facing message derived from runtime state.

Outputs:
- docs/protocol/403-cross-layer-event-propagation.md
`, {}),
  {
    deps: [author_events_l0, author_events_l1, author_events_l2, author_cap_cross]
  }
)


// ------------------------------------------------------------
// 10. Phase G: discovery and configuration docs
// ------------------------------------------------------------

const author_discovery_docs = seq(
  () => task(
    fmt(`
Author the discovery overview and L0/L1/L2 discovery docs.

Requirements:
- Define what each layer can discover.
- Separate capability discovery, resource discovery, model discovery, runtime discovery, extension discovery, filesystem discovery.
- Keep native resource paths in discovery, not in abstract capabilities.
- Include scope rules.

Outputs:
- docs/protocol/500-discovery-overview.md
- docs/protocol/501-discovery-l0-model-provider.md
- docs/protocol/502-discovery-l1-lower-runtime.md
- docs/protocol/503-discovery-l2-upper-harness.md
- docs/protocol/504-resource-discovery-and-filesystem-resolution.md
`, {}),
    {
      deps: [author_cap_l0, author_cap_l1, author_cap_l2]
    }
  ),
  () => task(
    fmt(`
Author the configuration overview and L0/L1/L2 protocol-config docs.

Requirements:
- Define the abstract configuration surface implied by protocolConfig.
- Separate configuration scope, precedence, mutability, and propagation.
- Include examples for:
  model provider config,
  runtime policy config,
  MCP registry config,
  plugin marketplace config,
  skill enablement,
  user messaging policy,
  compaction policy.
- Define scope precedence and override rules in a dedicated document.

Outputs:
- docs/protocol/600-configuration-overview.md
- docs/protocol/601-protocol-config-l0.md
- docs/protocol/602-protocol-config-l1.md
- docs/protocol/603-protocol-config-l2.md
- docs/protocol/604-scope-precedence-and-override-rules.md
`, {}),
    {
      deps: [author_cap_l0, author_cap_l1, author_cap_l2, author_comm_cross]
    }
  )
)


// ------------------------------------------------------------
// 11. Phase H: asset/extension documents
// ------------------------------------------------------------

const author_asset_docs = task(
  fmt(`
Author the upper-layer asset and extension documents.

Requirements:
- Write separate docs for instructions/context assets, skills, subagents, hooks, plugins, MCP management, builtin tool exposure, session presentation, compaction optimization.
- Each doc must include:
  capabilities boundary,
  discovery boundary,
  configuration boundary,
  runtime propagation into L1 and/or L0,
  examples,
  conformance considerations.
- Reuse prior decisions and avoid duplicating core capability definitions.

Outputs:
- docs/protocol/700-instructions-and-context-assets.md
- docs/protocol/701-skills.md
- docs/protocol/702-subagents.md
- docs/protocol/703-hooks.md
- docs/protocol/704-plugins.md
- docs/protocol/705-mcp-management.md
- docs/protocol/706-builtin-tool-exposure.md
- docs/protocol/707-session-presentation-and-title-summarization.md
- docs/protocol/708-compaction-and-context-optimization.md
`, {}),
  {
    deps: [author_cap_l2, author_comm_l2, author_events_l2, author_discovery_docs[0], author_discovery_docs[1]]
  }
)


// ------------------------------------------------------------
// 12. Phase I: schema generation
// ------------------------------------------------------------

const author_schema_index = task(
  fmt(`
Create the schema index and schema authoring plan.

Requirements:
- Map each normative doc section to one or more JSON Schemas.
- Define schema modularization rules.
- Decide what is normative in prose first vs schema first.
- Identify reusable schema fragments:
  support descriptor,
  protocolConfig,
  communications,
  events,
  scope matrix,
  native passthrough,
  transport flags,
  control flags.

Outputs:
- docs/protocol/800-schema-index.md
- schemas/fragments/
`, {}),
  {
    deps: [
      author_cap_l0, author_cap_l1, author_cap_l2,
      author_comm_l0, author_comm_l1, author_comm_l2,
      author_events_l0, author_events_l1, author_events_l2
    ]
  }
)

const generate_schemas = task(
  fmt(`
Generate JSON Schemas from the normative docs.

Requirements:
- Start with capabilities schemas for L0/L1/L2.
- Then communications schemas.
- Then event schemas.
- Then shared discovery and protocol-config schemas.
- Reuse fragments aggressively.
- Validate consistency against the prose docs.
- Record any prose/schema mismatch in the review backlog.

Outputs:
- schemas/amux.capabilities.l0.schema.json
- schemas/amux.capabilities.l1.schema.json
- schemas/amux.capabilities.l2.schema.json
- schemas/amux.communications.l0.schema.json
- schemas/amux.communications.l1.schema.json
- schemas/amux.communications.l2.schema.json
- schemas/amux.events.l0.schema.json
- schemas/amux.events.l1.schema.json
- schemas/amux.events.l2.schema.json
- schemas/amux.discovery.schema.json
- schemas/amux.protocol_config.schema.json
`, {}),
  {
    deps: [author_schema_index, author_discovery_docs[0], author_discovery_docs[1], author_asset_docs]
  }
)


// ------------------------------------------------------------
// 13. Phase J: examples and traces
// ------------------------------------------------------------

const author_examples = task(
  fmt(`
Author end-to-end examples and cross-layer traces.

Requirements:
- Produce realistic examples for:
  OpenAI Responses path,
  Anthropic Messages path,
  Gemini path,
  Codex runtime path,
  Claude Code path,
  OpenHands path.
- Each example must show:
  L2 intent/control,
  L1 runtime orchestration,
  L0 provider-surface interaction.
- Add at least one full cross-layer trace showing propagation of:
  provider selection,
  tool exposure,
  tool call,
  reasoning/tool continuation,
  user-facing message,
  session title summarization.

Outputs:
- docs/protocol/900-end-to-end-openai-responses-example.md
- docs/protocol/901-end-to-end-anthropic-messages-example.md
- docs/protocol/902-end-to-end-gemini-example.md
- docs/protocol/903-end-to-end-codex-runtime-example.md
- docs/protocol/904-end-to-end-claude-code-example.md
- docs/protocol/905-end-to-end-openhands-example.md
- docs/protocol/906-cross-layer-trace-example.md
`, {}),
  {
    deps: [generate_schemas, author_asset_docs, author_events_cross, author_comm_cross]
  }
)


// ------------------------------------------------------------
// 14. Phase K: conformance
// ------------------------------------------------------------

const author_conformance = task(
  fmt(`
Author the conformance model and test plan.

Requirements:
- Define conformance levels separately for L0, L1, L2, and adapters.
- Define mandatory vs optional features.
- Define pass/fail rules for:
  schema conformance,
  behavioral conformance,
  event causality,
  propagation correctness,
  native passthrough preservation.
- Include negative tests and partial-support reporting.

Outputs:
- docs/protocol/950-conformance-levels.md
- docs/protocol/951-provider-surface-conformance.md
- docs/protocol/952-lower-runtime-conformance.md
- docs/protocol/953-upper-harness-conformance.md
- docs/protocol/954-adapter-conformance.md
- conformance/TEST_PLAN.md
`, {}),
  {
    deps: [generate_schemas, author_examples]
  }
)


// ------------------------------------------------------------
// 15. Phase L: review and refinement loops
// ------------------------------------------------------------

const technical_review = task(
  fmt(`
Conduct a full technical review of the protocol set.

Review dimensions:
- layer boundary correctness
- internal consistency
- schema/prose consistency
- provider-surface realism
- runtime realism
- extension-plane realism
- ambiguity detection
- duplicated concepts
- names that still collide
- missing propagation rules

Inputs:
- all normative docs
- schemas
- examples
- conformance docs
- open questions register

Outputs:
- reviews/TECHNICAL_REVIEW.md
- reviews/ISSUE_BACKLOG.md
- reviews/SCHEMA_PROSE_DIFFS.md
`, {}),
  {
    deps: [author_conformance]
  }
)

const adversarial_review = task(
  fmt(`
Conduct an adversarial review.

Requirements:
- Try to break the architecture with edge cases:
  provider surface with stateful reasoning replay but stateless tool replay,
  upper layer that configures unsupported lower-layer targets,
  runtime with synthetic events only,
  provider with hosted tools but no client tools,
  mixed MCP and provider-hosted tools,
  session title generated at L2 but hidden from L1,
  discovery surfaces that disagree with capability docs.
- For each breakage, propose either:
  schema change,
  prose clarification,
  conformance rule,
  or explicit non-goal.

Outputs:
- reviews/ADVERSARIAL_REVIEW.md
- reviews/BREAKAGE_CASES.md
`, {}),
  {
    deps: [technical_review]
  }
)

const refinement = revise(
  fmt(`
Refine the protocol set based on the technical and adversarial reviews.

Requirements:
- Patch docs first where architecture is wrong.
- Patch schemas second.
- Re-run examples and conformance logic against the updated docs.
- Update ADRs if a change alters a previously frozen assumption.
- Emit a changelog.

Outputs:
- reviews/REFINEMENT_SUMMARY.md
- CHANGELOG_PROTOCOL_DRAFT.md
`, {}),
  {
    deps: [technical_review, adversarial_review]
  }
)

const freeze_v1_draft = freeze(
  fmt(`
Freeze the draft protocol set.

Requirements:
- Confirm every required document exists.
- Confirm every schema has a normative source doc.
- Confirm every example references only defined concepts.
- Confirm every conformance rule maps to documented requirements.
- Emit final v1-draft inventory and unresolved issues list.

Outputs:
- RELEASES/AMUX_PROTOCOL_V1_DRAFT.md
- RELEASES/UNRESOLVED_ISSUES.md
- RELEASES/DOCUMENT_INVENTORY.md
`, {}),
  {
    deps: [refinement]
  }
)


// ------------------------------------------------------------
// 16. Full orchestration flow
// ------------------------------------------------------------

function orchestrate_amux_protocol_authoring(): TaskResult[] {
  return seq(
    () => charter,
    () => glossary,
    () => style_guides,

    () => research_plan,
    () => join("research_parallel", parallel(
      () => l0_research,
      () => l1_research,
      () => l2_research
    )),
    () => cross_layer_analysis,

    () => boundary_decisions,
    () => freeze_foundation,

    () => join("capabilities_docs", seq(
      () => author_cap_l0,
      () => author_cap_l1,
      () => author_cap_l2,
      () => author_cap_cross
    )),

    () => join("communications_docs", seq(
      () => author_comm_l0,
      () => author_comm_l1,
      () => author_comm_l2,
      () => author_comm_cross
    )),

    () => join("events_docs", seq(
      () => author_events_l0,
      () => author_events_l1,
      () => author_events_l2,
      () => author_events_cross
    )),

    () => join("discovery_and_config_docs", author_discovery_docs),
    () => author_asset_docs,

    () => author_schema_index,
    () => generate_schemas,

    () => author_examples,
    () => author_conformance,

    () => technical_review,
    () => adversarial_review,
    () => refinement,
    () => freeze_v1_draft
  )
}


// ------------------------------------------------------------
// 17. Authoring instructions template for each task
// ------------------------------------------------------------

function build_task_instructions(params: {
  objective: string
  inputs: string[]
  priorDecisions: string[]
  requiredOutputs: string[]
  constraints?: string[]
  qualityGates?: string[]
}) {
  return fmt(`
Objective:
{objective}

Inputs:
{inputs}

Prior decisions that must be respected:
{priorDecisions}

Constraints:
{constraints}

Quality gates:
{qualityGates}

Required outputs:
{requiredOutputs}

Execution rules:
- Prefer official docs and official repos.
- Extract facts before synthesizing.
- Separate normative decisions from observed behavior.
- Do not collapse layer boundaries.
- Record every uncertainty explicitly.
- Preserve native passthrough where abstraction would lose meaning.
- Reuse terminology from the glossary exactly.
`, {
    objective: params.objective,
    inputs: params.inputs.map(x => `- ${x}`).join("\n"),
    priorDecisions: params.priorDecisions.map(x => `- ${x}`).join("\n"),
    constraints: (params.constraints ?? []).map(x => `- ${x}`).join("\n") || "- none",
    qualityGates: (params.qualityGates ?? []).map(x => `- ${x}`).join("\n") || "- none",
    requiredOutputs: params.requiredOutputs.map(x => `- ${x}`).join("\n")
  })
}


// ------------------------------------------------------------
// 18. Recommended execution policy
// ------------------------------------------------------------

const EXECUTION_POLICY = `
1. Lock foundation before normative docs.
2. Research in parallel, decide centrally.
3. Write capabilities before communications.
4. Write communications before events only where event semantics depend on message semantics.
5. Write discovery/config after capabilities, because they reference already-defined surfaces.
6. Write asset/extension docs after upper-layer foundations are locked.
7. Generate schemas only after prose stabilizes enough.
8. Always run review before freeze.
9. Keep ADRs alive whenever a refinement changes architecture.
`


// ------------------------------------------------------------
// 19. Short human summary
// ------------------------------------------------------------

const HUMAN_SUMMARY = `
This plan treats protocol authoring itself like a layered orchestration system.

- First, freeze architecture and terminology.
- Then research L0/L1/L2 in parallel.
- Then lock boundary decisions.
- Then author normative capabilities docs.
- Then communications, events, discovery, config, and asset docs.
- Then schemas, examples, and conformance.
- Then adversarial review and refinement.
- Then freeze a draft release.

The important part is that every downstream task gets its instructions string dynamically built from prior decisions, prior artifacts, and explicit quality gates, so the process compounds instead of drifting.
`