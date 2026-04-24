import { monotonicFactory } from 'ulid';

import type {
  AutomationDerivedBoardRoute,
  AutomationIssueCreateRoute,
  AutomationRule,
  AutomationRuleLifecycleState,
  AutomationRuleSourceMetadata,
  AutomationRouting,
  AutomationTarget,
  AutomationTaskTemplate,
  TimerAutomationTrigger,
  WebhookAutomationTrigger,
} from '../../../../agent-mux/core/src/automation.js';
import type {
  KanbanDecompositionKind,
  KanbanDecompositionStatus,
  KanbanIssueSource,
  KanbanPriority,
} from '../../../../agent-mux/core/src/kanban.js';

import { AppError } from '../error-handler';
import { BacklogQueryService } from './backlog-query-service';
import {
  KANBAN_BACKLOG_FILE_PATH,
  defaultKanbanStorageDeps,
  readKanbanStorageFile,
  writeKanbanStorageFile,
  type KanbanStorageDeps,
  type KanbanStoragePayload,
} from './kanban-storage';

const createId = monotonicFactory();

export const AUTOMATION_RULE_STATES = [
  'draft',
  'active',
  'paused',
  'disabled',
  'archived',
] as const satisfies readonly AutomationRuleLifecycleState[];

export const AUTOMATION_TRIGGER_TYPES = ['timer', 'webhook'] as const;

const MUTABLE_RULE_STATES = new Set<AutomationRuleLifecycleState>([
  'draft',
  'active',
  'paused',
  'disabled',
]);
const AUTOMATION_SOURCE_KINDS = new Set(['manual', 'config-file', 'api', 'external-system']);
const KANBAN_PRIORITIES = new Set<KanbanPriority>(['critical', 'high', 'medium', 'low']);
const TEMPLATE_STATUSES = new Set(['backlog', 'ready']);
const ISSUE_SOURCE_KINDS = new Set<KanbanIssueSource['kind']>(['seed', 'file', 'run-derived']);
const DECOMPOSITION_KINDS = new Set<KanbanDecompositionKind>([
  'research',
  'implementation',
  'validation',
  'coordination',
]);
const DECOMPOSITION_STATUSES = new Set<KanbanDecompositionStatus>(['todo', 'ready', 'done']);

export type AutomationRuleAction = 'enable' | 'pause' | 'resume' | 'disable' | 'delete';
export type AutomationTriggerType = (typeof AUTOMATION_TRIGGER_TYPES)[number];

export interface AutomationRuleQuery {
  readonly state?: readonly AutomationRuleLifecycleState[];
  readonly triggerType?: readonly AutomationTriggerType[];
  readonly projectId?: string;
  readonly boardProjectId?: string;
  readonly search?: string;
  readonly includeArchived?: boolean;
}

export type AutomationRuleRecord = AutomationRule & {
  readonly allowedActions: readonly AutomationRuleAction[];
  readonly isEnabled: boolean;
  readonly triggerType: AutomationTriggerType;
};

export interface AutomationRuleTargetOption {
  readonly projectId: string;
  readonly boardProjectId: string;
  readonly key: string;
  readonly name: string;
  readonly linkedRunProjectName?: string;
}

export interface AutomationRuleCollectionSummary {
  readonly totalCount: number;
  readonly visibleCount: number;
  readonly stateCounts: Readonly<Record<AutomationRuleLifecycleState, number>>;
  readonly triggerCounts: Readonly<Record<AutomationTriggerType, number>>;
}

export interface AutomationRuleCollectionResponse {
  readonly generatedAt: string;
  readonly rules: readonly AutomationRuleRecord[];
  readonly summary: AutomationRuleCollectionSummary;
  readonly availableStates: readonly AutomationRuleLifecycleState[];
  readonly availableTriggerTypes: readonly AutomationTriggerType[];
  readonly targetOptions: readonly AutomationRuleTargetOption[];
}

export interface AutomationRuleDetailResponse {
  readonly generatedAt: string;
  readonly rule: AutomationRuleRecord;
  readonly targetOptions: readonly AutomationRuleTargetOption[];
}

export interface DeleteAutomationRuleResponse {
  readonly deletedRuleId: string;
  readonly deletedAt: string;
}

interface AutomationRuleServiceDeps extends KanbanStorageDeps {
  backlogQueryService: Pick<BacklogQueryService, 'getOverview'>;
  now: () => string;
}

