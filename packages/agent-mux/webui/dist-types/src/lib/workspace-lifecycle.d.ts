import { promises as fs } from "node:fs";
import { type DiscoveredRun } from "@/lib/source-discovery";
import type { Run } from "@/types";
import type { WatchSource } from "@/lib/config-loader";
import type { WorkspaceService } from "@a5c-ai/agent-mux-comm";
import type { KanbanReviewSummary } from "@a5c-ai/agent-mux-comm";
import type { KanbanWorkspaceOwnershipHostSummary, KanbanWorkspaceOwnershipIssueSummary, KanbanWorkspaceOwnershipProjectSummary, KanbanWorkspaceAction, KanbanWorkspaceActionResult, KanbanWorkspaceInventory, KanbanWorkspaceIssueSummary, KanbanWorkspaceSessionSummary, KanbanWorkspaceSummary } from "@a5c-ai/agent-mux-comm/kanban";
type WorkspaceAction = KanbanWorkspaceAction;
export type WorkspaceSessionSnapshot = KanbanWorkspaceSessionSummary;
export type WorkspaceIssueLink = KanbanWorkspaceIssueSummary;
export type WorkspaceInventoryItem = KanbanWorkspaceSummary;
export type WorkspaceInventoryResponse = KanbanWorkspaceInventory;
export type WorkspaceActionResult = KanbanWorkspaceActionResult;
export interface WorkspaceProvisionResult {
    workspacePath: string;
    workspaceName: string;
    branchName: string;
}
export interface WorkspaceProvisionOwnershipInput {
    source: "created-from-issue" | "linked-existing-workspace" | "created-from-project" | "created-from-host";
    project?: KanbanWorkspaceOwnershipProjectSummary;
    issue?: KanbanWorkspaceOwnershipIssueSummary;
    host?: KanbanWorkspaceOwnershipHostSummary;
}
export interface WorkspaceLifecycleDeps {
    discoverAllRunDirs: () => Promise<DiscoveredRun[]>;
    getRunCached: (runDir: string, source: WatchSource, projectName: string) => Promise<Run>;
    readFile: typeof fs.readFile;
    writeFile: typeof fs.writeFile;
    mkdir: typeof fs.mkdir;
    stat: typeof fs.stat;
    execGit: (args: string[], cwd: string) => Promise<{
        stdout: string;
        stderr: string;
    }>;
    now: () => string;
    cwd: () => string;
    workspaceService?: Pick<WorkspaceService, "listWorkspaces" | "createWorkspace" | "archiveWorkspace" | "cleanupWorkspace" | "recoverWorkspace" | "resolveWorkspace">;
}
export declare class WorkspaceLifecycleService {
    private deps;
    private workspaceCorePromise;
    constructor(deps?: Partial<WorkspaceLifecycleDeps>);
    private getWorkspaceCore;
    listWorkspaces(input?: {
        sessions?: WorkspaceSessionSnapshot[];
        reviewByWorkspacePath?: ReadonlyMap<string, KanbanReviewSummary>;
        linkedIssuesByWorkspacePath?: ReadonlyMap<string, readonly WorkspaceIssueLink[]>;
        focusWorkspacePath?: string;
    }): Promise<WorkspaceInventoryResponse>;
    provisionWorkspace(input: {
        workspaceName: string;
        slugSeed?: string;
        ownership?: WorkspaceProvisionOwnershipInput;
    }): Promise<WorkspaceProvisionResult>;
    provisionWorkspaceForIssue(input: {
        issueKey: string;
        issueTitle: string;
        ownership?: WorkspaceProvisionOwnershipInput;
    }): Promise<WorkspaceProvisionResult>;
    applyAction(input: {
        action: WorkspaceAction;
        workspacePath: string;
        note?: string;
        sessions?: WorkspaceSessionSnapshot[];
    }): Promise<WorkspaceActionResult>;
}
export {};
