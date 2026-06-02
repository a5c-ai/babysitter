/**
 * Shared automation-rule execution path for daemon timer and webhook triggers.
 */

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type {
  AutomationExecutionRecord,
  AutomationRule,
  KanbanAcceptanceCriterion,
  KanbanAssignee,
  KanbanDependencyType,
  KanbanDecompositionItem,
  KanbanIssue,
  KanbanIssueStatus,
  KanbanIssueSource,
  KanbanLabel,
  KanbanPriority,
  KanbanProject,
} from "@a5c-ai/agent-mux-comm";

import type { AutomationTriggerEvent } from "./types";

const DEFAULT_BACKLOG_FILE_PATH = process.env.KANBAN_BACKLOG_FILE
  ?? path.join(os.homedir(), ".a5c", "kanban-backlog.json");

type StoredKanbanIssue = Pick<
  KanbanIssue,
  | "id"
  | "projectId"
  | "key"
  | "title"
  | "summary"
  | "description"
  | "createdAt"
  | "updatedAt"
  | "source"
> & {
  readonly status: KanbanIssueStatus;
  readonly priority: KanbanPriority;
  readonly labels: readonly KanbanLabel[];
  readonly assignees: readonly KanbanAssignee[];
  readonly dependencies: ReadonlyArray<{
    readonly issueId: string;
    readonly type: KanbanDependencyType;
  }>;
  readonly acceptanceCriteria: readonly KanbanAcceptanceCriterion[];
  readonly decomposition: readonly KanbanDecompositionItem[];
  readonly childIssueIds: readonly string[];
  readonly dispatch?: Partial<KanbanIssue["dispatch"]>;
};

type StoredKanbanProject = Pick<
  KanbanProject,
  | "id"
  | "key"
  | "name"
  | "description"
  | "issueIds"
  | "labels"
  | "assignees"
> & {
  readonly statuses?: KanbanProject["statuses"];
  readonly repositories?: KanbanProject["repositories"];
  readonly linkedRunProjectName?: string;
};

type StoredAutomationExecutionRecord = Omit<AutomationExecutionRecord, "status" | "reason"> & {
  readonly status: AutomationExecutionRecord["status"] | "skipped";
  readonly skipReason?: string;
};

interface AutomationStoragePayload {
  projects?: readonly StoredKanbanProject[];
  issues?: readonly StoredKanbanIssue[];
  automationRules?: readonly AutomationRule[];
  automationExecutions?: readonly StoredAutomationExecutionRecord[];
}

export interface ExecuteAutomationTriggerOptions {
  backlogFilePath?: string;
  now?: () => string;
}

function cloneRecord(
  value: Readonly<Record<string, unknown>> | undefined,
): Readonly<Record<string, unknown>> | undefined {
  return value ? { ...value } : undefined;
}