const defaultDeps: AutomationRuleServiceDeps = {
  ...defaultKanbanStorageDeps,
  backlogQueryService: new BacklogQueryService(),
  backlogFilePath: KANBAN_BACKLOG_FILE_PATH,
  now: () => new Date().toISOString(),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${fieldName} is required.`, 'BAD_REQUEST', 400);
  }
  return value.trim();
}

function readOptionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${fieldName} must be a non-empty string.`, 'BAD_REQUEST', 400);
  }
  return value.trim();
}

function readOptionalStringArray(value: unknown, fieldName: string): readonly string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new AppError(`${fieldName} must be an array of strings.`, 'BAD_REQUEST', 400);
  }
  return value.map((entry, index) => readRequiredString(entry, `${fieldName}[${index}]`));
}

function readState(value: unknown, fieldName: string): AutomationRuleLifecycleState {
  const state = readRequiredString(value, fieldName);
  if (!isAutomationRuleState(state)) {
    throw new AppError(`${fieldName} is invalid.`, 'BAD_REQUEST', 400);
  }
  return state;
}

export function isAutomationRuleState(value: string): value is AutomationRuleLifecycleState {
  return AUTOMATION_RULE_STATES.includes(value as AutomationRuleLifecycleState);
}

export function isAutomationTriggerType(value: string): value is AutomationTriggerType {
  return AUTOMATION_TRIGGER_TYPES.includes(value as AutomationTriggerType);
}

function readTrigger(value: unknown): TimerAutomationTrigger | WebhookAutomationTrigger {
  if (!isRecord(value)) {
    throw new AppError('trigger is required.', 'BAD_REQUEST', 400);
  }

  if (value.type === 'timer') {
    return {
      type: 'timer',
      cron: readRequiredString(value.cron, 'trigger.cron'),
      timezone: readOptionalString(value.timezone, 'trigger.timezone'),
    };
  }

  if (value.type === 'webhook') {
    if (typeof value.port !== 'number' || !Number.isInteger(value.port) || value.port <= 0) {
      throw new AppError('trigger.port must be a positive integer.', 'BAD_REQUEST', 400);
    }

    let auth: WebhookAutomationTrigger['auth'];
    if (value.auth !== undefined) {
      if (!isRecord(value.auth) || typeof value.auth.type !== 'string') {
        throw new AppError('trigger.auth is invalid.', 'BAD_REQUEST', 400);
      }
      if (value.auth.type === 'none') {
        auth = { type: 'none' };
      } else if (value.auth.type === 'bearer') {
        auth = { type: 'bearer', token: readRequiredString(value.auth.token, 'trigger.auth.token') };
      } else {
        throw new AppError('trigger.auth.type is invalid.', 'BAD_REQUEST', 400);
      }
    }

    if (value.method !== undefined && value.method !== 'POST') {
      throw new AppError('trigger.method must be POST when provided.', 'BAD_REQUEST', 400);
    }

    return {
      type: 'webhook',
      port: value.port,
      path: readOptionalString(value.path, 'trigger.path'),
      method: value.method as 'POST' | undefined,
      auth,
      sourceEvent: readOptionalString(value.sourceEvent, 'trigger.sourceEvent'),
    };
  }

  throw new AppError('trigger.type must be timer or webhook.', 'BAD_REQUEST', 400);
}

function readTarget(value: unknown): AutomationTarget {
  if (!isRecord(value)) {
    throw new AppError('target is required.', 'BAD_REQUEST', 400);
  }
  return {
    projectId: readRequiredString(value.projectId, 'target.projectId'),
    boardProjectId: readRequiredString(value.boardProjectId, 'target.boardProjectId'),
  };
}

function readIssueRoute(value: unknown): AutomationIssueCreateRoute {
  if (!isRecord(value) || value.action !== 'canonical-issue-create') {
    throw new AppError('routing.issue.action must be canonical-issue-create.', 'BAD_REQUEST', 400);
  }

  return {
    action: 'canonical-issue-create',
    projectId: readRequiredString(value.projectId, 'routing.issue.projectId'),
  };
}

function readBoardRoute(value: unknown): AutomationDerivedBoardRoute {
  if (!isRecord(value) || value.action !== 'shared-board-derive') {
    throw new AppError('routing.board.action must be shared-board-derive.', 'BAD_REQUEST', 400);
  }

  return {
    action: 'shared-board-derive',
    boardProjectId: readRequiredString(value.boardProjectId, 'routing.board.boardProjectId'),
  };
}

