/**
 * Mock scenario seeding — kanban model (SPEC §7 as amended by SPEC-V3).
 *
 * Deterministically generates the boot world from a seed:
 *   - 2–3 workspaces;
 *   - a BACKLOG deck of task cards (kradle AgentDispatchRun resources) across
 *     the full SPEC-V2 §V2-2 task-kind list: ≥5 singles + 2 hierarchy stacks
 *     (parent with 2–3 children linked via the V2-4
 *     `kradle.a5c.ai/parent-task` label);
 *   - ZERO agents (SPEC-V3 §V3-2: no idle agents, no pre-spawned fleet —
 *     agents exist only while attached to a card);
 *   - the Company Brain (SPEC-V2 §V2-3): one unified memory graph of 40–60
 *     records partitioned across 3–4 silos (a few records replicated).
 *
 * Same seed => byte-identical scenario. Framework-free.
 */

import type {
  AgentMemoryRepository,
  AgentMemorySource,
  GraphRecord,
  MemoryEdgeKind,
  MemoryNodeKind,
} from '../../contracts/kradle-memory';
import type { CommanderTask } from '../../contracts/kradle-resources';
import { KRADLE_API_VERSION } from '../../contracts/kradle-resources';
import type { KradleAgentStack } from '../../contracts/kradle-stack';
import { Prng } from './prng';

/** Fixed simulated epoch: the sim clock never touches Date.now(). */
export const SIM_EPOCH_MS = 1_770_000_000_000;

export const ADAPTERS = ['claude-code', 'codex', 'gemini-cli', 'pi'] as const;
export type AdapterName = (typeof ADAPTERS)[number];

export const MODELS_BY_ADAPTER: Record<AdapterName, readonly string[]> = {
  'claude-code': ['claude-sonnet-4-5', 'claude-opus-4-6'],
  codex: ['gpt-5.2-codex', 'gpt-5.1-codex-mini'],
  'gemini-cli': ['gemini-3-pro', 'gemini-3-flash'],
  pi: ['pi-2.5'],
};

/** SPEC-V2 §V2-2 task kinds — the sim must generate all of them. */
export const TASK_KINDS = [
  'implement',
  'review',
  'fix',
  'root-cause-analysis',
  'polish',
  'test-coverage',
  'docs',
  'deploy',
  'research',
  'migrate',
] as const;
export type TaskKind = (typeof TASK_KINDS)[number];

/** SPEC-V3 §V3-2 task-kind → worker adapter mapping. */
export const WORKER_ADAPTER_BY_KIND: Record<TaskKind, AdapterName> = {
  implement: 'claude-code',
  fix: 'claude-code',
  migrate: 'claude-code',
  review: 'codex',
  'root-cause-analysis': 'pi',
  'test-coverage': 'pi',
  docs: 'gemini-cli',
  research: 'gemini-cli',
  polish: 'codex',
  deploy: 'codex',
};

/** V2-4 hierarchy label: children point at their parent's metadata.name. */
export const PARENT_TASK_LABEL = 'kradle.a5c.ai/parent-task';

// ---------------------------------------------------------------------------
// Agent stacks (SPEC-V4 §V4-5: 4 seeded stacks, one per adapter family, each
// with a distinct written personality in prompt.system)
// ---------------------------------------------------------------------------

export interface SeededStack {
  /** Deterministic seeded stack id (custom stacks mint stk-cNN). */
  stackRef: string;
  stack: KradleAgentStack;
}

function seededStack(
  stackRef: string,
  name: string,
  adapter: AdapterName,
  system: string,
  developer: string,
): SeededStack {
  return {
    stackRef,
    stack: {
      apiVersion: KRADLE_API_VERSION,
      kind: 'AgentStack',
      metadata: { name, namespace: 'kradle-system', labels: { 'a5c.ai/owner': 'commander' } },
      spec: {
        baseAgent: adapter,
        adapter,
        model: MODELS_BY_ADAPTER[adapter][0]!,
        prompt: { system, developer },
        approvalMode: 'prompt',
        runnerPool: 'untrusted-linux',
      },
      status: { phase: 'ready' },
    },
  };
}

