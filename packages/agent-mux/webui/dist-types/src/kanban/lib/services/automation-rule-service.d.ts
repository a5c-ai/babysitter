import type { AutomationExecutionRecord, AutomationRule, AutomationRuleLifecycleState } from '@a5c-ai/agent-mux-core';
import type { KanbanIssue } from '@a5c-ai/agent-mux-core/kanban';
import { BacklogQueryService } from './backlog-query-service';
import { type KanbanStorageDeps } from './kanban-storage';
export declare const AUTOMATION_RULE_STATES: readonly ["draft", "active", "paused", "disabled", "archived"];
export declare const AUTOMATION_TRIGGER_TYPES: readonly ["timer", "webhook"];
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
export declare function isAutomationRuleState(value: string): value is AutomationRuleLifecycleState;
export declare function isAutomationTriggerType(value: string): value is AutomationTriggerType;
export declare class AutomationRuleService {
    private readonly deps;
    constructor(overrides?: Partial<AutomationRuleServiceDeps>);
    private readStorage;
    private listTargetOptions;
    private assertTargetExists;
    private assertMaterializationTargetExists;
    private persistRules;
    private persistExecution;
    private readExistingRule;
    listRules(query?: AutomationRuleQuery): Promise<AutomationRuleCollectionResponse>;
    getRule(ruleId: string): Promise<AutomationRuleDetailResponse>;
    createRule(body: Record<string, unknown>): Promise<AutomationRuleDetailResponse>;
    updateRule(ruleId: string, body: Record<string, unknown>): Promise<AutomationRuleDetailResponse>;
    transitionRule(ruleId: string, action: Exclude<AutomationRuleAction, 'delete'>, updatedBy?: string): Promise<AutomationRuleDetailResponse>;
    deleteRule(ruleId: string): Promise<DeleteAutomationRuleResponse>;
    materializeEvent(ruleId: string, body: Record<string, unknown>): Promise<MaterializeAutomationEventResponse>;
}
export {};