function readRouting(value: unknown): AutomationRouting {
  if (!isRecord(value)) {
    throw new AppError('routing is required.', 'BAD_REQUEST', 400);
  }
  if (value.mutateBoardDirectly !== false) {
    throw new AppError('routing.mutateBoardDirectly must be false.', 'BAD_REQUEST', 400);
  }

  return {
    issue: readIssueRoute(value.issue),
    board: readBoardRoute(value.board),
    mutateBoardDirectly: false,
  };
}

function readTemplate(value: unknown): AutomationTaskTemplate {
  if (!isRecord(value)) {
    throw new AppError('template is required.', 'BAD_REQUEST', 400);
  }

  const status =
    value.status === undefined ? undefined : readRequiredString(value.status, 'template.status');
  if (status !== undefined && !TEMPLATE_STATUSES.has(status)) {
    throw new AppError('template.status must be backlog or ready.', 'BAD_REQUEST', 400);
  }

  const priority =
    value.priority === undefined ? undefined : readRequiredString(value.priority, 'template.priority');
  if (priority !== undefined && !KANBAN_PRIORITIES.has(priority as KanbanPriority)) {
    throw new AppError('template.priority is invalid.', 'BAD_REQUEST', 400);
  }

  const issueSource = value.issueSource;
  let normalizedIssueSource: KanbanIssueSource | undefined;
  if (issueSource !== undefined) {
    if (!isRecord(issueSource)) {
      throw new AppError('template.issueSource is invalid.', 'BAD_REQUEST', 400);
    }
    const kind = readRequiredString(issueSource.kind, 'template.issueSource.kind');
    if (!ISSUE_SOURCE_KINDS.has(kind as KanbanIssueSource['kind'])) {
      throw new AppError('template.issueSource.kind is invalid.', 'BAD_REQUEST', 400);
    }
    normalizedIssueSource = {
      kind: kind as KanbanIssueSource['kind'],
      path: readOptionalString(issueSource.path, 'template.issueSource.path'),
      externalId: readOptionalString(issueSource.externalId, 'template.issueSource.externalId'),
    };
  }

  let decomposition: AutomationTaskTemplate['decomposition'];
  if (value.decomposition !== undefined) {
    if (!Array.isArray(value.decomposition)) {
      throw new AppError('template.decomposition must be an array.', 'BAD_REQUEST', 400);
    }
    decomposition = value.decomposition.map((entry, index) => {
      if (!isRecord(entry)) {
        throw new AppError(`template.decomposition[${index}] is invalid.`, 'BAD_REQUEST', 400);
      }
      const kind = readRequiredString(entry.kind, `template.decomposition[${index}].kind`);
      const itemStatus = readRequiredString(
        entry.status,
        `template.decomposition[${index}].status`,
      );

      if (!DECOMPOSITION_KINDS.has(kind as KanbanDecompositionKind)) {
        throw new AppError(`template.decomposition[${index}].kind is invalid.`, 'BAD_REQUEST', 400);
      }
      if (!DECOMPOSITION_STATUSES.has(itemStatus as KanbanDecompositionStatus)) {
        throw new AppError(
          `template.decomposition[${index}].status is invalid.`,
          'BAD_REQUEST',
          400,
        );
      }

      return {
        title: readRequiredString(entry.title, `template.decomposition[${index}].title`),
        kind: kind as KanbanDecompositionKind,
        status: itemStatus as KanbanDecompositionStatus,
      };
    });
  }

  const metadata = value.metadata;
  if (metadata !== undefined && !isRecord(metadata)) {
    throw new AppError('template.metadata must be an object.', 'BAD_REQUEST', 400);
  }

  return {
    title: readRequiredString(value.title, 'template.title'),
    summary: readOptionalString(value.summary, 'template.summary'),
    description: readOptionalString(value.description, 'template.description'),
    status: status as 'backlog' | 'ready' | undefined,
    priority: priority as KanbanPriority | undefined,
    labelIds: readOptionalStringArray(value.labelIds, 'template.labelIds'),
    assigneeIds: readOptionalStringArray(value.assigneeIds, 'template.assigneeIds'),
    acceptanceCriteria: readOptionalStringArray(
      value.acceptanceCriteria,
      'template.acceptanceCriteria',
    ),
    decomposition,
    issueSource: normalizedIssueSource,
    metadata: metadata as Readonly<Record<string, unknown>> | undefined,
  };
}

