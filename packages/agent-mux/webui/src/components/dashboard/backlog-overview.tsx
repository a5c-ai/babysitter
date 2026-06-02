"use client";

import type {
  KanbanBoardCard,
  KanbanCollaboratorRole,
  KanbanIntegrationProvider,
  KanbanRepositoryIntegrationState,
  KanbanDispatchContextLabelDefinition,
  KanbanIssue,
  KanbanPermissionGrant,
  KanbanProject,
  KanbanProjectBoard,
  KanbanPullRequestReviewLink,
  KanbanTaskTag,
  KanbanReviewArtifact,
  KanbanWorkflowState,
} from "@a5c-ai/agent-mux-comm/kanban";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  FolderGit2,
  GitBranch,
  Layers,
  Link2,
  ListTodo,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Trash2,
  Tag,
  UserRoundPlus,
  Users,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom-v6";

import { useBacklog } from "@/hooks/use-backlog";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useReviews } from "@/hooks/use-reviews";
import { useTaskTags } from "@/hooks/use-task-tags";
import { ReviewPanel } from "@/components/review/review-panel";
import { TaskTagAutocompleteTextarea } from "@/components/task-tags/task-tag-autocomplete-textarea";
import type { WorkspaceInventoryItem, WorkspaceInventoryResponse } from "@/lib/workspace-lifecycle";

const workflowOrder: readonly KanbanWorkflowState[] = ["todo", "in-progress", "review", "done"];

function issueTone(card: KanbanBoardCard): string {
  if (card.blocked) {
    return "border-error/30 bg-error-muted/70 text-error";
  }
  if (card.workflowState === "done") {
    return "border-success/25 bg-success-muted text-success";
  }
  if (card.workflowState === "review") {
    return "border-primary/25 bg-primary/10 text-primary";
  }
  if (card.workflowState === "in-progress") {
    return "border-warning/25 bg-warning-muted text-warning";
  }
  return "border-border bg-background text-foreground-secondary";
}

function columnTone(state: KanbanWorkflowState, overLimit: boolean): string {
  if (overLimit) {
    return "border-error/30 bg-error-muted/60";
  }

  switch (state) {
    case "todo":
      return "border-border bg-background/80";
    case "in-progress":
      return "border-warning/25 bg-warning-muted/50";
    case "review":
      return "border-primary/20 bg-primary/5";
    case "done":
      return "border-success/20 bg-success-muted/60";
  }
}

function stateLabel(state: KanbanWorkflowState): string {
  switch (state) {
    case "todo":
      return "Todo";
    case "in-progress":
      return "In Progress";
    case "review":
      return "Review";
    case "done":
      return "Done";
  }
}

function findCardsForCell(
  board: KanbanProjectBoard,
  swimlaneId: string,
  state: KanbanWorkflowState,
): KanbanBoardCard[] {
  return board.cards.filter(
    (card) => card.swimlaneId === swimlaneId && card.workflowState === state,
  );
}

function lifecycleTone(status: string): string {
  switch (status) {
    case "approved":
    case "ready":
    case "passing":
    case "published":
    case "merged":
      return "border-success/25 bg-success-muted text-success";
    case "pending":
    case "in-review":
      return "border-warning/25 bg-warning-muted text-warning";
    case "changes-requested":
    case "blocked":
    case "failing":
    case "failed":
      return "border-error/25 bg-error-muted text-error";
    default:
      return "border-border bg-background text-foreground-muted";
  }
}

function providerLabel(provider: string): string {
  return provider === "azure-repos" ? "Azure Repos" : provider;
}

function integrationTone(status: KanbanRepositoryIntegrationState["status"]): string {
  switch (status) {
    case "connected":
      return "border-success/25 bg-success-muted text-success";
    case "partial-setup":
    case "missing-scopes":
      return "border-warning/25 bg-warning-muted text-warning";
    case "expired-auth":
    case "failing":
      return "border-error/25 bg-error-muted text-error";
    default:
      return "border-border bg-background text-foreground-muted";
  }
}

function integrationLabel(status: KanbanRepositoryIntegrationState["status"]): string {
  return status.replace(/-/g, " ");
}

function linkStateLabel(linkState: NonNullable<KanbanRepositoryIntegrationState["linkState"]>): string {
  return linkState === "partially-linked" ? "partially linked" : linkState;
}

function lifecycleLabel(status: string): string {
  return status
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function reviewTone(review: KanbanPullRequestReviewLink): string {
  return lifecycleTone(review.status);
}

function roleLabel(role: KanbanCollaboratorRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatActivity(timestamp?: string): string {
  if (!timestamp) {
    return "No activity yet";
  }
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function workspaceShellHref(workspacePath: string): string {
  return `/workspaces?workspace=${encodeURIComponent(workspacePath)}`;
}

function projectIssueHref(projectId: string, issueId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}`;
}

function projectIssueCreateHref(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/issues/new`;
}

function projectWorkspaceCreateHref(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/workspaces/new`;
}

function projectIssueWorkspaceCreateHref(projectId: string, issueId: string): string {
  return `/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}/workspace/new`;
}

function workspaceLifecycleTone(status: string): string {
  switch (status) {
    case "active":
      return "border-success/25 bg-success-muted text-success";
    case "archived":
      return "border-warning/25 bg-warning-muted text-warning";
    case "missing":
      return "border-error/25 bg-error-muted text-error";
    default:
      return "border-border bg-background text-foreground-muted";
  }
}

function workspaceLinkSummary(
  link: NonNullable<KanbanIssue["workspaceLinks"]>[number],
): string {
  const source =
    link.source === "created-from-issue" ? "created here" : "linked workspace";
  return link.branchName ? `${source} · ${link.branchName}` : source;
}

async function loadIssueWorkspaceInventory(): Promise<WorkspaceInventoryResponse> {
  const response = await fetch("/api/workspaces", { cache: "no-store" });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Workspace inventory request failed: ${response.status}`);
  }
  return (await response.json()) as WorkspaceInventoryResponse;
}

type BoardPresentation = "board" | "list";
type CreateEntrySource = "header" | "column";
type PlanningSortMode = "board-order" | "priority" | "activity" | "title";

interface CreateIssueDraft {
  title: string;
  summary: string;
  description: string;
  workflowState: KanbanWorkflowState;
  status: KanbanIssue["status"];
  priority: "critical" | "high" | "medium" | "low";
  assigneeIds: string[];
  labelIds: string[];
  dependencies: IssueDependencyDraft[];
  acceptanceCriteria: IssueAcceptanceCriterionDraft[];
}

type AutosaveStatus = "idle" | "saving" | "saved" | "partial";
type IssueDetailField = "metadata" | "description" | "priority" | "assignees" | "labels";
type IssueFieldSaveStatus = "idle" | "saving" | "saved" | "error";

interface CreateModeState {
  source: CreateEntrySource;
  workflowState: KanbanWorkflowState;
}

interface IssueDependencyDraft {
  issueId: string;
  type: "blocks" | "blocked-by" | "related";
}

interface IssueAcceptanceCriterionDraft {
  id?: string;
  title: string;
  satisfied: boolean;
  notes: string;
}

interface IssueDetailDraft {
  title: string;
  summary: string;
  description: string;
  status: KanbanIssue["status"];
  priority: KanbanIssue["priority"];
  assigneeIds: string[];
  labelIds: string[];
  dependencies: IssueDependencyDraft[];
  acceptanceCriteria: IssueAcceptanceCriterionDraft[];
  baseUpdatedAt: string;
}

interface IssueFieldState {
  status: IssueFieldSaveStatus;
  message: string | null;
}

interface IssueWorkspaceInventoryState {
  items: WorkspaceInventoryItem[];
  loading: boolean;
  error: string | null;
}

interface BacklogOverviewProps {
  projectId?: string;
  routeBasePath?: string;
  forcedPresentation?: BoardPresentation;
  routeMode?: "board" | "issue" | "create";
  initialIssueId?: string;
  initialIssueKey?: string;
  initialProjectId?: string;
}

type IssueFieldStateMap = Record<IssueDetailField, IssueFieldState>;

function createEmptyDraft(workflowState: KanbanWorkflowState = "todo"): CreateIssueDraft {
  return {
    title: "",
    summary: "",
    description: "",
    workflowState,
    status: workflowStateToIssueStatus(workflowState),
    priority: workflowState === "in-progress" || workflowState === "review" ? "high" : "medium",
    assigneeIds: [],
    labelIds: [],
    dependencies: [],
    acceptanceCriteria: [],
  };
}

