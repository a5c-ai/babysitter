import type { AutomationExecutionRecord, AutomationExecutionStatus, AutomationRule } from "@a5c-ai/agent-mux-comm/automation";
import { type KanbanStorageDeps, type StoredKanbanIssue } from "./kanban-storage";
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
export declare class AutomationWebhookService {
    private readonly deps;
    constructor(overrides?: Partial<AutomationWebhookServiceDeps>);
    private readStorage;
    private writeStorage;
    private updateRuleAudit;
    private appendExecution;
    private findRule;
    private createAutomationIssue;
    deliver(input: AutomationWebhookDeliveryInput): Promise<AutomationWebhookDeliveryResponse>;
}
export {};