function readSource(
  value: unknown,
  fallbackKind: AutomationRuleSourceMetadata['kind'] = 'api',
): AutomationRuleSourceMetadata {
  if (value === undefined) {
    return { kind: fallbackKind };
  }
  if (!isRecord(value)) {
    throw new AppError('source must be an object.', 'BAD_REQUEST', 400);
  }

  const kind = readRequiredString(value.kind, 'source.kind');
  if (!AUTOMATION_SOURCE_KINDS.has(kind)) {
    throw new AppError('source.kind is invalid.', 'BAD_REQUEST', 400);
  }

  const metadata = value.metadata;
  if (metadata !== undefined && !isRecord(metadata)) {
    throw new AppError('source.metadata must be an object.', 'BAD_REQUEST', 400);
  }

  return {
    kind: kind as AutomationRuleSourceMetadata['kind'],
    path: readOptionalString(value.path, 'source.path'),
    provider: readOptionalString(value.provider, 'source.provider'),
    externalId: readOptionalString(value.externalId, 'source.externalId'),
    metadata: metadata as Readonly<Record<string, unknown>> | undefined,
  };
}

function buildAutomationRule(input: {
  readonly id: string;
  readonly name: string;
  readonly state: AutomationRuleLifecycleState;
  readonly trigger: TimerAutomationTrigger | WebhookAutomationTrigger;
  readonly target: AutomationTarget;
  readonly template: AutomationTaskTemplate;
  readonly routing: AutomationRouting;
  readonly source: AutomationRuleSourceMetadata;
  readonly audit: AutomationRule['audit'];
}): AutomationRule {
  if (input.trigger.type === 'timer') {
    return {
      ...input,
      trigger: input.trigger,
    };
  }

  return {
    ...input,
    trigger: input.trigger,
  };
}

function readAllowedActions(state: AutomationRuleLifecycleState): readonly AutomationRuleAction[] {
  switch (state) {
    case 'draft':
      return ['enable', 'disable', 'delete'];
    case 'active':
      return ['pause', 'disable', 'delete'];
    case 'paused':
      return ['resume', 'disable', 'delete'];
    case 'disabled':
      return ['enable', 'delete'];
    case 'archived':
      return ['delete'];
  }

  return ['delete'];
}

function summarizeRules(
  allRules: readonly AutomationRule[],
  visibleRules: readonly AutomationRule[],
): AutomationRuleCollectionSummary {
  const stateCounts: Record<AutomationRuleLifecycleState, number> = {
    draft: 0,
    active: 0,
    paused: 0,
    disabled: 0,
    archived: 0,
  };
  const triggerCounts: Record<AutomationTriggerType, number> = {
    timer: 0,
    webhook: 0,
  };

  for (const rule of allRules) {
    stateCounts[rule.state] += 1;
    triggerCounts[rule.trigger.type] += 1;
  }

  return {
    totalCount: allRules.length,
    visibleCount: visibleRules.length,
    stateCounts,
    triggerCounts,
  };
}

function ruleMatchesQuery(rule: AutomationRule, query: AutomationRuleQuery): boolean {
  if (!query.includeArchived && rule.state === 'archived') {
    return false;
  }
  if (query.state?.length && !query.state.includes(rule.state)) {
    return false;
  }
  if (query.triggerType?.length && !query.triggerType.includes(rule.trigger.type)) {
    return false;
  }
  if (query.projectId && rule.target.projectId !== query.projectId) {
    return false;
  }
  if (query.boardProjectId && rule.target.boardProjectId !== query.boardProjectId) {
    return false;
  }
  if (query.search) {
    const haystack = [
      rule.id,
      rule.name,
      rule.template.title,
      rule.template.summary,
      rule.template.description,
      rule.source.provider,
      rule.source.externalId,
    ]
      .filter((value): value is string => Boolean(value))
      .join('\n')
      .toLowerCase();
    if (!haystack.includes(query.search.toLowerCase())) {
      return false;
    }
  }
  return true;
}

function toRuleRecord(rule: AutomationRule): AutomationRuleRecord {
  return {
    ...rule,
    allowedActions: readAllowedActions(rule.state),
    isEnabled: rule.state === 'active',
    triggerType: rule.trigger.type,
  };
}

