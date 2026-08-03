/**
 * @process contrib/rogelsm/graph-memory-ingest
 * @description Temporal knowledge-graph methodology for Claude Opus 5. Expresses graph INGEST
 *              and graph TRAVERSAL as two SEPARATE run profiles — never one run toggling
 *              effort. Ingest is deterministic shell work (batch extraction, exit-code
 *              enforced, cheap effort, thinking off, pre-warmed cache prefix). Traversal is
 *              agent work at high/xhigh effort, forced retrieval-first, with every answer
 *              citing edge_ids that actually exist in the store.
 * @inputs { profile: 'ingest'|'traversal', question?: string, limit?: number, mode?: 'batch'|'sync',
 *           dryRun?: boolean, effort?: 'high'|'xhigh', storeRoot?: string, srcRoot?: string }
 * @outputs { success: boolean, profile: string, ingest?: object, traversal?: object }
 *
 * ---------------------------------------------------------------------------
 * WHY TWO PROFILES AND NOT ONE RUN WITH AN EFFORT SWITCH
 * ---------------------------------------------------------------------------
 * Ingest and traversal do not share a system prompt. `graph_memory.prompts` keeps a
 * distinct invariant prefix per mode (`stable_prefix_text('extraction')` vs
 * `stable_prefix_text('traversal')`), and the cached breakpoint sits on that prefix.
 * Two different prefixes are two different prompt-cache entries by construction, so
 * interleaving extraction and traversal turns in one session means each mode keeps
 * evicting or missing the other's entry.
 *
 * That argument stands on the prefix alone. It is deliberately NOT resting on the
 * claim that `effort` is itself part of the prompt-cache key: whether changing
 * `output_config.effort` invalidates a cached prefix is undocumented and, in this
 * project, unmeasured (probe C3 was written but never run — no credentials). Do not
 * assert it as fact anywhere downstream of this file. The split is correct either
 * way, which is exactly why it is the safe default.
 *
 * Practical consequence: a run is EITHER an ingest run OR a traversal run. The
 * dispatcher below refuses `profile: 'both'`.
 *
 * ---------------------------------------------------------------------------
 * BACKEND
 * ---------------------------------------------------------------------------
 * The callable backend is the real implementation at ~/.claude/graph-memory/src/graph_memory/.
 * Entry points used here (all verified present in the source, none invented):
 *
 *   graph_memory.ingest.run_ingest(store=, transport=, resolver=, limit=, cache_mode=, opener=)
 *   graph_memory.extractor.Extractor(transport, cache_mode=, resolver=, planned_reads=)
 *       .build_request(episode) / .build_headers() / .build_prewarm_request()
 *       .prewarm() -> bool   .is_warm   .submit_batch(episodes)   .run_batch(episodes)
 *   graph_memory.traversal.Traversal(store, transport, cache_mode=, resolver=)
 *       .retrieve(question) / .build_request(question, subgraph)
 *       .validate_answer(answer, subgraph) / .answer(question) / CitationError
 *   graph_memory.store.EdgeStore(root, resolver=) -> .append_edges/.read_edges/.rebuild_index
 *                                                    /.neighbors/.entity_names/.edge_id_set
 *   graph_memory.corpus.iter_episodes(limit=, opener=)
 *   graph_memory.transport.AnthropicTransport(api_key=, base_url=, timeout=)
 *   graph_memory.prompts.stable_system_blocks(mode, cache_control=)
 *   graph_memory.tokens.count_blocks(blocks)
 *   graph_memory.config.{EXTRACTION_EFFORT, TARGET_STABLE_PREFIX_TOKENS, select_cache_control}
 *   graph_memory.episode.Episode(episode_id, text, reference_time, source_path=None)
 *
 * ---------------------------------------------------------------------------
 * TASK-KIND RULES
 * ---------------------------------------------------------------------------
 *   kind:'shell'  — every deterministic step. Exit code IS the gate; a non-zero exit
 *                   fails the run rather than being narrated away by an agent.
 *   kind:'agent'  — reasoning only (traversal answering).
 *   kind:'node'   — FORBIDDEN. It bypasses the agent orchestration model entirely.
 *                   `guardKind()` below throws if anyone adds one.
 *
 * @policy withTokenOptimization()  — MANDATORY per user profile policy
 * @policy withModelSelection()     — MANDATORY per user profile policy
 */

import { homedir } from 'node:os';