/** The 4 seeded stacks (§V4-5): distinct personalities, one per adapter family. */
export const SEEDED_STACKS: readonly SeededStack[] = [
  seededStack(
    'stk-01',
    'Meticulous Reviewer',
    'claude-code',
    'A meticulous reviewer who reads every diff line twice and trusts nothing without a failing test first. ' +
      'It cites the exact file and line for every finding and never waves a change through on vibes.',
    'Prefer small reviewed steps; demand a regression test for every fix.',
  ),
  seededStack(
    'stk-02',
    'Bold Refactorer',
    'codex',
    'A bold refactorer who would rather rebuild the mechanism than patch around it. ' +
      'It moves fast, deletes dead weight without sentiment, and leaves the architecture simpler than it found it.',
    'When duplication appears twice, extract; when a module fights you, replace it.',
  ),
  seededStack(
    'stk-03',
    'Careful Archivist',
    'gemini-cli',
    'A careful archivist who documents every decision before acting and never lets a finding go unrecorded. ' +
      'It writes prose first, code second, and keeps the ledgers immaculate.',
    'Every change ships with updated docs and a one-line rationale in the changelog.',
  ),
  seededStack(
    'stk-04',
    'Swift Scout',
    'pi',
    'A swift scout that maps the territory in minutes and reports back before committing to anything heavy. ' +
      'It favors the smallest probe that answers the question and abandons dead ends without regret.',
    'Time-box every investigation; surface findings early and often.',
  ),
] as const;

/** §V4-5: the kind → default stack mapping (mirrors WORKER_ADAPTER_BY_KIND). */
export const DEFAULT_STACK_BY_KIND: Record<TaskKind, string> = Object.fromEntries(
  TASK_KINDS.map((kind) => [
    kind,
    SEEDED_STACKS.find((s) => s.stack.spec.adapter === WORKER_ADAPTER_BY_KIND[kind])!.stackRef,
  ]),
) as Record<TaskKind, string>;

export const TASK_TITLES: Record<TaskKind, string> = {
  implement: 'Forge the new mechanism',
  review: 'Audit the incoming diff',
  fix: 'Hunt the regression',
  'root-cause-analysis': 'Trace the fault to its origin',
  polish: 'Burnish the brasswork',
  'test-coverage': 'Fortify the test perimeter',
  docs: 'Chart the territory',
  deploy: 'Stage the launch sequence',
  research: 'Survey the unknown plateau',
  migrate: 'Relocate the archive vault',
};

const WORKSPACE_DEFS = [
  { name: 'frontier', repository: 'a5c-ai/frontier' },
  { name: 'bastion', repository: 'a5c-ai/bastion' },
  { name: 'relay', repository: 'a5c-ai/relay' },
] as const;

export interface ScenarioWorkspace {
  workspaceId: string;
  name: string;
  repository: string;
}

export interface ScenarioCard {
  /** The mirrored kradle resource. metadata.name doubles as the card/task id. */
  resource: CommanderTask;
  taskKind: TaskKind;
  /** Parent card id when this card is a stack mini-child (V2-4). */
  parentId: string | null;
}

export interface ScenarioMemorySilo {
  repository: AgentMemoryRepository;
  source: AgentMemorySource;
  /** Record ids this silo holds (subsets of the unified graph; some replicated). */
  recordIds: string[];
}

export interface ScenarioMemory {
  silos: ScenarioMemorySilo[];
  records: GraphRecord[];
}

export interface Scenario {
  seed: number;
  epochMs: number;
  workspaces: ScenarioWorkspace[];
  cards: ScenarioCard[];
  memory: ScenarioMemory;
}

// ---------------------------------------------------------------------------
// Card generation
// ---------------------------------------------------------------------------

function makeTask(
  rng: Prng,
  name: string,
  taskKind: TaskKind,
  workspace: ScenarioWorkspace,
  title: string,
  parentId: string | null,
): ScenarioCard {
  const resource: CommanderTask = {
    apiVersion: KRADLE_API_VERSION,
    kind: 'AgentDispatchRun',
    metadata: {
      name,
      namespace: 'kradle-system',
      labels: {
        'a5c.ai/title': title,
        'kradle.a5c.ai/repository': workspace.repository,
        'kradle.a5c.ai/agent-stack': 'commander-fleet',
        'kradle.a5c.ai/runner-pool': 'untrusted-linux',
        ...(parentId !== null ? { [PARENT_TASK_LABEL]: parentId } : {}),
      },
    },
    spec: {
      repository: workspace.repository,
      ref: 'refs/heads/main',
      branch: 'main',
      sha: deterministicSha(rng),
      sourceRefs: {
        triggerRule: 'commander-manual-dispatch',
      },
      agentStack: 'commander-fleet',
      taskKind,
      workspaceRef: workspace.workspaceId,
      runnerPool: 'untrusted-linux',
      approvalPolicy: {
        requireWriteBackApproval: true,
      },
    },
    status: {
      storage: 'postgres',
      phase: 'Pending',
      conditions: [],
    },
  };
  return { resource, taskKind, parentId };
}