function toTargetOption(project: Awaited<ReturnType<BacklogQueryService['getOverview']>>['snapshot']['projects'][number]): AutomationRuleTargetOption {
  return {
    projectId: project.id,
    boardProjectId: project.id,
    key: project.key,
    name: project.name,
    linkedRunProjectName: project.linkedRunProjectName,
  };
}

function assertMutableState(rule: AutomationRule): void {
  if (!MUTABLE_RULE_STATES.has(rule.state)) {
    throw new AppError(
      `Rule ${rule.id} is ${rule.state} and can no longer be modified.`,
      'AUTOMATION_RULE_IMMUTABLE',
      409,
    );
  }
}

function assertRoutingMatchesTarget(target: AutomationTarget, routing: AutomationRouting): void {
  if (routing.issue.projectId !== target.projectId) {
    throw new AppError(
      'routing.issue.projectId must match target.projectId.',
      'BAD_REQUEST',
      400,
    );
  }
  if (routing.board.boardProjectId !== target.boardProjectId) {
    throw new AppError(
      'routing.board.boardProjectId must match target.boardProjectId.',
      'BAD_REQUEST',
      400,
    );
  }
}

function validateUpdateBody(body: Record<string, unknown>): void {
  if ('id' in body || 'state' in body || 'audit' in body) {
    throw new AppError(
      'id, state, and audit cannot be updated directly. Use lifecycle endpoints for state changes.',
      'BAD_REQUEST',
      400,
    );
  }
}

export class AutomationRuleService {
  private readonly deps: AutomationRuleServiceDeps;

  constructor(overrides: Partial<AutomationRuleServiceDeps> = {}) {
    this.deps = { ...defaultDeps, ...overrides };
  }

  private async readStorage(): Promise<KanbanStoragePayload> {
    return (await readKanbanStorageFile(this.deps)) ?? {};
  }

  private async listTargetOptions(): Promise<readonly AutomationRuleTargetOption[]> {
    const overview = await this.deps.backlogQueryService.getOverview();
    return overview.snapshot.projects.map(toTargetOption);
  }

  private async assertTargetExists(target: AutomationTarget): Promise<void> {
    const targets = await this.listTargetOptions();
    const projectExists = targets.some((candidate) => candidate.projectId === target.projectId);
    if (!projectExists) {
      throw new AppError(`Project ${target.projectId} not found.`, 'NOT_FOUND', 404);
    }

    const boardExists = targets.some(
      (candidate) => candidate.boardProjectId === target.boardProjectId,
    );
    if (!boardExists) {
      throw new AppError(`Board project ${target.boardProjectId} not found.`, 'NOT_FOUND', 404);
    }
  }

  private async persistRules(
    storage: KanbanStoragePayload,
    rules: readonly AutomationRule[],
  ): Promise<void> {
    await writeKanbanStorageFile(this.deps, {
      ...storage,
      automationRules: rules,
    });
  }

  private readExistingRule(
    rules: readonly AutomationRule[],
    ruleId: string,
  ): AutomationRule {
    const rule = rules.find((candidate) => candidate.id === ruleId);
    if (!rule) {
      throw new AppError(`Automation rule ${ruleId} not found.`, 'NOT_FOUND', 404);
    }
    return rule;
  }

  async listRules(query: AutomationRuleQuery = {}): Promise<AutomationRuleCollectionResponse> {
    const storage = await this.readStorage();
    const allRules = [...(storage.automationRules ?? [])];
    const visibleRules = allRules.filter((rule) => ruleMatchesQuery(rule, query));
    const targetOptions = await this.listTargetOptions();

    return {
      generatedAt: this.deps.now(),
      rules: visibleRules.map(toRuleRecord),
      summary: summarizeRules(allRules, visibleRules),
      availableStates: AUTOMATION_RULE_STATES,
      availableTriggerTypes: AUTOMATION_TRIGGER_TYPES,
      targetOptions,
    };
  }

  async getRule(ruleId: string): Promise<AutomationRuleDetailResponse> {
    const storage = await this.readStorage();
    const rule = this.readExistingRule(storage.automationRules ?? [], ruleId);
    return {
      generatedAt: this.deps.now(),
      rule: toRuleRecord(rule),
      targetOptions: await this.listTargetOptions(),
    };
  }

