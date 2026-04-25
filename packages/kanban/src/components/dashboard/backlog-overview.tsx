"use client";

import type {
  KanbanBoardCard,
  KanbanCollaboratorRole,
  KanbanPermissionGrant,
  KanbanProject,
  KanbanProjectBoard,
  KanbanPullRequestReviewLink,
  KanbanWorkflowState,
} from "@a5c-ai/agent-mux-core/kanban";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FolderGit2,
  GitBranch,
  Github,
  Layers,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Trash2,
  UserRoundPlus,
  Users,
  Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useBacklog } from "@/hooks/use-backlog";
import { useReviews } from "@/hooks/use-reviews";
import { ReviewPanel } from "@/components/review/review-panel";

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

interface RepositoryLifecyclePanelProps {
  card: KanbanBoardCard;
  mutating: boolean;
  onLinkRepository: (input: {
    issueId: string;
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
  const [owner, setOwner] = useState(repository?.owner ?? "a5c-ai");
  const [name, setName] = useState(repository?.name ?? "babysitter");
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
              owner,
              name,
              branchName,
              defaultBranch,
            });
          }}
        >
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
            <Github className="h-4 w-4" />
            {repository.fullName}
          </div>
          <div className="mt-1 text-xs text-foreground-muted">
            Branch `{lifecycle.branchName}` into `{repository.settings.baseBranch}`
          </div>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
          {repository.provider}
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
      </div>

      {lifecycle.pullRequest ? (
        <div className="mt-4 rounded-2xl border border-border bg-card/80 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            <GitBranch className="h-4 w-4" />
            PR #{lifecycle.pullRequest.number}
            <span className={`rounded-full border px-2.5 py-1 text-xs ${lifecycleTone(lifecycle.pullRequest.status)}`}>
              {lifecycleLabel(lifecycle.pullRequest.status)}
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
            disabled={mutating}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary disabled:opacity-50"
          >
            Create PR
          </button>
        </form>
      )}

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