/**
 * Dependency resolution.
 *
 * Every other methodology in the library writes `import { defineTask } from
 * '@a5c-ai/babysitter-sdk'` and relies on a node_modules being present above it. This
 * file resolves the same specifier through a candidate list instead, because it also
 * has to load the two MANDATORY user policies, which live outside the library tree
 * entirely (`~/.a5c/processes`) and cannot be reached by a bare specifier at all.
 * One mechanism for both keeps the failure mode identical and legible.
 *
 * Nothing here silently degrades: if a dependency cannot be resolved this module
 * throws at load time rather than running a policy-free orchestration.
 */
const HOME_DIR = homedir();
const HERE = new URL('.', import.meta.url).pathname;

async function resolveModule(label, candidates) {
  const errors = [];
  for (const specifier of candidates.filter(Boolean)) {
    try {
      return await import(specifier);
    } catch (err) {
      errors.push(`${specifier}: ${err.message}`);
    }
  }
  throw new Error(
    `graph-memory-ingest: ${label} is REQUIRED and could not be resolved.\n` +
      `Tried:\n  ${errors.join('\n  ')}`
  );
}

const sdk = await resolveModule('@a5c-ai/babysitter-sdk', [
  '@a5c-ai/babysitter-sdk',
  `${HOME_DIR}/.a5c/processes/node_modules/@a5c-ai/babysitter-sdk/dist/index.js`,
  `${HOME_DIR}/.local/lib/node_modules/@a5c-ai/babysitter-sdk/dist/index.js`,
]);
const { defineTask } = sdk;

// NOTE: `globalThis.process`, not `process` — this module exports a hoisted function
// named `process`, which shadows the Node global for the whole module scope.
const policyDirEnv = globalThis.process?.env?.BABYSITTER_POLICY_DIR;

const policyDirs = [policyDirEnv, `${HOME_DIR}/.a5c/processes`, HERE]
  .filter(Boolean)
  .map((dir) => dir.replace(/\/$/, ''));

const loadPolicy = (basename) =>
  resolveModule(
    `policy ${basename}`,
    policyDirs.map((dir) => `${dir}/${basename}`)
  );

const { withTokenOptimization } = await loadPolicy('token-optimizer-policy.js');
const { withModelSelection } = await loadPolicy('model-selection-policy.js');

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_SRC_ROOT = `${HOME_DIR}/.claude/graph-memory/src`;
const DEFAULT_STORE_ROOT = `${HOME_DIR}/.claude/graph-memory/store`;

export const PROFILES = Object.freeze({ INGEST: 'ingest', TRAVERSAL: 'traversal' });

/**
 * INGEST execution profile.
 *
 * `effort: 'low'` + `thinking: 'disabled'` is the profile's declared contract and it is
 * enforced in TWO places, because there are two distinct efforts in play:
 *
 *   1. Orchestration effort — the effort/thinking any model-bearing effect in an ingest
 *      run receives. Pinned by INGEST_EFFORTS below, which is handed to
 *      withModelSelection(). Note that model-selection deliberately never stamps
 *      execution.effort on shell/breakpoint/sleep effects, so the all-shell ingest
 *      pipeline carries no effort field — this pin exists so that anything the policy
 *      wrappers themselves inject into an ingest run still runs cheap.
 *
 *   2. Extraction-request effort — what actually gets billed per episode. That lives in
 *      the request body as `output_config.effort` (graph_memory.config.EXTRACTION_EFFORT)
 *      together with `thinking: {"type": "disabled"}`, and is asserted by the
 *      `ingest-config-gate` shell task. This is the correction the whole layer exists
 *      for: effort in a header is silently discarded and billed at the default.
 */
export const INGEST_EXECUTION = Object.freeze({ effort: 'low', thinking: 'disabled' });
export const INGEST_EFFORTS = Object.freeze({
  trivial: 'low', simple: 'low', standard: 'low', complex: 'low', critical: 'low',
});

/** TRAVERSAL execution profile. Thinking is left ON: `disabled` is only legal at effort <= high. */
export const TRAVERSAL_EFFORTS = Object.freeze({
  trivial: 'high', simple: 'high', standard: 'high', complex: 'xhigh', critical: 'xhigh',
});

/** Cached stable prefix floor. 512 is where caching silently stops; 800 is the target with margin. */
export const MIN_STABLE_PREFIX_TOKENS = 800;

const FORBIDDEN_KINDS = new Set(['node']);