  async createRule(body: Record<string, unknown>): Promise<AutomationRuleDetailResponse> {
    const now = this.deps.now();
    const state = body.state === undefined ? 'draft' : readState(body.state, 'state');
    const trigger = readTrigger(body.trigger);
    const target = readTarget(body.target);
    const routing = readRouting(body.routing);
    assertRoutingMatchesTarget(target, routing);
    await this.assertTargetExists(target);

    const rule = buildAutomationRule({
      id: `automation-${createId().toLowerCase()}`,
      name: readRequiredString(body.name, 'name'),
      state,
      trigger,
      target,
      template: readTemplate(body.template),
      routing,
      source: readSource(body.source),
      audit: {
        createdAt: now,
        createdBy: readOptionalString(body.createdBy, 'createdBy'),
      },
    });

    const storage = await this.readStorage();
    const rules = [...(storage.automationRules ?? []), rule];
    await this.persistRules(storage, rules);
    return this.getRule(rule.id);
  }

  async updateRule(
    ruleId: string,
    body: Record<string, unknown>,
  ): Promise<AutomationRuleDetailResponse> {
    validateUpdateBody(body);

    const storage = await this.readStorage();
    const existingRule = this.readExistingRule(storage.automationRules ?? [], ruleId);
    assertMutableState(existingRule);

    const nextTarget = body.target === undefined ? existingRule.target : readTarget(body.target);
    const nextRouting = body.routing === undefined ? existingRule.routing : readRouting(body.routing);
    assertRoutingMatchesTarget(nextTarget, nextRouting);
    await this.assertTargetExists(nextTarget);

    const nextRule = buildAutomationRule({
      ...existingRule,
      name:
        body.name === undefined ? existingRule.name : readRequiredString(body.name, 'name'),
      trigger: body.trigger === undefined ? existingRule.trigger : readTrigger(body.trigger),
      target: nextTarget,
      template: body.template === undefined ? existingRule.template : readTemplate(body.template),
      routing: nextRouting,
      source: body.source === undefined ? existingRule.source : readSource(body.source, existingRule.source.kind),
      audit: {
        ...existingRule.audit,
        updatedAt: this.deps.now(),
        updatedBy: readOptionalString(body.updatedBy, 'updatedBy'),
      },
    });

    const rules = (storage.automationRules ?? []).map((candidate) =>
      candidate.id === ruleId ? nextRule : candidate,
    );
    await this.persistRules(storage, rules);
    return this.getRule(ruleId);
  }

  async transitionRule(
    ruleId: string,
    action: Exclude<AutomationRuleAction, 'delete'>,
    updatedBy?: string,
  ): Promise<AutomationRuleDetailResponse> {
    const storage = await this.readStorage();
    const existingRule = this.readExistingRule(storage.automationRules ?? [], ruleId);

    const nextState = (() => {
      switch (action) {
        case 'enable':
          if (existingRule.state === 'draft' || existingRule.state === 'disabled') {
            return 'active' as const;
          }
          break;
        case 'pause':
          if (existingRule.state === 'active') {
            return 'paused' as const;
          }
          break;
        case 'resume':
          if (existingRule.state === 'paused') {
            return 'active' as const;
          }
          break;
        case 'disable':
          if (existingRule.state === 'draft' || existingRule.state === 'active' || existingRule.state === 'paused') {
            return 'disabled' as const;
          }
          break;
      }
      throw new AppError(
        `Cannot ${action} a rule in ${existingRule.state} state.`,
        'AUTOMATION_RULE_INVALID_TRANSITION',
        409,
      );
    })();

    const nextRule: AutomationRule = {
      ...existingRule,
      state: nextState,
      audit: {
        ...existingRule.audit,
        updatedAt: this.deps.now(),
        updatedBy,
      },
    };

    const rules = (storage.automationRules ?? []).map((candidate) =>
      candidate.id === ruleId ? nextRule : candidate,
    );
    await this.persistRules(storage, rules);
    return this.getRule(ruleId);
  }

  async deleteRule(ruleId: string): Promise<DeleteAutomationRuleResponse> {
    const storage = await this.readStorage();
    this.readExistingRule(storage.automationRules ?? [], ruleId);

    const nextRules = (storage.automationRules ?? []).filter((candidate) => candidate.id !== ruleId);
    await this.persistRules(storage, nextRules);

    return {
      deletedRuleId: ruleId,
      deletedAt: this.deps.now(),
    };
  }
}
