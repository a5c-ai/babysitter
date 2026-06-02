import { monotonicFactory } from 'ulid';

import type {
  AutomationExecutionRecord,
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
} from '@a5c-ai/agent-mux-comm';
import type {
  KanbanDecompositionKind,
  KanbanDecompositionStatus,
  KanbanIssue,
  KanbanIssueSource,
  KanbanPriority,
} from '@a5c-ai/agent-mux-comm/kanban';

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
  readonly executionSummary: AutomationRuleExecutionSummary;
  readonly recentExecutions: readonly AutomationExecutionRecord[];
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
  readonly executionCount: number;
  readonly failureCount: number;
  readonly failingCount: number;
}

export interface AutomationRuleExecutionSummary {
  readonly totalCount: number;
  readonly createdCount: number;
  readonly coalescedCount: number;
  readonly rejectedCount: number;
  readonly latestStatus?: AutomationExecutionRecord['status'];
  readonly lastTriggeredAt?: string;
  readonly lastFailureAt?: string;
  readonly isFailing: boolean;
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

export interface MaterializeAutomationEventResponse {
  readonly generatedAt: string;
  readonly rule: AutomationRuleRecord;
  readonly execution: AutomationExecutionRecord;
  readonly issue: KanbanIssue;
}

interface AutomationRuleServiceDeps extends KanbanStorageDeps {
  backlogQueryService: Pick<BacklogQueryService, 'getOverview' | 'createIssue'>;
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

function readOptionalMetadata(
  value: unknown,
  fieldName: string,
): Readonly<Record<string, unknown>> | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new AppError(`${fieldName} must be an object.`, 'BAD_REQUEST', 400);
  }
  return value;
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
      metadata: readOptionalMetadata(issueSource.metadata, 'template.issueSource.metadata'),
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
    metadata: readOptionalMetadata(value.metadata, 'template.metadata'),
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

interface MaterializedTriggerEvent {
  readonly id: string;
  readonly summary?: string;
  readonly sourceEvent?: string;
  readonly receivedAt?: string;
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

function readTriggerEvent(value: unknown): MaterializedTriggerEvent {
  if (!isRecord(value)) {
    throw new AppError('triggerEvent is required.', 'BAD_REQUEST', 400);
  }

  return {
    id: readRequiredString(value.id, 'triggerEvent.id'),
    summary: readOptionalString(value.summary, 'triggerEvent.summary'),
    sourceEvent: readOptionalString(value.sourceEvent, 'triggerEvent.sourceEvent'),
    receivedAt: readOptionalString(value.receivedAt, 'triggerEvent.receivedAt'),
    payload: readOptionalMetadata(value.payload, 'triggerEvent.payload'),
    metadata: readOptionalMetadata(value.metadata, 'triggerEvent.metadata'),
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
  executionIndex: ReadonlyMap<string, readonly AutomationExecutionRecord[]>,
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

  let executionCount = 0;
  let failureCount = 0;
  let failingCount = 0;
  for (const rule of allRules) {
    const summary = summarizeExecutions(rule, executionIndex.get(rule.id) ?? []);
    executionCount += summary.totalCount;
    failureCount += summary.rejectedCount;
    if (summary.isFailing) {
      failingCount += 1;
    }
  }

  return {
    totalCount: allRules.length,
    visibleCount: visibleRules.length,
    stateCounts,
    triggerCounts,
    executionCount,
    failureCount,
    failingCount,
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

function compareExecutionDescending(
  left: AutomationExecutionRecord,
  right: AutomationExecutionRecord,
): number {
  return (
    Date.parse(right.triggeredAt) - Date.parse(left.triggeredAt) ||
    right.id.localeCompare(left.id)
  );
}

function buildExecutionIndex(
  executions: readonly AutomationExecutionRecord[] | undefined,
): ReadonlyMap<string, readonly AutomationExecutionRecord[]> {
  const index = new Map<string, AutomationExecutionRecord[]>();
  for (const execution of executions ?? []) {
    const records = index.get(execution.ruleId) ?? [];
    records.push(execution);
    index.set(execution.ruleId, records);
  }

  for (const records of index.values()) {
    records.sort(compareExecutionDescending);
  }

  return index;
}

function summarizeExecutions(
  rule: AutomationRule,
  executions: readonly AutomationExecutionRecord[],
): AutomationRuleExecutionSummary {
  const latestExecution = executions[0];
  const lastFailure = executions.find((execution) => execution.status === 'rejected');

  const createdCount = executions.filter((execution) => execution.status === 'created').length;
  const coalescedCount = executions.filter((execution) => execution.status === 'coalesced').length;
  const rejectedCount = executions.filter((execution) => execution.status === 'rejected').length;

  return {
    totalCount: executions.length,
    createdCount,
    coalescedCount,
    rejectedCount,
    latestStatus: latestExecution?.status,
    lastTriggeredAt: latestExecution?.triggeredAt,
    lastFailureAt: lastFailure?.triggeredAt,
    isFailing: rule.state === 'active' && latestExecution?.status === 'rejected',
  };
}

function buildExecutionRecord(input: {
  readonly id: string;
  readonly rule: AutomationRule;
  readonly status: AutomationExecutionRecord['status'];
  readonly triggeredAt: string;
  readonly triggeredBy: string;
  readonly reason?: string;
  readonly issue?: KanbanIssue;
  readonly inputs?: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly deliveryId?: string;
}): AutomationExecutionRecord {
  return {
    id: input.id,
    ruleId: input.rule.id,
    ruleName: input.rule.name,
    triggerType: input.rule.trigger.type,
    status: input.status,
    triggeredAt: input.triggeredAt,
    triggeredBy: input.triggeredBy,
    source: input.rule.source,
    projectId: input.rule.routing.issue.projectId,
    boardProjectId: input.rule.routing.board.boardProjectId,
    issueId: input.issue?.id,
    issueKey: input.issue?.key,
    issueSource: input.issue?.source,
    stateAtExecution: input.rule.state,
    reason: input.reason,
    deliveryId: input.deliveryId,
    inputs: input.inputs,
    metadata: input.metadata,
  };
}

function toRuleRecord(
  rule: AutomationRule,
  executions: readonly AutomationExecutionRecord[] = [],
): AutomationRuleRecord {
  return {
    ...rule,
    allowedActions: readAllowedActions(rule.state),
    isEnabled: rule.state === 'active',
    triggerType: rule.trigger.type,
    executionSummary: summarizeExecutions(rule, executions),
    recentExecutions: executions.slice(0, 5),
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

  private async assertMaterializationTargetExists(target: AutomationTarget): Promise<void> {
    try {
      await this.assertTargetExists(target);
    } catch (error) {
      if (error instanceof AppError && error.code === 'NOT_FOUND') {
        throw new AppError(
          `Automation routing failed: ${error.message}`,
          'AUTOMATION_ROUTING_FAILED',
          409,
        );
      }
      throw error;
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

  private async persistExecution(
    storage: KanbanStoragePayload,
    rule: AutomationRule,
    execution: AutomationExecutionRecord,
    triggeredAt: string,
    triggeredBy: string,
  ): Promise<void> {
    const audit = {
      ...rule.audit,
      lastTriggeredAt: triggeredAt,
      lastTriggeredBy: triggeredBy,
      updatedAt: this.deps.now(),
      updatedBy: triggeredBy,
    };

    await writeKanbanStorageFile(this.deps, {
      ...storage,
      automationRules: (storage.automationRules ?? []).map((candidate) =>
        candidate.id === rule.id
          ? {
              ...candidate,
              audit,
            }
          : candidate,
      ),
      automationExecutions: [...(storage.automationExecutions ?? []), execution],
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
    const executionIndex = buildExecutionIndex(storage.automationExecutions);
    const targetOptions = await this.listTargetOptions();

    return {
      generatedAt: this.deps.now(),
      rules: visibleRules.map((rule) => toRuleRecord(rule, executionIndex.get(rule.id) ?? [])),
      summary: summarizeRules(allRules, visibleRules, executionIndex),
      availableStates: AUTOMATION_RULE_STATES,
      availableTriggerTypes: AUTOMATION_TRIGGER_TYPES,
      targetOptions,
    };
  }

  async getRule(ruleId: string): Promise<AutomationRuleDetailResponse> {
    const storage = await this.readStorage();
    const rule = this.readExistingRule(storage.automationRules ?? [], ruleId);
    const executionIndex = buildExecutionIndex(storage.automationExecutions);
    return {
      generatedAt: this.deps.now(),
      rule: toRuleRecord(rule, executionIndex.get(rule.id) ?? []),
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

  async materializeEvent(
    ruleId: string,
    body: Record<string, unknown>,
  ): Promise<MaterializeAutomationEventResponse> {
    const storage = await this.readStorage();
    const existingRule = this.readExistingRule(storage.automationRules ?? [], ruleId);

    const triggeredAt =
      body.triggeredAt === undefined
        ? this.deps.now()
        : readRequiredString(body.triggeredAt, 'triggeredAt');
    const triggeredBy =
      body.triggeredBy === undefined
        ? 'automation'
        : readRequiredString(body.triggeredBy, 'triggeredBy');
    const triggerEvent = readTriggerEvent(body.triggerEvent);
    const executionMetadata = readOptionalMetadata(body.metadata, 'metadata');
    const executionId = `automation-execution-${createId().toLowerCase()}`;
    const triggerEventSource =
      triggerEvent.sourceEvent ??
      (existingRule.trigger.type === 'webhook' ? existingRule.trigger.sourceEvent : undefined);
    const baseExecutionMetadata = {
      ...(executionMetadata ?? {}),
      triggerEventId: triggerEvent.id,
      triggerEventSummary: triggerEvent.summary,
      triggerEventSource,
      triggerEventReceivedAt: triggerEvent.receivedAt,
      triggerEventMetadata: triggerEvent.metadata,
    };

    const rejectExecution = async (
      message: string,
      code: string,
      status = 409,
    ): Promise<never> => {
      const latestStorage = await this.readStorage();
      const latestRule = this.readExistingRule(latestStorage.automationRules ?? [], ruleId);
      const execution = buildExecutionRecord({
        id: executionId,
        rule: latestRule,
        status: 'rejected',
        triggeredAt,
        triggeredBy,
        reason: message,
        inputs: triggerEvent.payload,
        metadata: baseExecutionMetadata,
        deliveryId: triggerEvent.id,
      });

      await this.persistExecution(latestStorage, latestRule, execution, triggeredAt, triggeredBy);
      throw new AppError(message, code, status);
    };

    if (existingRule.state !== 'active') {
      await rejectExecution(
        `Automation rule ${ruleId} is ${existingRule.state} and cannot materialize work.`,
        'AUTOMATION_RULE_NOT_ACTIVE',
      );
    }

    try {
      assertRoutingMatchesTarget(existingRule.target, existingRule.routing);
      await this.assertMaterializationTargetExists(existingRule.target);
    } catch (error) {
      if (error instanceof AppError) {
        await rejectExecution(error.message, error.code, error.status);
      }
      throw error;
    }

    const source: KanbanIssueSource = {
      kind: existingRule.template.issueSource?.kind ?? 'run-derived',
      path: existingRule.template.issueSource?.path,
      externalId: existingRule.template.issueSource?.externalId ?? triggerEvent.id,
      metadata: {
        ...(existingRule.template.issueSource?.metadata ?? {}),
        automationRuleId: existingRule.id,
        automationRuleName: existingRule.name,
        automationExecutionId: executionId,
        triggerType: existingRule.trigger.type,
        triggerEventId: triggerEvent.id,
        triggerEventSummary: triggerEvent.summary,
        triggerEventSource,
        triggerEventReceivedAt: triggerEvent.receivedAt,
        triggeredAt,
        triggeredBy,
        routeProjectId: existingRule.routing.issue.projectId,
        routeBoardProjectId: existingRule.routing.board.boardProjectId,
      },
    };

    let issue: KanbanIssue;
    try {
      ({ issue } = await this.deps.backlogQueryService.createIssue({
        projectId: existingRule.routing.issue.projectId,
        title: existingRule.template.title,
        summary: existingRule.template.summary,
        description: existingRule.template.description,
        status: existingRule.template.status ?? 'backlog',
        priority: existingRule.template.priority,
        labelIds: existingRule.template.labelIds,
        assigneeIds: existingRule.template.assigneeIds,
        acceptanceCriteria: existingRule.template.acceptanceCriteria?.map((title: string) => ({
          title,
        })),
        decomposition: existingRule.template.decomposition,
        source,
        metadata: existingRule.template.metadata,
      }));
    } catch (error) {
      if (error instanceof AppError) {
        const reason =
          error.code === 'NOT_FOUND'
            ? `Automation routing failed: ${error.message}`
            : error.message;
        await rejectExecution(
          reason,
          error.code === 'NOT_FOUND' ? 'AUTOMATION_ROUTING_FAILED' : error.code,
          error.code === 'NOT_FOUND' ? 409 : error.status,
        );
      }
      throw error;
    }

    const refreshedStorage = await this.readStorage();
    const latestRule = this.readExistingRule(refreshedStorage.automationRules ?? [], ruleId);
    const execution = buildExecutionRecord({
      id: executionId,
      rule: latestRule,
      status: 'created',
      triggeredAt,
      triggeredBy,
      issue,
      inputs: triggerEvent.payload,
      metadata: baseExecutionMetadata,
      deliveryId: triggerEvent.id,
    });
    const audit = {
      ...latestRule.audit,
      lastTriggeredAt: triggeredAt,
      lastTriggeredBy: triggeredBy,
      updatedAt: this.deps.now(),
      updatedBy: triggeredBy,
    };
    const nextRules = (refreshedStorage.automationRules ?? []).map((candidate) =>
      candidate.id === latestRule.id
        ? {
            ...candidate,
            audit,
          }
        : candidate,
    );

    await writeKanbanStorageFile(this.deps, {
      ...refreshedStorage,
      automationRules: nextRules,
      automationExecutions: [...(refreshedStorage.automationExecutions ?? []), execution],
    });
    const executionIndex = buildExecutionIndex([
      ...(refreshedStorage.automationExecutions ?? []),
      execution,
    ]);

    return {
      generatedAt: this.deps.now(),
      rule: toRuleRecord({
        ...latestRule,
        audit,
      }, executionIndex.get(latestRule.id) ?? [execution]),
      execution,
      issue,
    };
  }
}
