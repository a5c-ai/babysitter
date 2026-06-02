"use client";

import { Link } from "react-router-dom-v6";
import { useNavigate, useSearchParams } from "react-router-dom-v6";
import type { Attachment } from "@a5c-ai/agent-mux-comm";
import type {
  KanbanLinkedPullRequestSummary,
  KanbanRepositoryIntegrationState,
  KanbanReviewArtifact,
  KanbanReviewComment,
  KanbanReviewSummary,
} from "@a5c-ai/agent-mux-comm/kanban";
import { findKanbanExecutionContextEnvelopesForSession } from "@a5c-ai/agent-mux-comm/kanban";
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

function workspaceNameFromPath(value: string): string {
  const normalized = value.replace(/[\\/]+/g, "/").replace(/\/$/, "");
  const segments = normalized.split("/");
  return segments[segments.length - 1] || value;
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
    : "Gateway disconnected: browsing saved workspaces and local worktrees only";
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

export async function loadInventory(
  sessions: WorkspaceSessionSnapshot[],
  focusWorkspacePath?: string | null,
): Promise<WorkspaceInventoryResponse> {
  const normalizedFocusWorkspacePath = focusWorkspacePath?.trim() || null;
  const response =
    sessions.length === 0
      ? await fetch(
          normalizedFocusWorkspacePath
            ? `/api/workspaces?workspace=${encodeURIComponent(normalizedFocusWorkspacePath)}`
            : "/api/workspaces",
        )
      : await fetch("/api/workspaces", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessions,
            ...(normalizedFocusWorkspacePath ? { focusWorkspacePath: normalizedFocusWorkspacePath } : {}),
          }),
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

const WORKSPACE_PAGE_SIZE = 24;

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
  }) => Promise<{ runId?: string; sessionId?: string } | void>;
  mode?: WorkspaceSurfaceMode;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [inventory, setInventory] = useState<WorkspaceInventoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingNotePath, setPendingNotePath] = useState<string | null>(null);
  const [feedbackByWorkspacePath, setFeedbackByWorkspacePath] = useState<Record<string, WorkspaceSidebarFeedback | null>>({});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = usePersistedState<WorkspaceListLayoutMode>("workspace-sidebar.layout-mode", "grouped");
  const [searchTerm, setSearchTerm] = usePersistedState("workspace-sidebar.search", "");
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { snapshot } = useBacklog();
  const workspaceReviews = useReviews({ targetType: "workspace" });
  const mode = props.mode ?? "full";
  const selectedWorkspacePath =
    props.selectedWorkspacePath ?? (searchParams.get("workspace")?.trim() || null);
  const loading = initialLoading || refreshing;

  const sessionFingerprint = useMemo(
    () =>
      JSON.stringify(
        props.sessions.map((session) => ({
          sessionId: session.sessionId,
          status: session.status,
          cwd: session.cwd ?? "",
          activeRunId: session.activeRunId ?? "",
          latestRunId: session.latestRunId ?? "",
        })),
      ),
    [props.sessions],
  );
  const inventorySessions = useMemo(() => props.sessions, [sessionFingerprint]);

  useEffect(() => {
    let cancelled = false;

    if (inventory) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }
    setError(null);

    void loadInventory(inventorySessions, selectedWorkspacePath)
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
          setInitialLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [inventorySessions, selectedWorkspacePath]);

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
  const totalPages = Math.max(1, Math.ceil(filteredWorkspaces.length / WORKSPACE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedWorkspaces = useMemo(
    () => filteredWorkspaces.slice(safePage * WORKSPACE_PAGE_SIZE, (safePage + 1) * WORKSPACE_PAGE_SIZE),
    [filteredWorkspaces, safePage],
  );
  const pagedGroups = useMemo(() => ({
    pinned: pagedWorkspaces.filter((workspace) => Boolean(workspace.pinnedAt)),
    active: pagedWorkspaces.filter((workspace) => workspace.status === "active" && !workspace.pinnedAt),
    idle: pagedWorkspaces.filter((workspace) => workspace.status === "idle" && !workspace.pinnedAt),
    archived: pagedWorkspaces.filter((workspace) => workspace.status === "archived" && !workspace.pinnedAt),
    missing: pagedWorkspaces.filter((workspace) => workspace.status === "missing" && !workspace.pinnedAt),
  }), [pagedWorkspaces]);
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
  const hasWorkspaceReviewQueue =
    workspaceReviews.artifacts.length > 0 ||
    (workspaceReviews.summary?.pendingCount ?? 0) > 0 ||
    (workspaceReviews.summary?.approvedCount ?? 0) > 0 ||
    (workspaceReviews.summary?.openCommentCount ?? 0) > 0;

  useEffect(() => {
    setPage(0);
  }, [searchTerm, layoutMode]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

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
      if (inventory) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }
      setError(null);
      void loadInventory(inventorySessions, selectedWorkspacePath)
        .then((payload) => setInventory(payload))
        .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)))
        .finally(() => {
          setInitialLoading(false);
          setRefreshing(false);
        });
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
    const result = await props.onSendPrompt({
      ...input,
      sessionId: selectedSessionId,
      agent: input.agent ?? activeSession?.agent,
    });
    if (result?.sessionId && result.sessionId !== selectedSessionId) {
      setSelectedSessionId(result.sessionId);
      refreshInventory();
    }
  }

  if (selectedWorkspacePath) {
    const selectedReviewArtifact =
      selectedWorkspace != null ? (liveArtifactByPath.get(selectedWorkspace.path) ?? undefined) : undefined;

    if (initialLoading && !inventory) {
      return (
        <PageShell>
          <section className="rounded-3xl border border-border bg-card p-5 shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-foreground-muted">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-primary"
                    onClick={() => navigate("/workspaces")}
                  >
                    Back to workspaces
                  </button>
                  <span>/</span>
                  <span className="font-mono text-xs text-foreground-secondary">
                    {truncatePath(selectedWorkspacePath)}
                  </span>
                </div>
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                  Workspace
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                  {workspaceNameFromPath(selectedWorkspacePath)}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
                  Loading the linked issue, session roster, and runtime so you can stay on this route instead of bouncing through a waiting screen.
                </p>
              </div>
              <span className="rounded-full border border-border bg-background/65 px-3 py-1.5 text-xs text-foreground-muted">
                Workspace handoff
              </span>
            </div>
          </section>

          <div
            data-testid="workspace-loading-shell"
            className="grid gap-5 xl:grid-cols-[minmax(18rem,0.95fr)_minmax(0,1.7fr)]"
          >
            <section className="rounded-3xl border border-border bg-card p-5 shadow-lg">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Workspace</div>
              <div className="mt-4 grid gap-3">
                <div className="h-20 rounded-2xl border border-dashed border-border bg-background/65" />
                <div className="h-40 rounded-2xl border border-dashed border-border bg-background/65" />
              </div>
            </section>
            <section className="rounded-3xl border border-border bg-card p-5 shadow-lg">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Chat</div>
              <div className="mt-4 grid gap-3">
                <div className="h-24 rounded-2xl border border-dashed border-border bg-background/65" />
                <div className="h-24 rounded-2xl border border-dashed border-border bg-background/65" />
                <div className="h-36 rounded-2xl border border-dashed border-border bg-background/65" />
              </div>
            </section>
          </div>
        </PageShell>
      );
    }

    if (!selectedWorkspace) {
      return (
        <PageShell>
          <PageSection>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Workspace not found</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
              The selected workspace is not in the current workspace list. Refresh and try again, or go back to all workspaces.
            </p>
            <div className="mt-5">
              <Button variant="ghost" onClick={() => navigate("/workspaces")}>
                Back to workspaces
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
        canSendMessages={Boolean(props.onSendPrompt)}
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
              <Button variant="ghost" onClick={() => navigate("/workspaces")}>
                Open full inventory
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
      {error ? (
        <section className="rounded-3xl border border-error/30 bg-error/10 p-4 text-sm text-error">
          {error}
        </section>
      ) : null}

      <section className="rounded-3xl border border-border bg-card p-6 shadow-lg" data-testid="workspace-sidebar-surface">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Workspaces</p>
            <h1
              className="mt-2 max-w-4xl font-semibold tracking-tight"
              style={{ fontSize: "clamp(2.35rem, 4.2vw, 4.4rem)", lineHeight: 0.94 }}
            >
              Find the right workspace and jump back into the session
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
              Search by issue, branch, or ownership, open the workspace you need, and reveal review or maintenance detail only when it becomes relevant.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => navigate("/workspaces/new")}>
              Provision workspace
            </Button>
            <Button variant="ghost" onClick={refreshInventory} disabled={loading || isPending}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh inventory
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-foreground-muted">
          <span className="rounded-full border border-border px-3 py-1.5">
            {getWorkspaceOwnershipLabel(props.isAuthenticated, props.sessions, workspaces)}
          </span>
          <span className="rounded-full border border-border px-3 py-1.5">
            {summary.total} known
          </span>
          <span className="rounded-full border border-border px-3 py-1.5">
            {summary.active} active
          </span>
          <span className="rounded-full border border-border px-3 py-1.5">
            {attentionWorkspaces.length} need attention
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-sm text-foreground-muted">
            <span className="rounded-full border border-border px-3 py-1.5">
              Open the workspace first
            </span>
            <span className="rounded-full border border-border px-3 py-1.5">
              Reveal maintenance only on demand
            </span>
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

        <div className="mt-4 flex flex-wrap items-center gap-3">
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
            Page {safePage + 1} of {totalPages}
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

        {initialLoading && workspaces.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-border bg-background/70 p-4 text-sm text-foreground-muted">
            Loading workspace sidebar…
          </div>
        ) : null}

        {!initialLoading && filteredWorkspaces.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-border bg-background/70 p-4 text-sm text-foreground-muted">
            {sidebarEmptyMessage}
          </div>
        ) : null}

        {filteredWorkspaces.length > 0 ? (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm">
              <div className="text-foreground-muted">
                Showing workspaces {safePage * WORKSPACE_PAGE_SIZE + 1}-{Math.min((safePage + 1) * WORKSPACE_PAGE_SIZE, filteredWorkspaces.length)} of {filteredWorkspaces.length}
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" disabled={safePage === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>
                  Previous
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={safePage >= totalPages - 1} onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}>
                  Next
                </Button>
              </div>
            </div>
            {layoutMode === "flat" ? (
              <WorkspaceColumn
                title="Workspace list"
                icon={FolderGit2}
                empty={sidebarEmptyMessage}
                workspaces={pagedWorkspaces}
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
                  ...(pagedGroups.pinned.length > 0 ? [{
                    title:`Pinned workspaces (${pagedGroups.pinned.length})`,
                    body: (
                      <WorkspaceColumn
                        title="Pinned workspaces"
                        icon={Pin}
                        empty="No pinned workspaces match the current sidebar filters."
                        workspaces={pagedGroups.pinned}
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
                    { key: "active", title: "Active workspaces", icon: FolderGit2, empty: "No active workspaces are currently visible.", workspaces: pagedGroups.active },
                    { key: "idle", title: "Idle workspaces", icon: Wrench, empty: "No idle workspaces are currently visible.", workspaces: pagedGroups.idle },
                    { key: "archived", title: "Archived workspaces", icon: Archive, empty: "No archived workspaces are currently visible.", workspaces: pagedGroups.archived },
                    { key: "missing", title: "Recovery queue", icon: AlertTriangle, empty: "No missing workspaces are currently visible.", workspaces: pagedGroups.missing },
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

      {hasWorkspaceReviewQueue ? (
        <details
          className="rounded-3xl border border-border bg-card shadow-lg"
          data-testid="workspace-review-queue-details"
        >
          <summary className="flex cursor-pointer flex-wrap items-start justify-between gap-4 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Review queue</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Workspace diff and approval handoff</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
                Keep review, comments, and approval state nearby without letting it crowd the inventory by default.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-foreground-muted">
              <span className="rounded-full border border-border px-3 py-1.5">
                queued {workspaceReviews.summary?.pendingCount ?? 0}
              </span>
              <span className="rounded-full border border-border px-3 py-1.5">
                approved {workspaceReviews.summary?.approvedCount ?? 0}
              </span>
              <span className="rounded-full border border-border px-3 py-1.5">
                open comments {workspaceReviews.summary?.openCommentCount ?? 0}
              </span>
            </div>
          </summary>
          <div className="border-t border-border px-6 py-6">
            <ReviewPanel
              title="Workspace diff and approval handoff"
              description="Workspace review, comments, and approval state stay together here."
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
          </div>
        </details>
      ) : null}
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
  const navigate = useNavigate();
  const [expandedWorkspacePaths, setExpandedWorkspacePaths] = useState<Record<string, boolean>>({});

  function toggleWorkspaceDetails(workspacePath: string) {
    setExpandedWorkspacePaths((current) => ({
      ...current,
      [workspacePath]: !current[workspacePath],
    }));
  }

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
          const primarySession =
            workspace.sessions.items.find((session) => session.status === "active") ??
            runtimeSession ??
            workspace.sessions.items[0] ??
            null;
          const primaryIssue = workspace.issues?.[0] ?? null;
          const review = props.reviewByPath.get(workspace.path) ?? workspace.review;
          const reviewArtifact = props.artifactByPath.get(workspace.path);
          const linkedPullRequest = reviewArtifact?.linkedPullRequest;
          const integration = reviewArtifact?.integration;
          const statusBadges = workspaceSidebarBadges(workspace, runtimeSession ?? null, linkedPullRequest);
          const isSelected = props.selectedWorkspacePath === workspace.path;
          const detailsExpanded = Boolean(isSelected) || Boolean(expandedWorkspacePaths[workspace.path]);

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
                      Workspace owner <span className="font-medium text-foreground">{ownershipSummary(workspace)}</span>
                    </p>
                  ) : null}
                  {primarySession ? (
                    <p className="mt-2 text-sm text-foreground-muted">
                      Resume <span className="font-medium text-foreground">{primarySession.title ?? primarySession.sessionId}</span>
                      {" "}from here instead of hunting through workspace maintenance.
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
                    onClick={() => toggleWorkspaceDetails(workspace.path)}
                  >
                    {detailsExpanded ? "Hide details" : "Show details"}
                  </Button>
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
                  {primaryIssue ? (
                    <Link
                      to={issueHref(workspace, primaryIssue.issueId)}
                      className="inline-flex h-9 items-center rounded-xl border border-border bg-transparent px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-card"
                    >
                      Open issue
                    </Link>
                  ) : null}
                  {primarySession ? (
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/sessions/${primarySession.sessionId}`)}>
                      Open chat
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" onClick={() => navigate(workspaceDetailHref(workspace.path))}>
                    Open shell
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MiniStat label="Sessions" value={`${workspace.sessions.active}/${workspace.sessions.total}`} />
                <MiniStat label="Dispatches" value={`${workspace.runs.active}/${workspace.runs.total}`} />
                <MiniStat label="Git" value={workspace.git.isPrimary ? "primary" : workspace.git.isWorktree ? "worktree" : "repo"} />
                <MiniStat label="Changes" value={workspace.git.dirty == null ? "unknown" : workspace.git.dirty ? "dirty" : "clean"} />
              </div>

              {(workspace.issues ?? []).length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(workspace.issues ?? []).map((issue) => (
                    <Link
                      key={`${workspace.path}-${issue.issueId}`}
                      to={issueHref(workspace, issue.issueId)}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-primary"
                      title={issue.issueTitle}
                    >
                      {issue.issueKey}
                      <span className="ml-1 text-foreground-muted">· {issue.issueTitle}</span>
                    </Link>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-foreground-muted">
                {workspace.sessions.items.slice(0, 2).map((session) => (
                  <Link key={session.sessionId} to={`/sessions/${session.sessionId}`} className="text-primary">
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

              {detailsExpanded ? (
                <>
                  {(workspace.actions.canArchive || workspace.actions.canRecover || workspace.actions.canCleanup) ? (
                    <details className="mt-4 rounded-2xl border border-border bg-card/70">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground">
                        Workspace maintenance
                      </summary>
                      <div className="flex flex-wrap gap-2 border-t border-border px-4 py-4">
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
                      </div>
                    </details>
                  ) : null}

                  {integration || linkedPullRequest ? (
                    <section className="mt-4 rounded-2xl border border-border bg-card/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                            Pull request
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-foreground">
                            {linkedPullRequest
                              ? `${providerLabel(linkedPullRequest.provider)} PR ${
                                  linkedPullRequest.number ? `#${linkedPullRequest.number}` : ""
                                } ${linkedPullRequest.linkState === "partially-linked" ? "is partially linked" : "is linked"}`
                              : "Integration prerequisites are blocking pull request actions"}
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
                        {integration?.guidance ?? linkedPullRequest?.guidance ?? "No additional pull request guidance."}
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
                </>
              ) : null}
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
