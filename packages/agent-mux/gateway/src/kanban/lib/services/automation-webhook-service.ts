import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

import type {
  AutomationExecutionRecord,
  AutomationExecutionStatus,
  AutomationRule,
  WebhookAutomationRule,
} from "@a5c-ai/agent-mux-comm/automation";
import type {
  KanbanAcceptanceCriterion,
  KanbanAssignee,
  KanbanDecompositionItem,
  KanbanIssueSource,
  KanbanLabel,
} from "@a5c-ai/agent-mux-comm/kanban";

import { AppError } from "../error-handler.js";
import {
  defaultKanbanStorageDeps,
  readKanbanStorageFile,
  writeKanbanStorageFile,
  type KanbanStorageDeps,
  type KanbanStoragePayload,
  type StoredKanbanIssue,
  type StoredKanbanProject,
} from "./kanban-storage.js";

const createId = () => randomUUID();

type WebhookHeaders = Pick<Headers, "get">;

export type AutomationWebhookDeliveryOutcome = AutomationExecutionStatus;

export interface AutomationWebhookDeliveryInput {
  readonly ruleId: string;
  readonly requestPath: string;
  readonly requestMethod: string;
  readonly headers: WebhookHeaders;
  readonly rawBody: string;
}

export interface AutomationWebhookDeliveryResponse {
  readonly deliveredAt: string;
  readonly outcome: AutomationWebhookDeliveryOutcome;
  readonly code: string;
  readonly reason: string;
  readonly rule: {
    readonly id: string;
    readonly name: string;
    readonly state: AutomationRule["state"];
  };
  readonly execution: AutomationExecutionRecord;
  readonly issue?: {
    readonly id: string;
    readonly key: string;
    readonly title: string;
    readonly status: StoredKanbanIssue["status"];
  };
}

interface AutomationWebhookServiceDeps extends KanbanStorageDeps {
  now: () => string;
}