function workflowStateToIssueStatus(state: KanbanWorkflowState): "backlog" | "in-progress" | "review" | "done" {
  switch (state) {
    case "in-progress":
      return "in-progress";
    case "review":
      return "review";
    case "done":
      return "done";
    case "todo":
    default:
      return "backlog";
  }
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function buildCardSearchDocument(card: KanbanBoardCard, issue: KanbanIssue | undefined): string {
  return [
    card.issueKey,
    card.title,
    card.summary ?? "",
    card.priority,
    card.readiness,
    ...card.labelNames,
    ...card.assigneeNames,
    ...card.collaboratorNames,
    ...(issue?.dispatch.contextLabelProjections ?? []).flatMap((projection) => [
      projection.key,
      projection.label,
      projection.instruction,
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

function priorityRank(priority: KanbanBoardCard["priority"]): number {
  switch (priority) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
    default:
      return 3;
  }
}

function autosaveCopy(status: AutosaveStatus): string {
  switch (status) {
    case "saving":
      return "Autosaving draft…";
    case "saved":
      return "Draft autosaved locally.";
    case "partial":
      return "Issue save failed. Draft preserved locally for retry.";
    default:
      return "Draft is empty.";
  }
}

function createIssueDetailDraft(issue: KanbanIssue): IssueDetailDraft {
  return {
    title: issue.title,
    summary: issue.summary ?? "",
    description: issue.description ?? "",
    status: issue.status,
    priority: issue.priority,
    assigneeIds: issue.assignees.map((assignee) => assignee.id),
    labelIds: issue.labels.map((label) => label.id),
    dependencies: issue.dependencies.map((dependency) => ({
      issueId: dependency.issueId,
      type: dependency.type,
    })),
    acceptanceCriteria: issue.acceptanceCriteria.map((criterion) => ({
      id: criterion.id,
      title: criterion.title,
      satisfied: criterion.satisfied,
      notes: criterion.notes ?? "",
    })),
    baseUpdatedAt: issue.updatedAt,
  };
}

function createIssueFieldStateMap(): IssueFieldStateMap {
  return {
    metadata: { status: "idle", message: null },
    description: { status: "idle", message: null },
    priority: { status: "idle", message: null },
    assignees: { status: "idle", message: null },
    labels: { status: "idle", message: null },
  };
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function dependenciesEqual(
  left: readonly IssueDependencyDraft[],
  right: readonly IssueDependencyDraft[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (value, index) =>
        value.issueId === right[index]?.issueId && value.type === right[index]?.type,
    )
  );
}

function acceptanceCriteriaEqual(
  left: readonly IssueAcceptanceCriterionDraft[],
  right: readonly IssueAcceptanceCriterionDraft[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (value, index) =>
        value.id === right[index]?.id &&
        value.title === right[index]?.title &&
        value.satisfied === right[index]?.satisfied &&
        value.notes === right[index]?.notes,
    )
  );
}

function isIssueFieldDirty(
  field: IssueDetailField,
  draft: IssueDetailDraft,
  issue: KanbanIssue,
): boolean {
  switch (field) {
    case "metadata":
      return (
        draft.title !== issue.title ||
        draft.summary !== (issue.summary ?? "") ||
        draft.status !== issue.status ||
        !dependenciesEqual(
          draft.dependencies,
          issue.dependencies.map((dependency) => ({
            issueId: dependency.issueId,
            type: dependency.type,
          })),
        ) ||
        !acceptanceCriteriaEqual(
          draft.acceptanceCriteria,
          issue.acceptanceCriteria.map((criterion) => ({
            id: criterion.id,
            title: criterion.title,
            satisfied: criterion.satisfied,
            notes: criterion.notes ?? "",
          })),
        )
      );
    case "description":
      return draft.description !== (issue.description ?? "");
    case "priority":
      return draft.priority !== issue.priority;
    case "assignees":
      return !arraysEqual(draft.assigneeIds, issue.assignees.map((assignee) => assignee.id));
    case "labels":
      return !arraysEqual(draft.labelIds, issue.labels.map((label) => label.id));
  }
}

function isIssueDraftDirty(draft: IssueDetailDraft, issue: KanbanIssue): boolean {
  return (
    isIssueFieldDirty("metadata", draft, issue) ||
    isIssueFieldDirty("description", draft, issue) ||
    isIssueFieldDirty("priority", draft, issue) ||
    isIssueFieldDirty("assignees", draft, issue) ||
    isIssueFieldDirty("labels", draft, issue)
  );
}

function toggleId(values: readonly string[], id: string): string[] {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id];
}

interface CreateIssuePanelProps {
  draft: CreateIssueDraft;
  project: KanbanProject;
  issues: readonly KanbanIssue[];
  taskTags: readonly KanbanTaskTag[];
  autosaveStatus: AutosaveStatus;
  creatingIssue: boolean;
  error: string | null;
  validationError: string | null;
  onChange: (updater: (current: CreateIssueDraft) => CreateIssueDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function CreateIssuePanel({
  draft,
  project,
  issues,
  taskTags,
  autosaveStatus,
  creatingIssue,
  error,
  validationError,
  onChange,
  onClose,
  onSubmit,
}: CreateIssuePanelProps) {
  const dependencyOptions = issues.filter((issue) => issue.projectId === project.id);
  const [selectedDependencyIssueId, setSelectedDependencyIssueId] = useState<string>(
    dependencyOptions[0]?.id ?? "",
  );
  const [selectedDependencyType, setSelectedDependencyType] = useState<
    "blocks" | "blocked-by" | "related"
  >("blocked-by");

  useEffect(() => {
    setSelectedDependencyIssueId((current) =>
      current && dependencyOptions.some((candidate) => candidate.id === current)
        ? current
        : (dependencyOptions[0]?.id ?? ""),
    );
  }, [dependencyOptions]);

  return (
    <aside
      className="rounded-3xl border border-primary/20 bg-background p-5 shadow-lg"
      data-testid="create-issue-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
            Create mode
          </p>
          <h3 className="mt-1 text-xl font-semibold text-foreground">Create issue beside the board</h3>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            New issues open from board-level entry points and stay anchored to the planning surface
            while draft, validation, save, autosave, and failure state remain explicit.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm text-foreground-muted"
        >
          Close
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground-muted">
        {autosaveCopy(autosaveStatus)}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
        <span className="rounded-full border border-border px-2.5 py-1">
          Target column {stateLabel(draft.workflowState)}
        </span>
        <span className="rounded-full border border-border px-2.5 py-1">
          Status {issueStatusLabel(draft.status)}
        </span>
        <span className="rounded-full border border-border px-2.5 py-1">
          Priority {draft.priority}
        </span>
      </div>

      <form
        className="mt-4 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          Title
          <input
            aria-label="Issue title"
            value={draft.title}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Summarize the work item"
            className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          />
        </label>

        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          Summary
          <TaskTagAutocompleteTextarea
            taskTags={taskTags}
            value={draft.summary}
            onValueChange={(summary) =>
              onChange((current) => ({
                ...current,
                summary,
              }))
            }
            className="mt-2"
            renderTextarea={(props) => (
              <textarea
                {...props}
                aria-label="Issue summary"
                placeholder="Capture the outcome expected from this issue."
                className="min-h-24 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
              />
            )}
          />
        </label>

        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          Description
          <textarea
            aria-label="Issue description"
            value={draft.description}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Describe the implementation, rollout, and acceptance notes."
            className="mt-2 min-h-28 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Target column
            <select
              aria-label="Target column"
              value={draft.workflowState}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  workflowState: event.target.value as KanbanWorkflowState,
                  status: workflowStateToIssueStatus(event.target.value as KanbanWorkflowState),
                }))
              }
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            >
              {workflowOrder.map((state) => (
                <option key={state} value={state}>
                  {stateLabel(state)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Status
            <select
              aria-label="Issue status"
              value={draft.status}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  status: event.target.value as KanbanIssue["status"],
                }))
              }
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value="backlog">Backlog</option>
              <option value="ready">Ready</option>
              <option value="in-progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </label>

          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Priority
            <select
              aria-label="Priority"
              value={draft.priority}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  priority: event.target.value as CreateIssueDraft["priority"],
                }))
              }
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-sm font-semibold text-foreground">Assignees</div>
            <div className="mt-3 space-y-2">
              {project.team.members.length > 0 ? (
                project.team.members.map((member) => (
                  <label
                    key={`create-issue-assignee-${member.id}`}
                    className="flex items-center gap-2 text-sm text-foreground-muted"
                  >
                    <input
                      type="checkbox"
                      checked={draft.assigneeIds.includes(member.id)}
                      onChange={() =>
                        onChange((current) => ({
                          ...current,
                          assigneeIds: toggleId(current.assigneeIds, member.id),
                        }))
                      }
                    />
                    <span>{member.displayName}</span>
                  </label>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                  No assignees are configured for this project yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-sm font-semibold text-foreground">Tags</div>
            <div className="mt-3 space-y-2">
              {project.labels.length > 0 ? (
                project.labels.map((label) => (
                  <label
                    key={`create-issue-label-${label.id}`}
                    className="flex items-center gap-2 text-sm text-foreground-muted"
                  >
                    <input
                      type="checkbox"
                      checked={draft.labelIds.includes(label.id)}
                      onChange={() =>
                        onChange((current) => ({
                          ...current,
                          labelIds: toggleId(current.labelIds, label.id),
                        }))
                      }
                    />
                    <span>{label.name}</span>
                  </label>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                  No project tags are available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">Dependencies</div>
                <div className="mt-1 text-xs text-foreground-muted">
                  Link existing issues while authoring instead of patching them later.
                </div>
              </div>
            </div>

            {dependencyOptions.length > 0 ? (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
                  <select
                    aria-label="Dependency issue"
                    value={selectedDependencyIssueId}
                    onChange={(event) => setSelectedDependencyIssueId(event.target.value)}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                  >
                    {dependencyOptions.map((issue) => (
                      <option key={`create-dependency-${issue.id}`} value={issue.id}>
                        {issue.key}: {issue.title}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Dependency type"
                    value={selectedDependencyType}
                    onChange={(event) =>
                      setSelectedDependencyType(
                        event.target.value as "blocks" | "blocked-by" | "related",
                      )
                    }
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                  >
                    <option value="blocked-by">Blocked by</option>
                    <option value="blocks">Blocks</option>
                    <option value="related">Related</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedDependencyIssueId) {
                        return;
                      }
                      onChange((current) => {
                        const nextDependency = {
                          issueId: selectedDependencyIssueId,
                          type: selectedDependencyType,
                        } as const;
                        if (
                          current.dependencies.some(
                            (candidate) =>
                              candidate.issueId === nextDependency.issueId &&
                              candidate.type === nextDependency.type,
                          )
                        ) {
                          return current;
                        }
                        return {
                          ...current,
                          dependencies: [...current.dependencies, nextDependency],
                        };
                      });
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold text-foreground"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {draft.dependencies.length > 0 ? (
                    draft.dependencies.map((dependency, index) => {
                      const dependencyIssue = dependencyOptions.find(
                        (candidate) => candidate.id === dependency.issueId,
                      );
                      return (
                        <div
                          key={`create-dependency-draft-${dependency.issueId}-${index}`}
                          className="rounded-2xl border border-border bg-background p-3"
                        >
                          <div className="text-sm font-semibold text-foreground">
                            {dependencyIssue?.key ?? dependency.issueId}
                          </div>
                          <div className="mt-1 text-sm text-foreground-muted">
                            {dependencyIssue?.title ?? "Linked dependency"}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <select
                              value={dependency.type}
                              onChange={(event) =>
                                onChange((current) => ({
                                  ...current,
                                  dependencies: current.dependencies.map(
                                    (candidate, candidateIndex) =>
                                      candidateIndex === index
                                        ? {
                                            ...candidate,
                                            type: event.target.value as
                                              | "blocks"
                                              | "blocked-by"
                                              | "related",
                                          }
                                        : candidate,
                                  ),
                                }))
                              }
                              className="h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                            >
                              <option value="blocked-by">Blocked by</option>
                              <option value="blocks">Blocks</option>
                              <option value="related">Related</option>
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                onChange((current) => ({
                                  ...current,
                                  dependencies: current.dependencies.filter(
                                    (_, candidateIndex) => candidateIndex !== index,
                                  ),
                                }))
                              }
                              className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground-muted"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                      No dependencies configured.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                No same-project issues are available to link as dependencies yet.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">Acceptance criteria</div>
                <div className="mt-1 text-xs text-foreground-muted">
                  Author criteria up front so issue readiness is explicit from creation time.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange((current) => ({
                    ...current,
                    acceptanceCriteria: [
                      ...current.acceptanceCriteria,
                      { title: "", satisfied: false, notes: "" },
                    ],
                  }))
                }
                className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
              >
                Add criterion
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {draft.acceptanceCriteria.length > 0 ? (
                draft.acceptanceCriteria.map((criterion, index) => (
                  <div
                    key={`create-criterion-draft-${criterion.id ?? index}`}
                    className="rounded-2xl border border-border bg-background p-3"
                  >
                    <label className="flex items-center gap-2 text-sm text-foreground-muted">
                      <input
                        type="checkbox"
                        checked={criterion.satisfied}
                        onChange={(event) =>
                          onChange((current) => ({
                            ...current,
                            acceptanceCriteria: current.acceptanceCriteria.map(
                              (candidate, candidateIndex) =>
                                candidateIndex === index
                                  ? { ...candidate, satisfied: event.target.checked }
                                  : candidate,
                            ),
                          }))
                        }
                      />
                      Satisfied
                    </label>
                    <input
                      aria-label={`Acceptance criterion ${index + 1} title`}
                      value={criterion.title}
                      onChange={(event) =>
                        onChange((current) => ({
                          ...current,
                          acceptanceCriteria: current.acceptanceCriteria.map(
                            (candidate, candidateIndex) =>
                              candidateIndex === index
                                ? { ...candidate, title: event.target.value }
                                : candidate,
                          ),
                        }))
                      }
                      placeholder="Describe the acceptance condition"
                      className="mt-3 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                    />
                    <input
                      aria-label={`Acceptance criterion ${index + 1} notes`}
                      value={criterion.notes}
                      onChange={(event) =>
                        onChange((current) => ({
                          ...current,
                          acceptanceCriteria: current.acceptanceCriteria.map(
                            (candidate, candidateIndex) =>
                              candidateIndex === index
                                ? { ...candidate, notes: event.target.value }
                                : candidate,
                          ),
                        }))
                      }
                      placeholder="Optional note"
                      className="mt-2 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          onChange((current) => ({
                            ...current,
                            acceptanceCriteria: current.acceptanceCriteria.filter(
                              (_, candidateIndex) => candidateIndex !== index,
                            ),
                          }))
                        }
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground-muted"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                  No acceptance criteria authored yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {validationError ? (
          <div className="rounded-2xl border border-error/30 bg-error-muted px-4 py-3 text-sm text-error">
            {validationError}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-error/30 bg-error-muted px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={creatingIssue}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {creatingIssue ? "Creating issue…" : "Create issue"}
        </button>
      </form>
    </aside>
  );
}

function renderListCard(
  card: KanbanBoardCard,
  issue: KanbanIssue | undefined,
  focused: boolean,
  onOpen: (issue: KanbanIssue) => void,
  selected: boolean,
  onToggleSelected: (issueId: string) => void,
  onMoveIssue: (issueId: string, state: KanbanWorkflowState) => void,
  movingIssueId: string | null,
  showPolicySignals: boolean,
) {
  return (
    <article
      key={`list-${card.issueId}`}
      id={`kanban-issue-${card.issueId}`}
      className={`rounded-2xl border p-4 ${issueTone(card)} ${
        focused ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""
      }`}
      data-testid={`kanban-list-card-${card.issueKey}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 text-xs text-foreground-muted">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelected(card.issueId)}
            className="h-4 w-4 rounded border border-border"
            aria-label={`Select ${card.issueKey}`}
          />
        </label>
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{card.issueKey}</span>
        <span className="rounded-full border border-current/20 px-2 py-0.5 text-xs">
          {stateLabel(card.workflowState)}
        </span>
        <span className="rounded-full border border-current/20 px-2 py-0.5 text-xs">
          {card.priority}
        </span>
        <span className="rounded-full border border-current/20 px-2 py-0.5 text-xs">
          {card.readiness}
        </span>
      </div>
      <button
        type="button"
        onClick={() => issue && onOpen(issue)}
        className="mt-2 text-left text-base font-semibold underline-offset-4 hover:underline"
        data-testid={`open-list-issue-${card.issueKey}`}
      >
        {card.title}
      </button>
      {card.summary ? <p className="mt-2 text-sm leading-6 opacity-90">{card.summary}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs opacity-80">
        <span className="inline-flex items-center gap-1">
          <GitBranch className="h-3.5 w-3.5" />
          {card.dependencyCount} dependencies
        </span>
        <span className="inline-flex items-center gap-1">
          <Workflow className="h-3.5 w-3.5" />
          {card.childCount} child issues
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {card.acceptanceProgress.satisfied}/{card.acceptanceProgress.total} accepted
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {card.moveTargets.map((target) => (
          <button
            key={`${card.issueId}-${target.state}`}
            disabled={!target.allowed || movingIssueId === card.issueId}
            onClick={() => onMoveIssue(card.issueId, target.state)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border-hover bg-transparent px-3 text-xs font-medium italic tracking-[0.04em] text-foreground transition-all duration-200 hover:bg-card hover:border-primary/30 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50 font-serif"
            data-testid={`move-list-${card.issueKey}-${target.state}`}
          >
            <ArrowRight className="h-3.5 w-3.5" />
            {stateLabel(target.state)}
          </button>
        ))}
      </div>
      {showPolicySignals && card.moveTargets.some((target) => target.signals.length > 0) ? (
        <div className="mt-3 space-y-2">
          {card.moveTargets.flatMap((target) =>
            target.signals.map((signal, index) => (
              <div
                key={`${card.issueId}-${target.state}-${signal.hookId}-${index}`}
                className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground-muted"
              >
                {stateLabel(target.state)}: {signal.message}
              </div>
            )),
          )}
        </div>
      ) : null}
    </article>
  );
}

function issueStatusLabel(status: KanbanIssue["status"]): string {
  return status
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function issueStatusTone(status: KanbanIssue["status"]): string {
  switch (status) {
    case "done":
      return "border-success/25 bg-success-muted text-success";
    case "review":
      return "border-primary/25 bg-primary/10 text-primary";
    case "in-progress":
      return "border-warning/25 bg-warning-muted text-warning";
    case "blocked":
      return "border-error/25 bg-error-muted text-error";
    default:
      return "border-border bg-background text-foreground-muted";
  }
}

function collectDescendantIssueIds(
  issue: KanbanIssue,
  issueById: ReadonlyMap<string, KanbanIssue>,
): Set<string> {
  const descendants = new Set<string>();
  const pending = [...issue.childIssueIds];

  while (pending.length > 0) {
    const childIssueId = pending.shift();
    if (!childIssueId || descendants.has(childIssueId)) {
      continue;
    }

    descendants.add(childIssueId);
    const childIssue = issueById.get(childIssueId);
    if (childIssue) {
      pending.push(...childIssue.childIssueIds);
    }
  }

  return descendants;
}

interface ProjectCollaborationPanelProps {
  project: KanbanProject;
  mutating: boolean;
  onSave: (input: {
    projectId: string;
    teamName: string;
    visibility: "private" | "team" | "workspace-shared";
    defaultRole: KanbanCollaboratorRole;
    allowSelfAssign: boolean;
    reviewRequiredForDone: boolean;
    activityScope: "project-and-issues" | "all-board-entities";
    workspaceProvisioning: "owners-maintainers" | "contributors-and-up";
    members: Array<{ id: string; displayName: string; email?: string; role: KanbanCollaboratorRole }>;
    permissions: KanbanPermissionGrant[];
  }) => Promise<void>;
}

function ProjectCollaborationPanel({ project, mutating, onSave }: ProjectCollaborationPanelProps) {
  const [teamName, setTeamName] = useState(project.team.name);
  const [visibility, setVisibility] = useState(project.team.settings.visibility);
  const [defaultRole, setDefaultRole] = useState<KanbanCollaboratorRole>(
    project.team.settings.defaultRole,
  );
  const [allowSelfAssign, setAllowSelfAssign] = useState(project.team.settings.allowSelfAssign);
  const [reviewRequiredForDone, setReviewRequiredForDone] = useState(
    project.settings.reviewRequiredForDone,
  );
  const [activityScope, setActivityScope] = useState(project.settings.activityScope);
  const [workspaceProvisioning, setWorkspaceProvisioning] = useState(
    project.settings.workspaceProvisioning,
  );
  const [members, setMembers] = useState(
    project.team.members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      email: member.email ?? "",
      role: member.role,
    })),
  );

  return (
    <div className="mt-5 rounded-3xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
            Team and permissions
          </p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            Shared collaboration state now lives beside the board model
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
            Team roster, project policy, activity visibility, and role-based permissions now
            exist as shared kanban primitives instead of implicit gateway-token access.
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs text-foreground-muted">
          {project.team.members.length} collaborators
        </span>
      </div>

      <form
        className="mt-4 grid gap-3 xl:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave({
            projectId: project.id,
            teamName,
            visibility,
            defaultRole,
            allowSelfAssign,
            reviewRequiredForDone,
            activityScope,
            workspaceProvisioning,
            members: members.map((member) => ({
              ...member,
              email: member.email || undefined,
            })),
            permissions: [...project.permissions],
          });
        }}
      >
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          Team name
          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          Visibility
          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as "private" | "team" | "workspace-shared")
            }
            className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="private">Private</option>
            <option value="team">Team</option>
            <option value="workspace-shared">Workspace shared</option>
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          Default role
          <select
            value={defaultRole}
            onChange={(event) => setDefaultRole(event.target.value as KanbanCollaboratorRole)}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="owner">Owner</option>
            <option value="maintainer">Maintainer</option>
            <option value="contributor">Contributor</option>
            <option value="viewer">Viewer</option>
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          Workspace provisioning
          <select
            value={workspaceProvisioning}
            onChange={(event) =>
              setWorkspaceProvisioning(
                event.target.value as "owners-maintainers" | "contributors-and-up",
              )
            }
            className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="owners-maintainers">Owners and maintainers</option>
            <option value="contributors-and-up">Contributors and up</option>
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          Activity scope
          <select
            value={activityScope}
            onChange={(event) =>
              setActivityScope(
                event.target.value as "project-and-issues" | "all-board-entities",
              )
            }
            className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="project-and-issues">Project and issues</option>
            <option value="all-board-entities">All board entities</option>
          </select>
        </label>
        <label className="col-span-full flex items-center gap-2 text-sm text-foreground-muted">
          <input
            type="checkbox"
            checked={allowSelfAssign}
            onChange={(event) => setAllowSelfAssign(event.target.checked)}
            className="h-4 w-4 rounded border border-border"
          />
          Allow contributors to self-assign issues
        </label>
        <label className="col-span-full flex items-center gap-2 text-sm text-foreground-muted">
          <input
            type="checkbox"
            checked={reviewRequiredForDone}
            onChange={(event) => setReviewRequiredForDone(event.target.checked)}
            className="h-4 w-4 rounded border border-border"
          />
          Require review completion before cards can reach done
        </label>

        <div className="col-span-full rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4" />
              Team roster
            </div>
            <button
              type="button"
              onClick={() =>
                setMembers((current) => [
                  ...current,
                  {
                    id: `member-${current.length + 1}`,
                    displayName: "",
                    email: "",
                    role: defaultRole,
                  },
                ])
              }
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground"
            >
              <UserRoundPlus className="h-3.5 w-3.5" />
              Add member
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {members.map((member, index) => (
              <div key={`${member.id}-${index}`} className="grid gap-3 xl:grid-cols-[1fr_1fr_180px_auto]">
                <input
                  value={member.displayName}
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, displayName: event.target.value } : entry,
                      ),
                    )
                  }
                  placeholder="Display name"
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
                <input
                  value={member.email}
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, email: event.target.value } : entry,
                      ),
                    )
                  }
                  placeholder="email@example.com"
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
                <select
                  value={member.role}
                  onChange={(event) =>
                    setMembers((current) =>
                      current.map((entry, entryIndex) =>
                        entryIndex === index
                          ? { ...entry, role: event.target.value as KanbanCollaboratorRole }
                          : entry,
                      ),
                    )
                  }
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="owner">Owner</option>
                  <option value="maintainer">Maintainer</option>
                  <option value="contributor">Contributor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setMembers((current) => current.filter((_, entryIndex) => entryIndex !== index))
                  }
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-3 text-sm text-foreground-muted"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-full rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4" />
            Permission matrix
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {project.permissions.map((permission) => (
              <div key={permission.action} className="rounded-2xl border border-border bg-background p-3">
                <div className="text-sm font-semibold text-foreground">{permission.action}</div>
                <div className="mt-1 text-sm text-foreground-muted">{permission.description}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {permission.roles.map((role) => (
                    <span key={`${permission.action}-${role}`} className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
                      {roleLabel(role)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutating}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary disabled:opacity-50"
        >
          Save collaboration settings
        </button>
      </form>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Activity className="h-4 w-4" />
          Project activity
        </div>
        <div className="mt-3 space-y-3">
          {project.activity.slice(0, 4).map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-border bg-background px-3 py-3">
              <div className="flex items-center justify-between gap-3 text-xs text-foreground-muted">
                <span>{entry.actor.displayName}</span>
                <span>{formatActivity(entry.createdAt)}</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">{entry.summary}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface IssueCollaborationPanelProps {
  card: KanbanBoardCard;
  project: KanbanProject;
  activityEntries: KanbanProject["activity"];
  mutating: boolean;
  onSave: (input: { issueId: string; assigneeIds: string[]; collaboratorIds: string[] }) => Promise<void>;
}

function IssueCollaborationPanel({
  card,
  project,
  activityEntries,
  mutating,
  onSave,
}: IssueCollaborationPanelProps) {
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    project.team.members
      .filter((member) => card.assigneeNames.includes(member.displayName))
      .map((member) => member.id),
  );
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>(
    project.team.members
      .filter((member) => card.collaboratorNames.includes(member.displayName))
      .map((member) => member.id),
  );

  return (
    <div className="mt-4 rounded-2xl border border-border/80 bg-background/80 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Users className="h-4 w-4" />
        Collaboration
      </div>
      <div className="mt-2 text-sm text-foreground-muted">
        {card.assigneeNames.length} assignees, {card.collaboratorNames.length} collaborators,{" "}
        {card.activityCount} activity entries
      </div>
      <form
        className="mt-4 grid gap-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave({
            issueId: card.issueId,
            assigneeIds,
            collaboratorIds,
          });
        }}
      >
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Assignees
          </div>
          <div className="mt-3 space-y-2">
            {project.team.members.map((member) => (
              <label key={`assignee-${member.id}`} className="flex items-center gap-2 text-sm text-foreground-muted">
                <input
                  type="checkbox"
                  checked={assigneeIds.includes(member.id)}
                  onChange={(event) =>
                    setAssigneeIds((current) =>
                      event.target.checked
                        ? [...current, member.id]
                        : current.filter((id) => id !== member.id),
                    )
                  }
                  className="h-4 w-4 rounded border border-border"
                />
                <span className="text-foreground">{member.displayName}</span>
                <span className="text-xs text-foreground-muted">{roleLabel(member.role)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Collaborators
          </div>
          <div className="mt-3 space-y-2">
            {project.team.members.map((member) => (
              <label key={`collaborator-${member.id}`} className="flex items-center gap-2 text-sm text-foreground-muted">
                <input
                  type="checkbox"
                  checked={collaboratorIds.includes(member.id)}
                  onChange={(event) =>
                    setCollaboratorIds((current) =>
                      event.target.checked
                        ? [...current, member.id]
                        : current.filter((id) => id !== member.id),
                    )
                  }
                  className="h-4 w-4 rounded border border-border"
                />
                <span className="text-foreground">{member.displayName}</span>
                <span className="text-xs text-foreground-muted">{roleLabel(member.role)}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutating}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground disabled:opacity-50"
        >
          Save collaboration
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {card.assigneeNames.map((name) => (
          <span key={`assignee-chip-${name}`} className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
            Assignee {name}
          </span>
        ))}
        {card.collaboratorNames.map((name) => (
          <span key={`collaborator-chip-${name}`} className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
            Collaborator {name}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Activity className="h-4 w-4" />
          Issue activity
        </div>
        <div className="mt-3 space-y-2">
          {activityEntries.slice(0, 3).map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-border bg-background px-3 py-2">
              <div className="flex items-center justify-between gap-3 text-xs text-foreground-muted">
                <span>{entry.actor.displayName}</span>
                <span>{formatActivity(entry.createdAt)}</span>
              </div>
              <div className="mt-1 text-sm text-foreground">{entry.summary}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface IssueDispatchContextPanelProps {
  issue: KanbanIssue;
  dispatchContextLabels: readonly KanbanDispatchContextLabelDefinition[];
  mutating: boolean;
  onSave: (input: { issueId: string; dispatchContextLabelIds: string[] }) => Promise<void>;
}

function IssueDispatchContextPanel({
  issue,
  dispatchContextLabels,
  mutating,
  onSave,
}: IssueDispatchContextPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    issue.dispatch.contextLabels.map((ref) => ref.labelId),
  );

  useEffect(() => {
    setSelectedIds(issue.dispatch.contextLabels.map((ref) => ref.labelId));
  }, [issue.id, issue.dispatch.contextLabels]);

  return (
    <article
      className="rounded-2xl border border-border bg-background/80 p-4"
      data-testid="issue-dispatch-context-panel"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Dispatch Context Labels</div>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Attach reusable dispatch instructions here. These are not board labels, Task Tags, or
            default agent settings.
          </p>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
          {selectedIds.length} attached
        </span>
      </div>

      {dispatchContextLabels.length > 0 ? (
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave({
              issueId: issue.id,
              dispatchContextLabelIds: selectedIds,
            });
          }}
        >
          <div className="space-y-2">
            {dispatchContextLabels.map((contextLabel) => (
              <label
                key={contextLabel.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-card px-3 py-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(contextLabel.id)}
                  onChange={(event) =>
                    setSelectedIds((current) =>
                      event.target.checked
                        ? [...current, contextLabel.id]
                        : current.filter((id) => id !== contextLabel.id),
                    )
                  }
                  className="mt-1 h-4 w-4 rounded border border-border"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">{contextLabel.label}</span>
                  <span className="block text-xs text-foreground-muted">{contextLabel.key}</span>
                  {contextLabel.description ? (
                    <span className="mt-1 block text-xs leading-5 text-foreground-muted">
                      {contextLabel.description}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={mutating}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary disabled:opacity-50"
          >
            Save dispatch context
          </button>
        </form>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
          No reusable Dispatch Context Labels exist yet. Create definitions in Settings first, then
          attach them here by reference.
        </div>
      )}

      {(issue.dispatch.contextLabelProjections ?? []).length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {(issue.dispatch.contextLabelProjections ?? []).map((projection) => (
            <span
              key={`${issue.id}-${projection.labelId}`}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted"
            >
              {projection.key}
            </span>
          ))}
        </div>
      ) : null}

      {issue.dispatch.renderedContext ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-border bg-card px-3 py-3 text-xs text-foreground-secondary">
          {issue.dispatch.renderedContext}
        </pre>
      ) : (
        <div className="mt-4 text-xs text-foreground-muted">
          No dispatch context is currently rendered for this issue.
        </div>
      )}
    </article>
  );
}

interface RepositoryLifecyclePanelProps {
  card: KanbanBoardCard;
  mutating: boolean;
  onLinkRepository: (input: {
    issueId: string;
    provider?: KanbanIntegrationProvider;
    owner: string;
    name: string;
    branchName: string;
    defaultBranch?: string;
  }) => Promise<void>;
  onUpdateRepositorySettings: (input: {
    issueId: string;
    baseBranch: string;
    ciProvider?: string;
    publishTarget?: string;
    autoMerge: boolean;
    requiredApprovals: number;
  }) => Promise<void>;
  onCreatePullRequest: (input: {
    issueId: string;
    title: string;
    reviewers?: string;
  }) => Promise<void>;
}

function RepositoryLifecyclePanel({
  card,
  mutating,
  onLinkRepository,
  onUpdateRepositorySettings,
  onCreatePullRequest,
}: RepositoryLifecyclePanelProps) {
  const repository = card.repository;
  const lifecycle = card.repositoryLifecycle;
  const integration = lifecycle?.integration;
  const [owner, setOwner] = useState(repository?.owner ?? "a5c-ai");
  const [name, setName] = useState(repository?.name ?? "babysitter");
  const [provider, setProvider] = useState<KanbanIntegrationProvider>(
    repository?.provider === "azure-repos" ? "azure-repos" : "github",
  );
  const [branchName, setBranchName] = useState(
    lifecycle?.branchName ?? `feature/${card.issueKey.toLowerCase()}`,
  );
  const [defaultBranch, setDefaultBranch] = useState(repository?.defaultBranch ?? "main");
  const [baseBranch, setBaseBranch] = useState(repository?.settings.baseBranch ?? "main");
  const [ciProvider, setCiProvider] = useState(repository?.settings.ciProvider ?? "GitHub Actions");
  const [publishTarget, setPublishTarget] = useState(repository?.settings.publishTarget ?? "npm");
  const [requiredApprovals, setRequiredApprovals] = useState(
    repository?.settings.requiredApprovals ?? 1,
  );
  const [autoMerge, setAutoMerge] = useState(repository?.settings.autoMerge ?? false);
  const [pullRequestTitle, setPullRequestTitle] = useState(`${card.issueKey}: ${card.title}`);
  const [reviewers, setReviewers] = useState(
    lifecycle?.pullRequest?.reviewLinks.map((review) => review.reviewer ?? review.label).join(", ") ??
      "kanban-maintainers",
  );

  if (!repository || !lifecycle) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-border/80 bg-background/80 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FolderGit2 className="h-4 w-4" />
          Repository lifecycle
        </div>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          Link this work item to a shared repository context before opening a PR or surfacing CI,
          merge, and publish state.
        </p>
        <form
          className="mt-4 grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onLinkRepository({
              issueId: card.issueId,
              provider,
              owner,
              name,
              branchName,
              defaultBranch,
            });
          }}
        >
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Provider
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value === "azure-repos" ? "azure-repos" : "github")}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value="github">GitHub</option>
              <option value="azure-repos">Azure Repos</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Repo owner
            <input
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Repo name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Branch
            <input
              value={branchName}
              onChange={(event) => setBranchName(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Default branch
            <input
              value={defaultBranch}
              onChange={(event) => setDefaultBranch(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            />
          </label>
          <button
            type="submit"
            disabled={mutating}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary disabled:opacity-50"
          >
            Link repository
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-border/80 bg-background/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FolderGit2 className="h-4 w-4" />
            {repository.fullName}
          </div>
          <div className="mt-1 text-xs text-foreground-muted">
            Branch `{lifecycle.branchName}` into `{repository.settings.baseBranch}`
          </div>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
          {providerLabel(repository.provider)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-xs ${lifecycleTone(lifecycle.reviewStatus)}`}>
          Review {lifecycleLabel(lifecycle.reviewStatus)}
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-xs ${lifecycleTone(lifecycle.mergeStatus)}`}>
          Merge {lifecycleLabel(lifecycle.mergeStatus)}
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-xs ${lifecycleTone(lifecycle.publishStatus)}`}>
          Publish {lifecycleLabel(lifecycle.publishStatus)}
        </span>
        {integration ? (
          <>
            <span className={`rounded-full border px-2.5 py-1 text-xs ${integrationTone(integration.status)}`}>
              {providerLabel(integration.provider)} {integrationLabel(integration.status)}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
              PR {linkStateLabel(integration.linkState)}
            </span>
          </>
        ) : null}
      </div>

      {integration ? (
        <div className="mt-4 rounded-2xl border border-border bg-card/80 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Integration guidance
          </div>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{integration.guidance}</p>
          {integration.actions.reason ? (
            <div className="mt-3 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-sm text-warning">
              {integration.actions.reason}
            </div>
          ) : null}
          {integration.missingScopes?.length ? (
            <div className="mt-3 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-sm text-warning">
              Missing scopes: {integration.missingScopes.join(", ")}
            </div>
          ) : null}
        </div>
      ) : null}

      {lifecycle.pullRequest ? (
        <div className="mt-4 rounded-2xl border border-border bg-card/80 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            <GitBranch className="h-4 w-4" />
            PR #{lifecycle.pullRequest.number}
            <span className={`rounded-full border px-2.5 py-1 text-xs ${lifecycleTone(lifecycle.pullRequest.status)}`}>
              {lifecycleLabel(lifecycle.pullRequest.status)}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
              {linkStateLabel(lifecycle.pullRequest.linkState ?? "linked")}
            </span>
          </div>
          <div className="mt-2 text-sm text-foreground">{lifecycle.pullRequest.title}</div>
          {lifecycle.pullRequest.reviewLinks.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {lifecycle.pullRequest.reviewLinks.map((review) => (
                <span
                  key={review.id}
                  className={`rounded-full border px-2.5 py-1 text-xs ${reviewTone(review)}`}
                >
                  {review.label}: {lifecycleLabel(review.status)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <form
          className="mt-4 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
          onSubmit={(event) => {
            event.preventDefault();
            void onCreatePullRequest({
              issueId: card.issueId,
              title: pullRequestTitle,
              reviewers,
            });
          }}
        >
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            PR title
            <input
              value={pullRequestTitle}
              onChange={(event) => setPullRequestTitle(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Reviewers
            <input
              value={reviewers}
              onChange={(event) => setReviewers(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            />
          </label>
          <button
            type="submit"
            disabled={mutating || (integration ? !integration.actions.canCreatePullRequest : false)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary disabled:opacity-50"
          >
            Create PR
          </button>
        </form>
      )}

      {integration && !integration.actions.canCreatePullRequest && !lifecycle.pullRequest ? (
        <p className="mt-3 text-sm text-warning">
          Linked PR creation is disabled until {providerLabel(integration.provider)} setup issues are resolved.
        </p>
      ) : null}

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          CI gates
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {lifecycle.ciGates.map((gate) => (
            <span
              key={gate.id}
              className={`rounded-full border px-2.5 py-1 text-xs ${lifecycleTone(gate.status)}`}
            >
              {gate.name}: {lifecycleLabel(gate.status)}
            </span>
          ))}
        </div>
      </div>

      <form
        className="mt-4 grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void onUpdateRepositorySettings({
            issueId: card.issueId,
            baseBranch,
            ciProvider,
            publishTarget,
            autoMerge,
            requiredApprovals,
          });
        }}
      >
        <div className="col-span-full flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          <Settings className="h-4 w-4" />
          Repo settings
        </div>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          Base branch
          <input
            value={baseBranch}
            onChange={(event) => setBaseBranch(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          CI provider
          <input
            value={ciProvider}
            onChange={(event) => setCiProvider(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          Publish target
          <input
            value={publishTarget}
            onChange={(event) => setPublishTarget(event.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          Required approvals
          <input
            type="number"
            min={0}
            value={requiredApprovals}
            onChange={(event) => setRequiredApprovals(Number(event.target.value) || 0)}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          />
        </label>
        <label className="col-span-full flex items-center gap-2 text-sm text-foreground-muted">
          <input
            type="checkbox"
            checked={autoMerge}
            onChange={(event) => setAutoMerge(event.target.checked)}
            className="h-4 w-4 rounded border border-border"
          />
          Enable auto-merge when approvals and CI gates pass
        </label>
        <button
          type="submit"
          disabled={mutating}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground disabled:opacity-50"
        >
          Save repo settings
        </button>
      </form>
    </div>
  );
}

interface IssueDetailPanelProps {
  issue: KanbanIssue;
  card?: KanbanBoardCard;
  reviewArtifact?: KanbanReviewArtifact;
  project: KanbanProject;
  issues: readonly KanbanIssue[];
  dispatchContextLabels: readonly KanbanDispatchContextLabelDefinition[];
  taskTags: readonly KanbanTaskTag[];
  loading: boolean;
  mutating: boolean;
  mutationError?: {
    issueId: string;
    message: string;
  } | null;
  draft: IssueDetailDraft;
  fieldStates: IssueFieldStateMap;
  priorityEditing: boolean;
  assigneeEditing: boolean;
  labelEditing: boolean;
  onFocusIssue: (issue: KanbanIssue) => void;
  onOpenDedicatedPage: (issue: KanbanIssue) => void;
  onClose: () => void;
  onChangeDraft: (updater: (current: IssueDetailDraft) => IssueDetailDraft) => void;
  onResetDraft: () => void;
  onRetryDescriptionSave: () => void;
  onSaveField: (field: IssueDetailField) => void;
  onSetPriorityEditing: (editing: boolean) => void;
  onSetAssigneeEditing: (editing: boolean) => void;
  onSetLabelEditing: (editing: boolean) => void;
  onResetField: (field: Exclude<IssueDetailField, "description">) => void;
  onCreateSubIssue: (input: {
    parentIssueId: string;
    title: string;
    summary?: string;
    priority?: "critical" | "high" | "medium" | "low";
    status?: "backlog" | "ready" | "in-progress" | "blocked" | "review" | "done";
  }) => Promise<void>;
  onLinkChildIssue: (input: { parentIssueId: string; childIssueId: string }) => Promise<void>;
  onSaveDispatchContextLabels: (input: {
    issueId: string;
    dispatchContextLabelIds: string[];
  }) => Promise<void>;
  workspaceInventory: IssueWorkspaceInventoryState;
  onRefreshWorkspaceInventory: () => void;
  onCreateIssueWorkspace: (issue: KanbanIssue) => void;
  onLinkIssueWorkspace: (input: { issueId: string; workspacePath: string }) => Promise<void>;
  onOpenWorkspacePath: (workspacePath?: string) => void;
}

function IssueDetailPanel({
  issue,
  card,
  reviewArtifact,
  project,
  issues,
  dispatchContextLabels,
  taskTags,
  loading,
  mutating,
  mutationError,
  draft,
  fieldStates,
  priorityEditing,
  assigneeEditing,
  labelEditing,
  onFocusIssue,
  onOpenDedicatedPage,
  onClose,
  onChangeDraft,
  onResetDraft,
  onRetryDescriptionSave,
  onSaveField,
  onSetPriorityEditing,
  onSetAssigneeEditing,
  onSetLabelEditing,
  onResetField,
  onCreateSubIssue,
  onLinkChildIssue,
  onSaveDispatchContextLabels,
  workspaceInventory,
  onRefreshWorkspaceInventory,
  onCreateIssueWorkspace,
  onLinkIssueWorkspace,
  onOpenWorkspacePath,
}: IssueDetailPanelProps) {
  const issueById = new Map(issues.map((candidate) => [candidate.id, candidate] as const));
  const parentIssue = issue.parentIssueId ? issueById.get(issue.parentIssueId) : undefined;
  const childIssues = issue.childIssueIds
    .map((childIssueId) => issueById.get(childIssueId))
    .filter((candidate): candidate is KanbanIssue => Boolean(candidate));
  const descendants = collectDescendantIssueIds(issue, issueById);
  const ancestors = new Set<string>();
  let currentParentId = issue.parentIssueId;

  while (currentParentId) {
    ancestors.add(currentParentId);
    currentParentId = issueById.get(currentParentId)?.parentIssueId;
  }

  const linkableIssues = issues.filter(
    (candidate) =>
      candidate.projectId === issue.projectId &&
      candidate.id !== issue.id &&
      !issue.childIssueIds.includes(candidate.id) &&
      !descendants.has(candidate.id) &&
      !ancestors.has(candidate.id) &&
      !candidate.parentIssueId,
  );
  const dependencyOptions = issues.filter(
    (candidate) => candidate.projectId === issue.projectId && candidate.id !== issue.id,
  );

  const [childTitle, setChildTitle] = useState("");
  const [childSummary, setChildSummary] = useState("");
  const [childPriority, setChildPriority] = useState<"critical" | "high" | "medium" | "low">(
    "medium",
  );
  const [childStatus, setChildStatus] = useState<
    "backlog" | "ready" | "in-progress" | "blocked" | "review" | "done"
  >("backlog");
  const [selectedChildIssueId, setSelectedChildIssueId] = useState<string>(
    linkableIssues[0]?.id ?? "",
  );
  const [selectedDependencyIssueId, setSelectedDependencyIssueId] = useState<string>(
    dependencyOptions[0]?.id ?? "",
  );
  const [selectedDependencyType, setSelectedDependencyType] = useState<"blocks" | "blocked-by" | "related">(
    "blocked-by",
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const availableLabels = project.labels;
  const detailDirty = isIssueDraftDirty(draft, issue);
  const detailStale = detailDirty && draft.baseUpdatedAt !== issue.updatedAt;
  const relationshipError = mutationError?.issueId === issue.id ? mutationError.message : null;
  const linkedPullRequest = reviewArtifact?.linkedPullRequest;
  const ciGates = linkedPullRequest?.ciGates ?? card?.repositoryLifecycle?.ciGates ?? [];
  const recentReviewComments = [...(reviewArtifact?.comments ?? [])].slice(-2).reverse();
  const workspaceInventoryByPath = useMemo(
    () => new Map(workspaceInventory.items.map((workspace) => [workspace.path, workspace] as const)),
    [workspaceInventory.items],
  );
  const linkedWorkspaces = issue.workspaceLinks ?? [];
  const availableWorkspaceTargets = workspaceInventory.items.filter(
    (workspace) =>
      !workspace.missing &&
      !linkedWorkspaces.some((link) => link.workspacePath === workspace.path),
  );
  const [selectedWorkspacePath, setSelectedWorkspacePath] = useState<string>(
    availableWorkspaceTargets[0]?.path ?? "",
  );

  useEffect(() => {
    setSelectedChildIssueId((current) =>
      current && linkableIssues.some((candidate) => candidate.id === current)
        ? current
        : (linkableIssues[0]?.id ?? ""),
    );
  }, [linkableIssues]);

  useEffect(() => {
    setSelectedWorkspacePath((current) =>
      current && availableWorkspaceTargets.some((workspace) => workspace.path === current)
        ? current
        : (availableWorkspaceTargets[0]?.path ?? ""),
    );
  }, [availableWorkspaceTargets]);

  useEffect(() => {
    setSelectedDependencyIssueId((current) =>
      current && dependencyOptions.some((candidate) => candidate.id === current)
        ? current
        : (dependencyOptions[0]?.id ?? ""),
    );
  }, [dependencyOptions]);

  function insertDescriptionSnippet(snippet: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChangeDraft((current) => ({
        ...current,
        description: current.description ? `${current.description}\n${snippet}` : snippet,
      }));
      return;
    }

    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    onChangeDraft((current) => ({
      ...current,
      description: `${before}${snippet}${after}`,
    }));

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function renderDescriptionPreview(value: string) {
    if (!value.trim()) {
      return <p className="text-sm text-foreground-muted">No description authored yet.</p>;
    }

    return (
      <div className="space-y-2 text-sm leading-6 text-foreground">
        {value.split("\n").map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={`description-preview-${index}`} className="h-2" />;
          }
          if (trimmed.startsWith("# ")) {
            return (
              <div key={`description-preview-${index}`} className="text-lg font-semibold text-foreground">
                {trimmed.slice(2)}
              </div>
            );
          }
          if (trimmed.startsWith("- [ ] ")) {
            return (
              <div key={`description-preview-${index}`} className="flex items-start gap-2">
                <span className="mt-1 h-4 w-4 rounded border border-border" />
                <span>{trimmed.slice(6)}</span>
              </div>
            );
          }
          if (trimmed.startsWith("- ")) {
            return (
              <div key={`description-preview-${index}`} className="flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-foreground-muted" />
                <span>{trimmed.slice(2)}</span>
              </div>
            );
          }
          return <p key={`description-preview-${index}`}>{trimmed}</p>;
        })}
      </div>
    );
  }

  return (
    <aside className="rounded-3xl border border-border bg-card p-5 shadow-lg" data-testid="issue-detail-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
            Issue detail
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">{issue.key}</h3>
            <span className={`rounded-full border px-2.5 py-1 text-xs ${issueStatusTone(issue.status)}`}>
              {issueStatusLabel(issue.status)}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
              {issue.dispatch.readiness}
            </span>
          </div>
          <p className="mt-2 text-base font-semibold text-foreground">{issue.title}</p>
          {issue.summary ? (
            <p className="mt-2 text-sm leading-6 text-foreground-muted">{issue.summary}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
            <span className="rounded-full border border-border px-2.5 py-1">
              {issue.childIssueIds.length} child issues
            </span>
            <span className="rounded-full border border-border px-2.5 py-1">
              {issue.dependencies.length} dependencies
            </span>
            {card ? (
              <span className="rounded-full border border-border px-2.5 py-1">
                {stateLabel(card.workflowState)} context
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenDedicatedPage(issue)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground-muted"
        >
          Open page
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground-muted"
        >
          Close issue
        </button>
      </div>

      {detailStale ? (
        <div className="mt-4 rounded-2xl border border-warning/30 bg-warning-muted px-4 py-3 text-sm text-warning">
          Server state changed while unsaved edits were still open. Reset to the latest version or
          keep your local draft and retry after refreshing.
        </div>
      ) : null}

      {relationshipError ? (
        <div className="mt-4 rounded-2xl border border-error/30 bg-error-muted px-4 py-3 text-sm text-error">
          {relationshipError}
        </div>
      ) : null}

      <section className="mt-5 rounded-2xl border border-border bg-background/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Issue profile</div>
              <div className="mt-1 text-xs text-foreground-muted">
                Edit the core issue details here without leaving the planning flow.
              </div>
            </div>
          <div className="flex gap-2">
            {isIssueFieldDirty("metadata", draft, issue) ? (
              <button
                type="button"
                onClick={() => onResetField("metadata")}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground-muted"
              >
                Reset
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onSaveField("metadata")}
              disabled={!isIssueFieldDirty("metadata", draft, issue) || fieldStates.metadata.status === "saving"}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary disabled:opacity-50"
            >
              {fieldStates.metadata.status === "saving" ? "Saving…" : "Save profile"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Title
            <input
              value={draft.title}
              onChange={(event) =>
                onChangeDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            />
          </label>

          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Status
            <select
              value={draft.status}
              onChange={(event) =>
                onChangeDraft((current) => ({
                  ...current,
                  status: event.target.value as KanbanIssue["status"],
                }))
              }
              className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            >
              <option value="backlog">Backlog</option>
              <option value="ready">Ready</option>
              <option value="in-progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </label>
        </div>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
          Summary
          <TaskTagAutocompleteTextarea
            taskTags={taskTags}
            value={draft.summary}
            onValueChange={(summary) =>
              onChangeDraft((current) => ({
                ...current,
                summary,
              }))
            }
            className="mt-2"
            renderTextarea={(props) => (
              <textarea
                {...props}
                className="min-h-24 w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground"
              />
            )}
          />
        </label>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">Dependencies</div>
                <div className="mt-1 text-xs text-foreground-muted">
                  Link blockers and related work directly from the detail surface.
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <select
                value={selectedDependencyIssueId}
                onChange={(event) => setSelectedDependencyIssueId(event.target.value)}
                className="h-10 min-w-[180px] flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                {dependencyOptions.map((candidate) => (
                  <option key={`dependency-option-${candidate.id}`} value={candidate.id}>
                    {candidate.key} · {candidate.title}
                  </option>
                ))}
              </select>
              <select
                value={selectedDependencyType}
                onChange={(event) =>
                  setSelectedDependencyType(event.target.value as "blocks" | "blocked-by" | "related")
                }
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="blocked-by">Blocked by</option>
                <option value="blocks">Blocks</option>
                <option value="related">Related</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!selectedDependencyIssueId) {
                    return;
                  }
                  onChangeDraft((current) => {
                    if (
                      current.dependencies.some(
                        (dependency) =>
                          dependency.issueId === selectedDependencyIssueId &&
                          dependency.type === selectedDependencyType,
                      )
                    ) {
                      return current;
                    }
                    return {
                      ...current,
                      dependencies: [
                        ...current.dependencies,
                        {
                          issueId: selectedDependencyIssueId,
                          type: selectedDependencyType,
                        },
                      ],
                    };
                  });
                }}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
              >
                Add
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {draft.dependencies.length > 0 ? (
                draft.dependencies.map((dependency, index) => {
                  const dependencyIssue = issueById.get(dependency.issueId);
                  return (
                    <div
                      key={`dependency-draft-${dependency.issueId}-${dependency.type}-${index}`}
                      className="rounded-2xl border border-border bg-background px-3 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => dependencyIssue && onFocusIssue(dependencyIssue)}
                          className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                        >
                          {dependencyIssue?.key ?? dependency.issueId}
                        </button>
                        <span className="text-sm text-foreground-muted">
                          {dependencyIssue?.title ?? "Linked dependency"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <select
                          value={dependency.type}
                          onChange={(event) =>
                            onChangeDraft((current) => ({
                              ...current,
                              dependencies: current.dependencies.map((candidate, candidateIndex) =>
                                candidateIndex === index
                                  ? {
                                      ...candidate,
                                      type: event.target.value as "blocks" | "blocked-by" | "related",
                                    }
                                  : candidate,
                              ),
                            }))
                          }
                          className="h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                        >
                          <option value="blocked-by">Blocked by</option>
                          <option value="blocks">Blocks</option>
                          <option value="related">Related</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeDraft((current) => ({
                              ...current,
                              dependencies: current.dependencies.filter((_, candidateIndex) => candidateIndex !== index),
                            }))
                          }
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground-muted"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                  No dependencies configured.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">Acceptance criteria</div>
                <div className="mt-1 text-xs text-foreground-muted">
                  Criteria now stay editable instead of living only in seeded snapshots.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChangeDraft((current) => ({
                    ...current,
                    acceptanceCriteria: [
                      ...current.acceptanceCriteria,
                      { title: "", satisfied: false, notes: "" },
                    ],
                  }))
                }
                className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
              >
                Add criterion
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {draft.acceptanceCriteria.length > 0 ? (
                draft.acceptanceCriteria.map((criterion, index) => (
                  <div key={`criterion-draft-${criterion.id ?? index}`} className="rounded-2xl border border-border bg-background p-3">
                    <label className="flex items-center gap-2 text-sm text-foreground-muted">
                      <input
                        type="checkbox"
                        checked={criterion.satisfied}
                        onChange={(event) =>
                          onChangeDraft((current) => ({
                            ...current,
                            acceptanceCriteria: current.acceptanceCriteria.map((candidate, candidateIndex) =>
                              candidateIndex === index
                                ? { ...candidate, satisfied: event.target.checked }
                                : candidate,
                            ),
                          }))
                        }
                      />
                      Satisfied
                    </label>
                    <input
                      value={criterion.title}
                      onChange={(event) =>
                        onChangeDraft((current) => ({
                          ...current,
                          acceptanceCriteria: current.acceptanceCriteria.map((candidate, candidateIndex) =>
                            candidateIndex === index
                              ? { ...candidate, title: event.target.value }
                              : candidate,
                          ),
                        }))
                      }
                      placeholder="Describe the acceptance condition"
                      className="mt-3 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                    />
                    <input
                      value={criterion.notes}
                      onChange={(event) =>
                        onChangeDraft((current) => ({
                          ...current,
                          acceptanceCriteria: current.acceptanceCriteria.map((candidate, candidateIndex) =>
                            candidateIndex === index
                              ? { ...candidate, notes: event.target.value }
                              : candidate,
                          ),
                        }))
                      }
                      placeholder="Optional note"
                      className="mt-2 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          onChangeDraft((current) => ({
                            ...current,
                            acceptanceCriteria: current.acceptanceCriteria.filter(
                              (_, candidateIndex) => candidateIndex !== index,
                            ),
                          }))
                        }
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground-muted"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                  No acceptance criteria authored yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {fieldStates.metadata.message ? (
          <div
            className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
              fieldStates.metadata.status === "error"
                ? "border-error/30 bg-error-muted text-error"
                : "border-success/30 bg-success-muted text-success"
            }`}
          >
            {fieldStates.metadata.message}
          </div>
        ) : null}
      </section>

      <section className="mt-5 rounded-2xl border border-border bg-background/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">Description</div>
            <div className="mt-1 text-xs text-foreground-muted">
              The panel now behaves like an authoring surface, not a static summary.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs ${
                fieldStates.description.status === "error"
                  ? "border-error/25 bg-error-muted text-error"
                  : fieldStates.description.status === "saving"
                    ? "border-warning/25 bg-warning-muted text-warning"
                    : fieldStates.description.status === "saved"
                      ? "border-success/25 bg-success-muted text-success"
                      : "border-border text-foreground-muted"
              }`}
            >
              {fieldStates.description.status === "saving"
                ? "Autosaving"
                : fieldStates.description.status === "saved"
                  ? "Saved"
                  : fieldStates.description.status === "error"
                    ? "Recovery needed"
                    : detailDirty
                      ? "Local draft"
                      : "In sync"}
            </span>
            {detailDirty ? (
              <button
                type="button"
                onClick={onResetDraft}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground-muted"
              >
                Reset draft
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => insertDescriptionSnippet("# ")}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
          >
            Heading
          </button>
          <button
            type="button"
            onClick={() => insertDescriptionSnippet("- ")}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
          >
            Bullet
          </button>
          <button
            type="button"
            onClick={() => insertDescriptionSnippet("- [ ] ")}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
          >
            Checklist
          </button>
          <button
            type="button"
            onClick={() => insertDescriptionSnippet("```\n\n```")}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
          >
            Code
          </button>
          {fieldStates.description.status === "error" ? (
            <button
              type="button"
              onClick={onRetryDescriptionSave}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-error/30 bg-error-muted px-3 text-xs font-semibold text-error"
            >
              Retry save
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Editor
            <textarea
              ref={textareaRef}
              value={draft.description}
              onChange={(event) =>
                onChangeDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Describe the work, add checklists, and capture recovery notes."
              className="mt-2 min-h-40 w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground"
              data-testid="issue-description-editor"
            />
          </label>

          <div className="rounded-2xl border border-border bg-card p-4" data-testid="issue-description-preview">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
              Preview
            </div>
            <div className="mt-3">{renderDescriptionPreview(draft.description)}</div>
          </div>
        </div>

        {fieldStates.description.message ? (
          <div
            className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
              fieldStates.description.status === "error"
                ? "border-error/30 bg-error-muted text-error"
                : "border-success/30 bg-success-muted text-success"
            }`}
          >
            {fieldStates.description.message}
          </div>
        ) : null}
      </section>

      <div className="mt-5 grid gap-4">
        {reviewArtifact || card?.repositoryLifecycle ? (
          <article className="rounded-2xl border border-border bg-background/80 p-4">
            <div>
              <div className="text-sm font-semibold text-foreground">Review and PR context</div>
              <div className="mt-1 text-xs text-foreground-muted">
                Shared review output and linked PR state stay visible on the active issue, not only in the queue panel.
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {reviewArtifact ? (
                <span className={`rounded-full border px-2.5 py-1 ${lifecycleTone(reviewArtifact.decision)}`}>
                  Review {reviewArtifact.decision}
                </span>
              ) : null}
              <span className={`rounded-full border px-2.5 py-1 ${lifecycleTone(linkedPullRequest?.reviewStatus ?? card?.repositoryLifecycle?.reviewStatus ?? "unlinked")}`}>
                PR review {linkedPullRequest?.reviewStatus ?? card?.repositoryLifecycle?.reviewStatus ?? "unlinked"}
              </span>
              <span className={`rounded-full border px-2.5 py-1 ${lifecycleTone(linkedPullRequest?.mergeStatus ?? card?.repositoryLifecycle?.mergeStatus ?? "not-ready")}`}>
                Merge {linkedPullRequest?.mergeStatus ?? card?.repositoryLifecycle?.mergeStatus ?? "not-ready"}
              </span>
              <span className={`rounded-full border px-2.5 py-1 ${lifecycleTone(linkedPullRequest?.publishStatus ?? card?.repositoryLifecycle?.publishStatus ?? "not-ready")}`}>
                Publish {linkedPullRequest?.publishStatus ?? card?.repositoryLifecycle?.publishStatus ?? "not-ready"}
              </span>
            </div>

            {linkedPullRequest?.title || card?.repositoryLifecycle?.pullRequest?.title ? (
              <div className="mt-3 rounded-2xl border border-border bg-card px-4 py-3">
                <div className="text-sm font-medium text-foreground">
                  {linkedPullRequest?.title ?? card?.repositoryLifecycle?.pullRequest?.title}
                </div>
                <div className="mt-1 text-xs text-foreground-muted">
                  {linkedPullRequest
                    ? `${providerLabel(linkedPullRequest.provider)} PR ${linkedPullRequest.number ? `#${linkedPullRequest.number}` : ""}`
                    : card?.repositoryLifecycle?.pullRequest
                      ? `PR #${card.repositoryLifecycle.pullRequest.number}`
                      : "Linked PR"}
                </div>
              </div>
            ) : null}

            {ciGates.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {ciGates.map((gate) => (
                  <span key={`issue-detail-${gate.id}`} className={`rounded-full border px-2.5 py-1 ${lifecycleTone(gate.status)}`}>
                    {gate.name}: {lifecycleLabel(gate.status)}
                  </span>
                ))}
              </div>
            ) : null}

            {recentReviewComments.length > 0 ? (
              <div className="mt-3 space-y-2">
                {recentReviewComments.map((comment) => (
                  <div key={`issue-review-${comment.id}`} className="rounded-xl border border-border bg-card px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
                      <span>{comment.author.name}</span>
                      <span>{comment.anchor.filePath}</span>
                      <span>{comment.anchor.side}:{comment.anchor.line}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{comment.body}</p>
                  </div>
                ))}
              </div>
            ) : reviewArtifact ? (
              <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                No review comments have been mapped back to this issue yet.
              </div>
            ) : null}
          </article>
        ) : null}

        <article className="rounded-2xl border border-border bg-background/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Priority</div>
              <div className="mt-1 text-xs text-foreground-muted">
                Field-level save keeps rank changes separate from editor autosave.
              </div>
            </div>
            <div className="flex gap-2">
              {!priorityEditing ? (
                <button
                  type="button"
                  onClick={() => onSetPriorityEditing(true)}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSaveField("priority")}
                    disabled={!isIssueFieldDirty("priority", draft, issue) || fieldStates.priority.status === "saving"}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary disabled:opacity-50"
                  >
                    {fieldStates.priority.status === "saving" ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetField("priority");
                      onSetPriorityEditing(false);
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground-muted"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
              Loading priority controls…
            </div>
          ) : priorityEditing ? (
            <div className="mt-3">
              <select
                aria-label="Issue priority"
                value={draft.priority}
                onChange={(event) =>
                  onChangeDraft((current) => ({
                    ...current,
                    priority: event.target.value as KanbanIssue["priority"],
                  }))
                }
                className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground">
              {issue.priority}
            </div>
          )}

          {fieldStates.priority.message ? (
            <div
              className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                fieldStates.priority.status === "error"
                  ? "border-error/30 bg-error-muted text-error"
                  : "border-success/30 bg-success-muted text-success"
              }`}
            >
              {fieldStates.priority.message}
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-border bg-background/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Assignees</div>
              <div className="mt-1 text-xs text-foreground-muted">
                Empty, loading, edit, and error states stay explicit.
              </div>
            </div>
            <div className="flex gap-2">
              {!assigneeEditing ? (
                <button
                  type="button"
                  onClick={() => onSetAssigneeEditing(true)}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSaveField("assignees")}
                    disabled={!isIssueFieldDirty("assignees", draft, issue) || fieldStates.assignees.status === "saving"}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary disabled:opacity-50"
                  >
                    {fieldStates.assignees.status === "saving" ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetField("assignees");
                      onSetAssigneeEditing(false);
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground-muted"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
              Loading assignee options…
            </div>
          ) : assigneeEditing ? (
            <div className="mt-3 space-y-2" data-testid="issue-assignee-edit">
              {project.team.members.map((member) => (
                <label key={`issue-assignee-${member.id}`} className="flex items-center gap-2 text-sm text-foreground-muted">
                  <input
                    type="checkbox"
                    checked={draft.assigneeIds.includes(member.id)}
                    onChange={() =>
                      onChangeDraft((current) => ({
                        ...current,
                        assigneeIds: toggleId(current.assigneeIds, member.id),
                      }))
                    }
                  />
                  <span>{member.displayName}</span>
                </label>
              ))}
            </div>
          ) : issue.assignees.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {issue.assignees.map((assignee) => (
                <span
                  key={`issue-assignee-chip-${assignee.id}`}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted"
                >
                  {assignee.displayName}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted" data-testid="issue-assignee-empty">
              No assignees yet.
            </div>
          )}

          {fieldStates.assignees.message ? (
            <div
              className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                fieldStates.assignees.status === "error"
                  ? "border-error/30 bg-error-muted text-error"
                  : "border-success/30 bg-success-muted text-success"
              }`}
            >
              {fieldStates.assignees.message}
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-border bg-background/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Tags</div>
              <div className="mt-1 text-xs text-foreground-muted">
                Shared project labels now behave like editable issue tags from the side panel.
              </div>
            </div>
            {availableLabels.length > 0 ? (
              <div className="flex gap-2">
                {!labelEditing ? (
                  <button
                    type="button"
                    onClick={() => onSetLabelEditing(true)}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSaveField("labels")}
                      disabled={!isIssueFieldDirty("labels", draft, issue) || fieldStates.labels.status === "saving"}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary disabled:opacity-50"
                    >
                      {fieldStates.labels.status === "saving" ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onResetField("labels");
                        onSetLabelEditing(false);
                      }}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground-muted"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
              Loading tag controls…
            </div>
          ) : availableLabels.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted" data-testid="issue-tags-empty">
              No project tags configured yet.
            </div>
          ) : labelEditing ? (
            <div className="mt-3 space-y-2" data-testid="issue-tags-edit">
              {availableLabels.map((label) => (
                <label key={`issue-label-${label.id}`} className="flex items-center gap-2 text-sm text-foreground-muted">
                  <input
                    type="checkbox"
                    checked={draft.labelIds.includes(label.id)}
                    onChange={() =>
                      onChangeDraft((current) => ({
                        ...current,
                        labelIds: toggleId(current.labelIds, label.id),
                      }))
                    }
                  />
                  <span>{label.name}</span>
                </label>
              ))}
            </div>
          ) : issue.labels.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {issue.labels.map((label) => (
                <span
                  key={`issue-label-chip-${label.id}`}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted"
                >
                  <Tag className="h-3.5 w-3.5" />
                  {label.name}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
              No tags applied to this issue.
            </div>
          )}

          {fieldStates.labels.message ? (
            <div
              className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${
                fieldStates.labels.status === "error"
                  ? "border-error/30 bg-error-muted text-error"
                  : "border-success/30 bg-success-muted text-success"
              }`}
            >
              {fieldStates.labels.message}
            </div>
          ) : null}
        </article>

        <IssueDispatchContextPanel
          issue={issue}
          dispatchContextLabels={dispatchContextLabels}
          mutating={mutating}
          onSave={onSaveDispatchContextLabels}
        />
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-background/80 p-4" data-testid="issue-workspace-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <FolderGit2 className="h-4 w-4" />
              Linked workspaces
            </div>
            <div className="mt-1 text-xs text-foreground-muted">
              Create a new execution workspace from this issue or attach one or more existing workspaces.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCreateIssueWorkspace(issue)}
              disabled={mutating}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Create workspace
            </button>
            <button
              type="button"
              onClick={onRefreshWorkspaceInventory}
              disabled={workspaceInventory.loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold text-foreground-muted disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {workspaceInventory.loading ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted" data-testid="issue-workspace-loading">
            Loading workspace association state…
          </div>
        ) : null}

        {workspaceInventory.error ? (
          <div className="mt-3 rounded-2xl border border-error/25 bg-error-muted p-3 text-sm text-error" data-testid="issue-workspace-error">
            {workspaceInventory.error}
          </div>
        ) : null}

        {linkedWorkspaces.length > 0 ? (
          <div className="mt-4 space-y-3" data-testid="linked-workspaces-list">
            {linkedWorkspaces.map((workspaceLink) => {
              const workspace = workspaceInventoryByPath.get(workspaceLink.workspacePath);
              const workspaceState = workspace?.status ?? "stale-link";
              return (
                <div key={`${issue.id}-${workspaceLink.workspacePath}`} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{workspaceLink.workspaceName}</span>
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${workspaceLifecycleTone(workspaceState)}`}>
                          {workspaceState === "stale-link" ? "stale link" : workspaceState}
                        </span>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
                          {workspaceLink.source === "created-from-issue" ? "created from issue" : "linked existing workspace"}
                        </span>
                      </div>
                      <div className="mt-2 font-mono text-xs text-foreground-muted">{workspaceLink.workspacePath}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-foreground-muted">
                        {workspaceLink.branchName ? (
                          <span className="rounded-full border border-border px-2.5 py-1">{workspaceLink.branchName}</span>
                        ) : null}
                        <span className="rounded-full border border-border px-2.5 py-1">
                          Linked {formatActivity(workspaceLink.linkedAt)}
                        </span>
                        {workspace?.issues && workspace.issues.length > 1 ? (
                          <span className="rounded-full border border-border px-2.5 py-1">
                            {workspace.issues.length} issue associations
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {workspace ? (
                      <button
                        type="button"
                        onClick={() => onOpenWorkspacePath(workspace.path)}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
                        data-testid={`open-workspace-${workspace.path}`}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        Open workspace
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenWorkspacePath()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
                        data-testid={`recover-workspace-${workspaceLink.workspacePath}`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Open workspaces
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !workspaceInventory.loading ? (
          <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted" data-testid="issue-workspace-empty">
            No workspaces are linked to this issue yet.
          </div>
        ) : null}

        <form
          className="mt-4 rounded-2xl border border-border bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selectedWorkspacePath) {
              return;
            }
            void onLinkIssueWorkspace({
              issueId: issue.id,
              workspacePath: selectedWorkspacePath,
            }).then(() => onRefreshWorkspaceInventory());
          }}
          data-testid="link-workspace-form"
        >
          <div className="text-sm font-semibold text-foreground">Link existing workspace</div>
          {availableWorkspaceTargets.length > 0 ? (
            <>
              <select
                aria-label="Existing workspace"
                value={selectedWorkspacePath}
                onChange={(event) => setSelectedWorkspacePath(event.target.value)}
                className="mt-3 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                {availableWorkspaceTargets.map((workspace) => (
                  <option key={workspace.path} value={workspace.path}>
                    {workspace.name} - {workspace.path}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={mutating || !selectedWorkspacePath}
                className="mt-3 inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground disabled:opacity-50"
              >
                Link workspace
              </button>
            </>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted" data-testid="link-workspace-empty">
              Every available workspace is already attached or waiting on recovery.
            </div>
          )}
        </form>
      </section>

      <section className="mt-5 rounded-2xl border border-border bg-background/80 p-4" data-testid="issue-relationship-panel">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Workflow className="h-4 w-4" />
          Parent and child issue flow
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-4" data-testid="parent-relationship-section">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Parent issue
            </div>
            {loading ? (
              <div
                className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted"
                data-testid="parent-relationship-loading"
              >
                Refreshing parent relationship state…
              </div>
            ) : relationshipError ? (
              <div
                className="mt-3 rounded-2xl border border-error/25 bg-error-muted p-3 text-sm text-error"
                data-testid="parent-relationship-error"
              >
                {relationshipError}
              </div>
            ) : parentIssue ? (
              <div className="mt-3 rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onFocusIssue(parentIssue)}
                    className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                    data-testid={`back-to-parent-${parentIssue.key}`}
                  >
                    Back to {parentIssue.key}
                  </button>
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${issueStatusTone(parentIssue.status)}`}>
                    {issueStatusLabel(parentIssue.status)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-foreground">{parentIssue.title}</div>
                <div className="mt-2 text-xs text-foreground-muted">
                  Parent readiness: {parentIssue.dispatch.readiness}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted" data-testid="parent-relationship-empty">
                No parent issue linked.
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-border bg-card p-4" data-testid="child-relationship-section">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Workflow className="h-4 w-4" />
              Child issues
            </div>
            {loading ? (
              <div
                className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted"
                data-testid="child-relationship-loading"
              >
                Refreshing child relationship state…
              </div>
            ) : relationshipError ? (
              <div
                className="mt-3 rounded-2xl border border-error/25 bg-error-muted p-3 text-sm text-error"
                data-testid="child-relationship-error"
              >
                {relationshipError}
              </div>
            ) : childIssues.length > 0 ? (
              <div className="mt-3 space-y-3">
                {childIssues.map((childIssue) => (
                  <div key={childIssue.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onFocusIssue(childIssue)}
                        className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                        data-testid={`child-nav-${childIssue.key}`}
                      >
                        {childIssue.key}
                      </button>
                      <span className={`rounded-full border px-2.5 py-1 text-xs ${issueStatusTone(childIssue.status)}`}>
                        {issueStatusLabel(childIssue.status)}
                      </span>
                      <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
                        {childIssue.dispatch.readiness}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-foreground">{childIssue.title}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted" data-testid="child-relationship-empty">
                No child issues linked yet.
              </div>
            )}

            <form
              className="mt-4 grid gap-3 rounded-2xl border border-border bg-background p-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!childTitle.trim()) {
                  return;
                }
                void onCreateSubIssue({
                  parentIssueId: issue.id,
                  title: childTitle,
                  summary: childSummary || undefined,
                  priority: childPriority,
                  status: childStatus,
                })
                  .then(() => {
                    setChildTitle("");
                    setChildSummary("");
                    setChildPriority("medium");
                    setChildStatus("backlog");
                  })
                  .catch(() => undefined);
              }}
              data-testid="create-sub-issue-form"
            >
              <div className="text-sm font-semibold text-foreground">Create sub-issue</div>
              <input
                aria-label="Sub-issue title"
                value={childTitle}
                onChange={(event) => setChildTitle(event.target.value)}
                placeholder="Break out a child issue"
                className="h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground"
              />
              <TaskTagAutocompleteTextarea
                taskTags={taskTags}
                value={childSummary}
                onValueChange={setChildSummary}
                className="min-h-24"
                renderTextarea={(props) => (
                  <textarea
                    {...props}
                    aria-label="Sub-issue summary"
                    placeholder="Optional context for the child issue"
                    className="min-h-24 rounded-xl border border-border bg-card px-3 py-3 text-sm text-foreground"
                  />
                )}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                  Priority
                  <select
                    aria-label="Sub-issue priority"
                    value={childPriority}
                    onChange={(event) =>
                      setChildPriority(
                        event.target.value as "critical" | "high" | "medium" | "low",
                      )
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                  Initial status
                  <select
                    aria-label="Sub-issue status"
                    value={childStatus}
                    onChange={(event) =>
                      setChildStatus(
                        event.target.value as
                          | "backlog"
                          | "ready"
                          | "in-progress"
                          | "blocked"
                          | "review"
                          | "done",
                      )
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="ready">Ready</option>
                    <option value="in-progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </label>
              </div>
              <button
                type="submit"
                disabled={mutating}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary disabled:opacity-50"
              >
                Create child issue
              </button>
            </form>

            <form
              className="mt-4 rounded-2xl border border-border bg-background p-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!selectedChildIssueId) {
                  return;
                }
                void onLinkChildIssue({
                  parentIssueId: issue.id,
                  childIssueId: selectedChildIssueId,
                }).catch(() => undefined);
              }}
              data-testid="link-child-issue-form"
            >
              <div className="text-sm font-semibold text-foreground">Link existing child issue</div>
              {linkableIssues.length > 0 ? (
                <>
                  <select
                    aria-label="Existing child issue"
                    value={selectedChildIssueId}
                    onChange={(event) => setSelectedChildIssueId(event.target.value)}
                    className="mt-3 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  >
                    {linkableIssues.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.key} - {candidate.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={mutating}
                    className="mt-3 inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground disabled:opacity-50"
                  >
                    Link child issue
                  </button>
                </>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted" data-testid="link-child-issue-empty">
                  No unparented sibling issues are available to link here.
                </div>
              )}
            </form>
          </article>
        </div>
      </section>
    </aside>
  );
}

export function BacklogOverview({
  projectId: requestedProjectId,
  routeBasePath,
  forcedPresentation,
  routeMode = "board",
  initialIssueId,
  initialIssueKey,
  initialProjectId,
}: BacklogOverviewProps = {}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { taskTags } = useTaskTags();
  const {
    snapshot,
    board,
    summary,
    loading,
    error,
    moveIssue,
    linkRepository,
    updateRepositorySettings,
    createPullRequest,
    createIssue,
    updateProjectCollaboration,
    updateIssueCollaboration,
    updateIssueDispatchContextLabels,
    createSubIssue,
    linkChildIssue,
    updateIssueDetail,
    createIssueWorkspace,
    linkIssueWorkspace,
    movingIssueId,
    mutatingIssueId,
    creatingIssue,
    mutationError,
    refresh,
  } = useBacklog();
  const issueReviews = useReviews({ targetType: "issue" });
  const issueArtifactById = useMemo(
    () => new Map(issueReviews.artifacts.map((artifact) => [artifact.targetId, artifact] as const)),
    [issueReviews.artifacts],
  );
  const focusedIssueId =
    routeMode === "board" ? searchParams.get("issueId") : (initialIssueId ?? null);
  const focusedIssueKey =
    routeMode === "board" ? searchParams.get("issueKey") : (initialIssueKey ?? null);
  const stateScopeKey = requestedProjectId ?? initialProjectId ?? "default";
  const [persistedPresentation, setPersistedPresentation] = usePersistedState<BoardPresentation>(
    "backlog-presentation",
    "board",
  );
  const presentation = forcedPresentation ?? persistedPresentation;
  const [searchTerm, setSearchTerm] = usePersistedState(`kanban-search-${stateScopeKey}`, "");
  const [workflowFilter, setWorkflowFilter] = usePersistedState<
    KanbanWorkflowState | "all"
  >(`kanban-workflow-filter-${stateScopeKey}`, "all");
  const [readinessFilter, setReadinessFilter] = usePersistedState<
    KanbanBoardCard["readiness"] | "all"
  >(`kanban-readiness-filter-${stateScopeKey}`, "all");
  const [assigneeFilter, setAssigneeFilter] = usePersistedState(`kanban-assignee-filter-${stateScopeKey}`, "all");
  const [tagFilter, setTagFilter] = usePersistedState(`kanban-tag-filter-${stateScopeKey}`, "all");
  const [sortMode, setSortMode] = usePersistedState<PlanningSortMode>(
    `kanban-sort-mode-${stateScopeKey}`,
    "board-order",
  );
  const [showEmptySwimlanes, setShowEmptySwimlanes] = usePersistedState(
    `kanban-show-empty-swimlanes-${stateScopeKey}`,
    false,
  );
  const [showPolicySignals, setShowPolicySignals] = usePersistedState(
    `kanban-show-policy-signals-v2-${stateScopeKey}`,
    false,
  );
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [bulkTargetState, setBulkTargetState] = useState<KanbanWorkflowState>("in-progress");
  const [bulkPending, setBulkPending] = useState<null | "move" | "workspace">(null);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<CreateModeState | null>(
    routeMode === "create" ? { source: "header", workflowState: "todo" } : null,
  );
  const [draft, setDraft] = usePersistedState<CreateIssueDraft>(
    "board-create-draft",
    createEmptyDraft(),
  );
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [createError, setCreateError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createNotice, setCreateNotice] = useState<string | null>(null);
  const [issueDrafts, setIssueDrafts] = usePersistedState<Record<string, IssueDetailDraft>>(
    "issue-detail-drafts",
    {},
  );
  const [issueFieldStates, setIssueFieldStates] = useState<IssueFieldStateMap>(
    createIssueFieldStateMap(),
  );
  const [priorityEditing, setPriorityEditing] = useState(false);
  const [assigneeEditing, setAssigneeEditing] = useState(false);
  const [labelEditing, setLabelEditing] = useState(false);
  const [workspaceInventory, setWorkspaceInventory] = useState<IssueWorkspaceInventoryState>({
    items: [],
    loading: false,
    error: null,
  });
  const previousFocusedIssueIdRef = useRef<string | null>(null);

  useEffect(() => {
    const issueAnchor = focusedIssueId
      ? document.getElementById(`kanban-issue-${focusedIssueId}`)
      : focusedIssueKey
        ? document.querySelector<HTMLElement>(`[data-testid="kanban-card-${focusedIssueKey}"]`)
        : null;

    if (!issueAnchor) {
      return;
    }

    if (typeof issueAnchor.scrollIntoView === "function") {
      issueAnchor.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusedIssueId, focusedIssueKey]);

  useEffect(() => {
    if (!createMode) {
      return;
    }

    const baselineDraft = createEmptyDraft(createMode.workflowState);
    const isPristineDraft =
      draft.title === baselineDraft.title &&
      draft.summary === baselineDraft.summary &&
      draft.description === baselineDraft.description &&
      draft.workflowState === baselineDraft.workflowState &&
      draft.status === baselineDraft.status &&
      draft.priority === baselineDraft.priority &&
      arraysEqual(draft.assigneeIds, baselineDraft.assigneeIds) &&
      arraysEqual(draft.labelIds, baselineDraft.labelIds) &&
      dependenciesEqual(draft.dependencies, baselineDraft.dependencies) &&
      acceptanceCriteriaEqual(draft.acceptanceCriteria, baselineDraft.acceptanceCriteria);

    if (isPristineDraft) {
      setAutosaveStatus("idle");
      return;
    }

    setAutosaveStatus("saving");
    const timeout = window.setTimeout(() => {
      setAutosaveStatus("saved");
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [
    createMode,
    draft.acceptanceCriteria,
    draft.assigneeIds,
    draft.dependencies,
    draft.description,
    draft.labelIds,
    draft.priority,
    draft.status,
    draft.summary,
    draft.title,
    draft.workflowState,
  ]);

  const issueById = new Map((snapshot?.issues ?? []).map((issue) => [issue.id, issue] as const));
  const focusedIssue =
    (focusedIssueId ? issueById.get(focusedIssueId) : undefined) ??
    (focusedIssueKey ? snapshot?.issues.find((issue) => issue.key === focusedIssueKey) : undefined);
  const primaryProject =
    (requestedProjectId
      ? snapshot?.projects.find((candidate) => candidate.id === requestedProjectId)
      : undefined) ??
    (initialProjectId
      ? snapshot?.projects.find((candidate) => candidate.id === initialProjectId)
      : undefined) ??
    (focusedIssue
      ? snapshot?.projects.find((candidate) => candidate.id === focusedIssue.projectId)
      : undefined) ??
    snapshot?.projects[0];
  const primaryBoard = primaryProject
    ? board?.projects.find((candidate) => candidate.projectId === primaryProject.id)
    : undefined;
  const focusedIssueCard =
    focusedIssue && primaryBoard
      ? primaryBoard.cards.find((candidate) => candidate.issueId === focusedIssue.id)
      : undefined;
  const focusedIssueDraft = focusedIssue
    ? issueDrafts[focusedIssue.id] ?? createIssueDetailDraft(focusedIssue)
    : null;
  const targetModelIssue =
    snapshot?.issues.find((issue) => issue.key === "KANBAN-GAP-004") ??
    snapshot?.issues.find((issue) => issue.key === "KANBAN-DEBT-003");
  const normalizedSearchTerm = normalizeSearchValue(searchTerm);

  useEffect(() => {
    const nextFocusedIssueId = focusedIssue?.id ?? null;
    if (previousFocusedIssueIdRef.current === nextFocusedIssueId) {
      return;
    }
    previousFocusedIssueIdRef.current = nextFocusedIssueId;
    setIssueFieldStates(createIssueFieldStateMap());
    setPriorityEditing(false);
    setAssigneeEditing(false);
    setLabelEditing(false);
  }, [focusedIssue?.id]);

  useEffect(() => {
    if (!focusedIssue) {
      return;
    }

    setIssueDrafts((current) => {
      const existing = current[focusedIssue.id];
      const nextDraft = createIssueDetailDraft(focusedIssue);
      if (!existing) {
        return {
          ...current,
          [focusedIssue.id]: nextDraft,
        };
      }
      if (!isIssueDraftDirty(existing, focusedIssue)) {
        return {
          ...current,
          [focusedIssue.id]: nextDraft,
        };
      }
      return current;
    });
  }, [focusedIssue, setIssueDrafts]);

  useEffect(() => {
    if (!focusedIssue || !focusedIssueDraft) {
      return;
    }
    if (
      !isIssueFieldDirty("description", focusedIssueDraft, focusedIssue) ||
      focusedIssueDraft.baseUpdatedAt !== focusedIssue.updatedAt
    ) {
      return;
    }

    setIssueFieldStates((current) => ({
      ...current,
      description: { status: "saving", message: null },
    }));
    const timeout = window.setTimeout(() => {
      void saveIssueField("description");
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [focusedIssue, focusedIssueDraft]);

  useEffect(() => {
    if (!focusedIssue) {
      return;
    }

    let cancelled = false;
    setWorkspaceInventory((current) => ({ ...current, loading: true, error: null }));
    void loadIssueWorkspaceInventory()
      .then((payload) => {
        if (!cancelled) {
          setWorkspaceInventory({
            items: [...payload.workspaces],
            loading: false,
            error: null,
          });
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setWorkspaceInventory({
            items: [],
            loading: false,
            error: cause instanceof Error ? cause.message : String(cause),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [focusedIssue?.id]);

  const boardCards = primaryBoard
    ? primaryBoard.swimlanes.flatMap((swimlane) =>
        workflowOrder.flatMap((state) => findCardsForCell(primaryBoard, swimlane.id, state)),
      )
    : [];
  const boardIndexByIssueId = new Map(boardCards.map((card, index) => [card.issueId, index] as const));
  const visibleCards = boardCards
    .filter((card) => {
      const issue = issueById.get(card.issueId);
      if (!issue) {
        return false;
      }
      if (workflowFilter !== "all" && card.workflowState !== workflowFilter) {
        return false;
      }
      if (readinessFilter !== "all" && card.readiness !== readinessFilter) {
        return false;
      }
      if (assigneeFilter !== "all" && !issue.assignees.some((assignee) => assignee.id === assigneeFilter)) {
        return false;
      }
      if (tagFilter !== "all" && !issue.labels.some((label) => label.id === tagFilter)) {
        return false;
      }
      if (normalizedSearchTerm.length > 0 && !buildCardSearchDocument(card, issue).includes(normalizedSearchTerm)) {
        return false;
      }
      return true;
    })
    .slice()
    .sort((left, right) => {
      if (sortMode === "priority") {
        return (
          priorityRank(left.priority) - priorityRank(right.priority) ||
          (boardIndexByIssueId.get(left.issueId) ?? 0) - (boardIndexByIssueId.get(right.issueId) ?? 0)
        );
      }
      if (sortMode === "activity") {
        return (
          Date.parse(right.latestActivityAt ?? "") - Date.parse(left.latestActivityAt ?? "") ||
          (boardIndexByIssueId.get(left.issueId) ?? 0) - (boardIndexByIssueId.get(right.issueId) ?? 0)
        );
      }
      if (sortMode === "title") {
        return left.title.localeCompare(right.title) || left.issueKey.localeCompare(right.issueKey);
      }
      return (boardIndexByIssueId.get(left.issueId) ?? 0) - (boardIndexByIssueId.get(right.issueId) ?? 0);
    });
  const visibleCardIds = new Set(visibleCards.map((card) => card.issueId));
  const visibleIssueIdsKey = visibleCards.map((card) => card.issueId).join("|");
  const selectedCards = visibleCards.filter((card) => selectedIssueIds.includes(card.issueId));
  const allVisibleSelected = visibleCards.length > 0 && visibleCards.every((card) => selectedIssueIds.includes(card.issueId));
  const selectableAssignees = primaryProject?.team.members ?? [];
  const selectableTags = primaryProject?.labels ?? [];
  const activeFilterCount = [
    workflowFilter !== "all",
    readinessFilter !== "all",
    assigneeFilter !== "all",
    tagFilter !== "all",
    normalizedSearchTerm.length > 0,
  ].filter(Boolean).length;

  const currentSurfacePath = routeBasePath ? `${routeBasePath}/${presentation}` : "/";
  const bulkTargetOptions = workflowOrder.filter((state) =>
    selectedCards.every((card) => card.moveTargets.some((target) => target.state === state)),
  );

  useEffect(() => {
    setSelectedIssueIds((current) => {
      const next = current.filter((issueId) => visibleCardIds.has(issueId));
      return next.length === current.length ? current : next;
    });
  }, [visibleIssueIdsKey]);

  if (loading && !snapshot) {
    return (
      <section
        className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-lg"
        data-testid="backlog-overview-loading"
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-36 rounded bg-background-secondary" />
          <div className="h-8 w-80 rounded bg-background-secondary" />
          <div className="grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 rounded-2xl bg-background-secondary" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !snapshot || !summary || !board) {
    return (
      <section
        className="mb-6 rounded-3xl border border-error/25 bg-error-muted p-6 text-sm text-error shadow-lg"
        data-testid="backlog-overview-error"
      >
        Failed to load issue backlog model.
      </section>
    );
  }

  if (!primaryProject || !primaryBoard) {
    return null;
  }

  if (routeMode === "create") {
    return (
      <section className="mb-6 space-y-4" data-testid="issue-create-route">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                Issue authoring
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                Create a first-class issue
              </h2>
              <p className="mt-3 text-sm leading-6 text-foreground-muted">
                Create an issue in its own focused route, then return to the board when you want to
                keep moving work across columns.
              </p>
            </div>
            <button
              type="button"
              onClick={clearFocusedIssue}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground-muted"
            >
              Back to board
            </button>
          </div>
        </div>
        {createMode ? (
          <CreateIssuePanel
            draft={draft}
            project={primaryProject}
            issues={snapshot.issues.filter((candidate) => candidate.projectId === primaryProject.id)}
            taskTags={taskTags}
            autosaveStatus={autosaveStatus}
            creatingIssue={creatingIssue}
            error={createError}
            validationError={validationError}
            onChange={(updater) => {
              setValidationError(null);
              setCreateError(null);
              setDraft((current) => updater(current));
            }}
            onClose={clearFocusedIssue}
            onSubmit={() => void handleCreateIssue()}
          />
        ) : null}
      </section>
    );
  }

  if (routeMode === "issue") {
    if (!focusedIssue || !focusedIssueDraft) {
      return (
        <section className="mb-6 rounded-3xl border border-error/25 bg-error-muted p-6 text-sm text-error shadow-lg">
          Issue not found in the current backlog snapshot.
        </section>
      );
    }

    return (
      <section className="mb-6 space-y-4" data-testid="issue-detail-route">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                Issue detail
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {focusedIssue.key}
              </h2>
              <p className="mt-3 text-sm leading-6 text-foreground-muted">
                Dedicated issue routes now sit beside the board so issue authoring and maintenance can
                happen on stable deep links instead of only inside the home-page side panel.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(projectIssueCreateHref(focusedIssue.projectId))}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary"
              >
                <Plus className="h-4 w-4" />
                New issue
              </button>
              <button
                type="button"
                onClick={clearFocusedIssue}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground-muted"
              >
                Back to board
              </button>
            </div>
          </div>
        </div>
        <IssueDetailPanel
          issue={focusedIssue}
          card={focusedIssueCard}
          reviewArtifact={issueArtifactById.get(focusedIssue.id)}
          project={primaryProject}
          issues={snapshot.issues.filter((candidate) => candidate.projectId === primaryProject.id)}
          dispatchContextLabels={snapshot.dispatchContextLabels ?? []}
          taskTags={taskTags}
          loading={loading}
          mutating={mutatingIssueId === focusedIssue.id}
          mutationError={mutationError}
          draft={focusedIssueDraft}
          fieldStates={issueFieldStates}
          priorityEditing={priorityEditing}
          assigneeEditing={assigneeEditing}
          labelEditing={labelEditing}
          onFocusIssue={setFocusedIssue}
          onOpenDedicatedPage={(issue) => navigate(projectIssueHref(issue.projectId, issue.id))}
          onClose={clearFocusedIssue}
          onChangeDraft={updateFocusedIssueDraft}
          onResetDraft={resetFocusedIssueDraft}
          onRetryDescriptionSave={() => void saveIssueField("description")}
          onSaveField={(field) => void saveIssueField(field)}
          onSetPriorityEditing={setPriorityEditing}
          onSetAssigneeEditing={setAssigneeEditing}
          onSetLabelEditing={setLabelEditing}
          onResetField={resetIssueField}
          onCreateSubIssue={createSubIssue}
          onLinkChildIssue={linkChildIssue}
          onSaveDispatchContextLabels={updateIssueDispatchContextLabels}
          workspaceInventory={workspaceInventory}
          onRefreshWorkspaceInventory={refreshWorkspaceInventory}
          onCreateIssueWorkspace={openIssueWorkspaceCreate}
          onLinkIssueWorkspace={linkIssueWorkspace}
          onOpenWorkspacePath={openWorkspacePath}
        />
      </section>
    );
  }

  function openCreateMode(source: CreateEntrySource, workflowState: KanbanWorkflowState = "todo") {
    clearFocusedIssue();
    setCreateMode({ source, workflowState });
    setDraft(createEmptyDraft(workflowState));
    setCreateError(null);
    setValidationError(null);
    setAutosaveStatus("idle");
    setCreateNotice(null);
  }

  function closeCreateMode() {
    setCreateMode(null);
    setDraft(createEmptyDraft());
    setCreateError(null);
    setValidationError(null);
    setAutosaveStatus("idle");
  }

  function updateFocusedIssueDraft(updater: (current: IssueDetailDraft) => IssueDetailDraft) {
    if (!focusedIssue) {
      return;
    }
    setIssueDrafts((current) => {
      const base = current[focusedIssue.id] ?? createIssueDetailDraft(focusedIssue);
      return {
        ...current,
        [focusedIssue.id]: updater(base),
      };
    });
  }

  function resetIssueField(field: Exclude<IssueDetailField, "description">) {
    if (!focusedIssue) {
      return;
    }
    const baseline = createIssueDetailDraft(focusedIssue);
    updateFocusedIssueDraft((current) => ({
      ...current,
      title: field === "metadata" ? baseline.title : current.title,
      summary: field === "metadata" ? baseline.summary : current.summary,
      status: field === "metadata" ? baseline.status : current.status,
      priority: field === "priority" ? baseline.priority : current.priority,
      assigneeIds: field === "assignees" ? baseline.assigneeIds : current.assigneeIds,
      labelIds: field === "labels" ? baseline.labelIds : current.labelIds,
      dependencies: field === "metadata" ? baseline.dependencies : current.dependencies,
      acceptanceCriteria:
        field === "metadata" ? baseline.acceptanceCriteria : current.acceptanceCriteria,
    }));
    setIssueFieldStates((current) => ({
      ...current,
      [field]: { status: "idle", message: null },
    }));
  }

  function resetFocusedIssueDraft() {
    if (!focusedIssue) {
      return;
    }
    setIssueDrafts((current) => ({
      ...current,
      [focusedIssue.id]: createIssueDetailDraft(focusedIssue),
    }));
    setIssueFieldStates(createIssueFieldStateMap());
  }

  async function saveIssueField(field: IssueDetailField) {
    if (!focusedIssue || !focusedIssueDraft) {
      return;
    }

    const patch =
      field === "metadata"
        ? {
            title: focusedIssueDraft.title,
            summary: focusedIssueDraft.summary,
            status: focusedIssueDraft.status,
            dependencies: focusedIssueDraft.dependencies,
            acceptanceCriteria: focusedIssueDraft.acceptanceCriteria.map((criterion) => ({
              id: criterion.id,
              title: criterion.title,
              satisfied: criterion.satisfied,
              notes: criterion.notes.trim() || undefined,
            })),
          }
        : field === "description"
        ? { description: focusedIssueDraft.description }
        : field === "priority"
          ? { priority: focusedIssueDraft.priority }
          : field === "assignees"
            ? { assigneeIds: focusedIssueDraft.assigneeIds }
            : { labelIds: focusedIssueDraft.labelIds };

    setIssueFieldStates((current) => ({
      ...current,
      [field]: { status: "saving", message: null },
    }));

    try {
      const overview = await updateIssueDetail({
        issueId: focusedIssue.id,
        expectedUpdatedAt: focusedIssueDraft.baseUpdatedAt,
        ...patch,
      });
      const nextIssue = overview.snapshot.issues.find((candidate) => candidate.id === focusedIssue.id);
      if (nextIssue) {
        setIssueDrafts((current) => ({
          ...current,
          [focusedIssue.id]: createIssueDetailDraft(nextIssue),
        }));
      }
      setIssueFieldStates((current) => ({
        ...current,
        [field]: {
          status: "saved",
          message:
            field === "metadata"
              ? "Issue profile saved."
              : field === "description"
              ? "Description saved."
              : field === "priority"
                ? "Priority saved."
                : field === "assignees"
                  ? "Assignees saved."
                  : "Tags saved.",
        },
      }));
      if (field === "priority") setPriorityEditing(false);
      if (field === "assignees") setAssigneeEditing(false);
      if (field === "labels") setLabelEditing(false);
    } catch (cause) {
      setIssueFieldStates((current) => ({
        ...current,
        [field]: {
          status: "error",
          message:
            cause instanceof Error
              ? cause.message
              : field === "metadata"
                ? "Issue profile save failed."
                : field === "description"
                ? "Description save failed."
                : "Field save failed.",
        },
      }));
    }
  }

  async function handleCreateIssue() {
    if (!createMode) {
      return;
    }

    if (!draft.title.trim()) {
      setValidationError("Title is required before the issue can be created.");
      return;
    }

    setValidationError(null);
    setCreateError(null);

    if (!primaryProject) {
      setValidationError("A project must be selected before creating an issue.");
      return;
    }

    try {
      const created = await createIssue({
        projectId: requestedProjectId ?? initialProjectId ?? primaryProject.id,
        title: draft.title.trim(),
        summary: draft.summary.trim() || undefined,
        description: draft.description.trim() || undefined,
        status: draft.status,
        assigneeIds: draft.assigneeIds,
        labelIds: draft.labelIds,
        dependencies: draft.dependencies,
        acceptanceCriteria: draft.acceptanceCriteria.map((criterion) => ({
          id: criterion.id,
          title: criterion.title,
          satisfied: criterion.satisfied,
          notes: criterion.notes.trim() || undefined,
        })),
        priority: draft.priority,
        metadata: {
          createSource: createMode.source,
          createWorkflowState: draft.workflowState,
          createMode: routeMode === "create" ? "route" : "board",
        },
      });

      if (routeMode === "create") {
        navigate(projectIssueHref(created.issue.projectId, created.issue.id));
        return;
      }

      setCreateNotice(`Created ${created.issue.key} from ${createMode.source === "column" ? "column header" : "board header"} create mode.`);
      closeCreateMode();
    } catch (cause) {
      setCreateError(cause instanceof Error ? cause.message : "Failed to create issue.");
      setAutosaveStatus("partial");
    }
  }

  const navigateToPresentation = (nextPresentation: BoardPresentation) => {
    if (routeBasePath) {
      const params = new URLSearchParams(searchParams.toString());
      const query = params.toString();
      navigate(query ? `${routeBasePath}/${nextPresentation}?${query}` : `${routeBasePath}/${nextPresentation}`);
      return;
    }
    setPersistedPresentation(nextPresentation);
  };

  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssueIds((current) =>
      current.includes(issueId)
        ? current.filter((candidate) => candidate !== issueId)
        : [...current, issueId],
    );
  };

  const toggleSelectAllVisible = () => {
    setSelectedIssueIds((current) =>
      allVisibleSelected
        ? current.filter((issueId) => !visibleCardIds.has(issueId))
        : Array.from(new Set([...current, ...visibleCards.map((card) => card.issueId)])),
    );
  };

  const handleMoveIssue = (issueId: string, toState: KanbanWorkflowState) => {
    void moveIssue(issueId, toState);
  };

  async function handleBulkMove() {
    if (selectedCards.length === 0) {
      return;
    }

    setBulkPending("move");
    setBulkNotice(null);

    let moved = 0;
    let blocked = 0;
    try {
      for (const card of selectedCards) {
        const target = card.moveTargets.find((candidate) => candidate.state === bulkTargetState);
        if (!target?.allowed) {
          blocked += 1;
          continue;
        }
        await moveIssue(card.issueId, bulkTargetState);
        moved += 1;
      }
      setSelectedIssueIds([]);
      setBulkNotice(
        blocked > 0
          ? `Moved ${moved} issue${moved === 1 ? "" : "s"} to ${stateLabel(bulkTargetState)}. ${blocked} stayed put because policy checks blocked the transition.`
          : `Moved ${moved} issue${moved === 1 ? "" : "s"} to ${stateLabel(bulkTargetState)}.`,
      );
    } finally {
      setBulkPending(null);
    }
  }

  async function handleBulkWorkspaceProvision() {
    if (selectedCards.length === 0) {
      return;
    }

    setBulkPending("workspace");
    setBulkNotice(null);

    let created = 0;
    let skipped = 0;
    try {
      for (const card of selectedCards) {
        const issue = issueById.get(card.issueId);
        if (!issue || (issue.workspaceLinks?.length ?? 0) > 0) {
          skipped += 1;
          continue;
        }
        await createIssueWorkspace(card.issueId);
        created += 1;
      }
      setSelectedIssueIds([]);
      setBulkNotice(
        skipped > 0
          ? `Provisioned ${created} workspace${created === 1 ? "" : "s"}. ${skipped} issue${skipped === 1 ? "" : "s"} already had a linked workspace.`
          : `Provisioned ${created} workspace${created === 1 ? "" : "s"} from the current selection.`,
      );
    } finally {
      setBulkPending(null);
    }
  }

  function setFocusedIssue(issue: KanbanIssue) {
    if (routeMode === "issue") {
      navigate(projectIssueHref(issue.projectId, issue.id));
      return;
    }
    closeCreateMode();
    const params = new URLSearchParams(searchParams.toString());
    params.set("issueId", issue.id);
    params.set("issueKey", issue.key);
    navigate(`${currentSurfacePath}?${params.toString()}`);
  }

  function clearFocusedIssue() {
    if (routeMode === "issue" || routeMode === "create") {
      navigate(currentSurfacePath);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("issueId");
    params.delete("issueKey");
    const query = params.toString();
    navigate(query ? `${currentSurfacePath}?${query}` : currentSurfacePath);
  }

  function refreshWorkspaceInventory() {
    if (!focusedIssue) {
      return;
    }
    setWorkspaceInventory((current) => ({ ...current, loading: true, error: null }));
    void loadIssueWorkspaceInventory()
      .then((payload) => {
        setWorkspaceInventory({
          items: [...payload.workspaces],
          loading: false,
          error: null,
        });
      })
      .catch((cause) => {
        setWorkspaceInventory({
          items: [],
          loading: false,
          error: cause instanceof Error ? cause.message : String(cause),
        });
      });
  }

  function openWorkspacePath(workspacePath?: string) {
    navigate(workspacePath ? workspaceShellHref(workspacePath) : "/workspaces");
  }

  function openIssueWorkspaceCreate(issue: KanbanIssue) {
    navigate(projectIssueWorkspaceCreateHref(issue.projectId, issue.id));
  }

  const activeSidePanel = focusedIssue ? "issue" : createMode ? "create" : null;

  return (
    <section
      className="backlog-overview-surface mb-4 rounded-3xl border border-border bg-card p-4 shadow-lg"
      data-testid="backlog-overview"
    >
      <div className="backlog-overview__hero flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-[280px] flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2 text-xs text-foreground-muted">
            <span className="rounded-full border border-border bg-background px-3 py-1.5 font-semibold uppercase tracking-[0.2em] text-primary/80">
              Kanban board
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1.5">
              {primaryProject.name}
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1.5">
              {summary.issueCount} issues
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1.5">
              {summary.inProgressCount} in progress
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1.5">
              {(issueReviews.summary?.pendingCount ?? 0) + (issueReviews.summary?.changesRequestedCount ?? 0)} in review
            </span>
            {primaryProject.linkedRunSummary ? (
              <span className="rounded-full border border-border bg-background px-3 py-1.5">
                {primaryProject.linkedRunSummary.activeRuns} live runs linked
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Move work first and reveal planning detail only when needed
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigateToPresentation("board")}
                className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${
                  presentation === "board"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground-muted"
                }`}
              >
                <Layers className="h-4 w-4" />
                Board view
              </button>
              <button
                type="button"
                onClick={() => navigateToPresentation("list")}
                className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${
                  presentation === "list"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground-muted"
                }`}
              >
                <ListTodo className="h-4 w-4" />
                List view
              </button>
              <button
                type="button"
                onClick={() => openCreateMode("header")}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary"
                data-testid="board-header-create"
              >
                <Plus className="h-4 w-4" />
                Create issue
              </button>
              <button
                type="button"
                onClick={() => navigate(projectWorkspaceCreateHref(primaryProject.id))}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
                data-testid="board-header-create-workspace"
              >
                <FolderGit2 className="h-4 w-4" />
                Create workspace
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="backlog-overview__controls mt-2 rounded-3xl border border-border bg-background/70 p-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.9fr)_auto]">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Search
            <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-3">
              <Search className="h-4 w-4 text-foreground-muted" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search key, title, summary, tags, or assignees"
                className="w-full bg-transparent text-sm text-foreground outline-none"
                aria-label="Planning search"
              />
            </div>
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <span className="rounded-full border border-border px-3 py-2 text-xs text-foreground-muted">
              {visibleCards.length} visible
            </span>
            <span className="rounded-full border border-border px-3 py-2 text-xs text-foreground-muted">
              {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
            </span>
            {selectedCards.length > 0 ? (
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                {selectedCards.length} selected
              </span>
            ) : null}
          </div>
        </div>

        <details
          className="backlog-overview__planning-details mt-4"
          data-testid="board-controls-details"
          open={selectedCards.length > 0 || Boolean(focusedIssue) ? true : undefined}
        >
          <summary className="backlog-overview__planning-summary">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
                Board controls
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                Open filters, triage, and bulk actions only when you need them
              </h3>
            </div>
            <div className="backlog-overview__planning-badges">
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground-muted">
                Sort {sortMode.replace("-", " ")}
              </span>
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground-muted">
                {selectedCards.length} selected
              </span>
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground-muted">
                {activeFilterCount} active filters
              </span>
            </div>
          </summary>

          <div className="backlog-overview__planning-body">
            <div className="backlog-overview__metrics-grid grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <Layers className="h-4 w-4" />
                  Scope
                </div>
                <div className="mt-3 text-2xl font-semibold text-foreground">{summary.issueCount}</div>
                <div className="text-sm text-foreground-muted">{summary.projectCount} project models</div>
              </div>
              <div className="rounded-2xl border border-warning/25 bg-warning-muted p-4">
                <div className="flex items-center gap-2 text-sm text-warning">
                  <Workflow className="h-4 w-4" />
                  Active WIP
                </div>
                <div className="mt-3 text-2xl font-semibold text-warning">{summary.inProgressCount}</div>
                <div className="text-sm text-warning/80">
                  {summary.needsDecompositionCount} waiting on decomposition
                </div>
              </div>
              <div className="rounded-2xl border border-primary/25 bg-primary/10 p-4">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <TimerReset className="h-4 w-4" />
                  Review Queue
                </div>
                <div className="mt-3 text-2xl font-semibold text-primary">
                  {(issueReviews.summary?.pendingCount ?? 0) + (issueReviews.summary?.changesRequestedCount ?? 0)}
                </div>
                <div className="text-sm text-primary/80">reviews waiting for action</div>
              </div>
              <div className="rounded-2xl border border-error/25 bg-error-muted p-4">
                <div className="flex items-center gap-2 text-sm text-error">
                  <AlertCircle className="h-4 w-4" />
                  Blocked
                </div>
                <div className="mt-3 text-2xl font-semibold text-error">{summary.blockedCount}</div>
                <div className="text-sm text-error/80">{summary.completedCount} completed</div>
              </div>
            </div>
            <div className="grid gap-3 xl:grid-cols-[repeat(2,minmax(0,220px))_auto]">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                Workflow
                <select
                  value={workflowFilter}
                  onChange={(event) => setWorkflowFilter(event.target.value as KanbanWorkflowState | "all")}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  aria-label="Workflow filter"
                >
                  <option value="all">All columns</option>
                  {workflowOrder.map((state) => (
                    <option key={state} value={state}>
                      {stateLabel(state)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                Readiness
                <select
                  value={readinessFilter}
                  onChange={(event) => setReadinessFilter(event.target.value as KanbanBoardCard["readiness"] | "all")}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  aria-label="Readiness filter"
                >
                  <option value="all">All readiness</option>
                  <option value="needs-decomposition">Needs decomposition</option>
                  <option value="ready">Ready</option>
                  <option value="blocked">Blocked</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 xl:grid-cols-[repeat(2,minmax(0,180px))_auto]">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                Assignee
                <select
                  value={assigneeFilter}
                  onChange={(event) => setAssigneeFilter(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  aria-label="Assignee filter"
                >
                  <option value="all">All assignees</option>
                  {selectableAssignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.displayName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                Tag
                <select
                  value={tagFilter}
                  onChange={(event) => setTagFilter(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  aria-label="Tag filter"
                >
                  <option value="all">All tags</option>
                  {selectableTags.map((label) => (
                    <option key={label.id} value={label.id}>
                      {label.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                  Sort
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-card px-3">
                    <ArrowUpDown className="h-4 w-4 text-foreground-muted" />
                    <select
                      value={sortMode}
                      onChange={(event) => setSortMode(event.target.value as PlanningSortMode)}
                      className="h-11 bg-transparent pr-2 text-sm text-foreground outline-none"
                      aria-label="Sort cards"
                    >
                      <option value="board-order">Board order</option>
                      <option value="priority">Priority</option>
                      <option value="activity">Recent activity</option>
                      <option value="title">Title</option>
                    </select>
                  </div>
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-foreground-muted">
                  <input
                    type="checkbox"
                    checked={showEmptySwimlanes}
                    onChange={(event) => setShowEmptySwimlanes(event.target.checked)}
                    className="h-4 w-4 rounded border border-border"
                  />
                  Show empty swimlanes
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-foreground-muted">
                  <input
                    type="checkbox"
                    checked={showPolicySignals}
                    onChange={(event) => setShowPolicySignals(event.target.checked)}
                    className="h-4 w-4 rounded border border-border"
                  />
                  Show policy feedback
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                  className="h-4 w-4 rounded border border-border"
                  aria-label="Select visible issues"
                />
                Select visible
              </label>
              <span className="text-sm text-foreground-muted">
                {selectedCards.length} selected
              </span>
              <select
                value={bulkTargetState}
                onChange={(event) => setBulkTargetState(event.target.value as KanbanWorkflowState)}
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                aria-label="Bulk move target"
              >
                {workflowOrder.map((state) => (
                  <option key={state} value={state} disabled={!bulkTargetOptions.includes(state)}>
                    Move to {stateLabel(state)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleBulkMove()}
                disabled={selectedCards.length === 0 || bulkPending !== null || !bulkTargetOptions.includes(bulkTargetState)}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground disabled:opacity-50"
              >
                Move selected
              </button>
              <button
                type="button"
                onClick={() => void handleBulkWorkspaceProvision()}
                disabled={selectedCards.length === 0 || bulkPending !== null}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary disabled:opacity-50"
              >
                Create workspaces
              </button>
              <button
                type="button"
                onClick={() => setSelectedIssueIds([])}
                disabled={selectedCards.length === 0 || bulkPending !== null}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground-muted disabled:opacity-50"
              >
                Clear selection
              </button>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_repeat(3,minmax(0,180px))]">
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">Board focus</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {focusedIssue ? `${focusedIssue.key} · ${focusedIssue.title}` : "No issue selected"}
                    </p>
                    <p className="mt-1 text-sm text-foreground-muted">
                      {focusedIssue
                        ? "The detail panel is open beside the board so you can edit without losing column context."
                        : "Open any card to inspect acceptance criteria, review state, workspace links, and child issues."}
                    </p>
                  </div>
                  {focusedIssue ? (
                    <button
                      type="button"
                      onClick={clearFocusedIssue}
                      className="inline-flex h-10 items-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground"
                    >
                      Clear focus
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">Filters</p>
                <p className="mt-2 text-base font-semibold text-foreground">{activeFilterCount}</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {activeFilterCount === 0 ? "Board showing the default scope." : "Filters actively narrowing the board."}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">Selection</p>
                <p className="mt-2 text-base font-semibold text-foreground">{selectedCards.length}</p>
                <p className="mt-1 text-sm text-foreground-muted">Cards ready for bulk move or workspace creation.</p>
              </div>

              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">Review queue</p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {(issueReviews.summary?.pendingCount ?? 0) + (issueReviews.summary?.changesRequestedCount ?? 0)}
                </p>
                <p className="mt-1 text-sm text-foreground-muted">Artifacts waiting on review, approval, or rework.</p>
              </div>
            </div>
          </div>
        </details>
      </div>

      {createNotice ? (
        <div className="mt-4 rounded-2xl border border-success/30 bg-success-muted px-4 py-3 text-sm text-success">
          {createNotice}
        </div>
      ) : null}

      {bulkNotice ? (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
          {bulkNotice}
        </div>
      ) : null}

      <div
        className={`backlog-overview__workspace mt-6 grid gap-5 ${
          activeSidePanel ? "xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,400px)]" : "grid-cols-1"
        }`}
      >
        <div className="backlog-overview__board-stack space-y-5">
          {visibleCards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-background/70 p-6 text-sm text-foreground-muted">
              No issues match the current planning filters. Adjust search, workflow, readiness, assignee, or tag filters to widen the board.
            </div>
          ) : null}
          {presentation === "board" ? (
            <div className="backlog-overview__board space-y-5" data-testid="kanban-board">
              {primaryBoard.swimlanes
                .filter((swimlane) => {
                  const visibleCount = visibleCards.filter((card) => card.swimlaneId === swimlane.id).length;
                  return showEmptySwimlanes || visibleCount > 0;
                })
                .map((swimlane) => (
                  <section
                    key={swimlane.id}
                    className="backlog-overview__swimlane rounded-3xl border border-border bg-background/70 p-4"
                    data-testid={`kanban-swimlane-${swimlane.id}`}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
                          Swimlane
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-foreground">{swimlane.name}</h3>
                      </div>
                      <span className="rounded-full border border-border px-3 py-1 text-xs text-foreground-muted">
                        {visibleCards.filter((card) => card.swimlaneId === swimlane.id).length} visible
                      </span>
                    </div>

                    <div className="backlog-overview__swimlane-grid grid gap-4">
                      {workflowOrder.map((state) => {
                        const column = primaryBoard.columns.find((candidate) => candidate.id === state);
                        const cards = visibleCards.filter(
                          (card) => card.swimlaneId === swimlane.id && card.workflowState === state,
                        );
                        if (!column) {
                          return null;
                        }

                        return (
                          <div
                            key={`${swimlane.id}-${state}`}
                            className={`backlog-overview__column rounded-2xl border p-4 ${columnTone(state, column.isOverLimit)}`}
                            data-testid={`kanban-column-${swimlane.id}-${state}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-foreground">
                                  {stateLabel(state)}
                                </div>
                                <div className="mt-1 text-xs text-foreground-muted">
                                  {cards.length} visible in this lane
                                </div>
                              </div>
                              <div className="text-right text-xs text-foreground-muted">
                                <div>{column.issueCount} total</div>
                                {typeof column.wipLimit === "number" ? (
                                  <div className={column.isOverLimit ? "text-error" : undefined}>
                                    WIP {column.issueCount}/{column.wipLimit}
                                  </div>
                                ) : (
                                  <div>No WIP cap</div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openCreateMode("column", state)}
                              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground"
                              data-testid={`create-column-${swimlane.id}-${state}`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add issue
                            </button>

                            <div className="backlog-overview__column-cards mt-4 space-y-3">
                              {cards.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                                  No cards
                                </div>
                              ) : null}

                              {cards.map((card) => {
                                const issue = issueById.get(card.issueId);
                                const parentIssue = issue?.parentIssueId
                                  ? issueById.get(issue.parentIssueId)
                                  : undefined;
                                const linkedWorkspaceCount = issue?.workspaceLinks?.length ?? 0;
                                const primaryWorkspaceLink = issue?.workspaceLinks?.[0];
                                const allowedMoveTargets = card.moveTargets.filter((target) => target.allowed);
                                const primaryMoveTarget = allowedMoveTargets[0] ?? null;
                                const secondaryMoveTargets = allowedMoveTargets.slice(1);
                                const hasWorkspaceOverflowAction = issue != null;
                                const showSecondaryDetails =
                                  Boolean(card.repositoryLifecycle) ||
                                  card.collaboratorNames.length > 0 ||
                                  card.assigneeNames.length > 0 ||
                                  card.labelNames.length > 0;
                                const hasExpandableDetails =
                                  hasWorkspaceOverflowAction ||
                                  showSecondaryDetails ||
                                  secondaryMoveTargets.length > 0 ||
                                  card.dependencyCount > 0 ||
                                  card.childCount > 0 ||
                                  card.acceptanceProgress.total > 0 ||
                                  (showPolicySignals &&
                                    (card.policySignals.length > 0 ||
                                      card.moveTargets.some((target) => target.signals.length > 0)));

                                return (
                                  <article
                                    key={card.issueId}
                                    id={`kanban-issue-${card.issueId}`}
                                    className={`backlog-overview__card rounded-2xl border p-4 ${issueTone(card)} ${
                                      focusedIssueId === card.issueId || focusedIssueKey === card.issueKey
                                        ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                                        : ""
                                    }`}
                                    data-testid={`kanban-card-${card.issueKey}`}
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <label className="inline-flex items-center gap-2 text-xs text-foreground-muted">
                                        <input
                                          type="checkbox"
                                          checked={selectedIssueIds.includes(card.issueId)}
                                          onChange={() => toggleIssueSelection(card.issueId)}
                                          className="h-4 w-4 rounded border border-border"
                                          aria-label={`Select ${card.issueKey}`}
                                        />
                                      </label>
                                      <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                                        {card.issueKey}
                                      </span>
                                      <span className="rounded-full border border-current/20 px-2 py-0.5 text-xs">
                                        {card.priority}
                                      </span>
                                      <span className="rounded-full border border-current/20 px-2 py-0.5 text-xs">
                                        {card.readiness}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => issue && setFocusedIssue(issue)}
                                      className="mt-2 text-left text-base font-semibold underline-offset-4 hover:underline"
                                      data-testid={`open-issue-${card.issueKey}`}
                                    >
                                      {card.title}
                                    </button>

                                    {card.summary ? (
                                      <p className="backlog-overview__card-summary-copy mt-2 text-sm leading-6 opacity-90">
                                        {card.summary}
                                      </p>
                                    ) : null}

                                    {parentIssue || card.review ? (
                                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                        {parentIssue ? (
                                          <button
                                            type="button"
                                            onClick={() => setFocusedIssue(parentIssue)}
                                            className="rounded-full border border-current/20 px-2.5 py-1 text-left font-semibold opacity-85"
                                            data-testid={`open-parent-${card.issueKey}`}
                                          >
                                            Parent {parentIssue.key}
                                          </button>
                                        ) : null}
                                        {card.review ? (
                                          <span className="rounded-full border border-current/20 px-2.5 py-1 opacity-85">
                                            Review {card.review.decision}
                                            {card.review.openCommentCount > 0
                                              ? ` · ${card.review.openCommentCount} open`
                                              : ""}
                                          </span>
                                        ) : null}
                                      </div>
                                    ) : null}

                                    <div className="mt-4 rounded-2xl border border-current/15 bg-card/70 p-3 text-current/90">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
                                            Workspace
                                          </div>
                                          <div className="mt-1 text-sm font-medium">
                                            {linkedWorkspaceCount > 0
                                              ? `${linkedWorkspaceCount} linked workspace${linkedWorkspaceCount === 1 ? "" : "s"}`
                                              : "No workspace linked yet"}
                                          </div>
                                          <div className="mt-1 text-xs opacity-75">
                                            {linkedWorkspaceCount > 1
                                              ? `${linkedWorkspaceCount - 1} additional link${linkedWorkspaceCount - 1 === 1 ? "" : "s"} in details`
                                              : linkedWorkspaceCount === 1
                                                ? "Open the linked workspace"
                                                : "Create or link it when the issue is ready"}
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {linkedWorkspaceCount === 0 ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                navigate(projectIssueWorkspaceCreateHref(primaryProject.id, card.issueId))
                                              }
                                              className="inline-flex h-10 items-center gap-2 rounded-xl border border-current/20 bg-background/70 px-3 text-xs font-semibold"
                                              data-testid={`create-workspace-${card.issueKey}`}
                                            >
                                              <Plus className="h-3.5 w-3.5" />
                                              Create workspace
                                            </button>
                                          ) : (
                                            <>
                                              {primaryWorkspaceLink ? (
                                                <button
                                                  type="button"
                                                  onClick={() => openWorkspacePath(primaryWorkspaceLink.workspacePath)}
                                                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-current/20 bg-background/70 px-3 text-xs font-semibold"
                                                  data-testid={`open-linked-workspace-${card.issueKey}`}
                                                >
                                                  <FolderGit2 className="h-3.5 w-3.5" />
                                                  Open workspace
                                                </button>
                                              ) : null}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {primaryMoveTarget ? (
                                      <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          disabled={movingIssueId === card.issueId}
                                          onClick={() => handleMoveIssue(card.issueId, primaryMoveTarget.state)}
                                          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 text-xs font-semibold tracking-[0.04em] text-primary transition-all duration-200 hover:border-primary/40 hover:bg-primary/15 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
                                          data-testid={`move-${card.issueKey}-${primaryMoveTarget.state}`}
                                        >
                                          <ArrowRight className="h-3.5 w-3.5" />
                                          Move to {stateLabel(primaryMoveTarget.state)}
                                        </button>
                                        {secondaryMoveTargets.length > 0 ? (
                                          <span className="rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs text-foreground-muted">
                                            +{secondaryMoveTargets.length} more move{secondaryMoveTargets.length === 1 ? "" : "s"} in details
                                          </span>
                                        ) : null}
                                      </div>
                                    ) : null}

                                    {hasExpandableDetails ? (
                                      <details className="backlog-overview__card-details mt-4">
                                        <summary className="backlog-overview__card-summary">
                                          <span>More details</span>
                                          <span>
                                            {card.dependencyCount} dep
                                            {card.dependencyCount === 1 ? "" : "s"}
                                            {" · "}
                                            {card.childCount} child
                                            {card.childCount === 1 ? "" : "ren"}
                                          </span>
                                        </summary>
                                        <div className="backlog-overview__card-details-body">
                                          {hasWorkspaceOverflowAction ? (
                                            <div className="space-y-3">
                                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                                                Workspace options
                                              </div>
                                              {linkedWorkspaceCount > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                  {(issue?.workspaceLinks ?? []).map((workspaceLink) => (
                                                    <button
                                                      key={`${card.issueId}-${workspaceLink.workspacePath}`}
                                                      type="button"
                                                      onClick={() => openWorkspacePath(workspaceLink.workspacePath)}
                                                      className="rounded-full border border-current/20 bg-background/70 px-3 py-1.5 text-left text-xs"
                                                      data-testid={`card-workspace-${card.issueKey}-${workspaceLink.workspaceName}`}
                                                    >
                                                      <span className="font-semibold">{workspaceLink.workspaceName}</span>
                                                      <span className="ml-2 opacity-75">
                                                        {workspaceLinkSummary(workspaceLink)}
                                                      </span>
                                                    </button>
                                                  ))}
                                                </div>
                                              ) : null}
                                              <div className="flex flex-wrap gap-2">
                                                {primaryWorkspaceLink ? (
                                                  <button
                                                    type="button"
                                                    onClick={() => openWorkspacePath(primaryWorkspaceLink.workspacePath)}
                                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-current/20 bg-background/70 px-3 text-xs font-semibold"
                                                    data-testid={`open-linked-workspace-details-${card.issueKey}`}
                                                  >
                                                    <FolderGit2 className="h-3.5 w-3.5" />
                                                    Open workspace
                                                  </button>
                                                ) : null}
                                                {linkedWorkspaceCount === 0 ? (
                                                  <button
                                                    type="button"
                                                    onClick={() => issue && setFocusedIssue(issue)}
                                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-sm"
                                                    data-testid={`link-existing-${card.issueKey}`}
                                                  >
                                                    <Link2 className="h-3.5 w-3.5" />
                                                    Link existing workspace
                                                  </button>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    onClick={() => issue && setFocusedIssue(issue)}
                                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-sm"
                                                    data-testid={`manage-workspaces-${card.issueKey}`}
                                                  >
                                                    <Link2 className="h-3.5 w-3.5" />
                                                    Manage workspace links
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          ) : null}
                                          <div className="grid gap-3 sm:grid-cols-3">
                                            <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground-muted">
                                              <div className="font-semibold text-foreground">Dependencies</div>
                                              <div className="mt-1">{card.dependencyCount}</div>
                                            </div>
                                            <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground-muted">
                                              <div className="font-semibold text-foreground">Child issues</div>
                                              <div className="mt-1">{card.childCount}</div>
                                            </div>
                                            <div className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground-muted">
                                              <div className="font-semibold text-foreground">Acceptance</div>
                                              <div className="mt-1">
                                                {card.acceptanceProgress.satisfied}/{card.acceptanceProgress.total} accepted
                                              </div>
                                            </div>
                                          </div>
                                          {showPolicySignals && card.policySignals.length > 0 ? (
                                            <div className="space-y-2">
                                              {card.policySignals.map((signal, index) => (
                                                <div
                                                  key={`${card.issueId}-${signal.hookId}-${index}`}
                                                  className="rounded-xl border border-current/15 bg-card/70 px-3 py-2 text-xs"
                                                >
                                                  {signal.message}
                                                </div>
                                              ))}
                                            </div>
                                          ) : null}
                                          {showPolicySignals && card.moveTargets.some((target) => target.signals.length > 0) ? (
                                            <div className="space-y-2">
                                              {card.moveTargets.flatMap((target) =>
                                                target.signals.map((signal, index) => (
                                                  <div
                                                    key={`${card.issueId}-${target.state}-${signal.hookId}-${index}`}
                                                    className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground-muted"
                                                  >
                                                    {stateLabel(target.state)}: {signal.message}
                                                  </div>
                                                )),
                                              )}
                                            </div>
                                          ) : null}
                                          {secondaryMoveTargets.length > 0 ? (
                                            <div className="space-y-3">
                                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                                                Alternate moves
                                              </div>
                                              <div className="flex flex-wrap gap-2">
                                                {secondaryMoveTargets.map((target) => (
                                                  <button
                                                    key={`${card.issueId}-${target.state}`}
                                                    type="button"
                                                    disabled={movingIssueId === card.issueId}
                                                    onClick={() => handleMoveIssue(card.issueId, target.state)}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
                                                    data-testid={`move-secondary-${card.issueKey}-${target.state}`}
                                                  >
                                                    <ArrowRight className="h-3.5 w-3.5" />
                                                    Move to {stateLabel(target.state)}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          ) : null}
                                          <RepositoryLifecyclePanel
                                            card={card}
                                            mutating={movingIssueId === card.issueId || mutatingIssueId === card.issueId}
                                            onLinkRepository={linkRepository}
                                            onUpdateRepositorySettings={updateRepositorySettings}
                                            onCreatePullRequest={createPullRequest}
                                          />
                                          <IssueCollaborationPanel
                                            card={card}
                                            project={primaryProject}
                                            activityEntries={
                                              snapshot.issues.find((candidate) => candidate.id === card.issueId)?.activity ?? []
                                            }
                                            mutating={movingIssueId === card.issueId || mutatingIssueId === card.issueId}
                                            onSave={updateIssueCollaboration}
                                          />
                                        </div>
                                      </details>
                                    ) : null}
                                  </article>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
            </div>
          ) : (
            <div className="backlog-overview__list space-y-4" data-testid="kanban-list">
              <div className="rounded-3xl border border-border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
                      List view
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">
                      Shared issue inventory in linear order
                    </h3>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-foreground-muted">
                    {visibleCards.length} cards
                  </span>
                </div>
              </div>
              {visibleCards.map((card) =>
                renderListCard(
                  card,
                  issueById.get(card.issueId),
                  focusedIssueId === card.issueId || focusedIssueKey === card.issueKey,
                  setFocusedIssue,
                  selectedIssueIds.includes(card.issueId),
                  toggleIssueSelection,
                  handleMoveIssue,
                  movingIssueId,
                  showPolicySignals,
                ),
              )}
            </div>
          )}
        </div>

        {focusedIssue && focusedIssueDraft ? (
          <IssueDetailPanel
            issue={focusedIssue}
            card={focusedIssueCard}
            reviewArtifact={issueArtifactById.get(focusedIssue.id)}
            project={primaryProject}
            issues={snapshot.issues.filter((candidate) => candidate.projectId === primaryProject.id)}
            dispatchContextLabels={snapshot.dispatchContextLabels ?? []}
            taskTags={taskTags}
            loading={loading}
            mutating={mutatingIssueId === focusedIssue.id}
            mutationError={mutationError}
            draft={focusedIssueDraft}
            fieldStates={issueFieldStates}
            priorityEditing={priorityEditing}
            assigneeEditing={assigneeEditing}
            labelEditing={labelEditing}
            onFocusIssue={setFocusedIssue}
            onOpenDedicatedPage={(issue) => navigate(projectIssueHref(issue.projectId, issue.id))}
            onClose={clearFocusedIssue}
            onChangeDraft={updateFocusedIssueDraft}
            onResetDraft={resetFocusedIssueDraft}
            onRetryDescriptionSave={() => void saveIssueField("description")}
            onSaveField={(field) => void saveIssueField(field)}
            onSetPriorityEditing={setPriorityEditing}
            onSetAssigneeEditing={setAssigneeEditing}
            onSetLabelEditing={setLabelEditing}
            onResetField={resetIssueField}
            onCreateSubIssue={createSubIssue}
            onLinkChildIssue={linkChildIssue}
            onSaveDispatchContextLabels={updateIssueDispatchContextLabels}
            workspaceInventory={workspaceInventory}
            onRefreshWorkspaceInventory={refreshWorkspaceInventory}
            onCreateIssueWorkspace={openIssueWorkspaceCreate}
            onLinkIssueWorkspace={linkIssueWorkspace}
            onOpenWorkspacePath={openWorkspacePath}
          />
        ) : createMode ? (
          <CreateIssuePanel
            draft={draft}
            project={primaryProject}
            issues={snapshot.issues.filter((candidate) => candidate.projectId === primaryProject.id)}
            taskTags={taskTags}
            autosaveStatus={autosaveStatus}
            creatingIssue={creatingIssue}
            error={createError}
            validationError={validationError}
            onChange={(updater) => {
              setValidationError(null);
              setCreateError(null);
              setDraft((current) => updater(current));
            }}
            onClose={closeCreateMode}
            onSubmit={() => void handleCreateIssue()}
          />
        ) : null}
      </div>

      <details className="backlog-overview__support-details">
        <summary className="backlog-overview__support-summary">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
              Supporting context
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              Board notes and shared settings
            </h3>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              Keep the board primary. Open this only when you need project-wide notes, repository
              settings, or collaboration rules.
            </p>
          </div>
          <div className="backlog-overview__support-badges">
            {targetModelIssue ? (
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {targetModelIssue.key}
              </span>
            ) : null}
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground-muted">
              {primaryProject.repositories.length} repos
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground-muted">
              {primaryBoard.policyHooks.length} policies
            </span>
          </div>
        </summary>

        <div className="backlog-overview__support-body">
          {targetModelIssue ? (
            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {targetModelIssue.key}
                </span>
                <span className="text-sm font-semibold text-foreground">{targetModelIssue.title}</span>
                <span className="text-sm text-foreground-muted">{targetModelIssue.status}</span>
              </div>
              {targetModelIssue.summary ? (
                <p className="mt-3 text-sm leading-6 text-foreground-muted">{targetModelIssue.summary}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {targetModelIssue.acceptanceCriteria.map((criterion) => (
                  <span
                    key={criterion.id}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground-secondary"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {criterion.title}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {primaryProject.repositories.length > 0 ? (
            <div className="rounded-3xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
                    Repository context
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    Shared repository settings
                  </h3>
                </div>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-foreground-muted">
                  {primaryProject.repositories.length} linked repos
                </span>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {primaryProject.repositories.map((repository) => (
                  <article
                    key={repository.id}
                    className="rounded-2xl border border-border bg-card p-4"
                    data-testid={`repository-context-${repository.id}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FolderGit2 className="h-4 w-4" />
                        {repository.fullName}
                      </div>
                      <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
                        {providerLabel(repository.provider)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
                      <span className="rounded-full border border-border px-2.5 py-1">
                        Base {repository.settings.baseBranch}
                      </span>
                      <span className="rounded-full border border-border px-2.5 py-1">
                        CI {repository.settings.ciProvider ?? "Unconfigured"}
                      </span>
                      <span className="rounded-full border border-border px-2.5 py-1">
                        Publish {repository.settings.publishTarget ?? "Unconfigured"}
                      </span>
                      <span className="rounded-full border border-border px-2.5 py-1">
                        {repository.settings.requiredApprovals} approvals
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <ProjectCollaborationPanel
            project={primaryProject}
            mutating={Boolean(mutatingIssueId)}
            onSave={updateProjectCollaboration}
          />

          {primaryBoard.policyHooks.length > 0 ? (
            <div className="backlog-overview__policy-strip mt-5 flex flex-wrap gap-2">
              {primaryBoard.policyHooks.map((hook) => (
                <span
                  key={hook.id}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground-muted"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {hook.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </details>

      <details className="backlog-overview__support-details mt-6" data-testid="board-review-details">
        <summary className="backlog-overview__support-summary">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
              Review queue
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              Issue diff and feedback loop
            </h3>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              Keep comments and approvals available, but out of the main board until you explicitly open them.
            </p>
          </div>
          <div className="backlog-overview__support-badges">
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground-muted">
              {issueReviews.artifacts.length} reviews
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground-muted">
              {(issueReviews.summary?.pendingCount ?? 0) + (issueReviews.summary?.changesRequestedCount ?? 0)} waiting
            </span>
          </div>
        </summary>

        <div className="backlog-overview__support-body">
          <ReviewPanel
            title="Issue diff and feedback loop"
            description="Review, comments, and approval state for issues stay together here."
            empty="No issue reviews are queued yet."
            loading={issueReviews.loading}
            error={issueReviews.error}
            artifacts={issueReviews.artifacts}
            queue={issueReviews.queue}
            summary={issueReviews.summary}
            pendingArtifactId={issueReviews.pendingArtifactId}
            onApprove={(artifactId) => issueReviews.actOnReview({ action: "approve", artifactId }).then(() => refresh())}
            onRequestChanges={(artifactId) =>
              issueReviews.actOnReview({ action: "request-changes", artifactId }).then(() => refresh())
            }
            onSubmitReview={(input) =>
              issueReviews.actOnReview({ action: "submit-review", ...input }).then(() => refresh())
            }
            onAddComment={(input) =>
              issueReviews.actOnReview({ action: "add-comment", ...input }).then(() => refresh())
            }
          />
        </div>
      </details>
    </section>
  );
}
