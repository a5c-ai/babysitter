import type { McpServerConfig } from "@a5c-ai/agent-mux-comm";
export interface StoredAgentConfiguration {
    model?: string;
    provider?: string;
    approvalMode?: "yolo" | "prompt" | "deny";
    maxTokens?: number;
}
export interface SettingsSectionStorage {
    agentConfiguration: Record<string, StoredAgentConfiguration>;
    mcpServers: Record<string, McpServerConfig[]>;
}
export declare function loadSettingsSectionStorage(): Promise<SettingsSectionStorage>;
export declare function writeSettingsSectionStorage(data: SettingsSectionStorage): Promise<void>;