export function BacklogOverview() {
  const searchParams = useSearchParams();
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
    updateProjectCollaboration,
    updateIssueCollaboration,
    movingIssueId,
    mutatingIssueId,
    refresh,
  } = useBacklog();
  const issueReviews = useReviews({ targetType: "issue" });
  const focusedIssueId = searchParams.get("issueId");
  const focusedIssueKey = searchParams.get("issueKey");

  useEffect(() => {
    const issueAnchor = focusedIssueId
      ? document.getElementById(`kanban-issue-${focusedIssueId}`)
      : focusedIssueKey
        ? document.querySelector<HTMLElement>(`[data-testid="kanban-card-${focusedIssueKey}"]`)
        : null;

    if (!issueAnchor) {
      return;
    }

    issueAnchor.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusedIssueId, focusedIssueKey]);

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

  const primaryProject = snapshot.projects[0];
  const primaryBoard = board.projects.find((candidate) => candidate.projectId === primaryProject?.id);
  const targetModelIssue =
    snapshot.issues.find((issue) => issue.key === "KANBAN-GAP-004") ??
    snapshot.issues.find((issue) => issue.key === "KANBAN-DEBT-003");

  if (!primaryProject || !primaryBoard) {
    return null;
  }

  return (
    <section
      className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-lg"
      data-testid="backlog-overview"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
            Kanban Board
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Real board mechanics now sit on shared workflow primitives
          </h2>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            The dashboard no longer stops at a backlog summary. Columns, swimlanes, WIP limits, and
            move validation are computed from shared `agent-mux` board state, and card transitions
            persist through the backlog service instead of living in a local-only client model.
          </p>
        </div>

        <div className="min-w-[260px] rounded-2xl border border-border bg-background p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
            Primary Project
          </div>
          <div className="mt-2 text-lg font-semibold text-foreground">{primaryProject.name}</div>
          <div className="mt-3 text-sm text-foreground-muted">
            {primaryProject.metrics.totalIssues} issues tracked
          </div>
          {primaryProject.linkedRunSummary ? (
            <div className="mt-2 text-sm text-foreground-muted">
              {primaryProject.linkedRunSummary.activeRuns} live runs linked
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
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
          <div className="text-sm text-primary/80">shared issue review artifacts awaiting action</div>
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

      {targetModelIssue ? (
        <div className="mt-5 rounded-2xl border border-border bg-background p-4">
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
        <div className="mt-5 rounded-3xl border border-border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground-muted">
                Repository context
              </p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                Shared repository settings stay below `packages/kanban`
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
                    <Github className="h-4 w-4" />
                    {repository.fullName}
                  </div>
                  <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground-muted">
                    {repository.provider}
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

      <div className="mt-5 flex flex-wrap gap-2">
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

      <div className="mt-6 space-y-5" data-testid="kanban-board">
        {primaryBoard.swimlanes
          .filter((swimlane) => swimlane.issueIds.length > 0)
          .map((swimlane) => (
            <section
              key={swimlane.id}
              className="rounded-3xl border border-border bg-background/70 p-4"
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
                  {swimlane.issueIds.length} cards
                </span>
              </div>

              <div className="grid gap-4 xl:grid-cols-4">
                {workflowOrder.map((state) => {
                  const column = primaryBoard.columns.find((candidate) => candidate.id === state);
                  const cards = findCardsForCell(primaryBoard, swimlane.id, state);

                  if (!column) {
                    return null;
                  }

                  return (
                    <div
                      key={`${swimlane.id}-${state}`}
                      className={`rounded-2xl border p-4 ${columnTone(state, column.isOverLimit)}`}
                      data-testid={`kanban-column-${swimlane.id}-${state}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {stateLabel(state)}
                          </div>
                          <div className="mt-1 text-xs text-foreground-muted">
                            {cards.length} cards in this lane
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

                      <div className="mt-4 space-y-3">
                        {cards.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-border p-3 text-sm text-foreground-muted">
                            No cards
                          </div>
                        ) : null}

                        {cards.map((card) => (
                          <article
                            key={card.issueId}
                            id={`kanban-issue-${card.issueId}`}
                            className={`rounded-2xl border p-4 ${issueTone(card)} ${
                              focusedIssueId === card.issueId || focusedIssueKey === card.issueKey
                                ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                                : ""
                            }`}
                            data-testid={`kanban-card-${card.issueKey}`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
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

                            <div className="mt-2 text-base font-semibold">{card.title}</div>
                            {card.summary ? (
                              <p className="mt-2 text-sm leading-6 opacity-90">{card.summary}</p>
                            ) : null}

                            {card.review ? (
                              <div className="mt-3 flex flex-wrap gap-2 text-xs opacity-90">
                                <span className="rounded-full border border-current/20 px-2 py-0.5">
                                  Review {card.review.decision}
                                </span>
                                <span className="rounded-full border border-current/20 px-2 py-0.5">
                                  {card.review.openCommentCount} open comments
                                </span>
                              </div>
                            ) : null}

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

                            {card.policySignals.length > 0 ? (
                              <div className="mt-3 space-y-2">
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

                            <div className="mt-4 flex flex-wrap gap-2">
                              {card.moveTargets.map((target) => (
                                <button
                                  key={`${card.issueId}-${target.state}`}
                                  disabled={!target.allowed || movingIssueId === card.issueId}
                                  onClick={() => void moveIssue(card.issueId, target.state)}
                                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border-hover bg-transparent px-3 text-xs font-medium italic tracking-[0.04em] text-foreground transition-all duration-200 hover:bg-card hover:border-primary/30 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50 font-serif"
                                  data-testid={`move-${card.issueKey}-${target.state}`}
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                  {stateLabel(target.state)}
                                </button>
                              ))}
                            </div>

                            {card.moveTargets.some((target) => target.signals.length > 0) ? (
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
                                snapshot.issues.find((issue) => issue.id === card.issueId)?.activity ?? []
                              }
                              mutating={movingIssueId === card.issueId || mutatingIssueId === card.issueId}
                              onSave={updateIssueCollaboration}
                            />
                          </article>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
      </div>

      <div className="mt-6">
        <ReviewPanel
          title="Issue diff and feedback loop"
          description="Issue review artifacts stay in the shared layer, so diff viewing, inline comments, and approval state are the same review record used across the app."
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
          onAddComment={(input) =>
            issueReviews.actOnReview({ action: "add-comment", ...input }).then(() => refresh())
          }
        />
      </div>
    </section>
  );
}