async function readAutomationStorage(backlogFilePath: string): Promise<AutomationStoragePayload> {
  try {
    const raw = await fs.readFile(backlogFilePath, "utf8");
    return JSON.parse(raw) as AutomationStoragePayload;
  } catch (error) {
    const errno = error as NodeJS.ErrnoException;
    if (errno.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

async function writeAutomationStorage(
  backlogFilePath: string,
  payload: AutomationStoragePayload,
): Promise<void> {
  await fs.mkdir(path.dirname(backlogFilePath), { recursive: true });
  await fs.writeFile(backlogFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function createTriggerMetadata(rule: AutomationRule): Readonly<Record<string, unknown>> {
  if (rule.trigger.type === "timer") {
    return {
      triggerType: "timer",
      cron: rule.trigger.cron,
      timezone: rule.trigger.timezone,
    };
  }

  return {
    triggerType: "webhook",
    port: rule.trigger.port,
    path: rule.trigger.path ?? "/trigger",
    method: rule.trigger.method ?? "POST",
    sourceEvent: rule.trigger.sourceEvent,
  };
}

function nextIssueNumber(project: Pick<StoredKanbanProject, "key">, issues: readonly StoredKanbanIssue[]): number {
  const prefix = `${project.key}-AUTO-`;
  return issues.reduce((max, issue) => {
    if (!issue.key.startsWith(prefix)) {
      return max;
    }
    const rawNumber = issue.key.slice(prefix.length);
    const parsed = Number.parseInt(rawNumber, 10);
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0) + 1;
}

function resolveProjectCollections(
  project: StoredKanbanProject,
  template: AutomationRule["template"],
): {
  labels: readonly KanbanLabel[];
  assignees: readonly KanbanAssignee[];
} {
  const labelsById = new Map(project.labels.map((label) => [label.id, label]));
  const assigneesById = new Map(project.assignees.map((assignee) => [assignee.id, assignee]));

  return {
    labels: (template.labelIds ?? [])
      .map((labelId) => labelsById.get(labelId))
      .filter((label): label is KanbanLabel => Boolean(label)),
    assignees: (template.assigneeIds ?? [])
      .map((assigneeId) => assigneesById.get(assigneeId))
      .filter((assignee): assignee is KanbanAssignee => Boolean(assignee)),
  };
}

function resolveIssueSource(rule: AutomationRule): KanbanIssueSource | undefined {
  if (rule.template.issueSource) {
    return { ...rule.template.issueSource };
  }

  if (rule.source.kind === "config-file") {
    return {
      kind: "file",
      path: rule.source.path,
      externalId: rule.source.externalId ?? rule.id,
    };
  }

  return {
    kind: "run-derived",
    externalId: rule.source.externalId ?? rule.id,
  };
}

function createAcceptanceCriteria(
  issueId: string,
  criteria: readonly string[] | undefined,
): readonly KanbanAcceptanceCriterion[] {
  return (criteria ?? []).map((title, index) => ({
    id: `${issueId}-ac-${index + 1}`,
    title,
    satisfied: false,
  }));
}

function createDecomposition(
  issueId: string,
  items: AutomationRule["template"]["decomposition"],
): readonly KanbanDecompositionItem[] {
  return (items ?? []).map((item, index) => ({
    id: `${issueId}-decomp-${index + 1}`,
    title: item.title,
    kind: item.kind,
    status: item.status,
    issueId: undefined,
  }));
}

function createAutomationIssue(
  rule: AutomationRule,
  project: StoredKanbanProject,
  issues: readonly StoredKanbanIssue[],
  now: string,
): StoredKanbanIssue {
  const sequence = nextIssueNumber(project, issues);
  const issueKey = `${project.key}-AUTO-${String(sequence).padStart(3, "0")}`;
  const issueId = issueKey;
  const { labels, assignees } = resolveProjectCollections(project, rule.template);

  return {
    id: issueId,
    key: issueKey,
    projectId: rule.target.projectId,
    title: rule.template.title,
    summary: rule.template.summary,
    description: rule.template.description,
    status: rule.template.status ?? "backlog",
    priority: rule.template.priority ?? "medium",
    labels,
    assignees,
    dependencies: [],
    acceptanceCriteria: createAcceptanceCriteria(issueId, rule.template.acceptanceCriteria),
    decomposition: createDecomposition(issueId, rule.template.decomposition),
    childIssueIds: [],
    createdAt: now,
    updatedAt: now,
    source: resolveIssueSource(rule),
  };
}

function createExecutionRecord(
  rule: AutomationRule,
  event: AutomationTriggerEvent,
  now: string,
  overrides: {
    status: StoredAutomationExecutionRecord["status"];
    issue?: Pick<StoredKanbanIssue, "id" | "key" | "source">;
    skipReason?: string;
  },
): StoredAutomationExecutionRecord {
  return {
    id: `automation-exec-${randomUUID().toLowerCase()}`,
    ruleId: rule.id,
    ruleName: rule.name,
    triggerType: rule.trigger.type,
    status: overrides.status,
    triggeredAt: now,
    triggeredBy: `daemon-${rule.trigger.type}`,
    source: {
      ...rule.source,
      metadata: cloneRecord(rule.source.metadata),
    },
    projectId: rule.target.projectId,
    boardProjectId: rule.target.boardProjectId,
    issueId: overrides.issue?.id,
    issueKey: overrides.issue?.key,
    issueSource: overrides.issue?.source,
    stateAtExecution: rule.state,
    skipReason: overrides.skipReason,
    inputs: event.inputs ? { ...event.inputs } : undefined,
    metadata: createTriggerMetadata(rule),
  };
}

export async function executeAutomationTrigger(
  event: AutomationTriggerEvent,
  options: ExecuteAutomationTriggerOptions = {},
): Promise<StoredAutomationExecutionRecord> {
  const backlogFilePath = options.backlogFilePath ?? DEFAULT_BACKLOG_FILE_PATH;
  const now = options.now?.() ?? new Date().toISOString();
  const storage = await readAutomationStorage(backlogFilePath);
  const rules = [...(storage.automationRules ?? [])];
  const rule = rules.find((candidate) => candidate.id === event.rule.id) ?? event.rule;

  if (rule.state !== "active") {
    const execution = createExecutionRecord(rule, event, now, {
      status: "skipped",
      skipReason: `Rule ${rule.id} is ${rule.state}.`,
    });
    await writeAutomationStorage(backlogFilePath, {
      ...storage,
      automationExecutions: [...(storage.automationExecutions ?? []), execution],
    });
    return execution;
  }

  const projects = [...(storage.projects ?? [])];
  const issueProject = projects.find((candidate) => candidate.id === rule.target.projectId);
  const boardProject = projects.find((candidate) => candidate.id === rule.target.boardProjectId);
  if (!issueProject || !boardProject) {
    const missingTarget = !issueProject
      ? `Project ${rule.target.projectId}`
      : `Board project ${rule.target.boardProjectId}`;
    const execution = createExecutionRecord(rule, event, now, {
      status: "skipped",
      skipReason: `${missingTarget} not found.`,
    });
    await writeAutomationStorage(backlogFilePath, {
      ...storage,
      automationExecutions: [...(storage.automationExecutions ?? []), execution],
    });
    return execution;
  }

  const issues = [...(storage.issues ?? [])];
  const issue = createAutomationIssue(rule, issueProject, issues, now);
  const execution = createExecutionRecord(rule, event, now, {
    status: "created",
    issue,
  });

  const nextRules = rules.length > 0
    ? rules.map((candidate) => (
      candidate.id === rule.id
        ? {
          ...candidate,
          audit: {
            ...candidate.audit,
            lastTriggeredAt: now,
            lastTriggeredBy: execution.triggeredBy,
          },
        }
        : candidate
    ))
    : storage.automationRules;
  const nextProjects = projects.map((candidate) => (
    candidate.id === issueProject.id || candidate.id === boardProject.id
      ? {
        ...candidate,
        issueIds: Array.from(new Set([...candidate.issueIds, issue.id])),
      }
      : candidate
  ));

  await writeAutomationStorage(backlogFilePath, {
    ...storage,
    projects: nextProjects,
    issues: [...issues, issue],
    automationRules: nextRules,
    automationExecutions: [...(storage.automationExecutions ?? []), execution],
  });

  return execution;
}
