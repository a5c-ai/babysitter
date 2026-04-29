"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Attachment } from "@a5c-ai/agent-mux-core";
import type {
  KanbanLinkedPullRequestSummary,
  KanbanRepositoryIntegrationState,
  KanbanReviewArtifact,
  KanbanReviewComment,
  KanbanReviewSummary,
} from "@a5c-ai/agent-mux-core/kanban";
import { findKanbanExecutionContextEnvelopesForSession } from "@a5c-ai/agent-mux-core/kanban";
import { AlertTriangle, Archive, FolderGit2, Pin, PinOff, RefreshCw, RotateCcw, Search, Trash2, Wrench } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { Accordion, Button } from "@a5c-ai/compendium";
import { ReviewPanel } from "@/components/review/review-panel";
import { cx } from "@a5c-ai/compendium";
import { useBacklog } from "@/hooks/use-backlog";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { useReviews } from "@/hooks/use-reviews";
import type { WorkspaceInventoryItem, WorkspaceInventoryResponse, WorkspaceSessionSnapshot } from "@/lib/workspace-lifecycle";
import { WorkspaceDetailsSidebar, type WorkspaceSidebarFeedback } from "@/components/workspaces/workspace-details-sidebar";
import { WorkspaceRuntimePanel } from "@/components/workspaces/workspace-runtime-panel";
import { WorkspaceDetailShell } from "@/components/workspaces/workspace-detail-shell";
import { PageSection, PageShell } from "@/components/shared/page-shell";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "No recent activity";
  }
  return new Date(value).toLocaleString();
}

function truncatePath(value: string): string {
  if (value.length <= 72) {
    return value;
  }
  return `${value.slice(0, 32)}...${value.slice(-28)}`;
}

function workspaceDetailHref(value: string): string {
  return `/workspaces?workspace=${encodeURIComponent(value)}`;
}

type WorkspaceSurfaceMode = "full" | "attention";
type WorkspaceListLayoutMode = "grouped" | "flat";

type WorkspaceSidebarBadge = {
  label: string;
  className: string;
};

function formatUsd(totalUsd: number | null): string {
  if (totalUsd == null || !Number.isFinite(totalUsd)) {
    return "unavailable";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: totalUsd >= 1 ? 2 : 4,
    maximumFractionDigits: 4,
  }).format(totalUsd);
}

function lifecycleTone(status: string): string {
  if (status === "approved" || status === "ready" || status === "passing" || status === "published" || status === "merged") {
    return "border-success/20 bg-success/10 text-success";
  }
  if (status === "pending" || status === "in-review") {
    return "border-warning/20 bg-warning/10 text-warning";
  }
  if (status === "changes-requested" || status === "blocked" || status === "failing" || status === "failed") {
    return "border-error/20 bg-error/10 text-error";
  }
  return "border-border text-foreground-muted";
}

function accumulateEventCost(
  runIds: string[],
  eventBuffers: Record<string, { events: Record<string, unknown>[] } | undefined>,
): number | null {
  let found = false;
  let total = 0;
  for (const runId of runIds) {
    const buffer = eventBuffers[runId];
    if (!buffer) {
      continue;
    }
    for (const event of buffer.events) {
      if (event.type !== "cost" || !event.cost || typeof event.cost !== "object") {
        continue;
      }
      total += Number((event.cost as { totalUsd?: number }).totalUsd ?? 0);
      found = true;
    }
  }
  return found ? total : null;
}

export function getWorkspaceOwnershipLabel(
  isAuthenticated: boolean,
  sessions: WorkspaceSessionSnapshot[],
  workspaces: WorkspaceInventoryItem[] = [],
): string {
  if (workspaces.length > 0) {
    const issueOwned = workspaces.filter((workspace) => Boolean(workspace.ownership?.issue)).length;
    const projectOwned = workspaces.filter((workspace) => workspace.ownership?.source === "created-from-project").length;
    const hostOwned = workspaces.filter((workspace) => workspace.ownership?.source === "created-from-host").length;
    return `Explicit ownership: ${issueOwned} issue, ${projectOwned} project, ${hostOwned} host`;
  }

  return isAuthenticated
    ? `${sessions.length} live session${sessions.length === 1 ? "" : "s"} attached to the current workspace inventory`
    : "Gateway disconnected: inventory falls back to local git worktrees and archived workspace metadata";
}

function issueHref(
  workspace: Pick<WorkspaceInventoryItem, "ownership" | "issues">,
  issueId: string,
): string {
  const projectId =
    workspace.ownership?.project?.projectId ??
    workspace.issues?.find((issue) => issue.issueId === issueId)?.projectId;
  return projectId
    ? `/projects/${encodeURIComponent(projectId)}/issues/${encodeURIComponent(issueId)}`
    : `/issues/${encodeURIComponent(issueId)}`;
}

function ownershipSummary(workspace: WorkspaceInventoryItem): string | null {
  if (workspace.ownership?.issue && workspace.ownership.project) {
    return `${workspace.ownership.project.projectKey} / ${workspace.ownership.issue.issueKey}`;
  }
  if (workspace.ownership?.source === "created-from-host" && workspace.ownership.project && workspace.ownership.host) {
    return `${workspace.ownership.project.projectKey} / ${workspace.ownership.host.label}`;
  }
  if (workspace.ownership?.project) {
    return `${workspace.ownership.project.projectKey} project`;
  }
  if (workspace.ownership?.host) {
    return `${workspace.ownership.host.label} host`;
  }
  return null;
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function searchableWorkspaceText(workspace: WorkspaceInventoryItem): string {
  return [
    workspace.name,
    workspace.path,
    workspace.git.branch ?? "",
    workspace.git.root ?? "",
    ownershipSummary(workspace) ?? "",
    ...(workspace.issues ?? []).flatMap((issue) => [issue.issueKey, issue.issueTitle, issue.projectKey, issue.projectName]),
  ].join("\n").toLowerCase();
}

function matchesWorkspaceSearch(workspace: WorkspaceInventoryItem, term: string): boolean {
  if (!term) {
    return true;
  }
  return searchableWorkspaceText(workspace).includes(term);
}

function workspaceSortRank(status: WorkspaceInventoryItem["status"]): number {
  if (status === "active") return 0;
  if (status === "idle") return 1;
  if (status === "archived") return 2;
  return 3;
}

function sortWorkspaceSidebarItems(workspaces: WorkspaceInventoryItem[]): WorkspaceInventoryItem[] {
  return [...workspaces].sort((left, right) => {
    const pinDiff = Number(Boolean(right.pinnedAt)) - Number(Boolean(left.pinnedAt));
    if (pinDiff !== 0) {
      return pinDiff;
    }
    const statusDiff = workspaceSortRank(left.status) - workspaceSortRank(right.status);
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return left.path.localeCompare(right.path);
  });
}

export async function loadInventory(sessions: WorkspaceSessionSnapshot[]): Promise<WorkspaceInventoryResponse> {
  const response = await fetch("/api/workspaces", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessions }),
  });

  if (!response.ok) {
    throw new Error(`Workspace inventory request failed: ${response.status}`);
  }

  return (await response.json()) as WorkspaceInventoryResponse;
}