// ---------------------------------------------------------------------------
// Memory graph generation (V2-3: 40–60 records, 3–4 silos)
// ---------------------------------------------------------------------------

const MEMORY_KIND_POOL: ReadonlyArray<{ kind: MemoryNodeKind; prefix: string; stems: readonly string[] }> = [
  { kind: 'Repository', prefix: 'repository', stems: ['frontier', 'bastion', 'relay', 'kradle'] },
  { kind: 'Team', prefix: 'team', stems: ['platform', 'cogwheel', 'lampwrights', 'archivists'] },
  { kind: 'Service', prefix: 'service', stems: ['gateway', 'dispatcher', 'indexer', 'beacon'] },
  { kind: 'Package', prefix: 'package', stems: ['sdk', 'adapters', 'catalog', 'observer'] },
  { kind: 'Runbook', prefix: 'runbook', stems: ['ci-flake-triage', 'rollback-drill', 'lockfile-repair', 'release-night'] },
  { kind: 'Decision', prefix: 'decision', stems: ['git-backed-memory', 'event-sourcing', 'monorepo-split', 'brass-theme'] },
  { kind: 'Incident', prefix: 'incident', stems: ['ci-outage-05', 'token-leak-03', 'replay-drift-11', 'gateway-stall-07'] },
  { kind: 'AgentPractice', prefix: 'agent-practice', stems: ['focused-tests-first', 'small-diffs', 'cite-sources', 'verify-before-merge'] },
  { kind: 'Skill', prefix: 'skill', stems: ['diff-review', 'bisect', 'coverage-audit', 'doc-weaving'] },
  { kind: 'Tool', prefix: 'tool', stems: ['memory-grep', 'vitest', 'playwright', 'patch-press'] },
  { kind: 'Customer', prefix: 'customer', stems: ['aether-works', 'gilded-gears'] },
  { kind: 'ProductArea', prefix: 'product-area', stems: ['orchestration', 'observability', 'memory'] },
  { kind: 'Term', prefix: 'term', stems: ['cogitator', 'effect', 'journal', 'silo'] },
  { kind: 'PromptFragment', prefix: 'prompt-fragment', stems: ['review-checklist', 'fix-protocol', 'docs-voice'] },
];

const MEMORY_EDGE_POOL: readonly MemoryEdgeKind[] = [
  'documents',
  'implements',
  'depends_on',
  'supersedes',
  'owned_by',
  'applies_to_repo',
  'mentions',
  'derived_from',
  'resolved_by',
];