// ============================================================================
// TASK SHAPES
// ============================================================================

function guardKind(kind, id) {
  if (FORBIDDEN_KINDS.has(kind)) {
    throw new Error(
      `graph-memory-ingest: task "${id}" declares kind:'${kind}', which is forbidden. ` +
        `It bypasses the agent orchestration model. Use kind:'shell' for deterministic ` +
        `steps and kind:'agent' for reasoning.`
    );
  }
  return kind;
}

/** Deterministic step. Exit code is the gate — non-zero fails the run. */
const sh = (id, title, command, opts = {}) =>
  defineTask(id, (args, taskCtx) => ({
    kind: guardKind('shell', id),
    title,
    ...(opts.description ? { description: opts.description } : {}),
    shell: {
      command: typeof command === 'function' ? command(args, taskCtx) : command,
      expectedExitCode: opts.expectedExitCode ?? 0,
      timeout: opts.timeout ?? 900000,
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['graph-memory', ...(opts.labels || [])],
  }));

/** Reasoning step. `execution` is author-set here and model-selection honours it verbatim. */
const ag = (id, title, buildPrompt, opts = {}) =>
  defineTask(id, (args, taskCtx) => ({
    kind: guardKind('agent', id),
    title,
    ...(opts.description ? { description: opts.description } : {}),
    agent: {
      name: opts.agentName || 'general-purpose',
      prompt: buildPrompt(args),
      ...(opts.outputSchema ? { outputSchema: opts.outputSchema } : {}),
    },
    execution: {
      effort: args.effort || opts.effort || 'high',
      ...(opts.thinking ? { thinking: opts.thinking } : {}),
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
    labels: ['graph-memory', ...(opts.labels || [])],
  }));

// ---------------------------------------------------------------------------
// Shell helpers
// ---------------------------------------------------------------------------

/** Base64 so arbitrary questions/answers cross the JS→shell→Python boundary unmangled. */
const b64 = (value) => Buffer.from(JSON.stringify(value ?? null), 'utf8').toString('base64');

/**
 * Run a Python snippet against the graph_memory backend, writing its single JSON line
 * to the task's output.json and echoing it. The heredoc is quoted, so nothing is
 * shell-expanded.
 *
 * The exit code is captured and re-raised explicitly rather than piping into `tee`:
 * a pipeline reports the LAST command's status, so `python3 ... | tee` would report
 * tee's 0 and silently swallow every `sys.exit(1)` gate in this file. `set -o pipefail`
 * would also fix it but is not POSIX, and these commands must survive a /bin/sh runner.
 */
const py = (taskCtx, srcRoot, body) =>
  `mkdir -p tasks/${taskCtx.effectId} && PYTHONPATH="${srcRoot}" python3 - > tasks/${taskCtx.effectId}/output.json <<'PYEOF'\n` +
  `import base64, json, sys\n` +
  body.trimEnd() +
  `\nPYEOF\n` +
  `__gm_status=$?\n` +
  `cat tasks/${taskCtx.effectId}/output.json\n` +
  `exit $__gm_status\n`;

/** Read a task result whether the runtime handed back parsed JSON or raw stdout. */
export function jsonOf(result) {
  if (result && typeof result === 'object' && result.stdout === undefined) return result;
  const raw = String(result?.stdout ?? '').trim();
  const line = raw.split('\n').filter(Boolean).pop() || '';
  try {
    return JSON.parse(line);
  } catch {
    return result || {};
  }
}

const srcOf = (args) => args.srcRoot || DEFAULT_SRC_ROOT;
const storeOf = (args) => args.storeRoot || DEFAULT_STORE_ROOT;

// ============================================================================
// INGEST PROFILE — all deterministic, all shell, exit-code enforced
// ============================================================================

/** Every backend entry point this methodology calls must exist before anything dispatches. */
export const ingestPreflightTask = sh(
  'gm-ingest-preflight',
  'Ingest preflight: backend entry points resolve',
  (args, taskCtx) =>
    py(
      taskCtx,
      srcOf(args),
      `
import importlib
mods = ["config", "corpus", "entities", "episode", "extractor", "ingest",
        "prompts", "schemas", "store", "tokens", "transport", "traversal", "validation"]
loaded = {name: importlib.import_module("graph_memory." + name) for name in mods}
entries = {
    "ingest.run_ingest": hasattr(loaded["ingest"], "run_ingest"),
    "extractor.Extractor.build_request": hasattr(loaded["extractor"].Extractor, "build_request"),
    "extractor.Extractor.build_prewarm_request": hasattr(loaded["extractor"].Extractor, "build_prewarm_request"),
    "extractor.Extractor.prewarm": hasattr(loaded["extractor"].Extractor, "prewarm"),
    "extractor.Extractor.submit_batch": hasattr(loaded["extractor"].Extractor, "submit_batch"),
    "extractor.Extractor.run_batch": hasattr(loaded["extractor"].Extractor, "run_batch"),
    "store.EdgeStore": hasattr(loaded["store"], "EdgeStore"),
    "corpus.iter_episodes": hasattr(loaded["corpus"], "iter_episodes"),
    "transport.AnthropicTransport": hasattr(loaded["transport"], "AnthropicTransport"),
    "prompts.stable_system_blocks": hasattr(loaded["prompts"], "stable_system_blocks"),
    "tokens.count_blocks": hasattr(loaded["tokens"], "count_blocks"),
}
missing = sorted(name for name, ok in entries.items() if not ok)
print(json.dumps({"profile": "ingest", "entryPoints": sorted(entries), "missing": missing}))
sys.exit(1 if missing else 0)
`
    ),
  { labels: ['ingest', 'gate'], timeout: 120000 }
);

/**
 * HARD GATE on the request payload. This is where the article's bugs would surface:
 *   - effort must be in output_config, never in a header (a header effort is discarded
 *     silently and the call is billed at the default);
 *   - thinking must be EXPLICITLY disabled — it is ON by default on Opus 5;
 *   - the cached stable prefix must clear 800 tokens (512 is where caching quietly stops);
 *   - a cache_control breakpoint must actually be present on the system block.
 */
export const ingestConfigGateTask = sh(
  'gm-ingest-config-gate',
  'HARD GATE: extraction payload is the corrected shape',
  (args, taskCtx) =>
    py(
      taskCtx,
      srcOf(args),
      `
from graph_memory import config, tokens
from graph_memory.episode import Episode
from graph_memory.extractor import Extractor

# build_request is pure, so this gate runs offline with no transport and no credentials.
extractor = Extractor(None, cache_mode="backfill")
probe = Episode(
    episode_id="config-gate-probe",
    text="config gate probe",
    reference_time="2026-01-01T00:00:00+00:00",
)
body = extractor.build_request(probe)
headers = extractor.build_headers()
prefix_tokens = tokens.count_blocks(body["system"])
output_config = body.get("output_config") or {}

checks = {
    "effort_in_output_config": output_config.get("effort") == config.EXTRACTION_EFFORT == "low",
    "no_effort_header": not any("effort" in str(key).lower() for key in headers),
    "thinking_explicitly_disabled": body.get("thinking") == {"type": "disabled"},
    "cache_control_present": "cache_control" in (body["system"][0] or {}),
    "output_format_constrained": "format" in output_config,
    "stable_prefix_at_least_${MIN_STABLE_PREFIX_TOKENS}": prefix_tokens >= ${MIN_STABLE_PREFIX_TOKENS},
}
failures = sorted(name for name, ok in checks.items() if not ok)
print(json.dumps({
    "checks": checks,
    "failures": failures,
    "prefixTokens": prefix_tokens,
    "targetPrefixTokens": config.TARGET_STABLE_PREFIX_TOKENS,
    "effort": output_config.get("effort"),
}))
sys.exit(1 if failures else 0)
`
    ),
  { labels: ['ingest', 'gate'], timeout: 120000 }
);

/** Credentials guard: fail with a readable message instead of an opaque transport error. */
export const ingestCredentialsTask = sh(
  'gm-ingest-credentials',
  'Ingest credentials present (dispatching tasks require them)',
  (args, taskCtx) =>
    `mkdir -p tasks/${taskCtx.effectId} && ` +
    `if [ -n "$ANTHROPIC_API_KEY" ]; then ` +
    `echo '{"credentials":true}' | tee tasks/${taskCtx.effectId}/output.json; ` +
    `else echo '{"credentials":false,"hint":"export ANTHROPIC_API_KEY, or run with dryRun:true"}' ` +
    `| tee tasks/${taskCtx.effectId}/output.json; exit 1; fi`,
  { labels: ['ingest', 'gate'], timeout: 60000 }
);

/**
 * Pre-warm probe. A cache entry only becomes readable once the first response starts
 * streaming, so a parallel batch cannot read a prefix it is concurrently writing —
 * every entry would race, miss, and pay the write premium. One serialized standard
 * `max_tokens: 0` call fixes that. This task is the OBSERVABLE gate; `run_batch()`
 * re-runs and re-verifies the pre-warm in its own process because `_verified_warm`
 * is per-process state and cannot cross a task boundary.
 */
export const ingestPrewarmTask = sh(
  'gm-ingest-prewarm',
  'Pre-warm the extraction prefix BEFORE any batch submit',
  (args, taskCtx) =>
    py(
      taskCtx,
      srcOf(args),
      `
from graph_memory.extractor import Extractor
from graph_memory.transport import AnthropicTransport

extractor = Extractor(AnthropicTransport(), cache_mode="backfill")
warm = extractor.prewarm()
print(json.dumps({"warm": bool(warm), "isWarm": bool(extractor.is_warm)}))
sys.exit(0 if warm else 1)
`
    ),
  { labels: ['ingest', 'cache'], timeout: 300000 }
);

/**
 * Batch submit. `run_batch()` pre-warms, VERIFIES the cache actually wrote, and only then
 * submits — it raises PrewarmFailedError rather than dispatching into a cold prefix.
 */
export const ingestBatchTask = sh(
  'gm-ingest-batch',
  'Submit the extraction batch (pre-warm enforced in-process)',
  (args, taskCtx) =>
    py(
      taskCtx,
      srcOf(args),
      `
from graph_memory import corpus
from graph_memory.extractor import Extractor
from graph_memory.transport import AnthropicTransport

limit = json.loads(base64.b64decode("${b64(args.limit ?? null)}").decode())
episodes = list(corpus.iter_episodes(limit=limit))
if not episodes:
    print(json.dumps({"submitted": 0, "error": "corpus yielded no episodes"}))
    sys.exit(1)

extractor = Extractor(AnthropicTransport(), cache_mode="backfill")
batch = extractor.run_batch(episodes)
print(json.dumps({
    "submitted": len(episodes),
    "batchId": (batch or {}).get("id"),
    "prewarmVerified": bool(extractor.is_warm),
}))
`
    ),
  { labels: ['ingest', 'batch'], timeout: 900000 }
);

/** Synchronous fallback path for small corpora — the real `run_ingest` entry point. */
export const ingestSyncTask = sh(
  'gm-ingest-sync',
  'Synchronous ingest (run_ingest) for small corpora',
  (args, taskCtx) =>
    py(
      taskCtx,
      srcOf(args),
      `
from graph_memory.ingest import run_ingest
from graph_memory.store import EdgeStore
from graph_memory.transport import AnthropicTransport

limit = json.loads(base64.b64decode("${b64(args.limit ?? null)}").decode())
store = EdgeStore("${storeOf(args)}")
result = run_ingest(
    store=store,
    transport=AnthropicTransport(),
    limit=limit,
    cache_mode="backfill",
)
print(json.dumps({
    "episodes": result["episodes"],
    "edges": len(result["edges"]),
}))
sys.exit(0 if result["episodes"] else 1)
`
    ),
  { labels: ['ingest', 'sync'], timeout: 900000 }
);

/** Dry run: build every payload, validate it, dispatch nothing. Usable with no credentials. */
export const ingestDryRunTask = sh(
  'gm-ingest-dry-run',
  'Dry run: build and validate every extraction payload, dispatch nothing',
  (args, taskCtx) =>
    py(
      taskCtx,
      srcOf(args),
      `
from graph_memory import corpus
from graph_memory.extractor import Extractor

limit = json.loads(base64.b64decode("${b64(args.limit ?? 25)}").decode())
extractor = Extractor(None, cache_mode="backfill")
built = 0
for episode in corpus.iter_episodes(limit=limit):
    extractor.build_request(episode)  # validate_request runs inside; raises on drift
    built += 1
extractor.build_prewarm_request()
print(json.dumps({"payloadsBuilt": built, "dispatched": 0}))
sys.exit(0 if built else 1)
`
    ),
  { labels: ['ingest', 'dry-run'], timeout: 300000 }
);

/** Post-ingest store integrity: index rebuilds, edge ids are unique, entities are addressable. */
export const ingestVerifyTask = sh(
  'gm-ingest-verify',
  'HARD GATE: edge store is populated and its index is consistent',
  (args, taskCtx) =>
    py(
      taskCtx,
      srcOf(args),
      `
from graph_memory.store import EdgeStore

store = EdgeStore("${storeOf(args)}")
store.rebuild_index()
edges = store.read_edges()
edge_ids = store.edge_id_set()
entities = store.entity_names()
duplicates = len(edges) - len(edge_ids)
print(json.dumps({
    "edges": len(edges),
    "uniqueEdgeIds": len(edge_ids),
    "duplicateEdgeIds": duplicates,
    "entities": len(entities),
}))
sys.exit(0 if edges and duplicates == 0 else 1)
`
    ),
  { labels: ['ingest', 'gate'], timeout: 300000 }
);

// ============================================================================
// TRAVERSAL PROFILE — retrieval first, then reasoning over ONLY those facts
// ============================================================================

/**
 * Retrieval runs FIRST and it is deterministic: `Traversal.retrieve()` sorts by edge_id,
 * so the same question yields the same subgraph on every run. An empty subgraph is a
 * hard failure — the methodology's whole contract is that nothing gets answered from
 * outside the store.
 */
export const traversalRetrieveTask = sh(
  'gm-traversal-retrieve',
  'Retrieve the subgraph for the question (retrieval-first, deterministic)',
  (args, taskCtx) =>
    py(
      taskCtx,
      srcOf(args),
      `
from graph_memory.store import EdgeStore
from graph_memory.traversal import Traversal

question = json.loads(base64.b64decode("${b64(args.question)}").decode())
store = EdgeStore("${storeOf(args)}")
# retrieve() reads the store only; the transport is never touched on this path.
traversal = Traversal(store, None, cache_mode="interactive")
subgraph = traversal.retrieve(question)
print(json.dumps({
    "question": question,
    "entities": traversal.mentioned_entities(question),
    "subgraph": subgraph,
    "edgeIds": [record["edge_id"] for record in subgraph],
}))
sys.exit(0 if subgraph else 1)
`
    ),
  { labels: ['traversal', 'retrieval'], timeout: 300000 }
);

/**
 * The only reasoning step in the whole methodology. High/xhigh effort, and the agent is
 * given the retrieved subgraph inline — it is forbidden to widen the fact set. Thinking
 * is left ON here (it is only legal to disable at effort <= high, and traversal is where
 * reasoning is actually worth paying for).
 */
export const traversalAnswerTask = ag(
  'gm-traversal-answer',
  'Answer the question over the retrieved subgraph ONLY',
  (args) => ({
    role: 'temporal knowledge-graph analyst',
    task: 'Answer the question using only the retrieved subgraph, citing the edge_ids you relied on.',
    context: {
      question: args.question,
      subgraph: args.subgraph,
      availableEdgeIds: args.edgeIds,
      storeRoot: args.storeRoot || DEFAULT_STORE_ROOT,
    },
    instructions: [
      'RETRIEVAL-FIRST IS ABSOLUTE. The subgraph in your context is the complete fact set. ' +
        'Do not read the corpus, the store files, the SQLite index, or anything else on disk. ' +
        'Do not widen the fact set. If the subgraph does not support an answer, say so.',
      'Reason only over the supplied facts. Every claim must trace to a specific edge.',
      'Cite edge_ids in a `citations` array. Every id you cite MUST appear in availableEdgeIds ' +
        'verbatim — an id that is not in that list is a fabrication and the run will fail on it.',
      'An answer with zero citations is rejected. Silence is not a pass: if you cannot ground ' +
        'the answer, return `answered: false` with an explanation and no citations claim.',
      'Do not paraphrase edge_ids, do not shorten them, do not invent plausible-looking ones.',
      'Respect temporality: `valid_from` on each edge is when the fact became true. Never ' +
        'present a superseded edge as current without saying so.',
      'Return JSON only.',
    ],
    outputFormat:
      'JSON: {answer: string, answered: boolean, citations: string[], uncertainties: string[]}',
  }),
  {
    effort: 'high',
    outputSchema: {
      type: 'object',
      required: ['answer', 'answered', 'citations'],
      properties: {
        answer: { type: 'string' },
        answered: { type: 'boolean' },
        citations: { type: 'array', items: { type: 'string' } },
        uncertainties: { type: 'array', items: { type: 'string' } },
      },
    },
    labels: ['traversal', 'reasoning'],
  }
);

/**
 * HARD GATE against fabrication, enforced by the backend rather than by a reviewer agent.
 * `Traversal.validate_answer` raises CitationError when a citation is missing, absent from
 * the store, or present in the store but NOT in the subgraph retrieved for this question.
 */
export const traversalCitationGateTask = sh(
  'gm-traversal-citation-gate',
  'HARD GATE: every cited edge_id exists AND was actually retrieved',
  (args, taskCtx) =>
    py(
      taskCtx,
      srcOf(args),
      `
from graph_memory.store import EdgeStore
from graph_memory.traversal import CitationError, Traversal

answer = json.loads(base64.b64decode("${b64(args.answer)}").decode())
subgraph = json.loads(base64.b64decode("${b64(args.subgraph)}").decode())

store = EdgeStore("${storeOf(args)}")
traversal = Traversal(store, None, cache_mode="interactive")
try:
    traversal.validate_answer(answer, subgraph)
except CitationError as err:
    print(json.dumps({"grounded": False, "error": str(err)}))
    sys.exit(1)
print(json.dumps({
    "grounded": True,
    "citations": list(answer.get("citations") or []),
    "subgraphSize": len(subgraph or []),
}))
`
    ),
  { labels: ['traversal', 'gate'], timeout: 300000 }
);

/**
 * Optional all-in-one backend path: `Traversal.answer()` retrieves, dispatches a real
 * traversal request and validates the citations itself. Requires credentials. The agent
 * path above is the default because it is what the orchestrator can actually supervise.
 */
export const traversalBackendAnswerTask = sh(
  'gm-traversal-backend-answer',
  'Backend traversal answer (Traversal.answer) with built-in citation validation',
  (args, taskCtx) =>
    py(
      taskCtx,
      srcOf(args),
      `
from graph_memory.store import EdgeStore
from graph_memory.traversal import CitationError, Traversal
from graph_memory.transport import AnthropicTransport

question = json.loads(base64.b64decode("${b64(args.question)}").decode())
store = EdgeStore("${storeOf(args)}")
traversal = Traversal(store, AnthropicTransport(), cache_mode="interactive")
try:
    answer = traversal.answer(question)
except CitationError as err:
    print(json.dumps({"grounded": False, "error": str(err)}))
    sys.exit(1)
print(json.dumps({"grounded": True, "answer": answer}))
`
    ),
  { labels: ['traversal', 'backend'], timeout: 600000 }
);

// ============================================================================
// POLICY COMPOSITION
// ============================================================================

/**
 * Compose BOTH mandatory policies and hand the inner process a single merged helper bag.
 *
 * Naively nesting `withTokenOptimization(withModelSelection(inner))` loses the token
 * helpers: withTokenOptimization passes `{ checkpoint }` as a third argument to the
 * function withModelSelection returned, and that function only accepts `(inputs, ctx)`.
 * Calling the model-selection wrapper explicitly and merging both helper bags keeps
 * `checkpoint`, `sessionCheck`, `routeExecution` and `withModel` all available.
 */
export function withPolicies(inner, opts = {}) {
  return withTokenOptimization(
    (inputs, ctx, tokenHelpers) =>
      withModelSelection(
        (innerInputs, innerCtx, modelHelpers) =>
          inner(innerInputs, innerCtx, { ...tokenHelpers, ...modelHelpers }),
        opts.modelSelection || {}
      )(inputs, ctx),
    opts.tokenOptimization || {}
  );
}

// ============================================================================
// PROFILE 1 — INGEST RUN
// ============================================================================

/**
 * Ingest run. Deterministic end to end: preflight → payload-shape gate → (dry run |
 * credentials → pre-warm → batch/sync) → store verification. Nothing here reasons.
 */
export const ingestProcess = withPolicies(
  async (inputs, ctx, helpers) => {
    const checkpoint = helpers.checkpoint || (async () => {});
    const common = { srcRoot: inputs.srcRoot, storeRoot: inputs.storeRoot, limit: inputs.limit };
    const summary = { profile: PROFILES.INGEST, execution: INGEST_EXECUTION, dispatched: false };

    const preflight = jsonOf(await ctx.task(ingestPreflightTask, common));
    const configGate = jsonOf(await ctx.task(ingestConfigGateTask, common));
    summary.entryPoints = preflight.entryPoints;
    summary.payload = {
      effort: configGate.effort,
      prefixTokens: configGate.prefixTokens,
      thinking: 'disabled',
    };
    await checkpoint('ingest-preflight');

    if (inputs.dryRun) {
      summary.dryRun = jsonOf(await ctx.task(ingestDryRunTask, common));
      return { success: true, profile: PROFILES.INGEST, ingest: summary };
    }

    await ctx.task(ingestCredentialsTask, common);

    // Pre-warm BEFORE the batch: a parallel batch cannot read a prefix it is
    // concurrently writing, so the first and largest batch would otherwise pay the
    // cache-write premium on every single entry.
    summary.prewarm = jsonOf(await ctx.task(ingestPrewarmTask, common));
    await checkpoint('ingest-prewarm');

    const mode = inputs.mode || 'batch';
    summary.mode = mode;
    summary.extraction =
      mode === 'sync'
        ? jsonOf(await ctx.task(ingestSyncTask, common))
        : jsonOf(await ctx.task(ingestBatchTask, common));
    summary.dispatched = true;

    summary.store = jsonOf(await ctx.task(ingestVerifyTask, common));
    await checkpoint('ingest-verify');

    return { success: true, profile: PROFILES.INGEST, ingest: summary };
  },
  { modelSelection: { efforts: INGEST_EFFORTS, bias: 'cost' } }
);

// ============================================================================
// PROFILE 2 — TRAVERSAL RUN
// ============================================================================

/**
 * Traversal run. Retrieve → reason over only the retrieved facts → prove every citation.
 * Never runs in the same session as an ingest: different system prefix, different cache
 * entry, different effort contract.
 */
export const traversalProcess = withPolicies(
  async (inputs, ctx, helpers) => {
    const checkpoint = helpers.checkpoint || (async () => {});
    const sessionCheck = helpers.sessionCheck || (async () => ({}));

    const question = inputs.question;
    if (!question || typeof question !== 'string') {
      throw new Error(
        'graph-memory-ingest: the traversal profile requires `question` (a string). ' +
          'There is no traversal without something to retrieve for.'
      );
    }

    const effort = inputs.effort === 'xhigh' ? 'xhigh' : 'high';
    const common = { srcRoot: inputs.srcRoot, storeRoot: inputs.storeRoot, question };
    const summary = { profile: PROFILES.TRAVERSAL, question, effort };

    await sessionCheck('graph traversal', [
      { title: 'reason over retrieved subgraph', kind: 'agent', complexity: 'complex' },
    ]);

    // 1. RETRIEVE — deterministic, store-only, fails closed on an empty subgraph.
    const retrieved = jsonOf(await ctx.task(traversalRetrieveTask, common));
    summary.retrieval = {
      entities: retrieved.entities,
      edgeIds: retrieved.edgeIds,
      size: (retrieved.subgraph || []).length,
    };
    await checkpoint('traversal-retrieval');

    if (inputs.useBackendAnswer) {
      summary.answer = jsonOf(await ctx.task(traversalBackendAnswerTask, common));
      return { success: true, profile: PROFILES.TRAVERSAL, traversal: summary };
    }

    // 2. REASON — high/xhigh effort, over ONLY the retrieved facts.
    const answer = await ctx.task(traversalAnswerTask, {
      ...common,
      effort,
      subgraph: retrieved.subgraph || [],
      edgeIds: retrieved.edgeIds || [],
    });
    summary.answer = answer;

    // 3. PROVE — the backend rejects fabricated or ungrounded citations by exit code.
    summary.citations = jsonOf(
      await ctx.task(traversalCitationGateTask, {
        ...common,
        answer,
        subgraph: retrieved.subgraph || [],
      })
    );
    await checkpoint('traversal-citation-gate');

    return { success: true, profile: PROFILES.TRAVERSAL, traversal: summary };
  },
  { modelSelection: { efforts: TRAVERSAL_EFFORTS, bias: 'quality' } }
);

// ============================================================================
// DISPATCHER — one run is one profile, never both
// ============================================================================

export async function process(inputs, ctx) {
  const profile = inputs.profile;
  if (profile === PROFILES.INGEST) return ingestProcess(inputs, ctx);
  if (profile === PROFILES.TRAVERSAL) return traversalProcess(inputs, ctx);
  throw new Error(
    `graph-memory-ingest: profile must be '${PROFILES.INGEST}' or '${PROFILES.TRAVERSAL}', got ${JSON.stringify(profile)}. ` +
      `Running both in one session is refused by design: ingest and traversal use different ` +
      `system prefixes and therefore different prompt-cache entries, so interleaving them makes ` +
      `each mode miss the other's cache. Start two runs.`
  );
}
