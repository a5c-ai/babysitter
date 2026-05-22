import type {
  KanbanDecompositionItem,
  KanbanIssueSource,
  KanbanIssueStatus,
  KanbanPriority,
} from "./kanban.js";

export type AutomationRuleLifecycleState =
  | "draft"
  | "active"
  | "paused"
  | "disabled"
  | "archived";

export interface AutomationRuleSourceMetadata {
  readonly kind: "manual" | "config-file" | "api" | "external-system";
  readonly path?: string;
  readonly provider?: string;
  readonly externalId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AutomationRuleAuditMetadata {
  readonly createdAt: string;
  readonly createdBy?: string;
  readonly updatedAt?: string;
  readonly updatedBy?: string;
  readonly lastTriggeredAt?: string;
  readonly lastTriggeredBy?: string;
}

export interface AutomationTaskTemplate {
  readonly title: string;
  readonly summary?: string;
  readonly description?: string;
  readonly status?: Extract<KanbanIssueStatus, "backlog" | "ready">;
  readonly priority?: KanbanPriority;
  readonly labelIds?: readonly string[];
  readonly assigneeIds?: readonly string[];
  readonly acceptanceCriteria?: readonly string[];
  readonly decomposition?: readonly Pick<KanbanDecompositionItem, "title" | "kind" | "status">[];
  readonly issueSource?: KanbanIssueSource;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AutomationTarget {
  readonly projectId: string;
  readonly boardProjectId: string;
}

export interface AutomationIssueCreateRoute {
  readonly action: "canonical-issue-create";
  readonly projectId: string;
}

export interface AutomationDerivedBoardRoute {
  readonly action: "shared-board-derive";
  readonly boardProjectId: string;
}

export interface AutomationRouting {
  readonly issue: AutomationIssueCreateRoute;
  readonly board: AutomationDerivedBoardRoute;
  readonly mutateBoardDirectly: false;
}

export interface TimerAutomationTrigger {
  readonly type: "timer";
  readonly cron: string;
  readonly timezone?: string;
}

export interface WebhookAutomationTrigger {
  readonly type: "webhook";
  readonly port: number;
  readonly path?: string;
  readonly method?: "POST";
  readonly auth?:
    | {
      readonly type: "none";
    }
    | {
      readonly type: "bearer";
      readonly token: string;
    };
  readonly sourceEvent?: string;
}

interface AutomationRuleBase {
  readonly id: string;
  readonly name: string;
  readonly state: AutomationRuleLifecycleState;
  readonly target: AutomationTarget;
  readonly template: AutomationTaskTemplate;
  readonly routing: AutomationRouting;
  readonly source: AutomationRuleSourceMetadata;
  readonly audit: AutomationRuleAuditMetadata;
}

export interface TimerAutomationRule extends AutomationRuleBase {
  readonly trigger: TimerAutomationTrigger;
}

export interface WebhookAutomationRule extends AutomationRuleBase {
  readonly trigger: WebhookAutomationTrigger;
}

export type AutomationRule = TimerAutomationRule | WebhookAutomationRule;

export type AutomationExecutionStatus = "created" | "coalesced" | "rejected";

export interface AutomationExecutionRecord {
  readonly id: string;
  readonly ruleId: string;
  readonly ruleName: string;
  readonly triggerType: AutomationRule["trigger"]["type"];
  readonly status: AutomationExecutionStatus;
  readonly triggeredAt: string;
  readonly triggeredBy: string;
  readonly source: AutomationRuleSourceMetadata;
  readonly projectId: string;
  readonly boardProjectId: string;
  readonly issueId?: string;
  readonly issueKey?: string;
  readonly issueSource?: KanbanIssueSource;
  readonly stateAtExecution: AutomationRuleLifecycleState;
  readonly reason?: string;
  readonly deliveryId?: string;
  readonly inputs?: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