const defaultDeps: AutomationWebhookServiceDeps = {
  ...defaultKanbanStorageDeps,
  now: () => new Date().toISOString(),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveExpectedPath(rule: WebhookAutomationRule): string {
  return rule.trigger.path ?? `/api/automations/webhooks/${rule.id}`;
}

function resolveDeliveryId(headers: WebhookHeaders, payload: unknown): string | undefined {
  const headerValue =
    headers.get("idempotency-key") ??
    headers.get("x-a5c-delivery-id") ??
    headers.get("x-github-delivery") ??
    headers.get("x-gitlab-event-uuid");
  if (headerValue?.trim()) {
    return headerValue.trim();
  }

  if (isRecord(payload)) {
    const bodyValue = payload.deliveryId ?? payload.idempotencyKey ?? payload.eventId;
    if (typeof bodyValue === "string" && bodyValue.trim()) {
      return bodyValue.trim();
    }
  }

  return undefined;
}

function resolveEventName(headers: WebhookHeaders, payload: unknown): string | undefined {
  const headerValue =
    headers.get("x-a5c-event") ??
    headers.get("x-github-event") ??
    headers.get("x-gitlab-event") ??
    headers.get("x-event-name") ??
    headers.get("x-event-key");
  if (headerValue?.trim()) {
    return headerValue.trim();
  }

  if (isRecord(payload) && typeof payload.event === "string" && payload.event.trim()) {
    return payload.event.trim();
  }

  return undefined;
}

function resolveTriggeredBy(rule: AutomationRule, headers: WebhookHeaders): string {
  const userAgent = headers.get("user-agent")?.trim();
  if (userAgent) {
    return `webhook:${userAgent}`;
  }

  if (rule.source.provider?.trim()) {
    return `webhook:${rule.source.provider.trim()}`;
  }

  return `webhook:${rule.id}`;
}

function hashBody(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

function parseBearerToken(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function tokensEqual(expected: string, actual: string | undefined): boolean {
  if (!actual) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function buildExecutionId(): string {
  return `automation-exec-${createId().toLowerCase()}`;
}

function buildIssueId(project: StoredKanbanProject): string {
  return `${project.key}-AUTO-${createId()}`;
}

function buildIssueSource(rule: AutomationRule, deliveryId: string): KanbanIssueSource {
  return {
    kind: rule.template.issueSource?.kind ?? "run-derived",
    path: rule.template.issueSource?.path,
    externalId: `${rule.id}:${deliveryId}`,
  };
}

function mapTemplateLabels(
  project: StoredKanbanProject,
  issueId: string,
  labelIds: readonly string[] | undefined,
): readonly KanbanLabel[] {
  if (!labelIds?.length) {
    return [];
  }

  const labels = labelIds.map((labelId) =>
    project.labels.find((candidate) => candidate.id === labelId),
  );
  const missingLabelId = labels.findIndex((candidate) => !candidate);
  if (missingLabelId >= 0) {
    throw new AppError(
      `Automation issue ${issueId} references unknown label ${labelIds[missingLabelId]}.`,
      "AUTOMATION_RULE_INVALID_TEMPLATE",
      409,
    );
  }

  return labels as readonly KanbanLabel[];
}

function mapTemplateAssignees(
  project: StoredKanbanProject,
  issueId: string,
  assigneeIds: readonly string[] | undefined,
): readonly KanbanAssignee[] {
  if (!assigneeIds?.length) {
    return [];
  }

  const assignees = assigneeIds.map((assigneeId) =>
    project.assignees.find((candidate) => candidate.id === assigneeId),
  );
  const missingAssigneeId = assignees.findIndex((candidate) => !candidate);
  if (missingAssigneeId >= 0) {
    throw new AppError(
      `Automation issue ${issueId} references unknown assignee ${assigneeIds[missingAssigneeId]}.`,
      "AUTOMATION_RULE_INVALID_TEMPLATE",
      409,
    );
  }

  return assignees as readonly KanbanAssignee[];
}

function buildAcceptanceCriteria(
  issueId: string,
  items: readonly string[] | undefined,
): readonly KanbanAcceptanceCriterion[] {
  return (items ?? []).map((title, index) => ({
    id: `${issueId}-ac-${index + 1}`,
    title,
    satisfied: false,
  }));
}

function buildDecomposition(
  issueId: string,
  items: NonNullable<AutomationRule["template"]["decomposition"]>,
): readonly KanbanDecompositionItem[] {
  return items.map((item, index) => ({
    id: `${issueId}-decomp-${index + 1}`,
    title: item.title,
    kind: item.kind,
    status: item.status,
  }));
}

function buildExecutionRecord(input: {
  readonly id?: string;
  readonly rule: AutomationRule;
  readonly status: AutomationExecutionStatus;
  readonly triggeredAt: string;
  readonly triggeredBy: string;
  readonly reason: string;
  readonly deliveryId?: string;
  readonly payload: unknown;
  readonly requestPath: string;
  readonly requestMethod: string;
  readonly bodyHash: string;
  readonly eventName?: string;
  readonly issue?: StoredKanbanIssue;
  readonly duplicateOfExecutionId?: string;
}): AutomationExecutionRecord {
  return {
    id: input.id ?? buildExecutionId(),
    ruleId: input.rule.id,
    ruleName: input.rule.name,
    triggerType: input.rule.trigger.type,
    status: input.status,
    triggeredAt: input.triggeredAt,
    triggeredBy: input.triggeredBy,
    source: input.rule.source,
    projectId: input.rule.target.projectId,
    boardProjectId: input.rule.target.boardProjectId,
    issueId: input.issue?.id,
    issueKey: input.issue?.key,
    issueSource: input.issue?.source,
    stateAtExecution: input.rule.state,
    reason: input.reason,
    deliveryId: input.deliveryId,
    inputs: isRecord(input.payload) ? input.payload : undefined,
    metadata: {
      requestPath: input.requestPath,
      requestMethod: input.requestMethod,
      bodyHash: input.bodyHash,
      eventName: input.eventName,
      duplicateOfExecutionId: input.duplicateOfExecutionId,
    },
  };
}

function buildResponse(input: {
  readonly deliveredAt: string;
  readonly outcome: AutomationWebhookDeliveryOutcome;
  readonly code: string;
  readonly reason: string;
  readonly rule: AutomationRule;
  readonly execution: AutomationExecutionRecord;
  readonly issue?: StoredKanbanIssue;
}): AutomationWebhookDeliveryResponse {
  return {
    deliveredAt: input.deliveredAt,
    outcome: input.outcome,
    code: input.code,
    reason: input.reason,
    rule: {
      id: input.rule.id,
      name: input.rule.name,
      state: input.rule.state,
    },
    execution: input.execution,
    issue: input.issue
      ? {
          id: input.issue.id,
          key: input.issue.key,
          title: input.issue.title,
          status: input.issue.status,
        }
      : undefined,
  };
}

export class AutomationWebhookService {
  private readonly deps: AutomationWebhookServiceDeps;

  constructor(overrides: Partial<AutomationWebhookServiceDeps> = {}) {
    this.deps = { ...defaultDeps, ...overrides };
  }

  private async readStorage(): Promise<KanbanStoragePayload> {
    return (await readKanbanStorageFile(this.deps)) ?? {};
  }

  private async writeStorage(storage: KanbanStoragePayload): Promise<void> {
    await writeKanbanStorageFile(this.deps, storage);
  }

  private updateRuleAudit(
    rules: readonly AutomationRule[],
    ruleId: string,
    triggeredAt: string,
    triggeredBy: string,
  ): readonly AutomationRule[] {
    return rules.map((candidate) =>
      candidate.id === ruleId
        ? {
            ...candidate,
            audit: {
              ...candidate.audit,
              updatedAt: triggeredAt,
              lastTriggeredAt: triggeredAt,
              lastTriggeredBy: triggeredBy,
            },
          }
        : candidate,
    );
  }

  private appendExecution(
    executions: readonly AutomationExecutionRecord[] | undefined,
    execution: AutomationExecutionRecord,
  ): readonly AutomationExecutionRecord[] {
    return [...(executions ?? []), execution];
  }

  private findRule(storage: KanbanStoragePayload, ruleId: string): WebhookAutomationRule {
    const rule = storage.automationRules?.find((candidate) => candidate.id === ruleId);
    if (!rule) {
      throw new AppError(`Automation rule ${ruleId} not found.`, "NOT_FOUND", 404);
    }
    if (rule.trigger.type !== "webhook") {
      throw new AppError(
        `Automation rule ${ruleId} does not accept webhook deliveries.`,
        "AUTOMATION_RULE_INVALID_TRIGGER",
        409,
      );
    }
    return rule as WebhookAutomationRule;
  }

  private createAutomationIssue(input: {
    readonly project: StoredKanbanProject;
    readonly rule: AutomationRule;
    readonly deliveryId: string;
    readonly createdAt: string;
  }): StoredKanbanIssue {
    const issueId = buildIssueId(input.project);
    return {
      id: issueId,
      key: issueId,
      projectId: input.rule.routing.issue.projectId,
      title: input.rule.template.title,
      summary: input.rule.template.summary,
      description: input.rule.template.description,
      status: input.rule.template.status ?? "backlog",
      priority: input.rule.template.priority ?? "medium",
      labels: mapTemplateLabels(input.project, issueId, input.rule.template.labelIds),
      assignees: mapTemplateAssignees(input.project, issueId, input.rule.template.assigneeIds),
      dependencies: [],
      acceptanceCriteria: buildAcceptanceCriteria(
        issueId,
        input.rule.template.acceptanceCriteria,
      ),
      decomposition: buildDecomposition(
        issueId,
        input.rule.template.decomposition ?? [],
      ),
      childIssueIds: [],
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      source: buildIssueSource(input.rule, input.deliveryId),
    };
  }

  async deliver(input: AutomationWebhookDeliveryInput): Promise<AutomationWebhookDeliveryResponse> {
    const now = this.deps.now();
    const storage = await this.readStorage();
    const rule = this.findRule(storage, input.ruleId);
    const triggeredBy = resolveTriggeredBy(rule, input.headers);
    const expectedPath = resolveExpectedPath(rule);
    const requestPath = input.requestPath;
    const bodyHash = hashBody(input.rawBody);
    let payload: unknown = {};

    try {
      payload = input.rawBody.trim() ? JSON.parse(input.rawBody) : {};
    } catch {
      const execution = buildExecutionRecord({
        rule,
        status: "rejected",
        triggeredAt: now,
        triggeredBy,
        reason: "Delivery body must be valid JSON.",
        payload: {},
        requestPath,
        requestMethod: input.requestMethod,
        bodyHash,
      });
      await this.writeStorage({
        ...storage,
        automationRules: this.updateRuleAudit(storage.automationRules ?? [], rule.id, now, triggeredBy),
        automationExecutions: this.appendExecution(storage.automationExecutions, execution),
      });
      return buildResponse({
        deliveredAt: now,
        outcome: "rejected",
        code: "AUTOMATION_WEBHOOK_INVALID_JSON",
        reason: "Delivery body must be valid JSON.",
        rule,
        execution,
      });
    }

    const deliveryId = resolveDeliveryId(input.headers, payload);
    const eventName = resolveEventName(input.headers, payload);
    const reject = async (
      code: string,
      reason: string,
      status: AutomationExecutionStatus = "rejected",
      duplicateOfExecutionId?: string,
      issue?: StoredKanbanIssue,
    ): Promise<AutomationWebhookDeliveryResponse> => {
      const execution = buildExecutionRecord({
        rule,
        status,
        triggeredAt: now,
        triggeredBy,
        reason,
        deliveryId,
        payload,
        requestPath,
        requestMethod: input.requestMethod,
        bodyHash,
        eventName,
        duplicateOfExecutionId,
        issue,
      });

      await this.writeStorage({
        ...storage,
        automationRules: this.updateRuleAudit(storage.automationRules ?? [], rule.id, now, triggeredBy),
        automationExecutions: this.appendExecution(storage.automationExecutions, execution),
      });

      return buildResponse({
        deliveredAt: now,
        outcome: status,
        code,
        reason,
        rule,
        execution,
        issue,
      });
    };

    if (input.requestMethod.toUpperCase() !== "POST") {
      return reject(
        "AUTOMATION_WEBHOOK_METHOD_NOT_ALLOWED",
        `Webhook deliveries must use POST, received ${input.requestMethod}.`,
      );
    }

    if (requestPath !== expectedPath) {
      return reject(
        "AUTOMATION_WEBHOOK_PATH_MISMATCH",
        `Webhook delivery path ${requestPath} does not match rule path ${expectedPath}.`,
      );
    }

    if (rule.state !== "active") {
      return reject(
        "AUTOMATION_RULE_NOT_ACTIVE",
        `Automation rule ${rule.id} is ${rule.state} and cannot create work.`,
      );
    }

    if (!deliveryId) {
      return reject(
        "AUTOMATION_WEBHOOK_MISSING_IDEMPOTENCY_KEY",
        "Webhook deliveries must include an idempotency key or delivery identifier.",
      );
    }

    const existingExecution = storage.automationExecutions?.find(
      (candidate) => candidate.ruleId === rule.id && candidate.deliveryId === deliveryId,
    );
    if (existingExecution) {
      await this.writeStorage({
        ...storage,
        automationRules: this.updateRuleAudit(storage.automationRules ?? [], rule.id, now, triggeredBy),
      });
      return buildResponse({
        deliveredAt: now,
        outcome: "coalesced",
        code: "AUTOMATION_WEBHOOK_DUPLICATE_DELIVERY",
        reason: `Delivery ${deliveryId} was already processed.`,
        rule,
        execution: {
          ...existingExecution,
          status: "coalesced",
          reason: `Delivery ${deliveryId} was already processed.`,
          metadata: {
            ...existingExecution.metadata,
            duplicateOfExecutionId: existingExecution.id,
          },
        },
      });
    }

    if (!rule.trigger.auth || rule.trigger.auth.type !== "bearer") {
      return reject(
        "AUTOMATION_WEBHOOK_AUTH_NOT_CONFIGURED",
        `Automation rule ${rule.id} cannot accept webhook deliveries without bearer auth.`,
      );
    }

    const actualBearerToken = parseBearerToken(input.headers.get("authorization"));
    if (!tokensEqual(rule.trigger.auth.token, actualBearerToken)) {
      return reject(
        "AUTOMATION_WEBHOOK_UNAUTHORIZED",
        "Webhook bearer token did not match the automation rule.",
      );
    }

    if (rule.trigger.sourceEvent && eventName !== rule.trigger.sourceEvent) {
      return reject(
        "AUTOMATION_WEBHOOK_EVENT_MISMATCH",
        `Webhook event ${eventName ?? "unknown"} does not match required event ${rule.trigger.sourceEvent}.`,
      );
    }

    const project = storage.projects?.find(
      (candidate) => candidate.id === rule.routing.issue.projectId,
    );
    if (!project) {
      throw new AppError(`Project ${rule.routing.issue.projectId} not found.`, "NOT_FOUND", 404);
    }

    const sourceExternalId = `${rule.id}:${deliveryId}`;
    const duplicateIssue = storage.issues?.find(
      (candidate) =>
        candidate.projectId === rule.routing.issue.projectId &&
        candidate.source?.externalId === sourceExternalId,
    );
    if (duplicateIssue) {
      return reject(
        "AUTOMATION_WEBHOOK_DUPLICATE_ISSUE",
        `Delivery ${deliveryId} already produced issue ${duplicateIssue.key}.`,
        "coalesced",
        duplicateIssue.id,
        duplicateIssue,
      );
    }

    const issue = this.createAutomationIssue({
      project,
      rule,
      deliveryId,
      createdAt: now,
    });

    const nextProjects = (storage.projects ?? []).map((candidate) =>
      candidate.id === project.id
        ? {
            ...candidate,
            issueIds: [...candidate.issueIds, issue.id],
          }
        : candidate,
    );
    const execution = buildExecutionRecord({
      rule,
      status: "created",
      triggeredAt: now,
      triggeredBy,
      reason: `Created issue ${issue.key} from webhook delivery ${deliveryId}.`,
      deliveryId,
      payload,
      requestPath,
      requestMethod: input.requestMethod,
      bodyHash,
      eventName,
      issue,
    });

    await this.writeStorage({
      ...storage,
      projects: nextProjects,
      issues: [...(storage.issues ?? []), issue],
      automationRules: this.updateRuleAudit(storage.automationRules ?? [], rule.id, now, triggeredBy),
      automationExecutions: this.appendExecution(storage.automationExecutions, execution),
    });

    return buildResponse({
      deliveredAt: now,
      outcome: "created",
      code: "AUTOMATION_WEBHOOK_CREATED",
      reason: `Created issue ${issue.key} from webhook delivery ${deliveryId}.`,
      rule,
      execution,
      issue,
    });
  }
}