function generateMemory(rng: Prng, workspaces: ScenarioWorkspace[]): ScenarioMemory {
  const records: GraphRecord[] = [];
  const owners = ['team:platform', 'team:cogwheel', 'team:lampwrights', 'team:archivists'];
  const statuses = ['approved', 'approved', 'approved', 'draft', 'deprecated'] as const;

  for (const pool of MEMORY_KIND_POOL) {
    for (const stem of pool.stems) {
      records.push({
        nodeKind: pool.kind,
        id: `${pool.prefix}:${stem}`,
        attributes: {
          title: stem.replace(/-/g, ' '),
          status: rng.pick(statuses),
          owners: [rng.pick(owners)],
          summary: `Canonical ${pool.kind} record for ${stem}.`,
          tags: [pool.prefix, rng.pick(['ci', 'agents', 'memory', 'release', 'ops'])],
          updatedAt: new Date(SIM_EPOCH_MS - rng.int(1, 90) * 86_400_000).toISOString(),
        },
      });
    }
  }

  // Edges: each record gets 1–3 outgoing edges to other records.
  for (const record of records) {
    const edgeCount = rng.int(1, 3);
    const edges: Partial<Record<MemoryEdgeKind, Array<{ target: string }>>> = {};
    for (let e = 0; e < edgeCount; e += 1) {
      const kind = rng.pick(MEMORY_EDGE_POOL);
      let target = rng.pick(records).id;
      if (target === record.id) target = records[(records.indexOf(record) + 1) % records.length]!.id;
      const list = edges[kind] ?? [];
      list.push({ target });
      edges[kind] = list;
    }
    record.edges = edges;
  }

  // Silos: 3–4 AgentMemoryRepository+Source pairs, each holding a slice.
  const siloCount = rng.int(3, 4);
  const siloNames = ['brain-frontier', 'brain-bastion', 'brain-relay', 'brain-shared'].slice(0, siloCount);
  const silos: ScenarioMemorySilo[] = siloNames.map((name, index) => {
    const ws = workspaces[index % workspaces.length]!;
    const team = owners[index % owners.length]!;
    // Partition: every record lands in silo (recordIndex % siloCount); a few
    // records are replicated into the next silo over.
    const recordIds = records
      .filter((_, i) => i % siloCount === index || (i % 7 === 0 && (i + 1) % siloCount === index))
      .map((r) => r.id);
    const repository: AgentMemoryRepository = {
      apiVersion: KRADLE_API_VERSION,
      kind: 'AgentMemoryRepository',
      metadata: {
        name,
        namespace: 'kradle-system',
        labels: { 'a5c.ai/owner': team.slice('team:'.length) },
      },
      spec: {
        repositoryRef: `${ws.repository}-brain`,
        defaultBranch: 'main',
        layoutProfile: 'company-brain-v1',
      },
      status: {
        storage: 'etcd',
        phase: 'Ready',
        conditions: [],
        currentCommit: deterministicSha(rng),
        indexDigest: `sha256:${deterministicSha(rng)}${deterministicSha(rng)}`,
      },
    };
    const source: AgentMemorySource = {
      apiVersion: KRADLE_API_VERSION,
      kind: 'AgentMemorySource',
      metadata: { name: `${name}-source`, namespace: 'kradle-system' },
      spec: {
        repositoryRef: name,
        appliesTo: { repositories: [ws.repository], teams: [team] },
        include: {
          graphKinds: ['Runbook', 'Decision', 'AgentPractice', 'Skill', 'Tool'],
          paths: ['graph/**', 'runbooks/**', 'decisions/**'],
        },
        maxContextBytes: 750_000,
      },
      status: { storage: 'etcd', phase: 'Ready', conditions: [] },
    };
    return { repository, source, recordIds };
  });

  return { silos, records };
}

// ---------------------------------------------------------------------------
// Scenario
// ---------------------------------------------------------------------------

/** Generate the deterministic boot world for a seed. */
export function generateScenario(seed: number): Scenario {
  const rng = new Prng((seed ^ 0x5eed_c0de) >>> 0);

  // --- workspaces: 2–3 -----------------------------------------------------
  const workspaceCount = rng.int(2, 3);
  const workspaces: ScenarioWorkspace[] = WORKSPACE_DEFS.slice(0, workspaceCount).map(
    (def, index) => ({
      workspaceId: `ws-${String(index + 1).padStart(2, '0')}-${def.name}`,
      name: def.name,
      repository: def.repository,
    }),
  );

  // --- backlog deck: 6–8 singles + 2 stacks (SPEC-V3 §V3-2 boot scenario) ---
  const cards: ScenarioCard[] = [];
  let serial = 0;
  const nextName = (kind: TaskKind): string => {
    serial += 1;
    return `adr-${String(serial).padStart(2, '0')}-${kind}`;
  };

  const kinds = rng.shuffle(TASK_KINDS);
  const singleCount = rng.int(6, 8);
  for (let i = 0; i < singleCount; i += 1) {
    const kind = kinds[i % kinds.length]!;
    const ws = workspaces[i % workspaces.length]!;
    cards.push(makeTask(rng, nextName(kind), kind, ws, TASK_TITLES[kind], null));
  }

  // Two stacks: parent + 2–3 children each (children carry the parent label).
  for (let s = 0; s < 2; s += 1) {
    const parentKind = kinds[(singleCount + s) % kinds.length]!;
    const ws = workspaces[s % workspaces.length]!;
    const parentName = nextName(parentKind);
    cards.push(makeTask(rng, parentName, parentKind, ws, TASK_TITLES[parentKind], null));
    const childCount = rng.int(2, 3);
    for (let c = 0; c < childCount; c += 1) {
      const childKind = kinds[(singleCount + s + c + 1) % kinds.length]!;
      cards.push(
        makeTask(
          rng,
          nextName(childKind),
          childKind,
          ws,
          `${TASK_TITLES[childKind]} (${c + 1})`,
          parentName,
        ),
      );
    }
  }

  // --- the Company Brain ----------------------------------------------------
  const memory = generateMemory(rng, workspaces);

  return { seed, epochMs: SIM_EPOCH_MS, workspaces, cards, memory };
}

function deterministicSha(rng: Prng): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 12; i += 1) {
    out += hex[rng.int(0, 15)];
  }
  return out;
}