export async function runWorkspaceAction(
  action:
    | "pin"
    | "unpin"
    | "archive"
    | "cleanup"
    | "recover"
    | "notes-save"
    | "rebase-start"
    | "rebase-auto-resolve"
    | "rebase-open-in-editor"
    | "rebase-mark-resolved"
    | "rebase-abort",
  workspacePath: string,
  sessions: WorkspaceSessionSnapshot[],
  note?: string,
): Promise<WorkspaceInventoryResponse> {
  const response = await fetch("/api/workspaces", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, workspacePath, sessions, note }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Workspace action failed: ${response.status}`);
  }

  const payload = (await response.json()) as WorkspaceInventoryResponse;
  return payload;
}

function rebaseTone(status: NonNullable<WorkspaceInventoryItem["rebase"]>["status"]): string {
  switch (status) {
    case "ready-for-review":
    case "ready-for-merge":
      return "border-success/20 bg-success/10 text-success";
    case "rebase-needed":
      return "border-warning/20 bg-warning/10 text-warning";
    case "rebase-conflicts":
      return "border-error/20 bg-error/10 text-error";
    default:
      return "border-border text-foreground-muted";
  }
}

function rebaseLabel(status: NonNullable<WorkspaceInventoryItem["rebase"]>["status"]): string {
  return status.replace(/-/g, " ");
}

function buildReviewByPath(
  artifacts: readonly KanbanReviewArtifact[],
): ReadonlyMap<string, KanbanReviewSummary> {
  return new Map<string, KanbanReviewSummary>(
    artifacts.map((artifact: KanbanReviewArtifact) => [
      artifact.targetId,
      {
        decision: artifact.decision,
        queueState: artifact.queueState,
        commentCount: artifact.comments.length,
        openCommentCount: artifact.comments.filter((comment: KanbanReviewComment) => comment.status === "open").length,
        latestActivityAt: artifact.updatedAt,
      },
    ]),
  );
}

function buildArtifactByPath(
  artifacts: readonly KanbanReviewArtifact[],
): ReadonlyMap<string, KanbanReviewArtifact> {
  return new Map(artifacts.map((artifact) => [artifact.targetId, artifact] as const));
}

function integrationTone(status: KanbanRepositoryIntegrationState["status"]): string {
  switch (status) {
    case "connected":
      return "border-success/20 bg-success/10 text-success";
    case "partial-setup":
    case "missing-scopes":
      return "border-warning/20 bg-warning/10 text-warning";
    case "expired-auth":
    case "failing":
      return "border-error/20 bg-error/10 text-error";
    default:
      return "border-border text-foreground-muted";
  }
}

function providerLabel(provider: KanbanLinkedPullRequestSummary["provider"]): string {
  return provider === "azure-repos" ? "Azure Repos" : "GitHub";
}

export function getWorkspaceAttentionReasons(workspace: WorkspaceInventoryItem): string[] {
  const reasons: string[] = [];

  if (workspace.status === "missing") {
    reasons.push("Recovery required");
  }

  if (workspace.rebase) {
    reasons.push(`Rebase ${rebaseLabel(workspace.rebase.status)}`);
  }

  if (workspace.review) {
    if (workspace.review.decision === "changes-requested") {
      reasons.push("Changes requested");
    } else if (workspace.review.decision === "pending" || workspace.review.queueState !== "completed") {
      reasons.push("Review pending");
    }

    if (workspace.review.openCommentCount > 0) {
      reasons.push(
        `${workspace.review.openCommentCount} open comment${workspace.review.openCommentCount === 1 ? "" : "s"}`,
      );
    }
  }

  return reasons;
}

export function workspaceNeedsAttention(workspace: WorkspaceInventoryItem): boolean {
  return getWorkspaceAttentionReasons(workspace).length > 0;
}

function workspaceSidebarBadges(
  workspace: WorkspaceInventoryItem,
  runtimeSession: WorkspaceInventoryItem["sessions"]["items"][number] | null,
  linkedPullRequest: KanbanLinkedPullRequestSummary | undefined,
): WorkspaceSidebarBadge[] {
  const badges: WorkspaceSidebarBadge[] = [];
  const isRunning = workspace.status === "active" || workspace.sessions.active > 0 || workspace.runs.active > 0;

  badges.push({
    label:
      workspace.status === "missing"
        ? "Missing"
        : workspace.status === "archived"
          ? "Archived"
          : isRunning
            ? "Running"
            : "Idle",
    className:
      workspace.status === "missing"
        ? "border-error/20 bg-error/10 text-error"
        : workspace.status === "archived"
          ? "border-warning/20 bg-warning/10 text-warning"
          : isRunning
            ? "border-success/20 bg-success/10 text-success"
            : "border-border text-foreground-muted",
  });

  if (workspaceNeedsAttention(workspace)) {
    badges.push({
      label: "Needs attention",
      className: "border-warning/20 bg-warning/10 text-warning",
    });
  }

  if (workspace.pinnedAt) {
    badges.push({
      label: "Pinned",
      className: "border-primary/20 bg-primary/10 text-primary",
    });
  }

  const devServerStatus = runtimeSession?.runtime?.devServer.status;
  if (devServerStatus) {
    badges.push({
      label: `Dev server ${devServerStatus.replace(/-/g, " ")}`,
      className:
        devServerStatus === "running"
          ? "border-success/20 bg-success/10 text-success"
          : devServerStatus === "error"
            ? "border-error/20 bg-error/10 text-error"
            : "border-border text-foreground-muted",
    });
  }

  if (linkedPullRequest) {
    badges.push({
      label: `PR ${linkedPullRequest.status.replace(/-/g, " ")}`,
      className: cx("border px-2 py-0.5 text-xs", lifecycleTone(linkedPullRequest.status)),
    });
  }

  return badges;
}

function workspaceAttentionRank(workspace: WorkspaceInventoryItem): number {
  if (workspace.status === "missing" || workspace.rebase?.status === "rebase-conflicts") {
    return 0;
  }
  if (workspace.review?.decision === "changes-requested") {
    return 1;
  }
  if (
    workspace.rebase?.status === "rebase-needed" ||
    workspace.review?.decision === "pending" ||
    workspace.review?.queueState === "queued" ||
    workspace.review?.queueState === "in-review" ||
    (workspace.review?.openCommentCount ?? 0) > 0
  ) {
    return 2;
  }
  if (workspace.rebase) {
    return 3;
  }
  return 4;
}

function compareAttentionWorkspaces(left: WorkspaceInventoryItem, right: WorkspaceInventoryItem): number {
  const rankDiff = workspaceAttentionRank(left) - workspaceAttentionRank(right);
  if (rankDiff !== 0) {
    return rankDiff;
  }

  const leftActivity = Date.parse(left.lastActivityAt ?? "");
  const rightActivity = Date.parse(right.lastActivityAt ?? "");
  const activityDiff = (Number.isFinite(rightActivity) ? rightActivity : 0) - (Number.isFinite(leftActivity) ? leftActivity : 0);
  if (activityDiff !== 0) {
    return activityDiff;
  }

  return left.path.localeCompare(right.path);
}

export function WorkspacesPageContent(props: {
  isAuthenticated: boolean;
  sessions: WorkspaceSessionSnapshot[];
  selectedWorkspacePath?: string | null;
  allRuns?: Array<Record<string, unknown>>;
  eventBuffers?: Record<string, { events: Record<string, unknown>[] } | undefined>;
  onSendPrompt?: (input: {
    sessionId: string;
    prompt: string;
    agent?: string;
    model?: string;
    attachments?: Attachment[];
    approvalMode?: "yolo" | "prompt" | "deny";
  }) => Promise<void>;
  mode?: WorkspaceSurfaceMode;
}) {
  const searchParams = useSearchParams();
  const [inventory, setInventory] = useState<WorkspaceInventoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingNotePath, setPendingNotePath] = useState<string | null>(null);
  const [feedbackByWorkspacePath, setFeedbackByWorkspacePath] = useState<Record<string, WorkspaceSidebarFeedback | null>>({});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = usePersistedState<WorkspaceListLayoutMode>("workspace-sidebar.layout-mode", "grouped");
  const [searchTerm, setSearchTerm] = usePersistedState("workspace-sidebar.search", "");
  const [isPending, startTransition] = useTransition();
  const { snapshot } = useBacklog();
  const workspaceReviews = useReviews({ targetType: "workspace" });
  const mode = props.mode ?? "full";
  const selectedWorkspacePath =
    props.selectedWorkspacePath ?? (searchParams.get("workspace")?.trim() || null);

  const sessionFingerprint = useMemo(
    () =>
      JSON.stringify(
        props.sessions.map((session) => ({
          sessionId: session.sessionId,
          status: session.status,
          cwd: session.cwd ?? "",
          updatedAt: session.updatedAt ?? 0,
        })),
      ),
    [props.sessions],
  );

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    void loadInventory(props.sessions)
      .then((payload) => {
        if (!cancelled) {
          setInventory(payload);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [props.sessions, sessionFingerprint]);

  const summary = inventory?.summary ?? {
    total: 0,
    active: 0,
    idle: 0,
    archived: 0,
    missing: 0,
  };
  const liveReviewByPath = useMemo(
    () => buildReviewByPath(workspaceReviews.artifacts),
    [workspaceReviews.artifacts],
  );
  const liveArtifactByPath = useMemo(
    () => buildArtifactByPath(workspaceReviews.artifacts),
    [workspaceReviews.artifacts],
  );
  const workspaces = useMemo(
    () =>
      (inventory?.workspaces ?? []).map((workspace) => ({
        ...workspace,
        review: liveReviewByPath.get(workspace.path) ?? workspace.review,
      })),
    [inventory?.workspaces, liveReviewByPath],
  );
  const normalizedSearchTerm = useMemo(() => normalizeSearchValue(searchTerm), [searchTerm]);
  const filteredWorkspaces = useMemo(
    () => sortWorkspaceSidebarItems(workspaces.filter((workspace) => matchesWorkspaceSearch(workspace, normalizedSearchTerm))),
    [normalizedSearchTerm, workspaces],
  );
  const filteredGroups = useMemo(() => ({
    pinned: filteredWorkspaces.filter((workspace) => Boolean(workspace.pinnedAt)),
    active: filteredWorkspaces.filter((workspace) => workspace.status === "active" && !workspace.pinnedAt),
    idle: filteredWorkspaces.filter((workspace) => workspace.status === "idle" && !workspace.pinnedAt),
    archived: filteredWorkspaces.filter((workspace) => workspace.status === "archived" && !workspace.pinnedAt),
    missing: filteredWorkspaces.filter((workspace) => workspace.status === "missing" && !workspace.pinnedAt),
  }), [filteredWorkspaces]);
  const hiddenWorkspaceCount = workspaces.length - filteredWorkspaces.length;
  const sidebarEmptyMessage = normalizedSearchTerm
    ? `No workspaces match "${searchTerm}". Clear the search or adjust the layout to widen the sidebar.`
    : "No workspaces are currently tracked in the sidebar.";
  const attentionWorkspaces = useMemo(
    () => [...workspaces].filter(workspaceNeedsAttention).sort(compareAttentionWorkspaces),
    [workspaces],
  );
  const attentionSummary = useMemo(
    () => ({
      total: attentionWorkspaces.length,
      recovery: attentionWorkspaces.filter((workspace) => workspace.status === "missing").length,
      rebase: attentionWorkspaces.filter((workspace) => Boolean(workspace.rebase)).length,
      review: attentionWorkspaces.filter(
        (workspace) =>
          Boolean(workspace.review) &&
          (
            workspace.review?.decision !== "approved" ||
            workspace.review?.queueState !== "completed" ||
            (workspace.review?.openCommentCount ?? 0) > 0
          ),
      ).length,
    }),
    [attentionWorkspaces],
  );
  const executionContextsBySessionId = useMemo(() => {
    if (!snapshot) {
      return new Map<string, ReturnType<typeof findKanbanExecutionContextEnvelopesForSession>>();
    }

    return new Map(
      props.sessions.map((session) => [
        session.sessionId,
        findKanbanExecutionContextEnvelopesForSession(snapshot, session.sessionId),
      ]),
    );
  }, [props.sessions, snapshot]);
  const selectedWorkspace = useMemo(
    () =>
      selectedWorkspacePath
        ? (workspaces.find((workspace) => workspace.path === selectedWorkspacePath) ?? null)
        : null,
    [selectedWorkspacePath, workspaces],
  );
  const workspaceSessions = useMemo(() => {
    if (!selectedWorkspace) {
      return [];
    }

    return selectedWorkspace.sessions.items
      .map((workspaceSession) =>
        props.sessions.find((session) => session.sessionId === workspaceSession.sessionId) ?? workspaceSession,
      )
      .sort((left, right) => {
        if (left.status !== right.status) {
          return left.status === "active" ? -1 : 1;
        }
        return Number(right.updatedAt ?? 0) - Number(left.updatedAt ?? 0);
      });
  }, [props.sessions, selectedWorkspace]);

  useEffect(() => {
    if (workspaceSessions.length === 0) {
      setSelectedSessionId(null);
      return;
    }

    setSelectedSessionId((current) => {
      if (current && workspaceSessions.some((session) => session.sessionId === current)) {
        return current;
      }
      return workspaceSessions.find((session) => session.status === "active")?.sessionId ?? workspaceSessions[0]?.sessionId ?? null;
    });
  }, [workspaceSessions]);

  const activeSession = useMemo(
    () => workspaceSessions.find((session) => session.sessionId === selectedSessionId) ?? null,
    [selectedSessionId, workspaceSessions],
  );
  const selectedRuns = useMemo(
    () =>
      (props.allRuns ?? [])
        .filter((run) => String(run.sessionId ?? "") === selectedSessionId)
        .sort((left, right) => Number(right.startedAt ?? 0) - Number(left.startedAt ?? 0)),
    [props.allRuns, selectedSessionId],
  );
  const selectedEventBuffers = props.eventBuffers ?? {};
  const selectedRunIds = useMemo(() => selectedRuns.map((run) => String(run.runId ?? "")), [selectedRuns]);
  const totalCost = useMemo(
    () => accumulateEventCost(selectedRunIds, selectedEventBuffers),
    [selectedEventBuffers, selectedRunIds],
  );

  useEffect(() => {
    if (!selectedWorkspacePath) {
      return;
    }

    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-workspace-path]"));
    const card = cards.find((candidate) => candidate.getAttribute("data-workspace-path") === selectedWorkspacePath);
    if (!card || typeof card.scrollIntoView !== "function") {
      return;
    }

    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedWorkspacePath, inventory?.workspaces.length]);

  function refreshInventory() {
    startTransition(() => {
      setLoading(true);
      setError(null);
      void loadInventory(props.sessions)
        .then((payload) => setInventory(payload))
        .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)))
        .finally(() => setLoading(false));
    });
  }

  function setWorkspaceFeedback(workspacePath: string, feedback: WorkspaceSidebarFeedback | null) {
    setFeedbackByWorkspacePath((current) => ({
      ...current,
      [workspacePath]: feedback,
    }));
  }

  function openEditorForWorkspace(
    workspace: Pick<WorkspaceInventoryItem, "path" | "links">,
    href: string | null,
    successMessage: string,
  ): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    if (!href) {
      setWorkspaceFeedback(workspace.path, {
        tone: "error",
        message: `Editor action failed for ${workspace.path}: no editor link is available.`,
      });
      return false;
    }

    const opened = window.open(href, "_blank", "noopener,noreferrer");
    if (!opened) {
      setWorkspaceFeedback(workspace.path, {
        tone: "error",
        message: `Editor action failed for ${workspace.path}. The link may have been blocked by the browser or the editor handler is unavailable.`,
      });
      return false;
    }

    setWorkspaceFeedback(workspace.path, { tone: "success", message: successMessage });
    return true;
  }

  function handleAction(
    action:
      | "pin"
      | "unpin"
      | "archive"
      | "cleanup"
      | "recover"
      | "notes-save"
      | "rebase-start"
      | "rebase-auto-resolve"
      | "rebase-open-in-editor"
      | "rebase-mark-resolved"
      | "rebase-abort",
    workspace: WorkspaceInventoryItem,
  ) {
    const confirmationMessage =
      action === "cleanup"
        ? `Remove the git worktree at ${workspace.path}? This should only be used for archived, inactive workspaces.`
        : action === "archive"
          ? `Archive ${workspace.path} in the kanban workspace inventory?`
          : action === "recover"
            ? `Recover ${workspace.path} back into the active inventory?`
            : action === "rebase-abort"
              ? `Abort the current rebase workflow for ${workspace.path}?`
              : null;

    if (confirmationMessage && typeof window !== "undefined" && !window.confirm(confirmationMessage)) {
      return;
    }

    const actionKey = `${action}:${workspace.path}`;
    setPendingAction(actionKey);
    setError(null);
    setWorkspaceFeedback(workspace.path, null);

    startTransition(() => {
      void runWorkspaceAction(action, workspace.path, props.sessions)
        .then((payload) => {
          setInventory(payload);
          const nextWorkspace = payload.workspaces.find((item) => item.path === workspace.path);
          const resultMessage = (payload as WorkspaceInventoryResponse & { result?: { message?: string } }).result?.message ?? `Updated ${workspace.path}.`;
          if (action === "rebase-open-in-editor" && typeof window !== "undefined") {
            const editorHref = nextWorkspace?.rebase?.editorHref;
            if (!openEditorForWorkspace(
              {
                path: workspace.path,
                links: { editorHref: editorHref ?? nextWorkspace?.links.editorHref ?? workspace.links.editorHref },
              },
              editorHref ?? nextWorkspace?.links.editorHref ?? workspace.links.editorHref,
              resultMessage,
            )) {
              return;
            }
          }
          setWorkspaceFeedback(workspace.path, { tone: "success", message: resultMessage });
        })
        .catch((cause) => {
          const message = cause instanceof Error ? cause.message : String(cause);
          setError(message);
          setWorkspaceFeedback(workspace.path, { tone: "error", message });
        })
        .finally(() => setPendingAction(null));
    });
  }

  function handleNoteSave(workspace: WorkspaceInventoryItem, note: string) {
    setPendingNotePath(workspace.path);
    setError(null);
    setWorkspaceFeedback(workspace.path, null);

    startTransition(() => {
      void runWorkspaceAction("notes-save", workspace.path, props.sessions, note)
        .then((payload) => {
          setInventory(payload);
          const resultMessage = (payload as WorkspaceInventoryResponse & { result?: { message?: string } }).result?.message ?? `Updated notes for ${workspace.path}.`;
          setWorkspaceFeedback(workspace.path, { tone: "success", message: resultMessage });
        })
        .catch((cause) => {
          const message = cause instanceof Error ? cause.message : String(cause);
          setError(message);
          setWorkspaceFeedback(workspace.path, { tone: "error", message });
        })
        .finally(() => setPendingNotePath(null));
    });
  }

  function handleCreatePullRequest(
    workspace: WorkspaceInventoryItem,
    reviewArtifact: KanbanReviewArtifact | undefined,
    input: {
      provider: KanbanLinkedPullRequestSummary["provider"];
      title: string;
      reviewers?: string;
      branchName?: string;
      baseBranch?: string;
    },
  ) {
    if (!reviewArtifact) {
      const message = `Workspace review artifact not found for ${workspace.path}.`;
      setError(message);
      setWorkspaceFeedback(workspace.path, { tone: "error", message });
      return;
    }

    setError(null);
    setWorkspaceFeedback(workspace.path, null);
    startTransition(() => {
      void workspaceReviews.actOnReview({
        action: "create-pull-request",
        artifactId: reviewArtifact.id,
        ...input,
      })
        .then(() => {
          setWorkspaceFeedback(workspace.path, {
            tone: "success",
            message: `Created linked PR for ${workspace.path}.`,
          });
        })
        .catch((cause) => {
          const message = cause instanceof Error ? cause.message : String(cause);
          setError(message);
          setWorkspaceFeedback(workspace.path, { tone: "error", message });
        });
    });
  }

  function handleLinkPullRequest(
    workspace: WorkspaceInventoryItem,
    reviewArtifact: KanbanReviewArtifact | undefined,
    input: {
      provider: KanbanLinkedPullRequestSummary["provider"];
      number: number;
      title: string;
      branchName?: string;
      baseBranch?: string;
    },
  ) {
    if (!reviewArtifact) {
      const message = `Workspace review artifact not found for ${workspace.path}.`;
      setError(message);
      setWorkspaceFeedback(workspace.path, { tone: "error", message });
      return;
    }

    setError(null);
    setWorkspaceFeedback(workspace.path, null);
    startTransition(() => {
      void workspaceReviews.actOnReview({
        action: "link-pull-request",
        artifactId: reviewArtifact.id,
        ...input,
      })
        .then(() => {
          setWorkspaceFeedback(workspace.path, {
            tone: "success",
            message: `Linked PR #${input.number} to ${workspace.path}.`,
          });
        })
        .catch((cause) => {
          const message = cause instanceof Error ? cause.message : String(cause);
          setError(message);
          setWorkspaceFeedback(workspace.path, { tone: "error", message });
        });
    });
  }

  async function handleSessionSubmit(input: {
    sessionId: string;
    prompt: string;
    agent?: string;
    model?: string;
    attachments?: Attachment[];
    approvalMode?: "yolo" | "prompt" | "deny";
  }) {
    if (!selectedSessionId || !props.onSendPrompt) {
      return;
    }
    await props.onSendPrompt({
      ...input,
      sessionId: selectedSessionId,
      agent: input.agent ?? activeSession?.agent,
    });
  }

  if (selectedWorkspacePath) {
    const selectedReviewArtifact =
      selectedWorkspace != null ? (liveArtifactByPath.get(selectedWorkspace.path) ?? undefined) : undefined;

    if (loading) {
      return (
        <PageShell>
          <PageSection>
            <p className="text-sm text-foreground-muted">Loading workspace shell…</p>
          </PageSection>
        </PageShell>
      );
    }

    if (!selectedWorkspace) {
      return (
        <PageShell>
          <PageSection>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Workspace lifecycle</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Workspace not found</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
              The selected workspace is not present in the current inventory snapshot. Refresh the inventory or return to the workspace list.
            </p>
            <div className="mt-5">
              <Button variant="ghost">
                <Link href="/workspaces">Back to inventory</Link>
              </Button>
            </div>
          </PageSection>
        </PageShell>
      );
    }

    return (
      <WorkspaceDetailShell
        workspace={selectedWorkspace}
        sessions={workspaceSessions}
        activeSession={activeSession}
        runs={selectedRuns}
        eventBuffers={selectedEventBuffers}
        totalCostLabel={formatUsd(totalCost)}
        selectedSessionId={selectedSessionId}
        onSelectSession={setSelectedSessionId}
        pendingAction={pendingAction}
        notesSaving={pendingNotePath === selectedWorkspace.path}
        feedback={feedbackByWorkspacePath[selectedWorkspace.path] ?? null}
        onSubmit={handleSessionSubmit}
        onAction={handleAction}
        onOpenInEditor={(workspace, href) =>
          openEditorForWorkspace(workspace, href, `Opened ${workspace.path} in the configured editor.`)
        }
        onSaveNote={handleNoteSave}
        reviewArtifact={selectedReviewArtifact}
        reviewPending={workspaceReviews.pendingArtifactId === selectedReviewArtifact?.id}
        onCreatePullRequest={(workspace, input) =>
          handleCreatePullRequest(workspace, selectedReviewArtifact, input)
        }
        onLinkPullRequest={(workspace, input) =>
          handleLinkPullRequest(workspace, selectedReviewArtifact, input)
        }
      />
    );
  }

  if (mode === "attention") {
    return (
      <PageShell>
        <PageSection>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Inbox</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Workspaces that need attention</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
                Only actionable workspaces appear here. Recovery states, rebase workflows, and review handoffs stay in
                the inbox so active or idle worktrees do not create noise.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost">
                <Link href="/workspaces">Open full inventory</Link>
              </Button>
              <Button variant="ghost" onClick={refreshInventory} disabled={loading || isPending}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh inbox
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <SummaryCard label="Needs attention" value={String(attentionSummary.total)} />
            <SummaryCard label="Recovery" value={String(attentionSummary.recovery)} />
            <SummaryCard label="Rebase" value={String(attentionSummary.rebase)} />
            <SummaryCard label="Review" value={String(attentionSummary.review)} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-foreground-muted">
            <span className="rounded-full border border-border px-3 py-1.5">
              {getWorkspaceOwnershipLabel(props.isAuthenticated, props.sessions)}
            </span>
            <span className="rounded-full border border-border px-3 py-1.5">
              The inbox excludes healthy active and idle workspaces.
            </span>
          </div>
        </PageSection>

        {error ? (
          <section className="rounded-3xl border border-error/30 bg-error/10 p-4 text-sm text-error">
            {error}
          </section>
        ) : null}

        <WorkspaceColumn
          title="Needs attention"
          icon={AlertTriangle}
          empty="No workspaces currently need attention."
          workspaces={attentionWorkspaces}
          artifactByPath={liveArtifactByPath}
          reviewByPath={liveReviewByPath}
          executionContextsBySessionId={executionContextsBySessionId}
          pendingAction={pendingAction}
          onAction={handleAction}
          onOpenInEditor={(workspace, href) =>
            openEditorForWorkspace(workspace, href, `Opened ${workspace.path} in the configured editor.`)
          }
          onSaveNote={handleNoteSave}
          pendingNotePath={pendingNotePath}
          feedbackByWorkspacePath={feedbackByWorkspacePath}
          selectedWorkspacePath={selectedWorkspacePath}
          reviewPendingArtifactId={workspaceReviews.pendingArtifactId}
          onCreatePullRequest={handleCreatePullRequest}
          onLinkPullRequest={handleLinkPullRequest}
          highlightReasons
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageSection>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Workspace lifecycle</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Provisioning and worktree control</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
              This surface keeps `packages/agent-mux/webui` as the browser shell while inventory and lifecycle actions
              are derived from agent-mux session `cwd` values, Babysitter run discovery, and git worktree state.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">
              <Link href="/workspaces/new">Provision workspace</Link>
            </Button>
            <Button variant="ghost" onClick={refreshInventory} disabled={loading || isPending}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh inventory
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <SummaryCard label="Known workspaces" value={String(summary.total)} />
          <SummaryCard label="Active" value={String(summary.active)} />
          <SummaryCard label="Idle" value={String(summary.idle)} />
          <SummaryCard label="Archived" value={String(summary.archived)} />
          <SummaryCard label="Missing" value={String(summary.missing)} />
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-sm text-foreground-muted">
          <span className="rounded-full border border-border px-3 py-1.5">
            {getWorkspaceOwnershipLabel(props.isAuthenticated, props.sessions, workspaces)}
          </span>
          <span className="rounded-full border border-border px-3 py-1.5">
            {props.sessions.length} live session{props.sessions.length === 1 ? "" : "s"} attached
          </span>
          <span className="rounded-full border border-border px-3 py-1.5">
            Cleanup only unlocks for archived worktrees with no active sessions or pending runs.
          </span>
        </div>
      </PageSection>

      {error ? (
        <section className="rounded-3xl border border-error/30 bg-error/10 p-4 text-sm text-error">
          {error}
        </section>
      ) : null}

      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg" data-testid="workspace-sidebar-surface">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Workspace sidebar</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Search, group, pin, and triage workspaces</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
              The sidebar keeps mixed workspace state visible: pinned rows, runtime and dev-server status, linked PR state,
              archive and recovery actions, and search-driven filtering without hiding what changed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={layoutMode === "grouped" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setLayoutMode("grouped")}
              aria-pressed={layoutMode === "grouped"}
            >
              Grouped
            </Button>
            <Button
              type="button"
              variant={layoutMode === "flat" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setLayoutMode("flat")}
              aria-pressed={layoutMode === "flat"}
            >
              Flat
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search workspaces, branches, issues, or ownership"
              aria-label="Workspace search"
              className="h-11 w-full rounded-2xl border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary/40"
            />
          </label>
          <span className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground-muted">
            {filteredWorkspaces.length} visible
          </span>
          <span className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground-muted">
            {filteredGroups.pinned.length} pinned
          </span>
          <span className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground-muted">
            {attentionWorkspaces.length} need attention
          </span>
          {hiddenWorkspaceCount > 0 ? (
            <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1.5 text-sm text-warning">
              {hiddenWorkspaceCount} hidden by search
            </span>
          ) : null}
        </div>

        {loading && workspaces.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-border bg-background/70 p-4 text-sm text-foreground-muted">
            Loading workspace sidebar…
          </div>
        ) : null}

        {!loading && filteredWorkspaces.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-border bg-background/70 p-4 text-sm text-foreground-muted">
            {sidebarEmptyMessage}
          </div>
        ) : null}

        {!loading && filteredWorkspaces.length > 0 ? (
          <div className="mt-5 space-y-4">
            {layoutMode === "flat" ? (
              <WorkspaceColumn
                title="Workspace list"
                icon={FolderGit2}
                empty={sidebarEmptyMessage}
                workspaces={filteredWorkspaces}
                reviewByPath={liveReviewByPath}
                artifactByPath={liveArtifactByPath}
                executionContextsBySessionId={executionContextsBySessionId}
                pendingAction={pendingAction}
                onAction={handleAction}
                onOpenInEditor={(workspace, href) =>
                  openEditorForWorkspace(workspace, href, `Opened ${workspace.path} in the configured editor.`)
                }
                onSaveNote={handleNoteSave}
                pendingNotePath={pendingNotePath}
                feedbackByWorkspacePath={feedbackByWorkspacePath}
                selectedWorkspacePath={selectedWorkspacePath}
                reviewPendingArtifactId={workspaceReviews.pendingArtifactId}
                onCreatePullRequest={handleCreatePullRequest}
                onLinkPullRequest={handleLinkPullRequest}
                highlightReasons
              />
            ) : (
              <Accordion
                items={[
                  ...(filteredGroups.pinned.length > 0 ? [{
                    title:`Pinned workspaces (${filteredGroups.pinned.length})`,
                    body: (
                      <WorkspaceColumn
                        title="Pinned workspaces"
                        icon={Pin}
                        empty="No pinned workspaces match the current sidebar filters."
                        workspaces={filteredGroups.pinned}
                        reviewByPath={liveReviewByPath}
                        artifactByPath={liveArtifactByPath}
                        executionContextsBySessionId={executionContextsBySessionId}
                        pendingAction={pendingAction}
                        onAction={handleAction}
                        onOpenInEditor={(workspace: WorkspaceInventoryItem, href: string | null) =>
                          openEditorForWorkspace(workspace, href, `Opened ${workspace.path} in the configured editor.`)
                        }
                        onSaveNote={handleNoteSave}
                        pendingNotePath={pendingNotePath}
                        feedbackByWorkspacePath={feedbackByWorkspacePath}
                        selectedWorkspacePath={selectedWorkspacePath}
                        reviewPendingArtifactId={workspaceReviews.pendingArtifactId}
                        onCreatePullRequest={handleCreatePullRequest}
                        onLinkPullRequest={handleLinkPullRequest}
                        highlightReasons
                      />
                    ),
                  }] : []),
                  ...[
                    { key: "active", title: "Active workspaces", icon: FolderGit2, empty: "No active workspaces are currently visible.", workspaces: filteredGroups.active },
                    { key: "idle", title: "Idle workspaces", icon: Wrench, empty: "No idle workspaces are currently visible.", workspaces: filteredGroups.idle },
                    { key: "archived", title: "Archived workspaces", icon: Archive, empty: "No archived workspaces are currently visible.", workspaces: filteredGroups.archived },
                    { key: "missing", title: "Recovery queue", icon: AlertTriangle, empty: "No missing workspaces are currently visible.", workspaces: filteredGroups.missing },
                  ].map((group) => ({
                    title: `${group.title} (${group.workspaces.length})`,
                    body: (
                      <WorkspaceColumn
                        title={group.title}
                        icon={group.icon}
                        empty={group.empty}
                        workspaces={group.workspaces}
                        reviewByPath={liveReviewByPath}
                        artifactByPath={liveArtifactByPath}
                        executionContextsBySessionId={executionContextsBySessionId}
                        pendingAction={pendingAction}
                        onAction={handleAction}
                        onOpenInEditor={(workspace: WorkspaceInventoryItem, href: string | null) =>
                          openEditorForWorkspace(workspace, href, `Opened ${workspace.path} in the configured editor.`)
                        }
                        onSaveNote={handleNoteSave}
                        pendingNotePath={pendingNotePath}
                        feedbackByWorkspacePath={feedbackByWorkspacePath}
                        selectedWorkspacePath={selectedWorkspacePath}
                        reviewPendingArtifactId={workspaceReviews.pendingArtifactId}
                        onCreatePullRequest={handleCreatePullRequest}
                        onLinkPullRequest={handleLinkPullRequest}
                        highlightReasons
                      />
                    ),
                  })),
                ]}
              />
            )}
          </div>
        ) : null}
      </section>

      <ReviewPanel
        title="Workspace diff and approval handoff"
        description="Workspace review is fed by the same shared artifact model as issue review, so lifecycle cards and diff actions stay in sync."
        empty="No workspace reviews are queued yet."
        loading={workspaceReviews.loading}
        error={workspaceReviews.error}
        artifacts={workspaceReviews.artifacts}
        queue={workspaceReviews.queue}
        summary={workspaceReviews.summary}
        pendingArtifactId={workspaceReviews.pendingArtifactId}
        onApprove={(artifactId) =>
          workspaceReviews.actOnReview({ action: "approve", artifactId }).then(() => refreshInventory())
        }
        onRequestChanges={(artifactId) =>
          workspaceReviews.actOnReview({ action: "request-changes", artifactId }).then(() => refreshInventory())
        }
        onSubmitReview={(input) =>
          workspaceReviews.actOnReview({ action: "submit-review", ...input }).then(() => refreshInventory())
        }
        onAddComment={(input) =>
          workspaceReviews.actOnReview({ action: "add-comment", ...input }).then(() => refreshInventory())
        }
      />
    </PageShell>
  );
}

function SummaryCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-border bg-background/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">{props.label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{props.value}</p>
    </article>
  );
}

function WorkspaceColumn(props: {
  title: string;
  icon: typeof FolderGit2;
  empty: string;
  workspaces: WorkspaceInventoryItem[];
  artifactByPath: ReadonlyMap<string, KanbanReviewArtifact>;
  reviewByPath: ReadonlyMap<
    string,
    NonNullable<WorkspaceInventoryItem["review"]>
  >;
  executionContextsBySessionId: ReadonlyMap<
    string,
    ReturnType<typeof findKanbanExecutionContextEnvelopesForSession>
  >;
  pendingAction: string | null;
  onAction: (
    action:
      | "pin"
      | "unpin"
      | "archive"
      | "cleanup"
      | "recover"
      | "notes-save"
      | "rebase-start"
      | "rebase-auto-resolve"
      | "rebase-open-in-editor"
      | "rebase-mark-resolved"
      | "rebase-abort",
    workspace: WorkspaceInventoryItem,
  ) => void;
  onOpenInEditor: (workspace: WorkspaceInventoryItem, href: string | null) => void;
  onSaveNote: (workspace: WorkspaceInventoryItem, note: string) => void;
  pendingNotePath: string | null;
  feedbackByWorkspacePath: Record<string, WorkspaceSidebarFeedback | null>;
  selectedWorkspacePath: string | null;
  reviewPendingArtifactId: string | null;
  onCreatePullRequest: (
    workspace: WorkspaceInventoryItem,
    reviewArtifact: KanbanReviewArtifact | undefined,
    input: {
      provider: KanbanLinkedPullRequestSummary["provider"];
      title: string;
      reviewers?: string;
      branchName?: string;
      baseBranch?: string;
    },
  ) => void;
  onLinkPullRequest: (
    workspace: WorkspaceInventoryItem,
    reviewArtifact: KanbanReviewArtifact | undefined,
    input: {
      provider: KanbanLinkedPullRequestSummary["provider"];
      number: number;
      title: string;
      branchName?: string;
      baseBranch?: string;
    },
  ) => void;
  highlightReasons?: boolean;
}) {
  const Icon = props.icon;

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{props.title}</h2>
          <p className="text-sm text-foreground-muted">{props.workspaces.length} tracked</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {props.workspaces.map((workspace) => {
          const attentionReasons = props.highlightReasons ? getWorkspaceAttentionReasons(workspace) : [];
          const pinKey = `pin:${workspace.path}`;
          const unpinKey = `unpin:${workspace.path}`;
          const archiveKey = `archive:${workspace.path}`;
          const cleanupKey = `cleanup:${workspace.path}`;
          const recoverKey = `recover:${workspace.path}`;
          const runtimeSession =
            workspace.sessions.items.find((session) => session.status === "active" && session.runtime) ??
            workspace.sessions.items.find((session) => session.runtime);
          const review = props.reviewByPath.get(workspace.path) ?? workspace.review;
          const reviewArtifact = props.artifactByPath.get(workspace.path);
          const linkedPullRequest = reviewArtifact?.linkedPullRequest;
          const integration = reviewArtifact?.integration;
          const statusBadges = workspaceSidebarBadges(workspace, runtimeSession ?? null, linkedPullRequest);
          const isSelected = props.selectedWorkspacePath === workspace.path;

          return (
            <article
              key={workspace.path}
              data-workspace-path={workspace.path}
              className={cx(
                "rounded-2xl border bg-background/70 p-4",
                isSelected ? "border-primary/40 ring-1 ring-primary/20" : "border-border",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-base">{workspace.name}</strong>
                    {statusBadges.map((badge) => (
                      <span key={`${workspace.path}:${badge.label}`} className={cx("rounded-full border px-2 py-0.5 text-xs", badge.className)}>
                        {badge.label}
                      </span>
                    ))}
                    {workspace.git.branch ? (
                      <span className="rounded-full border border-info/20 bg-info/10 px-2 py-0.5 text-xs text-info">
                        {workspace.git.branch}
                      </span>
                    ) : null}
                    {workspace.rebase ? (
                      <span className={cx("rounded-full border px-2 py-0.5 text-xs", rebaseTone(workspace.rebase.status))}>
                        {rebaseLabel(workspace.rebase.status)}
                      </span>
                    ) : null}
                    {review ? (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {review.decision} · {review.openCommentCount} open
                      </span>
                    ) : null}
                    {linkedPullRequest ? (
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground-muted">
                        {providerLabel(linkedPullRequest.provider)} PR {linkedPullRequest.status.replace(/-/g, " ")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 font-mono text-xs text-foreground-muted" title={workspace.path}>
                    {truncatePath(workspace.path)}
                  </p>
                  {ownershipSummary(workspace) ? (
                    <p className="mt-2 text-sm text-foreground-muted">
                      Owned by <span className="font-medium text-foreground">{ownershipSummary(workspace)}</span>
                    </p>
                  ) : null}
                  {attentionReasons.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {attentionReasons.map((reason) => (
                        <span
                          key={`${workspace.path}:${reason}`}
                          className="rounded-full border border-warning/20 bg-warning/10 px-2 py-0.5 text-xs text-warning"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => props.onAction(workspace.pinnedAt ? "unpin" : "pin", workspace)}
                    disabled={
                      workspace.pinnedAt
                        ? !workspace.actions.canUnpin || props.pendingAction === unpinKey
                        : !workspace.actions.canPin || props.pendingAction === pinKey
                    }
                  >
                    {workspace.pinnedAt ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                    {workspace.pinnedAt ? "Unpin" : "Pin"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => props.onAction("archive", workspace)}
                    disabled={!workspace.actions.canArchive || props.pendingAction === archiveKey}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => props.onAction("recover", workspace)}
                    disabled={!workspace.actions.canRecover || props.pendingAction === recoverKey}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Recover
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => props.onAction("cleanup", workspace)}
                    disabled={!workspace.actions.canCleanup || props.pendingAction === cleanupKey}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cleanup
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Link href={workspaceDetailHref(workspace.path)}>Open shell</Link>
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat label="Sessions" value={`${workspace.sessions.active}/${workspace.sessions.total}`} />
                <MiniStat label="Runs" value={`${workspace.runs.active}/${workspace.runs.total}`} />
                <MiniStat label="Git" value={workspace.git.isPrimary ? "primary" : workspace.git.isWorktree ? "worktree" : "repo"} />
                <MiniStat label="Changes" value={workspace.git.dirty == null ? "unknown" : workspace.git.dirty ? "dirty" : "clean"} />
              </div>

              {(workspace.issues ?? []).length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(workspace.issues ?? []).map((issue) => (
                    <Link
                      key={`${workspace.path}-${issue.issueId}`}
                      href={issueHref(workspace, issue.issueId)}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-primary"
                    >
                      {issue.issueKey}
                    </Link>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-foreground-muted">
                {workspace.sessions.items.slice(0, 2).map((session) => (
                  <Link key={session.sessionId} href={`/sessions/${session.sessionId}`} className="text-primary">
                    Session {session.sessionId}
                  </Link>
                ))}
                {workspace.sessions.items.length > 2 ? <span>+{workspace.sessions.items.length - 2} more sessions</span> : null}
                {workspace.git.root ? <span>Root: {truncatePath(workspace.git.root)}</span> : null}
              </div>

              <p className="mt-3 text-xs text-foreground-muted">
                Last activity: {formatTimestamp(workspace.lastActivityAt)}
                {workspace.archivedAt ? ` · archived ${formatTimestamp(workspace.archivedAt)}` : ""}
                {workspace.cleanedAt ? ` · cleaned ${formatTimestamp(workspace.cleanedAt)}` : ""}
              </p>

              {integration || linkedPullRequest ? (
                <section className="mt-4 rounded-2xl border border-border bg-card/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                        Linked review state
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-foreground">
                        {linkedPullRequest
                          ? `${providerLabel(linkedPullRequest.provider)} PR ${
                              linkedPullRequest.number ? `#${linkedPullRequest.number}` : ""
                            } ${linkedPullRequest.linkState === "partially-linked" ? "is partially linked" : "is linked"}`
                          : "Integration prerequisites are affecting linked review state"}
                      </h3>
                    </div>
                    {integration ? (
                      <span className={cx("rounded-full border px-2 py-0.5 text-xs", integrationTone(integration.status))}>
                        {integration.status.replace(/-/g, " ")}
                      </span>
                    ) : null}
                  </div>
                  {linkedPullRequest?.title ? (
                    <p className="mt-2 text-sm text-foreground">{linkedPullRequest.title}</p>
                  ) : null}
                  <p className="mt-2 text-sm leading-6 text-foreground-muted">
                    {integration?.guidance ?? linkedPullRequest?.guidance ?? "No additional linked review guidance."}
                  </p>
                </section>
              ) : null}

              <div className={cx("mt-5 grid gap-4", runtimeSession?.runtime ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "")}>
                {runtimeSession?.runtime ? (
                  <WorkspaceRuntimePanel
                    className="border-border/70 bg-card/70"
                    runtime={runtimeSession.runtime}
                    rebase={workspace.rebase}
                    sessionId={runtimeSession.sessionId}
                    sessionStatus={runtimeSession.status}
                    executionContexts={props.executionContextsBySessionId.get(runtimeSession.sessionId) ?? []}
                  />
                ) : null}
                <WorkspaceDetailsSidebar
                  workspace={workspace}
                  runtime={runtimeSession?.runtime}
                  reviewArtifact={reviewArtifact}
                  sessionId={runtimeSession?.sessionId}
                  sessionStatus={runtimeSession?.status}
                  pendingAction={props.pendingAction}
                  notesSaving={props.pendingNotePath === workspace.path}
                  reviewPending={props.reviewPendingArtifactId === reviewArtifact?.id}
                  feedback={props.feedbackByWorkspacePath[workspace.path] ?? null}
                  onAction={props.onAction}
                  onOpenInEditor={props.onOpenInEditor}
                  onSaveNote={props.onSaveNote}
                  onCreatePullRequest={(targetWorkspace, input) =>
                    props.onCreatePullRequest(targetWorkspace, reviewArtifact, input)
                  }
                  onLinkPullRequest={(targetWorkspace, input) =>
                    props.onLinkPullRequest(targetWorkspace, reviewArtifact, input)
                  }
                />
              </div>
            </article>
          );
        })}

        {props.workspaces.length === 0 ? <p className="text-sm text-foreground-muted">{props.empty}</p> : null}
      </div>
    </section>
  );
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">{props.label}</p>
      <p className="mt-1 text-sm font-medium">{props.value}</p>
    </div>
  );
}
